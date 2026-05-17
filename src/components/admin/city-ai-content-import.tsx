"use client";

import { useRef, useState } from "react";
import { Sparkles } from "lucide-react";
import { parseCityImportContent } from "@/lib/admin-content-parser";

type FillState = {
  tone: "idle" | "success" | "warning";
  message: string;
};

const textFields = [
  "name",
  "country",
  "countryCode",
  "region",
  "displayOrder",
  "shortDescription",
  "longDescription",
  "seoTitle",
  "seoDescription",
] as const;

export function CityAiContentImport() {
  const [importText, setImportText] = useState("");
  const [state, setState] = useState<FillState>({
    tone: "idle",
    message: "",
  });
  const detailsRef = useRef<HTMLDetailsElement>(null);

  const fillFields = () => {
    const parsed = parseCityImportContent(importText);
    const filledFields: string[] = [];
    const form = detailsRef.current?.closest("form");

    if (!form) {
      setState({ tone: "warning", message: "City form could not be found." });
      return;
    }

    for (const field of textFields) {
      const value = parsed[field];
      if (typeof value !== "string") {
        continue;
      }

      const input = form.elements.namedItem(field);
      if (isTextControl(input)) {
        input.value = value;
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("change", { bubbles: true }));
        filledFields.push(field);
      }
    }

    if (parsed.status) {
      const status = form.elements.namedItem("status");
      if (status instanceof HTMLSelectElement) {
        status.value = parsed.status;
        status.dispatchEvent(new Event("change", { bubbles: true }));
        filledFields.push("status");
      }
    }

    if (typeof parsed.isFeatured === "boolean") {
      const featured = form.elements.namedItem("isFeatured");
      if (featured instanceof HTMLInputElement && featured.type === "checkbox") {
        featured.checked = parsed.isFeatured;
        featured.dispatchEvent(new Event("change", { bubbles: true }));
        filledFields.push("isFeatured");
      }
    }

    if (filledFields.length === 0) {
      setState({
        tone: "warning",
        message: "No supported city fields were found in the import text.",
      });
      return;
    }

    const requiredMissing = [
      parsed.name ? "" : "name",
      parsed.country ? "" : "country",
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
            Paste structured city content from ChatGPT, then review before saving.
          </span>
        </span>
        <span className="text-sm font-semibold text-[#0A2A66]">Open</span>
      </summary>
      <div className="grid gap-4 border-t border-slate-100 px-6 pb-6 pt-5">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-700">Structured city content</span>
          <textarea
            value={importText}
            onChange={(event) => setImportText(event.target.value)}
            rows={10}
            className="min-h-48 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#2563EB] focus:bg-white focus:ring-4 focus:ring-blue-100"
            placeholder={"Name: Muscat\nCountry: Oman\nCountry Code: OM\n\nShort Description:\n..."}
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

function isTextControl(input: RadioNodeList | Element | null): input is HTMLInputElement | HTMLTextAreaElement {
  return input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement;
}
