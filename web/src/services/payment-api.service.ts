/**
 * Payment API Service
 * Integrates with Razorpay payment gateway and backend payment Lambda functions
 */

import axios, { AxiosInstance } from 'axios';

// Payment Order Creation Request
export interface CreatePaymentOrderRequest {
  orderId: string;
  amount: number;
  currency?: string;
  description?: string;
}

// Razorpay Payment Order Response
export interface PaymentOrderResponse {
  razorpayOrderId: string;
  amount: number;
  currency: string;
  orderId: string;
  status: 'created' | 'attempted' | 'paid';
  createdAt: string;
}

// Payment Verification Request (from Razorpay callback)
export interface VerifyPaymentRequest {
  orderId: string;
  razorpayPaymentId: string;
  razorpayOrderId: string;
  razorpaySignature: string;
}

// Payment Verification Response
export interface PaymentVerificationResponse {
  success: boolean;
  orderId: string;
  paymentId: string;
  amount: number;
  status: 'verified' | 'failed';
  message?: string;
}

// Razorpay Checkout Options
export interface RazorpayCheckoutOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  order_id: string;
  handler: (response: RazorpayResponse) => void;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme?: {
    color?: string;
  };
  modal?: {
    ondismiss?: () => void;
  };
}

// Razorpay Response from payment completion
export interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

class PaymentAPIService {
  private client: AxiosInstance;
  private baseURL: string;

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || 'https://api.hasivu.com';
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      config => {
        const token = this.getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      error => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      response => response,
      async error => {
        if (error.response?.status === 401) {
          console.warn('Unauthorized payment request - token may be expired');
        }
        return Promise.reject(error);
      }
    );
  }

  private getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('accessToken');
  }

  /**
   * Create a Razorpay payment order
   * Step 1 of payment flow: Create order on backend
   */
  async createPaymentOrder(request: CreatePaymentOrderRequest): Promise<PaymentOrderResponse> {
    try {
      const response = await this.client.post<PaymentOrderResponse>('/payments/orders', {
        ...request,
        currency: request.currency || 'INR',
      });
      return response.data;
    } catch (error) {
      console.error('Error creating payment order:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Verify payment after Razorpay checkout completion
   * Step 3 of payment flow: Verify payment signature on backend
   */
  async verifyPayment(verification: VerifyPaymentRequest): Promise<PaymentVerificationResponse> {
    try {
      const response = await this.client.post<PaymentVerificationResponse>(
        '/payments/verify',
        verification
      );
      return response.data;
    } catch (error) {
      console.error('Error verifying payment:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get payment status for an order
   * Useful for checking payment completion status
   */
  async getPaymentStatus(orderId: string): Promise<any> {
    try {
      const response = await this.client.get(`/payments/orders/${orderId}/status`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching payment status for order ${orderId}:`, error);
      throw this.handleError(error);
    }
  }

  /**
   * Initialize Razorpay checkout
   * Step 2 of payment flow: Open Razorpay modal
   * Returns a promise that resolves when payment succeeds or rejects when it fails
   */
  async initiateRazorpayCheckout(
    paymentOrder: PaymentOrderResponse,
    options: {
      userName?: string;
      userEmail?: string;
      userPhone?: string;
      onSuccess: (response: RazorpayResponse) => void;
      onFailure?: (error: any) => void;
      onDismiss?: () => void;
    }
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      // Check if Razorpay SDK is loaded
      if (typeof window === 'undefined' || !(window as any).Razorpay) {
        reject(new Error('Razorpay SDK not loaded'));
        return;
      }

      const razorpayOptions: RazorpayCheckoutOptions = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '',
        amount: paymentOrder.amount,
        currency: paymentOrder.currency,
        name: 'Hasivu Platform',
        description: 'Meal Order Payment',
        order_id: paymentOrder.razorpayOrderId,
        handler: (response: RazorpayResponse) => {
          options.onSuccess(response);
          resolve();
        },
        prefill: {
          name: options.userName,
          email: options.userEmail,
          contact: options.userPhone,
        },
        theme: {
          color: '#22c55e', // Hasivu green color
        },
        modal: {
          ondismiss: () => {
            if (options.onDismiss) {
              options.onDismiss();
            }
            reject(new Error('Payment cancelled by user'));
          },
        },
      };

      try {
        const razorpay = new (window as any).Razorpay(razorpayOptions);
        razorpay.on('payment.failed', (response: any) => {
          if (options.onFailure) {
            options.onFailure(response.error);
          }
          reject(response.error);
        });
        razorpay.open();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Complete payment flow helper
   * Orchestrates the entire payment process:
   * 1. Create payment order
   * 2. Open Razorpay checkout
   * 3. Verify payment
   * 4. Return verification result
   */
  async processPayment(
    orderId: string,
    amount: number,
    userInfo: {
      name?: string;
      email?: string;
      phone?: string;
    }
  ): Promise<PaymentVerificationResponse> {
    try {
      // Step 1: Create payment order
      const paymentOrder = await this.createPaymentOrder({
        orderId,
        amount,
        currency: 'INR',
        description: `Payment for order ${orderId}`,
      });

      // Step 2: Open Razorpay checkout and wait for completion
      const razorpayResponse = await new Promise<RazorpayResponse>((resolve, reject) => {
        this.initiateRazorpayCheckout(paymentOrder, {
          userName: userInfo.name,
          userEmail: userInfo.email,
          userPhone: userInfo.phone,
          onSuccess: resolve,
          onFailure: reject,
          onDismiss: () => reject(new Error('Payment cancelled')),
        });
      });

      // Step 3: Verify payment
      const verification = await this.verifyPayment({
        orderId,
        razorpayPaymentId: razorpayResponse.razorpay_payment_id,
        razorpayOrderId: razorpayResponse.razorpay_order_id,
        razorpaySignature: razorpayResponse.razorpay_signature,
      });

      return verification;
    } catch (error) {
      console.error('Payment processing failed:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Load Razorpay SDK script
   * Call this in useEffect or before initiating payment
   */
  loadRazorpayScript(): Promise<boolean> {
    return new Promise(resolve => {
      if (typeof window === 'undefined') {
        resolve(false);
        return;
      }

      // Check if already loaded
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }

  /**
   * Handle API errors
   */
  private handleError(error: any): Error {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.message || error.message || 'Payment error occurred';
      const errorObj = new Error(message);
      (errorObj as any).statusCode = error.response?.status;
      (errorObj as any).data = error.response?.data;
      return errorObj;
    }
    return error instanceof Error ? error : new Error('Unknown payment error occurred');
  }
}

// Export singleton instance
export const paymentAPIService = new PaymentAPIService();
export default paymentAPIService;
