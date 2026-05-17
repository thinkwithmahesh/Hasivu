/**
 * Format a number as currency
 * @param amount - The amount to format
 * @param currency - The currency code (default: 'INR')
 * @param locale - The locale (default: 'en-IN')
 * @returns Formatted currency string
 */
export const formatCurrency = (
  amount: number,
  currency: string = 'INR',
  locale: string = 'en-IN'
): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount);
};
