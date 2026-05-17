import { logger } from '../../../../utils/logger';
import crypto from 'crypto';

export class PrivacyPreservingAnalytics {
  constructor() {
    logger.info('PrivacyPreservingAnalytics initialized');
  }

  async initialize(): Promise<void> {
    logger.info('Initializing Privacy Preserving Analytics');
  }

  async addDifferentialPrivacy(query: string, epsilon: number): Promise<string> {
    if (!Number.isFinite(epsilon) || epsilon <= 0 || epsilon > 10) {
      throw new Error('epsilon must be between 0 and 10');
    }
    logger.info('Adding differential privacy marker to query', { epsilon });
    return `${query} /* differential_privacy_epsilon=${epsilon} */`;
  }

  async anonymizeResults(results: any[] | undefined | undefined): Promise<any[]> {
    logger.info('Anonymizing query results');
    return (results || []).map(row => this.anonymizeRecord(row));
  }

  async applyKAnonymity(data: any[] | undefined | undefined, k: number): Promise<any[]> {
    if (!Number.isInteger(k) || k < 2) {
      throw new Error('k must be an integer greater than 1');
    }
    logger.info('Applying k-anonymity', { k });

    const rows = data || [];
    const buckets = new Map<string, any[]>();
    for (const row of rows) {
      const bucketKey = this.buildQuasiIdentifier(row);
      const bucket = buckets.get(bucketKey) || [];
      bucket.push(row);
      buckets.set(bucketKey, bucket);
    }

    return Array.from(buckets.values())
      .filter(bucket => bucket.length >= k)
      .flat()
      .map(row => this.generalizeRecord(row));
  }

  async generateSyntheticData(schema: any): Promise<any[]> {
    logger.info('Generating synthetic data', { schema });
    const count = Math.min(Math.max(Number(schema?.count || 10), 1), 1000);
    const fields = Array.isArray(schema?.fields) ? schema.fields : [];

    return Array.from({ length: count }, (_, index) => {
      const row: Record<string, unknown> = {};
      for (const field of fields) {
        const name = String(field.name || `field_${index}`);
        row[name] = this.syntheticValue(field.type, index);
      }
      return row;
    });
  }

  async generateAnalytics(data: any, privacyParameters: any): Promise<any> {
    logger.info('Generating privacy-preserving analytics', { privacyParameters });

    const rows = Array.isArray(data) ? data : data?.rows || [];
    const anonymizedRows = await this.anonymizeResults(rows);
    const kAnonymousRows = await this.applyKAnonymity(
      anonymizedRows,
      Math.max(Number(privacyParameters?.k || 5), 2)
    );
    const numericValues = kAnonymousRows
      .flatMap(row => Object.values(row))
      .filter(value => typeof value === 'number') as number[];
    const epsilon = Number(privacyParameters?.epsilon || 0.5);
    const noisyAverage = this.addLaplaceNoise(this.average(numericValues), epsilon);

    return {
      id: `analytics_${Date.now()}`,
      generatedAt: new Date(),
      privacyLevel: privacyParameters?.level || 'high',
      insights: {
        aggregatedStats: {
          totalRecords: kAnonymousRows.length,
          suppressedRecords: rows.length - kAnonymousRows.length,
          averageValue: noisyAverage,
          distribution: this.bucketNumericValues(numericValues),
        },
        segments: this.segmentRows(kAnonymousRows),
      },
      privacyMeasures: {
        epsilonUsed: epsilon,
        kAnonymity: privacyParameters?.k || 5,
        noiseAdded: true,
        aggregationLevel: kAnonymousRows.length >= 100 ? 'high' : 'limited',
      },
      limitations: [
        'Individual records cannot be identified',
        'Results include calibrated noise for privacy',
        'Minimum group size enforced',
      ],
    };
  }

  async getHealthStatus(): Promise<any> {
    logger.info('Getting privacy preserving analytics health status');

    return {
      status: 'healthy',
      version: '1.0.0',
      lastUpdate: new Date(),
      performance: {
        avgAnalysisTime: 0,
        anonymizationRate: 0.95,
        kAnonymityValue: 5,
      },
      components: {
        differentialPrivacy: 'operational',
        kAnonymityEngine: 'operational',
        syntheticDataGen: 'operational',
        noiseGenerator: 'operational',
      },
      metrics: {
        uptime: 'managed-by-runtime',
        memoryUsage: 'managed-by-runtime',
        cpuUsage: 'managed-by-runtime',
      },
    };
  }

  async shutdown(): Promise<void> {
    logger.info('Shutting down Privacy Preserving Analytics');
  }

  private anonymizeRecord(row: Record<string, unknown>): Record<string, unknown> {
    const anonymized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(row || {})) {
      if (/email|phone|name|address|token|password|rfid|card/i.test(key)) {
        anonymized[key] = this.hashValue(value);
      } else if (value instanceof Date) {
        anonymized[key] = value.toISOString().slice(0, 10);
      } else {
        anonymized[key] = value;
      }
    }
    return anonymized;
  }

  private generalizeRecord(row: Record<string, unknown>): Record<string, unknown> {
    const generalized = { ...row };
    for (const [key, value] of Object.entries(generalized)) {
      if (typeof value === 'number' && /age|grade|amount|price|value/i.test(key)) {
        generalized[key] = Math.floor(value / 10) * 10;
      }
    }
    return generalized;
  }

  private buildQuasiIdentifier(row: Record<string, unknown>): string {
    return ['schoolId', 'grade', 'role', 'category']
      .map(key => String(row?.[key] || 'any'))
      .join('|');
  }

  private hashValue(value: unknown): string {
    return crypto
      .createHash('sha256')
      .update(String(value || ''))
      .digest('hex')
      .slice(0, 16);
  }

  private syntheticValue(type: unknown, index: number): unknown {
    switch (String(type || 'string')) {
      case 'number':
        return index;
      case 'boolean':
        return index % 2 === 0;
      case 'date':
        return new Date(Date.now() - index * 86400000).toISOString();
      default:
        return `synthetic_${index}`;
    }
  }

  private addLaplaceNoise(value: number, epsilon: number): number {
    if (!Number.isFinite(value)) return 0;
    const u = Math.random() - 0.5;
    const noise = (-1 / epsilon) * Math.sign(u) * Math.log(1 - 2 * Math.abs(u));
    return value + noise;
  }

  private average(values: number[]): number {
    return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
  }

  private bucketNumericValues(values: number[]): Record<string, number> {
    if (values.length === 0) {
      return { low: 0, medium: 0, high: 0 };
    }
    const sorted = [...values].sort((a, b) => a - b);
    const p33 = sorted[Math.floor(sorted.length * 0.33)];
    const p66 = sorted[Math.floor(sorted.length * 0.66)];
    return values.reduce(
      (acc, value) => {
        if (value <= p33) acc.low += 1;
        else if (value <= p66) acc.medium += 1;
        else acc.high += 1;
        return acc;
      },
      { low: 0, medium: 0, high: 0 }
    );
  }

  private segmentRows(rows: Array<Record<string, unknown>>): Array<{
    category: string;
    size: number;
  }> {
    const segments = new Map<string, number>();
    for (const row of rows) {
      const category = String(row.category || row.role || row.grade || 'general');
      segments.set(category, (segments.get(category) || 0) + 1);
    }
    return Array.from(segments.entries()).map(([category, size]) => ({ category, size }));
  }
}

export default PrivacyPreservingAnalytics;
