import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { CalendarX, CheckCircle2, Clock, Flame, ListTodo, XCircle } from "lucide-react";
import { useTasks } from "@/lib/data";
import { computeStats, dailyInsight, streaks } from "@/lib/stats";
import { countdown, displayStatus, fmtDuration, greeting, nextDay, taskStart, todayStr } from "@/lib/time";
import { Card, EmptyState, LoadingBlock, PageHeader, ProgressRing, StatCard } from "@/components/app/bits";
import { TaskItem } from "@/components/app/TaskItem";
import { QuickAdd } from "@/components/app/QuickAdd";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Cadence" }, { name: "description", content: "Today's progress at a glance." }, { property: "og:title", content: "Dashboard — Cadence" }, { property: "og:description", content: "Today's progress at a glance." }] }),
  component: Dashboard,
});

function Dashboard() {
  const today = todayStr();
  const [now, setNow] = useState(new Date());
  useEffect(() => { const i = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(i); }, []);
  const { data: tasks, isLoading } = useTasks(nextDay(today, -120), today);
  const todays = (tasks ?? []).filter((t) => t.date === today);
  const s = computeStats(todays, now);
  const st = streaks(tasks ?? []);
  const next = todays.find((t) => displayStatus(t, now) === "upcoming");
  const insight = dailyInsight(todays);

  return (
    <div className="space-y-6 animate-rise">
      <PageHeader title={`${greeting(now)}!`} sub={format(now, "EEEE, MMMM d")} />
      <QuickAdd />
      {isLoading ? <LoadingBlock h={200} /> : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="flex items-center gap-5 md:col-span-2">
              <ProgressRing value={s.rate} />
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Today's Progress</p>
                <p className="font-display text-3xl font-semibold">{Math.round(s.rate)}%</p>
                <p className="text-sm text-muted-foreground">Time completion {s.timeRate.toFixed(1)}%</p>
                {insight && <p className="pt-2 text-sm">{insight}</p>}
              </div>
            </Card>
            <Card title="Next Task">
              {next ? (
                <div className="space-y-1">
                  <p className="font-semibold">{next.title}</p>
                  <p className="text-sm text-muted-foreground">{next.category} · {next.priority}</p>
                  <p className="font-display text-2xl tabular">{countdown(taskStart(next).getTime() - now.getTime())}</p>
                </div>
              ) : <p className="text-sm text-muted-foreground">Nothing else scheduled today.</p>}
              <p className="mt-4 flex items-center gap-2 text-sm"><Flame className="h-4 w-4 text-warning" />Current streak: <b>{st.current} days</b> · Best {st.best}</p>
            </Card>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-7">
            <StatCard label="Total" value={s.planned} icon={ListTodo} />
            <StatCard label="Completed" value={s.completed} icon={CheckCircle2} tone="success" />
            <StatCard label="Pending" value={s.pending} icon={Clock} tone="info" />
            <StatCard label="Missed" value={s.missed} icon={XCircle} tone="destructive" />
            <StatCard label="Rate" value={`${Math.round(s.rate)}%`} />
            <StatCard label="Planned" value={fmtDuration(s.plannedMin)} />
            <StatCard label="Done time" value={fmtDuration(s.completedPlannedMin)} />
          </div>
          <Card title="Today's Schedule">
            {todays.length ? <div className="space-y-2">{todays.map((t) => <TaskItem key={t.id} task={t} now={now} />)}</div>
              : <EmptyState icon={CalendarX} title="No tasks scheduled for today." />}
          </Card>
        </>
      )}
    </div>
  );
}
