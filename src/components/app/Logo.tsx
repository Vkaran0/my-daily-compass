export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
        <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M4 12h3l3-7 4 14 3-7h3" />
        </svg>
      </div>
      {!compact && <span className="font-display text-lg font-semibold">Cadence</span>}
    </div>
  );
}
