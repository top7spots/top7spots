"use client";

import { useRef, useState } from "react";
import { Sparkles } from "lucide-react";
import { parseDestinationImportContent } from "@/lib/admin-content-parser";

type FillState = {
  tone: "idle" | "success" | "warning";
  message: string;
};

const textFields = [
  "name",
  "slug",
  "category",
  "displayOrder",
  "location",
  "region",
  "image",
  "galleryImages",
  "summary",
  "description",
  "highlights",
  "duration",
  "bestSeason",
  "howToGo",
  "practicalInfo",
  "travelTips",
  "nearbyAttractions",
  "faqs",
  "seoTitle",
  "seoDescription",
] as const;

export function DestinationAiContentImport() {
  const [importText, setImportText] = useState("");
  const [state, setState] = useState<FillState>({
    tone: "idle",
    message: "",
  });
  const detailsRef = useRef<HTMLDetailsElement>(null);

  const fillFields = () => {
    const parsed = parseDestinationImportContent(importText);
    const filledFields: string[] = [];
    const form = detailsRef.current?.closest("form");

    if (!form) {
      setState({ tone: "warning", message: "Destination form could not be found." });
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

    if (parsed.citySlug && setSelectValue(form, "citySlug", parsed.citySlug)) {
      filledFields.push("citySlug");
    }

    if (parsed.status && setSelectValue(form, "status", parsed.status)) {
      filledFields.push("status");
    }

    if (typeof parsed.isFeatured === "boolean" && setCheckboxValue(form, "isFeatured", parsed.isFeatured)) {
      filledFields.push("isFeatured");
    }

    if (filledFields.length === 0) {
      setState({
        tone: "warning",
        message: "No supported destination fields were found in the import text.",
      });
      return;
    }

    const requiredMissing = [
      parsed.name ? "" : "name",
      parsed.citySlug ? "" : "city",
    ].filter(Boolean);

    setState({
      tone: requiredMissing.length > 0 ? "warning" : "success",
      message:
        requiredMissing.length > 0
          ? `Fields filled. Please review before saving. Missing required import field: ${requiredMissing.join(", ")}.`
          : "Fields filled. Please review before saving.",
    });
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
            Paste structured destination content from ChatGPT, then review before saving.
          </span>
        </span>
        <span className="text-sm font-semibold text-[#0A2A66]">Open</span>
      </summary>
      <div className="grid gap-4 border-t border-slate-100 px-6 pb-6 pt-5">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-700">Structured destination content</span>
          <textarea
            value={importText}
            onChange={(event) => setImportText(event.target.value)}
            rows={10}
            className="min-h-48 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#2563EB] focus:bg-white focus:ring-4 focus:ring-blue-100"
            placeholder={"Name: Mutrah Corniche\nSlug: mutrah-corniche\nCity: Muscat\n\nSummary:\n..."}
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

function isTextControl(input: RadioNodeList | Element | null): input is HTMLInputElement | HTMLTextAreaElement {
  return input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement;
}

function normalizeMatchValue(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}
