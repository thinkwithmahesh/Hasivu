"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SMSService = void 0;
const twilio_1 = __importDefault(require("twilio"));
const database_service_1 = require("./database.service");
const logger_1 = require("@/utils/logger");
const environment_1 = require("@/config/environment");
class SMSService {
    static instance;
    client;
    prisma;
    accountSid;
    authToken;
    phoneNumber;
    rateLimitKey = 'sms:rate_limit';
    constructor() {
        this.accountSid = environment_1.config.notifications.sms.apiKey || process.env.TWILIO_ACCOUNT_SID || '';
        this.authToken = process.env.TWILIO_AUTH_TOKEN || '';
        this.phoneNumber = process.env.TWILIO_PHONE_NUMBER || '';
        if (!this.accountSid || !this.authToken || !this.phoneNumber) {
            logger_1.logger.warn('SMS service not configured - Twilio credentials missing');
        }
        this.client = (0, twilio_1.default)(this.accountSid, this.authToken);
        this.prisma = typeof database_service_1.DatabaseService.getInstance === 'function' && typeof database_service_1.DatabaseService.getInstance().getPrismaClient === 'function'
            ? database_service_1.DatabaseService.getInstance().getPrismaClient()
            : database_service_1.DatabaseService.client;
    }
    static getInstance() {
        if (!SMSService.instance) {
            SMSService.instance = new SMSService();
        }
        return SMSService.instance;
    }
    async sendMessage(to, body, options = {}) {
        try {
            await this.checkRateLimit();
            const normalizedTo = this.normalizePhoneNumber(to);
            logger_1.logger.info('Sending SMS message', {
                to: normalizedTo,
                bodyLength: body.length
            });
            const message = await this.client.messages.create({
                body,
                from: this.phoneNumber,
                to: normalizedTo
            });
            const smsMessage = {
                id: message.sid,
                to: normalizedTo,
                from: this.phoneNumber,
                body,
                status: 'sent',
                messageSid: message.sid,
                timestamp: new Date(),
                retryCount: 0,
                businessData: options.businessData,
                cost: parseFloat(message.price || '0')
            };
            await this.storeMessage(smsMessage);
            logger_1.logger.info('SMS message sent successfully', {
                messageId: message.sid,
                to: normalizedTo
            });
            return smsMessage;
        }
        catch (error) {
            logger_1.logger.error('Failed to send SMS message', {
                to,
                error: (error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error)),
                stack: (error instanceof Error ? error.stack : undefined)
            });
            const failedMessage = {
                id: `failed_${Date.now()}_${Math.random()}`,
                to: this.normalizePhoneNumber(to),
                from: this.phoneNumber,
                body,
                status: 'failed',
                timestamp: new Date(),
                retryCount: 0,
                errorMessage: (error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error)),
                businessData: options.businessData
            };
            await this.storeMessage(failedMessage);
            throw error;
        }
    }
    async sendBulkMessages(messages) {
        const results = [];
        for (const message of messages) {
            try {
                const result = await this.sendMessage(message.to, message.body, {
                    businessData: message.businessData
                });
                results.push(result);
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            catch (error) {
                logger_1.logger.error('Failed to send bulk SMS message', {
                    to: message.to,
                    error: (error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error))
                });
            }
        }
        return results;
    }
    async handleStatusWebhook(messageSid, messageStatus, errorCode, errorMessage) {
        try {
            const status = this.mapTwilioStatus(messageStatus);
            const updateData = {
                status
            };
            if (status === 'delivered') {
                updateData.deliveredAt = new Date();
            }
            else if (status === 'failed') {
                updateData.failedAt = new Date();
                updateData.errorCode = errorCode;
                updateData.errorMessage = errorMessage;
            }
            await this.prisma.smsMessage.update({
                where: { messageSid },
                data: updateData
            });
            logger_1.logger.debug('Updated SMS message status', {
                messageSid,
                status,
                errorCode
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to update SMS message status', {
                messageSid,
                error: (error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error))
            });
        }
    }
    async getDeliveryMetrics(startDate, endDate) {
        try {
            const messages = await this.prisma.smsMessage.findMany({
                where: {
                    timestamp: {
                        gte: startDate,
                        lte: endDate
                    }
                }
            });
            const totalSent = messages.length;
            const totalDelivered = messages.filter((m) => m.status === 'delivered').length;
            const totalFailed = messages.filter((m) => m.status === 'failed').length;
            const deliveryRate = totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0;
            const deliveredMessages = messages.filter((m) => m.deliveredAt);
            const averageDeliveryTime = deliveredMessages.length > 0
                ? deliveredMessages.reduce((sum, m) => sum + (m.deliveredAt.getTime() - m.timestamp.getTime()), 0) / deliveredMessages.length
                : 0;
            const failureReasons = {};
            messages.filter((m) => m.status === 'failed' && m.errorMessage).forEach((m) => {
                const reason = m.errorMessage;
                failureReasons[reason] = (failureReasons[reason] || 0) + 1;
            });
            const totalCost = messages.reduce((sum, m) => sum + (m.cost || 0), 0);
            return {
                totalSent,
                totalDelivered,
                totalFailed,
                deliveryRate: Math.round(deliveryRate * 100) / 100,
                averageDeliveryTime: Math.round(averageDeliveryTime),
                failureReasons,
                totalCost: Math.round(totalCost * 100) / 100
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get SMS delivery metrics', { error: (error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error)) });
            throw error;
        }
    }
    async checkRateLimit() {
        await new Promise(resolve => setTimeout(resolve, 50));
    }
    normalizePhoneNumber(phoneNumber) {
        const digits = phoneNumber.replace(/\D/g, '');
        if (digits.length === 10) {
            return `+91${digits}`;
        }
        if (!digits.startsWith('+')) {
            return `+${digits}`;
        }
        return digits;
    }
    mapTwilioStatus(twilioStatus) {
        switch (twilioStatus.toLowerCase()) {
            case 'queued':
            case 'accepted':
            case 'sending':
                return 'queued';
            case 'sent':
                return 'sent';
            case 'delivered':
                return 'delivered';
            case 'failed':
            case 'undelivered':
                return 'failed';
            default:
                return 'failed';
        }
    }
    async storeMessage(message) {
        try {
            await this.prisma.smsMessage.create({
                data: {
                    id: message.id,
                    to: message.to,
                    from: message.from,
                    body: message.body,
                    status: message.status,
                    messageSid: message.messageSid,
                    timestamp: message.timestamp,
                    deliveredAt: message.deliveredAt,
                    failedAt: message.failedAt,
                    errorCode: message.errorCode,
                    errorMessage: message.errorMessage,
                    retryCount: message.retryCount,
                    businessData: message.businessData ? JSON.stringify(message.businessData) : null,
                    cost: message.cost
                }
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to store SMS message', {
                messageId: message.id,
                error: (error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error))
            });
        }
    }
    getConfiguration() {
        return {
            accountSid: '[REDACTED]',
            authToken: '[REDACTED]',
            phoneNumber: this.phoneNumber,
            apiVersion: '2010-04-01',
            retryCount: 3,
            retryDelay: 1000,
            rateLimitPerSecond: 10
        };
    }
    isConfigured() {
        return !!(this.accountSid && this.authToken && this.phoneNumber);
    }
}
exports.SMSService = SMSService;
exports.default = SMSService;
//# sourceMappingURL=sms.service.js.map