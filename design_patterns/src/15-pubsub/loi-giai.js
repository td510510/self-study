/**
 * LỜI GIẢI BÀI TẬP 15 — PUB/SUB
 * Chạy: node src/15-pubsub/loi-giai.js
 */

const SU_KIEN = Object.freeze({
  DON_TAO: "don.tao",
  DON_DA_THANH_TOAN: "don.da-thanh-toan",
  DON_DA_HUY: "don.da-huy",
  KHO_HET_HANG: "kho.het-hang",
});

const LUOC_DO = Object.freeze({
  [SU_KIEN.DON_TAO]: ["maDon"],
  [SU_KIEN.DON_DA_THANH_TOAN]: ["maDon", "soTien"],
  [SU_KIEN.DON_DA_HUY]: ["maDon", "lyDo"],
  [SU_KIEN.KHO_HET_HANG]: ["maSP"],
});

class EventBus {
  #nguoiNghe = new Map();
  #soDoPhat = new Map(); // kênh -> Set(tên publisher)
  #soDoNghe = new Map(); // kênh -> Set(tên subscriber)

  constructor() {
    this.canhBao = [];
  }

  // ---- RÀO 1: chỉ chấp nhận kênh có trong danh mục ----
  #kiemTraTen(ten) {
    if (typeof ten !== "string") throw new Error("Tên kênh phải là chuỗi");
    if (ten.includes("*")) return; // mẫu đại diện được miễn
    const hopLe = Object.values(SU_KIEN);
    if (!hopLe.includes(ten)) {
      throw new Error(`Kênh "${ten}" không có trong danh mục SU_KIEN. Hợp lệ: ${hopLe.join(", ")}`);
    }
  }

  // ---- RÀO 2: payload phải đúng hình dạng ----
  #kiemTraDuLieu(ten, duLieu) {
    const thieu = (LUOC_DO[ten] ?? []).filter((t) => !(t in duLieu));
    if (thieu.length) {
      throw new Error(`Sự kiện "${ten}" thiếu trường bắt buộc: ${thieu.join(", ")}`);
    }
  }

  // ---- RÀO 5: ký tự đại diện ----
  #khop(mau, ten) {
    if (mau === ten || mau === "*") return true;
    if (!mau.includes("*")) return false;
    return new RegExp("^" + mau.replace(/\./g, "\\.").replace(/\*/g, ".*") + "$").test(ten);
  }

  #timNguoiNghe(ten) {
    const ds = [];
    for (const [mau, bo] of this.#nguoiNghe) if (this.#khop(mau, ten)) ds.push(...bo);
    return ds;
  }

  dangKy(ten, xuLy, { boi = "?" } = {}) {
    this.#kiemTraTen(ten);
    if (!this.#nguoiNghe.has(ten)) this.#nguoiNghe.set(ten, new Set());
    this.#nguoiNghe.get(ten).add(xuLy);

    // RÀO 6: ghi lại sơ đồ
    if (!this.#soDoNghe.has(ten)) this.#soDoNghe.set(ten, new Set());
    this.#soDoNghe.get(ten).add(boi);

    let daHuy = false;
    return () => {
      if (daHuy) return false;
      daHuy = true;
      return this.#nguoiNghe.get(ten)?.delete(xuLy) ?? false;
    };
  }

  once(ten, xuLy) {
    const huy = this.dangKy(ten, async (...a) => {
      huy();
      return xuLy(...a);
    });
    return huy;
  }

  async phat(ten, duLieu = {}, { boi = "?" } = {}) {
    this.#kiemTraTen(ten);
    this.#kiemTraDuLieu(ten, duLieu);

    if (!this.#soDoPhat.has(ten)) this.#soDoPhat.set(ten, new Set());
    this.#soDoPhat.get(ten).add(boi);

    const ds = this.#timNguoiNghe(ten);

    // RÀO 3: cảnh báo sự kiện không ai nghe
    if (ds.length === 0) {
      this.canhBao.push(`Sự kiện "${ten}" được phát bởi "${boi}" nhưng KHÔNG AI NGHE`);
    }

    // RÀO 4: một subscriber lỗi không làm chết cả dây
    const cacLoi = [];
    for (const xuLy of ds) {
      try {
        await xuLy(duLieu);
      } catch (e) {
        cacLoi.push({ xuLy: xuLy.name || "(vô danh)", loi: e.message });
      }
    }
    return { suKien: ten, soNguoiNghe: ds.length, cacLoi };
  }

  /**
   * Biến thể chạy SONG SONG và gom kết quả.
   * allSettled thay vì all: một subscriber lỗi không hủy những cái còn lại.
   */
  async phatVaCho(ten, duLieu = {}, { boi = "?" } = {}) {
    this.#kiemTraTen(ten);
    this.#kiemTraDuLieu(ten, duLieu);

    const ds = this.#timNguoiNghe(ten);
    const ketQuaThoi = await Promise.allSettled(ds.map((f) => f(duLieu)));

    return {
      ketQua: ketQuaThoi.filter((r) => r.status === "fulfilled").map((r) => r.value),
      cacLoi: ketQuaThoi
        .map((r, i) => (r.status === "rejected" ? { xuLy: ds[i].name || "(vô danh)", loi: r.reason.message } : null))
        .filter(Boolean),
    };
  }

  sinhSoDo() {
    const dong = ["graph LR"];
    const id = (s) => s.replace(/\W/g, "_");
    const kenh = new Set([...this.#soDoPhat.keys(), ...this.#soDoNghe.keys()]);
    for (const k of kenh) {
      for (const p of this.#soDoPhat.get(k) ?? []) dong.push(`    ${id(p)}[${p}] -->|phát| ${id(k)}(("${k}"))`);
      for (const s of this.#soDoNghe.get(k) ?? []) dong.push(`    ${id(k)} -->|nghe| ${id(s)}[${s}]`);
    }
    return dong.join("\n");
  }
}

// ###########################################################################
// KIỂM THỬ
// ###########################################################################
let dat = 0;
let tong = 0;
const ok = (ten, dieuKien, ghiChu = "") => {
  tong++;
  if (dieuKien) dat++;
  console.log(`${dieuKien ? "✅" : "❌"} ${ten}${ghiChu ? "  (" + ghiChu + ")" : ""}`);
};
const nemLoi = async (ham) => {
  try {
    await ham();
    return false;
  } catch {
    return true;
  }
};

console.log("=== TEST 1: cơ bản ===\n");
const bus = new EventBus();
const nhan = [];
bus.dangKy(SU_KIEN.DON_DA_THANH_TOAN, (dl) => nhan.push("A:" + dl.maDon), { boi: "BaoCao" });
bus.dangKy(SU_KIEN.DON_DA_THANH_TOAN, (dl) => nhan.push("B:" + dl.maDon), { boi: "Email" });
const kq1 = await bus.phat(SU_KIEN.DON_DA_THANH_TOAN, { maDon: "DH1", soTien: 100 }, { boi: "DatHang" });
ok("Cả 2 subscriber đều nhận", nhan.length === 2, nhan.join(","));
ok("Báo đúng số người nghe", kq1.soNguoiNghe === 2);

const huy = bus.dangKy(SU_KIEN.DON_TAO, () => nhan.push("C"), { boi: "X" });
huy();
await bus.phat(SU_KIEN.DON_TAO, { maDon: "DH2" }, { boi: "Y" });
ok("Hàm hủy hoạt động", !nhan.includes("C"));

console.log("\n=== TEST 2: rào chắn ===\n");
const bus2 = new EventBus();
bus2.dangKy(SU_KIEN.DON_DA_THANH_TOAN, () => {}, { boi: "X" });
ok("⭐ Rào 1: tên kênh lạ → ném lỗi",
  await nemLoi(() => bus2.phat("don.da-thanhtoan", { maDon: "X", soTien: 1 })));
ok("⭐ Rào 1: đăng ký kênh lạ cũng bị chặn",
  await nemLoi(async () => bus2.dangKy("khong-co-trong-danh-muc", () => {})));
ok("⭐ Rào 2: thiếu trường bắt buộc → ném lỗi",
  await nemLoi(() => bus2.phat(SU_KIEN.DON_DA_THANH_TOAN, { maDon: "X" })));

const bus3 = new EventBus();
await bus3.phat(SU_KIEN.KHO_HET_HANG, { maSP: "AO1" }, { boi: "Kho" });
ok("⭐ Rào 3: cảnh báo khi không ai nghe", bus3.canhBao.length === 1, bus3.canhBao[0]);

console.log("\n=== TEST 3: subscriber lỗi không làm chết cả dây ===\n");
const bus4 = new EventBus();
const daChay = [];
bus4.dangKy(SU_KIEN.DON_TAO, function modA() {
  daChay.push("A");
});
bus4.dangKy(SU_KIEN.DON_TAO, function modB() {
  throw new Error("B hỏng");
});
bus4.dangKy(SU_KIEN.DON_TAO, function modC() {
  daChay.push("C");
});
const kq4 = await bus4.phat(SU_KIEN.DON_TAO, { maDon: "DH1" });
ok("Subscriber sau cái lỗi VẪN chạy", daChay.join("") === "AC");
ok("Lỗi được thu thập", kq4.cacLoi.length === 1 && kq4.cacLoi[0].xuLy === "modB",
  JSON.stringify(kq4.cacLoi));

console.log("\n=== TEST 4: ký tự đại diện ===\n");
const bus5 = new EventBus();
const nhan5 = [];
bus5.dangKy("don.*", () => nhan5.push("don-handler"), { boi: "KiemToan" });
bus5.dangKy("*", () => nhan5.push("logger"), { boi: "Logger" });
await bus5.phat(SU_KIEN.DON_TAO, { maDon: "X" }, { boi: "P" });
ok("don.* bắt được don.tao", nhan5.includes("don-handler"));
ok("* bắt được mọi sự kiện", nhan5.includes("logger"));
nhan5.length = 0;
await bus5.phat(SU_KIEN.KHO_HET_HANG, { maSP: "A" }, { boi: "P" });
ok("don.* KHÔNG bắt kho.het-hang", !nhan5.includes("don-handler") && nhan5.includes("logger"));

console.log("\n=== TEST 5: sơ đồ tự sinh ===\n");
const bus6 = new EventBus();
bus6.dangKy(SU_KIEN.DON_DA_THANH_TOAN, () => {}, { boi: "BaoCao" });
bus6.dangKy(SU_KIEN.DON_DA_THANH_TOAN, () => {}, { boi: "Email" });
await bus6.phat(SU_KIEN.DON_DA_THANH_TOAN, { maDon: "X", soTien: 1 }, { boi: "DatHang" });
const soDo = bus6.sinhSoDo();
ok("Sơ đồ có publisher", soDo.includes("DatHang"));
ok("Sơ đồ có cả 2 subscriber", soDo.includes("BaoCao") && soDo.includes("Email"));
console.log("\n" + soDo);

console.log("\n=== TEST 6: phatVaCho() ===\n");
const bus7 = new EventBus();
const nghi = (ms) => new Promise((r) => setTimeout(r, ms));
bus7.dangKy(SU_KIEN.DON_TAO, async () => {
  await nghi(40);
  return "kết quả A";
});
bus7.dangKy(SU_KIEN.DON_TAO, async () => {
  await nghi(40);
  return "kết quả B";
});
bus7.dangKy(SU_KIEN.DON_TAO, async function modC() {
  throw new Error("C hỏng");
});

const t = Date.now();
const kq7 = await bus7.phatVaCho(SU_KIEN.DON_TAO, { maDon: "X" });
const ms = Date.now() - t;
ok("Gom được 2 kết quả thành công", kq7.ketQua.length === 2, JSON.stringify(kq7.ketQua));
ok("Gom được 1 lỗi", kq7.cacLoi.length === 1, JSON.stringify(kq7.cacLoi));
ok("⭐ Chạy SONG SONG", ms < 80, `${ms}ms (nếu tuần tự sẽ ~80ms)`);

console.log(`\n───────────────\nKẾT QUẢ: ${dat}/${tong}\n`);

console.log(`═══════════════════════════════════════════════════════════════
💭 TRẢ LỜI CÂU HỎI THẢO LUẬN

a) Rào chắn nào BẮT BUỘC, rào nào tùy dự án?

   BẮT BUỘC ở mọi dự án:
     • Rào 1 (danh mục sự kiện). Đây là rào quan trọng nhất. Không có nó,
       gõ sai tên kênh sinh ra bug IM LẶNG — loại bug đắt nhất, vì không
       có thông báo, không có stack trace, không có gì để tìm.
     • Rào 4 (subscriber lỗi không làm chết cả dây). Nếu thiếu, việc gửi
       SMS hỏng sẽ khiến tồn kho không được cập nhật — hai việc chẳng
       liên quan gì nhau.

   NÊN CÓ, nhưng có thể làm sau:
     • Rào 2 (lược đồ payload) — càng nhiều module càng cần. Với 3 module
       do một người viết thì có thể bỏ qua ban đầu.
     • Rào 3 (cảnh báo không ai nghe) — rẻ, và bắt được rất nhiều lỗi lúc
       phát triển. Ở môi trường chạy thật nên hạ xuống mức log, đừng ném lỗi
       (vì có thể một module hợp lệ đang tạm tắt).

   TÙY DỰ ÁN:
     • Rào 5 (ký tự đại diện) — chỉ cần khi có logger/kiểm toán nghe nhiều kênh.
     • Rào 6 (sơ đồ) — cực kỳ giá trị khi dự án lớn, thừa thãi khi có 5 sự kiện.

   📌 Nguyên tắc chọn: rào nào biến BUG IM LẶNG thành LỖI RÕ RÀNG thì
      không bao giờ được bỏ. Rào nào chỉ để tiện thì thêm khi thấy cần.

b) Lên Redis Pub/Sub thì điều gì KHÔNG CÒN ĐÚNG?

   1. SỰ KIỆN CÓ THỂ MẤT. Redis Pub/Sub không lưu trữ: subscriber đang
      offline lúc sự kiện được phát thì mất luôn, vĩnh viễn. Trong bộ nhớ
      thì điều này không bao giờ xảy ra.
      → Cần hàng đợi có lưu trữ (Kafka, RabbitMQ) nếu không được phép mất.

   2. SỰ KIỆN CÓ THỂ TỚI HAI LẦN (khi retry, khi mạng chập chờn).
      → Subscriber PHẢI idempotent: xử lý 2 lần vẫn ra 1 kết quả. Thường
        làm bằng cách gắn ID sự kiện và bỏ qua ID đã xử lý.
        Đây là thay đổi lớn nhất về tư duy khi lên hệ phân tán.

   3. THỨ TỰ KHÔNG ĐẢM BẢO. "don.tao" có thể tới SAU "don.da-thanh-toan".
      → Payload phải đủ dữ liệu để xử lý độc lập, hoặc phải có số thứ tự.

   4. PAYLOAD PHẢI SERIALIZE ĐƯỢC. Không truyền được hàm, không truyền
      được tham chiếu object, Date thành chuỗi, Map/Set thành {}.
      (Xem lại Bài 04 — Prototype, phần so sánh cách deep copy.)

   5. KHÔNG await ĐƯỢC. phatVaCho() ở trên vô nghĩa qua mạng — publisher
      không biết ai đang nghe, và không đợi được.

   6. LỖI KHÔNG BAY NGƯỢC VỀ. cacLoi trong lời giải này không tồn tại
      trong thế giới phân tán. Lỗi phải được xử lý ở phía subscriber, hoặc
      đẩy vào dead-letter queue.

c) Phản biện "dùng event bus cho mọi thứ thì linh hoạt":

   → "Linh hoạt" ở đây là ảo giác. Bạn không xóa bỏ sự phụ thuộc, bạn chỉ
     làm cho nó VÔ HÌNH.

     Module BaoCao vẫn phụ thuộc vào việc DatHang phát đúng sự kiện với
     đúng payload. Sự phụ thuộc đó vẫn còn nguyên — chỉ khác là trình biên
     dịch, IDE và trình gỡ lỗi không nhìn thấy nó nữa. Bạn đã đổi một phụ
     thuộc KIỂM TRA ĐƯỢC lấy một phụ thuộc KHÔNG KIỂM TRA ĐƯỢC.

     Ba hậu quả cụ thể:
       • Không trả lời được "bấm nút này thì chuyện gì xảy ra?" nếu không
         grep toàn dự án.
       • Refactor trở nên nguy hiểm: đổi tên sự kiện, IDE không giúp gì.
       • Người mới vào dự án mất nhiều tuần thay vì vài ngày để hiểu luồng.

     📌 Tiêu chí quyết định — hỏi 3 câu:
        1. Bên gửi có CẦN BIẾT kết quả không? Có → gọi hàm.
        2. Số người nhận có thể thay đổi mà bên gửi không cần biết không?
           Không → gọi hàm.
        3. Hai bên có thuộc hai vùng nghiệp vụ khác nhau không?
           Không → gọi hàm.

        Chỉ khi cả ba câu đều nghiêng về "sự kiện" thì Pub/Sub mới xứng đáng
        với cái giá của nó.
═══════════════════════════════════════════════════════════════`);
