import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useHasDemo, useSettings, useSettingsMutation } from "@/lib/data";
import { applyTheme } from "@/lib/theme";
import { Card, PageHeader } from "@/components/app/bits";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — Cadence" }, { name: "description", content: "Preferences and data." }, { property: "og:title", content: "Settings — Cadence" }, { property: "og:description", content: "Preferences and data." }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { data: s } = useSettings();
  const save = useSettingsMutation();
  const { data: hasDemo } = useHasDemo();
  const qc = useQueryClient();
  const sel = "h-9 rounded-md border bg-card px-2 text-sm";

  async function toggleNotif(on: boolean) {
    if (on && "Notification" in window) {
      const p = await Notification.requestPermission();
      if (p !== "granted") { toast.error("Notifications are blocked in your browser. You'll still see in-app reminders."); return; }
    }
    save.mutate({ notifications_enabled: on });
  }
  async function rpc(fn: "clear_demo_data" | "load_demo_data" | "reset_my_data", msg: string) {
    if (fn !== "load_demo_data" && !window.confirm("Are you sure? This cannot be undone.")) return;
    const { error } = await supabase.rpc(fn);
    if (error) return toast.error(error.message);
    qc.invalidateQueries(); toast.success(msg);
  }
  async function exportData() {
    const [t, n] = await Promise.all([supabase.from("tasks").select("*"), supabase.from("notes").select("*")]);
    const url = URL.createObjectURL(new Blob([JSON.stringify({ tasks: t.data, notes: n.data }, null, 2)], { type: "application/json" }));
    const a = document.createElement("a"); a.href = url; a.download = "cadence-export.json"; a.click();
  }
  return (
    <div className="space-y-4 animate-rise">
      <PageHeader title="Settings" />
      <Card title="Preferences">
        <div className="space-y-3 text-sm">
          <Row l="Theme"><select className={sel} onChange={(e) => applyTheme(e.target.value as "light")}><option value="system">System</option><option value="light">Light</option><option value="dark">Dark</option></select></Row>
          <Row l="Browser notifications"><Switch checked={!!s?.notifications_enabled} onCheckedChange={toggleNotif} /></Row>
          <Row l="Default reminder"><select className={sel} value={s?.default_reminder ?? 15} onChange={(e) => save.mutate({ default_reminder: Number(e.target.value) })}>{[5, 10, 15, 30].map((m) => <option key={m} value={m}>{m} min</option>)}</select></Row>
          <Row l="Time format"><select className={sel} value={s?.time_format ?? "12"} onChange={(e) => save.mutate({ time_format: e.target.value })}><option value="12">12-hour</option><option value="24">24-hour</option></select></Row>
          <Row l="Week starts"><select className={sel} value={s?.week_start ?? 1} onChange={(e) => save.mutate({ week_start: Number(e.target.value) })}><option value={1}>Monday</option><option value={0}>Sunday</option></select></Row>
        </div>
      </Card>
      <Card title="Data">
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={exportData}>Export data</Button>
          {hasDemo ? <Button variant="outline" onClick={() => rpc("clear_demo_data", "Sample data removed")}>Remove sample data</Button>
            : <Button variant="outline" onClick={() => rpc("load_demo_data", "Sample data loaded")}>Load sample data</Button>}
          <Button variant="destructive" onClick={() => rpc("reset_my_data", "All data reset")}>Reset all data</Button>
        </div>
      </Card>
    </div>
  );
}
function Row({ l, children }: { l: string; children: React.ReactNode }) {
  return <div className="flex items-center justify-between gap-3"><span>{l}</span>{children}</div>;
}
