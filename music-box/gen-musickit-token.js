#!/usr/bin/env node
// Usage: node gen-musickit-token.js <KEY_ID> <TEAM_ID> <path/to/AuthKey_XXXXXX.p8>
//
// KEY_ID  — 10-char ID shown on the key detail page in Apple Developer portal
// TEAM_ID — 10-char ID shown in Membership or top-right of the portal
// .p8     — the private key file downloaded when you created the key

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const [,, keyId, teamId, keyFilePath] = process.argv;

if (!keyId || !teamId || !keyFilePath) {
  console.error('Usage: node gen-musickit-token.js <KEY_ID> <TEAM_ID> <path/to/AuthKey.p8>');
  process.exit(1);
}

function b64url(buf) {
  return buf.toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

const privateKey = fs.readFileSync(path.resolve(keyFilePath), 'utf8');

const now = Math.floor(Date.now() / 1000);
const exp = now + 15_777_000; // ~6 months

const header  = b64url(Buffer.from(JSON.stringify({ alg: 'ES256', kid: keyId })));
const payload = b64url(Buffer.from(JSON.stringify({ iss: teamId, iat: now, exp })));
const signingInput = `${header}.${payload}`;

const sign = crypto.createSign('SHA256');
sign.update(signingInput);
// ieee-p1363 gives raw R||S bytes (64 bytes for P-256) rather than DER — required for ES256 JWTs
const sigBuf = sign.sign({ key: privateKey, dsaEncoding: 'ieee-p1363' });

const token = `${signingInput}.${b64url(sigBuf)}`;

console.log('\n✅ MusicKit JWT:\n');
console.log(token);
console.log(`\nExpires: ${new Date(exp * 1000).toLocaleDateString()} (~6 months from now)`);
console.log('\nPaste into music-box/.env.local as:');
console.log(`VITE_MUSICKIT_TOKEN=${token}`);
