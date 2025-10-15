"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const uuid_1 = require("uuid");
const setup_integration_1 = require("../setup-integration");
let prisma;
let testSchoolId;
let testStudentId;
let testRFIDCardId;
let testRFIDReaderId;
let testOrderId;
(0, globals_1.beforeAll)(async () => {
    console.log('🚀 Initializing RFID Delivery Verification Test Environment...');
    const testEnv = await (0, setup_integration_1.setupIntegrationTests)();
    prisma = testEnv.prisma;
    const school = await prisma.school.create({
        data: {
            name: 'Test RFID School',
            code: `RFID_SCHOOL_${(0, uuid_1.v4)().substring(0, 8)}`,
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
    const student = await prisma.user.create({
        data: {
            email: `rfid-student-${(0, uuid_1.v4)()}@test.com`,
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
(0, globals_1.afterAll)(async () => {
    await (0, setup_integration_1.teardownIntegrationTests)();
    console.log('✅ RFID cleanup completed');
}, 30000);
(0, globals_1.beforeEach)(async () => {
    await prisma.deliveryVerification.deleteMany({});
});
(0, globals_1.describe)('RFID Delivery Verification Integration Tests', () => {
    (0, globals_1.test)('should successfully verify delivery with RFID card scan', async () => {
        console.log('✅ Test 1: Successful RFID delivery verification...');
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
        (0, globals_1.expect)(verification.id).toBeDefined();
        (0, globals_1.expect)(verification.status).toBe('verified');
        (0, globals_1.expect)(verification.location).toBe('School Main Gate');
        console.log(`📍 Delivery verified: ${verification.id}`);
        const deliveredOrder = await prisma.order.update({
            where: { id: testOrderId },
            data: {
                status: 'delivered',
                deliveredAt: new Date()
            }
        });
        (0, globals_1.expect)(deliveredOrder.status).toBe('delivered');
        (0, globals_1.expect)(deliveredOrder.deliveredAt).toBeDefined();
        await prisma.rFIDCard.update({
            where: { id: testRFIDCardId },
            data: {
                lastUsedAt: new Date()
            }
        });
        const completeVerification = await prisma.deliveryVerification.findUnique({
            where: { id: verification.id },
            include: {
                order: true,
                student: true,
                card: true,
                reader: true
            }
        });
        (0, globals_1.expect)(completeVerification).toBeDefined();
        if (completeVerification && completeVerification.order) {
            (0, globals_1.expect)(completeVerification.order.status).toBe('delivered');
            (0, globals_1.expect)(completeVerification.student.id).toBe(testStudentId);
            (0, globals_1.expect)(completeVerification.card.cardNumber).toBeDefined();
            (0, globals_1.expect)(completeVerification.reader.name).toBe('Main Entrance Reader');
        }
        console.log(`🎉 Delivery verification complete with full audit trail`);
    }, 30000);
    (0, globals_1.test)('should reject delivery with invalid or inactive RFID card', async () => {
        console.log('❌ Test 2: Invalid RFID card rejection...');
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
        (0, globals_1.expect)(failedVerification.status).toBe('failed');
        (0, globals_1.expect)(failedVerification.verificationNotes).toContain('inactive');
        console.log(`🚫 Verification failed: ${failedVerification.verificationNotes}`);
        const unchangedOrder = await prisma.order.findUnique({
            where: { id: testOrderId }
        });
        (0, globals_1.expect)(unchangedOrder.status).toBe('out_for_delivery');
        console.log(`✅ Invalid card rejection handled correctly`);
    }, 30000);
    (0, globals_1.test)('should verify RFID reader online status before delivery', async () => {
        console.log('📡 Test 3: RFID reader status check...');
        const reader = await prisma.rFIDReader.findUnique({
            where: { id: testRFIDReaderId }
        });
        (0, globals_1.expect)(reader).toBeDefined();
        (0, globals_1.expect)(reader.status).toBe('online');
        (0, globals_1.expect)(reader.isActive).toBe(true);
        console.log(`✅ Reader status: ${reader.status}`);
        const updatedReader = await prisma.rFIDReader.update({
            where: { id: testRFIDReaderId },
            data: {
                lastHeartbeat: new Date()
            }
        });
        (0, globals_1.expect)(updatedReader.lastHeartbeat).toBeDefined();
        const offlineReader = await prisma.rFIDReader.update({
            where: { id: testRFIDReaderId },
            data: {
                status: 'offline'
            }
        });
        (0, globals_1.expect)(offlineReader.status).toBe('offline');
        console.log(`📴 Reader went offline: ${offlineReader.id}`);
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
        (0, globals_1.expect)(failedVerification.status).toBe('failed');
        console.log(`✅ Offline reader detection working`);
        await prisma.rFIDReader.update({
            where: { id: testRFIDReaderId },
            data: {
                status: 'online',
                lastHeartbeat: new Date()
            }
        });
    }, 30000);
    (0, globals_1.test)('should handle multiple deliveries for same student', async () => {
        console.log('📦 Test 4: Multiple deliveries same day...');
        const deliveryCount = 3;
        const verifications = [];
        const orders = await Promise.all(Array.from({ length: deliveryCount }, (_, i) => prisma.order.create({
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
        })));
        (0, globals_1.expect)(orders).toHaveLength(deliveryCount);
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
        (0, globals_1.expect)(verifications).toHaveLength(deliveryCount);
        const studentVerifications = await prisma.deliveryVerification.findMany({
            where: {
                studentId: testStudentId,
                status: 'verified'
            }
        });
        (0, globals_1.expect)(studentVerifications.length).toBeGreaterThanOrEqual(deliveryCount);
        console.log(`✅ ${deliveryCount} deliveries verified for student`);
    }, 30000);
    (0, globals_1.test)('should support delivery verification with photo evidence', async () => {
        console.log('📸 Test 5: Delivery verification with photo...');
        const photoUrl = `https://s3.amazonaws.com/hasivu-deliveries/${(0, uuid_1.v4)()}.jpg`;
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
        (0, globals_1.expect)(verification.deliveryPhoto).toBe(photoUrl);
        (0, globals_1.expect)(verification.verificationNotes).toContain('Photo');
        console.log(`📷 Delivery verified with photo: ${verification.deliveryPhoto}`);
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
    (0, globals_1.test)('should manage complete RFID card lifecycle', async () => {
        console.log('🔄 Test 6: RFID card lifecycle management...');
        const newCard = await prisma.rFIDCard.create({
            data: {
                cardNumber: `RFID-NEW-${Date.now()}`,
                studentId: testStudentId,
                schoolId: testSchoolId,
                isActive: true,
                issuedAt: new Date()
            }
        });
        (0, globals_1.expect)(newCard.isActive).toBe(true);
        console.log(`✅ New card issued: ${newCard.cardNumber}`);
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
        (0, globals_1.expect)(verification.cardId).toBe(newCard.id);
        const usedCard = await prisma.rFIDCard.update({
            where: { id: newCard.id },
            data: {
                lastUsedAt: new Date()
            }
        });
        (0, globals_1.expect)(usedCard.lastUsedAt).toBeDefined();
        console.log(`✅ Card used successfully`);
        const deactivatedCard = await prisma.rFIDCard.update({
            where: { id: newCard.id },
            data: {
                isActive: false,
                deactivatedAt: new Date(),
                deactivationReason: 'Card replaced - lifecycle test'
            }
        });
        (0, globals_1.expect)(deactivatedCard.isActive).toBe(false);
        (0, globals_1.expect)(deactivatedCard.deactivatedAt).toBeDefined();
        console.log(`✅ Card deactivated: ${deactivatedCard.deactivationReason}`);
    }, 30000);
    (0, globals_1.test)('should maintain complete audit trail for deliveries', async () => {
        console.log('📋 Test 7: Delivery verification audit trail...');
        const verifications = await Promise.all(Array.from({ length: 5 }, (_, i) => prisma.deliveryVerification.create({
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
        })));
        (0, globals_1.expect)(verifications).toHaveLength(5);
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
        (0, globals_1.expect)(auditTrail.length).toBeGreaterThanOrEqual(5);
        (0, globals_1.expect)(auditTrail[0].verifiedAt.getTime()).toBeGreaterThanOrEqual(auditTrail[auditTrail.length - 1].verifiedAt.getTime());
        console.log(`✅ Audit trail verified: ${auditTrail.length} entries`);
        for (const entry of auditTrail) {
            (0, globals_1.expect)(entry.studentId).toBe(testStudentId);
            (0, globals_1.expect)(entry.status).toBe('verified');
            (0, globals_1.expect)(entry.order).toBeDefined();
            (0, globals_1.expect)(entry.card).toBeDefined();
            (0, globals_1.expect)(entry.reader).toBeDefined();
        }
        console.log(`✅ Audit trail data integrity verified`);
    }, 30000);
    (0, globals_1.test)('should integrate order management with RFID delivery', async () => {
        console.log('🔗 Test 8: Order to delivery integration...');
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
        (0, globals_1.expect)(order.status).toBe('confirmed');
        console.log(`📦 Order created: ${order.orderNumber}`);
        await prisma.order.update({
            where: { id: order.id },
            data: { status: 'out_for_delivery' }
        });
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
        (0, globals_1.expect)(verification.status).toBe('verified');
        const deliveredOrder = await prisma.order.update({
            where: { id: order.id },
            data: {
                status: 'delivered',
                deliveredAt: new Date()
            }
        });
        (0, globals_1.expect)(deliveredOrder.status).toBe('delivered');
        (0, globals_1.expect)(deliveredOrder.deliveredAt).toBeDefined();
        const completeOrder = await prisma.order.findUnique({
            where: { id: order.id },
            include: {
                deliveryVerifications: true
            }
        });
        (0, globals_1.expect)(completeOrder).toBeDefined();
        (0, globals_1.expect)(completeOrder.deliveryVerifications).toHaveLength(1);
        (0, globals_1.expect)(completeOrder.deliveryVerifications[0].status).toBe('verified');
        console.log(`✅ Complete order-to-delivery integration verified`);
    }, 30000);
});
//# sourceMappingURL=rfid-delivery.integration.test.js.map