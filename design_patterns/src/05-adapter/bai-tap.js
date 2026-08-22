/**
 * BÀI TẬP 05 — ADAPTER
 * Chạy: node src/05-adapter/bai-tap.js
 *
 * Bối cảnh: app cần lưu file. Có 2 SDK với interface hoàn toàn khác nhau.
 * Nhiệm vụ: đưa cả hai về CÙNG một hợp đồng.
 */

// ###########################################################################
// HỢP ĐỒNG (TARGET) — thứ mà code của bạn muốn dùng
//
//   async luu(ten, noiDung)  → { ten, kichThuoc }
//   async doc(ten)           → string        | ném LoiLuuTru nếu không có
//   async xoa(ten)           → boolean       | ném LoiLuuTru nếu không có
//   async danhSach()         → string[]      (mảng tên file)
// ###########################################################################

class LoiLuuTru extends Error {
  constructor(thongDiep, { nhaCungCap, maLoiGoc } = {}) {
    super(thongDiep);
    this.name = "LoiLuuTru";
    this.nhaCungCap = nhaCungCap;
    this.maLoiGoc = maLoiGoc;
  }
}

// ###########################################################################
// ADAPTEE 1 — SDK Amazon S3 (giả lập)
// Đặc điểm: snake_case, dùng CALLBACK, lỗi là object { code, message }
// ⚠️ KHÔNG ĐƯỢC SỬA FILE NÀY TRONG THỰC TẾ — đây là thư viện bên thứ ba
// ###########################################################################
class SdkAmazonS3 {
  #bucket = new Map();

  put_object(params, callback) {
    setTimeout(() => {
      this.#bucket.set(params.key, params.body);
      callback(null, { e_tag: '"' + params.key.length + 'abc"', size_bytes: params.body.length });
    }, 5);
  }

  get_object(params, callback) {
    setTimeout(() => {
      if (!this.#bucket.has(params.key)) {
        return callback({ code: "NoSuchKey", message: "The specified key does not exist." });
      }
      callback(null, { body: this.#bucket.get(params.key) });
    }, 5);
  }

  delete_object(params, callback) {
    setTimeout(() => {
      if (!this.#bucket.has(params.key)) {
        return callback({ code: "NoSuchKey", message: "The specified key does not exist." });
      }
      this.#bucket.delete(params.key);
      callback(null, { deleted: true });
    }, 5);
  }

  list_objects(params, callback) {
    setTimeout(() => {
      callback(null, { contents: [...this.#bucket.keys()].map((k) => ({ key: k })) });
    }, 5);
  }
}

// ###########################################################################
// ADAPTEE 2 — SDK Google Drive (giả lập)
// Đặc điểm: Promise, camelCase, dữ liệu lồng trong .data, file có ID riêng
// ###########################################################################
class SdkGoogleDrive {
  #files = new Map(); // id -> { name, content }
  #nextId = 1;

  async filesCreate({ resource, media }) {
    const id = "gd_" + this.#nextId++;
    this.#files.set(id, { name: resource.name, content: media.body });
    return { data: { id, name: resource.name, size: String(media.body.length) } };
  }

  async filesList() {
    return {
      data: { files: [...this.#files].map(([id, f]) => ({ id, name: f.name })) },
    };
  }

  async filesGet({ fileId }) {
    if (!this.#files.has(fileId)) {
      const e = new Error("File not found: " + fileId);
      e.status = 404;
      throw e;
    }
    return { data: this.#files.get(fileId).content };
  }

  async filesDelete({ fileId }) {
    if (!this.#files.has(fileId)) {
      const e = new Error("File not found: " + fileId);
      e.status = 404;
      throw e;
    }
    this.#files.delete(fileId);
    return { data: {} };
  }
}

// ###########################################################################
// 📝 TODO 1 — Viết S3Adapter
//
//   Thách thức chính: SDK dùng CALLBACK, hợp đồng của ta dùng PROMISE.
//   Gợi ý: bọc bằng new Promise((resolve, reject) => sdk.put_object(..., cb))
//
//   Tham số của SDK: { bucket: "app-files", key: <tên file>, body: <nội dung> }
//
//   ⚠️ Lỗi { code: "NoSuchKey" } phải được dịch thành LoiLuuTru.
//      KHÔNG để lọt object lỗi gốc ra ngoài.
// ###########################################################################

class S3Adapter {
  constructor(sdk = new SdkAmazonS3()) {
    this.sdk = sdk;
    this.bucket = "app-files";
  }

  async luu(ten, noiDung) {
    // TODO
  }
  async doc(ten) {
    // TODO
  }
  async xoa(ten) {
    // TODO
  }
  async danhSach() {
    // TODO
  }
}

// ###########################################################################
// 📝 TODO 2 — Viết DriveAdapter
//
//   Thách thức chính: Drive định danh file bằng ID, còn hợp đồng của ta dùng TÊN.
//   → Adapter phải tự tra tên → ID (dùng filesList()).
//     Đây là ví dụ điển hình: adapter phải LÀM THÊM VIỆC để giữ đúng hợp đồng.
//
//   ⚠️ Lỗi có e.status === 404 phải dịch thành LoiLuuTru.
// ###########################################################################

class DriveAdapter {
  constructor(sdk = new SdkGoogleDrive()) {
    this.sdk = sdk;
  }

  async luu(ten, noiDung) {
    // TODO
  }
  async doc(ten) {
    // TODO
  }
  async xoa(ten) {
    // TODO
  }
  async danhSach() {
    // TODO
  }
}

// ###########################################################################
// 📝 TODO 3 — Viết saoLuu() MỘT LẦN, chạy đúng với MỌI cặp adapter
//
//   async function saoLuu(nguon, dich) → số file đã sao chép
//
//   Đây là bằng chứng cho thấy adapter làm đúng việc: hàm này không được
//   chứa bất kỳ chữ "s3" hay "drive" nào.
// ###########################################################################

async function saoLuu(nguon, dich) {
  // TODO
  return 0;
}

// ###########################################################################
// BỘ KIỂM THỬ
// ###########################################################################
let dat = 0;
let tong = 0;
const ok = (ten, dieuKien) => {
  tong++;
  if (dieuKien) dat++;
  console.log(`   ${dieuKien ? "✅" : "❌"} ${ten}`);
};

async function kiemThuHopDong(tenAdapter, kho) {
  console.log(`\n── Kiểm thử hợp đồng: ${tenAdapter} ──`);
  try {
    const kq = await kho.luu("ghi-chu.txt", "Xin chào thế giới");
    ok("luu() trả về { ten, kichThuoc }", kq?.ten === "ghi-chu.txt" && kq?.kichThuoc === 17);

    await kho.luu("bao-cao.csv", "a,b,c");
    const ds = await kho.danhSach();
    ok("danhSach() trả về mảng TÊN file", Array.isArray(ds) && ds.includes("ghi-chu.txt"));
    ok("danhSach() có đủ 2 file", ds?.length === 2);

    const noiDung = await kho.doc("ghi-chu.txt");
    ok("doc() trả về đúng nội dung", noiDung === "Xin chào thế giới");

    await kho.xoa("bao-cao.csv");
    ok("xoa() thật sự xóa", (await kho.danhSach()).length === 1);

    tong++;
    try {
      await kho.doc("khong-ton-tai.txt");
      console.log("   ❌ doc() file không tồn tại — đáng lẽ phải ném lỗi");
    } catch (e) {
      if (e instanceof LoiLuuTru) {
        dat++;
        console.log(`   ✅ Lỗi được DỊCH thành LoiLuuTru: "${e.message}"`);
      } else {
        console.log(`   ❌ Lọt lỗi gốc của SDK ra ngoài: ${e.name ?? "object"} — adapter thất bại`);
      }
    }
  } catch (e) {
    console.log("   ❌ Chưa hoàn thành adapter — " + e.message);
    tong += 3;
  }
}

console.log("=== KIỂM THỬ ADAPTER ===");
await kiemThuHopDong("S3Adapter", new S3Adapter());
await kiemThuHopDong("DriveAdapter", new DriveAdapter());

console.log("\n── Kiểm thử saoLuu() liên dịch vụ ──");
try {
  const s3 = new S3Adapter();
  const drive = new DriveAdapter();
  await s3.luu("a.txt", "nội dung A");
  await s3.luu("b.txt", "nội dung B");

  const so = await saoLuu(s3, drive);
  ok("saoLuu() báo đúng số file", so === 2);
  ok("File đã sang Drive", (await drive.danhSach()).length === 2);
  ok("Nội dung được giữ nguyên", (await drive.doc("a.txt")) === "nội dung A");

  // Chiều ngược lại cũng phải chạy được với CÙNG một hàm
  const s3Moi = new S3Adapter();
  await saoLuu(drive, s3Moi);
  ok("saoLuu() chạy được cả chiều ngược lại", (await s3Moi.danhSach()).length === 2);
} catch (e) {
  tong += 4;
  console.log("   ❌ Chưa làm TODO 3 — " + e.message);
}

console.log(`\n───────────────\nKẾT QUẢ: ${dat}/${tong}\n`);

// ###########################################################################
// 💭 CÂU HỎI THẢO LUẬN
//
//   a) DriveAdapter phải tra tên → ID trước mỗi thao tác, tức là gọi API 2 lần
//      thay vì 1. Đây có phải là dấu hiệu adapter viết sai không? Vì sao?
//      TRẢ LỜI: ...........................................................
//
//   b) Nếu S3 hỗ trợ upload file 5GB còn Drive giới hạn 100MB, hợp đồng chung
//      nên xử lý thế nào? (gợi ý: có 3 hướng — mẫu số chung nhỏ nhất, khai báo
//      khả năng, hay ném lỗi rõ ràng?)
//      TRẢ LỜI: ...........................................................
//
//   c) Hàm saoLuu() của bạn có chứa chữ "s3" hay "drive" không?
//      Nếu có, adapter chưa đạt. Vì sao đó là tiêu chí quan trọng?
//      TRẢ LỜI: ...........................................................
// ###########################################################################
