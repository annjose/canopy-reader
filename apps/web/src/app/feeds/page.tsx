"use client";

import { Suspense, useState } from "react";
import type { FeedWithCount } from "@canopy/shared";
import { FeedList } from "@/components/feeds/feed-list";
import { FeedItems } from "@/components/feeds/feed-items";
import { useFeeds } from "@/hooks/use-feeds";

function FeedsContent() {
  const [selectedFeed, setSelectedFeed] = useState<FeedWithCount | null>(null);
  const { mutate } = useFeeds();

  return (
    <div className="grid h-full" style={{ gridTemplateColumns: selectedFeed ? "320px 1fr" : "1fr" }}>
      <div className="overflow-y-auto border-r">
        <FeedList
          onSelectFeed={setSelectedFeed}
          selectedFeedId={selectedFeed?.id ?? null}
        />
      </div>
      {selectedFeed && (
        <div className="overflow-y-auto">
          <FeedItems
            feed={selectedFeed}
            onMutateFeeds={() => void mutate()}
          />
        </div>
      )}
    </div>
  );
}

export default function FeedsPage() {
  return (
    <Suspense>
      <FeedsContent />
    </Suspense>
  );
}
