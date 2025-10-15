declare const router: import("express-serve-static-core").Router;
export default router;
export declare const apiInfo: {
    version: "v1";
    supportedVersions: readonly ["v1", "v2"];
    rateLimits: {
        readonly tiers: {
            readonly student: {
                readonly requests: 100;
                readonly burst: 20;
                readonly windowMs: 60000;
            };
            readonly parent: {
                readonly requests: 200;
                readonly burst: 40;
                readonly windowMs: 60000;
            };
            readonly teacher: {
                readonly requests: 300;
                readonly burst: 60;
                readonly windowMs: 60000;
            };
            readonly staff: {
                readonly requests: 500;
                readonly burst: 100;
                readonly windowMs: 60000;
            };
            readonly school_admin: {
                readonly requests: 1000;
                readonly burst: 200;
                readonly windowMs: 60000;
            };
            readonly admin: {
                readonly requests: 2000;
                readonly burst: 400;
                readonly windowMs: 60000;
            };
            readonly super_admin: {
                readonly requests: 5000;
                readonly burst: 1000;
                readonly windowMs: 60000;
            };
            readonly anonymous: {
                readonly requests: 20;
                readonly burst: 5;
                readonly windowMs: 60000;
            };
        };
        readonly endpoints: {
            readonly '/api/v1/auth/login': {
                readonly requests: 5;
                readonly windowMs: 300000;
                readonly skipSuccessfulRequests: true;
            };
            readonly '/api/v1/auth/register': {
                readonly requests: 3;
                readonly windowMs: 3600000;
                readonly skipSuccessfulRequests: true;
            };
            readonly '/api/v1/payments/process': {
                readonly requests: 10;
                readonly windowMs: 60000;
                readonly skipSuccessfulRequests: false;
            };
            readonly '/api/v1/orders/create': {
                readonly requests: 50;
                readonly windowMs: 60000;
                readonly skipSuccessfulRequests: false;
            };
        };
        readonly global: {
            readonly max: 10000;
            readonly windowMs: 60000;
            readonly message: {
                readonly error: "Too many requests from this IP, please try again later";
                readonly retryAfter: 60;
            };
        };
    };
    security: {
        readonly cors: {
            readonly origin: string[];
            readonly credentials: true;
            readonly optionsSuccessStatus: 200;
            readonly methods: readonly ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"];
            readonly allowedHeaders: readonly ["Origin", "X-Requested-With", "Content-Type", "Accept", "Authorization", "X-API-Version", "X-Request-ID", "X-Device-ID", "X-Session-ID"];
            readonly exposedHeaders: readonly ["X-Total-Count", "X-Rate-Limit-Remaining", "X-Rate-Limit-Reset", "X-API-Version", "X-Response-Time"];
        };
        readonly csp: {
            readonly directives: {
                readonly defaultSrc: readonly ["'self'"];
                readonly scriptSrc: readonly ["'self'", "'unsafe-inline'"];
                readonly styleSrc: readonly ["'self'", "'unsafe-inline'"];
                readonly imgSrc: readonly ["'self'", "data:", "https:"];
                readonly connectSrc: readonly ["'self'"];
                readonly fontSrc: readonly ["'self'"];
                readonly objectSrc: readonly ["'none'"];
                readonly mediaSrc: readonly ["'self'"];
                readonly frameSrc: readonly ["'none'"];
            };
        };
        readonly validation: {
            readonly maxBodySize: "10mb";
            readonly maxFileSize: "50mb";
            readonly allowedFileTypes: readonly ["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf", "text/csv", "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"];
            readonly sanitization: {
                readonly stripTags: true;
                readonly escapeHtml: true;
                readonly normalizeEmail: true;
                readonly trimStrings: true;
            };
        };
        readonly apiKeys: {
            readonly headerName: "X-API-Key";
            readonly queryParam: "api_key";
            readonly encryption: "aes-256-gcm";
            readonly rotation: {
                readonly enabled: true;
                readonly intervalDays: 90;
                readonly warningDays: 30;
            };
            readonly scopes: {
                readonly read: readonly ["GET"];
                readonly write: readonly ["POST", "PUT", "PATCH"];
                readonly delete: readonly ["DELETE"];
                readonly admin: readonly ["GET", "POST", "PUT", "PATCH", "DELETE"];
            };
        };
    };
    documentation: {
        openapi: string;
        info: {
            readonly title: "HASIVU Platform API";
            readonly version: "1.0.0";
            readonly description: "Enterprise-grade School Meal Delivery Platform API";
            readonly termsOfService: "https://hasivu.com/terms";
            readonly contact: {
                readonly name: "HASIVU API Support";
                readonly email: "api-support@hasivu.com";
                readonly url: "https://support.hasivu.com";
            };
            readonly license: {
                readonly name: "MIT";
                readonly url: "https://opensource.org/licenses/MIT";
            };
        };
        servers: readonly [{
            readonly url: "https://api.hasivu.com/v1";
            readonly description: "Production server";
        }, {
            readonly url: "https://staging-api.hasivu.com/v1";
            readonly description: "Staging server";
        }, {
            readonly url: "http://localhost:3000/api/v1";
            readonly description: "Development server";
        }];
        components: {
            securitySchemes: {
                BearerAuth: {
                    type: string;
                    scheme: string;
                    bearerFormat: string;
                };
                ApiKeyAuth: {
                    type: string;
                    in: string;
                    name: string;
                };
            };
            schemas: {
                Error: {
                    type: string;
                    properties: {
                        error: {
                            type: string;
                            description: string;
                        };
                        message: {
                            type: string;
                            description: string;
                        };
                        details: {
                            type: string;
                            description: string;
                        };
                        requestId: {
                            type: string;
                            description: string;
                        };
                        timestamp: {
                            type: string;
                            format: string;
                            description: string;
                        };
                    };
                };
                SuccessResponse: {
                    type: string;
                    properties: {
                        data: {
                            type: string;
                            description: string;
                        };
                        message: {
                            type: string;
                            description: string;
                        };
                        requestId: {
                            type: string;
                            description: string;
                        };
                    };
                };
                PaginatedResponse: {
                    type: string;
                    properties: {
                        data: {
                            type: string;
                            items: {
                                type: string;
                            };
                        };
                        pagination: {
                            type: string;
                            properties: {
                                page: {
                                    type: string;
                                };
                                limit: {
                                    type: string;
                                };
                                total: {
                                    type: string;
                                };
                                totalPages: {
                                    type: string;
                                };
                                hasNext: {
                                    type: string;
                                };
                                hasPrev: {
                                    type: string;
                                };
                            };
                        };
                        requestId: {
                            type: string;
                        };
                    };
                };
            };
        };
        security: ({
            BearerAuth: never[];
            ApiKeyAuth?: undefined;
        } | {
            ApiKeyAuth: never[];
            BearerAuth?: undefined;
        })[];
        tags: {
            name: string;
            description: string;
        }[];
    };
};
//# sourceMappingURL=api.routes.d.ts.map