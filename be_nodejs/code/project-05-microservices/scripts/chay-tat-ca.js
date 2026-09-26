/**
 * Chạy cả ba dịch vụ trong một cửa sổ terminal, mỗi dòng log có tiền tố tên dịch vụ.
 *   npm run tat-ca        (Ctrl+C để tắt êm cả ba)
 *
 * Muốn diễn tập "một dịch vụ chết" (buổi 55) thì chạy riêng từng cái:
 *   npm run don-hang  |  npm run kho  |  npm run thong-bao
 */
import { spawn } from 'node:child_process';

const MAU = { 'don-hang': 36, kho: 33, 'thong-bao': 35 };

const con = Object.keys(MAU).map((ten) => {
  const p = spawn(process.execPath, ['--env-file=.env', '--import', './shared/tracing.js', `services/${ten}/main.js`], {
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const tienTo = `\x1b[${MAU[ten]}m${ten.padEnd(9)}\x1b[0m│ `;
  for (const luong of [p.stdout, p.stderr]) {
    let du = '';
    luong.on('data', (b) => {
      const dong = (du + b).split('\n');
      du = dong.pop();
      for (const d of dong) console.log(tienTo + d);
    });
  }
  p.on('exit', (code) => console.log(`${tienTo}thoát với mã ${code}`));
  return p;
});

// Windows không có SIGTERM thật cho tiến trình con → gửi SIGINT
process.on('SIGINT', () => con.forEach((p) => p.kill('SIGINT')));
// Tiến trình cha bị giết kiểu khác → đừng để con mồ côi giữ cổng
process.on('exit', () => con.forEach((p) => p.kill()));
