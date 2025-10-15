'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  snapPoints?: number[]; // Array of heights in vh (e.g., [30, 60, 90])
  initialSnapPoint?: number;
  className?: string;
  backdrop?: boolean;
  swipeToClose?: boolean;
  showHandle?: boolean;
  maxHeight?: string;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  children,
  title,
  snapPoints = [90],
  initialSnapPoint = 0,
  className,
  backdrop = true,
  swipeToClose = true,
  showHandle = true,
  maxHeight = '90vh',
}) => {
  const [currentSnapPoint, setCurrentSnapPoint] = useState(initialSnapPoint);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const sheetRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number>(0);
  const initialHeight = useRef<number>(0);

  // Handle snap point changes
  const snapToPoint = useCallback(
    (pointIndex: number) => {
      if (pointIndex < 0 || pointIndex >= snapPoints.length) return;

      setCurrentSnapPoint(pointIndex);
      setDragOffset(0);

      if ('vibrate' in navigator) {
        navigator.vibrate(10);
      }
    },
    [snapPoints]
  );

  // Handle touch gestures
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!swipeToClose) return;

      touchStartY.current = e.touches[0].clientY;
      initialHeight.current = sheetRef.current?.clientHeight || 0;
      setIsDragging(true);
    },
    [swipeToClose]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isDragging || !swipeToClose) return;

      const currentY = e.touches[0].clientY;
      const deltaY = currentY - touchStartY.current;

      // Only allow dragging down
      if (deltaY > 0) {
        setDragOffset(deltaY);
      }
    },
    [isDragging, swipeToClose]
  );

  const handleTouchEnd = useCallback(() => {
    if (!isDragging || !swipeToClose) return;

    const threshold = 100;
    const velocityThreshold = 10;

    if (dragOffset > threshold) {
      // Close if dragged far enough
      onClose();
    } else if (snapPoints.length > 1) {
      // Snap to nearest point
      const currentHeight = snapPoints[currentSnapPoint];
      const dragPercentage = (dragOffset / window.innerHeight) * 100;

      if (dragPercentage > velocityThreshold) {
        // Move to next snap point or close
        if (currentSnapPoint > 0) {
          snapToPoint(currentSnapPoint - 1);
        } else {
          onClose();
        }
      } else {
        // Stay at current snap point
        setDragOffset(0);
      }
    } else {
      // Reset position
      setDragOffset(0);
    }

    setIsDragging(false);
  }, [isDragging, dragOffset, snapPoints, currentSnapPoint, onClose, snapToPoint, swipeToClose]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Reset state when closed
  useEffect(() => {
    if (!isOpen) {
      setCurrentSnapPoint(initialSnapPoint);
      setDragOffset(0);
      setIsDragging(false);
    }
  }, [isOpen, initialSnapPoint]);

  if (!isOpen) return null;

  const currentHeight = snapPoints[currentSnapPoint];
  const translateY = isDragging ? Math.max(0, dragOffset) : 0;

  const sheetContent = (
    <>
      {/* Backdrop */}
      {backdrop && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 animate-fade-in"
          onClick={onClose}
        />
      )}

      {/* Bottom Sheet */}
      <div
        ref={sheetRef}
        className={cn(
          'fixed bottom-0 left-0 right-0 z-50',
          'bg-white rounded-t-xl shadow-2xl',
          'transition-transform duration-300 ease-out',
          isDragging && 'transition-none',
          className
        )}
        style={{
          height: `${currentHeight}vh`,
          maxHeight,
          transform: `translateY(${translateY}px)`,
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      >
        {/* Handle */}
        {showHandle && (
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-10 h-1 bg-gray-300 rounded-full" />
          </div>
        )}

        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-auto overscroll-behavior-contain">
          <div className="pb-safe-bottom">{children}</div>
        </div>

        {/* Snap point indicators */}
        {snapPoints.length > 1 && (
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2 space-y-2">
            {snapPoints.map((_, index) => (
              <button
                key={index}
                onClick={() => snapToPoint(index)}
                className={cn(
                  'w-2 h-2 rounded-full transition-colors',
                  index === currentSnapPoint ? 'bg-primary' : 'bg-gray-300'
                )}
                aria-label={`Snap to ${snapPoints[index]}% height`}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );

  return createPortal(sheetContent, document.body);
};

// Hook for managing bottom sheet state
export const useBottomSheet = (initialState = false) => {
  const [isOpen, setIsOpen] = useState(initialState);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen(prev => !prev), []);

  return {
    isOpen,
    open,
    close,
    toggle,
    setIsOpen,
  };
};

// Pre-built bottom sheets for common use cases

// Meal details bottom sheet
interface MealDetailsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  meal: {
    id: string;
    name: string;
    description: string;
    price: number;
    image: string;
    allergens: string[];
    nutrition: {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
    };
  } | null;
  onAddToCart?: (meal: any) => void;
}

export const MealDetailsSheet: React.FC<MealDetailsSheetProps> = ({
  isOpen,
  onClose,
  meal,
  onAddToCart,
}) => {
  if (!meal) return null;

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      snapPoints={[60, 85]}
      title={meal.name}
      className="max-w-md mx-auto"
    >
      <div className="p-4 space-y-4">
        {/* Meal Image */}
        <div className="relative h-48 rounded-lg overflow-hidden">
          <img src={meal.image} alt={meal.name} className="w-full h-full object-cover" />
          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1">
            <span className="text-lg font-bold text-green-600">₹{meal.price}</span>
          </div>
        </div>

        {/* Description */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
          <p className="text-gray-600 text-sm leading-relaxed">{meal.description}</p>
        </div>

        {/* Nutrition */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">Nutrition per serving</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-gray-900">{meal.nutrition.calories}</div>
              <div className="text-xs text-gray-500">Calories</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-gray-900">{meal.nutrition.protein}g</div>
              <div className="text-xs text-gray-500">Protein</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-gray-900">{meal.nutrition.carbs}g</div>
              <div className="text-xs text-gray-500">Carbs</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-gray-900">{meal.nutrition.fat}g</div>
              <div className="text-xs text-gray-500">Fat</div>
            </div>
          </div>
        </div>

        {/* Allergens */}
        {meal.allergens.length > 0 && (
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Allergens</h3>
            <div className="flex flex-wrap gap-2">
              {meal.allergens.map(allergen => (
                <span
                  key={allergen}
                  className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full"
                >
                  {allergen}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Add to Cart Button */}
        {onAddToCart && (
          <div className="pt-4">
            <Button onClick={() => onAddToCart(meal)} className="w-full h-12 text-lg" haptic>
              Add to Cart - ₹{meal.price}
            </Button>
          </div>
        )}
      </div>
    </BottomSheet>
  );
};

// RFID Scanner Bottom Sheet
interface RFIDScannerSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onScanComplete?: (rfidCode: string) => void;
}

export const RFIDScannerSheet: React.FC<RFIDScannerSheetProps> = ({
  isOpen,
  onClose,
  onScanComplete,
}) => {
  const [scanning, setScanning] = useState(false);
  const [rfidCode, setRfidCode] = useState('');

  const startScan = useCallback(() => {
    setScanning(true);
    // Simulate RFID scan
    setTimeout(() => {
      const mockRFID = `RFID${Date.now().toString().slice(-6)}`;
      setRfidCode(mockRFID);
      setScanning(false);
      onScanComplete?.(mockRFID);
    }, 2000);
  }, [onScanComplete]);

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="RFID Scanner" snapPoints={[50]}>
      <div className="p-6 text-center space-y-6">
        {/* Scanner Animation */}
        <div className="relative mx-auto w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
          <div
            className={cn(
              'w-16 h-16 border-4 border-white rounded-full',
              scanning && 'animate-ping'
            )}
          />
          {scanning && (
            <div className="absolute inset-0 border-4 border-white/30 rounded-full animate-pulse" />
          )}
        </div>

        {/* Status */}
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-gray-900">
            {scanning ? 'Scanning...' : rfidCode ? 'Scan Complete!' : 'Ready to Scan'}
          </h3>
          {rfidCode && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-green-800 font-mono">{rfidCode}</p>
            </div>
          )}
        </div>

        {/* Action Button */}
        <Button
          onClick={startScan}
          disabled={scanning}
          className="w-full h-12"
          loading={scanning}
          loadingText="Scanning..."
          haptic
        >
          {rfidCode ? 'Scan Again' : 'Start Scan'}
        </Button>

        {/* Instructions */}
        <p className="text-sm text-gray-500">Hold your RFID card near the device to scan</p>
      </div>
    </BottomSheet>
  );
};
