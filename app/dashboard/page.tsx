'use client';

import React, { useState, useMemo } from 'react';
import {
  Users,
  Clock,
  Stethoscope,
  FileCheck2,
  CheckCircle,
  AlertOctagon,
  Search,
  Filter,
  LayoutList,
  Kanban,
  FileSignature,
  ArrowRight,
  Heart,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  QrCode,
  RefreshCw,
} from 'lucide-react';
import { HandshakeSignatureModal } from '@/components/HandshakeSignatureModal';
import { PatientVisitDTO, PriorityLevel, VisitStatus, HandshakeReceipt } from '@/lib/types';

// Production Seed Data
const INITIAL_VISITS: PatientVisitDTO[] = [
  {
    id: 'vst-101',
    patientId: 'pat-001',
    mrn: 'MRN-84192',
    patientName: 'Eleanor Sterling',
    age: 64,
    gender: 'Female',
    visitNumber: 'VST-2026-90412',
    status: 'PENDING_HANDSHAKE',
    priority: 'URGENT',
    triageTag: 'RED',
    chiefComplaint: 'Acute substernal chest pressure radiating to left arm',
    department: 'Emergency & Trauma',
    attendingDoctorId: 'doc-101',
    attendingDoctorName: 'Dr. Evelyn Vance, MD',
    attendingDoctorLicense: 'MD-88291-NY',
    handshakeToken: 'HSK-4819',
    vitals: {
      bp: '162/98',
      heartRate: 104,
      spo2: 93,
      temp: 98.7,
      painScore: 8,
    },
    checkInTime: new Date(Date.now() - 48 * 60 * 1000).toISOString(),
    waitTimeMinutes: 48,
  },
  {
    id: 'vst-102',
    patientId: 'pat-002',
    mrn: 'MRN-84203',
    patientName: 'Mateo Hernandez',
    age: 38,
    gender: 'Male',
    visitNumber: 'VST-2026-90413',
    status: 'TRIAGE',
    priority: 'URGENT',
    triageTag: 'YELLOW',
    chiefComplaint: 'Severe abdominal pain (RLQ) with fever and localized tenderness',
    department: 'Emergency & Trauma',
    attendingDoctorId: 'doc-102',
    attendingDoctorName: 'Dr. Tariq Al-Mansoor, MD',
    attendingDoctorLicense: 'MD-90142-NY',
    handshakeToken: 'HSK-3810',
    vitals: {
      bp: '134/86',
      heartRate: 94,
      spo2: 98,
      temp: 102.4,
      painScore: 7,
    },
    checkInTime: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    waitTimeMinutes: 25,
  },
  {
    id: 'vst-103',
    patientId: 'pat-003',
    mrn: 'MRN-84215',
    patientName: 'Sophia Lin-Davis',
    age: 29,
    gender: 'Female',
    visitNumber: 'VST-2026-90414',
    status: 'IN_CONSULTATION',
    priority: 'NORMAL',
    triageTag: 'YELLOW',
    chiefComplaint: 'Moderate asthma flare unresponsive to home albuterol inhaler',
    department: 'Internal Medicine',
    attendingDoctorId: 'doc-101',
    attendingDoctorName: 'Dr. Evelyn Vance, MD',
    attendingDoctorLicense: 'MD-88291-NY',
    handshakeToken: 'HSK-7729',
    vitals: {
      bp: '118/76',
      heartRate: 82,
      spo2: 97,
      temp: 98.4,
      painScore: 2,
    },
    checkInTime: new Date(Date.now() - 55 * 60 * 1000).toISOString(),
    waitTimeMinutes: 55,
  },
  {
    id: 'vst-104',
    patientId: 'pat-004',
    mrn: 'MRN-84226',
    patientName: 'Julian Brooks',
    age: 51,
    gender: 'Male',
    visitNumber: 'VST-2026-90415',
    status: 'CHECKED_IN',
    priority: 'NORMAL',
    triageTag: 'GREEN',
    chiefComplaint: 'Right ankle inversion injury during recreational soccer',
    department: 'Orthopedics',
    attendingDoctorId: 'doc-103',
    attendingDoctorName: 'Dr. Marcus Chen, MD',
    attendingDoctorLicense: 'MD-66120-NY',
    handshakeToken: 'HSK-5521',
    vitals: {
      bp: '124/80',
      heartRate: 76,
      spo2: 99,
      temp: 98.6,
      painScore: 5,
    },
    checkInTime: new Date(Date.now() - 14 * 60 * 1000).toISOString(),
    waitTimeMinutes: 14,
  },
  {
    id: 'vst-105',
    patientId: 'pat-005',
    mrn: 'MRN-84237',
    patientName: 'Hannah Zimmerman',
    age: 26,
    gender: 'Female',
    visitNumber: 'VST-2026-90416',
    status: 'DISCHARGED',
    priority: 'LOW',
    triageTag: 'BLUE',
    chiefComplaint: 'Uncomplicated acute bronchitis with resolved bronchial spasms',
    department: 'Emergency & Trauma',
    attendingDoctorId: 'doc-101',
    attendingDoctorName: 'Dr. Evelyn Vance, MD',
    attendingDoctorLicense: 'MD-88291-NY',
    handshakeToken: 'HSK-9021',
    vitals: {
      bp: '116/74',
      heartRate: 72,
      spo2: 98,
      temp: 98.4,
      painScore: 0,
    },
    checkInTime: new Date(Date.now() - 110 * 60 * 1000).toISOString(),
    waitTimeMinutes: 0,
    dischargeTime: new Date().toISOString(),
    cryptographicHash: 'a7f34c9018e6b12f459c38102d99aa34f826bc510e527f9b05688c1f83d9ab5c',
  },
];

export default function DashboardPage() {
  const [visits, setVisits] = useState<PatientVisitDTO[]>(INITIAL_VISITS);
  const [selectedVisitForHandshake, setSelectedVisitForHandshake] = useState<PatientVisitDTO | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<PriorityLevel | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<VisitStatus | 'ALL'>('ALL');
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');

  // Metrics computation
  const stats = useMemo(() => {
    const active = visits.filter((v) => v.status !== 'DISCHARGED');
    const urgentCount = active.filter((v) => v.priority === 'URGENT').length;
    const pendingHandshakes = active.filter((v) => v.status === 'PENDING_HANDSHAKE').length;
    const dischargedCount = visits.filter((v) => v.status === 'DISCHARGED').length;

    return {
      totalActive: active.length,
      urgentCount,
      pendingHandshakes,
      dischargedCount,
    };
  }, [visits]);

  // Filtered Visits
  const filteredVisits = useMemo(() => {
    return visits.filter((v) => {
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = v.patientName.toLowerCase().includes(query);
        const matchesMrn = v.mrn.toLowerCase().includes(query);
        const matchesToken = v.handshakeToken.toLowerCase().includes(query);
        const matchesComplaint = v.chiefComplaint.toLowerCase().includes(query);
        if (!matchesName && !matchesMrn && !matchesToken && !matchesComplaint) {
          return false;
        }
      }

      if (priorityFilter !== 'ALL' && v.priority !== priorityFilter) {
        return false;
      }

      if (statusFilter !== 'ALL' && v.status !== statusFilter) {
        return false;
      }

      return true;
    });
  }, [visits, searchQuery, priorityFilter, statusFilter]);

  // Handshake completion callback
  const handleHandshakeSuccess = (receipt: HandshakeReceipt) => {
    setVisits((prev) =>
      prev.map((v) => {
        if (v.id === receipt.visitId) {
          return {
            ...v,
            status: 'DISCHARGED',
            dischargeTime: receipt.timestamp,
            cryptographicHash: receipt.cryptographicHash,
          };
        }
        return v;
      })
    );
  };

  // Status progression action
  const handleAdvanceStatus = (visit: PatientVisitDTO) => {
    const flowMap: Record<VisitStatus, VisitStatus> = {
      CHECKED_IN: 'TRIAGE',
      TRIAGE: 'IN_CONSULTATION',
      IN_CONSULTATION: 'PENDING_HANDSHAKE',
      PENDING_HANDSHAKE: 'PENDING_HANDSHAKE',
      DISCHARGED: 'DISCHARGED',
    };
    const next = flowMap[visit.status];
    if (next && next !== visit.status) {
      setVisits((prev) =>
        prev.map((v) => (v.id === visit.id ? { ...v, status: next } : v))
      );
    }
  };

  const statusColumns: { key: VisitStatus; label: string; color: string }[] = [
    { key: 'CHECKED_IN', label: 'Checked In', color: 'border-slate-400' },
    { key: 'TRIAGE', label: 'Triage Stage', color: 'border-amber-400' },
    { key: 'IN_CONSULTATION', label: 'In Consultation', color: 'border-indigo-400' },
    { key: 'PENDING_HANDSHAKE', label: 'Pending Handshake', color: 'border-purple-500' },
    { key: 'DISCHARGED', label: 'Discharged & Sealed', color: 'border-emerald-500' },
  ];

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans">
      {/* Top Navbar */}
      <nav className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-teal-400 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                HMS CareTracker
                <span className="text-[10px] px-2 py-0.5 rounded font-mono font-medium bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  HMS v3.0
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                Hospital Management System • Patient Flow & Cryptographic Sign-Off
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {stats.urgentCount > 0 ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-950/80 border border-red-800 text-red-300 text-xs font-semibold animate-pulse">
                <AlertOctagon className="w-3.5 h-3.5 text-red-400" />
                <span>{stats.urgentCount} Urgent Cases</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>Queue Stable</span>
              </div>
            )}

            <button
              type="button"
              onClick={() => setVisits(INITIAL_VISITS)}
              className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-colors"
              title="Reset queue data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </nav>

      {/* Main Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">
        {/* Urgent Alert Banner */}
        {stats.urgentCount > 0 && (
          <div className="bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl p-3.5 shadow-md flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertOctagon className="w-5 h-5 shrink-0 animate-bounce" />
              <div>
                <p className="font-bold text-sm">
                  HIGH PRIORITY ALERT: {stats.urgentCount} Patient(s) require immediate physician sign-off
                </p>
                <p className="text-xs text-red-100">
                  Two-party authorization required before discharge release.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setPriorityFilter('URGENT')}
              className="px-3 py-1.5 bg-white text-red-700 rounded-lg text-xs font-bold hover:bg-red-50"
            >
              Filter Urgent Cases
            </button>
          </div>
        )}

        {/* Stats KPI Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between text-slate-500 mb-1 text-xs font-semibold">
              <span>Active In Queue</span>
              <Users className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-2xl font-bold font-mono">{stats.totalActive}</div>
          </div>

          <div className="p-3.5 rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between text-slate-500 mb-1 text-xs font-semibold">
              <span>Pending Handshake</span>
              <FileSignature className="w-4 h-4 text-purple-500" />
            </div>
            <div className="text-2xl font-bold font-mono text-purple-600 dark:text-purple-400">
              {stats.pendingHandshakes}
            </div>
          </div>

          <div className="p-3.5 rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between text-slate-500 mb-1 text-xs font-semibold">
              <span>Urgent Red Triage</span>
              <AlertOctagon className="w-4 h-4 text-red-500" />
            </div>
            <div className="text-2xl font-bold font-mono text-red-600 dark:text-red-400">
              {stats.urgentCount}
            </div>
          </div>

          <div className="p-3.5 rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between text-slate-500 mb-1 text-xs font-semibold">
              <span>Discharged & Sealed</span>
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
              {stats.dischargedCount}
            </div>
          </div>
        </div>

        {/* Filter & View Switcher Bar */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by Patient Name, MRN, Token..."
                className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* View Switcher */}
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg flex items-center gap-1.5 ${
                    viewMode === 'table' ? 'bg-white dark:bg-slate-900 shadow-xs text-blue-600' : 'text-slate-500'
                  }`}
                >
                  <LayoutList className="w-3.5 h-3.5" />
                  <span>List</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('kanban')}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg flex items-center gap-1.5 ${
                    viewMode === 'kanban' ? 'bg-white dark:bg-slate-900 shadow-xs text-blue-600' : 'text-slate-500'
                  }`}
                >
                  <Kanban className="w-3.5 h-3.5" />
                  <span>Kanban</span>
                </button>
              </div>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2 text-xs pt-1">
            <span className="text-slate-400 font-medium flex items-center gap-1">
              <Filter className="w-3 h-3" /> Priority:
            </span>
            {(['ALL', 'URGENT', 'NORMAL', 'LOW'] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPriorityFilter(p)}
                className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                  priorityFilter === p
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                {p}
              </button>
            ))}

            <span className="text-slate-400 font-medium ml-3">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-1 rounded-md text-xs"
            >
              <option value="ALL">All Statuses</option>
              <option value="CHECKED_IN">Checked In</option>
              <option value="TRIAGE">Triage</option>
              <option value="IN_CONSULTATION">In Consultation</option>
              <option value="PENDING_HANDSHAKE">Pending Handshake</option>
              <option value="DISCHARGED">Discharged</option>
            </select>
          </div>
        </div>

        {/* Content: Table vs Kanban */}
        {viewMode === 'table' ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-x-auto">
            <table className="w-full text-left text-xs md:text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold uppercase text-[11px]">
                  <th className="py-3 px-4">Patient & MRN</th>
                  <th className="py-3 px-4">Triage Priority</th>
                  <th className="py-3 px-4">Chief Complaint & Vitals</th>
                  <th className="py-3 px-4">Attending Doctor</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredVisits.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {v.patientName} <span className="text-slate-400 font-normal">({v.age}y)</span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 font-mono text-[10px] text-slate-500">
                        <span>{v.mrn}</span>
                        <span className="text-blue-600 font-bold">[{v.handshakeToken}]</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          v.priority === 'URGENT'
                            ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                            : v.priority === 'NORMAL'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                        }`}
                      >
                        {v.priority} • TAG {v.triageTag}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="truncate font-medium text-slate-800 dark:text-slate-200">{v.chiefComplaint}</p>
                      <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                        BP: {v.vitals.bp} | HR: {v.vitals.heartRate} | SpO₂: {v.vitals.spo2}%
                      </p>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-medium text-slate-800 dark:text-slate-200">{v.attendingDoctorName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{v.attendingDoctorLicense}</div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-md text-[11px] font-bold ${
                          v.status === 'PENDING_HANDSHAKE'
                            ? 'bg-purple-100 text-purple-800 animate-pulse'
                            : v.status === 'DISCHARGED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {v.status.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        {v.status !== 'DISCHARGED' && (
                          <button
                            type="button"
                            onClick={() => setSelectedVisitForHandshake(v)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg shadow-xs"
                          >
                            <FileSignature className="w-3.5 h-3.5" />
                            <span>Sign-Off</span>
                          </button>
                        )}

                        {v.status !== 'DISCHARGED' && v.status !== 'PENDING_HANDSHAKE' && (
                          <button
                            type="button"
                            onClick={() => handleAdvanceStatus(v)}
                            title="Advance Stage"
                            className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-blue-600"
                          >
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* Kanban Flow */
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {statusColumns.map((col) => {
              const colVisits = filteredVisits.filter((v) => v.status === col.key);
              return (
                <div key={col.key} className="bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col min-h-[400px]">
                  <div className={`p-3 border-t-4 ${col.color} border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 rounded-t-lg`}>
                    <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100">{col.label}</h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-100 rounded-full font-bold">
                      {colVisits.length}
                    </span>
                  </div>
                  <div className="p-2 space-y-2 flex-1 overflow-y-auto">
                    {colVisits.map((v) => (
                      <div key={v.id} className="p-3 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1.5">
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="font-mono text-slate-400">{v.mrn}</span>
                          <span className="font-bold text-red-600">{v.priority === 'URGENT' ? 'URGENT' : ''}</span>
                        </div>
                        <h4 className="font-semibold text-xs text-slate-900 dark:text-white">{v.patientName}</h4>
                        <p className="text-[11px] text-slate-500 line-clamp-2">{v.chiefComplaint}</p>
                        <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
                          <button
                            type="button"
                            onClick={() => setSelectedVisitForHandshake(v)}
                            className="text-[10px] font-bold text-purple-600 hover:underline flex items-center gap-0.5"
                          >
                            <FileSignature className="w-3 h-3" /> Sign-off
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Handshake Signature Modal */}
      <HandshakeSignatureModal
        isOpen={!!selectedVisitForHandshake}
        onClose={() => setSelectedVisitForHandshake(null)}
        visit={selectedVisitForHandshake}
        onSuccess={handleHandshakeSuccess}
      />
    </div>
  );
}
