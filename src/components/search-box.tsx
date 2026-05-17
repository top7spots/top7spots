"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";

type SearchResult = {
  id: string;
  title: string;
  type: "City" | "Destination" | "Guide" | "Attraction";
  href: string;
  context: string;
  description: string;
};

type SearchBoxProps = {
  placeholder?: string;
  containerClassName?: string;
  inputClassName?: string;
  dropdownClassName?: string;
  iconClassName?: string;
};

export function SearchBox({
  placeholder = "Search cities, destinations, guides...",
  containerClassName = "relative w-full",
  inputClassName = "h-11 w-full rounded-full border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#2563EB] focus:bg-white focus:ring-4 focus:ring-blue-100",
  dropdownClassName = "absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/15",
  iconClassName = "text-slate-400",
}: SearchBoxProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const trimmedQuery = query.trim();

    if (trimmedQuery.length < 2) {
      abortRef.current?.abort();
      setResults([]);
      setIsLoading(false);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    setIsOpen(true);
    const timeout = window.setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(trimmedQuery)}`, {
          signal: controller.signal,
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Search request failed");
        }

        const payload = (await response.json()) as { results?: SearchResult[] };
        setResults(payload.results || []);
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setResults([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }, 220);

    return () => window.clearTimeout(timeout);
  }, [query]);

  function closeResults() {
    setIsOpen(false);
  }

  return (
    <div className={containerClassName} onKeyDown={(event) => event.key === "Escape" && closeResults()}>
      <Search
        className={`pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 ${iconClassName}`}
        aria-hidden="true"
      />
      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onFocus={() => query.trim().length >= 2 && setIsOpen(true)}
        className={inputClassName}
        placeholder={placeholder}
        aria-label="Search Top7Spots"
        autoComplete="off"
      />
      {isOpen ? (
        <div className={dropdownClassName}>
          {isLoading ? (
            <p className="px-4 py-4 text-sm font-medium text-slate-500">Searching...</p>
          ) : results.length > 0 ? (
            <ul className="max-h-96 overflow-y-auto py-2">
              {results.map((result) => (
                <li key={result.id}>
                  <Link
                    href={result.href}
                    onClick={closeResults}
                    className="block px-4 py-3 transition hover:bg-blue-50 focus:bg-blue-50 focus:outline-none"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[#111827]">{result.title}</p>
                        {result.context ? (
                          <p className="mt-1 truncate text-xs font-medium text-slate-500">{result.context}</p>
                        ) : null}
                      </div>
                      <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-[#0A2A66]">
                        {result.type}
                      </span>
                    </div>
                    {result.description ? (
                      <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-600">{result.description}</p>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-4 py-4 text-sm font-medium text-slate-500">No results found</p>
          )}
        </div>
      ) : null}
    </div>
  );
}
