import { useEffect, useState, type ReactNode } from "react";
import type { ToastActionElement } from "@/components/ui/toast";

type ToastVariant = "default" | "destructive";

export type Toast = {
  id: string;
  title?: ReactNode;
  description?: ReactNode;
  action?: ToastActionElement;
  variant?: ToastVariant;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  duration?: number;
  // Allow passing through additional Radix Toast.Root props if needed
  [key: string]: any;
};

type ToastInput = Omit<Toast, "id" | "open" | "onOpenChange">;

const listeners = new Set<(toasts: Toast[]) => void>();
let memoryToasts: Toast[] = [];

function notify() {
  for (const l of listeners) l(memoryToasts);
}

function removeToast(id: string) {
  memoryToasts = memoryToasts.filter((t) => t.id !== id);
  notify();
}

function genId() {
  return Math.random().toString(36).slice(2, 10);
}

export function toast(input: ToastInput) {
  const id = genId();
  const t: Toast = {
    id,
    open: true,
    ...input,
    onOpenChange: (open: boolean) => {
      if (!open) removeToast(id);
    },
  };
  memoryToasts = [t, ...memoryToasts];
  notify();
  return { id };
}

export function dismiss(id?: string) {
  if (id) {
    removeToast(id);
  } else {
    memoryToasts = [];
    notify();
  }
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>(memoryToasts);

  useEffect(() => {
    const l = (t: Toast[]) => setToasts(t);
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);

  return {
    toasts,
    toast,
    dismiss,
  };
}