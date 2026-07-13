"use client";

import { useState } from "react";
import { motion } from "framer-motion";

const PRESET_COLORS = [
  "#FF2D6F",
  "#8B5CF6",
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#6366F1",
  "#EC4899",
];

interface ProjectFormProps {
  onSubmit: (name: string, color: string) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ProjectForm({ onSubmit, onCancel, isLoading }: ProjectFormProps) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(PRESET_COLORS[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onSubmit(trimmed, color);
    setName("");
  };

  return (
    <motion.form
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      onSubmit={handleSubmit}
      className="overflow-hidden space-y-3 p-3 bg-bg-card border border-border rounded-[2px]"
    >
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Project name..."
        autoFocus
        className="w-full bg-bg-secondary border border-border rounded-[4px] px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus-visible:border-accent focus-visible:shadow-[0_0_0_2px_var(--color-accent-glow)]"
      />

      {/* Color picker */}
      <div className="flex gap-2 flex-wrap">
        {PRESET_COLORS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setColor(c)}
            className={`w-6 h-6 rounded-full transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
              color === c ? "ring-2 ring-white scale-110" : "opacity-60 hover:opacity-100"
            }`}
            style={{ backgroundColor: c }}
            aria-label={`Select color ${c}`}
          />
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={!name.trim() || isLoading}
          className="flex-1 bg-accent hover:bg-accent-hover text-white text-xs font-medium uppercase tracking-[0.05em] px-3 py-2 rounded-[4px] transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          Create
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-2 text-xs font-medium uppercase tracking-[0.05em] text-text-muted hover:text-text-primary border border-border hover:border-text-muted rounded-[4px] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          Cancel
        </button>
      </div>
    </motion.form>
  );
}
