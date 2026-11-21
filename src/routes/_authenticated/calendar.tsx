import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, startOfMonth, startOfWeek } from "date-fns";
import { Button } from "@/components/ui/button";
import { useTasks } from "@/lib/data";
import { displayStatus, fmtTime, todayStr, ymd } from "@/lib/time";
import { EmptyState, PageHeader } from "@/components/app/bits";
import { useTaskDialog } from "@/components/app/TaskDialog";
import { cn } from "@/lib/utils";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/_authenticated/calendar")({
  head: () => ({ meta: [{ title: "Calendar — Cadence" }, { name: "description", content: "Your tasks on a calendar." }, { property: "og:title", content: "Calendar — Cadence" }, { property: "og:description", content: "Your tasks on a calendar." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: Cal,
});

function Cal() {
  const [m, setM] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const days = eachDayOfInterval({ start: startOfWeek(startOfMonth(m), { weekStartsOn: 1 }), end: endOfWeek(endOfMonth(m), { weekStartsOn: 1 }) });
  const firstDay = days[0] ?? m;
  const lastDay = days.at(-1) ?? m;
  const { data } = useTasks(ymd(firstDay), ymd(lastDay));
  const { openTask } = useTaskDialog();
  const selectedTasks = (data ?? []).filter((task) => task.date === selectedDate).sort((a, b) => a.start_time.localeCompare(b.start_time));
  const tone = { completed: "bg-success/15 text-success", missed: "bg-destructive/15 text-destructive", skipped: "bg-warning/15 text-warning", upcoming: "bg-muted", in_progress: "bg-info/15 text-info" };

  function moveMonth(amount: number) {
    const next = addMonths(m, amount);
    setM(next);
    setSelectedDate(ymd(startOfMonth(next)));
  }

  return (
    <div className="space-y-5 animate-rise">
      <PageHeader title="Calendar" sub={format(m, "MMMM yyyy")} actions={<div className="flex items-center gap-1">
        <Button variant="outline" size="icon" aria-label="Previous month" title="Previous month" onClick={() => moveMonth(-1)}><ChevronLeft className="h-4 w-4" /></Button>
        <Button variant="outline" onClick={() => { setM(new Date()); setSelectedDate(todayStr()); }}>Today</Button>
        <Button variant="outline" size="icon" aria-label="Next month" title="Next month" onClick={() => moveMonth(1)}><ChevronRight className="h-4 w-4" /></Button>
      </div>} />
      <div className="overflow-hidden rounded-lg border bg-border">
        <div className="grid grid-cols-7 gap-px text-[10px] sm:text-xs">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => <div key={d} className="bg-card px-1 py-2 text-center font-semibold sm:px-2">{d}</div>)}
        {days.map((d) => {
          const ts = (data ?? []).filter((t) => t.date === ymd(d));
          const dayKey = ymd(d);
          const isSelected = dayKey === selectedDate;
          return (
            <div key={d.toISOString()} className={cn("min-h-[4.5rem] min-w-0 bg-card p-1 sm:min-h-28 sm:p-2", d.getMonth() !== m.getMonth() && "opacity-45", isSelected && "bg-accent/50")}>
              <Button variant="ghost" size="icon" className={cn("mb-1 h-6 w-6 text-[10px] sm:h-7 sm:w-7 sm:text-xs", dayKey === todayStr() && "font-bold text-primary", isSelected && "bg-accent")} aria-label={`Select ${format(d, "EEEE, MMMM d")}`} aria-pressed={isSelected} onClick={() => setSelectedDate(dayKey)}>{d.getDate()}</Button>
              <div className="hidden space-y-1 sm:block">
                {ts.slice(0, 2).map((t) => <Button key={t.id} variant="ghost" size="sm" onClick={() => openTask(t)} className={cn("block h-auto w-full justify-start truncate px-1.5 py-0.5 text-left text-[11px]", tone[displayStatus(t)], t.priority === "high" && "font-semibold")}>{t.title}</Button>)}
                {ts.length > 2 && <div className="px-1 text-[10px] text-muted-foreground">+{ts.length - 2} more</div>}
              </div>
              <div className="flex flex-wrap gap-0.5 sm:hidden" aria-label={`${ts.length} tasks`}>
                {ts.slice(0, 4).map((task) => <span key={task.id} className={cn("h-1.5 w-1.5 rounded-full", tone[displayStatus(task)].split(" ")[0])} />)}
                {ts.length > 4 && <span className="text-[9px] text-muted-foreground">+{ts.length - 4}</span>}
              </div>
            </div>
          );
        })}
        </div>
      </div>
      <section className="space-y-3" aria-label="Selected day schedule">
        <div className="flex min-w-0 items-center justify-between gap-3">
          <div className="min-w-0"><h2 className="font-display text-lg font-semibold">{format(new Date(`${selectedDate}T12:00:00`), "EEEE, MMMM d")}</h2><p className="text-sm text-muted-foreground">{selectedTasks.length} scheduled {selectedTasks.length === 1 ? "task" : "tasks"}</p></div>
          <Button variant="outline" size="sm" onClick={() => openTask({} as never)} className="hidden">Add task</Button>
        </div>
        {selectedTasks.length ? <div className="space-y-2">{selectedTasks.map((task) => (
          <Button key={task.id} variant="outline" onClick={() => openTask(task)} className="grid h-auto w-full grid-cols-[auto_minmax(0,1fr)_auto] justify-start gap-3 py-3 text-left">
            <span className="text-xs tabular-nums text-muted-foreground">{fmtTime(task.start_time)} – {fmtTime(task.end_time)}</span>
            <span className="min-w-0 truncate font-medium">{task.title}</span>
            <span className="shrink-0 text-xs text-muted-foreground">{displayStatus(task).replace("_", " ")}</span>
          </Button>
        ))}</div> : <EmptyState icon={CalendarDays} title="Nothing scheduled for this day." desc="Choose another date or make room for something new." />}
      </section>
    </div>
  );
}
