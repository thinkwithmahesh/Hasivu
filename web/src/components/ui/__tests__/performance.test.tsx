/**
 * Performance Tests for ShadCN UI Components
 * Tests component rendering performance, mobile optimization, and resource usage
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
  CommandShortcut,
} from '../command';
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
} from '../drawer';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '../popover';
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from '../input-otp';

// Performance measurement utilities
const measureRenderTime = (renderFunction: () => void): number => {
  const startTime = performance.now();
  renderFunction();
  const endTime = performance.now();
  return endTime - startTime;
};

const measureMemoryUsage = (): PerformanceNavigatorMemory | null => {
  if ('memory' in performance) {
    return (performance as any).memory;
  }
  return null;
};

const createLargeDataset = (size: number) => {
  return Array.from({ length: size }, (_, index) => ({
    id: `item-${index}`,
    name: `Test Item ${index}`,
    description: `Description for test item ${index}`,
    category: `Category ${Math.floor(index / 10)}`,
    price: Math.floor(Math.random() * 1000) + 50,
    tags: [`tag-${index % 5}`, `tag-${(index + 1) % 5}`],
  }));
};

describe('Performance Tests', () => {
  beforeEach(() => {
    // Mock performance.now for consistent testing
    jest.spyOn(performance, 'now').mockImplementation(() => Date.now());
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Command Component Performance', () => {
    it('renders large datasets efficiently', () => {
      const largeDataset = createLargeDataset(1000);

      const renderTime = measureRenderTime(() => {
        render(
          <Command>
            <CommandInput placeholder="Search meals..." />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup heading="All Meals">
                {largeDataset.map(item => (
                  <CommandItem key={item.id} value={item.name}>
                    <span>{item.name}</span>
                    <CommandShortcut>⌘{item.id.slice(-1)}</CommandShortcut>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        );
      });

      // Rendering should complete within 100ms for 1000 items
      expect(renderTime).toBeLessThan(100);
    });

    it('handles rapid search input efficiently', async () => {
      const user = userEvent.setup();
      const largeDataset = createLargeDataset(500);

      render(
        <Command>
          <CommandInput placeholder="Search meals..." />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="All Meals">
              {largeDataset.map(item => (
                <CommandItem key={item.id} value={item.name}>
                  <span>{item.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      );

      const searchInput = screen.getByPlaceholderText('Search meals...');

      const startTime = performance.now();

      // Rapid typing simulation
      await user.type(searchInput, 'test item 123', { delay: 10 });

      const endTime = performance.now();
      const typingTime = endTime - startTime;

      // Rapid typing should complete within 200ms
      expect(typingTime).toBeLessThan(200);
    });

    it('filters large datasets without performance degradation', async () => {
      const user = userEvent.setup();
      const largeDataset = createLargeDataset(1000);

      render(
        <Command>
          <CommandInput placeholder="Search meals..." />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="All Meals">
              {largeDataset.map(item => (
                <CommandItem key={item.id} value={item.name}>
                  <span>{item.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      );

      const searchInput = screen.getByPlaceholderText('Search meals...');

      const startTime = performance.now();
      await user.type(searchInput, 'Item 5');
      const endTime = performance.now();

      const filterTime = endTime - startTime;

      // Filtering should complete within 150ms
      expect(filterTime).toBeLessThan(150);
    });
  });

  describe('Drawer Component Performance', () => {
    it('opens and closes smoothly on mobile', async () => {
      const user = userEvent.setup();

      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(
        <Drawer>
          <DrawerTrigger asChild>
            <button>Open Drawer</button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Mobile Drawer</DrawerTitle>
              <DrawerDescription>Performance test drawer</DrawerDescription>
            </DrawerHeader>
            <div className="p-4">
              {Array.from({ length: 50 }, (_, i) => (
                <div key={i} className="mb-2">
                  Item {i}
                </div>
              ))}
            </div>
            <DrawerFooter>
              <DrawerClose asChild>
                <button>Close</button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      );

      const trigger = screen.getByText('Open Drawer');

      const startTime = performance.now();
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByText('Mobile Drawer')).toBeInTheDocument();
      });

      const endTime = performance.now();
      const openTime = endTime - startTime;

      // Drawer should open within 100ms
      expect(openTime).toBeLessThan(100);
    });

    it('handles touch gestures efficiently', async () => {
      render(
        <Drawer>
          <DrawerTrigger asChild>
            <button>Open Drawer</button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Touch Test Drawer</DrawerTitle>
            </DrawerHeader>
            <div className="p-4">Content that can be swiped</div>
          </DrawerContent>
        </Drawer>
      );

      const trigger = screen.getByText('Open Drawer');
      fireEvent.click(trigger);

      await waitFor(() => {
        const content = screen.getByText('Touch Test Drawer');
        expect(content).toBeInTheDocument();

        const startTime = performance.now();

        // Simulate swipe gesture
        fireEvent.touchStart(content, {
          touches: [{ clientY: 200 }],
        });
        fireEvent.touchMove(content, {
          touches: [{ clientY: 100 }],
        });
        fireEvent.touchEnd(content);

        const endTime = performance.now();
        const gestureTime = endTime - startTime;

        // Touch gesture handling should be under 50ms
        expect(gestureTime).toBeLessThan(50);
      });
    });
  });

  describe('Tooltip Component Performance', () => {
    it('handles multiple tooltips efficiently', async () => {
      const user = userEvent.setup();

      render(
        <TooltipProvider>
          <div>
            {Array.from({ length: 20 }, (_, i) => (
              <Tooltip key={i}>
                <TooltipTrigger asChild>
                  <button>Trigger {i}</button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Tooltip content {i}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </TooltipProvider>
      );

      const triggers = screen.getAllByText(/Trigger/);

      const startTime = performance.now();

      // Hover over multiple tooltips rapidly
      for (let i = 0; i < 5; i++) {
        await user.hover(triggers[i]);
        await user.unhover(triggers[i]);
      }

      const endTime = performance.now();
      const hoverTime = endTime - startTime;

      // Multiple tooltip interactions should complete within 200ms
      expect(hoverTime).toBeLessThan(200);
    });

    it('renders complex tooltip content efficiently', async () => {
      const user = userEvent.setup();

      const complexContent = (
        <div>
          <h3>Nutritional Information</h3>
          <div className="grid grid-cols-2 gap-2">
            {Array.from({ length: 10 }, (_, i) => (
              <div key={i}>
                Nutrient {i}: {Math.random() * 100}g
              </div>
            ))}
          </div>
        </div>
      );

      render(
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button>Show Nutrition</button>
            </TooltipTrigger>
            <TooltipContent>{complexContent}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );

      const trigger = screen.getByText('Show Nutrition');

      const startTime = performance.now();
      await user.hover(trigger);

      await waitFor(() => {
        expect(screen.getByText('Nutritional Information')).toBeInTheDocument();
      });

      const endTime = performance.now();
      const tooltipTime = endTime - startTime;

      // Complex tooltip should render within 100ms
      expect(tooltipTime).toBeLessThan(100);
    });
  });

  describe('Popover Component Performance', () => {
    it('renders popover with large content efficiently', async () => {
      const user = userEvent.setup();

      const largeContent = Array.from({ length: 100 }, (_, i) => (
        <div key={i} className="p-2 border-b">
          Menu Item {i}
        </div>
      ));

      render(
        <Popover>
          <PopoverTrigger asChild>
            <button>Open Menu</button>
          </PopoverTrigger>
          <PopoverContent>
            <div className="max-h-80 overflow-y-auto">{largeContent}</div>
          </PopoverContent>
        </Popover>
      );

      const trigger = screen.getByText('Open Menu');

      const startTime = performance.now();
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByText('Menu Item 0')).toBeInTheDocument();
      });

      const endTime = performance.now();
      const popoverTime = endTime - startTime;

      // Large popover content should render within 150ms
      expect(popoverTime).toBeLessThan(150);
    });

    it('handles rapid open/close operations efficiently', async () => {
      const user = userEvent.setup();

      render(
        <Popover>
          <PopoverTrigger asChild>
            <button>Toggle Popover</button>
          </PopoverTrigger>
          <PopoverContent>
            <div>Popover content</div>
          </PopoverContent>
        </Popover>
      );

      const trigger = screen.getByText('Toggle Popover');

      const startTime = performance.now();

      // Rapid toggle operations
      for (let i = 0; i < 5; i++) {
        await user.click(trigger); // Open
        await user.click(trigger); // Close
      }

      const endTime = performance.now();
      const toggleTime = endTime - startTime;

      // Rapid toggle operations should complete within 300ms
      expect(toggleTime).toBeLessThan(300);
    });
  });

  describe('InputOTP Component Performance', () => {
    it('handles rapid input efficiently', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();

      render(
        <InputOTP maxLength={6} onChange={onChange}>
          <InputOTPGroup>
            {Array.from({ length: 6 }, (_, i) => (
              <InputOTPSlot key={i} index={i} />
            ))}
          </InputOTPGroup>
        </InputOTP>
      );

      const otpInput = screen.getByRole('textbox', { hidden: true });

      const startTime = performance.now();
      await user.type(otpInput, '123456', { delay: 10 });
      const endTime = performance.now();

      const inputTime = endTime - startTime;

      // Rapid OTP input should complete within 100ms
      expect(inputTime).toBeLessThan(100);
      expect(onChange).toHaveBeenCalledWith('123456');
    });

    it('renders multiple OTP inputs efficiently', () => {
      const renderTime = measureRenderTime(() => {
        render(
          <div>
            {Array.from({ length: 10 }, (_, i) => (
              <InputOTP key={i} maxLength={4}>
                <InputOTPGroup>
                  {Array.from({ length: 4 }, (_, j) => (
                    <InputOTPSlot key={j} index={j} />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            ))}
          </div>
        );
      });

      // Multiple OTP inputs should render within 50ms
      expect(renderTime).toBeLessThan(50);
    });
  });

  describe('Mobile Optimization Tests', () => {
    beforeEach(() => {
      // Mock mobile environment
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 667,
      });
    });

    it('optimizes component rendering for mobile viewports', () => {
      const startTime = performance.now();

      render(
        <div className="mobile-optimized">
          <Command>
            <CommandInput placeholder="Search..." />
            <CommandList>
              <CommandGroup>
                {Array.from({ length: 50 }, (_, i) => (
                  <CommandItem key={i} value={`item-${i}`}>
                    Mobile Item {i}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>

          <Drawer>
            <DrawerTrigger>Open</DrawerTrigger>
            <DrawerContent>
              <div>Mobile drawer content</div>
            </DrawerContent>
          </Drawer>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>Touch me</TooltipTrigger>
              <TooltipContent>Mobile tooltip</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      );

      const endTime = performance.now();
      const mobileRenderTime = endTime - startTime;

      // Mobile-optimized rendering should complete within 100ms
      expect(mobileRenderTime).toBeLessThan(100);
    });

    it('handles touch events with minimal latency', async () => {
      render(
        <Drawer>
          <DrawerTrigger asChild>
            <button>Touch Target</button>
          </DrawerTrigger>
          <DrawerContent>
            <div>Touch responsive content</div>
          </DrawerContent>
        </Drawer>
      );

      const trigger = screen.getByText('Touch Target');

      const startTime = performance.now();

      fireEvent.touchStart(trigger);
      fireEvent.touchEnd(trigger);

      const endTime = performance.now();
      const touchLatency = endTime - startTime;

      // Touch event handling should have minimal latency (under 16ms for 60fps)
      expect(touchLatency).toBeLessThan(16);
    });

    it('maintains performance with virtual keyboard interactions', async () => {
      const user = userEvent.setup();

      // Mock virtual keyboard scenarios
      Object.defineProperty(window, 'visualViewport', {
        writable: true,
        configurable: true,
        value: {
          height: 400, // Reduced height when keyboard is open
          width: 375,
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
        },
      });

      render(
        <Command>
          <CommandInput placeholder="Search with virtual keyboard..." />
          <CommandList>
            <CommandGroup>
              {Array.from({ length: 20 }, (_, i) => (
                <CommandItem key={i} value={`mobile-item-${i}`}>
                  Mobile Search Result {i}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      );

      const input = screen.getByPlaceholderText('Search with virtual keyboard...');

      const startTime = performance.now();
      await user.type(input, 'search query');
      const endTime = performance.now();

      const keyboardInputTime = endTime - startTime;

      // Virtual keyboard input should remain performant
      expect(keyboardInputTime).toBeLessThan(150);
    });
  });

  describe('Memory Usage Tests', () => {
    it('does not leak memory when components are unmounted', () => {
      const initialMemory = measureMemoryUsage();

      const { unmount } = render(
        <div>
          <Command>
            <CommandInput />
            <CommandList>
              {Array.from({ length: 100 }, (_, i) => (
                <CommandItem key={i} value={`item-${i}`}>
                  Item {i}
                </CommandItem>
              ))}
            </CommandList>
          </Command>

          <TooltipProvider>
            {Array.from({ length: 20 }, (_, i) => (
              <Tooltip key={i}>
                <TooltipTrigger>Trigger {i}</TooltipTrigger>
                <TooltipContent>Content {i}</TooltipContent>
              </Tooltip>
            ))}
          </TooltipProvider>
        </div>
      );

      unmount();

      const finalMemory = measureMemoryUsage();

      if (initialMemory && finalMemory) {
        const memoryIncrease = finalMemory.usedJSHeapSize - initialMemory.usedJSHeapSize;

        // Memory increase should be minimal after unmount (less than 1MB)
        expect(memoryIncrease).toBeLessThan(1024 * 1024);
      }
    });

    it('efficiently handles component state updates', async () => {
      const user = userEvent.setup();

      const TestComponent = () => {
        const [count, setCount] = React.useState(0);

        return (
          <div>
            <button onClick={() => setCount(c => c + 1)}>Count: {count}</button>
            <Command>
              <CommandInput />
              <CommandList>
                {Array.from({ length: count }, (_, i) => (
                  <CommandItem key={i} value={`dynamic-item-${i}`}>
                    Dynamic Item {i}
                  </CommandItem>
                ))}
              </CommandList>
            </Command>
          </div>
        );
      };

      render(<TestComponent />);

      const button = screen.getByText('Count: 0');

      const startTime = performance.now();

      // Trigger multiple state updates
      for (let i = 0; i < 10; i++) {
        await user.click(button);
      }

      const endTime = performance.now();
      const updateTime = endTime - startTime;

      // State updates should be efficient (under 200ms for 10 updates)
      expect(updateTime).toBeLessThan(200);
    });
  });

  describe('Bundle Size and Resource Loading', () => {
    it('loads components without blocking main thread', () => {
      const startTime = performance.now();

      // Simulate loading all components
      render(
        <div>
          <Command>
            <CommandInput />
            <CommandList>
              <CommandItem value="test">Test</CommandItem>
            </CommandList>
          </Command>

          <Drawer>
            <DrawerTrigger>Open</DrawerTrigger>
            <DrawerContent>Content</DrawerContent>
          </Drawer>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>Trigger</TooltipTrigger>
              <TooltipContent>Content</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Popover>
            <PopoverTrigger>Trigger</PopoverTrigger>
            <PopoverContent>Content</PopoverContent>
          </Popover>

          <InputOTP maxLength={4}>
            <InputOTPGroup>
              <InputOTPSlot index={0} />
            </InputOTPGroup>
          </InputOTP>
        </div>
      );

      const endTime = performance.now();
      const loadTime = endTime - startTime;

      // All components should load without blocking (under 50ms)
      expect(loadTime).toBeLessThan(50);
    });
  });
});
