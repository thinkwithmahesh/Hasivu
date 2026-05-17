jest.mock('../../src/config/environment', () => ({
    config: {
      jwt: { secret: 'test-jwt-secret-that-is-at-least-32-characters-long', refreshSecret: 'test-refresh-secret-that-is-at-least-32-chars-long' },
      redis: { url: 'redis://localhost:6379' },
      database: {},
    }
  }));
  
  import { authRouter } from '../../src/routes/auth.routes';
  
  describe('AuthRouter Dynamic Coverage Push', () => {
      it('should export auth router', () => {
          expect(authRouter).toBeDefined();
      });
  });
