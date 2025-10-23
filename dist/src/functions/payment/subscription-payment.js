"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const logger_1 = require("../../utils/logger");
const response_utils_1 = require("../../shared/response.utils");
const client_1 = require("@prisma/client");
const razorpay_service_1 = require("../shared/razorpay.service");
const prisma = new client_1.PrismaClient();
async function validateSubscriptionPayment(subscriptionId, billingCycleId, userId) {
    const subscription = await prisma.subscription.findUnique({
        where: { id: subscriptionId },
        include: {
            user: true,
            student: true,
            school: true,
            subscriptionPlan: true,
            billingCycles: {
                where: billingCycleId ? { id: billingCycleId } : { status: 'pending' },
                orderBy: { cycleStart: 'asc' },
                take: 1,
            },
        },
    });
    if (!subscription) {
        throw new Error('Subscription not found');
    }
    if (subscription.userId !== userId) {
        const adminUser = await prisma.user.findFirst({
            where: {
                id: userId,
                schoolId: subscription.schoolId,
                role: { in: ['school_admin', 'admin', 'super_admin'] },
                isActive: true,
            },
        });
        if (!adminUser) {
            throw new Error('Not authorized to process payment for this subscription');
        }
    }
    if (!['active', 'trialing'].includes(subscription.status)) {
        throw new Error(`Subscription cannot be paid in current status: ${subscription.status}`);
    }
    const billingCycle = subscription.billingCycles[0];
    if (!billingCycle) {
        throw new Error('No pending billing cycle found for this subscription');
    }
    if (billingCycle.status === 'paid') {
        throw new Error('Billing cycle has already been paid');
    }
    const now = new Date();
    if (billingCycle.billingDate > now) {
        throw new Error(`Billing cycle is not due yet. Due date: ${billingCycle.billingDate.toISOString()}`);
    }
    return { subscription, billingCycle };
}
const handler = async (event, context) => {
    try {
        if (event.httpMethod !== 'POST') {
            return (0, response_utils_1.createErrorResponse)('Method not allowed', 'Only POST method is allowed', 405);
        }
        const body = JSON.parse(event.body || '{}');
        if (!body.subscriptionId) {
            return (0, response_utils_1.createErrorResponse)('Missing subscription ID', 'subscriptionId is required', 400);
        }
        const userId = event.requestContext?.authorizer?.userId || event.headers?.['x-user-id'];
        if (!userId) {
            return (0, response_utils_1.createErrorResponse)('Authentication required', 'User authentication required', 401);
        }
        logger_1.logger.info('Processing subscription payment', {
            subscriptionId: body.subscriptionId,
            billingCycleId: body.billingCycleId,
            userId,
        });
        const { subscription, billingCycle } = await validateSubscriptionPayment(body.subscriptionId, body.billingCycleId, userId);
        const amountInPaise = Math.round(billingCycle.totalAmount * 100);
        const razorpayOrderOptions = {
            amount: amountInPaise,
            currency: billingCycle.currency,
            receipt: `subscription_${subscription.id}_cycle_${billingCycle.cycleNumber}`,
            payment_capture: true,
            notes: {
                subscriptionId: subscription.id,
                billingCycleId: billingCycle.id,
                userId: subscription.userId,
                studentId: subscription.studentId || '',
                schoolId: subscription.schoolId,
                planName: subscription.subscriptionPlan.name,
                cycleNumber: String(billingCycle.cycleNumber),
            },
        };
        const razorpayOrder = await razorpay_service_1.razorpayService.createOrder(razorpayOrderOptions);
        const paymentOrder = await prisma.paymentOrder.create({
            data: {
                id: razorpayOrder.id,
                razorpayOrderId: razorpayOrder.id,
                amount: amountInPaise,
                currency: billingCycle.currency,
                status: razorpayOrder.status,
                userId: subscription.userId,
                subscriptionId: subscription.id,
                expiresAt: new Date(Date.now() + 30 * 60 * 1000),
                metadata: JSON.stringify({
                    subscriptionId: subscription.id,
                    billingCycleId: billingCycle.id,
                    cycleNumber: billingCycle.cycleNumber,
                    planName: subscription.subscriptionPlan.name,
                    studentName: subscription.student
                        ? `${subscription.student.firstName} ${subscription.student.lastName}`
                        : undefined,
                }),
            },
        });
        await prisma.billingCycle.update({
            where: { id: billingCycle.id },
            data: {
                status: 'processing',
            },
        });
        await prisma.auditLog.create({
            data: {
                entityType: 'Subscription',
                entityId: subscription.id,
                action: 'PAYMENT_INITIATED',
                changes: JSON.stringify({
                    billingCycleId: billingCycle.id,
                    amount: billingCycle.totalAmount,
                    razorpayOrderId: razorpayOrder.id,
                }),
                userId,
                createdById: userId,
                metadata: JSON.stringify({
                    action: 'SUBSCRIPTION_PAYMENT_INITIATED',
                    paymentOrderId: paymentOrder.id,
                }),
            },
        });
        const response = {
            paymentOrderId: paymentOrder.id,
            razorpayOrderId: paymentOrder.razorpayOrderId,
            subscriptionId: subscription.id,
            billingCycleId: billingCycle.id,
            amount: Number(paymentOrder.amount),
            currency: paymentOrder.currency,
            status: paymentOrder.status,
            expiresAt: paymentOrder.expiresAt,
        };
        logger_1.logger.info('Subscription payment order created successfully', {
            paymentOrderId: paymentOrder.id,
            razorpayOrderId: razorpayOrder.id,
            subscriptionId: subscription.id,
            amount: billingCycle.totalAmount,
        });
        return (0, response_utils_1.createSuccessResponse)({
            data: {
                paymentOrder: response,
                razorpayKey: process.env.RAZORPAY_KEY_ID,
            },
            message: 'Subscription payment order created successfully',
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to process subscription payment', undefined, {
            errorMessage: error instanceof Error ? error.message : String(error),
        });
        return (0, response_utils_1.handleError)(error);
    }
    finally {
        await prisma.$disconnect();
    }
};
exports.handler = handler;
//# sourceMappingURL=subscription-payment.js.map