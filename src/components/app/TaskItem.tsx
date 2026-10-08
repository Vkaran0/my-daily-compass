import { Bell, Check, Copy, MoreHorizontal, Pencil, Repeat, RotateCcw, SkipForward, Trash2, CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useCategoryColor, useSettings, useTaskMutations } from "@/lib/data";
import { displayStatus, fmtTime, nextDay, plannedMinutes, actualMinutes, fmtDuration } from "@/lib/time";
import type { Task } from "@/lib/types";
import { cn } from "@/lib/utils";
import { CategoryChip, PriorityTag, StatusBadge } from "./bits";
import { useTaskDialog } from "./TaskDialog";

export function TaskItem({ task, now = new Date(), showDate = false, compact = false }: { task: Task; now?: Date; showDate?: boolean; compact?: boolean }) {
  const { setStatus, remove, duplicate, update } = useTaskMutations();
  const { openTask } = useTaskDialog();
  const color = useCategoryColor();
  const { data: s } = useSettings();
  const fmt = (s?.time_format as "12" | "24") ?? "12";
  const st = displayStatus(task, now);
  const done = st === "completed";
  const planned = plannedMinutes(task);
  const actual = actualMinutes(task);

  return (
    <div
      className={cn(
        "group relative flex items-start gap-3 rounded-xl border bg-card p-3 transition hover:border-primary/40",
        st === "in_progress" && "border-info/50 ring-1 ring-info/20",
        st === "missed" && "border-destructive/30",
        (done || st === "skipped") && "opacity-75",
      )}
    >
      <span className="absolute inset-y-3 left-0 w-1 rounded-r-full" style={{ backgroundColor: color(task.category) }} />
      <button
        aria-label={done ? "Mark incomplete" : "Mark complete"}
        onClick={() => setStatus.mutate({ task, status: done ? "pending" : "completed" })}
        className={cn(
          "ml-1 mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 transition",
          done ? "border-success bg-success text-primary-foreground" : "border-muted-foreground/40 hover:border-primary",
        )}
      >
        {done && <Check className="h-3 w-3" strokeWidth={3} />}
      </button>
      <button className="min-w-0 flex-1 text-left" onClick={() => openTask(task)}>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className={cn("font-medium", done && "line-through decoration-muted-foreground/50")}>{task.title}</span>
          {task.recurring_id && <Repeat className="h-3 w-3 text-muted-foreground" />}
          {task.is_demo && <span className="rounded bg-highlight/60 px-1.5 text-[10px] font-semibold text-highlight-foreground">SAMPLE</span>}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="tabular">
            {showDate && `${task.date} · `}
            {fmtTime(task.start_time, fmt)} – {fmtTime(task.end_time, fmt)}
          </span>
          <CategoryChip name={task.category} color={color(task.category)} />
          {!compact && <PriorityTag p={task.priority} />}
          {!compact && task.reminder_minutes != null && (
            <span className="inline-flex items-center gap-1"><Bell className="h-3 w-3" />{task.reminder_minutes}m</span>
          )}
          {done && task.actual_start && (
            <span className="tabular">Actual {fmtDuration(actual)} / {fmtDuration(planned)} · {planned ? Math.round((actual / planned) * 100) : 0}%</span>
          )}
        </div>
      </button>
      <div className="flex shrink-0 items-center gap-1">
        <StatusBadge status={st} className="hidden sm:inline-flex" />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Task actions"><MoreHorizontal className="h-4 w-4" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {done ? (
              <DropdownMenuItem onClick={() => setStatus.mutate({ task, status: "pending" })}><RotateCcw className="h-4 w-4" />Mark incomplete</DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={() => setStatus.mutate({ task, status: "completed" })}><Check className="h-4 w-4" />Mark complete</DropdownMenuItem>
            )}
            {st !== "skipped" && <DropdownMenuItem onClick={() => setStatus.mutate({ task, status: "skipped" })}><SkipForward className="h-4 w-4" />Skip</DropdownMenuItem>}
            <DropdownMenuItem onClick={() => openTask(task)}><Pencil className="h-4 w-4" />Edit</DropdownMenuItem>
            <DropdownMenuItem onClick={() => update.mutate({ id: task.id, date: nextDay(task.date), status: "pending" })}><CalendarClock className="h-4 w-4" />Move to next day</DropdownMenuItem>
            <DropdownMenuItem onClick={() => duplicate.mutate(task)}><Copy className="h-4 w-4" />Duplicate</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive" onClick={() => window.confirm(`Delete “${task.title}”?`) && remove.mutate(task.id)}><Trash2 className="h-4 w-4" />Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
