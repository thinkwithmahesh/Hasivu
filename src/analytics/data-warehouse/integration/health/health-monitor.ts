/**
 * Health Monitor
 */

import { logger } from '../../../../shared/utils/logger';

export class HealthMonitor {
  constructor(_config: Record<string, unknown>) {
    logger.info('HealthMonitor initialized');
  }

  async checkHealth(): Promise<{ status: string }> {
    return { status: 'healthy' };
  }
}

export default HealthMonitor;
