import { useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCategories, useNoteMutations, useTasks } from "@/lib/data";
import { nextDay, todayStr } from "@/lib/time";
import type { Note } from "@/lib/types";

export function NoteDialog({ open, onClose, note, defaults }: { open: boolean; onClose: () => void; note?: Note | null; defaults?: Partial<Note> }) {
  const { save } = useNoteMutations();
  const { data: cats } = useCategories();
  const [f, setF] = useState({
    title: note?.title ?? defaults?.title ?? "",
    content: note?.content ?? "",
    date: note?.date ?? defaults?.date ?? todayStr(),
    category: note?.category ?? defaults?.category ?? "none",
    task_id: note?.task_id ?? defaults?.task_id ?? "none",
  });
  const { data: tasks } = useTasks(nextDay(f.date, -3), nextDay(f.date, 3));
  const [err, setErr] = useState("");

  async function submit() {
    if (!f.title.trim()) return setErr("Title is required");
    await save.mutateAsync({
      id: note?.id,
      title: f.title.trim(),
      content: f.content,
      date: f.date,
      category: f.category === "none" ? null : f.category,
      task_id: f.task_id === "none" ? null : f.task_id,
    });
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>{note ? "Edit note" : "New note"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Title</Label>
            <Input autoFocus value={f.title} onChange={(e) => { setF({ ...f, title: e.target.value }); setErr(""); }} placeholder="DSA Revision" />
            {err && <p className="text-xs text-destructive">{err}</p>}
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Content</Label>
            <Textarea rows={6} value={f.content} onChange={(e) => setF({ ...f, content: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Date</Label>
              <Input type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Category</Label>
              <Select value={f.category} onValueChange={(v) => setF({ ...f, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {(cats ?? []).map((c) => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Related task</Label>
            <Select value={f.task_id} onValueChange={(v) => setF({ ...f, task_id: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {(tasks ?? []).map((t) => <SelectItem key={t.id} value={t.id}>{t.date} · {t.title}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={save.isPending}>Save note</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
