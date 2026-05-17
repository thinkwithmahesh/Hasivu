/**
 * Test App Factory - Creates test instances of the Express application
 */

import express from 'express';
import { createServer } from 'http';

export interface TestApp {
  app: express.Application;
  server: any;
  close: () => Promise<void>;
}

/**
 * Create a test application instance
 */
export function createTestApp(): TestApp {
  const app = express();

  // Basic middleware setup for testing
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', environment: 'test' });
  });

  const server = createServer(app);

  return {
    app,
    server,
    close: () => new Promise((resolve) => {
      server.close(() => resolve());
    })
  };
}

/**
 * Create a test application with database connection
 */
export async function createTestAppWithDatabase(): Promise<TestApp> {
  const testApp = createTestApp();

  // Add database middleware if needed
  // This would typically connect to a test database

  return testApp;
}