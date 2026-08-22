/**
 * BÀI 07 — FACADE
 * Chạy: node src/07-facade/demo.js
 */

const line = (t) => console.log("\n" + "=".repeat(62) + "\n" + t + "\n" + "=".repeat(62));
const nghi = (ms) => new Promise((r) => setTimeout(r, ms));

// ###########################################################################
// PHẦN 0 — CÁC HỆ THỐNG CON (mỗi cái một API riêng, không ai giống ai)
// ###########################################################################

const nhatKy = [];
const ghi = (s) => {
  nhatKy.push(s);
  console.log("      " + s);
};

class DichVuKho {
  #giu = new Map();
  async kiemTraTon(maSP, soLuong) {
    await nghi(5);
    return soLuong <= 10;
  }
  async giuHang(maSP, soLuong) {
    const ma = "GIU" + Math.random().toString(36).slice(2, 7);
    this.#giu.set(ma, { maSP, soLuong });
    ghi(`📦 Kho: giữ ${soLuong} x ${maSP} (mã ${ma})`);
    return ma;
  }
  async nhaHang(ma) {
    this.#giu.delete(ma);
    ghi(`↩️  Kho: NHẢ hàng đang giữ (mã ${ma})`);
  }
  async xacNhanGiu(ma) {
    ghi(`✔️  Kho: xác nhận xuất kho (mã ${ma})`);
  }
}

class DichVuKhuyenMai {
  async tinhGiamGia(maKM, tongTien) {
    await nghi(3);
    const giam = maKM === "SALE20" ? Math.round(tongTien * 0.2) : 0;
    ghi(`🏷️  Khuyến mãi: giảm ${giam.toLocaleString("vi-VN")}đ`);
    return giam;
  }
}

class DichVuThanhToan {
  async tra(the, soTien) {
    await nghi(8);
    if (the === "THE_HET_TIEN") throw new Error("Thẻ không đủ số dư");
    const ma = "GD" + Math.random().toString(36).slice(2, 8);
    ghi(`💳 Thanh toán: trừ ${soTien.toLocaleString("vi-VN")}đ (mã ${ma})`);
    return ma;
  }
  async hoanTien(maGD) {
    ghi(`↩️  Thanh toán: HOÀN TIỀN giao dịch ${maGD}`);
  }
}

class DichVuVanChuyen {
  async taoVanDon(diaChi, canNang) {
    await nghi(6);
    if (diaChi.includes("Trường Sa")) throw new Error("Không giao tới khu vực này");
    const ma = "VD" + Math.random().toString(36).slice(2, 8);
    ghi(`🚚 Vận chuyển: tạo vận đơn ${ma} → ${diaChi}`);
    return ma;
  }
  async huyVanDon(ma) {
    ghi(`↩️  Vận chuyển: HỦY vận đơn ${ma}`);
  }
}

class DichVuEmail {
  async guiXacNhan(email, ttin) {
    await nghi(4);
    ghi(`📧 Email: gửi xác nhận tới ${email}`);
  }
}

class DichVuKeToan {
  async ghiSo(maGD, soTien) {
    ghi(`📒 Kế toán: ghi sổ ${soTien.toLocaleString("vi-VN")}đ`);
  }
}

// ###########################################################################
// PHẦN 1 — KHÔNG CÓ FACADE
// ###########################################################################

line("1. KHÔNG CÓ FACADE — code này bị copy ở 4 nơi");

console.log(`
   // api/dat-hang.js          ← bản 1
   // admin/tao-don.js         ← bản 2, hơi khác
   // jobs/gio-bo-quen.js      ← bản 3, thiếu bước ghi sổ
   // scripts/nhap-tu-san.js   ← bản 4, sai thứ tự

   const ton = await kho.kiemTraTon(...);
   const giu = await kho.giuHang(...);
   const giam = await km.tinhGiamGia(...);
   const gd = await tt.tra(...);            ← nếu bước này lỗi thì AI nhả hàng?
   const van = await vc.taoVanDon(...);     ← nếu bước này lỗi thì AI hoàn tiền?
   await mail.guiXacNhan(...);
   await kho.xacNhanGiu(giu);
   await keToan.ghiSo(gd);

   ⚠️  Vấn đề LỚN NHẤT không phải là dài, mà là:
       • 4 nơi xử lý lỗi theo 4 kiểu khác nhau → tồn kho sai, tiền treo
       • thêm bước "tích điểm" phải sửa 4 chỗ, chắc chắn quên 1
       • người mới không biết thứ tự đúng là gì`);

// ###########################################################################
// PHẦN 2 — FACADE
// ###########################################################################

class LoiDatHang extends Error {
  constructor(thongDiep, { buoc, nguyenNhan } = {}) {
    super(thongDiep);
    this.name = "LoiDatHang";
    this.buoc = buoc;
    this.nguyenNhan = nguyenNhan;
  }
}

class DichVuDatHang {
  constructor({ kho, khuyenMai, thanhToan, vanChuyen, email, keToan }) {
    this.kho = kho;
    this.khuyenMai = khuyenMai;
    this.thanhToan = thanhToan;
    this.vanChuyen = vanChuyen;
    this.email = email;
    this.keToan = keToan;
  }

  /**
   * Cửa chính. Đây là NƠI DUY NHẤT trong toàn hệ thống biết:
   *   - thứ tự đúng của quy trình
   *   - phải hoàn tác gì khi hỏng giữa chừng
   */
  async datHang({ maSP, soLuong, donGia, maKM, the, diaChi, canNang, email }) {
    const hoanTac = []; // ngăn xếp các việc cần làm nếu thất bại
    let buocHienTai = "khởi tạo";

    try {
      buocHienTai = "kiểm tra tồn kho";
      if (!(await this.kho.kiemTraTon(maSP, soLuong))) {
        throw new Error(`Không đủ tồn kho cho ${maSP}`);
      }

      buocHienTai = "giữ hàng";
      const maGiu = await this.kho.giuHang(maSP, soLuong);
      hoanTac.push(() => this.kho.nhaHang(maGiu));

      buocHienTai = "tính khuyến mãi";
      const tongGoc = donGia * soLuong;
      const giam = await this.khuyenMai.tinhGiamGia(maKM, tongGoc);
      const phaiTra = tongGoc - giam;

      buocHienTai = "thanh toán";
      const maGD = await this.thanhToan.tra(the, phaiTra);
      hoanTac.push(() => this.thanhToan.hoanTien(maGD));

      buocHienTai = "tạo vận đơn";
      const maVD = await this.vanChuyen.taoVanDon(diaChi, canNang);
      hoanTac.push(() => this.vanChuyen.huyVanDon(maVD));

      buocHienTai = "chốt đơn";
      await this.kho.xacNhanGiu(maGiu);
      await this.keToan.ghiSo(maGD, phaiTra);
      await this.email.guiXacNhan(email, { maGD, maVD });

      // Trả về object CỦA TA, không rò rỉ kiểu dữ liệu của hệ thống con
      return { thanhCong: true, maGiaoDich: maGD, maVanDon: maVD, phaiTra };
    } catch (e) {
      // ---- LOGIC BÙ TRỪ: hoàn tác NGƯỢC thứ tự đã làm ----
      ghi(`💥 Lỗi ở bước "${buocHienTai}": ${e.message}`);
      ghi(`🔄 Bắt đầu hoàn tác ${hoanTac.length} việc đã làm...`);
      for (const viec of hoanTac.reverse()) {
        try {
          await viec();
        } catch (loiHoanTac) {
          ghi(`⚠️  Hoàn tác thất bại: ${loiHoanTac.message} — cần xử lý tay!`);
        }
      }
      throw new LoiDatHang(`Đặt hàng thất bại: ${e.message}`, {
        buoc: buocHienTai,
        nguyenNhan: e,
      });
    }
  }
}

const dichVu = new DichVuDatHang({
  kho: new DichVuKho(),
  khuyenMai: new DichVuKhuyenMai(),
  thanhToan: new DichVuThanhToan(),
  vanChuyen: new DichVuVanChuyen(),
  email: new DichVuEmail(),
  keToan: new DichVuKeToan(),
});

const donMau = {
  maSP: "AO-THUN-M",
  soLuong: 2,
  donGia: 250_000,
  maKM: "SALE20",
  the: "THE_TOT",
  diaChi: "12 Nguyễn Trãi, Hà Nội",
  canNang: 0.6,
  email: "khach@example.com",
};

line("2. CÓ FACADE — luồng thành công");
console.log("   Nơi gọi chỉ viết MỘT dòng:\n");
console.log("   const kq = await dichVu.datHang({...});\n");
const kq = await dichVu.datHang(donMau);
console.log("\n   Kết quả:", kq);

// ###########################################################################
// PHẦN 3 — GIÁ TRỊ THẬT: TỰ ĐỘNG HOÀN TÁC
// ###########################################################################

line("3. ⭐ GIÁ TRỊ THẬT — hỏng giữa chừng thì tự dọn dẹp");

console.log("\n── Lỗi ở bước THANH TOÁN (thẻ hết tiền) ──");
try {
  await dichVu.datHang({ ...donMau, the: "THE_HET_TIEN" });
} catch (e) {
  console.log(`\n   ❌ ${e.message}  [bước: ${e.buoc}]`);
  console.log("   ✅ Hàng đã được nhả lại kho — tồn kho không bị sai");
}

console.log("\n── Lỗi ở bước VẬN CHUYỂN (sau khi ĐÃ trừ tiền) ──");
try {
  await dichVu.datHang({ ...donMau, diaChi: "Đảo Trường Sa" });
} catch (e) {
  console.log(`\n   ❌ ${e.message}  [bước: ${e.buoc}]`);
  console.log("   ✅ Đã HOÀN TIỀN và nhả hàng — ngược đúng thứ tự đã làm");
}

console.log(`
   👉 Đây là lý do Facade đáng giá, chứ không phải vì "gom code cho gọn".

      Không có facade, 4 nơi copy-paste sẽ xử lý lỗi theo 4 kiểu:
        • nơi A quên nhả hàng    → tồn kho ảo, hết hàng giả
        • nơi B quên hoàn tiền   → khách mất tiền, không có hàng
        • nơi C hoàn tác sai thứ tự
        • nơi D không bắt lỗi, để nguyên exception bay lên

      Với facade: quy trình đúng CHỈ TỒN TẠI Ở MỘT CHỖ.`);

// ###########################################################################
// PHẦN 4 — FACADE KHÔNG PHẢI BỨC TƯỜNG
// ###########################################################################

line("4. FACADE KHÔNG CẤM TRUY CẬP TRỰC TIẾP");

const kho = new DichVuKho();
console.log("\n   95% trường hợp — dùng cửa chính:");
console.log("      await dichVu.datHang({...})");
console.log("\n   Trường hợp đặc biệt — vẫn được vào thẳng hệ thống con:");
await kho.giuHang("AO-THUN-M", 1);
console.log(`
   ⚠️  Hiểu sai thường gặp: "Facade phải chặn mọi truy cập trực tiếp".
       KHÔNG. Facade làm cho việc THÔNG THƯỜNG trở nên dễ, chứ không
       làm cho việc HIẾM GẶP trở nên bất khả thi.

       Nếu bạn phải thêm phương thức thứ 30 vào facade để phục vụ mọi
       tình huống hiếm, facade đã sai mục đích rồi.`);

// ###########################################################################
line("5. DẤU HIỆU FACADE ĐANG HỎNG");
console.log(`
   ❌ Có 40 phương thức        → tách theo use case:
                                  DichVuDatHang / DichVuTraHang / DichVuBaoCao
   ❌ Chứa công thức tính toán  → đẩy về đúng hệ thống con
   ❌ Trả nguyên object của SDK → client lại phụ thuộc hệ thống con
   ❌ Chỉ bọc MỘT class         → đó là Adapter/Proxy, hoặc là lớp thừa`);
