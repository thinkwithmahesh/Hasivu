"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseService = exports.mockUserUpdate = exports.mockUserFindUnique = exports.mockNotificationCount = exports.mockNotificationUpdate = exports.mockNotificationFindMany = exports.mockNotificationFindFirst = exports.mockNotificationCreate = void 0;
exports.mockNotificationCreate = jest.fn();
exports.mockNotificationFindFirst = jest.fn();
exports.mockNotificationFindMany = jest.fn();
exports.mockNotificationUpdate = jest.fn();
exports.mockNotificationCount = jest.fn();
exports.mockUserFindUnique = jest.fn();
exports.mockUserUpdate = jest.fn();
const mockClient = {
    notification: {
        create: exports.mockNotificationCreate,
        findFirst: exports.mockNotificationFindFirst,
        findMany: exports.mockNotificationFindMany,
        update: exports.mockNotificationUpdate,
        count: exports.mockNotificationCount
    },
    user: {
        findUnique: exports.mockUserFindUnique,
        update: exports.mockUserUpdate
    }
};
exports.DatabaseService = {
    client: mockClient,
    getInstance: () => ({ client: mockClient })
};
Object.defineProperty(exports.DatabaseService, 'client', {
    get: () => mockClient,
    enumerable: true,
    configurable: true
});
//# sourceMappingURL=database.service.js.map