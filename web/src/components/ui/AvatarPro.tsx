// web/src/components/ui/AvatarPro.tsx
import Image from 'next/image';

export function AvatarPro({ name, src }: { name: string; src?: string }) {
  if (src) {
    return (
      <Image
        src={src}
        alt={`${name} avatar`}
        width={40}
        height={40}
        className="rounded-[999px] object-cover"
      />
    );
  }
  return (
    <span className="inline-flex h-10 w-10 items-center justify-center rounded-[999px] bg-[var(--pm-surface-3)] text-[14px] font-semibold text-[var(--pm-text-secondary)]">
      {name.slice(0, 2).toUpperCase()}
    </span>
  );
}
