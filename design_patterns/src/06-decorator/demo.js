/**
 * BÀI 06 — DECORATOR
 * Chạy: node src/06-decorator/demo.js
 */

const line = (t) => console.log("\n" + "=".repeat(62) + "\n" + t + "\n" + "=".repeat(62));
const nghi = (ms) => new Promise((r) => setTimeout(r, ms));

// ###########################################################################
// PHẦN 0 — ĐỐI TƯỢNG GỐC
// ###########################################################################

let soLanGoiApiThat = 0;

class DichVuAPI {
  async layNguoiDung(id) {
    soLanGoiApiThat++;
    await nghi(60); // giả lập độ trễ mạng
    if (id === 99) throw new Error("Lỗi mạng tạm thời");
    return { id, ten: `Người dùng ${id}`, email: `user${id}@example.com` };
  }
}

// ###########################################################################
// PHẦN 1 — VÌ SAO KHÔNG DÙNG KẾ THỪA
// ###########################################################################

line("1. VÌ SAO KHÔNG DÙNG KẾ THỪA");
console.log(`
   Muốn 5 tính năng: log, cache, retry, đo thời gian, giới hạn.
   Nếu dùng kế thừa để phủ hết mọi TỔ HỢP:

     DichVuCoCache
     DichVuCoRetry
     DichVuCoCacheVaRetry
     DichVuCoCacheVaRetryVaLog
     DichVuCoCacheVaLog
     ... 2^5 = 32 class

   Với 6 tính năng: 64 class. Kế thừa KHÔNG TỔ HỢP ĐƯỢC.
   Decorator biến 32 class thành 5 lớp bọc, xếp tự do.`);

// ###########################################################################
// PHẦN 2 — DECORATOR KIỂU CLASS (giống sách GoF)
// ###########################################################################

/** Lớp cơ sở: mặc định ủy thác mọi thứ cho object bên trong. */
class DichVuDecorator {
  constructor(boc) {
    this.boc = boc;
  }
  async layNguoiDung(id) {
    return this.boc.layNguoiDung(id);
  }
}

class CacheDecorator extends DichVuDecorator {
  constructor(boc) {
    super(boc);
    this.cache = new Map();
    this.trung = 0;
  }
  async layNguoiDung(id) {
    if (this.cache.has(id)) {
      this.trung++;
      return this.cache.get(id);
    }
    const kq = await this.boc.layNguoiDung(id);
    this.cache.set(id, kq); // ⚠️ chỉ tới đây khi KHÔNG có lỗi → không cache lỗi
    return kq;
  }
}

class RetryDecorator extends DichVuDecorator {
  constructor(boc, soLan = 3) {
    super(boc);
    this.soLan = soLan;
    this.soLanThuLai = 0;
  }
  async layNguoiDung(id) {
    let loiCuoi;
    for (let i = 1; i <= this.soLan; i++) {
      try {
        return await this.boc.layNguoiDung(id);
      } catch (e) {
        loiCuoi = e;
        this.soLanThuLai++;
        if (i < this.soLan) await nghi(10 * i); // backoff tăng dần
      }
    }
    throw loiCuoi;
  }
}

class LogDecorator extends DichVuDecorator {
  constructor(boc, nhan = "API") {
    super(boc);
    this.nhan = nhan;
  }
  async layNguoiDung(id) {
    const batDau = Date.now();
    console.log(`   → [${this.nhan}] gọi layNguoiDung(${id})`);
    try {
      const kq = await this.boc.layNguoiDung(id);
      console.log(`   ← [${this.nhan}] xong sau ${Date.now() - batDau}ms`);
      return kq;
    } catch (e) {
      console.log(`   ✖ [${this.nhan}] lỗi sau ${Date.now() - batDau}ms: ${e.message}`);
      throw e;
    }
  }
}

line("2. DECORATOR KIỂU CLASS — bọc như củ hành");

const cache = new CacheDecorator(new DichVuAPI());
const dichVu = new LogDecorator(new RetryDecorator(cache), "APP");

soLanGoiApiThat = 0;
console.log("Gọi layNguoiDung(7) ba lần liên tiếp:\n");
await dichVu.layNguoiDung(7);
await dichVu.layNguoiDung(7);
await dichVu.layNguoiDung(7);

console.log(`\n   API thật bị gọi: ${soLanGoiApiThat} lần (thay vì 3) ✅`);
console.log(`   Cache trúng: ${cache.trung} lần`);
console.log(`   👉 Chú ý dòng "xong sau ...ms": lần 2 và 3 gần như 0ms.`);

// ###########################################################################
// PHẦN 3 — CACHE KHÔNG ĐƯỢC LƯU KẾT QUẢ LỖI
// ###########################################################################

line("3. RETRY + CACHE: lỗi KHÔNG được vào cache");

soLanGoiApiThat = 0;
try {
  await dichVu.layNguoiDung(99); // id 99 luôn lỗi
} catch (e) {
  console.log(`\n   Kết cục: ${e.message}`);
}
console.log(`   API thật bị gọi ${soLanGoiApiThat} lần (retry 3 lần) ✅`);
console.log(`   Cache có lưu id 99 không? ${cache.cache.has(99)} ← phải là false ✅`);
console.log(`
   👉 Nếu cache lưu cả lỗi, người dùng sẽ thấy lỗi suốt thời gian TTL
      dù hệ thống đã hồi phục từ lâu. Đây là bug thật, rất hay gặp.`);

// ###########################################################################
// PHẦN 4 — THỨ TỰ BỌC QUAN TRỌNG
// ###########################################################################

line("4. THỨ TỰ BỌC QUYẾT ĐỊNH HÀNH VI");

console.log(`
   Cách A:  Log → Retry → Cache → API     (cache ở TRONG)
   Cách B:  Log → Cache → Retry → API     (cache ở NGOÀI)

   Khi cache TRÚNG:
     A: đi qua tầng retry rồi mới tới cache — thừa một tầng, vô hại
     B: dừng ngay ở cache — nhanh hơn một chút

   Khi API LỖI hẳn:
     A: retry 3 lần, không lưu cache  ✅
     B: retry 3 lần, không lưu cache  ✅ (giống nhau)

   👉 Quy tắc dễ nhớ, xếp từ NGOÀI vào TRONG:

        quan sát  →  điều tiết  →  tăng tốc  →  thực thi
        (Log)        (RateLimit)   (Cache)      (API thật)
                          ↑
                     Retry nằm quanh đây, tùy bạn muốn
                     retry TRƯỚC hay SAU khi tra cache

   Log luôn NGOÀI CÙNG, vì bạn muốn đo đúng thời gian NGƯỜI DÙNG phải chờ,
   kể cả thời gian nằm chờ giữa các lần retry.`);

// ###########################################################################
// PHẦN 5 — CÁCH RẤT JAVASCRIPT: HIGHER-ORDER FUNCTION
// ###########################################################################

line("5. CÁCH RẤT JAVASCRIPT — higher-order function");

const themCache = (fn) => {
  const bo = new Map();
  return async (...args) => {
    const khoa = JSON.stringify(args);
    if (bo.has(khoa)) return bo.get(khoa);
    const kq = await fn(...args); // lỗi thì throw ngay, không xuống dòng dưới
    bo.set(khoa, kq);
    return kq;
  };
};

const themRetry = (fn, soLan = 3) => async (...args) => {
  let loiCuoi;
  for (let i = 1; i <= soLan; i++) {
    try {
      return await fn(...args);
    } catch (e) {
      loiCuoi = e;
      if (i < soLan) await nghi(10 * i);
    }
  }
  throw loiCuoi;
};

const themLog = (fn, ten) => async (...args) => {
  const t = Date.now();
  const kq = await fn(...args);
  console.log(`   ← ${ten}(${args}) xong sau ${Date.now() - t}ms`);
  return kq;
};

const apiGoc = (id) => new DichVuAPI().layNguoiDung(id);
const layNguoiDung = themLog(themRetry(themCache(apiGoc)), "layNguoiDung");

soLanGoiApiThat = 0;
await layNguoiDung(1);
await layNguoiDung(1);
await layNguoiDung(2);
console.log(`\n   API thật bị gọi: ${soLanGoiApiThat} lần (id 1 và 2, mỗi cái 1 lần) ✅`);

console.log(`
   👉 Ba decorator = 20 dòng, thay cho 60 dòng class.
      Và tổ hợp tự do:  themLog(themCache(f))  hoặc  themCache(themLog(f))`);

// ###########################################################################
// PHẦN 6 — MỨC 3: PROXY — TRANG TRÍ MỌI PHƯƠNG THỨC CÙNG LÚC
// ###########################################################################

line("6. PROXY — trang trí MỌI phương thức chỉ bằng một đoạn code");

class KhoHang {
  async laySanPham(id) {
    await nghi(5);
    return { id, ten: "Áo thun" };
  }
  async layDanhMuc() {
    await nghi(5);
    return ["Áo", "Quần"];
  }
  async demTonKho(id) {
    await nghi(5);
    return 42;
  }
}

const themLogChoMoiHam = (obj, nhan) =>
  new Proxy(obj, {
    get(dich, ten) {
      const goc = dich[ten];
      if (typeof goc !== "function") return goc;
      return async (...args) => {
        const t = Date.now();
        const kq = await goc.apply(dich, args);
        console.log(`   ← [${nhan}] ${ten}(${args}) → ${Date.now() - t}ms`);
        return kq;
      };
    },
  });

const kho = themLogChoMoiHam(new KhoHang(), "KHO");
await kho.laySanPham(1);
await kho.layDanhMuc();
await kho.demTonKho(1);

console.log(`
   👉 Với class decorator, bạn phải viết lại CẢ BA phương thức.
      Với Proxy, một đoạn code phủ toàn bộ — kể cả phương thức
      được thêm vào sau này.

   ⚠️  Đánh đổi: khó debug hơn, và IDE không gợi ý được kiểu.`);

// ###########################################################################
// PHẦN 7 — BẠN ĐÃ DÙNG DECORATOR MÀ KHÔNG BIẾT
// ###########################################################################

line("7. DECORATOR NGOÀI ĐỜI THẬT");
console.log(`
   Express       app.use(morgan()).use(cors()).use(auth())
   React         withRouter(withTheme(MyComponent))
   Redux         applyMiddleware(thunk, logger)
   Node Streams  fs.createReadStream(f).pipe(gunzip()).pipe(parser())
   Python        @lru_cache  @retry  @timing

   Cả 5 thứ trên đều là Decorator. Học viên đã dùng chúng
   hàng ngày — hôm nay chỉ là đặt tên cho thứ họ đã quen.`);
