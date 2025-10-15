/**
 * HASIVU Platform - Password Strength Indicator Component
 * Real-time password strength visualization
 */

import React from 'react';
import {
  validatePasswordRealtime,
  getPasswordStrengthColor,
  getPasswordStrengthLabel,
} from '../../utils/password-validation';

interface PasswordStrengthIndicatorProps {
  password: string;
  showRequirements?: boolean;
  className?: string;
}

export const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({
  password,
  showRequirements = true,
  className = '',
}) => {
  if (!password) return null;

  const { isValid: _isValid, checks, strength } = validatePasswordRealtime(password);
  const strengthColor = getPasswordStrengthColor(strength.strength);
  const strengthLabel = getPasswordStrengthLabel(strength.strength);

  return (
    <div className={`password-strength-indicator ${className}`}>
      {/* Strength bar */}
      <div className="flex items-center gap-2 mb-2">
        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full transition-all duration-300"
            style={{
              width: `${(strength.score / 5) * 100}%`,
              backgroundColor: strengthColor,
            }}
          />
        </div>
        <span className="text-sm font-medium" style={{ color: strengthColor }}>
          {strengthLabel}
        </span>
      </div>

      {/* Requirements checklist */}
      {showRequirements && (
        <div className="space-y-1">
          <RequirementItem met={checks.length} label="At least 8 characters" />
          <RequirementItem met={checks.uppercase} label="One uppercase letter" />
          <RequirementItem met={checks.lowercase} label="One lowercase letter" />
          <RequirementItem met={checks.number} label="One number" />
          <RequirementItem met={checks.specialChar} label="One special character" />
        </div>
      )}
    </div>
  );
};

interface RequirementItemProps {
  met: boolean;
  label: string;
}

const RequirementItem: React.FC<RequirementItemProps> = ({ met, label }) => (
  <div className="flex items-center gap-2 text-sm">
    <div
      className={`w-4 h-4 rounded-full flex items-center justify-center transition-colors ${
        met ? 'bg-green-500' : 'bg-gray-300'
      }`}
    >
      {met && (
        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      )}
    </div>
    <span className={met ? 'text-green-700' : 'text-gray-500'}>{label}</span>
  </div>
);

export default PasswordStrengthIndicator;
