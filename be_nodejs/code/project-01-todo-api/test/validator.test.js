/**
 * Test cho tầng validate — HÀM THUẦN, test cực nhanh, không cần I/O.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { kiemTraTodo, kiemTraThamSoLoc } from '../src/todos/todo.validator.js';

describe('kiemTraTodo', () => {
  test('chấp nhận dữ liệu hợp lệ và điền mặc định', () => {
    const kq = kiemTraTodo({ tieuDe: '  Học Node  ' }, true);
    assert.equal(kq.tieuDe, 'Học Node', 'phải trim khoảng trắng');
    assert.equal(kq.xong, false);
    assert.equal(kq.uuTien, 'trung');
  });

  test('từ chối tiêu đề rỗng', () => {
    assert.throws(() => kiemTraTodo({ tieuDe: '   ' }, true), (err) => {
      assert.equal(err.statusCode, 400);
      assert.equal(err.chiTiet.tieuDe, 'Không được rỗng');
      return true;
    });
  });

  test('từ chối tiêu đề quá dài', () => {
    assert.throws(() => kiemTraTodo({ tieuDe: 'x'.repeat(201) }, true), /không hợp lệ/);
  });

  test('từ chối uuTien không hợp lệ', () => {
    assert.throws(() => kiemTraTodo({ tieuDe: 'a', uuTien: 'khan-cap' }, true), (err) => {
      assert.match(err.chiTiet.uuTien, /thap, trung, cao/);
      return true;
    });
  });

  test('PATCH không bắt buộc đủ trường', () => {
    const kq = kiemTraTodo({ xong: true }, false);
    assert.deepEqual(kq, { xong: true }, 'chỉ trả về trường được gửi');
  });

  test('CHỐNG MASS ASSIGNMENT: loại bỏ trường lạ', () => {
    const kq = kiemTraTodo({ tieuDe: 'a', id: 999, vaiTro: 'admin' }, true);
    assert.equal(kq.id, undefined, 'id do client gửi phải bị loại');
    assert.equal(kq.vaiTro, undefined, 'trường lạ phải bị loại');
  });

  test('từ chối body không phải object', () => {
    assert.throws(() => kiemTraTodo([], true), /phải là một object/);
    assert.throws(() => kiemTraTodo('chuỗi', true), /phải là một object/);
  });
});

describe('kiemTraThamSoLoc', () => {
  test('giá trị mặc định', () => {
    const kq = kiemTraThamSoLoc({});
    assert.equal(kq.trang, 1);
    assert.equal(kq.moiTrang, 20);
  });

  test('từ chối trang không hợp lệ', () => {
    assert.throws(() => kiemTraThamSoLoc({ trang: '0' }), /không hợp lệ/);
    assert.throws(() => kiemTraThamSoLoc({ trang: 'abc' }), /không hợp lệ/);
  });

  test('giới hạn moiTrang tối đa 100', () => {
    assert.throws(() => kiemTraThamSoLoc({ moiTrang: '101' }), /không hợp lệ/);
  });

  test('xong phải là true/false dạng chuỗi', () => {
    assert.equal(kiemTraThamSoLoc({ xong: 'true' }).xong, true);
    assert.throws(() => kiemTraThamSoLoc({ xong: '1' }), /không hợp lệ/);
  });
});
