"use client";

import { useSyncExternalStore } from "react";

const DEFAULT_PAGE_KEY = "taskspin-default-page";
// Set once the user has landed on any page in this tab. Until then, opening "/"
// redirects to the default page; afterwards "/" is a normal page, so going back or
// clicking the logo doesn't bounce the user away again.
const ENTERED_KEY = "taskspin-entered";
const CHANGE_EVENT = "taskspin-default-page-change";

export function getDefaultPage(): string {
  return localStorage.getItem(DEFAULT_PAGE_KEY) || "/";
}

export function setDefaultPage(page: string): void {
  localStorage.setItem(DEFAULT_PAGE_KEY, page);
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

/** Current default page; "/" during server render and hydration. */
export function useDefaultPage(): string {
  return useSyncExternalStore(subscribe, getDefaultPage, () => "/");
}

export function markAppEntered(): void {
  sessionStorage.setItem(ENTERED_KEY, "1");
}

function getEntryRedirect(): string | null {
  if (sessionStorage.getItem(ENTERED_KEY)) return null;
  const page = getDefaultPage();
  return page !== "/" ? page : null;
}

/** Page to redirect to when the app is freshly opened on "/", or null. */
export function useEntryRedirect(): string | null {
  return useSyncExternalStore(subscribe, getEntryRedirect, () => null);
}
