// Global teardown for HASIVU Platform tests
// Priority 5: Advanced Testing & Quality Assurance

export default async function globalTeardown() {
  console.log('🧹 Cleaning up global test environment...');

  // Clean up test databases
  try {
    const fs = await import('fs/promises');
    await fs.unlink('./test.db').catch(() => {}); // Ignore if doesn't exist
    await fs.unlink('./test.db-journal').catch(() => {}); // SQLite journal file
    await fs.unlink('./test.db-wal').catch(() => {}); // SQLite WAL file
  } catch (error) {
    // Ignore cleanup errors
  }

  // Force garbage collection for memory tests
  if (global.gc) {
    global.gc();
  }

  // Clear any remaining intervals/timeouts
  if ((global as any).clearAllTimers) {
    (global as any).clearAllTimers();
  }

  console.log('✅ Global test environment cleanup complete');
}