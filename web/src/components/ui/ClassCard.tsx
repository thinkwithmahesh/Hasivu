import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Badge } from './badge';

export interface ClassCardProps {
  grade: string;
  section: string;
  teacherName?: string;
  totalOrders: number;
  pendingOrders: number;
  readyOrders: number;
  onClick?: () => void;
}

export function ClassCard({
  grade,
  section,
  teacherName,
  totalOrders,
  pendingOrders,
  readyOrders,
  onClick,
}: ClassCardProps) {
  const shouldReduceMotion = useReducedMotion();
  const completionPercentage = totalOrders > 0 ? (readyOrders / totalOrders) * 100 : 0;

  const isFullyReady = totalOrders > 0 && readyOrders === totalOrders;

  return (
    <motion.button
      onClick={onClick}
      whileHover={!shouldReduceMotion ? { y: -2, transition: { duration: 0.15 } } : {}}
      whileTap={!shouldReduceMotion ? { scale: 0.98 } : {}}
      className={`text-left w-full flex flex-col bg-pm-surface-1 p-4 rounded-xl border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pm-primary-600 focus-visible:ring-offset-2 ${
        isFullyReady
          ? 'border-pm-semantic-success shadow-sm bg-green-50/30 hover:shadow-md'
          : 'border-pm-neutral-200 shadow-sm hover:border-pm-primary-400 hover:shadow-md'
      }`}
    >
      <div className="flex justify-between items-start w-full mb-3">
        <div>
          <h3 className="font-hero text-[24px] text-pm-text-primary leading-none mb-1">
            {grade} {section}
          </h3>
          {teacherName && (
            <p className="font-ui text-[13px] text-pm-text-secondary">{teacherName}</p>
          )}
        </div>

        {isFullyReady ? (
          <Badge variant="success" className="px-2 py-1">
            Ready
          </Badge>
        ) : (
          <div className="flex items-baseline gap-1">
            <span className="font-ui font-bold text-[18px] text-pm-primary-600">{readyOrders}</span>
            <span className="font-ui text-[12px] text-pm-text-tertiary font-bold">
              / {totalOrders}
            </span>
          </div>
        )}
      </div>

      {/* Mini Progress Indicator */}
      <div className="w-full bg-pm-neutral-200 h-1.5 rounded-full overflow-hidden mt-auto">
        <motion.div
          className={`h-full rounded-full ${isFullyReady ? 'bg-pm-semantic-success' : 'bg-pm-primary-500'}`}
          initial={{ width: 0 }}
          animate={{ width: `${completionPercentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>

      <div className="w-full mt-3 flex justify-between items-center font-ui text-[12px] font-semibold text-pm-text-tertiary">
        <span>{pendingOrders} pending</span>
        {totalOrders > 0 && <span>{Math.round(completionPercentage)}% complete</span>}
      </div>
    </motion.button>
  );
}
