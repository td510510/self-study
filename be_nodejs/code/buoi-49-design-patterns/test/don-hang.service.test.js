/**
 * Lợi ích thật của DI: test service KHÔNG CẦN cổng thanh toán, KHÔNG CẦN email.
 * Tiêm đồ giả vào, kiểm tra hành vi. Chạy trong vài mili-giây.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DonHangService } from '../src/don-hang.service.js';
import { KhoTrongBoNho } from '../src/kho.repository.js';
import { BusSuKien } from '../src/lib/su-kien.js';
import { LoiThanhToan } from '../src/thanh-toan/adapter.js';

const imLang = { log() {}, warn() {}, error() {} };

function dung({ cong, bus } = {}) {
  const kho = new KhoTrongBoNho([{ id: 'a', ten: 'Áo', gia: 100, ton: 3 }]);
  const suKien = [];
  const busGia = bus ?? { phat: async (ten, d) => suKien.push([ten, d]) };
  const congGia = cong ?? { ten: 'gia', thanhToan: async () => ({ maGiaoDich: 'GD-1' }) };
  const service = new DonHangService({ kho, cong: congGia, bus: busGia, taoId: () => 'DH-1' });
  return { service, kho, suKien };
}

test('đặt hàng thành công: trừ kho, tính tiền, phát sự kiện', async () => {
  const { service, kho, suKien } = dung();
  const don = await service.datHang({ sanPhamId: 'a', soLuong: 2, email: 'x@vd.vn' });

  assert.equal(don.soTien, 200);
  assert.equal(don.maGiaoDich, 'GD-1');
  assert.equal((await kho.tim('a')).ton, 1);
  assert.deepEqual(suKien.map(([ten]) => ten), ['don-hang.da-dat']);
});

test('hết hàng: KHÔNG gọi cổng thanh toán', async () => {
  let daGoi = false;
  const { service } = dung({ cong: { ten: 'gia', thanhToan: async () => { daGoi = true; } } });

  await assert.rejects(service.datHang({ sanPhamId: 'a', soLuong: 9 }), { ma: 'HET_HANG' });
  assert.equal(daGoi, false, 'không được lấy tiền cho món đã hết');
});

test('thanh toán lỗi: hàng được trả lại kho (bù trừ)', async () => {
  const { service, kho } = dung({
    cong: { ten: 'gia', thanhToan: async () => { throw new LoiThanhToan('bị từ chối'); } },
  });

  await assert.rejects(service.datHang({ sanPhamId: 'a', soLuong: 2 }), { name: 'LoiThanhToan' });
  assert.equal((await kho.tim('a')).ton, 3);
});

test('listener sự kiện lỗi KHÔNG làm hỏng đơn hàng', async () => {
  const bus = new BusSuKien({ logger: imLang });
  const daChay = [];
  bus.dangKy('don-hang.da-dat', async () => { throw new Error('SMTP chết'); });
  bus.dangKy('don-hang.da-dat', async () => daChay.push('thong-ke'));

  const { service } = dung({ bus });
  const don = await service.datHang({ sanPhamId: 'a', soLuong: 1 });

  assert.equal(don.maGiaoDich, 'GD-1');
  assert.deepEqual(daChay, ['thong-ke'], 'listener thứ hai vẫn phải chạy');
});

test('bus trả về số listener lỗi', async () => {
  const bus = new BusSuKien({ logger: imLang });
  bus.dangKy('e', () => { throw new Error('đồng bộ'); });
  bus.dangKy('e', async () => { throw new Error('bất đồng bộ'); });
  bus.dangKy('e', async () => {});
  assert.equal(await bus.phat('e', {}), 2);
});
