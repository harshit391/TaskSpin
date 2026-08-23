"use client";

import { motion } from "framer-motion";
import { UserMenu } from "@/components/UserMenu";
import { SetDefaultPageButton } from "@/components/SetDefaultPageButton";

interface HeaderProps {
  onToggleSidebar: () => void;
  onSpin: () => void;
  onShortcuts: () => void;
  onExport: () => void;
}

export function Header({ onToggleSidebar, onSpin, onShortcuts, onExport }: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-bg-primary/80 backdrop-blur-sm">
      <div className="w-[92%] sm:w-[88%] md:w-[85%] lg:w-[82%] max-w-5xl mx-auto flex items-center justify-between py-4">
        <div className="flex items-center gap-3">
          {/* Mobile sidebar toggle */}
          <button
            onClick={onToggleSidebar}
            className="sm:hidden min-w-[44px] min-h-[44px] inline-flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-[2px]"
            aria-label="Toggle sidebar"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M3 12h18M3 6h18M3 18h18" strokeLinecap="round" />
            </svg>
          </button>

          <a href="/">
            <motion.h1
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", bounce: 0.3 }}
              className="font-[family-name:var(--font-oswald)] text-2xl sm:text-3xl font-semibold uppercase tracking-[0.02em] leading-none hover:opacity-80 transition-opacity"
            >
              Task<span className="text-accent">Spin</span>
            </motion.h1>
          </a>
          <SetDefaultPageButton page="/dashboard" />
        </div>

        <div className="flex items-center gap-3">
          {/* Export for AI Button */}
          <button
            onClick={onExport}
            className="inline-flex items-center justify-center min-w-[44px] min-h-[44px] text-text-muted hover:text-text-primary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-[2px]"
            aria-label="Export data for AI insights"
            title="Export for AI"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" strokeLinecap="round" strokeLinejoin="round" />
              <polyline points="16,6 12,2 8,6" strokeLinecap="round" strokeLinejoin="round" />
              <line x1="12" y1="2" x2="12" y2="15" strokeLinecap="round" />
            </svg>
          </button>

          {/* Keyboard Shortcuts Button (desktop only) */}
          <button
            onClick={onShortcuts}
            className="hidden sm:inline-flex items-center justify-center min-w-[44px] min-h-[44px] text-text-muted hover:text-text-primary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-[2px]"
            aria-label="Keyboard shortcuts (?)"
            title="Keyboard shortcuts (?)"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <rect x="2" y="6" width="20" height="12" rx="2" />
              <path d="M6 10h0M10 10h0M14 10h0M18 10h0M8 14h8" strokeLinecap="round" />
            </svg>
          </button>

          {/* Spin Button */}
          <button
            onClick={onSpin}
            className="flex items-center gap-2 bg-accent hover:bg-accent-hover text-white text-xs sm:text-sm font-medium uppercase tracking-[0.05em] px-3 sm:px-4 py-2 rounded-[4px] transition-all hover:shadow-[0_0_20px_var(--color-accent-glow)] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent min-h-[44px]"
            aria-label="Random task selector"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M2 18h1.4c1.3 0 2.5-.6 3.3-1.7l6.1-8.6c.7-1.1 2-1.7 3.3-1.7H22" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M18 2l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M2 6h1.9c1.5 0 2.9.9 3.6 2.2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M22 18h-5.9c-1.3 0-2.6-.7-3.3-1.8l-.5-.8" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M18 14l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="hidden sm:inline">Spin</span>
          </button>

          {/* User Menu (replaces online indicator) */}
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
