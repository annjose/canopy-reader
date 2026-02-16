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
    <div className="flex gap-1 border-b px-4 overflow-x-auto whitespace-nowrap [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {DOCUMENT_STATUSES.map((status) => (
        <button
          key={status}
          onClick={() => handleClick(status)}
          className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors flex-shrink-0 ${
            currentStatus === status
              ? "border-foreground text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted"
          }`}
        >
          {STATUS_LABELS[status]}
        </button>
      ))}
    </div>
  );
}
