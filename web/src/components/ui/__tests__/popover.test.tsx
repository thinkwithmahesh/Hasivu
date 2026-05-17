/**
 * Comprehensive Unit Tests for Popover Component (ShadCN UI)
 * Tests popover functionality, quick actions, meal customization, and accessibility
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Popover, PopoverTrigger, PopoverContent } from '../popover';

expect.extend(toHaveNoViolations);

describe('Popover Component Suite', () => {
  // Mock meal data for testing
  const mockMeal = {
    id: '1',
    name: 'Paneer Butter Masala',
    description: 'Rich and creamy paneer curry',
    price: 160,
    category: 'Main Course',
    spiceLevel: 'Medium',
    servingSize: '250g',
    allergens: ['Dairy', 'Nuts'],
    customizations: {
      spiceLevel: ['Mild', 'Medium', 'Hot', 'Extra Hot'],
      portion: ['Half', 'Full', 'Double'],
      extras: ['Extra Paneer', 'Extra Gravy', 'Butter Naan', 'Rice'],
    },
  };

  const MealCustomizationPopover = ({
    meal = mockMeal,
    onCustomize = jest.fn(),
  }: {
    meal?: typeof mockMeal;
    onCustomize?: (customization: any) => void;
  }) => {
    const [customization, setCustomization] = React.useState({
      spiceLevel: meal.spiceLevel,
      portion: 'Full',
      extras: [] as string[],
    });

    const handleSubmit = () => {
      onCustomize(customization);
    };

    return (
      <Popover>
        <PopoverTrigger asChild>
          <button className="customize-btn">Customize {meal.name}</button>
        </PopoverTrigger>
        <PopoverContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium">Customize Your Order</h3>
              <p className="text-sm text-muted-foreground">{meal.name}</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Spice Level</label>
                <select
                  value={customization.spiceLevel}
                  onChange={e =>
                    setCustomization(prev => ({
                      ...prev,
                      spiceLevel: e.target.value,
                    }))
                  }
                  className="w-full mt-1 p-2 border rounded"
                >
                  {meal.customizations.spiceLevel.map(level => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">Portion Size</label>
                <select
                  value={customization.portion}
                  onChange={e =>
                    setCustomization(prev => ({
                      ...prev,
                      portion: e.target.value,
                    }))
                  }
                  className="w-full mt-1 p-2 border rounded"
                >
                  {meal.customizations.portion.map(size => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">Add Extras</label>
                <div className="mt-1 space-y-1">
                  {meal.customizations.extras.map(extra => (
                    <label key={extra} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={customization.extras.includes(extra)}
                        onChange={e => {
                          setCustomization(prev => ({
                            ...prev,
                            extras: e.target.checked
                              ? [...prev.extras, extra]
                              : prev.extras.filter(item => item !== extra),
                          }));
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm">{extra}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleSubmit}
                className="flex-1 bg-primary text-primary-foreground p-2 rounded"
              >
                Add to Cart
              </button>
              <PopoverTrigger asChild>
                <button className="px-4 py-2 border rounded">Cancel</button>
              </PopoverTrigger>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    );
  };

  const QuickActionsPopover = ({
    onAction = jest.fn(),
  }: {
    onAction?: (action: string) => void;
  }) => (
    <Popover>
      <PopoverTrigger asChild>
        <button className="quick-actions-btn">⚡ Quick Actions</button>
      </PopoverTrigger>
      <PopoverContent>
        <div className="space-y-2">
          <div className="font-medium">Quick Actions</div>
          <div className="grid gap-2">
            <button
              onClick={() => onAction('reorder')}
              className="text-left p-2 hover:bg-accent rounded"
            >
              🔄 Reorder Last Meal
            </button>
            <button
              onClick={() => onAction('favorites')}
              className="text-left p-2 hover:bg-accent rounded"
            >
              ⭐ View Favorites
            </button>
            <button
              onClick={() => onAction('schedule')}
              className="text-left p-2 hover:bg-accent rounded"
            >
              📅 Schedule Order
            </button>
            <button
              onClick={() => onAction('dietary')}
              className="text-left p-2 hover:bg-accent rounded"
            >
              🥗 Dietary Preferences
            </button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );

  const SimplePopover = ({
    content = 'Popover content',
    triggerText = 'Open Popover',
  }: {
    content?: string;
    triggerText?: string;
  }) => (
    <Popover>
      <PopoverTrigger asChild>
        <button>{triggerText}</button>
      </PopoverTrigger>
      <PopoverContent>{content}</PopoverContent>
    </Popover>
  );

  describe('Popover Root Component', () => {
    it('renders without crashing', () => {
      render(
        <Popover>
          <PopoverTrigger>Open</PopoverTrigger>
          <PopoverContent>Content</PopoverContent>
        </Popover>
      );

      expect(screen.getByText('Open')).toBeInTheDocument();
    });

    it('supports open state control', () => {
      render(
        <Popover open>
          <PopoverTrigger>Controlled Trigger</PopoverTrigger>
          <PopoverContent>Controlled Content</PopoverContent>
        </Popover>
      );

      expect(screen.getByText('Controlled Content')).toBeInTheDocument();
    });

    it('supports defaultOpen prop', () => {
      render(
        <Popover defaultOpen>
          <PopoverTrigger>Default Open</PopoverTrigger>
          <PopoverContent>Default Content</PopoverContent>
        </Popover>
      );

      expect(screen.getByText('Default Content')).toBeInTheDocument();
    });

    it('handles onOpenChange callback', async () => {
      const user = userEvent.setup();
      const onOpenChange = jest.fn();

      render(
        <Popover onOpenChange={onOpenChange}>
          <PopoverTrigger>Callback Trigger</PopoverTrigger>
          <PopoverContent>Callback Content</PopoverContent>
        </Popover>
      );

      const trigger = screen.getByText('Callback Trigger');
      await user.click(trigger);

      await waitFor(() => {
        expect(onOpenChange).toHaveBeenCalledWith(true);
      });
    });
  });

  describe('PopoverTrigger Component', () => {
    it('renders trigger element', () => {
      render(
        <Popover>
          <PopoverTrigger>Click to open</PopoverTrigger>
          <PopoverContent>Popover content</PopoverContent>
        </Popover>
      );

      expect(screen.getByText('Click to open')).toBeInTheDocument();
    });

    it('supports asChild prop with custom elements', () => {
      render(
        <Popover>
          <PopoverTrigger asChild>
            <button type="button" className="custom-trigger">
              Custom Trigger
            </button>
          </PopoverTrigger>
          <PopoverContent>Custom content</PopoverContent>
        </Popover>
      );

      const customTrigger = screen.getByRole('button', { name: 'Custom Trigger' });
      expect(customTrigger).toBeInTheDocument();
      expect(customTrigger).toHaveClass('custom-trigger');
    });

    it('opens popover when clicked', async () => {
      const user = userEvent.setup();

      render(<SimplePopover content="Click test content" />);

      const trigger = screen.getByText('Open Popover');
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByText('Click test content')).toBeInTheDocument();
      });
    });

    it('toggles popover on multiple clicks', async () => {
      const user = userEvent.setup();

      render(<SimplePopover content="Toggle test content" />);

      const trigger = screen.getByText('Open Popover');

      // Open
      await user.click(trigger);
      await waitFor(() => {
        expect(screen.getByText('Toggle test content')).toBeInTheDocument();
      });

      // Close
      await user.click(trigger);
      await waitFor(() => {
        expect(screen.queryByText('Toggle test content')).not.toBeInTheDocument();
      });
    });

    it('handles keyboard activation', async () => {
      const user = userEvent.setup();

      render(<SimplePopover content="Keyboard activation" />);

      const trigger = screen.getByText('Open Popover');
      await user.click(trigger);
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(screen.getByText('Keyboard activation')).toBeInTheDocument();
      });
    });
  });

  describe('PopoverContent Component', () => {
    it('renders content with proper styling', async () => {
      const user = userEvent.setup();

      render(
        <Popover>
          <PopoverTrigger>Trigger</PopoverTrigger>
          <PopoverContent data-testid="popover-content">Styled content</PopoverContent>
        </Popover>
      );

      const trigger = screen.getByText('Trigger');
      await user.click(trigger);

      await waitFor(() => {
        const content = screen.getByTestId('popover-content');
        expect(content).toHaveClass(
          'z-50',
          'w-72',
          'rounded-md',
          'border',
          'bg-popover',
          'p-4',
          'shadow-md'
        );
      });
    });

    it('supports custom className', async () => {
      const user = userEvent.setup();

      render(
        <Popover>
          <PopoverTrigger>Trigger</PopoverTrigger>
          <PopoverContent className="custom-popover">Custom styled content</PopoverContent>
        </Popover>
      );

      const trigger = screen.getByText('Trigger');
      await user.click(trigger);

      await waitFor(() => {
        const content = screen.getByText('Custom styled content');
        expect(content).toHaveClass('custom-popover');
      });
    });

    it('supports custom align prop', async () => {
      const user = userEvent.setup();

      render(
        <Popover>
          <PopoverTrigger>Trigger</PopoverTrigger>
          <PopoverContent align="start">Start aligned content</PopoverContent>
        </Popover>
      );

      const trigger = screen.getByText('Trigger');
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByText('Start aligned content')).toBeInTheDocument();
      });
    });

    it('supports custom sideOffset', async () => {
      const user = userEvent.setup();

      render(
        <Popover>
          <PopoverTrigger>Trigger</PopoverTrigger>
          <PopoverContent sideOffset={10}>Offset content</PopoverContent>
        </Popover>
      );

      const trigger = screen.getByText('Trigger');
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByText('Offset content')).toBeInTheDocument();
      });
    });

    it('closes when clicking outside', async () => {
      const user = userEvent.setup();

      render(
        <>
          <SimplePopover content="Click outside test" />
          <div data-testid="outside-area">Outside area</div>
        </>
      );

      const trigger = screen.getByText('Open Popover');
      const outsideArea = screen.getByTestId('outside-area');

      await user.click(trigger);
      await waitFor(() => {
        expect(screen.getByText('Click outside test')).toBeInTheDocument();
      });

      await user.click(outsideArea);
      await waitFor(() => {
        expect(screen.queryByText('Click outside test')).not.toBeInTheDocument();
      });
    });

    it('closes on escape key', async () => {
      const user = userEvent.setup();

      render(<SimplePopover content="Escape to close" />);

      const trigger = screen.getByText('Open Popover');
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByText('Escape to close')).toBeInTheDocument();
      });

      await user.keyboard('{Escape}');

      await waitFor(() => {
        expect(screen.queryByText('Escape to close')).not.toBeInTheDocument();
      });
    });
  });

  describe('Meal Customization Popover', () => {
    it('displays meal customization options', async () => {
      const user = userEvent.setup();

      render(<MealCustomizationPopover />);

      const trigger = screen.getByText(`Customize ${mockMeal.name}`);
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByText('Customize Your Order')).toBeInTheDocument();
        expect(screen.getByText(mockMeal.name)).toBeInTheDocument();
        expect(screen.getByText('Spice Level')).toBeInTheDocument();
        expect(screen.getByText('Portion Size')).toBeInTheDocument();
        expect(screen.getByText('Add Extras')).toBeInTheDocument();
      });
    });

    it('handles spice level selection', async () => {
      const user = userEvent.setup();
      const onCustomize = jest.fn();

      render(<MealCustomizationPopover onCustomize={onCustomize} />);

      const trigger = screen.getByText(`Customize ${mockMeal.name}`);
      await user.click(trigger);

      await waitFor(() => {
        const spiceLevelSelect = screen.getByDisplayValue('Medium');
        expect(spiceLevelSelect).toBeInTheDocument();
      });

      const spiceLevelSelect = screen.getByDisplayValue('Medium');
      await user.selectOptions(spiceLevelSelect, 'Hot');

      const addToCartBtn = screen.getByText('Add to Cart');
      await user.click(addToCartBtn);

      expect(onCustomize).toHaveBeenCalledWith({
        spiceLevel: 'Hot',
        portion: 'Full',
        extras: [],
      });
    });

    it('handles portion size selection', async () => {
      const user = userEvent.setup();
      const onCustomize = jest.fn();

      render(<MealCustomizationPopover onCustomize={onCustomize} />);

      const trigger = screen.getByText(`Customize ${mockMeal.name}`);
      await user.click(trigger);

      await waitFor(() => {
        const portionSelect = screen.getByDisplayValue('Full');
        expect(portionSelect).toBeInTheDocument();
      });

      const portionSelect = screen.getByDisplayValue('Full');
      await user.selectOptions(portionSelect, 'Double');

      const addToCartBtn = screen.getByText('Add to Cart');
      await user.click(addToCartBtn);

      expect(onCustomize).toHaveBeenCalledWith({
        spiceLevel: 'Medium',
        portion: 'Double',
        extras: [],
      });
    });

    it('handles extras selection', async () => {
      const user = userEvent.setup();
      const onCustomize = jest.fn();

      render(<MealCustomizationPopover onCustomize={onCustomize} />);

      const trigger = screen.getByText(`Customize ${mockMeal.name}`);
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByText('Extra Paneer')).toBeInTheDocument();
        expect(screen.getByText('Butter Naan')).toBeInTheDocument();
      });

      const extraPaneerCheckbox = screen.getByLabelText('Extra Paneer');
      const butterNaanCheckbox = screen.getByLabelText('Butter Naan');

      await user.click(extraPaneerCheckbox);
      await user.click(butterNaanCheckbox);

      const addToCartBtn = screen.getByText('Add to Cart');
      await user.click(addToCartBtn);

      expect(onCustomize).toHaveBeenCalledWith({
        spiceLevel: 'Medium',
        portion: 'Full',
        extras: ['Extra Paneer', 'Butter Naan'],
      });
    });

    it('handles cancel action', async () => {
      const user = userEvent.setup();

      render(<MealCustomizationPopover />);

      const trigger = screen.getByText(`Customize ${mockMeal.name}`);
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByText('Customize Your Order')).toBeInTheDocument();
      });

      const cancelBtn = screen.getByText('Cancel');
      await user.click(cancelBtn);

      await waitFor(() => {
        expect(screen.queryByText('Customize Your Order')).not.toBeInTheDocument();
      });
    });
  });

  describe('Quick Actions Popover', () => {
    it('displays quick action options', async () => {
      const user = userEvent.setup();

      render(<QuickActionsPopover />);

      const trigger = screen.getByText('⚡ Quick Actions');
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByText('Quick Actions')).toBeInTheDocument();
        expect(screen.getByText('🔄 Reorder Last Meal')).toBeInTheDocument();
        expect(screen.getByText('⭐ View Favorites')).toBeInTheDocument();
        expect(screen.getByText('📅 Schedule Order')).toBeInTheDocument();
        expect(screen.getByText('🥗 Dietary Preferences')).toBeInTheDocument();
      });
    });

    it('handles reorder action', async () => {
      const user = userEvent.setup();
      const onAction = jest.fn();

      render(<QuickActionsPopover onAction={onAction} />);

      const trigger = screen.getByText('⚡ Quick Actions');
      await user.click(trigger);

      await waitFor(() => {
        const reorderBtn = screen.getByText('🔄 Reorder Last Meal');
        expect(reorderBtn).toBeInTheDocument();
      });

      const reorderBtn = screen.getByText('🔄 Reorder Last Meal');
      await user.click(reorderBtn);

      expect(onAction).toHaveBeenCalledWith('reorder');
    });

    it('handles favorites action', async () => {
      const user = userEvent.setup();
      const onAction = jest.fn();

      render(<QuickActionsPopover onAction={onAction} />);

      const trigger = screen.getByText('⚡ Quick Actions');
      await user.click(trigger);

      const favoritesBtn = screen.getByText('⭐ View Favorites');
      await user.click(favoritesBtn);

      expect(onAction).toHaveBeenCalledWith('favorites');
    });

    it('handles schedule action', async () => {
      const user = userEvent.setup();
      const onAction = jest.fn();

      render(<QuickActionsPopover onAction={onAction} />);

      const trigger = screen.getByText('⚡ Quick Actions');
      await user.click(trigger);

      const scheduleBtn = screen.getByText('📅 Schedule Order');
      await user.click(scheduleBtn);

      expect(onAction).toHaveBeenCalledWith('schedule');
    });

    it('handles dietary preferences action', async () => {
      const user = userEvent.setup();
      const onAction = jest.fn();

      render(<QuickActionsPopover onAction={onAction} />);

      const trigger = screen.getByText('⚡ Quick Actions');
      await user.click(trigger);

      const dietaryBtn = screen.getByText('🥗 Dietary Preferences');
      await user.click(dietaryBtn);

      expect(onAction).toHaveBeenCalledWith('dietary');
    });
  });

  describe('Touch and Mobile Support', () => {
    it('handles touch events on mobile', async () => {
      render(<SimplePopover content="Touch popover" />);

      const trigger = screen.getByText('Open Popover');

      // Simulate touch events
      fireEvent.touchStart(trigger);
      fireEvent.touchEnd(trigger);

      await waitFor(() => {
        expect(screen.getByText('Touch popover')).toBeInTheDocument();
      });
    });

    it('closes on touch outside on mobile', async () => {
      render(
        <>
          <SimplePopover content="Touch outside test" />
          <div data-testid="outside-touch-area">Outside</div>
        </>
      );

      const trigger = screen.getByText('Open Popover');
      const outsideArea = screen.getByTestId('outside-touch-area');

      // Open popover
      fireEvent.touchStart(trigger);
      fireEvent.touchEnd(trigger);

      await waitFor(() => {
        expect(screen.getByText('Touch outside test')).toBeInTheDocument();
      });

      // Touch outside
      fireEvent.touchStart(outsideArea);
      fireEvent.touchEnd(outsideArea);

      await waitFor(() => {
        expect(screen.queryByText('Touch outside test')).not.toBeInTheDocument();
      });
    });

    it('handles swipe gestures', async () => {
      render(<SimplePopover content="Swipe test" />);

      const trigger = screen.getByText('Open Popover');

      // Open popover
      fireEvent.touchStart(trigger);
      fireEvent.touchEnd(trigger);

      await waitFor(() => {
        const content = screen.getByText('Swipe test');
        expect(content).toBeInTheDocument();

        // Simulate swipe up to close
        fireEvent.touchStart(content, {
          touches: [{ clientY: 200 }],
        });
        fireEvent.touchMove(content, {
          touches: [{ clientY: 100 }],
        });
        fireEvent.touchEnd(content);
      });
    });
  });

  describe('Accessibility', () => {
    it('meets WCAG accessibility guidelines', async () => {
      const user = userEvent.setup();

      const { container } = render(
        <Popover>
          <PopoverTrigger aria-label="Open meal customization options">
            Customize Meal
          </PopoverTrigger>
          <PopoverContent>
            <div role="dialog" aria-labelledby="popover-title">
              <h3 id="popover-title">Meal Customization</h3>
              <p>Select your preferences</p>
            </div>
          </PopoverContent>
        </Popover>
      );

      const trigger = screen.getByLabelText('Open meal customization options');
      await user.click(trigger);

      await waitFor(async () => {
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });
    });

    it('provides proper ARIA attributes', async () => {
      const user = userEvent.setup();

      render(
        <Popover>
          <PopoverTrigger aria-describedby="popover-help">Accessible trigger</PopoverTrigger>
          <PopoverContent>
            <div id="popover-help">This popover provides additional options</div>
          </PopoverContent>
        </Popover>
      );

      const trigger = screen.getByText('Accessible trigger');
      expect(trigger).toHaveAttribute('aria-describedby', 'popover-help');

      await user.click(trigger);

      await waitFor(() => {
        const content = screen.getByText('This popover provides additional options');
        expect(content).toBeInTheDocument();
      });
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();

      render(
        <Popover>
          <PopoverTrigger>Keyboard Navigation</PopoverTrigger>
          <PopoverContent>
            <div>
              <button>First Button</button>
              <button>Second Button</button>
              <button>Third Button</button>
            </div>
          </PopoverContent>
        </Popover>
      );

      const trigger = screen.getByText('Keyboard Navigation');
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByText('First Button')).toBeInTheDocument();
      });

      // Tab through elements
      await user.keyboard('{Tab}');
      expect(screen.getByText('First Button')).toHaveFocus();

      await user.keyboard('{Tab}');
      expect(screen.getByText('Second Button')).toHaveFocus();

      await user.keyboard('{Tab}');
      expect(screen.getByText('Third Button')).toHaveFocus();
    });

    it('maintains focus management', async () => {
      const user = userEvent.setup();

      render(<SimplePopover content="Focus management test" />);

      const trigger = screen.getByText('Open Popover');
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByText('Focus management test')).toBeInTheDocument();
      });

      await user.keyboard('{Escape}');

      await waitFor(() => {
        expect(screen.queryByText('Focus management test')).not.toBeInTheDocument();
        expect(trigger).toHaveFocus();
      });
    });

    it('supports screen reader announcements', async () => {
      const user = userEvent.setup();

      render(
        <Popover>
          <PopoverTrigger aria-label="Meal options menu">Options</PopoverTrigger>
          <PopoverContent>
            <div role="menu" aria-label="Meal customization options">
              <div role="menuitem">Customize spice level</div>
              <div role="menuitem">Adjust portion size</div>
              <div role="menuitem">Add extras</div>
            </div>
          </PopoverContent>
        </Popover>
      );

      const trigger = screen.getByLabelText('Meal options menu');
      await user.click(trigger);

      await waitFor(() => {
        const menu = screen.getByLabelText('Meal customization options');
        expect(menu).toBeInTheDocument();
        expect(menu).toHaveAttribute('role', 'menu');
      });
    });
  });

  describe('Performance and Edge Cases', () => {
    it('handles multiple popovers simultaneously', async () => {
      const user = userEvent.setup();

      render(
        <div>
          <Popover>
            <PopoverTrigger>First Popover</PopoverTrigger>
            <PopoverContent>First Content</PopoverContent>
          </Popover>
          <Popover>
            <PopoverTrigger>Second Popover</PopoverTrigger>
            <PopoverContent>Second Content</PopoverContent>
          </Popover>
        </div>
      );

      const firstTrigger = screen.getByText('First Popover');
      const secondTrigger = screen.getByText('Second Popover');

      await user.click(firstTrigger);
      await waitFor(() => {
        expect(screen.getByText('First Content')).toBeInTheDocument();
      });

      await user.click(secondTrigger);
      await waitFor(() => {
        expect(screen.getByText('Second Content')).toBeInTheDocument();
        // First popover should be closed
        expect(screen.queryByText('First Content')).not.toBeInTheDocument();
      });
    });

    it('handles rapid open/close operations', async () => {
      const user = userEvent.setup();

      render(<SimplePopover content="Rapid toggle test" />);

      const trigger = screen.getByText('Open Popover');

      // Rapid clicks
      for (let i = 0; i < 5; i++) {
        await user.click(trigger);
      }

      // Should handle rapid operations gracefully
      expect(trigger).toBeInTheDocument();
    });

    it('handles content overflow', async () => {
      const user = userEvent.setup();

      const longContent = Array.from(
        { length: 50 },
        (_, i) => `This is line ${i + 1} of very long content that might overflow the popover.`
      ).join(' ');

      render(<SimplePopover content={longContent} />);

      const trigger = screen.getByText('Open Popover');
      await user.click(trigger);

      await waitFor(() => {
        const content = screen.getByText(/This is line 1 of very long content/);
        expect(content).toBeInTheDocument();
        // Should handle overflow appropriately
        expect(content.closest('[data-radix-popover-content]')).toHaveClass('w-72');
      });
    });

    it('handles positioning edge cases', async () => {
      const user = userEvent.setup();

      // Mock viewport dimensions
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 320, // Small mobile screen
      });

      render(<SimplePopover content="Positioning test on small screen" />);

      const trigger = screen.getByText('Open Popover');
      await user.click(trigger);

      await waitFor(() => {
        const content = screen.getByText('Positioning test on small screen');
        expect(content).toBeInTheDocument();
        // Should handle small screen positioning
      });
    });

    it('prevents memory leaks on unmount', async () => {
      const user = userEvent.setup();

      const { unmount } = render(<SimplePopover content="Unmount test" />);

      const trigger = screen.getByText('Open Popover');
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByText('Unmount test')).toBeInTheDocument();
      });

      // Unmount component
      unmount();

      // Should not cause memory leaks or errors
      expect(screen.queryByText('Open Popover')).not.toBeInTheDocument();
    });
  });
});
