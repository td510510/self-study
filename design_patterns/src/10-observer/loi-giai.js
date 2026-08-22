/**
 * LỜI GIẢI BÀI TẬP 10 — OBSERVER
 * Chạy: node src/10-observer/loi-giai.js
 */

// ###########################################################################
// TODO 1 + TODO 4 — BoPhatSuKien có hỗ trợ ký tự đại diện
// ###########################################################################

class BoPhatSuKien {
  #nguoiNghe = new Map(); // mẫu sự kiện -> Set(hàm)
  #doSau = 0;
  #doSauToiDa = 10;

  /** Trả về HÀM HỦY — cách chống rò rỉ tốt nhất vì khó quên nhất. */
  dangKy(ten, xuLy) {
    if (!this.#nguoiNghe.has(ten)) this.#nguoiNghe.set(ten, new Set());
    this.#nguoiNghe.get(ten).add(xuLy);

    let daHuy = false;
    return () => {
      if (daHuy) return false; // gọi hủy 2 lần cũng an toàn
      daHuy = true;
      const bo = this.#nguoiNghe.get(ten);
      const kq = bo?.delete(xuLy) ?? false;
      if (bo?.size === 0) this.#nguoiNghe.delete(ten); // dọn cả Set rỗng
      return kq;
    };
  }

  once(ten, xuLy) {
    const huy = this.dangKy(ten, async (...args) => {
      huy(); // hủy TRƯỚC khi chạy, phòng trường hợp xuLy phát lại chính sự kiện đó
      return xuLy(...args);
    });
    return huy;
  }

  /** TODO 4: "don.*" khớp "don.tao"; "*" khớp mọi thứ. */
  #khop(mau, ten) {
    if (mau === ten || mau === "*") return true;
    if (!mau.includes("*")) return false;
    const bieuThuc = new RegExp("^" + mau.split("*").map((p) =>
      p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join(".*") + "$");
    return bieuThuc.test(ten);
  }

  #timNguoiNghe(ten) {
    const ds = [];
    for (const [mau, bo] of this.#nguoiNghe) {
      if (this.#khop(mau, ten)) ds.push(...bo);
    }
    return ds;
  }

  async phat(ten, duLieu) {
    if (this.#doSau > this.#doSauToiDa) {
      const loi = new Error(
        `Vòng lặp sự kiện vô tận tại "${ten}" (độ sâu > ${this.#doSauToiDa})`
      );
      loi.laLoiVongLap = true; // đánh dấu để KHÔNG bị nuốt vào cacLoi
      throw loi;
    }

    this.#doSau++;
    const cacLoi = [];
    const ds = this.#timNguoiNghe(ten);

    try {
      for (const xuLy of ds) {
        try {
          await xuLy(duLieu);
        } catch (e) {
          // Lỗi hệ thống thì để bay lên; lỗi của observer thì thu thập lại.
          if (e.laLoiVongLap) throw e;
          cacLoi.push({ xuLy: xuLy.name || "(vô danh)", loi: e.message });
        }
      }
    } finally {
      this.#doSau--;
    }

    return { suKien: ten, soNguoiNghe: ds.length, cacLoi };
  }

  demNguoiNghe(ten) {
    if (ten === undefined) {
      return [...this.#nguoiNghe.values()].reduce((s, b) => s + b.size, 0);
    }
    return this.#nguoiNghe.get(ten)?.size ?? 0;
  }
}

// ###########################################################################
// TODO 2 — DonHang chỉ phát sự kiện
// Chú ý: trong class này không có một chữ nào về email/sms/kho/điểm.
// ###########################################################################

class DonHang extends BoPhatSuKien {
  constructor(ma, khach, tongTien) {
    super();
    Object.assign(this, { ma, khach, tongTien, trangThai: "moi" });
  }

  async thanhToan() {
    if (this.trangThai !== "moi") throw new Error(`Đơn đang ở trạng thái ${this.trangThai}`);
    this.trangThai = "da-thanh-toan";
    return this.phat("da-thanh-toan", { donHang: this });
  }

  async huy(lyDo) {
    this.trangThai = "da-huy";
    return this.phat("da-huy", { donHang: this, lyDo });
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

console.log("=== TEST 1: cơ bản ===\n");
const bus = new BoPhatSuKien();
let dem = 0;
bus.dangKy("test", () => dem++);
bus.dangKy("test", () => dem++);
await bus.phat("test");
ok("Hai observer đều được gọi", dem === 2);

const huy = bus.dangKy("test", () => dem++);
huy();
dem = 0;
await bus.phat("test");
ok("dangKy trả về hàm hủy hoạt động", dem === 2);

let demOnce = 0;
bus.once("mot-lan", () => demOnce++);
await bus.phat("mot-lan");
await bus.phat("mot-lan");
ok("once() chỉ chạy đúng 1 lần", demOnce === 1);
ok("once() tự hủy khỏi danh sách", bus.demNguoiNghe("mot-lan") === 0);

console.log("\n=== TEST 2: một observer lỗi không làm chết cả dây ===\n");
const bus2 = new BoPhatSuKien();
const daChay = [];
bus2.dangKy("sk", function moduleA() {
  daChay.push("A");
});
bus2.dangKy("sk", function moduleB() {
  throw new Error("B hỏng");
});
bus2.dangKy("sk", function moduleC() {
  daChay.push("C");
});
const kq2 = await bus2.phat("sk");
ok("Observer sau observer lỗi VẪN chạy", daChay.join("") === "AC", `đã chạy: ${daChay}`);
ok("Lỗi được thu thập, không ném ra ngoài", kq2.cacLoi.length === 1);
ok("Lỗi ghi rõ observer nào hỏng", kq2.cacLoi[0].xuLy === "moduleB", JSON.stringify(kq2.cacLoi[0]));

console.log("\n=== TEST 3: ⭐ chống rò rỉ bộ nhớ ===\n");
const store = new BoPhatSuKien();

class ThanhPhan {
  constructor(store) {
    // ⭐ Giữ lại hàm hủy ngay lúc đăng ký — đừng để việc dọn dẹp
    //    phụ thuộc vào trí nhớ của người viết code sau này.
    this.huyDangKy = store.dangKy("thay-doi", () => this.veLai());
  }
  veLai() {}
  huy() {
    this.huyDangKy();
  }
}

for (let i = 0; i < 1000; i++) new ThanhPhan(store).huy();
ok("Hủy 1000 component → 0 observer còn sót", store.demNguoiNghe("thay-doi") === 0,
  `còn lại: ${store.demNguoiNghe("thay-doi")}`);

console.log("\n=== TEST 4: chống vòng lặp vô tận ===\n");
tong++;
try {
  const b = new BoPhatSuKien();
  b.dangKy("A", async () => await b.phat("B"));
  b.dangKy("B", async () => await b.phat("A"));
  await b.phat("A");
  console.log("❌ Không phát hiện được vòng lặp");
} catch (e) {
  dat++;
  console.log("✅ Chặn được vòng lặp: " + e.message);
}

console.log("\n=== TEST 5: DonHang dùng Observer ===\n");
const don = new DonHang("DH1001", { ten: "An", email: "an@example.com" }, 350_000);
const daLam = [];
don.dangKy("da-thanh-toan", () => daLam.push("email"));
don.dangKy("da-thanh-toan", () => daLam.push("kho"));
don.dangKy("da-huy", (dl) => daLam.push("hoan-tien:" + dl.lyDo));

await don.thanhToan();
ok("thanhToan() phát tới 2 observer", daLam.length === 2, daLam.join(","));
ok("Trạng thái đơn được cập nhật", don.trangThai === "da-thanh-toan");

await don.huy("khách đổi ý");
ok("huy() phát sự kiện kèm lý do", daLam.includes("hoan-tien:khách đổi ý"));

const nguon = DonHang.toString().toLowerCase();
ok("⭐ DonHang KHÔNG biết gì về email/sms/kho/điểm",
  !["email", "sms", "tonkho", "diem"].some((t) => nguon.includes(t)));

console.log("\n=== TEST 6: NÂNG CAO — ký tự đại diện ===\n");
const bus3 = new BoPhatSuKien();
const nhatKy = [];
bus3.dangKy("don.*", (d) => nhatKy.push("don-handler:" + d.ten));
bus3.dangKy("*", (d) => nhatKy.push("logger:" + d.ten));
bus3.dangKy("don.tao", (d) => nhatKy.push("cu-the:" + d.ten));

await bus3.phat("don.tao", { ten: "don.tao" });
ok("don.* bắt được don.tao", nhatKy.includes("don-handler:don.tao"));
ok("* bắt được mọi sự kiện", nhatKy.includes("logger:don.tao"));
ok("Đăng ký cụ thể vẫn hoạt động", nhatKy.includes("cu-the:don.tao"));

nhatKy.length = 0;
await bus3.phat("nguoidung.dangnhap", { ten: "nguoidung.dangnhap" });
ok("don.* KHÔNG bắt sự kiện khác nhóm",
  !nhatKy.some((x) => x.startsWith("don-handler")) && nhatKy.length === 1,
  nhatKy.join(","));

console.log(`\n───────────────\nKẾT QUẢ: ${dat}/${tong}\n`);

console.log(`═══════════════════════════════════════════════════════════════
💭 TRẢ LỜI CÂU HỎI THẢO LUẬN

a) Chạy observer TUẦN TỰ hay SONG SONG?

   Tuần tự (for + await) — như lời giải này:
     ✅ Thứ tự đăng ký được tôn trọng, dễ suy luận
     ✅ Không làm quá tải hệ thống bên dưới (5 observer cùng gọi DB)
     ❌ Chậm: tổng thời gian = tổng của tất cả

   Song song (Promise.allSettled):
     ✅ Nhanh: tổng thời gian = observer chậm nhất
     ✅ allSettled không dừng khi một cái lỗi (đúng tinh thần Observer)
     ❌ Mất kiểm soát tải
     ❌ Không suy luận được thứ tự — nhưng xem câu (c): đó lại là điều TỐT,
        vì nó buộc người viết observer không được ngầm dựa vào thứ tự

   Thực tế: dùng allSettled, và nếu cần điều tiết tải thì thêm giới hạn
   số lời gọi song song.

b) Người dùng có nên chờ 3 giây gửi email không?
   → KHÔNG. Việc gửi email không thuộc "giao dịch" thanh toán.

   Kiến trúc đúng: observer chỉ ĐẨY VIỆC VÀO HÀNG ĐỢI rồi trả về ngay.

       don.dangKy("da-thanh-toan", async ({ donHang }) => {
         await hangDoi.them("gui-email", { maDon: donHang.ma });   // ~2ms
       });

   Một worker riêng lấy việc từ hàng đợi và gửi email. Được thêm ba thứ:
     • người dùng nhận phản hồi sau 200ms thay vì 3 giây
     • SMTP chết thì hàng đợi tự thử lại, không mất email
     • lưu lượng tăng đột biến thì hàng đợi làm bộ đệm

   Nguyên tắc chung: trong một request, chỉ làm những việc mà NGƯỜI DÙNG
   cần biết kết quả ngay. Phần còn lại đẩy sang bất đồng bộ.

c) "Cộng điểm" phải chạy SAU "cập nhật tồn kho" — xử lý sao?
   → ⚠️ KHÔNG dựa vào thứ tự đăng ký. Đó là ràng buộc ngầm, không ai nhìn
     thấy khi đọc code, và sẽ vỡ ngay khi có người sắp xếp lại các dòng
     dangKy, hoặc khi bạn đổi sang chạy song song.

   Ba cách đúng, chọn theo tình huống:

   1. TÁCH SỰ KIỆN (thường là đúng nhất)
        "da-thanh-toan"   → observer cập nhật tồn kho
        tồn kho xong      → phát "ton-kho-da-cap-nhat"
        "ton-kho-da-cap-nhat" → observer cộng điểm
      Sự phụ thuộc trở nên HIỆN RÕ trong tên sự kiện.

   2. GỘP THÀNH MỘT QUY TRÌNH
      Nếu hai việc thật sự phải đi liền nhau và cùng thành/bại, chúng
      không phải là hai observer — chúng là MỘT quy trình, và thuộc về
      một Facade (Bài 07). Đừng dùng Observer để mô tả một chuỗi tuần tự.

   3. TRUYỀN DỮ LIỆU CẦN THIẾT VÀO SỰ KIỆN
      Nếu "cộng điểm" chỉ cần biết số hàng thực xuất, hãy đưa con số đó
      vào payload của sự kiện. Khi đó nó không còn phụ thuộc thứ tự nữa.

   📌 Bài học: nếu bạn thấy mình cần đảm bảo thứ tự giữa các observer,
      đó là tín hiệu bạn đang dùng SAI pattern.
═══════════════════════════════════════════════════════════════`);
