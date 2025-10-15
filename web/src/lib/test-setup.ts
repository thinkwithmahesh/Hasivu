 * Jest Test Setup Configuration
 * Enhanced setup for React Testing Library, ShadCN UI, and accessibility testing;
import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/ react'
import { afterEach, beforeAll, afterAll } from '@jest/globals'
  // Mock Next.js router
jest.mock(_'next/ router', _() => ({}
      query: {},
      asPath: '/',
      push: jest.fn(),
      pop: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn(),
      beforePopState: jest.fn(),
      events: {}
      isFallback: false,
      isReady: true
  // Mock Next.js navigation (App Router)
jest.mock(_'next/ navigation', _() => ({}
  useSearchParams() {}
  usePathname() {}
  // Mock framer-motion
jest.mock(_'framer-motion', _() => ({}
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
  useAnimation: () => ({}
  useMotionValue: () => ({}
  // Mock Intersection Observer
global.IntersectionObserver = jest.fn().mockImplementation(_() => ({}
  // Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(_() => ({}
  // Mock matchMedia for responsive components
Object.defineProperty(window, 'matchMedia', {}
  // Mock HTMLElement methods for touch/g esture testing
Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {}
Object.defineProperty(HTMLElement.prototype, 'scroll', {}
Object.defineProperty(HTMLElement.prototype, 'scrollTo', {}
// Mock touch events for mobile testing
const // TODO: Refactor this function - it may be too long
mockTouchEvent = (type: string, touches: any[] = []
  // Extend global with touch event mock
global.TouchEvent = TouchEvent as any
global.mockTouchEvent = mockTouchEvent
  // Mock Web APIs for PWA testing
Object.defineProperty(navigator, 'serviceWorker', {}
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      update: jest.fn(),
      unregister: jest.fn()
    ready: Promise.resolve({}
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      update: jest.fn(),
      unregister: jest.fn()
    controller: null,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn()
  // Mock Notification API
Object.defineProperty(_global, _'Notification', _{}
  // Mock Clipboard API for userEvent
Object.defineProperty(navigator, _'clipboard', _{}
  // Mock localStorage
const localStorageMock = {}
Object.defineProperty(window, _'localStorage', _{}
  // Mock sessionStorage
const sessionStorageMock = {}
Object.defineProperty(window, _'sessionStorage', _{}
  // Mock URL.createObjectURL for file handling
Object.defineProperty(URL, _'createObjectURL', _{}
Object.defineProperty(URL, _'revokeObjectURL', _{}
  // Mock canvas for chart components
HTMLCanvasElement.prototype.getContext = jest.fn(() => ({}
  getImageData: jest.fn(() => ({ data: new Array(4) })),
  putImageData: jest.fn(),
  createImageData: jest.fn(_() => []),
  setTransform: jest.fn(),
  drawImage: jest.fn(),
  save: jest.fn(),
  fillText: jest.fn(),
  restore: jest.fn(),
  beginPath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  closePath: jest.fn(),
  stroke: jest.fn(),
  translate: jest.fn(),
  scale: jest.fn(),
  rotate: jest.fn(),
  arc: jest.fn(),
  fill: jest.fn(),
  measureText: jest.fn(_() => ({ width: 0 })),
  transform: jest.fn(),
  rect: jest.fn(),
  clip: jest.fn()
})) as any
  // Mock fetch for API testing
global.fetch = jest.fn()
  // Mock WebSocket for real-time features
global.WebSocket = jest.fn().mockImplementation(_() => ({}
})) as any
  // Setup/ Teardown
beforeAll((
afterEach((
afterAll((
  // Suppress console warnings during tests (except errors)
beforeAll((
afterAll((
  // Custom matchers for accessibility testing
expect.extend({}
  // Declare custom matcher type
declare global {}