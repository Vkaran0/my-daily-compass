import { createFileRoute } from "@tanstack/react-router";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useTasks } from "@/lib/data";
import { categoryStats, computeStats, dayLabel, groupByDate, streaks, weeklyInsights } from "@/lib/stats";
import { fmtDuration, nextDay, todayStr } from "@/lib/time";
import { Card, PageHeader, StatCard } from "@/components/app/bits";

export const Route = createFileRoute("/_authenticated/analytics")({
  head: () => ({ meta: [{ title: "Analytics — Cadence" }, { name: "description", content: "Weekly productivity analytics." }, { property: "og:title", content: "Analytics — Cadence" }, { property: "og:description", content: "Weekly productivity analytics." }] }),
  component: Analytics,
});

function Analytics() {
  const today = todayStr();
  const { data } = useTasks(nextDay(today, -13), today);
  const all = data ?? [];
  const week = all.filter((t) => t.date > nextDay(today, -7));
  const last = all.filter((t) => t.date <= nextDay(today, -7));
  const s = computeStats(week);
  const byDate = groupByDate(week);
  const chart = [...byDate.entries()].map(([d, ts]) => ({ day: dayLabel(d), rate: Math.round(computeStats(ts).rate) }));
  const cats = categoryStats(week);
  const insights = weeklyInsights(week, last);
  return (
    <div className="space-y-4 animate-rise">
      <PageHeader title="Analytics" sub="Last 7 days" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Weekly average" value={`${Math.round(s.rate)}%`} />
        <StatCard label="Completed" value={s.completed} tone="success" />
        <StatCard label="Missed" value={s.missed} tone="destructive" />
        <StatCard label="Hours" value={`${fmtDuration(s.completedPlannedMin)} / ${fmtDuration(s.plannedMin)}`} sub={`Streak ${streaks(all).current}d`} />
      </div>
      <Card title="Daily completion">
        <div className="h-64"><ResponsiveContainer><BarChart data={chart}><XAxis dataKey="day" /><YAxis domain={[0, 100]} /><Tooltip /><Bar dataKey="rate" fill="var(--color-primary)" radius={6} /></BarChart></ResponsiveContainer></div>
      </Card>
      <Card title="Categories">{cats.map((c) => <div key={c.category} className="flex justify-between py-1 text-sm"><span>{c.category}</span><b>{Math.round(c.rate)}%</b></div>)}</Card>
      {insights.length > 0 && <Card title="Insights">{insights.map((i) => <p key={i} className="text-sm">• {i}</p>)}</Card>}
    </div>
  );
}
