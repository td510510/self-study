const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const GREEN = '\x1b[32m';
const RESET = '\x1b[0m';

export function money(amount, currency = 'VND') {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency', currency, maximumFractionDigits: 0,
  }).format(amount);
}

export function renderReport({ summary, top, byStatus, currency, filter }) {
  const lines = [];

  lines.push('');
  lines.push(`${BOLD}BÁO CÁO ĐƠN HÀNG${RESET}` + (filter ? `${DIM} — lọc: ${filter}${RESET}` : ''));
  lines.push('─'.repeat(46));

  lines.push(`Số đơn          : ${summary.orderCount}`);
  lines.push(`Tổng sản phẩm   : ${summary.itemCount}`);
  lines.push(`Doanh thu       : ${GREEN}${money(summary.revenue, currency)}${RESET}`);
  lines.push(`Giá trị TB/đơn  : ${money(summary.avgOrderValue, currency)}`);

  lines.push('');
  lines.push(`${BOLD}Theo trạng thái${RESET}`);
  for (const [status, count] of Object.entries(byStatus)) {
    lines.push(`  ${status.padEnd(12)} ${String(count).padStart(3)}`);
  }

  lines.push('');
  lines.push(`${BOLD}Khách hàng hàng đầu${RESET}`);
  top.forEach((c, i) => {
    lines.push(
      `  ${i + 1}. ${c.customer.padEnd(14)} ` +
      `${money(c.revenue, currency).padStart(16)} ${DIM}(${c.orders} đơn)${RESET}`
    );
  });

  lines.push('');
  return lines.join('\n');
}
