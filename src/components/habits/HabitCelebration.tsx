"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

interface HabitCelebrationProps {
  isActive: boolean;
  onComplete?: () => void;
}

const PARTICLE_COUNT = 14;
const COLORS = ["#FF2D6F", "#FF6B9D", "#FFD700", "#FFFFFF", "#FF2D6F"];

export function HabitCelebration({ isActive, onComplete }: HabitCelebrationProps) {
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; color: string; scale: number }[]>([]);

  useEffect(() => {
    if (isActive) {
      const newParticles = Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
        id: i,
        x: (Math.random() - 0.5) * 160,
        y: -(Math.random() * 80 + 20),
        color: COLORS[i % COLORS.length],
        scale: Math.random() * 0.5 + 0.5,
      }));
      setParticles(newParticles);
      const timer = setTimeout(() => {
        setParticles([]);
        onComplete?.();
      }, 900);
      return () => clearTimeout(timer);
    }
  }, [isActive, onComplete]);

  return (
    <AnimatePresence>
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ opacity: 1, x: 0, y: 0, scale: 0 }}
          animate={{ opacity: 0, x: p.x, y: p.y, scale: p.scale }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="absolute w-2 h-2 rounded-full pointer-events-none"
          style={{ backgroundColor: p.color }}
        />
      ))}
    </AnimatePresence>
  );
}
