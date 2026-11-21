import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, type ReactNode } from "react";
import { BarChart3, CalendarDays, LayoutDashboard, ListTodo, LogOut, Moon, NotebookPen, Plus, Settings, Sun } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useHasDemo, useProfile } from "@/lib/data";
import { generateRecurring } from "@/lib/recurrence";
import { useAppTheme } from "@/lib/theme";
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
  const [theme, setTheme] = useAppTheme();

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

  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");
  const themeAction = theme === "dark" ? "Switch to light mode" : "Switch to dark mode";
  const ThemeIcon = theme === "dark" ? Sun : Moon;

  return (
    <div className="min-h-screen bg-background md:pl-64">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-sidebar-border bg-sidebar px-4 py-5 md:flex">
        <div className="px-2"><Logo /></div>
        <Button className="mt-8 h-11 w-full justify-start gap-2 shadow-sm" onClick={() => openNew()}>
          <Plus className="h-4 w-4" /> New task
        </Button>
        <p className="mb-2 mt-8 px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Workspace</p>
        <nav className="flex flex-1 flex-col gap-1" aria-label="Main navigation">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium text-sidebar-foreground/75 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
              activeProps={{ className: "!bg-sidebar-accent !text-sidebar-accent-foreground" }}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span className="min-w-0 truncate">{item.label}</span>
            </Link>
          ))}
        </nav>
        {hasDemo && (
          <div className="mb-4 rounded-lg border border-highlight/40 bg-highlight/20 p-3 text-xs leading-5 text-highlight-foreground">
            Sample data is on. <Link to="/settings" className="font-semibold underline">Manage it</Link>
          </div>
        )}
        <div className="border-t border-sidebar-border pt-4">
          <div className="flex min-w-0 items-center gap-3 px-2">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-sidebar-accent text-sm font-semibold text-sidebar-accent-foreground">
              {(profile?.display_name ?? "Y").slice(0, 1).toUpperCase()}
            </div>
            <span className="min-w-0 flex-1 truncate text-sm font-medium">{profile?.display_name ?? "Your workspace"}</span>
            <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label={themeAction} title={themeAction}>
              <ThemeIcon className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={signOut} aria-label="Sign out" title="Sign out">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>

      <header className="sticky top-0 z-20 grid grid-cols-[minmax(0,1fr)_auto] items-center border-b bg-background/90 px-4 py-3 backdrop-blur md:hidden">
        <div className="min-w-0"><Logo /></div>
        <div className="flex shrink-0 items-center gap-1">
          <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label={themeAction} title={themeAction}>
            <ThemeIcon className="h-4 w-4" />
          </Button>
          <Button asChild variant="ghost" size="icon" aria-label="Settings" title="Settings">
            <Link to="/settings"><Settings className="h-4 w-4" /></Link>
          </Button>
          <Button variant="ghost" size="icon" onClick={signOut} aria-label="Sign out" title="Sign out">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {hasDemo && (
        <div className="border-b bg-highlight/30 px-4 py-2 text-center text-xs text-highlight-foreground md:hidden">
          Sample data is on · <Link to="/settings" className="font-semibold underline">Manage</Link>
        </div>
      )}

      <main className="mx-auto max-w-7xl px-4 pb-32 pt-5 sm:px-6 md:px-8 md:pb-12 md:pt-8">{children}</main>

      <Button
        onClick={() => openNew()}
        aria-label="Add task"
        title="Add task"
        size="icon"
        className="fixed bottom-[5.25rem] right-4 z-30 h-12 w-12 rounded-full shadow-lg md:hidden"
      >
        <Plus className="h-5 w-5" />
      </Button>

      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden" aria-label="Mobile navigation">
        {NAV.filter((item) => item.to !== "/settings").map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="flex min-w-0 flex-col items-center justify-center gap-1 py-2 text-[10px] font-medium text-muted-foreground transition-colors"
            activeProps={{ className: "!text-primary" }}
          >
            <item.icon className="h-5 w-5 shrink-0" />
            <span className="max-w-full truncate">{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}