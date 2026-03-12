'use client';

import { useState, useRef } from 'react';
import { db } from '../../database/db';

interface ExportData {
  version: number;
  exportedAt: string;
  tasks: unknown[];
  settings: unknown;
  schedules: unknown[];
  pools?: unknown[];
  sideTasks?: unknown[];
}

export function DataManagement() {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pasteData, setPasteData] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getExportData = async (): Promise<ExportData> => {
    const tasks = await db.tasks.toArray();
    const settings = await db.settings.get('default');
    const schedules = await db.schedules.toArray();
    const pools = await db.pools.toArray();
    const sideTasks = await db.sideTasks.toArray();

    return {
      version: 4,
      exportedAt: new Date().toISOString(),
      tasks,
      settings,
      schedules,
      pools,
      sideTasks,
    };
  };

  const importData = async (data: ExportData) => {
    // Validate the data structure
    if (!data.version || !data.tasks) {
      throw new Error('Invalid backup file format');
    }

    // Clear existing data
    await db.tasks.clear();
    await db.settings.clear();
    await db.schedules.clear();
    await db.pools.clear();
    await db.sideTasks.clear();

    // Import tasks
    if (data.tasks && Array.isArray(data.tasks)) {
      await db.tasks.bulkAdd(data.tasks as never[]);
    }

    // Import settings
    if (data.settings) {
      await db.settings.put(data.settings as never);
    }

    // Import schedules
    if (data.schedules && Array.isArray(data.schedules)) {
      await db.schedules.bulkAdd(data.schedules as never[]);
    }

    // Import pools (backward compatible with v1 exports)
    if (data.pools && Array.isArray(data.pools)) {
      await db.pools.bulkAdd(data.pools as never[]);
    }

    // Import side tasks (backward compatible with older exports)
    if (data.sideTasks && Array.isArray(data.sideTasks)) {
      await db.sideTasks.bulkAdd(data.sideTasks as never[]);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    setMessage(null);

    try {
      const exportData = await getExportData();

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `taskspin-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setMessage({ type: 'success', text: 'Data exported successfully!' });
    } catch (error) {
      console.error('Export failed:', error);
      setMessage({ type: 'error', text: 'Failed to export data. Please try again.' });
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyToClipboard = async () => {
    setMessage(null);

    try {
      const exportData = await getExportData();
      await navigator.clipboard.writeText(JSON.stringify(exportData, null, 2));
      setMessage({ type: 'success', text: 'Data copied to clipboard!' });
    } catch (error) {
      console.error('Copy failed:', error);
      setMessage({ type: 'error', text: 'Failed to copy data. Please try again.' });
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setMessage(null);

    try {
      const text = await file.text();
      const data = JSON.parse(text) as ExportData;
      await importData(data);
      window.location.reload();
    } catch (error) {
      console.error('Import failed:', error);
      setMessage({ type: 'error', text: 'Failed to import data. Please check the file format.' });
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handlePasteImport = async () => {
    if (!pasteData.trim()) {
      setMessage({ type: 'error', text: 'Please paste JSON data first.' });
      return;
    }

    setIsImporting(true);
    setMessage(null);

    try {
      const data = JSON.parse(pasteData) as ExportData;
      await importData(data);
      setShowPasteModal(false);
      setPasteData('');
      window.location.reload();
    } catch (error) {
      console.error('Import failed:', error);
      setMessage({ type: 'error', text: 'Failed to import data. Please check the JSON format.' });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="heading-display heading-sub text-foreground">
          Data Management
        </h3>
        <p className="mt-1 text-(--text-secondary)">
          Export your data as a backup or import from a previous backup.
        </p>
      </div>

      {message && (
        <div
          className={`p-3 rounded border ${
            message.type === 'success'
              ? 'border-(--success)/30 bg-(--success)/10 text-(--success)'
              : 'border-(--error)/30 bg-(--error)/10 text-(--error)'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="space-y-3">
        <p className="text-xs text-(--text-muted) uppercase tracking-wider">Export</p>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="btn-ghost flex items-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            {isExporting ? 'Exporting...' : 'Download File'}
          </button>

          <button
            onClick={handleCopyToClipboard}
            className="btn-ghost flex items-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
            Copy to Clipboard
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-xs text-(--text-muted) uppercase tracking-wider">Import</p>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleImportClick}
            disabled={isImporting}
            className="btn-ghost flex items-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            {isImporting ? 'Importing...' : 'Upload File'}
          </button>

          <button
            onClick={() => setShowPasteModal(true)}
            className="btn-ghost flex items-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
              <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
            </svg>
            Paste JSON
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      </div>

      <p className="text-xs text-(--text-muted)">
        Note: Importing will replace all existing data. Make sure to export a backup first.
      </p>

      {/* Paste Modal */}
      {showPasteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card max-w-lg w-full max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-foreground">
                Paste JSON Data
              </h3>
              <button
                onClick={() => {
                  setShowPasteModal(false);
                  setPasteData('');
                  setMessage(null);
                }}
                className="p-1 text-(--text-muted) hover:text-foreground"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {message && (
              <div
                className={`p-3 rounded border mb-4 ${
                  message.type === 'success'
                    ? 'border-(--success)/30 bg-(--success)/10 text-(--success)'
                    : 'border-(--error)/30 bg-(--error)/10 text-(--error)'
                }`}
              >
                {message.text}
              </div>
            )}

            <textarea
              value={pasteData}
              onChange={(e) => setPasteData(e.target.value)}
              placeholder="Paste your JSON data here..."
              className="input flex-1 min-h-50 resize-none font-mono text-sm"
            />

            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => {
                  setShowPasteModal(false);
                  setPasteData('');
                  setMessage(null);
                }}
                className="btn-ghost"
              >
                Cancel
              </button>
              <button
                onClick={handlePasteImport}
                disabled={isImporting || !pasteData.trim()}
                className="btn-accent"
              >
                {isImporting ? 'Importing...' : 'Import'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
