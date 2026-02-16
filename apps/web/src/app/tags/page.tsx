"use client";

import { useEffect, useMemo, useState } from "react";
import type { TagWithCount } from "@canopy/shared";
import { useAppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { useTags } from "@/hooks/use-tags";
import { createTag, deleteTag, mergeTags, updateTag } from "@/lib/api";

export default function TagsPage() {
  const { tags, isLoading, error, mutate } = useTags();
  const { setRightPanelOpen, setSelectedDocument } = useAppShell();
  const [newTagName, setNewTagName] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    setRightPanelOpen(false);
    setSelectedDocument(null);
  }, [setRightPanelOpen, setSelectedDocument]);

  async function handleCreateTag() {
    const name = newTagName.trim();
    if (!name) return;

    try {
      setCreating(true);
      await createTag(name);
      setNewTagName("");
      await mutate();
      toast({ title: "Tag created" });
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Failed to create tag",
        description: e instanceof Error ? e.message : "Unknown error",
      });
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl p-4 md:p-6">
      <div className="mb-5">
        <h1 className="text-xl font-semibold text-gray-900">Tags</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage tags, rename labels, merge duplicates, and clean up unused tags.
        </p>
      </div>

      <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="text-sm font-medium text-gray-700">Create tag</h2>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <Input
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            placeholder="e.g. Machine Learning"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void handleCreateTag();
              }
            }}
          />
          <Button onClick={() => void handleCreateTag()} disabled={creating || !newTagName.trim()}>
            {creating ? "Creating…" : "Create"}
          </Button>
        </div>
      </div>

      {isLoading && <div className="text-sm text-gray-500">Loading tags…</div>}
      {error && <div className="text-sm text-red-600">Failed to load tags.</div>}

      {!isLoading && !error && tags.length === 0 && (
        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
          No tags yet.
        </div>
      )}

      {!isLoading && !error && tags.length > 0 && (
        <div className="space-y-3">
          {tags.map((tag) => (
            <TagRow key={tag.id} tag={tag} allTags={tags} onChanged={mutate} />
          ))}
        </div>
      )}
    </div>
  );
}

function TagRow({
  tag,
  allTags,
  onChanged,
}: {
  tag: TagWithCount;
  allTags: TagWithCount[];
  onChanged: () => Promise<unknown>;
}) {
  const [nameDraft, setNameDraft] = useState(tag.name);
  const [renaming, setRenaming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [merging, setMerging] = useState(false);
  const [targetTagId, setTargetTagId] = useState("");

  const mergeTargets = useMemo(
    () => allTags.filter((t) => t.id !== tag.id),
    [allTags, tag.id],
  );

  useEffect(() => {
    setNameDraft(tag.name);
  }, [tag.name]);

  const nameDirty = nameDraft.trim() !== tag.name;

  async function handleRename() {
    const name = nameDraft.trim();
    if (!name || !nameDirty) return;

    try {
      setRenaming(true);
      await updateTag(tag.id, { name });
      await onChanged();
      toast({ title: "Tag renamed" });
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Failed to rename tag",
        description: e instanceof Error ? e.message : "Unknown error",
      });
    } finally {
      setRenaming(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete tag “${tag.name}”?`)) return;

    try {
      setDeleting(true);
      await deleteTag(tag.id);
      await onChanged();
      toast({ title: "Tag deleted" });
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Failed to delete tag",
        description: e instanceof Error ? e.message : "Unknown error",
      });
    } finally {
      setDeleting(false);
    }
  }

  async function handleMerge() {
    if (!targetTagId) return;
    const target = allTags.find((t) => t.id === targetTagId);
    if (!target) return;

    if (!confirm(`Merge “${tag.name}” into “${target.name}”?`)) return;

    try {
      setMerging(true);
      await mergeTags(tag.id, targetTagId);
      setTargetTagId("");
      await onChanged();
      toast({ title: "Tags merged" });
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Failed to merge tags",
        description: e instanceof Error ? e.message : "Unknown error",
      });
    } finally {
      setMerging(false);
    }
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-center gap-2">
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
              {tag.document_count} docs
            </span>
            <span className="text-xs text-gray-400">/{tag.slug}</span>
          </div>

          <div className="flex gap-2">
            <Input
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void handleRename();
                }
              }}
            />
            <Button
              variant="secondary"
              onClick={() => void handleRename()}
              disabled={!nameDirty || renaming}
            >
              {renaming ? "Saving…" : "Rename"}
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-2 md:w-[280px]">
          <div className="flex gap-2">
            <select
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={targetTagId}
              onChange={(e) => setTargetTagId(e.target.value)}
            >
              <option value="">Merge into…</option>
              {mergeTargets.map((target) => (
                <option key={target.id} value={target.id}>
                  {target.name}
                </option>
              ))}
            </select>
            <Button
              variant="outline"
              onClick={() => void handleMerge()}
              disabled={!targetTagId || merging}
            >
              {merging ? "Merging…" : "Merge"}
            </Button>
          </div>

          <Button
            variant="destructive"
            onClick={() => void handleDelete()}
            disabled={deleting}
          >
            {deleting ? "Deleting…" : "Delete"}
          </Button>
        </div>
      </div>
    </div>
  );
}
