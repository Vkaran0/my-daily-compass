import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, type ReactNode } from "react";
import { BarChart3, CalendarDays, LayoutDashboard, ListTodo, LogOut, Moon, NotebookPen, Plus, Settings, Sun } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useHasDemo, useProfile } from "@/lib/data";
import { generateRecurring } from "@/lib/recurrence";
import { applyTheme, getTheme } from "@/lib/theme";
import { Logo } from "./Logo";
import { TaskDialogProvider, useTaskDialog } from "./TaskDialog";
import { ReminderEngine } from "./ReminderEngine";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/tasks", label: "Tasks", icon: ListTodo },
  { to: "/calendar", label: "Calendar", icon: CalendarDays },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/notes", label: "Notes", icon: NotebookPen },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <TaskDialogProvider>
      <Shell>{children}</Shell>
      <ReminderEngine />
    </TaskDialogProvider>
  );
}

function Shell({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { openNew } = useTaskDialog();
  const { data: profile } = useProfile();
  const { data: hasDemo } = useHasDemo();

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const n = await generateRecurring(data.user.id);
      if (n) qc.invalidateQueries({ queryKey: ["tasks"] });
    });
  }, [qc]);

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const toggleTheme = () => {
    const isDark = document.documentElement.classList.contains("dark");
    applyTheme(isDark ? "light" : "dark");
  };
  void getTheme;

  return (
    <div className="min-h-screen bg-background md:pl-60">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r bg-sidebar p-4 md:flex">
        <div className="px-2 py-1"><Logo /></div>
        <Button className="mt-6 w-full justify-start gap-2" onClick={() => openNew()}>
          <Plus className="h-4 w-4" /> Add Task
        </Button>
        <nav className="mt-6 flex flex-1 flex-col gap-1">
          {NAV.map((n) => (
            <Link key={n.to} to={n.to}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/75 transition hover:bg-sidebar-accent hover:text-sidebar-foreground"
              activeProps={{ className: "!bg-sidebar-accent !text-sidebar-accent-foreground" }}>
              <n.icon className="h-4 w-4" /> {n.label}
            </Link>
          ))}
        </nav>
        <div className="space-y-2 border-t pt-4">
          <div className="truncate px-2 text-sm font-medium">{profile?.display_name ?? "You"}</div>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={toggleTheme} aria-label="Toggle theme">
              <Sun className="h-4 w-4 dark:hidden" /><Moon className="hidden h-4 w-4 dark:block" />
            </Button>
            <Button variant="ghost" size="sm" onClick={signOut} className="gap-2"><LogOut className="h-4 w-4" />Sign out</Button>
          </div>
        </div>
      </aside>

      <header className="sticky top-0 z-20 flex items-center justify-between border-b bg-background/85 px-4 py-3 backdrop-blur md:hidden">
        <Logo />
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
            <Sun className="h-4 w-4 dark:hidden" /><Moon className="hidden h-4 w-4 dark:block" />
          </Button>
          <Button variant="ghost" size="icon" onClick={signOut} aria-label="Sign out"><LogOut className="h-4 w-4" /></Button>
        </div>
      </header>

      {hasDemo && (
        <div className="border-b bg-highlight/40 px-4 py-2 text-center text-xs text-highlight-foreground">
          You’re viewing <b>sample data</b> so the charts aren’t empty.{" "}
          <Link to="/settings" className="font-semibold underline">Remove it in Settings</Link>
        </div>
      )}

      <main className="mx-auto max-w-6xl px-4 pb-28 pt-6 md:px-8 md:pb-12 md:pt-8">{children}</main>

      <button onClick={() => openNew()} aria-label="Add task"
        className="fixed bottom-20 right-4 z-30 grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition active:scale-95 md:hidden">
        <Plus className="h-6 w-6" />
      </button>

      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-6 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        {NAV.map((n) => (
          <Link key={n.to} to={n.to} className="flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium text-muted-foreground"
            activeProps={{ className: "!text-primary" }}>
            <n.icon className="h-5 w-5" />
            {n.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
