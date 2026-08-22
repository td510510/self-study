/**
 * BÀI 04 — PROTOTYPE
 * Chạy: node src/04-prototype/demo.js
 */

const line = (t) => console.log("\n" + "=".repeat(62) + "\n" + t + "\n" + "=".repeat(62));

// ###########################################################################
// PHẦN 1 — BẪY SỐ MỘT: SHALLOW COPY
// ###########################################################################

line("1. ⚠️  BẪY SHALLOW COPY — phần quan trọng nhất bài này");

const goc = {
  ten: "Goblin",
  chiSo: { mau: 100, giap: 5 },
  kyNang: ["chém", "né"],
};

const banSaoNong = { ...goc };
banSaoNong.ten = "Orc";
banSaoNong.chiSo.mau = 999;
banSaoNong.kyNang.push("bắn cung");

console.log("Sau khi sửa BẢN SAO:");
console.log("  goc.ten        =", goc.ten, "  ← ✅ nguyên vẹn (chuỗi được sao thật)");
console.log("  goc.chiSo.mau  =", goc.chiSo.mau, " ← ❌ BỊ SỬA THEO!");
console.log("  goc.kyNang     =", goc.kyNang, "← ❌ BỊ SỬA THEO!");

console.log(`
   goc ──────┐                       banSaoNong ──────┐
             ▼                                        ▼
   ┌──────────────┐                       ┌──────────────┐
   │ ten:"Goblin" │                       │ ten:"Orc"    │
   │ chiSo: ●─────┼───────┐       ┌───────┼─● :chiSo     │
   └──────────────┘       │       │       └──────────────┘
                          ▼       ▼
                     ┌─────────────┐
                     │ mau: 999    │  ← MỘT object duy nhất
                     └─────────────┘

   Spread {...} chỉ sao chép MỘT TẦNG. Object lồng bên trong
   chỉ được sao chép ĐỊA CHỈ, không sao chép nội dung.`);

// ###########################################################################
// PHẦN 2 — SO SÁNH CÁC CÁCH DEEP COPY
// ###########################################################################

line("2. SO SÁNH CÁC CÁCH SAO CHÉP SÂU");

const phucTap = {
  ngayTao: new Date("2026-01-15"),
  the: new Set(["quái", "cấp1"]),
  chiSo: new Map([["mau", 100]]),
  ghiChu: undefined,
  tinhSucManh() {
    return 42;
  },
};

console.log("Object gốc có: Date, Set, Map, undefined, và một phương thức\n");

const quaJson = JSON.parse(JSON.stringify(phucTap));
console.log("── JSON.parse(JSON.stringify()) ──");
console.log("  ngayTao là Date?      ", quaJson.ngayTao instanceof Date, " ← ❌ thành chuỗi");
console.log("  the là Set?           ", quaJson.the instanceof Set, " ← ❌ thành {}");
console.log("  chiSo là Map?         ", quaJson.chiSo instanceof Map, " ← ❌ thành {}");
console.log("  còn ghiChu?           ", "ghiChu" in quaJson, " ← ❌ biến mất");
console.log("  còn tinhSucManh?      ", typeof quaJson.tinhSucManh === "function", " ← ❌ biến mất");

const { tinhSucManh, ...khongHam } = phucTap;
const quaStructured = structuredClone(khongHam);
console.log("\n── structuredClone() ──");
console.log("  ngayTao là Date?      ", quaStructured.ngayTao instanceof Date, "  ← ✅");
console.log("  the là Set?           ", quaStructured.the instanceof Set, "  ← ✅");
console.log("  chiSo là Map?         ", quaStructured.chiSo instanceof Map, "  ← ✅");
console.log("  còn ghiChu?           ", "ghiChu" in quaStructured, "  ← ✅");
console.log("  (nhưng phải bỏ hàm ra trước, nếu không sẽ ném lỗi)");

// Bẫy quan trọng: structuredClone làm mất prototype của class
class Quai {
  constructor(ten) {
    this.ten = ten;
  }
  keu() {
    return `${this.ten} gầm!`;
  }
}
const q = new Quai("Goblin");
const qClone = structuredClone(q);
console.log("\n── ⚠️  BẪY: structuredClone với instance của class ──");
console.log("  qClone.ten           =", qClone.ten, "  ← dữ liệu còn");
console.log("  qClone instanceof Quai =", qClone instanceof Quai, "  ← ❌ MẤT class!");
try {
  qClone.keu();
} catch (e) {
  console.log("  qClone.keu()         → ❌ " + e.message);
}
console.log("\n👉 Đây chính là lý do ta vẫn viết clone() thủ công cho class.");

// ###########################################################################
// PHẦN 3 — PROTOTYPE PATTERN ĐÚNG NGHĨA
// ###########################################################################

let soLanKhoiTaoNang = 0;

class QuaiVat {
  constructor(cauHinh) {
    // Giả lập khởi tạo tốn kém: đọc file, tải sprite...
    soLanKhoiTaoNang++;
    this.ten = cauHinh.ten;
    this.chiSo = { ...cauHinh.chiSo };
    this.kyNang = [...cauHinh.kyNang];
    this.viTri = { x: 0, y: 0 };
    this.sprite = { duongDan: cauHinh.sprite, kichThuocKB: 2048 }; // "ảnh nặng"
  }

  /**
   * Điểm mấu chốt: TỰ QUYẾT ĐỊNH cái gì sao chép sâu, cái gì chia sẻ.
   * - chiSo, kyNang, viTri: sao chép sâu (mỗi con quái có riêng)
   * - sprite: CHIA SẺ (200 con goblin dùng chung một ảnh — đây là chủ đích, không phải bug)
   */
  clone() {
    const ban = Object.create(Object.getPrototypeOf(this)); // giữ nguyên class!
    ban.ten = this.ten;
    ban.chiSo = { ...this.chiSo };
    ban.kyNang = [...this.kyNang];
    ban.viTri = { ...this.viTri };
    ban.sprite = this.sprite; // ← cố ý chia sẻ
    return ban;
  }

  datViTri(x, y) {
    this.viTri = { x, y };
    return this;
  }

  moTa() {
    return `${this.ten.padEnd(10)} máu=${String(this.chiSo.mau).padStart(3)} ` +
      `tại (${this.viTri.x},${this.viTri.y}) kỹ năng=[${this.kyNang}]`;
  }
}

line("3. PROTOTYPE PATTERN — sinh 200 quái từ 1 mẫu");

const mauGoblin = new QuaiVat({
  ten: "Goblin",
  chiSo: { mau: 60, giap: 2, satThuong: 8 },
  kyNang: ["chém"],
  sprite: "assets/goblin.png",
});

soLanKhoiTaoNang = 0; // reset để đếm cho rõ
const bayQuai = [];
for (let i = 0; i < 200; i++) {
  bayQuai.push(mauGoblin.clone().datViTri(i * 5, (i % 7) * 10));
}

console.log(`Sinh 200 con goblin.`);
console.log(`Số lần chạy constructor tốn kém: ${soLanKhoiTaoNang} (thay vì 200) ✅`);
console.log(`Bản sao còn là instance của QuaiVat? ${bayQuai[0] instanceof QuaiVat} ✅`);
console.log(`Gọi được phương thức? ${typeof bayQuai[0].datViTri === "function"} ✅`);
console.log(`Ảnh sprite dùng chung? ${bayQuai[0].sprite === bayQuai[1].sprite} ✅ (tiết kiệm 400MB)`);

console.log("\n3 con đầu:");
bayQuai.slice(0, 3).forEach((q) => console.log("  " + q.moTa()));

// Chứng minh chỉ số là RIÊNG
bayQuai[0].chiSo.mau = 1;
console.log("\nSau khi con #0 bị đánh còn 1 máu:");
console.log("  #0:", bayQuai[0].moTa());
console.log("  #1:", bayQuai[1].moTa(), " ← ✅ không bị ảnh hưởng");
console.log("  mẫu gốc:", mauGoblin.moTa(), " ← ✅ vẫn nguyên vẹn");

// ###########################################################################
// PHẦN 4 — PROTOTYPE REGISTRY: loại mới đến từ DỮ LIỆU, không từ CODE
// ###########################################################################

class KhoMauQuai {
  #mau = new Map();

  napTuDuLieu(danhSachCauHinh) {
    for (const cauHinh of danhSachCauHinh) {
      this.#mau.set(cauHinh.ma, new QuaiVat(cauHinh));
    }
    return this;
  }

  sinh(ma, x, y) {
    const mau = this.#mau.get(ma);
    if (!mau) throw new Error(`Chưa có mẫu quái: ${ma}. Có sẵn: ${[...this.#mau.keys()]}`);
    return mau.clone().datViTri(x, y);
  }

  get danhSach() {
    return [...this.#mau.keys()];
  }
}

line("4. PROTOTYPE REGISTRY — loại quái mới đến từ file JSON");

// Trong game thật, mảng này đọc từ quai.json — người thiết kế màn chơi tự sửa,
// lập trình viên KHÔNG phải viết class mới.
const duLieuTuFileJson = [
  { ma: "goblin", ten: "Goblin", chiSo: { mau: 60, giap: 2 }, kyNang: ["chém"], sprite: "goblin.png" },
  { ma: "orc", ten: "Orc", chiSo: { mau: 140, giap: 8 }, kyNang: ["đập", "gầm"], sprite: "orc.png" },
  { ma: "rong", ten: "Rồng lửa", chiSo: { mau: 900, giap: 30 }, kyNang: ["phun lửa", "bay"], sprite: "rong.png" },
];

const kho = new KhoMauQuai().napTuDuLieu(duLieuTuFileJson);
console.log("Các mẫu có sẵn:", kho.danhSach.join(", "));
console.log("\nSinh một đội hình:");
console.log("  " + kho.sinh("goblin", 10, 10).moTa());
console.log("  " + kho.sinh("goblin", 20, 10).moTa());
console.log("  " + kho.sinh("orc", 30, 15).moTa());
console.log("  " + kho.sinh("rong", 100, 50).moTa());

try {
  kho.sinh("phuong-hoang", 0, 0);
} catch (e) {
  console.log("\n⚠️  " + e.message);
}

console.log(`
👉 So sánh với Factory (Bài 01):
     Factory  : thêm loại mới ⇒ viết CLASS mới ⇒ cần lập trình viên
     Prototype: thêm loại mới ⇒ thêm DÒNG JSON ⇒ người thiết kế tự làm

   Đó là lý do game engine, Figma, trình soạn thảo sơ đồ đều dùng Prototype.`);

// ###########################################################################
// PHẦN 5 — PROTOTYPE Ở MỨC NGÔN NGỮ JAVASCRIPT
// ###########################################################################

line("5. PROTOTYPE TRONG BẢN THÂN JAVASCRIPT");

const mauCoBan = {
  mau: 100,
  gioiThieu() {
    return `Tôi là ${this.ten}, có ${this.mau} máu`;
  },
};

const slime = Object.create(mauCoBan); // KHÔNG sao chép — tạo LIÊN KẾT
slime.ten = "Slime";

console.log(slime.gioiThieu());
console.log("slime có trường 'mau' của riêng nó?", Object.hasOwn(slime, "mau"), " ← false");
console.log("nhưng slime.mau =", slime.mau, "  ← mượn từ prototype");

mauCoBan.mau = 150; // sửa mẫu → mọi object liên kết đều thấy
console.log("\nSau khi sửa mẫu gốc: slime.mau =", slime.mau, " ← thay đổi theo!");

console.log(`
👉 Phân biệt ba khái niệm hay bị nhầm:

   Prototype PATTERN   : tạo object mới bằng cách SAO CHÉP object cũ
   Object.create(x)    : tạo object mới LIÊN KẾT tới x (không sao chép)
   Object.prototype    : object gốc mà mọi object tìm tới khi không thấy thuộc tính

   'class' của ES6 chỉ là lớp cú pháp phủ lên cơ chế prototype này.`);
