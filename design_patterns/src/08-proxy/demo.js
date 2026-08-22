/**
 * BÀI 08 — PROXY
 * Chạy: node src/08-proxy/demo.js
 */

const line = (t) => console.log("\n" + "=".repeat(62) + "\n" + t + "\n" + "=".repeat(62));
const nghi = (ms) => new Promise((r) => setTimeout(r, ms));

// ###########################################################################
// PHẦN 1 — VIRTUAL PROXY: hoãn khởi tạo tốn kém
// ###########################################################################

class BaoCaoNang {
  constructor(ten) {
    this.ten = ten;
    console.log(`      ⏳ Đang dựng "${ten}" — tốn 200ms và 50MB RAM...`);
    this.duLieu = new Array(1000).fill("dữ liệu");
    BaoCaoNang.soLanDung++;
  }
  hienThi() {
    return `📊 Báo cáo "${this.ten}" (${this.duLieu.length} dòng)`;
  }
}
BaoCaoNang.soLanDung = 0;

class BaoCaoProxy {
  #that = null;
  constructor(ten) {
    this.ten = ten; // rẻ — chỉ giữ tên, chưa dựng gì
  }
  hienThi() {
    if (!this.#that) {
      console.log(`      💡 Lần đầu dùng "${this.ten}" → mới dựng object thật`);
      this.#that = new BaoCaoNang(this.ten);
    }
    return this.#that.hienThi();
  }
}

line("1. VIRTUAL PROXY — hoãn khởi tạo");

console.log("\nDựng menu 5 báo cáo:");
const menu = ["Doanh thu", "Tồn kho", "Nhân sự", "Khách hàng", "Vận chuyển"].map(
  (t) => new BaoCaoProxy(t)
);
console.log(`   Đã dựng ${menu.length} mục menu.`);
console.log(`   Object THẬT đã dựng: ${BaoCaoNang.soLanDung} ✅ (chưa cái nào!)`);

console.log("\nNgười dùng bấm vào mục thứ 2:");
console.log("   " + menu[1].hienThi());
console.log(`   Object THẬT đã dựng: ${BaoCaoNang.soLanDung}`);

console.log("\nBấm lại mục thứ 2 lần nữa:");
console.log("   " + menu[1].hienThi());
console.log(`   Object THẬT đã dựng: ${BaoCaoNang.soLanDung} ✅ (không dựng lại)`);

console.log(`
   👉 Không có proxy: 5 × 200ms = 1 giây và 250MB, dù người dùng chỉ mở 1 mục.
      Client gọi menu[1].hienThi() y hệt như với object thật — không biết
      mình đang cầm proxy. Đó là yêu cầu bắt buộc: proxy phải TRONG SUỐT.`);

// ###########################################################################
// PHẦN 2 — BẪY KHỞI TẠO LƯỜI TRONG MÔI TRƯỜNG BẤT ĐỒNG BỘ
// ###########################################################################

line("2. ⚠️  BẪY: khởi tạo lười khi có nhiều lời gọi đồng thời");

let soLanKetNoiThat = 0;
const ketNoiThat = async () => {
  soLanKetNoiThat++;
  await nghi(50);
  return { id: soLanKetNoiThat };
};

// ---- CÁCH SAI ----
class ProxySai {
  #that = null;
  async lay() {
    if (!this.#that) {
      // Giữa await này và dòng gán, một lời gọi khác có thể chen vào
      this.#that = await ketNoiThat();
    }
    return this.#that;
  }
}

soLanKetNoiThat = 0;
const sai = new ProxySai();
await Promise.all([sai.lay(), sai.lay(), sai.lay()]);
console.log(`   Cách SAI:  3 lời gọi đồng thời → tạo ${soLanKetNoiThat} kết nối ❌`);

// ---- CÁCH ĐÚNG: lưu chính PROMISE, không lưu kết quả ----
class ProxyDung {
  #promise = null;
  async lay() {
    if (!this.#promise) {
      this.#promise = ketNoiThat(); // gán NGAY, không await trước khi gán
    }
    return this.#promise;
  }
}

soLanKetNoiThat = 0;
const dung = new ProxyDung();
await Promise.all([dung.lay(), dung.lay(), dung.lay()]);
console.log(`   Cách ĐÚNG: 3 lời gọi đồng thời → tạo ${soLanKetNoiThat} kết nối ✅`);

console.log(`
   👉 JS đơn luồng nhưng KHÔNG miễn nhiễm với race condition. Mỗi dấu
      "await" là một chỗ code khác có thể chen vào. Mẹo: lưu lại chính
      cái Promise, đừng lưu kết quả sau khi await.`);

// ###########################################################################
// PHẦN 3 — PROTECTION PROXY
// ###########################################################################

class LoiKhongCoQuyen extends Error {
  constructor(hanhDong, vaiTro) {
    super(`Vai trò "${vaiTro}" không được phép ${hanhDong}`);
    this.name = "LoiKhongCoQuyen";
  }
}

class DichVuTaiLieu {
  #kho = new Map([["hd-01", "Hợp đồng lao động"], ["bc-02", "Báo cáo tài chính"]]);
  xem(ma) {
    return this.#kho.get(ma) ?? "(không tồn tại)";
  }
  sua(ma, noiDung) {
    this.#kho.set(ma, noiDung);
    return "đã sửa";
  }
  xoa(ma) {
    this.#kho.delete(ma);
    return "đã xóa";
  }
}

class TaiLieuProxy {
  static QUYEN = {
    khach: ["xem"],
    nhanvien: ["xem", "sua"],
    admin: ["xem", "sua", "xoa"],
  };

  constructor(that, vaiTro) {
    this.that = that;
    this.vaiTro = vaiTro;
  }

  #kiemTra(hanhDong) {
    const duoc = TaiLieuProxy.QUYEN[this.vaiTro] ?? [];
    if (!duoc.includes(hanhDong)) throw new LoiKhongCoQuyen(hanhDong, this.vaiTro);
  }

  xem(ma) {
    this.#kiemTra("xem");
    return this.that.xem(ma);
  }
  sua(ma, nd) {
    this.#kiemTra("sua");
    return this.that.sua(ma, nd);
  }
  xoa(ma) {
    this.#kiemTra("xoa");
    return this.that.xoa(ma);
  }
}

line("3. PROTECTION PROXY — kiểm soát quyền");

const that = new DichVuTaiLieu();
for (const vaiTro of ["khach", "nhanvien", "admin"]) {
  const dv = new TaiLieuProxy(that, vaiTro);
  const ketQua = ["xem", "sua", "xoa"].map((hd) => {
    try {
      hd === "xem" ? dv.xem("hd-01") : hd === "sua" ? dv.sua("hd-01", "x") : dv.xoa("tam");
      return `${hd}:✅`;
    } catch (e) {
      return `${hd}:⛔`;
    }
  });
  console.log(`   ${vaiTro.padEnd(9)} ${ketQua.join("  ")}`);
}

console.log(`
   👉 DichVuTaiLieu KHÔNG có một dòng nào về phân quyền. Nó chỉ biết
      nghiệp vụ tài liệu. Toàn bộ luật quyền nằm ở proxy — đổi luật
      chỉ đụng một file.

   ⚠️  Bị từ chối phải NÉM LỖI, đừng lặng lẽ trả về undefined.
      Trả undefined nghĩa là bug sẽ hiện ra ở một nơi khác, muộn hơn,
      với thông báo vô nghĩa.`);

// ###########################################################################
// PHẦN 4 — new Proxy CỦA JAVASCRIPT
// ###########################################################################

line("4. new Proxy — chặn ở mức NGÔN NGỮ");

// --- 4.1 Theo dõi mọi lần đọc/ghi ---
const theoDoi = (obj, ten) =>
  new Proxy(obj, {
    get(dich, khoa) {
      console.log(`      📖 đọc ${ten}.${String(khoa)}`);
      return Reflect.get(dich, khoa);
    },
    set(dich, khoa, giaTri) {
      console.log(`      ✏️  ghi ${ten}.${String(khoa)} = ${giaTri}`);
      return Reflect.set(dich, khoa, giaTri); // nhớ return true/Reflect.set
    },
  });

console.log("\n4.1 Theo dõi đọc/ghi:");
const nguoiDung = theoDoi({ ten: "An", tuoi: 25 }, "nguoiDung");
nguoiDung.ten;
nguoiDung.tuoi = 26;

// --- 4.2 Bắt lỗi gõ nhầm tên thuộc tính ---
const chongLoiChinhTa = (obj) =>
  new Proxy(obj, {
    get(dich, khoa) {
      if (typeof khoa === "string" && !(khoa in dich) && khoa !== "then") {
        throw new TypeError(
          `Thuộc tính "${khoa}" không tồn tại. Có: ${Object.keys(dich).join(", ")}`
        );
      }
      return Reflect.get(dich, khoa);
    },
  });

console.log("\n4.2 Bắt lỗi gõ nhầm:");
const cauHinh = chongLoiChinhTa({ apiUrl: "https://api.example.com", timeout: 5000 });
console.log("      cauHinh.apiUrl →", cauHinh.apiUrl);
try {
  cauHinh.apiURL; // gõ nhầm hoa/thường
} catch (e) {
  console.log("      ⛔ " + e.message);
}
console.log(`
      👉 Không có proxy: cauHinh.apiURL trả về undefined, rồi fetch(undefined)
         ném một lỗi hoàn toàn không liên quan ở một file khác. Proxy biến
         bug ngầm thành lỗi hiện, ngay tại dòng gây ra nó.`);

// --- 4.3 Mô phỏng lõi reactivity của Vue 3 ---
console.log("\n4.3 Reactivity kiểu Vue 3 (đơn giản hóa):");

const taoPhanUng = (obj, khiThayDoi) =>
  new Proxy(obj, {
    set(dich, khoa, giaTri) {
      const cu = dich[khoa];
      const kq = Reflect.set(dich, khoa, giaTri);
      if (cu !== giaTri) khiThayDoi(khoa, cu, giaTri);
      return kq;
    },
  });

const trangThai = taoPhanUng({ soLuong: 1, gia: 50000 }, (khoa, cu, moi) =>
  console.log(`      🔄 ${khoa}: ${cu} → ${moi} — vẽ lại giao diện`)
);
trangThai.soLuong = 3;
trangThai.gia = 45000;
trangThai.gia = 45000; // không đổi → không vẽ lại

console.log(`
      👉 Đây chính là lõi của Vue 3 reactive(), MobX, và Immer.
         Bạn viết state.soLuong = 3 như bình thường; proxy lo phần còn lại.`);

// ###########################################################################
line("5. PROXY vs DECORATOR — câu hỏi hay gặp nhất");
console.log(`
              DECORATOR                    PROXY
   Ý định     THÊM khả năng mới            KIỂM SOÁT lối vào cái đã có
   Ai bọc     Client, lúc dựng object      Hệ thống; client không biết
   Xếp chồng  Có — đó là điểm mạnh chính   Hiếm
   Object     BẮT BUỘC có sẵn để bọc       Có thể CHƯA tồn tại (lazy)

   Cách nhớ:
     Decorator = "cho tôi THÊM tính năng vào cái này"
     Proxy     = "cho tôi ĐỨNG GÁC trước cái này"

   Về mặt code, hai cái gần như giống hệt nhau. Khác biệt nằm ở Ý ĐỊNH,
   và ý định quyết định cách bạn ĐẶT TÊN — điều mà người đọc code sau này
   sẽ dựa vào để hiểu.`);
