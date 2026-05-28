import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Mail, Send } from "lucide-react";
import { SitePageLayout } from "@/components/site-page-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { seoMetadata } from "@/lib/seo";
import { getPublicTrustPage } from "@/lib/site-pages";
import { submitContactForm } from "./actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type ContactPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPublicTrustPage("contact");

  if (!page) {
    return {};
  }

  return seoMetadata({
    title: page.metaTitle || page.title,
    description: page.metaDescription || page.content.slice(0, 160),
    path: "/contact",
  });
}

export default async function ContactPage({ searchParams }: ContactPageProps) {
  const [page, params] = await Promise.all([getPublicTrustPage("contact"), searchParams]);

  if (!page) {
    notFound();
  }

  const sent = getParam(params.sent) === "1";
  const error = getParam(params.error);

  return (
    <SitePageLayout page={page}>
      <section className="grid gap-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:grid-cols-[0.8fr_1.2fr] lg:p-8">
        <div>
          <p className="inline-flex size-11 items-center justify-center rounded-full bg-blue-50 text-[#1D4ED8]">
            <Mail className="size-5" aria-hidden="true" />
          </p>
          <h2 className="mt-4 text-2xl font-semibold tracking-tight text-[#111827]">
            Send a message
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            Use the form for corrections, destination suggestions, partnership ideas, or general
            Top7Spots questions.
          </p>
          <div className="mt-6 rounded-xl border border-slate-200 bg-[#F8FAFC] p-4 text-sm text-slate-600">
            <p className="font-semibold text-[#0A2A66]">Email</p>
            <p className="mt-1">info@top7spots.com</p>
          </div>
        </div>

        <form action={submitContactForm} className="grid gap-4">
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            className="hidden"
            aria-hidden="true"
          />
          {sent ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700">
              Thanks. Your message has been sent to the Top7Spots team.
            </div>
          ) : null}
          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
              {error}
            </div>
          ) : null}
          <div className="grid gap-4 md:grid-cols-2">
            <ContactField label="Name" name="name" placeholder="Your name" />
            <ContactField label="Email" name="email" type="email" placeholder="you@example.com" />
          </div>
          <ContactField label="Subject" name="subject" placeholder="How can we help?" />
          <div className="grid gap-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              name="message"
              rows={8}
              maxLength={5000}
              required
              placeholder="Tell us what you would like us to know."
            />
            <p className="text-xs leading-5 text-slate-500">Maximum 5,000 characters.</p>
          </div>
          <Button type="submit" className="w-fit rounded-full bg-[#0A2A66] px-5 text-white hover:bg-[#1D4ED8]">
            <Send className="size-4" aria-hidden="true" />
            Send message
          </Button>
        </form>
      </section>
    </SitePageLayout>
  );
}

function ContactField({
  label,
  name,
  placeholder,
  type = "text",
}: {
  label: string;
  name: string;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type={type} required={name !== "subject"} placeholder={placeholder} />
    </div>
  );
}

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] || "" : value || "";
}
