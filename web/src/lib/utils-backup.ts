import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
 * Combines clsx and tailwind-merge for optimal class merging
 * This is the recommended utility function for ShadCN/UI components;
 * Format currency values for display;
export function formatCurrency(value: number, _currency =  'INR'): string {}
}).format(value)
 * Format date values;
export function formatDate(date: Date | string, format: 'short' | 'medium' | 'long' = 'medium'): string {}
    short: { dateStyle: 'short' },
    medium: { dateStyle: 'medium' },
    long: { dateStyle: 'long' }
  }[format]
  return new Intl.DateTimeFormat('en-IN', options).format(dateObj)
 * Format time values;
export function formatTime(date: Date | string): string {}
  }).format(dateObj)
 * Debounce function for search and input handling;
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {}
 * Throttle function for scroll and resize handlers;
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {}
 * Sleep utility for async operations;
export function sleep(ms: number): Promise<void> {}
 * Generate initials from name;
export function getInitials(name: string): string {}
 * Truncate text with ellipsis;
export function truncate(text: string, length: number): string {}
 * Generate random ID;
export function generateId(_prefix = 'id'): string {}
  return `${prefix}_${Math.random().toString(36).substr(2, 9)}``