/**
 * HASIVU Platform - Currency Management Hook
 *
 * React hook that provides comprehensive currency functionality including
 * formatting, conversion, and user preference management.
 *
 * Features:
 * - Currency formatting with user preferences
 * - Real-time currency conversion
 * - Exchange rate monitoring
 * - Currency preference persistence
 * - Loading states and error handling
 * - Automatic rate updates
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  formatCurrency,
  formatAmount,
  formatAbbreviatedCurrency,
  formatCurrencyRange,
  formatCurrencyChange,
  type SupportedCurrency,
  type CurrencyFormatOptions,
  DEFAULT_CURRENCY,
  CURRENCY_CONFIGS,
} from '@/utils/formatCurrency';
import {
  convertCurrency,
  getExchangeRates,
  shouldUpdateRates,
  getRateAge,
  getRateAgeString,
  type ConversionResult,
  type ExchangeRateData,
  type ConversionOptions,
} from '@/utils/currencyConverter';

// ============================================================================\n// Types and Interfaces\n// ============================================================================
