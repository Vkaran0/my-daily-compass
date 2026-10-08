import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import type { Task } from "./types";
import { actualMinutes, plannedMinutes } from "./time";

export async function getUserId() {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Not signed in");
  return data.user.id;
}

/** Page through results to avoid the 1000-row default cap. */
async function fetchTasks(from: string, to: string): Promise<Task[]> {
  const all: Task[] = [];
  const size = 1000;
  for (let i = 0; ; i += size) {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .gte("date", from)
      .lte("date", to)
      .order("date")
      .order("start_time")
      .range(i, i + size - 1);
    if (error) throw error;
    all.push(...data);
    if (data.length < size) break;
  }
  return all;
}

export const tasksQuery = (from: string, to: string) =>
  queryOptions({ queryKey: ["tasks", from, to], queryFn: () => fetchTasks(from, to) });

export const useTasks = (from: string, to: string) => useQuery(tasksQuery(from, to));

export const useSettings = () =>
  useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_settings").select("*").maybeSingle();
      if (error) throw error;
      return data;
    },
  });

export const useProfile = () =>
  useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").maybeSingle();
      if (error) throw error;
      return data;
    },
  });

export const useCategories = () =>
  useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").order("created_at");
      if (error) throw error;
      return data;
    },
  });

export const useNotes = () =>
  useQuery({
    queryKey: ["notes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notes")
        .select("*")
        .order("pinned", { ascending: false })
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

export const useRecurring = () =>
  useQuery({
    queryKey: ["recurring"],
    queryFn: async () => {
      const { data, error } = await supabase.from("recurring_tasks").select("*").order("start_time");
      if (error) throw error;
      return data;
    },
  });

export const useTemplates = () =>
  useQuery({
    queryKey: ["templates"],
    queryFn: async () => {
      const { data, error } = await supabase.from("templates").select("*").order("created_at");
      if (error) throw error;
      return data;
    },
  });

export function useHasDemo() {
  return useQuery({
    queryKey: ["has-demo"],
    queryFn: async () => {
      const { count } = await supabase
        .from("tasks")
        .select("id", { count: "exact", head: true })
        .eq("is_demo", true);
      return (count ?? 0) > 0;
    },
  });
}

export function useCategoryColor() {
  const { data } = useCategories();
  const map = new Map((data ?? []).map((c) => [c.name, c.color]));
  return (name: string) => map.get(name) ?? "#64748b";
}

const errMsg = (e: unknown) => (e instanceof Error ? e.message : "Something went wrong");

export function useTaskMutations() {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["tasks"] });
    qc.invalidateQueries({ queryKey: ["has-demo"] });
  };

  const create = useMutation({
    mutationFn: async (t: Omit<TablesInsert<"tasks">, "user_id">) => {
      const user_id = await getUserId();
      const { data, error } = await supabase.from("tasks").insert({ ...t, user_id }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: invalidate,
    onError: (e) => toast.error(errMsg(e)),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...patch }: TablesUpdate<"tasks"> & { id: string }) => {
      const { error } = await supabase.from("tasks").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: (e) => toast.error(errMsg(e)),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tasks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success("Task deleted");
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  /** Changes status and appends an immutable history record. */
  const setStatus = useMutation({
    mutationFn: async ({
      task,
      status,
      actual_start,
      actual_end,
    }: {
      task: Task;
      status: "completed" | "pending" | "skipped" | "missed";
      actual_start?: string | null;
      actual_end?: string | null;
    }) => {
      const patch: TablesUpdate<"tasks"> = {
        status,
        completed_at: status === "completed" ? new Date().toISOString() : null,
      };
      if (status === "completed") {
        patch.actual_start = actual_start ?? task.actual_start ?? task.start_time;
        patch.actual_end = actual_end ?? task.actual_end ?? task.end_time;
      }
      if (status === "pending") {
        patch.actual_start = null;
        patch.actual_end = null;
      }
      const { error } = await supabase.from("tasks").update(patch).eq("id", task.id);
      if (error) throw error;
      const merged = { ...task, ...patch } as Task;
      await supabase.from("task_completions").insert({
        user_id: task.user_id,
        task_id: task.id,
        date: task.date,
        title: task.title,
        category: task.category,
        status: status === "pending" ? "reverted" : status,
        planned_minutes: plannedMinutes(task),
        actual_minutes: actualMinutes(merged),
      });
    },
    onSuccess: (_d, v) => {
      invalidate();
      const label = { completed: "Marked complete", pending: "Marked incomplete", skipped: "Skipped", missed: "Marked missed" }[v.status];
      toast.success(`${label}: ${v.task.title}`);
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  const duplicate = useMutation({
    mutationFn: async (t: Task) => {
      const { id: _id, created_at: _c, updated_at: _u, recurring_id: _r, ...rest } = t;
      const { error } = await supabase.from("tasks").insert({
        ...rest,
        title: `${t.title} (copy)`,
        status: "pending",
        actual_start: null,
        actual_end: null,
        completed_at: null,
        is_demo: false,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success("Task duplicated");
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  return { create, update, remove, setStatus, duplicate };
}

export function useNoteMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["notes"] });
  const save = useMutation({
    mutationFn: async (n: Omit<TablesInsert<"notes">, "user_id"> & { id?: string }) => {
      if (n.id) {
        const { id, ...patch } = n;
        const { error } = await supabase.from("notes").update(patch).eq("id", id);
        if (error) throw error;
      } else {
        const user_id = await getUserId();
        const { error } = await supabase.from("notes").insert({ ...n, user_id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      invalidate();
      toast.success("Note saved");
    },
    onError: (e) => toast.error(errMsg(e)),
  });
  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("notes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success("Note deleted");
    },
    onError: (e) => toast.error(errMsg(e)),
  });
  const togglePin = useMutation({
    mutationFn: async ({ id, pinned }: { id: string; pinned: boolean }) => {
      const { error } = await supabase.from("notes").update({ pinned }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
  return { save, remove, togglePin };
}

export function useSettingsMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: TablesUpdate<"user_settings">) => {
      const user_id = await getUserId();
      const { error } = await supabase.from("user_settings").upsert({ user_id, ...patch });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["settings"] }),
    onError: (e) => toast.error(errMsg(e)),
  });
}

/** Detect a likely duplicate (same title, date and start time). */
export async function findDuplicate(title: string, date: string, start: string, excludeId?: string) {
  let q = supabase
    .from("tasks")
    .select("id")
    .eq("date", date)
    .eq("start_time", start)
    .ilike("title", title.trim());
  if (excludeId) q = q.neq("id", excludeId);
  const { data } = await q.limit(1);
  return (data?.length ?? 0) > 0;
}
