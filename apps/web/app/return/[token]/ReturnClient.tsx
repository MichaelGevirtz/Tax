"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const WIZARD_STATE_KEY = "taxback_precheck_v2";
const SOFT_RESULT_KEY = "taxback_soft_result_v1";

interface ReturnClientProps {
  wizardState: unknown;
  softResult: unknown;
}

export function ReturnClient({ wizardState, softResult }: ReturnClientProps) {
  const router = useRouter();

  useEffect(() => {
    try {
      localStorage.setItem(WIZARD_STATE_KEY, JSON.stringify(wizardState));
      localStorage.setItem(SOFT_RESULT_KEY, JSON.stringify(softResult));
    } catch {
      // localStorage unavailable — proceed anyway
    }
    router.replace("/soft-result");
  }, [wizardState, softResult, router]);

  return null;
}
