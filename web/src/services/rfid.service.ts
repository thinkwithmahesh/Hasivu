/**
 * RFID Service
 *
 * Comprehensive service for RFID system management supporting:
 * - Real-time card verification for meal pickup
 * - RFID device management and monitoring
 * - Student card registration (individual + bulk)
 * - Transaction tracking and analytics
 * - Kitchen order fulfillment workflow
 *
 * @module services/rfid
 */

import { api } from './api';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * RFID device operational status
 */
export type DeviceStatus = 'online' | 'offline' | 'maintenance' | 'error';

/**
 * RFID card lifecycle status
 */
export type CardStatus =
  | 'active' // Card is valid and usable
  | 'inactive' // Card not yet activated
  | 'lost' // Reported lost by student
  | 'stolen' // Reported stolen
  | 'expired' // Past expiry date
  | 'suspended'; // Temporarily disabled

/**
 * Real-time verification outcome status
 */
export type VerificationStatus =
  | 'success' // Card verified, access granted
  | 'failed' // Verification failed
  | 'invalid_card' // Card not recognized
  | 'expired_card' // Card past expiry
  | 'blocked_card' // Card suspended/lost/stolen
  | 'no_order' // Student has no ready order
  | 'wrong_location'; // Scanning at wrong device

// ============================================================================
// RFID Device Interfaces
// ============================================================================

/**
 * RFID reader device configuration and status
 * Represents physical hardware deployed at various locations
 */
export interface RFIDDevice {
  /** Unique device identifier (database) */
  id: string;

  /** Hardware device ID (MAC address, serial number) */
  deviceId: string;

  /** Physical location name */
  location: string;

  /** School this device belongs to */
  schoolId: string;

  /** Current operational status */
  status: DeviceStatus;

  /** Device IP address (for network diagnostics) */
  ipAddress?: string;

  /** Current firmware version */
  firmwareVersion?: string;

  /** Last successful communication timestamp */
  lastSeen: Date;

  /** Last successful scan timestamp */
  lastScannedAt?: Date;

  /** Total number of scans processed */
  totalScans: number;

  /** Verification success rate (0-100) */
  successRate: number;

  /** Battery level for wireless devices (0-100) */
  batteryLevel?: number;

  /** Device registration timestamp */
  createdAt: Date;

  /** Last status update timestamp */
  updatedAt: Date;
}

/**
 * Request to update device status
 */
export interface UpdateDeviceStatusRequest {
  /** New operational status */
  status: DeviceStatus;

  /** Optional notes about status change */
  notes?: string;
}

// ============================================================================
// RFID Card Interfaces
// ============================================================================

/**
 * RFID card assigned to a student
 * Represents the physical card used for identification
 */
export interface RFIDCard {
  /** Unique card identifier (database) */
  id: string;

  /** Physical card number (encoded on RFID chip) */
  cardNumber: string;

  /** Student this card is assigned to */
  studentId: string;

  /** Student name (denormalized for quick access) */
  studentName: string;

  /** School this card belongs to */
  schoolId: string;

  /** Current card status */
  status: CardStatus;

  /** Date card was issued to student */
  issuedDate: Date;

  /** Optional expiry date (for annual renewal) */
  expiryDate?: Date;

  /** Timestamp when card was deactivated */
  deactivatedAt?: Date;

  /** Reason for deactivation (lost, stolen, etc.) */
  deactivationReason?: string;

  /** Total number of successful scans */
  totalScans: number;

  /** Last successful scan timestamp */
  lastScannedAt?: Date;

  /** Card creation timestamp */
  createdAt: Date;

  /** Last update timestamp */
  updatedAt: Date;
}

/**
 * Request to register a new RFID card
 */
export interface RegisterCardRequest {
  /** Physical card number to register */
  cardNumber: string;

  /** Student ID to associate card with */
  studentId: string;

  /** School ID */
  schoolId: string;

  /** Card issue date (ISO 8601) */
  issuedDate: string;

  /** Optional expiry date (ISO 8601) */
  expiryDate?: string;
}

/**
 * Bulk card registration request (CSV import)
 */
export interface BulkCardRegistration {
  /** Array of cards to register */
  cards: Array<{
    cardNumber: string;
    studentId: string;
  }>;

  /** School ID for all cards */
  schoolId: string;

  /** Issue date for all cards (ISO 8601) */
  issuedDate: string;

  /** Optional expiry date for all cards (ISO 8601) */
  expiryDate?: string;
}

/**
 * Result of bulk card registration operation
 */
export interface BulkCardResult {
  /** Number of successfully registered cards */
  success: number;

  /** Number of failed registrations */
  failed: number;

  /** Total cards processed */
  total: number;

  /** Detailed error information for failed cards */
  errors: Array<{
    cardNumber: string;
    studentId: string;
    error: string;
  }>;

  /** Successfully registered card objects */
  successfulCards: RFIDCard[];
}

/**
 * Request to deactivate a card
 */
export interface DeactivateCardRequest {
  /** Reason for deactivation */
  reason: 'lost' | 'stolen' | 'damaged' | 'expired' | 'other';

  /** Optional notes about deactivation */
  notes?: string;
}

// ============================================================================
// RFID Transaction Interfaces
// ============================================================================

/**
 * RFID scan transaction record
 * Logs every card scan event for auditing and analytics
 */
export interface RFIDTransaction {
  /** Unique transaction identifier */
  id: string;

  /** Physical card number scanned */
  cardNumber: string;

  /** Card database ID */
  cardId: string;

  /** Student who owns the card */
  studentId: string;

  /** Student name (denormalized) */
  studentName: string;

  /** Device that performed the scan */
  deviceId: string;

  /** Physical location of scan */
  location: string;

  /** Associated meal order ID (if applicable) */
  orderId?: string;

  /** Scan timestamp */
  timestamp: Date;

  /** Verification outcome */
  verificationStatus: VerificationStatus;

  /** Whether meal was delivered after verification */
  mealDelivered: boolean;

  /** Optional notes or error messages */
  notes?: string;

  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Filters for querying transactions
 */
export interface TransactionFilters {
  /** Filter by student ID */
  studentId?: string;

  /** Filter by device ID */
  deviceId?: string;

  /** Filter by verification status */
  status?: VerificationStatus;

  /** Filter by date range start (ISO 8601) */
  startDate?: string;

  /** Filter by date range end (ISO 8601) */
  endDate?: string;

  /** Filter by meal delivery status */
  mealDelivered?: boolean;

  /** Filter by order ID */
  orderId?: string;

  /** Pagination - page number */
  page?: number;

  /** Pagination - items per page */
  limit?: number;
}

/**
 * Paginated transaction response
 */
export interface TransactionResponse {
  transactions: RFIDTransaction[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============================================================================
// Real-Time Verification Interfaces
// ============================================================================

/**
 * Real-time verification request (from RFID device)
 * Sent when a student scans their card at a reader
 */
export interface VerificationRequest {
  /** Physical card number scanned */
  cardNumber: string;

  /** Device performing the scan */
  deviceId: string;

  /** Scan timestamp (ISO 8601) */
  timestamp: string;

  /** Optional order ID for meal pickup */
  orderId?: string;

  /** Additional metadata from device */
  metadata?: Record<string, unknown>;
}

/**
 * Real-time verification response
 * Returned immediately to grant/deny access
 */
export interface VerificationResponse {
  /** Overall verification success */
  success: boolean;

  /** Detailed verification status */
  status: VerificationStatus;

  /** Card database ID */
  cardId: string;

  /** Student ID */
  studentId: string;

  /** Student full name */
  studentName: string;

  /** Student grade/class */
  studentGrade?: string;

  /** Student photo URL (for visual verification) */
  studentPhoto?: string;

  /** Whether access is granted to pick up meal */
  accessGranted: boolean;

  /** Human-readable message for display */
  message: string;

  /** Associated order details (if applicable) */
  order?: {
    id: string;
    items: string[];
    allergenWarnings: string[];
    specialInstructions?: string;
  };

  /** Important warnings (allergens, dietary restrictions) */
  warnings?: string[];

  /** Transaction ID created for this verification */
  transactionId?: string;
}

// ============================================================================
// RFID System Metrics Interfaces
// ============================================================================

/**
 * RFID system performance metrics
 */
export interface RFIDMetrics {
  /** Time period for metrics */
  period: {
    start: Date;
    end: Date;
  };

  /** Total scans processed */
  totalScans: number;

  /** Successful verifications */
  successfulScans: number;

  /** Failed verifications */
  failedScans: number;

  /** Overall success rate (0-100) */
  successRate: number;

  /** Total active cards */
  activeCards: number;

  /** Total registered devices */
  totalDevices: number;

  /** Online devices */
  onlineDevices: number;

  /** Offline/error devices */
  offlineDevices: number;

  /** Average scans per day */
  avgScansPerDay: number;

  /** Peak scan time (hour of day) */
  peakScanHour?: number;

  /** Scans by verification status */
  scansByStatus: Record<VerificationStatus, number>;

  /** Scans by device location */
  scansByLocation: Record<string, number>;

  /** Top 10 most active students */
  topStudents: Array<{
    studentId: string;
    studentName: string;
    scanCount: number;
  }>;
}

/**
 * Filters for metrics queries
 */
export interface MetricsFilters {
  /** School ID */
  schoolId?: string;

  /** Start date (ISO 8601) */
  startDate?: string;

  /** End date (ISO 8601) */
  endDate?: string;

  /** Filter by specific device */
  deviceId?: string;

  /** Filter by specific location */
  location?: string;
}

// ============================================================================
// Verification History Interface
// ============================================================================

/**
 * Verification history entry for analytics
 */
export interface VerificationHistory {
  /** Verification ID */
  id: string;

  /** Student ID */
  studentId: string;

  /** Student name */
  studentName: string;

  /** Card number used */
  cardNumber: string;

  /** Device ID */
  deviceId: string;

  /** Location name */
  location: string;

  /** Verification timestamp */
  timestamp: Date;

  /** Verification status */
  status: VerificationStatus;

  /** Access granted/denied */
  accessGranted: boolean;

  /** Associated order ID */
  orderId?: string;

  /** Response time in milliseconds */
  responseTime: number;

  /** Any warnings shown */
  warnings?: string[];
}

/**
 * Filters for verification history
 */
export interface VerificationHistoryFilters {
  /** Filter by student */
  studentId?: string;

  /** Filter by device */
  deviceId?: string;

  /** Filter by location */
  location?: string;

  /** Filter by status */
  status?: VerificationStatus;

  /** Filter by date range start */
  startDate?: string;

  /** Filter by date range end */
  endDate?: string;

  /** Pagination */
  page?: number;
  limit?: number;
}

/**
 * Paginated verification history response
 */
export interface VerificationHistoryResponse {
  verifications: VerificationHistory[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============================================================================
// RFID Service Class
// ============================================================================

/**
 * RFID Service
 *
 * Manages all RFID system operations including:
 * - Device management and monitoring
 * - Card registration and lifecycle
 * - Real-time verification for meal pickup
 * - Transaction tracking and analytics
 */
class RFIDService {
  // ==========================================================================
  // Device Management
  // ==========================================================================

  /**
   * Get all RFID devices with current status
   *
   * @param schoolId - Optional school filter
   * @returns Array of RFID devices
   *
   * @example
   * ```typescript
   * const devices = await rfidService.getDevices('school-123');
   * console.log(`Found ${devices.length} devices`);
   * devices.forEach(d => console.log(`${d.location}: ${d.status}`));
   * ```
   */
  async getDevices(schoolId?: string): Promise<RFIDDevice[]> {
    const params = schoolId ? { schoolId } : {};
    const response = await api.get<RFIDDevice[]>('/rfid/devices', { params });

    // Parse date strings to Date objects
    return response.data.map(device => ({
      ...device,
      lastSeen: new Date(device.lastSeen),
      lastScannedAt: device.lastScannedAt ? new Date(device.lastScannedAt) : undefined,
      createdAt: new Date(device.createdAt),
      updatedAt: new Date(device.updatedAt),
    }));
  }

  /**
   * Update RFID device status
   *
   * Used for:
   * - Taking device offline for maintenance
   * - Marking device as online after repair
   * - Setting error status when device malfunctions
   *
   * @param deviceId - Device identifier
   * @param request - Status update request
   * @returns Updated device object
   *
   * @example
   * ```typescript
   * await rfidService.updateDeviceStatus('DEVICE-CAF-1', {
   *   status: 'maintenance',
   *   notes: 'Replacing RFID reader module'
   * });
   * ```
   */
  async updateDeviceStatus(
    deviceId: string,
    request: UpdateDeviceStatusRequest
  ): Promise<RFIDDevice> {
    const response = await api.patch<RFIDDevice>(`/rfid/devices/${deviceId}/status`, request);

    return {
      ...response.data,
      lastSeen: new Date(response.data.lastSeen),
      lastScannedAt: response.data.lastScannedAt
        ? new Date(response.data.lastScannedAt)
        : undefined,
      createdAt: new Date(response.data.createdAt),
      updatedAt: new Date(response.data.updatedAt),
    };
  }

  // ==========================================================================
  // Card Management
  // ==========================================================================

  /**
   * Register a new RFID card for a student
   *
   * Links a physical RFID card to a student account
   *
   * @param request - Card registration details
   * @returns Newly created card object
   *
   * @example
   * ```typescript
   * const card = await rfidService.registerCard({
   *   cardNumber: '1234567890',
   *   studentId: 'STU-001',
   *   schoolId: 'school-123',
   *   issuedDate: '2024-01-15',
   *   expiryDate: '2025-01-15'
   * });
   * console.log(`Card ${card.cardNumber} registered for ${card.studentName}`);
   * ```
   */
  async registerCard(request: RegisterCardRequest): Promise<RFIDCard> {
    const response = await api.post<RFIDCard>('/rfid/cards', request);

    return {
      ...response.data,
      issuedDate: new Date(response.data.issuedDate),
      expiryDate: response.data.expiryDate ? new Date(response.data.expiryDate) : undefined,
      deactivatedAt: response.data.deactivatedAt
        ? new Date(response.data.deactivatedAt)
        : undefined,
      lastScannedAt: response.data.lastScannedAt
        ? new Date(response.data.lastScannedAt)
        : undefined,
      createdAt: new Date(response.data.createdAt),
      updatedAt: new Date(response.data.updatedAt),
    };
  }

  /**
   * Bulk register RFID cards from CSV import
   *
   * Efficiently registers multiple cards in a single operation
   * Useful for:
   * - New academic year setup
   * - Batch card replacement
   * - New student enrollment
   *
   * @param request - Bulk registration request
   * @returns Registration results with success/failure details
   *
   * @example
   * ```typescript
   * const result = await rfidService.bulkRegisterCards({
   *   cards: [
   *     { cardNumber: '1111111111', studentId: 'STU-001' },
   *     { cardNumber: '2222222222', studentId: 'STU-002' },
   *     { cardNumber: '3333333333', studentId: 'STU-003' }
   *   ],
   *   schoolId: 'school-123',
   *   issuedDate: '2024-01-15',
   *   expiryDate: '2025-01-15'
   * });
   *
   * console.log(`Success: ${result.success}/${result.total}`);
   * if (result.failed > 0) {
   *   console.log('Failures:', result.errors);
   * }
   * ```
   */
  async bulkRegisterCards(request: BulkCardRegistration): Promise<BulkCardResult> {
    const response = await api.post<BulkCardResult>('/rfid/cards/bulk-register', request);

    // Parse dates in successful cards
    return {
      ...response.data,
      successfulCards: response.data.successfulCards.map(card => ({
        ...card,
        issuedDate: new Date(card.issuedDate),
        expiryDate: card.expiryDate ? new Date(card.expiryDate) : undefined,
        deactivatedAt: card.deactivatedAt ? new Date(card.deactivatedAt) : undefined,
        lastScannedAt: card.lastScannedAt ? new Date(card.lastScannedAt) : undefined,
        createdAt: new Date(card.createdAt),
        updatedAt: new Date(card.updatedAt),
      })),
    };
  }

  /**
   * Deactivate an RFID card
   *
   * Used when card is:
   * - Lost or stolen
   * - Damaged and needs replacement
   * - Student leaves school
   *
   * @param cardId - Card identifier
   * @param request - Deactivation request
   * @returns Updated card object with deactivated status
   *
   * @example
   * ```typescript
   * await rfidService.deactivateCard('card-123', {
   *   reason: 'lost',
   *   notes: 'Student reported card lost on 2024-01-20'
   * });
   * ```
   */
  async deactivateCard(cardId: string, request: DeactivateCardRequest): Promise<RFIDCard> {
    const response = await api.post<RFIDCard>(`/rfid/cards/${cardId}/deactivate`, request);

    return {
      ...response.data,
      issuedDate: new Date(response.data.issuedDate),
      expiryDate: response.data.expiryDate ? new Date(response.data.expiryDate) : undefined,
      deactivatedAt: response.data.deactivatedAt
        ? new Date(response.data.deactivatedAt)
        : undefined,
      lastScannedAt: response.data.lastScannedAt
        ? new Date(response.data.lastScannedAt)
        : undefined,
      createdAt: new Date(response.data.createdAt),
      updatedAt: new Date(response.data.updatedAt),
    };
  }

  // ==========================================================================
  // Real-Time Verification
  // ==========================================================================

  /**
   * Verify RFID card scan in real-time
   *
   * CRITICAL METHOD for kitchen order fulfillment workflow:
   * 1. Student scans card at pickup counter
   * 2. System verifies card is active
   * 3. System checks for ready orders
   * 4. System shows allergen warnings
   * 5. System grants/denies access to meal
   *
   * Target response time: <100ms
   *
   * @param request - Verification request from RFID device
   * @returns Verification response with access decision
   *
   * @example
   * ```typescript
   * // Kitchen counter RFID scan
   * const result = await rfidService.verifyCard({
   *   cardNumber: '1234567890',
   *   deviceId: 'DEVICE-CAFETERIA-1',
   *   timestamp: new Date().toISOString(),
   *   orderId: 'ORD-12345' // Optional - if scanning for specific order
   * });
   *
   * if (result.accessGranted) {
   *   console.log(`Welcome ${result.studentName}!`);
   *   console.log(`Order: ${result.order?.items.join(', ')}`);
   *
   *   if (result.warnings && result.warnings.length > 0) {
   *     console.log('⚠️ ALLERGEN WARNINGS:', result.warnings);
   *   }
   *
   *   // Grant access to meal pickup
   *   await markOrderAsDelivered(result.order.id);
   * } else {
   *   console.log(`Access Denied: ${result.message}`);
   * }
   * ```
   */
  async verifyCard(request: VerificationRequest): Promise<VerificationResponse> {
    const response = await api.post<VerificationResponse>('/rfid/verify', request);

    return response.data;
  }

  // ==========================================================================
  // Transaction Tracking
  // ==========================================================================

  /**
   * Get RFID scan transaction history
   *
   * Query past scans with filtering for:
   * - Student activity tracking
   * - Device usage monitoring
   * - Meal delivery verification
   * - Audit trail analysis
   *
   * @param filters - Transaction query filters
   * @returns Paginated transaction records
   *
   * @example
   * ```typescript
   * // Get today's successful meal pickups
   * const today = new Date().toISOString().split('T')[0];
   * const result = await rfidService.getTransactions({
   *   status: 'success',
   *   mealDelivered: true,
   *   startDate: today,
   *   page: 1,
   *   limit: 50
   * });
   *
   * console.log(`${result.total} meals delivered today`);
   * ```
   */
  async getTransactions(filters: TransactionFilters = {}): Promise<TransactionResponse> {
    const response = await api.get<TransactionResponse>('/rfid/transactions', {
      params: filters,
    });

    return {
      ...response.data,
      transactions: response.data.transactions.map(tx => ({
        ...tx,
        timestamp: new Date(tx.timestamp),
      })),
    };
  }

  // ==========================================================================
  // Analytics & Metrics
  // ==========================================================================

  /**
   * Get RFID system performance metrics
   *
   * Provides insights into:
   * - System usage patterns
   * - Device health and uptime
   * - Student activity trends
   * - Verification success rates
   *
   * @param filters - Metrics query filters
   * @returns Comprehensive system metrics
   *
   * @example
   * ```typescript
   * // Get last 7 days metrics
   * const metrics = await rfidService.getMetrics({
   *   schoolId: 'school-123',
   *   startDate: '2024-01-14',
   *   endDate: '2024-01-20'
   * });
   *
   * console.log(`Success Rate: ${metrics.successRate.toFixed(1)}%`);
   * console.log(`Active Devices: ${metrics.onlineDevices}/${metrics.totalDevices}`);
   * console.log(`Peak Hour: ${metrics.peakScanHour}:00`);
   * ```
   */
  async getMetrics(filters: MetricsFilters = {}): Promise<RFIDMetrics> {
    const response = await api.get<RFIDMetrics>('/rfid/metrics', {
      params: filters,
    });

    return {
      ...response.data,
      period: {
        start: new Date(response.data.period.start),
        end: new Date(response.data.period.end),
      },
    };
  }

  /**
   * Get verification history for analysis
   *
   * Detailed verification logs including:
   * - Response times
   * - Success/failure patterns
   * - Student behavior analytics
   * - Device performance tracking
   *
   * @param filters - History query filters
   * @returns Paginated verification history
   *
   * @example
   * ```typescript
   * // Analyze failed verifications for a device
   * const history = await rfidService.getVerificationHistory({
   *   deviceId: 'DEVICE-CAF-1',
   *   status: 'failed',
   *   startDate: '2024-01-01',
   *   limit: 100
   * });
   *
   * // Find patterns in failures
   * const avgResponseTime = history.verifications.reduce(
   *   (sum, v) => sum + v.responseTime, 0
   * ) / history.verifications.length;
   *
   * console.log(`Avg response time: ${avgResponseTime.toFixed(0)}ms`);
   * ```
   */
  async getVerificationHistory(
    filters: VerificationHistoryFilters = {}
  ): Promise<VerificationHistoryResponse> {
    const response = await api.get<VerificationHistoryResponse>('/rfid/verifications', {
      params: filters,
    });

    return {
      ...response.data,
      verifications: response.data.verifications.map(v => ({
        ...v,
        timestamp: new Date(v.timestamp),
      })),
    };
  }
}

// ============================================================================
// Service Export
// ============================================================================

/**
 * Singleton RFID service instance
 */
export const rfidService = new RFIDService();

/**
 * Default export
 */
export default rfidService;
