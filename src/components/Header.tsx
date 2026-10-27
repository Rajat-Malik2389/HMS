import React, { useState, useEffect } from 'react';
import {
  Activity,
  QrCode,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Sparkles,
  RefreshCw,
  PlusCircle,
} from 'lucide-react';

interface HeaderProps {
  urgentCount: number;
  onOpenIntake: () => void;
  onOpenGuide: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  urgentCount,
  onOpenIntake,
  onOpenGuide,
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 30000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* Logo & Clinical Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-teal-400 flex items-center justify-center shadow-lg shadow-blue-500/20 ring-2 ring-blue-400/30">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                  HMS CARETRACKER
                  <span className="text-xs px-2 py-0.5 rounded font-mono font-medium bg-blue-500/20 text-blue-300 border border-blue-400/30">
                    HMS v3.0
                  </span>
                </h1>
                <span className="hidden sm:inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="hidden sm:inline-block text-[11px] font-mono text-emerald-400">
                  LEDGER ACTIVE
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Hospital Management System • Patient Flow & Cryptographic Sign-Off
              </p>
            </div>
          </div>

          {/* Real-time Status Badges & Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Clock */}
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300 font-mono">
              <Clock className="w-3.5 h-3.5 text-blue-400" />
              <span>{currentTime || '10:15:00'}</span>
            </div>

            {/* High Priority Emergency Pill */}
            {urgentCount > 0 ? (
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-red-950/80 border border-red-800/80 text-red-300 text-xs font-semibold animate-pulse shadow-sm">
                <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                <span>{urgentCount} URGENT PRIORITY</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 text-xs font-medium">
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                <span>TRIAGE STABLE</span>
              </div>
            )}

            {/* Welcome & System Guide Button */}
            <button
              type="button"
              onClick={onOpenGuide}
              aria-label="Open system overview and welcome guide"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>Guide & Features</span>
            </button>

            {/* Check-In / Intake CTA Button */}
            <button
              type="button"
              onClick={onOpenIntake}
              aria-label="New Patient Digital Handshake Intake"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-blue-500/25 active:scale-95 transition-all"
            >
              <QrCode className="w-4 h-4" />
              <span>Digital Handshake Intake</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
