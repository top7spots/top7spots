import Link from "next/link";
import { Lock } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { SiteHeader } from "@/components/site-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type LoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error } = await searchParams;

  return (
    <div className="min-h-screen bg-slate-50">
      <SiteHeader />
      <main className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl items-center px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div className="hidden lg:block">
          <div className="max-w-lg">
            <BrandLogo imageClassName="h-16 w-auto" />
            <h1 className="mt-8 text-5xl font-semibold leading-tight text-[#111827]">
              Manage Top7Spots travel content
            </h1>
            <p className="mt-5 text-lg leading-8 text-slate-600">
              Update curated destinations, guides, attractions, and travel inspiration directly
              from local JSON data.
            </p>
          </div>
        </div>
        <Card className="mx-auto w-full max-w-md rounded-lg border-slate-200 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Lock className="size-5" aria-hidden="true" />
              Admin login
            </CardTitle>
          </CardHeader>
          <CardContent>
            {error ? (
              <div className="mb-5 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                Invalid admin credentials.
              </div>
            ) : null}
            <form action="/api/admin/login" method="post" autoComplete="off" className="grid gap-5">
              <input type="text" style={{ display: "none" }} tabIndex={-1} aria-hidden="true" />
              <input type="password" style={{ display: "none" }} tabIndex={-1} aria-hidden="true" />
              <div className="grid gap-2">
                <Label htmlFor="admin-user-entry">Email</Label>
                <Input
                  id="admin-user-entry"
                  name="admin_user"
                  type="text"
                  inputMode="email"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="none"
                  spellCheck={false}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="admin-pass-entry">Password</Label>
                <Input
                  id="admin-pass-entry"
                  name="admin_pass"
                  type="password"
                  autoComplete="new-password"
                />
              </div>
              <button
                type="submit"
                className="inline-flex h-8 shrink-0 items-center justify-center rounded-lg border border-transparent bg-[#0A2A66] bg-clip-padding px-2.5 text-sm font-medium whitespace-nowrap text-white transition-all outline-none hover:bg-[#1D4ED8] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                Sign in
              </button>
            </form>
            <Link
              href="/"
              className="mt-4 inline-flex h-8 w-full shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding px-2.5 text-sm font-medium whitespace-nowrap transition-all outline-none hover:bg-muted hover:text-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              Back to site
            </Link>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
