import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, startOfMonth, startOfWeek } from "date-fns";
import { Button } from "@/components/ui/button";
import { useTasks } from "@/lib/data";
import { displayStatus, ymd } from "@/lib/time";
import { PageHeader } from "@/components/app/bits";
import { useTaskDialog } from "@/components/app/TaskDialog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/calendar")({
  head: () => ({ meta: [{ title: "Calendar — Cadence" }, { name: "description", content: "Your tasks on a calendar." }, { property: "og:title", content: "Calendar — Cadence" }, { property: "og:description", content: "Your tasks on a calendar." }] }),
  component: Cal,
});

function Cal() {
  const [m, setM] = useState(new Date());
  const days = eachDayOfInterval({ start: startOfWeek(startOfMonth(m), { weekStartsOn: 1 }), end: endOfWeek(endOfMonth(m), { weekStartsOn: 1 }) });
  const { data } = useTasks(ymd(days[0]), ymd(days[days.length - 1]));
  const { openTask } = useTaskDialog();
  const tone = { completed: "bg-success/15 text-success", missed: "bg-destructive/15 text-destructive", skipped: "bg-warning/15 text-warning", upcoming: "bg-muted", in_progress: "bg-info/15 text-info" };
  return (
    <div className="animate-rise">
      <PageHeader title={format(m, "MMMM yyyy")} actions={<><Button variant="outline" onClick={() => setM(addMonths(m, -1))}>Prev</Button><Button variant="outline" onClick={() => setM(new Date())}>Today</Button><Button variant="outline" onClick={() => setM(addMonths(m, 1))}>Next</Button></>} />
      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-xl border bg-border text-xs">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => <div key={d} className="bg-card p-2 font-semibold">{d}</div>)}
        {days.map((d) => {
          const ts = (data ?? []).filter((t) => t.date === ymd(d));
          return (
            <div key={d.toISOString()} className={cn("min-h-20 bg-card p-1", d.getMonth() !== m.getMonth() && "opacity-40")}>
              <div className="mb-1 font-medium">{d.getDate()}</div>
              {ts.slice(0, 3).map((t) => (
                <button key={t.id} onClick={() => openTask(t)} className={cn("mb-0.5 block w-full truncate rounded px-1 text-left", tone[displayStatus(t)], t.priority === "high" && "font-semibold")}>{t.title}</button>
              ))}
              {ts.length > 3 && <div className="text-muted-foreground">+{ts.length - 3}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
