"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Roadmap } from "@/types/task";

interface RoadmapCardProps {
  roadmap: Roadmap;
  totalTasks: number;
  completedTasks: number;
  index: number;
  onEdit: (id: string, data: { title?: string; color?: string }) => void;
  onDelete: (id: string) => void;
}

export function RoadmapCard({ roadmap, totalTasks, completedTasks, index, onEdit, onDelete }: RoadmapCardProps) {
  const percentage = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
  const isComplete = totalTasks > 0 && completedTasks === totalTasks;

  const [showMenu, setShowMenu] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(roadmap.title);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!showMenu) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showMenu]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const handleSave = () => {
    const trimmed = editTitle.trim();
    if (trimmed && trimmed !== roadmap.title) {
      onEdit(roadmap.id, { title: trimmed });
    }
    setEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") {
      setEditTitle(roadmap.title);
      setEditing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, type: "spring", bounce: 0.2 }}
      className="relative group"
    >
      <a
        href={`/dashboard?roadmap=${roadmap.id}`}
        className={`block border border-border rounded-[4px] bg-bg-secondary overflow-hidden transition-all hover:border-text-muted hover:shadow-[0_0_20px_rgba(78,205,196,0.05)] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${editing ? "pointer-events-none" : ""}`}
        onClick={(e) => { if (editing) e.preventDefault(); }}
      >
        <div className="h-1" style={{ backgroundColor: roadmap.color }} />

        <div className="p-4 sm:p-5 space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-3.5 h-3.5 rounded-full flex-shrink-0" style={{ backgroundColor: roadmap.color }} />
            {editing ? (
              <input
                ref={inputRef}
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onBlur={handleSave}
                onKeyDown={handleKeyDown}
                className="flex-1 text-base sm:text-lg font-semibold bg-bg-primary border border-accent rounded-[3px] px-2 py-0.5 text-text-primary focus:outline-none"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <h3 className="text-base sm:text-lg font-semibold text-text-primary truncate group-hover:text-accent transition-colors">
                {roadmap.title}
              </h3>
            )}
          </div>

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

          <div className="h-1.5 bg-bg-primary rounded-full overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${isComplete ? "bg-success" : "bg-accent"}`}
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 0.6, ease: "easeOut", delay: index * 0.05 + 0.2 }}
            />
          </div>

          <p className="text-[11px] text-text-muted">
            Created {new Date(roadmap.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </p>
        </div>
      </a>

      <div className="absolute top-3 right-3 z-10" ref={menuRef}>
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowMenu(!showMenu); }}
          className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity bg-bg-card/80 backdrop-blur-sm border border-border rounded-[3px] min-w-[36px] min-h-[36px] inline-flex items-center justify-center text-text-muted hover:text-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          aria-label="Roadmap options"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="12" cy="5" r="1" fill="currentColor" />
            <circle cx="12" cy="12" r="1" fill="currentColor" />
            <circle cx="12" cy="19" r="1" fill="currentColor" />
          </svg>
        </button>

        <AnimatePresence>
          {showMenu && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -5 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -5 }}
              className="absolute right-0 top-full mt-1 min-w-[140px] bg-bg-card border border-border rounded-[4px] shadow-lg overflow-hidden"
            >
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowMenu(false); setEditTitle(roadmap.title); setEditing(true); }}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-left text-text-secondary hover:bg-bg-hover hover:text-text-primary transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Rename
              </button>
              <div className="h-px bg-border" />
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowMenu(false); onDelete(roadmap.id); }}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-left text-error hover:bg-error/10 transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M10 11v6M14 11v6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Delete
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
