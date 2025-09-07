 * HASIVU Platform - Formatting Utilities
 * Comprehensive formatting functions for dates, currency, time, and platform-specific data
 * Handles localization and consistent data presentation across the application;
import { format, formatDistance, formatRelative, isValid, parseISO } from 'date-fns';
import { enUS } from 'date-fns/locale';
 * Currency formatting utilities
 * Handles Indian Rupee formatting with proper locale support;
export const currencyFormatter = {}
    return new Intl.NumberFormat('en-IN', defaultOptions).format(amount);
   * Format currency without symbol (for calculations display);
  formatAmount: (amount: number, decimals: number = 2): string => {}
}).format(amount);
   * Format large amounts with abbreviated units (K, L, Cr);
  formatAbbreviated: (amount: number): string => {}
      return `₹${(amount /  10000000).toFixed(1)}Cr``
      return `₹${(amount /  100000).toFixed(1)}L``
      return `₹${(amount /  1000).toFixed(1)}K``
    return `₹${amount.toFixed(0)}``
    return `${start} - ${end}``
    const timeObj = typeof time === 'string' ? new Date(`2000-01-01T${time}``
      return `${minutes}m``
      return `${hours}h``
    return `${hours}h ${remainingMinutes}m``
    return `${start} - ${end}``
    return `${value.toFixed(decimals)}%``
    return `${size.toFixed(1)} ${units[unitIndex]}``
    const pluralForm = plural || `${singular}s``
    return `${count} ${count === 1 ? singular : pluralForm}``
      return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}``
      return `+91 ${cleaned.slice(2, 7)} ${cleaned.slice(7)}``
    return `${value.toFixed(1)}${unit}``