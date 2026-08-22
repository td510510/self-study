/**
 * Tầng lưu trữ — chỗ DUY NHẤT trong ứng dụng chạm tới đĩa.
 *
 * Nhờ tách riêng, ở Phase 2 ta chỉ cần thay file này bằng Prisma/Postgres
 * mà KHÔNG phải sửa một dòng nào ở tầng service.
 * Đây chính là Repository pattern (gặp lại ở buổi 34).
 */

import { readFile, writeFile, rename, mkdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';

export function taoRepository(duongDanFile) {
  const duongDan = resolve(process.cwd(), duongDanFile);

  let duLieu = { idKeTiep: 1, todos: [] };
  let hangDoiGhi = Promise.resolve();

  /** Ghi nguyên tử: ghi file tạm rồi rename (buổi 08). */
  async function ghiAnToan() {
    const fileTam = join(dirname(duongDan), `.${process.pid}.${Date.now()}.tmp`);
    await writeFile(fileTam, JSON.stringify(duLieu, null, 2), 'utf8');
    await rename(fileTam, duongDan);
  }

  /**
   * Nối mỗi lần ghi vào cuối hàng đợi → tuần tự hoá, chống ghi đè lẫn nhau.
   * Nhánh lỗi cũng gọi ghiAnToan để một lần lỗi không làm kẹt hàng đợi mãi.
   */
  function ghi() {
    hangDoiGhi = hangDoiGhi.then(ghiAnToan, ghiAnToan);
    return hangDoiGhi;
  }

  return {
    /** Nạp dữ liệu từ đĩa. Gọi một lần lúc khởi động. */
    async nap() {
      await mkdir(dirname(duongDan), { recursive: true });
      try {
        const tho = await readFile(duongDan, 'utf8');
        const doc = JSON.parse(tho);
        if (!Array.isArray(doc.todos) || typeof doc.idKeTiep !== 'number') {
          throw new Error('Cấu trúc file dữ liệu không hợp lệ');
        }
        duLieu = doc;
      } catch (err) {
        // Lần chạy đầu tiên chưa có file — hoàn toàn bình thường
        if (err.code !== 'ENOENT') throw err;
        await ghi();
      }
      return duLieu.todos.length;
    },

    /** Trả BẢN SAO để tầng trên không sửa trực tiếp state bên trong. */
    layTatCa() {
      return duLieu.todos.map((t) => ({ ...t }));
    },

    layTheoId(id) {
      const todo = duLieu.todos.find((t) => t.id === id);
      return todo ? { ...todo } : null;
    },

    async them(banGhi) {
      const todoMoi = {
        id: duLieu.idKeTiep++,
        ...banGhi,
        taoLuc: new Date().toISOString(),
        suaLuc: null,
      };
      duLieu.todos.push(todoMoi);
      await ghi();
      return { ...todoMoi };
    },

    async capNhat(id, thayDoi) {
      const todo = duLieu.todos.find((t) => t.id === id);
      if (!todo) return null;

      Object.assign(todo, thayDoi, { suaLuc: new Date().toISOString() });
      await ghi();
      return { ...todo };
    },

    async xoa(id) {
      const viTri = duLieu.todos.findIndex((t) => t.id === id);
      if (viTri === -1) return false;

      duLieu.todos.splice(viTri, 1);
      await ghi();
      return true;
    },

    /** Chờ mọi lần ghi đang chờ hoàn tất — dùng khi graceful shutdown. */
    async doiGhiXong() {
      await hangDoiGhi;
    },
  };
}
