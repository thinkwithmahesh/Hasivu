/// <reference types="qs" />
import { Request, Response } from 'express';
export declare const TestDataFactory: {
    user: {
        student: (overrides?: any) => any;
        parent: (overrides?: any) => any;
        admin: (overrides?: any) => any;
    };
    menuItem: (overrides?: any) => any;
    order: (overrides?: any) => any;
    rfidCard: (overrides?: any) => any;
    paymentOrder: (overrides?: any) => any;
    subscription: (overrides?: any) => any;
    notification: (overrides?: any) => any;
    orderItem: (overrides?: any) => any;
    menuPlan: (overrides?: any) => any;
    reset: () => void;
};
export declare const AuthTestHelper: {
    generateValidToken: (payload?: any) => string;
    generateExpiredToken: (payload?: any) => string;
    generateInvalidToken: () => string;
    hashPassword: (password: string) => Promise<string>;
    verifyPassword: (password: string, hash: string) => Promise<boolean>;
};
export declare const MockRequestResponse: {
    createMockRequest: (overrides?: any) => Partial<Request>;
    createMockResponse: () => Partial<Response>;
};
export declare const DatabaseTestHelper: {
    setupTestDatabase: () => Promise<void>;
    seedTestData: () => Promise<void>;
    seedBaseTestData: () => Promise<void>;
    clearTestData: () => Promise<void>;
    resetSequences: () => Promise<void>;
    clearAllTables: () => Promise<void>;
    teardownTestDatabase: () => Promise<void>;
};
export declare const TimeTestHelper: {
    freezeTime: (date?: Date) => void;
    unfreezeTime: () => void;
    advanceTime: (ms: number) => void;
    futureDate: (daysFromNow?: number) => Date;
    pastDate: (daysAgo?: number) => Date;
};
export declare const ApiTestHelper: {
    expectErrorResponse: (response: any, expectedError?: string) => void;
    expectValidationError: (response: any, field?: string) => void;
    expectUnauthorizedError: (response: any) => void;
    expectForbiddenError: (response: any) => void;
    expectNotFoundError: (response: any) => void;
    expectSuccessResponse: (response: any, expectedData?: any) => void;
};
export declare const PerformanceTestHelper: {
    measureExecutionTime: (fn: () => Promise<any>) => Promise<{
        result: any;
        duration: number;
    }>;
    expectExecutionTimeUnder: (duration: number, maxMs: number) => void;
    simulateNetworkDelay: (ms?: number) => Promise<void>;
    generateLoadTestData: (count: number, factory: () => any) => any[];
};
export declare const ExternalServiceMocks: {
    razorpay: {
        mockSuccessfulPayment: () => {
            id: string;
            status: string;
            amount: number;
            currency: string;
            method: string;
        };
        mockFailedPayment: () => {
            id: string;
            status: string;
            error: string;
        };
    };
    whatsapp: {
        mockSuccessfulSend: () => {
            messageId: string;
            status: string;
        };
        mockFailedSend: () => {
            error: string;
        };
    };
    aws: {
        ses: {
            mockSuccessfulSend: () => {
                MessageId: string;
            };
        };
        s3: {
            mockSuccessfulUpload: () => {
                Location: string;
                ETag: string;
                Bucket: string;
                Key: string;
            };
        };
        cognito: {
            mockSuccessfulAuth: () => {
                Username: string;
                Attributes: {
                    Name: string;
                    Value: string;
                }[];
            };
        };
    };
    reset: () => void;
};
export declare const TestEnvironmentHelper: {
    isTestEnvironment: () => boolean;
    skipIfNotTestEnv: (testFn: () => void) => void;
    requireEnvVar: (varName: string) => string;
};
declare const _default: {
    TestDataFactory: {
        user: {
            student: (overrides?: any) => any;
            parent: (overrides?: any) => any;
            admin: (overrides?: any) => any;
        };
        menuItem: (overrides?: any) => any;
        order: (overrides?: any) => any;
        rfidCard: (overrides?: any) => any;
        paymentOrder: (overrides?: any) => any;
        subscription: (overrides?: any) => any;
        notification: (overrides?: any) => any;
        orderItem: (overrides?: any) => any;
        menuPlan: (overrides?: any) => any;
        reset: () => void;
    };
    AuthTestHelper: {
        generateValidToken: (payload?: any) => string;
        generateExpiredToken: (payload?: any) => string;
        generateInvalidToken: () => string;
        hashPassword: (password: string) => Promise<string>;
        verifyPassword: (password: string, hash: string) => Promise<boolean>;
    };
    MockRequestResponse: {
        createMockRequest: (overrides?: any) => Partial<Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>>;
        createMockResponse: () => Partial<Response<any, Record<string, any>>>;
    };
    DatabaseTestHelper: {
        setupTestDatabase: () => Promise<void>;
        seedTestData: () => Promise<void>;
        seedBaseTestData: () => Promise<void>;
        clearTestData: () => Promise<void>;
        resetSequences: () => Promise<void>;
        clearAllTables: () => Promise<void>;
        teardownTestDatabase: () => Promise<void>;
    };
    TimeTestHelper: {
        freezeTime: (date?: Date) => void;
        unfreezeTime: () => void;
        advanceTime: (ms: number) => void;
        futureDate: (daysFromNow?: number) => Date;
        pastDate: (daysAgo?: number) => Date;
    };
    ApiTestHelper: {
        expectErrorResponse: (response: any, expectedError?: string) => void;
        expectValidationError: (response: any, field?: string) => void;
        expectUnauthorizedError: (response: any) => void;
        expectForbiddenError: (response: any) => void;
        expectNotFoundError: (response: any) => void;
        expectSuccessResponse: (response: any, expectedData?: any) => void;
    };
    PerformanceTestHelper: {
        measureExecutionTime: (fn: () => Promise<any>) => Promise<{
            result: any;
            duration: number;
        }>;
        expectExecutionTimeUnder: (duration: number, maxMs: number) => void;
        simulateNetworkDelay: (ms?: number) => Promise<void>;
        generateLoadTestData: (count: number, factory: () => any) => any[];
    };
    ExternalServiceMocks: {
        razorpay: {
            mockSuccessfulPayment: () => {
                id: string;
                status: string;
                amount: number;
                currency: string;
                method: string;
            };
            mockFailedPayment: () => {
                id: string;
                status: string;
                error: string;
            };
        };
        whatsapp: {
            mockSuccessfulSend: () => {
                messageId: string;
                status: string;
            };
            mockFailedSend: () => {
                error: string;
            };
        };
        aws: {
            ses: {
                mockSuccessfulSend: () => {
                    MessageId: string;
                };
            };
            s3: {
                mockSuccessfulUpload: () => {
                    Location: string;
                    ETag: string;
                    Bucket: string;
                    Key: string;
                };
            };
            cognito: {
                mockSuccessfulAuth: () => {
                    Username: string;
                    Attributes: {
                        Name: string;
                        Value: string;
                    }[];
                };
            };
        };
        reset: () => void;
    };
    TestEnvironmentHelper: {
        isTestEnvironment: () => boolean;
        skipIfNotTestEnv: (testFn: () => void) => void;
        requireEnvVar: (varName: string) => string;
    };
};
export default _default;
//# sourceMappingURL=test-helpers.d.ts.map