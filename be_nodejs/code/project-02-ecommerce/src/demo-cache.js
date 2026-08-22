/**
 * Buổi 21 — Redis: đo lợi ích và các cái bẫy.
 *
 * Chạy:  node --env-file=.env src/demo-cache.js
 */

import { prisma } from './lib/prisma.js';
import { layRedis, dongRedis, cacheAside, xoaCacheTheoMau, demRateLimit } from './lib/redis.js';

const redis = layRedis();
await redis.flushdb();

// ── Truy vấn nặng để làm ví dụ ──────────────────────────────────
async function thongKeNang() {
  const [tong, theoTrangThai, doanhThu] = await Promise.all([
    prisma.donHang.count(),
    prisma.donHang.groupBy({ by: ['trangThai'], _count: { _all: true } }),
    prisma.donHang.aggregate({ _sum: { tongTienVND: true }, _avg: { tongTienVND: true } }),
  ]);
  return { tong, theoTrangThai, doanhThu };
}

async function do_(fn) {
  const batDau = process.hrtime.bigint();
  const kq = await fn();
  return { msec: Number(process.hrtime.bigint() - batDau) / 1e6, kq };
}

// ═══════════════════════════════════════════════════════════════
console.log('═══ 1. Cache-aside: HIT nhanh hơn MISS bao nhiêu ═══\n');

const tongDon = await prisma.donHang.count();
console.log(`  Bảng don_hangs có ${tongDon.toLocaleString('vi-VN')} dòng`);
console.log(`  Truy vấn: count + groupBy + aggregate\n`);

const KHOA = 'thongke:donhang';

const miss = await do_(() => cacheAside(KHOA, 60, thongKeNang));
console.log(`  Lần 1 (cache MISS)  ${miss.msec.toFixed(2).padStart(8)} ms   tuCache=${miss.kq.tuCache}`);

const hits = [];
for (let i = 0; i < 3; i++) {
  const r = await do_(() => cacheAside(KHOA, 60, thongKeNang));
  hits.push(r.msec);
  console.log(`  Lần ${i + 2} (cache HIT)   ${r.msec.toFixed(2).padStart(8)} ms   tuCache=${r.kq.tuCache}`);
}

const hitTB = hits.reduce((a, b) => a + b, 0) / hits.length;
console.log(`\n  → HIT nhanh gấp ${(miss.msec / hitTB).toFixed(0)} lần so với MISS\n`);

// ═══════════════════════════════════════════════════════════════
console.log('═══ 2. Cái giá: DỮ LIỆU CŨ (stale) ═══\n');

const truoc = (await cacheAside(KHOA, 60, thongKeNang)).duLieu.tong;

// Có người đặt thêm đơn hàng
const u = await prisma.user.findFirst({ select: { id: true } });
await prisma.donHang.create({
  data: {
    maDon: `DH-CACHE-${Date.now()}`,
    userId: u.id,
    tongTienVND: 999_000,
    diaChiGiao: 'x',
    soDienThoai: '0901234567',
  },
});

const sau = (await cacheAside(KHOA, 60, thongKeNang)).duLieu.tong;
const that = await prisma.donHang.count();

console.log(`  Trước khi thêm đơn : ${truoc.toLocaleString('vi-VN')}`);
console.log(`  Cache vẫn trả về   : ${sau.toLocaleString('vi-VN')}  ${sau === truoc ? '← CŨ' : ''}`);
console.log(`  Số thật trong DB   : ${that.toLocaleString('vi-VN')}`);
console.log(`\n  → Cache LUÔN đánh đổi tính chính xác lấy tốc độ.`);
console.log(`     Câu hỏi thiết kế: dữ liệu này CŨ BAO LÂU thì chấp nhận được?\n`);

// ═══════════════════════════════════════════════════════════════
console.log('═══ 3. Vô hiệu hoá cache khi dữ liệu đổi ═══\n');

await xoaCacheTheoMau('thongke:*');
const sauKhiXoa = (await cacheAside(KHOA, 60, thongKeNang)).duLieu.tong;
console.log(`  Sau khi xoá cache  : ${sauKhiXoa.toLocaleString('vi-VN')}  ${sauKhiXoa === that ? '✅ khớp DB' : '❌'}`);
console.log(`
  HAI CHIẾN LƯỢC:

    TTL      — để cache tự hết hạn. Đơn giản, nhưng dữ liệu cũ tối đa TTL giây.
    XOÁ TAY  — mỗi lần ghi dữ liệu thì xoá cache liên quan. Chính xác hơn,
               nhưng phải NHỚ xoá ở MỌI chỗ ghi — dễ sót.

  Thực tế dùng CẢ HAI: xoá tay khi ghi, cộng TTL làm lưới an toàn.
`);

// ═══════════════════════════════════════════════════════════════
console.log('═══ 4. Cấu trúc khoá cache ═══\n');

// Khoá phải chứa MỌI tham số ảnh hưởng tới kết quả
const viDu = [
  ['sanpham:list:danhMuc=phu-kien:sapXep=gia-tang:trang=1', 'đủ tham số ✅'],
  ['sanpham:list', 'thiếu tham số 🚨 → mọi bộ lọc dùng chung một cache'],
  ['user:42:donhang', 'có id người dùng ✅'],
  ['donhang:list', 'thiếu id 🚨 → NGƯỜI DÙNG THẤY ĐƠN CỦA NGƯỜI KHÁC'],
];
for (const [khoa, ghiChu] of viDu) console.log(`  ${khoa.padEnd(52)} ${ghiChu}`);

console.log(`
  ⚠️ LỖI BẢO MẬT NGHIÊM TRỌNG NHẤT CỦA CACHE:
     quên đưa id người dùng vào khoá → cache dữ liệu riêng tư dùng chung.
     Người A đọc được đơn hàng của người B. Đây là sự cố thật đã xảy ra
     ở nhiều hệ thống lớn.
`);

// ═══════════════════════════════════════════════════════════════
console.log('═══ 5. Rate limit dùng chung nhiều tiến trình ═══\n');

const KHOA_RL = 'rl:demo:192.168.1.1';
const GIOI_HAN = 5;

for (let i = 1; i <= 7; i++) {
  const { dem, conLaiGiay } = await demRateLimit(KHOA_RL, 60);
  const chan = dem > GIOI_HAN;
  console.log(
    `  request ${i}: đếm=${dem}  ${chan ? `🚫 CHẶN (thử lại sau ${conLaiGiay}s)` : '✅ cho qua'}`
  );
}

console.log(`
  → Bộ đếm nằm ở REDIS, không nằm trong RAM của tiến trình.
    Chạy 4 bản sao server thì giới hạn vẫn đúng là ${GIOI_HAN} —
    khác với bản Map ở buổi 11 (mỗi bản sao đếm riêng → thành ${GIOI_HAN * 4}).
`);

// ═══════════════════════════════════════════════════════════════
console.log('═══ 6. Redis chết thì sao? ═══\n');

// Giả lập bằng cách trỏ tới cổng không có ai nghe
const redisHong = new (await import('ioredis')).default('redis://localhost:6399', {
  maxRetriesPerRequest: 1,
  retryStrategy: () => null,
  enableOfflineQueue: false,
});
redisHong.on('error', () => {});

const batDau = Date.now();
let vanChay = false;
try {
  await redisHong.get('bat-ky');
} catch {
  // Cache lỗi → rơi về database. Ứng dụng CHẬM chứ không CHẾT.
  await thongKeNang();
  vanChay = true;
}
redisHong.disconnect();

console.log(`  Redis không truy cập được → ứng dụng ${vanChay ? '✅ VẪN CHẠY' : '❌ chết'} (${Date.now() - batDau}ms)`);
console.log(`
  NGUYÊN TẮC: cache là thứ TĂNG TỐC, không phải thứ BẮT BUỘC.
  Mọi thao tác Redis phải bọc try/catch và có đường lui về database.

  Nhưng lưu ý: nếu hệ thống ĐANG dựa vào cache để chịu tải,
  Redis chết đồng nghĩa toàn bộ tải dồn xuống database cùng lúc
  → database sập theo. Hiện tượng này gọi là "thundering herd".
`);

await dongRedis();
await prisma.$disconnect();
