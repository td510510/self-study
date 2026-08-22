/**
 * LAB 13 — Tự cài JWT, tái hiện lỗ hổng, RBAC và cô lập tenant
 *
 * Chạy:  node labs/lab13-auth/01-jwt.js
 *
 * ⚠️ Code này để HỌC. Ở production hãy dùng thư viện đã kiểm chứng (jose, jsonwebtoken).
 */

import crypto from 'node:crypto';

const b64url = (buf) => Buffer.from(buf).toString('base64url');
const tuB64url = (s) => Buffer.from(s, 'base64url').toString();

// ══════════════════════════════════════════════════════════════════════════
// 1. TỰ CÀI JWT
// ══════════════════════════════════════════════════════════════════════════
function ky(header, payload, secret) {
  const data = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(payload))}`;
  const sig = crypto.createHmac('sha256', secret).update(data).digest('base64url');
  return `${data}.${sig}`;
}

export function taoJWT(payload, secret, { hetHanGiay = 900 } = {}) {
  const now = Math.floor(Date.now() / 1000);
  return ky(
    { alg: 'HS256', typ: 'JWT' },
    { ...payload, iat: now, exp: now + hetHanGiay },
    secret
  );
}

/**
 * @param nghiemNgat true = kiểm tra thuật toán (ĐÚNG).
 *                   false = tin vào header alg (SAI — tái hiện lỗ hổng).
 */
export function kiemTraJWT(token, secret, { nghiemNgat = true } = {}) {
  const phan = token.split('.');
  if (phan.length !== 3) throw new Error('Token sai định dạng');
  const [h64, p64, sig] = phan;
  const header = JSON.parse(tuB64url(h64));
  const payload = JSON.parse(tuB64url(p64));

  if (nghiemNgat) {
    // 🔒 Phải CHỈ ĐỊNH thuật toán mình chấp nhận, KHÔNG đọc từ header của kẻ tấn công.
    if (header.alg !== 'HS256') throw new Error(`Thuật toán không được chấp nhận: ${header.alg}`);
  } else {
    // 🐛 LỖ HỔNG: tin vào alg do client gửi
    if (header.alg === 'none') return payload; // bỏ qua chữ ký!
  }

  const mongDoi = crypto.createHmac('sha256', secret).update(`${h64}.${p64}`).digest('base64url');
  // So sánh HẰNG THỜI GIAN để không rò rỉ thông tin qua thời gian so sánh
  const a = Buffer.from(sig), b = Buffer.from(mongDoi);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) throw new Error('Chữ ký sai');

  if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) throw new Error('Token hết hạn');
  return payload;
}

const SECRET = crypto.randomBytes(32).toString('hex');

console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║ PHẦN 1 — JWT: PAYLOAD KHÔNG ĐƯỢC MÃ HOÁ                                      ║
╚══════════════════════════════════════════════════════════════════════════════╝
`);

const token = taoJWT({ sub: '42', role: 'user', tenantId: 't-001' }, SECRET);
console.log(`  Token:\n     ${token}\n`);

const [h, p] = token.split('.');
console.log(`  Ai cũng giải mã được (không cần secret gì cả):`);
console.log(`     header : ${tuB64url(h)}`);
console.log(`     payload: ${tuB64url(p)}`);
console.log(`
  📌 Chữ ký chỉ đảm bảo token KHÔNG BỊ SỬA. Nó KHÔNG giấu nội dung.
     → Tuyệt đối không đặt vào JWT: mật khẩu, số thẻ, CCCD, ghi chú nội bộ.
     → Nếu cần giấu nội dung, dùng JWE (mã hoá) chứ không phải JWS (chỉ ký).
`);

// ══════════════════════════════════════════════════════════════════════════
// 2. LỖ HỔNG alg:none
// ══════════════════════════════════════════════════════════════════════════
console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║ PHẦN 2 — LỖ HỔNG "alg: none" (CVE thật, đã xảy ra ở nhiều thư viện)          ║
╚══════════════════════════════════════════════════════════════════════════════╝
`);

// Kẻ tấn công tự chế token: đổi alg thành "none", tự nâng mình lên admin, bỏ chữ ký.
const tokenGia =
  b64url(JSON.stringify({ alg: 'none', typ: 'JWT' })) +
  '.' +
  b64url(JSON.stringify({ sub: '42', role: 'admin', exp: 9_999_999_999 })) +
  '.';

console.log(`  Kẻ tấn công gửi token tự chế với role="admin" và KHÔNG có chữ ký.\n`);

for (const [nhan, opts] of [
  ['❌ Verify LỎNG (tin vào header alg)', { nghiemNgat: false }],
  ['✅ Verify NGHIÊM (chỉ định thuật toán)', { nghiemNgat: true }],
]) {
  try {
    const p = kiemTraJWT(tokenGia, SECRET, opts);
    console.log(`  ${nhan}\n     → CHẤP NHẬN! role = "${p.role}"  💀 TOÀN QUYỀN ADMIN\n`);
  } catch (e) {
    console.log(`  ${nhan}\n     → Từ chối: ${e.message}\n`);
  }
}

console.log(`  📌 Trong code thật, luôn viết:  jwt.verify(token, key, { algorithms: ['HS256'] })
  📌 Lỗ hổng anh em: đổi RS256 → HS256, dùng PUBLIC KEY (ai cũng có) làm secret HMAC
     để tự ký token hợp lệ. Cùng một nguyên nhân gốc: TIN VÀO INPUT CỦA KẺ TẤN CÔNG.
`);

// ══════════════════════════════════════════════════════════════════════════
// 3. RBAC + KIỂM TRA CHỦ SỞ HỮU + IDOR
// ══════════════════════════════════════════════════════════════════════════
console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║ PHẦN 3 — IDOR: lỗ hổng phổ biến nhất trong API thực tế                       ║
╚══════════════════════════════════════════════════════════════════════════════╝
`);

const QUYEN = {
  owner: ['order:read', 'order:write', 'order:delete', 'billing:read', 'user:manage'],
  admin: ['order:read', 'order:write', 'order:delete', 'user:manage'],
  member: ['order:read', 'order:write'],
  guest: ['order:read'],
};
const co = (u, q) => (QUYEN[u.role] ?? []).includes(q);

const DB_ORDERS = [
  { id: 1001, tenantId: 't-001', ownerId: '42', total: 500_000 },
  { id: 1002, tenantId: 't-001', ownerId: '99', total: 1_200_000 },
  { id: 1003, tenantId: 't-002', ownerId: '77', total: 8_000_000 }, // KHÁCH HÀNG KHÁC!
];

/** ❌ Chỉ kiểm tra AuthN — bug kinh điển */
function layDonHang_SAI(user, id) {
  if (!user) return { status: 401 };
  const o = DB_ORDERS.find((x) => x.id === id);
  return o ? { status: 200, data: o } : { status: 404 };
}

/** ✅ AuthN + RBAC + ràng buộc tenant + ràng buộc chủ sở hữu */
function layDonHang_DUNG(user, id) {
  if (!user) return { status: 401 };
  if (!co(user, 'order:read')) return { status: 403 };

  const o = DB_ORDERS.find(
    (x) =>
      x.id === id &&
      x.tenantId === user.tenantId &&                         // cô lập khách hàng
      (co(user, 'user:manage') || x.ownerId === user.sub)     // admin xem được của cả tenant
  );
  // 404 chứ không phải 403: không tiết lộ rằng bản ghi này TỒN TẠI
  return o ? { status: 200, data: o } : { status: 404 };
}

const ke = { sub: '42', role: 'member', tenantId: 't-001' };

console.log(`  Người dùng: sub=42, role=member, tenant=t-001\n`);
console.log('  Truy cập đơn hàng │ chủ sở hữu │ tenant │ hàm SAI      │ hàm ĐÚNG');
console.log('  ──────────────────┼────────────┼────────┼──────────────┼──────────');
for (const id of [1001, 1002, 1003]) {
  const o = DB_ORDERS.find((x) => x.id === id);
  const sai = layDonHang_SAI(ke, id);
  const dung = layDonHang_DUNG(ke, id);
  const moTa = (r) => (r.status === 200 ? `200 (${r.data.total.toLocaleString('vi-VN')}đ)` : String(r.status));
  const canh = sai.status === 200 && dung.status !== 200 ? ' 💀 RÒ RỈ' : '';
  console.log(
    `  ${String(id).padStart(17)} │${o.ownerId.padStart(11)} │ ${o.tenantId} │` +
      `${moTa(sai).padStart(13)} │${String(dung.status).padStart(9)}${canh}`
  );
}

console.log(`
  📌 Hàm SAI để người dùng 42 đọc được:
     - đơn 1002 của người khác CÙNG công ty (rò rỉ nội bộ)
     - đơn 1003 của KHÁCH HÀNG KHÁC HOÀN TOÀN (rò rỉ chéo tenant — sự cố nghiêm trọng nhất
       với một sản phẩm SaaS; đủ để mất hợp đồng và bị kiện)

  📌 Điều đáng sợ: hàm SAI hoạt động HOÀN HẢO khi test thủ công với tài khoản của mình.
     Bug chỉ lộ ra khi ai đó thử đổi id trên URL. Test tự động phải CÓ trường hợp
     "user A cố đọc dữ liệu của user B" — nếu không, bug này sẽ lên production.
`);

// ══════════════════════════════════════════════════════════════════════════
// 4. BẢNG PHÂN QUYỀN
// ══════════════════════════════════════════════════════════════════════════
console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║ PHẦN 4 — Bảng RBAC (viết ra bảng này TRƯỚC khi code)                         ║
╚══════════════════════════════════════════════════════════════════════════════╝
`);

const HANH_DONG = ['order:read', 'order:write', 'order:delete', 'billing:read', 'user:manage'];
console.log('  vai trò │ ' + HANH_DONG.map((a) => a.padEnd(13)).join('│ '));
console.log('  ────────┼─' + HANH_DONG.map(() => '─'.repeat(13)).join('┼─'));
for (const r of Object.keys(QUYEN)) {
  console.log(
    `  ${r.padEnd(7)} │ ` +
      HANH_DONG.map((a) => (co({ role: r }, a) ? '✅' : '❌').padEnd(13)).join('│ ')
  );
}

console.log(`
  📌 Bảng này là TÀI LIỆU ĐẶC TẢ, không chỉ là code. Nó giúp:
     - Product và Security cùng review được mà không cần đọc code
     - Sinh ra test tự động: mỗi ô là một test case
     - Phát hiện lỗi thiết kế sớm (vì sao admin xem được billing? guest sửa được gì?)

  📌 Nhưng nhớ: RBAC chỉ là TẦNG 2. Tầng 3 — kiểm tra CHỦ SỞ HỮU của từng bản ghi —
     mới là chỗ hay thủng nhất, và nó KHÔNG thể hiện được trên bảng này.

📝 BÀI TẬP:
   a) Cài refresh token: access 15 phút + refresh 30 ngày lưu trong "DB",
      có endpoint thu hồi. Chứng minh access token cũ vẫn dùng được sau khi thu hồi
      (và giải thích vì sao điều đó CHẤP NHẬN ĐƯỢC).
   b) Thêm "token version": mỗi user có trường tokenVersion trong DB, nhét vào JWT.
      Đổi mật khẩu → tăng version → mọi token cũ vô hiệu. Cái giá là gì?
      (Gợi ý: giờ mỗi request phải đọc DB — bạn vừa mất lợi thế "không cần store" của JWT.)
   c) Cài mô phỏng Row Level Security: một hàm query BẮT BUỘC nhận tenantId,
      không có cách nào gọi mà thiếu nó. Vì sao thiết kế API kiểu này an toàn hơn
      là "nhớ thêm WHERE tenant_id"?
`);
