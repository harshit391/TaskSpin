"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Task } from "@/types/task";
import { DAY_SHORT } from "@/lib/recurrence";

const RECURRENCE_OPTIONS = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "custom", label: "Custom" },
];

type CustomMode = "interval" | "weekdays";

interface RecurrencePickerProps {
  task: Task;
  onSave: (recurrenceType: string, recurrenceDays: number | undefined, startDate: string | null, weekdays: string | null) => void;
  onRemove: () => void;
}

export default function RecurrencePicker({ task, onSave, onRemove }: RecurrencePickerProps) {
  const [selectedType, setSelectedType] = useState<string | null>(task.recurrenceType);
  const [customMode, setCustomMode] = useState<CustomMode>(task.recurrenceWeekdays ? "weekdays" : "interval");
  const [customDays, setCustomDays] = useState(task.recurrenceDays ?? 7);
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>(
    task.recurrenceWeekdays ? task.recurrenceWeekdays.split(",").map(Number) : []
  );
  const [startDate, setStartDate] = useState(task.recurrenceStartDate ? task.recurrenceStartDate.split("T")[0] : "");

  const toggleWeekday = (day: number) => {
    setSelectedWeekdays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  };

  const canSave =
    selectedType !== null &&
    !(selectedType === "custom" && customMode === "weekdays" && selectedWeekdays.length === 0);

  const handleSave = () => {
    if (!selectedType || !canSave) return;
    const sd = startDate || null;
    if (selectedType !== "custom") {
      onSave(selectedType, undefined, sd, null);
    } else if (customMode === "interval") {
      onSave("custom", customDays, sd, null);
    } else {
      onSave("custom", undefined, sd, [...selectedWeekdays].sort((a, b) => a - b).join(","));
    }
  };

  return (
    <div onClick={(e) => e.stopPropagation()}>
      {/* Step 1: frequency options */}
      {RECURRENCE_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => setSelectedType(opt.value)}
          className={`w-full flex items-center gap-2 px-3 min-h-[44px] text-xs text-left transition-colors hover:bg-bg-hover ${
            selectedType === opt.value ? "text-accent bg-bg-hover/40" : "text-text-secondary"
          }`}
        >
          <span className="flex-1">{opt.label}</span>
          {selectedType === opt.value && (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          )}
        </button>
      ))}

      <AnimatePresence initial={false}>
        {selectedType && (
          <motion.div
            key="config"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="border-t border-border"
          >
            {/* Step 2 (custom only): mode radios */}
            {selectedType === "custom" && (
              <div className="px-3 py-1.5 border-b border-border" role="radiogroup" aria-label="Custom recurrence mode">
                {([
                  { value: "interval", label: "Every N days" },
                  { value: "weekdays", label: "On specific days" },
                ] as const).map((mode) => (
                  <button
                    key={mode.value}
                    role="radio"
                    aria-checked={customMode === mode.value}
                    onClick={() => setCustomMode(mode.value)}
                    className="w-full flex items-center gap-2.5 min-h-[40px] text-xs text-left text-text-secondary"
                  >
                    <span
                      className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 transition-colors ${
                        customMode === mode.value ? "border-accent" : "border-border"
                      }`}
                    >
                      {customMode === mode.value && <span className="w-2 h-2 rounded-full bg-accent" />}
                    </span>
                    <span className={customMode === mode.value ? "text-text-primary" : ""}>{mode.label}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Step 3 (custom): interval input or weekday list */}
            {selectedType === "custom" && customMode === "interval" && (
              <div className="px-3 py-2.5 border-b border-border flex items-center gap-2">
                <span className="text-[11px] text-text-muted">Every</span>
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={customDays}
                  onChange={(e) => setCustomDays(Math.max(1, Math.min(365, Number(e.target.value) || 1)))}
                  className="w-14 h-9 text-center text-xs bg-bg-primary border border-border rounded-[3px] px-1 text-text-primary focus:outline-none focus:border-accent"
                />
                <span className="text-[11px] text-text-muted">days</span>
              </div>
            )}

            {selectedType === "custom" && customMode === "weekdays" && (
              <div className="px-3 py-2.5 border-b border-border">
                <div className="flex gap-1 justify-between">
                  {DAY_SHORT.map((label, i) => (
                    <button
                      key={i}
                      onClick={() => toggleWeekday(i)}
                      aria-pressed={selectedWeekdays.includes(i)}
                      className={`w-8 h-8 rounded-full text-[11px] font-medium transition-all ${
                        selectedWeekdays.includes(i)
                          ? "bg-accent text-white"
                          : "bg-bg-secondary border border-border text-text-muted hover:border-accent"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {selectedWeekdays.length === 0 && (
                  <p className="text-[10px] text-text-muted mt-1.5">Select at least one day</p>
                )}
              </div>
            )}

            {/* From date */}
            <div className="px-3 py-2.5 flex items-center gap-2">
              <span className="text-[11px] text-text-muted">From</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="flex-1 min-w-0 h-9 text-xs bg-bg-primary border border-border rounded-[3px] px-2 text-text-primary focus:outline-none focus:border-accent [color-scheme:dark]"
              />
              {startDate && (
                <button
                  onClick={() => setStartDate("")}
                  className="text-[10px] text-text-muted hover:text-text-secondary min-h-[36px] px-1"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Set */}
            <div className="px-3 pb-3">
              <button
                onClick={handleSave}
                disabled={!canSave}
                className="w-full min-h-[40px] rounded-[3px] text-xs font-semibold transition-colors bg-accent text-white hover:bg-accent-hover disabled:bg-bg-secondary disabled:text-text-muted disabled:cursor-not-allowed"
              >
                Set
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {task.recurrenceType && (
        <button
          onClick={onRemove}
          className="w-full flex items-center gap-2 px-3 min-h-[40px] text-xs text-left transition-colors hover:bg-bg-hover text-error border-t border-border"
        >
          Remove recurrence
        </button>
      )}
    </div>
  );
}
