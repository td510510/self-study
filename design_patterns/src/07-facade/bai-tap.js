/**
 * BÀI TẬP 07 — FACADE
 * Chạy: node src/07-facade/bai-tap.js
 *
 * Bối cảnh: rạp phim tại nhà với 6 hệ thống con, mỗi cái một API riêng.
 */

// Nhật ký dùng để bộ test kiểm tra THỨ TỰ các thao tác
export const nhatKy = [];
const ghi = (s) => nhatKy.push(s);

// ###########################################################################
// CÁC HỆ THỐNG CON — không được sửa
// ###########################################################################

class RemCua {
  async ha() {
    ghi("rem:ha");
  }
  async keo() {
    ghi("rem:keo");
  }
}

class DenPhong {
  async chinhDoSang(phanTram) {
    ghi(`den:${phanTram}`);
  }
}

class MayChieu {
  #dangBat = false;
  async bat(nguon) {
    // Máy chiếu cần 3 giây khởi động và ĐÔI KHI hỏng
    if (MayChieu.LUON_LOI) throw new Error("Bóng đèn máy chiếu cháy");
    this.#dangBat = true;
    ghi(`chieu:bat:${nguon}`);
  }
  async datTiLe(tiLe) {
    ghi(`chieu:tile:${tiLe}`);
  }
  async tat() {
    this.#dangBat = false;
    ghi("chieu:tat");
  }
}
MayChieu.LUON_LOI = false;

class DanAm {
  async bat() {
    ghi("am:bat");
  }
  async datAmLuong(muc) {
    ghi(`am:amluong:${muc}`);
  }
  async datCheDo(cheDo) {
    ghi(`am:chedo:${cheDo}`);
  }
  async tat() {
    ghi("am:tat");
  }
}

class MayChoiPhim {
  async bat() {
    ghi("phim:bat");
  }
  async phat(ten) {
    ghi(`phim:phat:${ten}`);
  }
  async dung() {
    ghi("phim:dung");
  }
  async tat() {
    ghi("phim:tat");
  }
}

class MayLanh {
  async datNhietDo(do_) {
    ghi(`lanh:${do_}`);
  }
  async tat() {
    ghi("lanh:tat");
  }
}

// ###########################################################################
// 📝 TODO 1 — Viết Facade RapPhimTaiNha
//
//   constructor({ rem, den, chieu, am, phim, lanh })
//
//   async xemPhim(ten):
//      Thứ tự BẮT BUỘC (bộ test kiểm tra):
//        1. rem.ha()                    ← hạ rèm TRƯỚC
//        2. den.chinhDoSang(10)
//        3. lanh.datNhietDo(24)
//        4. chieu.bat("hdmi1")          ← có thể LỖI
//        5. chieu.datTiLe("16:9")
//        6. am.bat() → am.datCheDo("surround") → am.datAmLuong(7)
//        7. phim.bat() → phim.phat(ten)
//
//   async tatHet():
//      Chạy NGƯỢC thứ tự: phim → âm → chiếu → lạnh → đèn → rèm
//
// 📝 TODO 2 — HOÀN TÁC khi máy chiếu lỗi (phần quan trọng nhất)
//
//   Nếu chieu.bat() ném lỗi, facade phải:
//      - kéo rèm lên (rem.keo())
//      - bật đèn lại (den.chinhDoSang(100))
//      - tắt máy lạnh (lanh.tat())
//      - rồi ném LoiRapPhim với thông báo rõ ràng
//
//   Không được để khán giả ngồi trong phòng tối, rèm đóng, không có phim.
// ###########################################################################

class LoiRapPhim extends Error {
  constructor(thongDiep, nguyenNhan) {
    super(thongDiep);
    this.name = "LoiRapPhim";
    this.nguyenNhan = nguyenNhan;
  }
}

class RapPhimTaiNha {
  constructor({ rem, den, chieu, am, phim, lanh }) {
    Object.assign(this, { rem, den, chieu, am, phim, lanh });
  }

  async xemPhim(ten, tuyChon = {}) {
    // TODO
  }

  async tatHet() {
    // TODO
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
  console.log(`${dieuKien ? "✅" : "❌"} ${ten}${ghiChu ? "\n     " + ghiChu : ""}`);
};

const taoRap = () =>
  new RapPhimTaiNha({
    rem: new RemCua(),
    den: new DenPhong(),
    chieu: new MayChieu(),
    am: new DanAm(),
    phim: new MayChoiPhim(),
    lanh: new MayLanh(),
  });

console.log("=== TEST 1: xemPhim() đúng thứ tự ===\n");
nhatKy.length = 0;
MayChieu.LUON_LOI = false;
try {
  await taoRap().xemPhim("Mắt Biếc");

  const viTri = (x) => nhatKy.indexOf(x);
  ok("Hạ rèm trước khi bật máy chiếu",
    viTri("rem:ha") >= 0 && viTri("rem:ha") < viTri("chieu:bat:hdmi1"));
  ok("Chỉnh đèn tối trước khi chiếu",
    viTri("den:10") >= 0 && viTri("den:10") < viTri("chieu:bat:hdmi1"));
  ok("Bật dàn âm trước khi đặt âm lượng",
    viTri("am:bat") >= 0 && viTri("am:bat") < viTri("am:amluong:7"));
  ok("Phát phim là bước CUỐI CÙNG", nhatKy.at(-1) === "phim:phat:Mắt Biếc");
  console.log("\n   Nhật ký:", nhatKy.join(" → "));
} catch (e) {
  tong += 4;
  console.log("❌ Chưa làm TODO 1 — " + e.message);
}

console.log("\n=== TEST 2: tatHet() ngược thứ tự ===\n");
nhatKy.length = 0;
try {
  const rap = taoRap();
  await rap.xemPhim("Mắt Biếc");
  nhatKy.length = 0;
  await rap.tatHet();

  ok("Dừng phim trước khi tắt máy chiếu",
    nhatKy.indexOf("phim:dung") >= 0 && nhatKy.indexOf("phim:dung") < nhatKy.indexOf("chieu:tat"));
  ok("Kéo rèm lên là bước cuối", nhatKy.at(-1) === "rem:keo");
  console.log("\n   Nhật ký:", nhatKy.join(" → "));
} catch (e) {
  tong += 2;
  console.log("❌ Chưa làm phần tatHet() — " + e.message);
}

console.log("\n=== TEST 3: ⭐ HOÀN TÁC khi máy chiếu hỏng ===\n");
nhatKy.length = 0;
MayChieu.LUON_LOI = true;
try {
  await taoRap().xemPhim("Mắt Biếc");
  ok("Phải ném lỗi khi máy chiếu hỏng", false);
} catch (e) {
  ok("Ném LoiRapPhim khi máy chiếu hỏng", e instanceof LoiRapPhim, `nhận được: ${e.name}`);
  ok("Đã KÉO RÈM LÊN (không để khán giả ngồi trong tối)", nhatKy.includes("rem:keo"));
  ok("Đã BẬT ĐÈN lại", nhatKy.includes("den:100"));
  ok("Đã TẮT MÁY LẠNH", nhatKy.includes("lanh:tat"));
  ok("KHÔNG phát phim", !nhatKy.some((x) => x.startsWith("phim:phat")));
  console.log("\n   Nhật ký:", nhatKy.join(" → "));
}
MayChieu.LUON_LOI = false;

console.log(`\n───────────────\nKẾT QUẢ: ${dat}/${tong}\n`);

// ###########################################################################
// 📝 TODO 3 (NÂNG CAO) — chế độ xem
//
//   xemPhim(ten, { cheDo: "ban-dem" })  → âm lượng 3, đèn 5%, không bật máy lạnh
//   xemPhim(ten, { cheDo: "tiec-tung" }) → âm lượng 10, đèn 30%, máy lạnh 20
//   xemPhim(ten)                         → mặc định như hiện tại
//
//   ⚠️ Đừng viết if/else trong xemPhim(). Hãy tách bảng cấu hình:
//        const CHE_DO = { "mac-dinh": {...}, "ban-dem": {...} }
//      Đây chính là mầm mống của Strategy (Bài 09).
// ###########################################################################

// ###########################################################################
// 💭 CÂU HỎI THẢO LUẬN
//
//   a) Nếu người dùng muốn "chỉ hạ rèm thôi, không xem phim", họ có nên gọi
//      qua facade không? Bạn có nên thêm phương thức haRem() vào facade?
//      TRẢ LỜI: ...........................................................
//
//   b) Facade này có 6 hệ thống con. Nếu sau này có 20, bạn xử lý thế nào?
//      TRẢ LỜI: ...........................................................
//
//   c) Trong TEST 3, nếu bản thân rem.keo() cũng lỗi khi đang hoàn tác,
//      facade nên làm gì? (đây là tình huống có thật trong hệ thống phân tán)
//      TRẢ LỜI: ...........................................................
// ###########################################################################
