/**
 * Buổi 07 — Bước 2: cái bẫy forEach + async.
 *
 * Bug kinh điển. Code trông đúng, chạy không lỗi, kết quả sai.
 *
 * Chạy:  node 02-bay-foreach.js
 */

function luuVaoDb(item, msec = 200) {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log(`   [db] đã lưu ${item}`);
      resolve(item);
    }, msec);
  });
}

const ITEMS = ['A', 'B', 'C'];

// ═══════════════════════════════════════════════════════════════
// ❌ SAI: forEach không biết chờ async
// ═══════════════════════════════════════════════════════════════
async function saiVoiForEach() {
  console.log('❌ Bắt đầu forEach');

  ITEMS.forEach(async (item) => {
    await luuVaoDb(item);
  });

  // forEach BỎ QUA hoàn toàn Promise mà callback trả về.
  // Nó chạy hết vòng lặp rồi trả về undefined ngay lập tức.
  console.log('❌ forEach "xong" — NHƯNG CHƯA LƯU XONG CÁI NÀO!\n');
}

// ═══════════════════════════════════════════════════════════════
// ✅ ĐÚNG 1: for...of + await  (tuần tự)
// ═══════════════════════════════════════════════════════════════
async function dungVoiForOf() {
  console.log('✅ Bắt đầu for...of');
  for (const item of ITEMS) {
    await luuVaoDb(item);
  }
  console.log('✅ for...of xong — đã lưu HẾT\n');
}

// ═══════════════════════════════════════════════════════════════
// ✅ ĐÚNG 2: map + Promise.all  (song song)
// ═══════════════════════════════════════════════════════════════
async function dungVoiPromiseAll() {
  console.log('✅ Bắt đầu map + Promise.all');
  await Promise.all(ITEMS.map((item) => luuVaoDb(item)));
  console.log('✅ Promise.all xong — đã lưu HẾT\n');
}

await saiVoiForEach();

// Chờ một chút để thấy các log "đã lưu" của forEach xuất hiện MUỘN
await new Promise((r) => setTimeout(r, 400));
console.log('   ↑ Các dòng [db] này xuất hiện SAU khi forEach đã báo "xong"\n');
console.log('─'.repeat(58) + '\n');

await dungVoiForOf();
await dungVoiPromiseAll();

/*
 * VÌ SAO forEach KHÔNG CHỜ?
 *
 * Nhìn vào cách forEach được cài đặt (đơn giản hoá):
 *
 *   Array.prototype.forEach = function (cb) {
 *     for (let i = 0; i < this.length; i++) {
 *       cb(this[i], i, this);      ← gọi callback, VỨT BỎ giá trị trả về
 *     }
 *   };
 *
 * Callback async trả về một Promise. forEach vứt nó đi.
 * Không ai await → không ai chờ.
 *
 *
 * HẬU QUẢ THẬT Ở PRODUCTION
 *
 *   app.post('/import', async (req, res) => {
 *     danhSach.forEach(async (item) => { await luuVaoDb(item); });
 *     res.json({ ok: true });      ← trả về khi CHƯA lưu xong gì cả
 *   });
 *
 * Client nhận "thành công", dữ liệu chưa vào database.
 * Nếu server restart ngay lúc đó → mất sạch. Không log lỗi nào.
 *
 *
 * QUY TẮC: TRONG CODE ASYNC, KHÔNG DÙNG forEach. BAO GIỜ.
 *   - cần tuần tự  → for...of + await
 *   - cần song song → map + Promise.all
 */
