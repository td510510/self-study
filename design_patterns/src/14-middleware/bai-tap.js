/**
 * BÀI TẬP 14 — MIDDLEWARE
 * Chạy: node src/14-middleware/bai-tap.js
 */

const nghi = (ms) => new Promise((r) => setTimeout(r, ms));

// Nhật ký dùng để bộ test kiểm tra THỨ TỰ vào/ra
export const vet = [];
const ghi = (s) => vet.push(s);

// ###########################################################################
// 📝 TODO 1 — Lõi dây chuyền
//
//   taoDayChuyen([mw1, mw2, ...]) → async (ctx) => void
//
//   Mỗi middleware có dạng: async (ctx, tiep) => { ... }
//     - gọi await tiep()  → chạy tiếp phần còn lại
//     - KHÔNG gọi tiep()  → dừng dây chuyền
//
//   ⚠️ BẮT BUỘC: phát hiện middleware gọi tiep() HAI LẦN và ném lỗi.
//      Không có kiểm tra này, xử lý chính sẽ chạy 2 lần → tạo 2 đơn hàng.
// ###########################################################################

function taoDayChuyen(cacMiddleware) {
  // TODO
  return async (ctx) => {};
}

// ###########################################################################
// 📝 TODO 2 — Sáu middleware
//
//   batLoi              try/catch quanh tiep(); lỗi → ctx.res = {status, body}
//                       dùng e.status nếu có, không thì 500
//   doThoiGian          ghi "do:vao" trước, "do:ra" sau; gắn ctx.res.msThucThi
//   ghiLog              ghi "log:vao" / "log:ra"
//   xacThuc             không có ctx.req.headers.authorization
//                         → ctx.res = {status:401} và DỪNG
//                       có → ctx.nguoiDung = { ten, vaiTro }, đi tiếp
//                       (token "Bearer admin-an" → vaiTro "admin";
//                        token khác → vaiTro "user")
//   phanQuyen(vaiTro)   sai vai trò → 403 và DỪNG
//   gioiHanTanSuat(max) đếm theo ctx.nguoiDung.ten; vượt max → 429 và DỪNG
// ###########################################################################

const batLoi = async (ctx, tiep) => {
  // TODO
};

const doThoiGian = async (ctx, tiep) => {
  // TODO
};

const ghiLog = async (ctx, tiep) => {
  // TODO
};

const xacThuc = async (ctx, tiep) => {
  // TODO
};

const phanQuyen = (vaiTroCanCo) => async (ctx, tiep) => {
  // TODO
};

const gioiHanTanSuat = (max) => {
  // TODO — nhớ giữ bộ đếm trong closure
  return async (ctx, tiep) => {};
};

// ###########################################################################
// 📝 TODO 3 — TÌM VÀ SỬA LỖI: middleware dưới đây QUÊN await
// ###########################################################################

const nenPhanHoi = async (ctx, tiep) => {
  ghi("nen:vao");
  tiep(); // ← có vấn đề gì ở đây?
  ctx.res && (ctx.res.daNen = true);
  ghi("nen:ra");
};

// ###########################################################################
// XỬ LÝ CHÍNH — không cần sửa
// ###########################################################################
const xuLyChinh = async (ctx, tiep) => {
  await nghi(20);
  ghi("chinh");
  ctx.res = { status: 200, body: { maDon: "DH1001" } };
  await tiep();
};

const taoCtx = (token) => ({
  req: {
    method: "POST",
    duongDan: "/don-hang",
    headers: token ? { authorization: token } : {},
  },
});

// ###########################################################################
// BỘ KIỂM THỬ
// ###########################################################################
let dat = 0;
let tong = 0;
const ok = (ten, dieuKien, ghiChu = "") => {
  tong++;
  if (dieuKien) dat++;
  console.log(`${dieuKien ? "✅" : "❌"} ${ten}${ghiChu ? "\n     " + ghiChu : ""}`);
};

console.log("=== TEST 1: luồng thành công ===\n");
try {
  const app = taoDayChuyen([batLoi, doThoiGian, ghiLog, xacThuc, phanQuyen("admin"), xuLyChinh]);
  vet.length = 0;
  const ctx = taoCtx("Bearer admin-an");
  await app(ctx);

  ok("Trả về 200", ctx.res?.status === 200, JSON.stringify(ctx.res));
  ok("Có đo thời gian", typeof ctx.res?.msThucThi === "number", `msThucThi=${ctx.res?.msThucThi}`);
  ok("⭐ MÔ HÌNH CỦ HÀNH: thứ tự vào/ra đối xứng",
    vet.join(",") === "do:vao,log:vao,chinh,log:ra,do:ra", vet.join(" → "));
} catch (e) {
  tong += 3;
  console.log("❌ Chưa hoàn thành TODO 1-2 — " + e.message);
}

console.log("\n=== TEST 2: dây chuyền dừng giữa chừng ===\n");
try {
  const app = taoDayChuyen([batLoi, ghiLog, xacThuc, phanQuyen("admin"), xuLyChinh]);

  vet.length = 0;
  const ctx1 = taoCtx(null);
  await app(ctx1);
  ok("Không token → 401", ctx1.res?.status === 401);
  ok("Xử lý chính KHÔNG chạy", !vet.includes("chinh"), vet.join(" → "));
  ok("⭐ Nhưng phần SAU của ghiLog VẪN chạy", vet.includes("log:ra"), vet.join(" → "));

  const ctx2 = taoCtx("Bearer user-binh");
  await app(ctx2);
  ok("Sai vai trò → 403", ctx2.res?.status === 403);
} catch (e) {
  tong += 4;
  console.log("❌ " + e.message);
}

console.log("\n=== TEST 3: giới hạn tần suất ===\n");
try {
  const app = taoDayChuyen([batLoi, xacThuc, gioiHanTanSuat(2), xuLyChinh]);
  const kq = [];
  for (let i = 0; i < 4; i++) {
    const c = taoCtx("Bearer admin-an");
    await app(c);
    kq.push(c.res?.status);
  }
  ok("2 lần đầu OK, 2 lần sau bị chặn", kq.join(",") === "200,200,429,429", kq.join(","));
} catch (e) {
  tong++;
  console.log("❌ " + e.message);
}

console.log("\n=== TEST 4: bắt lỗi tập trung ===\n");
try {
  const nemLoi = async () => {
    const e = new Error("Database mất kết nối");
    e.status = 503;
    throw e;
  };

  const dung = taoDayChuyen([batLoi, ghiLog, nemLoi]);
  const c1 = taoCtx("Bearer admin-an");
  await dung(c1);
  ok("batLoi ngoài cùng → bắt được lỗi", c1.res?.status === 503, JSON.stringify(c1.res));

  // ⚠️ BẪY: đặt batLoi SAI CHỖ
  tong++;
  const sai = taoDayChuyen([ghiLog, nemLoi, batLoi]);
  try {
    await sai(taoCtx("Bearer admin-an"));
    console.log("❌ Đáng lẽ lỗi phải lọt ra ngoài");
  } catch (e) {
    dat++;
    console.log(`✅ ⭐ batLoi đặt sai chỗ → lỗi LỌT RA NGOÀI: "${e.message}"`);
    console.log("     (trong server thật, đây là lúc tiến trình Node có thể sập)");
  }
} catch (e) {
  tong += 1;
  console.log("❌ " + e.message);
}

console.log("\n=== TEST 5: chống gọi tiep() hai lần ===\n");
tong++;
try {
  const xau = async (ctx, tiep) => {
    await tiep();
    await tiep();
  };
  await taoDayChuyen([xau, xuLyChinh])(taoCtx("Bearer admin-an"));
  console.log("❌ Không phát hiện được — xử lý chính đã chạy 2 lần!");
} catch (e) {
  dat++;
  console.log("✅ Phát hiện được: " + e.message);
}

console.log("\n=== TEST 6: TODO 3 — middleware quên await ===\n");
try {
  vet.length = 0;
  const ctx = taoCtx("Bearer admin-an");
  await taoDayChuyen([nenPhanHoi, xuLyChinh])(ctx);
  await nghi(50);
  ok("⭐ nenPhanHoi nén được response (đã sửa await)", ctx.res?.daNen === true,
    `thứ tự: ${vet.join(" → ")}`);
} catch (e) {
  tong++;
  console.log("❌ " + e.message);
}

console.log(`\n───────────────\nKẾT QUẢ: ${dat}/${tong}\n`);

// ###########################################################################
// 📝 TODO 4 (NÂNG CAO) — chiKhi(dieuKien, middleware)
//
//   const chiApi = chiKhi((ctx) => ctx.req.duongDan.startsWith("/api"), xacThuc);
//   → middleware chỉ chạy khi điều kiện đúng; ngược lại đi thẳng tiếp.
//
//   Viết test của riêng bạn.
// ###########################################################################

// ###########################################################################
// 💭 CÂU HỎI THẢO LUẬN
//
//   a) Middleware phân tích body JSON 10MB nên đặt TRƯỚC hay SAU xacThuc?
//      Nêu hậu quả bảo mật của lựa chọn sai.
//      TRẢ LỜI: ...........................................................
//
//   b) ctx là object dùng chung cho cả dây chuyền. Nêu hai rủi ro của việc
//      các middleware tự do ghi vào ctx, và cách phòng.
//      TRẢ LỜI: ...........................................................
//
//   c) Middleware và Decorator (Bài 06) giống nhau gần hết. Khác biệt thật
//      sự nằm ở đâu?
//      TRẢ LỜI: ...........................................................
// ###########################################################################
