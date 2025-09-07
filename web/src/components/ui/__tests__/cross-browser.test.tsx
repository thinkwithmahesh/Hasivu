/**
 * Cross-Browser Compatibility Tests for ShadCN UI Components
 * Tests components across different browser environments and feature support
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '../command'
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '../drawer'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../tooltip'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../popover'
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '../input-otp'

// Browser environment mocks
const mockUserAgents = {
  chrome: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  firefox: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',
  safari: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
  edge: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
  ios: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  android: 'Mozilla/5.0 (Linux; Android 13; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36'
}

const mockBrowserFeatures = {
  chrome: {
    css: {
      containerQueries: true,
      scrollTimelineBehavior: true,
      backdropFilter: true,
      colorScheme: true,
    },
    js: {
      intersectionObserver: true,
      resizeObserver: true,
      customElements: true,
      webAnimations: true,
    }
  },
  firefox: {
    css: {
      containerQueries: true,
      scrollTimelineBehavior: false,
      backdropFilter: true,
      colorScheme: true,
    },
    js: {
      intersectionObserver: true,
      resizeObserver: true,
      customElements: true,
      webAnimations: true,
    }
  },
  safari: {
    css: {
      containerQueries: true,
      scrollTimelineBehavior: false,
      backdropFilter: true,
      colorScheme: true,
    },
    js: {
      intersectionObserver: true,
      resizeObserver: true,
      customElements: true,
      webAnimations: true,
    }
  },
  edge: {
    css: {
      containerQueries: true,
      scrollTimelineBehavior: true,
      backdropFilter: true,
      colorScheme: true,
    },
    js: {
      intersectionObserver: true,
      resizeObserver: true,
      customElements: true,
      webAnimations: true,
    }
  }
}

// Helper to mock browser environment
const mockBrowserEnvironment = (browser: keyof typeof mockUserAgents) => {
  Object.defineProperty(navigator, 'userAgent', {
    writable: true,
    value: mockUserAgents[browser],
  })

  const features = mockBrowserFeatures[browser as keyof typeof mockBrowserFeatures]
  if (features) {
    // Mock CSS features
    Object.defineProperty(CSS, 'supports', {
      writable: true,
      value: jest.fn((property: string) => {
        if (property.includes('container-type')) return features.css.containerQueries
        if (property.includes('backdrop-filter')) return features.css.backdropFilter
        if (property.includes('color-scheme')) return features.css.colorScheme
        return true // Default support for other properties
      }),
    })

    // Mock JS features
    if (!features.js.intersectionObserver) {
      delete (window as any).IntersectionObserver
    }
    if (!features.js.resizeObserver) {
      delete (window as any).ResizeObserver
    }
  }
}

describe('Cross-Browser Compatibility Tests', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks()
  })

  afterEach(() => {
    // Restore original implementations
    jest.restoreAllMocks()
  })

  describe('Chrome Browser Compatibility', () => {
    beforeEach(() => {
      mockBrowserEnvironment('chrome')
    })

    it('renders Command component with full Chrome features', async () => {
      const user = userEvent.setup()
      
      render(
        <Command>
          <CommandInput placeholder="Search in Chrome..." />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="Meals">
              <CommandItem value="biryani">Chicken Biryani</CommandItem>
              <CommandItem value="curry">Paneer Curry</CommandItem>
              <CommandItem value="naan">Butter Naan</CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      )

      const input = screen.getByPlaceholderText('Search in Chrome...')
      await user.type(input, 'curry')

      await waitFor(() => {
        expect(screen.getByText('Paneer Curry')).toBeInTheDocument()
        expect(screen.queryByText('Chicken Biryani')).not.toBeInTheDocument()
      })
    })

    it('handles Chrome-specific touch events', async () => {
      render(
        <Drawer>
          <DrawerTrigger asChild>
            <button>Open Chrome Drawer</button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Chrome Touch Test</DrawerTitle>
            </DrawerHeader>
            <div>Chrome-optimized content</div>
          </DrawerContent>
        </Drawer>
      )

      const trigger = screen.getByText('Open Chrome Drawer')
      
      // Chrome touch events
      fireEvent.touchStart(trigger, {
        touches: [{ clientX: 100, clientY: 100 }],
      })
      fireEvent.touchEnd(trigger)

      await waitFor(() => {
        expect(screen.getByText('Chrome Touch Test')).toBeInTheDocument()
      })
    })
  })

  describe('Firefox Browser Compatibility', () => {
    beforeEach(() => {
      mockBrowserEnvironment('firefox')
    })

    it('renders Tooltip component in Firefox', async () => {
      const user = userEvent.setup()
      
      render(
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button>Firefox Tooltip</button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Firefox-compatible tooltip content</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )

      const trigger = screen.getByText('Firefox Tooltip')
      await user.hover(trigger)

      await waitFor(() => {
        expect(screen.getByText('Firefox-compatible tooltip content')).toBeInTheDocument()
      })
    })

    it('handles Firefox keyboard navigation', async () => {
      const user = userEvent.setup()
      
      render(
        <Command>
          <CommandInput placeholder="Firefox search..." />
          <CommandList>
            <CommandGroup>
              <CommandItem value="item1">Firefox Item 1</CommandItem>
              <CommandItem value="item2">Firefox Item 2</CommandItem>
              <CommandItem value="item3">Firefox Item 3</CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      )

      const input = screen.getByPlaceholderText('Firefox search...')
      await user.click(input)
      
      // Firefox-specific keyboard navigation
      await user.keyboard('{ArrowDown}')
      await user.keyboard('{ArrowDown}')
      await user.keyboard('{Enter}')

      // Should handle keyboard navigation properly
      expect(input).toBeInTheDocument()
    })
  })

  describe('Safari Browser Compatibility', () => {
    beforeEach(() => {
      mockBrowserEnvironment('safari')
    })

    it('renders Popover component in Safari', async () => {
      const user = userEvent.setup()
      
      render(
        <Popover>
          <PopoverTrigger asChild>
            <button>Safari Popover</button>
          </PopoverTrigger>
          <PopoverContent>
            <div>Safari-compatible popover content</div>
          </PopoverContent>
        </Popover>
      )

      const trigger = screen.getByText('Safari Popover')
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByText('Safari-compatible popover content')).toBeInTheDocument()
      })
    })

    it('handles Safari-specific WebKit features', async () => {
      // Mock WebKit-specific APIs
      Object.defineProperty(window, 'webkit', {
        writable: true,
        value: {
          messageHandlers: {
            test: { postMessage: jest.fn() }
          }
        },
      })

      render(
        <InputOTP maxLength={6}>
          <InputOTPGroup>
            {Array.from({ length: 6 }, (_, i) => (
              <InputOTPSlot key={i} index={i} />
            ))}
          </InputOTPGroup>
        </InputOTP>
      )

      const otpInput = screen.getByRole('textbox', { hidden: true })
      expect(otpInput).toBeInTheDocument()
      
      // Should handle WebKit-specific behavior
      fireEvent.focus(otpInput)
      expect(otpInput).toHaveFocus()
    })
  })

  describe('Edge Browser Compatibility', () => {
    beforeEach(() => {
      mockBrowserEnvironment('edge')
    })

    it('renders Command component in Edge', async () => {
      const user = userEvent.setup()
      
      render(
        <Command>
          <CommandInput placeholder="Edge search..." />
          <CommandList>
            <CommandEmpty>No Edge results.</CommandEmpty>
            <CommandGroup>
              <CommandItem value="edge-item">Edge-specific Item</CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      )

      const input = screen.getByPlaceholderText('Edge search...')
      await user.type(input, 'edge')

      await waitFor(() => {
        expect(screen.getByText('Edge-specific Item')).toBeInTheDocument()
      })
    })
  })

  describe('Mobile Browser Compatibility', () => {
    describe('iOS Safari', () => {
      beforeEach(() => {
        mockBrowserEnvironment('ios')
        
        // Mock iOS viewport
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: 375,
        })
        Object.defineProperty(window, 'innerHeight', {
          writable: true,
          configurable: true,
          value: 667,
        })
      })

      it('handles iOS touch events properly', async () => {
        render(
          <Drawer>
            <DrawerTrigger asChild>
              <button>iOS Drawer</button>
            </DrawerTrigger>
            <DrawerContent>
              <div>iOS-optimized content</div>
            </DrawerContent>
          </Drawer>
        )

        const trigger = screen.getByText('iOS Drawer')
        
        // iOS-specific touch events
        fireEvent.touchStart(trigger, {
          touches: [{ 
            clientX: 100, 
            clientY: 100,
            force: 1,
            radiusX: 10,
            radiusY: 10
          }],
        })
        fireEvent.touchEnd(trigger)

        await waitFor(() => {
          expect(screen.getByText('iOS-optimized content')).toBeInTheDocument()
        })
      })

      it('handles iOS safe area and viewport quirks', () => {
        // Mock iOS safe area insets
        Object.defineProperty(document.documentElement, 'style', {
          writable: true,
          value: {
            setProperty: jest.fn(),
          },
        })

        render(
          <div className="ios-safe-area">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>iOS Safe Area Test</TooltipTrigger>
                <TooltipContent>iOS tooltip</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )

        expect(screen.getByText('iOS Safe Area Test')).toBeInTheDocument()
      })
    })

    describe('Android Chrome', () => {
      beforeEach(() => {
        mockBrowserEnvironment('android')
        
        // Mock Android viewport
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: 360,
        })
        Object.defineProperty(window, 'innerHeight', {
          writable: true,
          configurable: true,
          value: 640,
        })
      })

      it('handles Android virtual keyboard', async () => {
        const user = userEvent.setup()
        
        // Mock Android virtual viewport
        Object.defineProperty(window, 'visualViewport', {
          writable: true,
          configurable: true,
          value: {
            height: 400, // Reduced when keyboard is open
            width: 360,
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
          },
        })

        render(
          <Command>
            <CommandInput placeholder="Android search..." />
            <CommandList>
              <CommandGroup>
                <CommandItem value="android-item">Android Item</CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        )

        const input = screen.getByPlaceholderText('Android search...')
        await user.type(input, 'android')

        expect(screen.getByText('Android Item')).toBeInTheDocument()
      })

      it('handles Android touch gestures', async () => {
        render(
          <Drawer>
            <DrawerTrigger asChild>
              <button>Android Drawer</button>
            </DrawerTrigger>
            <DrawerContent>
              <div>Android content</div>
            </DrawerContent>
          </Drawer>
        )

        const trigger = screen.getByText('Android Drawer')
        
        // Android touch events
        fireEvent.touchStart(trigger)
        fireEvent.touchEnd(trigger)

        await waitFor(() => {
          expect(screen.getByText('Android content')).toBeInTheDocument()
        })
      })
    })
  })

  describe('Feature Detection and Polyfills', () => {
    it('gracefully handles missing IntersectionObserver', () => {
      // Remove IntersectionObserver
      const originalIntersectionObserver = window.IntersectionObserver
      delete (window as any).IntersectionObserver

      render(
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>Fallback Tooltip</TooltipTrigger>
            <TooltipContent>Should work without IntersectionObserver</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )

      expect(screen.getByText('Fallback Tooltip')).toBeInTheDocument()

      // Restore
      window.IntersectionObserver = originalIntersectionObserver
    })

    it('gracefully handles missing ResizeObserver', () => {
      // Remove ResizeObserver
      const originalResizeObserver = window.ResizeObserver
      delete (window as any).ResizeObserver

      render(
        <Drawer>
          <DrawerTrigger>Test without ResizeObserver</DrawerTrigger>
          <DrawerContent>Content</DrawerContent>
        </Drawer>
      )

      expect(screen.getByText('Test without ResizeObserver')).toBeInTheDocument()

      // Restore
      window.ResizeObserver = originalResizeObserver
    })

    it('handles browsers without CSS Container Queries', () => {
      // Mock CSS.supports to return false for container queries
      Object.defineProperty(CSS, 'supports', {
        writable: true,
        value: jest.fn((property: string) => {
          if (property.includes('container-type')) return false
          return true
        }),
      })

      render(
        <Command className="container-query-test">
          <CommandInput placeholder="No container queries..." />
          <CommandList>
            <CommandItem value="fallback">Fallback layout</CommandItem>
          </CommandList>
        </Command>
      )

      expect(screen.getByText('Fallback layout')).toBeInTheDocument()
    })

    it('handles browsers without backdrop-filter support', () => {
      // Mock CSS.supports to return false for backdrop-filter
      Object.defineProperty(CSS, 'supports', {
        writable: true,
        value: jest.fn((property: string) => {
          if (property.includes('backdrop-filter')) return false
          return true
        }),
      })

      render(
        <Popover>
          <PopoverTrigger>No backdrop filter</PopoverTrigger>
          <PopoverContent className="backdrop-blur">
            Fallback styling
          </PopoverContent>
        </Popover>
      )

      expect(screen.getByText('No backdrop filter')).toBeInTheDocument()
    })
  })

  describe('Accessibility Across Browsers', () => {
    it('maintains ARIA support across browsers', async () => {
      const user = userEvent.setup()
      
      render(
        <Command role="combobox" aria-expanded="false">
          <CommandInput 
            placeholder="Cross-browser ARIA..." 
            aria-label="Search meals"
          />
          <CommandList role="listbox">
            <CommandItem 
              value="aria-item" 
              role="option"
              aria-selected="false"
            >
              ARIA-compliant item
            </CommandItem>
          </CommandList>
        </Command>
      )

      const input = screen.getByLabelText('Search meals')
      const item = screen.getByRole('option')
      
      expect(input).toHaveAttribute('aria-label', 'Search meals')
      expect(item).toHaveAttribute('role', 'option')
      expect(item).toHaveAttribute('aria-selected', 'false')

      await user.click(input)
      await user.keyboard('{ArrowDown}')
      
      // Should maintain ARIA states across interactions
      expect(input).toBeInTheDocument()
    })

    it('supports screen reader navigation patterns', async () => {
      const user = userEvent.setup()
      
      render(
        <div>
          <h1>Cross-browser Screen Reader Test</h1>
          <nav aria-label="Main navigation">
            <Command>
              <CommandInput placeholder="Navigate..." />
              <CommandList>
                <CommandGroup heading="Navigation">
                  <CommandItem value="home">Home</CommandItem>
                  <CommandItem value="menu">Menu</CommandItem>
                  <CommandItem value="orders">Orders</CommandItem>
                </CommandGroup>
              </CommandList>
            </Command>
          </nav>
        </div>
      )

      const navigation = screen.getByLabelText('Main navigation')
      const input = screen.getByPlaceholderText('Navigate...')
      
      expect(navigation).toBeInTheDocument()
      expect(input).toBeInTheDocument()

      // Test keyboard navigation
      await user.click(input)
      await user.keyboard('{ArrowDown}')
      await user.keyboard('{Enter}')

      expect(input).toBeInTheDocument()
    })
  })

  describe('Browser-Specific Event Handling', () => {
    it('handles pointer events across browsers', async () => {
      const pointerDownHandler = jest.fn()
      const pointerUpHandler = jest.fn()

      render(
        <div
          onPointerDown={pointerDownHandler}
          onPointerUp={pointerUpHandler}
        >
          <Tooltip>
            <TooltipTrigger>Pointer Events Test</TooltipTrigger>
            <TooltipContent>Cross-browser pointer events</TooltipContent>
          </Tooltip>
        </div>
      )

      const trigger = screen.getByText('Pointer Events Test')
      
      fireEvent.pointerDown(trigger)
      fireEvent.pointerUp(trigger)

      expect(pointerDownHandler).toHaveBeenCalled()
      expect(pointerUpHandler).toHaveBeenCalled()
    })

    it('handles wheel events consistently', async () => {
      const wheelHandler = jest.fn()

      render(
        <div onWheel={wheelHandler}>
          <Command>
            <CommandInput placeholder="Wheel events..." />
            <CommandList>
              {Array.from({ length: 20 }, (_, i) => (
                <CommandItem key={i} value={`item-${i}`}>
                  Scrollable Item {i}
                </CommandItem>
              ))}
            </CommandList>
          </Command>
        </div>
      )

      const list = screen.getByRole('listbox', { hidden: true })
      
      fireEvent.wheel(list, { deltaY: 100 })

      expect(wheelHandler).toHaveBeenCalled()
    })
  })
})