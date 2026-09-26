import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ViDienTuSdk, TheQuocTeSdk } from '../src/thanh-toan/sdk-gia-lap.js';
import { ViDienTuAdapter, TheQuocTeAdapter, LoiThanhToan } from '../src/thanh-toan/adapter.js';
import { dangKyCong, taoCong } from '../src/thanh-toan/nha-may.js';
import { voiThuLai, voiDoThoiGian } from '../src/lib/trang-tri.js';

const imLang = { warn() {} };

test('hai adapter trả về CÙNG hình dạng dù SDK khác nhau', async () => {
  const vi = await new ViDienTuAdapter(new ViDienTuSdk()).thanhToan({ donHangId: 1, soTien: 50_000 });
  const the = await new TheQuocTeAdapter(new TheQuocTeSdk()).thanhToan({ donHangId: 1, soTien: 50_000 });

  assert.deepEqual(Object.keys(vi), ['maGiaoDich']);
  assert.deepEqual(Object.keys(the), ['maGiaoDich']);
  // 50.000đ / 25.000 = 2 USD = 200 cent
  assert.equal(the.maGiaoDich, 'ch_200_usd');
});

test('adapter thẻ đổi "status: failed" thành exception', async () => {
  const cong = new TheQuocTeAdapter(new TheQuocTeSdk());
  await assert.rejects(cong.thanhToan({ donHangId: 1, soTien: 0 }), (err) => {
    assert.ok(err instanceof LoiThanhToan);
    assert.equal(err.tamThoi, false);
    return true;
  });
});

test('adapter ví đánh dấu lỗi mạng là TẠM THỜI', async () => {
  const cong = new ViDienTuAdapter(new ViDienTuSdk({ loiLanDau: 1 }));
  await assert.rejects(cong.thanhToan({ donHangId: 1, soTien: 1 }), { tamThoi: true });
});

test('voiThuLai: lỗi tạm thời được thử lại tới khi thành công', async () => {
  const sdk = new ViDienTuSdk({ loiLanDau: 2 });
  const cong = voiThuLai(new ViDienTuAdapter(sdk), { soLan: 3, choMs: 1, logger: imLang });
  await cong.thanhToan({ donHangId: 1, soTien: 1 });
  assert.equal(sdk.soLanGoi, 3);
});

test('voiThuLai: lỗi VĨNH VIỄN không được thử lại', async () => {
  let soLan = 0;
  const goc = { ten: 'x', thanhToan: async () => { soLan++; throw new LoiThanhToan('từ chối'); } };
  await assert.rejects(voiThuLai(goc, { choMs: 1, logger: imLang }).thanhToan({}));
  assert.equal(soLan, 1);
});

test('voiThuLai: hết lượt thì ném lỗi cuối', async () => {
  const sdk = new ViDienTuSdk({ loiLanDau: 10 });
  const cong = voiThuLai(new ViDienTuAdapter(sdk), { soLan: 3, choMs: 1, logger: imLang });
  await assert.rejects(cong.thanhToan({ donHangId: 1, soTien: 1 }), { tamThoi: true });
  assert.equal(sdk.soLanGoi, 3);
});

test('voiDoThoiGian ghi nhận cả khi lỗi', async () => {
  const soDo = [];
  const goc = { ten: 'x', thanhToan: async () => { throw new Error('hỏng'); } };
  await assert.rejects(voiDoThoiGian(goc, { ghiNhan: (s) => soDo.push(s) }).thanhToan({}));
  assert.equal(soDo[0].ketQua, 'loi');
});

test('factory: cổng mới đăng ký được mà không sửa code cũ; tên lạ bị từ chối', () => {
  dangKyCong('test-cod', () => ({ ten: 'test-cod', thanhToan: async () => ({ maGiaoDich: 'COD' }) }));
  assert.equal(taoCong('test-cod').ten, 'test-cod');
  assert.throws(() => taoCong('bitcoin'), /Không hỗ trợ cổng "bitcoin"/);
  assert.throws(() => dangKyCong('test-cod', () => ({})), /đã được đăng ký/);
});
