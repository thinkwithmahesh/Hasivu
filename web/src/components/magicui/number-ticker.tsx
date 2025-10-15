'use client';

import { useEffect, useRef, useState } from 'react';

export function NumberTicker({
  value,
  direction = 'up',
  className = '',
  delay = 0,
}: {
  value: number;
  direction?: 'up' | 'down';
  className?: string;
  delay?: number;
}) {
  const [displayValue, setDisplayValue] = useState(direction === 'down' ? value : 0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!hasAnimated) {
      const timer = setTimeout(() => {
        const startValue = direction === 'down' ? value : 0;
        const endValue = direction === 'down' ? 0 : value;
        const duration = 2000; // 2 seconds
        const steps = 60;
        const increment = (endValue - startValue) / steps;
        let currentStep = 0;

        const interval = setInterval(() => {
          currentStep++;
          const currentValue = startValue + increment * currentStep;

          if (currentStep >= steps) {
            setDisplayValue(endValue);
            clearInterval(interval);
            setHasAnimated(true);
          } else {
            setDisplayValue(Math.round(currentValue));
          }
        }, duration / steps);

        return () => clearInterval(interval);
      }, delay * 1000);

      return () => clearTimeout(timer);
    }
  }, [value, direction, delay, hasAnimated]);

  return (
    <span className={className} ref={ref}>
      {Intl.NumberFormat('en-US').format(displayValue)}
    </span>
  );
}
