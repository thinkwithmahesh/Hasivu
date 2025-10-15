'use client';

import React from 'react';
import { MeshGradient } from '@paper-design/shaders-react';

export const PaperShadersBackground = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-black">
      {/* Primary MeshGradient Layer */}
      <div className="absolute inset-0">
        <MeshGradient
          speed={0.3}
          colors={[
            '#000000', // Black anchor 1
            '#1a0133', // Deep purple
            '#2d0a4e', // Dark violet
            '#000000', // Black anchor 2
            '#4c1d95', // Purple accent
            '#7c3aed', // Violet accent
            '#000000', // Black anchor 3
            '#ffffff', // Strategic white accent
            '#1a0133', // Deep purple balance
          ]}
          style={{
            width: '100%',
            height: '100%',
            opacity: 1,
          }}
        />
      </div>

      {/* Wireframe Overlay Layer - 60% opacity */}
      <div className="absolute inset-0">
        <MeshGradient
          speed={0.2}
          colors={[
            '#000000', // Black base
            '#3b0764', // Deep purple wireframe
            '#581c87', // Purple wireframe
            '#000000', // Black anchor
            '#6b21a8', // Purple accent wireframe
            '#8b5cf6', // Light violet wireframe
            '#000000', // Black anchor
            '#f3f4f6', // Light wireframe accent
            '#1f0937', // Deep purple base
          ]}
          style={{
            width: '100%',
            height: '100%',
            opacity: 0.6,
            mixBlendMode: 'overlay' as const,
          }}
        />
      </div>

      {/* Additional depth layer with strategic white */}
      <div className="absolute inset-0 opacity-20">
        <MeshGradient
          speed={0.15}
          colors={[
            '#000000',
            '#ffffff',
            '#8b5cf6',
            '#000000',
            '#c4b5fd',
            '#1e1b4b',
            '#000000',
            '#ffffff',
            '#0f0a1e',
          ]}
          style={{
            width: '100%',
            height: '100%',
            mixBlendMode: 'soft-light' as const,
          }}
        />
      </div>
    </div>
  );
};

export default PaperShadersBackground;
