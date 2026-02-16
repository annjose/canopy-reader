"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useDocuments } from "@/hooks/use-documents";
import { useAppShell } from "@/components/layout/app-shell";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

export function SearchPalette() {
  const router = useRouter();
  const { searchOpen, setSearchOpen } = useAppShell();
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!searchOpen) return;
    setQuery("");
  }, [searchOpen]);

  const params = useMemo(
    () => ({
      q: query.trim() ? query.trim() : undefined,
      sort: "created_at" as const,
      limit: 20,
    }),
    [query],
  );

  const { documents, isLoading } = useDocuments(params, { enabled: searchOpen });

  return (
    <CommandDialog
      open={searchOpen}
      onOpenChange={setSearchOpen}
      commandProps={{ shouldFilter: false }}
    >
      <CommandInput
        placeholder="Search title, author, description, domain…"
        value={query}
        onValueChange={setQuery}
        autoFocus
      />
      <CommandList>
        {isLoading && <CommandEmpty>Searching…</CommandEmpty>}
        {!isLoading && documents.length === 0 && (
          <CommandEmpty>No results.</CommandEmpty>
        )}

        {documents.length > 0 && (
          <CommandGroup heading={query.trim() ? "Results" : "Recent"}>
            {documents.map((doc) => (
              <CommandItem
                key={doc.id}
                value={doc.title}
                onSelect={() => {
                  setSearchOpen(false);
                  router.push(`/read/${doc.id}`);
                }}
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">
                    {doc.title}
                  </div>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                    {doc.domain && <span className="truncate">{doc.domain}</span>}
                    <span>•</span>
                    <span className="capitalize">{doc.status}</span>
                    <span>•</span>
                    <span className="capitalize">
                      {doc.type.replace("_", " ")}
                    </span>
                  </div>
                </div>
                <span className="ml-3 flex-shrink-0 text-xs text-muted-foreground">
                  {new Date(doc.created_at).toLocaleDateString()}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
