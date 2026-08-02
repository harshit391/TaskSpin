"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Task } from "@/types/task";
import { useFollowUps } from "@/hooks/useFollowUps";

interface FollowUpChainModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
}

export function FollowUpChainModal({ isOpen, onClose, task }: FollowUpChainModalProps) {
  const { chain, isLoading, addFollowUp, isAdding } = useFollowUps(isOpen ? task?.id ?? null : null);
  const [appendValue, setAppendValue] = useState("");
  const [insertingAfter, setInsertingAfter] = useState<string | null>(null);
  const [insertValue, setInsertValue] = useState("");
  const appendRef = useRef<HTMLInputElement>(null);
  const insertRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setAppendValue("");
      setInsertingAfter(null);
      setInsertValue("");
      setTimeout(() => appendRef.current?.focus(), 150);
    }
  }, [isOpen]);

  useEffect(() => {
    if (insertingAfter) {
      setTimeout(() => insertRef.current?.focus(), 50);
    }
  }, [insertingAfter]);

  const handleAppend = () => {
    const trimmed = appendValue.trim();
    if (!trimmed) return;
    addFollowUp(trimmed);
    setAppendValue("");
  };

  const handleInsert = (afterId: string) => {
    const trimmed = insertValue.trim();
    if (!trimmed) return;
    addFollowUp(trimmed, afterId);
    setInsertingAfter(null);
    setInsertValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && task && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onKeyDown={handleKeyDown}
            className="fixed inset-x-4 top-[15%] bottom-[15%] sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 z-50 bg-bg-card border border-border rounded-[4px] sm:w-full sm:max-w-md flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-border">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-text-muted uppercase tracking-[0.08em] font-medium mb-1">
                  Follow-up chain
                </p>
                <p className="text-sm text-text-primary font-medium truncate">
                  {task.title}
                </p>
              </div>
              <button
                onClick={onClose}
                className="flex-shrink-0 ml-3 text-text-muted hover:text-text-primary transition-colors min-w-[44px] min-h-[44px] inline-flex items-center justify-center"
                aria-label="Close"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Chain Body */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full bg-border animate-pulse" />
                      <div className="flex-1 h-4 bg-border rounded animate-pulse" />
                    </div>
                  ))}
                </div>
              ) : chain.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 gap-3">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-muted">
                    <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <p className="text-text-muted text-sm text-center">
                    No follow-ups yet.<br />Add the first one below.
                  </p>
                </div>
              ) : (
                <div className="relative">
                  {/* Connector line */}
                  <div className="absolute left-[5px] top-[10px] bottom-[10px] w-px bg-accent/30" />

                  <AnimatePresence initial={false}>
                    {chain.map((item, index) => (
                      <div key={item.id}>
                        {/* Chain Item */}
                        <motion.div
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          transition={{ delay: index * 0.03 }}
                          className="relative flex items-start gap-3 py-2"
                        >
                          {/* Node dot */}
                          <div className={`relative z-10 w-[11px] h-[11px] rounded-full border-2 flex-shrink-0 mt-0.5 ${
                            item.completed
                              ? "bg-text-muted border-text-muted"
                              : "bg-accent border-accent"
                          }`} />

                          {/* Task title */}
                          <span className={`text-sm leading-snug ${
                            item.completed
                              ? "text-text-muted line-through opacity-60"
                              : "text-text-primary"
                          }`}>
                            {item.title}
                          </span>
                        </motion.div>

                        {/* Insert button between items */}
                        {index < chain.length - 1 && (
                          <div className="relative ml-[-2px] pl-[14px] py-0.5">
                            <AnimatePresence mode="wait">
                              {insertingAfter === item.id ? (
                                <motion.div
                                  key="input"
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="flex items-center gap-2 py-1"
                                >
                                  <input
                                    ref={insertRef}
                                    value={insertValue}
                                    onChange={(e) => setInsertValue(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") handleInsert(item.id);
                                      if (e.key === "Escape") { setInsertingAfter(null); setInsertValue(""); }
                                    }}
                                    placeholder="Insert task..."
                                    className="flex-1 text-xs bg-bg-primary border border-border rounded-[3px] px-2.5 py-2 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
                                  />
                                  <button
                                    onClick={() => handleInsert(item.id)}
                                    disabled={!insertValue.trim()}
                                    className="text-[10px] font-medium text-accent hover:text-accent-hover disabled:opacity-40 min-w-[44px] min-h-[44px] inline-flex items-center justify-center"
                                  >
                                    Add
                                  </button>
                                </motion.div>
                              ) : (
                                <motion.button
                                  key="btn"
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  exit={{ opacity: 0 }}
                                  onClick={() => { setInsertingAfter(item.id); setInsertValue(""); }}
                                  className="group flex items-center gap-1.5 py-1 text-text-muted hover:text-accent transition-colors"
                                  aria-label="Insert follow-up here"
                                >
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                    <path d="M12 5v14M5 12h14" />
                                  </svg>
                                  <span className="text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">Insert</span>
                                </motion.button>
                              )}
                            </AnimatePresence>
                          </div>
                        )}
                      </div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Footer — append input */}
            <div className="px-5 pb-5 pt-3 border-t border-border">
              <div className="flex gap-2">
                <input
                  ref={appendRef}
                  value={appendValue}
                  onChange={(e) => setAppendValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAppend();
                    if (e.key === "Escape") onClose();
                  }}
                  placeholder="Add follow-up..."
                  disabled={isAdding}
                  className="flex-1 text-sm bg-bg-primary border border-border rounded-[3px] px-3 py-2.5 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors disabled:opacity-50"
                />
                <button
                  onClick={handleAppend}
                  disabled={!appendValue.trim() || isAdding}
                  className="bg-accent hover:bg-accent-hover text-white text-xs font-medium uppercase tracking-[0.05em] px-4 py-2.5 rounded-[4px] transition-all disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  Add
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
