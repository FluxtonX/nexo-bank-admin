import type { Metadata } from "next";
import NextTopLoader from "nextjs-toploader";
import { QueryProvider } from "@/providers/query-provider";
import MaintenanceGuard from "@/components/MaintenanceGuard";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Nexo Bank Admin Panel",
    template: "%s | Nexo bank Admin",
  },
  description: "Modern admin dashboard panel for Nexo Bank platform management.",
  robots: "noindex, nofollow",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased" suppressHydrationWarning>
        <NextTopLoader color="#2563eb" height={3} showSpinner={false} crawl={true} crawlSpeed={200} initialPosition={0.08} />
        <QueryProvider>
          <MaintenanceGuard appType="admin" />
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
