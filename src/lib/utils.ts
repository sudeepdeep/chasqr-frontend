import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * The shadcn class helper: clsx resolves conditionals, tailwind-merge then
 * drops earlier Tailwind classes that a later one overrides, so a caller's
 * `className` always wins over a component's defaults.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
