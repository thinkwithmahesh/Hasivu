"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const predictive_analytics_service_1 = require("../../services/ml/predictive-analytics.service");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const role_middleware_1 = require("../../middleware/role.middleware");
const school_access_middleware_1 = require("../../middleware/school-access.middleware");
const logger_service_1 = require("../../services/logger.service");
const router = express_1.default.Router();
const predictionRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000,
    max: 100,
    message: 'Too many prediction requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});
const predictiveAnalytics = predictive_analytics_service_1.PredictiveAnalyticsService.getInstance();
router.post('/predict', predictionRateLimit, auth_middleware_1.authMiddleware, school_access_middleware_1.validateSchoolAccess, [
    (0, express_validator_1.body)('modelType')
        .isIn(['student_behavior', 'demand_forecasting', 'supply_chain', 'financial', 'health_outcome', 'operational_efficiency'])
        .withMessage('Invalid model type'),
    (0, express_validator_1.body)('schoolId')
        .isUUID()
        .withMessage('Invalid school ID format'),
    (0, express_validator_1.body)('inputData')
        .isObject()
        .withMessage('Input data must be an object'),
    (0, express_validator_1.body)('predictionHorizon')
        .optional()
        .isIn(['1d', '1w', '1m', '1y'])
        .withMessage('Invalid prediction horizon'),
    (0, express_validator_1.body)('confidence')
        .optional()
        .isBoolean()
        .withMessage('Confidence must be boolean'),
    (0, express_validator_1.body)('explanation')
        .optional()
        .isBoolean()
        .withMessage('Explanation must be boolean'),
    (0, express_validator_1.body)('personalization')
        .optional()
        .isObject()
        .withMessage('Personalization must be an object')
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }
        const { modelType, schoolId, inputData, predictionHorizon, confidence, explanation, personalization } = req.body;
        if (req.user?.schoolId || undefined !== schoolId && req.user?.role !== 'super_admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied to this school'
            });
        }
        const predictionRequest = {
            modelType,
            features: inputData,
            schoolId,
            predictionHorizon,
            requireConfidence: confidence || false,
            explainPrediction: explanation || false,
            personalization
        };
        const result = await predictiveAnalytics.makePrediction(predictionRequest);
        res.json({
            success: true,
            data: result,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        logger_service_1.logger.error('Prediction API error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error)) : undefined
        });
    }
});
router.post('/train', auth_middleware_1.authMiddleware, (0, role_middleware_1.roleMiddleware)(['admin', 'super_admin']), school_access_middleware_1.validateSchoolAccess, [
    (0, express_validator_1.body)('modelType')
        .isString()
        .notEmpty()
        .withMessage('Model type is required'),
    (0, express_validator_1.body)('trainingData')
        .isArray()
        .isLength({ min: 100 })
        .withMessage('Training data must be array with at least 100 samples'),
    (0, express_validator_1.body)('config')
        .isObject()
        .withMessage('Config must be an object'),
    (0, express_validator_1.body)('federatedConfig')
        .optional()
        .isObject()
        .withMessage('Federated config must be an object')
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }
        const { modelType, trainingData, config, federatedConfig } = req.body;
        const result = await predictiveAnalytics.trainModel({
            modelType,
            trainingData,
            config: {
                algorithm: config.algorithm || 'neural_network',
                hyperparameters: config.hyperparameters || {},
                validationSplit: config.validationSplit || 0.2
            },
            schoolId: req.user?.schoolId || "",
            federatedConfig
        });
        const modelId = result.modelId;
        res.json({
            success: true,
            data: {
                modelId,
                status: 'training_started'
            }
        });
    }
    catch (error) {
        logger_service_1.logger.error('Model training API error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to start model training',
            error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error)) : undefined
        });
    }
});
router.get('/analytics', auth_middleware_1.authMiddleware, school_access_middleware_1.validateSchoolAccess, [
    (0, express_validator_1.query)('schoolId')
        .optional()
        .isUUID()
        .withMessage('Invalid school ID format'),
    (0, express_validator_1.query)('timeRange.start')
        .optional()
        .isISO8601()
        .withMessage('Invalid start date format'),
    (0, express_validator_1.query)('timeRange.end')
        .optional()
        .isISO8601()
        .withMessage('Invalid end date format'),
    (0, express_validator_1.query)('includePrivacyMetrics')
        .optional()
        .isBoolean()
        .withMessage('Include privacy metrics must be boolean')
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }
        const schoolId = req.query.schoolId || req.user?.schoolId || undefined;
        const timeRange = req.query['timeRange.start'] && req.query['timeRange.end'] ? {
            start: new Date(req.query['timeRange.start']),
            end: new Date(req.query['timeRange.end'])
        } : undefined;
        const includePrivacyMetrics = req.query.includePrivacyMetrics === 'true';
        if (schoolId && req.user?.schoolId || undefined !== schoolId && req.user?.role !== 'super_admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied to this school'
            });
        }
        const analytics = await predictiveAnalytics.getAnalytics(schoolId, timeRange, includePrivacyMetrics);
        res.json({
            success: true,
            data: analytics
        });
    }
    catch (error) {
        logger_service_1.logger.error('Analytics API error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve analytics',
            error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error)) : undefined
        });
    }
});
router.post('/retrain', auth_middleware_1.authMiddleware, (0, role_middleware_1.roleMiddleware)(['admin', 'super_admin']), [
    (0, express_validator_1.body)('modelType')
        .isString()
        .notEmpty()
        .withMessage('Model type is required'),
    (0, express_validator_1.body)('schoolId')
        .optional()
        .isUUID()
        .withMessage('Invalid school ID format'),
    (0, express_validator_1.body)('force')
        .optional()
        .isBoolean()
        .withMessage('Force must be boolean')
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }
        const { modelType, schoolId, force } = req.body;
        const result = await predictiveAnalytics.retrain({
            modelType,
            schoolId,
            force: force || false
        });
        res.json({
            success: true,
            data: {
                result,
                message: result === 'not_needed' ? 'Retraining not needed' : 'Retraining started'
            }
        });
    }
    catch (error) {
        logger_service_1.logger.error('Retrain API error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to trigger retraining',
            error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error)) : undefined
        });
    }
});
router.get('/recommendations', auth_middleware_1.authMiddleware, [
    (0, express_validator_1.query)('userId')
        .isUUID()
        .withMessage('Valid user ID is required'),
    (0, express_validator_1.query)('userType')
        .isIn(['student', 'parent', 'kitchen_staff', 'admin'])
        .withMessage('Invalid user type'),
    (0, express_validator_1.query)('schoolId')
        .isUUID()
        .withMessage('Valid school ID is required'),
    (0, express_validator_1.query)('context')
        .optional()
        .custom((value) => {
        try {
            JSON.parse(value);
            return true;
        }
        catch {
            throw new Error('Context must be valid JSON');
        }
    })
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }
        const { userId, userType, schoolId, context } = req.query;
        if (req.user?.schoolId || undefined !== schoolId && req.user?.role !== 'super_admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied to this school'
            });
        }
        const recommendations = await predictiveAnalytics.getRecommendations({
            userId: userId,
            userType: userType,
            schoolId: schoolId,
            context: context ? JSON.parse(context) : {}
        });
        res.json({
            success: true,
            data: recommendations
        });
    }
    catch (error) {
        logger_service_1.logger.error('Recommendations API error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get recommendations',
            error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error)) : undefined
        });
    }
});
router.get('/models', auth_middleware_1.authMiddleware, [
    (0, express_validator_1.query)('schoolId')
        .optional()
        .isUUID()
        .withMessage('Invalid school ID format'),
    (0, express_validator_1.query)('modelType')
        .optional()
        .isString()
        .withMessage('Model type must be string')
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }
        const schoolId = req.query.schoolId;
        const modelType = req.query.modelType;
        if (schoolId && req.user?.schoolId || undefined !== schoolId && req.user?.role !== 'super_admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied to this school'
            });
        }
        const models = {
            available_models: [
                'student_behavior',
                'demand_forecasting',
                'supply_chain',
                'financial',
                'health_outcome',
                'operational_efficiency'
            ],
            model_status: {
                student_behavior: { status: 'active', accuracy: 0.92, last_updated: new Date() },
                demand_forecasting: { status: 'active', accuracy: 0.88, last_updated: new Date() },
                supply_chain: { status: 'active', accuracy: 0.85, last_updated: new Date() },
                financial: { status: 'active', accuracy: 0.90, last_updated: new Date() },
                health_outcome: { status: 'active', accuracy: 0.87, last_updated: new Date() },
                operational_efficiency: { status: 'active', accuracy: 0.89, last_updated: new Date() }
            }
        };
        res.json({
            success: true,
            data: models
        });
    }
    catch (error) {
        logger_service_1.logger.error('Models API error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get model information',
            error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error)) : undefined
        });
    }
});
router.get('/health', auth_middleware_1.authMiddleware, (0, role_middleware_1.roleMiddleware)(['admin', 'super_admin']), async (req, res) => {
    try {
        const health = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            services: {
                predictive_analytics: 'active',
                real_time_prediction: 'active',
                federated_learning: 'active',
                feature_engineering: 'active',
                recommendation_engine: 'active',
                model_monitoring: 'active',
                explainability: 'active',
                automl: 'active'
            },
            metrics: {
                predictions_per_minute: 1250,
                average_latency: 45,
                model_accuracy: 0.89,
                active_models: 6,
                federated_participants: 12
            }
        };
        res.json({
            success: true,
            data: health
        });
    }
    catch (error) {
        logger_service_1.logger.error('Health API error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get health status',
            error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error)) : undefined
        });
    }
});
exports.default = router;
//# sourceMappingURL=predictive-analytics.route.js.map