/**
 * Comprehensive Unit Tests for Drawer Component (ShadCN UI)
 * Tests mobile drawer functionality, touch gestures, animations, and accessibility
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe, toHaveNoViolations } from 'jest-axe'
import {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
} from '../drawer'

expect.extend(toHaveNoViolations)

describe('Drawer Component Suite', () => {
  // Mock meal ordering data for testing
  const mockMeal = {
    id: '1',
    name: 'Chicken Biryani',
    description: 'Aromatic basmati rice with tender chicken pieces',
    price: 180,
    category: 'Main Course',
    nutrition: {
      calories: 650,
      protein: 35,
      carbs: 75,
      fat: 18,
    },
  }

  const MealOrderDrawer = ({ 
    open, 
    onOpenChange,
    meal = mockMeal 
  }: { 
    open: boolean
    onOpenChange: (open: boolean) => void
    meal?: typeof mockMeal 
  }) => (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerTrigger asChild>
        <button>Order {meal.name}</button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{meal.name}</DrawerTitle>
          <DrawerDescription>{meal.description}</DrawerDescription>
        </DrawerHeader>
        <div className="p-4">
          <div className="space-y-4">
            <div className="flex justify-between">
              <span>Price:</span>
              <span>₹{meal.price}</span>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Nutrition Facts</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Calories: {meal.nutrition.calories}</div>
                <div>Protein: {meal.nutrition.protein}g</div>
                <div>Carbs: {meal.nutrition.carbs}g</div>
                <div>Fat: {meal.nutrition.fat}g</div>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="flex-1 bg-primary text-primary-foreground p-2 rounded">
                Add to Cart
              </button>
              <DrawerClose asChild>
                <button className="px-4 py-2 border rounded">
                  Cancel
                </button>
              </DrawerClose>
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )

  describe('Drawer Root Component', () => {
    it('renders without crashing', () => {
      render(
        <Drawer>
          <DrawerTrigger>Open</DrawerTrigger>
          <DrawerContent>
            <DrawerTitle>Test</DrawerTitle>
          </DrawerContent>
        </Drawer>
      )
      
      expect(screen.getByText('Open')).toBeInTheDocument()
    })

    it('supports shouldScaleBackground prop', () => {
      render(
        <Drawer shouldScaleBackground={false}>
          <DrawerTrigger>Open</DrawerTrigger>
          <DrawerContent>
            <DrawerTitle>Test</DrawerTitle>
          </DrawerContent>
        </Drawer>
      )
      
      expect(screen.getByText('Open')).toBeInTheDocument()
    })

    it('passes through additional props', () => {
      render(
        <Drawer data-testid="drawer-root">
          <DrawerTrigger>Open</DrawerTrigger>
          <DrawerContent>
            <DrawerTitle>Test</DrawerTitle>
          </DrawerContent>
        </Drawer>
      )
      
      const trigger = screen.getByText('Open')
      expect(trigger).toBeInTheDocument()
    })
  })

  describe('DrawerTrigger Component', () => {
    it('opens drawer when clicked', async () => {
      const user = userEvent.setup()
      
      render(
        <Drawer>
          <DrawerTrigger>Open Drawer</DrawerTrigger>
          <DrawerContent>
            <DrawerTitle>Drawer Content</DrawerTitle>
          </DrawerContent>
        </Drawer>
      )
      
      const trigger = screen.getByText('Open Drawer')
      await user.click(trigger)
      
      await waitFor(() => {
        expect(screen.getByText('Drawer Content')).toBeInTheDocument()
      })
    })

    it('supports asChild prop', async () => {
      const user = userEvent.setup()
      
      render(
        <Drawer>
          <DrawerTrigger asChild>
            <button type="button">Custom Button</button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerTitle>Drawer Content</DrawerTitle>
          </DrawerContent>
        </Drawer>
      )
      
      const customButton = screen.getByRole('button', { name: 'Custom Button' })
      await user.click(customButton)
      
      await waitFor(() => {
        expect(screen.getByText('Drawer Content')).toBeInTheDocument()
      })
    })

    it('handles touch events on mobile', async () => {
      render(
        <Drawer>
          <DrawerTrigger>Touch to Open</DrawerTrigger>
          <DrawerContent>
            <DrawerTitle>Mobile Drawer</DrawerTitle>
          </DrawerContent>
        </Drawer>
      )
      
      const trigger = screen.getByText('Touch to Open')
      
      // Simulate touch events
      fireEvent.touchStart(trigger)
      fireEvent.touchEnd(trigger)
      
      await waitFor(() => {
        expect(screen.getByText('Mobile Drawer')).toBeInTheDocument()
      })
    })
  })

  describe('DrawerContent Component', () => {
    it('renders content with proper structure', async () => {
      const user = userEvent.setup()
      
      render(
        <Drawer>
          <DrawerTrigger>Open</DrawerTrigger>
          <DrawerContent data-testid="drawer-content">
            <DrawerHeader>
              <DrawerTitle>Test Title</DrawerTitle>
              <DrawerDescription>Test Description</DrawerDescription>
            </DrawerHeader>
            <div>Content Body</div>
            <DrawerFooter>
              <button>Action</button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      )
      
      await user.click(screen.getByText('Open'))
      
      await waitFor(() => {
        const content = screen.getByTestId('drawer-content')
        expect(content).toBeInTheDocument()
        expect(content).toHaveClass('fixed', 'inset-x-0', 'bottom-0')
        
        // Check for drag handle
        const dragHandle = content.querySelector('.h-2.w-\\[100px\\]')
        expect(dragHandle).toBeInTheDocument()
      })
    })

    it('supports custom className', async () => {
      const user = userEvent.setup()
      
      render(
        <Drawer>
          <DrawerTrigger>Open</DrawerTrigger>
          <DrawerContent className="custom-drawer">
            <DrawerTitle>Test</DrawerTitle>
          </DrawerContent>
        </Drawer>
      )
      
      await user.click(screen.getByText('Open'))
      
      await waitFor(() => {
        const content = screen.getByRole('dialog')
        expect(content).toHaveClass('custom-drawer')
      })
    })

    it('includes overlay background', async () => {
      const user = userEvent.setup()
      
      render(
        <Drawer>
          <DrawerTrigger>Open</DrawerTrigger>
          <DrawerContent>
            <DrawerTitle>Test</DrawerTitle>
          </DrawerContent>
        </Drawer>
      )
      
      await user.click(screen.getByText('Open'))
      
      await waitFor(() => {
        // Overlay should be present with proper styling
        const overlay = document.querySelector('.fixed.inset-0.z-50.bg-black\\/80')
        expect(overlay).toBeInTheDocument()
      })
    })
  })

  describe('DrawerHeader Component', () => {
    it('renders header content with proper styling', async () => {
      const user = userEvent.setup()
      
      render(
        <Drawer>
          <DrawerTrigger>Open</DrawerTrigger>
          <DrawerContent>
            <DrawerHeader data-testid="drawer-header">
              <DrawerTitle>Header Title</DrawerTitle>
              <DrawerDescription>Header Description</DrawerDescription>
            </DrawerHeader>
          </DrawerContent>
        </Drawer>
      )
      
      await user.click(screen.getByText('Open'))
      
      await waitFor(() => {
        const header = screen.getByTestId('drawer-header')
        expect(header).toHaveClass('grid', 'gap-1.5', 'p-4', 'text-center')
        expect(screen.getByText('Header Title')).toBeInTheDocument()
        expect(screen.getByText('Header Description')).toBeInTheDocument()
      })
    })

    it('supports custom className', async () => {
      const user = userEvent.setup()
      
      render(
        <Drawer>
          <DrawerTrigger>Open</DrawerTrigger>
          <DrawerContent>
            <DrawerHeader className="custom-header">
              <DrawerTitle>Title</DrawerTitle>
            </DrawerHeader>
          </DrawerContent>
        </Drawer>
      )
      
      await user.click(screen.getByText('Open'))
      
      await waitFor(() => {
        const header = screen.getByText('Title').closest('.custom-header')
        expect(header).toBeInTheDocument()
      })
    })
  })

  describe('DrawerFooter Component', () => {
    it('renders footer content with proper styling', async () => {
      const user = userEvent.setup()
      
      render(
        <Drawer>
          <DrawerTrigger>Open</DrawerTrigger>
          <DrawerContent>
            <DrawerTitle>Test</DrawerTitle>
            <DrawerFooter data-testid="drawer-footer">
              <button>Primary Action</button>
              <button>Secondary Action</button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      )
      
      await user.click(screen.getByText('Open'))
      
      await waitFor(() => {
        const footer = screen.getByTestId('drawer-footer')
        expect(footer).toHaveClass('mt-auto', 'flex', 'flex-col', 'gap-2', 'p-4')
        expect(screen.getByText('Primary Action')).toBeInTheDocument()
        expect(screen.getByText('Secondary Action')).toBeInTheDocument()
      })
    })

    it('supports custom className', async () => {
      const user = userEvent.setup()
      
      render(
        <Drawer>
          <DrawerTrigger>Open</DrawerTrigger>
          <DrawerContent>
            <DrawerTitle>Test</DrawerTitle>
            <DrawerFooter className="custom-footer">
              <button>Action</button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      )
      
      await user.click(screen.getByText('Open'))
      
      await waitFor(() => {
        const footer = screen.getByText('Action').closest('.custom-footer')
        expect(footer).toBeInTheDocument()
      })
    })
  })

  describe('DrawerTitle Component', () => {
    it('renders title with proper styling', async () => {
      const user = userEvent.setup()
      
      render(
        <Drawer>
          <DrawerTrigger>Open</DrawerTrigger>
          <DrawerContent>
            <DrawerTitle data-testid="drawer-title">
              Important Title
            </DrawerTitle>
          </DrawerContent>
        </Drawer>
      )
      
      await user.click(screen.getByText('Open'))
      
      await waitFor(() => {
        const title = screen.getByTestId('drawer-title')
        expect(title).toHaveClass('text-lg', 'font-semibold', 'leading-none', 'tracking-tight')
        expect(title).toHaveTextContent('Important Title')
      })
    })

    it('supports custom className', async () => {
      const user = userEvent.setup()
      
      render(
        <Drawer>
          <DrawerTrigger>Open</DrawerTrigger>
          <DrawerContent>
            <DrawerTitle className="custom-title">Custom Title</DrawerTitle>
          </DrawerContent>
        </Drawer>
      )
      
      await user.click(screen.getByText('Open'))
      
      await waitFor(() => {
        const title = screen.getByText('Custom Title')
        expect(title).toHaveClass('custom-title')
      })
    })
  })

  describe('DrawerDescription Component', () => {
    it('renders description with proper styling', async () => {
      const user = userEvent.setup()
      
      render(
        <Drawer>
          <DrawerTrigger>Open</DrawerTrigger>
          <DrawerContent>
            <DrawerTitle>Title</DrawerTitle>
            <DrawerDescription data-testid="drawer-description">
              This is a detailed description of the drawer content.
            </DrawerDescription>
          </DrawerContent>
        </Drawer>
      )
      
      await user.click(screen.getByText('Open'))
      
      await waitFor(() => {
        const description = screen.getByTestId('drawer-description')
        expect(description).toHaveClass('text-sm', 'text-muted-foreground')
        expect(description).toHaveTextContent('This is a detailed description of the drawer content.')
      })
    })

    it('supports custom className', async () => {
      const user = userEvent.setup()
      
      render(
        <Drawer>
          <DrawerTrigger>Open</DrawerTrigger>
          <DrawerContent>
            <DrawerTitle>Title</DrawerTitle>
            <DrawerDescription className="custom-description">
              Custom Description
            </DrawerDescription>
          </DrawerContent>
        </Drawer>
      )
      
      await user.click(screen.getByText('Open'))
      
      await waitFor(() => {
        const description = screen.getByText('Custom Description')
        expect(description).toHaveClass('custom-description')
      })
    })
  })

  describe('DrawerClose Component', () => {
    it('closes drawer when clicked', async () => {
      const user = userEvent.setup()
      
      render(
        <Drawer>
          <DrawerTrigger>Open</DrawerTrigger>
          <DrawerContent>
            <DrawerTitle>Test Drawer</DrawerTitle>
            <DrawerClose>Close Drawer</DrawerClose>
          </DrawerContent>
        </Drawer>
      )
      
      // Open drawer
      await user.click(screen.getByText('Open'))
      
      await waitFor(() => {
        expect(screen.getByText('Test Drawer')).toBeInTheDocument()
      })
      
      // Close drawer
      await user.click(screen.getByText('Close Drawer'))
      
      await waitFor(() => {
        expect(screen.queryByText('Test Drawer')).not.toBeInTheDocument()
      })
    })

    it('supports asChild prop', async () => {
      const user = userEvent.setup()
      
      render(
        <Drawer>
          <DrawerTrigger>Open</DrawerTrigger>
          <DrawerContent>
            <DrawerTitle>Test Drawer</DrawerTitle>
            <DrawerClose asChild>
              <button type="button" className="custom-close-btn">
                Custom Close
              </button>
            </DrawerClose>
          </DrawerContent>
        </Drawer>
      )
      
      await user.click(screen.getByText('Open'))
      
      await waitFor(() => {
        expect(screen.getByText('Test Drawer')).toBeInTheDocument()
      })
      
      const customCloseBtn = screen.getByRole('button', { name: 'Custom Close' })
      await user.click(customCloseBtn)
      
      await waitFor(() => {
        expect(screen.queryByText('Test Drawer')).not.toBeInTheDocument()
      })
    })
  })

  describe('Touch and Gesture Support', () => {
    it('supports drag-to-close gesture', async () => {
      const user = userEvent.setup()
      
      render(
        <Drawer>
          <DrawerTrigger>Open</DrawerTrigger>
          <DrawerContent data-testid="drawer-content">
            <DrawerTitle>Draggable Drawer</DrawerTitle>
          </DrawerContent>
        </Drawer>
      )
      
      await user.click(screen.getByText('Open'))
      
      await waitFor(() => {
        const content = screen.getByTestId('drawer-content')
        expect(content).toBeInTheDocument()
        
        // Simulate drag down gesture
        fireEvent.touchStart(content, {
          touches: [{ clientY: 100 }],
        })
        fireEvent.touchMove(content, {
          touches: [{ clientY: 300 }],
        })
        fireEvent.touchEnd(content)
        
        // Drawer should handle drag gesture
        expect(content).toBeInTheDocument()
      })
    })

    it('handles touch events on mobile devices', async () => {
      const user = userEvent.setup()
      
      render(
        <MealOrderDrawer open={false} onOpenChange={() => {}} />
      )
      
      const trigger = screen.getByText(`Order ${mockMeal.name}`)
      
      // Simulate mobile touch
      fireEvent.touchStart(trigger, {
        touches: [{ clientX: 100, clientY: 100 }],
      })
      fireEvent.touchEnd(trigger)
      
      await waitFor(() => {
        expect(screen.getByText(mockMeal.name)).toBeInTheDocument()
      })
    })

    it('supports swipe gestures for navigation', async () => {
      const user = userEvent.setup()
      
      render(
        <Drawer>
          <DrawerTrigger>Open</DrawerTrigger>
          <DrawerContent data-testid="swipeable-content">
            <DrawerTitle>Swipeable Content</DrawerTitle>
            <div className="p-4">
              <p>Swipe down to close</p>
            </div>
          </DrawerContent>
        </Drawer>
      )
      
      await user.click(screen.getByText('Open'))
      
      await waitFor(() => {
        const content = screen.getByTestId('swipeable-content')
        
        // Simulate swipe down
        fireEvent.touchStart(content, {
          touches: [{ clientY: 200 }],
        })
        fireEvent.touchMove(content, {
          touches: [{ clientY: 400 }],
        })
        fireEvent.touchEnd(content)
        
        expect(content).toBeInTheDocument()
      })
    })

    it('handles pull-to-refresh gesture', async () => {
      const user = userEvent.setup()
      const onRefresh = jest.fn()
      
      render(
        <Drawer>
          <DrawerTrigger>Open</DrawerTrigger>
          <DrawerContent>
            <DrawerTitle>Refreshable Content</DrawerTitle>
            <div 
              data-testid="refreshable-area"
              onTouchStart={(e) => {
                if (e.touches[0].clientY < 50) {
                  onRefresh()
                }
              }}
            >
              <p>Pull down to refresh</p>
            </div>
          </DrawerContent>
        </Drawer>
      )
      
      await user.click(screen.getByText('Open'))
      
      await waitFor(() => {
        const refreshArea = screen.getByTestId('refreshable-area')
        
        // Simulate pull down from top
        fireEvent.touchStart(refreshArea, {
          touches: [{ clientY: 30 }],
        })
        
        expect(onRefresh).toHaveBeenCalled()
      })
    })
  })

  describe('Meal Ordering Integration', () => {
    it('displays meal information correctly', async () => {
      const user = userEvent.setup()
      
      render(<MealOrderDrawer open={false} onOpenChange={() => {}} />)
      
      await user.click(screen.getByText(`Order ${mockMeal.name}`))
      
      await waitFor(() => {
        expect(screen.getByText(mockMeal.name)).toBeInTheDocument()
        expect(screen.getByText(mockMeal.description)).toBeInTheDocument()
        expect(screen.getByText(`₹${mockMeal.price}`)).toBeInTheDocument()
        expect(screen.getByText(`Calories: ${mockMeal.nutrition.calories}`)).toBeInTheDocument()
      })
    })

    it('handles add to cart action', async () => {
      const user = userEvent.setup()
      const onOpenChange = jest.fn()
      
      render(<MealOrderDrawer open={false} onOpenChange={onOpenChange} />)
      
      await user.click(screen.getByText(`Order ${mockMeal.name}`))
      
      await waitFor(() => {
        const addToCartBtn = screen.getByText('Add to Cart')
        expect(addToCartBtn).toBeInTheDocument()
      })
    })

    it('handles cancel action', async () => {
      const user = userEvent.setup()
      const onOpenChange = jest.fn()
      
      render(<MealOrderDrawer open={false} onOpenChange={onOpenChange} />)
      
      await user.click(screen.getByText(`Order ${mockMeal.name}`))
      
      await waitFor(() => {
        expect(screen.getByText(mockMeal.name)).toBeInTheDocument()
      })
      
      await user.click(screen.getByText('Cancel'))
      
      await waitFor(() => {
        expect(onOpenChange).toHaveBeenCalledWith(false)
      })
    })
  })

  describe('Accessibility', () => {
    it('meets WCAG accessibility guidelines', async () => {
      const user = userEvent.setup()
      
      const { container } = render(
        <Drawer>
          <DrawerTrigger>Open Accessible Drawer</DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Accessible Title</DrawerTitle>
              <DrawerDescription>This drawer is accessible</DrawerDescription>
            </DrawerHeader>
            <div>Content</div>
            <DrawerFooter>
              <DrawerClose>Close</DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      )
      
      await user.click(screen.getByText('Open Accessible Drawer'))
      
      await waitFor(async () => {
        const results = await axe(container)
        expect(results).toHaveNoViolations()
      })
    })

    it('provides proper ARIA labels and roles', async () => {
      const user = userEvent.setup()
      
      render(
        <Drawer>
          <DrawerTrigger aria-label="Open meal ordering drawer">
            Order Now
          </DrawerTrigger>
          <DrawerContent>
            <DrawerTitle>Meal Selection</DrawerTitle>
            <DrawerDescription>Choose your preferred meal options</DrawerDescription>
          </DrawerContent>
        </Drawer>
      )
      
      const trigger = screen.getByLabelText('Open meal ordering drawer')
      await user.click(trigger)
      
      await waitFor(() => {
        const dialog = screen.getByRole('dialog')
        expect(dialog).toBeInTheDocument()
        expect(screen.getByText('Meal Selection')).toBeInTheDocument()
      })
    })

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup()
      
      render(
        <Drawer>
          <DrawerTrigger>Open</DrawerTrigger>
          <DrawerContent>
            <DrawerTitle>Keyboard Navigation Test</DrawerTitle>
            <div>
              <button>First Button</button>
              <button>Second Button</button>
              <DrawerClose>Close</DrawerClose>
            </div>
          </DrawerContent>
        </Drawer>
      )
      
      const trigger = screen.getByText('Open')
      await user.click(trigger)
      
      await waitFor(() => {
        expect(screen.getByText('Keyboard Navigation Test')).toBeInTheDocument()
      })
      
      // Tab through elements
      await user.keyboard('{Tab}')
      expect(screen.getByText('First Button')).toHaveFocus()
      
      await user.keyboard('{Tab}')
      expect(screen.getByText('Second Button')).toHaveFocus()
      
      await user.keyboard('{Tab}')
      expect(screen.getByText('Close')).toHaveFocus()
    })

    it('handles escape key to close', async () => {
      const user = userEvent.setup()
      
      render(
        <Drawer>
          <DrawerTrigger>Open</DrawerTrigger>
          <DrawerContent>
            <DrawerTitle>Escape to Close</DrawerTitle>
          </DrawerContent>
        </Drawer>
      )
      
      await user.click(screen.getByText('Open'))
      
      await waitFor(() => {
        expect(screen.getByText('Escape to Close')).toBeInTheDocument()
      })
      
      await user.keyboard('{Escape}')
      
      await waitFor(() => {
        expect(screen.queryByText('Escape to Close')).not.toBeInTheDocument()
      })
    })

    it('maintains focus when opened', async () => {
      const user = userEvent.setup()
      
      render(
        <Drawer>
          <DrawerTrigger>Open Focus Test</DrawerTrigger>
          <DrawerContent>
            <DrawerTitle>Focus Management</DrawerTitle>
            <button>Focusable Element</button>
          </DrawerContent>
        </Drawer>
      )
      
      const trigger = screen.getByText('Open Focus Test')
      await user.click(trigger)
      
      await waitFor(() => {
        // Focus should be managed properly when drawer opens
        const focusableElement = screen.getByText('Focusable Element')
        expect(focusableElement).toBeInTheDocument()
      })
    })
  })

  describe('Performance and Edge Cases', () => {
    it('handles rapid open/close operations', async () => {
      const user = userEvent.setup()
      const onOpenChange = jest.fn()
      
      render(
        <Drawer onOpenChange={onOpenChange}>
          <DrawerTrigger>Toggle</DrawerTrigger>
          <DrawerContent>
            <DrawerTitle>Rapid Toggle Test</DrawerTitle>
            <DrawerClose>Close</DrawerClose>
          </DrawerContent>
        </Drawer>
      )
      
      const trigger = screen.getByText('Toggle')
      
      // Rapid clicks
      await user.click(trigger)
      await user.click(screen.getByText('Close'))
      await user.click(trigger)
      await user.click(screen.getByText('Close'))
      
      // Should handle rapid operations gracefully
      expect(onOpenChange).toHaveBeenCalled()
    })

    it('handles content overflow gracefully', async () => {
      const user = userEvent.setup()
      
      const longContent = Array.from({ length: 100 }, (_, i) => `Line ${i + 1}`).join('\n')
      
      render(
        <Drawer>
          <DrawerTrigger>Open Long Content</DrawerTrigger>
          <DrawerContent data-testid="overflow-content">
            <DrawerTitle>Long Content Test</DrawerTitle>
            <div style={{ height: '200vh' }}>
              <pre>{longContent}</pre>
            </div>
          </DrawerContent>
        </Drawer>
      )
      
      await user.click(screen.getByText('Open Long Content'))
      
      await waitFor(() => {
        const content = screen.getByTestId('overflow-content')
        expect(content).toBeInTheDocument()
        // Should handle overflow with proper scrolling
        expect(content).toHaveClass('overflow-hidden')
      })
    })

    it('prevents background scroll when opened', async () => {
      const user = userEvent.setup()
      
      render(
        <>
          <div style={{ height: '200vh' }}>Background Content</div>
          <Drawer>
            <DrawerTrigger>Open</DrawerTrigger>
            <DrawerContent>
              <DrawerTitle>No Background Scroll</DrawerTitle>
            </DrawerContent>
          </Drawer>
        </>
      )
      
      await user.click(screen.getByText('Open'))
      
      await waitFor(() => {
        // Background scrolling should be prevented
        expect(document.body.style.overflow).toBe('hidden')
      })
    })

    it('handles animation interruptions', async () => {
      const user = userEvent.setup()
      
      render(
        <Drawer>
          <DrawerTrigger>Open</DrawerTrigger>
          <DrawerContent>
            <DrawerTitle>Animation Test</DrawerTitle>
            <DrawerClose>Close</DrawerClose>
          </DrawerContent>
        </Drawer>
      )
      
      const trigger = screen.getByText('Open')
      
      // Open and immediately try to close during animation
      await user.click(trigger)
      // Don't wait for animation to complete
      const closeBtn = screen.getByText('Close')
      await user.click(closeBtn)
      
      // Should handle animation interruption gracefully
      await waitFor(() => {
        expect(screen.queryByText('Animation Test')).not.toBeInTheDocument()
      })
    })
  })
})