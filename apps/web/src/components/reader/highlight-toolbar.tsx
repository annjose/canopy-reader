"use client";

import { useState } from "react";
import { HIGHLIGHT_COLORS } from "@canopy/shared";
import type { HighlightColor } from "@canopy/shared";

export type ToolbarMode =
  | { mode: "new"; text: string; x: number; y: number }
  | {
      mode: "edit";
      highlightId: string;
      color: HighlightColor;
      note: string;
      x: number;
      y: number;
    };

type Props = {
  state: ToolbarMode;
  saving: boolean;
  onHighlight: (color: HighlightColor, note: string | null) => void;
  onChangeColor: (color: HighlightColor) => void;
  onDelete: () => void;
  onUpdateNote: (note: string) => void;
  onClose: () => void;
};

const COLOR_CLASSES: Record<HighlightColor, string> = {
  yellow: "bg-yellow-300",
  blue: "bg-blue-300",
  green: "bg-green-400",
  red: "bg-red-300",
  purple: "bg-purple-300",
};

export function HighlightToolbar({
  state,
  saving,
  onHighlight,
  onChangeColor,
  onDelete,
  onUpdateNote,
  onClose,
}: Props) {
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteDraft, setNoteDraft] = useState(
    state.mode === "edit" ? state.note : "",
  );

  const isEdit = state.mode === "edit";

  return (
    <div
      className="fixed z-50 flex flex-col items-center"
      style={{
        left: state.x,
        top: state.y - 8,
        transform: "translate(-50%, -100%)",
      }}
      onMouseDown={(e) => e.preventDefault()}
    >
      <div className="flex items-center gap-1 rounded-lg border bg-popover px-2 py-1.5 shadow-lg">
        {isEdit ? (
          <button
            type="button"
            onClick={onDelete}
            disabled={saving}
            className="flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-destructive hover:bg-destructive/10 disabled:opacity-50"
            title="Remove highlight"
          >
            <XSmallIcon />
            Remove
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onHighlight("yellow", null)}
            disabled={saving}
            className="flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-foreground hover:bg-accent disabled:opacity-50"
            title="Highlight with default color"
          >
            <PencilIcon />
            Highlight
          </button>
        )}

        <div className="mx-1 h-4 w-px bg-border" />

        {HIGHLIGHT_COLORS.map((c) => (
          <button
            key={c}
            type="button"
            disabled={saving}
            onClick={() => {
              if (isEdit) {
                onChangeColor(c);
              } else {
                onHighlight(c, null);
              }
            }}
            className={`h-5 w-5 rounded-full border-2 transition-transform hover:scale-110 disabled:opacity-50 ${
              isEdit && state.color === c
                ? "border-foreground scale-110"
                : "border-transparent"
            }`}
            title={c}
          >
            <span
              className={`block h-full w-full rounded-full ${COLOR_CLASSES[c]}`}
            />
          </button>
        ))}

        <div className="mx-1 h-4 w-px bg-border" />

        <button
          type="button"
          onClick={() => setNoteOpen((o) => !o)}
          className={`flex items-center gap-1 rounded px-2 py-1 text-xs font-medium hover:bg-accent ${
            noteOpen
              ? "text-foreground bg-accent"
              : "text-muted-foreground"
          }`}
          title="Add a note"
        >
          <NoteIcon />
          Note
        </button>
      </div>

      {noteOpen && (
        <div className="mt-1 w-64 rounded-lg border bg-popover p-2 shadow-lg">
          <textarea
            value={noteDraft}
            onChange={(e) => setNoteDraft(e.target.value)}
            placeholder="Add a note..."
            className="w-full resize-none rounded border bg-background px-2 py-1.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-ring"
            rows={2}
            autoFocus
          />
          <div className="mt-1 flex justify-end">
            <button
              type="button"
              disabled={saving}
              onClick={() => {
                if (isEdit) {
                  onUpdateNote(noteDraft);
                } else {
                  onHighlight("yellow", noteDraft.trim() || null);
                }
              }}
              className="rounded px-3 py-1 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function PencilIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    </svg>
  );
}

function XSmallIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

function NoteIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
