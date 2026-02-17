"use client";

import { Suspense } from "react";
import { FeedList } from "@/components/feeds/feed-list";

export default function FeedsPage() {
  return (
    <Suspense>
      <FeedList />
    </Suspense>
  );
}
