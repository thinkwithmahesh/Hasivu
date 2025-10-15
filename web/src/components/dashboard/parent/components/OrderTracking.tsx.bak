// Placeholder OrderTracking component
import React from 'react';

interface OrderTrackingProps {
  currentOrder: any | null;
  onRefresh?: () => void;
}

export const OrderTracking: React.FC<OrderTrackingProps> = ({ 
  currentOrder = null,
  onRefresh
}) => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Order Tracking</h2>
        <button 
          onClick={onRefresh}
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded"
        >
          Refresh
        </button>
      </div>
      <p className="text-gray-600">Track your current meal order in real-time.</p>
    </div>
  );
};