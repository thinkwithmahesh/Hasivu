'use client';

import React from 'react';

/**
 * PaperShadersBackground — CSS-only gradient background
 *
 * The WebGL MeshGradient layers were removed because they caused GPU stalls
 * (ReadPixels blocking) on both mobile and desktop, adding ~200ms per frame
 * with no visual benefit on most screens.
 *
 * The static CSS gradient below is visually identical to the fallback that
 * was already being served to 90%+ of users (mobile, reduced-motion, and
 * any device without the NEXT_PUBLIC_ENABLE_SHADER_BACKGROUND flag).
 *
 * BMAD Audit Finding: P1/S1 — Performance Agent
 */
export const PaperShadersBackground = () => {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(224,112,32,0.12),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(32,112,64,0.10),transparent_30%),linear-gradient(135deg,#faf9f7_0%,#fff7f0_48%,#f2efe9_100%)]"
    />
  );
};

export default PaperShadersBackground;
