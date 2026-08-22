/**
 * BÀI TẬP 15 — PUB/SUB
 * Chạy: node src/15-pubsub/bai-tap.js
 */

// ###########################################################################
// DANH MỤC SỰ KIỆN — hợp đồng chung giữa các module (không sửa)
// ###########################################################################
export const SU_KIEN = Object.freeze({
  DON_TAO: "don.tao",
  DON_DA_THANH_TOAN: "don.da-thanh-toan",
  DON_DA_HUY: "don.da-huy",
  KHO_HET_HANG: "kho.het-hang",
});

/** Trường bắt buộc cho từng kênh */
export const LUOC_DO = Object.freeze({
  [SU_KIEN.DON_TAO]: ["maDon"],
  [SU_KIEN.DON_DA_THANH_TOAN]: ["maDon", "soTien"],
  [SU_KIEN.DON_DA_HUY]: ["maDon", "lyDo"],
  [SU_KIEN.KHO_HET_HANG]: ["maSP"],
});

// ###########################################################################
// 📝 TODO — Viết EventBus với ĐẦY ĐỦ RÀO CHẮN
//
//   dangKy(ten, xuLy, { boi })     → trả về hàm hủy
//                                    ten phải nằm trong SU_KIEN, hoặc có "*"
//   once(ten, xuLy)                → nghe một lần
//   phat(ten, duLieu, { boi })     → { soNguoiNghe, cacLoi }
//   phatVaCho(ten, duLieu)         → chờ MỌI subscriber xong, gom kết quả
//   sinhSoDo()                     → chuỗi Mermaid "graph LR"
//   canhBao                        → mảng các cảnh báo đã ghi
//
//   RÀO CHẮN BẮT BUỘC:
//     1. Tên kênh không có trong SU_KIEN → ném lỗi liệt kê kênh hợp lệ
//     2. Payload thiếu trường theo LUOC_DO → ném lỗi nêu rõ trường thiếu
//     3. Phát mà không ai nghe → đẩy cảnh báo vào this.canhBao
//     4. Subscriber lỗi → thu thập vào cacLoi, KHÔNG làm chết cả dây
//     5. Hỗ trợ "don.*" và "*"
//     6. Ghi lại sơ đồ ai phát gì / ai nghe gì
// ###########################################################################

class EventBus {
  constructor() {
    this.canhBao = [];
    // TODO
  }

  dangKy(ten, xuLy, tuyChon = {}) {
    // TODO
  }

  once(ten, xuLy) {
    // TODO
  }

  async phat(ten, duLieu = {}, tuyChon = {}) {
    // TODO
    return { soNguoiNghe: 0, cacLoi: [] };
  }

  async phatVaCho(ten, duLieu = {}) {
    // TODO — chạy SONG SONG, gom cả kết quả lẫn lỗi
    return { ketQua: [], cacLoi: [] };
  }

  sinhSoDo() {
    // TODO
    return "graph LR";
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
const nemLoi = async (ham) => {
  try {
    await ham();
    return false;
  } catch {
    return true;
  }
};

console.log("=== TEST 1: cơ bản ===\n");
try {
  const bus = new EventBus();
  const nhan = [];
  bus.dangKy(SU_KIEN.DON_DA_THANH_TOAN, (dl) => nhan.push("A:" + dl.maDon), { boi: "BaoCao" });
  bus.dangKy(SU_KIEN.DON_DA_THANH_TOAN, (dl) => nhan.push("B:" + dl.maDon), { boi: "Email" });

  const kq = await bus.phat(SU_KIEN.DON_DA_THANH_TOAN, { maDon: "DH1", soTien: 100 }, { boi: "DatHang" });
  ok("Cả 2 subscriber đều nhận", nhan.length === 2, nhan.join(","));
  ok("Báo đúng số người nghe", kq.soNguoiNghe === 2);

  const huy = bus.dangKy(SU_KIEN.DON_TAO, () => nhan.push("C"), { boi: "X" });
  huy();
  await bus.phat(SU_KIEN.DON_TAO, { maDon: "DH2" }, { boi: "Y" });
  ok("Hàm hủy hoạt động", !nhan.includes("C"));
} catch (e) {
  tong += 3;
  console.log("❌ Chưa làm phần cơ bản — " + e.message);
}

console.log("\n=== TEST 2: rào chắn ===\n");
try {
  const bus = new EventBus();
  bus.dangKy(SU_KIEN.DON_DA_THANH_TOAN, () => {}, { boi: "X" });

  ok("⭐ Rào 1: tên kênh lạ → ném lỗi",
    await nemLoi(() => bus.phat("don.da-thanhtoan", { maDon: "X", soTien: 1 })));
  ok("⭐ Rào 1: đăng ký kênh lạ cũng bị chặn",
    await nemLoi(async () => bus.dangKy("khong-co-trong-danh-muc", () => {})));
  ok("⭐ Rào 2: thiếu trường bắt buộc → ném lỗi",
    await nemLoi(() => bus.phat(SU_KIEN.DON_DA_THANH_TOAN, { maDon: "X" })));

  const bus2 = new EventBus();
  await bus2.phat(SU_KIEN.KHO_HET_HANG, { maSP: "AO1" }, { boi: "Kho" });
  ok("⭐ Rào 3: cảnh báo khi không ai nghe", bus2.canhBao.length === 1, bus2.canhBao[0]);
} catch (e) {
  tong += 4;
  console.log("❌ " + e.message);
}

console.log("\n=== TEST 3: subscriber lỗi không làm chết cả dây ===\n");
try {
  const bus = new EventBus();
  const daChay = [];
  bus.dangKy(SU_KIEN.DON_TAO, function modA() {
    daChay.push("A");
  });
  bus.dangKy(SU_KIEN.DON_TAO, function modB() {
    throw new Error("B hỏng");
  });
  bus.dangKy(SU_KIEN.DON_TAO, function modC() {
    daChay.push("C");
  });

  const kq = await bus.phat(SU_KIEN.DON_TAO, { maDon: "DH1" });
  ok("Subscriber sau cái lỗi VẪN chạy", daChay.join("") === "AC", daChay.join(""));
  ok("Lỗi được thu thập", kq.cacLoi.length === 1 && kq.cacLoi[0].xuLy === "modB",
    JSON.stringify(kq.cacLoi));
} catch (e) {
  tong += 2;
  console.log("❌ " + e.message);
}

console.log("\n=== TEST 4: ký tự đại diện ===\n");
try {
  const bus = new EventBus();
  const nhan = [];
  bus.dangKy("don.*", () => nhan.push("don-handler"), { boi: "KiemToan" });
  bus.dangKy("*", () => nhan.push("logger"), { boi: "Logger" });

  await bus.phat(SU_KIEN.DON_TAO, { maDon: "X" }, { boi: "P" });
  ok("don.* bắt được don.tao", nhan.includes("don-handler"));
  ok("* bắt được mọi sự kiện", nhan.includes("logger"));

  nhan.length = 0;
  await bus.phat(SU_KIEN.KHO_HET_HANG, { maSP: "A" }, { boi: "P" });
  ok("don.* KHÔNG bắt kho.het-hang", !nhan.includes("don-handler") && nhan.includes("logger"),
    nhan.join(","));
} catch (e) {
  tong += 3;
  console.log("❌ " + e.message);
}

console.log("\n=== TEST 5: sơ đồ tự sinh ===\n");
try {
  const bus = new EventBus();
  bus.dangKy(SU_KIEN.DON_DA_THANH_TOAN, () => {}, { boi: "BaoCao" });
  bus.dangKy(SU_KIEN.DON_DA_THANH_TOAN, () => {}, { boi: "Email" });
  await bus.phat(SU_KIEN.DON_DA_THANH_TOAN, { maDon: "X", soTien: 1 }, { boi: "DatHang" });

  const soDo = bus.sinhSoDo();
  ok("Sơ đồ có publisher", soDo.includes("DatHang"));
  ok("Sơ đồ có cả 2 subscriber", soDo.includes("BaoCao") && soDo.includes("Email"));
  console.log("\n" + soDo);
} catch (e) {
  tong += 2;
  console.log("❌ " + e.message);
}

console.log("\n=== TEST 6: phatVaCho() — chạy song song, gom kết quả ===\n");
try {
  const bus = new EventBus();
  const nghi = (ms) => new Promise((r) => setTimeout(r, ms));
  bus.dangKy(SU_KIEN.DON_TAO, async () => {
    await nghi(40);
    return "kết quả A";
  });
  bus.dangKy(SU_KIEN.DON_TAO, async () => {
    await nghi(40);
    return "kết quả B";
  });
  bus.dangKy(SU_KIEN.DON_TAO, async () => {
    throw new Error("C hỏng");
  });

  const t = Date.now();
  const kq = await bus.phatVaCho(SU_KIEN.DON_TAO, { maDon: "X" });
  const ms = Date.now() - t;

  ok("Gom được 2 kết quả thành công", kq.ketQua.length === 2, JSON.stringify(kq.ketQua));
  ok("Gom được 1 lỗi", kq.cacLoi.length === 1);
  ok("⭐ Chạy SONG SONG (< 80ms chứ không phải ~80ms)", ms < 80, `${ms}ms`);
} catch (e) {
  tong += 3;
  console.log("❌ Chưa làm phatVaCho() — " + e.message);
}

console.log(`\n───────────────\nKẾT QUẢ: ${dat}/${tong}\n`);

// ###########################################################################
// 💭 CÂU HỎI THẢO LUẬN
//
//   a) Bạn vừa xây 6 rào chắn cho event bus. Nếu bỏ hết đi, code ngắn hơn
//      nhiều. Lập luận: rào chắn nào là BẮT BUỘC, rào nào là tùy dự án?
//      TRẢ LỜI: ...........................................................
//
//   b) Khi chuyển event bus này lên Redis Pub/Sub (chạy qua mạng), điều gì
//      KHÔNG CÒN ĐÚNG nữa? Nêu ít nhất 3 điều.
//      TRẢ LỜI: ...........................................................
//
//   c) Có ý kiến: "dùng event bus cho mọi giao tiếp giữa các module thì hệ
//      thống rất linh hoạt". Bạn phản biện thế nào?
//      TRẢ LỜI: ...........................................................
// ###########################################################################
