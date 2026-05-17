'use client';

import { motion, useReducedMotion, type Variants } from 'framer-motion';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import type { CharacterState } from './useCharacterState';
import {
  breatheVariants,
  peekVariants,
  celebrateVariants,
  dashVariants,
  waveVariants,
  nodVariants,
  stirVariants,
  getReducedMotionVariants,
} from './animations';

export type CharacterName = 'aarav' | 'meera' | 'rajan' | 'priya' | 'benny' | 'group-scene';

interface HasivuFriendProps {
  name: CharacterName;
  state?: CharacterState;
  animation?: string;
  className?: string;
  size?: number;
  alt?: string;
  priority?: boolean;
  /** Custom variants override for the root container */
  variants?: Variants;
  /** Whether to respect prefers-reduced-motion (default: true) */
  respectReducedMotion?: boolean;
}

/** Raster art lives in repo as optional `.png`; shipped placeholders use `.svg`. */
const getCharacterImage = (name: CharacterName) => {
  return `/characters/${name}.svg`;
};

// Map states to animations based on character personality
const getStateAnimation = (name: CharacterName, state: CharacterState) => {
  if (state === 'IDLE') return 'idle';

  if (state === 'HOVER') {
    if (name === 'benny') return 'duck';
    if (name === 'aarav') return 'peek';
    return 'idle'; // others might just breathe
  }

  if (state === 'SUCCESS') {
    if (name === 'meera') return 'nod';
    if (name === 'benny') return 'wave';
    return 'celebrate';
  }

  if (state === 'LOADING') {
    if (name === 'rajan') return 'stir';
    if (name === 'priya') return 'onscreen';
    return 'peek';
  }

  if (state === 'SCROLL') {
    if (name === 'priya') return 'onscreen';
    return 'duck';
  }

  return 'idle';
};

const getCharacterVariants = (name: CharacterName) => {
  // Combine base animations to ensure all states are covered
  return {
    ...breatheVariants,
    ...celebrateVariants,
    ...peekVariants,
    ...dashVariants,
    ...waveVariants,
    ...nodVariants,
    ...stirVariants,
  };
};

export function HasivuFriend({
  name,
  state,
  animation,
  className,
  size = 120,
  alt,
  priority = false,
  variants,
  respectReducedMotion = true,
}: HasivuFriendProps) {
  const shouldReduce = useReducedMotion();

  const baseVariants = variants || getCharacterVariants(name);
  const activeVariants = baseVariants;

  const currentAnimation = animation || (state ? getStateAnimation(name, state) : 'idle');

  if (respectReducedMotion && shouldReduce) {
    return (
      <div
        className={cn(
          'relative inline-flex items-center justify-center pointer-events-none',
          className
        )}
        style={{ width: size, height: size }}
      >
        <Image
          src={getCharacterImage(name)}
          alt={alt || `Hasivu Friend ${name}`}
          width={size}
          height={size}
          priority={priority}
          unoptimized
          className="object-contain drop-shadow-md"
        />
      </div>
    );
  }

  return (
    <motion.div
      className={cn(
        'relative inline-flex items-center justify-center pointer-events-none',
        className
      )}
      variants={activeVariants}
      initial={name === 'priya' ? 'offscreen' : 'hidden'}
      animate={currentAnimation}
      style={{ width: size, height: size }}
    >
      <Image
        src={getCharacterImage(name)}
        alt={alt || `Hasivu Friend ${name}`}
        width={size}
        height={size}
        priority={priority}
        unoptimized
        className="object-contain drop-shadow-md"
      />
    </motion.div>
  );
}

// ─── CHARACTER PRESETS ──────────────────────────────────────────────────

export const Aarav = (props: Omit<HasivuFriendProps, 'name'>) => (
  <HasivuFriend name="aarav" {...props} />
);
export const Meera = (props: Omit<HasivuFriendProps, 'name'>) => (
  <HasivuFriend name="meera" {...props} />
);
export const Rajan = (props: Omit<HasivuFriendProps, 'name'>) => (
  <HasivuFriend name="rajan" {...props} />
);
export const Priya = (props: Omit<HasivuFriendProps, 'name'>) => (
  <HasivuFriend name="priya" {...props} />
);
export const Benny = (props: Omit<HasivuFriendProps, 'name'>) => (
  <HasivuFriend name="benny" {...props} />
);
export const GroupScene = (props: Omit<HasivuFriendProps, 'name'>) => (
  <HasivuFriend name="group-scene" {...props} />
);
