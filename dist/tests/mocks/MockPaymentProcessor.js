"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockPaymentProcessor = void 0;
class MockPaymentProcessor {
    config;
    processedPayments = new Map();
    paymentCounter = 0;
    constructor(config = {}) {
        this.config = {
            successRate: config.successRate ?? 0.95,
            averageResponseTime: config.averageResponseTime ?? 500,
            maxResponseTime: config.maxResponseTime ?? 2000,
            enableRandomFailures: config.enableRandomFailures ?? true,
            enableNetworkDelay: config.enableNetworkDelay ?? true,
            ...config
        };
    }
    async processPayment(orderData) {
        if (this.config.enableNetworkDelay) {
            await this.simulateNetworkDelay();
        }
        const paymentId = `mock_payment_${++this.paymentCounter}_${Date.now()}`;
        const transactionId = `mock_txn_${this.paymentCounter}_${Date.now()}`;
        const shouldSucceed = this.config.enableRandomFailures
            ? Math.random() < this.config.successRate
            : true;
        if (!shouldSucceed) {
            const failureReason = this.getRandomFailureReason();
            return {
                success: false,
                error: failureReason,
                message: `Payment processing failed: ${failureReason}`,
                transactionId
            };
        }
        const payment = {
            id: paymentId,
            transactionId,
            orderId: orderData.orderId || orderData.id,
            amount: orderData.amount,
            currency: orderData.currency || 'INR',
            status: 'completed',
            method: orderData.paymentMethodId || 'card',
            gateway: 'mock_gateway',
            gatewayPaymentId: paymentId,
            gatewayTransactionId: transactionId,
            processedAt: new Date(),
            metadata: {
                customerName: orderData.customerName || 'Mock Customer',
                orderType: 'load_test',
                processor: 'MockPaymentProcessor'
            }
        };
        this.processedPayments.set(paymentId, payment);
        return {
            success: true,
            payment,
            transactionId,
            paymentId,
            message: 'Payment processed successfully'
        };
    }
    async createPaymentRecord(orderData) {
        return this.processPayment(orderData);
    }
    async updatePaymentStatus(paymentId, status) {
        if (this.config.enableNetworkDelay) {
            await this.simulateNetworkDelay();
        }
        const payment = this.processedPayments.get(paymentId);
        if (!payment) {
            return {
                success: false,
                error: 'Payment not found',
                message: `Payment with ID ${paymentId} not found`
            };
        }
        payment.status = status;
        payment.updatedAt = new Date();
        this.processedPayments.set(paymentId, payment);
        return {
            success: true,
            payment,
            paymentId,
            message: `Payment status updated to ${status}`
        };
    }
    async getPaymentById(paymentId) {
        if (this.config.enableNetworkDelay) {
            await this.simulateNetworkDelay();
        }
        const payment = this.processedPayments.get(paymentId);
        if (!payment) {
            return {
                success: false,
                error: 'Payment not found',
                message: `Payment with ID ${paymentId} not found`
            };
        }
        return {
            success: true,
            payment,
            paymentId,
            message: 'Payment retrieved successfully'
        };
    }
    async processRefund(paymentId, amount, reason) {
        if (this.config.enableNetworkDelay) {
            await this.simulateNetworkDelay();
        }
        const payment = this.processedPayments.get(paymentId);
        if (!payment) {
            return {
                success: false,
                error: 'Payment not found',
                message: `Payment with ID ${paymentId} not found`
            };
        }
        const refundAmount = amount || payment.amount;
        const refundId = `mock_refund_${Date.now()}`;
        const shouldSucceed = Math.random() < 0.98;
        if (!shouldSucceed) {
            return {
                success: false,
                error: 'refund_failed',
                message: 'Refund processing failed due to gateway error'
            };
        }
        const refund = {
            id: refundId,
            paymentId,
            amount: refundAmount,
            currency: payment.currency,
            status: 'processed',
            reason: reason || 'Customer requested refund',
            processedAt: new Date(),
            gatewayRefundId: refundId
        };
        payment.refundedAmount = (payment.refundedAmount || 0) + refundAmount;
        payment.refundStatus = payment.refundedAmount >= payment.amount ? 'full' : 'partial';
        payment.updatedAt = new Date();
        this.processedPayments.set(paymentId, payment);
        return {
            success: true,
            payment: refund,
            transactionId: refundId,
            message: 'Refund processed successfully'
        };
    }
    getStatistics() {
        const payments = Array.from(this.processedPayments.values());
        const totalPayments = payments.length;
        const successfulPayments = payments.filter(p => p.status === 'completed').length;
        const failedPayments = totalPayments - successfulPayments;
        const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);
        const totalRefunded = payments.reduce((sum, p) => sum + (p.refundedAmount || 0), 0);
        return {
            totalPayments,
            successfulPayments,
            failedPayments,
            successRate: totalPayments > 0 ? (successfulPayments / totalPayments) * 100 : 0,
            totalAmount,
            totalRefunded,
            netAmount: totalAmount - totalRefunded,
            averageAmount: totalPayments > 0 ? totalAmount / totalPayments : 0,
            processingStats: {
                averageResponseTime: this.config.averageResponseTime,
                maxResponseTime: this.config.maxResponseTime,
                successRate: this.config.successRate * 100
            }
        };
    }
    reset() {
        this.processedPayments.clear();
        this.paymentCounter = 0;
    }
    configure(config) {
        this.config = { ...this.config, ...config };
    }
    async simulateNetworkDelay() {
        const delay = Math.min(this.config.averageResponseTime + (Math.random() * 200 - 100), this.config.maxResponseTime);
        await new Promise(resolve => setTimeout(resolve, Math.max(delay, 50)));
    }
    getRandomFailureReason() {
        const reasons = [
            'insufficient_funds',
            'card_declined',
            'expired_card',
            'network_error',
            'gateway_timeout',
            'invalid_card_details',
            'authentication_failed',
            'daily_limit_exceeded',
            'blocked_card',
            'issuer_unavailable'
        ];
        return reasons[Math.floor(Math.random() * reasons.length)];
    }
    getAllPayments() {
        return Array.from(this.processedPayments.values());
    }
    hasPayment(paymentId) {
        return this.processedPayments.has(paymentId);
    }
    getPaymentCount() {
        return this.processedPayments.size;
    }
    setFailureRate(rate) {
        this.config.successRate = 1 - rate;
    }
    setNetworkDelay(delay) {
        this.config.averageResponseTime = delay;
        this.config.enableNetworkDelay = true;
    }
    setRateLimit(limit) {
        console.log(`Rate limit set to ${limit} requests per second`);
    }
}
exports.MockPaymentProcessor = MockPaymentProcessor;
//# sourceMappingURL=MockPaymentProcessor.js.map