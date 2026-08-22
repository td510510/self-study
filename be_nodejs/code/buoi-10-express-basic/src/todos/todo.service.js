/**
 * Tầng nghiệp vụ.
 *
 * Không biết gì về HTTP (không có req/res), không biết gì về đĩa
 * (chỉ gọi repository). Nhờ vậy test được mà không cần dựng server.
 *
 * Ở buổi 34, tầng này trở thành @Injectable() Service của NestJS —
 * cấu trúc y hệt, chỉ khác cách khai báo.
 */

import { loi } from '../lib/errors.js';
import { kiemTraTodo, kiemTraThamSoLoc } from './todo.validator.js';

export function taoService(repo) {
  function timHoacNem(idTho) {
    const id = Number(idTho);
    if (!Number.isInteger(id) || id < 1) {
      throw loi.duLieuSai(`id phải là số nguyên dương, nhận được: "${idTho}"`);
    }

    const todo = repo.layTheoId(id);
    if (!todo) throw loi.khongTimThay(`Không có todo với id = ${id}`);
    return todo;
  }

  return {
    danhSach(query) {
      const { xong, uuTien, trang, moiTrang } = kiemTraThamSoLoc(query);

      let ketQua = repo.layTatCa();
      if (xong !== undefined) ketQua = ketQua.filter((t) => t.xong === xong);
      if (uuTien !== undefined) ketQua = ketQua.filter((t) => t.uuTien === uuTien);

      const tong = ketQua.length;
      const batDau = (trang - 1) * moiTrang;

      return {
        duLieu: ketQua.slice(batDau, batDau + moiTrang),
        phanTrang: {
          tong,
          trang,
          moiTrang,
          tongSoTrang: Math.max(1, Math.ceil(tong / moiTrang)),
        },
      };
    },

    layMot(idTho) {
      return timHoacNem(idTho);
    },

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

    async tao(body) {
      if (body === null) throw loi.duLieuSai('Body không được rỗng');
      const sach = kiemTraTodo(body, true);
      return repo.them(sach);
    },

    /** PUT = thay thế toàn bộ → bắt buộc đủ trường */
    async thayThe(idTho, body) {
      const todo = timHoacNem(idTho);
      if (body === null) throw loi.duLieuSai('Body không được rỗng');

      const sach = kiemTraTodo(body, true);
      return repo.capNhat(todo.id, sach);
    },

    /** PATCH = sửa một phần → không bắt buộc đủ trường */
    async suaMotPhan(idTho, body) {
      const todo = timHoacNem(idTho);
      if (body === null) throw loi.duLieuSai('Body không được rỗng');

      const sach = kiemTraTodo(body, false);
      if (Object.keys(sach).length === 0) {
        throw loi.duLieuSai('Phải có ít nhất một trường để cập nhật');
      }
      return repo.capNhat(todo.id, sach);
    },

    async xoa(idTho) {
      const todo = timHoacNem(idTho);
      await repo.xoa(todo.id);
    },
  };
}
