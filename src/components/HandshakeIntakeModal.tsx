import React, { useState, useEffect } from 'react';
import {
  X,
  QrCode,
  Camera,
  FileText,
  User,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  CheckCircle2,
  ScanLine,
  RefreshCw,
} from 'lucide-react';
import { Doctor, Patient, PriorityLevel, Vitals } from '../types';
import { SignaturePad } from './SignaturePad';
import { QRCodeView } from './QRCodeView';
import { assessTriage } from '../utils/trackerLogic';
import { DEPARTMENTS } from '../data/mockClinicalData';

interface HandshakeIntakeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCompleteIntake: (newPatient: Patient) => void;
  doctors: Doctor[];
}

export const HandshakeIntakeModal: React.FC<HandshakeIntakeModalProps> = ({
  isOpen,
  onClose,
  onCompleteIntake,
  doctors,
}) => {
  const [activeTab, setActiveTab] = useState<'scan' | 'qr_mobile' | 'form'>('scan');

  // Form State
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState<number | ''>('');
  const [gender, setGender] = useState<Patient['gender']>('Female');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('Emergency & Trauma');
  const [assignedDoctorId, setAssignedDoctorId] = useState('');
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [bp, setBp] = useState('124/80');
  const [heartRate, setHeartRate] = useState<number | ''>(76);
  const [spo2, setSpo2] = useState<number | ''>(98);
  const [temp, setTemp] = useState<number | ''>(98.6);
  const [painScore, setPainScore] = useState<number>(3);
  const [consentSignature, setConsentSignature] = useState('');
  const [formError, setFormError] = useState('');

  // Scanner Simulator State
  const [isScanning, setIsScanning] = useState(true);
  const [scannedCardType, setScannedCardType] = useState<string | null>(null);

  // Mobile Handshake Token
  const [generatedKioskToken] = useState(() => `HSK-${Math.floor(1000 + Math.random() * 9000)}`);

  // Reset or initialize on open
  useEffect(() => {
    if (isOpen) {
      setFormError('');
      setIsScanning(true);
      setScannedCardType(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Auto-calculated triage assessment in real-time
  const currentVitals: Vitals = {
    bp: bp || '120/80',
    heartRate: Number(heartRate) || 75,
    spo2: Number(spo2) || 98,
    temp: Number(temp) || 98.6,
    painScore,
  };
  const liveTriage = assessTriage(currentVitals, chiefComplaint);

  // Preset quick scans for simulation
  const handleSimulateCardScan = (preset: 'card_sarah' | 'card_robert' | 'qr_mobile_patient') => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);

      if (preset === 'card_sarah') {
        setScannedCardType('Health Insurance Card: Sarah Jenkins (DOB: 1988-04-12)');
        setFullName('Sarah Jenkins');
        setAge(36);
        setGender('Female');
        setPhone('(555) 712-4491');
        setChiefComplaint('Sudden onset allergic urticaria and periorbital edema after seafood');
        setDepartment('Emergency & Trauma');
        setBp('118/76');
        setHeartRate(92);
        setSpo2(97);
        setTemp(98.8);
        setPainScore(4);
      } else if (preset === 'card_robert') {
        setScannedCardType('Driver License & Card: Robert Callahan (DOB: 1962-09-03)');
        setFullName('Robert Callahan');
        setAge(62);
        setGender('Male');
        setPhone('(555) 304-9988');
        setChiefComplaint('Acute severe chest pressure, diaphoresis, and shortness of breath');
        setDepartment('Cardiology');
        setBp('168/102');
        setHeartRate(114);
        setSpo2(91);
        setTemp(99.0);
        setPainScore(9);
      } else {
        setScannedCardType('Mobile App Check-in Handshake: Maya Patel');
        setFullName('Maya Patel');
        setAge(24);
        setGender('Female');
        setPhone('(555) 887-2190');
        setChiefComplaint('Right wrist swelling and deformity after bicycle fall');
        setDepartment('Orthopedics');
        setBp('122/80');
        setHeartRate(80);
        setSpo2(99);
        setTemp(98.4);
        setPainScore(6);
      }
      setActiveTab('form');
    }, 900);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setFormError('Please enter the patient full name.');
      return;
    }
    if (!age || Number(age) <= 0) {
      setFormError('Please enter a valid patient age.');
      return;
    }
    if (!chiefComplaint.trim()) {
      setFormError('Please describe the chief complaint / reason for visit.');
      return;
    }
    if (!consentSignature) {
      setFormError('Patient or guardian digital consent signature is required for check-in handshake.');
      return;
    }

    const newPatient: Patient = {
      id: `pat-${Date.now()}`,
      mrn: `MRN-${Math.floor(80000 + Math.random() * 19999)}`,
      fullName: fullName.trim(),
      age: Number(age),
      gender,
      phone: phone || '(555) 000-0000',
      checkInTime: new Date().toISOString(),
      waitTimeMinutes: 1,
      priority: liveTriage.priority,
      triageTag: liveTriage.tag,
      chiefComplaint: chiefComplaint.trim(),
      department,
      assignedDoctorId: assignedDoctorId || undefined,
      status: 'waiting',
      vitals: currentVitals,
      consentSigned: true,
      consentSignatureDataUrl: consentSignature,
      patientHandshakeToken: generatedKioskToken,
      notes: `Intake registered via Handshake system. Initial triage: ${liveTriage.tag}.`,
    };

    onCompleteIntake(newPatient);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="intake-modal-title"
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-teal-500 flex items-center justify-center text-white shadow-md">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h2 id="intake-modal-title" className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Digital Handshake & Intake Check-In
              </h2>
              <p className="text-xs text-slate-500">
                Interactive optical scanner, contactless QR sync, and electronic consent signature
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

        {/* Sub-Navigation Tabs */}
        <div className="px-5 pt-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('scan')}
            className={`pb-3 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-all ${
              activeTab === 'scan'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Optical Scanner Simulator</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('qr_mobile')}
            className={`pb-3 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-all ${
              activeTab === 'qr_mobile'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Mobile Handshake QR</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('form')}
            className={`pb-3 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-all ${
              activeTab === 'form'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Intake Vitals & Signature</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {formError && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* TAB 1: Optical Scanner Simulator */}
          {activeTab === 'scan' && (
            <div className="space-y-4">
              <div className="relative rounded-2xl bg-slate-950 p-4 border border-slate-800 overflow-hidden shadow-inner flex flex-col items-center justify-center min-h-[260px]">
                {/* Simulated Camera Feed Grid */}
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]" />

                {/* Camera Viewfinder Reticle */}
                <div className="relative w-64 h-48 border-2 border-dashed border-teal-400/70 rounded-xl flex flex-col items-center justify-center p-3 text-center">
                  {/* Glowing Laser Scan Bar */}
                  <div
                    className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_12px_rgba(34,211,238,0.8)] pointer-events-none animate-pulse"
                  />

                  <ScanLine className="w-10 h-10 text-cyan-400 mb-2 animate-pulse" />
                  <p className="text-xs font-mono text-cyan-200 font-semibold">
                    {isScanning ? 'ALIGN PATIENT QR / ID CARD' : 'DOCUMENT CAPTURED'}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Hold QR code or medical ID card steady within frame
                  </p>
                </div>

                <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    CAM-01 OPTICAL HUD ACTIVE
                  </span>
                  <span>ISO 1600 • 60 FPS</span>
                </div>
              </div>

              {/* Sample Card Scanner Triggers */}
              <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                  Simulate Camera Card & QR Scans (Click to auto-populate):
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleSimulateCardScan('card_sarah')}
                    className="p-2 text-left bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-blue-400 hover:bg-blue-50/50 transition-all text-xs"
                  >
                    <p className="font-semibold text-slate-900 dark:text-white">Sarah Jenkins (36y)</p>
                    <p className="text-[10px] text-slate-500">Allergic Reaction • Insurance Card</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSimulateCardScan('card_robert')}
                    className="p-2 text-left bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-red-400 hover:bg-red-50/50 transition-all text-xs"
                  >
                    <p className="font-semibold text-red-600 dark:text-red-400">Robert Callahan (62y)</p>
                    <p className="text-[10px] text-slate-500">Urgent Chest Pain • Driver's License</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSimulateCardScan('qr_mobile_patient')}
                    className="p-2 text-left bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-teal-400 hover:bg-teal-50/50 transition-all text-xs"
                  >
                    <p className="font-semibold text-teal-600 dark:text-teal-400">Maya Patel (24y)</p>
                    <p className="text-[10px] text-slate-500">Wrist Injury • Mobile QR Check-in</p>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Mobile Handshake QR */}
          {activeTab === 'qr_mobile' && (
            <div className="flex flex-col items-center justify-center py-4 space-y-4 text-center">
              <QRCodeView
                value={`HANDSHAKE-INTAKE-SESSION:${generatedKioskToken}`}
                size={200}
                label={`HANDSHAKE TOKEN: ${generatedKioskToken}`}
                sublabel="Scan with phone camera to complete check-in kiosk flow"
              />

              <div className="max-w-md bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl p-3 text-xs text-blue-800 dark:text-blue-300">
                <p className="font-semibold mb-1">Contactless Patient Handshake Flow</p>
                <p className="text-[11px] text-blue-700 dark:text-blue-300">
                  Patients scan this QR code on their personal smartphone to submit demographics, upload insurance, and sign digital consent before arriving at the triage station.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setFullName('Kiosk Smartphone Patient');
                  setAge(31);
                  setGender('Other');
                  setChiefComplaint('Acute earache and sinus congestion');
                  setActiveTab('form');
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm"
              >
                <span>Simulate Completed Phone Scan</span>
              </button>
            </div>
          )}

          {/* TAB 3: Intake Form & Digital Signature */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {scannedCardType && (
              <div className="p-2.5 rounded-lg bg-teal-50 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-300 text-xs flex items-center justify-between">
                <span className="font-medium flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                  Auto-populated from {scannedCardType}
                </span>
                <span className="font-mono text-[10px] bg-teal-100 dark:bg-teal-900 px-1.5 py-0.5 rounded">
                  {generatedKioskToken}
                </span>
              </div>
            )}

            {/* Demographics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Jane Doe"
                  className="w-full px-3 py-2 text-xs md:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Age *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max="125"
                  value={age}
                  onChange={(e) => setAge(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="e.g. 42"
                  className="w-full px-3 py-2 text-xs md:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Gender
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as Patient['gender'])}
                  className="w-full px-3 py-2 text-xs md:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                >
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Department
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3 py-2 text-xs md:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                >
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Assign Physician
                </label>
                <select
                  value={assignedDoctorId}
                  onChange={(e) => setAssignedDoctorId(e.target.value)}
                  className="w-full px-3 py-2 text-xs md:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                >
                  <option value="">Auto-assign next available</option>
                  {doctors.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Chief Complaint */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Chief Complaint / Presenting Symptoms *
              </label>
              <textarea
                required
                rows={2}
                value={chiefComplaint}
                onChange={(e) => setChiefComplaint(e.target.value)}
                placeholder="Describe presenting symptoms, pain location, onset duration..."
                className="w-full px-3 py-2 text-xs md:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
              />
            </div>

            {/* Vitals & Triage Auto-Assessor */}
            <div className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  Initial Triage Vitals
                </span>
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${
                    liveTriage.priority === 'urgent'
                      ? 'bg-red-100 text-red-800 border-red-300 dark:bg-red-950 dark:text-red-300'
                      : liveTriage.priority === 'normal'
                      ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300'
                      : 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-300'
                  }`}
                >
                  Auto-Calculated: {liveTriage.tag}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs">
                <div>
                  <label className="block text-[11px] text-slate-500 mb-0.5">Blood Pressure</label>
                  <input
                    type="text"
                    value={bp}
                    onChange={(e) => setBp(e.target.value)}
                    placeholder="120/80"
                    className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-0.5">Heart Rate (bpm)</label>
                  <input
                    type="number"
                    value={heartRate}
                    onChange={(e) => setHeartRate(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="75"
                    className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-0.5">SpO₂ (%)</label>
                  <input
                    type="number"
                    value={spo2}
                    onChange={(e) => setSpo2(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="98"
                    className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-0.5">Temp (°F)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={temp}
                    onChange={(e) => setTemp(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="98.6"
                    className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-0.5">Pain Score (1-10)</label>
                  <select
                    value={painScore}
                    onChange={(e) => setPainScore(Number(e.target.value))}
                    className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-xs font-mono"
                  >
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                      <option key={num} value={num}>
                        {num} / 10
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Digital Consent Signature Pad */}
            <div className="space-y-2">
              <div className="text-xs text-slate-600 dark:text-slate-400">
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  Electronic Care & Admission Consent:
                </span>{' '}
                I authorize medical evaluation, nursing observation, and diagnostic testing.
              </div>
              <SignaturePad
                label="Patient / Guardian Handshake Consent Signature"
                signeeName={fullName || 'Patient'}
                roleBadge="Informed Consent"
                presetSampleType="patient"
                onSaveSignature={(dataUrl) => setConsentSignature(dataUrl)}
              />
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="text-xs text-slate-500 font-mono">
                Assigned Token: <span className="font-bold text-blue-600">{generatedKioskToken}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-lg shadow-md transition-all active:scale-95"
                >
                  Complete Handshake Check-in
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
