import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Utility to merge tailwind classes with clsx and tailwind-merge.
 * Essential for Senior Frontend projects to handle dynamic classes cleanly.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
