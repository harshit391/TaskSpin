"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { markAppEntered } from "@/lib/defaultPage";

/** Marks the tab as "entered" once the user is on any page other than the "/" entry point. */
export function AppEntryTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname !== "/") markAppEntered();
  }, [pathname]);

  return null;
}
