"use client";

import { motion } from "framer-motion";

interface HabitProgressRingProps {
  current: number;
  target: number;
  size?: number;
}

export function HabitProgressRing({ current, target, size = 48 }: HabitProgressRingProps) {
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(current / target, 1);
  const offset = circumference * (1 - progress);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-bg-hover"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ type: "spring", bounce: 0.1, duration: 0.6 }}
          className="text-accent"
        />
      </svg>
      <span className="absolute text-[10px] font-semibold text-text-primary">
        {current}/{target}
      </span>
    </div>
  );
}
