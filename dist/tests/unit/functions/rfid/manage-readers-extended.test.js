"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const manage_readers_1 = require("../../../../src/functions/rfid/manage-readers");
const client_1 = require("@prisma/client");
jest.mock('@prisma/client', () => ({
    PrismaClient: jest.fn().mockImplementation(() => ({
        rFIDReader: {
            findUnique: jest.fn(),
            findMany: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            count: jest.fn()
        },
        school: {
            findUnique: jest.fn(),
            findMany: jest.fn()
        },
        deliveryVerification: {
            count: jest.fn()
        },
        auditLog: {
            create: jest.fn()
        },
        $disconnect: jest.fn()
    }))
}));
jest.mock('../../../../src/shared/middleware/lambda-auth.middleware', () => ({
    authenticateLambda: jest.fn()
}));
jest.mock('../../../../src/shared/logger.service', () => ({
    LoggerService: {
        getInstance: jest.fn(() => ({
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn()
        }))
    }
}));
jest.mock('../../../../src/shared/response.utils', () => ({
    createSuccessResponse: jest.fn((data) => ({
        statusCode: 200,
        body: JSON.stringify(data)
    })),
    createErrorResponse: jest.fn((message, statusCode) => ({
        statusCode,
        body: JSON.stringify({ error: message })
    })),
    handleError: jest.fn((error, message) => ({
        statusCode: 500,
        body: JSON.stringify({ error: message })
    }))
}));
jest.mock('joi', () => ({
    object: jest.fn(() => ({
        validate: jest.fn((data) => ({ error: null, value: data }))
    })),
    string: jest.fn(() => ({
        required: jest.fn(() => ({
            min: jest.fn(() => ({
                max: jest.fn(() => ({}))
            }))
        })),
        uuid: jest.fn(() => ({
            required: jest.fn(() => ({}))
        })),
        optional: jest.fn(() => ({
            default: jest.fn(() => ({}))
        })),
        valid: jest.fn(() => ({
            optional: jest.fn(() => ({}))
        }))
    })),
    boolean: jest.fn(() => ({
        optional: jest.fn(() => ({
            default: jest.fn(() => ({}))
        }))
    })),
    number: jest.fn(() => ({
        integer: jest.fn(() => ({
            min: jest.fn(() => ({
                max: jest.fn(() => ({
                    optional: jest.fn(() => ({}))
                }))
            }))
        }))
    }))
}));
const mockPrisma = new client_1.PrismaClient();
const { authenticateLambda } = require('../../../../src/shared/middleware/lambda-auth.middleware');
const { createSuccessResponse, createErrorResponse, handleError } = require('../../../../src/shared/response.utils');
describe('Extended Manage RFID Readers - Phase 2.1', () => {
    const mockContext = {
        callbackWaitsForEmptyEventLoop: false,
        functionName: 'manage-readers-extended',
        functionVersion: '2.1',
        invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:manage-readers-extended',
        memoryLimitInMB: '256',
        awsRequestId: 'reader-test-request-id',
        logGroupName: '/aws/lambda/manage-readers-extended',
        logStreamName: '2024/01/01/[1]reader-extended',
        getRemainingTimeInMillis: () => 30000,
        done: jest.fn(),
        fail: jest.fn(),
        succeed: jest.fn()
    };
    const mockAuthenticatedUser = {
        id: 'user-reader-123',
        email: 'admin@reader-school.com',
        role: 'school_admin',
        schoolId: 'school-reader-456'
    };
    const mockSchool = {
        id: 'school-reader-456',
        name: 'Reader Test School',
        code: 'READER001',
        isActive: true
    };
    const mockReader = {
        id: 'reader-789-extended',
        name: 'Main Entrance Reader',
        location: 'School Main Entrance',
        schoolId: 'school-reader-456',
        ipAddress: '192.168.1.100',
        status: 'online',
        isActive: true,
        configuration: JSON.stringify({
            readPower: 30.0,
            antennaConfiguration: {
                antenna1: { enabled: true, power: 30.0 }
            }
        }),
        lastHeartbeat: new Date('2024-01-15T10:30:00Z'),
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-15T10:30:00Z')
    };
    beforeEach(() => {
        jest.clearAllMocks();
        authenticateLambda.mockResolvedValue({ user: mockAuthenticatedUser, userId: mockAuthenticatedUser.id });
        mockPrisma.school.findUnique.mockResolvedValue(mockSchool);
        mockPrisma.rFIDReader.findUnique.mockResolvedValue(mockReader);
        mockPrisma.rFIDReader.create.mockResolvedValue(mockReader);
        mockPrisma.rFIDReader.update.mockResolvedValue(mockReader);
        mockPrisma.auditLog.create.mockResolvedValue({ id: 'audit-id' });
    });
    describe('Phase 2.1 Enhanced Reader Creation', () => {
        it('should successfully create RFID reader with hardware abstraction', async () => {
            const event = {
                httpMethod: 'POST',
                body: JSON.stringify({
                    name: 'New Entrance Reader',
                    location: 'Secondary Entrance',
                    schoolId: 'school-reader-456',
                    ipAddress: '192.168.1.101',
                    configuration: {
                        vendor: 'zebra',
                        readPower: 32.0,
                        antennaConfiguration: {
                            antenna1: { enabled: true, power: 32.0 },
                            antenna2: { enabled: true, power: 32.0 }
                        }
                    }
                }),
                headers: {
                    'authorization': 'Bearer valid-reader-token',
                    'content-type': 'application/json'
                },
                pathParameters: {},
                queryStringParameters: {},
                multiValueQueryStringParameters: {},
                stageVariables: {},
                requestContext: {},
                resource: '',
                path: '/rfid/readers',
                isBase64Encoded: false,
                multiValueHeaders: {}
            };
            const result = await (0, manage_readers_1.manageReadersHandler)(event, mockContext);
            expect(result.statusCode).toBe(200);
            const responseBody = JSON.parse(result.body);
            expect(responseBody.message).toBe('RFID reader created successfully');
            expect(responseBody.data.name).toBe('Main Entrance Reader');
            expect(authenticateLambda).toHaveBeenCalledWith(event);
            expect(mockPrisma.auditLog.create).toHaveBeenCalled();
        });
        it('should validate reader configuration against vendor specifications', async () => {
            const event = {
                httpMethod: 'POST',
                body: JSON.stringify({
                    name: 'Invalid Config Reader',
                    location: 'Test Location',
                    schoolId: 'school-reader-456',
                    configuration: {
                        readPower: 50.0,
                        antennaConfiguration: {
                            antenna1: { enabled: true, power: 50.0 }
                        }
                    }
                }),
                headers: {
                    'authorization': 'Bearer valid-reader-token',
                    'content-type': 'application/json'
                },
                pathParameters: {},
                queryStringParameters: {},
                multiValueQueryStringParameters: {},
                stageVariables: {},
                requestContext: {},
                resource: '',
                path: '/rfid/readers',
                isBase64Encoded: false,
                multiValueHeaders: {}
            };
            const result = await (0, manage_readers_1.manageReadersHandler)(event, mockContext);
            expect(result.statusCode).toBe(200);
        });
        it('should prevent duplicate reader names within the same school', async () => {
            mockPrisma.rFIDReader.findFirst.mockResolvedValue(mockReader);
            const event = {
                httpMethod: 'POST',
                body: JSON.stringify({
                    name: 'Main Entrance Reader',
                    location: 'Different Location',
                    schoolId: 'school-reader-456'
                }),
                headers: {
                    'authorization': 'Bearer valid-reader-token',
                    'content-type': 'application/json'
                },
                pathParameters: {},
                queryStringParameters: {},
                multiValueQueryStringParameters: {},
                stageVariables: {},
                requestContext: {},
                resource: '',
                path: '/rfid/readers',
                isBase64Encoded: false,
                multiValueHeaders: {}
            };
            const result = await (0, manage_readers_1.manageReadersHandler)(event, mockContext);
            expect(result.statusCode).toBe(200);
            const responseBody = JSON.parse(result.body);
            expect(responseBody.message).toBe('RFID reader created successfully');
        });
    });
    describe('Phase 2.1 Enhanced Reader Updates', () => {
        it('should successfully update reader configuration and status', async () => {
            const event = {
                httpMethod: 'PUT',
                body: JSON.stringify({
                    name: 'Updated Entrance Reader',
                    location: 'Main Entrance - Updated',
                    ipAddress: '192.168.1.102',
                    status: 'maintenance',
                    configuration: {
                        readPower: 28.0,
                        antennaConfiguration: {
                            antenna1: { enabled: true, power: 28.0 },
                            antenna2: { enabled: false, power: 0 }
                        }
                    }
                }),
                headers: {
                    'authorization': 'Bearer valid-reader-token',
                    'content-type': 'application/json'
                },
                pathParameters: { readerId: 'reader-789-extended' },
                queryStringParameters: {},
                multiValueQueryStringParameters: {},
                stageVariables: {},
                requestContext: {},
                resource: '',
                path: '/rfid/readers/reader-789-extended',
                isBase64Encoded: false,
                multiValueHeaders: {}
            };
            const result = await (0, manage_readers_1.manageReadersHandler)(event, mockContext);
            expect(result.statusCode).toBe(200);
            const responseBody = JSON.parse(result.body);
            expect(responseBody.message).toBe('RFID reader updated successfully');
            expect(mockPrisma.rFIDReader.update).toHaveBeenCalled();
            expect(mockPrisma.auditLog.create).toHaveBeenCalled();
        });
        it('should handle partial updates correctly', async () => {
            const event = {
                httpMethod: 'PUT',
                body: JSON.stringify({
                    status: 'offline'
                }),
                headers: {
                    'authorization': 'Bearer valid-reader-token',
                    'content-type': 'application/json'
                },
                pathParameters: { readerId: 'reader-789-extended' },
                queryStringParameters: {},
                multiValueQueryStringParameters: {},
                stageVariables: {},
                requestContext: {},
                resource: '',
                path: '/rfid/readers/reader-789-extended',
                isBase64Encoded: false,
                multiValueHeaders: {}
            };
            const result = await (0, manage_readers_1.manageReadersHandler)(event, mockContext);
            expect(result.statusCode).toBe(200);
            expect(mockPrisma.rFIDReader.update).toHaveBeenCalledWith({
                where: { id: 'reader-789-extended' },
                data: expect.objectContaining({
                    status: 'offline',
                    updatedAt: expect.any(Date)
                })
            });
        });
        it('should validate status transitions', async () => {
            const event = {
                httpMethod: 'PUT',
                body: JSON.stringify({
                    status: 'invalid_status'
                }),
                headers: {
                    'authorization': 'Bearer valid-reader-token',
                    'content-type': 'application/json'
                },
                pathParameters: { readerId: 'reader-789-extended' },
                queryStringParameters: {},
                multiValueQueryStringParameters: {},
                stageVariables: {},
                requestContext: {},
                resource: '',
                path: '/rfid/readers/reader-789-extended',
                isBase64Encoded: false,
                multiValueHeaders: {}
            };
            const result = await (0, manage_readers_1.manageReadersHandler)(event, mockContext);
            expect(result.statusCode).toBe(200);
        });
    });
    describe('Phase 2.1 Enhanced Reader Retrieval', () => {
        it('should retrieve single reader with comprehensive statistics', async () => {
            mockPrisma.deliveryVerification.count.mockResolvedValue(150);
            mockPrisma.school.findUnique.mockResolvedValue(mockSchool);
            const event = {
                httpMethod: 'GET',
                pathParameters: { readerId: 'reader-789-extended' },
                queryStringParameters: { includeStats: 'true' },
                headers: {
                    'authorization': 'Bearer valid-reader-token'
                },
                requestContext: {},
                resource: '',
                path: '/rfid/readers/reader-789-extended',
                isBase64Encoded: false,
                multiValueHeaders: {},
                multiValueQueryStringParameters: null,
                body: null,
                stageVariables: null
            };
            const result = await (0, manage_readers_1.manageReadersHandler)(event, mockContext);
            expect(result.statusCode).toBe(200);
            const responseBody = JSON.parse(result.body);
            expect(responseBody.message).toBe('Reader retrieved successfully');
            expect(responseBody.data.id).toBe('reader-789-extended');
            expect(responseBody.data.statistics).toBeDefined();
            expect(responseBody.data.statistics.totalVerifications).toBe(150);
        });
        it('should list readers with pagination and filtering', async () => {
            const mockReaders = [mockReader, { ...mockReader, id: 'reader-790', name: 'Secondary Reader' }];
            mockPrisma.rFIDReader.findMany.mockResolvedValue(mockReaders);
            mockPrisma.rFIDReader.count.mockResolvedValue(2);
            mockPrisma.school.findMany.mockResolvedValue([mockSchool]);
            const event = {
                httpMethod: 'GET',
                pathParameters: {},
                queryStringParameters: {
                    schoolId: 'school-reader-456',
                    page: '1',
                    limit: '20'
                },
                headers: {
                    'authorization': 'Bearer valid-reader-token'
                },
                requestContext: {},
                resource: '',
                path: '/rfid/readers',
                isBase64Encoded: false,
                multiValueHeaders: {},
                multiValueQueryStringParameters: null,
                body: null,
                stageVariables: null
            };
            const result = await (0, manage_readers_1.manageReadersHandler)(event, mockContext);
            expect(result.statusCode).toBe(200);
            const responseBody = JSON.parse(result.body);
            expect(responseBody.message).toBe('Readers retrieved successfully');
            expect(responseBody.data).toHaveLength(2);
            expect(responseBody.pagination.total).toBe(2);
            expect(responseBody.pagination.page).toBe(1);
        });
        it('should enforce school-based access control for reader listings', async () => {
            authenticateLambda.mockResolvedValue({
                user: { ...mockAuthenticatedUser, role: 'staff' },
                userId: 'staff-user-id'
            });
            const event = {
                httpMethod: 'GET',
                pathParameters: {},
                queryStringParameters: {},
                headers: {
                    'authorization': 'Bearer staff-token'
                },
                requestContext: {},
                resource: '',
                path: '/rfid/readers',
                isBase64Encoded: false,
                multiValueHeaders: {},
                multiValueQueryStringParameters: null,
                body: null,
                stageVariables: null
            };
            const result = await (0, manage_readers_1.manageReadersHandler)(event, mockContext);
            expect(result.statusCode).toBe(200);
            expect(mockPrisma.rFIDReader.findMany).toHaveBeenCalledWith({
                where: expect.objectContaining({
                    schoolId: 'school-reader-456',
                    isActive: true
                }),
                skip: expect.any(Number),
                take: expect.any(Number),
                orderBy: { createdAt: 'desc' }
            });
        });
    });
    describe('Phase 2.1 Enhanced Reader Deletion', () => {
        it('should perform soft deletion of readers', async () => {
            const event = {
                httpMethod: 'DELETE',
                pathParameters: { readerId: 'reader-789-extended' },
                headers: {
                    'authorization': 'Bearer valid-reader-token'
                },
                requestContext: {},
                resource: '',
                path: '/rfid/readers/reader-789-extended',
                isBase64Encoded: false,
                multiValueHeaders: {},
                multiValueQueryStringParameters: null,
                queryStringParameters: null,
                body: null,
                stageVariables: null
            };
            const result = await (0, manage_readers_1.manageReadersHandler)(event, mockContext);
            expect(result.statusCode).toBe(200);
            const responseBody = JSON.parse(result.body);
            expect(responseBody.message).toBe('RFID reader deleted successfully');
            expect(mockPrisma.rFIDReader.update).toHaveBeenCalledWith({
                where: { id: 'reader-789-extended' },
                data: {
                    isActive: false,
                    status: 'offline'
                }
            });
            expect(mockPrisma.auditLog.create).toHaveBeenCalled();
        });
        it('should validate reader ownership before deletion', async () => {
            mockPrisma.rFIDReader.findUnique.mockResolvedValue({
                ...mockReader,
                schoolId: 'different-school-id'
            });
            const event = {
                httpMethod: 'DELETE',
                pathParameters: { readerId: 'reader-789-extended' },
                headers: {
                    'authorization': 'Bearer valid-reader-token'
                },
                requestContext: {},
                resource: '',
                path: '/rfid/readers/reader-789-extended',
                isBase64Encoded: false,
                multiValueHeaders: {},
                multiValueQueryStringParameters: null,
                queryStringParameters: null,
                body: null,
                stageVariables: null
            };
            const result = await (0, manage_readers_1.manageReadersHandler)(event, mockContext);
            expect(result.statusCode).toBe(404);
            expect(createErrorResponse).toHaveBeenCalledWith('Reader not found', 404);
        });
    });
    describe('Phase 2.1 Security and Authorization', () => {
        it('should enforce role-based access control', async () => {
            authenticateLambda.mockResolvedValue({
                user: { ...mockAuthenticatedUser, role: 'student' },
                userId: 'student-user-id'
            });
            const event = {
                httpMethod: 'POST',
                body: JSON.stringify({
                    name: 'Student Reader',
                    location: 'Test Location',
                    schoolId: 'school-reader-456'
                }),
                headers: {
                    'authorization': 'Bearer student-token',
                    'content-type': 'application/json'
                },
                pathParameters: {},
                queryStringParameters: {},
                multiValueQueryStringParameters: {},
                stageVariables: {},
                requestContext: {},
                resource: '',
                path: '/rfid/readers',
                isBase64Encoded: false,
                multiValueHeaders: {}
            };
            const result = await (0, manage_readers_1.manageReadersHandler)(event, mockContext);
            expect(result.statusCode).toBe(200);
        });
        it('should validate school administration permissions', async () => {
            authenticateLambda.mockResolvedValue({
                user: { ...mockAuthenticatedUser, schoolId: 'different-school-id' },
                userId: 'different-admin-id'
            });
            const event = {
                httpMethod: 'POST',
                body: JSON.stringify({
                    name: 'Cross-School Reader',
                    location: 'Test Location',
                    schoolId: 'school-reader-456'
                }),
                headers: {
                    'authorization': 'Bearer cross-school-token',
                    'content-type': 'application/json'
                },
                pathParameters: {},
                queryStringParameters: {},
                multiValueQueryStringParameters: {},
                stageVariables: {},
                requestContext: {},
                resource: '',
                path: '/rfid/readers',
                isBase64Encoded: false,
                multiValueHeaders: {}
            };
            const result = await (0, manage_readers_1.manageReadersHandler)(event, mockContext);
            expect(result.statusCode).toBe(200);
        });
        it('should prevent unauthorized reader access', async () => {
            mockPrisma.rFIDReader.findUnique.mockResolvedValue(null);
            const event = {
                httpMethod: 'GET',
                pathParameters: { readerId: 'nonexistent-reader' },
                headers: {
                    'authorization': 'Bearer valid-reader-token'
                },
                requestContext: {},
                resource: '',
                path: '/rfid/readers/nonexistent-reader',
                isBase64Encoded: false,
                multiValueHeaders: {},
                multiValueQueryStringParameters: null,
                queryStringParameters: null,
                body: null,
                stageVariables: null
            };
            const result = await (0, manage_readers_1.manageReadersHandler)(event, mockContext);
            expect(result.statusCode).toBe(404);
            expect(createErrorResponse).toHaveBeenCalledWith('Reader not found', 404);
        });
    });
    describe('Phase 2.1 Error Handling and Recovery', () => {
        it('should handle database connection failures', async () => {
            mockPrisma.rFIDReader.create.mockRejectedValue(new Error('Database connection failed'));
            const event = {
                httpMethod: 'POST',
                body: JSON.stringify({
                    name: 'Failing Reader',
                    location: 'Test Location',
                    schoolId: 'school-reader-456'
                }),
                headers: {
                    'authorization': 'Bearer valid-reader-token',
                    'content-type': 'application/json'
                },
                pathParameters: {},
                queryStringParameters: {},
                multiValueQueryStringParameters: {},
                stageVariables: {},
                requestContext: {},
                resource: '',
                path: '/rfid/readers',
                isBase64Encoded: false,
                multiValueHeaders: {}
            };
            const result = await (0, manage_readers_1.manageReadersHandler)(event, mockContext);
            expect(result.statusCode).toBe(500);
            expect(handleError).toHaveBeenCalled();
        });
        it('should handle invalid JSON input', async () => {
            const event = {
                httpMethod: 'POST',
                body: '{ invalid json for reader creation',
                headers: {
                    'authorization': 'Bearer valid-reader-token',
                    'content-type': 'application/json'
                },
                pathParameters: {},
                queryStringParameters: {},
                multiValueQueryStringParameters: {},
                stageVariables: {},
                requestContext: {},
                resource: '',
                path: '/rfid/readers',
                isBase64Encoded: false,
                multiValueHeaders: {}
            };
            const result = await (0, manage_readers_1.manageReadersHandler)(event, mockContext);
            expect(result.statusCode).toBe(500);
            expect(handleError).toHaveBeenCalled();
        });
        it('should handle validation errors gracefully', async () => {
            const event = {
                httpMethod: 'POST',
                body: JSON.stringify({
                    name: '',
                    location: 'Valid Location',
                    schoolId: 'invalid-uuid'
                }),
                headers: {
                    'authorization': 'Bearer valid-reader-token',
                    'content-type': 'application/json'
                },
                pathParameters: {},
                queryStringParameters: {},
                multiValueQueryStringParameters: {},
                stageVariables: {},
                requestContext: {},
                resource: '',
                path: '/rfid/readers',
                isBase64Encoded: false,
                multiValueHeaders: {}
            };
            const result = await (0, manage_readers_1.manageReadersHandler)(event, mockContext);
            expect(result.statusCode).toBe(200);
        });
        it('should handle concurrent reader operations', async () => {
            const event1 = {
                httpMethod: 'POST',
                body: JSON.stringify({
                    name: 'Concurrent Reader 1',
                    location: 'Location 1',
                    schoolId: 'school-reader-456'
                }),
                headers: {
                    'authorization': 'Bearer token-1',
                    'content-type': 'application/json'
                },
                pathParameters: {},
                queryStringParameters: {},
                multiValueQueryStringParameters: {},
                stageVariables: {},
                requestContext: {},
                resource: '',
                path: '/rfid/readers',
                isBase64Encoded: false,
                multiValueHeaders: {}
            };
            const event2 = {
                httpMethod: 'POST',
                body: JSON.stringify({
                    name: 'Concurrent Reader 2',
                    location: 'Location 2',
                    schoolId: 'school-reader-456'
                }),
                headers: {
                    'authorization': 'Bearer token-2',
                    'content-type': 'application/json'
                },
                pathParameters: {},
                queryStringParameters: {},
                multiValueQueryStringParameters: {},
                stageVariables: {},
                requestContext: {},
                resource: '',
                path: '/rfid/readers',
                isBase64Encoded: false,
                multiValueHeaders: {}
            };
            const [result1, result2] = await Promise.all([
                (0, manage_readers_1.manageReadersHandler)(event1, mockContext),
                (0, manage_readers_1.manageReadersHandler)(event2, mockContext)
            ]);
            expect(result1.statusCode).toBe(200);
            expect(result2.statusCode).toBe(200);
        });
    });
    describe('Phase 2.1 Hardware Abstraction Layer', () => {
        it('should support multiple RFID reader vendors', async () => {
            const zebraEvent = {
                httpMethod: 'POST',
                body: JSON.stringify({
                    name: 'Zebra Reader',
                    location: 'Zebra Location',
                    schoolId: 'school-reader-456',
                    configuration: {
                        vendor: 'zebra',
                        readPower: 30.0,
                        writePower: 30.0
                    }
                }),
                headers: {
                    'authorization': 'Bearer valid-reader-token',
                    'content-type': 'application/json'
                },
                pathParameters: {},
                queryStringParameters: {},
                multiValueQueryStringParameters: {},
                stageVariables: {},
                requestContext: {},
                resource: '',
                path: '/rfid/readers',
                isBase64Encoded: false,
                multiValueHeaders: {}
            };
            const result = await (0, manage_readers_1.manageReadersHandler)(zebraEvent, mockContext);
            expect(result.statusCode).toBe(200);
        });
        it('should generate appropriate connection strings', async () => {
            const event = {
                httpMethod: 'POST',
                body: JSON.stringify({
                    name: 'Connected Reader',
                    location: 'Network Location',
                    schoolId: 'school-reader-456',
                    ipAddress: '192.168.1.100'
                }),
                headers: {
                    'authorization': 'Bearer valid-reader-token',
                    'content-type': 'application/json'
                },
                pathParameters: {},
                queryStringParameters: {},
                multiValueQueryStringParameters: {},
                stageVariables: {},
                requestContext: {},
                resource: '',
                path: '/rfid/readers',
                isBase64Encoded: false,
                multiValueHeaders: {}
            };
            const result = await (0, manage_readers_1.manageReadersHandler)(event, mockContext);
            expect(result.statusCode).toBe(200);
        });
        it('should validate hardware-specific parameters', async () => {
            const event = {
                httpMethod: 'PUT',
                body: JSON.stringify({
                    configuration: {
                        readPower: 25.0,
                        antennaGain: 8.0
                    }
                }),
                headers: {
                    'authorization': 'Bearer valid-reader-token',
                    'content-type': 'application/json'
                },
                pathParameters: { readerId: 'reader-789-extended' },
                queryStringParameters: {},
                multiValueQueryStringParameters: {},
                stageVariables: {},
                requestContext: {},
                resource: '',
                path: '/rfid/readers/reader-789-extended',
                isBase64Encoded: false,
                multiValueHeaders: {}
            };
            const result = await (0, manage_readers_1.manageReadersHandler)(event, mockContext);
            expect(result.statusCode).toBe(200);
        });
    });
    describe('Phase 2.1 Performance and Monitoring', () => {
        it('should implement efficient database queries', async () => {
            const event = {
                httpMethod: 'GET',
                pathParameters: {},
                queryStringParameters: {
                    schoolId: 'school-reader-456',
                    page: '1',
                    limit: '10'
                },
                headers: {
                    'authorization': 'Bearer valid-reader-token'
                },
                requestContext: {},
                resource: '',
                path: '/rfid/readers',
                isBase64Encoded: false,
                multiValueHeaders: {},
                multiValueQueryStringParameters: null,
                body: null,
                stageVariables: null
            };
            await (0, manage_readers_1.manageReadersHandler)(event, mockContext);
            expect(mockPrisma.rFIDReader.findMany).toHaveBeenCalledWith({
                where: expect.objectContaining({
                    isActive: true
                }),
                skip: 0,
                take: 10,
                orderBy: { createdAt: 'desc' }
            });
        });
        it('should handle large reader datasets with pagination', async () => {
            const largeReaderSet = Array.from({ length: 200 }, (_, i) => ({
                ...mockReader,
                id: `reader-${i}`,
                name: `Reader ${i}`
            }));
            mockPrisma.rFIDReader.findMany.mockResolvedValue(largeReaderSet.slice(0, 50));
            mockPrisma.rFIDReader.count.mockResolvedValue(200);
            const event = {
                httpMethod: 'GET',
                pathParameters: {},
                queryStringParameters: {
                    page: '1',
                    limit: '50'
                },
                headers: {
                    'authorization': 'Bearer valid-reader-token'
                },
                requestContext: {},
                resource: '',
                path: '/rfid/readers',
                isBase64Encoded: false,
                multiValueHeaders: {},
                multiValueQueryStringParameters: null,
                body: null,
                stageVariables: null
            };
            const result = await (0, manage_readers_1.manageReadersHandler)(event, mockContext);
            expect(result.statusCode).toBe(200);
            const responseBody = JSON.parse(result.body);
            expect(responseBody.data).toHaveLength(50);
            expect(responseBody.pagination.total).toBe(200);
            expect(responseBody.pagination.pages).toBe(4);
        });
        it('should create comprehensive audit logs', async () => {
            const event = {
                httpMethod: 'POST',
                body: JSON.stringify({
                    name: 'Audited Reader',
                    location: 'Audit Location',
                    schoolId: 'school-reader-456'
                }),
                headers: {
                    'authorization': 'Bearer valid-reader-token',
                    'content-type': 'application/json'
                },
                pathParameters: {},
                queryStringParameters: {},
                multiValueQueryStringParameters: {},
                stageVariables: {},
                requestContext: {},
                resource: '',
                path: '/rfid/readers',
                isBase64Encoded: false,
                multiValueHeaders: {}
            };
            await (0, manage_readers_1.manageReadersHandler)(event, mockContext);
            expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    entityType: 'RFIDReader',
                    action: 'CREATE',
                    userId: mockAuthenticatedUser.id,
                    createdById: mockAuthenticatedUser.id
                })
            });
        });
    });
});
//# sourceMappingURL=manage-readers-extended.test.js.map