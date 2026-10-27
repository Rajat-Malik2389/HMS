import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  QrCode,
  FileSignature,
  ArrowRight,
  Activity,
  Lock,
  Layers,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

interface WelcomeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartIntake: () => void;
  onDismissForever?: (doNotShowAgain: boolean) => void;
}

export const WelcomeGuideModal: React.FC<WelcomeGuideModalProps> = ({
  isOpen,
  onClose,
  onStartIntake,
  onDismissForever,
}) => {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  if (!isOpen) return null;

  const handleClose = () => {
    if (onDismissForever && dontShowAgain) {
      onDismissForever(true);
    }
    onClose();
  };

  const handleStartIntake = () => {
    if (onDismissForever && dontShowAgain) {
      onDismissForever(true);
    }
    onStartIntake();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-title"
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-in zoom-in-95 duration-200">
        {/* Hero Header */}
        <div className="relative p-6 sm:p-7 bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-950 text-white overflow-hidden border-b border-slate-800">
          {/* Subtle Ambient Decorative Circles */}
          <div className="absolute -right-12 -top-12 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute right-24 -bottom-16 w-40 h-40 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

          <button
            type="button"
            onClick={handleClose}
            aria-label="Close welcome guide"
            className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5 mb-3">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold tracking-wide bg-blue-500/20 text-blue-300 border border-blue-400/30 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              FIRST-TIME USER ONBOARDING
            </span>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-blue-500/30 shrink-0 ring-2 ring-white/10">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <h2 id="welcome-title" className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                Welcome to HMS CareTracker
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
                Hospital Management System: Enterprise patient flow and two-party cryptographic sign-off engine for emergency departments and ambulatory care centers.
              </p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-slate-700 dark:text-slate-300">
          {/* 3 Core Pillars */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Key Capabilities & Flow
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Feature 1 */}
              <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 space-y-2">
                <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <Activity className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                  1. Real-Time Flow & Triage
                </h4>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-normal">
                  Track live progression through Waiting, Triage, Consultation, and Sign-Off with auto-calculated triage tags (Red/Yellow/Green).
                </p>
              </div>

              {/* Feature 2 */}
              <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 space-y-2">
                <div className="w-8 h-8 rounded-xl bg-teal-100 dark:bg-teal-950 flex items-center justify-center text-teal-600 dark:text-teal-400">
                  <QrCode className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                  2. Digital Handshake Intake
                </h4>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-normal">
                  Contactless intake via optical card scanner, mobile QR sync, and electronic HIPAA consent signing with unique token assignment.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 space-y-2">
                <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950 flex items-center justify-center text-purple-600 dark:text-purple-400">
                  <Lock className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                  3. Dual Cryptographic Sign-Off
                </h4>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-normal">
                  Enforce two-party verification (doctor PIN + patient handshake code) sealed with an immutable SHA-256 digital certificate.
                </p>
              </div>
            </div>
          </div>

          {/* Where to Start Guidance */}
          <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60 space-y-2.5">
            <h3 className="text-xs font-bold text-blue-950 dark:text-blue-200 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              Where To Start
            </h3>

            <ul className="space-y-2 text-xs text-blue-900 dark:text-blue-300">
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-200 dark:bg-blue-900 text-blue-800 dark:text-blue-200 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  1
                </span>
                <span>
                  <strong>Check in a Patient:</strong> Click the <span className="font-semibold text-blue-700 dark:text-blue-300">"Digital Handshake Intake"</span> button to register a patient, test the optical scanner, and capture their consent signature.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-200 dark:bg-blue-900 text-blue-800 dark:text-blue-200 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  2
                </span>
                <span>
                  <strong>Manage Queue Stages:</strong> Switch between <span className="font-semibold">List View</span> and <span className="font-semibold">Flow Pipeline</span> (Kanban) to filter by priority, department, or attending clinician.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-200 dark:bg-blue-900 text-blue-800 dark:text-blue-200 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  3
                </span>
                <span>
                  <strong>Execute a Cryptographic Sign-Off:</strong> Click <span className="font-semibold text-purple-700 dark:text-purple-300">"Sign-Off"</span> on any consultation patient to test the two-party authorization, dual signature pad, and tamper-evident SHA-256 certificate.
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <label className="flex items-center gap-2 text-xs text-slate-500 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span>Don't show this welcome message on startup</span>
          </label>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Explore Live Queue
            </button>

            <button
              type="button"
              onClick={handleStartIntake}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Start Patient Intake</span>
              <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
