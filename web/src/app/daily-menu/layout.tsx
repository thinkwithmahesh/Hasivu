import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Daily Menu | HASIVU Platform',
  description: 'View and manage daily menus for your school',
};

export default function DailyMenuLayout({ children }: { children: React.ReactNode }) {
  return children;
}
