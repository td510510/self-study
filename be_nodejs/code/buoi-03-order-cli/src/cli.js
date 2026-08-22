#!/usr/bin/env node
import { writeFile } from 'node:fs/promises';
import { loadOrders, DataError } from './loader.js';
import { filterByStatus, summarize, topCustomers, groupByStatus } from './report.js';
import { renderReport } from './format.js';

function parseArgs(argv) {
  const args = { status: null, top: null, out: null, help: false };

  for (const raw of argv.slice(2)) {
    if (raw === '--help' || raw === '-h') { args.help = true; continue; }

    const match = raw.match(/^--([a-zA-Z]+)=(.*)$/);
    if (!match) {
      throw new DataError(`Tham số không hợp lệ: ${raw}  (dùng --help để xem hướng dẫn)`);
    }

    const [, key, value] = match;
    if (!(key in args)) {
      throw new DataError(`Không hiểu tham số --${key}`);
    }
    args[key] = value;
  }

  return args;
}

const HELP = `
order-cli — công cụ thống kê đơn hàng

  node src/cli.js [tuỳ chọn]

Tuỳ chọn:
  --status=paid|pending|cancelled   chỉ tính các đơn có trạng thái này
  --top=5                           số khách hàng hàng đầu cần hiển thị
  --out=bao-cao.txt                 ghi báo cáo ra file thay vì in ra màn hình
  --help                            hiển thị hướng dẫn này
`;

async function main() {
  const args = parseArgs(process.argv);

  if (args.help) {
    console.log(HELP);
    return;
  }

  const dataFile = process.env.DATA_FILE ?? './data/orders.json';
  const currency = process.env.CURRENCY ?? 'VND';
  const top = Number(args.top ?? process.env.DEFAULT_TOP ?? 3);

  if (!Number.isInteger(top) || top < 1) {
    throw new DataError(`--top phải là số nguyên dương, nhận được: ${args.top}`);
  }

  const all = await loadOrders(dataFile);
  const orders = filterByStatus(all, args.status);

  const output = renderReport({
    summary: summarize(orders),
    top: topCustomers(orders, top),
    byStatus: groupByStatus(orders),
    currency,
    filter: args.status,
  });

  if (args.out) {
    await writeFile(args.out, output.replace(/\x1b\[\d+m/g, ''), 'utf8');
    console.log(`Đã ghi báo cáo vào ${args.out}`);
  } else {
    console.log(output);
  }
}

main().catch((err) => {
  if (err instanceof DataError) {
    console.error(`\n✖ ${err.message}\n`);
    process.exit(1);
  }
  console.error('\n✖ Lỗi không mong đợi:\n', err);
  process.exit(2);
});
