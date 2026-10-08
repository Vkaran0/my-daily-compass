import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { NotebookPen, Pin, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNoteMutations, useNotes } from "@/lib/data";
import type { Note } from "@/lib/types";
import { EmptyState, LoadingBlock, PageHeader } from "@/components/app/bits";
import { NoteDialog } from "@/components/app/NoteDialog";

export const Route = createFileRoute("/_authenticated/notes")({
  head: () => ({ meta: [{ title: "Notes — Cadence" }, { name: "description", content: "Daily and task notes." }, { property: "og:title", content: "Notes — Cadence" }, { property: "og:description", content: "Daily and task notes." }] }),
  component: Notes,
});

function Notes() {
  const { data, isLoading } = useNotes();
  const { remove, togglePin } = useNoteMutations();
  const [q, setQ] = useState("");
  const [edit, setEdit] = useState<{ open: boolean; note?: Note; k: number }>({ open: false, k: 0 });
  const list = (data ?? []).filter((n) => (n.title + n.content).toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="space-y-4 animate-rise">
      <PageHeader title="Notes" actions={<Button onClick={() => setEdit((e) => ({ open: true, k: e.k + 1 }))}>New note</Button>} />
      <Input placeholder="Search notes…" value={q} onChange={(e) => setQ(e.target.value)} />
      {isLoading ? <LoadingBlock /> : list.length ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((n) => (
            <div key={n.id} className="rounded-xl border bg-card p-4">
              <div className="flex items-start justify-between gap-2">
                <button className="text-left font-semibold" onClick={() => setEdit((e) => ({ open: true, note: n, k: e.k + 1 }))}>{n.title}</button>
                <div className="flex">
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => togglePin.mutate({ id: n.id, pinned: !n.pinned })}><Pin className={n.pinned ? "h-4 w-4 fill-current text-primary" : "h-4 w-4"} /></Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => window.confirm("Delete note?") && remove.mutate(n.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{n.content}</p>
              <p className="mt-3 text-xs text-muted-foreground">{n.date}{n.category && ` · ${n.category}`}</p>
            </div>
          ))}
        </div>
      ) : <EmptyState icon={NotebookPen} title="No notes yet. Create your first note." />}
      {edit.open && <NoteDialog key={edit.k} open note={edit.note} onClose={() => setEdit((e) => ({ ...e, open: false }))} />}
    </div>
  );
}
