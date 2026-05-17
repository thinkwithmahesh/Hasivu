'use client';

import React from 'react';
import { Card, CardContent } from '../../ui/card';
import { OrderStatusPill } from '../../ui/OrderStatusPill';

const mockOrders = [
  {
    id: 'ORD-1029',
    date: 'Today, 8:30 AM',
    student: 'Leo',
    total: 120,
    status: 'preparing' as const,
  },
  { id: 'ORD-1015', date: 'Yesterday', student: 'Mia', total: 60, status: 'delivered' as const },
];

export function OrderHistory() {
  if (mockOrders.length === 0) {
    return (
      <div className="w-full flex min-h-screen flex-col items-center justify-center px-4 text-center">
        <div className="mb-3 text-[32px]" aria-hidden>
          🍽️
        </div>
        <h2 className="font-ui text-[18px] font-semibold text-pm-text-primary">No orders yet</h2>
        <p className="mt-1 max-w-xs text-[14px] text-pm-text-secondary">
          Browse today&apos;s menu to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col pt-12 px-4 pb-8 min-h-screen">
      <h1 className="font-hero text-[32px] text-pm-text-primary leading-tight mb-6">
        Order History
      </h1>

      <div className="flex flex-col gap-4">
        {mockOrders.map(order => (
          <Card
            key={order.id}
            className="hover:border-pm-primary-300 transition-colors cursor-pointer"
          >
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="flex flex-col">
                  <span className="font-ui font-bold text-[16px] text-pm-text-primary">
                    {order.id}
                  </span>
                  <span className="font-body text-[13px] text-pm-text-tertiary">{order.date}</span>
                </div>
                <OrderStatusPill status={order.status} />
              </div>

              <div className="flex justify-between items-end border-t border-pm-neutral-100 pt-3 mt-1">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-pm-primary-100 text-pm-primary-800 flex items-center justify-center font-ui font-bold text-[10px]">
                    {order.student.charAt(0)}
                  </div>
                  <span className="font-ui text-[14px] font-semibold text-pm-text-secondary">
                    {order.student}
                  </span>
                </div>
                <span className="font-hero text-[20px] text-pm-text-primary">
                  ₹{order.total.toFixed(2)}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
