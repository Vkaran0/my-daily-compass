import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSettings, useTaskMutations, useTasks } from "@/lib/data";
import { displayStatus, nextDay, plannedMinutes, taskEnd, taskStart, todayStr } from "@/lib/time";
import type { Task } from "@/lib/types";
import { useTaskDialog } from "./TaskDialog";

const WINDOW_MS = 10 * 60 * 1000; // fire if we're within 10 min after the trigger time

type Kind = "before" | "start" | "end_soon" | "missed";

function triggers(t: Task): { kind: Kind; at: number; msg: string }[] {
  const s = taskStart(t).getTime();
  const e = taskEnd(t).getTime();
  const out: { kind: Kind; at: number; msg: string }[] = [];
  if (t.reminder_minutes != null && t.reminder_minutes > 0)
    out.push({ kind: "before", at: s - t.reminder_minutes * 60000, msg: `${t.title} starts in ${t.reminder_minutes} minutes.` });
  out.push({ kind: "start", at: s, msg: `Your ${t.title} session has started.` });
  if (plannedMinutes(t) > 30) out.push({ kind: "end_soon", at: e - 15 * 60000, msg: `Your ${t.title} session ends in 15 minutes.` });
  out.push({ kind: "missed", at: e + 60000, msg: `You missed your ${t.title} task. What would you like to do?` });
  return out;
}

/** Polls today's tasks and fires in-app + browser notifications. Dedupes via the notifications table. */
export function ReminderEngine() {
  const today = todayStr();
  const { data: tasks } = useTasks(nextDay(today, -1), today);
  const { data: settings } = useSettings();
  const { setStatus } = useTaskMutations();
  const { openTask } = useTaskDialog();
  const fired = useRef(new Set<string>());
  const ref = useRef({ tasks, settings });
  ref.current = { tasks, settings };

  useEffect(() => {
    async function tick() {
      const { tasks, settings } = ref.current;
      if (!tasks) return;
      const now = Date.now();
      for (const t of tasks) {
        if (t.status !== "pending") continue;
        for (const tr of triggers(t)) {
          const key = `${t.id}:${tr.kind}`;
          if (fired.current.has(key)) continue;
          if (now < tr.at || now > tr.at + WINDOW_MS) continue;
          if (tr.kind === "missed" && displayStatus(t) !== "missed") continue;
          fired.current.add(key);
          const { error } = await supabase
            .from("notifications")
            .insert({ user_id: t.user_id, task_id: t.id, kind: tr.kind, message: tr.msg });
          if (error) continue; // already delivered (unique task_id+kind) or offline
          if (tr.kind === "missed") {
            toast.warning(tr.msg, {
              duration: 30000,
              action: { label: "Complete", onClick: () => setStatus.mutate({ task: t, status: "completed" }) },
              cancel: { label: "Skip", onClick: () => setStatus.mutate({ task: t, status: "skipped" }) },
              description: (
                <button className="underline" onClick={() => openTask(t)}>Reschedule…</button>
              ),
            });
          } else toast.info(tr.msg);
          if (settings?.notifications_enabled && "Notification" in window && Notification.permission === "granted") {
            try {
              const n = new Notification("Cadence", { body: tr.msg, tag: key });
              n.onclick = () => { window.focus(); openTask(t); };
            } catch {
              /* some browsers block constructor notifications */
            }
          }
        }
      }
    }
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, [setStatus, openTask]);

  return null;
}
