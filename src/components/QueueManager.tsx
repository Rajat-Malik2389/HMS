import React from 'react';
import {
  Search,
  Filter,
  LayoutList,
  Kanban,
  FileSignature,
  Eye,
  ArrowRight,
  Clock,
  Heart,
  Thermometer,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  Copy,
  Check,
} from 'lucide-react';
import { Doctor, Patient, PatientStatus, PriorityLevel, QueueFilterState } from '../types';
import { formatMinutesWait } from '../utils/trackerLogic';
import { DEPARTMENTS } from '../data/mockClinicalData';

interface QueueManagerProps {
  patients: Patient[];
  doctors: Doctor[];
  filters: QueueFilterState;
  onChangeFilters: (filters: Partial<QueueFilterState>) => void;
  onOpenPatientDetail: (patient: Patient) => void;
  onOpenSignoff: (patient: Patient) => void;
  onAdvanceStatus: (patient: Patient) => void;
  viewMode: 'list' | 'board';
  onChangeViewMode: (mode: 'list' | 'board') => void;
}

export const QueueManager: React.FC<QueueManagerProps> = ({
  patients,
  doctors,
  filters,
  onChangeFilters,
  onOpenPatientDetail,
  onOpenSignoff,
  onAdvanceStatus,
  viewMode,
  onChangeViewMode,
}) => {
  const [copiedToken, setCopiedToken] = React.useState<string | null>(null);

  const handleCopyToken = (e: React.MouseEvent, token: string) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(token);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const getDoctor = (id?: string) => doctors.find((d) => d.id === id);

  const getPriorityBadge = (priority: PriorityLevel) => {
    switch (priority) {
      case 'urgent':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-800 border border-red-200 dark:bg-red-950/80 dark:text-red-300 dark:border-red-800">
            <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping" />
            URGENT
          </span>
        );
      case 'normal':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-800">
            NORMAL
          </span>
        );
      case 'low':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-100 text-blue-800 border border-blue-200 dark:bg-blue-950/80 dark:text-blue-300 dark:border-blue-800">
            LOW PRIORITY
          </span>
        );
    }
  };

  const getStatusBadge = (status: PatientStatus) => {
    switch (status) {
      case 'waiting':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            <Clock className="w-3 h-3 text-slate-500" />
            Waiting
          </span>
        );
      case 'in_triage':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <Thermometer className="w-3 h-3 text-amber-600" />
            In Triage
          </span>
        );
      case 'in_consultation':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
            <UserCheck className="w-3 h-3 text-indigo-600" />
            In Consult
          </span>
        );
      case 'ready_for_signoff':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800 animate-pulse">
            <FileSignature className="w-3 h-3 text-purple-600" />
            Ready for Sign-off
          </span>
        );
      case 'discharged':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            Discharged & Sealed
          </span>
        );
    }
  };

  const statusColumns: { status: PatientStatus; title: string; color: string }[] = [
    { status: 'waiting', title: 'Waiting Room', color: 'border-slate-300' },
    { status: 'in_triage', title: 'Triage Assessment', color: 'border-amber-400' },
    { status: 'in_consultation', title: 'Doctor Consultation', color: 'border-indigo-400' },
    { status: 'ready_for_signoff', title: 'Pending Sign-Off', color: 'border-purple-400' },
    { status: 'discharged', title: 'Completed & Discharged', color: 'border-emerald-400' },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
      {/* Search & Comprehensive Multi-Filter Bar */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={filters.searchQuery}
              onChange={(e) => onChangeFilters({ searchQuery: e.target.value })}
              placeholder="Search by Patient Name, MRN, Token, Chief Complaint..."
              aria-label="Search patients"
              className="w-full pl-9 pr-4 py-2 text-xs md:text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white placeholder-slate-400"
            />
            {filters.searchQuery && (
              <button
                type="button"
                onClick={() => onChangeFilters({ searchQuery: '' })}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                Clear
              </button>
            )}
          </div>

          {/* View Toggles & Sorting */}
          <div className="flex flex-wrap items-center gap-2">
            {/* View Switcher */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => onChangeViewMode('list')}
                aria-label="List view"
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <LayoutList className="w-3.5 h-3.5" />
                <span>List View</span>
              </button>
              <button
                type="button"
                onClick={() => onChangeViewMode('board')}
                aria-label="Kanban board view"
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  viewMode === 'board'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Kanban className="w-3.5 h-3.5" />
                <span>Flow Pipeline</span>
              </button>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1 text-xs">
              <label htmlFor="sortBySelect" className="text-slate-500 font-medium hidden sm:inline">Sort:</label>
              <select
                id="sortBySelect"
                value={filters.sortBy}
                onChange={(e) => onChangeFilters({ sortBy: e.target.value as QueueFilterState['sortBy'] })}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-500"
              >
                <option value="waitTime_desc">Wait Time (Longest first)</option>
                <option value="waitTime_asc">Wait Time (Shortest first)</option>
                <option value="priority_urgent">Priority (Urgent first)</option>
                <option value="name_asc">Patient Name (A-Z)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Filter Pills row */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <span className="text-slate-400 font-medium flex items-center gap-1 mr-1">
            <Filter className="w-3 h-3" />
            Filters:
          </span>

          {/* Priority Filter */}
          <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-0.5">
            {(['all', 'urgent', 'normal', 'low'] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => onChangeFilters({ priority: p })}
                className={`px-2.5 py-1 rounded-md capitalize font-medium transition-colors ${
                  filters.priority === p
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                {p === 'all' ? 'All Priorities' : p}
              </button>
            ))}
          </div>

          {/* Department Filter */}
          <select
            value={filters.department}
            onChange={(e) => onChangeFilters({ department: e.target.value })}
            aria-label="Filter by department"
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg px-2.5 py-1 text-xs"
          >
            <option value="all">All Departments</option>
            {DEPARTMENTS.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>

          {/* Doctor Filter */}
          <select
            value={filters.doctorId}
            onChange={(e) => onChangeFilters({ doctorId: e.target.value })}
            aria-label="Filter by doctor"
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg px-2.5 py-1 text-xs"
          >
            <option value="all">All Doctors</option>
            {doctors.map((doc) => (
              <option key={doc.id} value={doc.id}>
                {doc.name}
              </option>
            ))}
          </select>

          {/* Clear Filters Reset */}
          {(filters.priority !== 'all' ||
            filters.status !== 'all' ||
            filters.department !== 'all' ||
            filters.doctorId !== 'all' ||
            filters.searchQuery !== '') && (
            <button
              type="button"
              onClick={() =>
                onChangeFilters({
                  searchQuery: '',
                  status: 'all',
                  priority: 'all',
                  department: 'all',
                  doctorId: 'all',
                })
              }
              className="text-blue-600 dark:text-blue-400 hover:underline font-medium ml-auto"
            >
              Reset all filters
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area: List View vs Board View */}
      {patients.length === 0 ? (
        <div className="py-16 px-4 text-center">
          <ShieldAlert className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            No patients match current filters
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            Try adjusting your search criteria, priority filter, or click 'Reset all filters' above.
          </p>
        </div>
      ) : viewMode === 'list' ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs md:text-sm">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Patient & MRN</th>
                <th className="py-3 px-4">Priority & Triage</th>
                <th className="py-3 px-4">Chief Complaint & Vitals</th>
                <th className="py-3 px-4">Doctor & Department</th>
                <th className="py-3 px-4">Wait Time</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {patients.map((patient) => {
                const assignedDoctor = getDoctor(patient.assignedDoctorId);
                const isUrgent = patient.priority === 'urgent';

                return (
                  <tr
                    key={patient.id}
                    onClick={() => onOpenPatientDetail(patient)}
                    className={`hover:bg-blue-50/50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors ${
                      isUrgent && patient.status !== 'discharged' ? 'bg-red-50/30 dark:bg-red-950/20' : ''
                    }`}
                  >
                    {/* Patient & MRN */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold text-slate-700 dark:text-slate-200 text-xs shrink-0">
                          {patient.fullName
                            .split(' ')
                            .map((n) => n[0])
                            .slice(0, 2)
                            .join('')}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <span>{patient.fullName}</span>
                            <span className="text-[11px] font-normal text-slate-400">
                              ({patient.age}y • {patient.gender[0]})
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="font-mono text-[10px] text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded">
                              {patient.mrn}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => handleCopyToken(e, patient.patientHandshakeToken)}
                              title="Handshake Verification Token (click to copy)"
                              className="font-mono text-[10px] text-blue-600 dark:text-blue-400 hover:text-blue-700 flex items-center gap-0.5"
                            >
                              {copiedToken === patient.patientHandshakeToken ? (
                                <Check className="w-2.5 h-2.5 text-emerald-500" />
                              ) : (
                                <Copy className="w-2.5 h-2.5" />
                              )}
                              <span>{patient.patientHandshakeToken}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Priority & Triage */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <div>{getPriorityBadge(patient.priority)}</div>
                        <div className="text-[10px] text-slate-500 font-medium">
                          {patient.triageTag}
                        </div>
                      </div>
                    </td>

                    {/* Chief Complaint & Vitals */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="text-slate-800 dark:text-slate-200 font-medium truncate" title={patient.chiefComplaint}>
                        {patient.chiefComplaint}
                      </p>
                      <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1 font-mono">
                        <span className="flex items-center gap-1" title="Blood Pressure">
                          <ActivityIcon className="w-3 h-3 text-rose-500" />
                          {patient.vitals.bp}
                        </span>
                        <span className="flex items-center gap-1" title="Heart Rate">
                          <Heart className="w-3 h-3 text-red-500" />
                          {patient.vitals.heartRate} bpm
                        </span>
                        <span className="flex items-center gap-1" title="SpO2">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                          {patient.vitals.spo2}% O₂
                        </span>
                      </div>
                    </td>

                    {/* Doctor & Department */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="text-slate-800 dark:text-slate-200 font-medium">
                        {assignedDoctor ? assignedDoctor.name : <span className="text-slate-400 italic">Unassigned</span>}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {patient.department}
                      </div>
                    </td>

                    {/* Wait Time */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-mono font-medium">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{formatMinutesWait(patient.waitTimeMinutes)}</span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {getStatusBadge(patient.status)}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="inline-flex items-center gap-1.5">
                        {/* Quick Sign-off button */}
                        {patient.status !== 'discharged' && (
                          <button
                            type="button"
                            onClick={() => onOpenSignoff(patient)}
                            aria-label={`Open sign-off for ${patient.fullName}`}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                              patient.status === 'ready_for_signoff'
                                ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-xs animate-pulse'
                                : 'bg-slate-100 hover:bg-purple-50 text-slate-700 hover:text-purple-700 dark:bg-slate-800 dark:text-slate-300'
                            }`}
                          >
                            <FileSignature className="w-3.5 h-3.5" />
                            <span>Sign-Off</span>
                          </button>
                        )}

                        {/* Advance Stage button */}
                        {patient.status !== 'discharged' && patient.status !== 'ready_for_signoff' && (
                          <button
                            type="button"
                            onClick={() => onAdvanceStatus(patient)}
                            title="Advance to next clinical stage"
                            aria-label={`Advance stage for ${patient.fullName}`}
                            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-blue-600 transition-colors"
                          >
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        )}

                        {/* Patient details */}
                        <button
                          type="button"
                          onClick={() => onOpenPatientDetail(patient)}
                          aria-label={`View details of ${patient.fullName}`}
                          className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* Flow Pipeline / Kanban Board */
        <div className="p-4 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3.5 overflow-x-auto">
          {statusColumns.map((col) => {
            const columnPatients = patients.filter((p) => p.status === col.status);

            return (
              <div
                key={col.status}
                className="bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col min-h-[420px]"
              >
                {/* Column Header */}
                <div className={`p-3 border-t-4 ${col.color} border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 rounded-t-lg`}>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 tracking-tight">
                    {col.title}
                  </h4>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 font-semibold text-slate-600 dark:text-slate-300">
                    {columnPatients.length}
                  </span>
                </div>

                {/* Column Cards */}
                <div className="p-2 space-y-2.5 flex-1 overflow-y-auto max-h-[640px]">
                  {columnPatients.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-xs">
                      No patients in this stage
                    </div>
                  ) : (
                    columnPatients.map((patient) => {
                      const doc = getDoctor(patient.assignedDoctorId);

                      return (
                        <div
                          key={patient.id}
                          onClick={() => onOpenPatientDetail(patient)}
                          className={`p-3 bg-white dark:bg-slate-900 rounded-xl border transition-all cursor-pointer shadow-xs hover:shadow-md ${
                            patient.priority === 'urgent' && patient.status !== 'discharged'
                              ? 'border-red-300 dark:border-red-900 ring-1 ring-red-400/30'
                              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1 mb-1.5">
                            <span className="text-[10px] font-mono text-slate-400">
                              {patient.mrn}
                            </span>
                            {getPriorityBadge(patient.priority)}
                          </div>

                          <h5 className="font-semibold text-xs text-slate-900 dark:text-white">
                            {patient.fullName}
                          </h5>

                          <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">
                            {patient.chiefComplaint}
                          </p>

                          <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatMinutesWait(patient.waitTimeMinutes)}
                            </span>
                            <span className="text-slate-600 dark:text-slate-300 font-sans font-medium truncate max-w-[90px]">
                              {doc ? doc.name.split(',')[0] : 'Unassigned'}
                            </span>
                          </div>

                          {/* Quick Board Actions */}
                          <div
                            className="mt-2.5 pt-1.5 flex items-center justify-between gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {col.status !== 'discharged' && (
                              <button
                                type="button"
                                onClick={() => onOpenSignoff(patient)}
                                className="w-full text-center py-1 px-2 rounded bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-[10px] font-semibold flex items-center justify-center gap-1 transition-colors"
                              >
                                <FileSignature className="w-3 h-3" />
                                <span>Sign-Off</span>
                              </button>
                            )}

                            {col.status !== 'discharged' && col.status !== 'ready_for_signoff' && (
                              <button
                                type="button"
                                onClick={() => onAdvanceStatus(patient)}
                                title="Advance Stage"
                                aria-label={`Advance ${patient.fullName} to next stage`}
                                className="p-1 rounded bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 transition-colors"
                              >
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// Subtle icon wrapper
function ActivityIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}
