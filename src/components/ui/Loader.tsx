import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return <div className={cn("skeleton", className)} />;
}

export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn("h-4", i === lines - 1 ? "w-2/3" : "w-full")}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className }: SkeletonProps) {
  return (
    <div className={cn("glass-card p-5 flex flex-col gap-4", className)}>
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-3 w-20" />
    </div>
  );
}

export function SkeletonTableRow() {
  return (
    <div className="flex items-center gap-4 py-3 px-4">
      <Skeleton className="h-9 w-9 rounded-full shrink-0" />
      <div className="flex-1 flex flex-col gap-1.5">
        <Skeleton className="h-3.5 w-36" />
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton className="h-6 w-16 rounded-full" />
      <Skeleton className="h-3.5 w-20 hidden sm:block" />
      <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
    </div>
  );
}

export function SkeletonAvatar({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizes = { sm: "h-8 w-8", md: "h-10 w-10", lg: "h-14 w-14" };
  return <Skeleton className={cn(sizes[size], "rounded-full shrink-0")} />;
}

/* ─── Full Page Loader ───────────────────────────────────────────── */
export function PageLoader() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-950">
      <div className="flex flex-col items-center gap-6">
        {/* Animated logo mark */}
        <div className="relative">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-glow-lg animate-pulse">
            <span className="text-white font-bold text-xl tracking-tight">Nexo Bank</span>
          </div>
          {/* Spinning ring */}
          <div className="absolute -inset-2 rounded-3xl border-2 border-transparent border-t-indigo-500 border-r-purple-500 animate-spin" />
        </div>

        {/* Progress bar */}
        <div className="w-48 h-1 rounded-full bg-surface-800 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
            style={{ animation: "progress-fill 1.4s ease-in-out infinite" }}
          />
        </div>

        <p className="text-slate-500 text-sm animate-pulse">Loading dashboard…</p>
      </div>

      <style>{`
        @keyframes progress-fill {
          0% { width: 0%; margin-left: 0%; }
          50% { width: 70%; margin-left: 15%; }
          100% { width: 0%; margin-left: 100%; }
        }
      `}</style>
    </div>
  );
}

/* ─── Inline Spinner ─────────────────────────────────────────────── */
export function Spinner({ size = "md", className }: { size?: "sm" | "md" | "lg"; className?: string }) {
  const sizes = { sm: "h-4 w-4 border-2", md: "h-6 w-6 border-2", lg: "h-8 w-8 border-[3px]" };
  return (
    <div
      className={cn(
        "rounded-full border-slate-700 border-t-indigo-500 animate-spin",
        sizes[size],
        className
      )}
    />
  );
}
