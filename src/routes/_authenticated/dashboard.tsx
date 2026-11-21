import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { CalendarX, CheckCircle2, Clock, Flame, ListTodo, Pause, Play, RotateCcw, Timer, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTasks } from "@/lib/data";
import { computeStats, dailyInsight, streaks } from "@/lib/stats";
import { countdown, displayStatus, fmtDuration, greeting, nextDay, taskStart, todayStr } from "@/lib/time";
import { Card, EmptyState, LoadingBlock, PageHeader, ProgressRing, StatCard } from "@/components/app/bits";
import { TaskItem } from "@/components/app/TaskItem";
import { QuickAdd } from "@/components/app/QuickAdd";
import { useTaskDialog } from "@/components/app/TaskDialog";
import type { Task } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Cadence" }, { name: "description", content: "Today's progress at a glance." }, { property: "og:title", content: "Dashboard — Cadence" }, { property: "og:description", content: "Today's progress at a glance." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
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
  const { openNew } = useTaskDialog();

  return (
    <div className="space-y-6 animate-rise">
      <PageHeader title={`${greeting(now)}!`} sub={format(now, "EEEE, MMMM d")} actions={<Button onClick={() => openNew()}><ListTodo className="h-4 w-4" />Add task</Button>} />
      <QuickAdd />
      {isLoading ? <LoadingBlock h={200} /> : (
        <>
          <div className="grid min-w-0 gap-4 xl:grid-cols-3">
            <Card className="flex min-w-0 items-center gap-4 sm:gap-6">
              <ProgressRing value={s.rate} size={112} stroke={9} />
              <div className="min-w-0 space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Today's progress</p>
                <p className="font-display text-3xl font-semibold tabular">{Math.round(s.rate)}%</p>
                <p className="text-sm text-muted-foreground">Time completed {s.timeRate.toFixed(1)}%</p>
                {insight && <p className="pt-2 text-sm leading-5">{insight}</p>}
              </div>
            </Card>
            <Card title="Up next" className="min-h-40">
              {next ? (
                <div className="flex h-full min-w-0 flex-col justify-between gap-3">
                  <div className="min-w-0">
                    <p className="break-words font-semibold">{next.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{next.category} · {next.priority}</p>
                  </div>
                  <p className="font-display text-2xl tabular">Starts in {countdown(taskStart(next).getTime() - now.getTime())}</p>
                </div>
              ) : <p className="text-sm text-muted-foreground">Nothing else scheduled today.</p>}
              <p className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 border-t pt-3 text-sm"><Flame className="h-4 w-4 text-warning" /><b>{st.current}-day streak</b><span className="text-muted-foreground">Best {st.best} days</span></p>
            </Card>
            <FocusTimer tasks={todays} />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-7">
            <StatCard label="Total" value={s.planned} icon={ListTodo} />
            <StatCard label="Completed" value={s.completed} icon={CheckCircle2} tone="success" />
            <StatCard label="Pending" value={s.pending} icon={Clock} tone="info" />
            <StatCard label="Missed" value={s.missed} icon={XCircle} tone="destructive" />
            <StatCard label="Rate" value={`${Math.round(s.rate)}%`} />
            <StatCard label="Planned" value={fmtDuration(s.plannedMin)} />
            <StatCard label="Done time" value={fmtDuration(s.completedPlannedMin)} />
          </div>
          <Card title="Today's schedule" action={<span className="text-xs text-muted-foreground">{todays.length} {todays.length === 1 ? "task" : "tasks"}</span>}>
            {todays.length ? <div className="space-y-2">{todays.map((t) => <TaskItem key={t.id} task={t} now={now} />)}</div>
              : <EmptyState icon={CalendarX} title="No tasks scheduled for today." desc="Add your first task to give the day a little structure." action={<Button variant="outline" onClick={() => openNew()}>Create a task</Button>} />}
          </Card>
        </>
      )}
    </div>
  );
}

function FocusTimer({ tasks }: { tasks: Task[] }) {
  const [duration, setDuration] = useState(25);
  const [remaining, setRemaining] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [endAt, setEndAt] = useState<number | null>(null);
  const [taskId, setTaskId] = useState(tasks[0]?.id ?? "none");
  const activeTask = tasks.find((task) => task.id === taskId);

  useEffect(() => {
    if (!tasks.some((task) => task.id === taskId)) setTaskId(tasks[0]?.id ?? "none");
  }, [tasks, taskId]);

  useEffect(() => {
    if (!running || endAt === null) return;
    const tick = () => {
      const next = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
      setRemaining(next);
      if (next === 0) {
        setRunning(false);
        setEndAt(null);
        toast.success("Focus session complete. Take a short break.");
      }
    };
    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, [endAt, running]);

  const timerLabel = `${String(Math.floor(remaining / 60)).padStart(2, "0")}:${String(remaining % 60).padStart(2, "0")}`;
  const ringValue = ((duration * 60 - remaining) / (duration * 60)) * 100;

  function toggleTimer() {
    if (running) {
      setRemaining(Math.max(0, Math.ceil(((endAt ?? Date.now()) - Date.now()) / 1000)));
      setRunning(false);
      setEndAt(null);
      return;
    }
    const next = remaining > 0 ? remaining : duration * 60;
    setRemaining(next);
    setEndAt(Date.now() + next * 1000);
    setRunning(true);
  }

  function resetTimer() {
    setRunning(false);
    setEndAt(null);
    setRemaining(duration * 60);
  }

  function changeDuration(value: string) {
    const next = Number(value);
    setDuration(next);
    if (!running) setRemaining(next * 60);
  }

  return (
    <Card title="Focus session" className="flex min-h-40 flex-col">
      <div className="mb-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
        <Select value={taskId} onValueChange={setTaskId}>
          <SelectTrigger aria-label="Choose focus task" className="min-w-0"><SelectValue placeholder="Choose a task" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No linked task</SelectItem>
            {tasks.map((task) => <SelectItem key={task.id} value={task.id}>{task.title}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={String(duration)} onValueChange={changeDuration}>
          <SelectTrigger aria-label="Focus duration" className="w-[5.5rem]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {[25, 45, 60].map((minutes) => <SelectItem key={minutes} value={String(minutes)}>{minutes} min</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-1 items-center gap-4">
        <ProgressRing value={ringValue} size={86} stroke={7} label={<span className="font-display text-lg font-semibold tabular">{timerLabel}</span>} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{activeTask?.title ?? "One thing at a time"}</p>
          <p className="mt-1 text-xs text-muted-foreground">{running ? "Stay with this session" : `${duration} minutes of focused work`}</p>
          <div className="mt-3 flex items-center gap-2">
            <Button size="sm" onClick={toggleTimer}><>{running ? <Pause /> : <Play />}{running ? "Pause" : remaining === 0 ? "Restart" : "Start"}</></Button>
            <Button size="icon" size-sm="sm" variant="ghost" aria-label="Reset focus timer" title="Reset timer" onClick={resetTimer}><RotateCcw className="h-4 w-4" /></Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
