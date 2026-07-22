'use client'

import { useState } from 'react'
import { ServerOff, RotateCw, AlertOctagon, ShieldAlert, Cpu, Activity, Terminal } from 'lucide-react'

export default function MaintenancePage() {
  const [isRetrying, setIsRetrying] = useState(false)

  const handleRetry = () => {
    setIsRetrying(true)
    setTimeout(() => {
      window.location.reload()
    }, 600)
  }

  return (
    <div className="min-h-screen bg-[#070B1E] text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden font-sans select-none">
      {/* Background ambient lighting accents */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-rose-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Grid Pattern Overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(#ffffff 1px, transparent 1px)`,
          backgroundSize: '24px 24px'
        }}
      />

      <div className="max-w-xl w-full mx-auto text-center space-y-8 relative z-10">
        {/* Top Status Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-lg shadow-rose-950/30">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
          </span>
          <span>Error 503 • Service Unavailable</span>
        </div>

        {/* Animated Icon Container */}
        <div className="relative inline-flex items-center justify-center">
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-rose-500/20 to-amber-500/5 blur-xl animate-pulse" />
          <div className="relative p-6 sm:p-7 rounded-3xl bg-[#0C122C]/90 border border-rose-500/20 shadow-2xl backdrop-blur-md">
            <ServerOff className="w-12 h-12 sm:w-14 sm:h-14 text-rose-500 animate-pulse" />
          </div>
        </div>

        {/* Headings */}
        <div className="space-y-3">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Server Connection Failed
          </h1>
          <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-md mx-auto">
            The admin control engine and backend operations services are temporarily unreachable due to urgent system infrastructure maintenance or unexpected node latency.
          </p>
        </div>

        {/* Technical Telemetry Card */}
        <div className="bg-[#0C122C]/80 border border-slate-800/80 rounded-2xl p-4 sm:p-5 text-left font-mono text-xs text-slate-400 space-y-2.5 backdrop-blur-sm shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 text-slate-500">
            <span className="flex items-center gap-1.5 text-slate-300 font-semibold">
              <Terminal className="w-3.5 h-3.5 text-blue-400" />
              SYSTEM DIAGNOSTICS
            </span>
            <span className="text-[10px] text-rose-400 font-bold uppercase tracking-wider">OFFLINE</span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1 text-[11px]">
            <div className="flex items-center gap-2">
              <Cpu className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-slate-500">Admin Node:</span>
              <span className="text-slate-200">ADMIN-EAST-01</span>
            </div>
            <div className="flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-slate-500">Latency:</span>
              <span className="text-rose-400">TIMEOUT</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertOctagon className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-slate-500">Error Code:</span>
              <span className="text-slate-200">HTTP_503_UNAVAIL</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-slate-500">Auto Recovery:</span>
              <span className="text-amber-400">IN PROGRESS</span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={handleRetry}
            disabled={isRetrying}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl font-semibold text-sm text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-60 transition-all duration-150 shadow-lg shadow-blue-600/25 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[#070B1E]"
          >
            <RotateCw className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />
            <span>{isRetrying ? 'Re-establishing Connection...' : 'Retry Connection'}</span>
          </button>
        </div>

        {/* Footer Note */}
        <p className="text-xs text-slate-500 font-mono">
          System operational status will update automatically upon node restoration.
        </p>
      </div>
    </div>
  )
}
