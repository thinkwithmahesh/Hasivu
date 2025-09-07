 * HASIVU Platform - Helper Utilities
 * General-purpose utility functions for common operations
 * Includes string manipulation, array operations, object utilities, and platform-specific helpers
// import { ClassValue, clsx } from 'clsx';
// import { twMerge } from 'tailwind-merge';
import { USER_ROLES, PERMISSIONS, ROLE_PERMISSIONS, UserRole, Permission } from './constants';
 * Class name utility for combining CSS classes
 * Simple implementation - for advanced features install clsx and tailwind-merge;
 * @param inputs - Class names to combine
 * @returns Combined class string;
export function cn(...inputs: (string | undefined | null | false)[]): string {}
 * String manipulation utilities;
export const stringUtils = {}
   * Convert string to title case;
  titleCase: (str: string): string => {}
   * Convert camelCase or PascalCase to kebab-case;
  kebabCase: (str: string): string => {}
   * Convert kebab-case or snake_case to camelCase;
  camelCase: (str: string): string => {}
   * Generate a random string of specified length;
  randomString: (length: number = 8): string => {}
    return result;
   * Truncate string with ellipsis;
  truncate: (str: string, maxLength: number): string => {}
   * Remove special characters and spaces;
  sanitize: (str: string): string => {}
   * Generate slug from string;
  slugify: (str: string): string => {}
   * Extract initials from name;
  getInitials: (name: string): string => {}
   * Mask sensitive information (phone, email, card);
  mask: (str: string, type: 'phone' | 'email' | 'card' = 'phone'): string => {}
        return str.replace(/(\d{2})(\d{5})(\d{3})/ , '$1*****$3');
      case 'email': undefined
        const [username, domain] = str.split('@');
        const maskedUsername = username.length > 2
          ? username.slice(0, 2) + '*'.repeat(username.length - 2)
          : username;
        return `${maskedUsername}@${domain}``
      console.log(`${label} took ${(end - start).toFixed(2)}ms``