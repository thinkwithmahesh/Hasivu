/**
 * Response Utilities
 * Standardized response helpers for Lambda functions
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    timestamp: string;
    requestId?: string;
  };
}

export function successResponse<T>(
  data: T,
  statusCode: number = 200
): {
  statusCode: number;
  body: string;
  headers: { [key: string]: string };
} {
  const response: ApiResponse<T> = {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
    },
  };

  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': 'true',
    },
    body: JSON.stringify(response),
  };
}

export function errorResponse(
  code: string,
  message: string,
  statusCode: number = 400,
  details?: any
): {
  statusCode: number;
  body: string;
  headers: { [key: string]: string };
} {
  const response: ApiResponse = {
    success: false,
    error: {
      code,
      message,
      details,
    },
    meta: {
      timestamp: new Date().toISOString(),
    },
  };

  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': 'true',
    },
    body: JSON.stringify(response),
  };
}

export function validationErrorResponse(
  message: string,
  details?: any
): {
  statusCode: number;
  body: string;
  headers: { [key: string]: string };
} {
  return errorResponse('VALIDATION_ERROR', message, 400, details);
}

export function notFoundResponse(resource: string = 'Resource'): {
  statusCode: number;
  body: string;
  headers: { [key: string]: string };
} {
  return errorResponse('NOT_FOUND', `${resource} not found`, 404);
}

export function unauthorizedResponse(message: string = 'Unauthorized'): {
  statusCode: number;
  body: string;
  headers: { [key: string]: string };
} {
  return errorResponse('UNAUTHORIZED', message, 401);
}

export function serverErrorResponse(error: Error): {
  statusCode: number;
  body: string;
  headers: { [key: string]: string };
} {
  return errorResponse(
    'INTERNAL_SERVER_ERROR',
    error.message || 'An unexpected error occurred',
    500,
    process.env.NODE_ENV === 'development' ? { stack: error.stack } : undefined
  );
}

/**
 * Handle error and return appropriate response
 */
export function handleError(
  error: Error | any,
  message?: string,
  statusCode?: number,
  requestId?: string
): {
  statusCode: number;
  body: string;
  headers: { [key: string]: string };
} {
  if (error instanceof Error) {
    return serverErrorResponse(error);
  }
  return errorResponse('UNKNOWN_ERROR', message || 'An unknown error occurred', statusCode || 500);
}

// Aliases for compatibility
export const createSuccessResponse = successResponse;
export const createErrorResponse = errorResponse;
