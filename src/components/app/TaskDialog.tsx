import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { findDuplicate, getUserId, useCategories, useSettings, useTaskMutations } from "@/lib/data";
import { generateRecurring, regenerateRule } from "@/lib/recurrence";
import { DEFAULT_CATEGORIES, REPEAT_OPTIONS, type Task } from "@/lib/types";
import { durationMin, fmtDuration, todayStr } from "@/lib/time";
import { cn } from "@/lib/utils";

export type TaskPrefill = Partial<Pick<Task, "title" | "date" | "start_time" | "end_time" | "category" | "priority">>;

type Ctx = { openNew: (p?: TaskPrefill) => void; openTask: (t: Task) => void };
const TaskDialogCtx = createContext<Ctx>({ openNew: () => {}, openTask: () => {} });
export const useTaskDialog = () => useContext(TaskDialogCtx);

export function TaskDialogProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ open: boolean; task?: Task; prefill?: TaskPrefill; key: number }>({ open: false, key: 0 });
  return (
    <TaskDialogCtx.Provider
      value={{
        openNew: (prefill) => setState((s) => ({ open: true, prefill, key: s.key + 1 })),
        openTask: (task) => setState((s) => ({ open: true, task, key: s.key + 1 })),
      }}
    >
      {children}
      <TaskDialog key={state.key} open={state.open} task={state.task} prefill={state.prefill} onClose={() => setState((s) => ({ ...s, open: false }))} />
    </TaskDialogCtx.Provider>
  );
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const hhmm = (t?: string | null) => (t ? t.slice(0, 5) : "");

function TaskDialog({ open, task, prefill, onClose }: { open: boolean; task?: Task; prefill?: TaskPrefill; onClose: () => void }) {
  const { data: settings } = useSettings();
  const { data: cats } = useCategories();
  const { create, update, remove } = useTaskMutations();
  const qc = useQueryClient();
  const categories = cats?.length ? cats.map((c) => c.name) : DEFAULT_CATEGORIES;
  const defaultReminder = settings?.default_reminder ?? 15;

  const [f, setF] = useState(() => ({
    title: task?.title ?? prefill?.title ?? "",
    description: task?.description ?? "",
    date: task?.date ?? prefill?.date ?? todayStr(),
    start: hhmm(task?.start_time ?? prefill?.start_time) || "09:00",
    end: hhmm(task?.end_time ?? prefill?.end_time) || "10:00",
    category: task?.category ?? prefill?.category ?? "Other",
    priority: task?.priority ?? prefill?.priority ?? "medium",
    reminder: task ? (task.reminder_minutes == null ? "none" : String(task.reminder_minutes)) : String(defaultReminder),
    customReminder: "",
    notes: task?.notes ?? "",
    status: task?.status ?? "pending",
    actualStart: hhmm(task?.actual_start),
    actualEnd: hhmm(task?.actual_end),
    repeat: "none",
    days: [1, 2, 3, 4, 5] as number[],
    interval: "2",
    repeatEnd: "",
    applyToSeries: false,
  }));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((x) => ({ ...x, [k]: v }));

  useEffect(() => {
    if (!task && settings) setF((x) => ({ ...x, reminder: x.reminder === "15" ? String(settings.default_reminder) : x.reminder }));
  }, [settings, task]);

  const reminderMinutes = () => {
    if (f.reminder === "none") return null;
    if (f.reminder === "custom") return Number(f.customReminder) || null;
    return Number(f.reminder);
  };

  const dur = durationMin(f.start, f.end);
  const isPresetReminder = ["none", "5", "10", "15", "30", "custom"].includes(f.reminder);

  function validate() {
    const e: Record<string, string> = {};
    if (!f.title.trim()) e.title = "Title is required";
    if (f.title.length > 120) e.title = "Keep it under 120 characters";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(f.date) || isNaN(Date.parse(f.date))) e.date = "Pick a valid date";
    if (!f.start || !f.end) e.time = "Start and end time are required";
    else if (f.start === f.end) e.time = "End time must differ from start time";
    if (f.reminder === "custom" && !(Number(f.customReminder) > 0 && Number(f.customReminder) <= 1440)) e.reminder = "Enter 1–1440 minutes";
    if (f.repeat === "specific" && f.days.length === 0) e.repeat = "Pick at least one day";
    if (f.repeat === "custom" && !(Number(f.interval) >= 1)) e.repeat = "Interval must be 1 or more";
    if (f.status === "completed" && ((f.actualStart && !f.actualEnd) || (!f.actualStart && f.actualEnd))) e.actual = "Enter both actual times";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function save() {
    if (!validate()) return;
    setBusy(true);
    try {
      const base = {
        title: f.title.trim(),
        description: f.description || null,
        date: f.date,
        start_time: f.start,
        end_time: f.end,
        category: f.category,
        priority: f.priority,
        reminder_minutes: reminderMinutes(),
        notes: f.notes || null,
      };
      if (!task && f.repeat === "none") {
        if (await findDuplicate(base.title, base.date, base.start_time)) {
          if (!window.confirm("A task with the same title and start time already exists on this date. Create anyway?")) {
            setBusy(false);
            return;
          }
        }
      }
      if (task) {
        const statusPatch =
          f.status !== task.status
            ? { status: f.status, completed_at: f.status === "completed" ? new Date().toISOString() : null }
            : {};
        await update.mutateAsync({
          id: task.id,
          ...base,
          ...statusPatch,
          actual_start: f.status === "completed" ? f.actualStart || f.start : null,
          actual_end: f.status === "completed" ? f.actualEnd || f.end : null,
        });
        if (f.status !== task.status) {
          await supabase.from("task_completions").insert({
            user_id: task.user_id,
            task_id: task.id,
            date: f.date,
            title: base.title,
            category: base.category,
            status: f.status === "pending" ? "reverted" : f.status,
            planned_minutes: dur,
            actual_minutes: f.status === "completed" ? durationMin(f.actualStart || f.start, f.actualEnd || f.end) : 0,
          });
        }
        if (f.applyToSeries && task.recurring_id) {
          const { date: _d, ...ruleFields } = base;
          await supabase.from("recurring_tasks").update(ruleFields).eq("id", task.recurring_id);
          await regenerateRule(task.user_id, task.recurring_id);
          qc.invalidateQueries({ queryKey: ["recurring"] });
          qc.invalidateQueries({ queryKey: ["tasks"] });
        }
        toast.success("Task updated");
      } else if (f.repeat !== "none") {
        const user_id = await getUserId();
        const { error } = await supabase.from("recurring_tasks").insert({
          user_id,
          title: base.title,
          description: base.description,
          category: base.category,
          priority: base.priority,
          start_time: base.start_time,
          end_time: base.end_time,
          reminder_minutes: base.reminder_minutes,
          repeat_type: f.repeat,
          repeat_days: f.repeat === "specific" ? f.days : [],
          interval_days: f.repeat === "custom" ? Number(f.interval) : null,
          start_date: f.date,
          end_date: f.repeatEnd || null,
        });
        if (error) throw error;
        const n = await generateRecurring(user_id);
        qc.invalidateQueries({ queryKey: ["tasks"] });
        qc.invalidateQueries({ queryKey: ["recurring"] });
        toast.success(`Recurring task created · ${n} upcoming sessions scheduled`);
      } else {
        await create.mutateAsync(base);
        toast.success("Task added");
      }
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save task");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{task ? "Edit task" : "New task"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Field label="Title" error={errors.title}>
            <Input autoFocus value={f.title} onChange={(e) => set("title", e.target.value)} placeholder="DSA Practice" onKeyDown={(e) => e.key === "Enter" && save()} />
          </Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Date" error={errors.date} className="col-span-3 sm:col-span-1">
              <Input type="date" value={f.date} onChange={(e) => set("date", e.target.value)} />
            </Field>
            <Field label="Start" className="col-span-3/2 sm:col-span-1">
              <Input type="time" value={f.start} onChange={(e) => set("start", e.target.value)} />
            </Field>
            <Field label="End">
              <Input type="time" value={f.end} onChange={(e) => set("end", e.target.value)} />
            </Field>
          </div>
          {errors.time ? <p className="-mt-2 text-xs text-destructive">{errors.time}</p> : dur > 0 && <p className="-mt-2 text-xs text-muted-foreground">Duration: {fmtDuration(dur)}{f.end < f.start && " (ends next day)"}</p>}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Category">
              <Select value={f.category} onValueChange={(v) => set("category", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Priority">
              <Select value={f.priority} onValueChange={(v) => set("priority", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Reminder" error={errors.reminder}>
              <Select value={isPresetReminder ? f.reminder : "custom"} onValueChange={(v) => set("reminder", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No reminder</SelectItem>
                  {["5", "10", "15", "30"].map((m) => <SelectItem key={m} value={m}>{m} min before</SelectItem>)}
                  <SelectItem value="custom">Custom…</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            {(f.reminder === "custom" || !isPresetReminder) && (
              <Field label="Minutes before">
                <Input type="number" min={1} value={f.customReminder || (!isPresetReminder ? f.reminder : "")} onChange={(e) => setF((x) => ({ ...x, reminder: "custom", customReminder: e.target.value }))} />
              </Field>
            )}
          </div>

          {!task && (
            <div className="space-y-3 rounded-xl bg-muted/60 p-3">
              <Field label="Repeat" error={errors.repeat}>
                <Select value={f.repeat} onValueChange={(v) => set("repeat", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{REPEAT_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              {f.repeat === "specific" && (
                <div className="flex flex-wrap gap-1.5">
                  {DAYS.map((d, i) => {
                    const v = i + 1;
                    const on = f.days.includes(v);
                    return (
                      <button key={d} type="button" onClick={() => set("days", on ? f.days.filter((x) => x !== v) : [...f.days, v])}
                        className={cn("h-8 w-11 rounded-md border text-xs font-medium transition", on ? "border-primary bg-primary text-primary-foreground" : "bg-card")}>
                        {d}
                      </button>
                    );
                  })}
                </div>
              )}
              {f.repeat === "custom" && (
                <Field label="Every N days">
                  <Input type="number" min={1} value={f.interval} onChange={(e) => set("interval", e.target.value)} />
                </Field>
              )}
              {f.repeat !== "none" && (
                <Field label="Ends on (optional)">
                  <Input type="date" value={f.repeatEnd} onChange={(e) => set("repeatEnd", e.target.value)} />
                </Field>
              )}
            </div>
          )}

          {task && (
            <div className="space-y-3 rounded-xl bg-muted/60 p-3">
              <Field label="Status">
                <Select value={f.status} onValueChange={(v) => set("status", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Not done (auto: upcoming / in progress / missed)</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="skipped">Skipped</SelectItem>
                    <SelectItem value="missed">Missed</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              {f.status === "completed" && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Actual start"><Input type="time" value={f.actualStart} onChange={(e) => set("actualStart", e.target.value)} /></Field>
                    <Field label="Actual end"><Input type="time" value={f.actualEnd} onChange={(e) => set("actualEnd", e.target.value)} /></Field>
                  </div>
                  {errors.actual && <p className="text-xs text-destructive">{errors.actual}</p>}
                  {f.actualStart && f.actualEnd && dur > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Planned {dur} min · Actual {durationMin(f.actualStart, f.actualEnd)} min · Efficiency{" "}
                      <b className="text-foreground">{((durationMin(f.actualStart, f.actualEnd) / dur) * 100).toFixed(1)}%</b>
                    </p>
                  )}
                </>
              )}
              {task.recurring_id && (
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox checked={f.applyToSeries} onCheckedChange={(v) => set("applyToSeries", !!v)} />
                  Also update all future occurrences (past history is kept)
                </label>
              )}
            </div>
          )}

          <Field label="Description">
            <Textarea rows={2} value={f.description} onChange={(e) => set("description", e.target.value)} />
          </Field>
          <Field label="Notes">
            <Textarea rows={2} value={f.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Anything to remember for this session" />
          </Field>
        </div>
        <DialogFooter className="gap-2 sm:justify-between">
          {task ? (
            <Button variant="ghost" className="text-destructive" onClick={() => { if (window.confirm("Delete this task?")) { remove.mutate(task.id); onClose(); } }}>
              Delete
            </Button>
          ) : <span />}
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={save} disabled={busy}>{busy ? "Saving…" : task ? "Save changes" : "Add task"}</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, error, children, className }: { label: string; error?: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label className="text-xs">{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
