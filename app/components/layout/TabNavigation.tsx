'use client';

import { motion } from 'framer-motion';

interface Tab {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

interface TabNavigationProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export function TabNavigation({ tabs, activeTab, onTabChange }: TabNavigationProps) {
  return (
    <nav className="flex gap-1 p-1 bg-(--bg-secondary) rounded border border-(--border-color)">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`relative flex items-center gap-2 px-5 py-3 text-sm font-medium uppercase tracking-wider transition-colors rounded ${
            activeTab === tab.id
              ? 'text-foreground'
              : 'text-(--text-muted) hover:text-(--text-secondary)'
          }`}
        >
          {activeTab === tab.id && (
            <motion.div
              layoutId="activeTab"
              className="absolute inset-0 bg-(--bg-hover) rounded"
              initial={false}
              transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
            />
          )}
          <span className="relative z-10 flex items-center gap-2">
            {tab.icon}
            {tab.label}
            {tab.badge != null && tab.badge > 0 && (
              <span className="min-w-4.5 h-4.5 px-1 flex items-center justify-center text-[10px] font-bold rounded-full bg-accent text-white">
                {tab.badge}
              </span>
            )}
          </span>
        </button>
      ))}
    </nav>
  );
}
