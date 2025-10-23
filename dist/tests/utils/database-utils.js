"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanupDatabase = exports.createDatabaseTestUtils = void 0;
const database_service_1 = require("../../src/services/database.service");
function createDatabaseTestUtils() {
    return {
        setupTestDatabase: async () => {
            console.log('Setting up test database...');
        },
        teardownTestDatabase: async () => {
            console.log('Tearing down test database...');
        },
        clearTables: async (tables) => {
            console.log(`Clearing tables: ${tables.join(', ')}`);
        },
        seedTestData: async (data) => {
            console.log('Seeding test data...');
        },
        getTestConnection: () => {
            return database_service_1.DatabaseService.getInstance();
        }
    };
}
exports.createDatabaseTestUtils = createDatabaseTestUtils;
async function cleanupDatabase() {
    const utils = createDatabaseTestUtils();
    await utils.teardownTestDatabase();
}
exports.cleanupDatabase = cleanupDatabase;
//# sourceMappingURL=database-utils.js.map