'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { usePoolStore } from '../../store/poolStore';

const poolSchema = z.object({
  name: z.string().min(1, 'Pool name is required').max(100, 'Pool name is too long'),
  description: z.string().max(500, 'Description is too long').optional(),
});

type PoolFormData = z.infer<typeof poolSchema>;

interface PoolFormProps {
  onSuccess?: () => void;
}

export function PoolForm({ onSuccess }: PoolFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const addPool = usePoolStore((state) => state.addPool);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PoolFormData>({
    resolver: zodResolver(poolSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  const onSubmit = async (data: PoolFormData) => {
    await addPool(data.name, data.description || undefined);
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
            CREATE POOL
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
              <label className="label">Pool Name</label>
              <input
                {...register('name')}
                type="text"
                placeholder="e.g. Learn React Native, Build Portfolio..."
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
                placeholder="Describe the big picture goal..."
                rows={2}
                className="input resize-none"
              />
              {errors.description && (
                <p className="mt-2 text-sm text-(--error)">{errors.description.message}</p>
              )}
            </div>

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
                {isSubmitting ? 'Creating...' : 'Create Pool'}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
