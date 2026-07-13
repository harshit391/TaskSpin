"use client";

import { useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useProjects } from "@/hooks/useProjects";
import { useTasks } from "@/hooks/useTasks";
import { ProjectCard } from "@/components/ProjectCard";

export default function ProjectsDashboard() {
  const { projects, isLoading: projectsLoading, editProject, removeProject } = useProjects();
  const { tasks, isLoading: tasksLoading } = useTasks();

  const isLoading = projectsLoading || tasksLoading;

  const projectStats = useMemo(() => {
    return projects.map((project) => {
      const projectTasks = tasks.filter((t) => t.projectId === project.id);
      return {
        project,
        totalTasks: projectTasks.length,
        completedTasks: projectTasks.filter((t) => t.completed).length,
      };
    });
  }, [projects, tasks]);

  return (
    <div className="min-h-dvh bg-bg-primary">
      {/* Header */}
      <header className="border-b border-border bg-bg-primary/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="w-[92%] sm:w-[88%] md:w-[85%] lg:w-[82%] max-w-5xl mx-auto flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-text-muted hover:text-text-primary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-[2px] min-w-[44px] min-h-[44px] inline-flex items-center justify-center"
              aria-label="Back to tasks"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
            <h1 className="font-[family-name:var(--font-oswald)] text-2xl sm:text-3xl font-semibold uppercase tracking-[0.02em] leading-none">
              Projects
            </h1>
            {projects.length > 0 && (
              <span className="text-sm text-text-muted">({projects.length})</span>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="w-[92%] sm:w-[88%] md:w-[85%] lg:w-[82%] max-w-5xl mx-auto py-6 sm:py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <svg
              className="animate-spin h-8 w-8 text-accent"
              viewBox="0 0 24 24"
              fill="none"
              aria-label="Loading projects"
            >
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
              <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
            </svg>
          </div>
        ) : projects.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 gap-4"
          >
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-muted" aria-hidden="true">
              <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p className="text-text-muted text-sm">No projects yet</p>
            <p className="text-text-muted text-xs">Create a project from the sidebar or use <kbd className="px-1.5 py-0.5 bg-bg-secondary rounded text-text-secondary">#ProjectName</kbd> syntax</p>
            <Link
              href="/"
              className="mt-2 text-accent hover:text-accent-hover text-sm font-medium transition-colors"
            >
              Go to Tasks
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projectStats.map(({ project, totalTasks, completedTasks }, i) => (
              <ProjectCard
                key={project.id}
                project={project}
                totalTasks={totalTasks}
                completedTasks={completedTasks}
                index={i}
                onEdit={editProject}
                onDelete={removeProject}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
