import { renderHook } from '@testing-library/react';
import { useReducedMotion } from 'framer-motion';

import { motionDurations, motionEase, motionPresets, useMotionEnabled, useMotionPreset } from '../motion';

jest.mock('framer-motion', () => ({
  useReducedMotion: jest.fn(),
}));

const mockedUseReducedMotion = useReducedMotion as jest.Mock;

describe('motion design-system presets', () => {
  beforeEach(() => {
    mockedUseReducedMotion.mockReturnValue(false);
  });

  it('exports stable duration and easing tokens', () => {
    expect(motionDurations).toMatchObject({ micro: 0.15, standard: 0.28, page: 0.42 });
    expect(motionEase).toEqual([0.25, 1, 0.5, 1]);
  });

  it('defines page, panel, card, modal, drawer, and status presets', () => {
    expect(motionPresets).toHaveProperty('page');
    expect(motionPresets).toHaveProperty('panel');
    expect(motionPresets).toHaveProperty('card');
    expect(motionPresets).toHaveProperty('modal');
    expect(motionPresets).toHaveProperty('drawer');
    expect(motionPresets).toHaveProperty('status');
  });

  it('returns the named preset when reduced motion is disabled', () => {
    const { result } = renderHook(() => useMotionPreset('page'));

    expect(result.current).toBe(motionPresets.page);
  });

  it('returns instant opacity-only variants when reduced motion is enabled', () => {
    mockedUseReducedMotion.mockReturnValue(true);

    const { result } = renderHook(() => useMotionPreset('modal'));

    expect(result.current).toEqual({
      initial: { opacity: 1 },
      animate: { opacity: 1 },
      exit: { opacity: 1 },
      transition: { duration: 0 },
    });
  });

  it('reports whether motion is enabled', () => {
    const enabled = renderHook(() => useMotionEnabled());
    expect(enabled.result.current).toBe(true);

    mockedUseReducedMotion.mockReturnValue(true);
    const disabled = renderHook(() => useMotionEnabled());
    expect(disabled.result.current).toBe(false);
  });
});
