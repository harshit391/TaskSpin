"use client";

import { useState, useCallback } from "react";

export interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

let listeners: Array<(toast: Toast) => void> = [];

export function showToast(message: string, type: Toast["type"] = "success") {
  const toast: Toast = { id: Date.now().toString(), message, type };
  listeners.forEach((fn) => fn(toast));
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Toast) => {
    setToasts((prev) => [...prev, toast]);
    const duration = toast.type === "error" ? 5000 : 3500;
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== toast.id));
    }, duration);
  }, []);

  const subscribe = useCallback(() => {
    listeners.push(addToast);
    return () => {
      listeners = listeners.filter((fn) => fn !== addToast);
    };
  }, [addToast]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, subscribe, dismiss };
}
