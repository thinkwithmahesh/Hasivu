/**
 * Legacy RFID dashboard API facade backed by canonical Next API proxy routes.
 */
import { apiClient, type ApiResponse } from './api';

const ts = () => new Date().toISOString();

function ok<T>(data: T, message = 'ok'): ApiResponse<T> {
  return { data, message, success: true, timestamp: ts() };
}

function unwrapData<T>(response: unknown, fallback: T): T {
  const payload =
    response && typeof response === 'object' && !Array.isArray(response)
      ? (response as Record<string, unknown>)
      : {};
  return (payload.data as T | undefined) ?? (payload as T | undefined) ?? fallback;
}

function listFromPayload<T = any>(payload: unknown, keys: string[]): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (!payload || typeof payload !== 'object') return [];

  const record = payload as Record<string, unknown>;
  for (const key of keys) {
    if (Array.isArray(record[key])) {
      return record[key] as T[];
    }
  }
  return [];
}

const emptyRfidAnalytics = {
  daily: [] as Array<{ date: string; verifications: number; success: number; failed: number }>,
  byLocation: [] as Array<{ location: string; count: number; success: number }>,
  statusDistribution: [] as Array<{ status: string; count: number }>,
};

export const hasivuApiService = {
  async getRFIDCards(): Promise<ApiResponse<{ total: number; active: number; cards: any[] }>> {
    const response = await apiClient.get('/rfid/cards');
    const payload = unwrapData<Record<string, unknown>>(response.data, {});
    const cards = listFromPayload(payload, ['cards', 'items', 'data']);

    return ok(
      {
        total: Number(payload.total ?? cards.length),
        active: Number(
          payload.active ??
            cards.filter((card: any) => card.isActive ?? card.status === 'active').length
        ),
        cards,
      },
      'RFID cards loaded'
    );
  },

  async getRFIDReaders(): Promise<ApiResponse<{ online: number; readers: any[] }>> {
    const response = await apiClient.get('/rfid/devices');
    const payload = unwrapData<Record<string, unknown>>(response.data, {});
    const readers = listFromPayload(payload, ['readers', 'devices', 'items', 'data']);

    return ok(
      {
        online: Number(
          payload.online ?? readers.filter((reader: any) => reader.status === 'online').length
        ),
        readers,
      },
      'RFID readers loaded'
    );
  },

  async getRFIDLogs(params: { limit: number }): Promise<ApiResponse<{ logs: any[] }>> {
    const response = await apiClient.get('/rfid/transactions', { params });
    const payload = unwrapData<Record<string, unknown>>(response.data, {});
    return ok({
      logs: listFromPayload(payload, ['logs', 'transactions', 'verifications', 'items', 'data']),
    });
  },

  async getRFIDAnalytics(): Promise<
    ApiResponse<{
      todayVerifications: number;
      successRate: number;
      avgResponseTime: number;
      analytics: typeof emptyRfidAnalytics;
    }>
  > {
    const response = await apiClient.get('/rfid/transactions', { params: { limit: 500 } });
    const payload = unwrapData<Record<string, unknown>>(response.data, {});
    const logs = listFromPayload<any>(payload, [
      'logs',
      'transactions',
      'verifications',
      'items',
      'data',
    ]);
    const todayKey = new Date().toISOString().slice(0, 10);
    const todayLogs = logs.filter(log => {
      const rawDate = log.verifiedAt || log.createdAt || log.timestamp;
      return rawDate ? String(rawDate).slice(0, 10) === todayKey : false;
    });
    const successes = logs.filter(log =>
      ['verified', 'success', 'delivered'].includes(String(log.status || '').toLowerCase())
    );
    const byDate = new Map<string, { verifications: number; success: number; failed: number }>();
    const byLocation = new Map<string, { count: number; success: number }>();
    const byStatus = new Map<string, number>();

    for (const log of logs) {
      const date = String(log.verifiedAt || log.createdAt || log.timestamp || todayKey).slice(
        0,
        10
      );
      const status = String(log.status || 'unknown').toLowerCase();
      const location = String(log.location || log.reader?.location || 'Unknown');
      const successful = ['verified', 'success', 'delivered'].includes(status);

      const dateRow = byDate.get(date) || { verifications: 0, success: 0, failed: 0 };
      dateRow.verifications += 1;
      dateRow.success += successful ? 1 : 0;
      dateRow.failed += successful ? 0 : 1;
      byDate.set(date, dateRow);

      const locationRow = byLocation.get(location) || { count: 0, success: 0 };
      locationRow.count += 1;
      locationRow.success += successful ? 1 : 0;
      byLocation.set(location, locationRow);

      byStatus.set(status, (byStatus.get(status) || 0) + 1);
    }

    return ok(
      {
        todayVerifications: todayLogs.length,
        successRate:
          logs.length > 0 ? Math.round((successes.length / logs.length) * 10000) / 100 : 0,
        avgResponseTime: 0,
        analytics: {
          daily: Array.from(byDate.entries()).map(([date, row]) => ({ date, ...row })),
          byLocation: Array.from(byLocation.entries()).map(([location, row]) => ({
            location,
            ...row,
          })),
          statusDistribution: Array.from(byStatus.entries()).map(([status, count]) => ({
            status,
            count,
          })),
        },
      },
      'RFID analytics loaded'
    );
  },
};
