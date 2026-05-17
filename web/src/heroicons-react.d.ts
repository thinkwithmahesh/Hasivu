import type { FC, SVGProps } from 'react';

type HeroIcon = FC<SVGProps<SVGSVGElement>>;

declare module '@heroicons/react/24/outline' {
  type HeroIcon = import('react').FC<import('react').SVGProps<SVGSVGElement>>;

  export const CheckCircleIcon: HeroIcon;
  export const ClockIcon: HeroIcon;
  export const MapPinIcon: HeroIcon;
  export const UserIcon: HeroIcon;
  export const BellIcon: HeroIcon;
  export const CameraIcon: HeroIcon;
  export const ChartBarIcon: HeroIcon;
  export const CalendarIcon: HeroIcon;
  export const ArrowDownIcon: HeroIcon;
  export const ExclamationTriangleIcon: HeroIcon;
  export const PhotoIcon: HeroIcon;
  export const RefreshIcon: HeroIcon;
}

declare module '@heroicons/react/24/solid' {
  type HeroIcon = import('react').FC<import('react').SVGProps<SVGSVGElement>>;

  export const CheckCircleIcon: HeroIcon;
  export const BellIcon: HeroIcon;
}
