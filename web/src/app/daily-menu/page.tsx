/**
 * Daily Menu Page
 * Displays daily menus with date selection and management capabilities
 */
import React from 'react';
import { Metadata } from 'next';

import { DailyMenuDisplay } from '@/components/DailyMenuDisplay';
import { useAuth as _useAuth } from '@/hooks/useAuth';

// This would typically come from auth context or props
const getCurrentSchoolId = () => {
  // In a real app, this would come from user context or URL params
  return 'school-123';
};

export const metadata: Metadata = {
  title: 'Daily Menu | HASIVU Platform',
  description: 'View and manage daily menus for your school',
};

export default function DailyMenuPage() {
  const schoolId = getCurrentSchoolId();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Daily Menu</h1>
        <p className="text-gray-600">
          View and manage daily menus for your school. Select a date to see available menus.
        </p>
      </div>

      <DailyMenuDisplay schoolId={schoolId} />
    </div>
  );
}
