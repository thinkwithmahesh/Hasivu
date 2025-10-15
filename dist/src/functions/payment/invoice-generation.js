"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const logger_1 = require("../../utils/logger");
const response_utils_1 = require("../../shared/response.utils");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
function generateInvoiceNumber(schoolCode, date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const randomSuffix = Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, '0');
    return `INV-${schoolCode}-${year}${month}-${randomSuffix}`;
}
function calculateGST(amount, gstRate = 5) {
    const gstAmount = Math.round((amount * gstRate) / 100);
    const total = amount + gstAmount;
    return { gstAmount, total };
}
async function validateAndGenerateInvoice(paymentId, userId) {
    const paymentTransaction = await prisma.paymentTransaction.findUnique({
        where: { id: paymentId },
        include: {
            paymentOrder: {
                include: {
                    paymentTransactions: true,
                },
            },
        },
    });
    if (!paymentTransaction) {
        throw new Error('Payment transaction not found');
    }
    if (paymentTransaction.status !== 'captured') {
        throw new Error('Only successful payments can have invoices generated');
    }
    const { paymentOrder } = paymentTransaction;
    if (!paymentOrder) {
        throw new Error('Payment order not found');
    }
    const user = await prisma.user.findUnique({
        where: { id: paymentOrder.userId },
        include: {
            school: true,
        },
    });
    if (!user || !user.school) {
        throw new Error('User or school information not found');
    }
    if (paymentOrder.userId !== userId) {
        const order = paymentOrder.orderId
            ? await prisma.order.findUnique({
                where: { id: paymentOrder.orderId },
            })
            : null;
        const adminUser = await prisma.user.findFirst({
            where: {
                id: userId,
                schoolId: order?.schoolId || user.schoolId,
                role: { in: ['school_admin', 'admin', 'super_admin'] },
                isActive: true,
            },
        });
        if (!adminUser) {
            throw new Error('Not authorized to generate invoice for this payment');
        }
    }
    const existingInvoice = await prisma.invoice.findFirst({
        where: {
            paymentId: paymentTransaction.id,
        },
    });
    if (existingInvoice) {
        return {
            isExisting: true,
            invoice: existingInvoice,
        };
    }
    const order = paymentOrder.orderId
        ? await prisma.order.findUnique({
            where: { id: paymentOrder.orderId },
            include: {
                orderItems: {
                    include: {
                        menuItem: true,
                    },
                },
                student: true,
            },
        })
        : null;
    return {
        isExisting: false,
        paymentTransaction,
        paymentOrder,
        user,
        order,
    };
}
const handler = async (event, context) => {
    try {
        if (event.httpMethod !== 'POST') {
            return (0, response_utils_1.createErrorResponse)('Method not allowed', 'Only POST method is allowed', 405);
        }
        const paymentId = event.pathParameters?.paymentId;
        if (!paymentId) {
            return (0, response_utils_1.createErrorResponse)('Missing payment ID', 'paymentId is required in path', 400);
        }
        const userId = event.requestContext?.authorizer?.userId || event.headers?.['x-user-id'];
        if (!userId) {
            return (0, response_utils_1.createErrorResponse)('Authentication required', 'User authentication required', 401);
        }
        logger_1.logger.info('Generating invoice', { paymentId, userId });
        const validationResult = await validateAndGenerateInvoice(paymentId, userId);
        if (validationResult.isExisting) {
            const existingInvoice = validationResult.invoice;
            const response = {
                invoiceId: existingInvoice.id,
                invoiceNumber: existingInvoice.invoiceNumber,
                paymentId,
                orderId: existingInvoice.orderId || undefined,
                amount: Number(existingInvoice.subtotal),
                taxAmount: Number(existingInvoice.taxAmount),
                totalAmount: Number(existingInvoice.totalAmount),
                currency: existingInvoice.currency,
                invoiceDate: existingInvoice.invoiceDate,
                dueDate: existingInvoice.dueDate,
                status: existingInvoice.status,
                pdfUrl: existingInvoice.pdfUrl || undefined,
            };
            return (0, response_utils_1.createSuccessResponse)({
                data: { invoice: response },
                message: 'Invoice already exists',
            });
        }
        const { paymentTransaction, paymentOrder, user, order } = validationResult;
        const amountInRupees = Number(paymentTransaction.amount) / 100;
        const gstRate = 5;
        const { gstAmount, total } = calculateGST(amountInRupees, gstRate);
        const invoiceNumber = generateInvoiceNumber(user.school.code, new Date());
        const invoiceDate = new Date();
        const dueDate = new Date(invoiceDate.getTime() + 7 * 24 * 60 * 60 * 1000);
        const invoice = await prisma.invoice.create({
            data: {
                schoolId: user.schoolId,
                userId: paymentOrder.userId,
                invoiceNumber,
                invoiceDate,
                dueDate,
                subtotal: amountInRupees,
                taxAmount: gstAmount,
                discountAmount: 0,
                totalAmount: total,
                currency: 'INR',
                gstRate,
                hsnCode: '996331',
                placeOfSupply: user.school.state || 'Not specified',
                status: 'paid',
                paidDate: paymentTransaction.capturedAt || new Date(),
                paymentId: paymentTransaction.id,
                emailSent: false,
            },
        });
        if (order && order.orderItems) {
            for (const orderItem of order.orderItems) {
                const itemTax = calculateGST(Number(orderItem.totalPrice), gstRate);
                await prisma.invoiceItem.create({
                    data: {
                        invoiceId: invoice.id,
                        orderId: order.id,
                        description: orderItem.menuItem.name,
                        quantity: orderItem.quantity,
                        unitPrice: Number(orderItem.unitPrice),
                        totalPrice: Number(orderItem.totalPrice),
                        taxRate: gstRate,
                        taxAmount: itemTax.gstAmount,
                        itemType: 'meal',
                        itemCode: orderItem.menuItemId,
                        hsnCode: '996331',
                    },
                });
            }
        }
        else {
            await prisma.invoiceItem.create({
                data: {
                    invoiceId: invoice.id,
                    orderId: paymentOrder.orderId || null,
                    description: paymentOrder.subscriptionId
                        ? 'Subscription Payment'
                        : 'Meal Service Payment',
                    quantity: 1,
                    unitPrice: amountInRupees,
                    totalPrice: amountInRupees,
                    taxRate: gstRate,
                    taxAmount: gstAmount,
                    itemType: paymentOrder.subscriptionId ? 'subscription' : 'meal',
                    hsnCode: '996331',
                },
            });
        }
        await prisma.auditLog.create({
            data: {
                entityType: 'Invoice',
                entityId: invoice.id,
                action: 'CREATE',
                changes: JSON.stringify({
                    invoiceNumber,
                    paymentId,
                    amount: total,
                    status: 'paid',
                }),
                userId,
                createdById: userId,
                metadata: JSON.stringify({
                    action: 'INVOICE_GENERATED',
                    paymentId,
                    invoiceId: invoice.id,
                }),
            },
        });
        const response = {
            invoiceId: invoice.id,
            invoiceNumber: invoice.invoiceNumber,
            paymentId,
            orderId: order?.id,
            amount: amountInRupees,
            taxAmount: gstAmount,
            totalAmount: total,
            currency: 'INR',
            invoiceDate: invoice.invoiceDate,
            dueDate: invoice.dueDate,
            status: invoice.status,
            pdfUrl: undefined,
        };
        logger_1.logger.info('Invoice generated successfully', {
            invoiceId: invoice.id,
            invoiceNumber,
            paymentId,
            totalAmount: total,
        });
        return (0, response_utils_1.createSuccessResponse)({
            data: { invoice: response },
            message: 'Invoice generated successfully',
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to generate invoice', undefined, {
            errorMessage: error instanceof Error ? error.message : String(error),
        });
        return (0, response_utils_1.handleError)(error);
    }
    finally {
        await prisma.$disconnect();
    }
};
exports.handler = handler;
//# sourceMappingURL=invoice-generation.js.map