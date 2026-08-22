/**
 * Buổi 02 — Trò chơi đoán thứ tự.
 *
 * CHƯA CHẠY VỘI. Học viên viết dự đoán ra giấy trước, nộp lại, rồi mới chạy.
 * Sai lệch giữa dự đoán và thực tế chính là bài học.
 *
 * Chạy:  node 01-order-quiz.js
 * Chạy 5 lần liên tiếp để thấy B/C đổi chỗ.
 */

console.log('A — đồng bộ, chạy ngay');

setTimeout(() => console.log('B — setTimeout 0ms'), 0);

setImmediate(() => console.log('C — setImmediate'));

Promise.resolve().then(() => console.log('D — microtask (Promise)'));

process.nextTick(() => console.log('E — nextTick'));

console.log('F — đồng bộ, chạy ngay');

/*
 * ĐÁP ÁN:  A → F → E → D → B/C (hoặc C/B)
 *
 * GIẢI THÍCH
 *
 * 1. A, F chạy trước
 *    Code đồng bộ chạy HẾT trước khi Event Loop bắt đầu quay.
 *
 * 2. E (nextTick) đứng trước D (Promise)
 *    Hàng đợi nextTick có ưu tiên CAO HƠN microtask queue.
 *    Sau mỗi callback, Node vét sạch nextTick trước, rồi mới tới Promise.
 *
 * 3. B và C KHÔNG XÁC ĐỊNH thứ tự khi chạy ở module chính
 *    Lý do: phụ thuộc vào việc tiến trình khởi động mất bao nhiêu mili-giây.
 *    - Nếu khởi động > 1ms → timer đã "chín", pha timers chạy trước → B trước C
 *    - Nếu khởi động < 1ms → timer chưa chín, vòng lặp đi tiếp tới pha check → C trước B
 *
 *    CHẠY 5 LẦN LIÊN TIẾP ĐỂ CHỨNG MINH:
 *      for i in 1 2 3 4 5; do node 01-order-quiz.js | tail -2; echo "---"; done
 *
 *    Đây là chi tiết học viên hay tranh cãi. Đừng bỏ qua.
 */
