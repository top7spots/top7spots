import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Mail, ShieldCheck, UserRound } from "lucide-react";
import { signOutAction } from "@/app/auth/actions";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getCurrentUser,
  getUserProfile,
  syncUserProfile,
  userAvatarUrl,
  userDisplayName,
  userInitials,
} from "@/lib/public-auth";

export const metadata: Metadata = {
  title: "Account | Top7Spots",
  description: "Manage your Top7Spots account.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AccountPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/signin?next=/account");
  }

  await syncUserProfile(user);
  const profile = await getUserProfile(user.id);
  const displayName = userDisplayName(user, profile);
  const avatarUrl = userAvatarUrl(user, profile);
  const provider = profile?.provider || user.app_metadata?.provider || "email";

  return (
    <div className="min-h-screen bg-[#FBFAF7]">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#FF6B00]">Your account</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-[#111827]">Profile basics</h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
            This is the public Top7Spots account foundation. Travel planning features can be added later.
          </p>
        </div>

        <Card className="rounded-[1.5rem] border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl text-[#0A2A66]">
              <ShieldCheck className="size-5 text-[#FF6B00]" aria-hidden="true" />
              Account details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
              <div className="flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-full bg-orange-50 text-2xl font-semibold text-[#C24A00] ring-1 ring-orange-100">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt={displayName} className="size-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  userInitials(displayName)
                )}
              </div>

              <div className="min-w-0 flex-1">
                <h2 className="text-2xl font-semibold tracking-tight text-[#111827]">{displayName}</h2>
                <div className="mt-4 grid gap-3 text-sm text-slate-600">
                  <p className="flex items-center gap-2">
                    <Mail className="size-4 text-[#FF6B00]" aria-hidden="true" />
                    {user.email || "No email available"}
                  </p>
                  <p className="flex items-center gap-2">
                    <UserRound className="size-4 text-[#FF6B00]" aria-hidden="true" />
                    Signed in with {String(provider)}
                  </p>
                </div>

                <form action={signOutAction} className="mt-6">
                  <Button type="submit" variant="outline" className="rounded-full border-slate-200 bg-white text-[#0A2A66] hover:bg-orange-50">
                    Sign out
                  </Button>
                </form>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
