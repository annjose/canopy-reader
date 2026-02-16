"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { DOCUMENT_STATUSES, STATUS_LABELS } from "@canopy/shared";
import type { DocumentStatus } from "@canopy/shared";

export function StatusTabs() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentStatus = searchParams.get("status") ?? "inbox";

  function handleClick(status: DocumentStatus) {
    const sp = new URLSearchParams(searchParams.toString());
    sp.set("status", status);
    sp.delete("cursor");
    router.push(`/library?${sp.toString()}`);
  }

  return (
    <div className="flex gap-1 border-b border-gray-200 px-4">
      {DOCUMENT_STATUSES.map((status) => (
        <button
          key={status}
          onClick={() => handleClick(status)}
          className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
            currentStatus === status
              ? "border-gray-900 text-gray-900"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          }`}
        >
          {STATUS_LABELS[status]}
        </button>
      ))}
    </div>
  );
}
