/**
 * BÀI 17 — REACTIVE / SIGNAL
 * Chạy: node src/17-signal/demo.js
 *
 * Tự viết lại lõi của Vue/Solid/Svelte 5 trong ~50 dòng.
 */

const line = (t) => console.log("\n" + "=".repeat(62) + "\n" + t + "\n" + "=".repeat(62));

// ###########################################################################
// PHẦN 1 — CÁI ĐAU
// ###########################################################################

line("1. CÁI ĐAU — cập nhật thủ công");
console.log(`
   function doiSoLuong(ma, sl) {
     gioHang.doi(ma, sl);
     capNhatTongTien();
     capNhatPhiShip();
     capNhatThue();          ← phải gọi SAU capNhatTongTien
     capNhatNutThanhToan();
     capNhatBadge();
     capNhatGoiY();
   }

   ⚠️  Ba vấn đề:
       1. Có 5 chỗ khác cũng đổi giỏ hàng → copy 6 dòng này 5 lần
       2. Quên một hàm → giao diện hiện SỐ CŨ, người dùng thấy tổng sai
       3. Sai thứ tự → thuế tính trên tổng tiền cũ`);

// ###########################################################################
// PHẦN 2 — LÕI REACTIVE: BA MẢNH GHÉP
// ###########################################################################

// ---- MẢNH 1: một biến toàn cục ghi "ai đang chạy" ----
let dangChay = null;

// Hàng đợi cho batch(). Tách LÀM HAI là chi tiết quan trọng — xem phần 6.
//   noiBo    : effect bên trong computed (phải ổn định TRƯỚC)
//   nguoiDung: effect do người dùng viết (chạy SAU CÙNG, mỗi cái một lần)
let hangDoi = null;

// ---- MẢNH 2: signal — khi ĐỌC thì ghi lại ai đang đọc mình ----
function signal(giaTriBanDau, ten = "?") {
  let giaTri = giaTriBanDau;
  const nguoiPhuThuoc = new Set();

  const doc = () => {
    // ⭐ ĐÂY LÀ CHỖ "KỲ DIỆU": phụ thuộc được phát hiện TỰ ĐỘNG
    // chỉ vì ai đó đọc giá trị này trong lúc đang chạy một effect.
    if (dangChay) {
      nguoiPhuThuoc.add(dangChay);
      dangChay.nguon.add(nguoiPhuThuoc); // để effect biết đường tự dọn
    }
    return giaTri;
  };

  doc.set = (moi) => {
    if (Object.is(giaTri, moi)) return; // ⭐ không đổi → không làm gì cả
    giaTri = moi;
    for (const f of [...nguoiPhuThuoc]) {
      if (hangDoi) (f.laNoiBo ? hangDoi.noiBo : hangDoi.nguoiDung).add(f);
      else f();
    }
  };

  doc.ten = ten;
  doc.soNguoiPhuThuoc = () => nguoiPhuThuoc.size;
  return doc;
}

// ---- MẢNH 3: effect — đặt dangChay trỏ vào chính nó rồi chạy ----
function effect(fn, { laNoiBo = false } = {}) {
  const chay = () => {
    // Dọn phụ thuộc CŨ trước khi chạy lại — nếu không, nhánh code không
    // còn được dùng vẫn tiếp tục đánh thức effect này (xem phần 5).
    for (const bo of chay.nguon) bo.delete(chay);
    chay.nguon.clear();

    const truoc = dangChay;
    dangChay = chay;
    try {
      fn();
    } finally {
      dangChay = truoc;
    }
  };
  chay.nguon = new Set();
  chay.laNoiBo = laNoiBo;
  chay();

  return () => {
    for (const bo of chay.nguon) bo.delete(chay);
    chay.nguon.clear();
  };
}

// ---- computed: signal + effect, có nhớ kết quả ----
function computed(fn, ten = "?") {
  const s = signal(undefined, ten);
  let soLanTinh = 0;
  effect(() => {
    soLanTinh++;
    s.set(fn());
  }, { laNoiBo: true }); // ← effect của computed là "nội bộ"
  const doc = () => s();
  doc.ten = ten;
  doc.soLanTinh = () => soLanTinh;
  return doc;
}

// ---- batch: gom nhiều thay đổi, effect chỉ chạy một lần ở cuối ----
function batch(fn) {
  if (hangDoi) return fn(); // đã ở trong batch rồi
  hangDoi = { noiBo: new Set(), nguoiDung: new Set() };
  try {
    fn();
  } finally {
    // ⭐ Hai vòng, và thứ tự giữa chúng mới là điều quan trọng:
    //   1. Chạy mọi computed cho tới khi ỔN ĐỊNH (không còn gì thay đổi)
    //   2. Chỉ khi đó mới chạy effect của người dùng, mỗi cái ĐÚNG MỘT LẦN
    // Nếu trộn hai loại vào một hàng đợi, effect sẽ chạy với dữ liệu
    // nửa cũ nửa mới — đúng cái "glitch" mà batch sinh ra để tránh.
    let vongLap = 0;
    while (hangDoi.noiBo.size) {
      if (++vongLap > 100) throw new Error("Phụ thuộc vòng giữa các computed");
      const ds = [...hangDoi.noiBo];
      hangDoi.noiBo.clear();
      for (const f of ds) f();
    }
    const dsNguoiDung = [...hangDoi.nguoiDung];
    hangDoi = null;
    for (const f of dsNguoiDung) f();
  }
}

// ###########################################################################
line("2. LÕI CHỈ CÓ BA MẢNH GHÉP");
console.log(`
   1. let dangChay = null;              ← biến toàn cục: "ai đang chạy"

   2. signal.doc():  if (dangChay) nguoiPhuThuoc.add(dangChay)
                     ← ĐỌC giá trị là TỰ ĐỘNG đăng ký

   3. effect():      dangChay = chay; fn(); dangChay = null
                     ← chạy hàm với "chữ ký" của mình

   👉 Đó là TOÀN BỘ. Vue, Solid, Svelte 5, Angular signals đều dựa trên
      đúng ba mảnh này. Phần còn lại chỉ là tối ưu và tiện ích.`);

// ###########################################################################
line("3. GIỎ HÀNG BẰNG SIGNAL");

const soLuong = signal(2, "soLuong");
const donGia = signal(250_000, "donGia");

const tamTinh = computed(() => soLuong() * donGia(), "tamTinh");
const phiShip = computed(() => (tamTinh() >= 500_000 ? 0 : 30_000), "phiShip");
const tongCong = computed(() => tamTinh() + phiShip(), "tongCong");
const goiY = computed(() => {
  const thieu = 500_000 - tamTinh();
  return thieu > 0 ? `Mua thêm ${thieu.toLocaleString("vi-VN")}đ để FREESHIP` : "🎉 Bạn được FREESHIP!";
}, "goiY");

const ve = () =>
  console.log(
    `      ${soLuong()} món × ${donGia().toLocaleString("vi-VN")}đ` +
      ` = ${tamTinh().toLocaleString("vi-VN")}đ` +
      ` + ship ${phiShip().toLocaleString("vi-VN")}đ` +
      ` → TỔNG ${tongCong().toLocaleString("vi-VN")}đ`
  );

console.log("\n   Khai báo quan hệ xong, chưa gọi cập nhật gì:\n");
effect(() => ve());
effect(() => console.log(`      💡 ${goiY()}`));

console.log("\n   soLuong.set(3)  ← chỉ đổi MỘT giá trị:\n");
soLuong.set(3);

console.log("\n   donGia.set(180000):\n");
donGia.set(180_000);

console.log(`
   👉 KHÔNG hề có dòng nào gọi capNhatTongTien() hay capNhatGoiY().
      Ta chỉ MÔ TẢ QUAN HỆ, hệ thống lo phần lan truyền.

      Và không thể "quên gọi" — vì không có gì để gọi.

   ⚠️  NHƯNG hãy đếm số dòng in ra ở trên: hàm vẽ chạy BA lần cho MỘT
      thay đổi. Đó chính là "glitch" — nó lan lần lượt qua tamTinh,
      phiShip, tongCong, và mỗi chặng lại đánh thức effect một lần.

      Hai lần đầu là trạng thái TRUNG GIAN KHÔNG NHẤT QUÁN. Đây là vấn
      đề THẬT của mọi hệ reactive, và ta chữa nó ở phần 6.`);

console.log("\n   Cùng thay đổi đó nhưng bọc trong batch():\n");
batch(() => soLuong.set(4));
console.log(`
   👉 Một lần vẽ duy nhất, với dữ liệu đã nhất quán ✅`);

// ###########################################################################
line("4. KHÔNG ĐỔI THÌ KHÔNG THÔNG BÁO");

let soLanVe = 0;
const x = signal(5);
effect(() => {
  x();
  soLanVe++;
});

console.log(`   Sau khi tạo effect:  chạy ${soLanVe} lần`);
x.set(5);
console.log(`   x.set(5) — giá trị KHÔNG đổi:  chạy ${soLanVe} lần  ← không chạy lại ✅`);
x.set(6);
console.log(`   x.set(6) — giá trị đổi:        chạy ${soLanVe} lần  ✅`);

console.log(`
   👉 Object.is() ở đầu hàm set() là một dòng, nhưng nó cắt bỏ phần lớn
      công việc thừa trong một ứng dụng thật.

   ⚠️  Cạm bẫy: với OBJECT thì mọi lần set đều là "khác":
          s.set({a: 1});  s.set({a: 1});   ← hai object khác nhau → thông báo 2 lần
      Nên ưu tiên signal cho giá trị nguyên thủy.`);

// ###########################################################################
line("5. ⚠️  DỌN PHỤ THUỘC CŨ");

const hienChiTiet = signal(true, "hienChiTiet");
const chiTiet = signal("nội dung A", "chiTiet");
let soLanChay = 0;

effect(() => {
  soLanChay++;
  if (hienChiTiet()) chiTiet(); // chỉ đọc chiTiet khi đang hiện
});

console.log(`   Ban đầu (đang hiện chi tiết): chiTiet có ${chiTiet.soNguoiPhuThuoc()} người phụ thuộc`);
hienChiTiet.set(false);
console.log(`   Sau khi ẩn chi tiết:          chiTiet có ${chiTiet.soNguoiPhuThuoc()} người phụ thuộc ✅`);

soLanChay = 0;
chiTiet.set("nội dung B");
console.log(`   Đổi chiTiet khi đang ẩn:      effect chạy ${soLanChay} lần  ← đúng, không chạy ✅`);

console.log(`
   👉 Nếu KHÔNG dọn phụ thuộc cũ, effect vẫn bị đánh thức mỗi lần chiTiet
      đổi — dù nó không còn dùng tới giá trị đó. Trong ứng dụng thật với
      hàng trăm signal, đây là nguồn lãng phí lớn và rất khó nhận ra.

      Đó là lý do effect() phải xóa sạch nguồn TRƯỚC mỗi lần chạy lại.`);

// ###########################################################################
line("6. ⚠️  TÍNH TOÁN THỪA (GLITCH) VÀ CÁCH GOM THEO LÔ");

const a = signal(1);
const b = signal(2);
let soLanTinhTong = 0;
const tong = computed(() => {
  soLanTinhTong++;
  return a() + b();
});
effect(() => tong());

soLanTinhTong = 0;
console.log("\n   KHÔNG batch — đổi a rồi đổi b:");
a.set(10);
b.set(20);
console.log(`      tong tính lại ${soLanTinhTong} lần (mong muốn: 1)`);

soLanTinhTong = 0;
console.log("\n   CÓ batch — gom hai thay đổi:");
batch(() => {
  a.set(100);
  b.set(200);
});
console.log(`      tong tính lại ${soLanTinhTong} lần ✅`);

console.log(`
   👉 Không batch: sau a.set(10), "tong" tính ra 12 — một trạng thái TRUNG
      GIAN KHÔNG BAO GIỜ ĐÚNG (a đã mới, b còn cũ). Nếu effect này vẽ giao
      diện, người dùng thấy một con số sai thoáng qua. Đó là "glitch".

      Vue gọi cơ chế này là nextTick, React gọi là automatic batching,
      Solid gọi là batch(). Cùng một vấn đề, cùng một lời giải.`);

// ###########################################################################
line("7. SIGNAL vs OBSERVER (Bài 10)");
console.log(`
                     OBSERVER                   SIGNAL
   Đăng ký           THỦ CÔNG: dangKy(...)      TỰ ĐỘNG khi đọc giá trị
   Truyền cái gì     SỰ KIỆN (đã xảy ra)        GIÁ TRỊ (hiện tại)
   Chuỗi phụ thuộc   tự nối tay                 tự động, nhiều tầng
   Giá trị không đổi vẫn thông báo               KHÔNG thông báo

   👉 Signal = Observer + tự động đăng ký + tự động lan truyền nhiều tầng.

   AI ĐANG DÙNG:
     Vue 3        ref / computed / watchEffect
     Solid.js     createSignal / createMemo / createEffect
     Svelte 5     $state / $derived / $effect
     Angular 16+  signal / computed / effect
     Preact       @preact/signals
     MobX         observable / computed / autorun

   ⚠️ KHÔNG PHẢI React useState — React đi hướng khác: so sánh lại cây
      component và bắt bạn khai báo dependency array bằng tay.
      Đó là lý do React có useMemo/useCallback còn Solid thì không cần.`);
