export type PriorityLevel = 'urgent' | 'normal' | 'low';

export type PatientStatus = 
  | 'waiting' 
  | 'in_triage' 
  | 'in_consultation' 
  | 'ready_for_signoff' 
  | 'discharged';

export interface Vitals {
  bp: string;          // e.g. "120/80"
  heartRate: number;   // bpm
  spo2: number;        // percentage e.g. 98
  temp: number;        // fahrenheit or celsius e.g. 98.6
  painScore?: number;  // 1-10
}

export interface Doctor {
  id: string;
  name: string;
  title: string;
  department: string;
  licenseNumber: string;
  avatar: string;
  pinCode: string; // for doctor sign-off verification (e.g. "4829")
}

export interface SignoffRecord {
  cryptographicHash: string;
  timestamp: string;
  doctorSignatureDataUrl: string;
  patientSignatureDataUrl: string;
  doctorName: string;
  doctorId: string;
  doctorLicense: string;
  patientToken: string;
  clinicalSummary: string;
  prescriptions: string[];
  dischargeInstructions: string;
  verifiedTwoParty: boolean;
}

export interface Patient {
  id: string;
  mrn: string; // e.g. "MRN-84920"
  fullName: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  phone: string;
  checkInTime: string; // ISO string
  waitTimeMinutes: number;
  priority: PriorityLevel;
  triageTag: 'Immediate (Red)' | 'Urgent (Yellow)' | 'Standard (Green)' | 'Non-Urgent (Blue)';
  chiefComplaint: string;
  department: string;
  assignedDoctorId?: string;
  status: PatientStatus;
  vitals: Vitals;
  consentSigned: boolean;
  consentSignatureDataUrl?: string;
  patientHandshakeToken: string; // 6-digit or alpha verification token
  signoffRecord?: SignoffRecord;
  notes?: string;
}

export interface QueueFilterState {
  searchQuery: string;
  status: PatientStatus | 'all';
  priority: PriorityLevel | 'all';
  department: string | 'all';
  doctorId: string | 'all';
  sortBy: 'waitTime_desc' | 'waitTime_asc' | 'priority_urgent' | 'name_asc';
}

export interface QueueMetrics {
  totalActive: number;
  waitingCount: number;
  inConsultationCount: number;
  readyForSignoffCount: number;
  dischargedCount: number;
  urgentCount: number;
  avgWaitTimeMinutes: number;
}
