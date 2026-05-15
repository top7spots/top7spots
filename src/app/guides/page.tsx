import { BookOpen, Compass, Search } from "lucide-react";
import { GuideCard } from "@/components/guide-card";
import { SectionHeading } from "@/components/section-heading";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Input } from "@/components/ui/input";
import { getGuides } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function GuidesPage() {
  const guides = await getGuides();

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <SiteHeader />
      <main>
        <section className="relative overflow-hidden bg-[#0A2A66] px-4 py-16 text-white sm:px-6 lg:px-8">
          <div className="absolute inset-x-0 bottom-0 h-px bg-white/10" />
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_360px] lg:items-end">
            <div>
              <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-blue-100">
                <Compass className="size-4" aria-hidden="true" />
                Travel guides
              </p>
              <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight md:text-6xl">
                Smart planning notes for places worth remembering.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-blue-50 md:text-lg">
                Practical destination inspiration, road trip ideas, seasonal tips, and curated
                travel guidance from Top7Spots.
              </p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 p-3 shadow-2xl backdrop-blur">
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-blue-100" />
                <Input
                  placeholder="Search guides soon"
                  className="h-12 rounded-full border-white/20 bg-white text-slate-900 pl-11 shadow-sm"
                />
              </div>
              <div className="mt-3 flex items-center gap-2 px-2 text-sm text-blue-50">
                <BookOpen className="size-4" aria-hidden="true" />
                {guides.length} guide{guides.length === 1 ? "" : "s"} in the library
              </div>
            </div>
          </div>
        </section>
        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <SectionHeading eyebrow="Guide library" title="Essential travel guides">
            Read compact, useful planning guides, then jump back into destinations when your route
            starts taking shape.
          </SectionHeading>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
            {guides.map((guide) => (
              <GuideCard key={guide.id} guide={guide} />
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
