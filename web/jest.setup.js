/**
 * Jest Setup for HASIVU Web Application
 * Test environment configuration and global test utilities
 */

import '@testing-library/jest-dom';
import 'jest-axe/extend-expect';

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: {},
      asPath: '/',
      push: jest.fn(),
      pop: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn().mockResolvedValue(undefined),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
    };
  },
}));

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    };
  },
  usePathname() {
    return '/';
  },
  useSearchParams() {
    return new URLSearchParams();
  },
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
});

// Mock performance API
Object.defineProperty(window, 'performance', {
  value: {
    now: jest.fn(() => Date.now()),
    mark: jest.fn(),
    measure: jest.fn(),
    getEntriesByType: jest.fn(() => []),
    getEntriesByName: jest.fn(() => []),
  },
});

// Mock console methods for cleaner test output
const originalError = console.error;
const originalWarn = console.warn;

console.error = (...args) => {
  // Suppress specific React warnings in tests
  if (
    typeof args[0] === 'string' &&
    args[0].includes('Warning: ReactDOM.render is no longer supported')
  ) {
    return;
  }
  originalError.call(console, ...args);
};

console.warn = (...args) => {
  // Suppress specific warnings that are expected in test environment
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('Warning: ') || args[0].includes('deprecated'))
  ) {
    return;
  }
  originalWarn.call(console, ...args);
};

// Global test utilities
global.testUtils = {
  // Helper to wait for async operations
  waitForAsync: (ms = 0) => new Promise(resolve => setTimeout(resolve, ms)),

  // Helper to create mock accessibility results
  createMockAxeResults: (violations = [], passes = []) => ({
    violations: violations.map(violation => ({
      id: violation.id || 'test-violation',
      description: violation.description || 'Test violation',
      impact: violation.impact || 'moderate',
      help: violation.help || 'Fix this issue',
      helpUrl: violation.helpUrl || 'https://example.com/help',
      tags: violation.tags || ['wcag2aa'],
      nodes: violation.nodes || [{ target: ['#test'] }],
    })),
    passes: passes.map(pass => ({
      id: pass.id || 'test-pass',
      description: pass.description || 'Test passed',
      help: pass.help || 'This is working correctly',
      tags: pass.tags || ['wcag2aa'],
    })),
    incomplete: [],
    inapplicable: [],
  }),
};

// Set up global accessibility testing configuration
beforeAll(() => {
  // Configure axe-core for testing
  if (typeof window !== 'undefined' && window.axe) {
    window.axe.configure({
      reporter: 'v2',
      rules: [
        // Disable problematic rules for testing
        { id: 'color-contrast', enabled: false }, // Hard to test in JSDOM
        { id: 'landmark-unique', enabled: true },
        { id: 'page-has-heading-one', enabled: true },
      ],
    });
  }
});

// Clean up after each test
afterEach(() => {
  // Clear all mocks
  jest.clearAllMocks();

  // Reset localStorage and sessionStorage
  localStorageMock.clear();
  sessionStorageMock.clear();

  // Clean up DOM
  document.body.innerHTML = '';
  document.head.innerHTML = '';
});
