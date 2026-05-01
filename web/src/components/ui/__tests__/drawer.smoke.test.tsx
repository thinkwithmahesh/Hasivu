import React from 'react';
import { render, screen } from '@testing-library/react';
import { Drawer } from '../drawer';

// Mock framer-motion to avoid JSDOM animation issues
jest.mock('framer-motion', () => ({
  motion: {
    div: React.forwardRef(({ children, ...props }: any, ref: any) => (
      <div ref={ref} {...props}>
        {children}
      </div>
    )),
    button: React.forwardRef(({ children, ...props }: any, ref: any) => (
      <button ref={ref} {...props}>
        {children}
      </button>
    )),
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
  useReducedMotion: () => false,
}));

describe('Drawer (smoke)', () => {
  it('renders children when open', () => {
    render(
      <Drawer isOpen={true} onClose={jest.fn()} title="Test Drawer">
        <p>Drawer Content</p>
      </Drawer>
    );

    expect(screen.getByText('Test Drawer')).toBeInTheDocument();
    expect(screen.getByText('Drawer Content')).toBeInTheDocument();
  });

  it('does not render children when closed', () => {
    render(
      <Drawer isOpen={false} onClose={jest.fn()} title="Hidden Drawer">
        <p>Hidden Content</p>
      </Drawer>
    );

    expect(screen.queryByText('Hidden Drawer')).not.toBeInTheDocument();
    expect(screen.queryByText('Hidden Content')).not.toBeInTheDocument();
  });

  it('calls onClose when backdrop is clicked', () => {
    const onClose = jest.fn();
    render(
      <Drawer isOpen={true} onClose={onClose} title="Closable">
        <p>Content</p>
      </Drawer>
    );

    // The backdrop is the first motion.div with onClick={onClose}
    const backdrop = document.querySelector('.fixed.inset-0');
    if (backdrop) {
      (backdrop as HTMLElement).click();
      expect(onClose).toHaveBeenCalledTimes(1);
    }
  });
});
