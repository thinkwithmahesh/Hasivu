/**
 * Comprehensive Unit Tests for Tooltip Component (ShadCN UI)
 * Tests tooltip functionality, nutritional information display, and accessibility
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe, toHaveNoViolations } from 'jest-axe'
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '../tooltip'

expect.extend(toHaveNoViolations)

describe('Tooltip Component Suite', () => {
  // Mock nutritional data for testing
  const mockNutrition = {
    calories: 450,
    protein: 28,
    carbs: 52,
    fat: 12,
    fiber: 8,
    sugar: 6,
    sodium: 890,
    calcium: 150,
    iron: 3.2,
    vitaminC: 25,
  }

  const NutritionalTooltip = ({ 
    children, 
    nutrition = mockNutrition,
    mealName = "Chicken Biryani" 
  }: { 
    children: React.ReactNode
    nutrition?: typeof mockNutrition
    mealName?: string 
  }) => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {children}
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-2">
            <div className="font-medium">{mealName} - Nutrition Facts</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>Calories: {nutrition.calories}</div>
              <div>Protein: {nutrition.protein}g</div>
              <div>Carbs: {nutrition.carbs}g</div>
              <div>Fat: {nutrition.fat}g</div>
              <div>Fiber: {nutrition.fiber}g</div>
              <div>Sugar: {nutrition.sugar}g</div>
              <div>Sodium: {nutrition.sodium}mg</div>
              <div>Calcium: {nutrition.calcium}mg</div>
              <div>Iron: {nutrition.iron}mg</div>
              <div>Vitamin C: {nutrition.vitaminC}%</div>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )

  const SimpleTooltip = ({ 
    content = "Tooltip content",
    children = <button>Hover me</button>
  }: {
    content?: string
    children?: React.ReactNode
  }) => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {children}
        </TooltipTrigger>
        <TooltipContent>
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )

  describe('TooltipProvider Component', () => {
    it('renders children without crashing', () => {
      render(
        <TooltipProvider>
          <div>Child content</div>
        </TooltipProvider>
      )
      
      expect(screen.getByText('Child content')).toBeInTheDocument()
    })

    it('provides tooltip context to children', () => {
      render(
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>Trigger</TooltipTrigger>
            <TooltipContent>Content</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
      
      expect(screen.getByText('Trigger')).toBeInTheDocument()
    })

    it('supports delayDuration prop', () => {
      render(
        <TooltipProvider delayDuration={1000}>
          <SimpleTooltip />
        </TooltipProvider>
      )
      
      expect(screen.getByText('Hover me')).toBeInTheDocument()
    })

    it('supports skipDelayDuration prop', () => {
      render(
        <TooltipProvider skipDelayDuration={500}>
          <SimpleTooltip />
        </TooltipProvider>
      )
      
      expect(screen.getByText('Hover me')).toBeInTheDocument()
    })
  })

  describe('Tooltip Root Component', () => {
    it('renders without crashing', () => {
      render(
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>Test Trigger</TooltipTrigger>
            <TooltipContent>Test Content</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
      
      expect(screen.getByText('Test Trigger')).toBeInTheDocument()
    })

    it('supports open state control', () => {
      render(
        <TooltipProvider>
          <Tooltip open>
            <TooltipTrigger>Controlled Trigger</TooltipTrigger>
            <TooltipContent>Controlled Content</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
      
      expect(screen.getByText('Controlled Content')).toBeInTheDocument()
    })

    it('supports defaultOpen prop', () => {
      render(
        <TooltipProvider>
          <Tooltip defaultOpen>
            <TooltipTrigger>Default Open</TooltipTrigger>
            <TooltipContent>Default Content</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
      
      expect(screen.getByText('Default Content')).toBeInTheDocument()
    })

    it('handles onOpenChange callback', async () => {
      const user = userEvent.setup()
      const onOpenChange = jest.fn()
      
      render(
        <TooltipProvider>
          <Tooltip onOpenChange={onOpenChange}>
            <TooltipTrigger>Callback Trigger</TooltipTrigger>
            <TooltipContent>Callback Content</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
      
      const trigger = screen.getByText('Callback Trigger')
      await user.hover(trigger)
      
      await waitFor(() => {
        expect(onOpenChange).toHaveBeenCalledWith(true)
      })
    })
  })

  describe('TooltipTrigger Component', () => {
    it('renders trigger element', () => {
      render(
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>Click me</TooltipTrigger>
            <TooltipContent>Tooltip text</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
      
      expect(screen.getByText('Click me')).toBeInTheDocument()
    })

    it('supports asChild prop with custom elements', () => {
      render(
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button type="button" className="custom-btn">
                Custom Button
              </button>
            </TooltipTrigger>
            <TooltipContent>Custom tooltip</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
      
      const customButton = screen.getByRole('button', { name: 'Custom Button' })
      expect(customButton).toBeInTheDocument()
      expect(customButton).toHaveClass('custom-btn')
    })

    it('shows tooltip on hover', async () => {
      const user = userEvent.setup()
      
      render(<SimpleTooltip content="Hover tooltip" />)
      
      const trigger = screen.getByText('Hover me')
      await user.hover(trigger)
      
      await waitFor(() => {
        expect(screen.getByText('Hover tooltip')).toBeInTheDocument()
      })
    })

    it('hides tooltip on unhover', async () => {
      const user = userEvent.setup()
      
      render(<SimpleTooltip content="Hide on unhover" />)
      
      const trigger = screen.getByText('Hover me')
      await user.hover(trigger)
      
      await waitFor(() => {
        expect(screen.getByText('Hide on unhover')).toBeInTheDocument()
      })
      
      await user.unhover(trigger)
      
      await waitFor(() => {
        expect(screen.queryByText('Hide on unhover')).not.toBeInTheDocument()
      })
    })

    it('shows tooltip on focus', async () => {
      const user = userEvent.setup()
      
      render(<SimpleTooltip content="Focus tooltip" />)
      
      const trigger = screen.getByText('Hover me')
      await user.click(trigger)
      
      await waitFor(() => {
        expect(screen.getByText('Focus tooltip')).toBeInTheDocument()
      })
    })

    it('hides tooltip on blur', async () => {
      const user = userEvent.setup()
      
      render(
        <>
          <SimpleTooltip content="Blur tooltip" />
          <button>Other button</button>
        </>
      )
      
      const trigger = screen.getByText('Hover me')
      await user.click(trigger)
      
      await waitFor(() => {
        expect(screen.getByText('Blur tooltip')).toBeInTheDocument()
      })
      
      const otherButton = screen.getByText('Other button')
      await user.click(otherButton)
      
      await waitFor(() => {
        expect(screen.queryByText('Blur tooltip')).not.toBeInTheDocument()
      })
    })
  })

  describe('TooltipContent Component', () => {
    it('renders content with proper styling', async () => {
      const user = userEvent.setup()
      
      render(
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>Trigger</TooltipTrigger>
            <TooltipContent data-testid="tooltip-content">
              Styled content
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
      
      const trigger = screen.getByText('Trigger')
      await user.hover(trigger)
      
      await waitFor(() => {
        const content = screen.getByTestId('tooltip-content')
        expect(content).toHaveClass(
          'z-50',
          'overflow-hidden',
          'rounded-md',
          'border',
          'bg-popover',
          'px-3',
          'py-1.5',
          'text-sm'
        )
      })
    })

    it('supports custom className', async () => {
      const user = userEvent.setup()
      
      render(
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>Trigger</TooltipTrigger>
            <TooltipContent className="custom-tooltip">
              Custom styled content
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
      
      const trigger = screen.getByText('Trigger')
      await user.hover(trigger)
      
      await waitFor(() => {
        const content = screen.getByText('Custom styled content')
        expect(content).toHaveClass('custom-tooltip')
      })
    })

    it('supports custom sideOffset', async () => {
      const user = userEvent.setup()
      
      render(
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>Trigger</TooltipTrigger>
            <TooltipContent sideOffset={10}>
              Offset content
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
      
      const trigger = screen.getByText('Trigger')
      await user.hover(trigger)
      
      await waitFor(() => {
        expect(screen.getByText('Offset content')).toBeInTheDocument()
      })
    })

    it('supports side positioning', async () => {
      const user = userEvent.setup()
      
      render(
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>Trigger</TooltipTrigger>
            <TooltipContent side="top">
              Top positioned
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
      
      const trigger = screen.getByText('Trigger')
      await user.hover(trigger)
      
      await waitFor(() => {
        expect(screen.getByText('Top positioned')).toBeInTheDocument()
      })
    })

    it('supports align positioning', async () => {
      const user = userEvent.setup()
      
      render(
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>Trigger</TooltipTrigger>
            <TooltipContent align="start">
              Start aligned
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
      
      const trigger = screen.getByText('Trigger')
      await user.hover(trigger)
      
      await waitFor(() => {
        expect(screen.getByText('Start aligned')).toBeInTheDocument()
      })
    })
  })

  describe('Nutritional Information Tooltips', () => {
    it('displays complete nutritional information', async () => {
      const user = userEvent.setup()
      
      render(
        <NutritionalTooltip>
          <button>View Nutrition</button>
        </NutritionalTooltip>
      )
      
      const trigger = screen.getByText('View Nutrition')
      await user.hover(trigger)
      
      await waitFor(() => {
        expect(screen.getByText('Chicken Biryani - Nutrition Facts')).toBeInTheDocument()
        expect(screen.getByText('Calories: 450')).toBeInTheDocument()
        expect(screen.getByText('Protein: 28g')).toBeInTheDocument()
        expect(screen.getByText('Carbs: 52g')).toBeInTheDocument()
        expect(screen.getByText('Fat: 12g')).toBeInTheDocument()
        expect(screen.getByText('Fiber: 8g')).toBeInTheDocument()
        expect(screen.getByText('Sodium: 890mg')).toBeInTheDocument()
      })
    })

    it('handles custom nutrition data', async () => {
      const user = userEvent.setup()
      
      const customNutrition = {
        calories: 300,
        protein: 20,
        carbs: 40,
        fat: 8,
        fiber: 5,
        sugar: 3,
        sodium: 600,
        calcium: 100,
        iron: 2.1,
        vitaminC: 15,
      }
      
      render(
        <NutritionalTooltip 
          nutrition={customNutrition}
          mealName="Vegetable Curry"
        >
          <button>Custom Nutrition</button>
        </NutritionalTooltip>
      )
      
      const trigger = screen.getByText('Custom Nutrition')
      await user.hover(trigger)
      
      await waitFor(() => {
        expect(screen.getByText('Vegetable Curry - Nutrition Facts')).toBeInTheDocument()
        expect(screen.getByText('Calories: 300')).toBeInTheDocument()
        expect(screen.getByText('Protein: 20g')).toBeInTheDocument()
        expect(screen.getByText('Sodium: 600mg')).toBeInTheDocument()
      })
    })

    it('works with meal cards', async () => {
      const user = userEvent.setup()
      
      render(
        <div className="meal-card">
          <h3>Chicken Biryani</h3>
          <p>₹180</p>
          <NutritionalTooltip>
            <button className="nutrition-btn">ℹ️ Nutrition</button>
          </NutritionalTooltip>
        </div>
      )
      
      const nutritionBtn = screen.getByText('ℹ️ Nutrition')
      await user.hover(nutritionBtn)
      
      await waitFor(() => {
        expect(screen.getByText(/Nutrition Facts/)).toBeInTheDocument()
        expect(screen.getByText('Calories: 450')).toBeInTheDocument()
      })
    })

    it('handles dietary restrictions information', async () => {
      const user = userEvent.setup()
      
      render(
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="dietary-icon">🌱</span>
            </TooltipTrigger>
            <TooltipContent>
              <div>
                <div className="font-medium">Dietary Information</div>
                <ul className="text-xs mt-1">
                  <li>✅ Vegetarian</li>
                  <li>✅ Gluten-Free</li>
                  <li>❌ Contains Dairy</li>
                  <li>❌ Contains Nuts</li>
                </ul>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
      
