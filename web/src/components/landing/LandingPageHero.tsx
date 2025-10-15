'use client';

import React from 'react';
import { Play, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { events } from '@/lib/analytics';

interface LandingPageHeroProps {
  videoOpen: boolean;
  setVideoOpen: (open: boolean) => void;
}

export function LandingPageHero({ videoOpen, setVideoOpen }: LandingPageHeroProps) {
  return (
    <>
      {/* Hero Section - Optimized */}
      <section className="relative pt-16 pb-20 px-4">
        <div className="mx-auto max-w-7xl text-center">
          <div className="mx-auto max-w-3xl">
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-ink-900 leading-[1.1]">
              School meals,{' '}
              <span className="bg-gradient-to-r from-emerald-600 via-cyan-600 to-blue-600 bg-clip-text text-transparent">
                done right
              </span>
            </h1>
            <p className="mt-6 text-xl text-ink-600 leading-relaxed">
              Order warm, nutritious meals delivered to the classroom. Flexible subscriptions you
              can change, pause, or cancel by midnight.
            </p>
          </div>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              className="bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white font-semibold px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
              onClick={() => {
                events.track('cta_clicked', { location: 'hero', action: 'get_started' });
              }}
            >
              Get started today
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>

            <Button
              variant="ghost"
              size="lg"
              className="font-semibold px-8 py-4 hover:bg-slate-100/60 rounded-xl transition-colors"
              onClick={() => {
                setVideoOpen(true);
                events.track('video_play_clicked', { location: 'hero' });
              }}
            >
              <Play className="mr-2 h-5 w-5 text-emerald-600" />
              Watch demo
            </Button>
          </div>

          <div className="mt-12 text-center">
            <p className="text-sm text-ink-500 mb-6">
              Trusted by 200+ schools • 50,000+ happy meals served
            </p>
            <div className="flex justify-center space-x-8 opacity-60">
              <div className="text-xs text-ink-400 bg-white/50 px-3 py-1 rounded-full">
                DPS School
              </div>
              <div className="text-xs text-ink-400 bg-white/50 px-3 py-1 rounded-full">
                Ryan International
              </div>
              <div className="text-xs text-ink-400 bg-white/50 px-3 py-1 rounded-full">
                The Shri Ram School
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Video Dialog - Lazy loaded */}
      <Dialog open={videoOpen} onOpenChange={setVideoOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>See HASIVU in action</DialogTitle>
          </DialogHeader>
          <div className="aspect-video">
            <iframe
              src="https://www.youtube.com/embed/dQw4w9WgXcQ"
              title="HASIVU Demo"
              className="w-full h-full rounded-lg"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
