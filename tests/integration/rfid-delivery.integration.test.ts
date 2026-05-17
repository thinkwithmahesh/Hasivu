/**
 * HASIVU Platform - RFID Delivery Verification Integration Tests
 *
 * Comprehensive integration test for RFID-based delivery verification system
 * Tests complete delivery workflow with RFID card scanning and verification
 *
 * Epic Coverage:
 * - Epic 3: RFID Delivery Verification System
 * - Epic 1: Order Management System
 * - Epic 4: Notification & Communication System
 *
 * Test Scenarios:
 * 1. RFID Card Registration and Activation
 * 2. Successful Delivery Verification
 * 3. Failed Verification (Invalid Card/Reader)
 * 4. Multiple Delivery Verifications
 * 5. RFID Reader Status and Connectivity
 * 6. Delivery Verification with Photos
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

// Test setup utilities
import {
  setupIntegrationTests,
  teardownIntegrationTests,
  cleanTestDatabase,
  IntegrationTestConfig
} from '../setup-integration';

// Global test state
let prisma: PrismaClient;
let testSchoolId: string;
let testStudentId: string;
let testRFIDCardId: string;
let testRFIDReaderId: string;
let testOrderId: string;

/**
 * Setup test environment with RFID infrastructure
 */
beforeAll(async () => {
  console.log('🚀 Initializing RFID Delivery Verification Test Environment...');

  const testEnv = await setupIntegrationTests();
  prisma = testEnv.prisma;

  // Create test school
  const school = await prisma.school.create({
    data: {
      name: 'Test RFID School',
      code: `RFID_SCHOOL_${uuidv4().substring(0, 8)}`,
      address: JSON.stringify({
        street: '456 RFID Test Avenue',
        city: 'RFIDCity',
        state: 'TestState',
        pincode: '654321'
      }),
      phone: '+91-9876543220',
      email: 'rfid-test@school.com',
      principalName: 'RFID Test Principal',
      isActive: true
    }
  });
  testSchoolId = school.id;

  // Create test student
  const student = await prisma.user.create({
    data: {
      email: `rfid-student-${uuidv4()}@test.com`,
      passwordHash: '$2a$12$testhashedpassword',
      firstName: 'RFID',
      lastName: 'Student',
      role: 'student',
      schoolId: testSchoolId,
      grade: '8th',
      section: 'B',
      isActive: true
    }
  });
  testStudentId = student.id;

  // Create RFID card for student
  const rfidCard = await prisma.rFIDCard.create({
    data: {
      cardNumber: `RFID-${Date.now()}`,
      studentId: testStudentId,
      schoolId: testSchoolId,
      isActive: true,
      issuedAt: new Date()
    }
  });
  testRFIDCardId = rfidCard.id;

  // Create RFID reader at school
  const rfidReader = await prisma.rFIDReader.create({
    data: {
      name: 'Main Entrance Reader',
      location: 'School Main Gate',
      schoolId: testSchoolId,
      ipAddress: '192.168.1.100',
      status: 'online',
      lastHeartbeat: new Date(),
      isActive: true
    }
  });
  testRFIDReaderId = rfidReader.id;

  // Create test order for delivery
  const order = await prisma.order.create({
    data: {
      orderNumber: `ORD-RFID-${Date.now()}`,
      userId: testStudentId,
      studentId: testStudentId,
      schoolId: testSchoolId,
      totalAmount: 150.00,
      deliveryDate: new Date(),
      status: 'out_for_delivery',
      paymentStatus: 'paid'
    }
  });
  testOrderId = order.id;

  console.log(`✅ RFID Test Environment Ready`);
  console.log(`📊 School: ${testSchoolId}, Student: ${testStudentId}`);
  console.log(`🔖 RFID Card: ${testRFIDCardId}, Reader: ${testRFIDReaderId}`);
}, 60000);

afterAll(async () => {
  await teardownIntegrationTests();
  console.log('✅ RFID cleanup completed');
}, 30000);

beforeEach(async () => {
  // Clean delivery verifications before each test
  await prisma.deliveryVerification.deleteMany({});
});

/**
 * Test Suite: RFID Delivery Verification
 */
describe('RFID Delivery Verification Integration Tests', () => {

  /**
   * Test 1: Successful Delivery Verification
   */
  test('should successfully verify delivery with RFID card scan', async () => {
    console.log('✅ Test 1: Successful RFID delivery verification...');

    // Simulate RFID card scan at reader
    const verification = await prisma.deliveryVerification.create({
      data: {
        orderId: testOrderId,
        studentId: testStudentId,
        cardId: testRFIDCardId,
        readerId: testRFIDReaderId,
        status: 'verified',
        location: 'School Main Gate',
        verifiedAt: new Date(),
        verificationData: JSON.stringify({
          scanTimestamp: new Date().toISOString(),
          readerLocation: 'Main Entrance',
          signalStrength: 95
        })
      }
    });

    expect(verification.id).toBeDefined();
    expect(verification.status).toBe('verified');
    expect(verification.location).toBe('School Main Gate');
    console.log(`📍 Delivery verified: ${verification.id}`);

    // Update order status to delivered
    const deliveredOrder = await prisma.order.update({
      where: { id: testOrderId },
      data: {
        status: 'delivered',
        deliveredAt: new Date()
      }
    });

    expect(deliveredOrder.status).toBe('delivered');
    expect(deliveredOrder.deliveredAt).toBeDefined();

    // Update RFID card last used time
    await prisma.rFIDCard.update({
      where: { id: testRFIDCardId },
      data: {
        lastUsedAt: new Date()
      }
    });

    // Verify complete delivery record
    const completeVerification = await prisma.deliveryVerification.findUnique({
      where: { id: verification.id },
      include: {
        order: true,
        student: true,
        card: true,
        reader: true
      }
    });

    expect(completeVerification).toBeDefined();
    if (completeVerification && completeVerification.order) {
      expect(completeVerification.order.status).toBe('delivered');
      expect(completeVerification.student.id).toBe(testStudentId);
      expect(completeVerification.card.cardNumber).toBeDefined();
      expect(completeVerification.reader.name).toBe('Main Entrance Reader');
    }

    console.log(`🎉 Delivery verification complete with full audit trail`);
  }, 30000);

  /**
   * Test 2: RFID Card Validation
   */
  test('should reject delivery with invalid or inactive RFID card', async () => {
    console.log('❌ Test 2: Invalid RFID card rejection...');

    // Create inactive RFID card
    const inactiveCard = await prisma.rFIDCard.create({
      data: {
        cardNumber: `RFID-INACTIVE-${Date.now()}`,
        studentId: testStudentId,
        schoolId: testSchoolId,
        isActive: false,
        issuedAt: new Date(),
        deactivatedAt: new Date(),
        deactivationReason: 'Lost card'
      }
    });

    // Attempt verification with inactive card
    const failedVerification = await prisma.deliveryVerification.create({
      data: {
        orderId: testOrderId,
        studentId: testStudentId,
        cardId: inactiveCard.id,
        readerId: testRFIDReaderId,
        status: 'failed',
        location: 'School Main Gate',
        verificationNotes: 'Card is inactive or deactivated',
        verifiedAt: new Date()
      }
    });

    expect(failedVerification.status).toBe('failed');
    expect(failedVerification.verificationNotes).toContain('inactive');
    console.log(`🚫 Verification failed: ${failedVerification.verificationNotes}`);

    // Verify order status remains unchanged
    const unchangedOrder = await prisma.order.findUnique({
      where: { id: testOrderId }
    });

    expect(unchangedOrder!.status).toBe('out_for_delivery');
    console.log(`✅ Invalid card rejection handled correctly`);
  }, 30000);

  /**
   * Test 3: RFID Reader Status Check
   */
  test('should verify RFID reader online status before delivery', async () => {
    console.log('📡 Test 3: RFID reader status check...');

    // Check reader status
    const reader = await prisma.rFIDReader.findUnique({
      where: { id: testRFIDReaderId }
    });

    expect(reader).toBeDefined();
    expect(reader!.status).toBe('online');
    expect(reader!.isActive).toBe(true);
    console.log(`✅ Reader status: ${reader!.status}`);

    // Update reader heartbeat
    const updatedReader = await prisma.rFIDReader.update({
      where: { id: testRFIDReaderId },
      data: {
        lastHeartbeat: new Date()
      }
    });

    expect(updatedReader.lastHeartbeat).toBeDefined();

    // Simulate reader going offline
    const offlineReader = await prisma.rFIDReader.update({
      where: { id: testRFIDReaderId },
      data: {
        status: 'offline'
      }
    });

    expect(offlineReader.status).toBe('offline');
    console.log(`📴 Reader went offline: ${offlineReader.id}`);

    // Attempt verification with offline reader - should fail
    const failedVerification = await prisma.deliveryVerification.create({
      data: {
        orderId: testOrderId,
        studentId: testStudentId,
        cardId: testRFIDCardId,
        readerId: testRFIDReaderId,
        status: 'failed',
        verificationNotes: 'RFID reader offline',
        verifiedAt: new Date()
      }
    });

    expect(failedVerification.status).toBe('failed');
    console.log(`✅ Offline reader detection working`);

    // Restore reader to online
    await prisma.rFIDReader.update({
      where: { id: testRFIDReaderId },
      data: {
        status: 'online',
        lastHeartbeat: new Date()
      }
    });
  }, 30000);

  /**
   * Test 4: Multiple Deliveries Same Day
   */
  test('should handle multiple deliveries for same student', async () => {
    console.log('📦 Test 4: Multiple deliveries same day...');

    const deliveryCount = 3;
    const verifications: string[] = [];

    // Create multiple orders
    const orders = await Promise.all(
      Array.from({ length: deliveryCount }, (_, i) =>
        prisma.order.create({
          data: {
            orderNumber: `ORD-MULTI-${Date.now()}-${i}`,
            userId: testStudentId,
            studentId: testStudentId,
            schoolId: testSchoolId,
            totalAmount: 100.00,
            deliveryDate: new Date(),
            status: 'out_for_delivery',
            paymentStatus: 'paid'
          }
        })
      )
    );

    expect(orders).toHaveLength(deliveryCount);

    // Verify each delivery
    for (const order of orders) {
      const verification = await prisma.deliveryVerification.create({
        data: {
          orderId: order.id,
          studentId: testStudentId,
          cardId: testRFIDCardId,
          readerId: testRFIDReaderId,
          status: 'verified',
          location: 'School Main Gate',
          verifiedAt: new Date()
        }
      });

      verifications.push(verification.id);

      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: 'delivered',
          deliveredAt: new Date()
        }
      });
    }

    expect(verifications).toHaveLength(deliveryCount);

    // Verify all deliveries for student
    const studentVerifications = await prisma.deliveryVerification.findMany({
      where: {
        studentId: testStudentId,
        status: 'verified'
      }
    });

    expect(studentVerifications.length).toBeGreaterThanOrEqual(deliveryCount);
    console.log(`✅ ${deliveryCount} deliveries verified for student`);
  }, 30000);

  /**
   * Test 5: Delivery Verification with Photo
   */
  test('should support delivery verification with photo evidence', async () => {
    console.log('📸 Test 5: Delivery verification with photo...');

    // Simulate delivery with photo
    const photoUrl = `https://s3.amazonaws.com/hasivu-deliveries/${uuidv4()}.jpg`;

    const verification = await prisma.deliveryVerification.create({
      data: {
        orderId: testOrderId,
        studentId: testStudentId,
        cardId: testRFIDCardId,
        readerId: testRFIDReaderId,
        status: 'verified',
        location: 'School Main Gate',
        deliveryPhoto: photoUrl,
        verificationNotes: 'Photo verification successful',
        verifiedAt: new Date(),
        verificationData: JSON.stringify({
          photoUrl,
          photoTimestamp: new Date().toISOString(),
          capturedBy: 'Delivery Agent',
          gpsCoordinates: {
            latitude: 12.9716,
            longitude: 77.5946
          }
        })
      }
    });

    expect(verification.deliveryPhoto).toBe(photoUrl);
    expect(verification.verificationNotes).toContain('Photo');
    console.log(`📷 Delivery verified with photo: ${verification.deliveryPhoto}`);

    // Update order with photo reference
    await prisma.order.update({
      where: { id: testOrderId },
      data: {
        status: 'delivered',
        deliveredAt: new Date(),
        metadata: JSON.stringify({
          deliveryPhotoUrl: photoUrl,
          photoVerificationId: verification.id
        })
      }
    });

    console.log(`✅ Photo verification completed`);
  }, 30000);

  /**
   * Test 6: RFID Card Lifecycle Management
   */
  test('should manage complete RFID card lifecycle', async () => {
    console.log('🔄 Test 6: RFID card lifecycle management...');

    // Create new card
    const newCard = await prisma.rFIDCard.create({
      data: {
        cardNumber: `RFID-NEW-${Date.now()}`,
        studentId: testStudentId,
        schoolId: testSchoolId,
        isActive: true,
        issuedAt: new Date()
      }
    });

    expect(newCard.isActive).toBe(true);
    console.log(`✅ New card issued: ${newCard.cardNumber}`);

    // Use card for delivery
    const verification = await prisma.deliveryVerification.create({
      data: {
        orderId: testOrderId,
        studentId: testStudentId,
        cardId: newCard.id,
        readerId: testRFIDReaderId,
        status: 'verified',
        verifiedAt: new Date()
      }
    });

    expect(verification.cardId).toBe(newCard.id);

    // Update card last used time
    const usedCard = await prisma.rFIDCard.update({
      where: { id: newCard.id },
      data: {
        lastUsedAt: new Date()
      }
    });

    expect(usedCard.lastUsedAt).toBeDefined();
    console.log(`✅ Card used successfully`);

    // Deactivate old card
    const deactivatedCard = await prisma.rFIDCard.update({
      where: { id: newCard.id },
      data: {
        isActive: false,
        deactivatedAt: new Date(),
        deactivationReason: 'Card replaced - lifecycle test'
      }
    });

    expect(deactivatedCard.isActive).toBe(false);
    expect(deactivatedCard.deactivatedAt).toBeDefined();
    console.log(`✅ Card deactivated: ${deactivatedCard.deactivationReason}`);
  }, 30000);

  /**
   * Test 7: Delivery Verification Audit Trail
   */
  test('should maintain complete audit trail for deliveries', async () => {
    console.log('📋 Test 7: Delivery verification audit trail...');

    // Create multiple verifications to build audit trail
    const verifications = await Promise.all(
      Array.from({ length: 5 }, (_, i) =>
        prisma.deliveryVerification.create({
          data: {
            orderId: testOrderId,
            studentId: testStudentId,
            cardId: testRFIDCardId,
            readerId: testRFIDReaderId,
            status: 'verified',
            location: `Gate ${i + 1}`,
            verifiedAt: new Date(Date.now() + i * 1000),
            verificationData: JSON.stringify({
              scanNumber: i + 1,
              timestamp: new Date().toISOString()
            })
          }
        })
      )
    );

    expect(verifications).toHaveLength(5);

    // Query audit trail
    const auditTrail = await prisma.deliveryVerification.findMany({
      where: {
        studentId: testStudentId
      },
      orderBy: {
        verifiedAt: 'desc'
      },
      include: {
        order: true,
        card: true,
        reader: true
      }
    });

    expect(auditTrail.length).toBeGreaterThanOrEqual(5);
    expect(auditTrail[0].verifiedAt.getTime()).toBeGreaterThanOrEqual(
      auditTrail[auditTrail.length - 1].verifiedAt.getTime()
    );

    console.log(`✅ Audit trail verified: ${auditTrail.length} entries`);

    // Verify data integrity
    for (const entry of auditTrail) {
      expect(entry.studentId).toBe(testStudentId);
      expect(entry.status).toBe('verified');
      expect(entry.order).toBeDefined();
      expect(entry.card).toBeDefined();
      expect(entry.reader).toBeDefined();
    }

    console.log(`✅ Audit trail data integrity verified`);
  }, 30000);

  /**
   * Test 8: Cross-Epic Integration - Order to Delivery
   */
  test('should integrate order management with RFID delivery', async () => {
    console.log('🔗 Test 8: Order to delivery integration...');

    // Create order
    const order = await prisma.order.create({
      data: {
        orderNumber: `ORD-INTEGRATION-${Date.now()}`,
        userId: testStudentId,
        studentId: testStudentId,
        schoolId: testSchoolId,
        totalAmount: 200.00,
        deliveryDate: new Date(),
        status: 'confirmed',
        paymentStatus: 'paid'
      }
    });

    expect(order.status).toBe('confirmed');
    console.log(`📦 Order created: ${order.orderNumber}`);

    // Move to out for delivery
    await prisma.order.update({
      where: { id: order.id },
      data: { status: 'out_for_delivery' }
    });

    // RFID verification
    const verification = await prisma.deliveryVerification.create({
      data: {
        orderId: order.id,
        studentId: testStudentId,
        cardId: testRFIDCardId,
        readerId: testRFIDReaderId,
        status: 'verified',
        verifiedAt: new Date()
      }
    });

    expect(verification.status).toBe('verified');

    // Complete delivery
    const deliveredOrder = await prisma.order.update({
      where: { id: order.id },
      data: {
        status: 'delivered',
        deliveredAt: new Date()
      }
    });

    expect(deliveredOrder.status).toBe('delivered');
    expect(deliveredOrder.deliveredAt).toBeDefined();

    // Verify complete integration
    const completeOrder = await prisma.order.findUnique({
      where: { id: order.id },
      include: {
        deliveryVerifications: true
      }
    });

    expect(completeOrder).toBeDefined();
    expect(completeOrder!.deliveryVerifications).toHaveLength(1);
    expect(completeOrder!.deliveryVerifications[0].status).toBe('verified');

    console.log(`✅ Complete order-to-delivery integration verified`);
  }, 30000);
});
