'use client';

import React, { useState } from 'react';
import { Card } from '../../ui/card';
import { DataTable, type Column } from '../../ui/DataTable';
import { Badge } from '../../ui/badge';
import { Switch } from '../../ui/switch';
import { SideDrawer } from '../../ui/SideDrawer';

type MenuRow = {
  id: string;
  name: string;
  category: string;
  price: number;
  status: boolean;
  inventory: number;
};

const mockMenuData: MenuRow[] = [
  { id: '1', name: 'Chicken Pasta', category: 'Main', price: 120, status: true, inventory: 150 },
  { id: '2', name: 'Dal Rice', category: 'Main', price: 80, status: true, inventory: 200 },
  { id: '3', name: 'Fruit Bowl', category: 'Side', price: 50, status: false, inventory: 0 },
];

export function MenuManagement() {
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [menuItems, setMenuItems] = useState<MenuRow[]>(mockMenuData);

  const toggleStatus = (id: string) => {
    setMenuItems(prev =>
      prev.map(item => (item.id === id ? { ...item, status: !item.status } : item))
    );
  };

  const columns: Column<MenuRow>[] = [
    { header: 'Item Name', accessorKey: 'name', width: '30%' },
    { header: 'Category', accessorKey: 'category' },
    {
      header: 'Price',
      accessorKey: 'price',
      cell: item => `₹${item.price.toFixed(2)}`,
    },
    {
      header: 'Inventory',
      accessorKey: 'inventory',
      cell: item => (
        <Badge
          variant={item.inventory > 50 ? 'success' : item.inventory > 0 ? 'warning' : 'destructive'}
        >
          {item.inventory} units
        </Badge>
      ),
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: item => (
        <Switch
          checked={item.status}
          onChange={() => toggleStatus(item.id)}
          aria-label={`Toggle ${item.name}`}
        />
      ),
      align: 'right' as const,
    },
  ];

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in-up">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="font-hero text-[36px] text-pm-text-primary leading-tight">
            Menu Directory
          </h1>
          <p className="font-ui text-pm-text-secondary text-[14px]">
            Manage active catalog items pricing and allocation.
          </p>
        </div>
        <button
          onClick={() => setDrawerOpen(true)}
          className="bg-pm-primary-600 text-white font-ui font-semibold px-4 h-10 rounded-sm hover:bg-pm-primary-800 transition-colors shadow-sm"
        >
          Add Item
        </button>
      </div>

      <DataTable data={menuItems} columns={columns} keyExtractor={item => item.id} />

      <SideDrawer open={isDrawerOpen} onClose={() => setDrawerOpen(false)} title="Create Menu Item">
        <div className="flex flex-col gap-4">
          <p className="text-[14px] text-pm-text-secondary font-body">
            Form elements (Input, Select, Checkbox) built earlier will mount here to capture item
            metadata.
          </p>
          {/* Form fields logic to be wired up with Hook Form / Zod */}
        </div>
      </SideDrawer>
    </div>
  );
}
