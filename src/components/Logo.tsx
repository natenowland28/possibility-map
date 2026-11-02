export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg viewBox="0 0 32 32" className="size-7" aria-hidden>
        <circle cx="10" cy="20" r="6.5" fill="var(--ideal)" opacity="0.85" />
        <circle cx="21" cy="12" r="6.5" fill="var(--vision)" opacity="0.8" />
        <circle cx="22" cy="23" r="4.5" fill="var(--vector)" opacity="0.85" />
      </svg>
      <span className="font-display text-[19px] font-medium tracking-tight text-ink">Possibility Map</span>
    </span>
  );
}
