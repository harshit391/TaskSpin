"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Task } from "@/types/task";

interface RoadmapStackProps {
  roadmap: { id: string; title: string; color: string };
  /** Remaining steps in roadmap order; the first one is "next up". */
  steps: Task[];
  renderTask: (task: Task) => React.ReactNode;
}

/**
 * Shows a roadmap as one stacked card in a task list: the next step on top, with the
 * remaining steps peeking out underneath. Expanding cascades the rest out in order.
 */
export function RoadmapStack({ roadmap, steps, renderTask }: RoadmapStackProps) {
  const [expanded, setExpanded] = useState(false);
  const [head, ...rest] = steps;
  const peekLayers = Math.min(rest.length, 2);

  return (
    <motion.div
      layout="position"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, overflow: "hidden" }}
      transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
      role="group"
      aria-label={`Roadmap ${roadmap.title}, ${steps.length} steps left`}
    >
      {/* Roadmap label */}
      <div className="flex items-center gap-1.5 px-1 pb-1">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={roadmap.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2zM22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
        </svg>
        <span className="text-[11px] font-medium uppercase tracking-[0.08em]" style={{ color: roadmap.color }}>
          Roadmap
        </span>
        <span className="text-[11px] text-text-secondary truncate">{roadmap.title}</span>
        <span className="ml-auto text-[10px] text-text-muted whitespace-nowrap">
          Next up · {steps.length} steps left
        </span>
      </div>

      {/* Head task with stacked cards peeking out below while collapsed */}
      <div className="relative isolate" style={{ paddingBottom: expanded ? 0 : peekLayers * 5 }}>
        <AnimatePresence>
          {!expanded &&
            Array.from({ length: peekLayers }, (_, i) => (
              <motion.div
                key={i}
                aria-hidden="true"
                initial={{ opacity: 0, y: 0 }}
                animate={{ opacity: 0.7 - i * 0.25, y: (i + 1) * 5 }}
                exit={{ opacity: 0, y: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 rounded-[2px] border border-border bg-bg-card"
                style={{ scaleX: 1 - (i + 1) * 0.03, zIndex: -1 - i }}
              />
            ))}
        </AnimatePresence>
        <div className="relative z-[1] rounded-[2px] border-l-2" style={{ borderLeftColor: roadmap.color }}>
          {renderTask(head)}
        </div>
      </div>

      {/* Remaining steps, cascading out when expanded */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", bounce: 0.1, duration: 0.35 }}
            className="overflow-hidden"
          >
            <ol className="mt-1.5 ml-3 pl-3 border-l space-y-1.5" style={{ borderLeftColor: `${roadmap.color}55` }}>
              {rest.map((task, i) => (
                <motion.li
                  key={task.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.04 * i, duration: 0.2 }}
                  className="relative"
                >
                  <span
                    className="absolute -left-[21px] top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full border bg-bg-primary text-[8px] font-semibold flex items-center justify-center"
                    style={{ borderColor: roadmap.color, color: roadmap.color }}
                    aria-hidden="true"
                  >
                    {i + 2}
                  </span>
                  {renderTask(task)}
                </motion.li>
              ))}
            </ol>
          </motion.div>
        )}
      </AnimatePresence>

      {rest.length > 0 && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="mt-1 ml-1 inline-flex items-center gap-1 text-[11px] font-medium text-text-muted hover:text-text-primary transition-colors min-h-[32px] px-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-[2px]"
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`transition-transform ${expanded ? "rotate-180" : ""}`} aria-hidden="true">
            <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {expanded ? "Collapse roadmap" : `+${rest.length} more ${rest.length === 1 ? "step" : "steps"}`}
        </button>
      )}
    </motion.div>
  );
}
