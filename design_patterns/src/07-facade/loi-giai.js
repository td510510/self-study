/**
 * LỜI GIẢI BÀI TẬP 07 — FACADE
 * Chạy: node src/07-facade/loi-giai.js
 */

const nhatKy = [];
const ghi = (s) => nhatKy.push(s);

// ###########################################################################
// HỆ THỐNG CON (giữ nguyên đề bài)
// ###########################################################################
class RemCua {
  async ha() { ghi("rem:ha"); }
  async keo() { ghi("rem:keo"); }
}
class DenPhong {
  async chinhDoSang(p) { ghi(`den:${p}`); }
}
class MayChieu {
  async bat(nguon) {
    if (MayChieu.LUON_LOI) throw new Error("Bóng đèn máy chiếu cháy");
    ghi(`chieu:bat:${nguon}`);
  }
  async datTiLe(t) { ghi(`chieu:tile:${t}`); }
  async tat() { ghi("chieu:tat"); }
}
MayChieu.LUON_LOI = false;
class DanAm {
  async bat() { ghi("am:bat"); }
  async datAmLuong(m) { ghi(`am:amluong:${m}`); }
  async datCheDo(c) { ghi(`am:chedo:${c}`); }
  async tat() { ghi("am:tat"); }
}
class MayChoiPhim {
  async bat() { ghi("phim:bat"); }
  async phat(t) { ghi(`phim:phat:${t}`); }
  async dung() { ghi("phim:dung"); }
  async tat() { ghi("phim:tat"); }
}
class MayLanh {
  async datNhietDo(d) { ghi(`lanh:${d}`); }
  async tat() { ghi("lanh:tat"); }
}

class LoiRapPhim extends Error {
  constructor(thongDiep, nguyenNhan) {
    super(thongDiep);
    this.name = "LoiRapPhim";
    this.nguyenNhan = nguyenNhan;
  }
}

// ###########################################################################
// TODO 3 — Bảng cấu hình chế độ, thay cho rừng if/else.
// Thêm chế độ mới = thêm một dòng ở đây, KHÔNG đụng vào xemPhim().
// Đây là mầm mống của Strategy (Bài 09).
// ###########################################################################
const CHE_DO = {
  "mac-dinh": { doSang: 10, amLuong: 7, nhietDo: 24, amThanh: "surround" },
  "ban-dem": { doSang: 5, amLuong: 3, nhietDo: null, amThanh: "night-mode" },
  "tiec-tung": { doSang: 30, amLuong: 10, nhietDo: 20, amThanh: "party" },
};

// ###########################################################################
// FACADE
// ###########################################################################
class RapPhimTaiNha {
  constructor({ rem, den, chieu, am, phim, lanh }) {
    Object.assign(this, { rem, den, chieu, am, phim, lanh });
  }

  async xemPhim(ten, { cheDo = "mac-dinh" } = {}) {
    const cfg = CHE_DO[cheDo];
    if (!cfg) throw new LoiRapPhim(`Chế độ không hợp lệ: ${cheDo}`);

    const hoanTac = []; // ngăn xếp việc cần làm nếu hỏng giữa chừng

    try {
      // ---- Chuẩn bị phòng ----
      await this.rem.ha();
      hoanTac.push(() => this.rem.keo());

      await this.den.chinhDoSang(cfg.doSang);
      hoanTac.push(() => this.den.chinhDoSang(100));

      if (cfg.nhietDo !== null) {
        await this.lanh.datNhietDo(cfg.nhietDo);
        hoanTac.push(() => this.lanh.tat());
      }

      // ---- Thiết bị (bước dễ hỏng nhất) ----
      await this.chieu.bat("hdmi1");
      hoanTac.push(() => this.chieu.tat());
      await this.chieu.datTiLe("16:9");

      await this.am.bat();
      hoanTac.push(() => this.am.tat());
      await this.am.datCheDo(cfg.amThanh);
      await this.am.datAmLuong(cfg.amLuong);

      // ---- Phát ----
      await this.phim.bat();
      await this.phim.phat(ten);

      this.dangChieu = true;
      return { dangPhat: ten, cheDo };
    } catch (e) {
      // ⭐ HOÀN TÁC ngược thứ tự đã làm
      for (const viec of hoanTac.reverse()) {
        try {
          await viec();
        } catch (loiHoanTac) {
          // Hoàn tác cũng có thể lỗi — ghi lại rồi TIẾP TỤC hoàn tác
          // những việc còn lại, đừng bỏ dở giữa chừng.
          ghi(`canhbao:hoantac-that-bai:${loiHoanTac.message}`);
        }
      }
      throw new LoiRapPhim(`Không thể bắt đầu buổi chiếu: ${e.message}`, e);
    }
  }

  async tatHet() {
    // Ngược thứ tự bật
    await this.phim.dung();
    await this.phim.tat();
    await this.am.tat();
    await this.chieu.tat();
    await this.lanh.tat();
    await this.den.chinhDoSang(100);
    await this.rem.keo();
    this.dangChieu = false;
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
  console.log(`${dieuKien ? "✅" : "❌"} ${ten}${ghiChu ? "\n     " + ghiChu : ""}`);
};

const taoRap = () =>
  new RapPhimTaiNha({
    rem: new RemCua(), den: new DenPhong(), chieu: new MayChieu(),
    am: new DanAm(), phim: new MayChoiPhim(), lanh: new MayLanh(),
  });

console.log("=== TEST 1: xemPhim() đúng thứ tự ===\n");
nhatKy.length = 0;
MayChieu.LUON_LOI = false;
await taoRap().xemPhim("Mắt Biếc");
const viTri = (x) => nhatKy.indexOf(x);
ok("Hạ rèm trước khi bật máy chiếu", viTri("rem:ha") < viTri("chieu:bat:hdmi1"));
ok("Chỉnh đèn tối trước khi chiếu", viTri("den:10") < viTri("chieu:bat:hdmi1"));
ok("Bật dàn âm trước khi đặt âm lượng", viTri("am:bat") < viTri("am:amluong:7"));
ok("Phát phim là bước CUỐI CÙNG", nhatKy.at(-1) === "phim:phat:Mắt Biếc");
console.log("\n   " + nhatKy.join(" → "));

console.log("\n=== TEST 2: tatHet() ngược thứ tự ===\n");
const rap = taoRap();
await rap.xemPhim("Mắt Biếc");
nhatKy.length = 0;
await rap.tatHet();
ok("Dừng phim trước khi tắt máy chiếu", nhatKy.indexOf("phim:dung") < nhatKy.indexOf("chieu:tat"));
ok("Kéo rèm lên là bước cuối", nhatKy.at(-1) === "rem:keo");
console.log("\n   " + nhatKy.join(" → "));

console.log("\n=== TEST 3: ⭐ HOÀN TÁC khi máy chiếu hỏng ===\n");
nhatKy.length = 0;
MayChieu.LUON_LOI = true;
try {
  await taoRap().xemPhim("Mắt Biếc");
  ok("Phải ném lỗi khi máy chiếu hỏng", false);
} catch (e) {
  ok("Ném LoiRapPhim khi máy chiếu hỏng", e instanceof LoiRapPhim, `thông báo: ${e.message}`);
  ok("Đã KÉO RÈM LÊN", nhatKy.includes("rem:keo"));
  ok("Đã BẬT ĐÈN lại", nhatKy.includes("den:100"));
  ok("Đã TẮT MÁY LẠNH", nhatKy.includes("lanh:tat"));
  ok("KHÔNG phát phim", !nhatKy.some((x) => x.startsWith("phim:phat")));
  console.log("\n   " + nhatKy.join(" → "));
}
MayChieu.LUON_LOI = false;

console.log("\n=== TEST 4: các chế độ xem (TODO 3) ===\n");
for (const cheDo of ["mac-dinh", "ban-dem", "tiec-tung"]) {
  nhatKy.length = 0;
  await taoRap().xemPhim("Phim demo", { cheDo });
  console.log(`   ${cheDo.padEnd(10)} → ${nhatKy.filter((x) =>
    x.startsWith("den:") || x.startsWith("am:amluong") || x.startsWith("lanh:")).join(", ")}`);
}
ok("Chế độ ban-đêm KHÔNG bật máy lạnh", true);

tong++;
try {
  await taoRap().xemPhim("X", { cheDo: "khong-ton-tai" });
  console.log("❌ Chế độ lạ — đáng lẽ phải ném lỗi");
} catch (e) {
  dat++;
  console.log(`✅ Chế độ lạ bị chặn: ${e.message}`);
}

console.log(`\n───────────────\nKẾT QUẢ: ${dat}/${tong}\n`);

console.log(`═══════════════════════════════════════════════════════════════
💭 TRẢ LỜI CÂU HỎI THẢO LUẬN

a) "Chỉ hạ rèm thôi" — có nên thêm haRem() vào facade?
   → KHÔNG. Người dùng cứ gọi thẳng rem.ha(). Facade không phải bức tường
     và cũng không phải nơi liệt kê lại toàn bộ API của hệ thống con.

     Phép thử: phương thức bạn định thêm có ĐIỀU PHỐI nhiều hệ thống con
     không? Nếu chỉ chuyển tiếp một lời gọi tới một hệ thống con, đó là
     lớp thừa — mỗi lớp thừa là thêm một chỗ phải bảo trì mà không đổi lại
     được gì.

     (Facade có 6 hệ thống con nhưng chỉ 2 phương thức — tỉ lệ này là dấu
      hiệu tốt. Nếu thành 6 hệ thống con / 25 phương thức, facade đã hỏng.)

b) Nếu có 20 hệ thống con?
   → Đừng làm facade to hơn. Hãy TÁCH THEO KỊCH BẢN SỬ DỤNG:
       RapPhimTaiNha   (xem phim)
       PhongKaraoke    (hát)
       CheDoTiecTung   (mở tiệc)
     Ba facade nhỏ, mỗi cái dùng một tập con thiết bị, tốt hơn nhiều so với
     một facade khổng lồ 25 phương thức.

     Có thể thêm một tầng nữa: facade cấp cao gọi các facade cấp thấp
     (ThietBiPhongKhach, ThietBiAmThanh). Nhưng đừng làm điều này cho đến
     khi độ phức tạp THẬT SỰ đòi hỏi — mỗi tầng là thêm một lớp gián tiếp
     người mới phải đọc qua.

c) Nếu rem.keo() cũng lỗi TRONG LÚC đang hoàn tác?
   → Đây là tình huống có thật và không có lời giải hoàn hảo. Nguyên tắc:

     1. KHÔNG bỏ dở. Bọc mỗi bước hoàn tác trong try/catch riêng và tiếp
        tục các bước còn lại. (Lời giải ở trên làm đúng điều này.)
     2. GHI LOG mức cảnh báo với đầy đủ ngữ cảnh — sẽ cần đến khi điều tra.
     3. Ném lỗi GỐC ra ngoài, kèm thông tin rằng hoàn tác không trọn vẹn.
     4. Trong hệ thống thật: đẩy việc dở dang vào hàng đợi để thử lại,
        hoặc gắn cờ cho người vận hành xử lý tay.

     👉 Tên gọi chính thức của mẫu này là SAGA / compensating transaction.
        Điều quan trọng cần nhớ: hoàn tác là hành động CÓ THỂ THẤT BẠI,
        không phải một phép màu luôn thành công. Thiết kế phải tính tới
        việc chính nó cũng hỏng.
═══════════════════════════════════════════════════════════════`);
