/**
 * Buổi 06 — Bước 1: Buffer là gì.
 *
 * Chạy:  node 01-buffer-co-ban.js
 */

const chuoi = 'Xin chào';

console.log('=== CHUỖI vs BUFFER ===\n');
console.log('Chuỗi          :', chuoi);
console.log('Số ký tự       :', chuoi.length); // 8
console.log('Số byte (UTF-8):', Buffer.byteLength(chuoi)); // 9 — vì 'à' tốn 2 byte

const buf = Buffer.from(chuoi, 'utf8');
console.log('Buffer         :', buf);
console.log('Dạng hex       :', buf.toString('hex'));
console.log('Độ dài buffer  :', buf.length, 'byte\n');

// Vì sao lệch? Ký tự có dấu tốn nhiều byte hơn.
console.log('=== TỪNG KÝ TỰ CHIẾM BAO NHIÊU BYTE ===\n');
for (const kyTu of chuoi) {
  const soByte = Buffer.byteLength(kyTu);
  console.log(`  '${kyTu}'  →  ${soByte} byte  →  ${Buffer.from(kyTu).toString('hex')}`);
}

console.log('\n=== CẮT BUFFER GIỮA MỘT KÝ TỰ ===\n');

// Buffer: 58 69 6e 20 63 68 | c3 a0 | 6f
//         X  i  n  ␣  c  h  |  à(2)  | o
//                        index: 6  7
//
// 'à' chiếm byte thứ 6 và 7. Cắt ở GIỮA nó — tại vị trí 7.
// Đây mô phỏng đúng việc stream cắt dữ liệu thành chunk: cắt theo BYTE,
// không quan tâm ranh giới ký tự.
const nua1 = buf.subarray(0, 7); // 'Xin ch' + nửa đầu của 'à'
const nua2 = buf.subarray(7); //           nửa sau của 'à' + 'o'

console.log('Nửa 1 → chuỗi  :', JSON.stringify(nua1.toString('utf8')));
console.log('Nửa 2 → chuỗi  :', JSON.stringify(nua2.toString('utf8')));
console.log('Ghép chuỗi lại :', JSON.stringify(nua1.toString('utf8') + nua2.toString('utf8')));
console.log('               ↑ HỎNG! Ký tự bị vỡ thành � \n');

console.log('Ghép BUFFER lại:', JSON.stringify(Buffer.concat([nua1, nua2]).toString('utf8')));
console.log('               ↑ ĐÚNG. Vì ta ghép byte trước, decode sau\n');

/*
 * ĐÂY LÀ LÝ DO Ở BUỔI 05 TA VIẾT:
 *
 *   req.on('end', () => resolve(Buffer.concat(chunks)));   ← ĐÚNG
 *
 * chứ KHÔNG viết:
 *
 *   let s = '';
 *   req.on('data', c => s += c.toString());                ← SAI
 *
 * Vì stream cắt dữ liệu theo BYTE, không quan tâm ranh giới ký tự.
 * Một chữ tiếng Việt có thể bị cắt đôi giữa hai chunk.
 *
 * QUY TẮC: gom Buffer trước, toString('utf8') MỘT LẦN ở cuối.
 */
