/**
 * LAB 09.3 — Bốn thuật toán Rate Limiting
 */

/** 1. FIXED WINDOW — đơn giản nhất, nhưng cho lọt 2× ở ranh giới cửa sổ. */
export class FixedWindow {
  constructor(gioiHan, cuaSoMs) {
    this.gioiHan = gioiHan;
    this.cuaSoMs = cuaSoMs;
    this.dem = new Map(); // `${key}:${window}` -> số đếm
  }
  chophep(key, now = Date.now()) {
    const w = Math.floor(now / this.cuaSoMs);
    const k = `${key}:${w}`;
    const n = (this.dem.get(k) ?? 0) + 1;
    this.dem.set(k, n);
    return n <= this.gioiHan;
  }
}

/** 2. SLIDING WINDOW LOG — chính xác tuyệt đối, nhưng lưu MỌI timestamp. */
export class SlidingLog {
  constructor(gioiHan, cuaSoMs) {
    this.gioiHan = gioiHan;
    this.cuaSoMs = cuaSoMs;
    this.log = new Map(); // key -> [timestamp]
  }
  chophep(key, now = Date.now()) {
    const arr = this.log.get(key) ?? [];
    const cat = now - this.cuaSoMs;
    while (arr.length && arr[0] <= cat) arr.shift();
    if (arr.length >= this.gioiHan) {
      this.log.set(key, arr);
      return false;
    }
    arr.push(now);
    this.log.set(key, arr);
    return true;
  }
  get bonhoMoiKey() {
    return [...this.log.values()].reduce((s, a) => s + a.length, 0);
  }
}

/** 3. SLIDING WINDOW COUNTER — nội suy giữa cửa sổ trước và hiện tại. Cân bằng tốt. */
export class SlidingCounter {
  constructor(gioiHan, cuaSoMs) {
    this.gioiHan = gioiHan;
    this.cuaSoMs = cuaSoMs;
    this.dem = new Map();
  }
  chophep(key, now = Date.now()) {
    const w = Math.floor(now / this.cuaSoMs);
    const tyLeDaTroi = (now % this.cuaSoMs) / this.cuaSoMs;
    const hienTai = this.dem.get(`${key}:${w}`) ?? 0;
    const truoc = this.dem.get(`${key}:${w - 1}`) ?? 0;
    // Ước lượng: phần còn lại của cửa sổ trước + toàn bộ cửa sổ hiện tại
    const uocLuong = truoc * (1 - tyLeDaTroi) + hienTai;
    if (uocLuong >= this.gioiHan) return false;
    this.dem.set(`${key}:${w}`, hienTai + 1);
    return true;
  }
}

/**
 * 4. TOKEN BUCKET ⭐ — lựa chọn mặc định tốt nhất.
 * Token nhỏ giọt vào xô với tốc độ cố định; mỗi request tiêu 1 token.
 * Xô có sức chứa → cho phép BURST ngắn (tốt cho trải nghiệm) nhưng
 * giới hạn tốc độ TRUNG BÌNH dài hạn.
 */
export class TokenBucket {
  constructor(tocDoMoiGiay, sucChua) {
    this.tocDo = tocDoMoiGiay;
    this.sucChua = sucChua;
    this.xo = new Map(); // key -> { token, capNhatLuc }
  }
  chophep(key, now = Date.now(), tieuThu = 1) {
    let b = this.xo.get(key);
    if (!b) {
      b = { token: this.sucChua, capNhatLuc: now };
      this.xo.set(key, b);
    }
    // Nhỏ giọt token theo thời gian đã trôi qua
    const troiQua = (now - b.capNhatLuc) / 1000;
    b.token = Math.min(this.sucChua, b.token + troiQua * this.tocDo);
    b.capNhatLuc = now;

    if (b.token >= tieuThu) {
      b.token -= tieuThu;
      return true;
    }
    return false;
  }
  /** Bao lâu nữa thì có token? → dùng cho header Retry-After. */
  choBaoLau(key, now = Date.now()) {
    const b = this.xo.get(key);
    if (!b || b.token >= 1) return 0;
    return Math.ceil(((1 - b.token) / this.tocDo) * 1000);
  }
}
