import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function relativeTime(iso: string) {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diffMs = now - then;
  const future = diffMs < 0;
  const diff = Math.round(Math.abs(diffMs) / 1000);
  const fmt = (n: number, unit: string) =>
    future ? `in ${n}${unit}` : `${n}${unit} ago`;
  if (diff < 60) return future ? "in a moment" : "just now";
  if (diff < 3600) return fmt(Math.round(diff / 60), "m");
  if (diff < 86400) return fmt(Math.round(diff / 3600), "h");
  return fmt(Math.round(diff / 86400), "d");
}
