# 🔢 NumPy — Cheatsheet

> NumPy là nền móng của toàn bộ hệ sinh thái AI: pandas, scikit-learn, PyTorch đều xây trên nó.
> Ý tưởng cốt lõi: **thay vòng lặp Python bằng phép toán trên cả mảng** → nhanh hơn 10–100 lần.

```python
import numpy as np
```

## Tạo mảng

```python
np.array([1, 2, 3])                  # từ list
np.array([[1, 2], [3, 4]])           # 2 chiều

np.zeros((2, 3))                     # ma trận 0
np.ones((2, 3))                      # ma trận 1
np.full((2, 3), 7)                   # điền toàn số 7
np.eye(3)                            # ma trận đơn vị
np.arange(0, 10, 2)                  # [0 2 4 6 8]
np.linspace(0, 1, 5)                 # [0. 0.25 0.5 0.75 1.] — chia đều 5 điểm

rng = np.random.default_rng(42)      # ✅ cách tạo số ngẫu nhiên hiện đại, có seed
rng.random((2, 3))                   # số thực ngẫu nhiên [0,1)
rng.normal(0, 1, size=100)           # phân phối chuẩn
rng.integers(0, 10, size=5)          # số nguyên ngẫu nhiên
```

> 🎲 **Luôn đặt seed** khi làm thí nghiệm — để chạy lại ra kết quả giống hệt, có thể so sánh được.

## Thuộc tính

```python
a.shape      # (2, 3)  — kích thước từng chiều  ← xem LIÊN TỤC
a.ndim       # 2       — số chiều
a.size       # 6       — tổng số phần tử
a.dtype      # float64 — kiểu dữ liệu
a.T          # chuyển vị
```

> 🔑 **90% lỗi NumPy/PyTorch là lỗi shape.** Khi bí, `print(a.shape)` trước tiên.

---

## Truy cập & cắt lát

```python
a[0]           # hàng đầu
a[0, 1]        # hàng 0 cột 1
a[:, 0]        # TẤT CẢ hàng, cột 0
a[1:3, :2]     # hàng 1-2, cột 0-1
a[-1]          # hàng cuối

# Lập chỉ mục theo điều kiện (boolean indexing) — cực kỳ hay dùng
a[a > 5]                 # các phần tử lớn hơn 5
a[a > 5] = 0             # gán 0 cho các phần tử lớn hơn 5
np.where(a > 5, 1, 0)    # nếu >5 thì 1, ngược lại 0
```

## Đổi hình dạng

```python
a.reshape(3, 2)        # đổi shape (số phần tử phải khớp)
a.reshape(-1, 1)       # -1 = "tự tính giúp tôi" → thành cột
a.flatten()            # duỗi thành 1 chiều
a[:, np.newaxis]       # thêm một chiều
np.concatenate([a, b], axis=0)    # nối theo hàng
np.vstack([a, b])  /  np.hstack([a, b])
```

---

## Phép toán (vectorized)

```python
a + b     a - b     a * b     a / b     a ** 2      # từng phần tử
a + 10                                              # cộng vào mọi phần tử
np.sqrt(a)   np.exp(a)   np.log(a)   np.abs(a)
np.round(a, 2)

a @ b               # NHÂN MA TRẬN (không phải a * b!)
np.dot(a, b)        # tương đương
```

> ⚠️ Phân biệt: `a * b` là nhân **từng phần tử**, `a @ b` là nhân **ma trận**. Nhầm hai cái này là bug kinh điển.

## Thống kê

```python
a.sum()      a.mean()     a.std()     a.var()
a.min()      a.max()      a.median()  # np.median(a)

a.sum(axis=0)      # cộng theo CỘT  (gộp các hàng lại)
a.sum(axis=1)      # cộng theo HÀNG (gộp các cột lại)

a.argmin()  /  a.argmax()      # VỊ TRÍ của giá trị nhỏ/lớn nhất
np.percentile(a, [25, 50, 75])
np.unique(a, return_counts=True)
```

**Mẹo nhớ `axis`:** `axis=0` là chiều đi xuống ↓ (gộp các hàng, còn lại cột) · `axis=1` là chiều đi ngang → (gộp các cột, còn lại hàng).

---

## Broadcasting

NumPy tự động "kéo giãn" mảng nhỏ cho khớp mảng lớn:

```python
a = np.array([[1, 2, 3],
              [4, 5, 6]])        # shape (2, 3)
b = np.array([10, 20, 30])       # shape (3,)

a + b       # b được lặp cho từng hàng → [[11,22,33],[14,25,36]]
```

**Quy tắc:** so shape từ **phải sang trái**, hai chiều tương thích khi bằng nhau hoặc một trong hai bằng 1.

```
(2, 3)  +  (3,)     → (3,) hiểu là (1,3) → OK, kết quả (2,3)
(3, 1)  +  (1, 4)   → OK, kết quả (3, 4)
(2, 3)  +  (2,)     → ❌ lỗi: 3 vs 2 không tương thích
```

Ứng dụng thường gặp — chuẩn hoá từng cột:
```python
a_scaled = (a - a.mean(axis=0)) / a.std(axis=0)
```

---

## Ứng dụng trong ML

```python
# Dữ liệu chuẩn: X shape (n_mau, n_dac_trung), y shape (n_mau,)
X = rng.normal(size=(100, 3))
w = np.array([2.0, -1.0, 0.5])
b = 1.0

y_pred = X @ w + b                          # dự đoán tuyến tính
mse = np.mean((y_pred - y_true) ** 2)       # hàm mất mát
sigmoid = 1 / (1 + np.exp(-z))              # xác suất
```

---

## Bẫy hay gặp

| Bẫy | Hậu quả | Cách tránh |
|---|---|---|
| `a * b` vs `a @ b` | Kết quả sai âm thầm | Kiểm tra `shape` của kết quả |
| Slice là **view**, không phải copy | Sửa slice làm đổi mảng gốc | Dùng `a[1:3].copy()` |
| Nhầm `axis=0` / `axis=1` | Tính sai chiều | In `.shape` trước và sau |
| Kiểu int bị tràn/làm tròn | `np.array([1,2])/2` ổn nhưng `//` thì mất phần lẻ | Ép `.astype(float)` |
| Dùng `for` để duyệt mảng lớn | Chậm 100 lần | Tìm phép vectorized tương đương |
| `np.random.seed()` cũ | Không tái lập được | Dùng `np.random.default_rng(42)` |
