/**
 * Legacy RFID dashboard API facade.
 * Returns empty typed shells so callers fall back to local mock generators.
 */
import type { ApiResponse } from './api';

const ts = () => new Date().toISOString();

function ok<T>(data: T): ApiResponse<T> {
  return { data, message: 'ok', success: true, timestamp: ts() };
}

const emptyRfidAnalytics = {
  daily: [] as Array<{ date: string; verifications: number; success: number; failed: number }>,
  byLocation: [] as Array<{ location: string; count: number; success: number }>,
  statusDistribution: [] as Array<{ status: string; count: number }>,
};

export const hasivuApiService = {
  getRFIDCards: async (): Promise<ApiResponse<{ total: number; active: number; cards: never[] }>> =>
    Promise.resolve(ok({ total: 0, active: 0, cards: [] })),

  getRFIDReaders: async (): Promise<ApiResponse<{ online: number; readers: never[] }>> =>
    Promise.resolve(ok({ online: 0, readers: [] })),

  getRFIDLogs: async (_params: { limit: number }): Promise<ApiResponse<{ logs: never[] }>> =>
    Promise.resolve(ok({ logs: [] })),

  getRFIDAnalytics: async (): Promise<
    ApiResponse<{
      todayVerifications: number;
      successRate: number;
      avgResponseTime: number;
      analytics: typeof emptyRfidAnalytics;
    }>
  > =>
    Promise.resolve(
      ok({
        todayVerifications: 0,
        successRate: 0,
        avgResponseTime: 0,
        analytics: { ...emptyRfidAnalytics },
      })
    ),
};
