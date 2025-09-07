"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RFIDHardwareAbstraction = exports.manageReadersHandler = exports.ReaderStatus = exports.ReaderVendor = void 0;
const client_1 = require("@prisma/client");
const logger_service_1 = require("../shared/logger.service");
const response_utils_1 = require("../shared/response.utils");
const lambda_auth_middleware_1 = require("../../shared/middleware/lambda-auth.middleware");
const joi_1 = __importDefault(require("joi"));
const prisma = new client_1.PrismaClient();
var ReaderVendor;
(function (ReaderVendor) {
    ReaderVendor["ZEBRA"] = "zebra";
    ReaderVendor["IMPINJ"] = "impinj";
    ReaderVendor["NXP"] = "nxp";
    ReaderVendor["HONEYWELL"] = "honeywell";
    ReaderVendor["ALIEN"] = "alien";
})(ReaderVendor || (exports.ReaderVendor = ReaderVendor = {}));
var ReaderStatus;
(function (ReaderStatus) {
    ReaderStatus["ONLINE"] = "online";
    ReaderStatus["OFFLINE"] = "offline";
    ReaderStatus["ERROR"] = "error";
    ReaderStatus["MAINTENANCE"] = "maintenance";
    ReaderStatus["CONFIGURING"] = "configuring";
})(ReaderStatus || (exports.ReaderStatus = ReaderStatus = {}));
const readerSchema = joi_1.default.object({
    name: joi_1.default.string().required().min(3).max(100),
    location: joi_1.default.string().required().min(3).max(200),
    schoolId: joi_1.default.string().uuid().required(),
    ipAddress: joi_1.default.string().ip().optional(),
    configuration: joi_1.default.object().optional().default({}),
    isActive: joi_1.default.boolean().optional().default(true)
});
const updateReaderSchema = joi_1.default.object({
    name: joi_1.default.string().min(3).max(100).optional(),
    location: joi_1.default.string().min(3).max(200).optional(),
    ipAddress: joi_1.default.string().ip().optional(),
    configuration: joi_1.default.object().optional(),
    status: joi_1.default.string().valid(...Object.values(ReaderStatus)).optional(),
    isActive: joi_1.default.boolean().optional()
});
class RFIDHardwareAbstraction {
    static getDefaultConfiguration(vendor) {
        const configurations = {
            [ReaderVendor.ZEBRA]: {
                readPower: 30.0,
                writePower: 30.0,
                antennaConfiguration: {
                    antenna1: { enabled: true, power: 30.0 },
                    antenna2: { enabled: true, power: 30.0 },
                    antenna3: { enabled: false, power: 0 },
                    antenna4: { enabled: false, power: 0 }
                },
                protocolSettings: {
                    gen2: {
                        session: 'S0',
                        target: 'A',
                        qValue: 8
                    }
                },
                filterSettings: {
                    enableFilters: false,
                    filters: []
                }
            },
            [ReaderVendor.IMPINJ]: {
                readerMode: 'DenseReaderM4',
                antennas: [
                    { id: 1, enabled: true, txPower: 30.0, rxSensitivity: -70 },
                    { id: 2, enabled: true, txPower: 30.0, rxSensitivity: -70 }
                ],
                tagReporting: {
                    enableRSSI: true,
                    enablePhase: false,
                    enableDoppler: false,
                    enablePeakRSSI: true
                },
                searchMode: {
                    type: 'dual_target',
                    populationEstimate: 32
                }
            },
            [ReaderVendor.NXP]: {
                operatingMode: 'continuous',
                frequency: {
                    region: 'FCC',
                    channels: 'auto'
                },
                readConfiguration: {
                    readRate: 'high',
                    sensitivity: 'medium',
                    selectivity: 'medium'
                },
                antennaSettings: {
                    port1: { enabled: true, power: 30 },
                    port2: { enabled: true, power: 30 }
                }
            },
            [ReaderVendor.HONEYWELL]: {
                readMode: 'performance',
                antennaConfig: {
                    antenna1: { power: 30, enabled: true },
                    antenna2: { power: 30, enabled: true }
                },
                rfSettings: {
                    modulationType: 'DSB-ASK',
                    dataEncoding: 'FM0'
                }
            },
            [ReaderVendor.ALIEN]: {
                acquireMode: 'inventory',
                antennaSequence: '0,1',
                rfAttenuation: '0',
                rfLevel: '250',
                tagListFormat: 'custom',
                readerName: 'ALR-9900+'
            }
        };
        return configurations[vendor] || {};
    }
    static validateConfiguration(vendor, config) {
        const errors = [];
        switch (vendor) {
            case ReaderVendor.ZEBRA:
                if (config.readPower && (config.readPower < 0 || config.readPower > 32.5)) {
                    errors.push('Zebra read power must be between 0 and 32.5 dBm');
                }
                if (config.writePower && (config.writePower < 0 || config.writePower > 32.5)) {
                    errors.push('Zebra write power must be between 0 and 32.5 dBm');
                }
                break;
            case ReaderVendor.IMPINJ:
                if (config.antennas) {
                    config.antennas.forEach((antenna, index) => {
                        if (antenna.txPower && (antenna.txPower < 10 || antenna.txPower > 32.5)) {
                            errors.push(`Impinj antenna ${index + 1} tx power must be between 10 and 32.5 dBm`);
                        }
                    });
                }
                break;
            case ReaderVendor.NXP:
                if (config.readConfiguration?.readRate &&
                    !['low', 'medium', 'high'].includes(config.readConfiguration.readRate)) {
                    errors.push('NXP read rate must be low, medium, or high');
                }
                break;
            case ReaderVendor.HONEYWELL:
                if (config.antennaConfig) {
                    Object.values(config.antennaConfig).forEach((antenna, index) => {
                        if (antenna.power && (antenna.power < 0 || antenna.power > 30)) {
                            errors.push(`Honeywell antenna ${index + 1} power must be between 0 and 30 dBm`);
                        }
                    });
                }
                break;
            case ReaderVendor.ALIEN:
                if (config.rfLevel && (parseInt(config.rfLevel) < 0 || parseInt(config.rfLevel) > 300)) {
                    errors.push('Alien RF level must be between 0 and 300');
                }
                break;
        }
        return { isValid: errors.length === 0, errors };
    }
    static generateConnectionString(vendor, ipAddress, config) {
        const defaultPorts = {
            [ReaderVendor.ZEBRA]: 14150,
            [ReaderVendor.IMPINJ]: 5084,
            [ReaderVendor.NXP]: 4001,
            [ReaderVendor.HONEYWELL]: 2189,
            [ReaderVendor.ALIEN]: 23
        };
        const port = config.port || defaultPorts[vendor];
        const protocol = config.protocol || 'tcp';
        return `${protocol}://${ipAddress}:${port}`;
    }
}
exports.RFIDHardwareAbstraction = RFIDHardwareAbstraction;
function canManageReaders(requestingUser, schoolId) {
    const userRole = requestingUser.role;
    if (['super_admin', 'admin'].includes(userRole)) {
        return true;
    }
    if (userRole === 'school_admin' && requestingUser.schoolId === schoolId) {
        return true;
    }
    if (userRole === 'staff' && requestingUser.schoolId === schoolId) {
        return true;
    }
    return false;
}
async function validateSchool(schoolId) {
    const school = await prisma.school.findUnique({
        where: { id: schoolId },
        select: {
            id: true,
            name: true,
            code: true,
            isActive: true
        }
    });
    if (!school) {
        throw new Error('School not found');
    }
    if (!school.isActive) {
        throw new Error('School is inactive');
    }
    return school;
}
async function getReaderStatistics(readerId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [totalVerifications, verificationsToday] = await Promise.all([
        prisma.deliveryVerification.count({
            where: { readerId }
        }),
        prisma.deliveryVerification.count({
            where: {
                readerId,
                verifiedAt: { gte: today }
            }
        })
    ]);
    return {
        totalVerifications,
        verificationsToday,
        uptime: 99.5,
        lastError: null
    };
}
async function createReaderAuditLog(readerId, action, userId, changes) {
    await prisma.auditLog.create({
        data: {
            entityType: 'RFIDReader',
            entityId: readerId,
            action,
            changes: JSON.stringify(changes),
            userId,
            createdById: userId,
            metadata: JSON.stringify({
                action: `RFID_READER_${action}`,
                timestamp: new Date().toISOString()
            })
        }
    });
}
async function createReader(readerData, userId) {
    const school = await validateSchool(readerData.schoolId);
    const existingReader = await prisma.rFIDReader.findFirst({
        where: {
            name: readerData.name,
            schoolId: readerData.schoolId,
            isActive: true
        }
    });
    if (existingReader) {
        throw new Error(`Reader with name ${readerData.name} already exists in this school`);
    }
    const mergedConfig = readerData.configuration || {};
    const reader = await prisma.rFIDReader.create({
        data: {
            name: readerData.name,
            location: readerData.location,
            schoolId: readerData.schoolId,
            ipAddress: readerData.ipAddress || null,
            status: 'offline',
            isActive: readerData.isActive !== false,
            configuration: JSON.stringify(mergedConfig)
        }
    });
    await createReaderAuditLog(reader.id, 'CREATE', userId, {
        readerName: reader.name,
        location: reader.location
    });
    let configuration = {};
    try {
        configuration = JSON.parse(reader.configuration);
    }
    catch (error) {
        configuration = {};
    }
    return {
        id: reader.id,
        name: reader.name,
        location: reader.location,
        schoolId: reader.schoolId,
        ipAddress: reader.ipAddress || undefined,
        status: reader.status,
        isActive: reader.isActive,
        configuration,
        lastHeartbeat: reader.lastHeartbeat || undefined,
        createdAt: reader.createdAt,
        updatedAt: reader.updatedAt,
        schoolName: school.name
    };
}
async function updateReader(readerId, updateData, userId) {
    const existingReader = await prisma.rFIDReader.findUnique({
        where: { id: readerId }
    });
    if (!existingReader) {
        throw new Error('Reader not found');
    }
    let updatedConfiguration = existingReader.configuration;
    if (updateData.configuration) {
        let currentConfig = {};
        try {
            currentConfig = JSON.parse(existingReader.configuration);
        }
        catch (error) {
            currentConfig = {};
        }
        const mergedConfig = { ...currentConfig, ...updateData.configuration };
        updatedConfiguration = JSON.stringify(mergedConfig);
    }
    const updatedReader = await prisma.rFIDReader.update({
        where: { id: readerId },
        data: {
            ...(updateData.name && { name: updateData.name }),
            ...(updateData.location && { location: updateData.location }),
            ...(updateData.ipAddress !== undefined && { ipAddress: updateData.ipAddress }),
            ...(updateData.status && { status: updateData.status }),
            ...(updateData.isActive !== undefined && { isActive: updateData.isActive }),
            ...(updateData.configuration && {
                configuration: updatedConfiguration
            })
        }
    });
    await createReaderAuditLog(readerId, 'UPDATE', userId, updateData);
    let configuration = {};
    try {
        configuration = JSON.parse(updatedReader.configuration);
    }
    catch (error) {
        configuration = {};
    }
    const school = await prisma.school.findUnique({
        where: { id: updatedReader.schoolId },
        select: { name: true }
    });
    return {
        id: updatedReader.id,
        name: updatedReader.name,
        location: updatedReader.location,
        schoolId: updatedReader.schoolId,
        ipAddress: updatedReader.ipAddress || undefined,
        status: updatedReader.status,
        isActive: updatedReader.isActive,
        configuration,
        lastHeartbeat: updatedReader.lastHeartbeat || undefined,
        createdAt: updatedReader.createdAt,
        updatedAt: updatedReader.updatedAt,
        schoolName: school?.name
    };
}
const manageReadersHandler = async (event, context) => {
    const logger = logger_service_1.LoggerService.getInstance();
    const requestId = context.awsRequestId;
    const httpMethod = event.httpMethod;
    try {
        logger.info('RFID reader management request started', { requestId, httpMethod });
        const authenticatedUser = await (0, lambda_auth_middleware_1.authenticateLambda)(event);
        switch (httpMethod) {
            case 'POST':
                return await handleCreateReader(event, requestId, authenticatedUser.user);
            case 'PUT':
                return await handleUpdateReader(event, requestId, authenticatedUser.user);
            case 'GET':
                return await handleGetReaders(event, requestId, authenticatedUser.user);
            case 'DELETE':
                return await handleDeleteReader(event, requestId, authenticatedUser.user);
            default:
                return (0, response_utils_1.createErrorResponse)(405, 'Method not allowed');
        }
    }
    catch (error) {
        logger.error('RFID reader management failed', {
            requestId,
            httpMethod,
            error: error.message,
            stack: error.stack
        });
        return (0, response_utils_1.handleError)(error, 'Failed to manage RFID reader');
    }
    finally {
        await prisma.$disconnect();
    }
};
exports.manageReadersHandler = manageReadersHandler;
async function handleCreateReader(event, requestId, authenticatedUser) {
    const logger = logger_service_1.LoggerService.getInstance();
    const requestBody = JSON.parse(event.body || '{}');
    const { error, value: readerData } = readerSchema.validate(requestBody);
    if (error) {
        logger.warn('Invalid create reader request data', { requestId, error: error.details });
        return (0, response_utils_1.createErrorResponse)(400, 'Invalid request data', error.details);
    }
    const createReaderData = readerData;
    if (!canManageReaders(authenticatedUser, createReaderData.schoolId)) {
        logger.warn('Unauthorized reader creation attempt', {
            requestId,
            userId: authenticatedUser.id,
            schoolId: createReaderData.schoolId,
            userRole: authenticatedUser.role
        });
        return (0, response_utils_1.createErrorResponse)(403, 'Insufficient permissions to manage readers for this school');
    }
    const reader = await createReader(createReaderData, authenticatedUser.id);
    logger.info('RFID reader created successfully', {
        requestId,
        readerId: reader.id,
        readerName: reader.name,
        schoolId: reader.schoolId,
        createdBy: authenticatedUser.email
    });
    return (0, response_utils_1.createSuccessResponse)({
        message: 'RFID reader created successfully',
        data: reader
    });
}
async function handleUpdateReader(event, requestId, authenticatedUser) {
    const logger = logger_service_1.LoggerService.getInstance();
    const readerId = event.pathParameters?.readerId;
    if (!readerId) {
        return (0, response_utils_1.createErrorResponse)(400, 'Reader ID is required');
    }
    const requestBody = JSON.parse(event.body || '{}');
    const { error, value: updateData } = updateReaderSchema.validate(requestBody);
    if (error) {
        logger.warn('Invalid update reader request data', { requestId, error: error.details });
        return (0, response_utils_1.createErrorResponse)(400, 'Invalid request data', error.details);
    }
    const existingReader = await prisma.rFIDReader.findUnique({
        where: { id: readerId },
        select: { schoolId: true }
    });
    if (!existingReader) {
        return (0, response_utils_1.createErrorResponse)(404, 'Reader not found');
    }
    if (!canManageReaders(authenticatedUser, existingReader.schoolId)) {
        logger.warn('Unauthorized reader update attempt', {
            requestId,
            userId: authenticatedUser.id,
            readerId,
            schoolId: existingReader.schoolId,
            userRole: authenticatedUser.role
        });
        return (0, response_utils_1.createErrorResponse)(403, 'Insufficient permissions to manage this reader');
    }
    const reader = await updateReader(readerId, updateData, authenticatedUser.id);
    logger.info('RFID reader updated successfully', {
        requestId,
        readerId: reader.id,
        updatedBy: authenticatedUser.email
    });
    return (0, response_utils_1.createSuccessResponse)({
        message: 'RFID reader updated successfully',
        data: reader
    });
}
async function handleGetReaders(event, requestId, authenticatedUser) {
    const logger = logger_service_1.LoggerService.getInstance();
    const readerId = event.pathParameters?.readerId;
    const queryParams = event.queryStringParameters || {};
    if (readerId) {
        const reader = await prisma.rFIDReader.findUnique({
            where: { id: readerId }
        });
        if (!reader) {
            return (0, response_utils_1.createErrorResponse)(404, 'Reader not found');
        }
        if (!canManageReaders(authenticatedUser, reader.schoolId)) {
            return (0, response_utils_1.createErrorResponse)(403, 'Insufficient permissions to view this reader');
        }
        let configuration = {};
        try {
            configuration = JSON.parse(reader.configuration);
        }
        catch (error) {
            configuration = {};
        }
        let statistics;
        if (queryParams.includeStats === 'true') {
            statistics = await getReaderStatistics(readerId);
        }
        const school = await prisma.school.findUnique({
            where: { id: reader.schoolId },
            select: { name: true }
        });
        const readerResponse = {
            id: reader.id,
            name: reader.name,
            location: reader.location,
            schoolId: reader.schoolId,
            ipAddress: reader.ipAddress || undefined,
            status: reader.status,
            isActive: reader.isActive,
            configuration,
            lastHeartbeat: reader.lastHeartbeat || undefined,
            createdAt: reader.createdAt,
            updatedAt: reader.updatedAt,
            schoolName: school?.name,
            statistics
        };
        return (0, response_utils_1.createSuccessResponse)({
            message: 'Reader retrieved successfully',
            data: readerResponse
        });
    }
    else {
        const schoolId = queryParams.schoolId;
        const page = parseInt(queryParams.page || '1');
        const limit = Math.min(parseInt(queryParams.limit || '20'), 100);
        const skip = (page - 1) * limit;
        let whereClause = { isActive: true };
        if (['super_admin', 'admin'].includes(authenticatedUser.role)) {
            if (schoolId) {
                whereClause.schoolId = schoolId;
            }
        }
        else {
            whereClause.schoolId = authenticatedUser.schoolId;
        }
        const [readers, totalCount] = await Promise.all([
            prisma.rFIDReader.findMany({
                where: whereClause,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' }
            }),
            prisma.rFIDReader.count({ where: whereClause })
        ]);
        const schoolIds = [...new Set(readers.map(r => r.schoolId))];
        const schools = await prisma.school.findMany({
            where: { id: { in: schoolIds } },
            select: { id: true, name: true }
        });
        const schoolMap = new Map(schools.map(s => [s.id, s.name]));
        const readerResponses = readers.map(reader => {
            let configuration = {};
            try {
                configuration = JSON.parse(reader.configuration);
            }
            catch (error) {
                configuration = {};
            }
            return {
                id: reader.id,
                name: reader.name,
                location: reader.location,
                schoolId: reader.schoolId,
                ipAddress: reader.ipAddress || undefined,
                status: reader.status,
                isActive: reader.isActive,
                configuration,
                lastHeartbeat: reader.lastHeartbeat || undefined,
                createdAt: reader.createdAt,
                updatedAt: reader.updatedAt,
                schoolName: schoolMap.get(reader.schoolId)
            };
        });
        return (0, response_utils_1.createSuccessResponse)({
            message: 'Readers retrieved successfully',
            data: readerResponses,
            pagination: {
                page,
                limit,
                total: totalCount,
                pages: Math.ceil(totalCount / limit)
            }
        });
    }
}
async function handleDeleteReader(event, requestId, authenticatedUser) {
    const logger = logger_service_1.LoggerService.getInstance();
    const readerId = event.pathParameters?.readerId;
    if (!readerId) {
        return (0, response_utils_1.createErrorResponse)(400, 'Reader ID is required');
    }
    const existingReader = await prisma.rFIDReader.findUnique({
        where: { id: readerId },
        select: { schoolId: true, name: true }
    });
    if (!existingReader) {
        return (0, response_utils_1.createErrorResponse)(404, 'Reader not found');
    }
    if (!canManageReaders(authenticatedUser, existingReader.schoolId)) {
        logger.warn('Unauthorized reader deletion attempt', {
            requestId,
            userId: authenticatedUser.id,
            readerId,
            schoolId: existingReader.schoolId,
            userRole: authenticatedUser.role
        });
        return (0, response_utils_1.createErrorResponse)(403, 'Insufficient permissions to delete this reader');
    }
    await prisma.rFIDReader.update({
        where: { id: readerId },
        data: {
            isActive: false,
            status: ReaderStatus.OFFLINE
        }
    });
    await createReaderAuditLog(readerId, 'DELETE', authenticatedUser.id, {
        readerName: existingReader.name,
        action: 'soft_delete'
    });
    logger.info('RFID reader deleted successfully', {
        requestId,
        readerId,
        deletedBy: authenticatedUser.email
    });
    return (0, response_utils_1.createSuccessResponse)({
        message: 'RFID reader deleted successfully'
    });
}
//# sourceMappingURL=manage-readers.js.map