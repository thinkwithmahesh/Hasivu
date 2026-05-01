'use client';

import React from 'react';
import { ClassCard } from '../../ui/ClassCard';

const mockClasses = [
  {
    id: '1a',
    grade: 'Grade 1',
    section: 'A',
    teacherName: 'Ms. Sharma',
    totalOrders: 24,
    readyOrders: 24,
  },
  {
    id: '1b',
    grade: 'Grade 1',
    section: 'B',
    teacherName: 'Mr. Gupta',
    totalOrders: 22,
    readyOrders: 15,
  },
  {
    id: '2a',
    grade: 'Grade 2',
    section: 'A',
    teacherName: 'Mrs. Reddy',
    totalOrders: 25,
    readyOrders: 0,
  },
];

export function ByClassView() {
  return (
    <div className="flex flex-col gap-6 w-full pb-12 animate-fade-in-up">
      <div className="flex justify-between items-center mb-2">
        <h1 className="font-hero text-[32px] text-pm-text-primary leading-tight">
          Dispatch by Class
        </h1>
        <div className="flex gap-2">
          {/* Quick Filters for massive touch targets */}
          <button className="h-12 px-6 rounded-full bg-pm-primary-100 text-pm-primary-800 font-ui font-bold text-[18px]">
            All Classes (12)
          </button>
          <button className="h-12 px-6 rounded-full bg-pm-surface-1 border-2 border-pm-neutral-200 text-pm-text-secondary font-ui font-bold text-[18px]">
            Incomplete (4)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {mockClasses.map(cls => (
          <ClassCard
            key={cls.id}
            grade={cls.grade}
            section={cls.section}
            teacherName={cls.teacherName}
            totalOrders={cls.totalOrders}
            readyOrders={cls.readyOrders}
            pendingOrders={cls.totalOrders - cls.readyOrders}
            onClick={() => {
              // Expand class payload to check off items exactly
            }}
          />
        ))}
      </div>
    </div>
  );
}
