/**
 * Générateur TOTP RFC 6238 minimal — utilisé par le helper enterprise-session
 * pour armer le 2FA d'un compte owner fraîchement créé sans dépendance
 * externe (pas d'ajout de `otplib` dans package.json).
 *
 * Compat : algo HMAC-SHA1, période 30s, code 6 chiffres — matche la conf par
 * défaut du back Skilluv (voir authApi.totpSetup).
 */
import { createHmac } from 'node:crypto';

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function base32Decode(input: string): Buffer {
	const cleaned = input.toUpperCase().replace(/=+$/, '').replace(/\s+/g, '');
	const out: number[] = [];
	let bits = 0;
	let value = 0;
	for (const c of cleaned) {
		const idx = BASE32_ALPHABET.indexOf(c);
		if (idx === -1) continue;
		value = (value << 5) | idx;
		bits += 5;
		if (bits >= 8) {
			out.push((value >>> (bits - 8)) & 0xff);
			bits -= 8;
		}
	}
	return Buffer.from(out);
}

export function totpCode(secretBase32: string, whenMs: number = Date.now()): string {
	const counter = Math.floor(whenMs / 1000 / 30);
	const buf = Buffer.alloc(8);
	// Node's writeBigInt64BE existe depuis 14 — safe ici.
	buf.writeBigInt64BE(BigInt(counter));
	const key = base32Decode(secretBase32);
	const hmac = createHmac('sha1', key).update(buf).digest();
	const offset = hmac[hmac.length - 1] & 0x0f;
	const code =
		((hmac[offset] & 0x7f) << 24) |
		((hmac[offset + 1] & 0xff) << 16) |
		((hmac[offset + 2] & 0xff) << 8) |
		(hmac[offset + 3] & 0xff);
	return String(code % 1_000_000).padStart(6, '0');
}
