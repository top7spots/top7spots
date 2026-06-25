const maxUploadBytes = 8 * 1024 * 1024;
const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/svg+xml", "image/webp"]);

type ImageCompressionKind = "hero" | "card" | "featured" | "gallery" | "standard";
type ImageOutputFormat = "image/jpeg" | "image/png" | "image/webp";

export type CompressImageOptions = {
  maxWidth?: number;
  quality?: number;
  outputFormat?: ImageOutputFormat | "auto";
  targetBytes?: number;
};

type ImageCompressionOptions = CompressImageOptions & {
  kind?: ImageCompressionKind;
};

type CompressionProfile = Required<Pick<CompressImageOptions, "maxWidth" | "quality" | "targetBytes">>;

export type ImageCompressionResult = {
  file: File;
  compressed: boolean;
};

export function validateAdminImageFile(file: File) {
  if (!allowedImageTypes.has(file.type)) {
    return "Choose a JPG, JPEG, PNG, WEBP, or SVG image.";
  }

  if (file.size > maxUploadBytes) {
    return "Choose an image that is 8MB or smaller.";
  }

  return null;
}

export async function compressImageBeforeUpload(
  file: File,
  options: CompressImageOptions = {},
): Promise<ImageCompressionResult> {
  const validationError = validateAdminImageFile(file);

  if (validationError) {
    throw new Error(validationError);
  }

  if (file.type === "image/svg+xml") {
    return { file, compressed: false };
  }

  const profile = {
    maxWidth: options.maxWidth ?? 1200,
    quality: clampQuality(options.quality ?? 0.8),
    targetBytes: options.targetBytes ?? 420 * 1024,
  };
  const bitmap = await loadBitmap(file);

  try {
    const outputType = await outputTypeForFile(file, bitmap, options.outputFormat || "auto");
    const attempts = compressionAttempts(profile);
    let bestFile: File | null = null;

    for (const attempt of attempts) {
      const resized = resizeDimensions(bitmap.width, bitmap.height, attempt.maxWidth);
      const blob = await renderToBlob(bitmap, resized.width, resized.height, outputType, attempt.quality);
      const compressedFile = fileFromBlob(blob, file, outputType);

      if (!bestFile || compressedFile.size < bestFile.size) {
        bestFile = compressedFile;
      }

      if (compressedFile.size <= profile.targetBytes) {
        return { file: compressedFile, compressed: compressedFile.size < file.size || resized.width < bitmap.width };
      }
    }

    if (bestFile && bestFile.size < file.size) {
      return { file: bestFile, compressed: true };
    }

    if (file.size <= profile.targetBytes && bitmap.width <= profile.maxWidth) {
      return { file, compressed: false };
    }

    throw new Error("Image compression did not reduce this file enough. Try a smaller image.");
  } finally {
    closeBitmap(bitmap);
  }
}

export async function compressAdminImage(
  file: File,
  options: ImageCompressionOptions = {},
): Promise<ImageCompressionResult> {
  const profile = compressionProfile(options.kind || "standard");

  return compressImageBeforeUpload(file, {
    maxWidth: options.maxWidth ?? profile.maxWidth,
    quality: options.quality ?? profile.quality,
    outputFormat: options.outputFormat ?? "auto",
    targetBytes: options.targetBytes ?? profile.targetBytes,
  });
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
      reject(new Error("Could not read this image. Try a different JPG, PNG, WEBP, or SVG file."));
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
      maxWidth: 1600,
      quality: 0.76,
      targetBytes: 520 * 1024,
    };
  }

  if (kind === "card") {
    return {
      maxWidth: 900,
      quality: 0.72,
      targetBytes: 260 * 1024,
    };
  }

  if (kind === "featured" || kind === "gallery") {
    return {
      maxWidth: 1200,
      quality: 0.74,
      targetBytes: 360 * 1024,
    };
  }

  return {
    maxWidth: 1200,
    quality: 0.74,
    targetBytes: 360 * 1024,
  };
}

function compressionAttempts(profile: CompressionProfile) {
  return [
    { maxWidth: profile.maxWidth, quality: profile.quality },
    { maxWidth: Math.round(profile.maxWidth * 0.9), quality: Math.max(0.7, profile.quality - 0.04) },
    { maxWidth: Math.round(profile.maxWidth * 0.8), quality: Math.max(0.68, profile.quality - 0.08) },
  ];
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

async function outputTypeForFile(
  file: File,
  source: ImageBitmap | HTMLImageElement,
  outputFormat: CompressImageOptions["outputFormat"],
) {
  if (outputFormat && outputFormat !== "auto") {
    return outputFormat;
  }

  if (await browserSupportsWebp()) {
    return "image/webp";
  }

  return (await imageHasTransparency(source, file.type)) ? "image/png" : "image/jpeg";
}

let webpSupport: boolean | null = null;

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

function clampQuality(quality: number) {
  return Math.min(0.95, Math.max(0.1, quality));
}
