"use client";

import { useEffect } from "react";
import { trackEvent } from "../lib/analytics";

export function PageViewTracker() {
  useEffect(() => {
    trackEvent("page_viewed", {
      step_id: "landing",
      screen_id: "S0",
    });
  }, []);

  return null;
}
