/**
 * S3 / Cloudflare R2 request signing (AWS Signature Version 4).
 *
 * ── Why this is hand-rolled rather than using an SDK ────────────────────
 * `@aws-sdk/client-s3` pulls roughly 12 MB of dependency tree to perform one
 * PUT. The signing algorithm is fixed by the S3 spec and is about 40 lines, so
 * implementing it keeps the dependency list unchanged — a standing project
 * constraint — and makes the whole mechanism auditable in a single file.
 *
 * ── Why R2 needs S3 signing at all ──────────────────────────────────────
 * R2 exposes an S3-compatible endpoint at
 * `<account>.r2.cloudflarestorage.com`. There is no R2-specific REST API for
 * object upload, so the S3 protocol is the supported path.
 *
 * Reference: AWS "Signature Version 4 signing process".
 */

import { createHash, createHmac } from 'node:crypto';

/** R2 is region-agnostic; the spec still requires the literal. */
const REGION = 'auto';
const SERVICE = 's3';
const ALGORITHM = 'AWS4-HMAC-SHA256';

/**
 * @param {Buffer|string} key
 * @param {string} data
 * @returns {Buffer}
 */
function hmac(key: Buffer | string, data: string): Buffer {
  return createHmac('sha256', key).update(data, 'utf8').digest();
}

/**
 * @param {string|Uint8Array} data
 * @returns {string} lowercase hex digest
 */
function sha256Hex(data: string | Uint8Array): string {
  return createHash('sha256').update(data).digest('hex');
}

export interface SignArgs {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  /** Object key, e.g. `images/hero-training.jpg`. */
  key: string;
  body: Buffer;
  contentType: string;
}

export interface SignedRequest {
  url: string;
  headers: Record<string, string>;
}

/**
 * Build a signed PUT request for an R2 object.
 *
 * The canonical request must list headers in lowercase, sorted order — the
 * `signedHeaders` string is what the server re-derives, so any mismatch between
 * the two produces `SignatureDoesNotMatch` with no further explanation.
 *
 * @param {SignArgs} args
 * @returns {SignedRequest}
 */
export function signPutRequest({
  accountId,
  accessKeyId,
  secretAccessKey,
  bucket,
  key,
  body,
  contentType,
}: SignArgs): SignedRequest {
  const host = `${accountId}.r2.cloudflarestorage.com`;
  const canonicalUri = `/${bucket}/${key}`;

  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
  const dateStamp = amzDate.slice(0, 8);

  const payloadHash = sha256Hex(body);

  const canonicalHeaders =
    `content-type:${contentType}\n` +
    `host:${host}\n` +
    `x-amz-content-sha256:${payloadHash}\n` +
    `x-amz-date:${amzDate}\n`;
  const signedHeaders = 'content-type;host;x-amz-content-sha256;x-amz-date';

  const canonicalRequest = [
    'PUT',
    canonicalUri,
    '', // no query string
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join('\n');

  const credentialScope = `${dateStamp}/${REGION}/${SERVICE}/aws4_request`;
  const stringToSign = [
    ALGORITHM,
    amzDate,
    credentialScope,
    sha256Hex(canonicalRequest),
  ].join('\n');

  const kDate = hmac(`AWS4${secretAccessKey}`, dateStamp);
  const kRegion = hmac(kDate, REGION);
  const kService = hmac(kRegion, SERVICE);
  const kSigning = hmac(kService, 'aws4_request');
  const signature = createHmac('sha256', kSigning).update(stringToSign, 'utf8').digest('hex');

  const authorization =
    `${ALGORITHM} Credential=${accessKeyId}/${credentialScope}, ` +
    `SignedHeaders=${signedHeaders}, Signature=${signature}`;

  return {
    url: `https://${host}${canonicalUri}`,
    headers: {
      Authorization: authorization,
      'Content-Type': contentType,
      'x-amz-content-sha256': payloadHash,
      'x-amz-date': amzDate,
    },
  };
}
