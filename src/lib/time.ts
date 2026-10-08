import { addDays, format, parseISO } from "date-fns";
import type { Task, DisplayStatus } from "./types";

export const toMin = (t: string | null | undefined) => {
  if (!t) return 0;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m || 0);
};

export const fromMin = (m: number) => {
  const x = ((m % 1440) + 1440) % 1440;
  return `${String(Math.floor(x / 60)).padStart(2, "0")}:${String(x % 60).padStart(2, "0")}`;
};

export const durationMin = (start: string, end: string) => {
  const d = (toMin(end) - toMin(start) + 1440) % 1440;
  return d === 0 ? 0 : d;
};

export const plannedMinutes = (t: Pick<Task, "start_time" | "end_time">) =>
  durationMin(t.start_time, t.end_time);

export const actualMinutes = (t: Pick<Task, "actual_start" | "actual_end" | "start_time" | "end_time" | "status">) => {
  if (t.status !== "completed") return 0;
  if (t.actual_start && t.actual_end) return durationMin(t.actual_start, t.actual_end);
  return plannedMinutes(t);
};

export const fmtTime = (t: string | null | undefined, fmt: "12" | "24" = "12") => {
  if (!t) return "—";
  const m = toMin(t);
  const h = Math.floor(m / 60);
  const mm = String(m % 60).padStart(2, "0");
  if (fmt === "24") return `${String(h).padStart(2, "0")}:${mm}`;
  const ap = h >= 12 ? "PM" : "AM";
  return `${h % 12 === 0 ? 12 : h % 12}:${mm} ${ap}`;
};

export const fmtDuration = (min: number) => {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
};

export const ymd = (d: Date) => format(d, "yyyy-MM-dd");
export const todayStr = () => ymd(new Date());

export const taskStart = (t: Pick<Task, "date" | "start_time">) => {
  const d = parseISO(t.date);
  const m = toMin(t.start_time);
  d.setHours(Math.floor(m / 60), m % 60, 0, 0);
  return d;
};

export const taskEnd = (t: Pick<Task, "date" | "start_time" | "end_time">) => {
  const s = taskStart(t);
  return new Date(s.getTime() + plannedMinutes(t) * 60000);
};

export function displayStatus(t: Task, now = new Date()): DisplayStatus {
  if (t.status === "completed") return "completed";
  if (t.status === "skipped") return "skipped";
  if (t.status === "missed") return "missed";
  const s = taskStart(t);
  const e = taskEnd(t);
  if (now < s) return "upcoming";
  if (now < e) return "in_progress";
  return "missed";
}

export const nextDay = (d: string, n = 1) => ymd(addDays(parseISO(d), n));

export function greeting(d = new Date()) {
  const h = d.getHours();
  if (h < 5) return "Burning the midnight oil";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export function countdown(ms: number) {
  if (ms <= 0) return "now";
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
}
