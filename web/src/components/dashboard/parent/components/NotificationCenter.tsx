// Placeholder NotificationCenter component
import React from 'react';

interface NotificationCenterProps {
  notifications: any[];
  onMarkAsRead?: (id: string) => void;
  onClearAll?: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ 
  notifications = [],
  onMarkAsRead,
  onClearAll
}) => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Notifications</h2>
        <button 
          onClick={onClearAll}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
        >
          Clear All
        </button>
      </div>
      <p className="text-gray-600">Stay updated with important announcements and order status.</p>
    </div>
  );
};