'use client';

import { CapacityConfig } from './CapacityConfig';
import { WeekConfig } from './WeekConfig';
import { DataManagement } from './DataManagement';
import { useSettingsStore } from '../../store/settingsStore';

export function SettingsPanel() {
  const resetToDefaults = useSettingsStore((state) => state.resetToDefaults);

  return (
    <div className="space-y-12">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="heading-display heading-section text-[var(--text-primary)]">
            Settings
          </h2>
          <p className="mt-1 text-[var(--text-secondary)]">
            Configure your weekly preferences and task capacity
          </p>
        </div>
      </div>

      <div className="divider" />

      <CapacityConfig />

      <div className="divider" />

      <WeekConfig />

      <div className="divider" />

      <DataManagement />

      <div className="divider" />

      <div className="space-y-4">
        <div>
          <h3 className="heading-display heading-sub text-[var(--text-primary)]">
            Reset Settings
          </h3>
          <p className="mt-1 text-[var(--text-secondary)]">
            Restore all settings to their default values.
          </p>
        </div>
        <button onClick={resetToDefaults} className="btn-ghost">
          Reset to Defaults
        </button>
      </div>
    </div>
  );
}
