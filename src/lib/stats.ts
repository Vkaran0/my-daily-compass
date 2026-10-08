import { format, getDay, parseISO } from "date-fns";
import type { Task } from "./types";
import { actualMinutes, displayStatus, nextDay, plannedMinutes, todayStr, toMin } from "./time";

export type DayStats = {
  planned: number;
  completed: number;
  missed: number;
  skipped: number;
  pending: number;
  plannedMin: number;
  completedPlannedMin: number;
  actualMin: number;
  rate: number; // 0-100, completed / planned
  timeRate: number; // completed planned minutes / planned minutes
};

export function computeStats(tasks: Task[], now = new Date()): DayStats {
  let completed = 0,
    missed = 0,
    skipped = 0,
    pending = 0,
    plannedMin = 0,
    completedPlannedMin = 0,
    actualMin = 0;
  for (const t of tasks) {
    const s = displayStatus(t, now);
    const p = plannedMinutes(t);
    plannedMin += p;
    if (s === "completed") {
      completed++;
      completedPlannedMin += p;
      actualMin += actualMinutes(t);
    } else if (s === "missed") missed++;
    else if (s === "skipped") skipped++;
    else pending++;
  }
  const planned = tasks.length;
  return {
    planned,
    completed,
    missed,
    skipped,
    pending,
    plannedMin,
    completedPlannedMin,
    actualMin,
    rate: planned ? (completed / planned) * 100 : 0,
    timeRate: plannedMin ? (completedPlannedMin / plannedMin) * 100 : 0,
  };
}

export function groupByDate(tasks: Task[]) {
  const m = new Map<string, Task[]>();
  for (const t of tasks) {
    const arr = m.get(t.date) ?? [];
    arr.push(t);
    m.set(t.date, arr);
  }
  return m;
}

export function categoryStats(tasks: Task[]) {
  const m = new Map<string, Task[]>();
  for (const t of tasks) {
    const arr = m.get(t.category) ?? [];
    arr.push(t);
    m.set(t.category, arr);
  }
  return [...m.entries()]
    .map(([category, ts]) => ({ category, ...computeStats(ts) }))
    .sort((a, b) => b.rate - a.rate);
}

export const STREAK_THRESHOLD = 70;

/** A productive day = at least one planned task and >= 70% completion. */
export function streaks(tasks: Task[]) {
  const byDate = groupByDate(tasks);
  const dates = [...byDate.keys()].sort();
  const today = todayStr();
  const good = new Set(
    dates.filter((d) => computeStats(byDate.get(d)!).rate >= STREAK_THRESHOLD && d <= today),
  );
  // best
  let best = 0,
    run = 0,
    prev: string | null = null;
  for (const d of dates) {
    if (d > today) break;
    if (good.has(d)) {
      run = prev && nextDay(prev) === d && good.has(prev) ? run + 1 : 1;
      best = Math.max(best, run);
    } else run = 0;
    prev = d;
  }
  // current: count back from today (today counts if already good, else start from yesterday)
  let cur = 0;
  let d = good.has(today) ? today : nextDay(today, -1);
  while (good.has(d)) {
    cur++;
    d = nextDay(d, -1);
  }
  return { current: cur, best, goodDays: good };
}

export function dayLabel(d: string) {
  return format(parseISO(d), "EEE");
}

/** Insights generated only from real data. Returns [] when data is insufficient. */
export function weeklyInsights(thisWeek: Task[], lastWeek: Task[]): string[] {
  const out: string[] = [];
  const now = new Date();
  const past = thisWeek.filter((t) => displayStatus(t, now) !== "upcoming" && displayStatus(t, now) !== "in_progress");
  if (past.length < 5) return out;
  const s = computeStats(past);
  out.push(`You completed ${Math.round(s.rate)}% of your planned tasks this week.`);

  const byDate = groupByDate(past);
  const days = [...byDate.entries()].map(([d, ts]) => ({ d, r: computeStats(ts).rate }));
  if (days.length >= 2) {
    const best = days.reduce((a, b) => (b.r > a.r ? b : a));
    out.push(`Your most productive day was ${format(parseISO(best.d), "EEEE")} with ${Math.round(best.r)}% completion.`);
  }

  const late = past.filter((t) => toMin(t.start_time) >= 23 * 60);
  if (late.length >= 3) {
    const lateMiss = late.filter((t) => displayStatus(t, now) === "missed").length / late.length;
    if (lateMiss >= 0.4)
      out.push(`You frequently miss tasks scheduled after 11 PM (${Math.round(lateMiss * 100)}% missed).`);
  }

  const lastPast = lastWeek.filter((t) => displayStatus(t, now) !== "upcoming");
  if (lastPast.length >= 5) {
    const thisCat = categoryStats(past);
    const lastCat = new Map(categoryStats(lastPast).map((c) => [c.category, c]));
    let bestDelta: { c: string; d: number } | null = null;
    for (const c of thisCat) {
      const l = lastCat.get(c.category);
      if (!l || c.planned < 2 || l.planned < 2) continue;
      const d = c.rate - l.rate;
      if (!bestDelta || Math.abs(d) > Math.abs(bestDelta.d)) bestDelta = { c: c.category, d };
    }
    if (bestDelta && Math.abs(bestDelta.d) >= 5)
      out.push(
        `Your ${bestDelta.c} completion rate ${bestDelta.d > 0 ? "increased" : "dropped"} by ${Math.round(Math.abs(bestDelta.d))}% compared with last week.`,
      );
  }
  return out;
}

export function dailyInsight(tasks: Task[]): string | null {
  const now = new Date();
  const done = tasks.filter((t) => ["completed", "missed", "skipped"].includes(displayStatus(t, now)));
  if (done.length < 2) return null;
  const cats = categoryStats(done);
  const top = cats[0];
  const missed = done.filter((t) => displayStatus(t, now) === "missed");
  let msg = `You completed ${Math.round(top.rate)}% of your ${top.category} tasks today`;
  if (missed.length) {
    const cat = missed[0].category;
    msg += `, but missed ${missed.length === 1 ? "one" : missed.length} ${missed.length === 1 ? `${cat} session` : "sessions"}.`;
  } else msg += " and missed nothing so far. 🎯";
  return msg;
}

export const WEEKDAY = (d: string) => getDay(parseISO(d));
