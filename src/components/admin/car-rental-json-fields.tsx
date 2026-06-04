"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { CarRentalDirectoryGroup, CarRentalLinkCard, ContentStatus } from "@/lib/types";

type CardSuggestion = CarRentalLinkCard & {
  status?: ContentStatus;
};

type DirectorySuggestion = {
  text: string;
  url: string;
  sortOrder: number;
  status?: ContentStatus;
};

type JsonFieldProps = {
  label: string;
  name: string;
  defaultValue: string;
  rows?: number;
  helperText?: string;
  example?: string;
};

export function CarRentalJsonTextarea({
  label,
  name,
  defaultValue,
  rows = 8,
  helperText,
  example,
}: JsonFieldProps) {
  const [value, setValue] = useState(defaultValue);

  return (
    <JsonTextareaShell
      label={label}
      name={name}
      value={value}
      rows={rows}
      helperText={helperText}
      example={example}
      onChange={setValue}
    />
  );
}

export function PopularLocationCardsField({
  defaultValue,
  suggestions,
  example,
}: {
  defaultValue: string;
  suggestions: CardSuggestion[];
  example: string;
}) {
  const [value, setValue] = useState(defaultValue);
  const [includeDrafts, setIncludeDrafts] = useState(true);
  const [message, setMessage] = useState("");

  function autoFill() {
    const cards = suggestions
      .filter((item) => includeDrafts || item.status === "published")
      .map((item) => ({
        title: item.title,
        url: item.url,
        description: item.description,
        image: item.image,
        label: item.label,
        sortOrder: item.sortOrder,
        visible: item.visible,
      }));

    if (cards.length === 0) {
      setMessage("No matching car rental pages were found for this page context.");
      return;
    }

    setValue(pretty(cards));
    setMessage(`${cards.length} popular location ${cards.length === 1 ? "card" : "cards"} added. Review and edit before saving.`);
  }

  return (
    <JsonTextareaShell
      label="Popular location cards"
      name="popularLocationCards"
      value={value}
      rows={8}
      helperText="Use the auto-fill button to add existing car rental pages from the same country, or edit JSON manually."
      example={example}
      onChange={setValue}
      toolbar={
        <AutoFillToolbar
          buttonLabel="Auto-fill from car rental pages"
          includeDrafts={includeDrafts}
          onIncludeDraftsChange={setIncludeDrafts}
          onAutoFill={autoFill}
          message={message}
        />
      }
    />
  );
}

export function GuideCardsField({
  defaultValue,
  suggestions,
  example,
}: {
  defaultValue: string;
  suggestions: CarRentalLinkCard[];
  example: string;
}) {
  const [value, setValue] = useState(defaultValue);
  const [message, setMessage] = useState("");

  function autoFill() {
    if (suggestions.length === 0) {
      setMessage("No related travel guides were found yet. You can keep using the manual JSON field.");
      return;
    }

    setValue(pretty(suggestions));
    setMessage(`${suggestions.length} related ${suggestions.length === 1 ? "guide" : "guides"} added. Review and edit before saving.`);
  }

  return (
    <JsonTextareaShell
      label="Guide cards"
      name="guideCards"
      value={value}
      rows={8}
      helperText="Auto-fill from existing Travel Guides related to this page country/city, or edit JSON manually."
      example={example}
      onChange={setValue}
      toolbar={
        <AutoFillToolbar
          buttonLabel="Auto-fill related guides"
          onAutoFill={autoFill}
          message={message}
        />
      }
    />
  );
}

export function DirectoryGroupsField({
  defaultValue,
  airportSuggestions,
  locationSuggestions,
  example,
}: {
  defaultValue: string;
  airportSuggestions: DirectorySuggestion[];
  locationSuggestions: DirectorySuggestion[];
  example: string;
}) {
  const [value, setValue] = useState(defaultValue);
  const [includeDrafts, setIncludeDrafts] = useState(true);
  const [message, setMessage] = useState("");

  function autoFill() {
    const airports = airportSuggestions.filter((item) => includeDrafts || item.status === "published");
    const locations = locationSuggestions.filter((item) => includeDrafts || item.status === "published");
    const groups: CarRentalDirectoryGroup[] = [
      {
        title: "Airports",
        sortOrder: 0,
        links: airports.map((item, index) => ({ text: item.text, url: item.url, sortOrder: index })),
      },
      {
        title: "Popular Locations",
        sortOrder: 1,
        links: locations.map((item, index) => ({ text: item.text, url: item.url, sortOrder: index })),
      },
    ].filter((group) => group.links.length > 0);

    if (groups.length === 0) {
      setMessage("No matching car rental pages were found for directory links.");
      return;
    }

    setValue(pretty(groups));
    setMessage("Directory groups added. Review group names, order, and links before saving.");
  }

  return (
    <JsonTextareaShell
      label="Directory groups"
      name="directoryGroups"
      value={value}
      rows={10}
      helperText="Auto-fill Airports and Popular Locations from existing car rental pages in the same country, or edit JSON manually."
      example={example}
      onChange={setValue}
      toolbar={
        <AutoFillToolbar
          buttonLabel="Auto-fill directory"
          includeDrafts={includeDrafts}
          onIncludeDraftsChange={setIncludeDrafts}
          onAutoFill={autoFill}
          message={message}
        />
      }
    />
  );
}

function JsonTextareaShell({
  label,
  name,
  value,
  rows,
  helperText,
  example,
  toolbar,
  onChange,
}: Omit<JsonFieldProps, "defaultValue"> & {
  value: string;
  toolbar?: ReactNode;
  onChange: (value: string) => void;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={name}>{label}</Label>
      {toolbar}
      <Textarea
        id={name}
        name={name}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        className="font-mono text-xs"
      />
      {helperText ? <p className="text-xs leading-5 text-slate-500">{helperText}</p> : null}
      {example ? (
        <details className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
          <summary className="cursor-pointer font-semibold text-slate-700">Example JSON</summary>
          <pre className="mt-3 overflow-x-auto whitespace-pre-wrap">{example}</pre>
        </details>
      ) : null}
    </div>
  );
}

function AutoFillToolbar({
  buttonLabel,
  includeDrafts,
  onIncludeDraftsChange,
  onAutoFill,
  message,
}: {
  buttonLabel: string;
  includeDrafts?: boolean;
  onIncludeDraftsChange?: (value: boolean) => void;
  onAutoFill: () => void;
  message: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-blue-100 bg-blue-50/70 p-3">
      <Button type="button" onClick={onAutoFill} className="rounded-full bg-[#0A2A66] text-white hover:bg-[#1D4ED8]">
        {buttonLabel}
      </Button>
      {onIncludeDraftsChange ? (
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <input
            type="checkbox"
            checked={includeDrafts}
            onChange={(event) => onIncludeDraftsChange(event.target.checked)}
            className="size-4 rounded border-slate-300 text-[#1D4ED8]"
          />
          Include draft pages
        </label>
      ) : null}
      {message ? <p className="text-sm font-medium text-slate-600">{message}</p> : null}
    </div>
  );
}

function pretty(value: unknown) {
  return JSON.stringify(value, null, 2);
}
