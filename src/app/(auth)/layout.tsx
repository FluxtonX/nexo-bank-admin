export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center px-4 py-10 relative overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, #0A3D91 0%, #0D4297 7.14%, #10479E 14.29%, #134BA4 21.43%, #1650AB 28.57%, #1955B2 35.71%, #1C5AB8 42.86%, #1F5FBF 50%, #1C57AD 57.14%, #1A4F9B 64.29%, #174789 71.43%, #153F78 78.57%, #123767 85.71%, #0F2F57 92.86%, #0D2847 100%)",
      }}
    >
      {/* Subtle radial glow overlay */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 60% at 50% 40%, rgba(31,95,191,0.45) 0%, transparent 70%)",
        }}
      />
      <div className="relative z-10 w-full max-w-[520px] flex flex-col items-center gap-6">
        {children}
      </div>
    </div>
  );
}
