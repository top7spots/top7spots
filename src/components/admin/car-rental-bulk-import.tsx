"use client";

import { useMemo, useState } from "react";
import { importCarRentalPageAction } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { carRentalPublicPath, normalizeCarRentalImport } from "@/lib/car-rental-pages";

export function CarRentalBulkImport() {
  const [json, setJson] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [hasValidated, setHasValidated] = useState(false);

  const preview = useMemo(() => {
    if (!json.trim()) {
      return null;
    }

    try {
      return normalizeCarRentalImport(JSON.parse(json));
    } catch {
      return { ok: false as const, errors: ["Invalid JSON. Check commas, quotes, and braces."] };
    }
  }, [json]);

  const canSave = hasValidated && preview?.ok;

  return (
    <div className="grid gap-4 rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
      <div>
        <h3 className="text-lg font-semibold text-[#0A2A66]">AI bulk import</h3>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          Paste one complete page JSON object, validate it, then save it as a draft or published page.
        </p>
      </div>
      <Textarea
        value={json}
        onChange={(event) => {
          setJson(event.target.value);
          setHasValidated(false);
        }}
        rows={12}
        placeholder='{"language":"en","slug":"rent-a-car-in-oman","translationGroup":"rent-a-car-in-oman","countryName":"Oman","countrySlug":"oman","pageType":"country","status":"draft","pageTitle":"Rent a Car in Oman","hero":{"title":"Rent a Car in Oman"}}'
        className="font-mono text-xs"
      />
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          onClick={() => setHasValidated(true)}
          className="rounded-full bg-[#0A2A66] text-white hover:bg-[#1D4ED8]"
        >
          Validate / Preview
        </Button>
        <label className="text-sm font-medium text-slate-700">
          Save status{" "}
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value === "published" ? "published" : "draft")}
            className="ml-2 h-9 rounded-md border border-slate-200 bg-white px-3 text-sm shadow-sm"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </label>
      </div>
      {hasValidated && preview ? (
        preview.ok ? (
          <div className="rounded-xl border border-emerald-200 bg-white p-4 text-sm text-slate-700">
            <p className="font-semibold text-emerald-700">Valid import</p>
            <dl className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              <Summary label="Language" value={preview.page.language} />
              <Summary label="Slug" value={preview.page.slug} />
              <Summary label="Translation group" value={preview.page.translationGroup} />
              <Summary label="Public URL" value={carRentalPublicPath(preview.page)} />
              <Summary label="Country" value={preview.page.countryName || preview.page.countrySlug || "Not set"} />
              <Summary label="City" value={preview.page.cityName || preview.page.citySlug || "Not set"} />
              <Summary label="Page type" value={preview.page.pageType || "Not set"} />
              <Summary label="Page title" value={preview.page.pageTitle} />
              <Summary label="Status" value={status} />
              <Summary label="Hero chips" value={preview.page.heroChips.length} />
              <Summary label="Benefits" value={preview.page.benefits.length} />
              <Summary label="Popular cards" value={preview.page.popularLocationCards.length} />
              <Summary label="Guide cards" value={preview.page.guideCards.length} />
              <Summary label="Destination cards" value={preview.page.destinationCards.length} />
              <Summary label="Directory groups" value={preview.page.directoryGroups.length} />
              <Summary label="FAQs" value={preview.page.faqs.length} />
              <Summary
                label="Widget code"
                value={preview.widgetCodeDefaulted ? "Defaulted" : "Included"}
              />
            </dl>
          </div>
        ) : (
          <div className="rounded-xl border border-red-200 bg-white p-4 text-sm text-red-700">
            <p className="font-semibold">Import errors</p>
            <ul className="mt-2 list-disc pl-5">
              {preview.errors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </div>
        )
      ) : null}
      <form action={importCarRentalPageAction} className="flex flex-wrap gap-3">
        <input type="hidden" name="carRentalJson" value={json} />
        <input type="hidden" name="importStatus" value={status} />
        <Button
          type="submit"
          disabled={!canSave}
          className="rounded-full bg-[#FF6B00] text-white hover:bg-[#d95b00] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Save Imported Page
        </Button>
      </form>
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</dt>
      <dd className="mt-1 font-semibold text-[#111827]">{value}</dd>
    </div>
  );
}
