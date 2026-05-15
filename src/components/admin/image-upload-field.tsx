"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ImageIcon, Trash2, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
const maxImageSize = 5 * 1024 * 1024;

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
  const displayImage = removed ? "" : previewUrl || savedImage;

  useEffect(() => {
    setSavedImage(currentImage || "");
    setRemoved(false);
    setError(null);
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

  function handleFile(file?: File) {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    if (!file) {
      setPreviewUrl(null);
      setError(null);
      return;
    }

    const validationError = validateImage(file);
    if (validationError) {
      if (inputRef.current) {
        inputRef.current.value = "";
      }
      setPreviewUrl(null);
      setError(validationError);
      return;
    }

    setRemoved(false);
    setError(null);
    setPreviewUrl(URL.createObjectURL(file));
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
            const transfer = new DataTransfer();
            transfer.items.add(file);
            if (inputRef.current) {
              inputRef.current.files = transfer.files;
            }
            handleFile(file);
          }
        }}
        className="group grid cursor-pointer gap-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 transition hover:border-[#2563EB] hover:bg-blue-50/40"
      >
        <Input
          ref={inputRef}
          id={inputId}
          name={`${fieldName}File`}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={(event) => handleFile(event.target.files?.[0])}
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
          <span className="text-xs text-slate-500">JPG, PNG, WEBP. Max 5MB.</span>
        </div>
      </label>
      {error ? <p className="text-xs font-medium text-red-600">{error}</p> : null}
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
  const helperText = useMemo(() => "Upload multiple JPG, PNG, or WEBP images. Max 5MB each.", []);

  useEffect(() => {
    setSavedImages(currentImages);
    setError(null);
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

  function handleFiles(files: FileList | File[]) {
    previews.forEach((preview) => URL.revokeObjectURL(preview));

    const selected = Array.from(files);
    const validationError = selected.map(validateImage).find(Boolean);

    if (validationError) {
      if (inputRef.current) {
        inputRef.current.value = "";
      }
      setPreviews([]);
      setError(validationError);
      return;
    }

    setError(null);
    setPreviews(selected.map((file) => URL.createObjectURL(file)));
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
            const transfer = new DataTransfer();
            files.forEach((file) => transfer.items.add(file));
            if (inputRef.current) {
              inputRef.current.files = transfer.files;
            }
            handleFiles(files);
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
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={(event) => handleFiles(event.target.files || [])}
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
      {error ? <p className="text-xs font-medium text-red-600">{error}</p> : null}
    </div>
  );
}

function validateImage(file: File) {
  if (!allowedTypes.includes(file.type)) {
    return "Choose a JPG, JPEG, PNG, or WEBP image.";
  }

  if (file.size > maxImageSize) {
    return "Choose an image that is 5MB or smaller.";
  }

  return null;
}
