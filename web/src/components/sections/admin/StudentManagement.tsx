// web/src/components/sections/admin/StudentManagement.tsx
'use client';

import { EmptyState } from '@/components/ui/EmptyState';
import { UI_TEXT } from '@/constants/uiText';

type Props = { hasStudents: boolean };

export function StudentManagement({ hasStudents }: Props) {
  if (!hasStudents) {
    return (
      <EmptyState
        title={UI_TEXT.admin.noStudentsTitle}
        description={UI_TEXT.admin.noStudentsDescription}
      />
    );
  }
  return (
    <div className="rounded-[10px] bg-white p-4 shadow-[var(--pm-shadow-sm)]">Student table</div>
  );
}
