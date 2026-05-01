// web/src/components/sections/admin/OrderDashboard.tsx
'use client';

import { DataTable, Column } from '@/components/ui/DataTable';

type Row = { id: string; student: string; className: string; meal: string; status: string };

const columns: Column<Row>[] = [
  { accessorKey: 'student', header: 'Student' },
  { accessorKey: 'className', header: 'Class' },
  { accessorKey: 'meal', header: 'Meal' },
  { accessorKey: 'status', header: 'Status' },
];

const rows: Row[] = [
  { id: '1', student: 'Asha', className: '4B', meal: 'Veg Thali', status: 'Ordered' },
];

export function OrderDashboard() {
  return <DataTable<Row> columns={columns} data={rows} keyExtractor={row => row.id} />;
}
