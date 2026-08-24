"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SetDefaultPageButton } from "@/components/SetDefaultPageButton";
import { useRoadmaps } from "@/hooks/useRoadmaps";
import { useTasks } from "@/hooks/useTasks";
import { RoadmapCard } from "@/components/RoadmapCard";
import { DeleteRoadmapModal } from "@/components/DeleteRoadmapModal";

export default function RoadmapDashboard() {
  const { roadmaps, isLoading: roadmapsLoading, editRoadmap, removeRoadmap, isMutating: isRoadmapMutating } = useRoadmaps();
  const { tasks, isLoading: tasksLoading } = useTasks();
  const [deleteRoadmapId, setDeleteRoadmapId] = useState<string | null>(null);

  const isLoading = roadmapsLoading || tasksLoading;

  const roadmapStats = useMemo(() => {
    return roadmaps.map((roadmap) => {
      const roadmapTasks = tasks.filter((t) => t.roadmapId === roadmap.id);
      return {
        roadmap,
        totalTasks: roadmapTasks.length,
        completedTasks: roadmapTasks.filter((t) => t.completed).length,
      };
    });
  }, [roadmaps, tasks]);

  return (
    <div className="min-h-dvh bg-bg-primary flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-bg-primary/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <a
            href="/dashboard"
            className="text-text-muted hover:text-text-primary transition-colors min-w-[36px] min-h-[36px] inline-flex items-center justify-center"
            aria-label="Back to dashboard"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
          <div className="flex-1">
            <h1 className="text-lg sm:text-xl font-bold text-text-primary uppercase tracking-[0.05em]">
              Roadmaps
            </h1>
          </div>
          <span className="text-xs text-text-muted">{roadmaps.length} total</span>
          <SetDefaultPageButton page="/roadmap" />
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <svg className="animate-spin h-8 w-8 text-accent" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
              <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
            </svg>
          </div>
        ) : roadmaps.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-muted" aria-hidden="true">
              <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p className="text-text-muted text-sm">No roadmaps yet</p>
            <p className="text-text-muted text-xs">Create one from the sidebar in the <a href="/dashboard" className="text-accent hover:underline">dashboard</a></p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {roadmapStats.map(({ roadmap, totalTasks, completedTasks }, index) => (
              <RoadmapCard
                key={roadmap.id}
                roadmap={roadmap}
                totalTasks={totalTasks}
                completedTasks={completedTasks}
                index={index}
                onEdit={(id, data) => editRoadmap(id, data)}
                onDelete={(id) => setDeleteRoadmapId(id)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Delete Modal */}
      <DeleteRoadmapModal
        isOpen={!!deleteRoadmapId}
        roadmap={roadmaps.find((r) => r.id === deleteRoadmapId) ?? null}
        taskCount={tasks.filter((t) => t.roadmapId === deleteRoadmapId).length}
        onConfirm={(action) => {
          if (deleteRoadmapId) removeRoadmap({ id: deleteRoadmapId, taskAction: action });
          setDeleteRoadmapId(null);
        }}
        onClose={() => setDeleteRoadmapId(null)}
      />

      {/* Syncing Overlay */}
      <AnimatePresence>
        {isRoadmapMutating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm flex items-center justify-center"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center gap-3 bg-bg-card border border-border rounded-[4px] px-8 py-6 shadow-lg"
            >
              <svg className="animate-spin h-7 w-7 text-accent" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
              </svg>
              <p className="text-sm text-text-secondary font-medium">Syncing...</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
