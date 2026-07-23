export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center px-4 py-10 relative overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, #022c22 0%, #053528 7.14%, #063d30 14.29%, #064e3b 21.43%, #065f46 28.57%, #047857 35.71%, #059669 42.86%, #047857 50%, #065f46 57.14%, #064e3b 64.29%, #053528 71.43%, #042d22 78.57%, #032319 85.71%, #021a12 92.86%, #011109 100%)",
      }}
    >
      {/* Subtle radial glow overlay */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 60% at 50% 40%, rgba(5,150,105,0.35) 0%, transparent 70%)",
        }}
      />
      <div className="relative z-10 w-full max-w-[520px] flex flex-col items-center gap-6">
        {children}
      </div>
    </div>
  );
}
