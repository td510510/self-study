# 🛠 Mini-project Phase 03 — Bộ công cụ làm sạch tái sử dụng

**Thời gian:** 4–6 giờ (Tuần 8) · **Không có lời giải**

> Đây là bài **khởi động** trước [project P1](../../../projects/P1-eda-report/README.md). Mini-project này xây *công cụ*; P1 dùng công cụ đó để *phân tích*.

---

## Đề bài

Đóng gói mọi thứ bạn học ở Tuần 8 thành một **module Python tái sử dụng được** — thứ bạn sẽ thật sự mang theo sang mọi dự án dữ liệu sau này.

```
mini_project/
├── lam_sach.py          # các hàm làm sạch, KHÔNG có print, KHÔNG đọc file
├── bao_cao.py           # in báo cáo ra màn hình
├── chay.py              # CLI: đọc file → làm sạch → xuất file + báo cáo
└── test_lam_sach.py     # ít nhất 8 test
```

> **Vì sao tách `lam_sach.py` khỏi `bao_cao.py`?** Vì hàm không `print` và không đọc file thì **test được dễ dàng**. Đây là nguyên tắc bạn đã dùng ở mini-project Phase 01, và sẽ dùng suốt sự nghiệp.

---

## Yêu cầu bắt buộc

### `lam_sach.py` — ít nhất 6 hàm

- [ ] `bao_cao_chat_luong(df) -> pd.DataFrame` — bảng chất lượng từng cột
- [ ] `chuan_hoa_van_ban(s, bang_anh_xa) -> pd.Series` — chuẩn hoá giá trị hạng mục
- [ ] `doi_sang_so(s) -> pd.Series` — xử lý được `"1.200.000"`, `"1,200,000"`, khoảng trắng
- [ ] `doi_sang_ngay(s, cac_dinh_dang) -> pd.Series` — thử nhiều định dạng
- [ ] `dien_thieu(df, cot, cot_nhom=None) -> pd.Series` — điền theo nhóm, có dự phòng
- [ ] `tim_ngoai_lai(s, phuong_phap="iqr") -> pd.Series` — trả về mặt nạ boolean

**Mọi hàm phải:**
- Có type hint và docstring
- **Không** sửa dữ liệu gốc
- Xử lý được trường hợp biên: cột rỗng, toàn `NaN`, cột hằng số

### `chay.py` — CLI

```powershell
python chay.py data/ban_hang.csv --xuat data/ban_hang_sach.csv
```

Phải in ra báo cáo trước–sau:

```
==================================================
  LAM SACH: ban_hang.csv
==================================================
  Dong ban dau        : 3,065

  [1] Sua kieu du lieu
      don_gia   : object -> float64   (12 o khong doi duoc)
      ngay_dat  : object -> datetime  (0 o khong doi duoc)
  [2] Chuan hoa van ban
      danh_muc  : 5 -> 5 gia tri
  [3] Trung lap
      Da xoa 61 dong (2.0%)
  [4] Gia tri vo ly
      so_luong <= 0 : 45 dong
      don_gia  <= 0 : 31 dong
  [5] Gia tri thieu
      so_luong  : dien 182 o bang median theo danh_muc

  Dong con lai        : 2,807  (91.6%)
  Da luu              : data/ban_hang_sach.csv
==================================================
```

- [ ] Không crash khi file không tồn tại → in thông báo rõ ràng
- [ ] Không crash khi thiếu tham số → in hướng dẫn dùng
- [ ] Ghi file bằng `encoding="utf-8-sig"` để Excel đọc được tiếng Việt

### `test_lam_sach.py` — ít nhất 8 test

Mỗi hàm ít nhất một test cho **trường hợp bình thường** và một cho **trường hợp biên**.

---

## Nâng cao (làm nếu còn sức)

- [ ] `--bao-cao-html` xuất báo cáo chất lượng ra file HTML (dùng `df.to_html()`)
- [ ] Đọc cấu hình từ file YAML/JSON thay vì hard-code bảng ánh xạ
- [ ] Ghi log ra file thay vì chỉ `print` (dùng module `logging`)
- [ ] Xử lý được file lớn theo từng khối (`pd.read_csv(..., chunksize=10000)`)
- [ ] Thêm `--kiem-tra` chỉ báo cáo mà **không** ghi file (chế độ dry-run)

---

## ✅ Tự chấm

| Tiêu chí | Đạt khi |
|---|---|
| **Chạy được** | `python chay.py data/ban_hang.csv` không crash |
| **Tách module** | `lam_sach.py` không có `print`, không đọc file |
| **Không sửa dữ liệu gốc** | Test chứng minh được điều này |
| **Có test** | ≥ 8 test, `pytest` xanh |
| **Xử lý biên** | Không crash với cột rỗng, toàn `NaN`, cột hằng số |
| **Tái sử dụng được** | Copy `lam_sach.py` sang dự án khác là dùng được ngay |

> Tiêu chí cuối là quan trọng nhất. Nếu hàm của bạn hard-code tên cột `"don_gia"` bên trong thì nó chỉ dùng được cho đúng một file — chưa đạt.

---

## 💡 Gợi ý

<details><summary>Làm sao hàm không hard-code tên cột?</summary>

```python
# ❌ Chỉ dùng được cho một file duy nhất
def lam_sach(df):
    df["don_gia"] = pd.to_numeric(df["don_gia"], errors="coerce")
    return df

# ✅ Dùng được ở mọi nơi
def doi_sang_so(s: pd.Series) -> pd.Series:
    """Đổi Series bất kỳ sang số."""
    ...

# Người gọi quyết định áp dụng cho cột nào
df["don_gia"] = doi_sang_so(df["don_gia"])
```

**Nguyên tắc:** hàm nhận `Series`, không nhận `DataFrame` + tên cột — trừ khi thật sự cần nhiều cột cùng lúc (như `dien_thieu` cần cả cột nhóm).
</details>

<details><summary>Làm sao viết CLI nhận tham số?</summary>

```python
import argparse

def main():
    p = argparse.ArgumentParser(description="Lam sach file du lieu")
    p.add_argument("dau_vao", help="File CSV can lam sach")
    p.add_argument("--xuat", help="File CSV dau ra")
    p.add_argument("--kiem-tra", action="store_true", help="Chi bao cao, khong ghi file")
    args = p.parse_args()

    if not Path(args.dau_vao).exists():
        print(f"Khong tim thay file: {args.dau_vao}")
        return 1
    ...
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
```

`argparse` tự sinh `--help` và tự báo lỗi khi thiếu tham số.
</details>

<details><summary>Làm sao test một hàm nhận DataFrame?</summary>

```python
import pandas as pd
from lam_sach import doi_sang_so

def test_doi_sang_so_dau_cham():
    s = pd.Series(["1.200.000", "5000"])
    kq = doi_sang_so(s)
    assert kq.iloc[0] == 1_200_000
    assert kq.iloc[1] == 5000

def test_khong_sua_du_lieu_goc():
    s = pd.Series(["1.200.000"])
    doi_sang_so(s)
    assert s.iloc[0] == "1.200.000", "Ham da sua Series goc!"

def test_cot_rong():
    assert len(doi_sang_so(pd.Series([], dtype=object))) == 0
```

Tạo DataFrame nhỏ ngay trong test — nhanh, rõ ràng, không phụ thuộc file bên ngoài.
</details>

---

## 📌 Nộp bài

```powershell
pytest curriculum/03-data-toolkit/mini_project -v
git add .
git commit -m "Mini-project phase 03: bo cong cu lam sach"
git push
```

---

⬅️ [Phase 03](../README.md) · ➡️ [🎯 Project P1 — Báo cáo EDA](../../../projects/P1-eda-report/README.md)
