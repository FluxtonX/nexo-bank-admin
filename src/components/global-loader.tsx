"use client";

import { useEffect } from "react";
import { useIsFetching, useIsMutating } from "@tanstack/react-query";
import { nprogressDone, nprogressStart } from "@/lib/nprogress";

export function GlobalLoader() {
  const isFetching = useIsFetching();
  const isMutating = useIsMutating();
  const isLoading = isFetching > 0 || isMutating > 0;

  useEffect(() => {
    if (isLoading) {
      nprogressStart();
    } else {
      nprogressDone();
    }
  }, [isLoading]);

  return null;
}
