/**
 * LỜI GIẢI BÀI TẬP 13 — MODULE
 * Chạy: node src/13-module/loi-giai.js
 */

// ###########################################################################
// TODO 1 — Factory Module: giỏ hàng
// ###########################################################################
function taoGioHang() {
  // RIÊNG TƯ: không có đường nào từ bên ngoài chạm tới mảng này
  const cacMon = [];

  const tim = (ma) => cacMon.findIndex((m) => m.ma === ma);

  return {
    them(sanPham) {
      const i = tim(sanPham.ma);
      if (i >= 0) cacMon[i].soLuong += sanPham.soLuong;
      else cacMon.push({ ...sanPham }); // sao chép, không giữ tham chiếu của người gọi
      return this;
    },

    xoa(ma) {
      const i = tim(ma);
      if (i < 0) return false;
      cacMon.splice(i, 1);
      return true;
    },

    doiSoLuong(ma, soLuong) {
      const i = tim(ma);
      if (i < 0) return false;
      if (soLuong <= 0) cacMon.splice(i, 1);
      else cacMon[i].soLuong = soLuong;
      return true;
    },

    tong: () => cacMon.reduce((s, m) => s + m.gia * m.soLuong, 0),
    soMon: () => cacMon.reduce((s, m) => s + m.soLuong, 0),

    // ⭐ Sao chép SÂU một tầng: mảng mới, và mỗi phần tử cũng là object mới.
    // Nếu chỉ [...cacMon] thì bên ngoài vẫn sửa được ds[0].gia.
    danhSach: () => cacMon.map((m) => ({ ...m })),

    lamRong() {
      cacMon.length = 0;
    },
  };
}

// ###########################################################################
// TODO 2 — Bộ nhớ đệm có TTL
// ###########################################################################
function taoBoNhoDem(ttlMs = 1000) {
  const kho = new Map();
  let soLanTrung = 0; // riêng tư
  let soLanTruot = 0; // riêng tư

  // Boolean(...) chứ không phải `muc && ...` — nếu không, co("b") trả về
  // undefined thay vì false, và test `=== false` sẽ đỏ. Hàm trả về boolean
  // thì phải trả boolean thật, đừng để lọt giá trị "falsy" khác kiểu.
  const conHan = (muc) => Boolean(muc) && Date.now() - muc.luc < ttlMs;

  return {
    dat(khoa, giaTri) {
      kho.set(khoa, { giaTri, luc: Date.now() });
    },

    lay(khoa) {
      const muc = kho.get(khoa);
      if (conHan(muc)) {
        soLanTrung++;
        return muc.giaTri;
      }
      if (muc) kho.delete(khoa); // dọn mục đã hết hạn
      soLanTruot++;
      return undefined;
    },

    co(khoa) {
      // Chú ý: co() KHÔNG tính vào thống kê trúng/trượt — nó chỉ là phép hỏi,
      // không phải một lần sử dụng cache. Trộn hai thứ này sẽ làm số liệu sai.
      return conHan(kho.get(khoa));
    },

    xoa: (khoa) => kho.delete(khoa),

    thongKe: () => ({
      soLanTrung,
      soLanTruot,
      soMuc: kho.size,
      tiLeTrung: soLanTrung + soLanTruot
        ? Math.round((soLanTrung / (soLanTrung + soLanTruot)) * 100) + "%"
        : "—",
    }),
  };
}

// ###########################################################################
// TODO 3 — SỬA LỖI RÒ RỈ ĐÓNG GÓI
// ###########################################################################
function taoSoDiaChi() {
  const diaChi = [];
  // Object.freeze là "hàng rào" ở mức ngôn ngữ, không chỉ là lời hứa.
  const macDinh = Object.freeze({ thanhPho: "Hà Nội", quocGia: "Việt Nam" });

  return {
    them(dc) {
      diaChi.push({ ...macDinh, ...dc });
    },
    // ✅ SỬA 1: trả bản sao của mảng VÀ của từng phần tử
    layTatCa() {
      return diaChi.map((d) => ({ ...d }));
    },
    // ✅ SỬA 2: trả bản sao (macDinh đã freeze nên cũng an toàn sẵn)
    layMacDinh() {
      return { ...macDinh };
    },
    demSo() {
      return diaChi.length;
    },
  };
}

// ###########################################################################
// TODO 4 — Bản class với private field
// ###########################################################################
class GioHang {
  #cacMon = [];

  #tim(ma) {
    return this.#cacMon.findIndex((m) => m.ma === ma);
  }

  them(sanPham) {
    const i = this.#tim(sanPham.ma);
    if (i >= 0) this.#cacMon[i].soLuong += sanPham.soLuong;
    else this.#cacMon.push({ ...sanPham });
    return this;
  }
  xoa(ma) {
    const i = this.#tim(ma);
    if (i < 0) return false;
    this.#cacMon.splice(i, 1);
    return true;
  }
  get tong() {
    return this.#cacMon.reduce((s, m) => s + m.gia * m.soLuong, 0);
  }
  danhSach() {
    return this.#cacMon.map((m) => ({ ...m }));
  }
  /** Điểm mạnh của class: khôi phục từ dữ liệu lưu trữ rất tự nhiên */
  static tuJSON(chuoi) {
    const gio = new GioHang();
    for (const m of JSON.parse(chuoi)) gio.them(m);
    return gio;
  }
  toJSON() {
    return this.#cacMon;
  }
}

// ###########################################################################
// KIỂM THỬ
// ###########################################################################
let dat = 0;
let tong_ = 0;
const ok = (ten, dieuKien, ghiChu = "") => {
  tong_++;
  if (dieuKien) dat++;
  console.log(`${dieuKien ? "✅" : "❌"} ${ten}${ghiChu ? "  (" + ghiChu + ")" : ""}`);
};

console.log("=== TEST 1: giỏ hàng ===\n");
const gio = taoGioHang();
gio.them({ ma: "AO1", ten: "Áo thun", gia: 250_000, soLuong: 2 });
gio.them({ ma: "QU1", ten: "Quần jean", gia: 550_000, soLuong: 1 });
ok("Tổng tiền đúng", gio.tong() === 1_050_000, `${gio.tong()}`);
ok("Số món đúng", gio.soMon() === 3);

gio.them({ ma: "AO1", ten: "Áo thun", gia: 250_000, soLuong: 1 });
ok("Thêm trùng mã thì cộng dồn", gio.soMon() === 4);

gio.doiSoLuong("AO1", 0);
ok("doiSoLuong(0) thì xóa món", gio.danhSach().length === 1);
ok("xoa() mã không tồn tại trả false", gio.xoa("KHONG-CO") === false);

const ds = gio.danhSach();
ds.push({ ma: "HACK", gia: 999, soLuong: 1 });
ds[0].gia = 1;
ok("⭐ danhSach() trả BẢN SAO — push không ảnh hưởng", gio.danhSach().length === 1);
ok("⭐ Sửa phần tử trong bản sao không đổi giá gốc", gio.tong() === 550_000, `${gio.tong()}`);

const gio2 = taoGioHang();
gio2.them({ ma: "MU1", ten: "Mũ", gia: 100_000, soLuong: 1 });
ok("Hai giỏ hàng độc lập nhau", gio.tong() === 550_000 && gio2.tong() === 100_000);

console.log("\n=== TEST 2: bộ nhớ đệm ===\n");
const cache = taoBoNhoDem(100);
cache.dat("a", 1);
ok("lay() lấy được giá trị vừa đặt", cache.lay("a") === 1);
ok("co() báo đúng", cache.co("a") === true && cache.co("b") === false);
cache.lay("khong-co");
ok("thongKe() đếm đúng trúng/trượt",
  cache.thongKe().soLanTrung === 1 && cache.thongKe().soLanTruot === 1,
  JSON.stringify(cache.thongKe()));
await new Promise((r) => setTimeout(r, 150));
ok("Giá trị hết hạn sau TTL", cache.lay("a") === undefined);
ok("⭐ soLanTrung không lộ ra ngoài", cache.soLanTrung === undefined);

console.log("\n=== TEST 3: rò rỉ đóng gói (đã sửa) ===\n");
const so = taoSoDiaChi();
so.them({ duong: "12 Nguyễn Trãi" });
so.layTatCa().push({ duong: "HACK" });
ok("⭐ layTatCa() không cho phép chèn từ ngoài", so.demSo() === 1);

so.layMacDinh().thanhPho = "HACKED";
const so2 = taoSoDiaChi();
so2.them({ duong: "34 Lê Lợi" });
ok("⭐ layMacDinh() không cho sửa giá trị mặc định",
  so2.layTatCa()[0].thanhPho === "Hà Nội", so2.layTatCa()[0].thanhPho);

console.log("\n=== TEST 4: bản class ===\n");
const gioC = new GioHang();
gioC.them({ ma: "AO1", ten: "Áo", gia: 250_000, soLuong: 2 });
ok("class hoạt động tương đương", gioC.tong === 500_000);
ok("⭐ #cacMon không lộ qua Object.keys", Object.keys(gioC).length === 0,
  JSON.stringify(Object.keys(gioC)));

const luuTru = JSON.stringify(gioC);
const khoiPhuc = GioHang.tuJSON(luuTru);
ok("⭐ Lưu và khôi phục từ JSON", khoiPhuc.tong === 500_000, luuTru);

console.log(`\n───────────────\nKẾT QUẢ: ${dat}/${tong_}\n`);

console.log(`═══════════════════════════════════════════════════════════════
💭 TRẢ LỜI CÂU HỎI THẢO LUẬN

a) Factory module (closure) vs class (#private):

   • BỘ NHỚ với 10.000 instance: CLASS thắng rõ rệt.
     Closure tạo một BẢN SAO MỚI của mọi hàm cho mỗi instance —
     10.000 giỏ hàng = 10.000 bản của hàm them, xoa, tong...
     Class đặt phương thức trên prototype — chỉ MỘT bản dùng chung.

     (Với vài chục instance thì khác biệt không đáng kể. Đừng tối ưu sớm.)

   • DỄ ĐỌC với người từ Java/C#: CLASS, vì cú pháp quen thuộc và
     "#" là private thật ở mức ngôn ngữ, không phải mẹo dùng closure.

   • JSON.stringify: CLASS thuận hơn nhờ có toJSON() và static tuJSON().
     Với closure, dữ liệu nằm trong closure nên phải tự viết hàm xuất.
     ⚠️ Lưu ý: private field KHÔNG tự động vào JSON — phải viết toJSON().

   • CLOSURE thắng ở đâu?
     - Không có "this", nên không bao giờ dính bug mất this khi truyền
       phương thức làm callback (setTimeout(gio.tong) — class sẽ hỏng).
     - Riêng tư tuyệt đối: không có cách nào chạm tới, kể cả bằng Proxy
       hay Reflect. "#" thì DevTools vẫn xem được.
     - Hợp với phong cách lập trình hàm.

   📌 Kết luận thực dụng: dùng class cho thực thể nghiệp vụ có nhiều
      instance; dùng factory module cho tiện ích, cấu hình, hoặc khi
      muốn tránh hoàn toàn "this".

b) Vì sao trả về macDinh nguy hiểm hơn trả về diaChi?
   → Vì phạm vi ảnh hưởng khác nhau về BẢN CHẤT.

     Sửa mảng diaChi  → hỏng dữ liệu ĐÃ CÓ. Xấu, nhưng thấy ngay.
     Sửa macDinh      → hỏng MỌI địa chỉ được thêm SAU ĐÓ.

     Trường hợp thứ hai tệ hơn nhiều vì:
       • Nguyên nhân (một dòng sửa macDinh) và triệu chứng (địa chỉ sai
         xuất hiện vài phút sau, ở màn hình khác) cách nhau rất xa.
       • Nó ảnh hưởng cả những object CHƯA TỒN TẠI lúc gây lỗi.
       • Không có bản ghi nào cho thấy ai đã sửa.

     📌 Quy tắc: dữ liệu nào được dùng làm KHUÔN MẪU cho các object khác
        thì phải Object.freeze(). Không chỉ trả bản sao — đóng băng luôn.

c) Lưu vào localStorage rồi khôi phục — cách nào dễ hơn?
   → CLASS, nhờ hai điểm móc nối có sẵn:

       toJSON()              → JSON.stringify(gio) tự động dùng
       static tuJSON(chuoi)  → khôi phục thành đối tượng đầy đủ phương thức

     Với closure, bạn phải tự viết:
       xuat: () => [...cacMon]
       taoGioHang.tuDuLieu = (dl) => { const g = taoGioHang(); ... }
     Vẫn làm được, chỉ là phải tự dựng quy ước thay vì dùng cái ngôn ngữ
     đã có sẵn.

     ⚠️ Cạm bẫy chung cho cả hai: JSON.parse trả về OBJECT THƯỜNG, không
        phải instance. Luôn phải có bước "dựng lại" — đừng bao giờ tin rằng
        dữ liệu đọc từ localStorage đã đúng hình dạng bạn mong đợi. Hãy
        kiểm tra tính hợp lệ khi khôi phục, vì người dùng SỬA ĐƯỢC
        localStorage.
═══════════════════════════════════════════════════════════════`);
