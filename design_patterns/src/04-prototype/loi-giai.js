/**
 * LỜI GIẢI BÀI TẬP 04 — PROTOTYPE
 * Chạy: node src/04-prototype/loi-giai.js
 */

const ANH_NEN_LON = Object.freeze({
  ten: "background.png",
  kichThuocKB: 5120,
  duLieu: "…(5MB dữ liệu ảnh)…",
});

class HinhChuNhat {
  constructor({ x = 0, y = 0, rong = 100, cao = 50, mauNen = "#fff", vien, nhan, anhNen } = {}) {
    this.viTri = { x, y };
    this.kichThuoc = { rong, cao };
    this.kieu = {
      mauNen,
      vien: { mau: "#000", doDay: 1, kieu: "solid", ...vien },
    };
    this.nhan = { noiDung: "", cangGiua: true, ...nhan };
    this.the = [];
    this.anhNen = anhNen ?? ANH_NEN_LON;
  }

  /**
   * TODO 1 — clone() đúng cách.
   *
   * Ba quyết định quan trọng:
   *   1. Object.create(getPrototypeOf(this)) → GIỮ NGUYÊN class,
   *      bản sao vẫn gọi được .di(), .moTa(). structuredClone() làm mất điều này.
   *   2. Sao chép sâu THỦ CÔNG từng trường lồng nhau.
   *   3. anhNen thì CHIA SẺ — có chủ đích, xem phần thảo luận cuối file.
   */
  clone() {
    const ban = Object.create(Object.getPrototypeOf(this));
    ban.viTri = { ...this.viTri };
    ban.kichThuoc = { ...this.kichThuoc };
    ban.kieu = {
      ...this.kieu,
      vien: { ...this.kieu.vien }, // ← tầng thứ 2, phải sao riêng
    };
    ban.nhan = { ...this.nhan };
    ban.the = [...this.the];
    ban.anhNen = this.anhNen; // ← cố ý chia sẻ, không sao chép
    return ban;
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

/**
 * TODO 2 — Nhóm hình, clone() ĐỆ QUY.
 * Điểm mấu chốt: gọi clone() của từng hình con, không chỉ sao chép mảng.
 * [...this.cacHinh] chỉ sao chép mảng — các phần tử vẫn là CÙNG object!
 */
class Nhom {
  constructor(ten, cacHinh = []) {
    this.ten = ten;
    this.cacHinh = cacHinh;
  }

  clone() {
    const ban = Object.create(Object.getPrototypeOf(this));
    ban.ten = this.ten + " (bản sao)";
    ban.cacHinh = this.cacHinh.map((h) => h.clone()); // ← ĐỆ QUY
    return ban;
  }

  di(dx, dy) {
    for (const h of this.cacHinh) h.di(dx, dy);
    return this;
  }

  moTa() {
    return [`📦 Nhóm "${this.ten}" (${this.cacHinh.length} hình)`,
      ...this.cacHinh.map((h) => "   " + h.moTa())].join("\n");
  }
}

/**
 * TODO 3 — Prototype Registry.
 */
class KhoMau {
  #mau = new Map();

  dangKy(ma, hinhMau) {
    this.#mau.set(ma, hinhMau);
    return this;
  }

  sinhTu(ma, x, y) {
    const mau = this.#mau.get(ma);
    if (!mau) {
      throw new Error(`Không có mẫu "${ma}". Có sẵn: ${[...this.#mau.keys()].join(", ")}`);
    }
    const ban = mau.clone();
    ban.viTri = { x, y };
    return ban;
  }

  get danhSach() {
    return [...this.#mau.keys()];
  }
}

// ===========================================================================
// BỘ KIỂM THỬ
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
  x: 10, y: 20, rong: 200, cao: 80,
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

console.log("\n  gốc   :", goc.moTa());
console.log("  bản sao:", ban.moTa());

console.log("\n=== TODO 2: Nhom.clone() đệ quy ===\n");
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

console.log("\n" + nhom.moTa());
console.log(nhomSao.moTa());

console.log("\n⚠️  Bẫy hay mắc ở TODO 2: viết ban.cacHinh = [...this.cacHinh]");
console.log("    Mảng thì mới, nhưng các PHẦN TỬ vẫn là cùng object → di chuyển");
console.log("    bản sao sẽ kéo theo bản gốc. Phải .map(h => h.clone()).");

console.log("\n=== TODO 3: KhoMau ===\n");
const kho = new KhoMau()
  .dangKy("nut-chinh", new HinhChuNhat({ rong: 160, cao: 44, mauNen: "#2563eb", nhan: { noiDung: "Nút" } }))
  .dangKy("o-nhap", new HinhChuNhat({ rong: 240, cao: 40, vien: { doDay: 1, mau: "#ccc" } }));

const a = kho.sinhTu("nut-chinh", 10, 10);
const b = kho.sinhTu("nut-chinh", 10, 80);
a.nhan.noiDung = "Lưu";

ok("sinhTu đặt đúng vị trí", b.viTri.y === 80);
ok("Hai bản sinh ra là object khác nhau", a !== b);
ok("Sửa bản này không đụng bản kia", b.nhan.noiDung === "Nút");

tong++;
try {
  kho.sinhTu("khong-ton-tai", 0, 0);
  console.log("❌ Đáng lẽ phải ném lỗi");
} catch (e) {
  dat++;
  console.log("✅ " + e.message);
}

console.log("\n  Mẫu có sẵn:", kho.danhSach.join(", "));
console.log("  " + a.moTa());
console.log("  " + b.moTa());

console.log(`\n───────────────\nKẾT QUẢ: ${dat}/${tong}\n`);

// ===========================================================================
console.log(`═══════════════════════════════════════════════════════════════
💭 TRẢ LỜI TODO 4 — vì sao anhNen KHÔNG được sao chép

a) Nếu sao chép sâu cả anhNen:
   200 hình × 5MB = 1GB RAM cho MỘT tấm ảnh giống hệt nhau.
   Đây không phải tối ưu sớm — đây là khác biệt giữa app chạy được và app
   bị hệ điều hành giết.

   (Pattern chuyên trị việc chia sẻ dữ liệu nặng giữa nhiều object có tên
    riêng: FLYWEIGHT. Ở đây ta đang dùng ý tưởng đó ở quy mô nhỏ.)

b) Chia sẻ an toàn khi nào?
   → Khi dữ liệu được chia sẻ là BẤT BIẾN (không ai sửa nó).
     Trong lời giải này ta dùng Object.freeze(ANH_NEN_LON) để BIẾN ĐIỀU KIỆN
     ĐÓ THÀNH LUẬT, chứ không chỉ là lời hứa suông trong tài liệu.

   → Điều kiện bị phá vỡ ngay khi có người viết:
         hinh.anhNen.duLieu = "ảnh mới"
     Lúc đó 200 hình đổi ảnh cùng lúc, và người sửa sẽ mất cả buổi để hiểu
     vì sao. Đây là loại bug tệ nhất: nguyên nhân và triệu chứng ở hai file
     cách xa nhau.

   → Quy tắc: dữ liệu chia sẻ thì phải bất biến. Nếu cần sửa, hãy thay bằng
     một object MỚI (hinh.anhNen = anhKhac) chứ đừng sửa vào ruột nó.

c) Dùng structuredClone(hinh) thì mất gì?
   1. MẤT CLASS: bản sao không còn instanceof HinhChuNhat, gọi .di() báo lỗi
      "not a function". Đây là lý do lớn nhất khiến ta viết clone() tay.
   2. MẤT QUYỀN QUYẾT ĐỊNH: nó sao chép sâu MỌI THỨ, kể cả 5MB anhNen.
   3. Ném lỗi nếu object có phương thức riêng hoặc trường là hàm callback.

   Ngược lại, structuredClone rất tốt cho DỮ LIỆU THUẦN (object literal từ
   API, state của Redux). Chọn công cụ theo việc, đừng chọn theo thói quen.

📌 BÀI HỌC LỚN NHẤT CỦA BUỔI NÀY
   "Deep copy" không phải là mục tiêu. Mục tiêu là: mỗi trường được sao chép
   hay chia sẻ phải là một QUYẾT ĐỊNH CÓ Ý THỨC, không phải hệ quả tình cờ
   của cú pháp bạn vô tình gõ ra.
═══════════════════════════════════════════════════════════════`);
