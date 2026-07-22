import { cn } from "@/lib/utils";

interface PageWrapperProps {
  children: React.ReactNode;
  className?: string;
}

export function PageWrapper({ children, className }: PageWrapperProps) {
  return (
    <main className={cn("flex-1 overflow-y-auto", className)}>
      <div className="p-4 sm:p-6 lg:p-8 max-w-screen-2xl mx-auto">
        {children}
      </div>
    </main>
  );
}
