"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Project } from "@/types/task";

interface BulkActionBarProps {
  selectedCount: number;
  totalCount: number;
  projects: Project[];
  onDelete: () => void;
  onMarkComplete: () => void;
  onMarkIncomplete: () => void;
  onMoveToProject: (projectId: string | null) => void;
  onCopy: () => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
}

export function BulkActionBar({
  selectedCount,
  totalCount,
  projects,
  onDelete,
  onMarkComplete,
  onMarkIncomplete,
  onMoveToProject,
  onCopy,
  onSelectAll,
  onDeselectAll,
}: BulkActionBarProps) {
  const [showMoveMenu, setShowMoveMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showMoveMenu) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMoveMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showMoveMenu]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      role="toolbar"
      aria-label="Bulk actions for selected tasks"
      className="fixed bottom-4 left-4 right-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:bottom-6 z-50 bg-bg-card border border-border rounded-[4px] shadow-xl shadow-black/30 px-3 py-2.5 sm:px-4 sm:py-3 flex items-center gap-2 sm:gap-3 max-w-fit mx-auto"
    >
      {/* Selected count */}
      <span className="text-accent font-medium text-sm whitespace-nowrap" aria-live="polite">
        {selectedCount} selected
      </span>

      {/* Select All */}
      {selectedCount < totalCount && (
        <button
          onClick={onSelectAll}
          aria-label="Select all tasks"
          className="text-[11px] font-medium text-blue-400 hover:text-blue-300 transition-colors whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded-[2px] px-1.5 py-0.5"
        >
          All
        </button>
      )}

      <div className="w-px h-5 bg-border" />

      {/* Mark Complete */}
      <button
        onClick={onMarkComplete}
        aria-label="Mark selected as complete"
        title="Mark complete"
        className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center text-text-muted hover:text-green-400 transition-colors rounded-[2px] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="hidden sm:inline ml-1.5 text-xs">Complete</span>
      </button>

      {/* Mark Incomplete */}
      <button
        onClick={onMarkIncomplete}
        aria-label="Mark selected as incomplete"
        title="Mark incomplete"
        className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center text-text-muted hover:text-yellow-400 transition-colors rounded-[2px] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M3 12a9 9 0 1018 0 9 9 0 00-18 0" strokeLinecap="round" />
          <path d="M12 8v4l2 2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="hidden sm:inline ml-1.5 text-xs">Reopen</span>
      </button>

      {/* Move to Project */}
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setShowMoveMenu(!showMoveMenu)}
          aria-label="Move selected to project"
          title="Move to project"
          className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center text-text-muted hover:text-text-secondary transition-colors rounded-[2px] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="hidden sm:inline ml-1.5 text-xs">Move</span>
        </button>

        {showMoveMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="absolute bottom-full left-0 mb-2 z-50 min-w-[160px] max-h-[240px] overflow-y-auto bg-bg-card border border-border rounded-[4px] shadow-lg"
          >
            <button
              onClick={() => { onMoveToProject(null); setShowMoveMenu(false); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left transition-colors hover:bg-bg-hover text-text-secondary"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M22 12h-6l-2 3H10l-2-3H2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Inbox
            </button>

            {projects.length > 0 && <div className="h-px bg-border" />}

            {projects.map((project) => (
              <button
                key={project.id}
                onClick={() => { onMoveToProject(project.id); setShowMoveMenu(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left transition-colors hover:bg-bg-hover text-text-secondary"
              >
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: project.color }}
                />
                <span className="truncate">{project.name}</span>
              </button>
            ))}
          </motion.div>
        )}
      </div>

      {/* Copy to Clipboard */}
      <button
        onClick={onCopy}
        aria-label="Copy selected tasks to clipboard"
        title="Copy to clipboard"
        className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center text-text-muted hover:text-accent transition-colors rounded-[2px] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <rect x="9" y="9" width="13" height="13" rx="2" />
          <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" strokeLinecap="round" />
        </svg>
        <span className="hidden sm:inline ml-1.5 text-xs">Copy</span>
      </button>

      <div className="w-px h-5 bg-border" />

      {/* Delete */}
      <button
        onClick={onDelete}
        aria-label="Delete selected tasks"
        title="Delete"
        className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center text-text-muted hover:text-error transition-colors rounded-[2px] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M10 11v6M14 11v6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="hidden sm:inline ml-1.5 text-xs">Delete</span>
      </button>

      {/* Deselect All (X) */}
      <button
        onClick={onDeselectAll}
        aria-label="Deselect all"
        title="Deselect all"
        className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center text-text-muted hover:text-text-primary transition-colors rounded-[2px] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </motion.div>
  );
}
