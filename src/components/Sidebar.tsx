"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Project, ProjectFilter, Task } from "@/types/task";
import { ProjectForm } from "./ProjectForm";

interface SidebarProps {
  projects: Project[];
  selectedFilter: ProjectFilter;
  onFilterChange: (filter: ProjectFilter) => void;
  onAddProject: (name: string, color: string) => void;
  onDeleteProject: (id: string) => void;
  isAddingProject: boolean;
  inboxCount: number;
  allCount: number;
  activeTasks: Task[];
}

export function Sidebar({
  projects,
  selectedFilter,
  onFilterChange,
  onAddProject,
  onDeleteProject,
  isAddingProject,
  inboxCount,
  allCount,
  activeTasks,
}: SidebarProps) {
  const [showForm, setShowForm] = useState(false);
  const pathname = usePathname();

  const handleAddProject = (name: string, color: string) => {
    onAddProject(name, color);
    setShowForm(false);
  };

  return (
    <aside className="flex flex-col h-full p-4 space-y-1 overflow-y-auto">
      {/* All Tasks */}
      <SidebarItem
        label="All Tasks"
        count={allCount}
        isActive={selectedFilter === "all"}
        onClick={() => onFilterChange("all")}
        icon={
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
          </svg>
        }
      />

      {/* Inbox */}
      <SidebarItem
        label="Inbox"
        count={inboxCount}
        isActive={selectedFilter === "inbox"}
        onClick={() => onFilterChange("inbox")}
        icon={
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M22 12h-6l-2 3H10l-2-3H2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        }
      />

      {/* Projects Dashboard Link */}
      <Link
        href="/projects"
        className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-[3px] text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
          pathname === "/projects"
            ? "bg-bg-hover text-text-primary"
            : "text-text-secondary hover:bg-bg-hover/50 hover:text-text-primary"
        }`}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <rect x="3" y="3" width="7" height="7" rx="1" strokeLinecap="round" />
          <rect x="14" y="3" width="7" height="7" rx="1" strokeLinecap="round" />
          <rect x="3" y="14" width="7" height="7" rx="1" strokeLinecap="round" />
          <rect x="14" y="14" width="7" height="7" rx="1" strokeLinecap="round" />
        </svg>
        <span className="flex-1 text-sm truncate">Projects Dashboard</span>
      </Link>

      {/* Divider */}
      <div className="h-px bg-border my-3!" />

      {/* Section label */}
      <div className="flex items-center justify-between px-2 pt-1 pb-2">
        <span className="text-[11px] font-medium uppercase tracking-[0.1em] text-text-muted">
          Projects
        </span>
        <button
          onClick={() => setShowForm(true)}
          className="text-text-muted hover:text-accent transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-sm p-0.5"
          aria-label="Add new project"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Project Form */}
      <AnimatePresence>
        {showForm && (
          <ProjectForm
            onSubmit={handleAddProject}
            onCancel={() => setShowForm(false)}
            isLoading={isAddingProject}
          />
        )}
      </AnimatePresence>

      {/* Project List */}
      <div className="space-y-0.5">
        <AnimatePresence>
          {projects.map((project) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="group"
            >
              <SidebarItem
                label={project.name}
                count={activeTasks.filter((t) => t.projectId === project.id).length}
                isActive={selectedFilter === project.id}
                onClick={() => onFilterChange(project.id)}
                icon={
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: project.color }}
                  />
                }
                onDelete={() => onDeleteProject(project.id)}
              />
            </motion.div>
          ))}
        </AnimatePresence>

        {projects.length === 0 && !showForm && (
          <p className="text-xs text-text-muted px-2 py-3">No projects yet</p>
        )}
      </div>
    </aside>
  );
}

function SidebarItem({
  label,
  count,
  isActive,
  onClick,
  icon,
  onDelete,
}: {
  label: string;
  count: number;
  isActive: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  onDelete?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`group/item w-full flex items-center gap-2.5 px-2.5 py-2 rounded-[3px] text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
        isActive
          ? "bg-bg-hover text-text-primary"
          : "text-text-secondary hover:bg-bg-hover/50 hover:text-text-primary"
      }`}
    >
      <span className="flex-shrink-0">{icon}</span>
      <span className="flex-1 text-sm truncate">{label}</span>
      {count > 0 && (
        <span className="text-[11px] text-text-muted tabular-nums">{count}</span>
      )}
      {onDelete && (
        <span
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.stopPropagation();
              onDelete();
            }
          }}
          className="opacity-0 group-hover/item:opacity-100 text-text-muted hover:text-error transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-sm p-0.5"
          aria-label={`Delete ${label}`}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
          </svg>
        </span>
      )}
    </button>
  );
}
