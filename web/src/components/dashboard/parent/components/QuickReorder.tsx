'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, Button, Badge } from '@/components/ui';
import {
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  Clock,
  Sparkles,
  CheckCircle,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Past order data (mock — replace with API when backend is wired)
interface PastOrderItem {
  name: string;
  quantity: number;
  price: number;
  emoji: string;
}

interface PastOrder {
  id: string;
  childName: string;
  childGrade: string;
  items: PastOrderItem[];
  totalAmount: number;
  orderDate: string;
  daysSinceOrder: number;
  isFavorite: boolean;
  mealType: 'breakfast' | 'lunch' | 'snack';
}

const mockPastOrders: PastOrder[] = [
  {
    id: 'ord-001',
    childName: 'Arjun',
    childGrade: '5A',
    items: [
      { name: 'Vegetable Biryani', quantity: 1, price: 85, emoji: '🍛' },
      { name: 'Raita', quantity: 1, price: 15, emoji: '🥣' },
    ],
    totalAmount: 100,
    orderDate: '2 days ago',
    daysSinceOrder: 2,
    isFavorite: true,
    mealType: 'lunch',
  },
  {
    id: 'ord-002',
    childName: 'Priya',
    childGrade: '3B',
    items: [
      { name: 'Paneer Sandwich', quantity: 1, price: 45, emoji: '🥪' },
      { name: 'Fresh Fruit Juice', quantity: 1, price: 25, emoji: '🧃' },
    ],
    totalAmount: 70,
    orderDate: '3 days ago',
    daysSinceOrder: 3,
    isFavorite: false,
    mealType: 'snack',
  },
  {
    id: 'ord-003',
    childName: 'Arjun',
    childGrade: '5A',
    items: [
      { name: 'Masala Dosa', quantity: 2, price: 60, emoji: '🫓' },
      { name: 'Sambar', quantity: 1, price: 10, emoji: '🍲' },
      { name: 'Chutney', quantity: 1, price: 5, emoji: '🟢' },
    ],
    totalAmount: 135,
    orderDate: '5 days ago',
    daysSinceOrder: 5,
    isFavorite: true,
    mealType: 'breakfast',
  },
  {
    id: 'ord-004',
    childName: 'Priya',
    childGrade: '3B',
    items: [
      { name: 'Curd Rice', quantity: 1, price: 40, emoji: '🍚' },
      { name: 'Pickle', quantity: 1, price: 5, emoji: '🌶️' },
    ],
    totalAmount: 45,
    orderDate: '1 week ago',
    daysSinceOrder: 7,
    isFavorite: false,
    mealType: 'lunch',
  },
  {
    id: 'ord-005',
    childName: 'Arjun',
    childGrade: '5A',
    items: [
      { name: 'Idli Plate', quantity: 1, price: 30, emoji: '⚪' },
      { name: 'Vada', quantity: 2, price: 20, emoji: '🟤' },
      { name: 'Filter Coffee', quantity: 1, price: 15, emoji: '☕' },
    ],
    totalAmount: 65,
    orderDate: '1 week ago',
    daysSinceOrder: 8,
    isFavorite: false,
    mealType: 'breakfast',
  },
];

const getMealTypeLabel = (type: PastOrder['mealType']) => {
  const labels = {
    breakfast: { text: 'Breakfast', bg: 'bg-amber-100 text-amber-800' },
    lunch: { text: 'Lunch', bg: 'bg-[var(--hasivu-primary)]/10 text-[var(--hasivu-primary)]' },
    snack: { text: 'Snack', bg: 'bg-emerald-100 text-emerald-800' },
  };
  return labels[type];
};

export function QuickReorder() {
  const router = useRouter();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [reorderingId, setReorderingId] = useState<string | null>(null);
  const [reorderedIds, setReorderedIds] = useState<Set<string>>(new Set());

  const handleReorder = async (order: PastOrder) => {
    setReorderingId(order.id);

    // Simulate a brief reorder animation
    await new Promise(resolve => setTimeout(resolve, 800));

    setReorderingId(null);
    setReorderedIds(prev => new Set(prev).add(order.id));

    // Navigate to menu with a toast-like feedback
    // In production, this would add items to cart via API
    setTimeout(() => {
      router.push('/menu');
    }, 600);
  };

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    const scrollAmount = 320;
    scrollContainerRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  if (mockPastOrders.length === 0) return null;

  return (
    <div className="relative">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[var(--hasivu-primary)]/10">
            <Sparkles className="h-5 w-5 text-[var(--hasivu-primary)]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[var(--hasivu-text-primary)]">
              Quick Reorder
            </h2>
            <p className="text-sm text-[var(--hasivu-text-secondary)]">
              One tap to reorder your favourite meals
            </p>
          </div>
        </div>

        {/* Scroll Controls */}
        <div className="hidden md:flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0 rounded-full border-[var(--hasivu-neutral-200)]"
            onClick={() => scroll('left')}
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0 rounded-full border-[var(--hasivu-neutral-200)]"
            onClick={() => scroll('right')}
            aria-label="Scroll right"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Scrollable Carousel */}
      <div
        ref={scrollContainerRef}
        className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-[var(--hasivu-neutral-300)] scrollbar-track-transparent"
        style={{ scrollbarWidth: 'thin' }}
      >
        {mockPastOrders.map(order => {
          const isReordering = reorderingId === order.id;
          const isReordered = reorderedIds.has(order.id);
          const mealLabel = getMealTypeLabel(order.mealType);

          return (
            <Card
              key={order.id}
              className={cn(
                'flex-shrink-0 w-[300px] snap-start transition-all duration-300',
                'border border-[var(--hasivu-neutral-200)] hover:border-[var(--hasivu-primary)]/30',
                'hover:shadow-[0_4px_20px_rgba(224,112,32,0.08)] hover:-translate-y-0.5',
                isReordered && 'border-[var(--hasivu-success)]/30 bg-[var(--hasivu-success)]/5'
              )}
            >
              <CardContent className="p-4">
                {/* Card Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[var(--hasivu-primary)]/10 text-sm font-semibold text-[var(--hasivu-primary)]">
                      {order.childName[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[var(--hasivu-text-primary)]">
                        {order.childName}
                      </p>
                      <p className="text-xs text-[var(--hasivu-text-secondary)]">
                        Grade {order.childGrade}
                      </p>
                    </div>
                  </div>
                  <Badge className={cn('text-xs border-0 font-medium', mealLabel.bg)}>
                    {mealLabel.text}
                  </Badge>
                </div>

                {/* Order Items */}
                <div className="bg-[var(--hasivu-bg-warm)] rounded-xl p-3 mb-3">
                  <div className="space-y-1.5">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{item.emoji}</span>
                          <span className="text-sm text-[var(--hasivu-text-primary)]">
                            {item.name}
                          </span>
                          {item.quantity > 1 && (
                            <span className="text-xs text-[var(--hasivu-text-secondary)]">
                              ×{item.quantity}
                            </span>
                          )}
                        </div>
                        <span className="text-xs font-medium text-[var(--hasivu-text-secondary)]">
                          ₹{item.price}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-1 text-xs text-[var(--hasivu-text-secondary)]">
                      <Clock className="h-3 w-3" />
                      <span>{order.orderDate}</span>
                    </div>
                    <p className="text-base font-bold text-[var(--hasivu-text-primary)] mt-0.5">
                      ₹{order.totalAmount}
                    </p>
                  </div>

                  {/* Reorder CTA */}
                  {isReordered ? (
                    <Button
                      size="sm"
                      disabled
                      className="bg-[var(--hasivu-success)] text-white cursor-default gap-1.5"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Added
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handleReorder(order)}
                      disabled={isReordering}
                      className={cn(
                        'bg-[var(--hasivu-primary)] hover:bg-[var(--hasivu-primary-dark)] text-white',
                        'gap-1.5 transition-all duration-200',
                        'shadow-[0_2px_8px_rgba(224,112,32,0.25)] hover:shadow-[0_4px_16px_rgba(224,112,32,0.3)]'
                      )}
                    >
                      {isReordering ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          Ordering...
                        </>
                      ) : (
                        <>
                          <ShoppingBag className="h-4 w-4" />
                          Reorder
                        </>
                      )}
                    </Button>
                  )}
                </div>

                {/* Favorite Indicator */}
                {order.isFavorite && (
                  <div className="mt-2 pt-2 border-t border-[var(--hasivu-neutral-200)]">
                    <span className="text-xs text-[var(--hasivu-primary)] font-medium flex items-center gap-1">
                      ⭐ Frequently ordered
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}

        {/* View All Orders Card */}
        <Card
          className="flex-shrink-0 w-[200px] snap-start border-dashed border-2 border-[var(--hasivu-neutral-300)] hover:border-[var(--hasivu-primary)]/40 cursor-pointer transition-all duration-300 hover:-translate-y-0.5"
          onClick={() => router.push('/orders')}
        >
          <CardContent className="p-4 h-full flex flex-col items-center justify-center text-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[var(--hasivu-primary)]/10">
              <ArrowRight className="h-6 w-6 text-[var(--hasivu-primary)]" />
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--hasivu-text-primary)]">
                View All Orders
              </p>
              <p className="text-xs text-[var(--hasivu-text-secondary)] mt-1">
                See full order history
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
