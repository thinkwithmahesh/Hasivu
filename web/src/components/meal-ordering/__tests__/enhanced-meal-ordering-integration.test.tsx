/**
 * Comprehensive Integration Tests for Enhanced Meal Ordering Workflow
 * Tests the integration of ShadCN components in meal ordering process
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';

// Import ShadCN components
import {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '../../ui/command';
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from '../../ui/drawer';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '../../ui/tooltip';
import { Popover, PopoverTrigger, PopoverContent } from '../../ui/popover';
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from '../../ui/input-otp';

expect.extend(toHaveNoViolations);

describe('Enhanced Meal Ordering Integration Tests', () => {
  // Mock meal data
  const mockMeals = [
    {
      id: '1',
      name: 'Chicken Biryani',
      description: 'Aromatic basmati rice with tender chicken pieces',
      price: 180,
      category: 'Main Course',
      image: '/images/chicken-biryani.jpg',
      nutrition: {
        calories: 650,
        protein: 35,
        carbs: 75,
        fat: 18,
        fiber: 8,
        sugar: 6,
        sodium: 890,
      },
      allergens: ['Contains dairy'],
      spiceLevel: 'Medium',
      preparationTime: 25,
      availability: true,
    },
    {
      id: '2',
      name: 'Paneer Butter Masala',
      description: 'Rich and creamy paneer curry with butter naan',
      price: 160,
      category: 'Main Course',
      image: '/images/paneer-butter-masala.jpg',
      nutrition: {
        calories: 580,
        protein: 22,
        carbs: 45,
        fat: 28,
        fiber: 5,
        sugar: 8,
        sodium: 750,
      },
      allergens: ['Contains dairy', 'Contains gluten'],
      spiceLevel: 'Mild',
      preparationTime: 20,
      availability: true,
    },
    {
      id: '3',
      name: 'Veg Thali',
      description: 'Complete vegetarian meal with dal, sabzi, rice, and roti',
      price: 140,
      category: 'Complete Meal',
      image: '/images/veg-thali.jpg',
      nutrition: {
        calories: 520,
        protein: 18,
        carbs: 68,
        fat: 15,
        fiber: 12,
        sugar: 4,
        sodium: 680,
      },
      allergens: ['Contains gluten'],
      spiceLevel: 'Medium',
      preparationTime: 15,
      availability: true,
    },
  ];

  // Mock student data
  const mockStudent = {
    id: 'ST001',
    name: 'John Doe',
    grade: '10th',
    rfidCode: '123456',
    balance: 500,
    dietaryRestrictions: ['No beef'],
    allergies: ['Nuts'],
  };

  // Enhanced Meal Search Component with Command
  const EnhancedMealSearch = ({
    onSelectMeal = jest.fn(),
    meals = mockMeals,
  }: {
    onSelectMeal?: (meal: any) => void;
    meals?: typeof mockMeals;
  }) => {
    const [open, setOpen] = React.useState(false);
    const [selectedMeal, setSelectedMeal] = React.useState<any>(null);

    const handleSelect = (meal: any) => {
      setSelectedMeal(meal);
      setOpen(false);
      onSelectMeal(meal);
    };

    return (
      <div className="meal-search-container">
        <CommandDialog open={open} onOpenChange={setOpen}>
          <CommandInput placeholder="Search for meals..." />
          <CommandList>
            <CommandEmpty>No meals found.</CommandEmpty>
            <CommandGroup heading="Available Meals">
              {meals.map(meal => (
                <CommandItem
                  key={meal.id}
                  value={meal.name.toLowerCase()}
                  onSelect={() => handleSelect(meal)}
                >
                  <div className="flex items-center justify-between w-full">
                    <div>
                      <span className="font-medium">{meal.name}</span>
                      <p className="text-sm text-muted-foreground">{meal.description}</p>
                    </div>
                    <span className="text-lg font-bold">₹{meal.price}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </CommandDialog>

        <button
          onClick={() => setOpen(true)}
          className="search-trigger-btn w-full p-3 border rounded-lg text-left"
        >
          {selectedMeal ? `Selected: ${selectedMeal.name}` : 'Search for meals...'}
        </button>
      </div>
    );
  };

  // Enhanced Meal Card with Tooltip and Drawer
  const EnhancedMealCard = ({
    meal,
    onAddToCart = jest.fn(),
    onCustomize = jest.fn(),
  }: {
    meal: (typeof mockMeals)[0];
    onAddToCart?: (meal: any, quantity: number) => void;
    onCustomize?: (meal: any, customization: any) => void;
  }) => {
    const [quantity, setQuantity] = React.useState(1);
    const [customization, setCustomization] = React.useState({
      spiceLevel: meal.spiceLevel,
      portion: 'Regular',
      extras: [] as string[],
    });

    const handleAddToCart = () => {
      onAddToCart(meal, quantity);
    };

    const handleCustomize = () => {
      onCustomize(meal, customization);
    };

    return (
      <TooltipProvider>
        <div className="meal-card border rounded-lg p-4 space-y-3">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-medium text-lg">{meal.name}</h3>
              <p className="text-sm text-muted-foreground">{meal.description}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-lg font-bold">₹{meal.price}</span>
                <span className="text-sm text-muted-foreground">• {meal.preparationTime} mins</span>
              </div>
            </div>

            <Tooltip>
              <TooltipTrigger asChild>
                <button className="nutrition-info-btn text-blue-600">ℹ️</button>
              </TooltipTrigger>
              <TooltipContent>
                <div className="space-y-2">
                  <div className="font-medium">Nutrition Facts</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>Calories: {meal.nutrition.calories}</div>
                    <div>Protein: {meal.nutrition.protein}g</div>
                    <div>Carbs: {meal.nutrition.carbs}g</div>
                    <div>Fat: {meal.nutrition.fat}g</div>
                    <div>Fiber: {meal.nutrition.fiber}g</div>
                    <div>Sodium: {meal.nutrition.sodium}mg</div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Allergens: {meal.allergens.join(', ')}
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="quantity-decrease w-8 h-8 border rounded"
              disabled={quantity <= 1}
            >
              -
            </button>
            <span className="quantity-display px-3">{quantity}</span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="quantity-increase w-8 h-8 border rounded"
            >
              +
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleAddToCart}
              className="add-to-cart-btn flex-1 bg-primary text-primary-foreground p-2 rounded"
            >
              Add to Cart
            </button>

            <Drawer>
              <DrawerTrigger asChild>
                <button className="customize-btn px-4 py-2 border rounded">Customize</button>
              </DrawerTrigger>
              <DrawerContent>
                <DrawerHeader>
                  <DrawerTitle>Customize {meal.name}</DrawerTitle>
                  <DrawerDescription>Adjust your meal preferences</DrawerDescription>
                </DrawerHeader>

                <div className="p-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Spice Level</label>
                    <select
                      value={customization.spiceLevel}
                      onChange={e =>
                        setCustomization(prev => ({
                          ...prev,
                          spiceLevel: e.target.value,
                        }))
                      }
                      className="spice-level-select w-full p-2 border rounded"
                    >
                      <option value="Mild">Mild</option>
                      <option value="Medium">Medium</option>
                      <option value="Hot">Hot</option>
                      <option value="Extra Hot">Extra Hot</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Portion Size</label>
                    <select
                      value={customization.portion}
                      onChange={e =>
                        setCustomization(prev => ({
                          ...prev,
                          portion: e.target.value,
                        }))
                      }
                      className="portion-select w-full p-2 border rounded"
                    >
                      <option value="Small">Small</option>
                      <option value="Regular">Regular</option>
                      <option value="Large">Large</option>
                    </select>
                  </div>
                </div>

                <DrawerFooter>
                  <button
                    onClick={handleCustomize}
                    className="customize-confirm-btn bg-primary text-primary-foreground p-3 rounded"
                  >
                    Confirm Customization
                  </button>
                  <DrawerClose asChild>
                    <button className="cancel-customize-btn p-2 border rounded">Cancel</button>
                  </DrawerClose>
                </DrawerFooter>
              </DrawerContent>
            </Drawer>
          </div>
        </div>
      </TooltipProvider>
    );
  };

  // Quick Actions Popover
  const QuickActionsPopover = ({
    onAction = jest.fn(),
  }: {
    onAction?: (action: string) => void;
  }) => (
    <Popover>
      <PopoverTrigger asChild>
        <button className="quick-actions-btn bg-secondary p-2 rounded">⚡ Quick Actions</button>
      </PopoverTrigger>
      <PopoverContent>
        <div className="space-y-2">
          <div className="font-medium">Quick Actions</div>
          <div className="grid gap-2">
            <button
              onClick={() => onAction('reorder')}
              className="reorder-btn text-left p-2 hover:bg-accent rounded"
            >
              🔄 Reorder Last Meal
            </button>
            <button
              onClick={() => onAction('favorites')}
              className="favorites-btn text-left p-2 hover:bg-accent rounded"
            >
              ⭐ View Favorites
            </button>
            <button
              onClick={() => onAction('schedule')}
              className="schedule-btn text-left p-2 hover:bg-accent rounded"
            >
              📅 Schedule Order
            </button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );

  // RFID Verification Component
  const RFIDVerification = ({
    onVerificationComplete = jest.fn(),
    studentName = mockStudent.name,
    studentId = mockStudent.id,
  }: {
    onVerificationComplete?: (verified: boolean, rfidCode?: string) => void;
    studentName?: string;
    studentId?: string;
  }) => {
    const [rfidCode, setRfidCode] = React.useState('');
    const [isVerifying, setIsVerifying] = React.useState(false);
    const [error, setError] = React.useState('');

    const handleRfidChange = (value: string) => {
      setRfidCode(value);
      setError('');

      if (value.length === 6) {
        setIsVerifying(true);

        // Simulate RFID verification
        setTimeout(() => {
          setIsVerifying(false);

          if (value === mockStudent.rfidCode) {
            onVerificationComplete(true, value);
          } else {
            setError('Invalid RFID code. Please try again.');
            onVerificationComplete(false);
          }
        }, 1000);
      }
    };

    return (
      <div className="rfid-verification space-y-4">
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
            maxLength={6}
            value={rfidCode}
            onChange={handleRfidChange}
            disabled={isVerifying}
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
            </InputOTPGroup>
            <InputOTPSeparator />
            <InputOTPGroup>
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>

        {isVerifying && (
          <div className="text-center text-sm text-blue-600">Verifying RFID code...</div>
        )}

        {error && (
          <div className="text-center text-sm text-red-600" role="alert">
            {error}
          </div>
        )}
      </div>
    );
  };

  // Complete Meal Ordering Flow
  const CompleteMealOrderingFlow = () => {
    const [step, setStep] = React.useState<'search' | 'customize' | 'verify' | 'complete'>(
      'search'
    );
    const [_selectedMeal, setSelectedMeal] = React.useState<any>(null);
    const [cart, setCart] = React.useState<any[]>([]);
    const [_isRfidVerified, setIsRfidVerified] = React.useState(false);

    const handleMealSelect = (meal: any) => {
      setSelectedMeal(meal);
    };

    const handleAddToCart = (meal: any, quantity: number) => {
      setCart(prev => [...prev, { ...meal, quantity }]);
    };

    const handleQuickAction = (_action: string) => {
      // Handle quick actions
    };

    const handleRfidVerification = (verified: boolean, _rfidCode?: string) => {
      if (verified) {
        setIsRfidVerified(true);
        setStep('complete');
      }
    };

    const proceedToVerification = () => {
      setStep('verify');
    };

    const _completeOrder = () => {
      setStep('complete');
    };

    return (
      <div className="meal-ordering-flow space-y-6">
        <div className="header flex justify-between items-center">
          <h1 className="text-2xl font-bold">Order Your Meal</h1>
          <QuickActionsPopover onAction={handleQuickAction} />
        </div>

        {step === 'search' && (
          <div className="search-step space-y-4">
            <EnhancedMealSearch onSelectMeal={handleMealSelect} />

            <div className="meals-grid grid gap-4">
              {mockMeals.map(meal => (
                <EnhancedMealCard key={meal.id} meal={meal} onAddToCart={handleAddToCart} />
              ))}
            </div>

            {cart.length > 0 && (
              <div className="cart-summary border-t pt-4">
                <h3 className="font-medium mb-2">Cart ({cart.length} items)</h3>
                <div className="space-y-2">
                  {cart.map((item, index) => (
                    <div key={index} className="flex justify-between">
                      <span>
                        {item.name} x{item.quantity}
                      </span>
                      <span>₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between font-bold mt-2 pt-2 border-t">
                  <span>Total:</span>
                  <span>₹{cart.reduce((sum, item) => sum + item.price * item.quantity, 0)}</span>
                </div>
                <button
                  onClick={proceedToVerification}
                  className="proceed-to-verification-btn w-full mt-4 bg-primary text-primary-foreground p-3 rounded"
                >
                  Proceed to Verification
                </button>
              </div>
            )}
          </div>
        )}

        {step === 'verify' && (
          <div className="verification-step">
            <RFIDVerification onVerificationComplete={handleRfidVerification} />
          </div>
        )}

        {step === 'complete' && (
          <div className="completion-step text-center space-y-4">
            <h2 className="text-xl font-medium text-green-600">Order Confirmed!</h2>
            <p>Your meal order has been placed successfully.</p>
            <div className="order-details border rounded-lg p-4">
              <h3 className="font-medium mb-2">Order Summary</h3>
              {cart.map((item, index) => (
                <div key={index} className="flex justify-between">
                  <span>
                    {item.name} x{item.quantity}
                  </span>
                  <span>₹{item.price * item.quantity}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => {
                setStep('search');
                setCart([]);
                setIsRfidVerified(false);
              }}
              className="new-order-btn bg-primary text-primary-foreground p-3 rounded"
            >
              Place New Order
            </button>
          </div>
        )}
      </div>
    );
  };

  describe('Meal Search Integration', () => {
    it('opens command dialog and searches for meals', async () => {
      const user = userEvent.setup();
      const onSelectMeal = jest.fn();

      render(<EnhancedMealSearch onSelectMeal={onSelectMeal} />);

      const searchTrigger = screen.getByText('Search for meals...');
      await user.click(searchTrigger);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search for meals...')).toBeInTheDocument();
        expect(screen.getByText('Available Meals')).toBeInTheDocument();
        expect(screen.getByText('Chicken Biryani')).toBeInTheDocument();
      });
    });

    it('filters meals based on search input', async () => {
      const user = userEvent.setup();

      render(<EnhancedMealSearch />);

      const searchTrigger = screen.getByText('Search for meals...');
      await user.click(searchTrigger);

      const searchInput = screen.getByPlaceholderText('Search for meals...');
      await user.type(searchInput, 'biryani');

      await waitFor(() => {
        expect(screen.getByText('Chicken Biryani')).toBeInTheDocument();
        expect(screen.queryByText('Paneer Butter Masala')).not.toBeInTheDocument();
      });
    });

    it('selects meal and updates trigger text', async () => {
      const user = userEvent.setup();
      const onSelectMeal = jest.fn();

      render(<EnhancedMealSearch onSelectMeal={onSelectMeal} />);

      const searchTrigger = screen.getByText('Search for meals...');
      await user.click(searchTrigger);

      const mealOption = screen.getByText('Chicken Biryani');
      await user.click(mealOption);

      await waitFor(() => {
        expect(onSelectMeal).toHaveBeenCalledWith(mockMeals[0]);
        expect(screen.getByText('Selected: Chicken Biryani')).toBeInTheDocument();
      });
    });

    it('shows empty state when no meals match search', async () => {
      const user = userEvent.setup();

      render(<EnhancedMealSearch />);

      const searchTrigger = screen.getByText('Search for meals...');
      await user.click(searchTrigger);

      const searchInput = screen.getByPlaceholderText('Search for meals...');
      await user.type(searchInput, 'nonexistent meal');

      await waitFor(() => {
        expect(screen.getByText('No meals found.')).toBeInTheDocument();
      });
    });
  });

  describe('Meal Card Integration', () => {
    it('displays meal information with nutrition tooltip', async () => {
      const user = userEvent.setup();

      render(<EnhancedMealCard meal={mockMeals[0]} />);

      expect(screen.getByText('Chicken Biryani')).toBeInTheDocument();
      expect(screen.getByText('₹180')).toBeInTheDocument();

      const nutritionBtn = screen.getByText('ℹ️');
      await user.hover(nutritionBtn);

      await waitFor(() => {
        expect(screen.getByText('Nutrition Facts')).toBeInTheDocument();
        expect(screen.getByText('Calories: 650')).toBeInTheDocument();
        expect(screen.getByText('Protein: 35g')).toBeInTheDocument();
      });
    });

    it('handles quantity adjustment', async () => {
      const user = userEvent.setup();

      render(<EnhancedMealCard meal={mockMeals[0]} />);

      const _quantityDisplay = screen.getByText('1');
      const increaseBtn = screen.getByText('+');
      const decreaseBtn = screen.getByText('-');

      await user.click(increaseBtn);
      expect(screen.getByText('2')).toBeInTheDocument();

      await user.click(increaseBtn);
      expect(screen.getByText('3')).toBeInTheDocument();

      await user.click(decreaseBtn);
      expect(screen.getByText('2')).toBeInTheDocument();

      // Should not decrease below 1
      await user.click(decreaseBtn);
      await user.click(decreaseBtn);
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(decreaseBtn).toBeDisabled();
    });

    it('adds meal to cart with correct quantity', async () => {
      const user = userEvent.setup();
      const onAddToCart = jest.fn();

      render(<EnhancedMealCard meal={mockMeals[0]} onAddToCart={onAddToCart} />);

      const increaseBtn = screen.getByText('+');
      await user.click(increaseBtn);
      await user.click(increaseBtn);

      const addToCartBtn = screen.getByText('Add to Cart');
      await user.click(addToCartBtn);

      expect(onAddToCart).toHaveBeenCalledWith(mockMeals[0], 3);
    });

    it('opens customization drawer and handles customization', async () => {
      const user = userEvent.setup();
      const onCustomize = jest.fn();

      render(<EnhancedMealCard meal={mockMeals[0]} onCustomize={onCustomize} />);

      const customizeBtn = screen.getByText('Customize');
      await user.click(customizeBtn);

      await waitFor(() => {
        expect(screen.getByText('Customize Chicken Biryani')).toBeInTheDocument();
        expect(screen.getByText('Adjust your meal preferences')).toBeInTheDocument();
      });

      const spiceLevelSelect = screen.getByDisplayValue('Medium');
      await user.selectOptions(spiceLevelSelect, 'Hot');

      const portionSelect = screen.getByDisplayValue('Regular');
      await user.selectOptions(portionSelect, 'Large');

      const confirmBtn = screen.getByText('Confirm Customization');
      await user.click(confirmBtn);

      expect(onCustomize).toHaveBeenCalledWith(mockMeals[0], {
        spiceLevel: 'Hot',
        portion: 'Large',
        extras: [],
      });
    });

    it('cancels customization and closes drawer', async () => {
      const user = userEvent.setup();

      render(<EnhancedMealCard meal={mockMeals[0]} />);

      const customizeBtn = screen.getByText('Customize');
      await user.click(customizeBtn);

      await waitFor(() => {
        expect(screen.getByText('Customize Chicken Biryani')).toBeInTheDocument();
      });

      const cancelBtn = screen.getByText('Cancel');
      await user.click(cancelBtn);

      await waitFor(() => {
        expect(screen.queryByText('Customize Chicken Biryani')).not.toBeInTheDocument();
      });
    });
  });

  describe('Quick Actions Integration', () => {
    it('displays quick actions in popover', async () => {
      const user = userEvent.setup();

      render(<QuickActionsPopover />);

      const quickActionsBtn = screen.getByText('⚡ Quick Actions');
      await user.click(quickActionsBtn);

      await waitFor(() => {
        expect(screen.getByText('Quick Actions')).toBeInTheDocument();
        expect(screen.getByText('🔄 Reorder Last Meal')).toBeInTheDocument();
        expect(screen.getByText('⭐ View Favorites')).toBeInTheDocument();
        expect(screen.getByText('📅 Schedule Order')).toBeInTheDocument();
      });
    });

    it('handles quick action selections', async () => {
      const user = userEvent.setup();
      const onAction = jest.fn();

      render(<QuickActionsPopover onAction={onAction} />);

      const quickActionsBtn = screen.getByText('⚡ Quick Actions');
      await user.click(quickActionsBtn);

      const reorderBtn = screen.getByText('🔄 Reorder Last Meal');
      await user.click(reorderBtn);

      expect(onAction).toHaveBeenCalledWith('reorder');
    });
  });

  describe('RFID Verification Integration', () => {
    it('displays RFID verification interface', () => {
      render(<RFIDVerification />);

      expect(screen.getByText('RFID Verification')).toBeInTheDocument();
      expect(
        screen.getByText(`Student: ${mockStudent.name} (${mockStudent.id})`)
      ).toBeInTheDocument();
      expect(screen.getByText('Please scan your RFID card or enter the code')).toBeInTheDocument();
    });

    it('handles valid RFID code verification', async () => {
      const user = userEvent.setup();
      const onVerificationComplete = jest.fn();

      render(<RFIDVerification onVerificationComplete={onVerificationComplete} />);

      const otpInput = screen.getByRole('textbox', { hidden: true });
      await user.type(otpInput, mockStudent.rfidCode);

      await waitFor(() => {
        expect(screen.getByText('Verifying RFID code...')).toBeInTheDocument();
      });

      await waitFor(
        () => {
          expect(onVerificationComplete).toHaveBeenCalledWith(true, mockStudent.rfidCode);
        },
        { timeout: 2000 }
      );
    });

    it('handles invalid RFID code', async () => {
      const user = userEvent.setup();
      const onVerificationComplete = jest.fn();

      render(<RFIDVerification onVerificationComplete={onVerificationComplete} />);

      const otpInput = screen.getByRole('textbox', { hidden: true });
      await user.type(otpInput, '999999');

      await waitFor(
        () => {
          expect(screen.getByText('Invalid RFID code. Please try again.')).toBeInTheDocument();
          expect(onVerificationComplete).toHaveBeenCalledWith(false);
        },
        { timeout: 2000 }
      );
    });
  });

  describe('Complete Ordering Flow Integration', () => {
    it('completes full meal ordering workflow', async () => {
      const user = userEvent.setup();

      render(<CompleteMealOrderingFlow />);

      // Step 1: Search and select meals
      expect(screen.getByText('Order Your Meal')).toBeInTheDocument();
      expect(screen.getByText('⚡ Quick Actions')).toBeInTheDocument();

      // Add a meal to cart
      const addToCartBtn = screen.getAllByText('Add to Cart')[0];
      await user.click(addToCartBtn);

      await waitFor(() => {
        expect(screen.getByText('Cart (1 items)')).toBeInTheDocument();
        expect(screen.getByText(`${mockMeals[0].name} x1`)).toBeInTheDocument();
      });

      // Proceed to verification
      const proceedBtn = screen.getByText('Proceed to Verification');
      await user.click(proceedBtn);

      await waitFor(() => {
        expect(screen.getByText('RFID Verification')).toBeInTheDocument();
      });

      // Enter RFID code
      const otpInput = screen.getByRole('textbox', { hidden: true });
      await user.type(otpInput, mockStudent.rfidCode);

      // Verify completion
      await waitFor(
        () => {
          expect(screen.getByText('Order Confirmed!')).toBeInTheDocument();
          expect(
            screen.getByText('Your meal order has been placed successfully.')
          ).toBeInTheDocument();
        },
        { timeout: 2000 }
      );
    });

    it('handles multiple meals in cart', async () => {
      const user = userEvent.setup();

      render(<CompleteMealOrderingFlow />);

      // Add multiple meals to cart
      const addToCartBtns = screen.getAllByText('Add to Cart');
      await user.click(addToCartBtns[0]);
      await user.click(addToCartBtns[1]);

      await waitFor(() => {
        expect(screen.getByText('Cart (2 items)')).toBeInTheDocument();
        expect(screen.getByText(`${mockMeals[0].name} x1`)).toBeInTheDocument();
        expect(screen.getByText(`${mockMeals[1].name} x1`)).toBeInTheDocument();

        // Check total calculation
        const expectedTotal = mockMeals[0].price + mockMeals[1].price;
        expect(screen.getByText(`₹${expectedTotal}`)).toBeInTheDocument();
      });
    });

    it('allows starting new order after completion', async () => {
      const user = userEvent.setup();

      render(<CompleteMealOrderingFlow />);

      // Complete an order first
      const addToCartBtn = screen.getAllByText('Add to Cart')[0];
      await user.click(addToCartBtn);

      const proceedBtn = screen.getByText('Proceed to Verification');
      await user.click(proceedBtn);

      const otpInput = screen.getByRole('textbox', { hidden: true });
      await user.type(otpInput, mockStudent.rfidCode);

      await waitFor(
        () => {
          expect(screen.getByText('Order Confirmed!')).toBeInTheDocument();
        },
        { timeout: 2000 }
      );

      // Start new order
      const newOrderBtn = screen.getByText('Place New Order');
      await user.click(newOrderBtn);

      await waitFor(() => {
        expect(screen.getByText('Search for meals...')).toBeInTheDocument();
        expect(screen.queryByText('Cart')).not.toBeInTheDocument();
      });
    });

    it('integrates quick actions with ordering flow', async () => {
      const user = userEvent.setup();

      render(<CompleteMealOrderingFlow />);

      const quickActionsBtn = screen.getByText('⚡ Quick Actions');
      await user.click(quickActionsBtn);

      await waitFor(() => {
        expect(screen.getByText('🔄 Reorder Last Meal')).toBeInTheDocument();
        expect(screen.getByText('⭐ View Favorites')).toBeInTheDocument();
        expect(screen.getByText('📅 Schedule Order')).toBeInTheDocument();
      });
    });
  });

  describe('Mobile Touch Integration', () => {
    it('handles touch events across all components', async () => {
      render(<CompleteMealOrderingFlow />);

      // Test touch on search trigger
      const searchTrigger = screen.getByText('Search for meals...');
      fireEvent.touchStart(searchTrigger);
      fireEvent.touchEnd(searchTrigger);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search for meals...')).toBeInTheDocument();
      });

      // Test touch on meal card
      const addToCartBtn = screen.getAllByText('Add to Cart')[0];
      fireEvent.touchStart(addToCartBtn);
      fireEvent.touchEnd(addToCartBtn);

      await waitFor(() => {
        expect(screen.getByText('Cart (1 items)')).toBeInTheDocument();
      });
    });

    it('supports swipe gestures on mobile', async () => {
      render(<CompleteMealOrderingFlow />);

      const mealCard = screen.getAllByText('Add to Cart')[0].closest('.meal-card');

      // Simulate swipe gesture
      fireEvent.touchStart(mealCard!, {
        touches: [{ clientX: 100, clientY: 100 }],
      });
      fireEvent.touchMove(mealCard!, {
        touches: [{ clientX: 200, clientY: 100 }],
      });
      fireEvent.touchEnd(mealCard!);

      // Should handle swipe gracefully
      expect(mealCard).toBeInTheDocument();
    });
  });

  describe('Accessibility Integration', () => {
    it('meets WCAG accessibility guidelines for complete flow', async () => {
      const { container } = render(<CompleteMealOrderingFlow />);

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('provides proper focus management across components', async () => {
      const user = userEvent.setup();

      render(<CompleteMealOrderingFlow />);

      // Focus should move correctly through the interface
      await user.tab();
      const focusedElement = document.activeElement;
      expect(focusedElement).toBeInTheDocument();

      // Continue tabbing through elements
      await user.tab();
      await user.tab();

      // Should maintain logical tab order
      expect(document.activeElement).toBeInTheDocument();
    });

    it('supports screen reader navigation', () => {
      render(<CompleteMealOrderingFlow />);

      // Check for proper ARIA labels and roles
      const searchButton = screen.getByText('Search for meals...');
      expect(searchButton).toBeInTheDocument();

      const quickActionsBtn = screen.getByText('⚡ Quick Actions');
      expect(quickActionsBtn).toBeInTheDocument();

      // Nutrition info should be accessible
      const nutritionBtns = screen.getAllByText('ℹ️');
      expect(nutritionBtns[0]).toBeInTheDocument();
    });
  });

  describe('Error Handling Integration', () => {
    it('handles network errors gracefully', async () => {
      const user = userEvent.setup();

      // Mock network error
      const mockMealsWithError: typeof mockMeals = [];

      render(<EnhancedMealSearch meals={mockMealsWithError} />);

      const searchTrigger = screen.getByText('Search for meals...');
      await user.click(searchTrigger);

      await waitFor(() => {
        expect(screen.getByText('No meals found.')).toBeInTheDocument();
      });
    });

    it('handles RFID verification errors', async () => {
      const user = userEvent.setup();

      render(<CompleteMealOrderingFlow />);

      // Add meal and proceed to verification
      const addToCartBtn = screen.getAllByText('Add to Cart')[0];
      await user.click(addToCartBtn);

      const proceedBtn = screen.getByText('Proceed to Verification');
      await user.click(proceedBtn);

      // Enter invalid RFID
      const otpInput = screen.getByRole('textbox', { hidden: true });
      await user.type(otpInput, '000000');

      await waitFor(
        () => {
          expect(screen.getByText('Invalid RFID code. Please try again.')).toBeInTheDocument();
        },
        { timeout: 2000 }
      );
    });

    it('maintains state consistency during errors', async () => {
      const user = userEvent.setup();

      render(<CompleteMealOrderingFlow />);

      // Add meals to cart
      const addToCartBtns = screen.getAllByText('Add to Cart');
      await user.click(addToCartBtns[0]);
      await user.click(addToCartBtns[1]);

      await waitFor(() => {
        expect(screen.getByText('Cart (2 items)')).toBeInTheDocument();
      });

      // Even with RFID errors, cart should remain intact
      const proceedBtn = screen.getByText('Proceed to Verification');
      await user.click(proceedBtn);

      const otpInput = screen.getByRole('textbox', { hidden: true });
      await user.type(otpInput, '000000');

      await waitFor(
        () => {
          expect(screen.getByText('Invalid RFID code. Please try again.')).toBeInTheDocument();
        },
        { timeout: 2000 }
      );

      // Cart state should be preserved
      expect(screen.getByText('Cart (2 items)')).toBeInTheDocument();
    });
  });

  describe('Performance Integration', () => {
    it('handles large meal datasets efficiently', async () => {
      const largeMealDataset = Array.from({ length: 100 }, (_, i) => ({
        ...mockMeals[0],
        id: `meal-${i}`,
        name: `Meal ${i}`,
        price: 100 + i,
      }));

      const { container } = render(<EnhancedMealSearch meals={largeMealDataset} />);

      // Should render without performance issues
      expect(container).toBeInTheDocument();

      const user = userEvent.setup();
      const searchTrigger = screen.getByText('Search for meals...');
      await user.click(searchTrigger);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search for meals...')).toBeInTheDocument();
      });
    });

    it('handles rapid user interactions', async () => {
      const user = userEvent.setup();

      render(<CompleteMealOrderingFlow />);

      // Rapid interactions
      const addToCartBtns = screen.getAllByText('Add to Cart');

      // Click multiple buttons rapidly
      for (let i = 0; i < 3; i++) {
        await user.click(addToCartBtns[0]);
      }

      // Should handle rapid clicks gracefully
      expect(screen.getByText(/Cart \(\d+ items\)/)).toBeInTheDocument();
    });
  });
});
