/**
 * HASIVU Platform Utility Functions
 */

export const numberUtils = {
  inRange: (num: number, min: number, max: number): boolean => {
    return num >= min && num <= max;
  },
  toPercentage: (value: number, total: number, decimals: number = 1): number => {
    if (total === 0) return 0;
    return Number(((value / total) * 100).toFixed(decimals));
  },
};

export const stringUtils = {
  truncate: (str: string, length: number): string => {
    return str.length > length ? `${str.substring(0, length)}...` : str;
  },
  capitalize: (str: string): string => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  },
};

export const arrayUtils = {
  chunk: <T>(array: T[], size: number): T[][] => {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  },
  unique: <T>(array: T[]): T[] => {
    return Array.from(new Set(array));
  },
};

export const dateUtils = {
  addDays: (date: Date, days: number): Date => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  },
  formatDate: (date: Date, locale: string = 'en-IN'): string => {
    return date.toLocaleDateString(locale);
  },
};

export const performanceUtils = {
  debounce: <T extends (...args: any[]) => void>(func: T, delay: number): T => {
    let timeoutId: NodeJS.Timeout;
    return ((...args: any[]) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    }) as T;
  },
  throttle: <T extends (...args: any[]) => void>(func: T, limit: number): T => {
    let inThrottle: boolean;
    return ((...args: any[]) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    }) as T;
  },
};
