import type { Tables } from "@/integrations/supabase/types";

export type Task = Tables<"tasks">;
export type Note = Tables<"notes">;
export type RecurringTask = Tables<"recurring_tasks">;
export type Template = Tables<"templates">;
export type Category = Tables<"categories">;
export type Settings = Tables<"user_settings">;
export type Profile = Tables<"profiles">;

export type DisplayStatus = "upcoming" | "in_progress" | "completed" | "missed" | "skipped";
export type Priority = "low" | "medium" | "high";

export const DEFAULT_CATEGORIES = [
  "DSA",
  "Academics",
  "Web Development",
  "Projects",
  "Internship",
  "AI / AI Agents",
  "Exercise",
  "Personal",
  "Other",
];

export const STATUS_LABEL: Record<DisplayStatus, string> = {
  upcoming: "Upcoming",
  in_progress: "In Progress",
  completed: "Completed",
  missed: "Missed",
  skipped: "Skipped",
};

export const REPEAT_OPTIONS = [
  { value: "none", label: "Does not repeat" },
  { value: "daily", label: "Every day" },
  { value: "weekdays", label: "Weekdays (Mon–Fri)" },
  { value: "weekends", label: "Weekends" },
  { value: "specific", label: "Specific days" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "custom", label: "Every N days" },
] as const;

export type TemplateItem = {
  title: string;
  category: string;
  start: string;
  end: string;
  priority: Priority;
};
