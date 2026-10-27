import crypto from 'crypto';

/**
 * Generates an immutable, cryptographically secure SHA-256 digital signature digest
 * for a completed patient visit handshake.
 *
 * @param visitId - Unique encounter identifier
 * @param providerId - Licensed clinician identifier
 * @param signatureData - Dual signature payloads (doctor + patient combined hash)
 * @param timestamp - ISO 8601 creation timestamp
 * @returns 64-character hexadecimal SHA-256 string
 */
export function generateHandshakeHash(
  visitId: string,
  providerId: string,
  signatureData: string,
  timestamp: string
): string {
  const canonicalPayload = [
    `VISIT_ID:${visitId.trim()}`,
    `PROVIDER_ID:${providerId.trim()}`,
    `SIGNATURE_DIGEST:${crypto.createHash('sha256').update(signatureData.trim()).digest('hex')}`,
    `TIMESTAMP:${timestamp.trim()}`,
  ].join('||');

  return crypto
    .createHash('sha256')
    .update(canonicalPayload, 'utf8')
    .digest('hex');
}

/**
 * Computes a tamper-evident audit log checksum for HIPAA audit trail integrity.
 */
export function generateAuditChecksum(
  visitId: string | null,
  actorId: string,
  action: string,
  timestamp: string
): string {
  const payload = `${visitId || 'GLOBAL'}::${actorId}::${action}::${timestamp}`;
  return crypto.createHash('sha256').update(payload, 'utf8').digest('hex');
}

/**
 * Validates whether a given cryptographic hash matches the original handshake inputs.
 */
export function verifyHandshakeHash(
  expectedHash: string,
  visitId: string,
  providerId: string,
  signatureData: string,
  timestamp: string
): boolean {
  const computed = generateHandshakeHash(visitId, providerId, signatureData, timestamp);
  // Constant-time comparison to prevent timing attacks
  const bufferExpected = Buffer.from(expectedHash, 'hex');
  const bufferComputed = Buffer.from(computed, 'hex');

  if (bufferExpected.length !== bufferComputed.length) {
    return false;
  }
  return crypto.timingSafeEqual(bufferExpected, bufferComputed);
}

/**
 * Constant-time PIN verification helper for physician authorization.
 */
export function verifyDoctorPin(enteredPin: string, actualPin: string): boolean {
  if (!enteredPin || !actualPin) return false;
  const hashEntered = crypto.createHash('sha256').update(enteredPin.trim()).digest();
  const hashActual = crypto.createHash('sha256').update(actualPin.trim()).digest();
  return crypto.timingSafeEqual(hashEntered, hashActual);
}

/**
 * Helper to mask MRN for privacy display (e.g. MRN-***4192)
 */
export function maskMRN(mrn: string): string {
  if (!mrn || mrn.length < 5) return mrn;
  const prefix = mrn.slice(0, 4);
  const suffix = mrn.slice(-4);
  return `${prefix}***${suffix}`;
}
