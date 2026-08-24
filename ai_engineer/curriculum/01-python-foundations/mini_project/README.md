# 🛠 Mini-project Phase 01 — CLI Quản lý chi tiêu

**Thời gian:** 5–8 giờ (Tuần 4) · **Không có lời giải**

---

## Đề bài

Viết một chương trình dòng lệnh giúp bạn ghi chép và phân tích chi tiêu cá nhân, **lưu dữ liệu ra file** để lần chạy sau vẫn còn.

Đây là bài tổng hợp: dùng gần như mọi thứ bạn học trong 3 tuần qua — hàm, dict, list, file I/O, class, xử lý lỗi, và test.

---

## Cấu trúc file bắt buộc

Tách code thành nhiều module, **không viết tất cả vào một file**:

```
mini_project/
├── main.py           # vòng lặp menu, nhận input người dùng
├── mo_hinh.py        # dataclass GiaoDich
├── luu_tru.py        # đọc/ghi JSON
├── phan_tich.py      # các hàm thống kê (KHÔNG có print, chỉ return)
├── test_phan_tich.py # test cho phan_tich.py
└── data/
    └── giao_dich.json
```

> **Vì sao tách?** Vì `phan_tich.py` không có `print` và không đọc file nên **test được dễ dàng**. Đây chính là nguyên tắc bạn sẽ dùng suốt sự nghiệp: tách *logic* khỏi *giao diện* và *lưu trữ*.

---

## Yêu cầu chức năng

### Bắt buộc

- [ ] **Thêm giao dịch**: ngày, số tiền, danh mục (ăn uống / đi lại / mua sắm / khác), ghi chú
- [ ] **Xem danh sách** giao dịch, sắp xếp theo ngày mới nhất
- [ ] **Xoá** một giao dịch theo số thứ tự
- [ ] **Thống kê**:
  - Tổng chi trong tháng
  - Chi theo từng danh mục (kèm % trên tổng)
  - Danh mục tốn nhiều tiền nhất
  - Trung bình mỗi ngày
- [ ] **Lưu tự động** ra file JSON, lần chạy sau đọc lại được
- [ ] **Xử lý lỗi**: người dùng gõ chữ vào ô số tiền, chọn menu không tồn tại, file JSON hỏng — chương trình **không được crash**
- [ ] **Ít nhất 5 test** cho các hàm trong `phan_tich.py`, chạy `pytest` xanh

### Nâng cao (làm nếu còn sức)

- [ ] Tìm kiếm theo từ khoá trong ghi chú
- [ ] Lọc theo khoảng ngày
- [ ] Đặt hạn mức cho từng danh mục, cảnh báo khi vượt
- [ ] Xuất báo cáo ra CSV (mở được bằng Excel, tiếng Việt không lỗi)
- [ ] Biểu đồ cột bằng ký tự ASCII trong terminal
- [ ] Dùng `argparse` để chạy nhanh không cần menu: `python main.py them 50000 "an uong"`

---

## Ví dụ giao diện

```
==================================================
        QUAN LY CHI TIEU - Thang 8/2026
==================================================
  Tong chi:  4,850,000 VND
  Con lai:   1,150,000 / 6,000,000 VND

  1. Them giao dich
  2. Xem danh sach
  3. Thong ke
  4. Xoa giao dich
  0. Thoat
--------------------------------------------------
Chon: 3

--- THONG KE THANG 8/2026 ---

  An uong    2,400,000  ####################  49.5%
  Di lai       950,000  ########             19.6%
  Mua sam    1,200,000  ##########           24.7%
  Khac         300,000  ##                    6.2%
  --------------------------------------------
  TONG       4,850,000                       100.0%

  Ton nhieu nhat : An uong (2,400,000 VND)
  Trung binh/ngay:   156,452 VND
  So giao dich   : 23
```

---

## Gợi ý bắt đầu

### 1. Thiết kế dữ liệu trước, code sau

```python
# mo_hinh.py
from dataclasses import dataclass, asdict

@dataclass
class GiaoDich:
    ngay: str          # "2026-08-22"  — dùng ISO để sắp xếp bằng chuỗi luôn được
    so_tien: float
    danh_muc: str
    ghi_chu: str = ""

    def to_dict(self) -> dict:
        return asdict(self)

    @classmethod
    def from_dict(cls, d: dict) -> "GiaoDich":
        return cls(**d)
```

> 💡 Dùng định dạng ngày `YYYY-MM-DD` thì sắp xếp chuỗi cũng ra đúng thứ tự thời gian — mẹo nhỏ tiết kiệm rất nhiều công.

### 2. Hàm phân tích phải THUẦN KHIẾT

```python
# phan_tich.py  — không print, không đọc file, chỉ nhận vào và trả về
def tong_theo_danh_muc(giao_dich: list[GiaoDich]) -> dict[str, float]:
    ket_qua = {}
    for gd in giao_dich:
        ket_qua[gd.danh_muc] = ket_qua.get(gd.danh_muc, 0) + gd.so_tien
    return ket_qua
```

Nhờ vậy test cực dễ:
```python
def test_tong_theo_danh_muc():
    gd = [GiaoDich("2026-08-01", 100, "an"), GiaoDich("2026-08-02", 50, "an")]
    assert tong_theo_danh_muc(gd) == {"an": 150}
```

### 3. Thứ tự làm việc gợi ý

1. `mo_hinh.py` — dataclass, chạy thử tạo vài đối tượng
2. `phan_tich.py` + `test_phan_tich.py` — **viết test trước hoặc song song**
3. `luu_tru.py` — đọc/ghi JSON, nhớ `ensure_ascii=False`
4. `main.py` — menu, ghép mọi thứ lại
5. Nâng cao — chỉ khi 4 bước trên đã chạy ổn

> Đừng viết `main.py` đầu tiên. Người mới hay bắt đầu từ giao diện rồi rối tung.

---

## ✅ Tự chấm

| Tiêu chí | Đạt khi |
|---|---|
| **Chạy được** | Không crash dù bạn cố gõ bậy vào mọi ô nhập |
| **Dữ liệu bền** | Tắt chương trình mở lại, giao dịch vẫn còn |
| **Tách module** | Đủ 4 file, `phan_tich.py` không có `print` và không đọc file |
| **Có test** | ≥ 5 test, `pytest` xanh |
| **Code sạch** | Hàm có type hint, tên rõ nghĩa, hàm ngắn (< 30 dòng) |
| **Hiểu code** | Giải thích được **mọi dòng** bạn viết |

---

## 💡 Gợi ý khi bí

<details><summary>Làm sao lưu dataclass ra JSON?</summary>

`json` không hiểu dataclass, phải đổi sang dict trước:

```python
import json
from dataclasses import asdict

def luu(duong_dan, giao_dich: list[GiaoDich]) -> None:
    du_lieu = [asdict(gd) for gd in giao_dich]
    with open(duong_dan, "w", encoding="utf-8") as f:
        json.dump(du_lieu, f, ensure_ascii=False, indent=2)

def doc(duong_dan) -> list[GiaoDich]:
    try:
        with open(duong_dan, encoding="utf-8") as f:
            return [GiaoDich(**d) for d in json.load(f)]
    except (FileNotFoundError, json.JSONDecodeError):
        return []
```
</details>

<details><summary>Làm sao để menu không crash khi gõ bậy?</summary>

```python
def nhap_so(cau_hoi: str) -> float:
    while True:
        gia_tri = input(cau_hoi).strip()
        try:
            so = float(gia_tri)
            if so <= 0:
                print("  Số tiền phải lớn hơn 0.")
                continue
            return so
        except ValueError:
            print("  Vui lòng nhập một con số.")
```

Mẫu "hỏi lại cho đến khi hợp lệ" này bạn sẽ dùng đi dùng lại.
</details>

<details><summary>Làm sao vẽ biểu đồ cột ASCII?</summary>

```python
def ve_cot(gia_tri: float, lon_nhat: float, do_rong: int = 20) -> str:
    if lon_nhat == 0:
        return ""
    return "#" * round(gia_tri / lon_nhat * do_rong)
```

Chuẩn hoá theo giá trị lớn nhất để cột dài nhất luôn vừa khít độ rộng.
</details>

<details><summary>Làm sao tạo thư mục data nếu chưa có?</summary>

```python
from pathlib import Path
Path("data").mkdir(parents=True, exist_ok=True)
```

`exist_ok=True` để không báo lỗi khi thư mục đã tồn tại.
</details>

---

## 📌 Nộp bài

```powershell
pytest              # test của bạn phải xanh
git add .
git commit -m "Mini-project phase 01: CLI quan ly chi tieu"
git push
```

---

⬅️ [Phase 01](../README.md) · ➡️ [Phase 02 — Toán vừa đủ dùng](../../02-math-essentials/README.md)
