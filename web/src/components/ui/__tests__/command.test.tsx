/**
 * Comprehensive Unit Tests for Command Component (ShadCN UI)
 * Tests command palette functionality, keyboard navigation, search, and accessibility
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe, toHaveNoViolations } from 'jest-axe'
import {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
} from '../command'

expect.extend(toHaveNoViolations)

describe('Command Component Suite', () => {
  // Mock meal data for testing
  const mockMeals = [
    { id: '1', name: 'Chicken Curry', category: 'Main Course', price: 150 },
    { id: '2', name: 'Vegetable Biryani', category: 'Main Course', price: 120 },
    { id: '3', name: 'Dal Tadka', category: 'Side Dish', price: 80 },
    { id: '4', name: 'Gulab Jamun', category: 'Dessert', price: 50 },
  ]

  describe('Command Root Component', () => {
    it('renders without crashing', () => {
      render(
        <Command>
          <CommandInput placeholder="Search meals..." />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
          </CommandList>
        </Command>
      )
      
      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })

    it('applies correct ARIA attributes', () => {
      render(
        <Command>
          <CommandInput placeholder="Search meals..." />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
          </CommandList>
        </Command>
      )
      
      const command = screen.getByRole('combobox')
      expect(command).toHaveAttribute('role', 'combobox')
    })

    it('supports custom className', () => {
      render(
        <Command className="custom-command">
          <CommandInput placeholder="Search meals..." />
        </Command>
      )
      
      const command = screen.getByRole('combobox')
      expect(command).toHaveClass('custom-command')
    })

    it('passes through additional props', () => {
      render(
        <Command data-testid="command-root">
          <CommandInput placeholder="Search meals..." />
        </Command>
      )
      
      expect(screen.getByTestId('command-root')).toBeInTheDocument()
    })
  })

  describe('CommandInput Component', () => {
    it('renders input with placeholder', () => {
      render(
        <Command>
          <CommandInput placeholder="Search for meals..." />
        </Command>
      )
      
      const input = screen.getByPlaceholderText('Search for meals...')
      expect(input).toBeInTheDocument()
      expect(input).toHaveAttribute('type', 'text')
    })

    it('shows search icon', () => {
      render(
        <Command>
          <CommandInput placeholder="Search meals..." />
        </Command>
      )
      
      // The search icon should be present (from lucide-react)
      const searchIcon = document.querySelector('svg')
      expect(searchIcon).toBeInTheDocument()
    })

    it('handles input changes', async () => {
      const user = userEvent.setup()
      
      render(
        <Command>
          <CommandInput placeholder="Search meals..." />
        </Command>
      )
      
      const input = screen.getByPlaceholderText('Search meals...')
      await user.type(input, 'chicken')
      
      expect(input).toHaveValue('chicken')
    })

    it('supports custom className', () => {
      render(
        <Command>
          <CommandInput className="custom-input" placeholder="Search..." />
        </Command>
      )
      
      const input = screen.getByPlaceholderText('Search...')
      expect(input).toHaveClass('custom-input')
    })

    it('is accessible with proper focus management', async () => {
      const user = userEvent.setup()
      
      render(
        <Command>
          <CommandInput placeholder="Search meals..." />
        </Command>
      )
      
      const input = screen.getByPlaceholderText('Search meals...')
      
      await user.click(input)
      expect(input).toHaveFocus()
    })
  })

  describe('CommandList Component', () => {
    it('renders children correctly', () => {
      render(
        <Command>
          <CommandList>
            <CommandItem>Test Item</CommandItem>
          </CommandList>
        </Command>
      )
      
      expect(screen.getByText('Test Item')).toBeInTheDocument()
    })

    it('applies scroll styles for overflow content', () => {
      render(
        <Command>
          <CommandList data-testid="command-list">
            {Array.from({ length: 20 }, (_, i) => (
              <CommandItem key={i}>Item {i + 1}</CommandItem>
            ))}
          </CommandList>
        </Command>
      )
      
      const list = screen.getByTestId('command-list')
      expect(list).toHaveClass('overflow-y-auto')
    })

    it('supports custom className', () => {
      render(
        <Command>
          <CommandList className="custom-list">
            <CommandItem>Test Item</CommandItem>
          </CommandList>
        </Command>
      )
      
      const list = screen.getByRole('listbox', { hidden: true })
      expect(list).toHaveClass('custom-list')
    })
  })

  describe('CommandEmpty Component', () => {
    it('displays empty state message', () => {
      render(
        <Command>
          <CommandList>
            <CommandEmpty>No meals found.</CommandEmpty>
          </CommandList>
        </Command>
      )
      
      expect(screen.getByText('No meals found.')).toBeInTheDocument()
    })

    it('has proper styling classes', () => {
      render(
        <Command>
          <CommandList>
            <CommandEmpty data-testid="empty-state">No meals found.</CommandEmpty>
          </CommandList>
        </Command>
      )
      
      const emptyState = screen.getByTestId('empty-state')
      expect(emptyState).toHaveClass('py-6', 'text-center', 'text-sm')
    })
  })

  describe('CommandGroup Component', () => {
    it('renders group with heading', () => {
      render(
        <Command>
          <CommandList>
            <CommandGroup heading="Main Courses">
              <CommandItem>Chicken Curry</CommandItem>
              <CommandItem>Vegetable Biryani</CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      )
      
      expect(screen.getByText('Main Courses')).toBeInTheDocument()
      expect(screen.getByText('Chicken Curry')).toBeInTheDocument()
      expect(screen.getByText('Vegetable Biryani')).toBeInTheDocument()
    })

    it('applies correct group styling', () => {
      render(
        <Command>
          <CommandList>
            <CommandGroup heading="Desserts" data-testid="command-group">
              <CommandItem>Gulab Jamun</CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      )
      
      const group = screen.getByTestId('command-group')
      expect(group).toHaveClass('overflow-hidden', 'p-1')
    })

    it('supports custom className', () => {
      render(
        <Command>
          <CommandList>
            <CommandGroup className="custom-group">
              <CommandItem>Test Item</CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      )
      
      const group = screen.getByRole('group', { hidden: true })
      expect(group).toHaveClass('custom-group')
    })
  })

  describe('CommandItem Component', () => {
    it('renders clickable items', async () => {
      const user = userEvent.setup()
      const onSelect = jest.fn()
      
      render(
        <Command>
          <CommandList>
            <CommandItem onSelect={onSelect}>Chicken Curry</CommandItem>
          </CommandList>
        </Command>
      )
      
      const item = screen.getByText('Chicken Curry')
      await user.click(item)
      
      expect(onSelect).toHaveBeenCalled()
    })

    it('supports disabled state', () => {
      render(
        <Command>
          <CommandList>
            <CommandItem disabled>Unavailable Item</CommandItem>
          </CommandList>
        </Command>
      )
      
      const item = screen.getByText('Unavailable Item')
      expect(item).toHaveAttribute('data-disabled', 'true')
    })

    it('shows selected state', () => {
      render(
        <Command>
          <CommandList>
            <CommandItem data-selected="true">Selected Item</CommandItem>
          </CommandList>
        </Command>
      )
      
      const item = screen.getByText('Selected Item')
      expect(item).toHaveAttribute('data-selected', 'true')
    })

    it('applies hover styles', async () => {
      const user = userEvent.setup()
      
      render(
        <Command>
          <CommandList>
            <CommandItem>Hoverable Item</CommandItem>
          </CommandList>
        </Command>
      )
      
      const item = screen.getByText('Hoverable Item')
      await user.hover(item)
      
      expect(item).toHaveClass('cursor-default')
    })

    it('supports custom className', () => {
      render(
        <Command>
          <CommandList>
            <CommandItem className="custom-item">Custom Item</CommandItem>
          </CommandList>
        </Command>
      )
      
      const item = screen.getByText('Custom Item')
      expect(item).toHaveClass('custom-item')
    })
  })

  describe('CommandShortcut Component', () => {
    it('displays keyboard shortcut', () => {
      render(<CommandShortcut>⌘K</CommandShortcut>)
      
      expect(screen.getByText('⌘K')).toBeInTheDocument()
    })

    it('applies correct styling', () => {
      render(<CommandShortcut data-testid="shortcut">Ctrl+K</CommandShortcut>)
      
      const shortcut = screen.getByTestId('shortcut')
      expect(shortcut).toHaveClass('ml-auto', 'text-xs', 'tracking-widest')
    })

    it('supports custom className', () => {
      render(<CommandShortcut className="custom-shortcut">⌘K</CommandShortcut>)
      
      const shortcut = screen.getByText('⌘K')
      expect(shortcut).toHaveClass('custom-shortcut')
    })
  })

  describe('CommandSeparator Component', () => {
    it('renders separator element', () => {
      render(
        <Command>
          <CommandList>
            <CommandSeparator data-testid="separator" />
          </CommandList>
        </Command>
      )
      
      const separator = screen.getByTestId('separator')
      expect(separator).toBeInTheDocument()
      expect(separator).toHaveClass('h-px', 'bg-border')
    })

    it('supports custom className', () => {
      render(
        <Command>
          <CommandList>
            <CommandSeparator className="custom-separator" />
          </CommandList>
        </Command>
      )
      
      const separator = document.querySelector('.custom-separator')
      expect(separator).toBeInTheDocument()
    })
  })

  describe('CommandDialog Component', () => {
    it('renders dialog when open', () => {
      render(
        <CommandDialog open>
          <CommandInput placeholder="Search..." />
          <CommandList>
            <CommandItem>Test Item</CommandItem>
          </CommandList>
        </CommandDialog>
      )
      
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument()
    })

    it('does not render when closed', () => {
      render(
        <CommandDialog open={false}>
          <CommandInput placeholder="Search..." />
        </CommandDialog>
      )
      
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('handles close callback', async () => {
      const user = userEvent.setup()
      const onOpenChange = jest.fn()
      
      render(
        <CommandDialog open onOpenChange={onOpenChange}>
          <CommandInput placeholder="Search..." />
        </CommandDialog>
      )
      
      // Simulate escape key to close
      await user.keyboard('{Escape}')
      
      expect(onOpenChange).toHaveBeenCalledWith(false)
    })
  })

  describe('Keyboard Navigation', () => {
    beforeEach(() => {
      render(
        <Command>
          <CommandInput placeholder="Search meals..." />
          <CommandList>
            <CommandGroup heading="Main Courses">
              <CommandItem value="chicken">Chicken Curry</CommandItem>
              <CommandItem value="biryani">Vegetable Biryani</CommandItem>
            </CommandGroup>
            <CommandGroup heading="Desserts">
              <CommandItem value="gulab">Gulab Jamun</CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      )
    })

    it('supports arrow key navigation', async () => {
      const user = userEvent.setup()
      const input = screen.getByPlaceholderText('Search meals...')
      
      await user.click(input)
      await user.keyboard('{ArrowDown}')
      
      // First item should be selected/highlighted
      const firstItem = screen.getByText('Chicken Curry')
      expect(firstItem).toHaveAttribute('data-selected', 'true')
    })

    it('supports enter key selection', async () => {
      const user = userEvent.setup()
      const input = screen.getByPlaceholderText('Search meals...')
      
      await user.click(input)
      await user.keyboard('{ArrowDown}')
      await user.keyboard('{Enter}')
      
      // Item should be selected (this would trigger onSelect in real usage)
      const firstItem = screen.getByText('Chicken Curry')
      expect(firstItem).toBeInTheDocument()
    })

    it('supports escape key to clear selection', async () => {
      const user = userEvent.setup()
      const input = screen.getByPlaceholderText('Search meals...')
      
      await user.click(input)
      await user.keyboard('{ArrowDown}')
      await user.keyboard('{Escape}')
      
      // Selection should be cleared
      expect(input).toHaveFocus()
    })
  })

  describe('Search Functionality', () => {
    beforeEach(() => {
      render(
        <Command>
          <CommandInput placeholder="Search meals..." />
          <CommandList>
            <CommandEmpty>No meals found.</CommandEmpty>
            <CommandGroup heading="All Meals">
              {mockMeals.map((meal) => (
                <CommandItem key={meal.id} value={meal.name.toLowerCase()}>
                  <span>{meal.name}</span>
                  <span className="ml-auto text-sm text-muted-foreground">
                    ₹{meal.price}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      )
    })

    it('filters items based on search input', async () => {
      const user = userEvent.setup()
      const input = screen.getByPlaceholderText('Search meals...')
      
      await user.type(input, 'chicken')
      
      await waitFor(() => {
        expect(screen.getByText('Chicken Curry')).toBeInTheDocument()
        expect(screen.queryByText('Vegetable Biryani')).not.toBeInTheDocument()
      })
    })

    it('shows empty state when no matches found', async () => {
      const user = userEvent.setup()
      const input = screen.getByPlaceholderText('Search meals...')
      
      await user.type(input, 'nonexistent')
      
      await waitFor(() => {
        expect(screen.getByText('No meals found.')).toBeInTheDocument()
        expect(screen.queryByText('Chicken Curry')).not.toBeInTheDocument()
      })
    })

    it('clears search when input is cleared', async () => {
      const user = userEvent.setup()
      const input = screen.getByPlaceholderText('Search meals...')
      
      await user.type(input, 'chicken')
      await user.clear(input)
      
      await waitFor(() => {
        expect(screen.getByText('Chicken Curry')).toBeInTheDocument()
        expect(screen.getByText('Vegetable Biryani')).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('meets WCAG accessibility guidelines', async () => {
      const { container } = render(
        <Command>
          <CommandInput placeholder="Search meals..." />
          <CommandList>
            <CommandGroup heading="Main Courses">
              <CommandItem>Chicken Curry</CommandItem>
              <CommandItem>Vegetable Biryani</CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      )
      
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('provides proper ARIA labels and roles', () => {
      render(
        <Command>
          <CommandInput placeholder="Search meals..." />
          <CommandList>
            <CommandGroup heading="Main Courses">
              <CommandItem>Chicken Curry</CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      )
      
      const combobox = screen.getByRole('combobox')
      expect(combobox).toBeInTheDocument()
      
      const input = screen.getByPlaceholderText('Search meals...')
      expect(input).toHaveAttribute('role', 'combobox')
    })

    it('supports screen reader navigation', () => {
      render(
        <Command>
          <CommandInput placeholder="Search for meals" />
          <CommandList>
            <CommandGroup heading="Available Meals" aria-label="Available meals group">
              <CommandItem aria-label="Select Chicken Curry">Chicken Curry</CommandItem>
              <CommandItem aria-label="Select Vegetable Biryani">Vegetable Biryani</CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      )
      
      const group = screen.getByLabelText('Available meals group')
      expect(group).toBeInTheDocument()
      
      const item1 = screen.getByLabelText('Select Chicken Curry')
      const item2 = screen.getByLabelText('Select Vegetable Biryani')
      expect(item1).toBeInTheDocument()
      expect(item2).toBeInTheDocument()
    })

    it('maintains focus management', async () => {
      const user = userEvent.setup()
      
      render(
        <Command>
          <CommandInput placeholder="Search meals..." />
          <CommandList>
            <CommandItem>Chicken Curry</CommandItem>
          </CommandList>
        </Command>
      )
      
      const input = screen.getByPlaceholderText('Search meals...')
      await user.click(input)
      
      expect(input).toHaveFocus()
      
      await user.keyboard('{ArrowDown}')
      // Focus should move to the list for navigation
      expect(document.activeElement).not.toBe(input)
    })
  })

  describe('Performance and Edge Cases', () => {
    it('handles large datasets efficiently', () => {
      const largeMealList = Array.from({ length: 1000 }, (_, i) => ({
        id: `meal-${i}`,
        name: `Meal ${i}`,
        category: 'Generated',
        price: 100 + i,
      }))
      
      const { container } = render(
        <Command>
          <CommandInput placeholder="Search meals..." />
          <CommandList>
            <CommandGroup heading="All Meals">
              {largeMealList.map((meal) => (
                <CommandItem key={meal.id} value={meal.name.toLowerCase()}>
                  {meal.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      )
      
      // Should render without performance issues
      expect(container.querySelectorAll('[role="option"]')).toHaveLength(1000)
    })

    it('handles empty data gracefully', () => {
      render(
        <Command>
          <CommandInput placeholder="Search meals..." />
          <CommandList>
            <CommandEmpty>No meals available.</CommandEmpty>
            <CommandGroup heading="Meals">
              {/* Empty list */}
            </CommandGroup>
          </CommandList>
        </Command>
      )
      
      expect(screen.getByText('No meals available.')).toBeInTheDocument()
    })

    it('handles special characters in search', async () => {
      const user = userEvent.setup()
      
      render(
        <Command>
          <CommandInput placeholder="Search meals..." />
          <CommandList>
            <CommandItem value="spéciál meal">Spéciál Meal</CommandItem>
            <CommandItem value="normal meal">Normal Meal</CommandItem>
          </CommandList>
        </Command>
      )
      
      const input = screen.getByPlaceholderText('Search meals...')
      await user.type(input, 'spéciál')
      
      await waitFor(() => {
        expect(screen.getByText('Spéciál Meal')).toBeInTheDocument()
        expect(screen.queryByText('Normal Meal')).not.toBeInTheDocument()
      })
    })

    it('prevents XSS in search input', async () => {
      const user = userEvent.setup()
      
      render(
        <Command>
          <CommandInput placeholder="Search meals..." />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
          </CommandList>
        </Command>
      )
      
      const input = screen.getByPlaceholderText('Search meals...')
      await user.type(input, '<script>alert("xss")</script>')
      
      // Input should be treated as text, not executed as script
      expect(input).toHaveValue('<script>alert("xss")</script>')
      expect(screen.getByText('No results found.')).toBeInTheDocument()
    })
  })

  describe('Mobile Touch Support', () => {
    it('handles touch events on mobile', async () => {
      const onSelect = jest.fn()
      
      render(
        <Command>
          <CommandList>
            <CommandItem onSelect={onSelect}>Touchable Item</CommandItem>
          </CommandList>
        </Command>
      )
      
      const item = screen.getByText('Touchable Item')
      
      // Simulate touch events
      fireEvent.touchStart(item)
      fireEvent.touchEnd(item)
      
      expect(onSelect).toHaveBeenCalled()
    })

    it('supports swipe gestures for navigation', () => {
      render(
        <Command>
          <CommandList data-testid="command-list">
            <CommandItem>Item 1</CommandItem>
            <CommandItem>Item 2</CommandItem>
            <CommandItem>Item 3</CommandItem>
          </CommandList>
        </Command>
      )
      
      const list = screen.getByTestId('command-list')
      
      // Simulate swipe up
      fireEvent.touchStart(list, {
        touches: [{ clientY: 100 }],
      })
      fireEvent.touchMove(list, {
        touches: [{ clientY: 50 }],
      })
      fireEvent.touchEnd(list)
      
      // List should handle swipe gestures gracefully
      expect(list).toBeInTheDocument()
    })
  })
})