"use client";

import { useAppShell } from "./app-shell";

export function RightPanel() {
  const { selectedDocument: doc, setRightPanelOpen } = useAppShell();

  if (!doc) {
    return (
      <aside className="border-l border-gray-200 bg-gray-50 p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-500">Details</h2>
          <button
            onClick={() => setRightPanelOpen(false)}
            className="p-1 rounded hover:bg-gray-200 text-gray-400"
          >
            <XIcon />
          </button>
        </div>
        <p className="text-sm text-gray-400">Select a document to see details</p>
      </aside>
    );
  }

  const rows: [string, string | null | undefined][] = [
    ["Title", doc.title],
    ["Author", doc.author],
    ["Domain", doc.domain],
    ["Published", doc.published_at ? new Date(doc.published_at).toLocaleDateString() : null],
    ["Word count", doc.word_count?.toLocaleString() ?? null],
    ["Reading time", doc.reading_time_minutes ? `${doc.reading_time_minutes} min` : null],
    ["Progress", `${Math.round(doc.reading_progress * 100)}%`],
    ["Saved", new Date(doc.created_at).toLocaleDateString()],
    ["Status", doc.status],
  ];

  return (
    <aside className="border-l border-gray-200 bg-gray-50 p-4 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-900">Details</h2>
        <button
          onClick={() => setRightPanelOpen(false)}
          className="p-1 rounded hover:bg-gray-200 text-gray-400"
        >
          <XIcon />
        </button>
      </div>

      {doc.image_url && (
        <img
          src={doc.image_url}
          alt=""
          className="w-full h-32 object-cover rounded-lg mb-4"
        />
      )}

      <dl className="space-y-3">
        {rows.map(
          ([label, value]) =>
            value && (
              <div key={label}>
                <dt className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                  {label}
                </dt>
                <dd className="mt-0.5 text-sm text-gray-700">{value}</dd>
              </div>
            ),
        )}
      </dl>

      {doc.url && (
        <a
          href={doc.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 block text-sm text-blue-600 hover:underline"
        >
          Open original
        </a>
      )}
    </aside>
  );
}

function XIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M4 4l8 8M12 4l-8 8" />
    </svg>
  );
}
