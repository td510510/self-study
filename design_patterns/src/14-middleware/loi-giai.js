/**
 * LỜI GIẢI BÀI TẬP 14 — MIDDLEWARE
 * Chạy: node src/14-middleware/loi-giai.js
 */

const nghi = (ms) => new Promise((r) => setTimeout(r, ms));
const vet = [];
const ghi = (s) => vet.push(s);

// ###########################################################################
// TODO 1 — Lõi (gần như chính xác là koa-compose)
// ###########################################################################
function taoDayChuyen(cacMiddleware) {
  return function chay(ctx) {
    let daGoi = -1;
    const buoc = async (n) => {
      // ⚠️ 2 dòng này phòng bug rất khó lần: middleware gọi tiep() hai lần
      // → toàn bộ phần sau chạy 2 lần → tạo 2 đơn hàng, trừ tiền 2 lần.
      if (n <= daGoi) throw new Error("tiep() bị gọi nhiều lần trong một middleware");
      daGoi = n;

      const mw = cacMiddleware[n];
      if (!mw) return;
      await mw(ctx, () => buoc(n + 1));
    };
    return buoc(0);
  };
}

// ###########################################################################
// TODO 2 — Sáu middleware
// ###########################################################################

const batLoi = async (ctx, tiep) => {
  try {
    await tiep();
  } catch (e) {
    ctx.res = { status: e.status ?? 500, body: e.message };
  }
};

const doThoiGian = async (ctx, tiep) => {
  const t = Date.now();
  ghi("do:vao");
  await tiep();
  // Chạy SAU khi toàn bộ phần trong đã xong → lúc này ctx.res đã có
  if (ctx.res) ctx.res.msThucThi = Date.now() - t;
  ghi("do:ra");
};

const ghiLog = async (ctx, tiep) => {
  ghi("log:vao");
  await tiep();
  ghi("log:ra");
};

const xacThuc = async (ctx, tiep) => {
  const token = ctx.req.headers?.authorization;
  if (!token) {
    ctx.res = { status: 401, body: "Chưa đăng nhập" };
    return; // ← không gọi tiep() → DỪNG dây chuyền
  }
  const ten = token.replace("Bearer ", "");
  ctx.nguoiDung = { ten, vaiTro: ten.startsWith("admin") ? "admin" : "user" };
  await tiep();
};

const phanQuyen = (vaiTroCanCo) => async (ctx, tiep) => {
  if (ctx.nguoiDung?.vaiTro !== vaiTroCanCo) {
    ctx.res = { status: 403, body: `Cần quyền "${vaiTroCanCo}"` };
    return;
  }
  await tiep();
};

const gioiHanTanSuat = (max) => {
  const dem = new Map(); // giữ trong closure — mỗi middleware một bộ đếm riêng
  return async (ctx, tiep) => {
    const khoa = ctx.nguoiDung?.ten ?? "khách";
    const soLan = (dem.get(khoa) ?? 0) + 1;
    dem.set(khoa, soLan);
    if (soLan > max) {
      ctx.res = { status: 429, body: "Quá nhiều yêu cầu" };
      return;
    }
    await tiep();
  };
};

// ###########################################################################
// TODO 3 — ĐÃ SỬA: thêm await
// ###########################################################################
const nenPhanHoi = async (ctx, tiep) => {
  ghi("nen:vao");
  await tiep(); // ✅ có await → phần dưới chỉ chạy khi ctx.res đã sẵn sàng
  if (ctx.res) ctx.res.daNen = true;
  ghi("nen:ra");
};

// ###########################################################################
// TODO 4 — chiKhi()
// ###########################################################################
const chiKhi = (dieuKien, middleware) => async (ctx, tiep) => {
  if (dieuKien(ctx)) return middleware(ctx, tiep);
  return tiep(); // không thỏa điều kiện → đi thẳng, coi như middleware trong suốt
};

const xuLyChinh = async (ctx, tiep) => {
  await nghi(20);
  ghi("chinh");
  ctx.res = { status: 200, body: { maDon: "DH1001" } };
  await tiep();
};

const taoCtx = (token, duongDan = "/don-hang") => ({
  req: { method: "POST", duongDan, headers: token ? { authorization: token } : {} },
});

// ###########################################################################
// KIỂM THỬ
// ###########################################################################
let dat = 0;
let tong = 0;
const ok = (ten, dieuKien, ghiChu = "") => {
  tong++;
  if (dieuKien) dat++;
  console.log(`${dieuKien ? "✅" : "❌"} ${ten}${ghiChu ? "\n     " + ghiChu : ""}`);
};

console.log("=== TEST 1: luồng thành công ===\n");
const app1 = taoDayChuyen([batLoi, doThoiGian, ghiLog, xacThuc, phanQuyen("admin"), xuLyChinh]);
vet.length = 0;
const ctx1 = taoCtx("Bearer admin-an");
await app1(ctx1);
ok("Trả về 200", ctx1.res.status === 200);
ok("Có đo thời gian", typeof ctx1.res.msThucThi === "number", `msThucThi=${ctx1.res.msThucThi}`);
ok("⭐ MÔ HÌNH CỦ HÀNH: thứ tự vào/ra đối xứng",
  vet.join(",") === "do:vao,log:vao,chinh,log:ra,do:ra", vet.join(" → "));

console.log("\n=== TEST 2: dây chuyền dừng giữa chừng ===\n");
const app2 = taoDayChuyen([batLoi, ghiLog, xacThuc, phanQuyen("admin"), xuLyChinh]);
vet.length = 0;
const ctx2 = taoCtx(null);
await app2(ctx2);
ok("Không token → 401", ctx2.res.status === 401);
ok("Xử lý chính KHÔNG chạy", !vet.includes("chinh"), vet.join(" → "));
ok("⭐ Nhưng phần SAU của ghiLog VẪN chạy", vet.includes("log:ra"), vet.join(" → "));

const ctx3 = taoCtx("Bearer user-binh");
await app2(ctx3);
ok("Sai vai trò → 403", ctx3.res.status === 403);

console.log("\n=== TEST 3: giới hạn tần suất ===\n");
const app3 = taoDayChuyen([batLoi, xacThuc, gioiHanTanSuat(2), xuLyChinh]);
const kq = [];
for (let i = 0; i < 4; i++) {
  const c = taoCtx("Bearer admin-an");
  await app3(c);
  kq.push(c.res.status);
}
ok("2 lần đầu OK, 2 lần sau bị chặn", kq.join(",") === "200,200,429,429", kq.join(","));

console.log("\n=== TEST 4: bắt lỗi tập trung ===\n");
const nemLoi = async () => {
  const e = new Error("Database mất kết nối");
  e.status = 503;
  throw e;
};

const cDung = taoCtx("Bearer admin-an");
await taoDayChuyen([batLoi, ghiLog, nemLoi])(cDung);
ok("batLoi ngoài cùng → bắt được lỗi", cDung.res.status === 503, JSON.stringify(cDung.res));

tong++;
try {
  await taoDayChuyen([ghiLog, nemLoi, batLoi])(taoCtx("Bearer admin-an"));
  console.log("❌ Đáng lẽ lỗi phải lọt ra ngoài");
} catch (e) {
  dat++;
  console.log(`✅ ⭐ batLoi đặt sai chỗ → lỗi LỌT RA NGOÀI: "${e.message}"`);
  console.log("     (trong server thật, đây là lúc tiến trình Node có thể sập)");
}

console.log("\n=== TEST 5: chống gọi tiep() hai lần ===\n");
tong++;
try {
  const xau = async (ctx, tiep) => {
    await tiep();
    await tiep();
  };
  await taoDayChuyen([xau, xuLyChinh])(taoCtx("Bearer admin-an"));
  console.log("❌ Không phát hiện được!");
} catch (e) {
  dat++;
  console.log("✅ Phát hiện được: " + e.message);
}

console.log("\n=== TEST 6: TODO 3 — đã sửa await ===\n");
vet.length = 0;
const ctx6 = taoCtx("Bearer admin-an");
await taoDayChuyen([nenPhanHoi, xuLyChinh])(ctx6);
ok("⭐ nenPhanHoi nén được response", ctx6.res.daNen === true,
  `thứ tự: ${vet.join(" → ")}  (nen:ra phải NẰM SAU chinh)`);

console.log("\n=== TEST 7: TODO 4 — chiKhi() ===\n");
const appCoDieuKien = taoDayChuyen([
  batLoi,
  chiKhi((ctx) => ctx.req.duongDan.startsWith("/api"), xacThuc),
  xuLyChinh,
]);

const cCong = taoCtx(null, "/trang-chu"); // route công khai, không cần token
await appCoDieuKien(cCong);
ok("Route công khai: không cần token", cCong.res.status === 200);

const cApi = taoCtx(null, "/api/don-hang"); // route API, bắt buộc token
await appCoDieuKien(cApi);
ok("Route /api: bắt buộc token", cApi.res.status === 401);

console.log(`\n───────────────\nKẾT QUẢ: ${dat}/${tong}\n`);

console.log(`═══════════════════════════════════════════════════════════════
💭 TRẢ LỜI CÂU HỎI THẢO LUẬN

a) Parse body 10MB — đặt TRƯỚC hay SAU xacThuc?
   → SAU. Luôn luôn SAU.

     Nếu đặt TRƯỚC, kẻ tấn công KHÔNG CẦN tài khoản vẫn bắt server bạn:
       • đọc 10MB từ mạng
       • cấp phát 10MB bộ nhớ
       • chạy JSON.parse (tốn CPU, khóa luồng chính của Node)
     rồi mới bị từ chối 401. Gửi 1000 request song song là server hết RAM.

     Đây là một dạng tấn công từ chối dịch vụ rất rẻ tiền để thực hiện.

     📌 NGUYÊN TẮC CHUNG cho thứ tự middleware:
        Việc RẺ và có thể TỪ CHỐI thì đặt càng sớm càng tốt.
        Việc ĐẮT thì đặt càng muộn càng tốt.

        Thứ tự khuyến nghị:
          batLoi → đo thời gian → log → rate limit theo IP →
          xác thực → phân quyền → parse body → validate → xử lý chính

        Chú ý rate limit theo IP đứng TRƯỚC xác thực (vì xác thực cũng tốn
        chi phí: giải mã JWT, truy vấn DB), còn rate limit theo NGƯỜI DÙNG
        thì phải đứng SAU (vì cần biết người dùng là ai).

b) Rủi ro của việc middleware tự do ghi vào ctx:
   1. ĐỤNG TÊN: hai middleware cùng ghi ctx.user với cấu trúc khác nhau.
      Cái sau ghi đè cái trước, và middleware thứ ba đọc nhầm hình dạng.
      → Phòng: đặt tên có tiền tố (ctx.auth.user, ctx.rateLimit.remaining),
        hoặc dùng Symbol làm khóa cho dữ liệu nội bộ.

   2. PHỤ THUỘC NGẦM: xuLyChinh đọc ctx.nguoiDung, nhưng không có gì trong
      code nói rằng nó CẦN xacThuc chạy trước. Ai đó sắp xếp lại thứ tự
      hoặc bỏ xacThuc khỏi một route → ctx.nguoiDung là undefined, và lỗi
      hiện ra ở một nơi hoàn toàn khác.
      → Phòng: kiểm tra ngay đầu middleware:
          if (!ctx.nguoiDung) throw new Error("xuLyChinh cần xacThuc chạy trước");
        Ghi rõ trong tài liệu middleware nào ĐỌC/GHI trường nào.
        Với TypeScript, có thể mô tả bằng kiểu để trình biên dịch bắt lỗi.

   3. (bonus) RÒ RỈ DỮ LIỆU: ctx được dùng lại giữa các request do lập
      trình viên vô ý dùng object dùng chung → dữ liệu người này lọt sang
      người kia. Luôn tạo ctx MỚI cho mỗi request.

c) Middleware khác Decorator ở đâu?
   Giống: cả hai đều bọc, đều chạy code trước/sau, đều xếp chồng.

   Khác ở BA điểm:

   1. QUYỀN CHẤM DỨT: middleware được quyền KHÔNG gọi tiep() để dừng cả
      dây chuyền. Decorator thì (theo quy ước) luôn phải gọi hàm nó bọc —
      một decorator "nuốt" lời gọi là đã phá vỡ hợp đồng.

   2. XÂU CHUỖI ĐỘNG: middleware là một MẢNG, dựng lúc chạy, thêm bớt theo
      route/cấu hình. Decorator thường được ghép cứng lúc viết code.

   3. NGỮ CẢNH DÙNG CHUNG: middleware truyền một ctx duy nhất đi suốt dây
      chuyền và các mắt xích giao tiếp qua đó. Decorator giữ nguyên chữ ký
      hàm gốc, không có kênh phụ.

   📌 Nói ngắn: Middleware = Chain of Responsibility + Decorator, cộng
      thêm một ngữ cảnh dùng chung. Nó không phải pattern GoF thứ 24 —
      nó là sự kết hợp thực dụng mà cộng đồng web đặt tên cho.
═══════════════════════════════════════════════════════════════`);
