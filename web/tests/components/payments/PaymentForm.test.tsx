/**
 * PaymentForm Component - Unit Tests
 * Tests for PaymentForm component functionality
 * Epic 5: Payment Processing & Billing System
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { jest } from '@jest/globals';

// Mock the PaymentService
const mockProcessPayment = jest.fn();
const mockGetInstance = jest.fn();

jest.mock('../../../../src/services/payment.service', () => ({
  PaymentService: {
    getInstance: mockGetInstance,
  },
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  CreditCard: () => <div data-testid="credit-card-icon" />,
  Lock: () => <div data-testid="lock-icon" />,
  Shield: () => <div data-testid="shield-icon" />,
  CheckCircle: () => <div data-testid="check-circle-icon" />,
  AlertTriangle: () => <div data-testid="alert-triangle-icon" />,
  Loader2: () => <div data-testid="loader-icon" />,
  IndianRupee: () => <div data-testid="indian-rupee-icon" />,
  Calendar: () => <div data-testid="calendar-icon" />,
  User: () => <div data-testid="user-icon" />,
  Phone: () => <div data-testid="phone-icon" />,
  Mail: () => <div data-testid="mail-icon" />,
}));

// Mock UI components
jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: any) => (
    <div className={className} data-testid="card">
      {children}
    </div>
  ),
  CardContent: ({ children }: any) => <div data-testid="card-content">{children}</div>,
  CardDescription: ({ children }: any) => <div data-testid="card-description">{children}</div>,
  CardHeader: ({ children }: any) => <div data-testid="card-header">{children}</div>,
  CardTitle: ({ children }: any) => <div data-testid="card-title">{children}</div>,
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, className, size }: any) => (
    <button onClick={onClick} disabled={disabled} className={className} data-size={size}>
      {children}
    </button>
  ),
}));

jest.mock('@/components/ui/input', () => ({
  Input: ({ id, placeholder, value, onChange, className, maxLength, type }: any) => (
    <input
      id={id}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className={className}
      maxLength={maxLength}
      type={type || 'text'}
      data-testid={`input-${id}`}
    />
  ),
}));

jest.mock('@/components/ui/label', () => ({
  Label: ({ children, htmlFor, className }: any) => (
    <label htmlFor={htmlFor} className={className}>
      {children}
    </label>
  ),
}));

jest.mock('@/components/ui/select', () => ({
  Select: ({ children, value, onValueChange }: any) => (
    <div data-testid="select" data-value={value} data-onchange={onValueChange}>
      {children}
    </div>
  ),
  SelectContent: ({ children }: any) => <div data-testid="select-content">{children}</div>,
  SelectItem: ({ children, value }: any) => <option value={value}>{children}</option>,
  SelectTrigger: ({ children }: any) => <div data-testid="select-trigger">{children}</div>,
  SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>,
}));

jest.mock('@/components/ui/radio-group', () => ({
  RadioGroup: ({ children, value, onValueChange }: any) => (
    <div data-testid="radio-group" data-value={value} data-onchange={onValueChange}>
      {children}
    </div>
  ),
  RadioGroupItem: ({ value, id }: any) => (
    <input type="radio" value={value} id={id} data-testid={`radio-${id}`} />
  ),
}));

jest.mock('@/components/ui/checkbox', () => ({
  Checkbox: ({ id, checked, onCheckedChange }: any) => (
    <input
      type="checkbox"
      id={id}
      checked={checked}
      onChange={e => onCheckedChange(e.target.checked)}
      data-testid={`checkbox-${id}`}
    />
  ),
}));

jest.mock('@/components/ui/alert', () => ({
  Alert: ({ children }: any) => <div data-testid="alert">{children}</div>,
  AlertDescription: ({ children }: any) => <div data-testid="alert-description">{children}</div>,
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant, className }: any) => (
    <span className={className} data-variant={variant}>
      {children}
    </span>
  ),
}));

jest.mock('@/components/ui/separator', () => ({
  Separator: () => <hr data-testid="separator" />,
}));

import { PaymentForm } from '../../../src/components/payments/PaymentForm';

describe('PaymentForm', () => {
  const defaultProps = {
    orderId: 'ORD-123',
    schoolId: 'SCH-001',
    parentId: 'PAR-001',
    amount: 1000,
    currency: 'INR',
    description: 'Test order payment',
  };

  const mockPaymentService = {
    processPayment: mockProcessPayment,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetInstance.mockReturnValue(mockPaymentService);
  });

  describe('Component Rendering', () => {
    test('should render payment form with correct title and description', () => {
      render(<PaymentForm {...defaultProps} />);

      expect(screen.getByText('Secure Payment')).toBeInTheDocument();
      expect(
        screen.getByText('Complete your payment securely for order #ORD-123')
      ).toBeInTheDocument();
    });

    test('should display order summary with formatted amount', () => {
      render(<PaymentForm {...defaultProps} />);

      expect(screen.getByText('Total Amount')).toBeInTheDocument();
      expect(screen.getByText('Test order payment')).toBeInTheDocument();
      expect(screen.getByText('₹1,000')).toBeInTheDocument();
      expect(screen.getByText('Inclusive of all taxes')).toBeInTheDocument();
    });

    test('should render all payment method options', () => {
      render(<PaymentForm {...defaultProps} />);

      expect(screen.getByText('Credit/Debit Card')).toBeInTheDocument();
      expect(screen.getByText('UPI')).toBeInTheDocument();
      expect(screen.getByText('Net Banking')).toBeInTheDocument();
      expect(screen.getByText('Digital Wallet')).toBeInTheDocument();
    });

    test('should show security badges', () => {
      render(<PaymentForm {...defaultProps} />);

      expect(screen.getByText('PCI Compliant')).toBeInTheDocument();
      expect(screen.getByText('256-bit SSL')).toBeInTheDocument();
      expect(screen.getByText('Secure')).toBeInTheDocument();
    });
  });

  describe('Payment Method Selection', () => {
    test('should default to card payment method', () => {
      render(<PaymentForm {...defaultProps} />);

      const cardRadio = screen.getByTestId('radio-card');
      expect(cardRadio).toBeChecked();
    });

    test('should show card form when card method is selected', () => {
      render(<PaymentForm {...defaultProps} />);

      expect(screen.getByLabelText(/card number/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/expiry date/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/cvv/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/cardholder name/i)).toBeInTheDocument();
    });

    test('should show UPI form when UPI method is selected', async () => {
      const user = userEvent.setup();
      render(<PaymentForm {...defaultProps} />);

      const upiRadio = screen.getByTestId('radio-upi');
      await user.click(upiRadio);

      expect(screen.getByLabelText(/upi id/i)).toBeInTheDocument();
      expect(
        screen.getByText('You will be redirected to your UPI app to complete the payment.')
      ).toBeInTheDocument();
    });

    test('should show net banking form when net banking method is selected', async () => {
      const user = userEvent.setup();
      render(<PaymentForm {...defaultProps} />);

      const netbankingRadio = screen.getByTestId('radio-netbanking');
      await user.click(netbankingRadio);

      expect(screen.getByText('Select Your Bank')).toBeInTheDocument();
      expect(
        screen.getByText("You will be redirected to your bank's secure login page.")
      ).toBeInTheDocument();
    });
  });

  describe('Card Form Validation', () => {
    test('should validate card number format', async () => {
      const user = userEvent.setup();
      render(<PaymentForm {...defaultProps} />);

      const cardNumberInput = screen.getByLabelText(/card number/i);
      const payButton = screen.getByRole('button', { name: /pay ₹1,000/i });

      // Test invalid card number
      await user.type(cardNumberInput, '123');
      await user.click(payButton);

      expect(screen.getByText('Valid card number is required')).toBeInTheDocument();
    });

    test('should validate expiry date format', async () => {
      const user = userEvent.setup();
      render(<PaymentForm {...defaultProps} />);

      const expiryInput = screen.getByLabelText(/expiry date/i);
      const payButton = screen.getByRole('button', { name: /pay ₹1,000/i });

      await user.type(expiryInput, '13/25');
      await user.click(payButton);

      expect(screen.getByText('Valid expiry date (MM/YY) is required')).toBeInTheDocument();
    });

    test('should validate CVV', async () => {
      const user = userEvent.setup();
      render(<PaymentForm {...defaultProps} />);

      const cvvInput = screen.getByLabelText(/cvv/i);
      const payButton = screen.getByRole('button', { name: /pay ₹1,000/i });

      await user.type(cvvInput, '12');
      await user.click(payButton);

      expect(screen.getByText('Valid CVV is required')).toBeInTheDocument();
    });

    test('should validate cardholder name', async () => {
      const user = userEvent.setup();
      render(<PaymentForm {...defaultProps} />);

      const nameInput = screen.getByLabelText(/cardholder name/i);
      const payButton = screen.getByRole('button', { name: /pay ₹1,000/i });

      await user.clear(nameInput);
      await user.click(payButton);

      expect(screen.getByText('Cardholder name is required')).toBeInTheDocument();
    });

    test('should validate email format', async () => {
      const user = userEvent.setup();
      render(<PaymentForm {...defaultProps} />);

      const emailInput = screen.getByLabelText(/email/i);
      const payButton = screen.getByRole('button', { name: /pay ₹1,000/i });

      await user.type(emailInput, 'invalid-email');
      await user.click(payButton);

      expect(screen.getByText('Valid email is required')).toBeInTheDocument();
    });

    test('should validate phone number', async () => {
      const user = userEvent.setup();
      render(<PaymentForm {...defaultProps} />);

      const phoneInput = screen.getByLabelText(/phone/i);
      const payButton = screen.getByRole('button', { name: /pay ₹1,000/i });

      await user.type(phoneInput, '123');
      await user.click(payButton);

      expect(screen.getByText('Valid phone number is required')).toBeInTheDocument();
    });
  });

  describe('Card Input Formatting', () => {
    test('should format card number with spaces', async () => {
      const user = userEvent.setup();
      render(<PaymentForm {...defaultProps} />);

      const cardNumberInput = screen.getByLabelText(/card number/i);
      await user.type(cardNumberInput, '4111111111111111');

      expect(cardNumberInput).toHaveValue('4111 1111 1111 1111');
    });

    test('should format expiry date', async () => {
      const user = userEvent.setup();
      render(<PaymentForm {...defaultProps} />);

      const expiryInput = screen.getByLabelText(/expiry date/i);
      await user.type(expiryInput, '1225');

      expect(expiryInput).toHaveValue('12/25');
    });

    test('should limit CVV to 4 characters', async () => {
      const user = userEvent.setup();
      render(<PaymentForm {...defaultProps} />);

      const cvvInput = screen.getByLabelText(/cvv/i);
      await user.type(cvvInput, '12345');

      expect(cvvInput).toHaveValue('1234');
    });
  });

  describe('Payment Processing', () => {
    test('should process card payment successfully', async () => {
      const user = userEvent.setup();
      const mockOnSuccess = jest.fn();

      mockProcessPayment.mockResolvedValue({
        success: true,
        transactionId: 'TXN-123',
      });

      render(<PaymentForm {...defaultProps} onSuccess={mockOnSuccess} />);

      // Fill card form
      await user.type(screen.getByLabelText(/card number/i), '4111111111111111');
      await user.type(screen.getByLabelText(/expiry date/i), '1225');
      await user.type(screen.getByLabelText(/cvv/i), '123');
      await user.type(screen.getByLabelText(/cardholder name/i), 'John Doe');
      await user.type(screen.getByLabelText(/email/i), 'john@example.com');
      await user.type(screen.getByLabelText(/phone/i), '9876543210');

      const payButton = screen.getByRole('button', { name: /pay ₹1,000/i });
      await user.click(payButton);

      await waitFor(() => {
        expect(mockProcessPayment).toHaveBeenCalledWith({
          amount: 1000,
          currency: 'INR',
          orderId: 'ORD-123',
          schoolId: 'SCH-001',
          parentId: 'PAR-001',
          paymentMethod: 'card',
          description: 'Test order payment',
          cardData: {
            number: '4111111111111111',
            expiry: '12/25',
            cvv: '123',
            name: 'John Doe',
            email: 'john@example.com',
            phone: '9876543210',
          },
          saveCard: false,
        });
        expect(mockOnSuccess).toHaveBeenCalledWith('TXN-123');
      });
    });

    test('should process UPI payment', async () => {
      const user = userEvent.setup();
      const mockOnSuccess = jest.fn();

      mockProcessPayment.mockResolvedValue({
        success: true,
        transactionId: 'TXN-UPI-123',
      });

      render(<PaymentForm {...defaultProps} onSuccess={mockOnSuccess} />);

      // Switch to UPI
      const upiRadio = screen.getByTestId('radio-upi');
      await user.click(upiRadio);

      // Fill UPI ID
      const upiInput = screen.getByLabelText(/upi id/i);
      await user.type(upiInput, 'user@upi');

      const payButton = screen.getByRole('button', { name: /pay ₹1,000/i });
      await user.click(payButton);

      await waitFor(() => {
        expect(mockProcessPayment).toHaveBeenCalledWith({
          amount: 1000,
          currency: 'INR',
          orderId: 'ORD-123',
          schoolId: 'SCH-001',
          parentId: 'PAR-001',
          paymentMethod: 'upi',
          description: 'Test order payment',
          upiId: 'user@upi',
        });
        expect(mockOnSuccess).toHaveBeenCalledWith('TXN-UPI-123');
      });
    });

    test('should handle payment failure', async () => {
      const user = userEvent.setup();
      const mockOnError = jest.fn();

      mockProcessPayment.mockResolvedValue({
        success: false,
        error: 'Payment declined',
      });

      render(<PaymentForm {...defaultProps} onError={mockOnError} />);

      // Fill minimal card form for validation
      await user.type(screen.getByLabelText(/card number/i), '4111111111111111');
      await user.type(screen.getByLabelText(/expiry date/i), '1225');
      await user.type(screen.getByLabelText(/cvv/i), '123');
      await user.type(screen.getByLabelText(/cardholder name/i), 'John Doe');
      await user.type(screen.getByLabelText(/email/i), 'john@example.com');
      await user.type(screen.getByLabelText(/phone/i), '9876543210');

      const payButton = screen.getByRole('button', { name: /pay ₹1,000/i });
      await user.click(payButton);

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith('Payment declined');
      });
    });

    test('should handle payment processing errors', async () => {
      const user = userEvent.setup();
      const mockOnError = jest.fn();

      mockProcessPayment.mockRejectedValue(new Error('Network error'));

      render(<PaymentForm {...defaultProps} onError={mockOnError} />);

      // Fill minimal card form
      await user.type(screen.getByLabelText(/card number/i), '4111111111111111');
      await user.type(screen.getByLabelText(/expiry date/i), '1225');
      await user.type(screen.getByLabelText(/cvv/i), '123');
      await user.type(screen.getByLabelText(/cardholder name/i), 'John Doe');
      await user.type(screen.getByLabelText(/email/i), 'john@example.com');
      await user.type(screen.getByLabelText(/phone/i), '9876543210');

      const payButton = screen.getByRole('button', { name: /pay ₹1,000/i });
      await user.click(payButton);

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith('Network error');
      });
    });

    test('should disable pay button during processing', async () => {
      const user = userEvent.setup();

      mockProcessPayment.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      render(<PaymentForm {...defaultProps} />);

      // Fill minimal card form
      await user.type(screen.getByLabelText(/card number/i), '4111111111111111');
      await user.type(screen.getByLabelText(/expiry date/i), '1225');
      await user.type(screen.getByLabelText(/cvv/i), '123');
      await user.type(screen.getByLabelText(/cardholder name/i), 'John Doe');
      await user.type(screen.getByLabelText(/email/i), 'john@example.com');
      await user.type(screen.getByLabelText(/phone/i), '9876543210');

      const payButton = screen.getByRole('button', { name: /pay ₹1,000/i });
      await user.click(payButton);

      // Button should be disabled during processing
      expect(payButton).toBeDisabled();
      expect(screen.getByText('Processing Payment...')).toBeInTheDocument();
    });
  });

  describe('UPI Validation', () => {
    test('should validate UPI ID is required', async () => {
      const user = userEvent.setup();
      render(<PaymentForm {...defaultProps} />);

      // Switch to UPI
      const upiRadio = screen.getByTestId('radio-upi');
      await user.click(upiRadio);

      const payButton = screen.getByRole('button', { name: /pay ₹1,000/i });
      await user.click(payButton);

      expect(screen.getByText('UPI ID is required')).toBeInTheDocument();
    });
  });

  describe('Currency Formatting', () => {
    test('should format amount in INR', () => {
      render(<PaymentForm {...defaultProps} />);

      expect(screen.getByText('₹1,000')).toBeInTheDocument();
    });

    test('should format amount in USD', () => {
      render(<PaymentForm {...defaultProps} currency="USD" />);

      expect(screen.getByText('$1,000')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('should have proper labels for form inputs', () => {
      render(<PaymentForm {...defaultProps} />);

      expect(screen.getByLabelText(/card number/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/expiry date/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/cvv/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/cardholder name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/phone/i)).toBeInTheDocument();
    });

    test('should have proper ARIA attributes', () => {
      render(<PaymentForm {...defaultProps} />);

      const payButton = screen.getByRole('button', { name: /pay ₹1,000/i });
      expect(payButton).toBeInTheDocument();
    });
  });

  describe('Error Clearing', () => {
    test('should clear field errors when user starts typing', async () => {
      const user = userEvent.setup();
      render(<PaymentForm {...defaultProps} />);

      const cardNumberInput = screen.getByLabelText(/card number/i);
      const payButton = screen.getByRole('button', { name: /pay ₹1,000/i });

      // Trigger validation error
      await user.click(payButton);
      expect(screen.getByText('Valid card number is required')).toBeInTheDocument();

      // Start typing - error should clear
      await user.type(cardNumberInput, '4');
      expect(screen.queryByText('Valid card number is required')).not.toBeInTheDocument();
    });
  });

  describe('Save Card Feature', () => {
    test('should include saveCard flag in payment data when checked', async () => {
      const user = userEvent.setup();

      mockProcessPayment.mockResolvedValue({
        success: true,
        transactionId: 'TXN-123',
      });

      render(<PaymentForm {...defaultProps} />);

      // Check save card checkbox
      const saveCardCheckbox = screen.getByTestId('checkbox-saveCard');
      await user.click(saveCardCheckbox);

      // Fill minimal card form
      await user.type(screen.getByLabelText(/card number/i), '4111111111111111');
      await user.type(screen.getByLabelText(/expiry date/i), '1225');
      await user.type(screen.getByLabelText(/cvv/i), '123');
      await user.type(screen.getByLabelText(/cardholder name/i), 'John Doe');
      await user.type(screen.getByLabelText(/email/i), 'john@example.com');
      await user.type(screen.getByLabelText(/phone/i), '9876543210');

      const payButton = screen.getByRole('button', { name: /pay ₹1,000/i });
      await user.click(payButton);

      await waitFor(() => {
        expect(mockProcessPayment).toHaveBeenCalledWith(
          expect.objectContaining({ saveCard: true })
        );
      });
    });
  });
});
