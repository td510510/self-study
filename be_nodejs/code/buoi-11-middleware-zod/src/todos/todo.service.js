/**
 * Tầng nghiệp vụ — ĐÃ GỌN ĐI đáng kể so với Project 1.
 *
 * VÌ SAO? Toàn bộ việc kiểm tra dữ liệu đã chuyển ra BIÊN (middleware zod).
 * Khi request tới được đây, dữ liệu CHẮC CHẮN đã hợp lệ, đã trim, đã ép kiểu,
 * đã điền mặc định.
 *
 * Đây là nguyên tắc "validate at the boundary": kiểm tra một lần ở cửa ngõ,
 * bên trong không phải phòng thủ nữa.
 *
 * Ở buổi 32, NestJS làm đúng việc này bằng DTO + ValidationPipe.
 */

import { loi } from '../lib/errors.js';

export function taoService(repo) {
  function timHoacNem(id) {
    // id giờ đã là SỐ (middleware validate ép kiểu rồi), không cần kiểm tra nữa
    const todo = repo.layTheoId(id);
    if (!todo) throw loi.khongTimThay(`Không có todo với id = ${id}`);
    return todo;
  }

  return {
    danhSach({ xong, uuTien, trang, moiTrang }) {
      let ketQua = repo.layTatCa();
      if (xong !== undefined) ketQua = ketQua.filter((t) => t.xong === xong);
      if (uuTien !== undefined) ketQua = ketQua.filter((t) => t.uuTien === uuTien);

      const tong = ketQua.length;
      const batDau = (trang - 1) * moiTrang;

      return {
        duLieu: ketQua.slice(batDau, batDau + moiTrang),
        phanTrang: { tong, trang, moiTrang, tongSoTrang: Math.max(1, Math.ceil(tong / moiTrang)) },
      };
    },

    layMot: (id) => timHoacNem(id),

    thongKe() {
      const tatCa = repo.layTatCa();
      const theoUuTien = { thap: 0, trung: 0, cao: 0 };
      for (const t of tatCa) theoUuTien[t.uuTien]++;
      return {
        tong: tatCa.length,
        daXong: tatCa.filter((t) => t.xong).length,
        conLai: tatCa.filter((t) => !t.xong).length,
        theoUuTien,
      };
    },

    tao: (duLieu) => repo.them(duLieu),

    async thayThe(id, duLieu) {
      timHoacNem(id);
      return repo.capNhat(id, duLieu);
    },

    async suaMotPhan(id, duLieu) {
      timHoacNem(id);
      return repo.capNhat(id, duLieu);
    },

    async xoa(id) {
      timHoacNem(id);
      await repo.xoa(id);
    },
  };
}
