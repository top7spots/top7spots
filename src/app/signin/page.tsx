import type { Metadata } from "next";
import Link from "next/link";
import { LogIn } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { googleSignInAction, signInAction } from "@/app/auth/actions";
import { getCurrentUser, safeNextPath } from "@/lib/public-auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Sign in | Top7Spots",
  description: "Sign in to your Top7Spots account.",
  robots: {
    index: false,
    follow: false,
  },
};

type SignInPageProps = {
  searchParams: Promise<{ error?: string; message?: string; next?: string }>;
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const [{ error, message, next }, user] = await Promise.all([searchParams, getCurrentUser()]);
  const nextPath = safeNextPath(next);

  if (user) {
    redirect(nextPath);
  }

  return (
    <div className="min-h-screen bg-[#FBFAF7]">
      <SiteHeader />
      <main className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(360px,440px)] lg:px-8">
        <section className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#FF6B00]">Top7Spots account</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-[#111827] md:text-5xl">
            Sign in to keep your travel planning close.
          </h1>
          <p className="mt-5 text-base leading-7 text-slate-600">
            Access your Top7Spots account foundation now. Saved guides, trips, and personal planning tools can build on this later.
          </p>
        </section>

        <Card className="rounded-[1.5rem] border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl text-[#0A2A66]">
              <LogIn className="size-5 text-[#FF6B00]" aria-hidden="true" />
              Sign in
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5">
            <AuthMessage type="error" message={error} />
            <AuthMessage type="success" message={message} />

            <form action={googleSignInAction}>
              <input type="hidden" name="next" value={nextPath} />
              <Button type="submit" variant="outline" className="h-10 w-full rounded-full border-slate-200 bg-white text-[#0A2A66] hover:bg-orange-50">
                Continue with Google
              </Button>
            </form>

            <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
              <span className="h-px flex-1 bg-slate-200" />
              or
              <span className="h-px flex-1 bg-slate-200" />
            </div>

            <form action={signInAction} className="grid gap-4">
              <input type="hidden" name="next" value={nextPath} />
              <div className="grid gap-2">
                <Label htmlFor="signin-email">Email</Label>
                <Input id="signin-email" name="email" type="email" autoComplete="email" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="signin-password">Password</Label>
                <Input id="signin-password" name="password" type="password" autoComplete="current-password" required />
              </div>
              <Button type="submit" className="h-10 rounded-full bg-[#0A2A66] text-white hover:bg-[#123A7A]">
                Sign in
              </Button>
            </form>

            <p className="text-center text-sm text-slate-600">
              New to Top7Spots?{" "}
              <Link href={`/signup?next=${encodeURIComponent(nextPath)}`} className="font-semibold text-[#C24A00] hover:text-[#0A2A66]">
                Create an account
              </Link>
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function AuthMessage({ type, message }: { type: "error" | "success"; message?: string }) {
  if (!message) {
    return null;
  }

  return (
    <div className={type === "error" ? "rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700" : "rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700"}>
      {message}
    </div>
  );
}
