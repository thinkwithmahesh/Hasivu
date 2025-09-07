"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("module-alias/register");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const index_1 = __importDefault(require("./index"));
const environment_1 = require("@/config/environment");
const logger_1 = require("@/utils/logger");
function validateEnvironment() {
    const requiredEnvVars = [
        'NODE_ENV',
        'DATABASE_URL',
        'JWT_SECRET',
        'AWS_REGION'
    ];
    const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);
    if (missing.length > 0) {
        logger_1.logger.error('Missing required environment variables:', missing);
        process.exit(1);
    }
    if (environment_1.config.server.nodeEnv === 'production') {
        const prodRequiredVars = ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY'];
        const missingProd = prodRequiredVars.filter(envVar => !process.env[envVar]);
        if (missingProd.length > 0) {
            logger_1.logger.error('Missing required production environment variables:', missingProd);
            process.exit(1);
        }
    }
    logger_1.logger.info('Environment validation completed successfully', {
        environment: environment_1.config.server.nodeEnv,
        nodeVersion: process.version
    });
}
function displayStartupBanner() {
    const banner = `
╔═══════════════════════════════════════════════════════════════╗
║                      HASIVU PLATFORM                         ║
║               School Food Service Platform                   ║
║                                                               ║
║    Environment: ${environment_1.config.server.nodeEnv.toUpperCase().padEnd(8, ' ')}                                       ║
║    Port: ${environment_1.config.server.port.toString().padEnd(4, ' ')}                                                   ║
║                                                               ║
║    Features:                                                  ║
║    ✅ RFID Delivery Verification                              ║
║    ✅ Real-time Order Tracking                                ║
║    ✅ Payment Gateway Integration                             ║
║    ✅ Multi-channel Notifications                             ║
║    ✅ WhatsApp Business Integration                           ║
║    ✅ Analytics & Reporting                                   ║
║    ✅ Socket.IO Real-time Updates                             ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
  `;
    console.log(banner);
    console.log(`🚀 Starting HASIVU Platform...`);
    console.log(`📍 Server will be available at: ${environment_1.config.server.baseUrl}`);
    console.log(`🏥 Health Check: ${environment_1.config.server.baseUrl}/api/v1/health`);
    console.log(`📚 API Documentation: ${environment_1.config.server.baseUrl}/api/v1/docs`);
    console.log('');
}
async function startServer() {
    try {
        validateEnvironment();
        displayStartupBanner();
        const port = environment_1.config.server.port || 3000;
        const host = environment_1.config.server.host || 'localhost';
        index_1.default.listen(port, host, () => {
            logger_1.logger.info('🎉 HASIVU Platform started successfully', {
                environment: environment_1.config.server.nodeEnv,
                port,
                host,
                processId: process.pid,
                nodeVersion: process.version,
                timestamp: new Date().toISOString()
            });
        });
    }
    catch (error) {
        logger_1.logger.error('❌ Failed to start HASIVU Platform:', error);
        process.exit(1);
    }
}
process.on('uncaughtException', (error) => {
    logger_1.logger.error('Uncaught Exception:', error);
    process.exit(1);
});
process.on('unhandledRejection', (reason, promise) => {
    logger_1.logger.error('Unhandled Rejection at:', { promise, reason });
    process.exit(1);
});
process.on('SIGTERM', () => {
    logger_1.logger.info('SIGTERM received, shutting down gracefully');
    process.exit(0);
});
process.on('SIGINT', () => {
    logger_1.logger.info('SIGINT received, shutting down gracefully');
    process.exit(0);
});
if (require.main === module) {
    startServer();
}
exports.default = index_1.default;
//# sourceMappingURL=server.js.map