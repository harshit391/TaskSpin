"use client";

import { HabitCheckin } from "@/types/habit";

interface HabitHeatmapProps {
  checkins: HabitCheckin[];
  days?: number;
  onToggle?: (date: string, isCurrentlyChecked: boolean) => void;
}

export function HabitHeatmap({ checkins, days = 30, onToggle }: HabitHeatmapProps) {
  const today = new Date();
  const checkinDates = new Set(checkins.map((c) => c.date));

  const cells: { date: string; checked: boolean; isToday: boolean }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = new Intl.DateTimeFormat("en-CA").format(d);
    cells.push({
      date: dateStr,
      checked: checkinDates.has(dateStr),
      isToday: i === 0,
    });
  }

  return (
    <div className="flex items-center gap-[3px] flex-wrap">
      {cells.map((cell) => (
        <button
          key={cell.date}
          type="button"
          title={`${cell.date}${cell.checked ? " ✓" : ""}`}
          onClick={() => onToggle?.(cell.date, cell.checked)}
          disabled={!onToggle}
          className={`w-3 h-3 rounded-[2px] transition-colors ${
            onToggle ? "cursor-pointer hover:ring-1 hover:ring-accent/60" : ""
          } ${
            cell.checked
              ? "bg-accent"
              : cell.isToday
              ? "bg-bg-hover ring-1 ring-accent/40"
              : "bg-bg-hover"
          }`}
        />
      ))}
    </div>
  );
}
