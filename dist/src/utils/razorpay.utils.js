"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateTestPaymentData = exports.validateOrderData = exports.calculatePaymentAnalytics = exports.supportsRefund = exports.getPaymentMethodName = exports.parseAmount = exports.formatAmount = exports.verifyWebhookSignature = exports.verifyPaymentSignature = exports.generatePaymentSignature = exports.validatePaymentAmount = exports.isValidCurrency = exports.generateReceiptNumber = exports.AMOUNT_LIMITS = exports.RECEIPT_PREFIX = exports.SUPPORTED_CURRENCIES = exports.PAYMENT_STATUS = exports.PAYMENT_METHODS = void 0;
const crypto_1 = __importDefault(require("crypto"));
const logger_1 = require("../shared/utils/logger");
exports.PAYMENT_METHODS = {
    CARD: 'card',
    NETBANKING: 'netbanking',
    WALLET: 'wallet',
    UPI: 'upi',
    EMI: 'emi',
    PAYLATER: 'paylater',
    CARDLESS_EMI: 'cardless_emi',
    BANK_TRANSFER: 'bank_transfer'
};
exports.PAYMENT_STATUS = {
    CREATED: 'created',
    AUTHORIZED: 'authorized',
    CAPTURED: 'captured',
    REFUNDED: 'refunded',
    FAILED: 'failed',
    CANCELLED: 'cancelled'
};
exports.SUPPORTED_CURRENCIES = ['INR', 'EUR'];
exports.RECEIPT_PREFIX = {
    ORDER: 'ORD_',
    PAYMENT: 'PAY_',
    REFUND: 'REF_'
};
exports.AMOUNT_LIMITS = {
    INR: { min: 100, max: 1500000000 },
    EUR: { min: 100, max: 200000000 }
};
function generateReceiptNumber(prefix = exports.RECEIPT_PREFIX.ORDER) {
    try {
        const timestamp = Date.now().toString();
        const random = Math.random().toString(36).substr(2, 9);
        return `${prefix}${timestamp}_${random}`;
    }
    catch (error) {
        logger_1.logger.error('Failed to generate receipt number:', { error: error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error) });
        throw new Error('Receipt generation failed');
    }
}
exports.generateReceiptNumber = generateReceiptNumber;
function isValidCurrency(currency) {
    return exports.SUPPORTED_CURRENCIES.includes(currency);
}
exports.isValidCurrency = isValidCurrency;
function validatePaymentAmount(amount, currency) {
    try {
        if (!isValidCurrency(currency)) {
            return {
                valid: false,
                error: `Unsupported currency: ${currency}`
            };
        }
        const limits = exports.AMOUNT_LIMITS[currency];
        if (amount < limits.min) {
            return {
                valid: false,
                error: `Amount too low. Minimum: ${formatAmount(limits.min, currency)}`
            };
        }
        if (amount > limits.max) {
            return {
                valid: false,
                error: `Amount too high. Maximum: ${formatAmount(limits.max, currency)}`
            };
        }
        return {
            valid: true,
            normalizedAmount: Math.round(amount)
        };
    }
    catch (error) {
        logger_1.logger.error('Amount validation failed:', { error: error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error) });
        return {
            valid: false,
            error: 'Amount validation error'
        };
    }
}
exports.validatePaymentAmount = validatePaymentAmount;
function generatePaymentSignature(orderId, paymentId, secret) {
    try {
        const payload = `${orderId}|${paymentId}`;
        return crypto_1.default.createHmac('sha256', secret).update(payload).digest('hex');
    }
    catch (error) {
        logger_1.logger.error('Payment signature generation failed:', { error: error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error) });
        throw new Error('Signature generation failed');
    }
}
exports.generatePaymentSignature = generatePaymentSignature;
function verifyPaymentSignature(orderId, paymentId, signature, secret) {
    try {
        const expectedSignature = generatePaymentSignature(orderId, paymentId, secret);
        return crypto_1.default.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expectedSignature, 'hex'));
    }
    catch (error) {
        logger_1.logger.error('Payment signature verification failed:', { error: error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error) });
        return false;
    }
}
exports.verifyPaymentSignature = verifyPaymentSignature;
function verifyWebhookSignature(payload, signature, secret) {
    try {
        const expectedSignature = crypto_1.default.createHmac('sha256', secret).update(payload).digest('hex');
        return crypto_1.default.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expectedSignature, 'hex'));
    }
    catch (error) {
        logger_1.logger.error('Webhook signature verification failed:', { error: error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error) });
        return false;
    }
}
exports.verifyWebhookSignature = verifyWebhookSignature;
function formatAmount(amount, currency) {
    try {
        const value = currency === 'INR' ? amount / 100 : amount / 100;
        const formatter = new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 2
        });
        return formatter.format(value);
    }
    catch (error) {
        logger_1.logger.error('Amount formatting failed:', { error: error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error) });
        return `${currency} ${amount / 100}`;
    }
}
exports.formatAmount = formatAmount;
function parseAmount(formattedAmount, _currency) {
    try {
        const cleaned = formattedAmount.replace(/[^\d.,]/g, '');
        const value = parseFloat(cleaned.replace(',', ''));
        if (isNaN(value)) {
            throw new Error('Invalid amount format');
        }
        return Math.round(value * 100);
    }
    catch (error) {
        logger_1.logger.error('Amount parsing failed:', { error: error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error) });
        throw new Error('Invalid amount format');
    }
}
exports.parseAmount = parseAmount;
function getPaymentMethodName(method) {
    const methodNames = {
        [exports.PAYMENT_METHODS.CARD]: 'Credit/Debit Card',
        [exports.PAYMENT_METHODS.NETBANKING]: 'Net Banking',
        [exports.PAYMENT_METHODS.WALLET]: 'Digital Wallet',
        [exports.PAYMENT_METHODS.UPI]: 'UPI',
        [exports.PAYMENT_METHODS.EMI]: 'EMI',
        [exports.PAYMENT_METHODS.PAYLATER]: 'Pay Later',
        [exports.PAYMENT_METHODS.CARDLESS_EMI]: 'Cardless EMI',
        [exports.PAYMENT_METHODS.BANK_TRANSFER]: 'Bank Transfer'
    };
    return methodNames[method] || method;
}
exports.getPaymentMethodName = getPaymentMethodName;
function supportsRefund(method) {
    const refundableMethods = [
        exports.PAYMENT_METHODS.CARD,
        exports.PAYMENT_METHODS.NETBANKING,
        exports.PAYMENT_METHODS.WALLET,
        exports.PAYMENT_METHODS.UPI
    ];
    return refundableMethods.includes(method);
}
exports.supportsRefund = supportsRefund;
function calculatePaymentAnalytics(payments, startDate, endDate) {
    try {
        const filteredPayments = payments.filter(payment => payment.createdAt >= startDate && payment.createdAt <= endDate);
        const successfulPayments = filteredPayments.filter(payment => payment.status === exports.PAYMENT_STATUS.CAPTURED);
        const refundedPayments = filteredPayments.filter(payment => payment.status === exports.PAYMENT_STATUS.REFUNDED);
        const totalAmount = successfulPayments.reduce((sum, payment) => sum + payment.amount, 0);
        const refundedAmount = refundedPayments.reduce((sum, payment) => sum + payment.amount, 0);
        const byMethod = {};
        Object.values(exports.PAYMENT_METHODS).forEach(method => {
            const methodPayments = filteredPayments.filter(p => p.method === method);
            const successfulMethodPayments = methodPayments.filter(p => p.status === exports.PAYMENT_STATUS.CAPTURED);
            byMethod[method] = {
                amount: successfulMethodPayments.reduce((sum, p) => sum + p.amount, 0),
                count: successfulMethodPayments.length,
                successRate: methodPayments.length > 0
                    ? (successfulMethodPayments.length / methodPayments.length) * 100
                    : 0
            };
        });
        return {
            totalAmount,
            totalCount: successfulPayments.length,
            refundedAmount,
            refundedCount: refundedPayments.length,
            averageAmount: successfulPayments.length > 0 ? totalAmount / successfulPayments.length : 0,
            successRate: filteredPayments.length > 0
                ? (successfulPayments.length / filteredPayments.length) * 100
                : 0,
            period: { start: startDate, end: endDate },
            byMethod
        };
    }
    catch (error) {
        logger_1.logger.error('Payment analytics calculation failed:', { error: error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error) });
        throw new Error('Analytics calculation failed');
    }
}
exports.calculatePaymentAnalytics = calculatePaymentAnalytics;
function validateOrderData(orderData) {
    const errors = [];
    if (!orderData.amount || orderData.amount <= 0) {
        errors.push('Valid amount is required');
    }
    if (!orderData.currency || !isValidCurrency(orderData.currency)) {
        errors.push('Valid currency is required');
    }
    if (!orderData.receipt || orderData.receipt.length < 3) {
        errors.push('Receipt number is required (minimum 3 characters)');
    }
    if (orderData.amount && orderData.currency) {
        const amountValidation = validatePaymentAmount(orderData.amount, orderData.currency);
        if (!amountValidation.valid) {
            errors.push(amountValidation.error || 'Invalid amount');
        }
    }
    return {
        valid: errors.length === 0,
        errors
    };
}
exports.validateOrderData = validateOrderData;
function generateTestPaymentData() {
    return {
        id: `pay_${Date.now()}`,
        amount: Math.floor(Math.random() * 10000) + 100,
        currency: 'INR',
        status: exports.PAYMENT_STATUS.CAPTURED,
        method: exports.PAYMENT_METHODS.CARD,
        orderId: `order_${Date.now()}`,
        createdAt: new Date()
    };
}
exports.generateTestPaymentData = generateTestPaymentData;
//# sourceMappingURL=razorpay.utils.js.map