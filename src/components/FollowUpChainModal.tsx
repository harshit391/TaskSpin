"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence, Reorder, useDragControls } from "framer-motion";
import { Task } from "@/types/task";
import { useFollowUps } from "@/hooks/useFollowUps";
import { useQueryClient } from "@tanstack/react-query";
import { deleteTask, updateTaskTitle } from "@/lib/api";
import { showToast } from "@/hooks/useToast";

interface FollowUpChainModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  onOpenTaskPicker?: () => void;
}

function DragHandle({ dragControls }: { dragControls: ReturnType<typeof useDragControls> }) {
  return (
    <div
      onPointerDown={(e) => { e.preventDefault(); dragControls.start(e); }}
      className="flex-shrink-0 cursor-grab active:cursor-grabbing touch-none min-w-[28px] min-h-[44px] inline-flex items-center justify-center text-text-muted/50 hover:text-text-muted transition-colors"
      aria-label="Drag to reorder"
    >
      <svg width="10" height="16" viewBox="0 0 10 16" fill="currentColor">
        <circle cx="2" cy="2" r="1.5" />
        <circle cx="8" cy="2" r="1.5" />
        <circle cx="2" cy="8" r="1.5" />
        <circle cx="8" cy="8" r="1.5" />
        <circle cx="2" cy="14" r="1.5" />
        <circle cx="8" cy="14" r="1.5" />
      </svg>
    </div>
  );
}

function ChainItem({
  item,
  isSelected,
  isEditing,
  editValue,
  onEditChange,
  onSaveEdit,
  onCancelEdit,
  onLongPressStart,
  onLongPressEnd,
  onEditItem,
  onDeleteItem,
}: {
  item: Task;
  isSelected: boolean;
  isEditing: boolean;
  editValue: string;
  onEditChange: (v: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onLongPressStart: () => void;
  onLongPressEnd: () => void;
  onEditItem: () => void;
  onDeleteItem: () => void;
}) {
  const dragControls = useDragControls();
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) setTimeout(() => editInputRef.current?.focus(), 50);
  }, [isEditing]);

  return (
    <Reorder.Item
      value={item}
      dragListener={false}
      dragControls={dragControls}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      whileDrag={{ scale: 1.02, boxShadow: "0 4px 20px rgba(0,0,0,0.3)", zIndex: 50 }}
      className={`relative flex items-center gap-1 py-1.5 rounded-[3px] px-1 -mx-1 transition-colors ${
        isSelected ? "bg-accent/10" : ""
      }`}
    >
      <DragHandle dragControls={dragControls} />

      {/* Node dot + connector */}
      <div className="flex flex-col items-center flex-shrink-0 self-stretch">
        <div className={`w-[11px] h-[11px] rounded-full border-2 flex-shrink-0 ${
          item.completed
            ? "bg-text-muted border-text-muted"
            : "bg-accent border-accent"
        }`} />
        <div className="flex-1 w-px bg-accent/30 mt-1" />
      </div>

      {/* Content area — long press for selection */}
      <div
        className="flex-1 min-w-0 flex items-center gap-2 min-h-[36px]"
        onPointerDown={onLongPressStart}
        onPointerUp={onLongPressEnd}
        onPointerLeave={onLongPressEnd}
      >
        {isEditing ? (
          <div className="flex-1 flex items-center gap-2">
            <input
              ref={editInputRef}
              value={editValue}
              onChange={(e) => onEditChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onSaveEdit();
                if (e.key === "Escape") onCancelEdit();
              }}
              className="flex-1 text-sm bg-bg-primary border border-border rounded-[3px] px-2 py-1 text-text-primary focus:outline-none focus:border-accent transition-colors"
            />
            <button
              onClick={onSaveEdit}
              className="text-[10px] font-medium text-accent min-w-[36px] min-h-[36px] inline-flex items-center justify-center"
            >
              Save
            </button>
          </div>
        ) : (
          <span className={`text-sm leading-snug flex-1 ${
            item.completed
              ? "text-text-muted line-through opacity-60"
              : "text-text-primary"
          }`}>
            {item.title}
          </span>
        )}
      </div>

      {/* Action buttons on selection */}
      <AnimatePresence>
        {isSelected && !isEditing && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex items-center gap-0.5 flex-shrink-0"
          >
            <button
              onClick={(e) => { e.stopPropagation(); onEditItem(); }}
              className="text-text-muted hover:text-text-primary transition-colors min-w-[36px] min-h-[36px] inline-flex items-center justify-center"
              aria-label="Edit"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 3a2.85 2.85 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
              </svg>
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDeleteItem(); }}
              className="text-text-muted hover:text-error transition-colors min-w-[36px] min-h-[36px] inline-flex items-center justify-center"
              aria-label="Delete"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14" />
                <path d="M10 11v6M14 11v6" />
              </svg>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </Reorder.Item>
  );
}

export function FollowUpChainModal({ isOpen, onClose, task, onOpenTaskPicker }: FollowUpChainModalProps) {
  const queryClient = useQueryClient();
  const { chain, isLoading, addFollowUp, isAdding, reorderChain } = useFollowUps(isOpen ? task?.id ?? null : null);
  const [localChain, setLocalChain] = useState<Task[]>([]);
  const [appendValue, setAppendValue] = useState("");
  const [insertingAfter, setInsertingAfter] = useState<string | null>(null);
  const [insertValue, setInsertValue] = useState("");
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const appendRef = useRef<HTMLInputElement>(null);
  const insertRef = useRef<HTMLInputElement>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reorderTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLocalChain(chain);
  }, [chain]);

  useEffect(() => {
    if (isOpen) {
      setAppendValue("");
      setInsertingAfter(null);
      setInsertValue("");
      setSelectedItemId(null);
      setEditingItemId(null);
      setTimeout(() => appendRef.current?.focus(), 150);
    }
  }, [isOpen]);

  useEffect(() => {
    if (insertingAfter) {
      setTimeout(() => insertRef.current?.focus(), 50);
    }
  }, [insertingAfter]);

  const justSelected = useRef(false);

  const handleLongPressStart = useCallback((itemId: string) => {
    longPressTimer.current = setTimeout(() => {
      setSelectedItemId(itemId);
      justSelected.current = true;
    }, 400);
  }, []);

  const handleLongPressEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handleDeleteItem = useCallback(async (itemId: string) => {
    try {
      await deleteTask(itemId);
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] === "follow-ups" });
      setSelectedItemId(null);
      showToast("Follow-up deleted", "info");
    } catch {
      showToast("Failed to delete", "error");
    }
  }, [queryClient]);

  const handleEditItem = useCallback((itemId: string, currentTitle: string) => {
    setEditingItemId(itemId);
    setEditValue(currentTitle);
    setSelectedItemId(null);
  }, []);

  const handleSaveEdit = useCallback(async () => {
    if (!editingItemId || !editValue.trim()) return;
    try {
      await updateTaskTitle(editingItemId, editValue.trim());
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] === "follow-ups" });
      setEditingItemId(null);
      setEditValue("");
    } catch {
      showToast("Failed to edit", "error");
    }
  }, [editingItemId, editValue, queryClient]);

  const handleReorder = useCallback((newOrder: Task[]) => {
    setLocalChain(newOrder);
    if (reorderTimeout.current) clearTimeout(reorderTimeout.current);
    reorderTimeout.current = setTimeout(() => {
      reorderChain(newOrder.map((t) => t.id));
    }, 600);
  }, [reorderChain]);

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
            <div className="flex-1 overflow-y-auto px-5 py-4" onClick={() => {
              if (justSelected.current) { justSelected.current = false; return; }
              if (selectedItemId) setSelectedItemId(null);
            }}>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full bg-border animate-pulse" />
                      <div className="flex-1 h-4 bg-border rounded animate-pulse" />
                    </div>
                  ))}
                </div>
              ) : localChain.length === 0 ? (
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
                <Reorder.Group
                  axis="y"
                  values={localChain}
                  onReorder={handleReorder}
                  className="relative space-y-0"
                >
                  {localChain.map((item, index) => (
                    <div key={item.id}>
                      <ChainItem
                        item={item}
                        isSelected={selectedItemId === item.id}
                        isEditing={editingItemId === item.id}
                        editValue={editValue}
                        onEditChange={setEditValue}
                        onSaveEdit={handleSaveEdit}
                        onCancelEdit={() => { setEditingItemId(null); setEditValue(""); }}
                        onLongPressStart={() => handleLongPressStart(item.id)}
                        onLongPressEnd={handleLongPressEnd}
                        onEditItem={() => handleEditItem(item.id, item.title)}
                        onDeleteItem={() => handleDeleteItem(item.id)}
                      />

                      {/* Insert button between items */}
                      {index < localChain.length - 1 && (
                        <div className="relative ml-[40px] pl-[14px] py-0.5">
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
                                  disabled={!insertValue.trim() || isAdding}
                                  className="text-[10px] font-medium text-accent hover:text-accent-hover disabled:opacity-40 min-w-[44px] min-h-[44px] inline-flex items-center justify-center"
                                >
                                  {isAdding ? (
                                    <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                                      <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
                                    </svg>
                                  ) : "Add"}
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
                </Reorder.Group>
              )}
            </div>

            {/* Footer — append input + attach existing */}
            <div className="px-5 pb-5 pt-3 border-t border-border space-y-2">
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
                  className="bg-accent hover:bg-accent-hover text-white text-xs font-medium uppercase tracking-[0.05em] px-4 py-2.5 rounded-[4px] transition-all disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-accent min-w-[52px]"
                >
                  {isAdding ? (
                    <svg className="animate-spin h-4 w-4 mx-auto" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                      <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
                    </svg>
                  ) : "Add"}
                </button>
              </div>
              {onOpenTaskPicker && (
                <button
                  onClick={onOpenTaskPicker}
                  className="w-full flex items-center justify-center gap-2 py-2 text-xs text-text-muted hover:text-accent border border-dashed border-border hover:border-accent/50 rounded-[4px] transition-colors min-h-[44px]"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
                    <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
                  </svg>
                  Attach existing task
                </button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
