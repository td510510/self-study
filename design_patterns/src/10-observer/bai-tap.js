/**
 * BÀI TẬP 10 — OBSERVER
 * Chạy: node src/10-observer/bai-tap.js
 */

// ###########################################################################
// 📝 TODO 1 — Tự viết BoPhatSuKien
//
//   dangKy(ten, xuLy)      → TRẢ VỀ HÀM HỦY (bắt buộc, để chống rò rỉ)
//   once(ten, xuLy)        → nghe một lần rồi tự hủy
//   phat(ten, duLieu)      → gọi mọi người nghe, TRẢ VỀ { soNguoiNghe, cacLoi }
//   demNguoiNghe(ten?)     → đếm; không truyền tên thì đếm tất cả
//
//   ⚠️ YÊU CẦU BẮT BUỘC:
//     a) Bọc try/catch cho TỪNG observer — một cái lỗi không làm chết cả dây
//     b) Thu thập lỗi vào mảng cacLoi = [{ xuLy, loi }]
//     c) Chống vòng lặp vô tận: độ sâu đệ quy > 10 thì ném lỗi hệ thống
//        (lỗi này phải BAY LÊN tới nơi gọi ngoài cùng, không bị nuốt vào cacLoi)
// ###########################################################################

class BoPhatSuKien {
  constructor() {
    // TODO
  }

  dangKy(ten, xuLy) {
    // TODO — nhớ return hàm hủy
  }

  once(ten, xuLy) {
    // TODO
  }

  async phat(ten, duLieu) {
    // TODO
    return { suKien: ten, soNguoiNghe: 0, cacLoi: [] };
  }

  demNguoiNghe(ten) {
    // TODO
    return 0;
  }
}

// ###########################################################################
// 📝 TODO 2 — Chuyển DonHang sang Observer
//
//   ⚠️ ĐIỀU KIỆN NGHIỆM THU: class DonHang KHÔNG được chứa các chữ
//      "email", "sms", "kho", "diem". Nó chỉ phát sự kiện.
// ###########################################################################

class DonHang extends BoPhatSuKien {
  constructor(ma, khach, tongTien) {
    super();
    Object.assign(this, { ma, khach, tongTien, trangThai: "moi" });
  }

  async thanhToan() {
    // TODO: đổi trạng thái + phát sự kiện "da-thanh-toan"
  }

  async huy(lyDo) {
    // TODO: đổi trạng thái + phát sự kiện "da-huy" kèm lyDo
  }
}

// ###########################################################################
// BỘ KIỂM THỬ
// ###########################################################################
let dat = 0;
let tong = 0;
const ok = (ten, dieuKien, ghiChu = "") => {
  tong++;
  if (dieuKien) dat++;
  console.log(`${dieuKien ? "✅" : "❌"} ${ten}${ghiChu ? "  (" + ghiChu + ")" : ""}`);
};

console.log("=== TEST 1: cơ bản ===\n");
try {
  const bus = new BoPhatSuKien();
  let dem = 0;
  bus.dangKy("test", () => dem++);
  bus.dangKy("test", () => dem++);
  await bus.phat("test");
  ok("Hai observer đều được gọi", dem === 2, `dem = ${dem}`);

  const huy = bus.dangKy("test", () => dem++);
  huy();
  dem = 0;
  await bus.phat("test");
  ok("dangKy trả về hàm hủy hoạt động", dem === 2, `dem = ${dem}`);

  let demOnce = 0;
  bus.once("mot-lan", () => demOnce++);
  await bus.phat("mot-lan");
  await bus.phat("mot-lan");
  await bus.phat("mot-lan");
  ok("once() chỉ chạy đúng 1 lần", demOnce === 1, `demOnce = ${demOnce}`);
  ok("once() tự hủy khỏi danh sách", bus.demNguoiNghe("mot-lan") === 0);
} catch (e) {
  tong += 4;
  console.log("❌ Chưa làm TODO 1 — " + e.message);
}

console.log("\n=== TEST 2: một observer lỗi không làm chết cả dây ===\n");
try {
  const bus = new BoPhatSuKien();
  const daChay = [];
  bus.dangKy("sk", function moduleA() {
    daChay.push("A");
  });
  bus.dangKy("sk", function moduleB() {
    throw new Error("B hỏng");
  });
  bus.dangKy("sk", function moduleC() {
    daChay.push("C");
  });

  const kq = await bus.phat("sk");
  ok("Observer sau observer lỗi VẪN chạy", daChay.join("") === "AC", `đã chạy: ${daChay}`);
  ok("Lỗi được thu thập, không ném ra ngoài", kq.cacLoi?.length === 1);
  ok("Lỗi ghi rõ observer nào hỏng", kq.cacLoi?.[0]?.xuLy === "moduleB",
    JSON.stringify(kq.cacLoi?.[0]));
} catch (e) {
  tong += 3;
  console.log("❌ " + e.message);
}

console.log("\n=== TEST 3: ⭐ chống rò rỉ bộ nhớ ===\n");
try {
  const store = new BoPhatSuKien();

  class ThanhPhan {
    constructor(store) {
      // TODO 3: sửa dòng dưới để component tự dọn dẹp khi bị hủy
      store.dangKy("thay-doi", () => this.veLai());
    }
    veLai() {}
    huy() {
      // TODO 3: gọi hàm hủy đăng ký ở đây
    }
  }

  for (let i = 0; i < 1000; i++) new ThanhPhan(store).huy();
  ok("Hủy 1000 component → 0 observer còn sót",
    store.demNguoiNghe("thay-doi") === 0,
    `còn lại: ${store.demNguoiNghe("thay-doi")}`);
} catch (e) {
  tong++;
  console.log("❌ " + e.message);
}

console.log("\n=== TEST 4: chống vòng lặp vô tận ===\n");
tong++;
try {
  const bus = new BoPhatSuKien();
  bus.dangKy("A", async () => await bus.phat("B"));
  bus.dangKy("B", async () => await bus.phat("A"));
  await bus.phat("A");
  console.log("❌ Không phát hiện được vòng lặp (hoặc treo)");
} catch (e) {
  dat++;
  console.log("✅ Chặn được vòng lặp: " + e.message);
}

console.log("\n=== TEST 5: DonHang dùng Observer ===\n");
try {
  const don = new DonHang("DH1001", { ten: "An", email: "an@example.com" }, 350_000);
  const daLam = [];
  don.dangKy("da-thanh-toan", () => daLam.push("email"));
  don.dangKy("da-thanh-toan", () => daLam.push("kho"));
  don.dangKy("da-huy", (dl) => daLam.push("hoan-tien:" + dl.lyDo));

  await don.thanhToan();
  ok("thanhToan() phát sự kiện tới 2 observer", daLam.length === 2, daLam.join(","));
  ok("Trạng thái đơn được cập nhật", don.trangThai === "da-thanh-toan", don.trangThai);

  await don.huy("khách đổi ý");
  ok("huy() phát sự kiện kèm lý do", daLam.includes("hoan-tien:khách đổi ý"), daLam.join(","));

  const nguonDonHang = DonHang.toString().toLowerCase();
  ok("⭐ DonHang KHÔNG biết gì về email/sms/kho/điểm",
    !["email", "sms", "tonkho", "diem"].some((t) => nguonDonHang.includes(t)));
} catch (e) {
  tong += 4;
  console.log("❌ Chưa làm TODO 2 — " + e.message);
}

console.log(`\n───────────────\nKẾT QUẢ: ${dat}/${tong}\n`);

// ###########################################################################
// 📝 TODO 4 (NÂNG CAO) — ký tự đại diện
//
//   bus.dangKy("don.*", f)   → nghe được cả "don.tao", "don.huy", "don.giao"
//   bus.dangKy("*", f)       → nghe MỌI sự kiện (hữu ích cho logger)
//
//   Viết test của riêng bạn để chứng minh.
// ###########################################################################

// ###########################################################################
// 💭 CÂU HỎI THẢO LUẬN
//
//   a) phat() hiện chạy observer TUẦN TỰ (for + await). Nếu đổi sang chạy
//      song song bằng Promise.allSettled thì được gì, mất gì?
//      TRẢ LỜI: ...........................................................
//
//   b) Gửi email mất 3 giây. Người dùng có nên chờ 3 giây đó khi bấm
//      "Thanh toán" không? Nếu không thì kiến trúc nên thế nào?
//      TRẢ LỜI: ...........................................................
//
//   c) Observer "cộng điểm thành viên" cần chạy SAU observer "cập nhật tồn
//      kho" (vì điểm tính theo số hàng thực xuất). Bạn xử lý ra sao?
//      ⚠️ Gợi ý: câu trả lời KHÔNG phải là "sắp xếp thứ tự đăng ký".
//      TRẢ LỜI: ...........................................................
// ###########################################################################
