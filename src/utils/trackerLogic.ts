import { Patient, PriorityLevel, QueueFilterState, QueueMetrics, Vitals } from '../types';

/**
 * Deterministically generates a SHA-256 style 64-char hexadecimal cryptographic hash
 * to simulate an immutable ledger / blockchain / PKI digital signature audit seal.
 */
export function generateCryptographicProof(
  patientId: string,
  mrn: string,
  doctorId: string,
  doctorLicense: string,
  patientToken: string,
  timestamp: string,
  clinicalSummary: string
): string {
  const payload = `${patientId}|${mrn}|${doctorId}|${doctorLicense}|${patientToken}|${timestamp}|${clinicalSummary.trim()}`;
  
  // High quality deterministic 256-bit hash generator simulation
  let h0 = 0x6a09e667;
  let h1 = 0xbb67ae85;
  let h2 = 0x3c6ef372;
  let h3 = 0xa54ff53a;
  let h4 = 0x510e527f;
  let h5 = 0x9b05688c;
  let h6 = 0x1f83d9ab;
  let h7 = 0x5be0cd19;

  for (let i = 0; i < payload.length; i++) {
    const code = payload.charCodeAt(i);
    h0 = (Math.imul(h0 ^ code, 0x5bd1e995) + (h7 >>> 2)) >>> 0;
    h1 = (Math.imul(h1 ^ (code << 3), 0x27d4eb2f) + (h0 >>> 3)) >>> 0;
    h2 = (Math.imul(h2 ^ (code >> 2), 0x165667b1) + (h1 >>> 1)) >>> 0;
    h3 = (Math.imul(h3 ^ code, 0xd3a2646c) + (h2 >>> 4)) >>> 0;
    h4 = (Math.imul(h4 ^ (code * 31), 0xfd7046c5) + (h3 >>> 2)) >>> 0;
    h5 = (Math.imul(h5 ^ code, 0x7a304f55) + (h4 >>> 5)) >>> 0;
    h6 = (Math.imul(h6 ^ (code >> 1), 0x3456789a) + (h5 >>> 3)) >>> 0;
    h7 = (Math.imul(h7 ^ (code << 2), 0x98765432) + (h6 >>> 2)) >>> 0;
  }

  const toHex8 = (n: number) => ('00000000' + (n >>> 0).toString(16)).slice(-8);
  return `${toHex8(h0)}${toHex8(h1)}${toHex8(h2)}${toHex8(h3)}${toHex8(h4)}${toHex8(h5)}${toHex8(h6)}${toHex8(h7)}`;
}

/**
 * Validates the two-party authorization parameters
 */
export function verifyTwoPartyCredentials(
  enteredDoctorPin: string,
  actualDoctorPin: string,
  enteredPatientToken: string,
  actualPatientToken: string
): { valid: boolean; errors: { doctorPin?: string; patientToken?: string } } {
  const errors: { doctorPin?: string; patientToken?: string } = {};

  if (!enteredDoctorPin || enteredDoctorPin.trim() !== actualDoctorPin.trim()) {
    errors.doctorPin = 'Doctor authorization PIN does not match registry';
  }

  if (!enteredPatientToken || enteredPatientToken.trim().toUpperCase() !== actualPatientToken.trim().toUpperCase()) {
    errors.patientToken = 'Patient handshake verification token does not match';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Calculates triage category and priority based on vitals and symptoms
 */
export function assessTriage(
  vitals: Vitals,
  chiefComplaint: string
): { priority: PriorityLevel; tag: Patient['triageTag'] } {
  const complaintLower = chiefComplaint.toLowerCase();
  const isSevereComplaint =
    complaintLower.includes('chest pain') ||
    complaintLower.includes('stroke') ||
    complaintLower.includes('unresponsive') ||
    complaintLower.includes('severe bleeding') ||
    complaintLower.includes('anaphylaxis') ||
    complaintLower.includes('shortness of breath');

  const isLowSpo2 = vitals.spo2 > 0 && vitals.spo2 < 92;
  const isHighHeartRate = vitals.heartRate > 125 || (vitals.heartRate > 0 && vitals.heartRate < 45);
  const isHighTemp = vitals.temp >= 103.5;
  const isHighPain = (vitals.painScore ?? 0) >= 9;

  if (isSevereComplaint || (isLowSpo2 && isHighHeartRate)) {
    return { priority: 'urgent', tag: 'Immediate (Red)' };
  }

  if (isLowSpo2 || isHighHeartRate || isHighTemp || isHighPain || complaintLower.includes('fracture') || complaintLower.includes('asthma')) {
    return { priority: 'urgent', tag: 'Urgent (Yellow)' };
  }

  if (vitals.spo2 >= 95 && vitals.heartRate <= 100 && (vitals.painScore ?? 0) <= 5 && !complaintLower.includes('acute')) {
    return { priority: 'low', tag: 'Non-Urgent (Blue)' };
  }

  return { priority: 'normal', tag: 'Standard (Green)' };
}

/**
 * Computes live dashboard metrics from patients list
 */
export function computeQueueMetrics(patients: Patient[]): QueueMetrics {
  const activePatients = patients.filter((p) => p.status !== 'discharged');
  const waitingCount = patients.filter((p) => p.status === 'waiting' || p.status === 'in_triage').length;
  const inConsultationCount = patients.filter((p) => p.status === 'in_consultation').length;
  const readyForSignoffCount = patients.filter((p) => p.status === 'ready_for_signoff').length;
  const dischargedCount = patients.filter((p) => p.status === 'discharged').length;
  const urgentCount = activePatients.filter((p) => p.priority === 'urgent').length;

  const totalWait = activePatients.reduce((sum, p) => sum + (p.waitTimeMinutes || 0), 0);
  const avgWaitTimeMinutes = activePatients.length > 0 ? Math.round(totalWait / activePatients.length) : 0;

  return {
    totalActive: activePatients.length,
    waitingCount,
    inConsultationCount,
    readyForSignoffCount,
    dischargedCount,
    urgentCount,
    avgWaitTimeMinutes,
  };
}

/**
 * Filters and sorts patients for the table/queue board
 */
export function filterAndSortPatients(
  patients: Patient[],
  filters: QueueFilterState
): Patient[] {
  return patients
    .filter((p) => {
      // Search query
      if (filters.searchQuery.trim()) {
        const query = filters.searchQuery.toLowerCase();
        const matchesName = p.fullName.toLowerCase().includes(query);
        const matchesMrn = p.mrn.toLowerCase().includes(query);
        const matchesComplaint = p.chiefComplaint.toLowerCase().includes(query);
        const matchesToken = p.patientHandshakeToken.toLowerCase().includes(query);
        if (!matchesName && !matchesMrn && !matchesComplaint && !matchesToken) {
          return false;
        }
      }

      // Status
      if (filters.status !== 'all' && p.status !== filters.status) {
        return false;
      }

      // Priority
      if (filters.priority !== 'all' && p.priority !== filters.priority) {
        return false;
      }

      // Department
      if (filters.department !== 'all' && p.department !== filters.department) {
        return false;
      }

      // Doctor
      if (filters.doctorId !== 'all' && p.assignedDoctorId !== filters.doctorId) {
        return false;
      }

      return true;
    })
    .sort((a, b) => {
      switch (filters.sortBy) {
        case 'waitTime_desc':
          return (b.waitTimeMinutes || 0) - (a.waitTimeMinutes || 0);
        case 'waitTime_asc':
          return (a.waitTimeMinutes || 0) - (b.waitTimeMinutes || 0);
        case 'priority_urgent': {
          const priorityScore = (p: PriorityLevel) => (p === 'urgent' ? 3 : p === 'normal' ? 2 : 1);
          return priorityScore(b.priority) - priorityScore(a.priority);
        }
        case 'name_asc':
          return a.fullName.localeCompare(b.fullName);
        default:
          return 0;
      }
    });
}

/**
 * Format relative minutes or digital clock
 */
export function formatMinutesWait(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;
  return `${hours}h ${remainingMins}m`;
}
