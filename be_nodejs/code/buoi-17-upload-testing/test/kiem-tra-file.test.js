/**
 * Buổi 17 — Unit test cho tầng kiểm tra file.
 *
 * ĐỐI CHIẾU VỚI upload.test.js:
 *   - File này test HÀM THUẦN → chạy trong mili-giây, không cần server, không cần đĩa
 *   - upload.test.js test qua HTTP → chậm hơn, nhưng bắt được lỗi phối hợp
 *
 * Đây là hai tầng của KIM TỰ THÁP TEST.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  nhanDangKieuThat,
  lamSachTenGoc,
  sinhTenAnToan,
  kiemTraFile,
} from '../src/lib/kiem-tra-file.js';

const bytes = (...b) => Buffer.from(b);

describe('nhanDangKieuThat — đọc magic bytes', () => {
  test('nhận ra JPEG', () => {
    assert.equal(nhanDangKieuThat(bytes(0xff, 0xd8, 0xff, 0xe0)).loai, 'image/jpeg');
  });

  test('nhận ra PNG', () => {
    const png = bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a);
    assert.equal(nhanDangKieuThat(png).loai, 'image/png');
  });

  test('nhận ra PDF', () => {
    assert.equal(nhanDangKieuThat(Buffer.from('%PDF-1.7')).loai, 'application/pdf');
  });

  test('WEBP cần khớp ở HAI vị trí', () => {
    const dung = Buffer.concat([
      Buffer.from('RIFF'),
      Buffer.from([0, 0, 0, 0]),
      Buffer.from('WEBP'),
    ]);
    assert.equal(nhanDangKieuThat(dung).loai, 'image/webp');

    // Đúng "RIFF" nhưng sai phần sau → KHÔNG phải webp (có thể là .wav)
    const sai = Buffer.concat([
      Buffer.from('RIFF'),
      Buffer.from([0, 0, 0, 0]),
      Buffer.from('WAVE'),
    ]);
    assert.equal(nhanDangKieuThat(sai), null);
  });

  test('không nhận ra file lạ → null', () => {
    assert.equal(nhanDangKieuThat(Buffer.from('day la van ban thuong')), null);
  });

  test('file .exe (MZ) → null, không nằm trong danh sách', () => {
    assert.equal(nhanDangKieuThat(bytes(0x4d, 0x5a, 0x90, 0x00)), null);
  });
});

describe('lamSachTenGoc — chống path traversal', () => {
  const truongHop = [
    ['anh.jpg', 'anh.jpg'],
    ['../../../etc/passwd', 'passwd'],
    ['/etc/shadow', 'shadow'],
    ['..', 'khong-ten'],
    ['', 'khong-ten'],
    [undefined, 'khong-ten'],
    ['file:với*ký?tự|xấu.jpg', 'file_với_ký_tự_xấu.jpg'],
  ];

  for (const [vao, ra] of truongHop) {
    test(`${JSON.stringify(vao)} → ${JSON.stringify(ra)}`, () => {
      assert.equal(lamSachTenGoc(vao), ra);
    });
  }

  test('cắt tên quá dài xuống 120 ký tự', () => {
    assert.equal(lamSachTenGoc('x'.repeat(300)).length, 120);
  });

  test('kết quả KHÔNG BAO GIỜ chứa dấu phân cách đường dẫn', () => {
    for (const [vao] of truongHop) {
      const kq = lamSachTenGoc(vao);
      assert.equal(kq.includes('/'), false);
      assert.equal(kq.includes('\\'), false);
    }
  });
});

describe('sinhTenAnToan', () => {
  test('luôn sinh tên KHÁC NHAU', () => {
    const ds = new Set(Array.from({ length: 100 }, () => sinhTenAnToan('.jpg')));
    assert.equal(ds.size, 100, '100 lần gọi phải ra 100 tên khác nhau');
  });

  test('giữ đúng phần mở rộng', () => {
    assert.match(sinhTenAnToan('.png'), /\.png$/);
  });
});

describe('kiemTraFile — tổng hợp', () => {
  const CAU_HINH = { kieuChoPhep: ['image/jpeg', 'image/png'], kichThuocToiDa: 1024 };

  test('ảnh JPEG hợp lệ', () => {
    const kq = kiemTraFile(
      { buffer: bytes(0xff, 0xd8, 0xff, 0xe0), mimetype: 'image/jpeg', originalname: 'a.jpg' },
      CAU_HINH
    );
    assert.equal(kq.hopLe, true);
    assert.equal(kq.clientKhaiDung, true);
  });

  test('file rỗng → từ chối', () => {
    const kq = kiemTraFile({ buffer: Buffer.alloc(0) }, CAU_HINH);
    assert.equal(kq.hopLe, false);
    assert.match(kq.lyDo, /rỗng/);
  });

  test('vượt kích thước → từ chối', () => {
    const to = Buffer.concat([bytes(0xff, 0xd8, 0xff), Buffer.alloc(2048)]);
    const kq = kiemTraFile({ buffer: to, mimetype: 'image/jpeg', originalname: 'a.jpg' }, CAU_HINH);
    assert.equal(kq.hopLe, false);
    assert.match(kq.lyDo, /vượt quá/);
  });

  test('kiểu không cho phép → từ chối, nói rõ kiểu THẬT', () => {
    const kq = kiemTraFile(
      { buffer: Buffer.from('%PDF-1.7'), mimetype: 'image/jpeg', originalname: 'a.jpg' },
      CAU_HINH
    );
    assert.equal(kq.hopLe, false);
    assert.match(kq.lyDo, /application\/pdf/);
  });

  test('phát hiện client khai sai kiểu', () => {
    const kq = kiemTraFile(
      { buffer: bytes(0xff, 0xd8, 0xff), mimetype: 'image/png', originalname: 'a.png' },
      CAU_HINH
    );
    assert.equal(kq.hopLe, true, 'vẫn hợp lệ vì thực chất là JPEG được phép');
    assert.equal(kq.clientKhaiDung, false, 'nhưng ghi nhận là khai sai');
    assert.equal(kq.loai, 'image/jpeg', 'tin magic bytes');
  });
});
