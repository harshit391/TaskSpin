"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/useToast";

export function ToastProvider() {
  const { toasts, subscribe, dismiss } = useToast();

  useEffect(() => {
    return subscribe();
  }, [subscribe]);

  const borderColors = {
    success: "border-l-success",
    error: "border-l-error",
    info: "border-l-accent",
  };

  const iconColors = {
    success: "text-success",
    error: "text-error",
    info: "text-accent",
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 80, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 80, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={`flex items-center gap-3 min-w-[280px] max-w-[380px] bg-bg-card border border-border rounded-sm p-3 border-l-4 ${borderColors[toast.type]}`}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className={iconColors[toast.type]}
              aria-hidden="true"
            >
              {toast.type === "success" && (
                <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
              )}
              {toast.type === "error" && (
                <>
                  <circle cx="12" cy="12" r="10" />
                  <path d="M15 9l-6 6M9 9l6 6" strokeLinecap="round" />
                </>
              )}
              {toast.type === "info" && (
                <>
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 16v-4M12 8h.01" strokeLinecap="round" />
                </>
              )}
            </svg>
            <span className="text-sm text-text-primary flex-1">{toast.message}</span>
            <button
              onClick={() => dismiss(toast.id)}
              className="text-text-muted hover:text-text-primary transition-colors min-w-[44px] min-h-[44px] inline-flex items-center justify-center"
              aria-label="Dismiss notification"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
              </svg>
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
