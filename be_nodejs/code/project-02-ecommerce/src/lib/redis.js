/**
 * Buổi 21 — Redis: cache, rate limit, session store.
 */

import Redis from 'ioredis';

let _redis = null;

export function layRedis() {
  if (_redis) return _redis;

  _redis = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6380', {
    // Không thử lại vô hạn — thà biết sớm là Redis chết còn hơn treo request
    maxRetriesPerRequest: 2,
    // Cho phép ứng dụng khởi động dù Redis chưa sẵn sàng.
    // ⚠️ NGUYÊN TẮC: cache chết thì ứng dụng CHẬM, không được CHẾT theo.
    lazyConnect: false,
    retryStrategy: (soLan) => Math.min(soLan * 200, 3000),
  });

  _redis.on('error', (err) => {
    // KHÔNG ném lỗi ở đây — nếu không, một sự cố Redis sẽ giết tiến trình
    console.error('[redis] lỗi kết nối:', err.message);
  });

  return _redis;
}

export async function dongRedis() {
  if (_redis) {
    await _redis.quit().catch(() => _redis.disconnect());
    _redis = null;
  }
}

// ═══════════════════════════════════════════════════════════════
// CACHE-ASIDE
// ═══════════════════════════════════════════════════════════════

/**
 * Mẫu cache-aside (lazy loading) — mẫu cache phổ biến nhất:
 *
 *   1. Đọc cache. Có → trả về ngay (cache HIT)
 *   2. Không có → gọi hàm lấy dữ liệu thật (cache MISS)
 *   3. Ghi vào cache kèm TTL
 *   4. Trả về
 *
 * ⚠️ MỌI thao tác Redis đều bọc try/catch: Redis chết thì
 * ứng dụng vẫn chạy, chỉ là chậm hơn vì luôn phải hỏi database.
 */
export async function cacheAside(khoa, ttlGiay, layDuLieuThat) {
  const redis = layRedis();

  try {
    const daCache = await redis.get(khoa);
    if (daCache !== null) {
      return { duLieu: JSON.parse(daCache), tuCache: true };
    }
  } catch (err) {
    console.error('[cache] đọc lỗi, bỏ qua cache:', err.message);
  }

  const duLieu = await layDuLieuThat();

  try {
    // SET với EX = tự hết hạn sau ttlGiay. Không có TTL thì cache
    // giữ dữ liệu cũ VĨNH VIỄN — lỗi nguy hiểm và rất hay gặp.
    await redis.set(khoa, JSON.stringify(duLieu), 'EX', ttlGiay);
  } catch (err) {
    console.error('[cache] ghi lỗi, bỏ qua:', err.message);
  }

  return { duLieu, tuCache: false };
}

/**
 * Xoá cache theo mẫu khoá.
 *
 * ⚠️ KHÔNG dùng lệnh KEYS ở production — nó CHẶN Redis
 * (đơn luồng, giống Node ở buổi 02) trong lúc quét toàn bộ key.
 * SCAN duyệt từng phần, không chặn.
 */
export async function xoaCacheTheoMau(mau) {
  const redis = layRedis();
  let cursor = '0';
  let daXoa = 0;

  try {
    do {
      const [cursorMoi, khoas] = await redis.scan(cursor, 'MATCH', mau, 'COUNT', 100);
      cursor = cursorMoi;
      if (khoas.length > 0) {
        await redis.del(...khoas);
        daXoa += khoas.length;
      }
    } while (cursor !== '0');
  } catch (err) {
    console.error('[cache] xoá lỗi:', err.message);
  }

  return daXoa;
}

// ═══════════════════════════════════════════════════════════════
// RATE LIMIT DÙNG CHUNG NHIỀU TIẾN TRÌNH
// ═══════════════════════════════════════════════════════════════

/**
 * Rate limit ở buổi 11 dùng Map trong RAM → mỗi bản sao server đếm riêng.
 * Chạy 4 bản sao thì giới hạn thật bị nhân lên 4 lần.
 *
 * Redis là bộ đếm DÙNG CHUNG, nên giới hạn đúng dù có bao nhiêu bản sao.
 */
export async function demRateLimit(khoa, cuaSoGiay) {
  const redis = layRedis();

  // Gộp INCR + EXPIRE vào MỘT lượt đi mạng.
  // Quan trọng hơn: pipeline đảm bảo hai lệnh chạy liền nhau,
  // không bị request khác chen vào giữa.
  const kq = await redis
    .multi()
    .incr(khoa)
    .expire(khoa, cuaSoGiay, 'NX') // NX: chỉ đặt TTL nếu key CHƯA có TTL
    .ttl(khoa)
    .exec();

  const dem = kq[0][1];
  const ttl = kq[2][1];
  return { dem, conLaiGiay: ttl > 0 ? ttl : cuaSoGiay };
}
