import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Clock,
  Heart,
  Thermometer,
  ShieldCheck,
  FileSignature,
  FileText,
  Save,
  CheckCircle2,
  Stethoscope,
  Copy,
  Check,
  Activity,
  AlertTriangle,
} from 'lucide-react';
import { Doctor, Patient, PatientStatus, PriorityLevel } from '../types';
import { QRCodeView } from './QRCodeView';
import { formatMinutesWait } from '../utils/trackerLogic';
import { DEPARTMENTS } from '../data/mockClinicalData';

interface PatientDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient | null;
  doctors: Doctor[];
  onUpdatePatient: (updatedPatient: Patient) => void;
  onOpenSignoff: (patient: Patient) => void;
}

export const PatientDetailModal: React.FC<PatientDetailModalProps> = ({
  isOpen,
  onClose,
  patient,
  doctors,
  onUpdatePatient,
  onOpenSignoff,
}) => {
  const [copiedToken, setCopiedToken] = useState(false);
  const [status, setStatus] = useState<PatientStatus>('waiting');
  const [priority, setPriority] = useState<PriorityLevel>('normal');
  const [assignedDoctorId, setAssignedDoctorId] = useState('');
  const [department, setDepartment] = useState('');
  const [notes, setNotes] = useState('');
  const [isSavedToast, setIsSavedToast] = useState(false);

  useEffect(() => {
    if (patient) {
      setStatus(patient.status);
      setPriority(patient.priority);
      setAssignedDoctorId(patient.assignedDoctorId || '');
      setDepartment(patient.department);
      setNotes(patient.notes || '');
      setIsSavedToast(false);
    }
  }, [patient]);

  if (!isOpen || !patient) return null;

  const handleCopy = () => {
    navigator.clipboard?.writeText(patient.patientHandshakeToken);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  const handleSaveChanges = () => {
    const updated: Patient = {
      ...patient,
      status,
      priority,
      assignedDoctorId: assignedDoctorId || undefined,
      department,
      notes,
    };
    onUpdatePatient(updated);
    setIsSavedToast(true);
    setTimeout(() => setIsSavedToast(false), 2500);
  };

  const assignedDoc = doctors.find((d) => d.id === assignedDoctorId);

  // Timeline stages
  const timelineStages = [
    { label: 'Check-in & Intake', completed: true, active: false },
    { label: 'Clinical Triage', completed: status !== 'waiting', active: status === 'in_triage' },
    {
      label: 'Doctor Consultation',
      completed: status === 'ready_for_signoff' || status === 'discharged',
      active: status === 'in_consultation',
    },
    {
      label: 'Two-Party Sign-Off',
      completed: status === 'discharged',
      active: status === 'ready_for_signoff',
    },
    { label: 'Discharged & Sealed', completed: status === 'discharged', active: status === 'discharged' },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="patient-detail-title"
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-md">
              {patient.fullName
                .split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="patient-detail-title" className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  {patient.fullName}
                </h2>
                <span className="text-xs text-slate-500">
                  ({patient.age}y • {patient.gender})
                </span>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {patient.mrn}
                </span>
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-2">
                <span>Checked In: {new Date(patient.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                <span>•</span>
                <span>Wait Time: {formatMinutesWait(patient.waitTimeMinutes)}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Timeline Progression */}
        <div className="px-5 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between relative">
            <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-slate-200 dark:bg-slate-800 z-0" />
            {timelineStages.map((stg, i) => (
              <div key={i} className="relative z-10 flex flex-col items-center">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all ${
                    stg.completed
                      ? 'bg-emerald-600 border-emerald-600 text-white'
                      : stg.active
                      ? 'bg-blue-600 border-blue-600 text-white ring-4 ring-blue-100 dark:ring-blue-900/50'
                      : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-400'
                  }`}
                >
                  {stg.completed ? '✓' : i + 1}
                </div>
                <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400 mt-1 hidden sm:inline">
                  {stg.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Scroll Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs sm:text-sm">
          {isSavedToast && (
            <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-1.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Patient record updated successfully.</span>
            </div>
          )}

          {/* Vitals Ribbon */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="space-y-0.5">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Blood Pressure</span>
              <p className="font-mono font-bold text-slate-800 dark:text-slate-200 text-sm">
                {patient.vitals.bp}
              </p>
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Heart Rate</span>
              <p className="font-mono font-bold text-red-600 dark:text-red-400 text-sm flex items-center gap-1">
                <Heart className="w-3.5 h-3.5 fill-red-500/20" />
                {patient.vitals.heartRate} bpm
              </p>
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Oxygen (SpO₂)</span>
              <p className="font-mono font-bold text-cyan-600 dark:text-cyan-400 text-sm">
                {patient.vitals.spo2}%
              </p>
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Temperature</span>
              <p className="font-mono font-bold text-slate-800 dark:text-slate-200 text-sm">
                {patient.vitals.temp} °F
              </p>
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Pain Scale</span>
              <p className="font-mono font-bold text-amber-600 dark:text-amber-400 text-sm">
                {patient.vitals.painScore ?? 'N/A'} / 10
              </p>
            </div>
          </div>

          {/* Chief Complaint */}
          <div className="bg-slate-50 dark:bg-slate-800/30 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
            <span className="text-[11px] font-bold uppercase text-slate-500 tracking-wider block mb-1">
              Chief Complaint & Reason For Visit
            </span>
            <p className="font-medium text-slate-800 dark:text-slate-200">
              {patient.chiefComplaint}
            </p>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-[11px] font-medium text-slate-500">Triage Tag:</span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                {patient.triageTag}
              </span>
            </div>
          </div>

          {/* Handshake Token & QR Preview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 p-3.5 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-blue-900 dark:text-blue-300 uppercase">
                    Handshake Intake Token
                  </span>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-mono"
                  >
                    {copiedToken ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedToken ? 'Copied' : 'Copy Token'}</span>
                  </button>
                </div>
                <div className="text-xl font-bold font-mono text-blue-800 dark:text-blue-200">
                  {patient.patientHandshakeToken}
                </div>
                <p className="text-[11px] text-blue-700/80 dark:text-blue-300/80 mt-1">
                  Matched against patient's wristband or mobile pass during two-party doctor sign-off.
                </p>
              </div>

              {patient.consentSigned && (
                <div className="mt-3 pt-2 border-t border-blue-200 dark:border-blue-800/60 flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Digital Care Consent Signed at Check-in</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-center p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <QRCodeView
                value={`PATIENT-TOKEN:${patient.patientHandshakeToken}`}
                size={90}
                label={patient.mrn}
              />
            </div>
          </div>

          {/* Clinical Management Controls */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-3">
            <span className="text-[11px] font-bold uppercase text-slate-500 tracking-wider block">
              Manage Queue Status & Care Team
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Encounter Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as PatientStatus)}
                  className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                >
                  <option value="waiting">Waiting Room</option>
                  <option value="in_triage">In Triage</option>
                  <option value="in_consultation">In Consultation</option>
                  <option value="ready_for_signoff">Ready for Sign-Off</option>
                  <option value="discharged">Discharged & Sealed</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Priority Urgency
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as PriorityLevel)}
                  className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                >
                  <option value="urgent">Urgent</option>
                  <option value="normal">Normal</option>
                  <option value="low">Low</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Assigned Attending
                </label>
                <select
                  value={assignedDoctorId}
                  onChange={(e) => setAssignedDoctorId(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                >
                  <option value="">Unassigned</option>
                  {doctors.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Clinical Observation Notes
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Triage observations, test orders, nursing handover notes..."
                className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
              />
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900">
          <button
            type="button"
            onClick={handleSaveChanges}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Record Updates</span>
          </button>

          <div className="flex items-center gap-2">
            {patient.status !== 'discharged' && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenSignoff(patient);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-sm transition-all"
              >
                <FileSignature className="w-3.5 h-3.5" />
                <span>Open Two-Party Sign-Off</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
