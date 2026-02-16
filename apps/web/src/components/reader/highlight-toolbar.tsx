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
      <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2 py-1.5 shadow-lg dark:border-neutral-700 dark:bg-neutral-800">
        {isEdit ? (
          <button
            type="button"
            onClick={onDelete}
            disabled={saving}
            className="flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40 disabled:opacity-50"
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
            className="flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100 dark:text-neutral-200 dark:hover:bg-neutral-700 disabled:opacity-50"
            title="Highlight with default color"
          >
            <PencilIcon />
            Highlight
          </button>
        )}

        <div className="mx-1 h-4 w-px bg-gray-200" />

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
                ? "border-gray-800 dark:border-neutral-100 scale-110"
                : "border-transparent"
            }`}
            title={c}
          >
            <span
              className={`block h-full w-full rounded-full ${COLOR_CLASSES[c]}`}
            />
          </button>
        ))}

        <div className="mx-1 h-4 w-px bg-gray-200" />

        <button
          type="button"
          onClick={() => setNoteOpen((o) => !o)}
          className={`flex items-center gap-1 rounded px-2 py-1 text-xs font-medium hover:bg-gray-100 dark:hover:bg-neutral-700 ${
            noteOpen
              ? "text-gray-900 bg-gray-100 dark:text-neutral-100 dark:bg-neutral-700"
              : "text-gray-500 dark:text-neutral-300"
          }`}
          title="Add a note"
        >
          <NoteIcon />
          Note
        </button>
      </div>

      {noteOpen && (
        <div className="mt-1 w-64 rounded-lg border border-gray-200 bg-white p-2 shadow-lg dark:border-neutral-700 dark:bg-neutral-800">
          <textarea
            value={noteDraft}
            onChange={(e) => setNoteDraft(e.target.value)}
            placeholder="Add a note..."
            className="w-full resize-none rounded border border-gray-200 px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-gray-300 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:focus:ring-neutral-600"
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
              className="rounded px-3 py-1 text-xs font-medium bg-gray-900 text-white hover:bg-gray-800 dark:bg-neutral-700 dark:text-neutral-100 dark:hover:bg-neutral-600 disabled:opacity-50"
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
