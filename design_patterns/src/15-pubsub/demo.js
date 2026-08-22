/**
 * BÀI 15 — PUB/SUB (EVENT BUS)
 * Chạy: node src/15-pubsub/demo.js
 */

const line = (t) => console.log("\n" + "=".repeat(62) + "\n" + t + "\n" + "=".repeat(62));

// ###########################################################################
// PHẦN 1 — OBSERVER vs PUB/SUB
// ###########################################################################

line("1. OBSERVER vs PUB/SUB — khác biệt cốt lõi");
console.log(`
   OBSERVER (Bài 10):
       donHang.dangKy("da-thanh-toan", capNhatBaoCao);
        ↑
        └─ bạn PHẢI CẦM ĐƯỢC object donHang

       Vấn đề: module "báo cáo doanh thu" muốn theo dõi MỌI đơn hàng
       được tạo ở MỌI nơi trong app. Nó phải lấy tham chiếu tới từng
       object một. Không khả thi.

   PUB/SUB:
       bus.dangKy("don.da-thanh-toan", capNhatBaoCao);
        ↑
        └─ chỉ cần biết TÊN KÊNH

       Module báo cáo không cần biết ai tạo đơn, tạo ở đâu, tạo lúc nào.
       Đăng ký được cả TRƯỚC KHI publisher tồn tại.`);

// ###########################################################################
// PHẦN 2 — DANH MỤC SỰ KIỆN (kỹ thuật an toàn số 1)
// ###########################################################################

const SU_KIEN = Object.freeze({
  DON_TAO: "don.tao",
  DON_DA_THANH_TOAN: "don.da-thanh-toan",
  DON_DA_HUY: "don.da-huy",
  NGUOIDUNG_DANG_KY: "nguoidung.dang-ky",
});

const LUOC_DO = {
  [SU_KIEN.DON_DA_THANH_TOAN]: ["maDon", "soTien"],
  [SU_KIEN.DON_DA_HUY]: ["maDon", "lyDo"],
};

// ###########################################################################
// PHẦN 3 — EVENT BUS CÓ RÀO CHẮN
// ###########################################################################

class EventBus {
  #nguoiNghe = new Map();
  #soDo = { phat: new Map(), nghe: new Map() }; // để sinh sơ đồ
  #canhBao = [];

  #kiemTraTen(ten) {
    const hopLe = Object.values(SU_KIEN);
    // Cho phép mẫu có * mà không cần nằm trong danh mục
    if (ten.includes("*")) return;
    if (!hopLe.includes(ten)) {
      throw new Error(`Kênh "${ten}" không có trong danh mục SU_KIEN. Hợp lệ: ${hopLe.join(", ")}`);
    }
  }

  #khop(mau, ten) {
    if (mau === ten || mau === "*") return true;
    if (!mau.includes("*")) return false;
    return new RegExp("^" + mau.replace(/\./g, "\\.").replace(/\*/g, ".*") + "$").test(ten);
  }

  dangKy(ten, xuLy, { boi = "?" } = {}) {
    this.#kiemTraTen(ten);
    if (!this.#nguoiNghe.has(ten)) this.#nguoiNghe.set(ten, new Set());
    this.#nguoiNghe.get(ten).add(xuLy);

    // Ghi lại sơ đồ: ai nghe kênh nào
    if (!this.#soDo.nghe.has(ten)) this.#soDo.nghe.set(ten, new Set());
    this.#soDo.nghe.get(ten).add(boi);

    return () => this.#nguoiNghe.get(ten)?.delete(xuLy);
  }

  async phat(ten, duLieu = {}, { boi = "?" } = {}) {
    this.#kiemTraTen(ten);

    // Kỹ thuật an toàn 4: kiểm tra hình dạng dữ liệu
    for (const truong of LUOC_DO[ten] ?? []) {
      if (!(truong in duLieu)) {
        throw new Error(`Sự kiện "${ten}" thiếu trường bắt buộc "${truong}"`);
      }
    }

    if (!this.#soDo.phat.has(ten)) this.#soDo.phat.set(ten, new Set());
    this.#soDo.phat.get(ten).add(boi);

    const ds = [];
    for (const [mau, bo] of this.#nguoiNghe) if (this.#khop(mau, ten)) ds.push(...bo);

    // Kỹ thuật an toàn 3: cảnh báo sự kiện không ai nghe
    if (ds.length === 0) {
      const cb = `⚠️  Sự kiện "${ten}" được phát nhưng KHÔNG AI NGHE`;
      this.#canhBao.push(cb);
      console.log("      " + cb);
    }

    const cacLoi = [];
    for (const xuLy of ds) {
      try {
        await xuLy(duLieu);
      } catch (e) {
        cacLoi.push({ xuLy: xuLy.name || "(vô danh)", loi: e.message });
      }
    }
    return { soNguoiNghe: ds.length, cacLoi };
  }

  /** Kỹ thuật an toàn 2: bù lại đúng thứ Pub/Sub làm ta mất */
  sinhSoDo() {
    const dong = ["graph LR"];
    const kenh = new Set([...this.#soDo.phat.keys(), ...this.#soDo.nghe.keys()]);
    for (const k of kenh) {
      const id = k.replace(/[.\-*]/g, "_");
      for (const p of this.#soDo.phat.get(k) ?? []) {
        dong.push(`    ${p.replace(/\W/g, "_")}[${p}] -->|phát| ${id}(("${k}"))`);
      }
      for (const s of this.#soDo.nghe.get(k) ?? []) {
        dong.push(`    ${id} -->|nghe| ${s.replace(/\W/g, "_")}[${s}]`);
      }
    }
    return dong.join("\n");
  }

  get canhBao() {
    return [...this.#canhBao];
  }
}

// ###########################################################################
line("2. PUB/SUB — người gửi và người nhận không biết nhau");

const bus = new EventBus();

// --- Các module đăng ký lúc khởi động, KHÔNG biết ai sẽ phát ---
bus.dangKy(SU_KIEN.DON_DA_THANH_TOAN, function capNhatBaoCao(dl) {
  console.log(`      📊 Báo cáo: +${dl.soTien.toLocaleString("vi-VN")}đ doanh thu`);
}, { boi: "BaoCao" });

bus.dangKy(SU_KIEN.DON_DA_THANH_TOAN, function guiEmail(dl) {
  console.log(`      📧 Email: xác nhận đơn ${dl.maDon}`);
}, { boi: "Email" });

bus.dangKy("don.*", function ghiKiemToan(dl) {
  console.log(`      📒 Kiểm toán: ghi nhận đơn ${dl.maDon}`);
}, { boi: "KiemToan" });

// --- Publisher không biết ai đang nghe ---
console.log("\n   Module DatHang phát sự kiện:\n");
await bus.phat(SU_KIEN.DON_DA_THANH_TOAN, { maDon: "DH1001", soTien: 350_000 }, { boi: "DatHang" });

console.log("\n   Module Admin (một nơi HOÀN TOÀN KHÁC) cũng phát được:\n");
await bus.phat(SU_KIEN.DON_DA_HUY, { maDon: "DH1002", lyDo: "khách đổi ý" }, { boi: "Admin" });

console.log(`
   👉 DatHang và BaoCao KHÔNG import lẫn nhau, KHÔNG biết nhau tồn tại.
      Thêm module mới nghe sự kiện này → không sửa một dòng nào của DatHang.`);

// ###########################################################################
line("3. ⚠️  CÁI GIÁ: MẤT KHẢ NĂNG TRUY VẾT");
console.log(`
   Với lời gọi hàm trực tiếp:
       baoCao.capNhat(don)      ← Ctrl+Click là tới thẳng định nghĩa

   Với event bus:
       bus.phat("don.da-thanh-toan", ...)
                 ↑
                 └── Ctrl+Click → KHÔNG ĐI ĐÂU CẢ. Đó chỉ là một chuỗi.

   Triệu chứng khi Pub/Sub bị lạm dụng:
       Bạn phải grep toàn dự án để trả lời "bấm nút này thì chuyện gì xảy ra?"

   📌 QUY TẮC THỰC DỤNG:
       • TRONG một module      → gọi hàm trực tiếp
       • GIỮA các module lớn   → cân nhắc Pub/Sub
       • Đừng dùng event bus để né việc suy nghĩ về kiến trúc.`);

// ###########################################################################
line("4. BỐN RÀO CHẮN LÀM PUB/SUB BỚT NGUY HIỂM");

console.log("\n   4.1 DANH MỤC SỰ KIỆN — gõ sai thì lỗi NGAY, không im lặng");
try {
  await bus.phat("don.da-thanhtoan", { maDon: "X" }); // thiếu dấu gạch
} catch (e) {
  console.log("      ⛔ " + e.message);
}
console.log(`      Nếu dùng chuỗi thô không kiểm tra: KHÔNG lỗi, KHÔNG gì xảy ra,
      và bạn mất nửa ngày để hiểu vì sao email không được gửi.`);

console.log("\n   4.2 KIỂM TRA HÌNH DẠNG DỮ LIỆU");
try {
  await bus.phat(SU_KIEN.DON_DA_THANH_TOAN, { maDon: "DH999" }); // thiếu soTien
} catch (e) {
  console.log("      ⛔ " + e.message);
}
console.log(`      Publisher và subscriber không biết nhau → không có gì đảm bảo
      payload đúng. Lược đồ ở bus là hợp đồng duy nhất giữa hai bên.`);

console.log("\n   4.3 CẢNH BÁO SỰ KIỆN KHÔNG AI NGHE");
await bus.phat(SU_KIEN.NGUOIDUNG_DANG_KY, { email: "moi@example.com" }, { boi: "DangKy" });
console.log(`      Gần như luôn là bug: gõ sai tên, hoặc module nghe chưa được nạp.`);

console.log("\n   4.4 BUS TỰ SINH SƠ ĐỒ — bù lại đúng thứ vừa mất\n");
console.log(bus.sinhSoDo());
console.log(`
      👉 Dán đoạn trên vào file .md → có ngay sơ đồ luồng sự kiện của
         toàn hệ thống, và nó KHÔNG BAO GIỜ lỗi thời vì sinh từ code chạy.`);

// ###########################################################################
line("5. PUB/SUB NGOÀI ĐỜI — cùng một mô hình tư duy");
console.log(`
   TRONG TIẾN TRÌNH               QUA MẠNG
   ─────────────────              ─────────────────
   EventEmitter (Node)            Redis Pub/Sub
   BroadcastChannel (giữa tab)    Kafka, RabbitMQ, NATS
   postMessage (worker/iframe)    AWS SNS/SQS
   Pinia / Vuex actions           WebSocket, Socket.IO

   👉 Hiểu event bus 60 dòng ở file này là hiểu luôn kiến trúc hướng sự
      kiện ở quy mô hệ thống. Chỉ khác ở chỗ:

      • qua mạng thì sự kiện có thể MẤT, hoặc tới HAI LẦN
        → subscriber phải idempotent (chạy 2 lần vẫn ra 1 kết quả)
      • qua mạng thì thứ tự KHÔNG đảm bảo
      • qua mạng thì payload phải serialize được (không truyền hàm, không
        truyền tham chiếu object)`);
