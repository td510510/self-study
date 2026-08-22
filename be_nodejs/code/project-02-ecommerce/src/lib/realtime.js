/**
 * Buổi 25 — Realtime với Socket.IO.
 *
 * VÌ SAO CẦN? HTTP là request-response: client HỎI, server TRẢ LỜI.
 * Server KHÔNG có cách nào chủ động báo cho client.
 *
 * Muốn client biết đơn hàng đổi trạng thái, ba lựa chọn:
 *   1. Polling      — client hỏi mỗi 5 giây. Tốn tài nguyên, vẫn trễ.
 *   2. Long polling — client hỏi, server GIỮ request tới khi có tin.
 *   3. WebSocket    — mở một kết nối HAI CHIỀU, giữ mãi.
 */

import { Server } from 'socket.io';
import { xacThucAccessToken } from '../modules/auth/token.js';

let _io = null;

export function taoRealtime(httpServer, { origins, logger }) {
  const io = new Server(httpServer, {
    cors: { origin: origins, credentials: true },
    // Nếu WebSocket bị firewall chặn, tự lùi về long-polling
    transports: ['websocket', 'polling'],
  });

  /**
   * ⚠️ XÁC THỰC PHẢI LÀM Ở ĐÂY, không phải trong từng sự kiện.
   *
   * WebSocket KHÔNG tự động kèm header Authorization như HTTP.
   * Không xác thực lúc bắt tay = ai cũng kết nối và nghe được mọi thứ.
   */
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Thiếu token'));

    try {
      const payload = xacThucAccessToken(token);
      socket.nguoiDung = {
        id: Number(payload.sub),
        email: payload.email,
        vaiTro: payload.vaiTro,
      };
      next();
    } catch {
      next(new Error('Token không hợp lệ'));
    }
  });

  io.on('connection', (socket) => {
    const nd = socket.nguoiDung;
    logger?.info?.({ userId: nd.id, socketId: socket.id }, 'realtime: kết nối');

    // ROOM = nhóm socket. Đây là cách gửi tin cho ĐÚNG người.
    //
    // ⚠️ Tên room lấy từ TOKEN, không phải từ client gửi lên.
    // Nếu để client tự chọn room, ai cũng vào room của người khác
    // và nghe được đơn hàng của họ — cùng lỗi với cache (buổi 21)
    // và idempotency key (buổi 24).
    socket.join(`user:${nd.id}`);

    if (nd.vaiTro === 'admin' || nd.vaiTro === 'nhanVien') {
      socket.join('nhan-vien');
    }

    socket.on('disconnect', (lyDo) => {
      logger?.debug?.({ userId: nd.id, lyDo }, 'realtime: ngắt kết nối');
    });
  });

  _io = io;
  return io;
}

export function layIo() {
  return _io;
}

/** Báo cho MỘT người dùng cụ thể. */
export function baoChoNguoiDung(userId, suKien, duLieu) {
  _io?.to(`user:${userId}`).emit(suKien, duLieu);
}

/** Báo cho toàn bộ nhân viên/admin đang online. */
export function baoChoNhanVien(suKien, duLieu) {
  _io?.to('nhan-vien').emit(suKien, duLieu);
}

export async function dongRealtime() {
  if (_io) {
    await new Promise((r) => _io.close(r));
    _io = null;
  }
}
