 * Test Polyfills for Mobile and PWA Testing
 * Provides browser APIs and polyfills needed for comprehensive testing
import { TextEncoder, TextDecoder } from 'util'
if (typeof global.TextEncoder === 'undefined') {}
if (typeof global.TextDecoder === 'undefined') {}
// Mock crypto.randomUUID for Node.js environments
if (typeof global.crypto === 'undefined') {}
} as any
  // Mock performance API
if (typeof global.performance === 'undefined') {}
} as any
  // Mock requestAnimationFrame
if (typeof global.requestAnimationFrame === 'undefined') {}
if (typeof global.cancelAnimationFrame === 'undefined') {}
  // Mock requestIdleCallback for performance testing
if (typeof global.requestIdleCallback === 'undefined') {}
    }), 1)
if (typeof global.cancelIdleCallback === 'undefined') {}
  // Mock vibration API for mobile testing
if (typeof navigator !== 'undefined' && !navigator.vibrate) {}
  // Mock geolocation API
if (typeof navigator !== 'undefined' && !navigator.geolocation) {}
  // Mock share API for PWA testing
if (typeof navigator !== 'undefined' && !navigator.share) {}
  // Mock network information API
if (typeof navigator !== 'undefined' && !navigator.connection) {}
  // Mock clipboard API
if (typeof navigator !== 'undefined' && !navigator.clipboard) {}
  // Mock media devices for camera/mi crophone testing
if (typeof navigator !== 'undefined' && !navigator.mediaDevices) {}
      enumerateDevices: jest.fn().mockResolvedValue([]),
      getSupportedConstraints: jest.fn().mockReturnValue({})
// Mock user agent for mobile detection
Object.defineProperty(navigator, 'userAgent', {}
// Mock touch support
Object.defineProperty(navigator, 'maxTouchPoints', {}
  // Mock device memory for performance testing
if (typeof navigator !== 'undefined' && !navigator.deviceMemory) {}
  // Mock hardware concurrency
if (typeof navigator !== 'undefined' && navigator.hardwareConcurrency === undefined) {}
  // Mock screen API for mobile testing
if (typeof screen !== 'undefined') {}
  // Mock window.screen properties for responsive testing
if (typeof window !== 'undefined' && typeof window.screen !== 'undefined') {}
  Object.defineProperty(window.screen, 'height', {}
  // Mock CSS custom properties support
if (typeof CSS !== 'undefined' && !CSS.supports) {}
  // Mock CSS.escape
if (typeof CSS !== 'undefined' && !CSS.escape) {}
    value: (cssid: string) => cssid.replace(/ [!"#$%&'()*+,.\/:;<=>?@[\\\]^``