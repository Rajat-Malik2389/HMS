import test from 'node:test';
import assert from 'node:assert/strict';
import {
  generateCryptographicProof,
  verifyTwoPartyCredentials,
  assessTriage,
  computeQueueMetrics,
  filterAndSortPatients,
  formatMinutesWait,
} from './trackerLogic';
import { Patient, Vitals } from '../types';

test('generateCryptographicProof creates a 64-character deterministic hex hash', () => {
  const hash1 = generateCryptographicProof(
    'pat-1',
    'MRN-1001',
    'doc-1',
    'MD-99201',
    'HSK-4821',
    '2026-10-27T10:00:00Z',
    'Patient shows normal recovery post-observation.'
  );

  const hash2 = generateCryptographicProof(
    'pat-1',
    'MRN-1001',
    'doc-1',
    'MD-99201',
    'HSK-4821',
    '2026-10-27T10:00:00Z',
    'Patient shows normal recovery post-observation.'
  );

  const hashModified = generateCryptographicProof(
    'pat-1',
    'MRN-1001',
    'doc-1',
    'MD-99201',
    'HSK-4821',
    '2026-10-27T10:00:00Z',
    'Patient shows normal recovery post-observation with complications.'
  );

  assert.equal(hash1.length, 64);
  assert.equal(/^[0-9a-f]{64}$/.test(hash1), true);
  assert.equal(hash1, hash2, 'Hash should be deterministic for identical inputs');
  assert.notEqual(hash1, hashModified, 'Altered content must produce a distinct cryptographic digest');
});

test('verifyTwoPartyCredentials validates doctor PIN and patient handshake token', () => {
  const resultValid = verifyTwoPartyCredentials('4829', '4829', 'HSK-9921', 'HSK-9921');
  assert.equal(resultValid.valid, true);
  assert.deepEqual(resultValid.errors, {});

  const resultDoctorMismatch = verifyTwoPartyCredentials('0000', '4829', 'HSK-9921', 'HSK-9921');
  assert.equal(resultDoctorMismatch.valid, false);
  assert.ok(resultDoctorMismatch.errors.doctorPin);

  const resultPatientMismatch = verifyTwoPartyCredentials('4829', '4829', 'HSK-XXXX', 'HSK-9921');
  assert.equal(resultPatientMismatch.valid, false);
  assert.ok(resultPatientMismatch.errors.patientToken);
});

test('assessTriage identifies severe complaints and abnormal vitals', () => {
  const severeVitals: Vitals = { bp: '150/95', heartRate: 130, spo2: 89, temp: 99.1, painScore: 8 };
  const severeResult = assessTriage(severeVitals, 'Acute chest pain and dizziness');
  assert.equal(severeResult.priority, 'urgent');
  assert.equal(severeResult.tag, 'Immediate (Red)');

  const normalVitals: Vitals = { bp: '120/80', heartRate: 72, spo2: 99, temp: 98.4, painScore: 2 };
  const normalResult = assessTriage(normalVitals, 'Routine follow-up for mild rash');
  assert.equal(normalResult.priority, 'low');
  assert.equal(normalResult.tag, 'Non-Urgent (Blue)');
});

test('computeQueueMetrics aggregates queue counts and average wait time correctly', () => {
  const mockPatients: Patient[] = [
    {
      id: 'p1',
      mrn: 'MRN-1',
      fullName: 'Alice Smith',
      age: 32,
      gender: 'Female',
      phone: '555-0101',
      checkInTime: new Date().toISOString(),
      waitTimeMinutes: 20,
      priority: 'urgent',
      triageTag: 'Immediate (Red)',
      chiefComplaint: 'Chest tightness',
      department: 'Emergency',
      status: 'waiting',
      vitals: { bp: '130/85', heartRate: 98, spo2: 96, temp: 98.6 },
      consentSigned: true,
      patientHandshakeToken: 'HSK-1001',
    },
    {
      id: 'p2',
      mrn: 'MRN-2',
      fullName: 'Bob Jones',
      age: 45,
      gender: 'Male',
      phone: '555-0102',
      checkInTime: new Date().toISOString(),
      waitTimeMinutes: 40,
      priority: 'normal',
      triageTag: 'Standard (Green)',
      chiefComplaint: 'Knee sprain',
      department: 'Orthopedics',
      status: 'in_consultation',
      vitals: { bp: '122/80', heartRate: 74, spo2: 99, temp: 98.6 },
      consentSigned: true,
      patientHandshakeToken: 'HSK-1002',
    },
    {
      id: 'p3',
      mrn: 'MRN-3',
      fullName: 'Charlie Green',
      age: 60,
      gender: 'Male',
      phone: '555-0103',
      checkInTime: new Date().toISOString(),
      waitTimeMinutes: 10,
      priority: 'low',
      triageTag: 'Non-Urgent (Blue)',
      chiefComplaint: 'Suture removal',
      department: 'General Medicine',
      status: 'discharged',
      vitals: { bp: '118/76', heartRate: 68, spo2: 99, temp: 98.2 },
      consentSigned: true,
      patientHandshakeToken: 'HSK-1003',
    },
  ];

  const metrics = computeQueueMetrics(mockPatients);
  assert.equal(metrics.totalActive, 2, 'Only active (non-discharged) count as active');
  assert.equal(metrics.waitingCount, 1);
  assert.equal(metrics.inConsultationCount, 1);
  assert.equal(metrics.dischargedCount, 1);
  assert.equal(metrics.urgentCount, 1);
  assert.equal(metrics.avgWaitTimeMinutes, 30); // (20 + 40) / 2
});

test('filterAndSortPatients filters by priority and search text', () => {
  const mockPatients: Patient[] = [
    {
      id: 'p1',
      mrn: 'MRN-1',
      fullName: 'Alice Smith',
      age: 32,
      gender: 'Female',
      phone: '555-0101',
      checkInTime: new Date().toISOString(),
      waitTimeMinutes: 20,
      priority: 'urgent',
      triageTag: 'Immediate (Red)',
      chiefComplaint: 'Chest tightness',
      department: 'Emergency',
      status: 'waiting',
      vitals: { bp: '130/85', heartRate: 98, spo2: 96, temp: 98.6 },
      consentSigned: true,
      patientHandshakeToken: 'HSK-1001',
    },
    {
      id: 'p2',
      mrn: 'MRN-2',
      fullName: 'Bob Jones',
      age: 45,
      gender: 'Male',
      phone: '555-0102',
      checkInTime: new Date().toISOString(),
      waitTimeMinutes: 40,
      priority: 'normal',
      triageTag: 'Standard (Green)',
      chiefComplaint: 'Knee sprain',
      department: 'Orthopedics',
      status: 'in_consultation',
      vitals: { bp: '122/80', heartRate: 74, spo2: 99, temp: 98.6 },
      consentSigned: true,
      patientHandshakeToken: 'HSK-1002',
    },
  ];

  const urgentOnly = filterAndSortPatients(mockPatients, {
    searchQuery: '',
    status: 'all',
    priority: 'urgent',
    department: 'all',
    doctorId: 'all',
    sortBy: 'waitTime_desc',
  });

  assert.equal(urgentOnly.length, 1);
  assert.equal(urgentOnly[0].fullName, 'Alice Smith');

  const searchAlice = filterAndSortPatients(mockPatients, {
    searchQuery: 'alice',
    status: 'all',
    priority: 'all',
    department: 'all',
    doctorId: 'all',
    sortBy: 'waitTime_desc',
  });

  assert.equal(searchAlice.length, 1);
  assert.equal(searchAlice[0].id, 'p1');
});

test('formatMinutesWait formats durations properly', () => {
  assert.equal(formatMinutesWait(15), '15m');
  assert.equal(formatMinutesWait(60), '1h 0m');
  assert.equal(formatMinutesWait(85), '1h 25m');
});
