/**
 * LAB 01 — Khung 4 bước thiết kế
 *
 * Chạy:  node labs/lab01-khung-thiet-ke/01-checklist.js
 *
 * Mục tiêu: tự chấm xem bạn có bỏ sót bước nào khi tiếp cận một bài thiết kế.
 * Việc của bạn: mở file `bai-lam.js` cùng thư mục, điền câu trả lời, rồi chạy lại file này.
 */

import baiLam from './bai-lam.js';

const DE_BAI = `
┌──────────────────────────────────────────────────────────────────────┐
│ ĐỀ BÀI                                                               │
│                                                                      │
│ Thiết kế hệ thống "Rút gọn link" (như bit.ly):                       │
│   - Người dùng dán URL dài, nhận về link ngắn                        │
│   - Ai truy cập link ngắn thì được redirect sang URL gốc             │
│                                                                      │
│ Hãy điền câu trả lời vào file bai-lam.js theo khung 4 bước.          │
└──────────────────────────────────────────────────────────────────────┘
`;

/** Mỗi tiêu chí: id, mô tả, hàm kiểm tra, gợi ý khi thiếu */
const TIEU_CHI = [
  {
    buoc: 'Bước 1 — Làm rõ yêu cầu',
    items: [
      {
        ten: 'Liệt kê >= 3 yêu cầu functional',
        dat: (b) => b.functional?.length >= 3,
        goiY: 'Hệ thống LÀM GÌ? Tạo link, redirect, xem thống kê, đặt hạn dùng...',
      },
      {
        ten: 'Liệt kê >= 3 yêu cầu non-functional',
        dat: (b) => b.nonFunctional?.length >= 3,
        goiY: 'Làm TỐT ĐẾN ĐÂU? QPS, latency p99, uptime, tỉ lệ đọc/ghi.',
      },
      {
        ten: 'Nêu rõ thứ CỐ TÌNH bỏ qua (cắt scope)',
        dat: (b) => b.ngoaiPhamVi?.length >= 1,
        goiY: 'Nói ra "em bỏ qua X" quan trọng ngang việc nói "em làm Y".',
      },
    ],
  },
  {
    buoc: 'Bước 2 — Ước lượng',
    items: [
      {
        ten: 'Có ước lượng QPS ghi và QPS đọc',
        dat: (b) => typeof b.qpsGhi === 'number' && typeof b.qpsDoc === 'number',
        goiY: 'QPS = số sự kiện mỗi ngày / 86400. Peak thường gấp 2-3 lần.',
      },
      {
        ten: 'Có ước lượng dung lượng lưu trữ trong 5 năm',
        dat: (b) => typeof b.storageGB === 'number' && b.storageGB > 0,
        goiY: 'số bản ghi/ngày × bytes/bản ghi × 365 × 5.',
      },
      {
        ten: 'Tỉ lệ đọc:ghi > 1 (nhận ra đây là hệ đọc nhiều)',
        dat: (b) => b.qpsDoc / Math.max(b.qpsGhi, 1e-9) > 1,
        goiY: 'Link được tạo 1 lần nhưng click rất nhiều lần.',
      },
    ],
  },
  {
    buoc: 'Bước 3 — Thiết kế tổng thể',
    items: [
      {
        ten: 'Định nghĩa >= 2 API endpoint',
        dat: (b) => b.api?.length >= 2,
        goiY: 'Ví dụ: POST /links  và  GET /:code',
      },
      {
        ten: 'Có data model (ít nhất tên bảng + các cột)',
        dat: (b) => b.dataModel && Object.keys(b.dataModel).length >= 1,
        goiY: 'links(code PK, longUrl, ownerId, createdAt, expiresAt)',
      },
      {
        ten: 'Có sơ đồ các thành phần (>= 3 thành phần)',
        dat: (b) => b.thanhPhan?.length >= 3,
        goiY: 'Client → Load Balancer → App → Cache → DB',
      },
    ],
  },
  {
    buoc: 'Bước 4 — Đào sâu & đánh đổi',
    items: [
      {
        ten: 'Chỉ ra bottleneck dự kiến',
        dat: (b) => !!b.bottleneck,
        goiY: 'Chỗ nào vỡ trước khi lưu lượng tăng 10 lần?',
      },
      {
        ten: 'Trả lời "nếu X chết thì sao" cho >= 2 thành phần',
        dat: (b) => Object.keys(b.neuChet ?? {}).length >= 2,
        goiY: 'Cache chết → dồn tải xuống DB. DB primary chết → không ghi được.',
      },
      {
        ten: 'Nêu ít nhất 1 đánh đổi có lý do',
        dat: (b) => !!b.danhDoi,
        goiY: 'Ví dụ: dùng cache 5 phút → nhanh hơn nhưng link vừa xoá vẫn redirect được.',
      },
    ],
  },
];

function main() {
  console.log(DE_BAI);

  let tong = 0;
  let dat = 0;

  for (const nhom of TIEU_CHI) {
    console.log(`\n${nhom.buoc}`);
    console.log('─'.repeat(70));
    for (const item of nhom.items) {
      tong++;
      let ok = false;
      try {
        ok = Boolean(item.dat(baiLam));
      } catch {
        ok = false;
      }
      if (ok) dat++;
      console.log(`  ${ok ? '✅' : '❌'} ${item.ten}`);
      if (!ok) console.log(`     💡 ${item.goiY}`);
    }
  }

  const pct = Math.round((dat / tong) * 100);
  console.log('\n' + '═'.repeat(70));
  console.log(`KẾT QUẢ: ${dat}/${tong} tiêu chí (${pct}%)`);
  console.log('═'.repeat(70));

  if (pct === 100) {
    console.log('🎉 Đủ khung. Giờ hãy tự hỏi: thiết kế này có ĐƠN GIẢN NHẤT có thể chưa?');
  } else if (pct >= 60) {
    console.log('🙂 Khá ổn. Xem lại các dòng ❌ ở trên — đó chính là chỗ hay bị hỏi vặn.');
  } else {
    console.log('📚 Đọc lại mục 4 của docs/01-nhap-mon-tu-duy-thiet-ke.md rồi làm lại.');
  }
}

main();
