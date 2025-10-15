/**
 * Environment Configuration
 * Centralized environment variable management
 */

export interface EnvironmentConfig {
  // Application
  NODE_ENV: string;
  PORT: number;
  APP_NAME: string;
  APP_VERSION: string;

  // Database
  DATABASE_URL: string;

  // Authentication
  JWT_SECRET: string;
  JWT_REFRESH_SECRET: string;
  JWT_EXPIRY: string;
  JWT_REFRESH_EXPIRY: string;
  JWT_ISSUER: string;
  JWT_AUDIENCE: string;

  // Redis
  REDIS_URL?: string;
  REDIS_HOST?: string;
  REDIS_PORT?: number;
  REDIS_PASSWORD?: string;

  // AWS
  AWS_REGION?: string;
  AWS_ACCESS_KEY_ID?: string;
  AWS_SECRET_ACCESS_KEY?: string;

  // Payment Gateway
  RAZORPAY_KEY_ID?: string;
  RAZORPAY_KEY_SECRET?: string;

  // External Services
  SMTP_HOST?: string;
  SMTP_PORT?: number;
  SMTP_USER?: string;
  SMTP_PASSWORD?: string;

  // Feature Flags
  ENABLE_PUSH_NOTIFICATIONS?: boolean;
  ENABLE_EMAIL_NOTIFICATIONS?: boolean;
  ENABLE_SMS_NOTIFICATIONS?: boolean;
}

class Environment {
  private static instance: Environment;
  private config: EnvironmentConfig;

  private constructor() {
    this.config = this.loadConfig();
  }

  public static getInstance(): Environment {
    if (!Environment.instance) {
      Environment.instance = new Environment();
    }
    return Environment.instance;
  }

  private loadConfig(): EnvironmentConfig {
    return {
      // Application
      NODE_ENV: process.env.NODE_ENV || 'development',
      PORT: parseInt(process.env.PORT || '3000', 10),
      APP_NAME: process.env.APP_NAME || 'Hasivu Platform',
      APP_VERSION: process.env.APP_VERSION || '1.0.0',

      // Database
      DATABASE_URL: process.env.DATABASE_URL || 'file:./dev.db',

      // Authentication
      JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key',
      JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key',
      JWT_EXPIRY: process.env.JWT_EXPIRY || '15m',
      JWT_REFRESH_EXPIRY: process.env.JWT_REFRESH_EXPIRY || '7d',
      JWT_ISSUER: process.env.JWT_ISSUER || 'hasivu-platform',
      JWT_AUDIENCE: process.env.JWT_AUDIENCE || 'hasivu-users',

      // Redis
      REDIS_URL: process.env.REDIS_URL,
      REDIS_HOST: process.env.REDIS_HOST || 'localhost',
      REDIS_PORT: parseInt(process.env.REDIS_PORT || '6379', 10),
      REDIS_PASSWORD: process.env.REDIS_PASSWORD,

      // AWS
      AWS_REGION: process.env.AWS_REGION || 'us-east-1',
      AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
      AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,

      // Payment Gateway
      RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
      RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET,

      // External Services
      SMTP_HOST: process.env.SMTP_HOST,
      SMTP_PORT: parseInt(process.env.SMTP_PORT || '587', 10),
      SMTP_USER: process.env.SMTP_USER,
      SMTP_PASSWORD: process.env.SMTP_PASSWORD,

      // Feature Flags
      ENABLE_PUSH_NOTIFICATIONS: process.env.ENABLE_PUSH_NOTIFICATIONS === 'true',
      ENABLE_EMAIL_NOTIFICATIONS: process.env.ENABLE_EMAIL_NOTIFICATIONS === 'true',
      ENABLE_SMS_NOTIFICATIONS: process.env.ENABLE_SMS_NOTIFICATIONS === 'true',
    };
  }

  public get<K extends keyof EnvironmentConfig>(key: K): EnvironmentConfig[K] {
    return this.config[key];
  }

  public getAll(): EnvironmentConfig {
    return { ...this.config };
  }

  public isDevelopment(): boolean {
    return this.config.NODE_ENV === 'development';
  }

  public isProduction(): boolean {
    return this.config.NODE_ENV === 'production';
  }

  public isTest(): boolean {
    return this.config.NODE_ENV === 'test';
  }

  public validate(): { isValid: boolean; missingKeys: string[] } {
    const requiredKeys: (keyof EnvironmentConfig)[] = [
      'DATABASE_URL',
      'JWT_SECRET',
      'JWT_REFRESH_SECRET',
    ];

    const missingKeys: string[] = [];

    requiredKeys.forEach(key => {
      if (!this.config[key]) {
        missingKeys.push(key);
      }
    });

    return {
      isValid: missingKeys.length === 0,
      missingKeys,
    };
  }
}

export const env = Environment.getInstance();
export default env;

// Create a config object with nested structure for backward compatibility
export const config = {
  jwt: {
    secret: env.get('JWT_SECRET'),
    refreshSecret: env.get('JWT_REFRESH_SECRET'),
    issuer: env.get('JWT_ISSUER'),
    audience: env.get('JWT_AUDIENCE'),
    expiresIn: env.get('JWT_EXPIRY'),
    refreshExpiresIn: env.get('JWT_REFRESH_EXPIRY'),
  },
  redis: {
    url:
      env.get('REDIS_URL') ||
      `redis://${env.get('REDIS_HOST') || 'localhost'}:${env.get('REDIS_PORT') || 6379}`,
  },
  server: {
    nodeEnv: env.get('NODE_ENV'),
  },
};
