"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reconciliationHandler = void 0;
const logger_service_1 = require("../shared/logger.service");
const validation_service_1 = require("../shared/validation.service");
const database_service_1 = require("../shared/database.service");
const response_utils_1 = require("../shared/response.utils");
const lambda_auth_middleware_1 = require("../../shared/middleware/lambda-auth.middleware");
const zod_1 = require("zod");
const logger = logger_service_1.LoggerService.getInstance();
const validator = validation_service_1.ValidationService.getInstance();
const db = database_service_1.LambdaDatabaseService.getInstance();
const reconciliationRequestSchema = zod_1.z.object({
    schoolId: zod_1.z.string().uuid(),
    startDate: zod_1.z.string().datetime(),
    endDate: zod_1.z.string().datetime(),
    gatewayType: zod_1.z.enum(['razorpay', 'stripe', 'paypal', 'all']).optional().default('all'),
    settlementIds: zod_1.z.array(zod_1.z.string()).optional(),
    forceReconciliation: zod_1.z.boolean().optional().default(false),
    includeSettlements: zod_1.z.boolean().optional().default(true),
    reconciliationType: zod_1.z.enum(['automated', 'manual', 'settlement'])
});
const manualReconciliationSchema = zod_1.z.object({
    transactionId: zod_1.z.string().uuid(),
    reconciliationAction: zod_1.z.enum(['match', 'dispute', 'write_off', 'investigate']),
    gatewayTransactionId: zod_1.z.string().optional(),
    adjustmentAmount: zod_1.z.number().optional(),
    adjustmentReason: zod_1.z.string().max(500).optional(),
    notes: zod_1.z.string().max(1000).optional(),
    reviewedBy: zod_1.z.string().uuid()
});
const reconciliationUpdateSchema = zod_1.z.object({
    reconciliationStatus: zod_1.z.enum(['pending', 'in_progress', 'completed', 'failed', 'cancelled', 'reconciled', 'discrepancies_found']).optional(),
    discrepancyReason: zod_1.z.string().max(1000).optional()
});
async function validateSchoolAccess(schoolId, userId) {
    try {
        const school = await db.prisma.school.findUnique({
            where: { id: schoolId },
            select: {
                id: true,
                name: true,
                isActive: true,
                code: true,
                configuration: true
            }
        });
        if (!school) {
            throw new Error('School not found');
        }
        if (!school.isActive) {
            throw new Error('School is not active');
        }
        const user = await db.prisma.user.findFirst({
            where: {
                id: userId,
                isActive: true,
                role: { in: ['admin', 'super_admin', 'school_admin', 'accountant', 'finance_manager'] }
            }
        });
        if (!user) {
            throw new Error('Insufficient permissions for reconciliation operations');
        }
        return { school, user };
    }
    catch (error) {
        logger.error('School access validation failed', { schoolId, userId, error: error.message });
        throw error;
    }
}
async function getInternalTransactions(schoolId, startDate, endDate) {
    try {
        const transactions = await db.prisma.paymentTransaction.findMany({
            where: {
                status: 'captured',
                capturedAt: {
                    gte: startDate,
                    lte: endDate
                }
            },
            include: {
                paymentOrder: {
                    select: {
                        id: true,
                        amount: true,
                        currency: true,
                        razorpayOrderId: true,
                        userId: true
                    }
                }
            },
            orderBy: {
                capturedAt: 'asc'
            }
        });
        return transactions;
    }
    catch (error) {
        logger.error('Failed to fetch internal transactions', { schoolId, startDate, endDate, error: error.message });
        throw error;
    }
}
async function getGatewayTransactions(gatewayType, startDate, endDate, schoolId) {
    try {
        logger.info('Fetching gateway transactions', { gatewayType, startDate, endDate, schoolId });
        const mockGatewayTransactions = [];
        return mockGatewayTransactions;
    }
    catch (error) {
        logger.error('Failed to fetch gateway transactions', { gatewayType, startDate, endDate, error: error.message });
        throw error;
    }
}
async function performAutomatedReconciliation(internalTransactions, gatewayTransactions) {
    try {
        const matched = [];
        const discrepancies = [];
        const processedGatewayIds = new Set();
        for (const internal of internalTransactions) {
            let foundMatch = false;
            for (const gateway of gatewayTransactions) {
                if (processedGatewayIds.has(gateway.id))
                    continue;
                if (internal.gatewayPaymentId === gateway.id) {
                    const internalAmount = parseFloat(internal.amount);
                    const gatewayAmount = parseFloat(gateway.amount) / 100;
                    if (Math.abs(internalAmount - gatewayAmount) < 0.01) {
                        matched.push({
                            internal,
                            gateway,
                            matchType: 'exact',
                            matchedAt: new Date().toISOString()
                        });
                        foundMatch = true;
                        processedGatewayIds.add(gateway.id);
                        break;
                    }
                    else {
                        discrepancies.push({
                            id: `disc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                            type: 'amount_mismatch',
                            internalTransactionId: internal.id,
                            gatewayTransactionId: gateway.id,
                            expectedAmount: internalAmount,
                            actualAmount: gatewayAmount,
                            difference: gatewayAmount - internalAmount,
                            description: `Amount mismatch: Expected ₹${internalAmount}, Found ₹${gatewayAmount}`,
                            status: 'open',
                            createdAt: new Date().toISOString()
                        });
                        foundMatch = true;
                        processedGatewayIds.add(gateway.id);
                        break;
                    }
                }
            }
            if (!foundMatch) {
                discrepancies.push({
                    id: `disc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    type: 'missing_payment',
                    internalTransactionId: internal.id,
                    expectedAmount: parseFloat(internal.amount),
                    difference: -parseFloat(internal.amount),
                    description: `Payment missing in gateway: ₹${internal.amount}`,
                    status: 'open',
                    createdAt: new Date().toISOString()
                });
            }
        }
        for (const gateway of gatewayTransactions) {
            if (!processedGatewayIds.has(gateway.id)) {
                const gatewayAmount = parseFloat(gateway.amount) / 100;
                discrepancies.push({
                    id: `disc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    type: 'extra_payment',
                    gatewayTransactionId: gateway.id,
                    actualAmount: gatewayAmount,
                    difference: gatewayAmount,
                    description: `Extra payment in gateway: ₹${gatewayAmount}`,
                    status: 'open',
                    createdAt: new Date().toISOString()
                });
            }
        }
        logger.info('Automated reconciliation completed', {
            totalInternal: internalTransactions.length,
            totalGateway: gatewayTransactions.length,
            matched: matched.length,
            discrepancies: discrepancies.length
        });
        return { matched, discrepancies };
    }
    catch (error) {
        logger.error('Automated reconciliation failed', { error: error.message });
        throw error;
    }
}
async function saveReconciliationResults(reconciliationData, matched, discrepancies, userId) {
    try {
        const reconciliationId = `recon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const totalAmount = matched.reduce((sum, m) => sum + parseFloat(m.internal.amount), 0);
        const reconciledAmount = matched.reduce((sum, m) => sum + parseFloat(m.internal.amount), 0);
        const discrepancyAmount = discrepancies.reduce((sum, d) => sum + Math.abs(d.difference), 0);
        const reconciliation = await db.prisma.reconciliationRecord.create({
            data: {
                id: reconciliationId,
                schoolId: reconciliationData.schoolId,
                recordDate: new Date(reconciliationData.startDate),
                recordType: reconciliationData.reconciliationType,
                totalPayments: totalAmount,
                totalRefunds: 0,
                totalFees: 0,
                netSettlement: reconciledAmount,
                paymentCount: matched.length,
                refundCount: 0,
                failedPaymentCount: discrepancies.length,
                reconciliationStatus: discrepancies.length > 0 ? 'discrepancies_found' : 'reconciled',
                discrepancyAmount,
                discrepancyReason: discrepancies.length > 0 ? 'Transaction mismatches found' : null
            }
        });
        if (discrepancies.length > 0) {
            logger.warn('Discrepancies found but discrepancy tracking model not implemented', {
                reconciliationId,
                discrepancyCount: discrepancies.length
            });
        }
        return {
            reconciliationId,
            schoolId: reconciliationData.schoolId,
            periodStart: reconciliationData.startDate,
            periodEnd: reconciliationData.endDate,
            totalTransactions: matched.length + discrepancies.filter(d => d.internalTransactionId).length,
            matchedTransactions: matched.length,
            unmatchedTransactions: discrepancies.length,
            discrepancies,
            totalAmount,
            reconciledAmount,
            discrepancyAmount,
            status: discrepancies.length > 0 ? 'discrepancies_found' : 'reconciled',
            generatedAt: new Date().toISOString(),
            generatedBy: userId
        };
    }
    catch (error) {
        logger.error('Failed to save reconciliation results', { error: error.message });
        throw error;
    }
}
async function performReconciliation(reconciliationData, userId) {
    try {
        const { school } = await validateSchoolAccess(reconciliationData.schoolId, userId);
        const startDate = new Date(reconciliationData.startDate);
        const endDate = new Date(reconciliationData.endDate);
        if (startDate >= endDate) {
            throw new Error('Start date must be before end date');
        }
        const daysDiff = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
        if (daysDiff > 365) {
            throw new Error('Reconciliation period cannot exceed 365 days');
        }
        if (!reconciliationData.forceReconciliation) {
            const existingReconciliation = await db.prisma.reconciliationRecord.findFirst({
                where: {
                    schoolId: reconciliationData.schoolId,
                    recordDate: {
                        gte: startDate,
                        lte: endDate
                    },
                    recordType: reconciliationData.reconciliationType,
                    reconciliationStatus: { not: 'failed' }
                }
            });
            if (existingReconciliation) {
                throw new Error('Reconciliation already exists for this period. Use forceReconciliation=true to override.');
            }
        }
        logger.info('Starting reconciliation process', {
            schoolId: reconciliationData.schoolId,
            startDate,
            endDate,
            gatewayType: reconciliationData.gatewayType
        });
        const internalTransactions = await getInternalTransactions(reconciliationData.schoolId, startDate, endDate);
        const gatewayTransactions = await getGatewayTransactions(reconciliationData.gatewayType || 'all', startDate, endDate, reconciliationData.schoolId);
        const { matched, discrepancies } = await performAutomatedReconciliation(internalTransactions, gatewayTransactions);
        const result = await saveReconciliationResults(reconciliationData, matched, discrepancies, userId);
        logger.info('Reconciliation completed successfully', {
            reconciliationId: result.reconciliationId,
            matched: matched.length,
            discrepancies: discrepancies.length,
            totalAmount: result.totalAmount
        });
        return result;
    }
    catch (error) {
        logger.error('Reconciliation process failed', { reconciliationData, userId, error: error.message });
        throw error;
    }
}
async function getReconciliationRecords(schoolId, userId, filters) {
    try {
        await validateSchoolAccess(schoolId, userId);
        const whereClause = {
            schoolId
        };
        if (filters?.status) {
            whereClause.reconciliationStatus = filters.status;
        }
        if (filters?.startDate && filters?.endDate) {
            whereClause.recordDate = {
                gte: new Date(filters.startDate),
                lte: new Date(filters.endDate)
            };
        }
        const records = await db.prisma.reconciliationRecord.findMany({
            where: whereClause,
            include: {},
            orderBy: {
                createdAt: 'desc'
            },
            take: 50
        });
        return records.map(record => ({
            reconciliationId: record.id,
            schoolId: record.schoolId,
            periodStart: record.recordDate.toISOString(),
            periodEnd: record.recordDate.toISOString(),
            totalTransactions: record.paymentCount + record.failedPaymentCount,
            matchedTransactions: record.paymentCount,
            unmatchedTransactions: record.failedPaymentCount,
            discrepancies: [],
            totalAmount: record.totalPayments,
            reconciledAmount: record.netSettlement,
            discrepancyAmount: record.discrepancyAmount,
            status: record.reconciliationStatus,
            generatedAt: record.createdAt.toISOString(),
            generatedBy: 'system'
        }));
    }
    catch (error) {
        logger.error('Failed to get reconciliation records', { schoolId, userId, error: error.message });
        throw error;
    }
}
async function processManualReconciliation(manualData, userId) {
    try {
        logger.warn('Manual reconciliation not yet implemented - ReconciliationDiscrepancy model needed', {
            manualData,
            userId
        });
        throw new Error('Manual reconciliation not yet implemented - ReconciliationDiscrepancy model needed');
    }
    catch (error) {
        logger.error('Manual reconciliation failed', { manualData, userId, error: error.message });
        throw error;
    }
}
const reconciliationHandler = async (event, context) => {
    const requestId = context.awsRequestId;
    const startTime = Date.now();
    try {
        logger.info('Reconciliation request started', { requestId, method: event.httpMethod });
        const authenticatedUser = await (0, lambda_auth_middleware_1.authenticateLambda)(event);
        const method = event.httpMethod;
        const pathParameters = event.pathParameters || {};
        const queryParameters = event.queryStringParameters || {};
        switch (method) {
            case 'POST':
                const requestBody = (0, response_utils_1.parseRequestBody)(event.body);
                if (!requestBody) {
                    return (0, response_utils_1.createErrorResponse)(400, 'Invalid request body', undefined, 'INVALID_REQUEST_BODY');
                }
                if (requestBody.reconciliationType === 'manual') {
                    const validatedManualData = manualReconciliationSchema.parse(requestBody);
                    const manualResult = await processManualReconciliation(validatedManualData, authenticatedUser.userId);
                    const duration1 = Date.now() - startTime;
                    logger.info('Manual reconciliation completed', {
                        requestId,
                        discrepancyId: manualResult.id,
                        action: manualResult.action,
                        duration: duration1
                    });
                    return (0, response_utils_1.createSuccessResponse)({
                        result: manualResult
                    }, 'Manual reconciliation processed successfully', 200);
                }
                else {
                    const validatedData = reconciliationRequestSchema.parse(requestBody);
                    const result = await performReconciliation(validatedData, authenticatedUser.userId);
                    const duration2 = Date.now() - startTime;
                    logger.info('Reconciliation completed successfully', {
                        requestId,
                        reconciliationId: result.reconciliationId,
                        matched: result.matchedTransactions,
                        discrepancies: result.unmatchedTransactions,
                        duration: duration2
                    });
                    return (0, response_utils_1.createSuccessResponse)({
                        reconciliation: result,
                        summary: {
                            totalTransactions: result.totalTransactions,
                            matchedTransactions: result.matchedTransactions,
                            discrepancies: result.unmatchedTransactions,
                            discrepancyAmount: result.discrepancyAmount
                        }
                    }, result.discrepancies.length > 0
                        ? `Found ${result.discrepancies.length} discrepancies totaling ₹${result.discrepancyAmount.toFixed(2)}`
                        : 'All transactions reconciled successfully', 201);
                }
            case 'GET':
                const schoolId = queryParameters.schoolId;
                if (!schoolId) {
                    return (0, response_utils_1.createErrorResponse)(400, 'School ID is required', undefined, 'MISSING_SCHOOL_ID');
                }
                if (pathParameters.recordId) {
                    const recordId = pathParameters.recordId;
                    const records = await getReconciliationRecords(schoolId, authenticatedUser.userId);
                    const record = records.find(r => r.reconciliationId === recordId);
                    if (!record) {
                        return (0, response_utils_1.createErrorResponse)(404, 'Reconciliation record not found', undefined, 'RECORD_NOT_FOUND');
                    }
                    const duration3 = Date.now() - startTime;
                    logger.info('Reconciliation record retrieved', {
                        requestId,
                        recordId,
                        duration: duration3
                    });
                    return (0, response_utils_1.createSuccessResponse)({
                        reconciliation: record
                    }, 'Reconciliation record retrieved successfully', 200);
                }
                else {
                    const filters = {
                        status: queryParameters.status,
                        startDate: queryParameters.startDate,
                        endDate: queryParameters.endDate
                    };
                    const records = await getReconciliationRecords(schoolId, authenticatedUser.userId, filters);
                    const duration4 = Date.now() - startTime;
                    logger.info('Reconciliation records listed', {
                        requestId,
                        schoolId,
                        count: records.length,
                        duration: duration4
                    });
                    return (0, response_utils_1.createSuccessResponse)({
                        reconciliations: records,
                        count: records.length
                    }, 'Reconciliation records retrieved successfully', 200);
                }
            case 'PUT':
                const updateRecordId = pathParameters.recordId;
                if (!updateRecordId) {
                    return (0, response_utils_1.createErrorResponse)(400, 'Record ID is required', undefined, 'MISSING_RECORD_ID');
                }
                const updateBody = (0, response_utils_1.parseRequestBody)(event.body);
                if (!updateBody) {
                    return (0, response_utils_1.createErrorResponse)(400, 'Invalid request body', undefined, 'INVALID_REQUEST_BODY');
                }
                const validatedUpdateData = reconciliationUpdateSchema.parse(updateBody);
                const updatedRecord = await db.prisma.reconciliationRecord.update({
                    where: { id: updateRecordId },
                    data: validatedUpdateData
                });
                const duration5 = Date.now() - startTime;
                logger.info('Reconciliation record updated', {
                    requestId,
                    recordId: updateRecordId,
                    duration: duration5
                });
                return (0, response_utils_1.createSuccessResponse)({
                    reconciliation: {
                        id: updatedRecord.id,
                        status: updatedRecord.reconciliationStatus,
                        updatedAt: updatedRecord.updatedAt.toISOString()
                    }
                }, 'Reconciliation record updated successfully', 200);
            default:
                return (0, response_utils_1.createErrorResponse)(405, 'Method not allowed', undefined, 'METHOD_NOT_ALLOWED');
        }
    }
    catch (error) {
        const duration = Date.now() - startTime;
        logger.error('Reconciliation request failed', {
            requestId,
            duration,
            error: error.message,
            stack: error.stack
        });
        return (0, response_utils_1.handleError)(error, requestId);
    }
};
exports.reconciliationHandler = reconciliationHandler;
//# sourceMappingURL=reconciliation.js.map