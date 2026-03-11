'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { usePoolStore } from '../../store/poolStore';
import { PoolCard } from './PoolCard';
import { PoolForm } from './PoolForm';
import { PoolJsonImport } from './PoolJsonImport';

export function PoolList() {
  const pools = usePoolStore((state) => state.pools);
  const isLoading = usePoolStore((state) => state.isLoading);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-pulse text-[var(--text-muted)]">Loading pools...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="heading-display heading-section text-[var(--text-primary)]">
            Task Pools
          </h2>
          <p className="mt-1 text-[var(--text-secondary)]">
            {pools.length === 0
              ? 'Break down big goals into subtask roadmaps'
              : `${pools.length} pool${pools.length === 1 ? '' : 's'} configured`}
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <PoolForm />
        </div>
        <div className="flex-1">
          <PoolJsonImport />
        </div>
      </div>

      <AnimatePresence mode="popLayout">
        {pools.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-16"
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="text-[var(--text-muted)]"
              >
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <h3 className="heading-display heading-sub text-[var(--text-secondary)]">
              No Pools Yet
            </h3>
            <p className="mt-2 text-[var(--text-muted)] max-w-sm mx-auto">
              Create a pool to break down a big task into an ordered roadmap of subtasks.
              One subtask will be active at a time and appear in your weekly schedule.
            </p>
          </motion.div>
        ) : (
          <div className="grid gap-3">
            {pools.map((pool, index) => (
              <PoolCard key={pool.id} pool={pool} index={index} />
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
