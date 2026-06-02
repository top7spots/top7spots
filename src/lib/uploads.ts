import "server-only";

import { randomUUID } from "crypto";
import path from "path";
import { slugify } from "@/lib/format";
import { getSupabaseAdminClient, supabaseStorageBucket } from "@/lib/supabase";

const maxImageSize = 5 * 1024 * 1024;

const allowedImageTypes = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

export type UploadFolder = "cities" | "destinations" | "guides" | "attractions" | "restaurants";

type ImageUploadOptions = {
  fieldName: string;
  folder: UploadFolder;
  currentImage?: string;
  fallbackName?: string;
};

type GalleryUploadOptions = {
  fieldName: string;
  folder: UploadFolder;
  currentImages?: string[];
  fallbackName?: string;
};

function hasUploadedFile(file: FormDataEntryValue | null): file is File {
  return typeof File !== "undefined" && file instanceof File && file.size > 0;
}

function safeBaseName(filename: string) {
  const parsed = path.parse(filename);
  return slugify(parsed.name).slice(0, 56) || "image";
}

function lines(value: FormDataEntryValue | null) {
  return String(value ?? "")
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

async function saveUploadedImage(file: File, folder: UploadFolder, fallbackName?: string) {
  const extension = allowedImageTypes.get(file.type);

  if (!extension) {
    throw new Error("Image upload must be a JPG, JPEG, PNG, or WEBP file.");
  }

  if (file.size > maxImageSize) {
    throw new Error("Image upload must be 5MB or smaller.");
  }

  const supabase = getSupabaseAdminClient();
  const baseName = safeBaseName(fallbackName || file.name);
  const filename = `${baseName}-${randomUUID()}.${extension}`;
  const storagePath = `${folder}/${filename}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  const { error } = await supabase.storage.from(supabaseStorageBucket).upload(storagePath, bytes, {
    cacheControl: "31536000",
    contentType: file.type,
    upsert: false,
  });

  if (error) {
    throw new Error(`Image upload failed: ${error.message}`);
  }

  const { data } = supabase.storage.from(supabaseStorageBucket).getPublicUrl(storagePath);
  return data.publicUrl;
}

export async function getImagePathFromForm(formData: FormData, options: ImageUploadOptions) {
  const currentImage = options.currentImage ?? String(formData.get(options.fieldName) ?? "").trim();

  if (String(formData.get(`${options.fieldName}Remove`) ?? "") === "1") {
    return "";
  }

  const file = formData.get(`${options.fieldName}File`);

  if (!hasUploadedFile(file)) {
    return currentImage;
  }

  return saveUploadedImage(file, options.folder, options.fallbackName);
}

export async function getImagePathsFromForm(formData: FormData, options: GalleryUploadOptions) {
  const existingImages =
    options.currentImages && options.currentImages.length > 0
      ? options.currentImages
      : lines(formData.get(options.fieldName));
  const files = formData.getAll(`${options.fieldName}Files`).filter(hasUploadedFile);
  const uploadedImages = await Promise.all(
    files.map((file, index) =>
      saveUploadedImage(file, options.folder, `${options.fallbackName || options.fieldName}-${index + 1}`),
    ),
  );

  return [...existingImages, ...uploadedImages];
}
