const serverUploadLimitBytes = 5 * 1024 * 1024;
const maxUploadBytes = 8 * 1024 * 1024;
const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

type ImageCompressionKind = "hero" | "standard";

type ImageCompressionOptions = {
  kind?: ImageCompressionKind;
};

type CompressionProfile = {
  targetBytes: number;
  attempts: Array<{ width: number; quality: number }>;
};

export type ImageCompressionResult = {
  file: File;
  compressed: boolean;
};

export function validateAdminImageFile(file: File) {
  if (!allowedImageTypes.has(file.type)) {
    return "Choose a JPG, JPEG, PNG, or WEBP image.";
  }

  if (file.size > maxUploadBytes) {
    return "Choose an image that is 8MB or smaller.";
  }

  return null;
}

export async function compressAdminImage(
  file: File,
  options: ImageCompressionOptions = {},
): Promise<ImageCompressionResult> {
  const validationError = validateAdminImageFile(file);

  if (validationError) {
    throw new Error(validationError);
  }

  const profile = compressionProfile(options.kind || "standard");

  if (file.size <= profile.targetBytes && file.type === "image/webp") {
    return { file, compressed: false };
  }

  const bitmap = await loadBitmap(file);

  try {
    const hasTransparency = await imageHasTransparency(bitmap, file.type);
    if (hasTransparency && file.type === "image/png" && file.size <= profile.targetBytes) {
      return { file, compressed: false };
    }

    const outputType = hasTransparency ? "image/png" : await preferredPhotoType();

    let bestFile: File | null = null;

    for (const attempt of profile.attempts) {
      const resized = resizeDimensions(bitmap.width, bitmap.height, attempt.width);
      const blob = await renderToBlob(bitmap, resized.width, resized.height, outputType, attempt.quality);
      const compressedFile = fileFromBlob(blob, file, outputType);

      if (!bestFile || compressedFile.size < bestFile.size) {
        bestFile = compressedFile;
      }

      if (compressedFile.size <= profile.targetBytes) {
        return { file: compressedFile, compressed: true };
      }
    }

    if (bestFile && bestFile.size < file.size && bestFile.size <= serverUploadLimitBytes) {
      return { file: bestFile, compressed: true };
    }

    throw new Error("Image compression did not reduce this file enough. Try a smaller image.");
  } finally {
    closeBitmap(bitmap);
  }
}

export function createFileList(files: File[]) {
  const transfer = new DataTransfer();
  files.forEach((file) => transfer.items.add(file));
  return transfer.files;
}

async function loadBitmap(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if ("createImageBitmap" in window) {
    try {
      return await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
      return loadImageElement(file);
    }
  }

  return loadImageElement(file);
}

function loadImageElement(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read this image. Try a different JPG, PNG, or WEBP file."));
    };
    image.src = url;
  });
}

function resizeDimensions(width: number, height: number, maxWidth: number) {
  if (width <= maxWidth) {
    return { width, height };
  }

  const ratio = maxWidth / width;
  return {
    width: Math.round(width * ratio),
    height: Math.round(height * ratio),
  };
}

function compressionProfile(kind: ImageCompressionKind): CompressionProfile {
  if (kind === "hero") {
    return {
      targetBytes: 180 * 1024,
      attempts: [
        { width: 1600, quality: 0.78 },
        { width: 1600, quality: 0.72 },
        { width: 1400, quality: 0.72 },
        { width: 1200, quality: 0.7 },
      ],
    };
  }

  return {
    targetBytes: 110 * 1024,
    attempts: [
      { width: 1200, quality: 0.76 },
      { width: 1200, quality: 0.7 },
      { width: 1000, quality: 0.7 },
      { width: 900, quality: 0.66 },
    ],
  };
}

function renderToBlob(
  source: ImageBitmap | HTMLImageElement,
  width: number,
  height: number,
  type: string,
  quality: number,
) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Image compression is not available in this browser.");
  }

  context.drawImage(source, 0, 0, width, height);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
          return;
        }

        reject(new Error("Image compression failed. Try a different image."));
      },
      type,
      quality,
    );
  });
}

let webpSupport: boolean | null = null;

async function preferredPhotoType() {
  return (await browserSupportsWebp()) ? "image/webp" : "image/jpeg";
}

async function browserSupportsWebp() {
  if (webpSupport !== null) {
    return webpSupport;
  }

  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;

  webpSupport = await new Promise<boolean>((resolve) => {
    canvas.toBlob((blob) => resolve(Boolean(blob && blob.type === "image/webp")), "image/webp", 0.8);
  });

  return webpSupport;
}

function fileFromBlob(blob: Blob, originalFile: File, type: string) {
  const extension = type === "image/webp" ? "webp" : type === "image/png" ? "png" : "jpg";
  const name = originalFile.name.replace(/\.[^.]+$/, "") || "image";
  return new File([blob], `${name}.${extension}`, {
    type,
    lastModified: Date.now(),
  });
}

async function imageHasTransparency(source: ImageBitmap | HTMLImageElement, fileType: string) {
  if (fileType !== "image/png" && fileType !== "image/webp") {
    return false;
  }

  const sample = resizeDimensions(source.width, source.height, 512);
  const canvas = document.createElement("canvas");
  canvas.width = sample.width;
  canvas.height = sample.height;

  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) {
    return fileType === "image/png";
  }

  context.drawImage(source, 0, 0, sample.width, sample.height);

  try {
    const data = context.getImageData(0, 0, sample.width, sample.height).data;

    for (let index = 3; index < data.length; index += 4) {
      if (data[index] < 255) {
        return true;
      }
    }
  } catch {
    return fileType === "image/png";
  }

  return false;
}

function closeBitmap(bitmap: ImageBitmap | HTMLImageElement) {
  if ("close" in bitmap && typeof bitmap.close === "function") {
    bitmap.close();
  }
}
