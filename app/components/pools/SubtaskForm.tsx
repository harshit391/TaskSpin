'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { usePoolStore } from '../../store/poolStore';

const subtaskSchema = z.object({
  name: z.string().min(1, 'Subtask name is required').max(100, 'Name is too long'),
  description: z.string().max(500, 'Description is too long').optional(),
  link: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  estimatedDuration: z.number().min(1).max(365),
});

type SubtaskFormData = z.infer<typeof subtaskSchema>;

interface SubtaskFormProps {
  poolId: string;
  onSuccess?: () => void;
  onCancel: () => void;
}

export function SubtaskForm({ poolId, onSuccess, onCancel }: SubtaskFormProps) {
  const addSubtask = usePoolStore((state) => state.addSubtask);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SubtaskFormData>({
    resolver: zodResolver(subtaskSchema),
    defaultValues: {
      name: '',
      description: '',
      link: '',
      estimatedDuration: 7,
    },
  });

  const onSubmit = async (data: SubtaskFormData) => {
    await addSubtask(
      poolId,
      data.name,
      data.description || undefined,
      data.link || undefined,
      data.estimatedDuration
    );
    onSuccess?.();
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      onSubmit={handleSubmit(onSubmit)}
      className="card space-y-4 border-accent/30"
    >
      <div>
        <label className="label">Subtask Name</label>
        <input
          {...register('name')}
          type="text"
          placeholder="Enter subtask name..."
          className="input"
          autoFocus
        />
        {errors.name && (
          <p className="mt-1 text-sm text-(--error)">{errors.name.message}</p>
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
          <p className="mt-1 text-sm text-(--error)">{errors.link.message}</p>
        )}
      </div>

      <div>
        <label className="label">Estimated Duration (days)</label>
        <input
          {...register('estimatedDuration', { valueAsNumber: true })}
          type="number"
          min={1}
          max={365}
          className="input w-24"
        />
        <p className="mt-1 text-xs text-(--text-muted)">
          How many days this subtask may take
        </p>
      </div>

      <div className="flex gap-3 pt-1">
        <button type="button" onClick={onCancel} className="btn-ghost flex-1">
          Cancel
        </button>
        <button type="submit" disabled={isSubmitting} className="btn-accent flex-1">
          {isSubmitting ? 'Adding...' : 'Add Subtask'}
        </button>
      </div>
    </motion.form>
  );
}
