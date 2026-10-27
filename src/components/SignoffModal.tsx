import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  KeyRound,
  FileSignature,
  CheckCircle2,
  AlertTriangle,
  Printer,
  Download,
  Lock,
  Plus,
  Trash2,
  Stethoscope,
  Sparkles,
} from 'lucide-react';
import { Doctor, Patient, SignoffRecord } from '../types';
import { SignaturePad } from './SignaturePad';
import { QRCodeView } from './QRCodeView';
import { generateCryptographicProof, verifyTwoPartyCredentials } from '../utils/trackerLogic';

interface SignoffModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient | null;
  doctors: Doctor[];
  onCompleteSignoff: (patientId: string, signoffRecord: SignoffRecord) => void;
}

export const SignoffModal: React.FC<SignoffModalProps> = ({
  isOpen,
  onClose,
  patient,
  doctors,
  onCompleteSignoff,
}) => {
  // Step state: 'verify' | 'review' | 'signatures' | 'sealed'
  const [step, setStep] = useState<'verify' | 'review' | 'signatures' | 'sealed'>('verify');

  // Physician Selection & Credentials
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [doctorPin, setDoctorPin] = useState('');
  const [patientHandshakeInput, setPatientHandshakeInput] = useState('');
  const [authError, setAuthError] = useState('');

  // Clinical Details
  const [clinicalSummary, setClinicalSummary] = useState('');
  const [dischargeInstructions, setDischargeInstructions] = useState('');
  const [prescriptions, setPrescriptions] = useState<string[]>([]);
  const [newPrescriptionText, setNewPrescriptionText] = useState('');

  // Dual Signatures
  const [doctorSignature, setDoctorSignature] = useState('');
  const [patientSignature, setPatientSignature] = useState('');
  const [signatureError, setSignatureError] = useState('');

  // Generated Sealed Record
  const [sealedRecord, setSealedRecord] = useState<SignoffRecord | null>(null);
  const [isSealing, setIsSealing] = useState(false);

  useEffect(() => {
    if (patient) {
      // If patient already has a signoffRecord, open in sealed view
      if (patient.signoffRecord) {
        setSealedRecord(patient.signoffRecord);
        setStep('sealed');
        return;
      }

      // Initial defaults
      const doc = doctors.find((d) => d.id === patient.assignedDoctorId) || doctors[0];
      setSelectedDoctorId(doc.id);
      setDoctorPin('');
      setPatientHandshakeInput(patient.patientHandshakeToken); // Prefilled for seamless testing
      setAuthError('');
      setSignatureError('');
      setStep('verify');

      // Clinical notes preset based on diagnosis
      setClinicalSummary(
        `Patient presented with ${patient.chiefComplaint.toLowerCase()}. Clinical exam and vitals stable (BP: ${
          patient.vitals.bp
        }, SpO2: ${patient.vitals.spo2}%). Care plan completed without acute complications.`
      );
      setDischargeInstructions(
        'Return to clinic or Emergency Department immediately if experiencing sudden onset chest pain, shortness of breath, high fever (>102°F), or worsening pain.'
      );
      setPrescriptions([
        'Acetaminophen 500mg PO q6h PRN mild-moderate pain',
        'Follow-up with Primary Care Provider within 5 to 7 days',
      ]);
    }
  }, [patient, doctors, isOpen]);

  if (!isOpen || !patient) return null;

  const currentDoctor = doctors.find((d) => d.id === selectedDoctorId) || doctors[0];

  // Quick helper to fill PIN for demo convenience
  const handleAutoFillDoctorPin = () => {
    setDoctorPin(currentDoctor.pinCode);
    setAuthError('');
  };

  const handleVerifyTwoParty = (e: React.FormEvent) => {
    e.preventDefault();
    const result = verifyTwoPartyCredentials(
      doctorPin,
      currentDoctor.pinCode,
      patientHandshakeInput,
      patient.patientHandshakeToken
    );

    if (!result.valid) {
      const err = Object.values(result.errors).join(' • ');
      setAuthError(err);
      return;
    }

    setAuthError('');
    setStep('review');
  };

  const handleAddPrescription = () => {
    if (newPrescriptionText.trim()) {
      setPrescriptions((prev) => [...prev, newPrescriptionText.trim()]);
      setNewPrescriptionText('');
    }
  };

  const handleRemovePrescription = (idx: number) => {
    setPrescriptions((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleExecuteCryptographicSeal = () => {
    if (!doctorSignature) {
      setSignatureError('Attending physician digital signature is required.');
      return;
    }
    if (!patientSignature) {
      setSignatureError('Patient or legal guardian digital signature is required.');
      return;
    }

    setSignatureError('');
    setIsSealing(true);

    const timestamp = new Date().toISOString();
    const hash = generateCryptographicProof(
      patient.id,
      patient.mrn,
      currentDoctor.id,
      currentDoctor.licenseNumber,
      patient.patientHandshakeToken,
      timestamp,
      clinicalSummary
    );

    const record: SignoffRecord = {
      cryptographicHash: hash,
      timestamp,
      doctorSignatureDataUrl: doctorSignature,
      patientSignatureDataUrl: patientSignature,
      doctorName: currentDoctor.name,
      doctorId: currentDoctor.id,
      doctorLicense: currentDoctor.licenseNumber,
      patientToken: patient.patientHandshakeToken,
      clinicalSummary,
      prescriptions,
      dischargeInstructions,
      verifiedTwoParty: true,
    };

    setTimeout(() => {
      setIsSealing(false);
      setSealedRecord(record);
      setStep('sealed');
      onCompleteSignoff(patient.id, record);
    }, 850);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="signoff-modal-title"
      className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-3xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="signoff-modal-title" className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Two-Party Cryptographic Sign-Off
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 font-bold">
                  {patient.mrn}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Patient: <span className="font-semibold text-slate-700 dark:text-slate-300">{patient.fullName}</span> • {patient.department}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close sign-off modal"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Multi-Step Indicator */}
        <div className="px-5 py-2.5 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 grid grid-cols-4 gap-2 text-xs">
          <div
            className={`flex items-center gap-1.5 pb-1 border-b-2 font-medium ${
              step === 'verify'
                ? 'border-purple-600 text-purple-600 dark:text-purple-400 font-bold'
                : 'border-slate-300 text-slate-500'
            }`}
          >
            <span className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-[10px]">
              1
            </span>
            <span>2-Party Auth</span>
          </div>

          <div
            className={`flex items-center gap-1.5 pb-1 border-b-2 font-medium ${
              step === 'review'
                ? 'border-purple-600 text-purple-600 dark:text-purple-400 font-bold'
                : 'border-slate-300 text-slate-500'
            }`}
          >
            <span className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-[10px]">
              2
            </span>
            <span>Clinical Plan</span>
          </div>

          <div
            className={`flex items-center gap-1.5 pb-1 border-b-2 font-medium ${
              step === 'signatures'
                ? 'border-purple-600 text-purple-600 dark:text-purple-400 font-bold'
                : 'border-slate-300 text-slate-500'
            }`}
          >
            <span className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-[10px]">
              3
            </span>
            <span>Dual Signatures</span>
          </div>

          <div
            className={`flex items-center gap-1.5 pb-1 border-b-2 font-medium ${
              step === 'sealed'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 font-bold'
                : 'border-slate-300 text-slate-500'
            }`}
          >
            <span className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-[10px]">
              4
            </span>
            <span>Cryptographic Seal</span>
          </div>
        </div>

        {/* Modal Scroll Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* STEP 1: Two-Party Credential Challenge */}
          {step === 'verify' && (
            <form onSubmit={handleVerifyTwoParty} className="space-y-4">
              <div className="bg-purple-50/80 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 rounded-xl p-3.5 text-xs text-purple-900 dark:text-purple-200 flex items-start gap-2.5">
                <Lock className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Two-Party Clinical Handshake Enforcement</p>
                  <p className="text-[11px] text-purple-800/80 dark:text-purple-300/80 mt-0.5">
                    To discharge and sign off on this encounter, both the licensed physician's credential and the patient's intake handshake verification token must be verified.
                  </p>
                </div>
              </div>

              {authError && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              {/* Doctor Auth Card */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                    <Stethoscope className="w-4 h-4 text-blue-600" />
                    <span>Party 1: Licensed Physician</span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Lic: {currentDoctor.licenseNumber}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Attending Physician
                    </label>
                    <select
                      value={selectedDoctorId}
                      onChange={(e) => {
                        setSelectedDoctorId(e.target.value);
                        setDoctorPin('');
                      }}
                      className="w-full px-3 py-2 text-xs md:text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                    >
                      {doctors.map((doc) => (
                        <option key={doc.id} value={doc.id}>
                          {doc.name} ({doc.department})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Doctor Security PIN *
                      </label>
                      <button
                        type="button"
                        onClick={handleAutoFillDoctorPin}
                        className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline font-medium"
                      >
                        (Demo PIN: {currentDoctor.pinCode})
                      </button>
                    </div>
                    <input
                      type="password"
                      required
                      value={doctorPin}
                      onChange={(e) => setDoctorPin(e.target.value)}
                      placeholder="Enter 4-digit PIN"
                      maxLength={6}
                      className="w-full px-3 py-2 text-xs md:text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-mono tracking-widest text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Patient Auth Card */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                    <KeyRound className="w-4 h-4 text-emerald-600" />
                    <span>Party 2: Patient Handshake Token</span>
                  </div>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono font-medium">
                    Verified Check-in Token
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Enter Patient Handshake Code (from bracelet or mobile app) *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={patientHandshakeInput}
                      onChange={(e) => setPatientHandshakeInput(e.target.value.toUpperCase())}
                      placeholder="e.g. HSK-4819"
                      className="w-full px-3 py-2 text-xs md:text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-slate-900 dark:text-white"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-400">
                      Expected: {patient.patientHandshakeToken}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all"
                >
                  Verify Credentials & Proceed →
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: Clinical Summary & Prescriptions */}
          {step === 'review' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Clinical Encounter Summary & Discharge Findings *
                </label>
                <textarea
                  rows={3}
                  value={clinicalSummary}
                  onChange={(e) => setClinicalSummary(e.target.value)}
                  className="w-full px-3 py-2 text-xs md:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-purple-500 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Patient Discharge Instructions & Precautions *
                </label>
                <textarea
                  rows={2}
                  value={dischargeInstructions}
                  onChange={(e) => setDischargeInstructions(e.target.value)}
                  className="w-full px-3 py-2 text-xs md:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-purple-500 text-slate-900 dark:text-white"
                />
              </div>

              {/* Prescriptions List */}
              <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  E-Prescriptions & Follow-Up Regimens
                </label>

                <div className="space-y-1.5">
                  {prescriptions.map((rx, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200"
                    >
                      <span className="font-mono text-[11px]">{rx}</span>
                      <button
                        type="button"
                        onClick={() => handleRemovePrescription(idx)}
                        aria-label="Remove prescription"
                        className="text-slate-400 hover:text-red-500 p-0.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={newPrescriptionText}
                    onChange={(e) => setNewPrescriptionText(e.target.value)}
                    placeholder="Add medicine (e.g. Amoxicillin 500mg TID x 7 days)"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddPrescription();
                      }
                    }}
                    className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={handleAddPrescription}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-white text-xs font-semibold rounded-lg transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>
              </div>

              <div className="pt-2 flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep('verify')}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900"
                >
                  ← Back to Verification
                </button>
                <button
                  type="button"
                  onClick={() => setStep('signatures')}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg shadow-sm"
                >
                  Proceed to Dual Signatures →
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Dual Signatures */}
          {step === 'signatures' && (
            <div className="space-y-4">
              {signatureError && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{signatureError}</span>
                </div>
              )}

              {/* Doctor Signature Pad */}
              <SignaturePad
                label="Attending Physician Electronic Sign-off"
                signeeName={`${currentDoctor.name} (${currentDoctor.licenseNumber})`}
                roleBadge="Licensed Attending"
                presetSampleType="doctor"
                onSaveSignature={(dataUrl) => setDoctorSignature(dataUrl)}
              />

              {/* Patient Signature Pad */}
              <SignaturePad
                label="Patient / Legal Representative Discharge Acknowledgment"
                signeeName={patient.fullName}
                roleBadge="Patient / Proxy"
                presetSampleType="patient"
                onSaveSignature={(dataUrl) => setPatientSignature(dataUrl)}
              />

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep('review')}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900"
                >
                  ← Back to Clinical Plan
                </button>

                <button
                  type="button"
                  disabled={isSealing}
                  onClick={handleExecuteCryptographicSeal}
                  className="inline-flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold rounded-lg shadow-md transition-all active:scale-95 disabled:opacity-50"
                >
                  {isSealing ? (
                    <>
                      <Sparkles className="w-4 h-4 animate-spin text-amber-300" />
                      <span>Generating Cryptographic Seal...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Generate Cryptographic Seal & Sign-Off</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Sealed Cryptographic Certificate */}
          {step === 'sealed' && sealedRecord && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">Two-Party Handshake Verification Complete</h4>
                    <p className="text-xs text-emerald-800/80 dark:text-emerald-300/80">
                      Discharge encounter is cryptographically locked and stamped onto the clinical ledger.
                    </p>
                  </div>
                </div>
                <span className="text-[11px] font-mono bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 px-2.5 py-1 rounded-md font-bold">
                  IMMUTABLE
                </span>
              </div>

              {/* Printable Medical Certificate Card */}
              <div className="border-2 border-slate-200 dark:border-slate-700 rounded-2xl p-5 bg-white dark:bg-slate-950 shadow-sm space-y-4 relative overflow-hidden">
                {/* Watermark */}
                <div className="absolute right-4 top-4 text-emerald-500/10 pointer-events-none select-none">
                  <ShieldCheck className="w-64 h-64 -mr-16 -mt-16" />
                </div>

                {/* Certificate Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b pb-3 border-slate-100 dark:border-slate-800 gap-2">
                  <div>
                    <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
                      St. Jude Memorial Health System • Clinical Certificate of Discharge
                    </p>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                      Cryptographic Handshake Sign-Off Seal
                    </h3>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400 font-mono">Timestamp</p>
                    <p className="text-xs font-mono font-medium text-slate-700 dark:text-slate-300">
                      {new Date(sealedRecord.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Patient & Doctor metadata row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase">Patient Name</span>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">{patient.fullName}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase">MRN</span>
                    <p className="font-mono font-semibold text-slate-800 dark:text-slate-200">{patient.mrn}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase">Attending Doctor</span>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">{sealedRecord.doctorName}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase">License</span>
                    <p className="font-mono font-semibold text-slate-800 dark:text-slate-200">{sealedRecord.doctorLicense}</p>
                  </div>
                </div>

                {/* Clinical Summary */}
                <div className="text-xs bg-slate-50 dark:bg-slate-900/80 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                    Certified Clinical Summary
                  </span>
                  <p className="text-slate-700 dark:text-slate-300">{sealedRecord.clinicalSummary}</p>
                </div>

                {/* Prescriptions */}
                {sealedRecord.prescriptions.length > 0 && (
                  <div className="text-xs">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                      Authorized Prescriptions & Regimens
                    </span>
                    <ul className="list-disc list-inside text-slate-700 dark:text-slate-300 space-y-0.5 font-mono text-[11px]">
                      {sealedRecord.prescriptions.map((p, i) => (
                        <li key={i}>{p}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Signatures Dual Box */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase block mb-1">
                      Physician Signature ({sealedRecord.doctorName})
                    </span>
                    <div className="h-14 flex items-center justify-center bg-white dark:bg-slate-950 rounded border border-slate-200 dark:border-slate-800 overflow-hidden">
                      {sealedRecord.doctorSignatureDataUrl ? (
                        <img
                          src={sealedRecord.doctorSignatureDataUrl}
                          alt="Physician Signature"
                          className="max-h-12 object-contain"
                        />
                      ) : (
                        <span className="text-xs text-slate-400 italic">Signature Recorded</span>
                      )}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase block mb-1">
                      Patient Handshake Signature ({patient.fullName})
                    </span>
                    <div className="h-14 flex items-center justify-center bg-white dark:bg-slate-950 rounded border border-slate-200 dark:border-slate-800 overflow-hidden">
                      {sealedRecord.patientSignatureDataUrl ? (
                        <img
                          src={sealedRecord.patientSignatureDataUrl}
                          alt="Patient Signature"
                          className="max-h-12 object-contain"
                        />
                      ) : (
                        <span className="text-xs text-slate-400 italic">Signature Recorded</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Cryptographic Hash Barcode & Fingerprint */}
                <div className="p-3 bg-slate-900 text-white rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 font-mono">
                  <div className="space-y-1 overflow-hidden w-full">
                    <div className="flex items-center gap-2 text-[10px] text-emerald-400 font-bold uppercase">
                      <Lock className="w-3 h-3" />
                      <span>SHA-256 Cryptographic Encounter Hash</span>
                    </div>
                    <div className="text-[10px] sm:text-[11px] text-slate-300 break-all select-all bg-slate-950 p-2 rounded border border-slate-800">
                      {sealedRecord.cryptographicHash}
                    </div>
                    <p className="text-[9px] text-slate-400">
                      Handshake Token: {sealedRecord.patientToken} • Verification Key: {sealedRecord.doctorLicense}
                    </p>
                  </div>

                  <div className="shrink-0 bg-white p-1 rounded-lg">
                    <QRCodeView
                      value={`VERIFY-LEDGER:${sealedRecord.cryptographicHash}`}
                      size={70}
                    />
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      window.print();
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Certificate</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const blob = new Blob([JSON.stringify(sealedRecord, null, 2)], {
                        type: 'application/json',
                      });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `encounter-certificate-${patient.mrn}.json`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Ledger JSON</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-bold rounded-lg transition-colors"
                >
                  Close & Return to Queue
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
