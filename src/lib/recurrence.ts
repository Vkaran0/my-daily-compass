import { differenceInCalendarDays, getISODay, parseISO } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import type { RecurringTask } from "./types";
import { nextDay, todayStr } from "./time";

export const GENERATE_AHEAD_DAYS = 14;

export function matchesRule(r: Pick<RecurringTask, "repeat_type" | "repeat_days" | "interval_days" | "start_date" | "end_date">, date: string) {
  if (date < r.start_date) return false;
  if (r.end_date && date > r.end_date) return false;
  const d = parseISO(date);
  const iso = getISODay(d); // 1=Mon..7=Sun
  const start = parseISO(r.start_date);
  switch (r.repeat_type) {
    case "daily":
      return true;
    case "weekdays":
      return iso <= 5;
    case "weekends":
      return iso >= 6;
    case "specific":
      return (r.repeat_days ?? []).includes(iso);
    case "weekly":
      return iso === getISODay(start);
    case "monthly":
      return d.getDate() === start.getDate();
    case "custom": {
      const n = Math.max(1, r.interval_days ?? 1);
      return differenceInCalendarDays(d, start) % n === 0;
    }
    default:
      return false;
  }
}

/** Materialise task instances for every active recurring rule up to today + N days. */
export async function generateRecurring(userId: string) {
  const { data: rules, error } = await supabase
    .from("recurring_tasks")
    .select("*")
    .eq("active", true);
  if (error || !rules?.length) return 0;
  const horizon = nextDay(todayStr(), GENERATE_AHEAD_DAYS);
  let created = 0;
  for (const r of rules) {
    let from = r.generated_until ? nextDay(r.generated_until) : r.start_date;
    const until = r.end_date && r.end_date < horizon ? r.end_date : horizon;
    if (from > until) continue;
    const rows = [];
    while (from <= until) {
      if (matchesRule(r, from)) {
        rows.push({
          user_id: userId,
          recurring_id: r.id,
          title: r.title,
          description: r.description,
          date: from,
          start_time: r.start_time,
          end_time: r.end_time,
          category: r.category,
          priority: r.priority,
          reminder_minutes: r.reminder_minutes,
          is_demo: r.is_demo,
        });
      }
      from = nextDay(from);
    }
    if (rows.length) {
      const { error: e } = await supabase
        .from("tasks")
        .upsert(rows, { onConflict: "recurring_id,date", ignoreDuplicates: true });
      if (e) continue;
      created += rows.length;
    }
    await supabase.from("recurring_tasks").update({ generated_until: until }).eq("id", r.id);
  }
  return created;
}

/** After editing a rule: drop future untouched instances and regenerate. Past history is kept. */
export async function regenerateRule(userId: string, ruleId: string) {
  const today = todayStr();
  await supabase
    .from("tasks")
    .delete()
    .eq("recurring_id", ruleId)
    .gte("date", today)
    .eq("status", "pending");
  await supabase
    .from("recurring_tasks")
    .update({ generated_until: nextDay(today, -1) })
    .eq("id", ruleId);
  await generateRecurring(userId);
}

export function describeRule(r: Pick<RecurringTask, "repeat_type" | "repeat_days" | "interval_days">) {
  const names = ["", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  switch (r.repeat_type) {
    case "daily":
      return "Every day";
    case "weekdays":
      return "Mon–Fri";
    case "weekends":
      return "Sat & Sun";
    case "specific":
      return (r.repeat_days ?? []).map((d) => names[d]).join(", ") || "No days";
    case "weekly":
      return "Weekly";
    case "monthly":
      return "Monthly";
    case "custom":
      return `Every ${r.interval_days ?? 1} days`;
    default:
      return r.repeat_type;
  }
}
