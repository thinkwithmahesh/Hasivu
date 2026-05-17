import { useState, useEffect } from 'react';

// Breakpoints matching Tailwind CSS defaults
const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

interface UseMobileLayoutReturn {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  screenSize: { width: number; height: number };
  orientation: 'portrait' | 'landscape';
  safeArea: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  isTouchDevice: boolean;
}

export const useMobileLayout = (): UseMobileLayoutReturn => {
  const [screenSize, setScreenSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateScreenSize = () => {
      setScreenSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    updateScreenSize();
    window.addEventListener('resize', updateScreenSize);
    return () => window.removeEventListener('resize', updateScreenSize);
  }, []);

  const isMobile = screenSize.width < BREAKPOINTS.md;
  const isTablet = screenSize.width >= BREAKPOINTS.md && screenSize.width < BREAKPOINTS.lg;
  const isDesktop = screenSize.width >= BREAKPOINTS.lg;
  const orientation = screenSize.height > screenSize.width ? 'portrait' : 'landscape';

  // Detect touch device capability
  const isTouchDevice =
    typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);

  // Safe area insets for mobile devices (can be enhanced with actual device detection)
  const safeArea = {
    top: isMobile ? 44 : 0,
    right: 0,
    bottom: isMobile ? 34 : 0,
    left: 0,
  };

  return {
    isMobile,
    isTablet,
    isDesktop,
    screenSize,
    orientation,
    safeArea,
    isTouchDevice,
  };
};
