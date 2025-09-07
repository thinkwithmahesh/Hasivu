import { test as baseTest, Page, BrowserContext } from '@playwright/test';
import { LoginPage } from '../pages/auth/login.page';

/**
 * Authentication Fixtures for HASIVU Platform Testing
 * 
 * Provides reusable authentication states, user contexts, and role-based test fixtures
 * Enables efficient test execution with pre-authenticated users and consistent session management
 */

// User test data definitions
export interface TestUser {
  id: string;
  email: string;
  password: string;
  name: string;
  role: 'student' | 'parent' | 'admin' | 'kitchen' | 'vendor';
  balance?: number;
  permissions?: string[];
  children?: string[];
  additional_data?: Record<string, any>;
}

// Authentication state interface
export interface AuthState {
  user: TestUser;
  token: string;
  session_id: string;
  expires_at: string;
}

// Test users for different roles
export const TEST_USERS: Record<string, TestUser> = {
  student: {
    id: 'STU-001',
    email: 'student@hasivu.test',
    password: 'password123',
    name: 'Test Student',
    role: 'student',
    balance: 150.00,
    permissions: ['view_menu', 'place_orders', 'view_balance', 'track_orders'],
    additional_data: {
      class: '5-A',
      roll_number: '001',
      rfid_card: 'RFID-STU-001',
      dietary_preferences: ['vegetarian'],
      allergies: ['nuts']
    }
  },
  
  parent: {
    id: 'PAR-001',
    email: 'parent@hasivu.test',
    password: 'password123',
    name: 'Test Parent',
    role: 'parent',
    balance: 500.00,
    permissions: ['manage_children', 'view_reports', 'make_payments', 'top_up_balance'],
    children: ['STU-001', 'STU-002'],
    additional_data: {
      phone: '+91-9876543210',
      emergency_contact: '+91-9876543211',
      address: '123 Test Street, Bangalore 560001'
    }
  },
  
  admin: {
    id: 'ADM-001',
    email: 'admin@hasivu.test',
    password: 'admin123',
    name: 'Test Admin',
    role: 'admin',
    permissions: [
      'manage_users', 'view_analytics', 'system_config', 
      'financial_reports', 'menu_management', 'order_management'
    ],
    additional_data: {
      admin_level: 'super_admin',
      department: 'operations'
    }
  },
  
  kitchen: {
    id: 'KIT-001',
    email: 'kitchen@hasivu.test',
    password: 'kitchen123',
    name: 'Kitchen Staff',
    role: 'kitchen',
    permissions: [
      'view_orders', 'accept_orders', 'update_status', 
      'manage_menu_availability', 'view_kitchen_analytics'
    ],
    additional_data: {
      station: 'main_kitchen',
      shift: 'morning',
      specialization: ['south_indian', 'north_indian']
    }
  },
  
  vendor: {
    id: 'VEN-001',
    email: 'vendor@hasivu.test',
    password: 'vendor123',
    name: 'Test Vendor',
    role: 'vendor',
    permissions: [
      'manage_inventory', 'view_orders', 'update_delivery_status',
      'view_vendor_analytics', 'manage_products'
    ],
    additional_data: {
      vendor_type: 'food_supplier',
      products: ['vegetables', 'dairy', 'grains'],
      delivery_areas: ['bangalore_north', 'bangalore_central']
    }
  }
};

// Authentication fixture type extensions
type AuthFixtures = {
  authenticatedPage: Page;
  studentPage: Page;
  parentPage: Page;
  adminPage: Page;
  kitchenPage: Page;
  vendorPage: Page;
  loginPage: LoginPage;
  authState: AuthState;
  multiRoleContext: {
    student: Page;
    parent: Page;
    admin: Page;
  };
};

/**
 * Authentication Helper Class
 */
class AuthHelper {
  constructor(private page: Page) {}

  /**
   * Mock authentication APIs for consistent testing
   */
  async mockAuthenticationAPIs(): Promise<void> {
    // Mock login API
    await this.page.route('**/auth/login', async route => {
      const request = route.request();
      const postData = JSON.parse(request.postData() || '{}');
      
      // Find matching user
      const user = Object.values(TEST_USERS).find(u => u.email === postData.email);
      
      if (user && postData.password === user.password) {
        const authState: AuthState = {
          user,
          token: `jwt_token_${user.id}`,
          session_id: `session_${user.id}_${Date.now()}`,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        };

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          headers: {
            'Set-Cookie': `hasivu_session=${authState.session_id}; Path=/; HttpOnly; Secure`
          },
          body: JSON.stringify({
            success: true,
            ...authState,
            message: 'Login successful'
          })
        });
      } else {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password'
          })
        });
      }
    });

    // Mock session validation API
    await this.page.route('**/auth/validate-session', async route => {
      const authHeader = route.request().headers()['authorization'];
      
      if (authHeader && authHeader.startsWith('Bearer jwt_token_')) {
        const userId = authHeader.replace('Bearer jwt_token_', '');
        const user = Object.values(TEST_USERS).find(u => u.id === userId);
        
        if (user) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              valid: true,
              user,
              session_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
            })
          });
        } else {
          await route.fulfill({
            status: 401,
            contentType: 'application/json',
            body: JSON.stringify({
              success: false,
              valid: false,
              error: 'INVALID_SESSION'
            })
          });
        }
      } else {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            valid: false,
            error: 'NO_AUTH_HEADER'
          })
        });
      }
    });

    // Mock logout API
    await this.page.route('**/auth/logout', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Logged out successfully'
        })
      });
    });

    // Mock user profile API
    await this.page.route('**/api/user/profile', async route => {
      const authHeader = route.request().headers()['authorization'];
      
      if (authHeader && authHeader.startsWith('Bearer jwt_token_')) {
        const userId = authHeader.replace('Bearer jwt_token_', '');
        const user = Object.values(TEST_USERS).find(u => u.id === userId);
        
        if (user) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              profile: {
                ...user,
                last_login: new Date().toISOString(),
                profile_complete: true
              }
            })
          });
        }
      }
    });

    // Mock permissions check API
    await this.page.route('**/api/auth/permissions', async route => {
      const authHeader = route.request().headers()['authorization'];
      
      if (authHeader && authHeader.startsWith('Bearer jwt_token_')) {
        const userId = authHeader.replace('Bearer jwt_token_', '');
        const user = Object.values(TEST_USERS).find(u => u.id === userId);
        
        if (user) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              permissions: user.permissions || [],
              role: user.role
            })
          });
        }
      }
    });
  }

  /**
   * Perform login for specific user role
   */
  async loginAs(role: keyof typeof TEST_USERS): Promise<AuthState> {
    const user = TEST_USERS[role];
    if (!user) {
      throw new Error(`User role ${role} not found in TEST_USERS`);
    }

    const loginPage = new LoginPage(this.page);
    await loginPage.navigate();
    await loginPage.selectRole(user.role);
    await loginPage.fillCredentials(user.email, user.password);
    await loginPage.submitLogin();

    // Wait for successful login redirect
    await this.page.waitForURL(/\/dashboard|\/admin|\/kitchen/, { timeout: 10000 });

    const authState: AuthState = {
      user,
      token: `jwt_token_${user.id}`,
      session_id: `session_${user.id}_${Date.now()}`,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };

    return authState;
  }

  /**
   * Set up authenticated session without UI login
   */
  async setupAuthenticatedSession(role: keyof typeof TEST_USERS): Promise<AuthState> {
    const user = TEST_USERS[role];
    const authState: AuthState = {
      user,
      token: `jwt_token_${user.id}`,
      session_id: `session_${user.id}_${Date.now()}`,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };

    // Set authentication data in local storage
    await this.page.evaluate((state) => {
      localStorage.setItem('auth_token', state.token);
      localStorage.setItem('user_data', JSON.stringify(state.user));
      localStorage.setItem('session_id', state.session_id);
      localStorage.setItem('session_expires', state.expires_at);
    }, authState);

    // Set session cookie
    await this.page.context().addCookies([{
      name: 'hasivu_session',
      value: authState.session_id,
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      secure: false
    }]);

    return authState;
  }

  /**
   * Verify authentication state
   */
  async verifyAuthenticationState(expectedUser: TestUser): Promise<boolean> {
    try {
      const authData = await this.page.evaluate(() => {
        return {
          token: localStorage.getItem('auth_token'),
          userData: JSON.parse(localStorage.getItem('user_data') || '{}'),
          sessionId: localStorage.getItem('session_id')
        };
      });

      return (
        authData.token?.includes(expectedUser.id) &&
        authData.userData.email === expectedUser.email &&
        authData.userData.role === expectedUser.role &&
        authData.sessionId !== null
      );
    } catch (error) {
      console.error('Error verifying authentication state:', error);
      return false;
    }
  }

  /**
   * Clear authentication state
   */
  async clearAuthenticationState(): Promise<void> {
    await this.page.evaluate(() => {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      localStorage.removeItem('session_id');
      localStorage.removeItem('session_expires');
      sessionStorage.clear();
    });

    // Clear cookies
    await this.page.context().clearCookies();
  }

  /**
   * Switch user role (logout and login as different user)
   */
  async switchUserRole(newRole: keyof typeof TEST_USERS): Promise<AuthState> {
    await this.clearAuthenticationState();
    await this.page.goto('/auth/logout');
    return await this.loginAs(newRole);
  }
}

/**
 * Extended Playwright Test with Authentication Fixtures
 */
export const test = baseTest.extend<AuthFixtures>({
  // Basic login page fixture
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await use(loginPage);
  },

  // Generic authenticated page (defaults to student)
  authenticatedPage: async ({ page }, use) => {
    const authHelper = new AuthHelper(page);
    await authHelper.mockAuthenticationAPIs();
    await authHelper.setupAuthenticatedSession('student');
    
    // Navigate to dashboard to activate session
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
    
    await use(page);
  },

  // Student-specific authenticated page
  studentPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const authHelper = new AuthHelper(page);
    
    await authHelper.mockAuthenticationAPIs();
    await authHelper.setupAuthenticatedSession('student');
    
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
    
    await use(page);
    await context.close();
  },

  // Parent-specific authenticated page
  parentPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const authHelper = new AuthHelper(page);
    
    await authHelper.mockAuthenticationAPIs();
    await authHelper.setupAuthenticatedSession('parent');
    
    await page.goto('/parent/dashboard');
    await page.waitForLoadState('domcontentloaded');
    
    await use(page);
    await context.close();
  },

  // Admin-specific authenticated page
  adminPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const authHelper = new AuthHelper(page);
    
    await authHelper.mockAuthenticationAPIs();
    await authHelper.setupAuthenticatedSession('admin');
    
    await page.goto('/admin/dashboard');
    await page.waitForLoadState('domcontentloaded');
    
    await use(page);
    await context.close();
  },

  // Kitchen-specific authenticated page
  kitchenPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const authHelper = new AuthHelper(page);
    
    await authHelper.mockAuthenticationAPIs();
    await authHelper.setupAuthenticatedSession('kitchen');
    
    await page.goto('/kitchen/dashboard');
    await page.waitForLoadState('domcontentloaded');
    
    await use(page);
    await context.close();
  },

  // Vendor-specific authenticated page
  vendorPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const authHelper = new AuthHelper(helper);
    
    await authHelper.mockAuthenticationAPIs();
    await authHelper.setupAuthenticatedSession('vendor');
    
    await page.goto('/vendor/dashboard');
    await page.waitForLoadState('domcontentloaded');
    
    await use(page);
    await context.close();
  },

  // Authentication state fixture
  authState: async ({ authenticatedPage }, use) => {
    const authHelper = new AuthHelper(authenticatedPage);
    const state = await authHelper.setupAuthenticatedSession('student');
    await use(state);
  },

  // Multi-role context for concurrent testing
  multiRoleContext: async ({ browser }, use) => {
    const studentContext = await browser.newContext();
    const parentContext = await browser.newContext();
    const adminContext = await browser.newContext();

    const studentPage = await studentContext.newPage();
    const parentPage = await parentContext.newPage();
    const adminPage = await adminContext.newPage();

    // Setup authentication for each role
    const studentAuthHelper = new AuthHelper(studentPage);
    const parentAuthHelper = new AuthHelper(parentPage);
    const adminAuthHelper = new AuthHelper(adminPage);

    await Promise.all([
      studentAuthHelper.mockAuthenticationAPIs(),
      parentAuthHelper.mockAuthenticationAPIs(),
      adminAuthHelper.mockAuthenticationAPIs()
    ]);

    await Promise.all([
      studentAuthHelper.setupAuthenticatedSession('student'),
      parentAuthHelper.setupAuthenticatedSession('parent'),
      adminAuthHelper.setupAuthenticatedSession('admin')
    ]);

    await Promise.all([
      studentPage.goto('/dashboard'),
      parentPage.goto('/parent/dashboard'),
      adminPage.goto('/admin/dashboard')
    ]);

    await use({
      student: studentPage,
      parent: parentPage,
      admin: adminPage
    });

    await Promise.all([
      studentContext.close(),
      parentContext.close(),
      adminContext.close()
    ]);
  }
});

/**
 * Authentication Test Helpers
 */
export class AuthTestHelpers {
  /**
   * Create a test user with custom properties
   */
  static createTestUser(overrides: Partial<TestUser>): TestUser {
    const baseUser = TEST_USERS.student;
    return {
      ...baseUser,
      ...overrides,
      id: overrides.id || `TEST-${Date.now()}`,
      additional_data: {
        ...baseUser.additional_data,
        ...overrides.additional_data
      }
    };
  }

  /**
   * Generate JWT token for testing
   */
  static generateTestToken(userId: string): string {
    return `jwt_token_${userId}_${Date.now()}`;
  }

  /**
   * Create authentication state for testing
   */
  static createAuthState(user: TestUser): AuthState {
    return {
      user,
      token: this.generateTestToken(user.id),
      session_id: `session_${user.id}_${Date.now()}`,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };
  }

  /**
   * Validate user permissions
   */
  static hasPermission(user: TestUser, permission: string): boolean {
    return user.permissions?.includes(permission) || false;
  }

  /**
   * Check if user can access resource
   */
  static canAccessResource(user: TestUser, resource: string): boolean {
    const rolePermissions: Record<string, string[]> = {
      student: ['view_menu', 'place_orders', 'view_balance', 'track_orders'],
      parent: ['manage_children', 'view_reports', 'make_payments', 'top_up_balance'],
      admin: ['*'], // Admin has all permissions
      kitchen: ['view_orders', 'accept_orders', 'update_status', 'manage_menu_availability'],
      vendor: ['manage_inventory', 'view_orders', 'update_delivery_status', 'manage_products']
    };

    const userPermissions = rolePermissions[user.role] || [];
    return userPermissions.includes('*') || userPermissions.includes(resource);
  }
}

export { AuthHelper, TEST_USERS };
export type { TestUser, AuthState };