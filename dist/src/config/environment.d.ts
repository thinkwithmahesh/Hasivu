export interface Config {
    server: {
        nodeEnv: string;
        port: number;
        host: string;
        appName: string;
        apiVersion: string;
        baseUrl: string;
    };
    database: {
        url: string;
        host: string;
        port: number;
        name: string;
        username: string;
        password: string;
        ssl: boolean;
        poolMin: number;
        poolMax: number;
        acquireTimeout: number;
        idleTimeout: number;
    };
    redis: {
        url: string;
        host: string;
        port: number;
        password: string;
        db: number;
        maxRetries: number;
        retryDelay: number;
        enableOfflineQueue: boolean;
        lazyConnect: boolean;
    };
    jwt: {
        secret: string;
        refreshSecret: string;
        expiresIn: string;
        refreshExpiresIn: string;
        issuer: string;
        audience: string;
    };
    security: {
        bcryptRounds: number;
        sessionSecret: string;
        corsOrigins: string;
        trustedProxies: string;
        encryptionKey: string;
        rateLimitEnabled: boolean;
        securityHeadersEnabled: boolean;
    };
    rateLimit: {
        windowMs: number;
        maxRequests: number;
        skipSuccessful: boolean;
        skipFailed: boolean;
    };
    cors: {
        origins: string;
    };
    upload: {
        maxSize: string;
        allowedTypes: string;
        destination: string;
    };
    aws: {
        region: string;
        accessKeyId: string;
        secretAccessKey: string;
        s3Bucket: string;
        sesFromEmail: string;
        cloudwatchLogGroup: string;
    };
    razorpay: {
        keyId: string;
        keySecret: string;
        webhookSecret: string;
        baseUrl: string;
    };
    whatsapp: {
        apiUrl: string;
        accessToken: string;
        phoneNumberId: string;
        webhookVerifyToken: string;
        businessAccountId: string;
    };
    sendgrid: {
        apiKey: string;
        fromEmail: string;
        fromName: string;
    };
    firebase: {
        projectId: string;
        privateKey: string;
        clientEmail: string;
        databaseUrl: string;
    };
    monitoring: {
        enableMetrics: boolean;
        metricsPort: number;
        logLevel: string;
        logFile: string;
        enableCloudwatch: boolean;
        enableSentry: boolean;
        sentryDsn: string;
    };
    features: {
        enableWebsocket: boolean;
        enableFileUpload: boolean;
        enableNotifications: boolean;
        enableAnalytics: boolean;
        enableRfid: boolean;
        enableTesting: boolean;
    };
    development: {
        enableHotReload: boolean;
        enableDebug: boolean;
        enableProfiling: boolean;
        enableSqlLogging: boolean;
    };
    notifications: {
        email: {
            apiKey: string;
            fromEmail: string;
            provider: string;
        };
        sms: {
            apiKey: string;
            provider: string;
        };
        push: {
            apiKey: string;
            provider: string;
        };
    };
}
export declare const config: Config;
export declare function validateConfig(): void;
export default config;
//# sourceMappingURL=environment.d.ts.map