/**
 * LỜI GIẢI BÀI TẬP 17 — REACTIVE / SIGNAL
 * Chạy: node src/17-signal/loi-giai.js
 */

// ###########################################################################
// BA MẢNH GHÉP CỦA TOÀN BỘ HỆ THỐNG
// ###########################################################################

// MẢNH 1 — biến toàn cục: "effect nào đang chạy ngay lúc này?"
let dangChay = null;

// Hàng đợi cho batch(), TÁCH LÀM HAI (xem TODO 4)
let hangDoi = null;

// ###########################################################################
// TODO 1 — signal
// ###########################################################################
function signal(giaTriBanDau) {
  let giaTri = giaTriBanDau;
  const nguoiPhuThuoc = new Set();

  const doc = () => {
    // MẢNH 2 — chỗ "kỳ diệu": chỉ vì có ai đó ĐỌC giá trị này trong lúc
    // một effect đang chạy, quan hệ phụ thuộc được ghi nhận TỰ ĐỘNG.
    // Không cần khai báo tay, không cần mảng dependency.
    if (dangChay) {
      nguoiPhuThuoc.add(dangChay);
      dangChay.nguon.add(nguoiPhuThuoc); // để effect biết đường tự dọn
    }
    return giaTri;
  };

  doc.set = (moi) => {
    // Object.is: một dòng, nhưng cắt bỏ phần lớn công việc thừa
    if (Object.is(giaTri, moi)) return;
    giaTri = moi;
    for (const f of [...nguoiPhuThuoc]) {
      if (hangDoi) (f.laNoiBo ? hangDoi.noiBo : hangDoi.nguoiDung).add(f);
      else f();
    }
  };

  doc.soNguoiPhuThuoc = () => nguoiPhuThuoc.size;
  return doc;
}

// ###########################################################################
// TODO 2 — effect
// ###########################################################################
function effect(fn, { laNoiBo = false } = {}) {
  const chay = () => {
    // ⭐ DỌN PHỤ THUỘC CŨ trước khi chạy lại.
    // Nếu bỏ 2 dòng này, một effect có nhánh if sẽ mãi mãi bị đánh thức
    // bởi những signal mà nó không còn đọc tới nữa.
    for (const bo of chay.nguon) bo.delete(chay);
    chay.nguon.clear();

    // MẢNH 3 — đặt "chữ ký" của mình lên biến toàn cục rồi chạy.
    // Lưu lại giá trị trước đó để hỗ trợ effect lồng nhau.
    const truoc = dangChay;
    dangChay = chay;
    try {
      fn();
    } finally {
      dangChay = truoc; // finally: kể cả fn ném lỗi cũng phải trả lại
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

// ###########################################################################
// TODO 3 — computed = signal + effect nội bộ (có nhớ sẵn nhờ Object.is)
// ###########################################################################
function computed(fn) {
  const s = signal(undefined);
  let soLanTinh = 0;

  effect(
    () => {
      soLanTinh++;
      s.set(fn());
    },
    { laNoiBo: true } // effect của computed là "nội bộ" — quan trọng cho batch
  );

  const doc = () => s();
  doc.soLanTinh = () => soLanTinh;
  doc.soNguoiPhuThuoc = () => s.soNguoiPhuThuoc();
  return doc;
}

// ###########################################################################
// TODO 4 — batch
// ###########################################################################
function batch(fn) {
  if (hangDoi) return fn(); // đã ở trong một batch rồi

  hangDoi = { noiBo: new Set(), nguoiDung: new Set() };
  try {
    fn();
  } finally {
    // ⭐ HAI VÒNG, và THỨ TỰ giữa chúng mới là điều quan trọng:
    //   1. Chạy computed cho tới khi ỔN ĐỊNH
    //   2. Chỉ khi đó mới chạy effect người dùng, mỗi cái ĐÚNG MỘT LẦN
    //
    // Nếu trộn chung một hàng đợi, effect người dùng sẽ chạy khi các
    // computed còn nửa cũ nửa mới — đúng cái glitch mà batch sinh ra để tránh.
    let vong = 0;
    while (hangDoi.noiBo.size) {
      if (++vong > 100) throw new Error("Phụ thuộc vòng giữa các computed");
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
// KIỂM THỬ
// ###########################################################################
let dat = 0;
let tong_ = 0;
const ok = (ten, dieuKien, ghiChu = "") => {
  tong_++;
  if (dieuKien) dat++;
  console.log(`${dieuKien ? "✅" : "❌"} ${ten}${ghiChu ? "  (" + ghiChu + ")" : ""}`);
};

console.log("=== TEST 1: signal cơ bản ===\n");
const s1 = signal(5);
ok("Đọc được giá trị ban đầu", s1() === 5);
s1.set(10);
ok("Ghi rồi đọc lại được", s1() === 10);

console.log("\n=== TEST 2: effect tự động chạy lại ===\n");
const s2 = signal(1);
const thay = [];
effect(() => thay.push(s2()));
ok("Effect chạy ngay lần đầu", thay.length === 1 && thay[0] === 1);
s2.set(2);
s2.set(3);
ok("Effect chạy lại khi signal đổi", thay.join(",") === "1,2,3", thay.join(","));
s2.set(3);
ok("⭐ KHÔNG chạy lại khi giá trị không đổi", thay.length === 3, `${thay.length} lần`);

const s3 = signal(0);
const thay2 = [];
const dung = effect(() => thay2.push(s3()));
dung();
s3.set(99);
ok("Hàm dừng() hoạt động", thay2.length === 1, `${thay2.length} lần`);

console.log("\n=== TEST 3: computed ===\n");
const a3 = signal(2);
const b3 = signal(3);
const tong3 = computed(() => a3() + b3());
ok("computed tính đúng", tong3() === 5, String(tong3()));
a3.set(10);
ok("computed cập nhật khi nguồn đổi", tong3() === 13, String(tong3()));

const nhanDoi = computed(() => tong3() * 2);
ok("computed lồng computed", nhanDoi() === 26, String(nhanDoi()));
b3.set(0);
ok("Lan truyền qua nhiều tầng", nhanDoi() === 20, String(nhanDoi()));

const c3 = signal(1);
const memo = computed(() => c3() * 2);
memo();
memo();
memo();
ok("⭐ computed có NHỚ (đọc 3 lần không tính lại)", memo.soLanTinh() === 1,
  `tính ${memo.soLanTinh()} lần`);

console.log("\n=== TEST 4: ⭐ dọn phụ thuộc cũ ===\n");
const hien = signal(true);
const chiTiet = signal("A");
let soLanChay = 0;
effect(() => {
  soLanChay++;
  if (hien()) chiTiet();
});
ok("Ban đầu chiTiet có người theo dõi", chiTiet.soNguoiPhuThuoc() === 1);
hien.set(false);
ok("⭐ Nhánh không còn dùng → chiTiet KHÔNG còn người theo dõi",
  chiTiet.soNguoiPhuThuoc() === 0, `${chiTiet.soNguoiPhuThuoc()}`);
soLanChay = 0;
chiTiet.set("B");
ok("⭐ Đổi chiTiet không đánh thức effect nữa", soLanChay === 0, `${soLanChay} lần`);

hien.set(true);
ok("Bật lại nhánh → đăng ký lại tự động", chiTiet.soNguoiPhuThuoc() === 1);

console.log("\n=== TEST 5: ⭐ batch ===\n");
const a5 = signal(1);
const b5 = signal(2);
const tong5 = computed(() => a5() + b5());
let soLanVe = 0;
effect(() => {
  tong5();
  soLanVe++;
});

soLanVe = 0;
a5.set(10);
b5.set(20);
const khongBatch = soLanVe;

soLanVe = 0;
batch(() => {
  a5.set(100);
  b5.set(200);
});
ok("⭐ batch gom thành ĐÚNG MỘT lần chạy", soLanVe === 1,
  `không batch: ${khongBatch} lần | có batch: ${soLanVe} lần`);
ok("Giá trị cuối cùng đúng", tong5() === 300, String(tong5()));

console.log("\n=== TEST 6: giỏ hàng thực tế ===\n");
const soLuong = signal(2);
const donGia = signal(250_000);
const tamTinh = computed(() => soLuong() * donGia());
const phiShip = computed(() => (tamTinh() >= 500_000 ? 0 : 30_000));
const tongCong = computed(() => tamTinh() + phiShip());

ok("2 × 250k = 500k → freeship → tổng 500k", tongCong() === 500_000, String(tongCong()));
soLuong.set(1);
ok("1 × 250k = 250k → ship 30k → tổng 280k", tongCong() === 280_000, String(tongCong()));
donGia.set(600_000);
ok("1 × 600k → freeship → tổng 600k", tongCong() === 600_000, String(tongCong()));

// Chuỗi lan truyền sâu 4 tầng, gom trong một batch
const ve = [];
effect(() => ve.push(tongCong()));
ve.length = 0;
batch(() => {
  soLuong.set(3);
  donGia.set(100_000);
});
ok("⭐ Batch qua chuỗi 4 tầng: vẽ đúng 1 lần, giá trị đúng",
  ve.length === 1 && ve[0] === 330_000, `vẽ ${ve.length} lần, giá trị ${ve[0]}`);

console.log(`\n───────────────\nKẾT QUẢ: ${dat}/${tong_}\n`);

console.log(`═══════════════════════════════════════════════════════════════
💭 TRẢ LỜI CÂU HỎI THẢO LUẬN

a) Phát hiện phụ thuộc TỰ ĐỘNG (Vue/Solid) vs KHAI BÁO TAY (React)?

   TỰ ĐỘNG được:
     • Không bao giờ SAI. Bạn không thể quên một phụ thuộc, cũng không thể
       liệt kê thừa. Danh sách phụ thuộc luôn khớp chính xác với code.
     • Xử lý đúng nhánh động: effect có if sẽ tự đăng ký/hủy đăng ký theo
       nhánh đang chạy (xem TEST 4). Mảng dependency tĩnh không làm được —
       nó luôn phải liệt kê cả những thứ chỉ dùng trong một nhánh.
     • Không cần useMemo/useCallback. Đây là lý do Solid gần như không có
       khái niệm "tối ưu render".

   KHAI BÁO TAY được:
     • ĐỌC LÀ THẤY. Nhìn [a, b] biết ngay effect phụ thuộc gì, không cần
       chạy thử. Với tự động, bạn phải mô phỏng luồng thực thi trong đầu.
     • Kiểm tra tĩnh được: eslint exhaustive-deps cảnh báo lúc viết code.
     • Không có "ma thuật ngầm": không có biến toàn cục dangChay, không có
       hành vi phụ thuộc vào thứ tự đọc. Dễ hiểu hơn với người mới.
     • Không cần Proxy hay getter → hiệu năng đọc thuần túy nhanh hơn.

   📌 Đây là đánh đổi thật, không có bên nào thắng tuyệt đối:
      tự động đổi TÍNH TƯỜNG MINH lấy TÍNH ĐÚNG ĐẮN;
      thủ công đổi TÍNH ĐÚNG ĐẮN lấy TÍNH TƯỜNG MINH.

      Xu hướng hiện nay nghiêng về tự động (Angular 16+, Svelte 5, Vue,
      Solid, Preact) vì lỗi "quên dependency" quá phổ biến và quá tốn kém.

b) Signal chứa OBJECT thì sao?
   → Object.is so sánh THAM CHIẾU, không so sánh nội dung:

       s.set({a: 1});
       s.set({a: 1});   ← object MỚI, khác tham chiếu → vẫn thông báo

     Ngược lại, sửa TẠI CHỖ thì KHÔNG thông báo — nguy hiểm hơn nhiều:

       const o = s();
       o.a = 2;         ← nội dung đổi nhưng tham chiếu KHÔNG đổi
                        → không ai được báo, giao diện hiện số cũ

     Ba cách xử lý:
       1. Ưu tiên signal cho giá trị NGUYÊN THỦY (số, chuỗi, boolean).
          Thay vì signal({soLuong, donGia}), dùng hai signal riêng.
       2. Luôn thay bằng object mới: s.set({...s(), a: 2}) — và chấp nhận
          thông báo thừa khi nội dung thật ra không đổi.
       3. Dùng reactive sâu (Vue reactive() bọc Proxy đệ quy) — theo dõi
          được từng thuộc tính. Đó chính là Bài 08 — Proxy.

     📌 Đây là lý do Vue có CẢ ref() (nông, cho giá trị) lẫn reactive()
        (sâu, cho object). Không phải thừa — hai bài toán khác nhau.

c) effect() có được gọi s.set() không?
   → ĐƯỢC, và đôi khi cần (ví dụ đồng bộ vào localStorage). Nhưng có bẫy:

     ❌ VÒNG LẶP VÔ TẬN nếu ghi vào chính signal mình đọc:
          effect(() => dem.set(dem() + 1));
        → đọc dem (đăng ký) → ghi dem → tự đánh thức → chạy lại → mãi mãi.
        Trong lời giải này nó sẽ tràn ngăn xếp; các thư viện thật phát hiện
        và ném lỗi "Maximum recursive updates exceeded" (Vue) hoặc
        "Cyclic dependency" (Solid).

     ⚠️ NỬA VÒNG LẶP — tinh vi hơn, khó thấy hơn:
          effect(() => b.set(a() * 2));
          effect(() => a.set(b() / 2));
        Hai effect riêng lẻ trông vô hại, ghép lại thành vòng. Object.is
        cứu bạn khỏi lặp vô tận (giá trị hội tụ thì dừng), nhưng chỉ là
        may mắn, không phải thiết kế.

     📌 QUY TẮC:
        • Cần dẫn xuất giá trị → dùng computed, ĐỪNG dùng effect + set.
          computed sinh ra chính xác cho việc này và không thể tạo vòng.
        • effect chỉ dành cho TÁC DỤNG PHỤ RA BÊN NGOÀI: vẽ DOM, ghi
          localStorage, gọi API, in log.

        Phép thử một câu: nếu effect của bạn kết thúc bằng một lời gọi
        .set(), gần như chắc chắn nó phải là một computed.
═══════════════════════════════════════════════════════════════`);
