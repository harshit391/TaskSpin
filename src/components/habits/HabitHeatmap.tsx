"use client";

import { HabitCheckin } from "@/types/habit";

interface HabitHeatmapProps {
  checkins: HabitCheckin[];
  days?: number;
}

export function HabitHeatmap({ checkins, days = 30 }: HabitHeatmapProps) {
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
        <div
          key={cell.date}
          title={cell.date}
          className={`w-[10px] h-[10px] rounded-[2px] transition-colors ${
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
