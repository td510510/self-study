/**
 * LAB 03.1 — Máy tính ước lượng dung lượng (back-of-the-envelope)
 *
 * Chạy:  node labs/lab03-do-luong/01-capacity.js
 *
 * Sửa các con số trong DE_BAI rồi chạy lại để xem thiết kế đổi như thế nào.
 * ĐÂY LÀ ĐIỂM QUAN TRỌNG: con số phải DẪN TỚI QUYẾT ĐỊNH, không phải để cho đẹp.
 */

// ─── Đầu vào: đổi các số này và quan sát kết luận thay đổi ──────────────────
const DE_BAI = {
  ten: 'Twitter mini',
  tongUser: 300_000_000,
  tyLeDAU: 0.5, // bao nhiêu % user hoạt động mỗi ngày
  ghiMoiUserMoiNgay: 2, // số bài đăng
  bytesMoiBanGhi: 300,
  docMoiUserMoiNgay: 10, // số lần mở feed
  banGhiMoiLanDoc: 20, // số bài mỗi feed
  heSoPeak: 3, // giờ cao điểm gấp mấy lần trung bình
  soNamLuu: 5,
  tyLeCoAnh: 0.1,
  bytesMoiAnh: 200 * 1024,
};

// ─── Hằng số ────────────────────────────────────────────────────────────────
const GIAY_MOI_NGAY = 86_400;
const KB = 1024, MB = KB * 1024, GB = MB * 1024, TB = GB * 1024, PB = TB * 1024;

const doiDungLuong = (bytes) => {
  if (bytes >= PB) return (bytes / PB).toFixed(1) + ' PB';
  if (bytes >= TB) return (bytes / TB).toFixed(1) + ' TB';
  if (bytes >= GB) return (bytes / GB).toFixed(1) + ' GB';
  if (bytes >= MB) return (bytes / MB).toFixed(1) + ' MB';
  return bytes + ' B';
};
const soDep = (n) => Math.round(n).toLocaleString('vi-VN');

function tinh(d) {
  const dau = d.tongUser * d.tyLeDAU;

  const ghiMoiNgay = dau * d.ghiMoiUserMoiNgay;
  const qpsGhi = ghiMoiNgay / GIAY_MOI_NGAY;

  const luotDocMoiNgay = dau * d.docMoiUserMoiNgay;
  const qpsDoc = luotDocMoiNgay / GIAY_MOI_NGAY;

  const storageMoiNgay = ghiMoiNgay * d.bytesMoiBanGhi;
  const storageTong = storageMoiNgay * 365 * d.soNamLuu;

  const anhMoiNgay = ghiMoiNgay * d.tyLeCoAnh * d.bytesMoiAnh;
  const anhTong = anhMoiNgay * 365 * d.soNamLuu;

  // Băng thông đọc = QPS đọc peak × số bản ghi mỗi lần × bytes
  const bwDocBps = qpsDoc * d.heSoPeak * d.banGhiMoiLanDoc * d.bytesMoiBanGhi;

  return {
    dau,
    ghiMoiNgay,
    qpsGhi,
    qpsGhiPeak: qpsGhi * d.heSoPeak,
    luotDocMoiNgay,
    qpsDoc,
    qpsDocPeak: qpsDoc * d.heSoPeak,
    tyLeDocGhi: qpsDoc / qpsGhi,
    storageMoiNgay,
    storageTong,
    anhTong,
    bwDocBps,
  };
}

// ─── Suy ra quyết định thiết kế từ con số ───────────────────────────────────
function ketLuan(r) {
  const out = [];

  if (r.tyLeDocGhi >= 5)
    out.push(`Đọc gấp ${r.tyLeDocGhi.toFixed(0)}x ghi → hệ ĐỌC NHIỀU. Ưu tiên cache (buổi 05) + read replica (buổi 07).`);
  else if (r.tyLeDocGhi <= 1)
    out.push(`Ghi >= đọc → hệ GHI NHIỀU. Cache ít tác dụng. Cân nhắc ghi bất đồng bộ qua queue (buổi 08), LSM-tree DB.`);
  else out.push(`Đọc/ghi cân bằng (${r.tyLeDocGhi.toFixed(1)}x) → thiết kế cân đối, chưa cần tối ưu lệch.`);

  if (r.storageTong > 5 * TB)
    out.push(`Dữ liệu ${doiDungLuong(r.storageTong)} > 5 TB → một máy không chứa nổi → BẮT BUỘC sharding (buổi 07).`);
  else
    out.push(`Dữ liệu ${doiDungLuong(r.storageTong)} → một máy chứa được. ĐỪNG sharding vội — nó làm mọi thứ phức tạp hơn nhiều.`);

  if (r.anhTong > 100 * TB)
    out.push(`File media ${doiDungLuong(r.anhTong)} → object storage (S3) + CDN (buổi 11). Tuyệt đối không nhét blob vào DB.`);

  if (r.qpsDocPeak > 10_000)
    out.push(`Peak ${soDep(r.qpsDocPeak)} QPS đọc → cần ~${Math.ceil(r.qpsDocPeak / 2000)} app server + load balancer (buổi 04).`);

  if (r.qpsGhiPeak > 5_000)
    out.push(`Peak ${soDep(r.qpsGhiPeak)} QPS ghi → một primary DB sẽ hụt hơi. Cân nhắc queue đệm ghi (buổi 08).`);

  const gbps = (r.bwDocBps * 8) / 1e9;
  if (gbps > 1)
    out.push(`Băng thông đọc ~${gbps.toFixed(1)} Gbps → vượt 1 NIC thường → cần CDN và/hoặc nhiều edge.`);

  return out;
}

// ─── In kết quả ─────────────────────────────────────────────────────────────
const r = tinh(DE_BAI);

console.log(`\n╔${'═'.repeat(66)}╗`);
console.log(`║ ƯỚC LƯỢNG DUNG LƯỢNG — ${DE_BAI.ten.padEnd(41)}║`);
console.log(`╚${'═'.repeat(66)}╝\n`);

const dong = (nhan, giaTri) => console.log(`  ${nhan.padEnd(38, '.')} ${giaTri}`);

console.log('▌ NGƯỜI DÙNG');
dong('Tổng user', soDep(DE_BAI.tongUser));
dong('DAU (hoạt động hàng ngày)', soDep(r.dau));

console.log('\n▌ THÔNG LƯỢNG');
dong('Bản ghi mới mỗi ngày', soDep(r.ghiMoiNgay));
dong('QPS ghi (trung bình)', soDep(r.qpsGhi));
dong(`QPS ghi (peak ×${DE_BAI.heSoPeak})`, soDep(r.qpsGhiPeak));
dong('QPS đọc (trung bình)', soDep(r.qpsDoc));
dong(`QPS đọc (peak ×${DE_BAI.heSoPeak})`, soDep(r.qpsDocPeak));
dong('Tỉ lệ đọc : ghi', r.tyLeDocGhi.toFixed(1) + ' : 1');

console.log('\n▌ LƯU TRỮ');
dong('Dữ liệu mới mỗi ngày', doiDungLuong(r.storageMoiNgay));
dong(`Tổng sau ${DE_BAI.soNamLuu} năm`, doiDungLuong(r.storageTong));
dong(`Media sau ${DE_BAI.soNamLuu} năm`, doiDungLuong(r.anhTong));

console.log('\n▌ BĂNG THÔNG');
dong('Đọc (peak)', doiDungLuong(r.bwDocBps) + '/s  ≈ ' + ((r.bwDocBps * 8) / 1e9).toFixed(2) + ' Gbps');

console.log('\n▌ CÁC CON SỐ NÀY DẪN TỚI QUYẾT ĐỊNH GÌ?');
for (const k of ketLuan(r)) console.log(`  → ${k}`);

console.log(`\n💡 Bài tập: sửa DE_BAI thành 1 startup nhỏ (10.000 user) rồi chạy lại.`);
console.log(`   Bạn sẽ thấy kết luận đổi hoàn toàn — và đó là lý do phải TÍNH TRƯỚC KHI VẼ.\n`);
