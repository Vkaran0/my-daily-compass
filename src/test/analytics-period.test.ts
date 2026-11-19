import { describe, expect, it } from "vitest";
import { buildPeriodSeries, getAnalyticsWindow, moveAnalyticsAnchor } from "@/lib/analytics-period";

describe("analytics period windows", () => {
  it("compares a daily view with the previous day", () => {
    expect(getAnalyticsWindow("2026-11-18", "day")).toEqual({
      currentStart: "2026-11-18",
      currentEnd: "2026-11-18",
      previousStart: "2026-11-17",
      previousEnd: "2026-11-17",
      days: 1,
    });
  });

  it("uses Monday-start weeks and matches the same elapsed weekdays", () => {
    expect(getAnalyticsWindow("2026-11-18", "week")).toEqual({
      currentStart: "2026-11-16",
      currentEnd: "2026-11-18",
      previousStart: "2026-11-09",
      previousEnd: "2026-11-11",
      days: 3,
    });
  });

  it("compares matching elapsed days in monthly views", () => {
    expect(getAnalyticsWindow("2026-03-05", "month")).toEqual({
      currentStart: "2026-03-01",
      currentEnd: "2026-03-05",
      previousStart: "2026-02-01",
      previousEnd: "2026-02-05",
      days: 5,
    });
  });

  it("keeps the selected day within shorter months", () => {
    expect(moveAnalyticsAnchor("2026-03-31", "month", -1)).toBe("2026-02-28");
  });

  it("does not extend a 31-day monthly comparison into the following month", () => {
    expect(getAnalyticsWindow("2026-03-31", "month")).toMatchObject({
      currentStart: "2026-03-01",
      currentEnd: "2026-03-31",
      previousStart: "2026-02-01",
      previousEnd: "2026-02-28",
      days: 31,
    });
  });

  it("builds comparable completion rates for each elapsed day", () => {
    const window = getAnalyticsWindow("2026-11-18", "week");
    const points = buildPeriodSeries(
      [
        { date: "2026-11-16", status: "completed" },
        { date: "2026-11-16", status: "missed" },
        { date: "2026-11-18", status: "completed" },
      ],
      [{ date: "2026-11-09", status: "completed" }],
      window,
      "week",
    );

    expect(points).toEqual([
      { label: "Mon", rate: 50, previousRate: 100 },
      { label: "Tue", rate: 0, previousRate: 0 },
      { label: "Wed", rate: 100, previousRate: 0 },
    ]);
  });
});