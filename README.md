# Handshake CareTracker (Patient Tracking & Digital Sign-Off System)

An enterprise-grade, HIPAA/GDPR-compliant healthcare patient queue tracker and two-party cryptographic digital sign-off system built with **Next.js 14+ (App Router)**, **TypeScript**, **Tailwind CSS**, **PostgreSQL**, and **Prisma ORM**.

---

## 1. System Architecture & Flow

```
[Patient Check-In] ────────► [Triage & Vitals] ────────► [Doctor Consultation]
        │                             │                           │
        ▼                             ▼                           ▼
  Handshake Token               Urgency Tag                 Care Plan & Rx
  (e.g., HSK-4819)           (Red/Yellow/Green)                   │
                                                                  ▼
[Discharge & Certified Receipt] ◄────── [Two-Party Handshake Verification]
        │                                 • Physician Authorization PIN
        ▼                                 • Patient Wristband/Token Match
  SHA-256 Cryptographic Seal              • Dual HTML5 Canvas Signatures
  Immutable Audit Ledger Entry            • Atomic DB Transaction
```

### HIPAA / GDPR Compliance Safeguards
- **Two-Party Verification**: Discharge encounters require explicit authorization from both the licensed attending physician (PIN + Medical License) and the patient/proxy (Token match + E-signature).
- **Cryptographic Immutability**: Each completed sign-off produces a unique 64-character SHA-256 digest (`generateHandshakeHash`) stamped into the `DigitalHandshake` table.
- **Append-Only Audit Trail**: Every status transition and seal operation creates a tamper-evident `AuditLog` entry storing actor ID, IP address, user-agent, and checksum.
- **E-SIGN Act Compliance**: Interactive HTML5 touch/mouse canvas captures legal digital consent and discharge signatures.

---

## 2. Quick Start & Setup Guide

### Prerequisites
- Node.js 18.17+ or 20+
- Docker (for PostgreSQL) or existing Postgres instance
- npm or pnpm

### Step 1: Clone and Install Dependencies
```bash
git clone https://github.com/your-org/handshake-caretracker.git
cd handshake-caretracker
npm install
```

### Step 2: Configure Environment Variables
Create a `.env` file in the project root:
```env
# PostgreSQL Connection URL
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/caretracker?schema=public"

# Node Environment
NODE_ENV="development"

# App URL for callbacks & QR codes
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### Step 3: Launch PostgreSQL with Docker
Run the following one-line command to spin up a local PostgreSQL container:
```bash
docker run --name caretracker-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=caretracker -p 5432:5432 -d postgres:16-alpine
```

### Step 4: Run Prisma Database Migrations
Initialize the database schema and generate the Prisma Client:
```bash
# Push schema to PostgreSQL
npx prisma db push

# Or run full migration history
npx prisma migrate dev --name init_healthcare_schema

# Generate Prisma Client
npx prisma generate
```

### Step 5: Start the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) or [http://localhost:3000/dashboard](http://localhost:3000/dashboard) to explore the live tracker.

---

## 3. Core Deliverables Directory Structure

| File Path | Description |
|:---|:---|
| `prisma/schema.prisma` | Full relational schema for `Patient`, `PatientVisit`, `DigitalHandshake`, and `AuditLog`. |
| `lib/types.ts` | Zod validation schemas for patient intake, handshake submission, and DTO types. |
| `lib/security.ts` | SHA-256 cryptographic digest generator and timing-safe verification utilities. |
| `lib/prisma.ts` | Singleton Prisma Client connection pooling helper. |
| `app/api/handshake/route.ts` | Next.js POST API endpoint executing atomic transaction, audit logging, and signature sealing. |
| `components/HandshakeSignatureModal.tsx` | Client signature canvas modal with live SHA-256 streaming hash preview. |
| `app/dashboard/page.tsx` | Filterable queue management board (List & Kanban) with real-time stats and triage alerts. |

---

## 4. API Specification

### `POST /api/handshake`
Discharges a patient encounter and seals the record with two-party cryptographic proof.

**Request Body (JSON):**
```json
{
  "visitId": "vst-101",
  "patientId": "pat-001",
  "doctorId": "doc-101",
  "doctorName": "Dr. Evelyn Vance, MD",
  "doctorLicense": "MD-88291-NY",
  "doctorPin": "4829",
  "patientToken": "HSK-4819",
  "doctorSignatureData": "data:image/svg+xml;base64,...",
  "patientSignatureData": "data:image/png;base64,...",
  "clinicalSummary": "Patient evaluated for acute chest discomfort. Serial troponins negative. Vitals normalized.",
  "prescriptions": [
    "Aspirin 81mg PO daily",
    "Cardiology outpatient follow-up in 7 days"
  ],
  "dischargeInstructions": "Return immediately if chest tightness recurs, or if syncope/dyspnea develops."
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Patient visit successfully discharged and cryptographically sealed.",
  "receipt": {
    "receiptId": "handshake-uuid",
    "visitId": "vst-101",
    "mrn": "MRN-84192",
    "patientName": "Eleanor Sterling",
    "doctorName": "Dr. Evelyn Vance, MD",
    "doctorLicense": "MD-88291-NY",
    "cryptographicHash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    "timestamp": "2026-10-27T10:15:00.000Z",
    "verifiedTwoParty": true
  }
}
```

---

## 5. Security & Verification Testing

To execute automated unit and security tests:
```bash
npm test
```
All cryptographic hashing and two-party assertions are verified with `node:test` and `node:assert/strict`.
