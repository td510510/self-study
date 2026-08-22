/**
 * Buổi 17 — Endpoint upload.
 */

import { Router } from 'express';
import multer from 'multer';
import { writeFile, mkdir, unlink } from 'node:fs/promises';
import { join, resolve, sep } from 'node:path';
import { HttpError } from '../lib/errors.js';
import { kiemTraFile } from '../lib/kiem-tra-file.js';

const KIEU_CHO_PHEP = ['image/jpeg', 'image/png', 'image/webp'];
const KICH_THUOC_TOI_DA = 2 * 1024 * 1024; // 2 MB

/**
 * memoryStorage: giữ file trong RAM để KIỂM TRA TRƯỚC KHI ghi ra đĩa.
 *
 * ⚠️ Vì sao KHÔNG dùng diskStorage?
 *    diskStorage ghi file xuống đĩa NGAY khi nhận, TRƯỚC khi ta kịp kiểm tra.
 *    Nghĩa là file độc hại đã nằm trên máy chủ rồi mới bị từ chối —
 *    và nếu code xoá bị lỗi, nó ở lại vĩnh viễn.
 *
 * ⚠️ Đánh đổi: memoryStorage tốn RAM. Với file lớn (video),
 *    phải dùng diskStorage vào THƯ MỤC TẠM ngoài web root, hoặc
 *    stream thẳng lên S3. Xem phần "khi file lớn" trong giáo án.
 */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    // Giới hạn của multer là LỚP PHÒNG THỦ THỨ NHẤT —
    // nó cắt kết nối ngay khi vượt ngưỡng, không đọc hết vào RAM.
    fileSize: KICH_THUOC_TOI_DA,
    files: 5,
    // Chặn luôn số lượng field để tránh tấn công gửi hàng nghìn field rỗng
    fields: 10,
  },
});

export function taoUploadRouter({ thuMucLuu }) {
  const router = Router();
  const thuMucTuyetDoi = resolve(thuMucLuu);

  router.post('/anh', upload.single('anh'), async (req, res, next) => {
    try {
      if (!req.file) throw new HttpError(400, 'Thiếu file trong trường "anh"');

      const kq = kiemTraFile(req.file, {
        kieuChoPhep: KIEU_CHO_PHEP,
        kichThuocToiDa: KICH_THUOC_TOI_DA,
      });

      if (!kq.hopLe) throw new HttpError(400, kq.lyDo);

      await mkdir(thuMucTuyetDoi, { recursive: true });

      // ⚠️ Ghép đường dẫn bằng tên ĐÃ SINH RA, không phải tên từ client.
      // Và kiểm tra lại lần cuối rằng đường dẫn vẫn nằm trong thư mục lưu —
      // phòng thủ theo tầng, dù tên đã do ta tự sinh.
      const duongDan = join(thuMucTuyetDoi, kq.tenAnToan);
      if (!duongDan.startsWith(thuMucTuyetDoi)) {
        throw new HttpError(400, 'Đường dẫn không hợp lệ');
      }

      await writeFile(duongDan, req.file.buffer);

      res.status(201).json({
        tenFile: kq.tenAnToan,
        tenGoc: kq.tenGoc,
        loai: kq.loai,
        kichThuoc: req.file.size,
        // Ghi nhận khi client khai sai kiểu — dấu hiệu đáng ngờ
        ...(kq.clientKhaiDung ? {} : { canhBao: `Client khai "${kq.clientKhai}" nhưng thực chất là "${kq.loai}"` }),
      });
    } catch (err) {
      next(err);
    }
  });

  router.post('/nhieu-anh', upload.array('anh', 5), async (req, res, next) => {
    try {
      if (!req.files?.length) throw new HttpError(400, 'Không có file nào');

      await mkdir(thuMucTuyetDoi, { recursive: true });
      const daLuu = [];
      const boQua = [];

      for (const f of req.files) {
        const kq = kiemTraFile(f, {
          kieuChoPhep: KIEU_CHO_PHEP,
          kichThuocToiDa: KICH_THUOC_TOI_DA,
        });

        if (!kq.hopLe) {
          boQua.push({ tenGoc: f.originalname, lyDo: kq.lyDo });
          continue;
        }

        await writeFile(join(thuMucTuyetDoi, kq.tenAnToan), f.buffer);
        daLuu.push({ tenFile: kq.tenAnToan, tenGoc: kq.tenGoc, loai: kq.loai });
      }

      // 207 Multi-Status: một phần thành công, một phần thất bại
      res.status(boQua.length > 0 ? 207 : 201).json({ daLuu, boQua });
    } catch (err) {
      next(err);
    }
  });

  router.delete('/anh/:tenFile', async (req, res, next) => {
    try {
      // ⚠️ Ngay cả khi xoá cũng phải chống path traversal.
      // Client gửi tenFile = "../../.env" là xoá mất file cấu hình.
      const duongDan = resolve(thuMucTuyetDoi, req.params.tenFile);

      if (!duongDan.startsWith(thuMucTuyetDoi + sep)) {
        throw new HttpError(400, 'Tên file không hợp lệ');
      }

      await unlink(duongDan).catch((err) => {
        if (err.code === 'ENOENT') throw new HttpError(404, 'Không tìm thấy file');
        throw err;
      });

      res.sendStatus(204);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
