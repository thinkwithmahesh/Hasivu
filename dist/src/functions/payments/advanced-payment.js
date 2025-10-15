"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.advancedPaymentHandler = void 0;
const client_1 = require("@prisma/client");
const razorpay_1 = __importDefault(require("razorpay"));
const logger_1 = require("../../shared/utils/logger");
const lambda_auth_middleware_1 = require("../../shared/middleware/lambda-auth.middleware");
const zod_1 = require("zod");
const prisma = new client_1.PrismaClient();
const razorpay = new razorpay_1.default({
    key_id: process.env.RAZORPAY_KEY_ID || '',
    key_secret: process.env.RAZORPAY_KEY_SECRET || ''
});
const advancedPaymentSchema = zod_1.z.object({
    amount: zod_1.z.number().positive().min(1),
    currency: zod_1.z.string().min(3).max(3).default('INR'),
    orderId: zod_1.z.string().uuid(),
    gateway: zod_1.z.enum(['razorpay', 'stripe', 'payu']).default('razorpay'),
    recurringPayment: zod_1.z.object({
        enabled: zod_1.z.boolean().default(false),
        frequency: zod_1.z.enum(['daily', 'weekly', 'monthly', 'yearly']).optional(),
        cycles: zod_1.z.number().positive().optional()
    }).optional(),
    splitPayment: zod_1.z.object({
        enabled: zod_1.z.boolean().default(false),
        accounts: zod_1.z.array(zod_1.z.object({
            accountId: zod_1.z.string(),
            amount: zod_1.z.number().positive(),
            percentage: zod_1.z.number().min(0).max(100).optional()
        })).optional()
    }).optional(),
    conversionRate: zod_1.z.number().positive().optional(),
    originalCurrency: zod_1.z.string().optional(),
    description: zod_1.z.string().optional(),
    metadata: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()).default({}),
    customer: zod_1.z.object({
        id: zod_1.z.string().optional(),
        email: zod_1.z.string().email(),
        contact: zod_1.z.string(),
        name: zod_1.z.string()
    }),
    preferredMethods: zod_1.z.array(zod_1.z.enum(['card', 'netbanking', 'wallet', 'upi'])).optional(),
    riskAssessment: zod_1.z.object({
        enabled: zod_1.z.boolean().default(true),
        merchantRiskScore: zod_1.z.number().min(0).max(10).optional(),
        fraudDetectionEnabled: zod_1.z.boolean().default(true)
    }).optional()
});
function getGatewayConfig(gateway) {
    const configs = {
        razorpay: {
            gateway: 'razorpay',
            config: {
                key_id: process.env.RAZORPAY_KEY_ID,
                key_secret: process.env.RAZORPAY_KEY_SECRET
            },
            supportedMethods: ['card', 'netbanking', 'wallet', 'upi'],
            supportedCurrencies: ['INR']
        },
        stripe: {
            gateway: 'stripe',
            config: {
                publishable_key: process.env.STRIPE_PUBLISHABLE_KEY,
                secret_key: process.env.STRIPE_SECRET_KEY
            },
            supportedMethods: ['card'],
            supportedCurrencies: ['INR', 'EUR']
        },
        payu: {
            gateway: 'payu',
            config: {
                merchant_key: process.env.PAYU_MERCHANT_KEY,
                salt: process.env.PAYU_SALT
            },
            supportedMethods: ['card', 'netbanking', 'wallet'],
            supportedCurrencies: ['INR']
        }
    };
    return configs[gateway];
}
async function createRazorpayOrder(paymentData) {
    const orderOptions = {
        amount: paymentData.amount * 100,
        currency: paymentData.currency,
        receipt: `receipt_${Date.now()}`,
        notes: paymentData.metadata || {}
    };
    return await razorpay.orders.create(orderOptions);
}
async function processSplitPayment(splitConfig, totalAmount) {
    if (!splitConfig.enabled) {
        return null;
    }
    let totalSplitAmount = 0;
    const processedAccounts = [];
    for (const account of splitConfig.accounts) {
        let splitAmount = account.amount;
        if (account.percentage) {
            splitAmount = (totalAmount * account.percentage) / 100;
        }
        totalSplitAmount += splitAmount;
        processedAccounts.push({
            ...account,
            finalAmount: splitAmount
        });
    }
    if (totalSplitAmount > totalAmount) {
        throw new Error('Split payment amounts exceed total payment amount');
    }
    return {
        accounts: processedAccounts,
        totalSplitAmount,
        remainingAmount: totalAmount - totalSplitAmount
    };
}
async function createPaymentAuditLog(paymentId, userId, action, details) {
    await prisma.auditLog.create({
        data: {
            entityType: 'Payment',
            entityId: paymentId,
            action,
            changes: JSON.stringify(details),
            userId,
            createdById: userId,
            metadata: JSON.stringify({
                timestamp: new Date().toISOString(),
                action: 'ADVANCED_PAYMENT_PROCESSED'
            })
        }
    });
}
const advancedPaymentHandler = async (event, context) => {
    const requestId = context.awsRequestId;
    try {
        logger_1.logger.info('Advanced payment processing request started', { requestId });
        const authenticatedUser = await (0, lambda_auth_middleware_1.authenticateLambda)(event);
        const requestBody = JSON.parse(event.body || '{}');
        const paymentData = advancedPaymentSchema.parse(requestBody);
        const gatewayConfig = getGatewayConfig(paymentData.gateway);
        if (!gatewayConfig) {
            logger_1.logger.warn('Unsupported payment gateway', { requestId, gateway: paymentData.gateway });
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Unsupported payment gateway', code: 'INVALID_GATEWAY' })
            };
        }
        if (!gatewayConfig.supportedCurrencies.includes(paymentData.currency)) {
            logger_1.logger.warn('Unsupported currency for gateway', {
                requestId,
                gateway: paymentData.gateway,
                currency: paymentData.currency
            });
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Currency not supported by selected gateway', code: 'UNSUPPORTED_CURRENCY' })
            };
        }
        const order = await prisma.order.findUnique({
            where: { id: paymentData.orderId },
            include: {
                school: true,
                orderItems: true
            }
        });
        if (!order) {
            logger_1.logger.warn('Order not found', { requestId, orderId: paymentData.orderId });
            return {
                statusCode: 404,
                body: JSON.stringify({ error: 'Order not found', code: 'ORDER_NOT_FOUND' })
            };
        }
        if (authenticatedUser.role === 'school_admin' && authenticatedUser.schoolId !== order.schoolId) {
            logger_1.logger.warn('Cross-school payment attempt', {
                requestId,
                userId: authenticatedUser.id || "",
                userSchoolId: authenticatedUser.schoolId,
                orderSchoolId: order.schoolId
            });
            return {
                statusCode: 403,
                body: JSON.stringify({ error: 'Cannot process payments for other schools', code: 'UNAUTHORIZED' })
            };
        }
        let splitPaymentResult = null;
        if (paymentData.splitPayment?.enabled) {
            splitPaymentResult = await processSplitPayment(paymentData.splitPayment, paymentData.amount);
        }
        let gatewayResponse;
        switch (paymentData.gateway) {
            case 'razorpay':
                gatewayResponse = await createRazorpayOrder(paymentData);
                break;
            case 'stripe':
                throw new Error('Stripe integration not yet implemented');
            case 'payu':
                throw new Error('PayU integration not yet implemented');
            default:
                throw new Error(`Unsupported gateway: ${paymentData.gateway}`);
        }
        const paymentOrder = await prisma.paymentOrder.create({
            data: {
                id: gatewayResponse.id || `payment_${Date.now()}`,
                razorpayOrderId: gatewayResponse.id,
                userId: authenticatedUser.id || "",
                orderId: paymentData.orderId,
                amount: Math.round(paymentData.amount * 100),
                currency: paymentData.currency,
                status: 'created',
                metadata: JSON.stringify({
                    ...paymentData.metadata,
                    splitPayment: splitPaymentResult,
                    recurringPayment: paymentData.recurringPayment,
                    riskAssessment: paymentData.riskAssessment,
                    gateway: paymentData.gateway,
                    gatewayResponse
                }),
                expiresAt: new Date(Date.now() + 30 * 60 * 1000)
            }
        });
        await createPaymentAuditLog(paymentOrder.id, authenticatedUser.id || "", 'PAYMENT_INITIATED', {
            orderId: paymentData.orderId,
            amount: paymentData.amount,
            currency: paymentData.currency,
            gateway: paymentData.gateway,
            splitPayment: splitPaymentResult,
            initiatedBy: authenticatedUser.email
        });
        logger_1.logger.info('Advanced payment order created successfully', {
            requestId,
            paymentId: paymentOrder.id,
            orderId: paymentData.orderId,
            amount: paymentData.amount,
            gateway: paymentData.gateway,
            initiatedBy: authenticatedUser.email
        });
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Payment order created successfully',
                data: {
                    paymentId: paymentOrder.id,
                    gatewayOrderId: gatewayResponse.id,
                    gateway: paymentData.gateway,
                    amount: paymentData.amount,
                    currency: paymentData.currency,
                    status: 'created',
                    gatewayDetails: {
                        key: gatewayConfig.config.key_id,
                        orderId: gatewayResponse.id,
                        amount: gatewayResponse.amount,
                        currency: gatewayResponse.currency
                    },
                    splitPayment: splitPaymentResult,
                    createdAt: paymentOrder.createdAt
                }
            })
        };
    }
    catch (error) {
        logger_1.logger.error('Advanced payment processing failed', {
            requestId,
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined
        });
        if (error instanceof Error && error.name === 'ZodError') {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Invalid payment data', code: 'VALIDATION_ERROR' })
            };
        }
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'Failed to process advanced payment',
                message: error instanceof Error ? error.message : String(error)
            })
        };
    }
    finally {
        await prisma.$disconnect();
    }
};
exports.advancedPaymentHandler = advancedPaymentHandler;
//# sourceMappingURL=advanced-payment.js.map