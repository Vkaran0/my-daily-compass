import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ListTodo } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useTasks } from "@/lib/data";
import { displayStatus, nextDay, todayStr } from "@/lib/time";
import { EmptyState, LoadingBlock, PageHeader } from "@/components/app/bits";
import { TaskItem } from "@/components/app/TaskItem";
import { QuickAdd } from "@/components/app/QuickAdd";

export const Route = createFileRoute("/_authenticated/tasks")({
  head: () => ({ meta: [{ title: "Tasks — Cadence" }, { name: "description", content: "Search, filter and manage tasks." }, { property: "og:title", content: "Tasks — Cadence" }, { property: "og:description", content: "Search, filter and manage tasks." }] }),
  component: Tasks,
});

function Tasks() {
  const today = todayStr();
  const [from, setFrom] = useState(nextDay(today, -7));
  const [to, setTo] = useState(nextDay(today, 7));
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [status, setStatus] = useState("");
  const [prio, setPrio] = useState("");
  const [rec, setRec] = useState(false);
  const { data, isLoading } = useTasks(from, to);
  const list = (data ?? []).filter((t) =>
    (!q || t.title.toLowerCase().includes(q.toLowerCase())) && (!cat || t.category === cat) && (!prio || t.priority === prio) &&
    (!status || displayStatus(t) === status) && (!rec || t.recurring_id));
  const sel = "h-9 rounded-md border bg-card px-2 text-sm";
  return (
    <div className="space-y-4 animate-rise">
      <PageHeader title="Tasks" />
      <QuickAdd />
      <div className="flex flex-wrap gap-2">
        <Input className="w-48" placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} />
        <Input type="date" className="w-40" value={from} onChange={(e) => setFrom(e.target.value)} />
        <Input type="date" className="w-40" value={to} onChange={(e) => setTo(e.target.value)} />
        <select className={sel} value={cat} onChange={(e) => setCat(e.target.value)}><option value="">All categories</option>{[...new Set((data ?? []).map((t) => t.category))].map((c) => <option key={c}>{c}</option>)}</select>
        <select className={sel} value={prio} onChange={(e) => setPrio(e.target.value)}><option value="">Any priority</option><option>high</option><option>medium</option><option>low</option></select>
        <select className={sel} value={status} onChange={(e) => setStatus(e.target.value)}><option value="">Any status</option>{["upcoming", "in_progress", "completed", "missed", "skipped"].map((s) => <option key={s}>{s}</option>)}</select>
        <label className="flex items-center gap-1 text-sm"><input type="checkbox" checked={rec} onChange={(e) => setRec(e.target.checked)} />Recurring</label>
      </div>
      {isLoading ? <LoadingBlock /> : list.length ? <div className="space-y-2">{list.map((t) => <TaskItem key={t.id} task={t} showDate />)}</div>
        : <EmptyState icon={ListTodo} title="No tasks match these filters." />}
    </div>
  );
}
