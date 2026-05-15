import Link from "next/link";
import { Camera, Globe2, Mail, MapPin, MessageCircle, Send } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const categories = ["Beaches", "Mountains", "Luxury", "Hidden Gems", "Road Trips"];

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-[#0A2A66] text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.4fr_0.8fr_0.9fr_1.1fr] lg:px-8">
        <div>
          <BrandLogo variant="dark" imageClassName="h-14 w-auto sm:h-16" />
          <p className="mt-5 max-w-md text-sm leading-6 text-blue-100">
            Top7Spots is a premium travel discovery platform for curated destinations,
            hidden gems, road trips, luxury stays, beaches, mountains, and unforgettable places
            around the world.
          </p>
          <div className="mt-6 flex gap-3 text-blue-100">
            {[Camera, MessageCircle, Globe2].map((Icon, index) => (
              <span key={index} className="flex size-9 items-center justify-center rounded-full bg-white/10">
                <Icon className="size-4" aria-hidden="true" />
              </span>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold">Quick links</h2>
          <div className="mt-4 grid gap-3 text-sm text-blue-100">
            <Link href="/" className="hover:text-white">Discover</Link>
            <Link href="/destinations" className="hover:text-white">Destinations</Link>
            <Link href="/guides" className="hover:text-white">Travel guides</Link>
            <Link href="/admin/login" className="hover:text-white">Admin</Link>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold">Travel categories</h2>
          <div className="mt-4 grid gap-3 text-sm text-blue-100">
            {categories.map((category) => (
              <span key={category}>{category}</span>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold">Newsletter</h2>
          <p className="mt-4 text-sm leading-6 text-blue-100">
            Get destination ideas and global travel inspiration from top7spots.com.
          </p>
          <div className="mt-4 flex gap-2">
            <Input
              className="h-10 border-white/15 bg-white/10 text-white placeholder:text-blue-100"
              placeholder="Email address"
            />
            <Button className="h-10 bg-[#FF6B00] text-white hover:bg-orange-600">
              <Send className="size-4" aria-hidden="true" />
            </Button>
          </div>
          <div className="mt-5 grid gap-2 text-sm text-blue-100">
            <span className="flex items-center gap-2">
              <MapPin className="size-4" aria-hidden="true" />
              Global travel discovery
            </span>
            <span className="flex items-center gap-2">
              <Mail className="size-4" aria-hidden="true" />
              hello@top7spots.com
            </span>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 px-4 py-5 text-center text-xs text-blue-100">
        Copyright 2026 Top7Spots. All rights reserved.
      </div>
    </footer>
  );
}
