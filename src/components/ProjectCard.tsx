"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Project } from "@/types/task";

interface ProjectCardProps {
  project: Project;
  totalTasks: number;
  completedTasks: number;
  index: number;
}

export function ProjectCard({ project, totalTasks, completedTasks, index }: ProjectCardProps) {
  const percentage = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
  const isComplete = totalTasks > 0 && completedTasks === totalTasks;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, type: "spring", bounce: 0.2 }}
    >
      <Link
        href={`/?project=${project.id}`}
        className="block group border border-border rounded-[4px] bg-bg-secondary overflow-hidden transition-all hover:border-text-muted hover:shadow-[0_0_20px_rgba(255,45,111,0.05)] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        {/* Color accent top bar */}
        <div className="h-1" style={{ backgroundColor: project.color }} />

        <div className="p-4 sm:p-5 space-y-3">
          {/* Project name */}
          <div className="flex items-center gap-2.5">
            <div
              className="w-3.5 h-3.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: project.color }}
            />
            <h3 className="text-base sm:text-lg font-semibold text-text-primary truncate group-hover:text-accent transition-colors">
              {project.name}
            </h3>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-3 text-xs text-text-muted">
            <span>{totalTasks} {totalTasks === 1 ? "task" : "tasks"}</span>
            <span className="w-1 h-1 rounded-full bg-border" />
            <span>{completedTasks} done</span>
            {totalTasks > 0 && (
              <>
                <span className="w-1 h-1 rounded-full bg-border" />
                <span className={isComplete ? "text-success" : "text-accent"}>{percentage}%</span>
              </>
            )}
          </div>

          {/* Mini progress bar */}
          <div className="h-1.5 bg-bg-primary rounded-full overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${isComplete ? "bg-success" : "bg-accent"}`}
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 0.6, ease: "easeOut", delay: index * 0.05 + 0.2 }}
            />
          </div>

          {/* Created date */}
          <p className="text-[11px] text-text-muted">
            Created {new Date(project.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </p>
        </div>
      </Link>
    </motion.div>
  );
}
