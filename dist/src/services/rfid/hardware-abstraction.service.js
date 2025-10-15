"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rfidHardwareService = exports.RFIDHardwareAbstractionService = exports.GenericRFIDDriver = exports.HoneywellRFIDDriver = exports.ImpinjRFIDDriver = exports.ZebraRFIDDriver = exports.RFIDReaderDriver = exports.RFIDVendor = void 0;
const events_1 = require("events");
const logger_1 = require("../../utils/logger");
const redis_service_1 = __importDefault(require("../redis.service"));
var RFIDVendor;
(function (RFIDVendor) {
    RFIDVendor["ZEBRA"] = "zebra";
    RFIDVendor["IMPINJ"] = "impinj";
    RFIDVendor["HONEYWELL"] = "honeywell";
    RFIDVendor["GENERIC"] = "generic";
})(RFIDVendor || (exports.RFIDVendor = RFIDVendor = {}));
class RFIDReaderDriver extends events_1.EventEmitter {
    config;
    isConnected = false;
    lastError;
    constructor(config) {
        super();
        this.config = config;
    }
    getConfig() {
        return { ...this.config };
    }
    isReaderConnected() {
        return this.isConnected;
    }
    getLastError() {
        return this.lastError;
    }
}
exports.RFIDReaderDriver = RFIDReaderDriver;
class ZebraRFIDDriver extends RFIDReaderDriver {
    async connect() {
        try {
            logger_1.logger.info('Connecting to Zebra RFID reader', {
                readerId: this.config.id,
                ipAddress: this.config.ipAddress
            });
            const response = await this.makeRequest('/cloud/localRestAccess', 'GET');
            if (response.success) {
                this.isConnected = true;
                this.emit('connected', this.config.id);
                return true;
            }
            throw new Error('Failed to establish connection with Zebra reader');
        }
        catch (error) {
            this.lastError = error;
            logger_1.logger.error('Failed to connect to Zebra RFID reader', error, {
                readerId: this.config.id,
                ipAddress: this.config.ipAddress
            });
            return false;
        }
    }
    async disconnect() {
        this.isConnected = false;
        this.emit('disconnected', this.config.id);
        logger_1.logger.info('Disconnected from Zebra RFID reader', { readerId: this.config.id });
    }
    async scan(timeout = 5000) {
        if (!this.isConnected) {
            throw new Error('Reader not connected');
        }
        try {
            const scanResponse = await this.makeRequest('/cloud/inventory/start', 'PUT', {
                duration: timeout
            });
            if (!scanResponse.success) {
                throw new Error('Failed to start inventory scan');
            }
            await new Promise(resolve => setTimeout(resolve, timeout));
            const resultsResponse = await this.makeRequest('/cloud/inventory', 'GET');
            if (resultsResponse.data?.TagData?.length > 0) {
                const tagData = resultsResponse.data.TagData[0];
                return {
                    success: true,
                    cardId: tagData.TagId,
                    cardData: tagData.TagData,
                    signalStrength: tagData.PeakRSSI || 0,
                    timestamp: new Date(),
                    readerId: this.config.id,
                    antenna: tagData.AntennaID,
                    metadata: {
                        vendor: RFIDVendor.ZEBRA,
                        epc: tagData.TagId,
                        rssi: tagData.PeakRSSI,
                        readCount: tagData.ReadCount
                    }
                };
            }
            return {
                success: false,
                cardId: '',
                signalStrength: 0,
                timestamp: new Date(),
                readerId: this.config.id,
                error: {
                    code: 'NO_TAGS_FOUND',
                    message: 'No RFID tags detected'
                }
            };
        }
        catch (error) {
            logger_1.logger.error('Zebra RFID scan failed', error, { readerId: this.config.id });
            return {
                success: false,
                cardId: '',
                signalStrength: 0,
                timestamp: new Date(),
                readerId: this.config.id,
                error: {
                    code: 'SCAN_ERROR',
                    message: error instanceof Error ? (error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error)) : 'Unknown scan error',
                    details: error
                }
            };
        }
    }
    async getStatus() {
        try {
            const statusResponse = await this.makeRequest('/cloud/status', 'GET');
            return {
                readerId: this.config.id,
                isOnline: this.isConnected && statusResponse.success,
                lastHeartbeat: new Date(),
                connectionQuality: this.assessConnectionQuality(statusResponse.data),
                temperature: statusResponse.data?.Temperature,
                uptime: statusResponse.data?.Uptime,
                metadata: {
                    vendor: RFIDVendor.ZEBRA,
                    firmwareVersion: statusResponse.data?.FirmwareVersion,
                    serialNumber: statusResponse.data?.SerialNumber
                }
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get Zebra reader status', error, { readerId: this.config.id });
            return {
                readerId: this.config.id,
                isOnline: false,
                lastHeartbeat: new Date(),
                connectionQuality: 'poor'
            };
        }
    }
    async testConnection() {
        try {
            const response = await this.makeRequest('/cloud/status', 'GET');
            return response.success;
        }
        catch (error) {
            return false;
        }
    }
    async configure(settings) {
        try {
            const configResponse = await this.makeRequest('/cloud/config', 'PUT', settings);
            return configResponse.success;
        }
        catch (error) {
            logger_1.logger.error('Failed to configure Zebra reader', error, { readerId: this.config.id });
            return false;
        }
    }
    async makeRequest(endpoint, method, data) {
        const url = `http://${this.config.ipAddress}:${this.config.port}${endpoint}`;
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
                ...(this.config.username && this.config.password && {
                    'Authorization': `Basic ${Buffer.from(`${this.config.username}:${this.config.password}`).toString('base64')}`
                })
            },
            signal: AbortSignal.timeout(this.config.connectionTimeout),
            ...(data && { body: JSON.stringify(data) })
        };
        const response = await fetch(url, options);
        const responseData = await response.json();
        return {
            success: response.ok,
            data: responseData,
            status: response.status
        };
    }
    assessConnectionQuality(statusData) {
        if (!statusData)
            return 'poor';
        const temperature = statusData.Temperature || 25;
        const hasErrors = statusData.ErrorCount > 0;
        if (!hasErrors && temperature < 40)
            return 'excellent';
        if (!hasErrors && temperature < 50)
            return 'good';
        if (temperature < 60)
            return 'fair';
        return 'poor';
    }
}
exports.ZebraRFIDDriver = ZebraRFIDDriver;
class ImpinjRFIDDriver extends RFIDReaderDriver {
    async connect() {
        try {
            logger_1.logger.info('Connecting to Impinj RFID reader', {
                readerId: this.config.id,
                ipAddress: this.config.ipAddress
            });
            const response = await this.makeRequest('/api/v1/status', 'GET');
            if (response.success) {
                this.isConnected = true;
                this.emit('connected', this.config.id);
                return true;
            }
            throw new Error('Failed to establish connection with Impinj reader');
        }
        catch (error) {
            this.lastError = error;
            logger_1.logger.error('Failed to connect to Impinj RFID reader', error, {
                readerId: this.config.id,
                ipAddress: this.config.ipAddress
            });
            return false;
        }
    }
    async disconnect() {
        this.isConnected = false;
        this.emit('disconnected', this.config.id);
        logger_1.logger.info('Disconnected from Impinj RFID reader', { readerId: this.config.id });
    }
    async scan(timeout = 5000) {
        if (!this.isConnected) {
            throw new Error('Reader not connected');
        }
        try {
            const scanResponse = await this.makeRequest('/api/v1/inventory', 'POST', {
                duration_ms: timeout,
                antenna_configs: [{ antenna_id: 1, enabled: true }]
            });
            if (scanResponse.data?.tags?.length > 0) {
                const tagData = scanResponse.data.tags[0];
                return {
                    success: true,
                    cardId: tagData.epc,
                    cardData: tagData.user_data,
                    signalStrength: tagData.rssi || 0,
                    timestamp: new Date(tagData.timestamp),
                    readerId: this.config.id,
                    antenna: tagData.antenna_id,
                    metadata: {
                        vendor: RFIDVendor.IMPINJ,
                        epc: tagData.epc,
                        rssi: tagData.rssi,
                        phase: tagData.phase,
                        doppler_frequency: tagData.doppler_frequency
                    }
                };
            }
            return {
                success: false,
                cardId: '',
                signalStrength: 0,
                timestamp: new Date(),
                readerId: this.config.id,
                error: {
                    code: 'NO_TAGS_FOUND',
                    message: 'No RFID tags detected'
                }
            };
        }
        catch (error) {
            logger_1.logger.error('Impinj RFID scan failed', error, { readerId: this.config.id });
            return {
                success: false,
                cardId: '',
                signalStrength: 0,
                timestamp: new Date(),
                readerId: this.config.id,
                error: {
                    code: 'SCAN_ERROR',
                    message: error instanceof Error ? (error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error)) : 'Unknown scan error',
                    details: error
                }
            };
        }
    }
    async getStatus() {
        try {
            const statusResponse = await this.makeRequest('/api/v1/status', 'GET');
            return {
                readerId: this.config.id,
                isOnline: this.isConnected && statusResponse.success,
                lastHeartbeat: new Date(),
                connectionQuality: this.assessConnectionQuality(statusResponse.data),
                temperature: statusResponse.data?.temperature_c,
                uptime: statusResponse.data?.uptime_ms,
                metadata: {
                    vendor: RFIDVendor.IMPINJ,
                    firmwareVersion: statusResponse.data?.firmware_version,
                    serialNumber: statusResponse.data?.serial_number,
                    model: statusResponse.data?.model
                }
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get Impinj reader status', error, { readerId: this.config.id });
            return {
                readerId: this.config.id,
                isOnline: false,
                lastHeartbeat: new Date(),
                connectionQuality: 'poor'
            };
        }
    }
    async testConnection() {
        try {
            const response = await this.makeRequest('/api/v1/status', 'GET');
            return response.success;
        }
        catch (error) {
            return false;
        }
    }
    async configure(settings) {
        try {
            const configResponse = await this.makeRequest('/api/v1/config', 'PUT', settings);
            return configResponse.success;
        }
        catch (error) {
            logger_1.logger.error('Failed to configure Impinj reader', error, { readerId: this.config.id });
            return false;
        }
    }
    async makeRequest(endpoint, method, data) {
        const url = `http://${this.config.ipAddress}:${this.config.port}${endpoint}`;
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
                ...(this.config.apiKey && {
                    'Authorization': `Bearer ${this.config.apiKey}`
                })
            },
            signal: AbortSignal.timeout(this.config.connectionTimeout),
            ...(data && { body: JSON.stringify(data) })
        };
        const response = await fetch(url, options);
        const responseData = await response.json();
        return {
            success: response.ok,
            data: responseData,
            status: response.status
        };
    }
    assessConnectionQuality(statusData) {
        if (!statusData)
            return 'poor';
        const temperature = statusData.temperature_c || 25;
        const hasErrors = statusData.error_count > 0;
        if (!hasErrors && temperature < 35)
            return 'excellent';
        if (!hasErrors && temperature < 45)
            return 'good';
        if (temperature < 55)
            return 'fair';
        return 'poor';
    }
}
exports.ImpinjRFIDDriver = ImpinjRFIDDriver;
class HoneywellRFIDDriver extends RFIDReaderDriver {
    async connect() {
        try {
            logger_1.logger.info('Connecting to Honeywell RFID reader', {
                readerId: this.config.id,
                ipAddress: this.config.ipAddress
            });
            const response = await this.makeRequest('/reader/status', 'GET');
            if (response.success) {
                this.isConnected = true;
                this.emit('connected', this.config.id);
                return true;
            }
            throw new Error('Failed to establish connection with Honeywell reader');
        }
        catch (error) {
            this.lastError = error;
            logger_1.logger.error('Failed to connect to Honeywell RFID reader', error, {
                readerId: this.config.id,
                ipAddress: this.config.ipAddress
            });
            return false;
        }
    }
    async disconnect() {
        this.isConnected = false;
        this.emit('disconnected', this.config.id);
        logger_1.logger.info('Disconnected from Honeywell RFID reader', { readerId: this.config.id });
    }
    async scan(timeout = 5000) {
        if (!this.isConnected) {
            throw new Error('Reader not connected');
        }
        try {
            const scanResponse = await this.makeRequest('/reader/scan', 'POST', {
                scan_duration: timeout,
                power_level: this.config.powerLevel || 30
            });
            if (scanResponse.data?.results?.length > 0) {
                const tagData = scanResponse.data.results[0];
                return {
                    success: true,
                    cardId: tagData.epc_hex,
                    cardData: tagData.user_memory,
                    signalStrength: tagData.rssi_dbm || 0,
                    timestamp: new Date(tagData.timestamp),
                    readerId: this.config.id,
                    antenna: tagData.antenna_port,
                    metadata: {
                        vendor: RFIDVendor.HONEYWELL,
                        epc: tagData.epc_hex,
                        rssi: tagData.rssi_dbm,
                        read_count: tagData.read_count,
                        frequency: tagData.frequency_mhz
                    }
                };
            }
            return {
                success: false,
                cardId: '',
                signalStrength: 0,
                timestamp: new Date(),
                readerId: this.config.id,
                error: {
                    code: 'NO_TAGS_FOUND',
                    message: 'No RFID tags detected'
                }
            };
        }
        catch (error) {
            logger_1.logger.error('Honeywell RFID scan failed', error, { readerId: this.config.id });
            return {
                success: false,
                cardId: '',
                signalStrength: 0,
                timestamp: new Date(),
                readerId: this.config.id,
                error: {
                    code: 'SCAN_ERROR',
                    message: error instanceof Error ? (error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error)) : 'Unknown scan error',
                    details: error
                }
            };
        }
    }
    async getStatus() {
        try {
            const statusResponse = await this.makeRequest('/reader/status', 'GET');
            return {
                readerId: this.config.id,
                isOnline: this.isConnected && statusResponse.success,
                lastHeartbeat: new Date(),
                connectionQuality: this.assessConnectionQuality(statusResponse.data),
                temperature: statusResponse.data?.temperature_celsius,
                uptime: statusResponse.data?.uptime_seconds,
                metadata: {
                    vendor: RFIDVendor.HONEYWELL,
                    firmwareVersion: statusResponse.data?.firmware_version,
                    serialNumber: statusResponse.data?.serial_number,
                    deviceType: statusResponse.data?.device_type
                }
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get Honeywell reader status', error, { readerId: this.config.id });
            return {
                readerId: this.config.id,
                isOnline: false,
                lastHeartbeat: new Date(),
                connectionQuality: 'poor'
            };
        }
    }
    async testConnection() {
        try {
            const response = await this.makeRequest('/reader/status', 'GET');
            return response.success;
        }
        catch (error) {
            return false;
        }
    }
    async configure(settings) {
        try {
            const configResponse = await this.makeRequest('/reader/configure', 'POST', settings);
            return configResponse.success;
        }
        catch (error) {
            logger_1.logger.error('Failed to configure Honeywell reader', error, { readerId: this.config.id });
            return false;
        }
    }
    async makeRequest(endpoint, method, data) {
        const url = `http://${this.config.ipAddress}:${this.config.port}${endpoint}`;
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
                ...(this.config.username && this.config.password && {
                    'Authorization': `Basic ${Buffer.from(`${this.config.username}:${this.config.password}`).toString('base64')}`
                })
            },
            signal: AbortSignal.timeout(this.config.connectionTimeout),
            ...(data && { body: JSON.stringify(data) })
        };
        const response = await fetch(url, options);
        const responseData = await response.json();
        return {
            success: response.ok,
            data: responseData,
            status: response.status
        };
    }
    assessConnectionQuality(statusData) {
        if (!statusData)
            return 'poor';
        const temperature = statusData.temperature_celsius || 25;
        const hasErrors = statusData.error_count > 0;
        if (!hasErrors && temperature < 40)
            return 'excellent';
        if (!hasErrors && temperature < 50)
            return 'good';
        if (temperature < 60)
            return 'fair';
        return 'poor';
    }
}
exports.HoneywellRFIDDriver = HoneywellRFIDDriver;
class GenericRFIDDriver extends RFIDReaderDriver {
    async connect() {
        try {
            logger_1.logger.info('Connecting to Generic RFID reader', {
                readerId: this.config.id,
                ipAddress: this.config.ipAddress
            });
            const response = await this.makeRequest('/status', 'GET');
            if (response.success) {
                this.isConnected = true;
                this.emit('connected', this.config.id);
                return true;
            }
            throw new Error('Failed to establish connection with generic reader');
        }
        catch (error) {
            this.lastError = error;
            logger_1.logger.error('Failed to connect to Generic RFID reader', error, {
                readerId: this.config.id,
                ipAddress: this.config.ipAddress
            });
            return false;
        }
    }
    async disconnect() {
        this.isConnected = false;
        this.emit('disconnected', this.config.id);
        logger_1.logger.info('Disconnected from Generic RFID reader', { readerId: this.config.id });
    }
    async scan(timeout = 5000) {
        if (!this.isConnected) {
            throw new Error('Reader not connected');
        }
        try {
            const scanResponse = await this.makeRequest('/scan', 'POST', {
                timeout: timeout
            });
            if (scanResponse.data?.cards?.length > 0) {
                const cardData = scanResponse.data.cards[0];
                return {
                    success: true,
                    cardId: cardData.id,
                    cardData: cardData.data,
                    signalStrength: cardData.signal || 0,
                    timestamp: new Date(),
                    readerId: this.config.id,
                    metadata: {
                        vendor: RFIDVendor.GENERIC,
                        raw_data: cardData
                    }
                };
            }
            return {
                success: false,
                cardId: '',
                signalStrength: 0,
                timestamp: new Date(),
                readerId: this.config.id,
                error: {
                    code: 'NO_TAGS_FOUND',
                    message: 'No RFID tags detected'
                }
            };
        }
        catch (error) {
            logger_1.logger.error('Generic RFID scan failed', error, { readerId: this.config.id });
            return {
                success: false,
                cardId: '',
                signalStrength: 0,
                timestamp: new Date(),
                readerId: this.config.id,
                error: {
                    code: 'SCAN_ERROR',
                    message: error instanceof Error ? (error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error)) : 'Unknown scan error',
                    details: error
                }
            };
        }
    }
    async getStatus() {
        try {
            const statusResponse = await this.makeRequest('/status', 'GET');
            return {
                readerId: this.config.id,
                isOnline: this.isConnected && statusResponse.success,
                lastHeartbeat: new Date(),
                connectionQuality: this.isConnected ? 'good' : 'poor',
                metadata: {
                    vendor: RFIDVendor.GENERIC,
                    rawStatus: statusResponse.data
                }
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get Generic reader status', error, { readerId: this.config.id });
            return {
                readerId: this.config.id,
                isOnline: false,
                lastHeartbeat: new Date(),
                connectionQuality: 'poor'
            };
        }
    }
    async testConnection() {
        try {
            const response = await this.makeRequest('/status', 'GET');
            return response.success;
        }
        catch (error) {
            return false;
        }
    }
    async configure(settings) {
        try {
            const configResponse = await this.makeRequest('/config', 'POST', settings);
            return configResponse.success;
        }
        catch (error) {
            logger_1.logger.error('Failed to configure Generic reader', error, { readerId: this.config.id });
            return false;
        }
    }
    async makeRequest(endpoint, method, data) {
        const url = `http://${this.config.ipAddress}:${this.config.port}${endpoint}`;
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json'
            },
            signal: AbortSignal.timeout(this.config.connectionTimeout),
            ...(data && { body: JSON.stringify(data) })
        };
        const response = await fetch(url, options);
        const responseData = response.ok ? await response.json() : null;
        return {
            success: response.ok,
            data: responseData,
            status: response.status
        };
    }
}
exports.GenericRFIDDriver = GenericRFIDDriver;
class RFIDHardwareAbstractionService {
    static instance;
    readers = new Map();
    connectionPool = new Map();
    redis;
    constructor() {
        this.redis = redis_service_1.default;
    }
    static getInstance() {
        if (!RFIDHardwareAbstractionService.instance) {
            RFIDHardwareAbstractionService.instance = new RFIDHardwareAbstractionService();
        }
        return RFIDHardwareAbstractionService.instance;
    }
    createDriver(config) {
        switch (config.vendor) {
            case RFIDVendor.ZEBRA:
                return new ZebraRFIDDriver(config);
            case RFIDVendor.IMPINJ:
                return new ImpinjRFIDDriver(config);
            case RFIDVendor.HONEYWELL:
                return new HoneywellRFIDDriver(config);
            case RFIDVendor.GENERIC:
            default:
                return new GenericRFIDDriver(config);
        }
    }
    async addReader(config) {
        try {
            const driver = this.createDriver(config);
            driver.on('connected', (readerId) => {
                logger_1.logger.info('RFID reader connected', { readerId });
                this.updateConnectionPool(readerId, 1);
            });
            driver.on('disconnected', (readerId) => {
                logger_1.logger.info('RFID reader disconnected', { readerId });
                this.updateConnectionPool(readerId, -1);
            });
            this.readers.set(config.id, driver);
            await this.redis.setex(`rfid:reader:config:${config.id}`, 3600, JSON.stringify(config));
            logger_1.logger.info('RFID reader added to abstraction layer', {
                readerId: config.id,
                vendor: config.vendor,
                model: config.model
            });
            return true;
        }
        catch (error) {
            logger_1.logger.error('Failed to add RFID reader', error, { config });
            return false;
        }
    }
    async connectAllReaders() {
        const connected = [];
        const failed = [];
        for (const [readerId, driver] of this.readers) {
            try {
                const isConnected = await driver.connect();
                if (isConnected) {
                    connected.push(readerId);
                }
                else {
                    failed.push(readerId);
                }
            }
            catch (error) {
                logger_1.logger.error('Failed to connect to reader', error, { readerId });
                failed.push(readerId);
            }
        }
        logger_1.logger.info('Reader connection results', { connected, failed });
        return { connected, failed };
    }
    async scanReader(readerId, timeout) {
        const driver = this.readers.get(readerId);
        if (!driver) {
            throw new Error(`RFID reader not found: ${readerId}`);
        }
        if (!driver.isReaderConnected()) {
            const connected = await driver.connect();
            if (!connected) {
                throw new Error(`RFID reader not connected: ${readerId}`);
            }
        }
        return await driver.scan(timeout);
    }
    async scanAllReaders(timeout = 3000) {
        const scanPromises = [];
        for (const [readerId, driver] of this.readers) {
            if (driver.isReaderConnected()) {
                scanPromises.push(driver.scan(timeout));
            }
        }
        return await Promise.all(scanPromises);
    }
    async getAllReaderStatus() {
        const statusPromises = [];
        for (const [readerId, driver] of this.readers) {
            statusPromises.push(driver.getStatus());
        }
        return await Promise.all(statusPromises);
    }
    async getReaderStatus(readerId) {
        const driver = this.readers.get(readerId);
        if (!driver) {
            return null;
        }
        return await driver.getStatus();
    }
    async disconnectAllReaders() {
        const disconnectPromises = [];
        for (const [readerId, driver] of this.readers) {
            disconnectPromises.push(driver.disconnect());
        }
        await Promise.all(disconnectPromises);
        this.connectionPool.clear();
    }
    async removeReader(readerId) {
        const driver = this.readers.get(readerId);
        if (driver) {
            await driver.disconnect();
            this.readers.delete(readerId);
            this.connectionPool.delete(readerId);
            await this.redis.del(`rfid:reader:config:${readerId}`);
            logger_1.logger.info('RFID reader removed from abstraction layer', { readerId });
            return true;
        }
        return false;
    }
    getRegisteredReaders() {
        return Array.from(this.readers.values()).map(driver => driver.getConfig());
    }
    async testReaderConnection(readerId) {
        const driver = this.readers.get(readerId);
        if (!driver) {
            return false;
        }
        return await driver.testConnection();
    }
    async configureReader(readerId, settings) {
        const driver = this.readers.get(readerId);
        if (!driver) {
            return false;
        }
        return await driver.configure(settings);
    }
    updateConnectionPool(readerId, delta) {
        const current = this.connectionPool.get(readerId) || 0;
        this.connectionPool.set(readerId, Math.max(0, current + delta));
    }
    getConnectionPoolStats() {
        return Object.fromEntries(this.connectionPool);
    }
}
exports.RFIDHardwareAbstractionService = RFIDHardwareAbstractionService;
exports.rfidHardwareService = RFIDHardwareAbstractionService.getInstance();
//# sourceMappingURL=hardware-abstraction.service.js.map