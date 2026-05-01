'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MealCard } from '../../ui/MealCard';

// Mock data representing schema interactions
const students = [
  { id: '1', name: 'Leo', allergies: ['nuts'], grade: '1A' },
  { id: '2', name: 'Mia', allergies: [], grade: '3B' },
];

const menuDates = [
  { id: 'today', label: 'Today', date: '12 Apr' },
  { id: 'tomorrow', label: 'Tomorrow', date: '13 Apr' },
  { id: 'wednesday', label: 'Wednesday', date: '14 Apr' },
  { id: 'thursday', label: 'Thursday', date: '15 Apr' },
];

const menuItems = [
  {
    id: 'm1',
    name: 'Chicken Pasta Bake',
    price: 120,
    dietaryFlags: ['nonVeg'] as any[],
    allergens: ['dairy'],
  },
  {
    id: 'm2',
    name: 'Peanut Butter Sandwich',
    price: 50,
    dietaryFlags: ['veg', 'nuts'] as any[],
    allergens: ['nuts', 'wheat'],
  },
  {
    id: 'm3',
    name: 'Fruit Bowl',
    price: 40,
    dietaryFlags: ['veg', 'gf', 'df'] as any[],
    allergens: [],
  },
];

export function MenuScreen() {
  const [selectedStudent, setSelectedStudent] = useState(students[0]);
  const [selectedDate, setSelectedDate] = useState(menuDates[0].id);

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
                  transition={{ type: 'spring', damping: 25, stiffness: 350 }}
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
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-ui font-bold text-[18px] text-pm-text-primary">Available Options</h2>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <AnimatePresence mode="popLayout">
            {menuItems.map(item => {
              // Exact Allergy Strict Checker Logic mapped against Student profile
              const hasAllergyConflict = selectedStudent.allergies.some(allergy =>
                item.allergens.includes(allergy)
              );

              return (
                <motion.div
                  key={item.id + selectedStudent.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
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
                      hasAllergyConflict ? `${selectedStudent.name} is allergic` : undefined
                    }
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
