import { z } from 'zod';

export const VisitStatusEnum = z.enum([
  'CHECKED_IN',
  'TRIAGE',
  'IN_CONSULTATION',
  'PENDING_HANDSHAKE',
  'DISCHARGED',
]);

export type VisitStatus = z.infer<typeof VisitStatusEnum>;

export const PriorityLevelEnum = z.enum(['URGENT', 'NORMAL', 'LOW']);
export type PriorityLevel = z.infer<typeof PriorityLevelEnum>;

export const TriageTagEnum = z.enum(['RED', 'YELLOW', 'GREEN', 'BLUE']);
export type TriageTag = z.infer<typeof TriageTagEnum>;

/**
 * Zod Schema for Patient Intake & Registration
 */
export const PatientIntakeSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  dateOfBirth: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Valid date of birth required (YYYY-MM-DD)',
  }),
  gender: z.enum(['Male', 'Female', 'Non-Binary', 'Other']),
  phone: z.string().min(7, 'Valid contact phone number required'),
  email: z.string().email().optional().or(z.literal('')),
  emergencyContact: z.string().optional(),
  chiefComplaint: z.string().min(5, 'Chief complaint description is required (min 5 chars)'),
  department: z.string().min(2, 'Department designation required'),
  vitals: z.object({
    bp: z.string().regex(/^\d{2,3}\/\d{2,3}$/, 'Blood pressure must be in format like 120/80'),
    heartRate: z.number().int().min(30).max(250),
    spo2: z.number().int().min(50).max(100),
    temp: z.number().min(90.0).max(110.0),
    painScore: z.number().int().min(0).max(10).default(0),
  }),
  consentSigned: z.boolean().refine((val) => val === true, {
    message: 'HIPAA and clinical care consent must be confirmed',
  }),
  consentSignatureData: z.string().min(20, 'Digital consent signature is required'),
});

export type PatientIntakeInput = z.infer<typeof PatientIntakeSchema>;

/**
 * Zod Schema for Two-Party Handshake Submission
 */
export const HandshakeSubmissionSchema = z.object({
  visitId: z.string().min(1, 'Patient Visit ID is required'),
  patientId: z.string().min(1, 'Patient ID is required'),
  doctorId: z.string().min(1, 'Doctor ID is required'),
  doctorName: z.string().min(2, 'Doctor Name is required'),
  doctorLicense: z.string().min(3, 'Doctor Medical License is required'),
  doctorPin: z.string().min(4, 'Physician authorization PIN required (min 4 digits)'),
  patientToken: z.string().min(4, 'Patient Handshake verification token is required'),
  doctorSignatureData: z.string().min(30, 'Doctor electronic signature is required'),
  patientSignatureData: z.string().min(30, 'Patient or legal proxy signature is required'),
  clinicalSummary: z.string().min(10, 'Certified clinical summary is required (min 10 chars)'),
  prescriptions: z.array(z.string()).default([]),
  dischargeInstructions: z.string().min(10, 'Discharge instructions required (min 10 chars)'),
});

export type HandshakeSubmissionInput = z.infer<typeof HandshakeSubmissionSchema>;

export interface HandshakeReceipt {
  receiptId: string;
  visitId: string;
  mrn: string;
  patientName: string;
  doctorName: string;
  doctorLicense: string;
  cryptographicHash: string;
  timestamp: string;
  clinicalSummary: string;
  prescriptions: string[];
  dischargeInstructions: string;
  verifiedTwoParty: boolean;
}

export interface PatientVisitDTO {
  id: string;
  patientId: string;
  mrn: string;
  patientName: string;
  age: number;
  gender: string;
  visitNumber: string;
  status: VisitStatus;
  priority: PriorityLevel;
  triageTag: TriageTag;
  chiefComplaint: string;
  department: string;
  vitals: {
    bp: string;
    heartRate: number;
    spo2: number;
    temp: number;
    painScore?: number;
  };
  attendingDoctorName?: string;
  attendingDoctorId?: string;
  attendingDoctorLicense?: string;
  handshakeToken: string;
  checkInTime: string;
  waitTimeMinutes: number;
  dischargeTime?: string;
  cryptographicHash?: string;
}
