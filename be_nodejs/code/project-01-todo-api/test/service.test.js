/**
 * Test cho tầng nghiệp vụ — dùng repository GIẢ (mock), không chạm đĩa.
 *
 * Đây là lợi ích trực tiếp của việc tách tầng: test logic nghiệp vụ
 * mà không cần file, không cần server, không cần mạng.
 * Ở buổi 36 (NestJS) ta làm y hệt bằng overrideProvider.
 */

import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { taoService } from '../src/todos/todo.service.js';

/** Repository giả — giữ dữ liệu trong RAM, không ghi file. */
function taoRepoGia(banDau = []) {
  let idKeTiep = banDau.length + 1;
  let todos = banDau.map((t) => ({ ...t }));

  return {
    layTatCa: () => todos.map((t) => ({ ...t })),
    layTheoId: (id) => {
      const t = todos.find((x) => x.id === id);
      return t ? { ...t } : null;
    },
    them: async (banGhi) => {
      const moi = { id: idKeTiep++, ...banGhi, taoLuc: 'now', suaLuc: null };
      todos.push(moi);
      return { ...moi };
    },
    capNhat: async (id, thayDoi) => {
      const t = todos.find((x) => x.id === id);
      if (!t) return null;
      Object.assign(t, thayDoi, { suaLuc: 'now' });
      return { ...t };
    },
    xoa: async (id) => {
      const i = todos.findIndex((x) => x.id === id);
      if (i === -1) return false;
      todos.splice(i, 1);
      return true;
    },
    doiGhiXong: async () => {},
  };
}

const MAU = [
  { id: 1, tieuDe: 'A', xong: true, uuTien: 'cao' },
  { id: 2, tieuDe: 'B', xong: false, uuTien: 'thap' },
  { id: 3, tieuDe: 'C', xong: false, uuTien: 'cao' },
];

describe('service.danhSach', () => {
  let service;
  beforeEach(() => { service = taoService(taoRepoGia(MAU)); });

  test('trả về tất cả kèm thông tin phân trang', () => {
    const kq = service.danhSach({});
    assert.equal(kq.duLieu.length, 3);
    assert.equal(kq.phanTrang.tong, 3);
    assert.equal(kq.phanTrang.tongSoTrang, 1);
  });

  test('lọc theo xong', () => {
    assert.equal(service.danhSach({ xong: 'false' }).duLieu.length, 2);
  });

  test('lọc theo uuTien', () => {
    assert.equal(service.danhSach({ uuTien: 'cao' }).duLieu.length, 2);
  });

  test('kết hợp nhiều bộ lọc', () => {
    const kq = service.danhSach({ xong: 'false', uuTien: 'cao' });
    assert.equal(kq.duLieu.length, 1);
    assert.equal(kq.duLieu[0].tieuDe, 'C');
  });

  test('phân trang', () => {
    const kq = service.danhSach({ trang: '2', moiTrang: '2' });
    assert.equal(kq.duLieu.length, 1);
    assert.equal(kq.phanTrang.tongSoTrang, 2);
  });
});

describe('service.layMot', () => {
  let service;
  beforeEach(() => { service = taoService(taoRepoGia(MAU)); });

  test('trả về todo đúng', () => {
    assert.equal(service.layMot('2').tieuDe, 'B');
  });

  test('404 khi không tồn tại', () => {
    assert.throws(() => service.layMot('999'), (err) => {
      assert.equal(err.statusCode, 404);
      return true;
    });
  });

  test('400 khi id không phải số', () => {
    assert.throws(() => service.layMot('abc'), (err) => {
      assert.equal(err.statusCode, 400);
      return true;
    });
  });
});

describe('service.tao / thayThe / suaMotPhan / xoa', () => {
  let service;
  beforeEach(() => { service = taoService(taoRepoGia(MAU)); });

  test('tao sinh id mới và điền mặc định', async () => {
    const moi = await service.tao({ tieuDe: 'D' });
    assert.equal(moi.id, 4);
    assert.equal(moi.xong, false);
    assert.equal(moi.uuTien, 'trung');
  });

  test('tao từ chối body rỗng', async () => {
    await assert.rejects(() => service.tao(null), /không được rỗng/);
  });

  test('PUT bắt buộc đủ trường', async () => {
    await assert.rejects(() => service.thayThe('1', { xong: true }), (err) => {
      assert.equal(err.statusCode, 400);
      assert.ok(err.chiTiet.tieuDe, 'phải báo thiếu tieuDe');
      return true;
    });
  });

  test('PATCH cho phép sửa một phần', async () => {
    const kq = await service.suaMotPhan('1', { xong: false });
    assert.equal(kq.xong, false);
    assert.equal(kq.tieuDe, 'A', 'trường khác giữ nguyên');
  });

  test('PATCH từ chối body không có trường nào hợp lệ', async () => {
    await assert.rejects(() => service.suaMotPhan('1', {}), /ít nhất một trường/);
  });

  test('xoa thành công', async () => {
    await service.xoa('1');
    assert.equal(service.danhSach({}).phanTrang.tong, 2);
  });

  test('xoa todo không tồn tại → 404', async () => {
    await assert.rejects(() => service.xoa('999'), (err) => {
      assert.equal(err.statusCode, 404);
      return true;
    });
  });
});

describe('service.thongKe', () => {
  test('đếm đúng', () => {
    const kq = taoService(taoRepoGia(MAU)).thongKe();
    assert.deepEqual(kq, {
      tong: 3, daXong: 1, conLai: 2,
      theoUuTien: { thap: 1, trung: 0, cao: 2 },
    });
  });
});
