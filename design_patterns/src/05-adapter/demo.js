/**
 * BÀI 05 — ADAPTER
 * Chạy: node src/05-adapter/demo.js
 */

const line = (t) => console.log("\n" + "=".repeat(62) + "\n" + t + "\n" + "=".repeat(62));

// ###########################################################################
// PHẦN 0 — HỢP ĐỒNG (TARGET)
// JS không có interface, nên hợp đồng là comment + test. Hãy viết nó ra rõ ràng.
// ###########################################################################

/**
 * HỢP ĐỒNG CongThanhToan — mọi cổng thanh toán phải tuân theo:
 *
 *   thanhToan({ soTienVnd, moTa, maDon })
 *      → { thanhCong: boolean, maGiaoDich: string, soTienVnd: number, nhaCungCap: string }
 *      → ném LoiThanhToan nếu thất bại
 *
 *   hoanTien(maGiaoDich, soTienVnd)
 *      → { thanhCong: boolean, maHoanTien: string }
 */

class LoiThanhToan extends Error {
  constructor(thongDiep, { nhaCungCap, maLoiGoc, coTheThuLai = false } = {}) {
    super(thongDiep);
    this.name = "LoiThanhToan";
    this.nhaCungCap = nhaCungCap;
    this.maLoiGoc = maLoiGoc; // giữ lại để ghi log, nhưng KHÔNG bắt code gọi phải hiểu
    this.coTheThuLai = coTheThuLai;
  }
}

// ###########################################################################
// PHẦN 1 — CÁC ADAPTEE: SDK CỦA BÊN THỨ BA (ta KHÔNG sửa được)
// ###########################################################################

// --- SDK MoMo: dùng tiếng Việt, đơn vị VND, trả về { status } ---
class SdkMoMo {
  async taoGiaoDich(soTien, noiDung, maThamChieu) {
    if (soTien > 20_000_000) {
      const e = new Error("VUOT_HAN_MUC");
      e.errorCode = 4001;
      throw e;
    }
    return { status: 0, transId: "MOMO" + Date.now(), amount: soTien, message: "Thành công" };
  }
  async huyGiaoDich(transId, amount) {
    return { status: 0, refundId: "RF" + transId };
  }
}

// --- SDK Stripe: tiếng Anh, đơn vị NHỎ NHẤT (xu), trả về { id, status } ---
class SdkStripe {
  charges = {
    create: async ({ amount, currency, description, metadata }) => {
      if (currency !== "vnd") {
        const e = new Error("Unsupported currency");
        e.type = "StripeInvalidRequestError";
        throw e;
      }
      if (amount > 2_000_000_00) {
        const e = new Error("Amount exceeds limit");
        e.type = "StripeCardError";
        e.code = "amount_too_large";
        throw e;
      }
      return { id: "ch_" + Math.random().toString(36).slice(2, 10), status: "succeeded", amount };
    },
  };
  refunds = {
    create: async ({ charge, amount }) => ({ id: "re_" + charge.slice(3), status: "succeeded" }),
  };
}

// ###########################################################################
// PHẦN 2 — CÁC ADAPTER
// ###########################################################################

class MoMoAdapter {
  constructor(sdk = new SdkMoMo()) {
    this.sdk = sdk;
  }

  async thanhToan({ soTienVnd, moTa, maDon }) {
    try {
      // (1) đổi tên hàm  (2) đổi hình dạng tham số
      const kq = await this.sdk.taoGiaoDich(soTienVnd, moTa, maDon);
      if (kq.status !== 0) {
        throw new LoiThanhToan(kq.message, { nhaCungCap: "momo", maLoiGoc: kq.status });
      }
      // (3) ánh xạ kết quả về object CỦA TA, không trả nguyên object của SDK
      return {
        thanhCong: true,
        maGiaoDich: kq.transId,
        soTienVnd: kq.amount,
        nhaCungCap: "momo",
      };
    } catch (e) {
      // (4) DỊCH LỖI — phần hay bị quên nhất
      if (e instanceof LoiThanhToan) throw e;
      throw new LoiThanhToan(
        e.message === "VUOT_HAN_MUC" ? "Giao dịch vượt hạn mức MoMo" : "Lỗi thanh toán MoMo",
        { nhaCungCap: "momo", maLoiGoc: e.errorCode, coTheThuLai: false }
      );
    }
  }

  async hoanTien(maGiaoDich, soTienVnd) {
    const kq = await this.sdk.huyGiaoDich(maGiaoDich, soTienVnd);
    return { thanhCong: kq.status === 0, maHoanTien: kq.refundId };
  }
}

class StripeAdapter {
  constructor(sdk = new SdkStripe()) {
    this.sdk = sdk;
  }

  async thanhToan({ soTienVnd, moTa, maDon }) {
    try {
      const kq = await this.sdk.charges.create({
        amount: soTienVnd * 100, // (3) ĐỔI ĐƠN VỊ — nguồn bug kinh điển nếu quên
        currency: "vnd",
        description: moTa,
        metadata: { order_id: maDon },
      });
      return {
        thanhCong: kq.status === "succeeded",
        maGiaoDich: kq.id,
        soTienVnd: kq.amount / 100, // đổi ngược lại khi trả ra
        nhaCungCap: "stripe",
      };
    } catch (e) {
      throw new LoiThanhToan(
        e.code === "amount_too_large" ? "Giao dịch vượt hạn mức Stripe" : "Lỗi thanh toán Stripe",
        { nhaCungCap: "stripe", maLoiGoc: e.type, coTheThuLai: e.type !== "StripeCardError" }
      );
    }
  }

  async hoanTien(maGiaoDich, soTienVnd) {
    const kq = await this.sdk.refunds.create({ charge: maGiaoDich, amount: soTienVnd * 100 });
    return { thanhCong: kq.status === "succeeded", maHoanTien: kq.id };
  }
}

// ###########################################################################
// PHẦN 3 — CLIENT: viết MỘT LẦN, chạy với MỌI cổng
// ###########################################################################

class DichVuDonHang {
  constructor(congThanhToan) {
    this.cong = congThanhToan; // chỉ biết HỢP ĐỒNG, không biết MoMo hay Stripe
  }

  async datHang(maDon, soTienVnd) {
    try {
      const kq = await this.cong.thanhToan({
        soTienVnd,
        moTa: `Thanh toán đơn ${maDon}`,
        maDon,
      });
      return `✅ Đơn ${maDon}: ${kq.soTienVnd.toLocaleString("vi-VN")}đ qua ${kq.nhaCungCap} ` +
        `(mã ${kq.maGiaoDich})`;
    } catch (e) {
      // Code này KHÔNG cần biết StripeCardError hay errorCode 4001 là gì
      const goiY = e.coTheThuLai ? " — có thể thử lại" : " — vui lòng dùng cách khác";
      return `❌ Đơn ${maDon}: ${e.message}${goiY}`;
    }
  }
}

// ###########################################################################
// CHẠY THỬ
// ###########################################################################

line("1. CÙNG MỘT CODE, HAI CỔNG THANH TOÁN KHÁC NHAU");

const cacCong = [
  ["MoMo", new MoMoAdapter()],
  ["Stripe", new StripeAdapter()],
];

for (const [ten, cong] of cacCong) {
  console.log(`\n── ${ten} ──`);
  const dichVu = new DichVuDonHang(cong);
  console.log("  " + (await dichVu.datHang("DH1001", 250_000)));
  console.log("  " + (await dichVu.datHang("DH1002", 1_500_000)));
}

line("2. LỖI CŨNG ĐƯỢC DỊCH VỀ MỘT LOẠI DUY NHẤT");

for (const [ten, cong] of cacCong) {
  const dichVu = new DichVuDonHang(cong);
  console.log(`  ${ten.padEnd(7)} → ` + (await dichVu.datHang("DH9999", 999_000_000)));
}

console.log(`
👉 SDK MoMo ném Error có .errorCode = 4001
   SDK Stripe ném Error có .type = "StripeCardError"
   Code nghiệp vụ chỉ thấy MỘT loại: LoiThanhToan, với .coTheThuLai.

   Nếu adapter để lọt lỗi gốc ra ngoài, code gọi sẽ phải viết:
       if (e.errorCode === 4001 || e.type === "StripeCardError") ...
   → và bạn VẪN bị khóa vào cả hai nhà cung cấp. Adapter coi như thất bại.`);

line("3. ĐỔI NHÀ CUNG CẤP = ĐỔI MỘT DÒNG");

console.log(`
   // main.js — hôm nay
   const cong = new MoMoAdapter();

   // main.js — tháng sau, sếp đổi ý
   const cong = new StripeAdapter();

   const dichVu = new DichVuDonHang(cong);   // ← KHÔNG đổi
   // ...và 200 chỗ gọi dichVu.datHang() cũng KHÔNG đổi.`);

line("4. BỐN VIỆC MÀ MỘT ADAPTER PHẢI LÀM");
console.log(`
   1. Đổi TÊN HÀM        thanhToan()      → charges.create()
   2. Đổi HÌNH DẠNG      {soTienVnd}      → {amount, currency}
   3. Đổi ĐƠN VỊ         250000 VND       → 25000000 (xu)
   4. Đổi CÁCH BÁO LỖI   StripeCardError  → LoiThanhToan   ⭐ hay bị quên

   Và một việc ngầm quan trọng không kém:
   5. Ánh xạ KẾT QUẢ TRẢ VỀ thành object của bạn, đừng trả nguyên object SDK.`);
