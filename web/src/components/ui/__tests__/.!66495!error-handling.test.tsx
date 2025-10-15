/**
 * Error Handling and Edge Case Tests for ShadCN UI Components
 * Tests component resilience, error boundaries, and edge case scenarios
 */

import React from 'react'
import { render, screen, _fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  Command,
  _CommandDialog,
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

  componentDidCatch(error: Error, _errorInfo: React.ErrorInfo) {
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
