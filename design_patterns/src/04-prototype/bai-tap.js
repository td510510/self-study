/**
 * BÀI TẬP 04 — PROTOTYPE
 * Chạy: node src/04-prototype/bai-tap.js
 *
 * Bối cảnh: trình soạn thảo sơ đồ (một Figma thu nhỏ).
 * Người dùng bấm Ctrl+C rồi Ctrl+V — bạn cần clone() cho đúng.
 */

// Giả lập một ảnh nền 5MB. 200 hình dùng chung ảnh này.
const ANH_NEN_LON = {
  ten: "background.png",
  kichThuocKB: 5120,
  duLieu: "…(5MB dữ liệu ảnh)…",
};

class HinhChuNhat {
  constructor({ x = 0, y = 0, rong = 100, cao = 50, mauNen = "#fff", vien, nhan, anhNen } = {}) {
    this.viTri = { x, y };
    this.kichThuoc = { rong, cao };
    this.kieu = {
      mauNen,
      vien: { mau: "#000", doDay: 1, kieu: "solid", ...vien },
    };
    this.nhan = { noiDung: "", cangGiua: true, ...nhan };
    this.the = []; // mảng nhãn phân loại
    this.anhNen = anhNen ?? ANH_NEN_LON;
  }

  // =========================================================================
  // 📝 TODO 1 — Viết clone() cho đúng
  //
  //   Yêu cầu:
  //   a) Sửa bản sao KHÔNG được ảnh hưởng bản gốc (kể cả trường lồng 2 tầng
  //      như kieu.vien.doDay)
  //   b) Bản sao vẫn phải là instance của HinhChuNhat (gọi được phương thức)
  //   c) anhNen thì CHIA SẺ, không sao chép (xem TODO 4 để hiểu vì sao)
  //
  //   Gợi ý: Object.create(Object.getPrototypeOf(this)) giữ được class.
  // =========================================================================
  clone() {
    // TODO: đây là bản shallow copy sai — hãy sửa
    return { ...this };
  }

  di(dx, dy) {
    this.viTri.x += dx;
    this.viTri.y += dy;
    return this;
  }

  moTa() {
    return `▭ "${this.nhan.noiDung || "(chưa đặt tên)"}" tại (${this.viTri.x},${this.viTri.y}) ` +
      `${this.kichThuoc.rong}x${this.kichThuoc.cao} viền ${this.kieu.vien.doDay}px`;
  }
}

// =========================================================================
// 📝 TODO 2 — Viết class Nhom (nhóm nhiều hình lại)
//
//   - constructor(ten, cacHinh)
//   - clone() phải sao chép ĐỆ QUY: mỗi hình con cũng được clone
//   - di(dx, dy) di chuyển tất cả hình con
// =========================================================================

// class Nhom { ... }

// =========================================================================
// 📝 TODO 3 — Viết KhoMau (Prototype Registry)
//
//   kho.dangKy("nut-chinh", <một HinhChuNhat mẫu>)
//   kho.sinhTu("nut-chinh", 100, 200)  → bản sao đã đặt đúng vị trí
//   Mã không tồn tại → ném lỗi liệt kê các mẫu có sẵn
// =========================================================================

// class KhoMau { ... }

// ===========================================================================
// BỘ KIỂM THỬ — chạy để tự chấm
// ===========================================================================
let dat = 0;
let tong = 0;
const ok = (ten, dieuKien) => {
  tong++;
  if (dieuKien) dat++;
  console.log(`${dieuKien ? "✅" : "❌"} ${ten}`);
};

console.log("=== TODO 1: clone() của HinhChuNhat ===\n");

const goc = new HinhChuNhat({
  x: 10,
  y: 20,
  rong: 200,
  cao: 80,
  nhan: { noiDung: "Đăng nhập" },
  vien: { doDay: 2 },
});
goc.the.push("nút", "quan-trọng");

const ban = goc.clone();
ban.viTri.x = 999;
ban.kieu.vien.doDay = 10;
ban.nhan.noiDung = "Đăng ký";
ban.the.push("bản-sao");

ok("Sửa viTri của bản sao không đụng gốc", goc.viTri.x === 10);
ok("Sửa kieu.vien (lồng 2 tầng) không đụng gốc", goc.kieu.vien.doDay === 2);
ok("Sửa nhan không đụng gốc", goc.nhan.noiDung === "Đăng nhập");
ok("Push vào mảng the không đụng gốc", goc.the.length === 2);
ok("Bản sao vẫn là instance của HinhChuNhat", ban instanceof HinhChuNhat);
ok("Bản sao gọi được phương thức", typeof ban.di === "function");
ok("anhNen được CHIA SẺ (không sao chép)", ban.anhNen === goc.anhNen);

console.log("\n=== TODO 2: Nhom.clone() đệ quy ===\n");
try {
  const nhom = new Nhom("Form đăng nhập", [
    new HinhChuNhat({ x: 0, y: 0, nhan: { noiDung: "Tên đăng nhập" } }),
    new HinhChuNhat({ x: 0, y: 60, nhan: { noiDung: "Mật khẩu" } }),
  ]);
  const nhomSao = nhom.clone();
  nhomSao.di(300, 0);
  nhomSao.cacHinh[0].nhan.noiDung = "Email";

  ok("Nhóm gốc không bị di chuyển", nhom.cacHinh[0].viTri.x === 0);
  ok("Nhóm sao đã di chuyển", nhomSao.cacHinh[0].viTri.x === 300);
  ok("Sửa hình con của bản sao không đụng gốc", nhom.cacHinh[0].nhan.noiDung === "Tên đăng nhập");
  ok("Hình con của bản sao là object KHÁC", nhomSao.cacHinh[0] !== nhom.cacHinh[0]);
} catch (e) {
  tong += 4;
  console.log("❌ Chưa làm TODO 2 — " + e.message);
}

console.log("\n=== TODO 3: KhoMau ===\n");
try {
  const kho = new KhoMau();
  kho.dangKy(
    "nut-chinh",
    new HinhChuNhat({ rong: 160, cao: 44, mauNen: "#2563eb", nhan: { noiDung: "Nút" } })
  );
  const a = kho.sinhTu("nut-chinh", 10, 10);
  const b = kho.sinhTu("nut-chinh", 10, 80);
  a.nhan.noiDung = "Lưu";

  ok("sinhTu đặt đúng vị trí", b.viTri.y === 80);
  ok("Hai bản sinh ra là object khác nhau", a !== b);
  ok("Sửa bản này không đụng bản kia", b.nhan.noiDung === "Nút");

  tong++;
  try {
    kho.sinhTu("khong-ton-tai", 0, 0);
    console.log("❌ Mã không tồn tại — đáng lẽ phải ném lỗi");
  } catch (e) {
    dat++;
    console.log("✅ Mã không tồn tại → " + e.message);
  }
} catch (e) {
  tong += 4;
  console.log("❌ Chưa làm TODO 3 — " + e.message);
}

console.log(`\n───────────────\nKẾT QUẢ: ${dat}/${tong}\n`);

// ===========================================================================
// 📝 TODO 4 — CÂU HỎI CÓ CHỦ ĐÍCH (quan trọng nhất bài)
//
//   Bài test yêu cầu anhNen được CHIA SẺ chứ không sao chép.
//   Nhìn qua thì điều này mâu thuẫn với "deep copy" — nhưng nó là chủ đích.
//
//   a) Nếu clone() sao chép sâu cả anhNen, thì 200 hình chiếm bao nhiêu bộ nhớ?
//      TRẢ LỜI: ...........................................................
//
//   b) Việc chia sẻ anhNen an toàn trong điều kiện NÀO? Điều kiện đó bị phá vỡ
//      khi nào? (gợi ý: chuyện gì xảy ra nếu ai đó sửa anhNen.duLieu?)
//      TRẢ LỜI: ...........................................................
//
//   c) Nếu bạn dùng structuredClone(hinh) thay vì tự viết clone(), bạn mất gì?
//      TRẢ LỜI: ...........................................................
// ===========================================================================
