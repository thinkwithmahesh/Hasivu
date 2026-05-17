export type ApiSuccess<T> = {
  success: true;
  data: T;
  requestId: string;
};

export type ApiFailure = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  requestId: string;
};

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export function successResponse<T>(data: T, requestId: string): ApiSuccess<T> {
  return { success: true, data, requestId };
}

export function errorResponse(
  code: string,
  message: string,
  requestId: string,
  details?: unknown
): ApiFailure {
  return {
    success: false,
    error: {
      code,
      message,
      ...(details === undefined ? {} : { details }),
    },
    requestId,
  };
}

export const ErrorCodes = {
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  FORBIDDEN: 'FORBIDDEN',
  FEATURE_DISABLED: 'FEATURE_DISABLED',
  IDEMPOTENCY_KEY_REQUIRED: 'IDEMPOTENCY_KEY_REQUIRED',
  IDEMPOTENCY_CONFLICT: 'IDEMPOTENCY_CONFLICT',
  WALLET_AMOUNT_INVALID: 'WALLET_AMOUNT_INVALID',
  WALLET_INSUFFICIENT_FUNDS: 'WALLET_INSUFFICIENT_FUNDS',
  INVOICE_NOT_FOUND: 'INVOICE_NOT_FOUND',
  INVOICE_ALREADY_EXISTS: 'INVOICE_ALREADY_EXISTS',
  INVOICE_ALREADY_VOIDED: 'INVOICE_ALREADY_VOIDED',
  SUBSCRIPTION_POLICY_INVALID: 'SUBSCRIPTION_POLICY_INVALID',
  MANDATE_AUTH_REQUIRED: 'MANDATE_AUTH_REQUIRED',
  SUBSCRIPTION_ALREADY_ACTIVE: 'SUBSCRIPTION_ALREADY_ACTIVE',
  WEBHOOK_REPLAY_DETECTED: 'WEBHOOK_REPLAY_DETECTED',
  WHATSAPP_OPT_IN_REQUIRED: 'WHATSAPP_OPT_IN_REQUIRED',
  WHATSAPP_TEMPLATE_NOT_APPROVED: 'WHATSAPP_TEMPLATE_NOT_APPROVED',
  WHATSAPP_PROVIDER_UNAVAILABLE: 'WHATSAPP_PROVIDER_UNAVAILABLE',
  SCHEDULE_CONFLICT: 'SCHEDULE_CONFLICT',
  CUTOFF_LOCKED: 'CUTOFF_LOCKED',
  RECURRENCE_INVALID: 'RECURRENCE_INVALID',
  RECOMMENDATION_NOT_FOUND: 'RECOMMENDATION_NOT_FOUND',
  RECOMMENDATION_INPUT_INSUFFICIENT: 'RECOMMENDATION_INPUT_INSUFFICIENT',
  RECOMMENDATION_ENGINE_DISABLED: 'RECOMMENDATION_ENGINE_DISABLED',
} as const;
