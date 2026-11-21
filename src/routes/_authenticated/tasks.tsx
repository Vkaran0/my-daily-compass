import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ListTodo, Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTasks } from "@/lib/data";
import { displayStatus, nextDay, todayStr } from "@/lib/time";
import { EmptyState, LoadingBlock, PageHeader } from "@/components/app/bits";
import { TaskItem } from "@/components/app/TaskItem";
import { QuickAdd } from "@/components/app/QuickAdd";

export const Route = createFileRoute("/_authenticated/tasks")({
  head: () => ({ meta: [{ title: "Tasks — Cadence" }, { name: "description", content: "Search, filter and manage tasks." }, { property: "og:title", content: "Tasks — Cadence" }, { property: "og:description", content: "Search, filter and manage tasks." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
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
  const hasFilters = Boolean(q || cat || status || prio || rec);

  return (
    <div className="space-y-4 animate-rise">
      <PageHeader title="Tasks" sub="Plan, prioritize, and keep your day moving." />
      <QuickAdd />
      <section className="space-y-3 rounded-lg border bg-card p-3 sm:p-4" aria-label="Task filters">
        <div className="flex items-center gap-2 text-sm font-semibold"><SlidersHorizontal className="h-4 w-4 text-primary" />Find tasks</div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
          <div className="relative col-span-2 min-w-0 sm:col-span-3 xl:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input aria-label="Search tasks" className="pl-9" placeholder="Search task names" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <Input aria-label="From date" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          <Input aria-label="To date" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          <Select value={cat || "all"} onValueChange={(value) => setCat(value === "all" ? "" : value)}>
            <SelectTrigger aria-label="Filter by category"><SelectValue placeholder="All categories" /></SelectTrigger>
            <SelectContent><SelectItem value="all">All categories</SelectItem>{[...new Set((data ?? []).map((t) => t.category))].map((category) => <SelectItem key={category} value={category}>{category}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={prio || "all"} onValueChange={(value) => setPrio(value === "all" ? "" : value)}>
            <SelectTrigger aria-label="Filter by priority"><SelectValue placeholder="Any priority" /></SelectTrigger>
            <SelectContent><SelectItem value="all">Any priority</SelectItem>{["high", "medium", "low"].map((value) => <SelectItem key={value} value={value}>{value[0]?.toUpperCase()}{value.slice(1)}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={status || "all"} onValueChange={(value) => setStatus(value === "all" ? "" : value)}>
            <SelectTrigger aria-label="Filter by status"><SelectValue placeholder="Any status" /></SelectTrigger>
            <SelectContent><SelectItem value="all">Any status</SelectItem>{["upcoming", "in_progress", "completed", "missed", "skipped"].map((value) => <SelectItem key={value} value={value}>{value.replace("_", " ").replace(/^./, (letter) => letter.toUpperCase())}</SelectItem>)}</SelectContent>
          </Select>
          <label className="col-span-2 flex min-h-9 items-center gap-2 rounded-md border px-3 text-sm sm:col-span-1">
            <input className="accent-primary" type="checkbox" checked={rec} onChange={(e) => setRec(e.target.checked)} />Recurring only
          </label>
        </div>
      </section>
      <div className="flex min-w-0 items-center justify-between gap-3 text-sm">
        <span className="min-w-0 truncate font-medium">{list.length} {list.length === 1 ? "task" : "tasks"}</span>
        {hasFilters && <Button variant="ghost" size="sm" onClick={() => { setQ(""); setCat(""); setStatus(""); setPrio(""); setRec(false); }}>Clear filters</Button>}
      </div>
      {isLoading ? <LoadingBlock /> : list.length ? <div className="space-y-2">{list.map((t) => <TaskItem key={t.id} task={t} showDate />)}</div>
        : <EmptyState icon={ListTodo} title="No tasks match these filters." />}
    </div>
  );
}
