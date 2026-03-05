'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { useTaskStore } from '../../store/taskStore';
import type { FrequencyType } from '../../types';
import { FREQUENCY_OPTIONS } from '../../types';

const taskSchema = z.object({
  name: z.string().min(1, 'Task name is required').max(100, 'Task name is too long'),
  description: z.string().max(500, 'Description is too long').optional(),
  link: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  frequencyType: z.enum(['daily', 'once', 'twice', 'thrice', 'custom'] as const),
  customCount: z.number().min(1).max(7).optional(),
});

type TaskFormData = z.infer<typeof taskSchema>;

interface TaskFormProps {
  onSuccess?: () => void;
}

export function TaskForm({ onSuccess }: TaskFormProps) {
  const [isOpen, setIsOpen] = useState(false);
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

  const onSubmit = async (data: TaskFormData) => {
    const frequencyCount =
      data.frequencyType === 'custom'
        ? data.customCount || 4
        : FREQUENCY_OPTIONS.find((f) => f.type === data.frequencyType)?.count || 1;

    await addTask(data.name, data.description || '', data.frequencyType, frequencyCount, data.link || undefined);

    reset();
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

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  reset();
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
