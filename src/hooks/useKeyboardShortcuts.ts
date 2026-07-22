"use client";

import { useEffect } from "react";

export interface Shortcut {
  key: string;
  ctrl?: boolean;
  action: () => void;
  description: string;
  category: string;
}

export function useKeyboardShortcuts(shortcuts: Shortcut[], enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;

    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const tag = target.tagName.toLowerCase();
      if (tag === "input" || tag === "textarea" || target.isContentEditable) return;

      const shortcut = shortcuts.find((s) => {
        if (s.ctrl && !(e.ctrlKey || e.metaKey)) return false;
        if (!s.ctrl && (e.ctrlKey || e.metaKey || e.altKey)) return false;
        return s.key === e.key;
      });

      if (shortcut) {
        e.preventDefault();
        shortcut.action();
      }
    };

    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [shortcuts, enabled]);
}
