/**
 * Buổi 02 — Trường hợp thứ tự trở nên XÁC ĐỊNH.
 *
 * Chạy:  node 02-order-in-io.js
 * Chạy bao nhiêu lần cũng ra một kết quả.
 */

const fs = require('fs');

// Bên trong một callback I/O, ta đang đứng ở pha "poll".
// Pha "check" (setImmediate) đến NGAY SAU ĐÓ trong cùng vòng lặp,
// còn "timers" phải chờ hết một vòng lặp nữa mới tới.
fs.readFile(__filename, () => {
  setTimeout(() => console.log('setTimeout   — luôn đứng SAU'), 0);
  setImmediate(() => console.log('setImmediate — luôn đứng TRƯỚC'));
});

/*
 * ĐÁP ÁN (không đổi qua các lần chạy):
 *   setImmediate — luôn đứng TRƯỚC
 *   setTimeout   — luôn đứng SAU
 *
 * BÀI HỌC RÚT RA
 *   Vị trí trong Event Loop quyết định hành vi,
 *   KHÔNG phải con số 0ms bạn viết trong setTimeout.
 *
 * Nhắc lại sơ đồ các pha:
 *
 *    ┌──────────────────────────────┐
 * ┌─>│           timers             │  setTimeout / setInterval
 * │  ├──────────────────────────────┤
 * │  │      pending callbacks       │
 * │  ├──────────────────────────────┤
 * │  │       idle, prepare          │  nội bộ libuv
 * │  ├──────────────────────────────┤     ┌───────────────┐
 * │  │           poll               │<────┤  I/O đến nơi  │  ← TA ĐANG Ở ĐÂY
 * │  ├──────────────────────────────┤     └───────────────┘
 * │  │           check              │  setImmediate       ← tới đây ngay
 * │  ├──────────────────────────────┤
 * │  │      close callbacks         │
 * └──┴──────────────────────────────┘
 *              │
 *              └──> quay lại timers (setTimeout mới được chạy)
 */
