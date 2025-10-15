/**
 * Epic 7.2: Advanced Parent Dashboard & Insights Portal
 * Lambda Function: dashboard-customization
 *
 * Personalized dashboard configuration management service
 * Handles dashboard layout customization, widget preferences,
 * theme settings, notification preferences, and user interface personalization
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import AWS from 'aws-sdk';
import { z } from 'zod';

// Initialize AWS services
const dynamodb = new AWS.DynamoDB.DocumentClient();
const s3 = new AWS.S3();
const eventbridge = new AWS.EventBridge();

// Customization configuration
const CUSTOMIZATION_CONFIG = {
  layouts: {
    grid: {
      columns: [1, 2, 3, 4, 6],
      max_widgets: 12,
      responsive_breakpoints: ['xs', 'sm', 'md', 'lg', 'xl'],
    },
    list: {
      max_widgets: 20,
      compact_mode: true,
      scroll_type: 'infinite',
    },
    compact: {
      max_widgets: 8,
      widget_size: 'small',
      spacing: 'tight',
    },
  },
  widgets: {
    child_progress: {
      category: 'analytics',
      size_options: ['small', 'medium', 'large'],
      refresh_intervals: [60, 300, 900, 1800, 3600], // seconds
      data_sources: ['nutrition', 'engagement', 'academic'],
      customization_options: ['time_range', 'metric_selection', 'chart_type'],
    },
    spending_summary: {
      category: 'financial',
      size_options: ['small', 'medium'],
      refresh_intervals: [300, 900, 1800, 3600],
      data_sources: ['orders', 'payments', 'subscriptions'],
      customization_options: ['currency', 'time_range', 'budget_alerts'],
    },
    nutrition_insights: {
      category: 'health',
      size_options: ['medium', 'large'],
      refresh_intervals: [900, 1800, 3600],
      data_sources: ['meals', 'nutrition_tracking', 'recommendations'],
      customization_options: ['dietary_focus', 'goal_tracking', 'allergen_alerts'],
    },
    quick_actions: {
      category: 'utility',
      size_options: ['small'],
      refresh_intervals: [60, 300],
      data_sources: ['static'],
      customization_options: ['action_selection', 'icon_style', 'layout'],
    },
    notifications: {
      category: 'communication',
      size_options: ['small', 'medium'],
      refresh_intervals: [60, 300, 900],
      data_sources: ['notifications', 'alerts', 'messages'],
      customization_options: ['filter_types', 'priority_levels', 'auto_mark_read'],
    },
    calendar: {
      category: 'scheduling',
      size_options: ['medium', 'large'],
      refresh_intervals: [300, 900, 1800],
      data_sources: ['school_events', 'meal_schedule', 'deadlines'],
      customization_options: ['view_type', 'event_filters', 'reminder_settings'],
    },
    recommendations: {
      category: 'insights',
      size_options: ['medium', 'large'],
      refresh_intervals: [1800, 3600, 7200],
      data_sources: ['ai_insights', 'spending_patterns', 'nutrition_analysis'],
      customization_options: ['recommendation_types', 'confidence_threshold', 'max_items'],
    },
  },
  themes: {
    light: {
      primary_color: '#2563eb',
      secondary_color: '#64748b',
      background: '#ffffff',
      surface: '#f8fafc',
      text_primary: '#0f172a',
      text_secondary: '#64748b',
    },
    dark: {
      primary_color: '#3b82f6',
      secondary_color: '#94a3b8',
      background: '#0f172a',
      surface: '#1e293b',
      text_primary: '#f8fafc',
      text_secondary: '#cbd5e1',
    },
    auto: {
      follows_system: true,
      light_theme: 'light',
      dark_theme: 'dark',
    },
  },
  defaults: {
    layout: 'grid',
    theme: 'auto',
    widgets: ['child_progress', 'spending_summary', 'quick_actions', 'notifications'],
    refresh_interval: 300,
    language: 'en',
    timezone: 'UTC',
  },
} as const;

// Input validation schemas
const CustomizationRequestSchema = z.object({
  action: z.enum([
    'get_customization',
    'update_layout',
    'manage_widgets',
    'update_theme',
    'reset_to_defaults',
  ]),
  userId: z.string().uuid(),
  customization: z
    .object({
      layout: z
        .object({
          type: z.enum(['grid', 'list', 'compact']).optional(),
          columns: z.number().min(1).max(6).optional(),
          responsive: z.boolean().optional(),
          spacing: z.enum(['tight', 'normal', 'loose']).optional(),
        })
        .optional(),
      widgets: z
        .array(
          z.object({
            id: z.string(),
            type: z.string(),
            position: z
              .object({
                row: z.number(),
                column: z.number(),
                width: z.number().optional(),
                height: z.number().optional(),
              })
              .optional(),
            size: z.enum(['small', 'medium', 'large']).optional(),
            settings: z.record(z.any()).optional(),
            visible: z.boolean().optional(),
            refresh_interval: z.number().min(60).max(7200).optional(),
          })
        )
        .optional(),
      theme: z
        .object({
          name: z.enum(['light', 'dark', 'auto']).optional(),
          custom_colors: z
            .object({
              primary: z.string().optional(),
              secondary: z.string().optional(),
              background: z.string().optional(),
              surface: z.string().optional(),
            })
            .optional(),
          font_size: z.enum(['small', 'medium', 'large']).optional(),
          density: z.enum(['compact', 'comfortable', 'spacious']).optional(),
        })
        .optional(),
      preferences: z
        .object({
          language: z.string().optional(),
          timezone: z.string().optional(),
          currency: z.string().optional(),
          date_format: z.string().optional(),
          time_format: z.enum(['12h', '24h']).optional(),
          animations: z.boolean().optional(),
          sound_effects: z.boolean().optional(),
        })
        .optional(),
      notifications: z
        .object({
          desktop_notifications: z.boolean().optional(),
          email_digest: z.boolean().optional(),
          push_notifications: z.boolean().optional(),
          quiet_hours: z
            .object({
              enabled: z.boolean(),
              start_time: z.string(),
              end_time: z.string(),
            })
            .optional(),
          categories: z.record(z.boolean()).optional(),
        })
        .optional(),
    })
    .optional(),
  widget_operation: z
    .object({
      operation: z.enum(['add', 'remove', 'update', 'reorder']),
      widget_id: z.string().optional(),
      widget_config: z.any().optional(),
      position_updates: z
        .array(
          z.object({
            widget_id: z.string(),
            position: z.object({
              row: z.number(),
              column: z.number(),
              width: z.number().optional(),
              height: z.number().optional(),
            }),
          })
        )
        .optional(),
    })
    .optional(),
});

type CustomizationRequest = z.infer<typeof CustomizationRequestSchema>;

// Response interfaces
interface CustomizationResponse {
  userId: string;
  lastUpdated: string;
  layout: LayoutConfiguration;
  widgets: WidgetConfiguration[];
  theme: ThemeConfiguration;
  preferences: UserPreferences;
  notifications: NotificationSettings;
  metadata: {
    version: string;
    backup_available: boolean;
    sync_status: 'synced' | 'pending' | 'conflict';
    device_synced: string[];
  };
}

interface LayoutConfiguration {
  type: 'grid' | 'list' | 'compact';
  columns: number;
  responsive: boolean;
  spacing: 'tight' | 'normal' | 'loose';
  max_widgets: number;
  auto_arrange: boolean;
  scroll_behavior: 'paginated' | 'infinite' | 'manual';
}

interface WidgetConfiguration {
  id: string;
  type: string;
  title: string;
  category: string;
  position: {
    row: number;
    column: number;
    width: number;
    height: number;
  };
  size: 'small' | 'medium' | 'large';
  visible: boolean;
  settings: WidgetSettings;
  data_source: string[];
  refresh_interval: number;
  last_updated: string;
  performance_score: number;
  user_interactions: {
    views: number;
    clicks: number;
    time_spent: number;
    last_interaction: string;
  };
}

interface WidgetSettings {
  // Common settings
  show_title: boolean;
  show_refresh_button: boolean;
  show_settings_button: boolean;
  loading_animation: boolean;

  // Data settings
  time_range: string;
  max_items: number;
  sort_order: 'asc' | 'desc';
  group_by?: string;

  // Display settings
  chart_type?: 'line' | 'bar' | 'pie' | 'donut' | 'area';
  color_scheme?: string;
  show_legend?: boolean;
  show_grid?: boolean;

  // Interaction settings
  clickable_items: boolean;
  hover_effects: boolean;
  drill_down_enabled: boolean;

  // Custom settings per widget type
  [key: string]: any;
}

interface ThemeConfiguration {
  name: 'light' | 'dark' | 'auto';
  custom_colors?: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text_primary: string;
    text_secondary: string;
    accent: string;
    error: string;
    warning: string;
    success: string;
  };
  typography: {
    font_family: string;
    font_size: 'small' | 'medium' | 'large';
    line_height: number;
    font_weight: 'normal' | 'medium' | 'bold';
  };
  layout: {
    density: 'compact' | 'comfortable' | 'spacious';
    border_radius: 'none' | 'small' | 'medium' | 'large';
    shadow_intensity: 'none' | 'subtle' | 'medium' | 'strong';
  };
  effects: {
    animations: boolean;
    transitions: boolean;
    glassmorphism: boolean;
    gradient_backgrounds: boolean;
  };
}

interface UserPreferences {
  language: string;
  timezone: string;
  currency: string;
  date_format: string;
  time_format: '12h' | '24h';
  number_format: string;
  first_day_of_week: 'sunday' | 'monday';
  accessibility: {
    high_contrast: boolean;
    large_text: boolean;
    reduced_motion: boolean;
    screen_reader_support: boolean;
    keyboard_navigation: boolean;
  };
  privacy: {
    analytics_consent: boolean;
    marketing_consent: boolean;
    data_sharing_consent: boolean;
    cookie_preferences: Record<string, boolean>;
  };
}

interface NotificationSettings {
  channels: {
    desktop_notifications: boolean;
    email_digest: boolean;
    push_notifications: boolean;
    sms_notifications: boolean;
    whatsapp_notifications: boolean;
  };
  scheduling: {
    quiet_hours: {
      enabled: boolean;
      start_time: string;
      end_time: string;
      timezone: string;
    };
    digest_frequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
    max_notifications_per_hour: number;
  };
  categories: {
    orders: boolean;
    payments: boolean;
    nutrition_alerts: boolean;
    progress_updates: boolean;
    system_notifications: boolean;
    promotional: boolean;
    emergency: boolean;
  };
  personalization: {
    smart_grouping: boolean;
    priority_learning: boolean;
    auto_dismiss_read: boolean;
    contextual_timing: boolean;
  };
}

/**
 * Main Lambda handler for dashboard customization
 */
export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  const startTime = Date.now();
  const requestId = context.awsRequestId;

  try {
    // Parse and validate request
    const requestBody = JSON.parse(event.body || '{}');
    const request = CustomizationRequestSchema.parse(requestBody);
    const userId = event.requestContext?.authorizer?.user_id || request.userId;

    // Route to appropriate handler
    let result: CustomizationResponse;
    switch (request.action) {
      case 'get_customization':
        result = await getCustomizationConfig(userId);
        break;
      case 'update_layout':
        result = await updateLayoutConfiguration(userId, request);
        break;
      case 'manage_widgets':
        result = await manageWidgets(userId, request);
        break;
      case 'update_theme':
        result = await updateThemeConfiguration(userId, request);
        break;
      case 'reset_to_defaults':
        result = await resetToDefaults(userId);
        break;
      default:
        throw new Error(`Unsupported action: ${request.action}`);
    }

    // Log customization change
    await logCustomizationChange(requestId, {
      userId,
      action: request.action,
      processingTime: Date.now() - startTime,
    });

    return createResponse(200, {
      success: true,
      data: result,
      metadata: {
        requestId,
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Dashboard customization error:', error);

    await logError(requestId, error, {
      userId: requestBody?.userId,
      action: requestBody?.action,
    });

    return createResponse(error.statusCode || 500, {
      success: false,
      error: {
        code: error.code || 'CUSTOMIZATION_ERROR',
        message: error.message || 'Internal server error',
        requestId,
      },
    });
  }
};

/**
 * Get current customization configuration
 */
async function getCustomizationConfig(userId: string): Promise<CustomizationResponse> {
  try {
    // Get existing customization
    const result = await dynamodb
      .get({
        TableName: process.env.DASHBOARD_CUSTOMIZATION_TABLE!,
        Key: { userId },
      })
      .promise();

    const existingConfig = result.Item;

    if (!existingConfig) {
      // Create default configuration
      return createDefaultConfiguration(userId);
    }

    // Return existing configuration with any necessary migrations
    return await migrateConfiguration(existingConfig);
  } catch (error) {
    console.warn('Failed to get customization config, returning defaults:', error);
    return createDefaultConfiguration(userId);
  }
}

/**
 * Update layout configuration
 */
async function updateLayoutConfiguration(
  userId: string,
  request: CustomizationRequest
): Promise<CustomizationResponse> {
  const currentConfig = await getCustomizationConfig(userId);

  if (!request.customization?.layout) {
    throw new Error('Layout configuration is required');
  }

  const updatedLayout = {
    ...currentConfig.layout,
    ...request.customization.layout,
  };

  // Validate layout constraints
  validateLayoutConfiguration(updatedLayout);

  // If layout type changed, reorganize widgets
  if (updatedLayout.type !== currentConfig.layout.type) {
    currentConfig.widgets = await reorganizeWidgetsForLayout(currentConfig.widgets, updatedLayout);
  }

  const updatedConfig = {
    ...currentConfig,
    layout: updatedLayout,
    lastUpdated: new Date().toISOString(),
  };

  await saveCustomizationConfig(userId, updatedConfig);
  return updatedConfig;
}

/**
 * Manage widgets (add, remove, update, reorder)
 */
async function manageWidgets(
  userId: string,
  request: CustomizationRequest
): Promise<CustomizationResponse> {
  const currentConfig = await getCustomizationConfig(userId);

  if (!request.widget_operation) {
    throw new Error('Widget operation is required');
  }

  const { operation, widget_id, widget_config, position_updates } = request.widget_operation;

  switch (operation) {
    case 'add':
      if (!widget_config) throw new Error('Widget configuration required for add operation');
      currentConfig.widgets.push(
        await createWidgetConfiguration(widget_config, currentConfig.layout)
      );
      break;

    case 'remove':
      if (!widget_id) throw new Error('Widget ID required for remove operation');
      currentConfig.widgets = currentConfig.widgets.filter(w => w.id !== widget_id);
      break;

    case 'update':
      if (!widget_id || !widget_config)
        throw new Error('Widget ID and configuration required for update operation');
      const widgetIndex = currentConfig.widgets.findIndex(w => w.id === widget_id);
      if (widgetIndex === -1) throw new Error('Widget not found');
      currentConfig.widgets[widgetIndex] = {
        ...currentConfig.widgets[widgetIndex],
        ...widget_config,
        last_updated: new Date().toISOString(),
      };
      break;

    case 'reorder':
      if (!position_updates) throw new Error('Position updates required for reorder operation');
      for (const update of position_updates) {
        const widget = currentConfig.widgets.find(w => w.id === update.widget_id);
        if (widget) {
          widget.position = update.position;
        }
      }
      break;

    default:
      throw new Error(`Unsupported widget operation: ${operation}`);
  }

  // Validate widget configuration
  validateWidgetConfiguration(currentConfig.widgets, currentConfig.layout);

  currentConfig.lastUpdated = new Date().toISOString();
  await saveCustomizationConfig(userId, currentConfig);
  return currentConfig;
}

/**
 * Update theme configuration
 */
async function updateThemeConfiguration(
  userId: string,
  request: CustomizationRequest
): Promise<CustomizationResponse> {
  const currentConfig = await getCustomizationConfig(userId);

  if (!request.customization?.theme) {
    throw new Error('Theme configuration is required');
  }

  const updatedTheme = {
    ...currentConfig.theme,
    ...request.customization.theme,
  };

  // Validate theme configuration
  validateThemeConfiguration(updatedTheme);

  const updatedConfig = {
    ...currentConfig,
    theme: updatedTheme,
    lastUpdated: new Date().toISOString(),
  };

  await saveCustomizationConfig(userId, updatedConfig);
  return updatedConfig;
}

/**
 * Reset to default configuration
 */
async function resetToDefaults(userId: string): Promise<CustomizationResponse> {
  const defaultConfig = createDefaultConfiguration(userId);
  await saveCustomizationConfig(userId, defaultConfig);
  return defaultConfig;
}

/**
 * Create default configuration
 */
function createDefaultConfiguration(userId: string): CustomizationResponse {
  const timestamp = new Date().toISOString();

  return {
    userId,
    lastUpdated: timestamp,
    layout: {
      type: CUSTOMIZATION_CONFIG.defaults.layout as 'grid',
      columns: 3,
      responsive: true,
      spacing: 'normal',
      max_widgets: CUSTOMIZATION_CONFIG.layouts.grid.max_widgets,
      auto_arrange: true,
      scroll_behavior: 'infinite',
    },
    widgets: CUSTOMIZATION_CONFIG.defaults.widgets.map((widgetType, index) => ({
      id: `widget_${widgetType}_${Date.now()}_${index}`,
      type: widgetType,
      title: getWidgetTitle(widgetType),
      category: getWidgetCategory(widgetType),
      position: {
        row: Math.floor(index / 3),
        column: index % 3,
        width: 1,
        height: 1,
      },
      size: 'medium',
      visible: true,
      settings: getDefaultWidgetSettings(widgetType),
      data_source: getWidgetDataSources(widgetType),
      refresh_interval: CUSTOMIZATION_CONFIG.defaults.refresh_interval,
      last_updated: timestamp,
      performance_score: 1.0,
      user_interactions: {
        views: 0,
        clicks: 0,
        time_spent: 0,
        last_interaction: timestamp,
      },
    })),
    theme: {
      name: CUSTOMIZATION_CONFIG.defaults.theme as 'auto',
      typography: {
        font_family: 'Inter, system-ui, sans-serif',
        font_size: 'medium',
        line_height: 1.5,
        font_weight: 'normal',
      },
      layout: {
        density: 'comfortable',
        border_radius: 'medium',
        shadow_intensity: 'medium',
      },
      effects: {
        animations: true,
        transitions: true,
        glassmorphism: false,
        gradient_backgrounds: false,
      },
    },
    preferences: {
      language: CUSTOMIZATION_CONFIG.defaults.language,
      timezone: CUSTOMIZATION_CONFIG.defaults.timezone,
      currency: 'INR',
      date_format: 'DD/MM/YYYY',
      time_format: '24h',
      number_format: 'en-IN',
      first_day_of_week: 'monday',
      accessibility: {
        high_contrast: false,
        large_text: false,
        reduced_motion: false,
        screen_reader_support: false,
        keyboard_navigation: true,
      },
      privacy: {
        analytics_consent: true,
        marketing_consent: false,
        data_sharing_consent: false,
        cookie_preferences: {
          essential: true,
          analytics: true,
          marketing: false,
          personalization: true,
        },
      },
    },
    notifications: {
      channels: {
        desktop_notifications: true,
        email_digest: true,
        push_notifications: true,
        sms_notifications: false,
        whatsapp_notifications: true,
      },
      scheduling: {
        quiet_hours: {
          enabled: true,
          start_time: '22:00',
          end_time: '07:00',
          timezone: CUSTOMIZATION_CONFIG.defaults.timezone,
        },
        digest_frequency: 'daily',
        max_notifications_per_hour: 5,
      },
      categories: {
        orders: true,
        payments: true,
        nutrition_alerts: true,
        progress_updates: true,
        system_notifications: true,
        promotional: false,
        emergency: true,
      },
      personalization: {
        smart_grouping: true,
        priority_learning: true,
        auto_dismiss_read: false,
        contextual_timing: true,
      },
    },
    metadata: {
      version: '1.0.0',
      backup_available: false,
      sync_status: 'synced',
      device_synced: [],
    },
  };
}

/**
 * Helper functions
 */
function getWidgetTitle(widgetType: string): string {
  const titles: Record<string, string> = {
    child_progress: 'Child Progress',
    spending_summary: 'Spending Summary',
    nutrition_insights: 'Nutrition Insights',
    quick_actions: 'Quick Actions',
    notifications: 'Notifications',
    calendar: 'Calendar',
    recommendations: 'Recommendations',
  };
  return titles[widgetType] || widgetType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function getWidgetCategory(widgetType: string): string {
  const widget =
    CUSTOMIZATION_CONFIG.widgets[widgetType as keyof typeof CUSTOMIZATION_CONFIG.widgets];
  return widget?.category || 'general';
}

function getDefaultWidgetSettings(widgetType: string): WidgetSettings {
  const baseSettings: WidgetSettings = {
    show_title: true,
    show_refresh_button: true,
    show_settings_button: true,
    loading_animation: true,
    time_range: '30d',
    max_items: 10,
    sort_order: 'desc',
    clickable_items: true,
    hover_effects: true,
    drill_down_enabled: true,
  };

  // Widget-specific settings
  switch (widgetType) {
    case 'child_progress':
      return {
        ...baseSettings,
        chart_type: 'line',
        show_legend: true,
        show_grid: true,
        metric_selection: ['nutrition_score', 'engagement_score'],
        comparison_enabled: true,
      };
    case 'spending_summary':
      return {
        ...baseSettings,
        chart_type: 'bar',
        budget_alerts: true,
        currency_symbol: '₹',
        show_trends: true,
      };
    case 'nutrition_insights':
      return {
        ...baseSettings,
        dietary_focus: 'balanced',
        goal_tracking: true,
        allergen_alerts: true,
        meal_breakdown: true,
      };
    case 'quick_actions':
      return {
        ...baseSettings,
        action_selection: ['place_order', 'view_menu', 'check_balance', 'contact_support'],
        icon_style: 'rounded',
        layout: 'grid',
      };
    default:
      return baseSettings;
  }
}

function getWidgetDataSources(widgetType: string): string[] {
  const widget =
    CUSTOMIZATION_CONFIG.widgets[widgetType as keyof typeof CUSTOMIZATION_CONFIG.widgets];
  return widget?.data_sources || ['static'];
}

async function createWidgetConfiguration(
  widgetConfig: any,
  layout: LayoutConfiguration
): Promise<WidgetConfiguration> {
  const timestamp = new Date().toISOString();

  return {
    id: `widget_${widgetConfig.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: widgetConfig.type,
    title: widgetConfig.title || getWidgetTitle(widgetConfig.type),
    category: getWidgetCategory(widgetConfig.type),
    position: widgetConfig.position || (await getNextAvailablePosition(layout)),
    size: widgetConfig.size || 'medium',
    visible: widgetConfig.visible !== false,
    settings: { ...getDefaultWidgetSettings(widgetConfig.type), ...widgetConfig.settings },
    data_source: getWidgetDataSources(widgetConfig.type),
    refresh_interval:
      widgetConfig.refresh_interval || CUSTOMIZATION_CONFIG.defaults.refresh_interval,
    last_updated: timestamp,
    performance_score: 1.0,
    user_interactions: {
      views: 0,
      clicks: 0,
      time_spent: 0,
      last_interaction: timestamp,
    },
  };
}

async function getNextAvailablePosition(
  layout: LayoutConfiguration
): Promise<{ row: number; column: number; width: number; height: number }> {
  // Simple position assignment - in production, this would check existing widgets
  return {
    row: 0,
    column: 0,
    width: 1,
    height: 1,
  };
}

async function reorganizeWidgetsForLayout(
  widgets: WidgetConfiguration[],
  layout: LayoutConfiguration
): Promise<WidgetConfiguration[]> {
  // Reorganize widgets based on new layout type
  return widgets.map((widget, index) => {
    if (layout.type === 'list') {
      return {
        ...widget,
        position: {
          row: index,
          column: 0,
          width: 1,
          height: 1,
        },
      };
    } else if (layout.type === 'grid') {
      return {
        ...widget,
        position: {
          row: Math.floor(index / layout.columns),
          column: index % layout.columns,
          width: 1,
          height: 1,
        },
      };
    }
    return widget;
  });
}

function validateLayoutConfiguration(layout: LayoutConfiguration): void {
  const layoutConfig = CUSTOMIZATION_CONFIG.layouts[layout.type];

  if (layout.type === 'grid' && !layoutConfig.columns.includes(layout.columns)) {
    throw new Error(`Invalid column count for grid layout: ${layout.columns}`);
  }
}

function validateWidgetConfiguration(
  widgets: WidgetConfiguration[],
  layout: LayoutConfiguration
): void {
  const maxWidgets = CUSTOMIZATION_CONFIG.layouts[layout.type].max_widgets;

  if (widgets.length > maxWidgets) {
    throw new Error(`Too many widgets for ${layout.type} layout. Maximum: ${maxWidgets}`);
  }

  // Check for position conflicts in grid layout
  if (layout.type === 'grid') {
    const positions = new Set<string>();
    for (const widget of widgets) {
      const posKey = `${widget.position.row}_${widget.position.column}`;
      if (positions.has(posKey)) {
        throw new Error(
          `Position conflict detected at row ${widget.position.row}, column ${widget.position.column}`
        );
      }
      positions.add(posKey);
    }
  }
}

function validateThemeConfiguration(theme: ThemeConfiguration): void {
  // Validate custom colors if provided
  if (theme.custom_colors) {
    const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    Object.entries(theme.custom_colors).forEach(([key, color]) => {
      if (color && !colorRegex.test(color)) {
        throw new Error(`Invalid color format for ${key}: ${color}`);
      }
    });
  }
}

async function saveCustomizationConfig(
  userId: string,
  config: CustomizationResponse
): Promise<void> {
  // Create backup before saving
  await createConfigBackup(userId, config);

  // Save main configuration
  await dynamodb
    .put({
      TableName: process.env.DASHBOARD_CUSTOMIZATION_TABLE!,
      Item: {
        ...config,
        ttl: Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60, // 1 year
      },
    })
    .promise();

  // Trigger sync event for multi-device synchronization
  await triggerConfigSync(userId, config);
}

async function createConfigBackup(userId: string, config: CustomizationResponse): Promise<void> {
  const backupKey = `customizations/${userId}/backup_${Date.now()}.json`;

  await s3
    .putObject({
      Bucket: process.env.CUSTOMIZATION_BACKUP_BUCKET!,
      Key: backupKey,
      Body: JSON.stringify(config),
      ContentType: 'application/json',
      ServerSideEncryption: 'AES256',
    })
    .promise();
}

async function triggerConfigSync(userId: string, config: CustomizationResponse): Promise<void> {
  await eventbridge
    .putEvents({
      Entries: [
        {
          Source: 'hasivu.dashboard.customization',
          DetailType: 'Configuration Updated',
          Detail: JSON.stringify({
            userId,
            version: config.metadata.version,
            timestamp: config.lastUpdated,
          }),
        },
      ],
    })
    .promise();
}

async function migrateConfiguration(existingConfig: any): Promise<CustomizationResponse> {
  // Handle configuration migrations for newer versions
  if (!existingConfig.metadata?.version) {
    // Migrate from v0 to v1
    existingConfig = {
      ...existingConfig,
      metadata: {
        version: '1.0.0',
        backup_available: false,
        sync_status: 'synced',
        device_synced: [],
      },
    };
  }

  return existingConfig;
}

async function logCustomizationChange(requestId: string, metrics: any): Promise<void> {
  console.log('Dashboard customization completed:', { requestId, ...metrics });
}

async function logError(requestId: string, error: Error, context: any): Promise<void> {
  console.error('Dashboard customization error:', { requestId, error: error.message, context });
}

function createResponse(statusCode: number, body: any): APIGatewayProxyResult {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers':
        'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    },
    body: JSON.stringify(body),
  };
}
