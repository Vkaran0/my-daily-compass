import { addDays, format, nextDay as dfNextDay, parse, isValid, type Day } from "date-fns";
import { DEFAULT_CATEGORIES, type Priority } from "./types";
import { fromMin, ymd } from "./time";

export type QuickParse = {
  title: string;
  date?: string;
  start_time?: string;
  end_time?: string;
  category?: string;
  priority?: Priority;
};

const DAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

function parseTime(s: string): number | null {
  const m = s.trim().toLowerCase().match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/);
  if (!m) return null;
  let h = Number(m[1]);
  const min = Number(m[2] ?? 0);
  if (h > 23 || min > 59) return null;
  if (!m[3] && !m[2]) return null; // bare number is ambiguous
  if (m[3] === "pm" && h < 12) h += 12;
  if (m[3] === "am" && h === 12) h = 0;
  return h * 60 + min;
}

function parseDuration(s: string): number | null {
  const m = s.trim().toLowerCase().match(/^(\d+(?:\.\d+)?)\s*(h|hr|hrs|hour|hours|m|min|mins|minute|minutes)$/);
  if (!m) return null;
  const n = Number(m[1]);
  return m[2].startsWith("h") ? Math.round(n * 60) : Math.round(n);
}

function parseDate(s: string): string | null {
  const t = s.trim().toLowerCase();
  const now = new Date();
  if (t === "today") return ymd(now);
  if (t === "tomorrow" || t === "tmrw") return ymd(addDays(now, 1));
  const di = DAYS.findIndex((d) => d.startsWith(t) && t.length >= 3);
  if (di >= 0) return ymd(dfNextDay(now, di as Day));
  for (const f of ["yyyy-MM-dd", "MMM d", "d MMM", "MMMM d", "d/M", "dd/MM/yyyy"]) {
    const d = parse(s.trim(), f, now);
    if (isValid(d)) return format(d, "yyyy-MM-dd");
  }
  return null;
}

/** Parse "DSA Practice — Today — 5:15 PM — 3 hours" style input. */
export function parseQuickAdd(input: string): QuickParse {
  const parts = input
    .split(/\s+[—–\-|]\s+|,\s*/)
    .map((p) => p.trim())
    .filter(Boolean);
  const out: QuickParse = { title: "" };
  let start: number | null = null;
  let end: number | null = null;
  let dur: number | null = null;
  const titleParts: string[] = [];
  for (const p of parts) {
    const range = p.match(/^(.+?)\s+(?:to|until)\s+(.+)$/i);
    if (range && parseTime(range[1]) != null && parseTime(range[2]) != null) {
      start = parseTime(range[1]);
      end = parseTime(range[2]);
      continue;
    }
    const t = parseTime(p);
    if (t != null) {
      if (start == null) start = t;
      else end = t;
      continue;
    }
    const d = parseDuration(p);
    if (d != null) {
      dur = d;
      continue;
    }
    const dt = parseDate(p);
    if (dt) {
      out.date = dt;
      continue;
    }
    const lower = p.toLowerCase();
    if (["high", "medium", "low"].includes(lower.replace(" priority", ""))) {
      out.priority = lower.replace(" priority", "") as Priority;
      continue;
    }
    const cat = DEFAULT_CATEGORIES.find((c) => c.toLowerCase() === lower);
    if (cat) {
      out.category = cat;
      continue;
    }
    titleParts.push(p);
  }
  out.title = titleParts.join(" — ");
  if (!out.category) {
    const lt = out.title.toLowerCase();
    const guess: [RegExp, string][] = [
      [/\bdsa\b|leetcode|algorithm/, "DSA"],
      [/gym|run|exercise|workout|yoga/, "Exercise"],
      [/web|react|frontend|backend/, "Web Development"],
      [/intern/, "Internship"],
      [/\bai\b|agent|llm/, "AI / AI Agents"],
      [/project/, "Projects"],
      [/study|class|lecture|exam|college|revision|academic/, "Academics"],
    ];
    out.category = guess.find(([r]) => r.test(lt))?.[1];
  }
  if (start != null) {
    out.start_time = fromMin(start);
    if (end == null) end = start + (dur ?? 60);
    out.end_time = fromMin(end);
  }
  return out;
}
