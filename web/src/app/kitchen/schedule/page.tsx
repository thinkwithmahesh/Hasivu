import React from 'react';
import StaffScheduling from '@/components/staff/StaffScheduling';

export const metadata = {
  title: 'Kitchen Staff Scheduling | HASIVU',
  description: 'Manage staff shifts and weekly schedules for kitchen operations.',
};

export default function KitchenStaffSchedulePage() {
  return <StaffScheduling />;
}
