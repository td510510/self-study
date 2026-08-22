/**
 * BÀI 03 — BUILDER
 * Chạy: node src/03-builder/demo.js
 */

const line = (t) => console.log("\n" + "=".repeat(62) + "\n" + t + "\n" + "=".repeat(62));

// ###########################################################################
// PHẦN 1 — CÁI ĐAU: TELESCOPING CONSTRUCTOR
// ###########################################################################

class PizzaTe {
  constructor(co, de, phoMaiVien, topping, sot, cay, anChay, khuyenMai, ghiChu) {
    Object.assign(this, { co, de, phoMaiVien, topping, sot, cay, anChay, khuyenMai, ghiChu });
  }
}

line("1. CÁI ĐAU — constructor 9 tham số");
const pizzaTe = new PizzaTe("lớn", "mỏng", true, ["nấm"], "cà chua", false, true, null, "ít cay");
console.log("Dòng gọi trông thế này:");
console.log('  new PizzaTe("lớn", "mỏng", true, ["nấm"], "cà chua", false, true, null, "ít cay")');
console.log("\n❓ Không mở file class ra, bạn trả lời được:");
console.log("   - true đầu tiên là gì?  - false là gì?  - null là gì?");
console.log("\n⚠️  Tệ hơn: đảo nhầm hai boolean → code VẪN CHẠY, khách nhận sai bánh.");

// ###########################################################################
// PHẦN 2 — SẢN PHẨM (PRODUCT): bất biến sau khi tạo
// ###########################################################################

class Pizza {
  constructor({ co, de, sot, topping, ghiChu, anChay }) {
    this.co = co;
    this.de = de;
    this.sot = sot;
    this.topping = [...topping];
    this.ghiChu = ghiChu;
    this.anChay = anChay;
    Object.freeze(this); // ← bất biến: không ai sửa được pizza sau khi ra lò
  }

  moTa() {
    const dong = [
      `🍕 Pizza ${this.co}, đế ${this.de}, sốt ${this.sot}`,
      `   Topping: ${this.topping.length ? this.topping.join(", ") : "(không)"}`,
    ];
    if (this.anChay) dong.push("   🌱 Món chay");
    if (this.ghiChu) dong.push(`   📝 ${this.ghiChu}`);
    dong.push(`   💰 ${this.tinhGia().toLocaleString("vi-VN")} đ`);
    return dong.join("\n");
  }

  tinhGia() {
    const giaCo = { nhỏ: 89000, vừa: 129000, lớn: 169000 }[this.co];
    return giaCo + this.topping.length * 15000 + (this.de === "viền phô mai" ? 30000 : 0);
  }
}

// ###########################################################################
// PHẦN 3 — BUILDER
// ###########################################################################

class PizzaBuilder {
  constructor() {
    this._co = null;
    this._de = "mỏng";
    this._sot = "cà chua";
    this._topping = [];
    this._ghiChu = "";
    this._anChay = false;
  }

  co(giaTri) {
    if (!["nhỏ", "vừa", "lớn"].includes(giaTri)) {
      throw new Error(`Cỡ không hợp lệ: ${giaTri}`);
    }
    this._co = giaTri;
    return this; // ← chìa khóa của fluent interface
  }

  de(giaTri) {
    this._de = giaTri;
    return this;
  }

  sot(giaTri) {
    this._sot = giaTri;
    return this;
  }

  // Bước TÍCH LŨY — đây là thứ object literal không làm được gọn gàng
  themTopping(...ten) {
    this._topping.push(...ten);
    return this;
  }

  ghiChu(text) {
    this._ghiChu = text;
    return this;
  }

  chay() {
    this._anChay = true;
    return this;
  }

  clone() {
    const b = new PizzaBuilder();
    Object.assign(b, this, { _topping: [...this._topping] });
    return b;
  }

  // ---- build() là NƠI ĐẶT LUẬT — lý do Builder mạnh hơn object literal ----
  build() {
    if (!this._co) throw new Error("Pizza bắt buộc phải có cỡ");
    if (this._topping.length > 5) throw new Error("Tối đa 5 topping");
    if (this._de === "viền phô mai" && this._co === "nhỏ") {
      throw new Error("Cỡ nhỏ không làm được đế viền phô mai");
    }
    const THIT = ["xúc xích", "bò", "gà", "hải sản", "thịt xông khói"];
    const viPham = this._topping.filter((t) => THIT.includes(t));
    if (this._anChay && viPham.length) {
      throw new Error(`Món chay không thể có topping: ${viPham.join(", ")}`);
    }
    return new Pizza({
      co: this._co,
      de: this._de,
      sot: this._sot,
      topping: this._topping,
      ghiChu: this._ghiChu,
      anChay: this._anChay,
    });
  }
}

line("2. BUILDER — mỗi bước đều có TÊN");

const pizza = new PizzaBuilder()
  .co("lớn")
  .de("viền phô mai")
  .themTopping("nấm", "ớt chuông")
  .ghiChu("ít cay, cắt 8 miếng")
  .build();

console.log(pizza.moTa());
console.log("\n👉 Đọc đoạn code dựng ở trên: KHÔNG cần mở file class nào.");

// ###########################################################################
// PHẦN 4 — build() CHẶN NHỮNG THỨ KHÔNG HỢP LỆ
// ###########################################################################

line("3. build() CHẶN SẢN PHẨM SAI");

const truongHopSai = [
  ["Quên chọn cỡ", () => new PizzaBuilder().themTopping("nấm").build()],
  ["Cỡ nhỏ + viền phô mai", () => new PizzaBuilder().co("nhỏ").de("viền phô mai").build()],
  ["Quá 5 topping", () =>
    new PizzaBuilder().co("lớn").themTopping("a", "b", "c", "d", "e", "f").build()],
  ["Món chay nhưng có bò", () =>
    new PizzaBuilder().co("vừa").chay().themTopping("nấm", "bò").build()],
];

for (const [ten, ham] of truongHopSai) {
  try {
    ham();
    console.log(`   ❌ ${ten.padEnd(24)} → lọt qua (sai!)`);
  } catch (e) {
    console.log(`   ✅ ${ten.padEnd(24)} → chặn: ${e.message}`);
  }
}

console.log("\n👉 Đây mới là giá trị thật của Builder: KHÔNG THỂ dựng ra thứ sai.");

// ###########################################################################
// PHẦN 5 — DIRECTOR: đóng gói công thức dùng lại
// ###########################################################################

class Menu {
  static hawaiian() {
    return new PizzaBuilder()
      .co("vừa")
      .de("mỏng")
      .themTopping("dứa", "thịt xông khói")
      .ghiChu("món gây tranh cãi");
  }

  static chayThapCam() {
    return new PizzaBuilder()
      .co("lớn")
      .chay()
      .themTopping("nấm", "ớt chuông", "cà chua", "oliu");
  }
}

line("4. DIRECTOR — công thức có sẵn");
console.log(Menu.hawaiian().build().moTa());
console.log();
console.log(Menu.chayThapCam().build().moTa());

// Director trả về BUILDER (chưa build) → khách vẫn tùy biến được
console.log("\nKhách muốn Hawaiian nhưng cỡ lớn, thêm nấm:");
console.log(Menu.hawaiian().co("lớn").themTopping("nấm").build().moTa());

// ###########################################################################
// PHẦN 6 — CLONE: dựng nhiều biến thể từ một nền
// ###########################################################################

line("5. CLONE — nhiều biến thể từ một nền");

const nen = new PizzaBuilder().co("vừa").de("mỏng").themTopping("phô mai");

const donHang = [
  nen.clone().themTopping("nấm").ghiChu("bàn 1").build(),
  nen.clone().themTopping("xúc xích").co("lớn").ghiChu("bàn 2").build(),
  nen.clone().chay().themTopping("oliu").ghiChu("bàn 3 — ăn chay").build(),
];

for (const p of donHang) console.log(p.moTa() + "\n");

const tong = donHang.reduce((s, p) => s + p.tinhGia(), 0);
console.log(`Tổng đơn: ${tong.toLocaleString("vi-VN")} đ`);
console.log("\n👉 Nếu không clone, sửa nen sẽ ảnh hưởng cả 3 → bug rất khó tìm.");

// ###########################################################################
// PHẦN 7 — SO SÁNH: KHI NÀO OBJECT THAM SỐ LÀ ĐỦ
// ###########################################################################

function taoPizzaDonGian({ co, de = "mỏng", topping = [], ghiChu = "" }) {
  return new Pizza({ co, de, sot: "cà chua", topping, ghiChu, anChay: false });
}

line("6. CÁCH RẤT JAVASCRIPT — object tham số");
console.log(taoPizzaDonGian({ co: "vừa", topping: ["nấm", "oliu"] }).moTa());
console.log(`
👉 Ngắn hơn nhiều, và cũng rõ ràng. Với trường hợp CHỈ GÁN GIÁ TRỊ, đây là
   lựa chọn đúng trong JavaScript.

   Chỉ dùng Builder thật khi bạn cần:
     • bước tích lũy       (themTopping gọi nhiều lần)
     • luật ràng buộc chéo (đế viền phô mai ⇔ không phải cỡ nhỏ)
     • dựng dần qua nhiều hàm rồi mới chốt
     • clone ra nhiều biến thể`);
