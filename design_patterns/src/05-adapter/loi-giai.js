/**
 * LỜI GIẢI BÀI TẬP 05 — ADAPTER
 * Chạy: node src/05-adapter/loi-giai.js
 */

class LoiLuuTru extends Error {
  constructor(thongDiep, { nhaCungCap, maLoiGoc } = {}) {
    super(thongDiep);
    this.name = "LoiLuuTru";
    this.nhaCungCap = nhaCungCap;
    this.maLoiGoc = maLoiGoc;
  }
}

// ###########################################################################
// CÁC ADAPTEE (giữ nguyên như đề bài)
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

class SdkGoogleDrive {
  #files = new Map();
  #nextId = 1;
  async filesCreate({ resource, media }) {
    const id = "gd_" + this.#nextId++;
    this.#files.set(id, { name: resource.name, content: media.body });
    return { data: { id, name: resource.name, size: String(media.body.length) } };
  }
  async filesList() {
    return { data: { files: [...this.#files].map(([id, f]) => ({ id, name: f.name })) } };
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
// TODO 1 — S3Adapter: dịch CALLBACK → PROMISE
// ###########################################################################
class S3Adapter {
  constructor(sdk = new SdkAmazonS3()) {
    this.sdk = sdk;
    this.bucket = "app-files";
  }

  /**
   * Hàm trợ giúp: bọc một hàm callback-style thành Promise.
   * Đây là "adapter trong adapter" — dịch cả MÔ HÌNH BẤT ĐỒNG BỘ,
   * không chỉ dịch tên hàm.
   */
  #goi(tenHam, params) {
    return new Promise((resolve, reject) => {
      this.sdk[tenHam](params, (loi, kq) => {
        if (loi) {
          // DỊCH LỖI ngay tại biên giới — không để object lỗi lạ đi sâu vào app
          return reject(
            new LoiLuuTru(
              loi.code === "NoSuchKey"
                ? `Không tìm thấy file: ${params.key}`
                : `Lỗi S3: ${loi.message}`,
              { nhaCungCap: "s3", maLoiGoc: loi.code }
            )
          );
        }
        resolve(kq);
      });
    });
  }

  async luu(ten, noiDung) {
    const kq = await this.#goi("put_object", { bucket: this.bucket, key: ten, body: noiDung });
    return { ten, kichThuoc: kq.size_bytes }; // ánh xạ về object CỦA TA
  }

  async doc(ten) {
    const kq = await this.#goi("get_object", { bucket: this.bucket, key: ten });
    return kq.body;
  }

  async xoa(ten) {
    await this.#goi("delete_object", { bucket: this.bucket, key: ten });
    return true;
  }

  async danhSach() {
    const kq = await this.#goi("list_objects", { bucket: this.bucket });
    return kq.contents.map((o) => o.key); // dịch [{key}] → [string]
  }
}

// ###########################################################################
// TODO 2 — DriveAdapter: dịch TÊN ⇄ ID
// ###########################################################################
class DriveAdapter {
  constructor(sdk = new SdkGoogleDrive()) {
    this.sdk = sdk;
  }

  /** Drive định danh bằng ID, hợp đồng của ta dùng TÊN → adapter phải tự tra. */
  async #timId(ten) {
    const kq = await this.sdk.filesList();
    const file = kq.data.files.find((f) => f.name === ten);
    if (!file) {
      throw new LoiLuuTru(`Không tìm thấy file: ${ten}`, { nhaCungCap: "drive", maLoiGoc: 404 });
    }
    return file.id;
  }

  #dichLoi(e, ten) {
    if (e instanceof LoiLuuTru) return e;
    return new LoiLuuTru(
      e.status === 404 ? `Không tìm thấy file: ${ten}` : `Lỗi Google Drive: ${e.message}`,
      { nhaCungCap: "drive", maLoiGoc: e.status }
    );
  }

  async luu(ten, noiDung) {
    try {
      const kq = await this.sdk.filesCreate({
        resource: { name: ten },
        media: { body: noiDung },
      });
      return { ten: kq.data.name, kichThuoc: Number(kq.data.size) }; // size là chuỗi → đổi kiểu
    } catch (e) {
      throw this.#dichLoi(e, ten);
    }
  }

  async doc(ten) {
    try {
      const id = await this.#timId(ten);
      const kq = await this.sdk.filesGet({ fileId: id });
      return kq.data;
    } catch (e) {
      throw this.#dichLoi(e, ten);
    }
  }

  async xoa(ten) {
    try {
      const id = await this.#timId(ten);
      await this.sdk.filesDelete({ fileId: id });
      return true;
    } catch (e) {
      throw this.#dichLoi(e, ten);
    }
  }

  async danhSach() {
    const kq = await this.sdk.filesList();
    return kq.data.files.map((f) => f.name);
  }
}

// ###########################################################################
// TODO 3 — saoLuu(): viết MỘT LẦN, chạy với MỌI cặp adapter
// Chú ý: không có chữ "s3" hay "drive" nào trong hàm này.
// ###########################################################################
async function saoLuu(nguon, dich) {
  const danhSach = await nguon.danhSach();
  for (const ten of danhSach) {
    const noiDung = await nguon.doc(ten);
    await dich.luu(ten, noiDung);
  }
  return danhSach.length;
}

// ###########################################################################
// KIỂM THỬ
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
  const kq = await kho.luu("ghi-chu.txt", "Xin chào thế giới");
  ok("luu() trả về { ten, kichThuoc }", kq.ten === "ghi-chu.txt" && kq.kichThuoc === 17);

  await kho.luu("bao-cao.csv", "a,b,c");
  const ds = await kho.danhSach();
  ok("danhSach() trả về mảng TÊN file", Array.isArray(ds) && ds.includes("ghi-chu.txt"));
  ok("danhSach() có đủ 2 file", ds.length === 2);

  ok("doc() trả về đúng nội dung", (await kho.doc("ghi-chu.txt")) === "Xin chào thế giới");

  await kho.xoa("bao-cao.csv");
  ok("xoa() thật sự xóa", (await kho.danhSach()).length === 1);

  tong++;
  try {
    await kho.doc("khong-ton-tai.txt");
    console.log("   ❌ đáng lẽ phải ném lỗi");
  } catch (e) {
    if (e instanceof LoiLuuTru) {
      dat++;
      console.log(`   ✅ Lỗi được DỊCH thành LoiLuuTru: "${e.message}" (gốc: ${e.maLoiGoc})`);
    } else {
      console.log("   ❌ Lọt lỗi gốc của SDK ra ngoài — adapter thất bại");
    }
  }
}

console.log("=== KIỂM THỬ ADAPTER ===");
await kiemThuHopDong("S3Adapter  ", new S3Adapter());
await kiemThuHopDong("DriveAdapter", new DriveAdapter());

console.log("\n── Kiểm thử saoLuu() liên dịch vụ ──");
const s3 = new S3Adapter();
const drive = new DriveAdapter();
await s3.luu("a.txt", "nội dung A");
await s3.luu("b.txt", "nội dung B");

const so = await saoLuu(s3, drive);
ok("saoLuu() báo đúng số file", so === 2);
ok("File đã sang Drive", (await drive.danhSach()).length === 2);
ok("Nội dung được giữ nguyên", (await drive.doc("a.txt")) === "nội dung A");

const s3Moi = new S3Adapter();
await saoLuu(drive, s3Moi);
ok("saoLuu() chạy được cả chiều ngược lại", (await s3Moi.danhSach()).length === 2);

console.log(`\n───────────────\nKẾT QUẢ: ${dat}/${tong}\n`);

console.log(`═══════════════════════════════════════════════════════════════
💭 TRẢ LỜI CÂU HỎI THẢO LUẬN

a) DriveAdapter gọi API 2 lần (tra ID rồi mới thao tác) — có sai không?
   → KHÔNG SAI. Đó chính là công việc của adapter: gánh phần chênh lệch
     giữa hai mô hình, để code gọi không phải gánh.

     Nhưng nó có CHI PHÍ, và chi phí đó phải được nhìn thấy chứ không giấu:
       • Ghi rõ trong tài liệu adapter: "doc() tốn 2 lượt gọi mạng".
       • Nếu thành nút thắt, thêm cache tên→ID BÊN TRONG adapter
         (và nhớ xóa cache khi luu/xoa — nếu không sẽ có bug rất khó chịu).

     Bài học chung: adapter không làm chi phí biến mất, nó dồn chi phí về
     MỘT nơi có thể tối ưu được, thay vì rải khắp 200 chỗ gọi.

b) S3 cho 5GB, Drive chỉ 100MB — hợp đồng chung xử lý thế nào?
   Ba hướng, chọn theo bối cảnh:

   1. MẪU SỐ CHUNG NHỎ NHẤT: hợp đồng ghi "tối đa 100MB". Đơn giản nhất,
      nhưng lãng phí năng lực của S3.

   2. KHAI BÁO KHẢ NĂNG (capability): adapter có thuộc tính
         get kichThuocToiDa() { return 5 * 1024 ** 3; }
      Code gọi hỏi trước khi làm. Linh hoạt, nhưng code gọi phải biết hỏi.

   3. NÉM LỖI RÕ RÀNG: cứ thử, quá giới hạn thì ném
         LoiLuuTru("File 200MB vượt giới hạn 100MB của Google Drive")
      Thực dụng nhất cho đa số dự án.

   ❌ Điều DUY NHẤT không được làm: im lặng cắt bớt file, hoặc để lọt lỗi
      khó hiểu của SDK ra ngoài.

c) saoLuu() có chứa chữ "s3"/"drive" không?
   → Không, và đó là tiêu chí nghiệm thu quan trọng nhất của bài.

     Nếu bên trong saoLuu() còn phải if (nguon là s3), nghĩa là hai adapter
     CHƯA thật sự đồng nhất về hợp đồng — bạn mới đổi tên hàm chứ chưa thật
     sự trừu tượng hóa. Lúc đó mọi hàm dùng chúng đều phải biết phân biệt,
     và bạn không được lợi gì so với gọi thẳng SDK.

     👉 Phép thử vàng cho MỌI adapter: viết được một hàm dùng chung mà
        không cần biết bên dưới là ai.
═══════════════════════════════════════════════════════════════`);
