/// <reference types="qs" />
/// <reference types="cookie-parser" />
import { Request, Response } from 'express';
export declare const TestDataFactory: {
    user: {
        student: (overrides?: Record<string, unknown>) => {
            id: string;
            email: string;
            name: string;
            role: string;
            phone: string;
            grade: string;
            section: string;
            rollNumber: string;
            parentId: string;
            schoolId: string;
            isActive: boolean;
            preferences: {
                dietaryRestrictions: never[];
                allergies: never[];
                spiceLevel: string;
            };
            createdAt: Date;
            updatedAt: Date;
        };
        parent: (overrides?: Record<string, unknown>) => {
            id: string;
            email: string;
            name: string;
            role: string;
            phone: string;
            address: string;
            paymentMethods: never[];
            children: string[];
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
        };
        admin: (overrides?: Record<string, unknown>) => {
            id: string;
            email: string;
            name: string;
            role: string;
            phone: string;
            permissions: string[];
            schoolId: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
        };
    };
    menuItem: (overrides?: Record<string, unknown>) => {
        id: string;
        name: string;
        description: string;
        category: string;
        price: number;
        currency: string;
        nutritionalInfo: {
            calories: number;
            protein: number;
            carbs: number;
            fat: number;
            fiber: number;
        };
        ingredients: string[];
        allergens: never[];
        preparationTime: number;
        schoolId: string;
        isActive: boolean;
        availability: {
            monday: boolean;
            tuesday: boolean;
            wednesday: boolean;
            thursday: boolean;
            friday: boolean;
            saturday: boolean;
            sunday: boolean;
        };
        images: string[];
        tags: string[];
        createdAt: Date;
        updatedAt: Date;
    };
    order: (overrides?: Record<string, unknown>) => {
        id: string;
        userId: string;
        parentId: string;
        schoolId: string;
        items: {
            menuItemId: string;
            quantity: number;
            price: number;
            totalPrice: number;
        }[];
        totalAmount: number;
        currency: string;
        status: string;
        deliveryDate: Date;
        deliverySlot: string;
        paymentStatus: string;
        paymentId: null;
        rfidVerified: boolean;
        deliveryAddress: {
            building: string;
            floor: string;
            classroom: string;
        };
        specialRequirements: never[];
        createdAt: Date;
        updatedAt: Date;
    };
    rfidCard: (overrides?: Record<string, unknown>) => {
        id: string;
        cardId: string;
        studentId: string;
        schoolId: string;
        isActive: boolean;
        isBlocked: boolean;
        lastUsed: Date;
        createdAt: Date;
        updatedAt: Date;
    };
    paymentOrder: (overrides?: Record<string, unknown>) => {
        id: string;
        orderId: string;
        amount: number;
        currency: string;
        status: string;
        gateway: string;
        gatewayOrderId: string;
        gatewayPaymentId: null;
        metadata: {
            receipt: string;
        };
        attempts: number;
        maxAttempts: number;
        expiresAt: Date;
        completedAt: null;
        failureReason: null;
        createdAt: Date;
        updatedAt: Date;
    };
    subscription: (overrides?: Record<string, unknown>) => {
        id: string;
        userId: string;
        planId: string;
        status: string;
        currentPeriodStart: Date;
        currentPeriodEnd: Date;
        cancelAtPeriodEnd: boolean;
        gatewaySubscriptionId: string;
        createdAt: Date;
        updatedAt: Date;
    };
    notification: (overrides?: Record<string, unknown>) => {
        id: string;
        userId: string;
        type: string;
        channel: string;
        title: string;
        message: string;
        status: string;
        metadata: {};
        scheduledAt: Date;
        sentAt: null;
        retries: number;
        maxRetries: number;
        createdAt: Date;
        updatedAt: Date;
    };
    orderItem: (overrides?: Record<string, unknown>) => {
        id: string;
        orderId: string;
        menuItemId: string;
        quantity: number;
        unitPrice: number;
        totalPrice: number;
        currency: string;
        specialRequirements: string;
        customizations: {};
        nutritionalInfo: {
            calories: number;
            protein: number;
            carbs: number;
            fat: number;
        };
        createdAt: Date;
        updatedAt: Date;
    };
    menuPlan: (overrides?: Record<string, unknown>) => {
        id: string;
        name: string;
        description: string;
        schoolId: string;
        startDate: Date;
        endDate: Date;
        menuItems: never[];
        isActive: boolean;
        createdBy: string;
        tags: string[];
        targetCalories: number;
        createdAt: Date;
        updatedAt: Date;
    };
    reset: () => void;
};
export declare const AuthTestHelper: {
    generateValidToken: (payload?: Record<string, unknown>) => string;
    generateExpiredToken: (payload?: Record<string, unknown>) => string;
    generateInvalidToken: () => string;
    hashPassword: (password: string) => Promise<string>;
    verifyPassword: (password: string, hash: string) => Promise<boolean>;
};
export declare const MockRequestResponse: {
    createMockRequest: (overrides?: Record<string, unknown>) => Partial<Request> & {
        user?: unknown;
    };
    createMockResponse: () => Partial<Response> & {
        status: jest.MockedFunction<any>;
        json: jest.MockedFunction<any>;
        send: jest.MockedFunction<any>;
        cookie: jest.MockedFunction<any>;
        clearCookie: jest.MockedFunction<any>;
        header: jest.MockedFunction<any>;
        end: jest.MockedFunction<any>;
    };
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
    expectErrorResponse: (response: {
        status: number;
        body: {
            success: boolean;
            error: string;
        };
    }, expectedError?: string) => void;
    expectValidationError: (response: {
        status: number;
        body: {
            success: boolean;
            error: string;
        };
    }, field?: string) => void;
    expectUnauthorizedError: (response: {
        status: number;
        body: {
            success: boolean;
            error: string;
        };
    }) => void;
    expectForbiddenError: (response: {
        status: number;
        body: {
            success: boolean;
            error: string;
        };
    }) => void;
    expectNotFoundError: (response: {
        status: number;
        body: {
            success: boolean;
            error: string;
        };
    }) => void;
    expectSuccessResponse: (response: {
        status: number;
        body: {
            success: boolean;
            data?: unknown;
        };
    }, expectedData?: unknown) => void;
};
export declare const PerformanceTestHelper: {
    measureExecutionTime: (fn: () => Promise<unknown>) => Promise<{
        result: unknown;
        duration: number;
    }>;
    expectExecutionTimeUnder: (duration: number, maxMs: number) => void;
    simulateNetworkDelay: (ms?: number) => Promise<void>;
    generateLoadTestData: (count: number, factory: () => unknown) => unknown[];
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
            student: (overrides?: Record<string, unknown>) => {
                id: string;
                email: string;
                name: string;
                role: string;
                phone: string;
                grade: string;
                section: string;
                rollNumber: string;
                parentId: string;
                schoolId: string;
                isActive: boolean;
                preferences: {
                    dietaryRestrictions: never[];
                    allergies: never[];
                    spiceLevel: string;
                };
                createdAt: Date;
                updatedAt: Date;
            };
            parent: (overrides?: Record<string, unknown>) => {
                id: string;
                email: string;
                name: string;
                role: string;
                phone: string;
                address: string;
                paymentMethods: never[];
                children: string[];
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
            };
            admin: (overrides?: Record<string, unknown>) => {
                id: string;
                email: string;
                name: string;
                role: string;
                phone: string;
                permissions: string[];
                schoolId: string;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
            };
        };
        menuItem: (overrides?: Record<string, unknown>) => {
            id: string;
            name: string;
            description: string;
            category: string;
            price: number;
            currency: string;
            nutritionalInfo: {
                calories: number;
                protein: number;
                carbs: number;
                fat: number;
                fiber: number;
            };
            ingredients: string[];
            allergens: never[];
            preparationTime: number;
            schoolId: string;
            isActive: boolean;
            availability: {
                monday: boolean;
                tuesday: boolean;
                wednesday: boolean;
                thursday: boolean;
                friday: boolean;
                saturday: boolean;
                sunday: boolean;
            };
            images: string[];
            tags: string[];
            createdAt: Date;
            updatedAt: Date;
        };
        order: (overrides?: Record<string, unknown>) => {
            id: string;
            userId: string;
            parentId: string;
            schoolId: string;
            items: {
                menuItemId: string;
                quantity: number;
                price: number;
                totalPrice: number;
            }[];
            totalAmount: number;
            currency: string;
            status: string;
            deliveryDate: Date;
            deliverySlot: string;
            paymentStatus: string;
            paymentId: null;
            rfidVerified: boolean;
            deliveryAddress: {
                building: string;
                floor: string;
                classroom: string;
            };
            specialRequirements: never[];
            createdAt: Date;
            updatedAt: Date;
        };
        rfidCard: (overrides?: Record<string, unknown>) => {
            id: string;
            cardId: string;
            studentId: string;
            schoolId: string;
            isActive: boolean;
            isBlocked: boolean;
            lastUsed: Date;
            createdAt: Date;
            updatedAt: Date;
        };
        paymentOrder: (overrides?: Record<string, unknown>) => {
            id: string;
            orderId: string;
            amount: number;
            currency: string;
            status: string;
            gateway: string;
            gatewayOrderId: string;
            gatewayPaymentId: null;
            metadata: {
                receipt: string;
            };
            attempts: number;
            maxAttempts: number;
            expiresAt: Date;
            completedAt: null;
            failureReason: null;
            createdAt: Date;
            updatedAt: Date;
        };
        subscription: (overrides?: Record<string, unknown>) => {
            id: string;
            userId: string;
            planId: string;
            status: string;
            currentPeriodStart: Date;
            currentPeriodEnd: Date;
            cancelAtPeriodEnd: boolean;
            gatewaySubscriptionId: string;
            createdAt: Date;
            updatedAt: Date;
        };
        notification: (overrides?: Record<string, unknown>) => {
            id: string;
            userId: string;
            type: string;
            channel: string;
            title: string;
            message: string;
            status: string;
            metadata: {};
            scheduledAt: Date;
            sentAt: null;
            retries: number;
            maxRetries: number;
            createdAt: Date;
            updatedAt: Date;
        };
        orderItem: (overrides?: Record<string, unknown>) => {
            id: string;
            orderId: string;
            menuItemId: string;
            quantity: number;
            unitPrice: number;
            totalPrice: number;
            currency: string;
            specialRequirements: string;
            customizations: {};
            nutritionalInfo: {
                calories: number;
                protein: number;
                carbs: number;
                fat: number;
            };
            createdAt: Date;
            updatedAt: Date;
        };
        menuPlan: (overrides?: Record<string, unknown>) => {
            id: string;
            name: string;
            description: string;
            schoolId: string;
            startDate: Date;
            endDate: Date;
            menuItems: never[];
            isActive: boolean;
            createdBy: string;
            tags: string[];
            targetCalories: number;
            createdAt: Date;
            updatedAt: Date;
        };
        reset: () => void;
    };
    AuthTestHelper: {
        generateValidToken: (payload?: Record<string, unknown>) => string;
        generateExpiredToken: (payload?: Record<string, unknown>) => string;
        generateInvalidToken: () => string;
        hashPassword: (password: string) => Promise<string>;
        verifyPassword: (password: string, hash: string) => Promise<boolean>;
    };
    MockRequestResponse: {
        createMockRequest: (overrides?: Record<string, unknown>) => Partial<Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>> & {
            user?: unknown;
        };
        createMockResponse: () => Partial<Response<any, Record<string, any>>> & {
            status: any;
            json: any;
            send: any;
            cookie: any;
            clearCookie: any;
            header: any;
            end: any;
        };
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
        expectErrorResponse: (response: {
            status: number;
            body: {
                success: boolean;
                error: string;
            };
        }, expectedError?: string | undefined) => void;
        expectValidationError: (response: {
            status: number;
            body: {
                success: boolean;
                error: string;
            };
        }, field?: string | undefined) => void;
        expectUnauthorizedError: (response: {
            status: number;
            body: {
                success: boolean;
                error: string;
            };
        }) => void;
        expectForbiddenError: (response: {
            status: number;
            body: {
                success: boolean;
                error: string;
            };
        }) => void;
        expectNotFoundError: (response: {
            status: number;
            body: {
                success: boolean;
                error: string;
            };
        }) => void;
        expectSuccessResponse: (response: {
            status: number;
            body: {
                success: boolean;
                data?: unknown;
            };
        }, expectedData?: unknown) => void;
    };
    PerformanceTestHelper: {
        measureExecutionTime: (fn: () => Promise<unknown>) => Promise<{
            result: unknown;
            duration: number;
        }>;
        expectExecutionTimeUnder: (duration: number, maxMs: number) => void;
        simulateNetworkDelay: (ms?: number) => Promise<void>;
        generateLoadTestData: (count: number, factory: () => unknown) => unknown[];
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