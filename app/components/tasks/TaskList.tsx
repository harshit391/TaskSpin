'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useTaskStore } from '../../store/taskStore';
import { TaskCard } from './TaskCard';
import { TaskForm } from './TaskForm';

export function TaskList() {
  const tasks = useTaskStore((state) => state.tasks);
  const isLoading = useTaskStore((state) => state.isLoading);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-pulse text-(--text-muted)">Loading tasks...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="heading-display heading-section text-foreground">
            Your Tasks
          </h2>
          <p className="mt-1 text-(--text-secondary)">
            {tasks.length === 0
              ? 'Add tasks to build your weekly schedule'
              : `${tasks.length} task${tasks.length === 1 ? '' : 's'} configured`}
          </p>
        </div>
      </div>

      <TaskForm />

      <AnimatePresence mode="popLayout">
        {tasks.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-16"
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-(--bg-secondary) flex items-center justify-center">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="text-(--text-muted)"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <h3 className="heading-display heading-sub text-(--text-secondary)">
              No Tasks Yet
            </h3>
            <p className="mt-2 text-(--text-muted) max-w-sm mx-auto">
              Start by adding tasks with their weekly frequency. TaskSpin will randomly distribute them across your week.
            </p>
          </motion.div>
        ) : (
          <div className="grid gap-3">
            {tasks.map((task, index) => (
              <TaskCard key={task.id} task={task} index={index} />
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
