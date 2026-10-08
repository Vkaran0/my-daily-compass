import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { parseQuickAdd } from "@/lib/quickadd";
import { todayStr } from "@/lib/time";
import { useTaskDialog } from "./TaskDialog";

export function QuickAdd() {
  const [v, setV] = useState("");
  const { openNew } = useTaskDialog();
  function go(e: React.FormEvent) {
    e.preventDefault();
    const p = parseQuickAdd(v);
    openNew({
      title: p.title || v,
      date: p.date ?? todayStr(),
      start_time: p.start_time,
      end_time: p.end_time,
      category: p.category,
      priority: p.priority,
    });
    setV("");
  }
  return (
    <form onSubmit={go} className="flex gap-2">
      <div className="relative flex-1">
        <Sparkles className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
        <Input value={v} onChange={(e) => setV(e.target.value)} className="h-11 pl-9"
          placeholder="Quick add: DSA Practice — Today — 5:15 PM — 3 hours" />
      </div>
      <Button className="h-11" disabled={!v.trim()}>Add</Button>
    </form>
  );
}
