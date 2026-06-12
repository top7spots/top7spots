"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ImageIcon, Trash2, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  compressAdminImage,
  createFileList,
  validateAdminImageFile,
} from "@/lib/image-compression";

type ImageUploadFieldProps = {
  currentImage?: string;
  fieldName?: string;
  label?: string;
};

type GalleryUploadFieldProps = {
  currentImages?: string[];
  fieldName?: string;
  label?: string;
};

export function ImageUploadField({
  currentImage,
  fieldName = "image",
  label = "Image",
}: ImageUploadFieldProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [savedImage, setSavedImage] = useState(currentImage || "");
  const [removed, setRemoved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const displayImage = removed ? "" : previewUrl || savedImage;
  const compressionKind = imageCompressionKind(fieldName, label);

  useEffect(() => {
    setSavedImage(currentImage || "");
    setRemoved(false);
    setError(null);
    setNotice(null);
    setIsProcessing(false);
    setPreviewUrl((currentPreview) => {
      if (currentPreview) {
        URL.revokeObjectURL(currentPreview);
      }

      return null;
    });
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }, [currentImage]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  async function handleFile(file?: File) {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    if (!file) {
      setPreviewUrl(null);
      setError(null);
      setNotice(null);
      setIsProcessing(false);
      return;
    }

    const validationError = validateAdminImageFile(file);
    if (validationError) {
      if (inputRef.current) {
        inputRef.current.value = "";
      }
      setPreviewUrl(null);
      setError(validationError);
      setNotice(null);
      setIsProcessing(false);
      return;
    }

    if (inputRef.current) {
      inputRef.current.value = "";
    }

    setRemoved(false);
    setError(null);
    setNotice(null);
    setIsProcessing(true);

    try {
      const result = await compressAdminImage(file, { kind: compressionKind });
      if (inputRef.current) {
        inputRef.current.files = createFileList([result.file]);
      }
      setPreviewUrl(URL.createObjectURL(result.file));
      setNotice(result.compressed ? "Image compressed before upload. Please review before saving." : null);
    } catch (compressionError) {
      if (inputRef.current) {
        inputRef.current.value = "";
      }
      setPreviewUrl(null);
      setError(errorMessage(compressionError));
      setNotice(null);
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <div className="grid gap-3">
      <input type="hidden" name={fieldName} value={removed ? "" : savedImage} />
      <input type="hidden" name={`${fieldName}Remove`} value={removed ? "1" : "0"} />
      <Label htmlFor={inputId}>{label}</Label>
      <label
        htmlFor={inputId}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          const file = event.dataTransfer.files?.[0];
          if (file) {
            void handleFile(file);
          }
        }}
        className="group grid cursor-pointer gap-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 transition hover:border-[#2563EB] hover:bg-blue-50/40"
      >
        <Input
          ref={inputRef}
          id={inputId}
          name={`${fieldName}File`}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/svg+xml"
          className="sr-only"
          onChange={(event) => {
            void handleFile(event.target.files?.[0]);
          }}
        />
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          {displayImage ? (
            /* eslint-disable-next-line @next/next/no-img-element -- Blob previews cannot use next/image. */
            <img src={displayImage} alt={`${label} preview`} className="h-52 w-full object-cover" />
          ) : (
            <div className="flex h-52 flex-col items-center justify-center gap-3 text-slate-400">
              <ImageIcon className="size-9" aria-hidden="true" />
              <span className="text-sm font-medium">No image selected</span>
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="flex items-center gap-2 text-sm font-semibold text-[#0A2A66]">
            <UploadCloud className="size-4" aria-hidden="true" />
            Upload or drop image
          </span>
          <span className="text-xs text-slate-500">JPG, PNG, WEBP. Max 8MB.</span>
        </div>
      </label>
      {isProcessing ? (
        <p className="text-xs font-medium text-slate-500">Preparing image for upload...</p>
      ) : null}
      {notice ? <p className="text-xs font-medium text-emerald-700">{notice}</p> : null}
      {error ? <p className="text-xs font-medium text-red-600">{error}</p> : null}
      <p className="text-xs text-slate-500">
        Re-upload older JPG images to apply the latest WebP compression and long-lived cache settings.
      </p>
      {displayImage ? (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            onClick={() => inputRef.current?.click()}
          >
            Replace image
          </Button>
          <Button
            type="button"
            variant="destructive"
            className="rounded-full"
            onClick={() => {
              if (inputRef.current) {
                inputRef.current.value = "";
              }
              if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
              }
              setPreviewUrl(null);
              setSavedImage("");
              setRemoved(true);
              setError(null);
              setNotice(null);
              setIsProcessing(false);
            }}
          >
            <Trash2 className="size-4" aria-hidden="true" />
            Remove image
          </Button>
        </div>
      ) : null}
    </div>
  );
}

export function GalleryUploadField({
  currentImages = [],
  fieldName = "galleryImages",
  label = "Gallery images",
}: GalleryUploadFieldProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [savedImages, setSavedImages] = useState(currentImages);
  const [previews, setPreviews] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const helperText = useMemo(() => "Upload multiple JPG, PNG, or WEBP images. Max 8MB each.", []);

  useEffect(() => {
    setSavedImages(currentImages);
    setError(null);
    setNotice(null);
    setIsProcessing(false);
    setPreviews((currentPreviews) => {
      currentPreviews.forEach((preview) => URL.revokeObjectURL(preview));
      return [];
    });
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }, [currentImages]);

  useEffect(() => {
    return () => {
      previews.forEach((preview) => URL.revokeObjectURL(preview));
    };
  }, [previews]);

  async function handleFiles(files: FileList | File[]) {
    previews.forEach((preview) => URL.revokeObjectURL(preview));

    const selected = Array.from(files);
    const validationError = selected.map(validateAdminImageFile).find(Boolean);

    if (validationError) {
      if (inputRef.current) {
        inputRef.current.value = "";
      }
      setPreviews([]);
      setError(validationError);
      setNotice(null);
      setIsProcessing(false);
      return;
    }

    if (inputRef.current) {
      inputRef.current.value = "";
    }

    setError(null);
    setNotice(null);
    setPreviews([]);
    setIsProcessing(true);

    try {
      const results = await Promise.all(selected.map((file) => compressAdminImage(file, { kind: "standard" })));
      const processedFiles = results.map((result) => result.file);
      const previewUrls = processedFiles.map((file) => URL.createObjectURL(file));

      if (inputRef.current) {
        inputRef.current.files = createFileList(processedFiles);
      }

      setPreviews(previewUrls);
      setNotice(
        results.some((result) => result.compressed)
          ? "One or more gallery images were compressed before upload. Please review before saving."
          : null,
      );
    } catch (compressionError) {
      if (inputRef.current) {
        inputRef.current.value = "";
      }
      setPreviews([]);
      setError(errorMessage(compressionError));
      setNotice(null);
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <div className="grid gap-3">
      <input type="hidden" name={fieldName} value={savedImages.join("\n")} />
      <Label htmlFor={inputId}>{label}</Label>
      <label
        htmlFor={inputId}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          const files = Array.from(event.dataTransfer.files || []);
          if (files.length > 0) {
            void handleFiles(files);
          }
        }}
        className="grid cursor-pointer gap-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 transition hover:border-[#2563EB] hover:bg-blue-50/40"
      >
        <Input
          ref={inputRef}
          id={inputId}
          name={`${fieldName}Files`}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/svg+xml"
          className="sr-only"
          onChange={(event) => {
            void handleFiles(event.target.files || []);
          }}
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[...savedImages, ...previews].length > 0 ? (
            [...savedImages, ...previews].map((image, index) => (
              <div key={`${image}-${index}`} className="relative overflow-hidden rounded-xl border border-slate-200 bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element -- Blob previews cannot use next/image. */}
                <img src={image} alt={`${label} preview ${index + 1}`} className="h-36 w-full object-cover" />
                {index < savedImages.length ? (
                  <button
                    type="button"
                    className="absolute right-2 top-2 rounded-full bg-white/95 px-2 py-1 text-xs font-semibold text-red-600 shadow-sm"
                    onClick={(event) => {
                      event.preventDefault();
                      setSavedImages((images) => images.filter((item) => item !== image));
                    }}
                  >
                    Remove
                  </button>
                ) : null}
              </div>
            ))
          ) : (
            <div className="flex h-36 items-center justify-center rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-400 sm:col-span-2 lg:col-span-3">
              Drop gallery images here
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="flex items-center gap-2 text-sm font-semibold text-[#0A2A66]">
            <UploadCloud className="size-4" aria-hidden="true" />
            Upload gallery images
          </span>
          <span className="text-xs text-slate-500">{helperText}</span>
        </div>
      </label>
      {isProcessing ? (
        <p className="text-xs font-medium text-slate-500">Preparing images for upload...</p>
      ) : null}
      {notice ? <p className="text-xs font-medium text-emerald-700">{notice}</p> : null}
      {error ? <p className="text-xs font-medium text-red-600">{error}</p> : null}
      <p className="text-xs text-slate-500">
        Re-upload older gallery JPGs to apply the latest WebP compression and long-lived cache settings.
      </p>
    </div>
  );
}

function errorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Image compression failed. Try a smaller JPG, PNG, or WEBP image.";
}

function imageCompressionKind(fieldName: string, label: string) {
  const text = `${fieldName} ${label}`.toLowerCase();
  return text.includes("hero") || text.includes("banner") || text.includes("cover")
    ? "hero"
    : "standard";
}
