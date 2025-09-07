/**
 * Error Handling and Edge Case Tests for ShadCN UI Components
 * Tests component resilience, error boundaries, and edge case scenarios
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
  DrawerClose,
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

// Error boundary component for testing
class TestErrorBoundary extends React.Component<
  { children: React.ReactNode; onError?: (error: Error) => void },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode; onError?: (error: Error) => void }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.props.onError?.(error)
  }

  render() {
    if (this.state.hasError) {
      return <div data-testid="error-fallback">Something went wrong: {this.state.error?.message}</div>
    }

    return this.props.children
  }
}

// Component that throws an error for testing
const ErrorThrowingComponent = ({ shouldThrow = false }: { shouldThrow?: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error')
  }
  return <div>No error</div>
}

// Network simulation utilities
const mockNetworkFailure = () => {
  const originalFetch = global.fetch
  global.fetch = jest.fn().mockRejectedValue(new Error('Network error'))
  return () => {
    global.fetch = originalFetch
  }
}

const mockSlowNetwork = (delay: number = 5000) => {
  const originalFetch = global.fetch
  global.fetch = jest.fn().mockImplementation(() => 
    new Promise((resolve) => setTimeout(resolve, delay))
  )
  return () => {
    global.fetch = originalFetch
  }
}

describe('Error Handling and Edge Cases', () => {
  beforeEach(() => {
    // Suppress console.error for error boundary tests
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('Error Boundary Integration', () => {
    it('handles component errors gracefully', () => {
      const onError = jest.fn()
      
      render(
        <TestErrorBoundary onError={onError}>
          <Command>
            <CommandInput />
            <CommandList>
              <ErrorThrowingComponent shouldThrow />
            </CommandList>
          </Command>
        </TestErrorBoundary>
      )

      expect(screen.getByTestId('error-fallback')).toBeInTheDocument()
      expect(onError).toHaveBeenCalledWith(expect.any(Error))
    })

    it('isolates errors to prevent component tree crashes', () => {
      render(
        <div>
          <div data-testid="safe-component">Safe Component</div>
          <TestErrorBoundary>
            <Command>
              <CommandInput />
              <CommandList>
                <ErrorThrowingComponent shouldThrow />
              </CommandList>
            </Command>
          </TestErrorBoundary>
          <div data-testid="another-safe-component">Another Safe Component</div>
        </div>
      )

      expect(screen.getByTestId('safe-component')).toBeInTheDocument()
      expect(screen.getByTestId('another-safe-component')).toBeInTheDocument()
      expect(screen.getByTestId('error-fallback')).toBeInTheDocument()
    })
  })

  describe('Command Component Error Handling', () => {
    it('handles empty search results gracefully', async () => {
      const user = userEvent.setup()
      
      render(
        <Command>
          <CommandInput placeholder="Search..." />
          <CommandList>
            <CommandEmpty>No meals found matching your search.</CommandEmpty>
            <CommandGroup>
              <CommandItem value="biryani">Chicken Biryani</CommandItem>
              <CommandItem value="curry">Paneer Curry</CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      )

      const input = screen.getByPlaceholderText('Search...')
      await user.type(input, 'nonexistent meal')

      await waitFor(() => {
        expect(screen.getByText('No meals found matching your search.')).toBeInTheDocument()
      })
    })

    it('handles extremely long search queries', async () => {
      const user = userEvent.setup()
      const longQuery = 'a'.repeat(1000)
      
      render(
        <Command>
          <CommandInput placeholder="Long query test..." />
          <CommandList>
            <CommandEmpty>No results</CommandEmpty>
            <CommandGroup>
              <CommandItem value="test">Test Item</CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      )

      const input = screen.getByPlaceholderText('Long query test...')
      
      // Should handle long input without crashing
      await user.type(input, longQuery)
      
      expect(input).toHaveValue(longQuery)
    })

    it('handles rapid successive search queries', async () => {
      const user = userEvent.setup()
      
      render(
        <Command>
          <CommandInput placeholder="Rapid search..." />
          <CommandList>
            <CommandGroup>
              <CommandItem value="item1">Item 1</CommandItem>
              <CommandItem value="item2">Item 2</CommandItem>
              <CommandItem value="item3">Item 3</CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      )

      const input = screen.getByPlaceholderText('Rapid search...')
      
      // Rapid typing and clearing
      for (let i = 0; i < 10; i++) {
        await user.type(input, `query${i}`)
        await user.clear(input)
      }
      
      // Should still be functional
      await user.type(input, 'item1')
      expect(screen.getByText('Item 1')).toBeInTheDocument()
    })

    it('handles special characters in search', async () => {
      const user = userEvent.setup()
      
      render(
        <Command>
          <CommandInput placeholder="Special chars..." />
          <CommandList>
            <CommandGroup>
              <CommandItem value="special!@#$%^&*()">Special!@#$%^&*()</CommandItem>
              <CommandItem value="unicode-🍛">Unicode 🍛</CommandItem>
              <CommandItem value="quotes'test&quot;">Quotes'Test&quot;</CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      )

      const input = screen.getByPlaceholderText('Special chars...')
      
      // Test special characters
      await user.type(input, '!@#$')
      expect(screen.getByText('Special!@#$%^&*()')).toBeInTheDocument()
      
      await user.clear(input)
      await user.type(input, '🍛')
      expect(screen.getByText('Unicode 🍛')).toBeInTheDocument()
      
      await user.clear(input)
      await user.type(input, '"')
      expect(screen.getByText('Quotes\'Test"')).toBeInTheDocument()
    })
  })

  describe('Drawer Component Error Handling', () => {
    it('handles drawer open/close state corruption', async () => {
      const user = userEvent.setup()
      
      const TestDrawer = () => {
        const [isOpen, setIsOpen] = React.useState(false)
        
        return (
          <div>
            <button onClick={() => setIsOpen(!isOpen)}>External Toggle</button>
            <Drawer open={isOpen} onOpenChange={setIsOpen}>
              <DrawerTrigger asChild>
                <button>Open Drawer</button>
              </DrawerTrigger>
              <DrawerContent>
                <DrawerHeader>
                  <DrawerTitle>Test Drawer</DrawerTitle>
                </DrawerHeader>
                <div>Drawer content</div>
                <DrawerClose asChild>
                  <button>Close</button>
                </DrawerClose>
              </DrawerContent>
            </Drawer>
          </div>
        )
      }

      render(<TestDrawer />)

      const externalToggle = screen.getByText('External Toggle')
      const drawerTrigger = screen.getByText('Open Drawer')
      
      // Create conflicting state by using both external and internal controls
      await user.click(externalToggle) // Open externally
      await user.click(drawerTrigger) // Try to open again
      
      // Should handle state conflicts gracefully
      expect(screen.getByText('Test Drawer')).toBeInTheDocument()
    })

    it('handles rapid drawer open/close operations', async () => {
      const user = userEvent.setup()
      
      render(
        <Drawer>
          <DrawerTrigger asChild>
            <button>Rapid Toggle</button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Rapid Test</DrawerTitle>
            </DrawerHeader>
            <DrawerClose asChild>
              <button>Close</button>
            </DrawerClose>
          </DrawerContent>
        </Drawer>
      )

      const trigger = screen.getByText('Rapid Toggle')
      
      // Rapid toggling
      for (let i = 0; i < 5; i++) {
        await user.click(trigger)
        const closeBtn = screen.queryByText('Close')
        if (closeBtn) {
          await user.click(closeBtn)
        }
      }
      
      // Should still be functional
      await user.click(trigger)
      expect(screen.getByText('Rapid Test')).toBeInTheDocument()
    })

    it('handles drawer content overflow', async () => {
      const user = userEvent.setup()
      
      const largeContent = Array.from({ length: 100 }, (_, i) => (
        <div key={i} style={{ height: '50px', padding: '10px' }}>
          Very long content item {i} with lots of text that might cause overflow issues
        </div>
      ))

      render(
        <Drawer>
          <DrawerTrigger asChild>
            <button>Large Content Drawer</button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Large Content Test</DrawerTitle>
            </DrawerHeader>
            <div style={{ maxHeight: '400px', overflow: 'auto' }}>
              {largeContent}
            </div>
          </DrawerContent>
        </Drawer>
      )

      const trigger = screen.getByText('Large Content Drawer')
      await user.click(trigger)
      
      await waitFor(() => {
        expect(screen.getByText('Large Content Test')).toBeInTheDocument()
        expect(screen.getByText('Very long content item 0 with lots of text that might cause overflow issues')).toBeInTheDocument()
      })
    })
  })

  describe('Tooltip Component Error Handling', () => {
    it('handles tooltip triggers without content', async () => {
      const user = userEvent.setup()
      
      render(
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button>Empty Tooltip</button>
            </TooltipTrigger>
            <TooltipContent>
              {/* Empty content */}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )

      const trigger = screen.getByText('Empty Tooltip')
      await user.hover(trigger)
      
      // Should handle empty content gracefully
      expect(trigger).toBeInTheDocument()
    })

    it('handles tooltips with dynamic content that might fail', async () => {
      const user = userEvent.setup()
      
      const DynamicTooltip = () => {
        const [data, setData] = React.useState<string | null>(null)
        const [error, setError] = React.useState<string | null>(null)
        
        const fetchData = async () => {
          try {
            // Simulate data fetching that might fail
            if (Math.random() > 0.5) {
              throw new Error('Data fetch failed')
            }
            setData('Dynamic content loaded')
          } catch (err) {
            setError('Failed to load content')
          }
        }

        React.useEffect(() => {
          fetchData()
        }, [])

        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button>Dynamic Tooltip</button>
              </TooltipTrigger>
              <TooltipContent>
                {error ? (
                  <p className="text-red-500">{error}</p>
                ) : (
                  <p>{data || 'Loading...'}</p>
                )}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )
      }

      render(<DynamicTooltip />)

      const trigger = screen.getByText('Dynamic Tooltip')
      await user.hover(trigger)
      
      await waitFor(() => {
        // Should show either content or error message
        const tooltip = screen.queryByText('Dynamic content loaded') || 
                       screen.queryByText('Failed to load content') ||
                       screen.queryByText('Loading...')
        expect(tooltip).toBeInTheDocument()
      })
    })

    it('handles tooltips with extremely long content', async () => {
      const user = userEvent.setup()
      const longContent = 'Very long tooltip content. '.repeat(100)
      
      render(
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button>Long Content Tooltip</button>
            </TooltipTrigger>
            <TooltipContent>
              <p style={{ maxWidth: '300px', wordWrap: 'break-word' }}>
                {longContent}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )

      const trigger = screen.getByText('Long Content Tooltip')
      await user.hover(trigger)
      
      await waitFor(() => {
        // Should handle long content without breaking layout
        expect(screen.getByText(/Very long tooltip content/)).toBeInTheDocument()
      })
    })
  })

  describe('Popover Component Error Handling', () => {
    it('handles popover positioning edge cases', async () => {
      const user = userEvent.setup()
      
      // Mock extreme viewport conditions
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 100, // Very small width
      })
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 100, // Very small height
      })

      render(
        <div style={{ position: 'absolute', top: '50px', right: '10px' }}>
          <Popover>
            <PopoverTrigger asChild>
              <button>Edge Position</button>
            </PopoverTrigger>
            <PopoverContent>
              <div>Popover near edge</div>
            </PopoverContent>
          </Popover>
        </div>
      )

      const trigger = screen.getByText('Edge Position')
      await user.click(trigger)
      
      await waitFor(() => {
        expect(screen.getByText('Popover near edge')).toBeInTheDocument()
      })
    })

    it('handles popover with failing async content', async () => {
      const user = userEvent.setup()
      
      const AsyncPopover = () => {
        const [content, setContent] = React.useState('Loading...')
        const [isOpen, setIsOpen] = React.useState(false)
        
        React.useEffect(() => {
          if (isOpen) {
            // Simulate async operation that might fail
            setTimeout(() => {
              if (Math.random() > 0.5) {
                setContent('Content loaded successfully')
              } else {
                setContent('Error: Failed to load content')
              }
            }, 100)
          }
        }, [isOpen])

        return (
          <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
              <button>Async Popover</button>
            </PopoverTrigger>
            <PopoverContent>
              <div>{content}</div>
            </PopoverContent>
          </Popover>
        )
      }

      render(<AsyncPopover />)

      const trigger = screen.getByText('Async Popover')
      await user.click(trigger)
      
      // Should show loading state initially
      await waitFor(() => {
        expect(screen.getByText('Loading...')).toBeInTheDocument()
      })
      
      // Should eventually show either success or error
      await waitFor(() => {
        const result = screen.queryByText('Content loaded successfully') || 
                      screen.queryByText('Error: Failed to load content')
        expect(result).toBeInTheDocument()
      }, { timeout: 3000 })
    })
  })

  describe('InputOTP Component Error Handling', () => {
    it('handles invalid OTP input patterns', async () => {
      const user = userEvent.setup()
      const onChange = jest.fn()
      const onError = jest.fn()
      
      const ValidatingOTP = () => {
        const [value, setValue] = React.useState('')
        const [error, setError] = React.useState('')
        
        const handleChange = (newValue: string) => {
          setValue(newValue)
          onChange(newValue)
          
          // Validate input
          if (newValue.length === 6) {
            if (!/^\d{6}$/.test(newValue)) {
              const errorMsg = 'OTP must contain only numbers'
              setError(errorMsg)
              onError(errorMsg)
            } else {
              setError('')
            }
          } else {
            setError('')
          }
        }

        return (
          <div>
            <InputOTP maxLength={6} value={value} onChange={handleChange}>
              <InputOTPGroup>
                {Array.from({ length: 6 }, (_, i) => (
                  <InputOTPSlot key={i} index={i} />
                ))}
              </InputOTPGroup>
            </InputOTP>
            {error && (
              <div className="text-red-500" role="alert">
                {error}
              </div>
            )}
          </div>
        )
      }

      render(<ValidatingOTP />)

      const otpInput = screen.getByRole('textbox', { hidden: true })
      
      // Test invalid input (letters instead of numbers)
      await user.type(otpInput, 'ABCDEF')
      
      await waitFor(() => {
        expect(screen.getByText('OTP must contain only numbers')).toBeInTheDocument()
        expect(onError).toHaveBeenCalledWith('OTP must contain only numbers')
      })
    })

    it('handles OTP input with network verification failures', async () => {
      const user = userEvent.setup()
      const restoreNetwork = mockNetworkFailure()
      
      const NetworkOTP = () => {
        const [value, setValue] = React.useState('')
        const [status, setStatus] = React.useState<'idle' | 'verifying' | 'error' | 'success'>('idle')
        
        const handleChange = async (newValue: string) => {
          setValue(newValue)
          
          if (newValue.length === 6) {
            setStatus('verifying')
            try {
              // Simulate network verification
              await fetch('/api/verify-otp', {
                method: 'POST',
                body: JSON.stringify({ otp: newValue }),
              })
              setStatus('success')
            } catch (error) {
              setStatus('error')
            }
          }
        }

        return (
          <div>
            <InputOTP maxLength={6} value={value} onChange={handleChange}>
              <InputOTPGroup>
                {Array.from({ length: 6 }, (_, i) => (
                  <InputOTPSlot key={i} index={i} />
                ))}
              </InputOTPGroup>
            </InputOTP>
            
            {status === 'verifying' && <div>Verifying...</div>}
            {status === 'error' && (
              <div className="text-red-500" role="alert">
                Network error: Unable to verify OTP
              </div>
            )}
            {status === 'success' && (
              <div className="text-green-500">OTP verified successfully</div>
            )}
          </div>
        )
      }

      render(<NetworkOTP />)

      const otpInput = screen.getByRole('textbox', { hidden: true })
      await user.type(otpInput, '123456')
      
      await waitFor(() => {
        expect(screen.getByText('Verifying...')).toBeInTheDocument()
      })
      
      await waitFor(() => {
        expect(screen.getByText('Network error: Unable to verify OTP')).toBeInTheDocument()
      })
      
      restoreNetwork()
    })

    it('handles OTP input with slow network responses', async () => {
      const user = userEvent.setup()
      const restoreNetwork = mockSlowNetwork(1000)
      
      const SlowNetworkOTP = () => {
        const [value, setValue] = React.useState('')
        const [isVerifying, setIsVerifying] = React.useState(false)
        
        const handleChange = async (newValue: string) => {
          setValue(newValue)
          
          if (newValue.length === 6) {
            setIsVerifying(true)
            try {
              await fetch('/api/verify-otp')
              setIsVerifying(false)
            } catch (error) {
              setIsVerifying(false)
            }
          }
        }

        return (
          <div>
            <InputOTP 
              maxLength={6} 
              value={value} 
              onChange={handleChange}
              disabled={isVerifying}
            >
              <InputOTPGroup>
                {Array.from({ length: 6 }, (_, i) => (
                  <InputOTPSlot key={i} index={i} />
                ))}
              </InputOTPGroup>
            </InputOTP>
            
            {isVerifying && (
              <div>
                Verifying OTP... This may take a moment.
              </div>
            )}
          </div>
        )
      }

      render(<SlowNetworkOTP />)

      const otpInput = screen.getByRole('textbox', { hidden: true })
      await user.type(otpInput, '123456')
      
      await waitFor(() => {
        expect(screen.getByText('Verifying OTP... This may take a moment.')).toBeInTheDocument()
        expect(otpInput).toBeDisabled()
      })
      
      restoreNetwork()
    })
  })

  describe('Memory Leak Prevention', () => {
    it('cleans up event listeners on unmount', () => {
      const addEventListenerSpy = jest.spyOn(document, 'addEventListener')
      const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener')
      
      const { unmount } = render(
        <div>
          <Command>
            <CommandInput />
            <CommandList>
              <CommandItem value="test">Test</CommandItem>
            </CommandList>
          </Command>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>Trigger</TooltipTrigger>
              <TooltipContent>Content</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <Popover>
            <PopoverTrigger>Trigger</PopoverTrigger>
            <PopoverContent>Content</PopoverContent>
          </Popover>
        </div>
      )

      const initialListeners = addEventListenerSpy.mock.calls.length
      
      unmount()
      
      // Should have corresponding removeEventListener calls
      expect(removeEventListenerSpy.mock.calls.length).toBeGreaterThan(0)
      
      addEventListenerSpy.mockRestore()
      removeEventListenerSpy.mockRestore()
    })

    it('handles component unmounting during async operations', async () => {
      const user = userEvent.setup()
      
      const AsyncComponent = () => {
        const [isLoading, setIsLoading] = React.useState(false)
        const mountedRef = React.useRef(true)
        
        React.useEffect(() => {
          return () => {
            mountedRef.current = false
          }
        }, [])
        
        const handleAsyncOperation = async () => {
          setIsLoading(true)
          
          // Simulate async operation
          await new Promise(resolve => setTimeout(resolve, 100))
          
          // Only update state if component is still mounted
          if (mountedRef.current) {
            setIsLoading(false)
          }
        }

        return (
          <div>
            <button onClick={handleAsyncOperation}>Start Async</button>
            {isLoading && <div>Loading...</div>}
            <Command>
              <CommandInput />
              <CommandList>
                <CommandItem value="test">Test Item</CommandItem>
              </CommandList>
            </Command>
          </div>
        )
      }

      const { unmount } = render(<AsyncComponent />)

      const button = screen.getByText('Start Async')
      await user.click(button)
      
      // Unmount before async operation completes
      unmount()
      
      // Should not cause errors or warnings
      expect(screen.queryByText('Start Async')).not.toBeInTheDocument()
    })
  })

  describe('Accessibility Error Handling', () => {
    it('maintains accessibility during error states', async () => {
      const user = userEvent.setup()
      
      const AccessibleErrorComponent = () => {
        const [hasError, setHasError] = React.useState(false)
        
        return (
          <div>
            <button onClick={() => setHasError(!hasError)}>
              Toggle Error
            </button>
            
            {hasError ? (
              <div role="alert" aria-live="assertive">
                <p>An error occurred. Please try again.</p>
              </div>
            ) : (
              <Command>
                <CommandInput 
                  placeholder="Search..." 
                  aria-label="Search meals"
                />
                <CommandList>
                  <CommandItem value="test" role="option">
                    Test Item
                  </CommandItem>
                </CommandList>
              </Command>
            )}
          </div>
        )
      }

      render(<AccessibleErrorComponent />)

      const toggleButton = screen.getByText('Toggle Error')
      
      // Initially should show Command component
      expect(screen.getByLabelText('Search meals')).toBeInTheDocument()
      
      // Toggle to error state
      await user.click(toggleButton)
      
      // Should show accessible error message
      const errorAlert = screen.getByRole('alert')
      expect(errorAlert).toBeInTheDocument()
      expect(errorAlert).toHaveAttribute('aria-live', 'assertive')
      
      // Toggle back to normal state
      await user.click(toggleButton)
      
      // Should restore Command component
      expect(screen.getByLabelText('Search meals')).toBeInTheDocument()
    })
  })
})