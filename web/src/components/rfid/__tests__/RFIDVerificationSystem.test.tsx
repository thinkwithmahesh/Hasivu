import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import '@testing-library/jest-dom';
import { RFIDVerificationSystem } from '../RFIDVerificationSystem';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => children,
}));

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    pathname: '/',
  }),
  usePathname: () => '/',
}));

// Mock UI components
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
}));

jest.mock('@/components/ui/card', () => ({
  Card: ({ children }: any) => <div data-testid="card">{children}</div>,
  CardContent: ({ children }: any) => <div data-testid="card-content">{children}</div>,
  CardDescription: ({ children }: any) => <div data-testid="card-description">{children}</div>,
  CardHeader: ({ children }: any) => <div data-testid="card-header">{children}</div>,
  CardTitle: ({ children }: any) => <div data-testid="card-title">{children}</div>,
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, className }: any) => (
    <span className={className} data-testid="badge">
      {children}
    </span>
  ),
}));

jest.mock('@/components/ui/avatar', () => ({
  Avatar: ({ children }: any) => <div data-testid="avatar">{children}</div>,
  AvatarFallback: ({ children }: any) => <div data-testid="avatar-fallback">{children}</div>,
  AvatarImage: ({ src, alt }: any) => <img src={src} alt={alt} data-testid="avatar-image" />,
}));

jest.mock('@/components/ui/progress', () => ({
  Progress: ({ value }: any) => <div data-testid="progress" data-value={value} />,
}));

describe('RFIDVerificationSystem', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the main RFID verification interface', () => {
    render(<RFIDVerificationSystem />);
    
    expect(screen.getByText('RFID Verification System')).toBeInTheDocument();
    expect(screen.getByText('Real-time meal delivery verification and monitoring')).toBeInTheDocument();
  });

  it('displays system statistics', () => {
    render(<RFIDVerificationSystem />);
    
    expect(screen.getByText('1247')).toBeInTheDocument(); // Total scans
    expect(screen.getByText('99.7%')).toBeInTheDocument(); // Success rate
    expect(screen.getByText('0.3s')).toBeInTheDocument(); // Avg scan time
  });

  it('shows device status information', () => {
    render(<RFIDVerificationSystem />);
    
    expect(screen.getByText('Cafeteria Main Counter')).toBeInTheDocument();
    expect(screen.getByText('South Wing Counter')).toBeInTheDocument();
    expect(screen.getByText('Sports Complex Counter')).toBeInTheDocument();
  });

  it('displays transaction history', () => {
    render(<RFIDVerificationSystem />);
    
    expect(screen.getByText('Recent Transactions')).toBeInTheDocument();
    expect(screen.getByText('Priya Sharma')).toBeInTheDocument();
    expect(screen.getByText('Arjun Sharma')).toBeInTheDocument();
    expect(screen.getByText('Masala Dosa with Sambar')).toBeInTheDocument();
  });

  it('shows real-time monitor with scanner animation', () => {
    render(<RFIDVerificationSystem />);
    
    expect(screen.getByText('Real-Time RFID Monitor')).toBeInTheDocument();
    expect(screen.getByText('Ready to Scan')).toBeInTheDocument();
    expect(screen.getByText('Place RFID card near scanner')).toBeInTheDocument();
  });

  it('handles test scan button click', async () => {
    render(<RFIDVerificationSystem />);
    
    const testScanButton = screen.getByText('Test Scan');
    fireEvent.click(testScanButton);
    
    // The button should be disabled during scanning
    await waitFor(() => {
      expect(testScanButton).toBeDisabled();
    });
  });

  it('displays online device count', () => {
    render(<RFIDVerificationSystem />);
    
    // Should show 2/3 devices online based on mock data
    expect(screen.getByText('2/3 Online')).toBeInTheDocument();
  });

  it('shows device battery levels and signal strength', () => {
    render(<RFIDVerificationSystem />);
    
    expect(screen.getByText('85%')).toBeInTheDocument(); // Battery level
    expect(screen.getByText('95%')).toBeInTheDocument(); // Signal strength
    expect(screen.getByText('67%')).toBeInTheDocument(); // Another device battery
  });

  it('displays firmware versions', () => {
    render(<RFIDVerificationSystem />);
    
    expect(screen.getByText('v2.1.3')).toBeInTheDocument();
    expect(screen.getByText('v2.0.8')).toBeInTheDocument();
  });

  it('shows transaction status badges', () => {
    render(<RFIDVerificationSystem />);
    
    const badges = screen.getAllByTestId('badge');
    expect(badges.length).toBeGreaterThan(0);
  });

  it('displays nutrition scores in transactions', () => {
    render(<RFIDVerificationSystem />);
    
    expect(screen.getByText('Score: 88%')).toBeInTheDocument();
    expect(screen.getByText('Score: 85%')).toBeInTheDocument();
  });

  it('shows photo button for transactions with photos', () => {
    render(<RFIDVerificationSystem />);
    
    expect(screen.getByText('Photo')).toBeInTheDocument();
  });

  it('handles take photo button', () => {
    render(<RFIDVerificationSystem />);
    
    const takePhotoButton = screen.getByText('Take Photo');
    expect(takePhotoButton).toBeInTheDocument();
    
    fireEvent.click(takePhotoButton);
    // Photo functionality would be implemented with actual camera integration
  });
});
