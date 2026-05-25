import { CompactGuideCard } from "@/components/guide-card";
import type { Guide } from "@/lib/types";

type DestinationGuideSectionProps = {
  title: string;
  guides: Guide[];
};

export function DestinationGuideSection({ title, guides }: DestinationGuideSectionProps) {
  if (guides.length === 0) {
    return null;
  }

  return (
    <section className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
      <div className="mb-4 flex items-end justify-between gap-4">
        <h2 className="text-2xl font-semibold tracking-tight text-[#111827]">{title}</h2>
      </div>
      <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-3">
        {guides.map((guide) => (
          <div key={guide.id} className="snap-start sm:min-w-0">
            <CompactGuideCard guide={guide} />
          </div>
        ))}
      </div>
    </section>
  );
}
