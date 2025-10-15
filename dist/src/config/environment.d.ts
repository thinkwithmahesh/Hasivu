export interface EnvironmentConfig {
    NODE_ENV: string;
    PORT: number;
    APP_NAME: string;
    APP_VERSION: string;
    DATABASE_URL: string;
    JWT_SECRET: string;
    JWT_REFRESH_SECRET: string;
    JWT_EXPIRY: string;
    JWT_REFRESH_EXPIRY: string;
    JWT_ISSUER: string;
    JWT_AUDIENCE: string;
    REDIS_URL?: string;
    REDIS_HOST?: string;
    REDIS_PORT?: number;
    REDIS_PASSWORD?: string;
    AWS_REGION?: string;
    AWS_ACCESS_KEY_ID?: string;
    AWS_SECRET_ACCESS_KEY?: string;
    RAZORPAY_KEY_ID?: string;
    RAZORPAY_KEY_SECRET?: string;
    SMTP_HOST?: string;
    SMTP_PORT?: number;
    SMTP_USER?: string;
    SMTP_PASSWORD?: string;
    ENABLE_PUSH_NOTIFICATIONS?: boolean;
    ENABLE_EMAIL_NOTIFICATIONS?: boolean;
    ENABLE_SMS_NOTIFICATIONS?: boolean;
}
declare class Environment {
    private static instance;
    private config;
    private constructor();
    static getInstance(): Environment;
    private loadConfig;
    get<K extends keyof EnvironmentConfig>(key: K): EnvironmentConfig[K];
    getAll(): EnvironmentConfig;
    isDevelopment(): boolean;
    isProduction(): boolean;
    isTest(): boolean;
    validate(): {
        isValid: boolean;
        missingKeys: string[];
    };
}
export declare const env: Environment;
export default env;
export declare const config: {
    jwt: {
        secret: string;
        refreshSecret: string;
        issuer: string;
        audience: string;
        expiresIn: string;
        refreshExpiresIn: string;
    };
    redis: {
        url: string;
    };
    server: {
        nodeEnv: string;
    };
};
//# sourceMappingURL=environment.d.ts.map