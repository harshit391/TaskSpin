'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { useTaskStore } from '../../store/taskStore';
import type { FrequencyType, DayOfWeek } from '../../types';
import { FREQUENCY_OPTIONS, DAYS_OF_WEEK, DAY_LABELS } from '../../types';

const taskSchema = z.object({
  name: z.string().min(1, 'Task name is required').max(100, 'Task name is too long'),
  description: z.string().max(500, 'Description is too long').optional(),
  link: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  frequencyType: z.enum(['daily', 'once', 'twice', 'thrice', 'custom', 'one-time'] as const),
  customCount: z.number().min(1).max(7).optional(),
});

type TaskFormData = z.infer<typeof taskSchema>;

interface TaskFormProps {
  onSuccess?: () => void;
}

export function TaskForm({ onSuccess }: TaskFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [useFixedDays, setUseFixedDays] = useState(false);
  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>([]);
  const addTask = useTaskStore((state) => state.addTask);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      name: '',
      description: '',
      link: '',
      frequencyType: 'once',
      customCount: 4,
    },
  });

  const frequencyType = watch('frequencyType');
  const customCount = watch('customCount');

  // Calculate max selectable days based on frequency
  const getMaxDays = (): number => {
    if (frequencyType === 'custom') return customCount || 4;
    const option = FREQUENCY_OPTIONS.find(f => f.type === frequencyType);
    return option?.count || 1;
  };

  const maxDays = getMaxDays();

  const handleDayToggle = (day: DayOfWeek) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter(d => d !== day));
    } else if (selectedDays.length < maxDays) {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const onSubmit = async (data: TaskFormData) => {
    const frequencyCount =
      data.frequencyType === 'custom'
        ? data.customCount || 4
        : FREQUENCY_OPTIONS.find((f) => f.type === data.frequencyType)?.count || 1;

    const fixedDays = useFixedDays && selectedDays.length > 0 ? selectedDays : undefined;

    await addTask(data.name, data.description || '', data.frequencyType, frequencyCount, data.link || undefined, fixedDays);

    reset();
    setUseFixedDays(false);
    setSelectedDays([]);
    setIsOpen(false);
    onSuccess?.();
  };

  return (
    <div>
      <AnimatePresence>
        {!isOpen ? (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            onClick={() => setIsOpen(true)}
            className="btn-accent w-full flex items-center justify-center gap-2"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 5v14" />
              <path d="M5 12h14" />
            </svg>
            ADD TASK
          </motion.button>
        ) : (
          <motion.form
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            onSubmit={handleSubmit(onSubmit)}
            className="card space-y-5"
          >
            <div>
              <label className="label">Task Name</label>
              <input
                {...register('name')}
                type="text"
                placeholder="Enter task name..."
                className="input"
                autoFocus
              />
              {errors.name && (
                <p className="mt-2 text-sm text-[var(--error)]">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="label">Description (Optional)</label>
              <textarea
                {...register('description')}
                placeholder="Add a description..."
                rows={2}
                className="input resize-none"
              />
              {errors.description && (
                <p className="mt-2 text-sm text-[var(--error)]">{errors.description.message}</p>
              )}
            </div>

            <div>
              <label className="label">Link (Optional)</label>
              <input
                {...register('link')}
                type="url"
                placeholder="https://example.com"
                className="input"
              />
              {errors.link && (
                <p className="mt-2 text-sm text-[var(--error)]">{errors.link.message}</p>
              )}
            </div>

            <div>
              <label className="label">Frequency</label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                {FREQUENCY_OPTIONS.map((option) => (
                  <label
                    key={option.type}
                    className={`flex items-center justify-center px-3 py-2 text-xs font-medium uppercase tracking-wider border rounded cursor-pointer transition-all ${
                      frequencyType === option.type
                        ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]'
                        : 'border-[var(--border-color)] text-[var(--text-muted)] hover:border-[var(--text-muted)]'
                    }`}
                  >
                    <input
                      {...register('frequencyType')}
                      type="radio"
                      value={option.type}
                      className="sr-only"
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </div>

            <AnimatePresence>
              {frequencyType === 'custom' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <label className="label">Times per week</label>
                  <input
                    {...register('customCount', { valueAsNumber: true })}
                    type="number"
                    min={1}
                    max={7}
                    className="input w-24"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Fixed Days Toggle */}
            <AnimatePresence>
              {frequencyType !== 'daily' && frequencyType !== 'one-time' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3"
                >
                  <label className="flex items-center gap-3 cursor-pointer">
                    <div
                      onClick={() => setUseFixedDays(!useFixedDays)}
                      className={`w-10 h-6 rounded-full transition-colors relative ${
                        useFixedDays ? 'bg-[var(--accent)]' : 'bg-[var(--bg-secondary)] border border-[var(--border-color)]'
                      }`}
                    >
                      <motion.div
                        animate={{ x: useFixedDays ? 18 : 2 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        className={`absolute top-1 w-4 h-4 rounded-full ${
                          useFixedDays ? 'bg-white' : 'bg-[var(--text-muted)]'
                        }`}
                      />
                    </div>
                    <span className="text-sm text-[var(--text-secondary)]">
                      Fix to specific days
                    </span>
                  </label>

                  <AnimatePresence>
                    {useFixedDays && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <p className="text-xs text-[var(--text-muted)] mb-2">
                          Select {maxDays} day{maxDays > 1 ? 's' : ''} ({selectedDays.length}/{maxDays} selected)
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {DAYS_OF_WEEK.map((day) => {
                            const isSelected = selectedDays.includes(day);
                            const isDisabled = !isSelected && selectedDays.length >= maxDays;
                            return (
                              <button
                                key={day}
                                type="button"
                                onClick={() => handleDayToggle(day)}
                                disabled={isDisabled}
                                className={`px-3 py-1.5 text-xs font-medium uppercase tracking-wider border rounded transition-all ${
                                  isSelected
                                    ? 'border-[var(--accent)] bg-[var(--accent)] text-white'
                                    : isDisabled
                                    ? 'border-[var(--border-color)] text-[var(--text-muted)] opacity-40 cursor-not-allowed'
                                    : 'border-[var(--border-color)] text-[var(--text-muted)] hover:border-[var(--text-muted)]'
                                }`}
                              >
                                {DAY_LABELS[day]}
                              </button>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  reset();
                  setUseFixedDays(false);
                  setSelectedDays([]);
                  setIsOpen(false);
                }}
                className="btn-ghost flex-1"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-accent flex-1"
              >
                {isSubmitting ? 'Adding...' : 'Add Task'}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
