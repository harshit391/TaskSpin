'use client';

import { motion } from 'framer-motion';
import { useSettingsStore } from '../../store/settingsStore';
import { DAYS_OF_WEEK, DAY_LABELS, type DayOfWeek } from '../../types';

const DAY_FULL_NAMES: Record<DayOfWeek, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
};

export function CapacityConfig() {
  const settings = useSettingsStore((state) => state.settings);
  const updateDayCapacity = useSettingsStore((state) => state.updateDayCapacity);

  const totalCapacity = DAYS_OF_WEEK.reduce(
    (sum, day) => sum + settings.weeklyCapacity[day],
    0
  );

  return (
    <div className="space-y-6">
      <div>
        <h3 className="heading-display heading-sub text-foreground">
          Daily Task Capacity
        </h3>
        <p className="mt-1 text-(--text-secondary)">
          Set how many randomized tasks you can handle each day. Daily tasks are always scheduled regardless of capacity. Total weekly capacity: {totalCapacity} tasks.
        </p>
      </div>

      <div className="grid gap-4">
        {DAYS_OF_WEEK.map((day, index) => {
          const capacity = settings.weeklyCapacity[day];
          const isWeekend = day === 'saturday' || day === 'sunday';

          return (
            <motion.div
              key={day}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="card flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3">
                <span
                  className={`w-10 text-xs font-medium uppercase tracking-wider ${
                    isWeekend ? 'text-accent' : 'text-(--text-muted)'
                  }`}
                >
                  {DAY_LABELS[day]}
                </span>
                <span className="text-foreground font-medium">
                  {DAY_FULL_NAMES[day]}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => updateDayCapacity(day, capacity - 1)}
                  disabled={capacity <= 0}
                  className="w-8 h-8 flex items-center justify-center rounded border border-(--border-color) text-(--text-muted) hover:text-foreground hover:border-(--text-muted) disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </button>

                <div className="w-12 text-center">
                  <span className="text-xl font-semibold text-foreground">
                    {capacity}
                  </span>
                </div>

                <button
                  onClick={() => updateDayCapacity(day, capacity + 1)}
                  disabled={capacity >= 20}
                  className="w-8 h-8 flex items-center justify-center rounded border border-(--border-color) text-(--text-muted) hover:text-foreground hover:border-(--text-muted) disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Visual capacity bar */}
      <div className="card bg-(--bg-secondary)">
        <p className="text-xs text-(--text-muted) uppercase tracking-wider mb-3">
          Weekly Distribution
        </p>
        <div className="flex items-end gap-1 h-20">
          {DAYS_OF_WEEK.map((day) => {
            const capacity = settings.weeklyCapacity[day];
            const maxCapacity = Math.max(...Object.values(settings.weeklyCapacity), 1);
            const heightPercent = (capacity / maxCapacity) * 100;

            return (
              <div key={day} className="flex-1 flex flex-col items-center gap-1">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${heightPercent}%` }}
                  className="w-full bg-accent rounded-t min-h-1"
                  style={{ maxHeight: '100%' }}
                />
                <span className="text-[10px] text-(--text-muted)">
                  {DAY_LABELS[day]}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
