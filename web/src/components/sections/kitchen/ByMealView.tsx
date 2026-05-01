'use client';

import React from 'react';
import { Card, CardContent } from '../../ui/card';
import { ProgressBar } from '../../ui/ProgressBar';

const mockMealsAggregated = [
  { id: 'm1', name: 'Chicken Pasta Bake', target: 120, current: 80, unit: 'portions' },
  { id: 'm2', name: 'Dal Rice Combos', target: 200, current: 200, unit: 'portions' },
  { id: 'm3', name: 'Fruit Bowls', target: 85, current: 20, unit: 'bowls' },
];

export function ByMealView() {
  return (
    <div className="flex flex-col gap-6 w-full pb-12 animate-fade-in-up">
      <div className="flex items-center mb-2">
        <h1 className="font-hero text-[32px] text-pm-text-primary leading-tight">
          Production Schedule
        </h1>
      </div>

      <div className="flex flex-col gap-6">
        {mockMealsAggregated.map(meal => (
          <Card
            key={meal.id}
            className="p-2 border-2 border-pm-neutral-100 hover:border-pm-primary-300"
          >
            <CardContent className="p-6 flex flex-col md:flex-row md:items-center gap-6">
              <div className="w-full md:w-1/3">
                <h3 className="font-ui font-bold text-[22px] text-pm-text-primary mb-1">
                  {meal.name}
                </h3>
                <p className="font-ui text-[16px] text-pm-text-tertiary">
                  Total required: {meal.target} {meal.unit}
                </p>
              </div>

              <div className="w-full md:w-2/3 flex flex-col justify-center">
                <ProgressBar
                  value={meal.current}
                  max={meal.target}
                  size="lg"
                  color={meal.current === meal.target ? 'success' : 'primary'}
                  label="Preparation Status"
                />
                <div className="flex justify-between items-center mt-3">
                  <span className="font-hero text-[28px] text-pm-text-primary">
                    {meal.current}{' '}
                    <span className="text-[20px] text-pm-text-tertiary">prepared</span>
                  </span>
                  {meal.current < meal.target && (
                    <span className="font-ui font-bold text-[18px] text-pm-primary-600 bg-pm-primary-50 px-4 py-2 rounded-lg">
                      {meal.target - meal.current} remaining
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
