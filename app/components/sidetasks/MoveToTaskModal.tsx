'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { useTaskStore } from '../../store/taskStore';
import { useSideTaskStore } from '../../store/sideTaskStore';
import type { SideTask, FrequencyType, DayOfWeek } from '../../types';
import { FREQUENCY_OPTIONS, DAYS_OF_WEEK, DAY_LABELS } from '../../types';

const taskSchema = z.object({
  name: z.string().min(1, 'Task name is required').max(100, 'Task name is too long'),
  description: z.string().max(500, 'Description is too long').optional(),
  link: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  frequencyType: z.enum(['daily', 'once', 'twice', 'thrice', 'custom', 'one-time'] as const),
  customCount: z.number().min(1).max(7).optional(),
});

type TaskFormData = z.infer<typeof taskSchema>;

interface MoveToTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  sideTask: SideTask;
}

export function MoveToTaskModal({ isOpen, onClose, sideTask }: MoveToTaskModalProps) {
  const [useFixedDays, setUseFixedDays] = useState(false);
  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>([]);
  const addTask = useTaskStore((state) => state.addTask);
  const deleteSideTask = useSideTaskStore((state) => state.deleteSideTask);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      name: sideTask.name,
      description: sideTask.description || '',
      link: sideTask.link || '',
      frequencyType: 'once',
      customCount: 4,
    },
  });

  // Reset form when modal opens with new side task data
  useEffect(() => {
    if (isOpen) {
      reset({
        name: sideTask.name,
        description: sideTask.description || '',
        link: sideTask.link || '',
        frequencyType: 'once',
        customCount: 4,
      });
      setUseFixedDays(false);
      setSelectedDays([]);
    }
  }, [isOpen, sideTask, reset]);

  const frequencyType = watch('frequencyType');
  const customCount = watch('customCount');

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
    await deleteSideTask(sideTask.id);

    onClose();
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full max-w-lg bg-(--bg-card) border border-(--border-color) rounded-lg shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-(--border-color)">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Move to Main Tasks</h2>
                  <p className="mt-1 text-sm text-(--text-muted)">Configure frequency and add as a recurring task</p>
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 text-(--text-muted) hover:text-foreground hover:bg-(--bg-hover) rounded transition-colors shrink-0"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
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
                    <p className="mt-2 text-sm text-(--error)">{errors.name.message}</p>
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
                    <p className="mt-2 text-sm text-(--error)">{errors.description.message}</p>
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
                    <p className="mt-2 text-sm text-(--error)">{errors.link.message}</p>
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
                            ? 'border-accent bg-accent/10 text-accent'
                            : 'border-(--border-color) text-(--text-muted) hover:border-(--text-muted)'
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
                            useFixedDays ? 'bg-accent' : 'bg-(--bg-secondary) border border-(--border-color)'
                          }`}
                        >
                          <motion.div
                            animate={{ x: useFixedDays ? 18 : 2 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                            className={`absolute top-1 w-4 h-4 rounded-full ${
                              useFixedDays ? 'bg-white' : 'bg-(--text-muted)'
                            }`}
                          />
                        </div>
                        <span className="text-sm text-(--text-secondary)">
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
                            <p className="text-xs text-(--text-muted) mb-2">
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
                                        ? 'border-accent bg-accent text-white'
                                        : isDisabled
                                        ? 'border-(--border-color) text-(--text-muted) opacity-40 cursor-not-allowed'
                                        : 'border-(--border-color) text-(--text-muted) hover:border-(--text-muted)'
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

                {/* Footer Actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="btn-ghost flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-accent flex-1"
                  >
                    {isSubmitting ? 'Moving...' : 'Move to Tasks'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
