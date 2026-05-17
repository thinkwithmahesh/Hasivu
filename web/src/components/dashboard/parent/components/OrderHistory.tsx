// Placeholder OrderHistory component
import React from 'react';

interface OrderHistoryProps {
  orders: any[];
  onViewOrder?: (orderId: string) => void;
}

export const OrderHistory: React.FC<OrderHistoryProps> = ({
  orders: _orders = [],
  onViewOrder: _onViewOrder,
}) => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-4">Order History</h2>
      <p className="text-gray-600">View your past meal orders and delivery history.</p>
    </div>
  );
};
