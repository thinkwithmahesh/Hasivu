/**
 * Re-export DatabaseService and databaseService from services directory
 * This allows tests to use @shared/database.service path for mocking
 * while the actual implementation is in src/services/database.service.ts
 */

export { DatabaseService, databaseService } from '../services/database.service';
