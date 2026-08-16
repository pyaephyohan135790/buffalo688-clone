import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMoney(n: number): string {
  try {
    return n.toLocaleString("en-US", { maximumFractionDigits: 2 });
  } catch {
    return String(n);
  }
}
