"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Project } from "@/types/task";

interface ProjectMultiSelectProps {
  projects: Project[];
  selected: string[];
  onChange: (selected: string[]) => void;
}

export function ProjectMultiSelect({ projects, selected, onChange }: ProjectMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const toggle = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  const label = selected.length === 0
    ? "All projects"
    : selected.length === 1
      ? projects.find((p) => p.id === selected[0])?.name ?? "1 project"
      : `${selected.length} projects`;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full border transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
          selected.length > 0
            ? "border-accent/50 bg-accent/10 text-accent"
            : "border-border bg-bg-secondary text-text-secondary hover:border-text-muted"
        }`}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="truncate max-w-[100px]">{label}</span>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true" className={`transition-transform ${open ? "rotate-180" : ""}`}>
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -5 }}
            className="absolute top-full left-0 mt-2 z-50 min-w-[180px] bg-bg-card border border-border rounded-[4px] shadow-lg overflow-hidden"
          >
            {/* Inbox option */}
            <label className="flex items-center gap-2.5 px-3 py-2 text-xs cursor-pointer hover:bg-bg-hover transition-colors">
              <input
                type="checkbox"
                checked={selected.includes("inbox")}
                onChange={() => toggle("inbox")}
                className="sr-only"
              />
              <span className={`w-3.5 h-3.5 border rounded-[2px] flex items-center justify-center transition-all ${
                selected.includes("inbox") ? "bg-accent border-accent" : "border-border"
              }`}>
                {selected.includes("inbox") && (
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" aria-hidden="true">
                    <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </span>
              <span className="text-text-secondary">Inbox</span>
            </label>

            {projects.length > 0 && <div className="h-px bg-border" />}

            {projects.map((project) => (
              <label key={project.id} className="flex items-center gap-2.5 px-3 py-2 text-xs cursor-pointer hover:bg-bg-hover transition-colors">
                <input
                  type="checkbox"
                  checked={selected.includes(project.id)}
                  onChange={() => toggle(project.id)}
                  className="sr-only"
                />
                <span className={`w-3.5 h-3.5 border rounded-[2px] flex items-center justify-center transition-all ${
                  selected.includes(project.id) ? "bg-accent border-accent" : "border-border"
                }`}>
                  {selected.includes(project.id) && (
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" aria-hidden="true">
                      <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: project.color }} />
                <span className="text-text-secondary truncate">{project.name}</span>
              </label>
            ))}

            {selected.length > 0 && (
              <>
                <div className="h-px bg-border" />
                <button
                  onClick={() => onChange([])}
                  className="w-full px-3 py-2 text-xs text-text-muted hover:text-accent text-left transition-colors"
                >
                  Clear all
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
