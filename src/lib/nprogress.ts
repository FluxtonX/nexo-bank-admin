import NProgress from "nprogress";

NProgress.configure({ showSpinner: false });

let activeCount = 0;

export function nprogressStart() {
  if (activeCount === 0) {
    NProgress.start();
  }
  activeCount += 1;
}

export function nprogressDone() {
  activeCount = Math.max(0, activeCount - 1);
  if (activeCount === 0) {
    NProgress.done();
  }
}

export async function withNProgress<T>(fn: () => Promise<T>): Promise<T> {
  nprogressStart();
  try {
    return await fn();
  } finally {
    nprogressDone();
  }
}

export function createProgressFetch(): typeof fetch {
  return async (...args: Parameters<typeof fetch>) => {
    nprogressStart();
    try {
      return await fetch(...args);
    } finally {
      nprogressDone();
    }
  };
}
