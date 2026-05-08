'use client';

import React, { useState, useEffect } from 'react';
import { animate, motion, useMotionValue, useReducedMotion } from 'framer-motion';
import { Button } from '../../ui/button';
import { Card, CardContent } from '../../ui/card';

export function HomeScreen() {
  const shouldReduce = useReducedMotion();
  const [minutesLeft, setMinutesLeft] = useState(45);
  const [countdownLabel, setCountdownLabel] = useState('45:00 remaining');
  const seconds = useMotionValue(0);

  useEffect(() => {
    const deadlineMs = Date.now() + 45 * 60 * 1000;
    const compute = () => Math.max(0, Math.floor((deadlineMs - Date.now()) / 60000));
    setMinutesLeft(compute());
    const id = window.setInterval(() => setMinutesLeft(compute()), 30000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (minutesLeft >= 30) return;
    const totalSeconds = Math.max(0, minutesLeft * 60);
    const format = (raw: number) => {
      const safe = Math.max(0, Math.floor(raw));
      const mm = Math.floor(safe / 60);
      const ss = safe % 60;
      return `${mm}:${ss.toString().padStart(2, '0')} remaining`;
    };
    if (shouldReduce) {
      setCountdownLabel(format(totalSeconds));
      return;
    }
    seconds.set(totalSeconds);
    const controls = animate(seconds, 0, {
      duration: Math.max(1, totalSeconds),
      ease: 'linear',
      onUpdate: v => setCountdownLabel(format(Number(v))),
    });
    return () => controls.stop();
  }, [minutesLeft, seconds, shouldReduce]);

  return (
    <div className="w-full flex flex-col pt-12 px-4 pb-8 space-y-6">
      <header className="flex justify-between items-center mb-2">
        <div className="flex flex-col">
          <h1 className="font-hero text-[32px] text-pm-text-primary leading-tight">
            Good Morning,
            <br />
            <span className="text-pm-primary-600">Sarah</span>
          </h1>
          <p className="font-body text-[14px] text-pm-text-secondary mt-1">
            Let's sort out lunch for the kids today.
          </p>
        </div>
        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-pm-primary-200 shadow-sm">
          <img
            src="https://ui-avatars.com/api/?name=Sarah&background=FFF8F0&color=E07020"
            alt="Profile"
          />
        </div>
      </header>

      {minutesLeft >= 30 && minutesLeft <= 60 && (
        <motion.div
          initial={shouldReduce ? undefined : { y: 8, opacity: 0 }}
          animate={shouldReduce ? undefined : { y: 0, opacity: 1 }}
          className="w-full rounded-2xl border border-pm-semantic-warning/40 bg-pm-semantic-warning/10 p-4"
        >
          <p className="text-[14px] font-ui text-pm-text-primary">
            Order by 9:00 AM today
            <span className="ml-2 font-semibold text-pm-semantic-warning">{minutesLeft} min left</span>
          </p>
        </motion.div>
      )}

      {minutesLeft < 30 && (
        <motion.div
          initial={shouldReduce ? undefined : { y: 8, opacity: 0 }}
          animate={shouldReduce ? undefined : { y: 0, opacity: 1 }}
          className="w-full rounded-2xl border border-pm-semantic-danger/40 bg-pm-semantic-danger/10 p-4"
          role="alert"
        >
          <p className="text-[14px] font-ui font-semibold text-pm-semantic-danger">
            Ordering closes very soon
          </p>
          <p className="text-[16px] font-hero text-pm-semantic-danger mt-1">{countdownLabel}</p>
        </motion.div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="hover:border-pm-primary-400 transition-colors cursor-pointer active:scale-95 duration-200">
          <CardContent className="flex flex-col items-center justify-center p-5 gap-3">
            <div className="w-12 h-12 rounded-full bg-pm-primary-50 flex items-center justify-center text-pm-primary-600">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
            </div>
            <span className="font-ui font-bold text-[14px]">Quick Add Funds</span>
          </CardContent>
        </Card>

        <Card className="hover:border-pm-primary-400 transition-colors cursor-pointer active:scale-95 duration-200">
          <CardContent className="flex flex-col items-center justify-center p-5 gap-3">
            <div className="w-12 h-12 rounded-full bg-pm-secondary-50 flex items-center justify-center text-pm-secondary-600">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                />
              </svg>
            </div>
            <span className="font-ui font-bold text-[14px]">Order History</span>
          </CardContent>
        </Card>
      </div>

      {/* Notice Board */}
      <div>
        <h3 className="font-ui font-bold text-[18px] mb-3 mt-4 text-pm-text-primary">
          School Notice
        </h3>
        <Card className="bg-blue-50/50 border-blue-100 shadow-none">
          <CardContent className="p-4 flex gap-3 items-start">
            <svg
              className="w-5 h-5 text-blue-600 shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="font-body text-[13px] text-pm-text-secondary leading-relaxed">
              We've updated our menu for the upcoming spring term! New vegetarian options are now
              available daily.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
