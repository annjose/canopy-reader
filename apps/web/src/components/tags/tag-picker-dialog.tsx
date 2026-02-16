"use client";

import { useEffect, useMemo, useState } from "react";
import type { Tag } from "@canopy/shared";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { createTag, listTags, setDocumentTags } from "@/lib/api";
import { slugify } from "@/lib/slug";

export function TagPickerDialog({
  documentId,
  initialTags,
  open,
  onOpenChange,
  onUpdated,
}: {
  documentId: string;
  initialTags: Tag[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: () => void;
}) {
  const [query, setQuery] = useState("");
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [selectedIds, setSelectedIds] = useState<string[]>(
    initialTags.map((t) => t.id),
  );

  // Reset local state on open.
  useEffect(() => {
    if (!open) return;
    setQuery("");
    setSelectedIds(initialTags.map((t) => t.id));
  }, [open, initialTags]);

  // Fetch tags when opened.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    async function run() {
      try {
        setLoading(true);
        const { tags } = await listTags();
        if (!cancelled) setAllTags(tags);
      } catch (e) {
        toast({
          variant: "destructive",
          title: "Failed to load tags",
          description: e instanceof Error ? e.message : "Unknown error",
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allTags;
    return allTags.filter((t) => {
      const name = t.name.toLowerCase();
      const slug = t.slug.toLowerCase();
      return name.includes(q) || slug.includes(q);
    });
  }, [allTags, query]);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const canCreate = useMemo(() => {
    const name = query.trim();
    if (!name) return false;
    const slug = slugify(name);
    if (!slug) return false;
    return !allTags.some((t) => t.slug === slug);
  }, [allTags, query]);

  function toggle(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  async function handleCreate() {
    const name = query.trim();
    if (!name) return;

    try {
      const tag = await createTag(name);
      setAllTags((prev) => {
        if (prev.some((t) => t.id === tag.id)) return prev;
        return [...prev, tag].sort((a, b) => a.name.localeCompare(b.name));
      });
      setSelectedIds((prev) => (prev.includes(tag.id) ? prev : [...prev, tag.id]));
      setQuery("");
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Failed to create tag",
        description: e instanceof Error ? e.message : "Unknown error",
      });
    }
  }

  async function save() {
    try {
      setSaving(true);
      await setDocumentTags(documentId, selectedIds);
      toast({ title: "Updated tags" });
      onUpdated();
      onOpenChange(false);
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Failed to update tags",
        description: e instanceof Error ? e.message : "Unknown error",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit tags</DialogTitle>
        </DialogHeader>

        <div className="-mx-1">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder={loading ? "Loading tags…" : "Search or create a tag…"}
              value={query}
              onValueChange={setQuery}
            />
            <CommandList className="max-h-[260px]">
              {filtered.length === 0 && !canCreate && (
                <CommandEmpty>No tags found.</CommandEmpty>
              )}

              {canCreate && (
                <CommandGroup heading="Create">
                  <CommandItem
                    value={`create:${query}`}
                    onSelect={() => void handleCreate()}
                  >
                    <span className="text-sm">Create “{query.trim()}”</span>
                  </CommandItem>
                </CommandGroup>
              )}

              {filtered.length > 0 && (
                <CommandGroup heading="Tags">
                  {filtered.map((t) => {
                    const selected = selectedSet.has(t.id);
                    return (
                      <CommandItem
                        key={t.id}
                        value={t.slug}
                        onSelect={() => toggle(t.id)}
                      >
                        <span
                          className={`mr-2 inline-flex h-4 w-4 items-center justify-center rounded border text-xs ${
                            selected
                              ? "bg-gray-900 text-white border-gray-900"
                              : "border-gray-300"
                          }`}
                          aria-hidden
                        >
                          {selected ? "✓" : ""}
                        </span>
                        <span className="truncate">{t.name}</span>
                        <span className="ml-auto text-xs text-muted-foreground">
                          {t.slug}
                        </span>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="secondary"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button type="button" onClick={() => void save()} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
