'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import type { Pool } from '../../types';
import { useSideTaskStore } from '../../store/sideTaskStore';
import { PoolDetailModal } from './PoolDetailModal';

interface PoolCardProps {
  pool: Pool;
  index: number;
}

export function PoolCard({ pool, index }: PoolCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const pendingSideTaskCount = useSideTaskStore((state) =>
    state.sideTasks.filter((t) => t.poolId === pool.id && !t.completed).length
  );

  const completedCount = pool.subtasks.filter((s) => s.status === 'completed').length;
  const totalCount = pool.subtasks.length;
  const activeSubtask = pool.subtasks.find((s) => s.status === 'active');
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  const isComplete = completedCount === totalCount && totalCount > 0;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ delay: index * 0.05 }}
        onClick={() => setIsModalOpen(true)}
        className="card group cursor-pointer"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-medium text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors truncate">
              {pool.name}
            </h3>

            {pool.description && (
              <p className="mt-1 text-sm text-[var(--text-secondary)] line-clamp-2">
                {pool.description}
              </p>
            )}

            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <span className={`tag ${isComplete ? 'bg-[var(--success)]/20 text-[var(--success)] border-[var(--success)]/30' : ''}`}>
                {completedCount}/{totalCount} subtasks
              </span>
              {activeSubtask && (
                <span className="tag tag-accent">
                  {activeSubtask.name}
                </span>
              )}
              {pendingSideTaskCount > 0 && (
                <span className="tag">
                  {pendingSideTaskCount} side task{pendingSideTaskCount !== 1 ? 's' : ''}
                </span>
              )}
              {isComplete && (
                <span className="tag bg-[var(--success)]/20 text-[var(--success)] border-[var(--success)]/30">
                  Complete
                </span>
              )}
            </div>

            {/* Progress bar */}
            {totalCount > 0 && (
              <div className="mt-3">
                <div className="h-1.5 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5 }}
                    className={`h-full rounded-full ${isComplete ? 'bg-[var(--success)]' : 'bg-[var(--accent)]'}`}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Arrow icon */}
          <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity pt-1">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--text-muted)]">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </div>
        </div>
      </motion.div>

      <PoolDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        pool={pool}
      />
    </>
  );
}
