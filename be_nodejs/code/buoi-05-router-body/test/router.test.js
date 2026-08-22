/**
 * Buổi 05 — Test cho pathToRegex.
 *
 * Dùng test runner CÓ SẴN của Node (node:test) — không cần cài Jest.
 * Chạy:  node --test test/router.test.js
 *
 * Đây là lần đầu học viên viết test trong khoá học.
 * Điểm dạy: pathToRegex là HÀM THUẦN nên test cực dễ —
 * không cần dựng server, không cần mạng, không cần database.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { pathToRegex } from '../lib/router.js';

describe('pathToRegex', () => {
  test('route tĩnh khớp đúng chính nó', () => {
    const { regex, tenThamSo } = pathToRegex('/todos');

    assert.deepEqual(tenThamSo, []);
    assert.ok(regex.test('/todos'));
    assert.ok(regex.test('/todos/'), 'dấu / cuối vẫn phải khớp');
    assert.ok(!regex.test('/todos/1'));
    assert.ok(!regex.test('/todo'));
  });

  test('route có một tham số', () => {
    const { regex, tenThamSo } = pathToRegex('/todos/:id');

    assert.deepEqual(tenThamSo, ['id']);
    assert.equal(regex.exec('/todos/42')[1], '42');
    assert.ok(!regex.test('/todos'), 'thiếu tham số thì không khớp');
  });

  test('tham số KHÔNG ăn lan sang segment kế tiếp', () => {
    // Đây là lý do dùng [^/]+ thay vì .+
    const { regex } = pathToRegex('/todos/:id');
    assert.ok(!regex.test('/todos/1/comments/5'));
  });

  test('route có nhiều tham số', () => {
    const { regex, tenThamSo } = pathToRegex('/users/:uid/todos/:tid');

    assert.deepEqual(tenThamSo, ['uid', 'tid']);
    const m = regex.exec('/users/7/todos/99');
    assert.equal(m[1], '7');
    assert.equal(m[2], '99');
  });

  test('ký tự đặc biệt của regex được hiểu theo nghĩa đen', () => {
    // Nếu không escape, dấu '.' sẽ khớp mọi ký tự
    const { regex } = pathToRegex('/file.json');
    assert.ok(regex.test('/file.json'));
    assert.ok(!regex.test('/fileXjson'), "dấu '.' phải mang nghĩa đen");
  });
});
