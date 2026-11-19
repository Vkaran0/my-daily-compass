import { addDays, addMonths, addWeeks, endOfMonth, format, parseISO, startOfMonth, startOfWeek } from "date-fns";

export type AnalyticsPeriod = "day" | "week" | "month";

export type AnalyticsWindow = {
  currentStart: string;
  currentEnd: string;
  previousStart: string;
  previousEnd: string;
  days: number;
};

const asDate = (value: string) => parseISO(value);
const asDay = (value: Date) => format(value, "yyyy-MM-dd");

export function getAnalyticsWindow(anchor: string, period: AnalyticsPeriod): AnalyticsWindow {
  const date = asDate(anchor);
  let currentStart = date;
  let previousStart = addDays(date, -1);

  if (period === "week") {
    currentStart = startOfWeek(date, { weekStartsOn: 1 });
    previousStart = addWeeks(currentStart, -1);
  } else if (period === "month") {
    currentStart = startOfMonth(date);
    previousStart = startOfMonth(addMonths(currentStart, -1));
  }

  const days = Math.max(1, Math.round((date.getTime() - currentStart.getTime()) / 86_400_000) + 1);
  const currentEnd = date;
  const previousEnd = period === "month"
    ? new Date(Math.min(addDays(previousStart, days - 1).getTime(), endOfMonth(previousStart).getTime()))
    : addDays(previousStart, days - 1);
  return {
    currentStart: asDay(currentStart),
    currentEnd: asDay(currentEnd),
    previousStart: asDay(previousStart),
    previousEnd: asDay(previousEnd),
    days,
  };
}

export function moveAnalyticsAnchor(anchor: string, period: AnalyticsPeriod, amount: number): string {
  const date = asDate(anchor);
  if (period === "day") return asDay(addDays(date, amount));
  if (period === "week") return asDay(addWeeks(date, amount));

  const moved = addMonths(date, amount);
  const dayOfMonth = Math.min(date.getDate(), endOfMonth(moved).getDate());
  moved.setDate(dayOfMonth);
  return asDay(moved);
}

export function buildPeriodSeries(
  currentTasks: { date: string; status: string }[],
  previousTasks: { date: string; status: string }[],
  window: AnalyticsWindow,
  period: AnalyticsPeriod,
) {
  return Array.from({ length: window.days }, (_, index) => {
    const currentDate = asDay(addDays(asDate(window.currentStart), index));
    const previousDateValue = addDays(asDate(window.previousStart), index);
    const previousDate = asDay(previousDateValue);
    const current = currentTasks.filter((task) => task.date === currentDate);
    const previous = previousDate <= window.previousEnd
      ? previousTasks.filter((task) => task.date === previousDate)
      : [];
    const currentCompleted = current.filter((task) => task.status === "completed").length;
    const previousCompleted = previous.filter((task) => task.status === "completed").length;

    return {
      label: format(asDate(currentDate), period === "month" ? "d" : "EEE"),
      rate: current.length ? Math.round((currentCompleted / current.length) * 100) : 0,
      previousRate: previous.length ? Math.round((previousCompleted / previous.length) * 100) : 0,
    };
  });
}