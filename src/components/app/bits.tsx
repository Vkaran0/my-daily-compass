import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { STATUS_LABEL, type DisplayStatus } from "@/lib/types";

export const STATUS_STYLE: Record<DisplayStatus, string> = {
  completed: "bg-success/15 text-success border-success/30",
  in_progress: "bg-info/15 text-info border-info/30",
  upcoming: "bg-muted text-muted-foreground border-border",
  missed: "bg-destructive/12 text-destructive border-destructive/30",
  skipped: "bg-warning/15 text-warning border-warning/30",
};

export function StatusBadge({ status, className }: { status: DisplayStatus; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold", STATUS_STYLE[status], className)}>
      {status === "in_progress" && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-info" />}
      {STATUS_LABEL[status]}
    </span>
  );
}

export function PriorityTag({ p }: { p: string }) {
  const cls = p === "high" ? "text-destructive" : p === "medium" ? "text-warning" : "text-muted-foreground";
  return (
    <span className={cn("inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide", cls)}>
      <span className="flex gap-px">
        {[0, 1, 2].map((i) => (
          <span key={i} className={cn("h-2.5 w-1 rounded-sm bg-current", i >= (p === "high" ? 3 : p === "medium" ? 2 : 1) && "opacity-20")} />
        ))}
      </span>
      {p}
    </span>
  );
}

export function CategoryChip({ name, color }: { name: string; color: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      {name}
    </span>
  );
}

export function ProgressRing({ value, size = 140, stroke = 12, label }: { value: number; size?: number; stroke?: number; label?: ReactNode }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-muted)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--color-primary)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (v / 100) * c}
          style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(.2,.8,.2,1)" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        {label ?? <span className="font-display text-3xl font-semibold tabular">{Math.round(v)}%</span>}
      </div>
    </div>
  );
}

export function StatCard({ label, value, sub, icon: Icon, tone }: { label: string; value: ReactNode; sub?: ReactNode; icon?: LucideIcon; tone?: "success" | "destructive" | "warning" | "info" }) {
  const toneCls = tone ? { success: "text-success", destructive: "text-destructive", warning: "text-warning", info: "text-info" }[tone] : "text-muted-foreground";
  return (
    <div className="min-w-0 rounded-lg border bg-card p-3.5 transition-colors hover:border-primary/30 sm:p-4">
      <div className="flex items-center justify-between">
        <span className="min-w-0 truncate text-xs font-medium text-muted-foreground">{label}</span>
        {Icon && <Icon className={cn("h-4 w-4", toneCls)} />}
      </div>
      <div className="mt-2 truncate font-display text-xl font-semibold tabular sm:text-2xl">{value}</div>
      {sub && <div className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{sub}</div>}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, desc, action }: { icon: LucideIcon; title: string; desc?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed px-6 py-10 text-center">
      <div className="grid h-11 w-11 place-items-center rounded-full bg-muted">
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      <p className="mt-3 font-medium">{title}</p>
      {desc && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{desc}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Card({ title, action, children, className }: { title?: ReactNode; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("min-w-0 rounded-lg border bg-card p-4 sm:p-5", className)}>
      {(title || action) && (
        <div className="mb-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          {title && <h2 className="min-w-0 truncate text-base font-semibold">{title}</h2>}
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

export function PageHeader({ title, sub, actions }: { title: string; sub?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3 sm:flex sm:flex-wrap sm:justify-between">
      <div className="min-w-0">
        <h1 className="break-words text-2xl font-semibold sm:text-3xl">{title}</h1>
        {sub && <p className="mt-1 text-sm leading-6 text-muted-foreground">{sub}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap justify-end gap-2">{actions}</div>}
    </div>
  );
}

export function LoadingBlock({ h = 120 }: { h?: number }) {
  return <div className="animate-pulse rounded-xl bg-muted" style={{ height: h }} />;
}
