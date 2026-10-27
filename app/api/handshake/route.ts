import { NextRequest, NextResponse } from 'next/server';
import { HandshakeSubmissionSchema, HandshakeReceipt } from '@/lib/types';
import { generateHandshakeHash, generateAuditChecksum } from '@/lib/security';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const timestamp = new Date().toISOString();
  const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';
  const userAgent = req.headers.get('user-agent') || 'Unknown User-Agent';

  try {
    // 1. Parse and validate JSON request body via Zod
    const body = await req.json();
    const validationResult = HandshakeSubmissionSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid handshake payload schema',
          issues: validationResult.error.format(),
        },
        { status: 400 }
      );
    }

    const payload = validationResult.data;

    // 2. Combine signature payloads for canonical digest
    const combinedSignaturePayload = `${payload.doctorSignatureData}##${payload.patientSignatureData}`;

    // 3. Generate immutable SHA-256 Cryptographic Hash
    const cryptographicHash = generateHandshakeHash(
      payload.visitId,
      payload.doctorId,
      combinedSignaturePayload,
      timestamp
    );

    // 4. Execute atomic database transaction
    const transactionResult = await prisma.$transaction(async (tx: any) => {
      // Find patient visit record
      const visit = await tx.patientVisit.findUnique({
        where: { id: payload.visitId },
        include: {
          patient: true,
          digitalHandshake: true,
        },
      });

      if (!visit) {
        throw new Error('VISIT_NOT_FOUND');
      }

      if (visit.status === 'DISCHARGED' || visit.digitalHandshake) {
        throw new Error('VISIT_ALREADY_DISCHARGED');
      }

      // Verify that the patient's handshake token matches
      if (
        visit.handshakeToken &&
        visit.handshakeToken.trim().toUpperCase() !== payload.patientToken.trim().toUpperCase()
      ) {
        throw new Error('HANDSHAKE_TOKEN_MISMATCH');
      }

      // Compute audit checksum
      const auditChecksum = generateAuditChecksum(
        visit.id,
        payload.doctorId,
        'DISCHARGE_SEALED',
        timestamp
      );

      // A. Create the immutable Digital Handshake record
      const digitalHandshake = await tx.digitalHandshake.create({
        data: {
          visitId: visit.id,
          patientId: visit.patientId,
          doctorId: payload.doctorId,
          doctorName: payload.doctorName,
          doctorLicense: payload.doctorLicense,
          patientToken: payload.patientToken,
          doctorSignatureData: payload.doctorSignatureData,
          patientSignatureData: payload.patientSignatureData,
          cryptographicHash,
          verifiedTwoParty: true,
          clinicalSummary: payload.clinicalSummary,
          prescriptions: payload.prescriptions,
          dischargeInstructions: payload.dischargeInstructions,
          signedAt: new Date(timestamp),
        },
      });

      // B. Transition PatientVisit to DISCHARGED
      const updatedVisit = await tx.patientVisit.update({
        where: { id: visit.id },
        data: {
          status: 'DISCHARGED',
          dischargeTime: new Date(timestamp),
          attendingDoctorId: payload.doctorId,
          attendingDoctorName: payload.doctorName,
          attendingDoctorLicense: payload.doctorLicense,
        },
      });

      // C. Record immutable HIPAA audit log entry
      const auditLog = await tx.auditLog.create({
        data: {
          visitId: visit.id,
          patientId: visit.patientId,
          actorId: payload.doctorId,
          actorRole: 'ATTENDING_PHYSICIAN',
          action: 'DISCHARGE_SEALED',
          description: `Two-party cryptographic sign-off completed by ${payload.doctorName} (${payload.doctorLicense}) with SHA-256 seal ${cryptographicHash.slice(0, 16)}...`,
          ipAddress: clientIp,
          userAgent: userAgent,
          checksum: auditChecksum,
          timestamp: new Date(timestamp),
        },
      });

      return {
        visit: updatedVisit,
        patient: visit.patient,
        digitalHandshake,
        auditLog,
      };
    });

    // 5. Build verified discharge receipt
    const receipt: HandshakeReceipt = {
      receiptId: transactionResult.digitalHandshake.id,
      visitId: transactionResult.visit.id,
      mrn: transactionResult.patient.mrn,
      patientName: `${transactionResult.patient.firstName} ${transactionResult.patient.lastName}`,
      doctorName: payload.doctorName,
      doctorLicense: payload.doctorLicense,
      cryptographicHash,
      timestamp,
      clinicalSummary: payload.clinicalSummary,
      prescriptions: payload.prescriptions,
      dischargeInstructions: payload.dischargeInstructions,
      verifiedTwoParty: true,
    };

    return NextResponse.json(
      {
        success: true,
        message: 'Patient visit successfully discharged and cryptographically sealed.',
        receipt,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('API Error in /api/handshake:', error);

    if (error.message === 'VISIT_NOT_FOUND') {
      return NextResponse.json(
        { success: false, error: 'Patient visit record not found in system.' },
        { status: 404 }
      );
    }

    if (error.message === 'VISIT_ALREADY_DISCHARGED') {
      return NextResponse.json(
        { success: false, error: 'Patient encounter has already been discharged and sealed.' },
        { status: 409 }
      );
    }

    if (error.message === 'HANDSHAKE_TOKEN_MISMATCH') {
      return NextResponse.json(
        { success: false, error: 'Patient handshake verification token does not match active record.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error processing cryptographic handshake.',
        detail: error?.message || 'Unknown database error',
      },
      { status: 500 }
    );
  }
}
