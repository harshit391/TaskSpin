"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Project, FilterTab } from "@/types/task";
import { ProjectMultiSelect } from "./ProjectMultiSelect";

export type DateFilter = "all" | "today" | "week" | "month";

interface SearchFilterProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: FilterTab;
  onStatusChange: (status: FilterTab) => void;
  dateFilter: DateFilter;
  onDateChange: (date: DateFilter) => void;
  selectedProjects: string[];
  onProjectsChange: (projects: string[]) => void;
  projects: Project[];
  counts: { all: number; active: number; completed: number };
}

const statusOptions: { key: FilterTab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "completed", label: "Done" },
];

const dateOptions: { key: DateFilter; label: string }[] = [
  { key: "all", label: "Any time" },
  { key: "today", label: "Today" },
  { key: "week", label: "This week" },
  { key: "month", label: "This month" },
];

export function SearchFilter({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  dateFilter,
  onDateChange,
  selectedProjects,
  onProjectsChange,
  projects,
  counts,
}: SearchFilterProps) {
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const hasActiveFilters = dateFilter !== "all" || selectedProjects.length > 0;

  return (
    <div className="space-y-3">
      {/* Search Bar */}
      <div className="relative">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
        </svg>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search tasks..."
          className="w-full bg-bg-secondary border border-border rounded-[4px] pl-10 pr-10 py-2.5 text-sm text-text-primary placeholder:text-text-muted transition-all focus:outline-none focus-visible:border-accent focus-visible:shadow-[0_0_0_2px_var(--color-accent-glow)]"
          aria-label="Search tasks"
        />
        {/* Filter toggle button */}
        <button
          onClick={() => setFiltersExpanded(!filtersExpanded)}
          className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-[3px] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
            hasActiveFilters || filtersExpanded
              ? "text-accent bg-accent/10"
              : "text-text-muted hover:text-text-secondary"
          }`}
          aria-label="Toggle filters"
          aria-expanded={filtersExpanded}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {hasActiveFilters && (
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-accent rounded-full" />
          )}
        </button>
      </div>

      {/* Status Pills */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
        {statusOptions.map((opt) => {
          const isActive = statusFilter === opt.key;
          const count = counts[opt.key];
          return (
            <button
              key={opt.key}
              onClick={() => onStatusChange(opt.key)}
              className={`relative flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full border whitespace-nowrap transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                isActive
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-border bg-bg-secondary text-text-secondary hover:border-text-muted"
              }`}
            >
              {opt.label}
              {count > 0 && (
                <span className={`min-w-[16px] h-4 flex items-center justify-center rounded-full text-[10px] font-semibold ${
                  isActive ? "bg-accent text-white" : "bg-bg-hover text-text-muted"
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Expandable Filters */}
      <AnimatePresence>
        {filtersExpanded && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex flex-wrap gap-2 pt-1 pb-2">
              {/* Date Filter */}
              <div className="flex gap-1 overflow-x-auto">
                {dateOptions.map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => onDateChange(opt.key)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-full border whitespace-nowrap transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                      dateFilter === opt.key
                        ? "border-accent bg-accent/10 text-accent"
                        : "border-border bg-bg-secondary text-text-secondary hover:border-text-muted"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Project Multi-Select */}
              <ProjectMultiSelect
                projects={projects}
                selected={selectedProjects}
                onChange={onProjectsChange}
              />

              {/* Clear all filters */}
              {hasActiveFilters && (
                <button
                  onClick={() => {
                    onDateChange("all");
                    onProjectsChange([]);
                  }}
                  className="px-3 py-1.5 text-xs text-text-muted hover:text-accent transition-colors"
                >
                  Clear filters
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
