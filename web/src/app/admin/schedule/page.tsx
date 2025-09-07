import React from 'react';
import StaffScheduling from '@/components/staff/StaffScheduling';

export const metadata = {
  title: 'Admin Staff Scheduling | HASIVU',
  description: 'Administer staff shifts and schedules across operations.',
};

export default function AdminStaffSchedulePage() {
  return <StaffScheduling />;
}
