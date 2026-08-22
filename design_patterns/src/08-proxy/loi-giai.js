/**
 * LỜI GIẢI BÀI TẬP 08 — PROXY
 * Chạy: node src/08-proxy/loi-giai.js
 */

const nghi = (ms) => new Promise((r) => setTimeout(r, ms));
const dem = { soLanTaiThat: 0 };

class AnhThat {
  constructor(duongDan) {
    this.duongDan = duongDan;
  }
  static async tai(duongDan) {
    dem.soLanTaiThat++;
    await nghi(200);
    const anh = new AnhThat(duongDan);
    anh.kichThuoc = { rong: 1920, cao: 1080 };
    return anh;
  }
  ve() {
    return `🖼️  ${this.duongDan} (${this.kichThuoc.rong}x${this.kichThuoc.cao})`;
  }
}

// ###########################################################################
// TODO 1 — Virtual Proxy an toàn với lời gọi đồng thời
// ###########################################################################
class AnhProxy {
  #promiseTai = null; // ⭐ lưu PROMISE, không lưu kết quả

  constructor(duongDan) {
    this.duongDan = duongDan; // constructor phải RẺ
  }

  async ve() {
    // Gán promise NGAY, trước bất kỳ await nào. Lời gọi thứ 2 và 3 tới đây
    // sẽ thấy #promiseTai đã có và cùng chờ trên MỘT promise duy nhất.
    //
    // Nếu viết:  if (!this.#that) this.#that = await AnhThat.tai(...)
    // thì giữa lúc await và lúc gán, hai lời gọi khác đã kịp chen vào và
    // cùng thấy #that === null → tải 3 lần.
    if (!this.#promiseTai) {
      this.#promiseTai = AnhThat.tai(this.duongDan);
    }
    const anh = await this.#promiseTai;
    return anh.ve();
  }

  /** Nếu tải lỗi, nên xóa promise để lần sau thử lại được. */
  async veCoThuLai() {
    if (!this.#promiseTai) {
      this.#promiseTai = AnhThat.tai(this.duongDan).catch((e) => {
        this.#promiseTai = null; // xóa promise lỗi, cho phép thử lại
        throw e;
      });
    }
    return (await this.#promiseTai).ve();
  }
}

// ###########################################################################
// TODO 2 — Protection Proxy
// ###########################################################################
class LoiKhongCoQuyen extends Error {
  constructor(thongDiep) {
    super(thongDiep);
    this.name = "LoiKhongCoQuyen";
  }
}

class DichVuTaiKhoan {
  #ds = new Map([
    [1, { id: 1, ten: "An", luong: 20_000_000 }],
    [2, { id: 2, ten: "Bình", luong: 25_000_000 }],
  ]);
  xem(id) {
    return this.#ds.get(id) ?? null;
  }
  capNhatLuong(id, luong) {
    const tk = this.#ds.get(id);
    if (tk) tk.luong = luong;
    return tk;
  }
  xoa(id) {
    return this.#ds.delete(id);
  }
}

const QUYEN = {
  nhanvien: ["xem"],
  truongphong: ["xem", "capNhatLuong"],
  admin: ["xem", "capNhatLuong", "xoa"],
};

class TaiKhoanProxy {
  constructor(that, vaiTro) {
    this.that = that;
    this.vaiTro = vaiTro;
  }

  #kiemTra(hanhDong) {
    const duoc = QUYEN[this.vaiTro] ?? [];
    if (!duoc.includes(hanhDong)) {
      throw new LoiKhongCoQuyen(
        `Vai trò "${this.vaiTro}" không được phép "${hanhDong}". ` +
          `Quyền hiện có: ${duoc.length ? duoc.join(", ") : "(không có)"}`
      );
    }
  }

  xem(id) {
    this.#kiemTra("xem");
    return this.that.xem(id);
  }
  capNhatLuong(id, luong) {
    this.#kiemTra("capNhatLuong");
    return this.that.capNhatLuong(id, luong);
  }
  xoa(id) {
    this.#kiemTra("xoa");
    return this.that.xoa(id);
  }
}

/**
 * Đáp án câu (a): với new Proxy, phân quyền cho 30 phương thức chỉ tốn 10 dòng
 * và tự động áp dụng cho cả phương thức được thêm vào sau này.
 */
function taoProxyPhanQuyen(that, vaiTro) {
  const duoc = QUYEN[vaiTro] ?? [];
  return new Proxy(that, {
    get(dich, khoa) {
      const giaTri = Reflect.get(dich, khoa);
      if (typeof giaTri !== "function") return giaTri;
      return (...args) => {
        if (!duoc.includes(khoa)) {
          throw new LoiKhongCoQuyen(`Vai trò "${vaiTro}" không được phép "${String(khoa)}"`);
        }
        return giaTri.apply(dich, args);
      };
    },
  });
}

// ###########################################################################
// TODO 3 — Proxy theo dõi đọc/ghi
// ###########################################################################
function taoDoiTuongTheoDoi(obj) {
  const nhatKy = [];
  return new Proxy(obj, {
    get(dich, khoa) {
      if (khoa === "__nhatKy") return nhatKy; // cửa hậu để test đọc được
      const giaTri = Reflect.get(dich, khoa);
      nhatKy.push({ loai: "doc", khoa: String(khoa), giaTri });
      return giaTri;
    },
    set(dich, khoa, giaTri) {
      nhatKy.push({ loai: "ghi", khoa: String(khoa), giaTri });
      return Reflect.set(dich, khoa, giaTri); // ⚠️ phải return true, nếu không TypeError
    },
  });
}

// ###########################################################################
// TODO 4 — Bắt lỗi gõ nhầm tên thuộc tính
// ###########################################################################
const KHOA_HE_THONG = new Set(["then", "toJSON", "constructor", "__nhatKy"]);

function chongLoiChinhTa(obj) {
  return new Proxy(obj, {
    get(dich, khoa) {
      // Bỏ qua Symbol (console.log, await, spread... đều dùng Symbol nội bộ)
      if (typeof khoa === "symbol" || KHOA_HE_THONG.has(khoa)) {
        return Reflect.get(dich, khoa);
      }
      if (!(khoa in dich)) {
        throw new TypeError(
          `Thuộc tính "${khoa}" không tồn tại. Các khóa có sẵn: ${Object.keys(dich).join(", ")}`
        );
      }
      return Reflect.get(dich, khoa);
    },
    // Ghi khóa mới thì vẫn cho phép
    set: Reflect.set,
  });
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

console.log("=== PHẦN 1: VIRTUAL PROXY ===\n");
dem.soLanTaiThat = 0;
const thuVien = ["a.jpg", "b.jpg", "c.jpg", "d.jpg", "e.jpg"].map((f) => new AnhProxy(f));
ok("Dựng 5 proxy không tải ảnh nào", dem.soLanTaiThat === 0);

const kq = await thuVien[2].ve();
ok("ve() trả về chuỗi mô tả ảnh", kq.includes("c.jpg"), kq);
ok("Chỉ tải đúng ảnh được dùng", dem.soLanTaiThat === 1);

await thuVien[2].ve();
ok("Gọi lần 2 KHÔNG tải lại", dem.soLanTaiThat === 1);

dem.soLanTaiThat = 0;
const anhMoi = new AnhProxy("z.jpg");
await Promise.all([anhMoi.ve(), anhMoi.ve(), anhMoi.ve()]);
ok("⭐ 3 lời gọi ĐỒNG THỜI chỉ tải 1 lần", dem.soLanTaiThat === 1, `đã tải: ${dem.soLanTaiThat}`);

console.log("\n=== PHẦN 2: PROTECTION PROXY ===\n");
const that = new DichVuTaiKhoan();
const thu = (vaiTro, hanhDong, taoProxy = (t, v) => new TaiKhoanProxy(t, v)) => {
  const p = taoProxy(that, vaiTro);
  try {
    if (hanhDong === "xem") p.xem(1);
    else if (hanhDong === "capNhatLuong") p.capNhatLuong(1, 30_000_000);
    else p.xoa(2);
    return "cho-phep";
  } catch (e) {
    return e instanceof LoiKhongCoQuyen ? "tu-choi" : "loi-sai:" + e.name;
  }
};

ok("nhanvien XEM được", thu("nhanvien", "xem") === "cho-phep");
ok("nhanvien KHÔNG sửa lương được", thu("nhanvien", "capNhatLuong") === "tu-choi");
ok("truongphong sửa lương được", thu("truongphong", "capNhatLuong") === "cho-phep");
ok("truongphong KHÔNG xóa được", thu("truongphong", "xoa") === "tu-choi");
ok("admin xóa được", thu("admin", "xoa") === "cho-phep");
ok("vai trò lạ bị từ chối hết", thu("hacker", "xem") === "tu-choi");

console.log("\n  Bản dùng new Proxy (đáp án câu a) — cùng kết quả, 10 dòng:");
ok("  nhanvien KHÔNG sửa lương được",
  thu("nhanvien", "capNhatLuong", taoProxyPhanQuyen) === "tu-choi");
ok("  admin xóa được", thu("admin", "xoa", taoProxyPhanQuyen) === "cho-phep");

console.log("\n=== PHẦN 3: new Proxy ===\n");
const nd = taoDoiTuongTheoDoi({ ten: "An", tuoi: 25 });
nd.ten;
nd.tuoi = 26;
nd.ten;
const nk = nd.__nhatKy;
ok("Ghi nhận đủ 3 thao tác", nk.length === 3, `ghi nhận: ${nk.length}`);
ok("Phân biệt được đọc và ghi",
  nk.filter((x) => x.loai === "doc").length === 2 && nk.filter((x) => x.loai === "ghi").length === 1);
console.log("   Nhật ký:", nk.map((x) => `${x.loai}:${x.khoa}`).join(", "));

const cauHinh = chongLoiChinhTa({ apiUrl: "https://api.example.com", timeout: 5000 });
ok("Đọc thuộc tính có thật vẫn bình thường", cauHinh.apiUrl === "https://api.example.com");
tong++;
try {
  cauHinh.apiURL;
  console.log("❌ Đáng lẽ phải ném lỗi");
} catch (e) {
  dat++;
  console.log("✅ Bắt được lỗi gõ nhầm: " + e.message);
}
ok("Ghi khóa MỚI vẫn được phép", (() => {
  cauHinh.retry = 3;
  return cauHinh.retry === 3;
})());

console.log(`\n───────────────\nKẾT QUẢ: ${dat}/${tong}\n`);

console.log(`═══════════════════════════════════════════════════════════════
💭 TRẢ LỜI CÂU HỎI THẢO LUẬN

a) 30 phương thức thì sao?
   → Viết tay 30 wrapper là không thể bảo trì: chỉ cần ai đó thêm phương
     thức thứ 31 mà quên thêm vào proxy, phương thức đó CHẠY KHÔNG KIỂM TRA
     QUYỀN. Đây là lỗ hổng bảo mật do "quên", loại phổ biến nhất.

     new Proxy đảo ngược mặc định: mọi phương thức đều bị chặn trừ khi có
     trong danh sách cho phép. Phương thức mới thêm vào sẽ tự động bị chặn
     cho tới khi ai đó CỐ Ý mở. "Mặc định an toàn" thay vì "mặc định hở".

     Xem hàm taoProxyPhanQuyen() ở trên — 10 dòng, phủ mọi phương thức.

b) Vì sao phải bỏ qua khóa "then"?
   → Khi bạn await một giá trị, JS kiểm tra xem nó có .then không (để xác
     định đó có phải thenable/Promise không). Với proxy chặn mọi khóa lạ:

         const x = chongLoiChinhTa({a: 1});
         await x;      // JS đọc x.then → proxy ném TypeError!

     Lỗi sẽ hiện ra là "Thuộc tính then không tồn tại" — hoàn toàn vô nghĩa
     với người đọc, ở một dòng chẳng liên quan gì.

     Cùng loại vấn đề với Symbol: console.log() dùng Symbol.toStringTag,
     spread dùng Symbol.iterator, JSON.stringify dùng toJSON.

     👉 Bài học tổng quát: khi chặn ở mức ngôn ngữ, bạn chặn cả những thứ
        BẢN THÂN NGÔN NGỮ đang làm sau lưng bạn. Luôn cho Symbol đi qua.

c) Proxy phân quyền nên đặt ở tầng nào?
   → Đáp án ngắn: TRONG SERVICE (tầng nghiệp vụ), không phải controller.

     • Ở CONTROLLER (trước khi vào service): dễ viết, nhưng nếu có đường vào
       khác — job nền, CLI, message queue, GraphQL resolver — thì đường đó
       BỎ QUA hoàn toàn phân quyền. Đây là cách rất nhiều hệ thống bị lọt.

     • Ở REPOSITORY (sát database): an toàn nhất nhưng repository không biết
       ngữ cảnh nghiệp vụ ("được sửa lương nhân viên do MÌNH quản lý" cần
       thông tin mà tầng dữ liệu không có).

     • Ở SERVICE: mọi đường vào đều phải đi qua đây, và ở đây đủ ngữ cảnh
       nghiệp vụ để ra quyết định. Đây là điểm cân bằng đúng.

     Bổ sung thực tế: kiểm tra ở service là BẮT BUỘC; kiểm tra thêm ở
     controller là tùy chọn, chỉ để trả lỗi 403 sớm cho đẹp trải nghiệm.
     Không bao giờ để kiểm tra ở controller là lớp bảo vệ DUY NHẤT.
═══════════════════════════════════════════════════════════════`);
