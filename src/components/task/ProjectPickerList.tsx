"use client";

import { Project } from "@/types/task";

interface ProjectPickerListProps {
  projects: Project[];
  currentProjectId: string | null;
  onPick: (projectId: string | null) => void;
  /** "menu": desktop dropdown; "accordion": nested inside the mobile overflow menu. */
  variant: "menu" | "accordion";
}

/** Inbox + project options for moving a task. */
export function ProjectPickerList({ projects, currentProjectId, onPick, variant }: ProjectPickerListProps) {
  const itemClass =
    variant === "menu"
      ? "w-full flex items-center gap-2 px-3 py-2 text-xs text-left transition-colors hover:bg-bg-hover"
      : "w-full flex items-center gap-2 px-5 py-2 text-[11px] text-left transition-colors hover:bg-bg-hover";
  const tone = (active: boolean) => (active ? "text-accent" : "text-text-secondary");

  return (
    <>
      <button
        onClick={(e) => { e.stopPropagation(); onPick(null); }}
        className={`${itemClass} ${tone(currentProjectId === null)}`}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M22 12h-6l-2 3H10l-2-3H2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Inbox
      </button>

      {variant === "menu" && projects.length > 0 && <div className="h-px bg-border" />}

      {projects.map((project) => (
        <button
          key={project.id}
          onClick={(e) => { e.stopPropagation(); onPick(project.id); }}
          className={`${itemClass} ${tone(currentProjectId === project.id)}`}
        >
          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: project.color }} />
          <span className="truncate">{project.name}</span>
        </button>
      ))}
    </>
  );
}
