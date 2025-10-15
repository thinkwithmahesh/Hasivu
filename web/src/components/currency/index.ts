/**
 * HASIVU Platform - Currency Components Export Index
 *
 * Centralized exports for all currency-related components and utilities.
 * Provides a clean API for importing currency functionality throughout the application.
 */

// Main currency settings component
export { CurrencySettings as default, CurrencySettings } from './CurrencySettings';

// Re-export currency utilities for convenience
export {
  formatCurrency,
  formatAmount,
  formatAbbreviatedCurrency,
  formatCurrencyRange,
  formatCurrencyChange,
  formatPercentageWithCurrency,
  formatCurrencyForTable,
  formatCurrencyForInput,
  parseCurrencyString,
  roundToCurrencyPrecision,
  isValidAmount,
  getCurrencyConfig,
  getAllSupportedCurrencies,
  isSupportedCurrency,
  CURRENCY_CONFIGS,
  DEFAULT_CURRENCY,
  DEFAULT_LOCALE,
  type SupportedCurrency,
  type SupportedLocale,
  type CurrencyConfig,
  type CurrencyFormatOptions,
} from '@/utils/formatCurrency';

// Re-export currency conversion utilities
export {
  convertCurrency,
  convertToMultipleCurrencies,
  getExchangeRate,
  getExchangeRates,
  shouldUpdateRates,
  refreshExchangeRates,
  getRateAge,
  getRateAgeString,
  trackHistoricalRate,
  getRateTrend,
  type ExchangeRateData,
  type ConversionResult,
  type ConversionOptions,
  type CurrencyConversionRates,
  type CurrencyApiResponse,
} from '@/utils/currencyConverter';

// Re-export currency hooks
export {
  useCurrency,
  useCurrencyFormatter,
  useCurrencyConverter,
  type CurrencyPreferences,
  type CurrencyState,
  type UseCurrencyReturn,
} from '@/hooks/use-currency';

/**
 * Usage Examples:
 *
 * // Simple formatting
 * import { formatCurrency } from '@/components/currency';
 * const _formatted =  formatCurrency(150, { currency: 'INR' });
 *
 * // Using the hook
 * import { useCurrency } from '@/components/currency';
 * const { format, convert } = useCurrency();
 *
 * // Currency settings component
 * import { CurrencySettings } from '@/components/currency';
 * <CurrencySettings />
 *
 * // Advanced conversion
 * import { convertCurrency } from '@/components/currency';
 * const _result =  await convertCurrency(100, 'INR', 'USD');
 */
