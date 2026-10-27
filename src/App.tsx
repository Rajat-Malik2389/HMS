/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { MetricsOverview } from './components/MetricsOverview';
import { QueueManager } from './components/QueueManager';
import { HandshakeIntakeModal } from './components/HandshakeIntakeModal';
import { SignoffModal } from './components/SignoffModal';
import { PatientDetailModal } from './components/PatientDetailModal';
import { WelcomeGuideModal } from './components/WelcomeGuideModal';
import { INITIAL_PATIENTS, DOCTORS } from './data/mockClinicalData';
import { Doctor, Patient, PatientStatus, PriorityLevel, QueueFilterState, SignoffRecord } from './types';
import { computeQueueMetrics, filterAndSortPatients } from './utils/trackerLogic';
import { CheckCircle2, ShieldCheck, UserPlus, Info } from 'lucide-react';

export default function App() {
  const [patients, setPatients] = useState<Patient[]>(INITIAL_PATIENTS);
  const [doctors] = useState<Doctor[]>(DOCTORS);

  // Filters State
  const [filters, setFilters] = useState<QueueFilterState>({
    searchQuery: '',
    status: 'all',
    priority: 'all',
    department: 'all',
    doctorId: 'all',
    sortBy: 'waitTime_desc',
  });

  // UI View Mode (List Table vs Kanban Board)
  const [viewMode, setViewMode] = useState<'list' | 'board'>('list');

  // Modals & First-Time User Welcome Guide
  const [isWelcomeOpen, setIsWelcomeOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('handshake_welcome_dismissed') !== 'true';
    }
    return true;
  });
  const [isIntakeOpen, setIsIntakeOpen] = useState(false);
  const [selectedPatientForDetail, setSelectedPatientForDetail] = useState<Patient | null>(null);
  const [selectedPatientForSignoff, setSelectedPatientForSignoff] = useState<Patient | null>(null);

  const handleDismissWelcomeForever = (doNotShowAgain: boolean) => {
    if (doNotShowAgain && typeof window !== 'undefined') {
      localStorage.setItem('handshake_welcome_dismissed', 'true');
    }
  };

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Live Queue Metrics
  const metrics = useMemo(() => computeQueueMetrics(patients), [patients]);

  // Filtered and Sorted Patient List
  const filteredPatients = useMemo(
    () => filterAndSortPatients(patients, filters),
    [patients, filters]
  );

  // Intake Completion Handler
  const handleCompleteIntake = (newPatient: Patient) => {
    setPatients((prev) => [newPatient, ...prev]);
    showToast(`Checked in: ${newPatient.fullName} (${newPatient.patientHandshakeToken})`, 'success');
  };

  // Patient Record Update Handler
  const handleUpdatePatient = (updatedPatient: Patient) => {
    setPatients((prev) =>
      prev.map((p) => (p.id === updatedPatient.id ? updatedPatient : p))
    );
    setSelectedPatientForDetail(updatedPatient);
  };

  // Quick Advance Status Handler
  const handleAdvanceStatus = (patient: Patient) => {
    const sequence: Record<PatientStatus, PatientStatus> = {
      waiting: 'in_triage',
      in_triage: 'in_consultation',
      in_consultation: 'ready_for_signoff',
      ready_for_signoff: 'ready_for_signoff',
      discharged: 'discharged',
    };

    const nextStatus = sequence[patient.status];
    if (nextStatus && nextStatus !== patient.status) {
      const updated: Patient = { ...patient, status: nextStatus };
      setPatients((prev) => prev.map((p) => (p.id === patient.id ? updated : p)));
      showToast(`${patient.fullName} advanced to ${nextStatus.replace('_', ' ')}`, 'info');
    }
  };

  // Signoff Completion Handler
  const handleCompleteSignoff = (patientId: string, signoffRecord: SignoffRecord) => {
    setPatients((prev) =>
      prev.map((p) => {
        if (p.id === patientId) {
          return {
            ...p,
            status: 'discharged',
            signoffRecord,
          };
        }
        return p;
      })
    );
    showToast(`Two-party cryptographic sign-off sealed for ${signoffRecord.patientToken}`, 'success');
  };

  // Reset to default demo data
  const handleResetDemoData = () => {
    setPatients(INITIAL_PATIENTS);
    setFilters({
      searchQuery: '',
      status: 'all',
      priority: 'all',
      department: 'all',
      doctorId: 'all',
      sortBy: 'waitTime_desc',
    });
    showToast('Reset clinic flow to default state', 'info');
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-blue-500 selection:text-white">
      {/* Top Header */}
      <Header
        urgentCount={metrics.urgentCount}
        onOpenIntake={() => setIsIntakeOpen(true)}
        onOpenGuide={() => setIsWelcomeOpen(true)}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">
        {/* KPI Metrics Dashboard & Alert Ribbon */}
        <MetricsOverview
          metrics={metrics}
          onSelectFilter={(status, priority) => {
            setFilters((prev) => ({
              ...prev,
              status,
              priority,
            }));
          }}
          activeStatusFilter={filters.status}
          activePriorityFilter={filters.priority}
        />

        {/* Dynamic Queue & Flow Management Table/Board */}
        <section aria-label="Queue Management">
          <QueueManager
            patients={filteredPatients}
            doctors={doctors}
            filters={filters}
            onChangeFilters={(newFilters) =>
              setFilters((prev) => ({ ...prev, ...newFilters }))
            }
            onOpenPatientDetail={(patient) => setSelectedPatientForDetail(patient)}
            onOpenSignoff={(patient) => setSelectedPatientForSignoff(patient)}
            onAdvanceStatus={handleAdvanceStatus}
            viewMode={viewMode}
            onChangeViewMode={setViewMode}
          />
        </section>

        {/* Footer info note */}
        <footer className="pt-2 pb-6 text-center text-xs text-slate-400 font-mono flex flex-col sm:flex-row items-center justify-between border-t border-slate-200 dark:border-slate-800 gap-2">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>HMS Protocol: Compliant with Electronic Signatures in Global & National Commerce Act (E-SIGN)</span>
          </div>
          <div>
            System Active: {patients.length} Total Registered Records
          </div>
        </footer>
      </main>

      {/* First-time User Onboarding & Feature Welcome Guide */}
      <WelcomeGuideModal
        isOpen={isWelcomeOpen}
        onClose={() => setIsWelcomeOpen(false)}
        onStartIntake={() => {
          setIsWelcomeOpen(false);
          setIsIntakeOpen(true);
        }}
        onDismissForever={handleDismissWelcomeForever}
      />

      {/* Modals */}
      <HandshakeIntakeModal
        isOpen={isIntakeOpen}
        onClose={() => setIsIntakeOpen(false)}
        onCompleteIntake={handleCompleteIntake}
        doctors={doctors}
      />

      <SignoffModal
        isOpen={!!selectedPatientForSignoff}
        onClose={() => setSelectedPatientForSignoff(null)}
        patient={selectedPatientForSignoff}
        doctors={doctors}
        onCompleteSignoff={handleCompleteSignoff}
      />

      <PatientDetailModal
        isOpen={!!selectedPatientForDetail}
        onClose={() => setSelectedPatientForDetail(null)}
        patient={selectedPatientForDetail}
        doctors={doctors}
        onUpdatePatient={handleUpdatePatient}
        onOpenSignoff={(patient) => {
          setSelectedPatientForDetail(null);
          setSelectedPatientForSignoff(patient);
        }}
      />

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-xl shadow-xl border bg-slate-900 text-white border-slate-700 text-xs font-medium animate-in slide-in-from-bottom-5 duration-200"
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <Info className="w-4 h-4 text-blue-400 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}
    </div>
  );
}
