import { logger } from '../../../../utils/logger';

interface ClassificationRule {
  id: string;
  name: string;
  pattern: RegExp;
  level: 'public' | 'internal' | 'confidential' | 'restricted';
  category: string;
  tags: string[];
}

export class DataClassificationEngine {
  private rules: ClassificationRule[] = [
    {
      id: 'pii-email',
      name: 'Email address',
      pattern: /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i,
      level: 'confidential',
      category: 'pii',
      tags: ['email', 'personal-data'],
    },
    {
      id: 'pii-phone',
      name: 'Phone number',
      pattern: /(?:\+?91[-.\s]?)?[6-9]\d{9}\b/,
      level: 'confidential',
      category: 'pii',
      tags: ['phone', 'personal-data'],
    },
    {
      id: 'payment',
      name: 'Payment or card data',
      pattern: /\b(?:razorpay|payment|card|upi|transaction|refund)\b/i,
      level: 'restricted',
      category: 'payment',
      tags: ['payment', 'financial-data'],
    },
    {
      id: 'student',
      name: 'Student data',
      pattern: /\b(?:student|child|grade|rfid|allergen|medical)\b/i,
      level: 'restricted',
      category: 'student',
      tags: ['student-data', 'child-data'],
    },
  ];

  constructor() {
    logger.info('DataClassificationEngine initialized');
  }

  async initialize(): Promise<void> {
    logger.info('Initializing Data Classification Engine');
  }

  async classifyData(resource: string, _data?: any): Promise<any> {
    logger.info('Classifying data', { resource });
    const payload = `${resource} ${JSON.stringify(_data || {})}`;
    const matchedRules = this.rules.filter(rule => rule.pattern.test(payload));
    const level = this.highestLevel(matchedRules.map(rule => rule.level));

    return {
      level,
      category: matchedRules[0]?.category || 'operational',
      tags: Array.from(new Set(matchedRules.flatMap(rule => rule.tags))),
      confidence: matchedRules.length > 0 ? Math.min(0.6 + matchedRules.length * 0.1, 0.95) : 0.5,
      matchedRules: matchedRules.map(rule => rule.id),
    };
  }

  async updateClassification(dataId: string, classification: any): Promise<void> {
    logger.info(`Updated classification for data ${dataId}`, { classification });
  }

  async getClassificationRules(): Promise<any[]> {
    logger.info('Retrieving classification rules');
    return this.rules.map(rule => ({
      id: rule.id,
      name: rule.name,
      level: rule.level,
      category: rule.category,
      tags: rule.tags,
      pattern: rule.pattern.source,
    }));
  }

  async createClassificationRule(rule: any): Promise<void> {
    const classificationRule: ClassificationRule = {
      id: String(rule.id || `rule_${Date.now()}`),
      name: String(rule.name || 'Custom rule'),
      pattern: new RegExp(String(rule.pattern), rule.flags || 'i'),
      level: rule.level || 'internal',
      category: String(rule.category || 'custom'),
      tags: Array.isArray(rule.tags) ? rule.tags.map(String) : ['custom'],
    };
    this.rules.push(classificationRule);
    logger.info('Created classification rule', { ruleId: classificationRule.id });
  }

  async getHealthStatus(): Promise<any> {
    logger.info('Getting data classification engine health status');

    return {
      status: 'healthy',
      version: '1.0.0',
      lastUpdate: new Date(),
      performance: {
        avgClassificationTime: 0,
        rulesLoaded: this.rules.length,
        dataClassified: 0,
      },
      components: {
        mlClassifier: 'not-configured',
        ruleEngine: 'operational',
        contentAnalyzer: 'operational',
        patternMatcher: 'operational',
      },
      metrics: {
        uptime: 'managed-by-runtime',
        memoryUsage: 'managed-by-runtime',
        cpuUsage: 'managed-by-runtime',
      },
    };
  }

  async shutdown(): Promise<void> {
    logger.info('Shutting down Data Classification Engine');
  }

  private highestLevel(
    levels: Array<'public' | 'internal' | 'confidential' | 'restricted'>
  ): 'public' | 'internal' | 'confidential' | 'restricted' {
    const priority = ['public', 'internal', 'confidential', 'restricted'];
    return levels.reduce(
      (highest, level) => (priority.indexOf(level) > priority.indexOf(highest) ? level : highest),
      'internal' as 'public' | 'internal' | 'confidential' | 'restricted'
    );
  }
}

export default DataClassificationEngine;
