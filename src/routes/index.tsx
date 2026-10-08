import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { CalendarDays, ChartLine, Flame, ListChecks } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/app/Logo";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Cadence — Your daily schedule, tracked honestly" },
      { name: "description", content: "A productivity tracker for students with strict routines: tasks, reminders, notes and analytics." },
      { property: "og:title", content: "Cadence — Your daily schedule, tracked honestly" },
      { property: "og:description", content: "Tasks, recurring routines, reminders and daily-to-yearly analytics in one place." },
    ],
  }),
  component: Landing,
});

function Landing() {
  const navigate = useNavigate();
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  const features = [
    { icon: ListChecks, t: "Fast task capture", d: "Type “DSA Practice — Today — 5:15 PM — 3 hours” and you’re done." },
    { icon: CalendarDays, t: "Routines that repeat", d: "Weekday blocks, templates and a calendar that fills itself." },
    { icon: ChartLine, t: "Honest analytics", d: "Task and time completion, planned vs actual, day to year." },
    { icon: Flame, t: "Streaks & reminders", d: "Browser reminders before, during and after every session." },
  ];
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <Logo />
        <Button asChild variant="ghost">
          <Link to="/auth">Sign in</Link>
        </Button>
      </header>
      <main className="mx-auto max-w-6xl px-5 pb-20 pt-10 md:pt-20">
        <div className="max-w-3xl animate-rise">
          <span className="inline-flex rounded-full bg-highlight px-3 py-1 text-xs font-semibold text-highlight-foreground">
            Built for strict daily schedules
          </span>
          <h1 className="mt-5 text-4xl font-bold leading-[1.05] md:text-6xl">
            Plan the day. Live the plan.
            <span className="block text-primary">See exactly how it went.</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted-foreground">
            Cadence tracks every block of your routine — from 5:30 AM workouts to late-night DSA — and tells you
            where your time really goes.
          </p>
          <div className="mt-8 flex gap-3">
            <Button asChild size="lg">
              <Link to="/auth">Get started free</Link>
            </Button>
          </div>
        </div>
        <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div key={f.t} className="rounded-2xl border bg-card p-5">
              <f.icon className="h-5 w-5 text-primary" />
              <h3 className="mt-4 font-semibold">{f.t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.d}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
