'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { MealCard } from '../../ui/MealCard';

type DietaryFlag = 'veg' | 'nonVeg' | 'nuts' | 'gf' | 'df';
type StudentMenuProfile = { id: string; name: string; allergies: string[]; grade: string };
type MenuDateOption = { id: string; label: string; date: string };
type MenuItemView = {
  id: string;
  name: string;
  price: number;
  dietaryFlags: DietaryFlag[];
  allergens: string[];
};

// Mock data representing schema interactions
const students: StudentMenuProfile[] = [
  { id: '1', name: 'Leo', allergies: ['nuts'], grade: '1A' },
  { id: '2', name: 'Mia', allergies: [], grade: '3B' },
];

const menuDates: MenuDateOption[] = [
  { id: 'today', label: 'Today', date: '12 Apr' },
  { id: 'tomorrow', label: 'Tomorrow', date: '13 Apr' },
  { id: 'wednesday', label: 'Wednesday', date: '14 Apr' },
  { id: 'thursday', label: 'Thursday', date: '15 Apr' },
];

const menuItems: MenuItemView[] = [
  {
    id: 'm1',
    name: 'Chicken Pasta Bake',
    price: 120,
    dietaryFlags: ['nonVeg'],
    allergens: ['dairy'],
  },
  {
    id: 'm2',
    name: 'Peanut Butter Sandwich',
    price: 50,
    dietaryFlags: ['veg', 'nuts'],
    allergens: ['nuts', 'wheat'],
  },
  {
    id: 'm3',
    name: 'Fruit Bowl',
    price: 40,
    dietaryFlags: ['veg', 'gf', 'df'],
    allergens: [],
  },
];

export function MenuScreen() {
  const [selectedStudent, setSelectedStudent] = useState(students[0]);
  const [selectedDate, setSelectedDate] = useState(menuDates[0].id);
  const reducedMotion = useReducedMotion();
  const [minutesLeft, setMinutesLeft] = useState(22);

  React.useEffect(() => {
    const id = window.setInterval(() => {
      setMinutesLeft(prev => Math.max(0, prev - 1));
    }, 60000);
    return () => window.clearInterval(id);
  }, []);

  const isClosed = minutesLeft <= 0;

  return (
    <div className="w-full flex flex-col pt-12 min-h-screen">
      <div className="px-4 mb-4">
        <h1 className="font-hero text-[32px] text-pm-text-primary leading-tight mb-4">
          Order Lunch
        </h1>

        {/* Child Selector */}
        <div className="flex gap-2 mb-6 overflow-x-auto hide-scrollbar pb-1 -mx-4 px-4 snap-x">
          {students.map(student => (
            <button
              key={student.id}
              onClick={() => setSelectedStudent(student)}
              className={`snap-center shrink-0 flex items-center px-4 py-2.5 rounded-pill border-2 transition-colors ${
                selectedStudent.id === student.id
                  ? 'border-pm-primary-600 bg-pm-primary-50'
                  : 'border-pm-neutral-200 bg-pm-surface-1 hover:border-pm-primary-200'
              }`}
            >
              <div className="w-6 h-6 rounded-full bg-pm-primary-200 text-pm-primary-800 flex items-center justify-center font-ui font-bold text-[10px] mr-2">
                {student.name.charAt(0)}
              </div>
              <span
                className={`font-ui font-bold text-[14px] ${selectedStudent.id === student.id ? 'text-pm-primary-800' : 'text-pm-text-secondary'}`}
              >
                {student.name}
              </span>
            </button>
          ))}
        </div>

        {/* Date Scroller */}
        <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2 -mx-4 px-4 relative">
          {menuDates.map(date => (
            <button
              key={date.id}
              onClick={() => setSelectedDate(date.id)}
              className="relative shrink-0 flex flex-col items-center justify-center w-16 h-20 rounded-xl"
            >
              {selectedDate === date.id && (
                <motion.div
                  layoutId="date-selector"
                  className="absolute inset-0 bg-pm-primary-600 rounded-xl shadow-md"
                  transition={
                    reducedMotion
                      ? { duration: 0 }
                      : { type: 'spring', stiffness: 320, damping: 28 }
                  }
                />
              )}
              <span
                className={`relative z-10 font-ui font-semibold text-[11px] uppercase tracking-wider mb-1 ${selectedDate === date.id ? 'text-pm-primary-100' : 'text-pm-text-tertiary'}`}
              >
                {date.label.substring(0, 3)}
              </span>
              <span
                className={`relative z-10 font-ui font-bold text-[16px] ${selectedDate === date.id ? 'text-white' : 'text-pm-text-primary'}`}
              >
                {date.date.split(' ')[0]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Menu List */}
      <div className="flex-1 bg-pm-surface-2 rounded-t-[32px] px-4 pt-6 pb-24 shadow-inner">
        {!isClosed && minutesLeft >= 30 && minutesLeft <= 60 && (
          <div className="mb-4 rounded-lg border border-pm-semantic-warning/40 bg-pm-semantic-warning/10 px-3 py-2 text-[13px] font-ui text-pm-text-primary">
            Order by 9:00 AM today <span className="font-semibold text-pm-semantic-warning">({minutesLeft} min left)</span>
          </div>
        )}
        {!isClosed && minutesLeft < 30 && (
          <div
            role="alert"
            className="mb-4 rounded-lg border border-pm-semantic-danger/40 bg-pm-semantic-danger/10 px-3 py-2 text-[13px] font-ui text-pm-semantic-danger"
          >
            {minutesLeft}:{'00'} remaining — ordering closes very soon.
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <h2 className="font-ui font-bold text-[18px] text-pm-text-primary">Available Options</h2>
        </div>

        <div className="relative grid grid-cols-1 gap-4">
          {isClosed && (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-pm-neutral-100/80 backdrop-blur-sm">
              <div className="rounded-xl border border-pm-neutral-200 bg-pm-surface-1 px-4 py-3 text-center">
                <p className="font-ui text-[14px] font-semibold text-pm-text-primary">
                  Ordering closed for today
                </p>
                <p className="text-[12px] text-pm-text-secondary">Come back tomorrow morning.</p>
              </div>
            </div>
          )}
          <AnimatePresence mode="popLayout">
            {menuItems.length === 0 ? (
              <div className="rounded-xl border border-pm-neutral-200 bg-pm-surface-1 px-4 py-8 text-center">
                <p className="font-ui text-[15px] font-semibold text-pm-text-primary">
                  No meals available for this date
                </p>
                <p className="mt-1 text-[13px] text-pm-text-secondary">
                  Contact school admin for updates.
                </p>
              </div>
            ) : menuItems.map(item => {
              // Exact Allergy Strict Checker Logic mapped against Student profile
              const hasAllergyConflict = selectedStudent.allergies.some(allergy =>
                item.allergens.includes(allergy)
              );

              return (
                <motion.div
                  key={item.id + selectedStudent.id}
                  initial={reducedMotion ? undefined : { opacity: 0, y: 10 }}
                  animate={reducedMotion ? undefined : { opacity: 1, y: 0 }}
                  exit={reducedMotion ? undefined : { opacity: 0 }}
                  transition={reducedMotion ? { duration: 0 } : { duration: 0.2 }}
                  className="w-full"
                >
                  <MealCard
                    id={item.id}
                    name={item.name}
                    price={item.price}
                    description={`Contains: ${item.allergens.length ? item.allergens.join(', ') : 'None'}`}
                    dietaryFlags={item.dietaryFlags}
                    isAllergyConflict={hasAllergyConflict}
                    allergyWarningMessage={
                      hasAllergyConflict ? `Not suitable for ${selectedStudent.name}` : undefined
                    }
                    actionDisabled={isClosed}
                    onAddClick={() => {
                      // Emit specific AddToCart operation...
                    }}
                  />
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
