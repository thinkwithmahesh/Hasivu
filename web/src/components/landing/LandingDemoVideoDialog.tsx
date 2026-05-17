'use client';

import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const POSTER = '/videos/how-to-order-poster.jpg';
const LOCAL_DEMO = '/videos/how-to-order.mp4';

export interface LandingDemoVideoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Hero "Watch demo" modal: YouTube id, hosted MP4 URL, optional local `public/videos/how-to-order.mp4`, else poster.
 */
export function LandingDemoVideoDialog({ open, onOpenChange }: LandingDemoVideoDialogProps) {
  const remoteSrc =
    typeof process.env.NEXT_PUBLIC_LANDING_DEMO_VIDEO_URL === 'string'
      ? process.env.NEXT_PUBLIC_LANDING_DEMO_VIDEO_URL.trim()
      : '';
  const youtubeId =
    typeof process.env.NEXT_PUBLIC_LANDING_DEMO_YOUTUBE_ID === 'string'
      ? process.env.NEXT_PUBLIC_LANDING_DEMO_YOUTUBE_ID.trim()
      : '';

  const [localDemoAvailable, setLocalDemoAvailable] = useState(false);

  useEffect(() => {
    if (!open || youtubeId || remoteSrc) return;
    let cancelled = false;
    fetch(LOCAL_DEMO, { method: 'HEAD' })
      .then(res => {
        if (!cancelled && res.ok) setLocalDemoAvailable(true);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [open, youtubeId, remoteSrc]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px]">
        <DialogHeader>
          <DialogTitle>How to Order</DialogTitle>
        </DialogHeader>
        <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
          {youtubeId ? (
            <iframe
              title="HASIVU — how to order"
              src={`https://www.youtube-nocookie.com/embed/${youtubeId}?rel=0`}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : remoteSrc ? (
            <video src={remoteSrc} className="h-full w-full" controls playsInline poster={POSTER} />
          ) : localDemoAvailable ? (
            <video src={LOCAL_DEMO} className="h-full w-full" controls playsInline poster={POSTER} />
          ) : (
            <div className="relative h-full w-full">
              <img src={POSTER} alt="" className="h-full w-full object-cover" />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/45 px-6 text-center text-white">
                <p className="max-w-md text-sm font-medium sm:text-base">
                  Full walkthrough video is coming soon. Use <span className="font-semibold">Get Started</span> to try
                  ordering in the app.
                </p>
                {process.env.NODE_ENV === 'development' && (
                  <p className="max-w-lg text-xs text-white/75">
                    Dev: set <code className="rounded bg-white/10 px-1">NEXT_PUBLIC_LANDING_DEMO_VIDEO_URL</code> or{' '}
                    <code className="rounded bg-white/10 px-1">NEXT_PUBLIC_LANDING_DEMO_YOUTUBE_ID</code>, or add{' '}
                    <code className="rounded bg-white/10 px-1">public/videos/how-to-order.mp4</code>.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
