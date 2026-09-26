import { randomBytes, createHash } from 'node:crypto';

/** Đọc header Cookie thành object — đủ dùng cho demo, không cần cookie-parser. */
export function docCookie(req) {
  const kq = {};
  for (const phan of (req.headers.cookie ?? '').split(';')) {
    const i = phan.indexOf('=');
    if (i > 0) kq[phan.slice(0, i).trim()] = decodeURIComponent(phan.slice(i + 1).trim());
  }
  return kq;
}

/** Chuỗi ngẫu nhiên an toàn mật mã, dạng base64url (dùng được trong URL). */
export const ngauNhien = (byte = 32) => randomBytes(byte).toString('base64url');

/** PKCE: code_challenge = BASE64URL(SHA256(code_verifier)) */
export const sha256Base64Url = (chuoi) => createHash('sha256').update(chuoi).digest('base64url');
