export function filterByStatus(orders, status) {
  if (!status) return orders;
  return orders.filter((o) => o.status === status);
}

export function summarize(orders) {
  const revenue = orders.reduce((sum, o) => sum + o.total, 0);
  const itemCount = orders.reduce((sum, o) => sum + o.items, 0);

  return {
    orderCount: orders.length,
    revenue,
    itemCount,
    avgOrderValue: orders.length ? Math.round(revenue / orders.length) : 0,
  };
}

export function topCustomers(orders, limit = 3) {
  const byCustomer = new Map();

  for (const o of orders) {
    const prev = byCustomer.get(o.customer) ?? { customer: o.customer, revenue: 0, orders: 0 };
    prev.revenue += o.total;
    prev.orders += 1;
    byCustomer.set(o.customer, prev);
  }

  return [...byCustomer.values()]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);
}

export function groupByStatus(orders) {
  const acc = {};
  for (const o of orders) {
    acc[o.status] = (acc[o.status] ?? 0) + 1;
  }
  return acc;
}
