"use client";

import { useState } from "react";
import { Reorder, useDragControls, motion } from "framer-motion";
import { useRoadmapTasks } from "@/hooks/useRoadmapTasks";
import { Task, Roadmap } from "@/types/task";

interface RoadmapViewProps {
  roadmap: Roadmap;
}

export function RoadmapView({ roadmap }: RoadmapViewProps) {
  const { tasks, isLoading, addTask, removeTask, reorder, isMutating } = useRoadmapTasks(roadmap.id);
  const [newTitle, setNewTitle] = useState("");

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newTitle.trim();
    if (!trimmed) return;
    addTask({ title: trimmed });
    setNewTitle("");
  };

  const handleReorder = (reordered: Task[]) => {
    reorder(reordered.map(t => t.id));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <svg className="animate-spin h-8 w-8 text-accent" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
          <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
        </svg>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Roadmap header */}
      <div className="flex items-center gap-3">
        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: roadmap.color }} />
        <h2 className="text-lg font-semibold text-text-primary">{roadmap.title}</h2>
        <span className="text-xs text-text-muted">{tasks.length} tasks</span>
      </div>

      {/* Ordered task list with drag */}
      {tasks.length > 0 ? (
        <Reorder.Group axis="y" values={tasks} onReorder={handleReorder} className="space-y-1.5">
          {tasks.map((task, index) => (
            <RoadmapTaskItem
              key={task.id}
              task={task}
              index={index}
              onRemove={() => removeTask(task.id)}
            />
          ))}
        </Reorder.Group>
      ) : (
        <div className="py-10 text-center text-text-muted text-sm">
          No tasks yet. Add one below.
        </div>
      )}

      {/* Add task input */}
      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Add task to roadmap..."
          className="flex-1 bg-bg-secondary border border-border rounded-[4px] px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus-visible:border-accent"
          disabled={isMutating}
        />
        <button
          type="submit"
          disabled={!newTitle.trim() || isMutating}
          className="px-4 py-2.5 bg-accent hover:bg-accent-hover text-white text-xs font-medium uppercase tracking-wide rounded-[4px] transition-all disabled:opacity-50"
        >
          Add
        </button>
      </form>
    </div>
  );
}

function RoadmapTaskItem({ task, index, onRemove }: { task: Task; index: number; onRemove: () => void }) {
  const dragControls = useDragControls();

  return (
    <Reorder.Item
      value={task}
      dragListener={false}
      dragControls={dragControls}
      className="flex items-center gap-3 bg-bg-secondary border border-border rounded-[4px] px-3 py-3 group"
    >
      {/* Drag handle */}
      <button
        onPointerDown={(e) => dragControls.start(e)}
        className="touch-none cursor-grab active:cursor-grabbing text-text-muted hover:text-text-secondary flex-shrink-0"
        aria-label="Drag to reorder"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M8 6h.01M8 12h.01M8 18h.01M16 6h.01M16 12h.01M16 18h.01" strokeLinecap="round" />
        </svg>
      </button>

      {/* Position number */}
      <span className="text-[11px] font-semibold text-text-muted w-5 text-center flex-shrink-0">
        {index + 1}
      </span>

      {/* Task title */}
      <span className="flex-1 text-sm text-text-primary truncate">{task.title}</span>

      {/* Remove button */}
      <motion.button
        onClick={onRemove}
        className="opacity-0 group-hover:opacity-100 focus:opacity-100 text-text-muted hover:text-error transition-all flex-shrink-0 min-w-[32px] min-h-[32px] flex items-center justify-center"
        aria-label="Remove from roadmap"
        whileTap={{ scale: 0.9 }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
        </svg>
      </motion.button>
    </Reorder.Item>
  );
}
