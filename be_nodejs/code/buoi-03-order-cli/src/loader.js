import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

export class DataError extends Error {
  constructor(message, { cause } = {}) {
    super(message, { cause });
    this.name = 'DataError';
  }
}

export async function loadOrders(filePath) {
  const abs = resolve(process.cwd(), filePath);

  let raw;
  try {
    raw = await readFile(abs, 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') {
      throw new DataError(`Không tìm thấy file dữ liệu: ${abs}`, { cause: err });
    }
    if (err.code === 'EACCES') {
      throw new DataError(`Không có quyền đọc file: ${abs}`, { cause: err });
    }
    throw err;
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new DataError('File dữ liệu không phải JSON hợp lệ', { cause: err });
  }

  if (!Array.isArray(parsed)) {
    throw new DataError('File dữ liệu phải là một mảng đơn hàng');
  }

  parsed.forEach((o, i) => {
    if (typeof o.total !== 'number' || Number.isNaN(o.total)) {
      throw new DataError(`Đơn hàng thứ ${i} (${o.id ?? 'không rõ id'}) có total không hợp lệ`);
    }
  });

  return parsed;
}
