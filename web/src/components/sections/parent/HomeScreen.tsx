'use client';

import React, { useState, useEffect } from 'react';
import { motion, useAnimationFrame } from 'framer-motion';
import { Button } from '../../ui/button';
import { Card, CardContent } from '../../ui/card';

export function HomeScreen() {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  // Cutoff is tomorrow at 8:00 AM for this demonstration logic
  useAnimationFrame(t => {
    const now = new Date();
    const cutoff = new Date();
    cutoff.setHours(8, 0, 0, 0);
    if (now.getHours() >= 8) {
      cutoff.setDate(cutoff.getDate() + 1);
    }

    const diff = cutoff.getTime() - now.getTime();

    if (diff > 0) {
      setTimeLeft({
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / 1000 / 60) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    }
  });

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

      {/* Live Countdown Card */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full rounded-2xl bg-gradient-to-br from-pm-primary-600 to-pm-primary-800 p-5 text-white shadow-lg relative overflow-hidden"
      >
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col">
          <span className="font-ui font-bold text-[13px] uppercase tracking-wider text-pm-primary-100 flex items-center gap-1.5 mb-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Order Cutoff For Tomorrow
          </span>

          <div className="flex gap-3 mb-5 mt-1 font-hero text-[40px] leading-none tabular-nums">
            <div className="flex flex-col items-center">
              <span>{String(timeLeft.hours).padStart(2, '0')}</span>
              <span className="text-[11px] font-ui font-bold uppercase tracking-wider text-pm-primary-200 mt-1">
                hrs
              </span>
            </div>
            <span className="text-pm-primary-400 mt-[-2px] animate-pulse-slow">:</span>
            <div className="flex flex-col items-center">
              <span>{String(timeLeft.minutes).padStart(2, '0')}</span>
              <span className="text-[11px] font-ui font-bold uppercase tracking-wider text-pm-primary-200 mt-1">
                min
              </span>
            </div>
            <span className="text-pm-primary-400 mt-[-2px] animate-pulse-slow">:</span>
            <div className="flex flex-col items-center">
              <span>{String(timeLeft.seconds).padStart(2, '0')}</span>
              <span className="text-[11px] font-ui font-bold uppercase tracking-wider text-pm-primary-200 mt-1">
                sec
              </span>
            </div>
          </div>

          <Button
            variant="secondary"
            className="w-full bg-white text-pm-primary-800 hover:bg-pm-neutral-50 border-none shadow-soft h-12 text-[16px]"
          >
            Plan Tomorrow's Meals
          </Button>
        </div>
      </motion.div>

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
