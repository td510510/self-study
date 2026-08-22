/**
 * BÀI 14 — MIDDLEWARE / CHAIN OF RESPONSIBILITY
 * Chạy: node src/14-middleware/demo.js
 */

const line = (t) => console.log("\n" + "=".repeat(62) + "\n" + t + "\n" + "=".repeat(62));
const nghi = (ms) => new Promise((r) => setTimeout(r, ms));

// ###########################################################################
// PHẦN 1 — LÕI: 10 DÒNG (gần như chính xác là koa-compose)
// ###########################################################################

function taoDayChuyen(cacMiddleware) {
  return function chay(ctx) {
    let daGoi = -1;
    const buoc = async (n) => {
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
// PHẦN 2 — CÁC MIDDLEWARE
// ###########################################################################

const vet = [];
const ghi = (s) => {
  vet.push(s);
  console.log("      " + s);
};

/** NGOÀI CÙNG: bắt mọi lỗi của toàn dây chuyền */
const batLoi = async (ctx, tiep) => {
  try {
    await tiep();
  } catch (e) {
    ghi(`💥 batLoi: bắt được "${e.message}"`);
    ctx.res = { status: e.status ?? 500, body: e.message };
  }
};

const doThoiGian = async (ctx, tiep) => {
  const t = Date.now();
  ghi("⏱️  doThoiGian: BẮT ĐẦU");
  await tiep(); // toàn bộ phần còn lại chạy ở đây
  ghi(`⏱️  doThoiGian: KẾT THÚC (${Date.now() - t}ms)`);
};

const ghiLog = async (ctx, tiep) => {
  ghi(`📝 ghiLog: → ${ctx.req.method} ${ctx.req.duongDan}`);
  await tiep();
  ghi(`📝 ghiLog: ← ${ctx.res?.status ?? "?"}`);
};

const xacThuc = async (ctx, tiep) => {
  const token = ctx.req.headers?.authorization;
  if (!token) {
    ghi("🔑 xacThuc: KHÔNG có token → DỪNG DÂY CHUYỀN");
    ctx.res = { status: 401, body: "Chưa đăng nhập" };
    return; // ← không gọi tiep() → mọi thứ phía sau KHÔNG chạy
  }
  ctx.nguoiDung = { ten: token.replace("Bearer ", ""), vaiTro: token.includes("admin") ? "admin" : "user" };
  ghi(`🔑 xacThuc: OK — ${ctx.nguoiDung.ten} (${ctx.nguoiDung.vaiTro})`);
  await tiep();
};

const phanQuyen = (vaiTroCanCo) => async (ctx, tiep) => {
  if (ctx.nguoiDung?.vaiTro !== vaiTroCanCo) {
    ghi(`🛡️  phanQuyen: cần "${vaiTroCanCo}" → DỪNG`);
    ctx.res = { status: 403, body: "Không đủ quyền" };
    return;
  }
  ghi("🛡️  phanQuyen: OK");
  await tiep();
};

const gioiHanTanSuat = (max) => {
  const dem = new Map();
  return async (ctx, tiep) => {
    const khoa = ctx.nguoiDung?.ten ?? "khách";
    const soLan = (dem.get(khoa) ?? 0) + 1;
    dem.set(khoa, soLan);
    if (soLan > max) {
      ghi(`🚦 gioiHanTanSuat: ${khoa} vượt ${max} lượt → DỪNG`);
      ctx.res = { status: 429, body: "Quá nhiều yêu cầu" };
      return;
    }
    ghi(`🚦 gioiHanTanSuat: ${soLan}/${max}`);
    await tiep();
  };
};

const xuLyChinh = async (ctx, tiep) => {
  await nghi(20);
  ghi("⚙️  XỬ LÝ CHÍNH: tạo đơn hàng");
  ctx.res = { status: 200, body: { maDon: "DH1001" } };
  await tiep();
};

// ###########################################################################
line("1. LUỒNG THÀNH CÔNG — chú ý MÔ HÌNH CỦ HÀNH");

const app = taoDayChuyen([
  batLoi, // ngoài cùng
  doThoiGian,
  ghiLog,
  xacThuc,
  phanQuyen("admin"),
  gioiHanTanSuat(2),
  xuLyChinh, // trong cùng
]);

const taoReq = (token) => ({
  req: { method: "POST", duongDan: "/don-hang", headers: token ? { authorization: token } : {} },
});

let ctx = taoReq("Bearer admin-an");
console.log();
await app(ctx);
console.log("\n   Response:", ctx.res);

console.log(`
   👉 Đọc lại thứ tự output ở trên:

       doThoiGian  BẮT ĐẦU     ┐
         ghiLog    →           │
           xacThuc OK          │  vào
             phanQuyen OK      │
               rate limit      │
                 ⚙️ XỬ LÝ      ← lõi
         ghiLog    ←           │  ra (ngược thứ tự)
       doThoiGian  KẾT THÚC    ┘

   Mỗi middleware BỌC TRỌN phần còn lại của dây chuyền.
   Đó là lý do gọi là "mô hình củ hành".`);

// ###########################################################################
line("2. DÂY CHUYỀN DỪNG GIỮA CHỪNG");

console.log("\n── Không có token ──");
vet.length = 0;
ctx = taoReq(null);
await app(ctx);
console.log("   Response:", ctx.res);
console.log(`   👉 xacThuc không gọi tiep() → phanQuyen, rate limit, xử lý chính KHÔNG chạy`);
console.log(`      Nhưng phần "SAU" của ghiLog và doThoiGian VẪN chạy ✅`);

console.log("\n── Có token nhưng không phải admin ──");
ctx = taoReq("Bearer user-binh");
await app(ctx);
console.log("   Response:", ctx.res);

// ###########################################################################
line("3. BẮT LỖI TẬP TRUNG");

const appLoi = taoDayChuyen([
  batLoi,
  ghiLog,
  async (ctx, tiep) => {
    const e = new Error("Database mất kết nối");
    e.status = 503;
    throw e;
  },
]);

console.log();
ctx = taoReq("Bearer admin-an");
await appLoi(ctx);
console.log("\n   Response:", ctx.res);
console.log(`
   👉 MỘT try/catch duy nhất ở middleware ngoài cùng thay cho 40 cái
      rải rác trong 40 endpoint.

   ⚠️  Nếu đặt batLoi SAU middleware ném lỗi, lỗi sẽ bay ra ngoài
      không ai bắt → tiến trình Node có thể sập. THỨ TỰ QUAN TRỌNG.`);

// ###########################################################################
line("4. ⚠️  BẪY 1 — QUÊN await tiep()");

const mwQuenAwait = async (ctx, tiep) => {
  ghi("A: trước");
  tiep(); // ❌ THIẾU await
  ghi(`A: sau  → ctx.duLieu = ${ctx.duLieu}  ← chạy QUÁ SỚM, B chưa xong!`);
};
const mwCham = async (ctx, tiep) => {
  ghi("B: bắt đầu (mất 30ms)");
  await nghi(30);
  ghi("B: xong");
  ctx.duLieu = "sẵn sàng";
  await tiep();
};

console.log("\n   SAI (quên await):");
ctx = { req: {} };
vet.length = 0;
await taoDayChuyen([mwQuenAwait, mwCham])(ctx);
await nghi(60); // chờ B chạy xong để thấy thứ tự thật
console.log(`
      Thứ tự ĐÚNG phải là:  A trước → B bắt đầu → B xong → A sau
      Thứ tự THỰC TẾ ở trên: A trước → B bắt đầu → A sau → B xong  ❌`);
console.log(`
   👉 Hậu quả thật: response được gửi đi khi dữ liệu chưa sẵn sàng.
      Tệ hơn, đôi khi nó VẪN CHẠY ĐÚNG (khi phần trong nhanh) — nên bug
      chỉ xuất hiện khi tải cao, đúng lúc bạn không muốn nhất.`);

// ###########################################################################
line("5. ⚠️  BẪY 2 — GỌI tiep() HAI LẦN");

const mwGoiHaiLan = async (ctx, tiep) => {
  await tiep();
  await tiep(); // ❌
};

try {
  await taoDayChuyen([mwGoiHaiLan, xuLyChinh])({ req: {} });
} catch (e) {
  console.log("\n   ✅ Lõi phát hiện được: " + e.message);
}
console.log(`
   👉 Không có kiểm tra này, xuLyChinh sẽ chạy HAI lần → tạo hai đơn hàng,
      trừ tiền hai lần. Chỉ 2 dòng code trong lõi để phòng.`);

// ###########################################################################
line("6. BẠN ĐÃ DÙNG MIDDLEWARE Ở ĐÂU");
console.log(`
   Express     app.use((req, res, next) => ...)
   Koa         app.use(async (ctx, next) => ...)    ← chính là mô hình này
   Redux       store => next => action => ...
   Axios       interceptors.request / interceptors.response
   Webpack     chuỗi loader
   DOM         sự kiện nổi bọt + stopPropagation()

   👉 Lõi taoDayChuyen() ở đầu file này chỉ 10 dòng, và nó gần như
      chính xác là koa-compose — thư viện chạy trong hàng triệu server.`);
