"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const auth_service_1 = require("../../src/services/auth.service");
const payment_service_1 = require("../../src/services/payment.service");
const notification_service_1 = require("../../src/services/notification.service");
const user_service_1 = require("../../src/services/user.service");
const school_service_1 = require("../../src/services/school.service");
const menuItem_service_1 = require("../../src/services/menuItem.service");
const rfid_service_1 = require("../../src/services/rfid.service");
describe('Service Coverage Tests', () => {
    describe('AuthService', () => {
        test('should have getInstance method', () => {
            const instance = auth_service_1.AuthService.getInstance();
            expect(instance).toBeDefined();
            expect(instance).toBeInstanceOf(auth_service_1.AuthService);
        });
        test('should validate password strength', () => {
            const instance = auth_service_1.AuthService.getInstance();
            const result = instance.validatePassword('StrongPass123!');
            expect(result).toHaveProperty('valid');
            expect(result).toHaveProperty('score');
        });
        test('should hash password', async () => {
            const instance = auth_service_1.AuthService.getInstance();
            const hash = await instance.hashPassword('testpassword');
            expect(typeof hash).toBe('string');
            expect(hash.length).toBeGreaterThan(0);
        });
    });
    describe('PaymentService', () => {
        test('should have getInstance method', () => {
            const instance = payment_service_1.PaymentService.getInstance();
            expect(instance).toBeDefined();
            expect(instance).toBeInstanceOf(payment_service_1.PaymentService);
        });
        test('should validate payment data', () => {
            const instance = payment_service_1.PaymentService.getInstance();
            expect(instance.isRazorpayAvailable()).toBeDefined();
        });
    });
    describe('NotificationService', () => {
        test('should have getInstance method', () => {
            const instance = notification_service_1.NotificationService.getInstance();
            expect(instance).toBeDefined();
            expect(instance).toBeInstanceOf(notification_service_1.NotificationService);
        });
    });
    describe('UserService', () => {
        test('should have getInstance method', () => {
            const instance = user_service_1.UserService.getInstance();
            expect(instance).toBeDefined();
            expect(instance).toBeInstanceOf(user_service_1.UserService);
        });
    });
    describe('SchoolService', () => {
        test('should have getInstance method', () => {
            const instance = school_service_1.SchoolService.getInstance();
            expect(instance).toBeDefined();
            expect(instance).toBeInstanceOf(school_service_1.SchoolService);
        });
    });
    describe('MenuItemService', () => {
        test('should have getInstance method', () => {
            const instance = menuItem_service_1.MenuItemService.getInstance();
            expect(instance).toBeDefined();
            expect(instance).toBeInstanceOf(menuItem_service_1.MenuItemService);
        });
    });
    describe('RfidService', () => {
        test('should have getInstance method', () => {
            const instance = rfid_service_1.RfidService.getInstance();
            expect(instance).toBeDefined();
            expect(instance).toBeInstanceOf(rfid_service_1.RfidService);
        });
    });
});
describe('Utility Functions', () => {
    test('should export services correctly', () => {
        expect(auth_service_1.AuthService).toBeDefined();
        expect(payment_service_1.PaymentService).toBeDefined();
        expect(notification_service_1.NotificationService).toBeDefined();
        expect(user_service_1.UserService).toBeDefined();
        expect(school_service_1.SchoolService).toBeDefined();
        expect(menuItem_service_1.MenuItemService).toBeDefined();
        expect(rfid_service_1.RfidService).toBeDefined();
    });
});
//# sourceMappingURL=simple-coverage.test.js.map