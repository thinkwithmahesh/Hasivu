// Placeholder SubscriptionManagement component
import React from 'react';

interface SubscriptionManagementProps {
  subscription: any | null;
  onChangePlan?: () => void;
  onCancelSubscription?: () => void;
}

export const SubscriptionManagement: React.FC<SubscriptionManagementProps> = ({ 
  subscription = null,
  onChangePlan,
  onCancelSubscription
}) => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Subscription</h2>
        <div className="space-x-2">
          <button 
            onClick={onChangePlan}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            Change Plan
          </button>
          <button 
            onClick={onCancelSubscription}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
          >
            Cancel
          </button>
        </div>
      </div>
      <p className="text-gray-600">Manage your subscription plan and billing preferences.</p>
    </div>
  );
};