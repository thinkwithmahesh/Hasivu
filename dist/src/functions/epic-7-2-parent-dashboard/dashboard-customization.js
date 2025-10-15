"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dashboardCustomizationHandler = void 0;
const logger_service_1 = require("../../services/logger.service");
const database_service_1 = require("../../shared/database.service");
const response_utils_1 = require("../../shared/response.utils");
const lambda_auth_middleware_1 = require("../../shared/middleware/lambda-auth.middleware");
const zod_1 = require("zod");
const logger = logger_service_1.LoggerService.getInstance();
const db = database_service_1.DatabaseService.getInstance();
const getPreferencesSchema = zod_1.z.object({
    parentId: zod_1.z.string().uuid(),
    category: zod_1.z.enum(['layout', 'notifications', 'display', 'privacy', 'accessibility', 'all']).optional().default('all'),
    includeRecommendations: zod_1.z.boolean().optional().default(true),
});
const updatePreferencesSchema = zod_1.z.object({
    parentId: zod_1.z.string().uuid(),
    category: zod_1.z.enum(['layout', 'notifications', 'display', 'privacy', 'accessibility']),
    preferences: zod_1.z.record(zod_1.z.string(), zod_1.z.any()),
    syncAcrossDevices: zod_1.z.boolean().optional().default(true),
});
const widgetConfigSchema = zod_1.z.object({
    parentId: zod_1.z.string().uuid(),
    action: zod_1.z.enum(['add', 'remove', 'update', 'reorder']),
    widgetId: zod_1.z.string().optional(),
    widgetData: zod_1.z.object({
        id: zod_1.z.string(),
        type: zod_1.z.string(),
        position: zod_1.z.object({
            x: zod_1.z.number(),
            y: zod_1.z.number(),
        }),
        size: zod_1.z.object({
            width: zod_1.z.number(),
            height: zod_1.z.number(),
        }),
        visible: zod_1.z.boolean().optional().default(true),
        settings: zod_1.z.record(zod_1.z.string(), zod_1.z.any()).optional().default({}),
    }).optional(),
    layoutId: zod_1.z.string().optional(),
});
const themeConfigSchema = zod_1.z.object({
    parentId: zod_1.z.string().uuid(),
    theme: zod_1.z.object({
        name: zod_1.z.string(),
        mode: zod_1.z.enum(['light', 'dark', 'auto']),
        primaryColor: zod_1.z.string().optional(),
        accentColor: zod_1.z.string().optional(),
        fontSize: zod_1.z.enum(['small', 'medium', 'large']).optional().default('medium'),
        density: zod_1.z.enum(['compact', 'comfortable', 'spacious']).optional().default('comfortable'),
        animations: zod_1.z.boolean().optional().default(true),
        customProperties: zod_1.z.record(zod_1.z.string(), zod_1.z.string()).optional().default({}),
    }),
});
const notificationPreferencesSchema = zod_1.z.object({
    parentId: zod_1.z.string().uuid(),
    preferences: zod_1.z.object({
        email: zod_1.z.object({
            enabled: zod_1.z.boolean(),
            frequency: zod_1.z.enum(['realtime', 'daily', 'weekly']),
            categories: zod_1.z.array(zod_1.z.string()),
            quietHours: zod_1.z.object({
                enabled: zod_1.z.boolean(),
                start: zod_1.z.string(),
                end: zod_1.z.string(),
            }).optional(),
        }),
        push: zod_1.z.object({
            enabled: zod_1.z.boolean(),
            categories: zod_1.z.array(zod_1.z.string()),
            sound: zod_1.z.boolean().optional().default(true),
            vibration: zod_1.z.boolean().optional().default(true),
            quietHours: zod_1.z.object({
                enabled: zod_1.z.boolean(),
                start: zod_1.z.string(),
                end: zod_1.z.string(),
            }).optional(),
        }),
        sms: zod_1.z.object({
            enabled: zod_1.z.boolean(),
            categories: zod_1.z.array(zod_1.z.string()),
            emergencyOnly: zod_1.z.boolean().optional().default(false),
        }),
        inApp: zod_1.z.object({
            enabled: zod_1.z.boolean(),
            categories: zod_1.z.array(zod_1.z.string()),
            persistence: zod_1.z.enum(['session', 'permanent']).optional().default('session'),
        }),
    }),
});
async function validateParentAccess(parentId, requestingUser) {
    try {
        if (['super_admin', 'admin'].includes(requestingUser.role)) {
            const parent = await db.getPrismaClient().user.findUnique({
                where: { id: parentId, role: 'parent' },
                include: {
                    school: { select: { id: true, name: true, code: true } }
                }
            });
            if (!parent) {
                throw new Error('Parent not found');
            }
            return parent;
        }
        if (requestingUser.role === 'parent') {
            if (requestingUser.id !== parentId) {
                throw new Error('Access denied: Can only access your own dashboard preferences');
            }
            const parent = await db.getPrismaClient().user.findUnique({
                where: { id: parentId },
                include: {
                    school: { select: { id: true, name: true, code: true } }
                }
            });
            if (!parent) {
                throw new Error('Parent not found');
            }
            return parent;
        }
        if (['school_admin', 'staff', 'teacher'].includes(requestingUser.role)) {
            const parent = await db.getPrismaClient().user.findUnique({
                where: {
                    id: parentId,
                    role: 'parent',
                    schoolId: requestingUser.schoolId
                },
                include: {
                    school: { select: { id: true, name: true, code: true } }
                }
            });
            if (!parent) {
                throw new Error('Parent not found or not in your school');
            }
            return parent;
        }
        throw new Error('Insufficient permissions');
    }
    catch (error) {
        logger.error('Parent access validation failed', {
            parentId,
            requestingUserId: requestingUser.id,
            error: error.message
        });
        throw error;
    }
}
function getDefaultPreferences(parentId, deviceInfo) {
    const now = new Date();
    const defaultPreferences = {
        id: `prefs_${parentId}_${Date.now()}`,
        parentId,
        lastUpdated: now,
        layout: {
            selectedLayout: 'default',
            customLayouts: [],
            widgets: [
                {
                    id: 'nutrition-summary',
                    type: 'nutrition-summary',
                    position: { x: 0, y: 0 },
                    size: { width: 6, height: 4 },
                    visible: true,
                    settings: {
                        title: 'Nutrition Summary',
                        showHeader: true,
                        allowResize: true,
                        allowMove: true,
                        allowRemove: true,
                        displayMode: 'detailed',
                        timeRange: 'week',
                        customSettings: {}
                    },
                    permissions: {
                        viewData: true,
                        editSettings: true,
                        exportData: true,
                        shareWidget: false
                    },
                    dataSource: {
                        source: 'child-progress-analytics',
                        caching: true
                    },
                    refreshInterval: 300,
                    cacheSettings: {
                        enabled: true,
                        ttl: 300,
                        invalidateOn: ['meal_order', 'nutrition_update']
                    }
                },
                {
                    id: 'child-progress',
                    type: 'child-progress',
                    position: { x: 6, y: 0 },
                    size: { width: 6, height: 4 },
                    visible: true,
                    settings: {
                        title: 'Child Progress',
                        showHeader: true,
                        allowResize: true,
                        allowMove: true,
                        allowRemove: true,
                        displayMode: 'detailed',
                        timeRange: 'month',
                        customSettings: {}
                    },
                    permissions: {
                        viewData: true,
                        editSettings: true,
                        exportData: true,
                        shareWidget: false
                    },
                    dataSource: {
                        source: 'child-progress-analytics',
                        caching: true
                    },
                    refreshInterval: 600,
                    cacheSettings: {
                        enabled: true,
                        ttl: 600,
                        invalidateOn: ['progress_update']
                    }
                },
                {
                    id: 'quick-actions',
                    type: 'quick-actions',
                    position: { x: 0, y: 4 },
                    size: { width: 4, height: 2 },
                    visible: true,
                    settings: {
                        title: 'Quick Actions',
                        showHeader: false,
                        allowResize: false,
                        allowMove: true,
                        allowRemove: true,
                        customSettings: {}
                    },
                    permissions: {
                        viewData: true,
                        editSettings: true,
                        exportData: false,
                        shareWidget: false
                    },
                    dataSource: {
                        source: 'static',
                        caching: false
                    },
                    refreshInterval: 0,
                    cacheSettings: {
                        enabled: false,
                        ttl: 0,
                        invalidateOn: []
                    }
                },
                {
                    id: 'notifications',
                    type: 'notifications',
                    position: { x: 8, y: 4 },
                    size: { width: 4, height: 2 },
                    visible: true,
                    settings: {
                        title: 'Recent Notifications',
                        showHeader: true,
                        allowResize: true,
                        allowMove: true,
                        allowRemove: true,
                        displayMode: 'compact',
                        customSettings: { maxItems: 5 }
                    },
                    permissions: {
                        viewData: true,
                        editSettings: true,
                        exportData: false,
                        shareWidget: false
                    },
                    dataSource: {
                        source: 'notifications',
                        caching: true
                    },
                    refreshInterval: 60,
                    cacheSettings: {
                        enabled: true,
                        ttl: 60,
                        invalidateOn: ['new_notification']
                    }
                }
            ],
            gridSettings: {
                columns: 12,
                rows: 8,
                gap: 16,
                cellSize: { width: 100, height: 80 },
                snap: true,
                guides: true
            },
            responsiveBreakpoints: {
                mobile: 768,
                tablet: 1024,
                desktop: 1280,
                largeDesktop: 1920
            },
            defaultViews: {
                dashboard: 'overview',
                childProgress: 'summary',
                nutrition: 'weekly',
                analytics: 'trends'
            }
        },
        notifications: {
            email: {
                enabled: true,
                address: '',
                frequency: 'daily',
                categories: [
                    { category: 'meal_updates', priority: 'medium', enabled: true, channels: ['email'] },
                    { category: 'nutrition_alerts', priority: 'high', enabled: true, channels: ['email', 'push'] },
                    { category: 'progress_reports', priority: 'medium', enabled: true, channels: ['email'] },
                    { category: 'system_updates', priority: 'low', enabled: false, channels: ['email'] }
                ],
                template: 'default',
                quietHours: {
                    enabled: true,
                    start: '22:00',
                    end: '07:00',
                    timezone: 'Asia/Kolkata',
                    exceptions: ['urgent']
                },
                grouping: true,
                richContent: true
            },
            push: {
                enabled: true,
                devices: [],
                categories: [
                    { category: 'meal_updates', priority: 'medium', enabled: true, channels: ['push'] },
                    { category: 'nutrition_alerts', priority: 'high', enabled: true, channels: ['push'] },
                    { category: 'emergency', priority: 'urgent', enabled: true, channels: ['push', 'sms'] }
                ],
                sound: {
                    enabled: true,
                    soundFile: 'default',
                    volume: 0.8,
                    customSounds: {}
                },
                vibration: {
                    enabled: true,
                    pattern: [200, 100, 200],
                    intensity: 'medium'
                },
                quietHours: {
                    enabled: true,
                    start: '22:00',
                    end: '07:00',
                    timezone: 'Asia/Kolkata',
                    exceptions: ['urgent', 'emergency']
                },
                badgeCount: true,
                actionButtons: true
            },
            sms: {
                enabled: false,
                phoneNumber: '',
                categories: [
                    { category: 'emergency', priority: 'urgent', enabled: true, channels: ['sms'] }
                ],
                emergencyOnly: true,
                carrier: '',
                internationalRoaming: false
            },
            inApp: {
                enabled: true,
                categories: [
                    { category: 'meal_updates', priority: 'medium', enabled: true, channels: ['inApp'] },
                    { category: 'nutrition_alerts', priority: 'high', enabled: true, channels: ['inApp'] },
                    { category: 'tips', priority: 'low', enabled: true, channels: ['inApp'] }
                ],
                persistence: 'session',
                position: 'top',
                animations: true,
                autoClose: true,
                closeDelay: 5000
            },
            digest: {
                enabled: true,
                frequency: 'weekly',
                time: '08:00',
                timezone: 'Asia/Kolkata',
                content: [
                    { type: 'nutrition_summary', priority: 1, includeCharts: true, includeDetails: false },
                    { type: 'progress_highlights', priority: 2, includeCharts: false, includeDetails: true },
                    { type: 'recommendations', priority: 3, includeCharts: false, includeDetails: false }
                ],
                format: 'summary'
            },
            escalation: {
                enabled: true,
                rules: [
                    {
                        condition: 'unread_urgent_notification',
                        delay: 300,
                        channels: ['push', 'email'],
                        recipients: ['parent']
                    }
                ],
                maxAttempts: 3,
                backoffStrategy: 'exponential'
            }
        },
        dataDisplay: {
            locale: {
                language: 'en',
                region: 'IN',
                timezone: 'Asia/Kolkata',
                currency: 'INR',
                dateFormat: 'DD/MM/YYYY',
                timeFormat: '24h',
                numberFormat: 'indian',
                firstDayOfWeek: 1
            },
            formatting: {
                decimals: 2,
                thousandsSeparator: ',',
                decimalSeparator: '.',
                currencySymbol: '₹',
                percentageFormat: '##.##%',
                scientificNotation: false
            },
            charts: {
                defaultType: 'line',
                colorScheme: 'default',
                animations: true,
                gridLines: true,
                legends: true,
                tooltips: true,
                zoom: true,
                export: true,
                customColors: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']
            },
            tables: {
                defaultPageSize: 25,
                sortable: true,
                filterable: true,
                resizable: true,
                exportable: true,
                pagination: true,
                striped: true,
                hover: true,
                density: 'standard'
            },
            colors: {
                primaryPalette: ['#3B82F6', '#1D4ED8', '#1E40AF', '#1E3A8A'],
                accentPalette: ['#10B981', '#059669', '#047857', '#065F46'],
                statusColors: {
                    success: '#10B981',
                    warning: '#F59E0B',
                    error: '#EF4444',
                    info: '#3B82F6',
                    neutral: '#6B7280'
                },
                customColors: {}
            },
            animations: {
                enabled: true,
                duration: 300,
                easing: 'ease-in-out',
                reducedMotion: false
            }
        },
        privacy: {
            dataSharing: {
                allowAnonymizedData: true,
                allowAggregatedData: true,
                allowPersonalizedAds: false,
                allowThirdPartyIntegration: false,
                allowResearchParticipation: false,
                shareWithSchool: true,
                shareWithEducators: true
            },
            analytics: {
                allowUsageTracking: true,
                allowPerformanceTracking: true,
                allowErrorTracking: true,
                allowFeatureUsageTracking: true,
                allowBehavioralAnalytics: true,
                detailedTracking: false
            },
            personalization: {
                allowPersonalization: true,
                allowRecommendations: true,
                allowProfileBuilding: true,
                allowCrossDeviceTracking: true,
                allowPredictiveAnalytics: false
            },
            retention: {
                retentionPeriod: 365,
                autoDelete: false,
                deleteInactiveData: true,
                archiveOldData: true,
                exportBeforeDeletion: true
            },
            export: {
                allowDataExport: true,
                exportFormat: 'json',
                includeMetadata: false,
                includeAnalytics: false,
                encryptedExport: false
            },
            deletion: {
                allowDataDeletion: true,
                confirmationRequired: true,
                gracePeriod: 30,
                softDelete: true,
                permanentDeletionDelay: 90
            }
        },
        accessibility: {
            visual: {
                highContrast: false,
                largeText: false,
                fontScale: 1.0,
                colorBlindnessSupport: 'none',
                reducedMotion: false,
                focusIndicators: true,
                customFontFamily: ''
            },
            motor: {
                largerClickTargets: false,
                stickyKeys: false,
                slowKeys: false,
                bounceKeys: false,
                mouseKeys: false,
                customGestures: {}
            },
            cognitive: {
                simplifiedInterface: false,
                reducedComplexity: false,
                extendedTimeouts: false,
                confirmationDialogs: true,
                progressIndicators: true,
                breadcrumbs: true
            },
            hearing: {
                visualAlerts: false,
                captions: false,
                transcripts: false,
                signLanguage: false,
                vibrationAlerts: true
            },
            keyboard: {
                keyboardNavigation: true,
                tabOrder: 'default',
                skipLinks: true,
                accessKeys: false,
                customShortcuts: {}
            },
            screen: {
                announcements: true,
                landmarks: true,
                headings: true,
                descriptions: true,
                verbosity: 'standard'
            }
        },
        personalization: {
            adaptiveUI: {
                enabled: true,
                adaptationSpeed: 'medium',
                adaptationScope: 'both',
                learningPeriod: 30,
                confidenceThreshold: 0.7
            },
            recommendations: {
                enabled: true,
                frequency: 'daily',
                categories: ['features', 'content', 'optimization'],
                sources: ['usage_patterns', 'best_practices', 'peer_comparison'],
                maxRecommendations: 5
            },
            learning: {
                trackPreferences: true,
                trackUsagePatterns: true,
                trackPerformance: true,
                adaptToChanges: true,
                learningRate: 0.1
            },
            automation: {
                autoSavePreferences: true,
                autoApplyRecommendations: false,
                autoOptimizeLayout: false,
                autoAdjustSettings: false
            }
        },
        synchronization: {
            enabled: true,
            devices: [],
            conflicts: {
                strategy: 'newest',
                priority: {
                    layout: 1,
                    notifications: 2,
                    privacy: 3,
                    accessibility: 4,
                    personalization: 5
                }
            },
            backup: {
                enabled: true,
                frequency: 'weekly',
                retention: 4,
                location: 'cloud'
            }
        },
        metadata: {
            version: '1.0.0',
            createdAt: now,
            lastUpdated: now,
            updatedBy: parentId,
            deviceInfo: deviceInfo || {
                userAgent: '',
                screen: { width: 1920, height: 1080, pixelRatio: 1, colorDepth: 24 },
                capabilities: {
                    touchScreen: false,
                    camera: false,
                    microphone: false,
                    geolocation: false,
                    notifications: true
                }
            },
            migrationHistory: []
        }
    };
    return defaultPreferences;
}
async function getDashboardPreferences(parentId, category = 'all', includeRecommendations = true) {
    try {
        const existingPrefs = await db.getPrismaClient().auditLog.findFirst({
            where: {
                userId: parentId,
                entityType: 'dashboard_preferences'
            },
            orderBy: { createdAt: 'desc' }
        });
        if (existingPrefs) {
            const changes = JSON.parse(existingPrefs.changes || 'null') || {};
            const preferences = {
                id: existingPrefs.entityId,
                parentId: existingPrefs.userId || parentId,
                lastUpdated: existingPrefs.createdAt,
                layout: changes.layout || {},
                notifications: changes.notifications || {},
                dataDisplay: changes.dataDisplay || {},
                privacy: changes.privacy || {},
                accessibility: changes.accessibility || {},
                personalization: changes.personalization || {},
                synchronization: changes.synchronization || {},
                metadata: changes.metadata || {}
            };
            if (category !== 'all') {
                const categoryData = { [category]: preferences[category] };
                return { ...preferences, ...categoryData };
            }
            return preferences;
        }
        else {
            const defaultPrefs = getDefaultPreferences(parentId);
            await db.getPrismaClient().auditLog.create({
                data: {
                    entityType: 'dashboard_preferences',
                    entityId: defaultPrefs.id,
                    action: 'create_default',
                    changes: JSON.stringify({
                        layout: defaultPrefs.layout,
                        notifications: defaultPrefs.notifications,
                        dataDisplay: defaultPrefs.dataDisplay,
                        privacy: defaultPrefs.privacy,
                        accessibility: defaultPrefs.accessibility,
                        personalization: defaultPrefs.personalization,
                        synchronization: defaultPrefs.synchronization,
                        metadata: defaultPrefs.metadata
                    }),
                    userId: parentId,
                    createdById: parentId
                }
            });
            return defaultPrefs;
        }
    }
    catch (error) {
        logger.error('Failed to get dashboard preferences', {
            parentId,
            category,
            error: error.message
        });
        return getDefaultPreferences(parentId);
    }
}
async function updateDashboardPreferences(parentId, category, preferences, syncAcrossDevices = true, updatedBy) {
    try {
        const currentPrefs = await getDashboardPreferences(parentId);
        const updatedPrefs = {
            ...currentPrefs,
            [category]: {
                ...currentPrefs[category],
                ...preferences
            },
            lastUpdated: new Date(),
            metadata: {
                ...currentPrefs.metadata,
                lastUpdated: new Date(),
                updatedBy
            }
        };
        const updateData = {
            updatedAt: new Date()
        };
        switch (category) {
            case 'layout':
                updateData.layoutPreferences = JSON.stringify(updatedPrefs.layout);
                break;
            case 'notifications':
                updateData.notificationPreferences = JSON.stringify(updatedPrefs.notifications);
                break;
            case 'display':
                updateData.dataDisplayPreferences = JSON.stringify(updatedPrefs.dataDisplay);
                break;
            case 'privacy':
                updateData.privacyPreferences = JSON.stringify(updatedPrefs.privacy);
                break;
            case 'accessibility':
                updateData.accessibilityPreferences = JSON.stringify(updatedPrefs.accessibility);
                break;
        }
        updateData.metadata = JSON.stringify(updatedPrefs.metadata);
        await db.getPrismaClient().auditLog.create({
            data: {
                entityType: 'dashboard_preferences',
                entityId: currentPrefs.id,
                action: `update_${category}`,
                changes: JSON.stringify(updateData),
                userId: parentId,
                createdById: updatedBy
            }
        });
        logger.info('Dashboard preferences updated successfully', {
            parentId,
            category,
            syncAcrossDevices,
            updatedBy
        });
        return updatedPrefs;
    }
    catch (error) {
        logger.error('Failed to update dashboard preferences', {
            parentId,
            category,
            error: error.message
        });
        throw error;
    }
}
async function manageWidgetConfiguration(parentId, action, widgetData, layoutId) {
    try {
        const currentPrefs = await getDashboardPreferences(parentId);
        let widgets = [...currentPrefs.layout.widgets];
        switch (action) {
            case 'add':
                if (widgetData) {
                    const existingWidget = widgets.find(w => w.id === widgetData.id);
                    if (existingWidget) {
                        throw new Error(`Widget with ID ${widgetData.id} already exists`);
                    }
                    widgets.push({
                        ...widgetData,
                        permissions: widgetData.permissions || {
                            viewData: true,
                            editSettings: true,
                            exportData: true,
                            shareWidget: false
                        },
                        dataSource: widgetData.dataSource || {
                            source: 'static',
                            caching: false
                        },
                        refreshInterval: widgetData.refreshInterval || 300,
                        cacheSettings: widgetData.cacheSettings || {
                            enabled: false,
                            ttl: 300,
                            invalidateOn: []
                        }
                    });
                }
                break;
            case 'remove':
                if (widgetData?.id) {
                    widgets = widgets.filter(w => w.id !== widgetData.id);
                }
                break;
            case 'update':
                if (widgetData?.id) {
                    const widgetIndex = widgets.findIndex(w => w.id === widgetData.id);
                    if (widgetIndex !== -1) {
                        widgets[widgetIndex] = {
                            ...widgets[widgetIndex],
                            ...widgetData
                        };
                    }
                }
                break;
            case 'reorder':
                if (widgetData && Array.isArray(widgetData)) {
                    const reorderedWidgets = [];
                    widgetData.forEach((widgetId) => {
                        const widget = widgets.find(w => w.id === widgetId);
                        if (widget) {
                            reorderedWidgets.push(widget);
                        }
                    });
                    widgets = reorderedWidgets;
                }
                break;
            default:
                throw new Error(`Unknown widget action: ${action}`);
        }
        await updateDashboardPreferences(parentId, 'layout', { widgets }, true, parentId);
        logger.info('Widget configuration updated successfully', {
            parentId,
            action,
            widgetId: widgetData?.id,
            totalWidgets: widgets.length
        });
        return {
            success: true,
            widgets
        };
    }
    catch (error) {
        logger.error('Failed to manage widget configuration', {
            parentId,
            action,
            error: error.message
        });
        throw error;
    }
}
async function generateLayoutRecommendations(parentId, currentPrefs) {
    try {
        const recommendations = [];
        const recentActivity = await db.getPrismaClient().auditLog.findMany({
            where: {
                userId: parentId,
                createdAt: {
                    gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 100
        });
        const featureUsage = {};
        recentActivity.forEach(activity => {
            const changes = JSON.parse(activity.changes || '{}');
            const feature = changes.feature || activity.action || 'unknown';
            featureUsage[feature] = (featureUsage[feature] || 0) + 1;
        });
        const currentWidgetTypes = currentPrefs.layout.widgets.map(w => w.type);
        if (featureUsage['nutrition-tracker'] > 10 && !currentWidgetTypes.includes('nutrition-summary')) {
            recommendations.push({
                type: 'add_widget',
                widget: 'nutrition-summary',
                reason: 'High usage of nutrition tracking features',
                impact: 'high',
                effort: 'low'
            });
        }
        if (featureUsage['analytics'] > 5 && !currentWidgetTypes.includes('analytics-chart')) {
            recommendations.push({
                type: 'add_widget',
                widget: 'analytics-chart',
                reason: 'Frequent analytics usage detected',
                impact: 'medium',
                effort: 'low'
            });
        }
        const totalWidgets = currentPrefs.layout.widgets.length;
        if (totalWidgets > 8) {
            recommendations.push({
                type: 'optimize_layout',
                suggestion: 'Consider organizing widgets into tabs or reducing visible widgets',
                reason: 'High widget count may impact performance and usability',
                impact: 'medium',
                effort: 'medium'
            });
        }
        const mobileWidgets = currentPrefs.layout.widgets.filter(w => w.size.width <= 6 && w.size.height <= 4);
        if (mobileWidgets.length < totalWidgets * 0.7) {
            recommendations.push({
                type: 'mobile_optimization',
                suggestion: 'Optimize widget sizes for mobile viewing',
                reason: 'Many widgets may be too large for mobile devices',
                impact: 'high',
                effort: 'medium'
            });
        }
        return recommendations;
    }
    catch (error) {
        logger.error('Failed to generate layout recommendations', {
            parentId,
            error: error.message
        });
        return [];
    }
}
const dashboardCustomizationHandler = async (event, context) => {
    const requestId = context.awsRequestId;
    const startTime = Date.now();
    try {
        logger.info('Dashboard customization request started', {
            requestId,
            method: event.httpMethod,
            path: event.path
        });
        const authResult = await (0, lambda_auth_middleware_1.authenticateLambda)(event);
        if (!authResult.success || !authResult.user) {
            return (0, response_utils_1.createErrorResponse)('Authentication failed', 401);
        }
        const authenticatedUser = authResult.user;
        switch (event.httpMethod) {
            case 'GET':
                return await handleGetPreferences(event, requestId, authenticatedUser);
            case 'PUT':
                return await handleUpdatePreferences(event, requestId, authenticatedUser);
            case 'POST':
                return await handleWidgetConfiguration(event, requestId, authenticatedUser);
            case 'PATCH':
                return await handleThemeConfiguration(event, requestId, authenticatedUser);
            default:
                return (0, response_utils_1.createErrorResponse)('Method not allowed', 405);
        }
    }
    catch (error) {
        const duration = Date.now() - startTime;
        logger.error('Dashboard customization request failed', {
            requestId,
            duration: `${duration}ms`,
            error: error.message,
            stack: error.stack
        });
        return (0, response_utils_1.handleError)(error, 'Failed to process dashboard customization request');
    }
};
exports.dashboardCustomizationHandler = dashboardCustomizationHandler;
async function handleGetPreferences(event, requestId, authenticatedUser) {
    try {
        const queryParams = event.queryStringParameters || {};
        const parentId = event.pathParameters?.parentId || authenticatedUser.id;
        const validatedParams = getPreferencesSchema.parse({
            parentId,
            category: queryParams.category || 'all',
            includeRecommendations: queryParams.includeRecommendations !== 'false'
        });
        await validateParentAccess(validatedParams.parentId, authenticatedUser);
        const preferences = await getDashboardPreferences(validatedParams.parentId, validatedParams.category, validatedParams.includeRecommendations);
        let recommendations = [];
        if (validatedParams.includeRecommendations) {
            recommendations = await generateLayoutRecommendations(validatedParams.parentId, preferences);
        }
        logger.info('Dashboard preferences retrieved successfully', {
            requestId,
            parentId: validatedParams.parentId,
            category: validatedParams.category,
            recommendationsCount: recommendations.length
        });
        return (0, response_utils_1.createSuccessResponse)({
            data: {
                preferences,
                recommendations,
                message: 'Dashboard preferences retrieved successfully'
            },
            message: 'Preferences retrieved successfully',
            requestId
        }, 200);
    }
    catch (error) {
        logger.error('Failed to get dashboard preferences', {
            requestId,
            error: error.message
        });
        throw error;
    }
}
async function handleUpdatePreferences(event, requestId, authenticatedUser) {
    try {
        const requestBody = JSON.parse(event.body || '{}');
        const validatedData = updatePreferencesSchema.parse(requestBody);
        await validateParentAccess(validatedData.parentId, authenticatedUser);
        const updatedPreferences = await updateDashboardPreferences(validatedData.parentId, validatedData.category, validatedData.preferences, validatedData.syncAcrossDevices, authenticatedUser.id);
        logger.info('Dashboard preferences updated successfully', {
            requestId,
            parentId: validatedData.parentId,
            category: validatedData.category,
            syncAcrossDevices: validatedData.syncAcrossDevices
        });
        return (0, response_utils_1.createSuccessResponse)({
            data: {
                preferences: updatedPreferences,
                message: 'Preferences updated successfully'
            },
            message: 'Preferences updated successfully',
            requestId
        }, 200);
    }
    catch (error) {
        logger.error('Failed to update dashboard preferences', {
            requestId,
            error: error.message
        });
        throw error;
    }
}
async function handleWidgetConfiguration(event, requestId, authenticatedUser) {
    try {
        const requestBody = JSON.parse(event.body || '{}');
        const validatedData = widgetConfigSchema.parse(requestBody);
        await validateParentAccess(validatedData.parentId, authenticatedUser);
        const result = await manageWidgetConfiguration(validatedData.parentId, validatedData.action, validatedData.widgetData, validatedData.layoutId);
        logger.info('Widget configuration updated successfully', {
            requestId,
            parentId: validatedData.parentId,
            action: validatedData.action,
            widgetId: validatedData.widgetData?.id,
            success: result.success
        });
        return (0, response_utils_1.createSuccessResponse)({
            data: {
                ...result,
                message: `Widget ${validatedData.action} completed successfully`
            },
            message: 'Widget configuration updated successfully',
            requestId
        }, 200);
    }
    catch (error) {
        logger.error('Failed to update widget configuration', {
            requestId,
            error: error.message
        });
        throw error;
    }
}
async function handleThemeConfiguration(event, requestId, authenticatedUser) {
    try {
        const requestBody = JSON.parse(event.body || '{}');
        const validatedData = themeConfigSchema.parse(requestBody);
        await validateParentAccess(validatedData.parentId, authenticatedUser);
        const updatedPreferences = await updateDashboardPreferences(validatedData.parentId, 'display', { theme: validatedData.theme }, true, authenticatedUser.id);
        logger.info('Theme configuration updated successfully', {
            requestId,
            parentId: validatedData.parentId,
            themeName: validatedData.theme.name,
            themeMode: validatedData.theme.mode
        });
        return (0, response_utils_1.createSuccessResponse)({
            data: {
                theme: validatedData.theme,
                preferences: updatedPreferences.dataDisplay,
                message: 'Theme configuration updated successfully'
            },
            message: 'Theme updated successfully',
            requestId
        }, 200);
    }
    catch (error) {
        logger.error('Failed to update theme configuration', {
            requestId,
            error: error.message
        });
        throw error;
    }
}
//# sourceMappingURL=dashboard-customization.js.map