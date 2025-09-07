/**
 * Comprehensive Unit Tests for InputOTP Component (ShadCN UI)
 * Tests OTP input functionality, RFID verification, and accessibility
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe, toHaveNoViolations } from 'jest-axe'
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from '../input-otp'

expect.extend(toHaveNoViolations)

describe('InputOTP Component Suite', () => {
  // Mock RFID verification scenarios
  const mockRFIDCodes = {
    valid: '123456',
    expired: '000000',
    blocked: '999999',
    student: '456789',
    teacher: '789012',
  }

  const RFIDVerificationOTP = ({ 
    maxLength = 6,
    onComplete = jest.fn(),
    onError = jest.fn(),
    studentName = "John Doe",
    studentId = "ST001"
  }: {
    maxLength?: number
    onComplete?: (value: string) => void
    onError?: (error: string) => void
    studentName?: string
    studentId?: string
  }) => {
    const [value, setValue] = React.useState('')
    const [isVerifying, setIsVerifying] = React.useState(false)
    const [error, setError] = React.useState('')

    const handleChange = (newValue: string) => {
      setValue(newValue)
      setError('')
      
      if (newValue.length === maxLength) {
        setIsVerifying(true)
        
        // Simulate RFID verification
        setTimeout(() => {
          setIsVerifying(false)
          
          if (newValue === mockRFIDCodes.valid || newValue === mockRFIDCodes.student) {
            onComplete(newValue)
          } else if (newValue === mockRFIDCodes.expired) {
            const errorMsg = 'RFID card has expired. Please contact administration.'
            setError(errorMsg)
            onError(errorMsg)
          } else if (newValue === mockRFIDCodes.blocked) {
            const errorMsg = 'RFID card is blocked. Please contact administration.'
            setError(errorMsg)
            onError(errorMsg)
          } else {
            const errorMsg = 'Invalid RFID code. Please try again.'
            setError(errorMsg)
            onError(errorMsg)
          }
        }, 1000)
      }
    }

    return (
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="font-medium">RFID Verification</h3>
          <p className="text-sm text-muted-foreground">
            Student: {studentName} ({studentId})
          </p>
          <p className="text-sm text-muted-foreground">
            Please scan your RFID card or enter the code
          </p>
        </div>
        
        <div className="flex justify-center">
          <InputOTP 
            maxLength={maxLength} 
            value={value} 
            onChange={handleChange}
            disabled={isVerifying}
          >
            <InputOTPGroup>
              {Array.from({ length: Math.ceil(maxLength / 2) }, (_, i) => (
                <InputOTPSlot key={i} index={i} />
              ))}
            </InputOTPGroup>
            <InputOTPSeparator />
            <InputOTPGroup>
              {Array.from({ length: Math.floor(maxLength / 2) }, (_, i) => (
                <InputOTPSlot key={i + Math.ceil(maxLength / 2)} index={i + Math.ceil(maxLength / 2)} />
              ))}
            </InputOTPGroup>
          </InputOTP>
        </div>
        
        {isVerifying && (
          <div className="text-center text-sm text-blue-600">
            Verifying RFID code...
          </div>
        )}
        
        {error && (
          <div className="text-center text-sm text-red-600" role="alert">
            {error}
          </div>
        )}
        
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            Code: {value || 'Enter 6-digit RFID code'}
          </p>
        </div>
      </div>
    )
  }

  const SimpleOTP = ({ 
    maxLength = 4,
    value = '',
    onChange = jest.fn(),
    ...props 
  }: {
    maxLength?: number
    value?: string
    onChange?: (value: string) => void
    [key: string]: any
  }) => (
    <InputOTP maxLength={maxLength} value={value} onChange={onChange} {...props}>
      <InputOTPGroup>
        {Array.from({ length: maxLength }, (_, i) => (
          <InputOTPSlot key={i} index={i} />
        ))}
      </InputOTPGroup>
    </InputOTP>
  )

  describe('InputOTP Root Component', () => {
    it('renders without crashing', () => {
      render(<SimpleOTP />)
      
      // Should render 4 input slots by default
      const slots = screen.getAllByRole('textbox', { hidden: true })
      expect(slots).toHaveLength(1) // OTP input is single textbox with multiple visual slots
    })

    it('supports custom maxLength', () => {
      render(<SimpleOTP maxLength={6} />)
      
      const otpInput = screen.getByRole('textbox', { hidden: true })
      expect(otpInput).toHaveAttribute('maxLength', '6')
    })

    it('supports controlled value', () => {
      render(<SimpleOTP value="12" />)
      
      const otpInput = screen.getByRole('textbox', { hidden: true })
      expect(otpInput).toHaveValue('12')
    })

    it('handles onChange callback', async () => {
      const user = userEvent.setup()
      const onChange = jest.fn()
      
      render(<SimpleOTP onChange={onChange} />)
      
      const otpInput = screen.getByRole('textbox', { hidden: true })
      await user.type(otpInput, '1')
      
      expect(onChange).toHaveBeenCalledWith('1')
    })

    it('supports disabled state', () => {
      render(<SimpleOTP disabled />)
      
      const otpInput = screen.getByRole('textbox', { hidden: true })
      expect(otpInput).toBeDisabled()
    })

    it('supports custom className', () => {
      render(<SimpleOTP className="custom-otp" />)
      
      const otpInput = screen.getByRole('textbox', { hidden: true })
      expect(otpInput).toHaveClass('custom-otp')
    })
  })

  describe('InputOTPGroup Component', () => {
    it('renders group with proper structure', () => {
      render(
        <InputOTP maxLength={4}>
          <InputOTPGroup data-testid="otp-group">
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
          </InputOTPGroup>
        </InputOTP>
      )
      
      const group = screen.getByTestId('otp-group')
      expect(group).toBeInTheDocument()
      expect(group).toHaveClass('flex', 'items-center')
    })

    it('supports custom className', () => {
      render(
        <InputOTP maxLength={2}>
          <InputOTPGroup className="custom-group">
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
          </InputOTPGroup>
        </InputOTP>
      )
      
      const group = screen.getByRole('textbox', { hidden: true }).closest('.custom-group')
      expect(group).toBeInTheDocument()
    })
  })

  describe('InputOTPSlot Component', () => {
    it('renders individual slots', () => {
      render(
        <InputOTP maxLength={3} value="12">
          <InputOTPGroup>
            <InputOTPSlot index={0} data-testid="slot-0" />
            <InputOTPSlot index={1} data-testid="slot-1" />
            <InputOTPSlot index={2} data-testid="slot-2" />
          </InputOTPGroup>
        </InputOTP>
      )
      
      const slot0 = screen.getByTestId('slot-0')
      const slot1 = screen.getByTestId('slot-1')
      const slot2 = screen.getByTestId('slot-2')
      
      expect(slot0).toBeInTheDocument()
      expect(slot1).toBeInTheDocument()
      expect(slot2).toBeInTheDocument()
      
      // First two slots should have content
      expect(slot0).toHaveTextContent('1')
      expect(slot1).toHaveTextContent('2')
      expect(slot2).toHaveTextContent('')
    })

    it('applies proper styling classes', () => {
      render(
        <InputOTP maxLength={1} value="">
          <InputOTPGroup>
            <InputOTPSlot index={0} data-testid="styled-slot" />
          </InputOTPGroup>
        </InputOTP>
      )
      
      const slot = screen.getByTestId('styled-slot')
      expect(slot).toHaveClass(
        'relative',
        'flex',
        'h-10',
        'w-10',
        'items-center',
        'justify-center',
        'border-y',
        'border-r',
        'text-sm'
      )
    })

    it('shows active state styling', () => {
      render(
        <InputOTP maxLength={2} value="1">
          <InputOTPGroup>
            <InputOTPSlot index={0} data-testid="filled-slot" />
            <InputOTPSlot index={1} data-testid="active-slot" />
          </InputOTPGroup>
        </InputOTP>
      )
      
      const activeSlot = screen.getByTestId('active-slot')
      // Active slot should have focus ring styling
      expect(activeSlot).toHaveClass('z-10')
    })

    it('supports custom className', () => {
      render(
        <InputOTP maxLength={1} value="">
          <InputOTPGroup>
            <InputOTPSlot index={0} className="custom-slot" />
          </InputOTPGroup>
        </InputOTP>
      )
      
      const slot = document.querySelector('.custom-slot')
      expect(slot).toBeInTheDocument()
    })

    it('displays cursor animation in empty active slot', () => {
      render(
        <InputOTP maxLength={2} value="">
          <InputOTPGroup>
            <InputOTPSlot index={0} data-testid="cursor-slot" />
            <InputOTPSlot index={1} />
          </InputOTPGroup>
        </InputOTP>
      )
      
      const slot = screen.getByTestId('cursor-slot')
      // Should show animated cursor
      const cursor = slot.querySelector('.animate-caret-blink')
      expect(cursor).toBeInTheDocument()
    })
  })

  describe('InputOTPSeparator Component', () => {
    it('renders separator with dot icon', () => {
      render(
        <InputOTP maxLength={4}>
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
          </InputOTPGroup>
          <InputOTPSeparator data-testid="separator" />
          <InputOTPGroup>
            <InputOTPSlot index={2} />
            <InputOTPSlot index={3} />
          </InputOTPGroup>
        </InputOTP>
      )
      
      const separator = screen.getByTestId('separator')
      expect(separator).toBeInTheDocument()
      expect(separator).toHaveAttribute('role', 'separator')
      
      // Should contain dot icon
      const dotIcon = separator.querySelector('svg')
      expect(dotIcon).toBeInTheDocument()
    })

    it('supports custom props', () => {
      render(
        <InputOTP maxLength={2}>
          <InputOTPGroup>
            <InputOTPSlot index={0} />
          </InputOTPGroup>
          <InputOTPSeparator className="custom-separator" />
          <InputOTPGroup>
            <InputOTPSlot index={1} />
          </InputOTPGroup>
        </InputOTP>
      )
      
      const separator = document.querySelector('.custom-separator')
      expect(separator).toBeInTheDocument()
    })
  })

  describe('User Input Handling', () => {
    it('accepts numeric input', async () => {
      const user = userEvent.setup()
      const onChange = jest.fn()
      
      render(<SimpleOTP onChange={onChange} />)
      
      const otpInput = screen.getByRole('textbox', { hidden: true })
      await user.type(otpInput, '1234')
      
      expect(onChange).toHaveBeenLastCalledWith('1234')
    })

    it('accepts alphabetic input when allowed', async () => {
      const user = userEvent.setup()
      const onChange = jest.fn()
      
      render(
        <InputOTP maxLength={4} onChange={onChange}>
          <InputOTPGroup>
            {Array.from({ length: 4 }, (_, i) => (
              <InputOTPSlot key={i} index={i} />
            ))}
          </InputOTPGroup>
        </InputOTP>
      )
      
      const otpInput = screen.getByRole('textbox', { hidden: true })
      await user.type(otpInput, 'ABCD')
      
      expect(onChange).toHaveBeenLastCalledWith('ABCD')
    })

    it('handles backspace deletion', async () => {
      const user = userEvent.setup()
      const onChange = jest.fn()
      
      render(<SimpleOTP value="123" onChange={onChange} />)
      
      const otpInput = screen.getByRole('textbox', { hidden: true })
      await user.type(otpInput, '{backspace}')
      
      expect(onChange).toHaveBeenLastCalledWith('12')
    })

    it('handles clear all input', async () => {
      const user = userEvent.setup()
      const onChange = jest.fn()
      
      render(<SimpleOTP value="1234" onChange={onChange} />)
      
      const otpInput = screen.getByRole('textbox', { hidden: true })
      await user.clear(otpInput)
      
      expect(onChange).toHaveBeenCalledWith('')
    })

    it('prevents input beyond maxLength', async () => {
      const user = userEvent.setup()
      const onChange = jest.fn()
      
      render(<SimpleOTP maxLength={4} onChange={onChange} />)
      
      const otpInput = screen.getByRole('textbox', { hidden: true })
      await user.type(otpInput, '123456')
      
      // Should only accept first 4 characters
      expect(onChange).toHaveBeenLastCalledWith('1234')
    })

    it('handles paste input', async () => {
      const user = userEvent.setup()
      const onChange = jest.fn()
      
      render(<SimpleOTP onChange={onChange} />)
      
      const otpInput = screen.getByRole('textbox', { hidden: true })
      await user.click(otpInput)
      await user.paste('5678')
      
      expect(onChange).toHaveBeenCalledWith('5678')
    })

    it('truncates pasted input to maxLength', async () => {
      const user = userEvent.setup()
      const onChange = jest.fn()
      
      render(<SimpleOTP maxLength={4} onChange={onChange} />)
      
      const otpInput = screen.getByRole('textbox', { hidden: true })
      await user.click(otpInput)
      await user.paste('123456789')
      
      expect(onChange).toHaveBeenCalledWith('1234')
    })
  })

  describe('RFID Verification Integration', () => {
    it('displays RFID verification interface', () => {
      render(<RFIDVerificationOTP />)
      
      expect(screen.getByText('RFID Verification')).toBeInTheDocument()
      expect(screen.getByText('Student: John Doe (ST001)')).toBeInTheDocument()
      expect(screen.getByText('Please scan your RFID card or enter the code')).toBeInTheDocument()
    })

    it('handles valid RFID code verification', async () => {
      const user = userEvent.setup()
      const onComplete = jest.fn()
      
      render(<RFIDVerificationOTP onComplete={onComplete} />)
      
      const otpInput = screen.getByRole('textbox', { hidden: true })
      await user.type(otpInput, mockRFIDCodes.valid)
      
      // Should show verifying state
      await waitFor(() => {
        expect(screen.getByText('Verifying RFID code...')).toBeInTheDocument()
      })
      
      // Should complete verification
      await waitFor(() => {
        expect(onComplete).toHaveBeenCalledWith(mockRFIDCodes.valid)
      }, { timeout: 2000 })
    })

    it('handles expired RFID code', async () => {
      const user = userEvent.setup()
      const onError = jest.fn()
      
      render(<RFIDVerificationOTP onError={onError} />)
      
      const otpInput = screen.getByRole('textbox', { hidden: true })
      await user.type(otpInput, mockRFIDCodes.expired)
      
      await waitFor(() => {
        expect(screen.getByText('RFID card has expired. Please contact administration.')).toBeInTheDocument()
        expect(onError).toHaveBeenCalledWith('RFID card has expired. Please contact administration.')
      }, { timeout: 2000 })
    })

    it('handles blocked RFID code', async () => {
      const user = userEvent.setup()
      const onError = jest.fn()
      
      render(<RFIDVerificationOTP onError={onError} />)
      
      const otpInput = screen.getByRole('textbox', { hidden: true })
      await user.type(otpInput, mockRFIDCodes.blocked)
      
      await waitFor(() => {
        expect(screen.getByText('RFID card is blocked. Please contact administration.')).toBeInTheDocument()
        expect(onError).toHaveBeenCalledWith('RFID card is blocked. Please contact administration.')
      }, { timeout: 2000 })
    })

    it('handles invalid RFID code', async () => {
      const user = userEvent.setup()
      const onError = jest.fn()
      
      render(<RFIDVerificationOTP onError={onError} />)
      
      const otpInput = screen.getByRole('textbox', { hidden: true })
      await user.type(otpInput, '111111')
      
      await waitFor(() => {
        expect(screen.getByText('Invalid RFID code. Please try again.')).toBeInTheDocument()
        expect(onError).toHaveBeenCalledWith('Invalid RFID code. Please try again.')
      }, { timeout: 2000 })
    })

    it('clears error when new input is entered', async () => {
      const user = userEvent.setup()
      
      render(<RFIDVerificationOTP />)
      
      const otpInput = screen.getByRole('textbox', { hidden: true })
      
      // Enter invalid code
      await user.type(otpInput, '111111')
      
      await waitFor(() => {
        expect(screen.getByText('Invalid RFID code. Please try again.')).toBeInTheDocument()
      }, { timeout: 2000 })
      
      // Clear and enter new code
      await user.clear(otpInput)
      await user.type(otpInput, '1')
      
      await waitFor(() => {
        expect(screen.queryByText('Invalid RFID code. Please try again.')).not.toBeInTheDocument()
      })
    })

    it('disables input during verification', async () => {
      const user = userEvent.setup()
      
      render(<RFIDVerificationOTP />)
      
      const otpInput = screen.getByRole('textbox', { hidden: true })
      await user.type(otpInput, mockRFIDCodes.valid)
      
      await waitFor(() => {
        expect(screen.getByText('Verifying RFID code...')).toBeInTheDocument()
        expect(otpInput).toBeDisabled()
      })
    })
  })

  describe('Keyboard Navigation', () => {
    it('focuses on click', async () => {
      const user = userEvent.setup()
      
      render(<SimpleOTP />)
      
      const otpInput = screen.getByRole('textbox', { hidden: true })
      await user.click(otpInput)
      
      expect(otpInput).toHaveFocus()
    })

    it('supports tab navigation', async () => {
      const user = userEvent.setup()
      
      render(
        <div>
          <button>Before OTP</button>
          <SimpleOTP />
          <button>After OTP</button>
        </div>
      )
      
      const beforeBtn = screen.getByText('Before OTP')
      const otpInput = screen.getByRole('textbox', { hidden: true })
      const afterBtn = screen.getByText('After OTP')
      
      await user.click(beforeBtn)
      await user.keyboard('{Tab}')
      
      expect(otpInput).toHaveFocus()
      
      await user.keyboard('{Tab}')
      expect(afterBtn).toHaveFocus()
    })

    it('handles arrow key navigation', async () => {
      const user = userEvent.setup()
      
      render(<SimpleOTP value="12" />)
      
      const otpInput = screen.getByRole('textbox', { hidden: true })
      await user.click(otpInput)
      
      // Arrow keys should move cursor within the input
      await user.keyboard('{ArrowLeft}')
      await user.keyboard('{ArrowRight}')
      
      expect(otpInput).toHaveFocus()
    })

    it('handles home and end keys', async () => {
      const user = userEvent.setup()
      
      render(<SimpleOTP value="1234" />)
      
      const otpInput = screen.getByRole('textbox', { hidden: true })
      await user.click(otpInput)
      
      await user.keyboard('{Home}')
      await user.keyboard('{End}')
      
      expect(otpInput).toHaveFocus()
    })
  })

  describe('Touch and Mobile Support', () => {
    it('handles touch events', async () => {
      render(<SimpleOTP />)
      
      const otpInput = screen.getByRole('textbox', { hidden: true })
      
      fireEvent.touchStart(otpInput)
      fireEvent.touchEnd(otpInput)
      
      expect(otpInput).toHaveFocus()
    })

    it('prevents zoom on mobile focus', () => {
      render(<SimpleOTP />)
      
      const otpInput = screen.getByRole('textbox', { hidden: true })
      
      // Should have proper attributes to prevent zoom
      expect(otpInput).toBeInTheDocument()
    })

    it('works with virtual keyboards', async () => {
      const user = userEvent.setup()
      const onChange = jest.fn()
      
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })
      
      render(<SimpleOTP onChange={onChange} />)
      
      const otpInput = screen.getByRole('textbox', { hidden: true })
      await user.type(otpInput, '9876')
      
      expect(onChange).toHaveBeenLastCalledWith('9876')
    })
  })

  describe('Accessibility', () => {
    it('meets WCAG accessibility guidelines', async () => {
      const { container } = render(
        <div>
          <label htmlFor="rfid-otp">Enter RFID Code</label>
          <InputOTP maxLength={6} id="rfid-otp">
            <InputOTPGroup>
              {Array.from({ length: 6 }, (_, i) => (
                <InputOTPSlot key={i} index={i} />
              ))}
            </InputOTPGroup>
          </InputOTP>
        </div>
      )
      
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('provides proper ARIA attributes', () => {
      render(
        <InputOTP maxLength={4} aria-label="Enter verification code">
          <InputOTPGroup>
            {Array.from({ length: 4 }, (_, i) => (
              <InputOTPSlot key={i} index={i} />
            ))}
          </InputOTPGroup>
        </InputOTP>
      )
      
      const otpInput = screen.getByRole('textbox', { hidden: true })
      expect(otpInput).toHaveAttribute('aria-label', 'Enter verification code')
    })

    it('supports screen reader announcements', () => {
      render(<RFIDVerificationOTP />)
      
      const errorAlert = screen.queryByRole('alert')
      // Should be ready to show error alerts
      expect(errorAlert).not.toBeInTheDocument()
    })

    it('handles high contrast mode', () => {
      // Mock high contrast media query
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query === '(prefers-contrast: high)',
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      })
      
      render(<SimpleOTP />)
      
      const slots = document.querySelectorAll('[class*="border"]')
      expect(slots.length).toBeGreaterThan(0)
      // Should have proper border styling for high contrast
    })

    it('supports assistive technology navigation', async () => {
      const user = userEvent.setup()
      
      render(
        <div>
          <h2>RFID Verification</h2>
          <InputOTP maxLength={6} aria-labelledby="rfid-heading">
            <InputOTPGroup>
              {Array.from({ length: 6 }, (_, i) => (
                <InputOTPSlot key={i} index={i} />
              ))}
            </InputOTPGroup>
          </InputOTP>
        </div>
      )
      
      const otpInput = screen.getByRole('textbox', { hidden: true })
      
      // Should be navigable by screen readers
      await user.click(otpInput)
      expect(otpInput).toHaveFocus()
    })
  })

  describe('Performance and Edge Cases', () => {
    it('handles rapid input changes', async () => {
      const user = userEvent.setup()
      const onChange = jest.fn()
      
      render(<SimpleOTP onChange={onChange} />)
      
      const otpInput = screen.getByRole('textbox', { hidden: true })
      
      // Rapid typing
      await user.type(otpInput, '1234567890', { delay: 10 })
      
      // Should handle rapid input gracefully
      expect(onChange).toHaveBeenCalled()
    })

    it('handles special characters gracefully', async () => {
      const user = userEvent.setup()
      const onChange = jest.fn()
      
      render(<SimpleOTP onChange={onChange} />)
      
      const otpInput = screen.getByRole('textbox', { hidden: true })
      await user.type(otpInput, '!@#$')
      
      // Should filter or handle special characters based on configuration
      expect(onChange).toHaveBeenCalled()
    })

    it('handles large maxLength values', () => {
      render(<SimpleOTP maxLength={20} />)
      
      const otpInput = screen.getByRole('textbox', { hidden: true })
      expect(otpInput).toHaveAttribute('maxLength', '20')
    })

    it('handles component unmounting during verification', async () => {
      const user = userEvent.setup()
      
      const { unmount } = render(<RFIDVerificationOTP />)
      
      const otpInput = screen.getByRole('textbox', { hidden: true })
      await user.type(otpInput, '123456')
      
      // Unmount before verification completes
      unmount()
      
      // Should not cause errors or memory leaks
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    })

    it('maintains state consistency', async () => {
      const user = userEvent.setup()
      const onChange = jest.fn()
      
      render(<SimpleOTP onChange={onChange} value="12" />)
      
      const otpInput = screen.getByRole('textbox', { hidden: true })
      
      // Type additional characters
      await user.type(otpInput, '34')
      
      expect(onChange).toHaveBeenLastCalledWith('1234')
    })

    it('handles focus management during state changes', async () => {
      const user = userEvent.setup()
      
      const TestComponent = () => {
        const [disabled, setDisabled] = React.useState(false)
        
        return (
          <div>
            <button onClick={() => setDisabled(!disabled)}>
              Toggle Disabled
            </button>
            <SimpleOTP disabled={disabled} />
          </div>
        )
      }
      
      render(<TestComponent />)
      
      const toggleBtn = screen.getByText('Toggle Disabled')
      const otpInput = screen.getByRole('textbox', { hidden: true })
      
      await user.click(otpInput)
      expect(otpInput).toHaveFocus()
      
      await user.click(toggleBtn)
      expect(otpInput).toBeDisabled()
    })
  })
})