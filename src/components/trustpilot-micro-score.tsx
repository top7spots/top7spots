"use client";

import { useEffect, useRef } from "react";
import Script from "next/script";

declare global {
  interface Window {
    Trustpilot?: {
      loadFromElement: (element: HTMLElement, forceReload?: boolean) => void;
    };
  }
}

export function TrustpilotMicroScore() {
  const trustBoxRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (trustBoxRef.current && window.Trustpilot) {
      window.Trustpilot.loadFromElement(trustBoxRef.current, true);
    }
  }, []);

  return (
    <>
      <Script
        src="https://widget.trustpilot.com/bootstrap/v5/tp.widget.bootstrap.min.js"
        strategy="afterInteractive"
      />

      <div
        ref={trustBoxRef}
        className="trustpilot-widget"
        data-locale="en-US"
        data-template-id="5419b637fa0340045cd0c936"
        data-businessunit-id="6a36ebcab48c70a9ea470761"
        data-style-height="20px"
        data-style-width="100%"
        data-token="616e8e2d-cd75-4b24-af50-1b133ff8970f"
        data-theme="light"
      >
        <a
          href="https://www.trustpilot.com/review/top7spots.com"
          target="_blank"
          rel="noopener noreferrer"
        >
          Trustpilot
        </a>
      </div>
    </>
  );
}
