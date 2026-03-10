'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-[var(--border-color)] bg-[var(--bg-primary)]/90 backdrop-blur-sm">
      <div className="w-[92%] sm:w-[88%] md:w-[85%] lg:w-[82%] max-w-6xl mx-auto py-4 flex items-center justify-between">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3"
        >
          <Image
            src="/logo.png"
            alt="TaskSpin Logo"
            width={32}
            height={32}
            className="rounded"
          />
          <h1 className="heading-display heading-sub text-[var(--text-primary)]">
            TaskSpin
          </h1>
        </motion.div>
      </div>
    </header>
  );
}
