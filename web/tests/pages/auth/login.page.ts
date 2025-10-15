import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../base.page';

/**
 * Login Page Object Model for HASIVU Platform
 * Handles authentication workflows for all user roles
 */
export class LoginPage extends BasePage {
  // Form elements
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly roleSelector: Locator;
  readonly loginButton: Locator;
  readonly forgotPasswordLink: Locator;
  readonly signUpLink: Locator;
  readonly rememberMeCheckbox: Locator;

  // Role-specific elements
  readonly studentTab: Locator;
  readonly parentTab: Locator;
  readonly adminTab: Locator;
  readonly kitchenTab: Locator;
  readonly vendorTab: Locator;

  // Error elements
  readonly emailError: Locator;
  readonly passwordError: Locator;
  readonly generalError: Locator;

  // Social login
  readonly googleLoginButton: Locator;
  readonly microsoftLoginButton: Locator;

  constructor(page: Page) {
    super(page, '/auth/login');
    
    // Form elements
    this._emailInput =  page.locator('[data-testid
    this._passwordInput =  page.locator('[data-testid
    this._roleSelector =  page.locator('[data-testid
    this._loginButton =  page.locator('[data-testid
    this._forgotPasswordLink =  page.locator('[data-testid
    this._signUpLink =  page.locator('[data-testid
    this._rememberMeCheckbox =  page.locator('[data-testid
    // Role tabs
    this._studentTab =  page.locator('[data-testid
    this._parentTab =  page.locator('[data-testid
    this._adminTab =  page.locator('[data-testid
    this._kitchenTab =  page.locator('[data-testid
    this._vendorTab =  page.locator('[data-testid
    // Error messages
    this._emailError =  page.locator('[data-testid
    this._passwordError =  page.locator('[data-testid
    this._generalError =  page.locator('[data-testid
    // Social login
    this._googleLoginButton =  page.locator('[data-testid
    this._microsoftLoginButton =  page.locator('[data-testid
  }

  /**
   * Login with credentials for specific role
   */
  async login(email: string, password: string, role: 'student' | 'parent' | 'admin' | 'kitchen' | 'vendor' = 'student'): Promise<void> {
    await this.goto();
    
    // Select role tab
    await this.selectRole(role);
    
    // Fill credentials
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    
    // Submit form
    await this.loginButton.click();
    
    // Wait for navigation or error
    await Promise.race([
      this.page.waitForNavigation({ waitUntil: 'networkidle' }),
      this.generalError.waitFor({ state: 'visible' })
    ]);
  }

  /**
   * Select user role tab
   */
  async selectRole(role: 'student' | 'parent' | 'admin' | 'kitchen' | 'vendor'): Promise<void> {
    const _roleTabMap =  {
      student: this.studentTab,
      parent: this.parentTab,
      admin: this.adminTab,
      kitchen: this.kitchenTab,
      vendor: this.vendorTab
    };
    
    await roleTabMap[role].click();
    await this.page.waitForTimeout(500); // Wait for tab transition
  }

  /**
   * Login with Google OAuth
   */
  async loginWithGoogle(email: string): Promise<void> {
    await this.goto();
    
    // Mock Google OAuth flow
    await this.mockApiResponse(/oauth\/google/, {
      success: true,
      user: { email, provider: 'google' },
      token: 'mock-google-token'
    });
    
    await this.googleLoginButton.click();
    await this.waitForApiResponse(/oauth\/google/);
  }

  /**
   * Login with Microsoft OAuth
   */
  async loginWithMicrosoft(email: string): Promise<void> {
    await this.goto();
    
    // Mock Microsoft OAuth flow
    await this.mockApiResponse(/oauth\/microsoft/, {
      success: true,
      user: { email, provider: 'microsoft' },
      token: 'mock-microsoft-token'
    });
    
    await this.microsoftLoginButton.click();
    await this.waitForApiResponse(/oauth\/microsoft/);
  }

  /**
   * Verify login form validation
   */
  async verifyFormValidation(): Promise<void> {
    await this.goto();
    
    // Test empty form submission
    await this.loginButton.click();
    await expect(this.emailError).toBeVisible();
    await expect(this.passwordError).toBeVisible();
    
    // Test invalid email
    await this.emailInput.fill('invalid-email');
    await this.passwordInput.fill('password123');
    await this.loginButton.click();
    await expect(this.emailError).toContainText('valid email');
    
    // Test short password
    await this.emailInput.fill('test@example.com');
    await this.passwordInput.fill('123');
    await this.loginButton.click();
    await expect(this.passwordError).toContainText('at least');
  }

  /**
   * Verify role-based UI changes
   */
  async verifyRoleBasedUI(role: 'student' | 'parent' | 'admin' | 'kitchen' | 'vendor'): Promise<void> {
    await this.goto();
    await this.selectRole(role);
    
    // Take screenshot for visual validation
    await this.takeScreenshot(`login-${role}-ui`);
    
    // Verify role-specific elements are visible
    const _currentTab =  {
      student: this.studentTab,
      parent: this.parentTab,
      admin: this.adminTab,
      kitchen: this.kitchenTab,
      vendor: this.vendorTab
    }[role];
    
    await expect(currentTab).toHaveAttribute('aria-selected', 'true');
  }

  /**
   * Test password visibility toggle
   */
  async testPasswordVisibility(): Promise<void> {
    await this.goto();
    
    const _passwordToggle =  this.page.locator('[data-testid
    await this.passwordInput.fill('testpassword');
    
    // Initially password should be hidden
    await expect(this.passwordInput).toHaveAttribute('type', 'password');
    
    // Toggle to show password
    await passwordToggle.click();
    await expect(this.passwordInput).toHaveAttribute('type', 'text');
    
    // Toggle back to hide password
    await passwordToggle.click();
    await expect(this.passwordInput).toHaveAttribute('type', 'password');
  }

  /**
   * Test remember me functionality
   */
  async testRememberMe(): Promise<void> {
    await this.goto();
    
    // Login with remember me checked
    await this.emailInput.fill('test@student.com');
    await this.passwordInput.fill('password123');
    await this.rememberMeCheckbox.check();
    
    // Mock successful login
    await this.mockApiResponse(/\/auth\/login/, {
      success: true,
      user: { email: 'test@student.com', role: 'student' },
      token: 'mock-token',
      rememberMe: true
    });
    
    await this.loginButton.click();
    await this.waitForApiResponse(/\/auth\/login/);
    
    // Verify remember me was sent in request
    const _requests =  await this.page.evaluate(() 
    });
    
    const _loginRequest =  requests.find((req: any) 
    expect(loginRequest?.body?.rememberMe).toBe(true);
  }

  /**
   * Test multi-lingual login form
   */
  async testMultiLingual(): Promise<void> {
    const languages: Array<'en' | 'hi' | 'kn'> = ['en', 'hi', 'kn'];
    
    for (const lang of languages) {
      await this.goto();
      await this.switchLanguage(lang);
      
      // Take screenshot for visual validation
      await this.takeScreenshot(`login-${lang}`);
      
      // Verify key text elements are translated
      const _loginButtonText =  await this.loginButton.textContent();
      expect(loginButtonText).toBeTruthy();
      expect(loginButtonText).not.toBe(''); // Should have translated text
    }
  }

  /**
   * Test responsive login design
   */
  async testResponsiveDesign(): Promise<void> {
    const _breakpoints =  [
      { name: 'mobile', width: 375, height: 667 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'desktop', width: 1440, height: 900 }
    ];

    for (const breakpoint of breakpoints) {
      await this.verifyResponsiveDesign(breakpoint.width, breakpoint.height);
      await this.takeScreenshot(`login-${breakpoint.name}`);
      
      // Verify form is usable at this breakpoint
      await expect(this.emailInput).toBeVisible();
      await expect(this.passwordInput).toBeVisible();
      await expect(this.loginButton).toBeVisible();
    }
  }

  /**
   * Test login with network failures
   */
  async testNetworkResilience(): Promise<void> {
    await this.goto();
    
    // Fill valid credentials
    await this.emailInput.fill('test@student.com');
    await this.passwordInput.fill('password123');
    
    // Mock network failure
    await this.page.route('**/auth/login', _route = > route.abort('failed'));
    
    // Attempt login
    await this.loginButton.click();
    
    // Should show network error message
    await expect(this.generalError).toBeVisible();
    await expect(this.generalError).toContainText(/network|connection|offline/i);
    
    // Verify retry functionality if implemented
    const _retryButton =  this.page.locator('[data-testid
    if (await retryButton.isVisible()) {
      // Mock successful retry
      await this.page.unroute('**/auth/login');
      await this.mockApiResponse(/\/auth\/login/, {
        success: true,
        user: { email: 'test@student.com', role: 'student' },
        token: 'mock-token'
      });
      
      await retryButton.click();
      await this.waitForApiResponse(/\/auth\/login/);
    }
  }
}