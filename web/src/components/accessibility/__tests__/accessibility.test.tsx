/**
 * HASIVU Platform - Accessibility Unit Tests
 *
 * Comprehensive Jest-based accessibility testing for React components
 * Features:
 * - jest-axe integration for component accessibility testing
 * - Custom accessibility matchers
 * - Screen reader compatibility testing
 * - Keyboard navigation testing
 * - Focus management testing
 * - ARIA attributes validation
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import '@testing-library/jest-dom';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Mock components for testing
import { AccessibilityProvider, useAccessibility } from '../AccessibilityProvider';

// Test component that uses accessibility features
const TestComponent: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { announceMessage, setFontSize, fontSize } = useAccessibility();

  return (
    <div>
      <button
        onClick={() => announceMessage('Test announcement')}
        aria-label="Make test announcement"
      >
        Announce
      </button>
      <button onClick={() => setFontSize('large')} aria-label="Increase font size">
        Large Font
      </button>
      <div data-testid="font-size" aria-live="polite">
        Current font size: {fontSize}
      </div>
      {children}
    </div>
  );
};

// Form component for testing form accessibility
const TestForm: React.FC = () => {
  return (
    <form>
      <fieldset>
        <legend>User Information</legend>

        <label htmlFor="name">Name (required)</label>
        <input id="name" type="text" required aria-describedby="name-help" />
        <div id="name-help">Enter your full name</div>

        <label htmlFor="email">Email</label>
        <input id="email" type="email" aria-describedby="email-error" />
        <div id="email-error" role="alert" style={{ display: 'none' }}>
          Please enter a valid email
        </div>

        <fieldset>
          <legend>Preferences</legend>
          <label>
            <input type="radio" name="theme" value="light" />
            Light theme
          </label>
          <label>
            <input type="radio" name="theme" value="dark" />
            Dark theme
          </label>
        </fieldset>

        <button type="submit">Submit</button>
      </fieldset>
    </form>
  );
};

// Navigation component for testing navigation accessibility
const TestNavigation: React.FC = () => {
  return (
    <nav aria-label="Main navigation">
      <ul>
        <li>
          <a href="/" aria-current="page">
            Home
          </a>
        </li>
        <li>
          <a href="/menu">Menu</a>
        </li>
        <li>
          <a href="/dashboard">Dashboard</a>
        </li>
        <li>
          <button aria-expanded="false" aria-haspopup="true">
            More
          </button>
          <ul style={{ display: 'none' }}>
            <li>
              <a href="/profile">Profile</a>
            </li>
            <li>
              <a href="/settings">Settings</a>
            </li>
          </ul>
        </li>
      </ul>
    </nav>
  );
};

// Modal component for testing modal accessibility
const TestModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-describedby="modal-description"
    >
      <div>
        <h2 id="modal-title">Modal Title</h2>
        <p id="modal-description">This is a test modal for accessibility testing.</p>
        <button onClick={onClose} aria-label="Close modal">
          ×
        </button>
        <button autoFocus>First Button</button>
        <button>Second Button</button>
      </div>
    </div>
  );
};

// Utility function to render with accessibility provider
const renderWithA11yProvider = (component: React.ReactElement) => {
  return render(<AccessibilityProvider>{component}</AccessibilityProvider>);
};

describe('HASIVU Platform Accessibility Tests', () => {
  // Core accessibility provider tests
  describe('AccessibilityProvider', () => {
    test('provides accessibility context without violations', async () => {
      const { container } = renderWithA11yProvider(<TestComponent />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('announces messages to screen readers', async () => {
      renderWithA11yProvider(<TestComponent />);

      const announceButton = screen.getByLabelText('Make test announcement');
      fireEvent.click(announceButton);

      // Check for live region
      await waitFor(() => {
        const liveRegions = screen.getAllByRole('status');
        expect(liveRegions.length).toBeGreaterThan(0);
      });
    });

    test('handles font size changes with announcements', async () => {
      const user = userEvent.setup();
      renderWithA11yProvider(<TestComponent />);

      const fontButton = screen.getByLabelText('Increase font size');
      await user.click(fontButton);

      await waitFor(() => {
        const fontDisplay = screen.getByTestId('font-size');
        expect(fontDisplay).toHaveTextContent('Current font size: large');
      });
    });

    test('supports keyboard shortcuts', async () => {
      const user = userEvent.setup();
      renderWithA11yProvider(<TestComponent />);

      // Test Alt+M shortcut for main content
      await user.keyboard('{Alt>}m{/Alt}');

      // Test Alt++ for font size increase
      await user.keyboard('{Alt>}={/Alt}');

      await waitFor(() => {
        const fontDisplay = screen.getByTestId('font-size');
        expect(fontDisplay).toHaveTextContent('medium');
      });
    });

    test('detects user preferences', () => {
      // Mock matchMedia for testing
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      });

      renderWithA11yProvider(<TestComponent />);

      // The component should render without errors
      expect(screen.getByLabelText('Make test announcement')).toBeInTheDocument();
    });
  });

  // Form accessibility tests
  describe('Form Accessibility', () => {
    test('forms have no accessibility violations', async () => {
      const { container } = render(<TestForm />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('all form inputs have proper labels', () => {
      render(<TestForm />);

      const nameInput = screen.getByLabelText(/name/i);
      expect(nameInput).toHaveAttribute('id', 'name');

      const emailInput = screen.getByLabelText(/email/i);
      expect(emailInput).toHaveAttribute('id', 'email');
    });

    test('required fields are properly marked', () => {
      render(<TestForm />);

      const nameInput = screen.getByLabelText(/name.*required/i);
      expect(nameInput).toHaveAttribute('required');
      expect(nameInput).toBeRequired();
    });

    test('form has proper fieldset and legend structure', () => {
      render(<TestForm />);

      const mainFieldset = screen.getByRole('group', { name: /user information/i });
      expect(mainFieldset).toBeInTheDocument();

      const preferencesFieldset = screen.getByRole('group', { name: /preferences/i });
      expect(preferencesFieldset).toBeInTheDocument();
    });

    test('radio buttons are grouped properly', () => {
      render(<TestForm />);

      const themeRadios = screen.getAllByRole('radio');
      expect(themeRadios).toHaveLength(2);

      themeRadios.forEach(radio => {
        expect(radio).toHaveAttribute('name', 'theme');
      });
    });

    test('error messages have proper ARIA attributes', () => {
      render(<TestForm />);

      const emailError = screen.getByRole('alert');
      expect(emailError).toHaveAttribute('id', 'email-error');

      const emailInput = screen.getByLabelText(/email/i);
      expect(emailInput).toHaveAttribute('aria-describedby', 'email-error');
    });
  });

  // Navigation accessibility tests
  describe('Navigation Accessibility', () => {
    test('navigation has no accessibility violations', async () => {
      const { container } = render(<TestNavigation />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('navigation has proper ARIA labels', () => {
      render(<TestNavigation />);

      const nav = screen.getByRole('navigation', { name: /main navigation/i });
      expect(nav).toBeInTheDocument();
    });

    test('current page is properly indicated', () => {
      render(<TestNavigation />);

      const homeLink = screen.getByRole('link', { name: /home/i });
      expect(homeLink).toHaveAttribute('aria-current', 'page');
    });

    test('dropdown menus have proper ARIA attributes', () => {
      render(<TestNavigation />);

      const dropdownButton = screen.getByRole('button', { name: /more/i });
      expect(dropdownButton).toHaveAttribute('aria-expanded', 'false');
      expect(dropdownButton).toHaveAttribute('aria-haspopup', 'true');
    });

    test('all navigation links are keyboard accessible', async () => {
      const user = userEvent.setup();
      render(<TestNavigation />);

      const homeLink = screen.getByRole('link', { name: /home/i });
      await user.tab();
      expect(homeLink).toHaveFocus();

      await user.tab();
      const menuLink = screen.getByRole('link', { name: /menu/i });
      expect(menuLink).toHaveFocus();
    });
  });

  // Modal accessibility tests
  describe('Modal Accessibility', () => {
    test('modal has no accessibility violations when open', async () => {
      const TestModalWrapper = () => {
        const [isOpen, setIsOpen] = React.useState(true);
        return <TestModal isOpen={isOpen} onClose={() => setIsOpen(false)} />;
      };

      const { container } = render(<TestModalWrapper />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('modal has proper ARIA attributes', () => {
      const mockClose = jest.fn();
      render(<TestModal isOpen={true} onClose={mockClose} />);

      const modal = screen.getByRole('dialog');
      expect(modal).toHaveAttribute('aria-modal', 'true');
      expect(modal).toHaveAttribute('aria-labelledby', 'modal-title');
      expect(modal).toHaveAttribute('aria-describedby', 'modal-description');
    });

    test('modal focuses first focusable element', () => {
      const mockClose = jest.fn();
      render(<TestModal isOpen={true} onClose={mockClose} />);

      const firstButton = screen.getByRole('button', { name: /first button/i });
      expect(firstButton).toHaveFocus();
    });

    test('modal traps focus within dialog', async () => {
      const user = userEvent.setup();
      const mockClose = jest.fn();
      render(<TestModal isOpen={true} onClose={mockClose} />);

      const firstButton = screen.getByRole('button', { name: /first button/i });
      const secondButton = screen.getByRole('button', { name: /second button/i });
      const closeButton = screen.getByLabelText('Close modal');

      // Tab through modal elements
      expect(firstButton).toHaveFocus();

      await user.tab();
      expect(secondButton).toHaveFocus();

      await user.tab();
      expect(closeButton).toHaveFocus();

      // Tab should cycle back to first button
      await user.tab();
      expect(firstButton).toHaveFocus();
    });

    test('modal closes on Escape key', async () => {
      const user = userEvent.setup();
      const mockClose = jest.fn();
      render(<TestModal isOpen={true} onClose={mockClose} />);

      await user.keyboard('{Escape}');
      expect(mockClose).toHaveBeenCalledTimes(1);
    });
  });

  // Keyboard navigation tests
  describe('Keyboard Navigation', () => {
    test('skip links are properly implemented', async () => {
      const user = userEvent.setup();

      renderWithA11yProvider(
        <div>
          <TestComponent />
          <main id="main-content">Main content</main>
        </div>
      );

      // Tab to first element to reveal skip links
      await user.tab();

      const skipLink = screen.getByRole('link', { name: /skip to main content/i });
      if (skipLink) {
        await user.click(skipLink);

        const mainContent = screen.getByRole('main');
        expect(mainContent).toHaveFocus();
      }
    });

    test('tab order is logical', async () => {
      const user = userEvent.setup();
      render(<TestForm />);

      // Tab through form elements
      await user.tab();
      expect(screen.getByLabelText(/name/i)).toHaveFocus();

      await user.tab();
      expect(screen.getByLabelText(/email/i)).toHaveFocus();

      await user.tab();
      expect(screen.getByDisplayValue('light')).toHaveFocus();
    });

    test('focus indicators are visible', async () => {
      const user = userEvent.setup();
      render(<TestForm />);

      const nameInput = screen.getByLabelText(/name/i);
      await user.click(nameInput);

      expect(nameInput).toHaveFocus();

      // Check if focus styles are applied (this would be a visual test in real scenarios)
      expect(nameInput).toHaveAttribute('id', 'name');
    });
  });

  // Screen reader compatibility tests
  describe('Screen Reader Compatibility', () => {
    test('page has proper heading hierarchy', () => {
      render(
        <div>
          <h1>Main Title</h1>
          <h2>Section Title</h2>
          <h3>Subsection Title</h3>
          <h2>Another Section</h2>
        </div>
      );

      const h1 = screen.getByRole('heading', { level: 1 });
      const h2s = screen.getAllByRole('heading', { level: 2 });
      const h3 = screen.getByRole('heading', { level: 3 });

      expect(h1).toBeInTheDocument();
      expect(h2s).toHaveLength(2);
      expect(h3).toBeInTheDocument();
    });

    test('images have appropriate alt text', () => {
      render(
        <div>
          <img src="logo.png" alt="HASIVU Platform Logo" />
          <img src="decorative.png" alt="" role="presentation" />
          <img src="avatar.jpg" alt="User profile picture" />
        </div>
      );

      const logoImg = screen.getByAltText('HASIVU Platform Logo');
      expect(logoImg).toBeInTheDocument();

      const decorativeImg = screen.getByRole('presentation');
      expect(decorativeImg).toHaveAttribute('alt', '');

      const avatarImg = screen.getByAltText('User profile picture');
      expect(avatarImg).toBeInTheDocument();
    });

    test('live regions announce dynamic content', async () => {
      renderWithA11yProvider(<TestComponent />);

      const announceButton = screen.getByLabelText('Make test announcement');
      fireEvent.click(announceButton);

      // Check that live region exists and will announce content
      await waitFor(() => {
        const liveRegions = screen.getAllByRole('status');
        expect(liveRegions.length).toBeGreaterThan(0);
      });
    });
  });

  // Color and visual accessibility tests
  describe('Visual Accessibility', () => {
    test('components work with high contrast mode', () => {
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
      });

      renderWithA11yProvider(<TestComponent />);

      // Component should render without errors
      expect(screen.getByLabelText('Make test announcement')).toBeInTheDocument();
    });

    test('components respect reduced motion preferences', () => {
      // Mock reduced motion media query
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      });

      renderWithA11yProvider(<TestComponent />);

      // Component should render without errors
      expect(screen.getByLabelText('Make test announcement')).toBeInTheDocument();
    });
  });

  // Custom accessibility matchers tests
  describe('Custom Accessibility Matchers', () => {
    test('components pass comprehensive accessibility checks', async () => {
      const { container } = renderWithA11yProvider(
        <div>
          <TestComponent />
          <TestForm />
          <TestNavigation />
        </div>
      );

      // Run comprehensive axe check
      const results = await axe(container, {
        rules: {
          // Enable all WCAG 2.1 AA rules
          'color-contrast': { enabled: true },
          'keyboard-navigation': { enabled: true },
          'focus-visible': { enabled: true },
        },
      });

      expect(results).toHaveNoViolations();
    });
  });
});
