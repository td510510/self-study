/**
 * BÀI 10 — OBSERVER
 * Chạy: node src/10-observer/demo.js
 */

const line = (t) => console.log("\n" + "=".repeat(62) + "\n" + t + "\n" + "=".repeat(62));
const nghi = (ms) => new Promise((r) => setTimeout(r, ms));

// ###########################################################################
// PHẦN 1 — CÁI ĐAU
// ###########################################################################

line("1. CÁI ĐAU — DonHang biết quá nhiều thứ");
console.log(`
   class DonHang {
     async thanhToan() {
       this.trangThai = "da-thanh-toan";
       await guiEmail(...);          ← DonHang phải import 6 module
       await guiSMS(...);            ← muốn unit test phải giả lập cả 6
       await capNhatTonKho(...);     ← guiSMS lỗi → tồn kho KHÔNG được cập nhật
       await congDiem(...);          ← marketing thêm việc thứ 7 → lại sửa DonHang
       await ghiKeToan(...);
       await thongBaoKho(...);
     }
   }`);

// ###########################################################################
// PHẦN 2 — BỘ PHÁT SỰ KIỆN
// ###########################################################################

class BoPhatSuKien {
  #nguoiNghe = new Map(); // tên sự kiện -> Set các hàm
  #doSau = 0; // chống vòng lặp vô tận

  /** Trả về HÀM HỦY — cách chống rò rỉ bộ nhớ tốt nhất. */
  dangKy(tenSuKien, xuLy) {
    if (!this.#nguoiNghe.has(tenSuKien)) this.#nguoiNghe.set(tenSuKien, new Set());
    this.#nguoiNghe.get(tenSuKien).add(xuLy);
    return () => this.#nguoiNghe.get(tenSuKien)?.delete(xuLy);
  }

  /** Nghe đúng một lần rồi tự hủy. */
  once(tenSuKien, xuLy) {
    const huy = this.dangKy(tenSuKien, (...args) => {
      huy();
      return xuLy(...args);
    });
    return huy;
  }

  async phat(tenSuKien, duLieu) {
    if (this.#doSau > 10) {
      const loi = new Error(`Vòng lặp sự kiện vô tận tại "${tenSuKien}" (độ sâu > 10)`);
      loi.laLoiVongLap = true;
      throw loi;
    }
    this.#doSau++;
    const cacLoi = [];
    try {
      for (const xuLy of this.#nguoiNghe.get(tenSuKien) ?? []) {
        try {
          await xuLy(duLieu);
        } catch (e) {
          // Lỗi vòng lặp là lỗi HỆ THỐNG, không phải lỗi của một observer
          // → phải để nó bay lên tới nơi gọi ngoài cùng, đừng nuốt.
          if (e.laLoiVongLap) throw e;
          // ⚠️ MỘT observer lỗi KHÔNG được làm chết cả dây
          cacLoi.push({ xuLy: xuLy.name || "(vô danh)", loi: e.message });
        }
      }
    } finally {
      this.#doSau--;
    }
    return { suKien: tenSuKien, soNguoiNghe: (this.#nguoiNghe.get(tenSuKien) ?? new Set()).size, cacLoi };
  }

  demNguoiNghe(tenSuKien) {
    return tenSuKien
      ? (this.#nguoiNghe.get(tenSuKien)?.size ?? 0)
      : [...this.#nguoiNghe.values()].reduce((s, x) => s + x.size, 0);
  }
}

// ###########################################################################
// PHẦN 3 — DONHANG SAU KHI DÙNG OBSERVER
// ###########################################################################

class DonHang extends BoPhatSuKien {
  constructor(ma, khach, tongTien) {
    super();
    Object.assign(this, { ma, khach, tongTien, trangThai: "moi" });
  }

  async thanhToan() {
    this.trangThai = "da-thanh-toan";
    // DonHang chỉ THÔNG BÁO. Nó không biết ai đang nghe, cũng không cần biết.
    return this.phat("da-thanh-toan", { donHang: this });
  }
}

line("2. SAU KHI DÙNG OBSERVER");

const don = new DonHang("DH1001", { ten: "An", email: "an@example.com" }, 350_000);

// Mỗi việc là một observer độc lập, đăng ký từ BÊN NGOÀI
don.dangKy("da-thanh-toan", async function guiEmail({ donHang }) {
  await nghi(5);
  console.log(`      📧 Gửi email xác nhận tới ${donHang.khach.email}`);
});
don.dangKy("da-thanh-toan", async function capNhatTonKho({ donHang }) {
  console.log(`      📦 Trừ tồn kho cho đơn ${donHang.ma}`);
});
don.dangKy("da-thanh-toan", async function congDiem({ donHang }) {
  console.log(`      ⭐ Cộng ${Math.floor(donHang.tongTien / 10_000)} điểm cho ${donHang.khach.ten}`);
});

console.log("\nGọi don.thanhToan():");
let kq = await don.thanhToan();
console.log(`\n   ${kq.soNguoiNghe} người nghe, ${kq.cacLoi.length} lỗi`);

// Thêm việc mới mà KHÔNG sửa DonHang
console.log("\nMarketing thêm việc thứ 4 (không sửa một dòng nào của DonHang):");
don.dangKy("da-thanh-toan", async function baoAffiliate({ donHang }) {
  console.log(`      🤝 Báo hoa hồng cho cộng tác viên (đơn ${donHang.ma})`);
});
kq = await don.thanhToan();
console.log(`\n   ${kq.soNguoiNghe} người nghe`);

// ###########################################################################
// PHẦN 4 — MỘT OBSERVER LỖI KHÔNG LÀM CHẾT CẢ DÂY
// ###########################################################################

line("3. ⚠️  MỘT OBSERVER LỖI KHÔNG ĐƯỢC LÀM CHẾT CẢ DÂY");

const don2 = new DonHang("DH1002", { ten: "Bình", email: "binh@example.com" }, 500_000);
don2.dangKy("da-thanh-toan", function guiEmail() {
  console.log("      📧 Email OK");
});
don2.dangKy("da-thanh-toan", function guiSMS() {
  throw new Error("Nhà mạng từ chối");
});
don2.dangKy("da-thanh-toan", function capNhatTonKho() {
  console.log("      📦 Tồn kho OK ← vẫn chạy dù SMS lỗi ✅");
});

console.log();
kq = await don2.thanhToan();
console.log(`\n   Lỗi ghi nhận được:`, kq.cacLoi);
console.log(`
   👉 Nếu KHÔNG bọc try/catch từng observer, guiSMS lỗi sẽ khiến
      capNhatTonKho không bao giờ chạy → TỒN KHO SAI vì lý do hoàn
      toàn không liên quan.

      Sự kiện ĐÃ xảy ra rồi. Một người nghe hỏng không được phép
      làm hỏng những người còn lại.`);

// ###########################################################################
// PHẦN 5 — RÒ RỈ BỘ NHỚ
// ###########################################################################

line("4. ⚠️  VẤN ĐỀ SỐ MỘT: RÒ RỈ BỘ NHỚ");

const store = new BoPhatSuKien();

// --- Cách SAI: đăng ký rồi không bao giờ hủy ---
class ThanhPhanSai {
  constructor(store, id) {
    store.dangKy("thay-doi", () => this.veLai());
    this.id = id;
    this.duLieuNang = new Array(1000).fill("x"); // component giữ nhiều bộ nhớ
  }
  veLai() {}
  huy() {
    /* quên hủy đăng ký */
  }
}

for (let i = 0; i < 100; i++) new ThanhPhanSai(store, i).huy();
console.log(`   Cách SAI:  sau khi hủy 100 component → còn ${store.demNguoiNghe("thay-doi")} observer ❌`);

// --- Cách ĐÚNG: giữ hàm hủy ---
const store2 = new BoPhatSuKien();
class ThanhPhanDung {
  constructor(store, id) {
    this.huyDangKy = store.dangKy("thay-doi", () => this.veLai());
    this.id = id;
  }
  veLai() {}
  huy() {
    this.huyDangKy(); // ← dọn dẹp
  }
}

for (let i = 0; i < 100; i++) new ThanhPhanDung(store2, i).huy();
console.log(`   Cách ĐÚNG: sau khi hủy 100 component → còn ${store2.demNguoiNghe("thay-doi")} observer ✅`);

console.log(`
   👉 Người dùng chuyển trang 100 lần trong một phiên làm việc. Mỗi observer
      còn sống giữ tham chiếu tới component đã chết → JS không thu hồi được
      bộ nhớ. Sau vài giờ: tab treo, hoặc server Node OOM.

      QUY TẮC: mỗi dangKy phải có một huy tương ứng ở đâu đó.
      Nếu bạn không trả lời được "ai hủy cái này, khi nào?" — bạn đang rò rỉ.`);

// ###########################################################################
// PHẦN 6 — AbortController: cách hiện đại
// ###########################################################################

line("5. AbortController — hủy nhiều đăng ký cùng lúc");

class BoPhatCoSignal extends BoPhatSuKien {
  dangKy(ten, xuLy, { signal } = {}) {
    const huy = super.dangKy(ten, xuLy);
    if (signal) signal.addEventListener("abort", huy, { once: true });
    return huy;
  }
}

const bus = new BoPhatCoSignal();
const ac = new AbortController();

bus.dangKy("thay-doi", () => {}, { signal: ac.signal });
bus.dangKy("cuon-trang", () => {}, { signal: ac.signal });
bus.dangKy("go-phim", () => {}, { signal: ac.signal });
console.log(`   Trước abort: ${bus.demNguoiNghe()} observer`);
ac.abort();
console.log(`   Sau abort  : ${bus.demNguoiNghe()} observer ✅ (hủy cả 3 bằng một dòng)`);

// ###########################################################################
// PHẦN 7 — VÒNG LẶP SỰ KIỆN VÔ TẬN
// ###########################################################################

line("6. ⚠️  VÒNG LẶP SỰ KIỆN VÔ TẬN");

const vongLap = new BoPhatSuKien();
vongLap.dangKy("A", async () => await vongLap.phat("B"));
vongLap.dangKy("B", async () => await vongLap.phat("A")); // A → B → A → B...

try {
  await vongLap.phat("A");
  console.log("   ❌ Không phát hiện được vòng lặp");
} catch (e) {
  console.log("   ✅ Chặn được:", e.message);
}
console.log(`
   👉 Không có bộ đếm độ sâu, đoạn này làm treo tiến trình. Trong hệ thống
      thật, vòng lặp thường không lộ liễu như vậy — nó đi qua 5 module
      khác nhau và chỉ xuất hiện với một loại dữ liệu nhất định.

      Dấu hiệu nhận biết: CPU 100%, hoặc stack trace dài bất thường.`);

// ###########################################################################
line("7. OBSERVER Ở KHẮP NƠI TRONG JAVASCRIPT");
console.log(`
   button.addEventListener("click", f)   ← DOM
   emitter.on("data", f)                 ← Node EventEmitter
   socket.on("message", f)               ← WebSocket
   store.subscribe(f)                    ← Redux / Zustand
   new MutationObserver(f)               ← theo dõi thay đổi DOM
   new IntersectionObserver(f)           ← lazy load ảnh
   new ResizeObserver(f)                 ← responsive

   👉 Trong dự án thật, dùng EventEmitter của Node:
        import { EventEmitter } from "node:events";
        class DonHang extends EventEmitter { ... }

      Nhưng hãy tự viết một bản ít nhất một lần — để hiểu vì sao
      removeListener lại quan trọng đến thế.`);
