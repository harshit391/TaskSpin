"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";

const PRESET_COLORS = [
  "#FF2D6F", "#8B5CF6", "#3B82F6", "#10B981", "#F59E0B",
  "#EF4444", "#6366F1", "#EC4899", "#14B8A6", "#F97316",
  "#06B6D4", "#84CC16", "#A855F7", "#0EA5E9", "#D946EF",
  "#22C55E", "#E11D48", "#7C3AED", "#0891B2", "#CA8A04",
  "#DC2626", "#4F46E5", "#DB2777", "#059669", "#EA580C",
];

interface ProjectFormProps {
  onSubmit: (name: string, color: string) => void;
  isLoading?: boolean;
}

function randomColor() {
  return PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)];
}

export function ProjectForm({ onSubmit, isLoading }: ProjectFormProps) {
  const [name, setName] = useState("");
  const [color] = useState(randomColor);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onSubmit(trimmed, color);
    setName("");
  };

  return (
    <motion.form
      ref={formRef}
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

      {/* Color preview */}
      <div className="flex items-center gap-2">
        <span
          className="w-4 h-4 rounded-full"
          style={{ backgroundColor: color }}
        />
        <span className="text-[11px] text-text-muted">Auto-assigned color</span>
      </div>

      {/* Actions */}
      <button
        type="submit"
        disabled={!name.trim() || isLoading}
        className="w-full bg-accent hover:bg-accent-hover text-white text-xs font-medium uppercase tracking-[0.05em] px-3 py-2 rounded-[4px] transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        Create
      </button>
    </motion.form>
  );
}
