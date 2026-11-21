import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { format, parseISO } from "date-fns";
import { CalendarDays, FileText, Pin, Search, StickyNote, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCategories, useNoteMutations, useNotes } from "@/lib/data";
import type { Note } from "@/lib/types";
import { EmptyState, LoadingBlock, PageHeader } from "@/components/app/bits";
import { NoteDialog } from "@/components/app/NoteDialog";

export const Route = createFileRoute("/_authenticated/notes")({
  head: () => ({ meta: [{ title: "Study Notes — Cadence" }, { name: "description", content: "Keep searchable, pinned notes connected to your study schedule and tasks." }, { property: "og:title", content: "Study Notes — Cadence" }, { property: "og:description", content: "Keep searchable, pinned notes connected to your study schedule and tasks." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: Notes,
});

function Notes() {
  const { data, isLoading, isError } = useNotes();
  const { data: categories } = useCategories();
  const { remove, togglePin } = useNoteMutations();
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("all");
  const [pinnedOnly, setPinnedOnly] = useState(false);
  const [edit, setEdit] = useState<{ open: boolean; note?: Note; k: number }>({ open: false, k: 0 });
  const notes = data ?? [];
  const list = notes.filter((note) => {
    const matchesSearch = `${note.title} ${note.content} ${note.category ?? ""}`.toLowerCase().includes(q.trim().toLowerCase());
    const matchesCategory = category === "all" || note.category === category;
    return matchesSearch && matchesCategory && (!pinnedOnly || note.pinned);
  });

  return (
    <div className="space-y-6 animate-rise">
      <PageHeader title="Notes" sub="Your study thoughts, organized and easy to find." actions={<Button onClick={() => setEdit((entry) => ({ open: true, k: entry.k + 1 }))}><FileText className="mr-2 h-4 w-4" />New note</Button>} />

      <section aria-label="Find notes" className="flex flex-col gap-3 border-b pb-5 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input aria-label="Search notes" placeholder="Search titles, content, or categories" value={q} onChange={(event) => setQ(event.target.value)} className="pl-9" />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger aria-label="Filter notes by category" className="w-full sm:w-48"><SelectValue placeholder="All categories" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {(categories ?? []).map((item) => <SelectItem key={item.id} value={item.name}>{item.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="inline-flex w-fit items-center gap-1 rounded-lg border bg-card p-1" role="group" aria-label="Filter pinned notes">
          <Button size="sm" variant={!pinnedOnly ? "default" : "ghost"} aria-pressed={!pinnedOnly} onClick={() => setPinnedOnly(false)}>All notes</Button>
          <Button size="sm" variant={pinnedOnly ? "default" : "ghost"} aria-pressed={pinnedOnly} onClick={() => setPinnedOnly(true)}><Pin className="mr-1.5 h-3.5 w-3.5" />Pinned</Button>
        </div>
      </section>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{list.length} {list.length === 1 ? "note" : "notes"}</span>
        <span>{notes.filter((note) => note.pinned).length} pinned</span>
      </div>

      {isError ? <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">Your notes could not be loaded. Please try again shortly.</div>
        : isLoading ? <LoadingBlock h={220} /> : list.length ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((note) => (
            <article key={note.id} className="group flex min-h-52 flex-col border-b pb-4 sm:border-b-0 sm:border-l sm:pl-4">
              <div className="flex items-start justify-between gap-3">
                <button className="min-w-0 text-left" onClick={() => setEdit((entry) => ({ open: true, note, k: entry.k + 1 }))}>
                  <span className="block break-words font-display text-base font-semibold transition-colors group-hover:text-primary">{note.title}</span>
                  {note.pinned && <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-primary"><Pin className="h-3 w-3 fill-current" />Pinned</span>}
                </button>
                <div className="flex shrink-0">
                  <Button size="icon" variant="ghost" className="h-8 w-8" aria-label={note.pinned ? "Unpin note" : "Pin note"} title={note.pinned ? "Unpin note" : "Pin note"} onClick={() => togglePin.mutate({ id: note.id, pinned: !note.pinned })}><Pin className={note.pinned ? "h-4 w-4 fill-current text-primary" : "h-4 w-4"} /></Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-destructive" aria-label="Delete note" title="Delete note" onClick={() => window.confirm("Delete this note?") && remove.mutate(note.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
              <button className="mt-3 flex-1 text-left" onClick={() => setEdit((entry) => ({ open: true, note, k: entry.k + 1 }))}>
                <span className="line-clamp-5 whitespace-pre-wrap break-words text-sm leading-6 text-muted-foreground">{note.content || "No additional details."}</span>
              </button>
              <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 border-t pt-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" />{format(parseISO(note.date), "MMM d, yyyy")}</span>
                {note.category && <span className="inline-flex items-center gap-1.5"><StickyNote className="h-3.5 w-3.5" />{note.category}</span>}
              </div>
            </article>
          ))}
        </div>
      ) : <EmptyState icon={StickyNote} title={q || pinnedOnly || category !== "all" ? "No notes match these filters." : "No notes yet. Create your first note."} desc={q || pinnedOnly || category !== "all" ? "Try another search or clear a filter." : "Keep revision points, ideas, and task reflections together."} action={q || pinnedOnly || category !== "all" ? <Button variant="outline" onClick={() => { setQ(""); setCategory("all"); setPinnedOnly(false); }}>Clear filters</Button> : <Button onClick={() => setEdit((entry) => ({ open: true, k: entry.k + 1 }))}><FileText className="mr-2 h-4 w-4" />Write a note</Button>} />}
      {edit.open && <NoteDialog key={edit.k} open note={edit.note ?? null} onClose={() => setEdit((e) => ({ ...e, open: false }))} />}
    </div>
  );
}
