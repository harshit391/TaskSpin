'use client';

import { motion } from 'framer-motion';
import { useSettingsStore } from '../../store/settingsStore';
import { DAYS_OF_WEEK, type DayOfWeek } from '../../types';

const DAY_FULL_NAMES: Record<DayOfWeek, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
};

export function WeekConfig() {
  const settings = useSettingsStore((state) => state.settings);
  const updateWeekConfig = useSettingsStore((state) => state.updateWeekConfig);

  const handleStartDayChange = (startDay: DayOfWeek) => {
    updateWeekConfig({ startDay });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="heading-display heading-sub text-[var(--text-primary)]">
          Week Start Day
        </h3>
        <p className="mt-1 text-[var(--text-secondary)]">
          Choose which day your week begins. This affects schedule generation and display.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {DAYS_OF_WEEK.map((day, index) => {
          const isSelected = settings.weekConfig.startDay === day;

          return (
            <motion.button
              key={day}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.03 }}
              onClick={() => handleStartDayChange(day)}
              className={`relative p-4 rounded border text-left transition-all ${
                isSelected
                  ? 'border-[var(--accent)] bg-[var(--accent)]/10'
                  : 'border-[var(--border-color)] hover:border-[var(--text-muted)] bg-[var(--bg-card)]'
              }`}
            >
              {isSelected && (
                <motion.div
                  layoutId="selectedDay"
                  className="absolute inset-0 border-2 border-[var(--accent)] rounded pointer-events-none"
                />
              )}
              <span
                className={`block text-sm font-medium ${
                  isSelected ? 'text-[var(--accent)]' : 'text-[var(--text-primary)]'
                }`}
              >
                {DAY_FULL_NAMES[day]}
              </span>
              {isSelected && (
                <span className="block mt-1 text-xs text-[var(--accent)]">
                  Week starts here
                </span>
              )}
            </motion.button>
          );
        })}
      </div>

      <div className="card bg-[var(--bg-secondary)]">
        <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-2">
          Preview
        </p>
        <p className="text-[var(--text-secondary)]">
          Your week runs from{' '}
          <span className="text-[var(--accent)] font-medium">
            {DAY_FULL_NAMES[settings.weekConfig.startDay]}
          </span>{' '}
          to{' '}
          <span className="text-[var(--accent)] font-medium">
            {DAY_FULL_NAMES[
              DAYS_OF_WEEK[
                (DAYS_OF_WEEK.indexOf(settings.weekConfig.startDay) + 6) % 7
              ]
            ]}
          </span>
        </p>
      </div>
    </div>
  );
}
