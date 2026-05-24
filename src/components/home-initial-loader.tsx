"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const loaderCookieName = "top7spots_home_loader_seen";
const loaderStorageKey = "top7spots:home-loader-seen";

type HomeInitialLoaderProps = {
  initiallyVisible: boolean;
};

export function HomeInitialLoader({ initiallyVisible }: HomeInitialLoaderProps) {
  const [isVisible, setIsVisible] = useState(initiallyVisible);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    if (!initiallyVisible) {
      return;
    }

    if (window.sessionStorage.getItem(loaderStorageKey) === "true") {
      setIsVisible(false);
      return;
    }

    let exitTimer: number | undefined;

    const markSeen = () => {
      window.sessionStorage.setItem(loaderStorageKey, "true");

      const secureFlag = window.location.protocol === "https:" ? "; Secure" : "";
      document.cookie = `${loaderCookieName}=true; Path=/; SameSite=Lax${secureFlag}`;
    };

    const hideLoader = () => {
      markSeen();
      setIsLeaving(true);

      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (prefersReducedMotion) {
        setIsVisible(false);
        return;
      }

      exitTimer = window.setTimeout(() => setIsVisible(false), 220);
    };

    if (document.readyState === "complete") {
      hideLoader();
    } else {
      window.addEventListener("load", hideLoader, { once: true });
    }

    return () => {
      window.removeEventListener("load", hideLoader);
      window.clearTimeout(exitTimer);
    };
  }, [initiallyVisible]);

  if (!isVisible) {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      className={`home-initial-loader${isLeaving ? " home-initial-loader--leaving" : ""}`}
    >
      <div className="home-initial-loader__glow" />
      <div className="home-initial-loader__mark">
        <Image
          src="/brand/top7spots-dark.png"
          alt=""
          width={1220}
          height={497}
          sizes="(max-width: 640px) 52vw, 208px"
          loading="eager"
          className="home-initial-loader__logo"
        />
      </div>
    </div>
  );
}
