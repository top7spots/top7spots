import { Calendar, CheckCircle2, Info, MapPinned } from "lucide-react";

type DestinationTravelInfoSectionsProps = {
  bestSeason: string;
  howToGo: string;
  practicalInfo: string[];
  travelTips: string[];
};

export function DestinationTravelInfoSections({
  bestSeason,
  howToGo,
  practicalInfo,
  travelTips,
}: DestinationTravelInfoSectionsProps) {
  const hasHowToGo = Boolean(howToGo.trim());
  const hasPracticalInfo = practicalInfo.length > 0;
  const hasTravelTips = travelTips.length > 0;

  return (
    <div className="grid gap-5">
      {hasHowToGo ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <div className="flex items-center gap-2 text-[#1D4ED8]">
            <MapPinned className="size-5" aria-hidden="true" />
            <h2 className="text-base font-semibold text-[#111827]">How to Go</h2>
          </div>
          <div className="mt-3 space-y-3 text-sm leading-7 text-slate-600">
            {splitParagraphs(howToGo).map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </section>
      ) : null}

      {hasPracticalInfo ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <div className="flex items-center gap-2 text-[#1D4ED8]">
            <Info className="size-5" aria-hidden="true" />
            <h2 className="text-base font-semibold text-[#111827]">Practical Info</h2>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {practicalInfo.map((item) => (
              <div key={item} className="flex gap-3 rounded-xl bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden="true" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
        <div className="grid gap-5 md:grid-cols-[0.85fr_1.15fr]">
          <div>
            <div className="flex items-center gap-2 text-[#1D4ED8]">
              <Calendar className="size-5" aria-hidden="true" />
              <h2 className="text-base font-semibold text-[#111827]">Best time to visit</h2>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {bestSeason || "Check local seasons, event dates, and road conditions before you go."}
            </p>
          </div>
          {hasTravelTips ? (
            <div className="border-t border-slate-100 pt-5 md:border-l md:border-t-0 md:pl-6 md:pt-0">
              <h2 className="text-base font-semibold text-[#111827]">Travel tips</h2>
              <ul className="mt-3 grid gap-2.5 text-sm leading-6 text-slate-600">
                {travelTips.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-[#FF6B00]" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function splitParagraphs(text: string) {
  return text
    .split(/\r?\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}
