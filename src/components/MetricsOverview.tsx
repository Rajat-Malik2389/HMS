import React from 'react';
import {
  Users,
  Clock,
  Stethoscope,
  FileCheck2,
  CheckCircle,
  AlertOctagon,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { QueueMetrics, PriorityLevel, PatientStatus } from '../types';
import { formatMinutesWait } from '../utils/trackerLogic';

interface MetricsOverviewProps {
  metrics: QueueMetrics;
  onSelectFilter: (status: PatientStatus | 'all', priority: PriorityLevel | 'all') => void;
  activeStatusFilter: PatientStatus | 'all';
  activePriorityFilter: PriorityLevel | 'all';
}

export const MetricsOverview: React.FC<MetricsOverviewProps> = ({
  metrics,
  onSelectFilter,
  activeStatusFilter,
  activePriorityFilter,
}) => {
  return (
    <div className="space-y-3.5">
      {/* High-priority Clinical Triage Alert Banner if urgent patients exist */}
      {metrics.urgentCount > 0 && (
        <div className="bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white rounded-xl p-3.5 shadow-md shadow-red-500/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
              <AlertOctagon className="w-5 h-5 text-white animate-bounce" />
            </div>
            <div>
              <p className="font-bold text-sm flex items-center gap-2">
                CRITICAL TRIAGE WATCH: {metrics.urgentCount} Urgent Priority Patient{metrics.urgentCount > 1 ? 's' : ''} in Queue
              </p>
              <p className="text-xs text-red-100">
                Immediate clinical assessment and physician handshake handover required.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onSelectFilter('all', 'urgent')}
            className="self-start sm:self-center inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-red-700 hover:bg-red-50 text-xs font-semibold shadow-sm transition-all whitespace-nowrap active:scale-95"
          >
            <span>View Urgent Cases</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Active */}
        <button
          type="button"
          onClick={() => onSelectFilter('all', 'all')}
          className={`p-3.5 rounded-xl border text-left transition-all relative overflow-hidden ${
            activeStatusFilter === 'all' && activePriorityFilter === 'all'
              ? 'bg-blue-50/90 border-blue-400 dark:bg-blue-950/40 dark:border-blue-700 shadow-sm ring-1 ring-blue-400'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Total Active</span>
            <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
            {metrics.totalActive}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-blue-500" />
            <span>Active clinical care</span>
          </div>
        </button>

        {/* Waiting / In Triage */}
        <button
          type="button"
          onClick={() => onSelectFilter('waiting', 'all')}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            activeStatusFilter === 'waiting'
              ? 'bg-amber-50/90 border-amber-400 dark:bg-amber-950/40 dark:border-amber-700 shadow-sm ring-1 ring-amber-400'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">In Waiting Room</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
            {metrics.waitingCount}
          </div>
          <div className="text-[11px] text-amber-600 dark:text-amber-400 mt-1 font-medium">
            Pending triage / room
          </div>
        </button>

        {/* In Consultation */}
        <button
          type="button"
          onClick={() => onSelectFilter('in_consultation', 'all')}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            activeStatusFilter === 'in_consultation'
              ? 'bg-indigo-50/90 border-indigo-400 dark:bg-indigo-950/40 dark:border-indigo-700 shadow-sm ring-1 ring-indigo-400'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">In Consult</span>
            <Stethoscope className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
            {metrics.inConsultationCount}
          </div>
          <div className="text-[11px] text-indigo-600 dark:text-indigo-400 mt-1 font-medium">
            With physician
          </div>
        </button>

        {/* Ready for Sign-Off */}
        <button
          type="button"
          onClick={() => onSelectFilter('ready_for_signoff', 'all')}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            activeStatusFilter === 'ready_for_signoff'
              ? 'bg-purple-50/90 border-purple-400 dark:bg-purple-950/40 dark:border-purple-700 shadow-sm ring-1 ring-purple-400'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Ready Sign-Off</span>
            <FileCheck2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
            {metrics.readyForSignoffCount}
          </div>
          <div className="text-[11px] text-purple-600 dark:text-purple-400 mt-1 font-medium">
            Dual approval needed
          </div>
        </button>

        {/* Cryptographically Discharged */}
        <button
          type="button"
          onClick={() => onSelectFilter('discharged', 'all')}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            activeStatusFilter === 'discharged'
              ? 'bg-emerald-50/90 border-emerald-400 dark:bg-emerald-950/40 dark:border-emerald-700 shadow-sm ring-1 ring-emerald-400'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Discharged</span>
            <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
            {metrics.dischargedCount}
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
            Sealed & Verified
          </div>
        </button>

        {/* Average Wait Time */}
        <div className="p-3.5 rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Avg Wait Time</span>
            <Clock className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
            {formatMinutesWait(metrics.avgWaitTimeMinutes)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Target benchmark: &lt; 35m
          </div>
        </div>
      </div>
    </div>
  );
};
