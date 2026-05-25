"use client";

import { useRef, useState } from "react";
import { Sparkles } from "lucide-react";
import { parseTravelGuideImportContent } from "@/lib/admin-content-parser";

type FillState = {
  tone: "idle" | "success" | "warning";
  message: string;
};

const textFields = [
  "title",
  "slug",
  "category",
  "author",
  "readTime",
  "displayOrder",
  "image",
  "coverImageAlt",
  "excerpt",
  "content",
  "faqs",
  "tableOfContents",
  "seoTitle",
  "seoDescription",
  "seoKeywords",
  "relatedGuideSlugs",
  "relatedPlaceSlugs",
] as const;

export function TravelGuideAiContentImport() {
  const [importText, setImportText] = useState("");
  const [state, setState] = useState<FillState>({
    tone: "idle",
    message: "",
  });
  const detailsRef = useRef<HTMLDetailsElement>(null);

  const fillFields = () => {
    const parsed = parseTravelGuideImportContent(importText);
    const filledFields: string[] = [];
    const form = detailsRef.current?.closest("form");

    if (!form) {
      setState({ tone: "warning", message: "Guide form could not be found." });
      return;
    }

    for (const field of textFields) {
      const value = parsed[field];
      if (typeof value !== "string") {
        continue;
      }

      if (setTextControlValue(form, field, value)) {
        filledFields.push(field);
      }
    }

    if (parsed.status && setSelectValue(form, "status", parsed.status)) {
      filledFields.push("status");
    }

    if (typeof parsed.isFeatured === "boolean" && setCheckboxValue(form, "isFeatured", parsed.isFeatured)) {
      filledFields.push("isFeatured");
    }

    if (parsed.targetType && setRadioValue(form, "targetType", parsed.targetType)) {
      filledFields.push("targetType");
      window.setTimeout(() => {
        fillOwnershipSelects(form, parsed, filledFields);
        setCompletionState(parsed, filledFields);
      }, 0);
      return;
    }

    fillOwnershipSelects(form, parsed, filledFields);
    setCompletionState(parsed, filledFields);
  };

  return (
    <details
      ref={detailsRef}
      className="rounded-2xl border border-slate-200 bg-white shadow-sm"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5">
        <span>
          <span className="flex items-center gap-2 text-lg font-semibold text-[#111827]">
            <Sparkles className="size-5 text-[#FF6B00]" aria-hidden="true" />
            AI Content Import
          </span>
          <span className="mt-1 block text-sm leading-6 text-slate-600">
            Paste structured travel guide content from ChatGPT, then review before saving.
          </span>
        </span>
        <span className="text-sm font-semibold text-[#0A2A66]">Open</span>
      </summary>
      <div className="grid gap-4 border-t border-slate-100 px-6 pb-6 pt-5">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-700">Structured travel guide content</span>
          <textarea
            value={importText}
            onChange={(event) => setImportText(event.target.value)}
            rows={10}
            className="min-h-48 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#2563EB] focus:bg-white focus:ring-4 focus:ring-blue-100"
            placeholder={"Title: Best places in Muscat\nSlug: best-places-in-muscat\nGuide belongs to: City\nCity: Muscat\n\nExcerpt:\n..."}
          />
        </label>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={fillFields}
            className="inline-flex h-10 items-center justify-center rounded-full bg-[#0A2A66] px-5 text-sm font-semibold text-white transition hover:bg-[#1D4ED8]"
          >
            Parse and Fill Fields
          </button>
          <button
            type="button"
            onClick={() => {
              setImportText("");
              setState({ tone: "idle", message: "" });
            }}
            className="inline-flex h-10 items-center justify-center rounded-full border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Clear Import Text
          </button>
        </div>
        {state.message ? (
          <p
            className={
              state.tone === "success"
                ? "rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700"
                : "rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700"
            }
          >
            {state.message}
          </p>
        ) : null}
      </div>
    </details>
  );

  function setCompletionState(
    parsed: ReturnType<typeof parseTravelGuideImportContent>,
    filledFields: string[],
  ) {
    if (filledFields.length === 0) {
      setState({
        tone: "warning",
        message: "No supported travel guide fields were found in the import text.",
      });
      return;
    }

    const requiredMissing = [parsed.title ? "" : "title"].filter(Boolean);

    setState({
      tone: requiredMissing.length > 0 ? "warning" : "success",
      message:
        requiredMissing.length > 0
          ? `Fields filled. Please review before saving. Missing required import field: ${requiredMissing.join(", ")}.`
          : "Fields filled. Please review before saving.",
    });
  }
}

function fillOwnershipSelects(
  form: HTMLFormElement,
  parsed: ReturnType<typeof parseTravelGuideImportContent>,
  filledFields: string[],
) {
  if (parsed.countryId && setSelectValue(form, "countryId", parsed.countryId)) {
    filledFields.push("countryId");
  }

  if (parsed.citySlug && setSelectValue(form, "citySlug", parsed.citySlug)) {
    filledFields.push("citySlug");
  }

  if (parsed.destinationId && setSelectValue(form, "destinationId", parsed.destinationId)) {
    filledFields.push("destinationId");
  }
}

function setTextControlValue(form: HTMLFormElement, name: string, value: string) {
  const input = form.elements.namedItem(name);

  if (!isTextControl(input)) {
    return false;
  }

  input.value = value;
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
  return true;
}

function setSelectValue(form: HTMLFormElement, name: string, value: string) {
  const input = form.elements.namedItem(name);

  if (!(input instanceof HTMLSelectElement)) {
    return false;
  }

  const normalizedValue = normalizeMatchValue(value);
  const option = Array.from(input.options).find((item) => {
    const optionValue = normalizeMatchValue(item.value);
    const optionLabel = normalizeMatchValue(item.textContent || "");
    return (
      optionValue === normalizedValue ||
      optionLabel === normalizedValue ||
      optionLabel.startsWith(`${normalizedValue},`) ||
      optionLabel.includes(normalizedValue)
    );
  });

  if (!option) {
    return false;
  }

  input.value = option.value;
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
  return true;
}

function setCheckboxValue(form: HTMLFormElement, name: string, value: boolean) {
  const input = form.elements.namedItem(name);

  if (!(input instanceof HTMLInputElement) || input.type !== "checkbox") {
    return false;
  }

  input.checked = value;
  input.dispatchEvent(new Event("change", { bubbles: true }));
  return true;
}

function setRadioValue(form: HTMLFormElement, name: string, value: string) {
  const input = form.elements.namedItem(name);
  const normalizedValue = normalizeMatchValue(value);

  if (input instanceof RadioNodeList) {
    const radio = Array.from(input).find(
      (item): item is HTMLInputElement =>
        item instanceof HTMLInputElement &&
        item.type === "radio" &&
        normalizeMatchValue(item.value) === normalizedValue,
    );

    if (!radio) {
      return false;
    }

    if (!radio.checked) {
      radio.click();
    } else {
      radio.dispatchEvent(new Event("change", { bubbles: true }));
    }

    return true;
  }

  if (
    input instanceof HTMLInputElement &&
    input.type === "radio" &&
    normalizeMatchValue(input.value) === normalizedValue
  ) {
    if (!input.checked) {
      input.click();
    }
    return true;
  }

  return false;
}

function isTextControl(input: RadioNodeList | Element | null): input is HTMLInputElement | HTMLTextAreaElement {
  return input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement;
}

function normalizeMatchValue(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}
