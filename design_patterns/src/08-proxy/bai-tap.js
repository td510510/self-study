/**
 * BÀI TẬP 08 — PROXY
 * Chạy: node src/08-proxy/bai-tap.js
 */

const nghi = (ms) => new Promise((r) => setTimeout(r, ms));

// ###########################################################################
// PHẦN 1 — VIRTUAL PROXY
// ###########################################################################

export const dem = { soLanTaiThat: 0 };

class AnhThat {
  constructor(duongDan) {
    this.duongDan = duongDan;
  }
  static async tai(duongDan) {
    dem.soLanTaiThat++;
    await nghi(200); // giả lập tải ảnh từ đĩa/mạng
    const anh = new AnhThat(duongDan);
    anh.kichThuoc = { rong: 1920, cao: 1080 };
    return anh;
  }
  ve() {
    return `🖼️  ${this.duongDan} (${this.kichThuoc.rong}x${this.kichThuoc.cao})`;
  }
}

// ===========================================================================
// 📝 TODO 1 — AnhProxy
//
//   - constructor(duongDan) phải RẺ, không tải gì
//   - async ve() → tải lần đầu, các lần sau dùng lại
//   - ⚠️ QUAN TRỌNG: gọi ve() ĐỒNG THỜI 3 lần chỉ được tải MỘT lần.
//     (gợi ý: lưu chính cái Promise, đừng lưu kết quả sau khi await)
// ===========================================================================

class AnhProxy {
  constructor(duongDan) {
    this.duongDan = duongDan;
    // TODO
  }

  async ve() {
    // TODO
  }
}

// ###########################################################################
// PHẦN 2 — PROTECTION PROXY
// ###########################################################################

class LoiKhongCoQuyen extends Error {
  constructor(thongDiep) {
    super(thongDiep);
    this.name = "LoiKhongCoQuyen";
  }
}

class DichVuTaiKhoan {
  #dsTaiKhoan = new Map([
    [1, { id: 1, ten: "An", luong: 20_000_000 }],
    [2, { id: 2, ten: "Bình", luong: 25_000_000 }],
  ]);
  xem(id) {
    return this.#dsTaiKhoan.get(id) ?? null;
  }
  capNhatLuong(id, luong) {
    const tk = this.#dsTaiKhoan.get(id);
    if (tk) tk.luong = luong;
    return tk;
  }
  xoa(id) {
    return this.#dsTaiKhoan.delete(id);
  }
}

// ===========================================================================
// 📝 TODO 2 — TaiKhoanProxy
//
//   Bảng quyền:
//      nhanvien : xem
//      truongphong : xem, capNhatLuong
//      admin    : xem, capNhatLuong, xoa
//
//   - Không đủ quyền → ném LoiKhongCoQuyen (KHÔNG trả undefined)
//   - Thông báo lỗi phải nêu rõ vai trò và hành động bị chặn
// ===========================================================================

class TaiKhoanProxy {
  constructor(that, vaiTro) {
    this.that = that;
    this.vaiTro = vaiTro;
  }
  xem(id) {
    // TODO
  }
  capNhatLuong(id, luong) {
    // TODO
  }
  xoa(id) {
    // TODO
  }
}

// ###########################################################################
// PHẦN 3 — new Proxy CỦA JAVASCRIPT
// ###########################################################################

// ===========================================================================
// 📝 TODO 3 — taoDoiTuongTheoDoi(obj)
//
//   Trả về proxy ghi lại mọi lần đọc/ghi vào mảng .nhatKy
//   Định dạng bản ghi: { loai: "doc" | "ghi", khoa, giaTri }
//
//   Gợi ý: đặt mảng nhật ký ở NGOÀI proxy, và cho phép truy cập qua một
//   khóa đặc biệt (ví dụ Symbol hoặc chuỗi "__nhatKy").
// ===========================================================================

function taoDoiTuongTheoDoi(obj) {
  // TODO
  return obj;
}

// ===========================================================================
// 📝 TODO 4 — chongLoiChinhTa(obj)
//
//   Đọc thuộc tính KHÔNG tồn tại → ném TypeError với gợi ý các khóa có sẵn.
//   Ghi thuộc tính mới thì vẫn cho phép bình thường.
//
//   ⚠️ Bẫy: phải bỏ qua các khóa hệ thống như "then", Symbol.toPrimitive...
//      nếu không, console.log() hoặc await sẽ ném lỗi rất khó hiểu.
// ===========================================================================

function chongLoiChinhTa(obj) {
  // TODO
  return obj;
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

console.log("=== PHẦN 1: VIRTUAL PROXY ===\n");
dem.soLanTaiThat = 0;
const thuVien = ["a.jpg", "b.jpg", "c.jpg", "d.jpg", "e.jpg"].map((f) => new AnhProxy(f));
ok("Dựng 5 proxy không tải ảnh nào", dem.soLanTaiThat === 0, `đã tải: ${dem.soLanTaiThat}`);

try {
  const kq = await thuVien[2].ve();
  ok("ve() trả về chuỗi mô tả ảnh", typeof kq === "string" && kq.includes("c.jpg"));
  ok("Chỉ tải đúng ảnh được dùng", dem.soLanTaiThat === 1, `đã tải: ${dem.soLanTaiThat}`);

  await thuVien[2].ve();
  ok("Gọi lần 2 KHÔNG tải lại", dem.soLanTaiThat === 1, `đã tải: ${dem.soLanTaiThat}`);

  dem.soLanTaiThat = 0;
  const anhMoi = new AnhProxy("z.jpg");
  await Promise.all([anhMoi.ve(), anhMoi.ve(), anhMoi.ve()]);
  ok("⭐ 3 lời gọi ĐỒNG THỜI chỉ tải 1 lần", dem.soLanTaiThat === 1,
    `đã tải: ${dem.soLanTaiThat}`);
} catch (e) {
  tong += 4;
  console.log("❌ Chưa làm TODO 1 — " + e.message);
}

console.log("\n=== PHẦN 2: PROTECTION PROXY ===\n");
const that = new DichVuTaiKhoan();
const thu = (vaiTro, hanhDong) => {
  const p = new TaiKhoanProxy(that, vaiTro);
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

console.log("\n=== PHẦN 3: new Proxy ===\n");
try {
  const nd = taoDoiTuongTheoDoi({ ten: "An", tuoi: 25 });
  nd.ten;
  nd.tuoi = 26;
  nd.ten;
  const nk = nd.__nhatKy ?? [];
  ok("Ghi nhận đủ 3 thao tác", nk.length === 3, `ghi nhận: ${nk.length}`);
  ok("Phân biệt được đọc và ghi",
    nk.filter((x) => x.loai === "doc").length === 2 && nk.filter((x) => x.loai === "ghi").length === 1);
} catch (e) {
  tong += 2;
  console.log("❌ Chưa làm TODO 3 — " + e.message);
}

const cauHinh = chongLoiChinhTa({ apiUrl: "https://api.example.com", timeout: 5000 });
ok("Đọc thuộc tính có thật vẫn bình thường", cauHinh.apiUrl === "https://api.example.com");
tong++;
try {
  cauHinh.apiURL; // gõ nhầm
  console.log("❌ Đọc thuộc tính không tồn tại — đáng lẽ phải ném lỗi");
} catch (e) {
  dat++;
  console.log("✅ Bắt được lỗi gõ nhầm: " + e.message);
}

console.log(`\n───────────────\nKẾT QUẢ: ${dat}/${tong}\n`);

// ###########################################################################
// 💭 CÂU HỎI THẢO LUẬN
//
//   a) TaiKhoanProxy phải viết lại cả 3 phương thức. Nếu DichVuTaiKhoan có
//      30 phương thức thì sao? Dùng new Proxy giải quyết thế nào?
//      TRẢ LỜI: ...........................................................
//
//   b) Trong TODO 4, vì sao phải bỏ qua khóa "then"?
//      (thử: await một object có proxy chặn mọi khóa lạ)
//      TRẢ LỜI: ...........................................................
//
//   c) Proxy phân quyền đặt ở tầng nào là đúng: trước controller, trong
//      service, hay trong repository? Lập luận.
//      TRẢ LỜI: ...........................................................
// ###########################################################################
