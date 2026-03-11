'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';
import type { Pool, PoolSubtask } from '../../types';
import { usePoolStore } from '../../store/poolStore';

const EXAMPLE_SINGLE = `{
  "name": "Learn React Native",
  "description": "Complete RN roadmap",
  "subtasks": [
    {
      "name": "Setup dev environment",
      "description": "Install Node, Expo CLI",
      "link": "https://reactnative.dev/docs/environment-setup",
      "estimatedDuration": 3
    },
    {
      "name": "Build first app",
      "estimatedDuration": 14
    }
  ]
}`;

const EXAMPLE_MULTIPLE = `[
  {
    "name": "Learn React Native",
    "subtasks": [
      { "name": "Setup environment", "estimatedDuration": 3 },
      { "name": "Build first app", "estimatedDuration": 14 }
    ]
  },
  {
    "name": "Build Portfolio",
    "description": "Personal website project",
    "subtasks": [
      { "name": "Design wireframes", "estimatedDuration": 7 },
      { "name": "Code landing page", "estimatedDuration": 10 }
    ]
  }
]`;

interface RawSubtask {
  name: string;
  description?: string;
  link?: string;
  estimatedDuration?: number;
}

interface RawPool {
  name: string;
  description?: string;
  subtasks?: RawSubtask[];
}

function validateAndBuildPools(data: unknown): { pools: Pool[]; errors: string[] } {
  const errors: string[] = [];

  // Normalize to array
  let rawPools: RawPool[];
  if (Array.isArray(data)) {
    rawPools = data;
  } else if (data && typeof data === 'object' && 'name' in data) {
    rawPools = [data as RawPool];
  } else {
    return { pools: [], errors: ['JSON must be a pool object or an array of pool objects.'] };
  }

  if (rawPools.length === 0) {
    return { pools: [], errors: ['Array is empty. Provide at least one pool.'] };
  }

  const pools: Pool[] = [];
  const now = new Date();

  for (let i = 0; i < rawPools.length; i++) {
    const raw = rawPools[i];
    const label = rawPools.length > 1 ? `Pool #${i + 1}` : 'Pool';

    if (!raw.name || typeof raw.name !== 'string' || !raw.name.trim()) {
      errors.push(`${label}: "name" is required and must be a non-empty string.`);
      continue;
    }

    const subtasks: PoolSubtask[] = [];
    if (raw.subtasks && Array.isArray(raw.subtasks)) {
      for (let j = 0; j < raw.subtasks.length; j++) {
        const rs = raw.subtasks[j];
        if (!rs.name || typeof rs.name !== 'string' || !rs.name.trim()) {
          errors.push(`${label}, subtask #${j + 1}: "name" is required.`);
          continue;
        }
        subtasks.push({
          id: uuidv4(),
          name: rs.name.trim(),
          description: rs.description?.trim() || undefined,
          link: rs.link?.trim() || undefined,
          estimatedDuration: typeof rs.estimatedDuration === 'number' && rs.estimatedDuration >= 1
            ? Math.round(rs.estimatedDuration)
            : 7,
          order: subtasks.length,
          status: subtasks.length === 0 ? 'active' : 'pending',
          activatedAt: subtasks.length === 0 ? now : undefined,
        });
      }
    }

    pools.push({
      id: uuidv4(),
      name: raw.name.trim(),
      description: raw.description?.trim() || undefined,
      subtasks,
      createdAt: now,
      updatedAt: now,
    });
  }

  return { pools, errors };
}

export function PoolJsonImport() {
  const [isOpen, setIsOpen] = useState(false);
  const [jsonText, setJsonText] = useState('');
  const [showFormat, setShowFormat] = useState(false);
  const [formatTab, setFormatTab] = useState<'single' | 'multiple'>('single');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [copied, setCopied] = useState(false);

  const importPools = usePoolStore((state) => state.importPools);

  const handleImport = async () => {
    if (!jsonText.trim()) {
      setMessage({ type: 'error', text: 'Please paste JSON data first.' });
      return;
    }

    setIsImporting(true);
    setMessage(null);

    try {
      const parsed = JSON.parse(jsonText);
      const { pools, errors } = validateAndBuildPools(parsed);

      if (pools.length === 0) {
        setMessage({ type: 'error', text: errors.join('\n') || 'No valid pools found in JSON.' });
        setIsImporting(false);
        return;
      }

      await importPools(pools);

      const subtaskCount = pools.reduce((sum, p) => sum + p.subtasks.length, 0);
      const warningText = errors.length > 0 ? ` (${errors.length} warning${errors.length > 1 ? 's' : ''} skipped)` : '';
      setMessage({
        type: 'success',
        text: `Imported ${pools.length} pool${pools.length > 1 ? 's' : ''} with ${subtaskCount} subtask${subtaskCount !== 1 ? 's' : ''}${warningText}`,
      });
      setJsonText('');
      setTimeout(() => {
        setIsOpen(false);
        setMessage(null);
      }, 1500);
    } catch {
      setMessage({ type: 'error', text: 'Invalid JSON. Please check the format and try again.' });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="btn-ghost w-full flex items-center justify-center gap-2"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        IMPORT FROM JSON
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
              className="card max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="heading-display heading-sub text-[var(--text-primary)]">
                  Import Pool from JSON
                </h3>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    setMessage(null);
                    setJsonText('');
                  }}
                  className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              <p className="text-sm text-[var(--text-secondary)] mb-3">
                Paste a single pool object or an array of pools. The first subtask in each pool will be automatically set as active.
              </p>

              {/* Format reference toggle */}
              <button
                onClick={() => setShowFormat(!showFormat)}
                className="flex items-center gap-2 text-sm text-[var(--accent)] hover:underline mb-3 self-start"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className={`transition-transform ${showFormat ? 'rotate-90' : ''}`}
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
                {showFormat ? 'Hide' : 'Show'} expected JSON format
              </button>

              <AnimatePresence>
                {showFormat && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-4 overflow-hidden"
                  >
                    {/* Tabs */}
                    <div className="flex gap-1 mb-2">
                      <button
                        onClick={() => { setFormatTab('single'); setCopied(false); }}
                        className={`px-3 py-1.5 text-xs font-medium uppercase tracking-wider rounded transition-colors ${
                          formatTab === 'single'
                            ? 'bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/30'
                            : 'text-[var(--text-muted)] border border-[var(--border-color)] hover:text-[var(--text-secondary)]'
                        }`}
                      >
                        Single Pool
                      </button>
                      <button
                        onClick={() => { setFormatTab('multiple'); setCopied(false); }}
                        className={`px-3 py-1.5 text-xs font-medium uppercase tracking-wider rounded transition-colors ${
                          formatTab === 'multiple'
                            ? 'bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/30'
                            : 'text-[var(--text-muted)] border border-[var(--border-color)] hover:text-[var(--text-secondary)]'
                        }`}
                      >
                        Multiple Pools
                      </button>
                    </div>

                    <div className="relative">
                      <pre className="p-3 pr-10 rounded border border-[var(--border-color)] bg-[var(--bg-secondary)] text-xs text-[var(--text-secondary)] overflow-x-auto max-h-48 overflow-y-auto font-mono">
                        {formatTab === 'single' ? EXAMPLE_SINGLE : EXAMPLE_MULTIPLE}
                      </pre>
                      <button
                        onClick={async () => {
                          await navigator.clipboard.writeText(formatTab === 'single' ? EXAMPLE_SINGLE : EXAMPLE_MULTIPLE);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 1500);
                        }}
                        className="absolute top-2 right-2 p-1.5 rounded border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition-colors"
                        title="Copy to clipboard"
                      >
                        {copied ? (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        ) : (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                          </svg>
                        )}
                      </button>
                    </div>

                    <div className="mt-2 space-y-1">
                      <p className="text-xs text-[var(--text-muted)]">
                        <strong className="text-[var(--text-secondary)]">Required:</strong> <code className="text-[var(--accent)]">name</code> (string) for each pool and subtask
                      </p>
                      <p className="text-xs text-[var(--text-muted)]">
                        <strong className="text-[var(--text-secondary)]">Optional:</strong> <code className="text-[var(--accent)]">description</code> (string), <code className="text-[var(--accent)]">link</code> (URL string), <code className="text-[var(--accent)]">estimatedDuration</code> (days, default 7)
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Message */}
              {message && (
                <div
                  className={`p-3 rounded border mb-3 text-sm whitespace-pre-line ${
                    message.type === 'success'
                      ? 'border-[var(--success)]/30 bg-[var(--success)]/10 text-[var(--success)]'
                      : 'border-[var(--error)]/30 bg-[var(--error)]/10 text-[var(--error)]'
                  }`}
                >
                  {message.text}
                </div>
              )}

              {/* Textarea */}
              <textarea
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
                placeholder='Paste JSON here... e.g. { "name": "My Pool", "subtasks": [...] }'
                className="input flex-1 min-h-[180px] resize-none font-mono text-sm"
              />

              {/* Actions */}
              <div className="flex justify-end gap-3 mt-4">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    setMessage(null);
                    setJsonText('');
                  }}
                  className="btn-ghost"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImport}
                  disabled={isImporting || !jsonText.trim()}
                  className="btn-accent"
                >
                  {isImporting ? 'Importing...' : 'Import'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
