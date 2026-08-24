"use client";

import { motion } from "framer-motion";
import { FilterTab } from "@/types/task";

interface TabFilterProps {
  activeTab: FilterTab;
  onTabChange: (tab: FilterTab) => void;
  counts: { all: number; active: number; completed: number; recurring: number; overdue: number };
}

const tabs: { key: FilterTab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "overdue", label: "Overdue" },
  { key: "completed", label: "Done" },
  { key: "recurring", label: "Recurring" },
];

export function TabFilter({ activeTab, onTabChange, counts }: TabFilterProps) {
  return (
    <div
      role="tablist"
      className="flex bg-bg-secondary border border-border rounded-[4px] p-1 gap-1"
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        const count = counts[tab.key];
        return (
          <button
            key={tab.key}
            role="tab"
            aria-selected={isActive}
            aria-controls={`tabpanel-${tab.key}`}
            onClick={() => onTabChange(tab.key)}
            className={`relative flex-1 flex items-center justify-center gap-1.5 px-2 sm:px-5 py-3 text-xs sm:text-sm font-medium uppercase tracking-[0.05em] transition-colors rounded-[3px] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
              isActive ? "text-text-primary" : "text-text-muted hover:text-text-secondary"
            }`}
          >
            {isActive && (
              <motion.div
                layoutId="activeTab"
                className="absolute inset-0 bg-bg-hover rounded-[3px]"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className="relative z-10">{tab.label}</span>
            {count > 0 && (
              <span
                className={`relative z-10 min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[10px] font-semibold ${
                  isActive
                    ? "bg-accent text-white"
                    : "bg-bg-hover text-text-muted"
                }`}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
