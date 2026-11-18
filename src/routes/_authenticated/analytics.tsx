import { createFileRoute } from "@tanstack/react-router";
import { addDays, format, parseISO } from "date-fns";
import { Activity, ArrowDownRight, ArrowLeft, ArrowRight, ArrowUpRight, CalendarDays, Clock3, ListChecks, Target } from "lucide-react";
import { useMemo, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { buildPeriodSeries, getAnalyticsWindow, moveAnalyticsAnchor, type AnalyticsPeriod } from "@/lib/analytics-period";
import { useTasks } from "@/lib/data";
import { categoryStats, computeStats } from "@/lib/stats";
import { fmtDuration, todayStr } from "@/lib/time";
import { Card, PageHeader, StatCard } from "@/components/app/bits";

export const Route = createFileRoute("/_authenticated/analytics")({
  head: () => ({ meta: [{ title: "Study Analytics — Cadence" }, { name: "description", content: "Explore daily, weekly, and monthly study habits, task completion, and focused time." }, { property: "og:title", content: "Study Analytics — Cadence" }, { property: "og:description", content: "Explore daily, weekly, and monthly study habits, task completion, and focused time." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: Analytics,
});

function Analytics() {
  const [period, setPeriod] = useState<AnalyticsPeriod>("week");
  const [anchor, setAnchor] = useState(todayStr());
  const window = useMemo(() => getAnalyticsWindow(anchor, period), [anchor, period]);
  const { data, isLoading, isError } = useTasks(window.previousStart, window.currentEnd);
  const tasks = data ?? [];
  const current = tasks.filter((task) => task.date >= window.currentStart && task.date <= window.currentEnd);
  const previous = tasks.filter((task) => task.date >= window.previousStart && task.date <= window.previousEnd);
  const stats = computeStats(current);
  const previousStats = computeStats(previous);
  const categories = categoryStats(current);
  const chart = buildPeriodSeries(current, previous, window, period);
  const change = Math.round(stats.rate - previousStats.rate);
  const periodTitle = period === "day" ? "Daily view" : period === "week" ? "Weekly view" : "Monthly view";
  const rangeLabel = period === "day"
    ? format(parseISO(anchor), "EEEE, MMMM d, yyyy")
    : `${format(parseISO(window.currentStart), "MMM d")} – ${format(parseISO(window.currentEnd), "MMM d, yyyy")}`;

  function shift(amount: number) {
    setAnchor((value) => moveAnalyticsAnchor(value, period, amount));
  }

  const progressMessage = stats.planned
    ? `${stats.completed} of ${stats.planned} planned tasks completed`
    : "No tasks scheduled in this period";

  return (
    <div className="space-y-6 animate-rise">
      <PageHeader title="Study Analytics" sub="A clear picture of your progress, one period at a time." />

      <section aria-label="Analysis period" className="flex flex-col gap-4 border-b pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex w-fit items-center gap-1 rounded-lg border bg-card p-1" role="group" aria-label="Choose analysis period">
          {(["day", "week", "month"] as const).map((value) => (
            <Button key={value} size="sm" variant={period === value ? "default" : "ghost"} aria-pressed={period === value} onClick={() => setPeriod(value)}>
              {value === "day" ? "Daily" : value === "week" ? "Weekly" : "Monthly"}
            </Button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="icon" variant="outline" aria-label="Previous period" title="Previous period" onClick={() => shift(-1)}><ArrowLeft className="h-4 w-4" /></Button>
          <Input aria-label="Choose analysis date" type="date" value={anchor} onChange={(event) => setAnchor(event.target.value)} className="w-40" />
          <Button size="icon" variant="outline" aria-label="Next period" title="Next period" onClick={() => shift(1)}><ArrowRight className="h-4 w-4" /></Button>
          <Button variant="ghost" size="sm" onClick={() => setAnchor(todayStr())}>Today</Button>
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-display text-lg font-semibold">{periodTitle}</h2>
          <p className="text-sm text-muted-foreground">{rangeLabel}</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="h-2 w-2 rounded-full bg-primary" /> This period
          <span className="ml-2 h-2 w-2 rounded-full bg-chart-3" /> Previous period
        </div>
      </div>

      {isError ? (
        <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">Your analytics could not be loaded. Please try again shortly.</div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            <StatCard label="Completion rate" value={`${Math.round(stats.rate)}%`} sub={progressMessage} icon={Target} tone="info" />
            <StatCard label="Tasks completed" value={stats.completed} sub={`${stats.missed} missed · ${stats.skipped} skipped`} icon={ListChecks} tone="success" />
            <StatCard label="Focused time" value={fmtDuration(stats.actualMin)} sub={`${fmtDuration(stats.completedPlannedMin)} planned`} icon={Clock3} />
            <StatCard label="Compared with before" value={`${change > 0 ? "+" : ""}${change}%`} sub="Task completion rate" icon={change >= 0 ? ArrowUpRight : ArrowDownRight} tone={change >= 0 ? "success" : "destructive"} />
          </div>

          <Card title="Completion trend" className="min-w-0">
            {isLoading ? <div className="h-72 animate-pulse rounded-md bg-muted" /> : (
              <div className="h-72 min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chart} margin={{ top: 12, right: 12, bottom: 4, left: -14 }}>
                    <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} interval={period === "month" ? 2 : 0} tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }} />
                    <YAxis domain={[0, 100]} tickLine={false} axisLine={false} tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }} tickFormatter={(value: number) => `${value}%`} />
                    <Tooltip formatter={(value) => [`${value}%`, "Completion"]} contentStyle={{ background: "var(--color-card)", borderColor: "var(--color-border)", borderRadius: "8px", color: "var(--color-foreground)" }} />
                    <Line type="monotone" dataKey="rate" name="This period" stroke="var(--color-primary)" strokeWidth={2.5} dot={{ r: period === "month" ? 2 : 4 }} activeDot={{ r: 5 }} connectNulls />
                    <Line type="monotone" dataKey="previousRate" name="Previous period" stroke="var(--color-chart-3)" strokeWidth={2} strokeDasharray="5 4" dot={false} connectNulls />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
            <p className="mt-2 text-xs text-muted-foreground">Daily completion rate compared with the matching days before.</p>
          </Card>

          <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
            <Card title="Category performance">
              {isLoading ? <div className="h-28 animate-pulse rounded-md bg-muted" /> : categories.length ? (
                <div className="space-y-4">
                  {categories.slice(0, 6).map((category) => (
                    <div key={category.category} className="space-y-2">
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="min-w-0 truncate font-medium">{category.category}</span>
                        <span className="shrink-0 tabular-nums text-muted-foreground">{category.completed}/{category.planned} · {Math.round(category.rate)}%</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${Math.round(category.rate)}%` }} /></div>
                    </div>
                  ))}
                </div>
              ) : <p className="py-5 text-sm text-muted-foreground">Category insights will appear once tasks are scheduled.</p>}
            </Card>
            <Card title="Period summary">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-accent text-accent-foreground"><Activity className="h-4 w-4" /></span>
                  <div><p className="text-sm font-medium">{progressMessage}</p><p className="mt-1 text-xs text-muted-foreground">{stats.pending} upcoming or in-progress · {stats.missed} missed</p></div>
                </div>
                <div className="flex items-start gap-3 border-t pt-4">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground"><CalendarDays className="h-4 w-4" /></span>
                  <div><p className="text-sm font-medium">{previousStats.planned ? `${Math.round(previousStats.rate)}% completion in the previous period` : "No previous-period data yet"}</p><p className="mt-1 text-xs text-muted-foreground">Use the trend to compare your rhythm over time.</p></div>
                </div>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
