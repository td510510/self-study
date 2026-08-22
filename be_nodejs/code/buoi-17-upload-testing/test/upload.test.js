/**
 * Buổi 17 — Test upload, gồm cả kịch bản tấn công.
 */

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { rm, mkdtemp, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { taoApp } from '../src/app.js';

let app, thuMucTam;

/** Tạo file giả với magic bytes ĐÚNG cho từng định dạng. */
const taoFileGia = {
  jpeg: (kb = 1) => Buffer.concat([
    Buffer.from([0xff, 0xd8, 0xff, 0xe0]),
    Buffer.alloc(kb * 1024, 0x41),
  ]),
  png: (kb = 1) => Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    Buffer.alloc(kb * 1024, 0x42),
  ]),
  pdf: () => Buffer.concat([Buffer.from('%PDF-1.7'), Buffer.alloc(512, 0x43)]),
  // File thực thi Windows — magic bytes "MZ"
  exe: () => Buffer.concat([Buffer.from([0x4d, 0x5a]), Buffer.alloc(512, 0x44)]),
  html: () => Buffer.from('<script>alert(document.cookie)</script>'),
};

before(async () => {
  thuMucTam = await mkdtemp(join(tmpdir(), 'upload-test-'));
  app = taoApp({ thuMucLuu: thuMucTam, logger: { error() {} } });
});

after(async () => {
  await rm(thuMucTam, { recursive: true, force: true });
});

describe('Upload hợp lệ', () => {
  test('ảnh JPEG → 201', async () => {
    const r = await request(app)
      .post('/upload/anh')
      .attach('anh', taoFileGia.jpeg(), 'anh-cua-toi.jpg')
      .expect(201);

    assert.equal(r.body.loai, 'image/jpeg');
    assert.equal(r.body.tenGoc, 'anh-cua-toi.jpg');
    assert.notEqual(r.body.tenFile, 'anh-cua-toi.jpg', 'tên lưu phải KHÁC tên gốc');
    assert.match(r.body.tenFile, /^\d+-[0-9a-f-]{36}\.jpg$/, 'tên do server sinh');
  });

  test('ảnh PNG → 201', async () => {
    const r = await request(app)
      .post('/upload/anh')
      .attach('anh', taoFileGia.png(), 'hinh.png')
      .expect(201);
    assert.equal(r.body.loai, 'image/png');
  });

  test('file thật sự được ghi ra đĩa', async () => {
    const truoc = (await readdir(thuMucTam)).length;
    await request(app).post('/upload/anh').attach('anh', taoFileGia.jpeg(), 'x.jpg').expect(201);
    const sau = (await readdir(thuMucTam)).length;
    assert.equal(sau, truoc + 1);
  });
});

describe('🚨 Tấn công: khai gian kiểu file', () => {
  test('file .exe đổi tên thành .jpg và khai image/jpeg → BỊ CHẶN', async () => {
    const r = await request(app)
      .post('/upload/anh')
      // Kẻ tấn công làm đủ mọi cách để trông như ảnh:
      //   - đặt tên .jpg
      //   - khai Content-Type là image/jpeg
      // Nhưng NỘI DUNG thật là file thực thi.
      .attach('anh', taoFileGia.exe(), { filename: 'anh.jpg', contentType: 'image/jpeg' })
      .expect(400);

    assert.match(r.body.loi, /Không nhận dạng được|Chỉ chấp nhận/);
  });

  test('file HTML chứa script khai là ảnh → BỊ CHẶN', async () => {
    // Nếu lọt, file này được phục vụ trên cùng domain
    // → chạy script → đánh cắp cookie của mọi người xem. XSS lưu trữ.
    await request(app)
      .post('/upload/anh')
      .attach('anh', taoFileGia.html(), { filename: 'anh.png', contentType: 'image/png' })
      .expect(400);
  });

  test('PDF thật nhưng không nằm trong danh sách cho phép → BỊ CHẶN', async () => {
    const r = await request(app)
      .post('/upload/anh')
      .attach('anh', taoFileGia.pdf(), 'tailieu.pdf')
      .expect(400);

    assert.match(r.body.loi, /Chỉ chấp nhận/);
    assert.match(r.body.loi, /application\/pdf/, 'phải nói rõ file THỰC CHẤT là gì');
  });

  test('ảnh THẬT nhưng client khai sai kiểu → vẫn nhận, kèm CẢNH BÁO', async () => {
    const r = await request(app)
      .post('/upload/anh')
      .attach('anh', taoFileGia.png(), { filename: 'a.png', contentType: 'image/jpeg' })
      .expect(201);

    assert.equal(r.body.loai, 'image/png', 'tin magic bytes, không tin lời khai');
    assert.ok(r.body.canhBao, 'phải ghi nhận việc khai sai');
  });
});

describe('🚨 Tấn công: path traversal', () => {
  test('tên file chứa ../../ KHÔNG thoát được thư mục', async () => {
    const r = await request(app)
      .post('/upload/anh')
      .attach('anh', taoFileGia.jpeg(), '../../../../etc/passwd.jpg')
      .expect(201);

    assert.equal(r.body.tenGoc.includes('..'), false, 'tên gốc phải được làm sạch');
    assert.equal(r.body.tenGoc.includes('/'), false);
    assert.equal(r.body.tenFile.includes('..'), false, 'tên lưu do server sinh');

    // Kiểm chứng file nằm ĐÚNG trong thư mục lưu
    const cacFile = await readdir(thuMucTam);
    assert.ok(cacFile.includes(r.body.tenFile));
  });

  test('xoá file với ../ → BỊ CHẶN', async () => {
    const r = await request(app).delete('/upload/anh/..%2F..%2F.env').expect(400);
    assert.match(r.body.loi, /không hợp lệ/);
  });

  test('xoá file không tồn tại → 404', async () => {
    await request(app).delete('/upload/anh/khong-co-that.jpg').expect(404);
  });
});

describe('Giới hạn kích thước & số lượng', () => {
  test('file vượt 2MB → 413', async () => {
    const r = await request(app)
      .post('/upload/anh')
      .attach('anh', taoFileGia.jpeg(3000), 'to.jpg')
      .expect(413);
    assert.match(r.body.loi, /kích thước/);
  });

  test('sai tên trường → 400 và nói rõ tên trường sai', async () => {
    const r = await request(app)
      .post('/upload/anh')
      .attach('sai_ten', taoFileGia.jpeg(), 'a.jpg')
      .expect(400);
    assert.match(r.body.loi, /sai_ten/);
  });

  test('không gửi file nào → 400', async () => {
    await request(app).post('/upload/anh').expect(400);
  });
});

describe('Upload nhiều file', () => {
  test('tất cả hợp lệ → 201', async () => {
    const r = await request(app)
      .post('/upload/nhieu-anh')
      .attach('anh', taoFileGia.jpeg(), 'a.jpg')
      .attach('anh', taoFileGia.png(), 'b.png')
      .expect(201);

    assert.equal(r.body.daLuu.length, 2);
    assert.equal(r.body.boQua.length, 0);
  });

  test('một phần hỏng → 207 Multi-Status, file tốt VẪN được lưu', async () => {
    const r = await request(app)
      .post('/upload/nhieu-anh')
      .attach('anh', taoFileGia.jpeg(), 'tot.jpg')
      .attach('anh', taoFileGia.exe(), 'xau.jpg')
      .expect(207);

    assert.equal(r.body.daLuu.length, 1, 'file tốt vẫn được lưu');
    assert.equal(r.body.boQua.length, 1, 'file xấu bị bỏ qua kèm lý do');
    assert.ok(r.body.boQua[0].lyDo);
  });

  test('quá 5 file → 400', async () => {
    const req = request(app).post('/upload/nhieu-anh');
    for (let i = 0; i < 7; i++) req.attach('anh', taoFileGia.jpeg(), `f${i}.jpg`);
    await req.expect(400);
  });
});
