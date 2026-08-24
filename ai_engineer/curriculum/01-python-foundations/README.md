# Phase 01 · Python nền tảng

**Thời gian:** Tuần 2–4 (~36 giờ) · **Điều kiện:** xong [Phase 00](../00-setup/README.md)

---

## 🎯 Mục tiêu

Kết thúc phase này bạn **viết được Python ở mức kỹ sư**, không phải mức "biết cú pháp":

- [ ] Dùng thành thạo biến, kiểu dữ liệu, điều kiện, vòng lặp
- [ ] Chọn đúng cấu trúc dữ liệu (list / dict / set / tuple) cho từng tình huống
- [ ] Viết hàm sạch: có type hint, có docstring, làm **một việc**
- [ ] Đọc/ghi file text, CSV, JSON
- [ ] Hiểu OOP ở mức đủ dùng (không cần sâu)
- [ ] Xử lý lỗi bằng `try/except` đúng cách
- [ ] Viết được test cho code của mình

> **Vì sao 3 tuần cho Python?** Vì mọi thứ về sau — pandas, PyTorch, gọi API LLM — đều là Python. Yếu Python thì 19 tuần sau bạn sẽ mất thời gian gấp đôi để vật lộn với cú pháp thay vì học ý tưởng.

---

## 📅 Chia theo tuần

| Tuần | Chủ đề | Bài học | Bài tập |
|---|---|---|---|
| **2** | Biến, kiểu dữ liệu, điều kiện, vòng lặp | `01`, `02` | `ex01`, `ex02` |
| **3** | List/dict/set, hàm, file I/O | `03`, `04` | `ex03`, `ex04`, `ex05` |
| **4** | OOP, lỗi, test, module → **mini-project** | `05`, `06` | `ex06` |

---

# TUẦN 2 — Nền móng

## 1. Biến không phải cái hộp

Nhiều tài liệu dạy "biến là cái hộp chứa giá trị". Cách hiểu đó sẽ khiến bạn gặp bug khó hiểu về sau. Cách hiểu đúng hơn:

> **Biến là một cái nhãn dán lên một giá trị.**

```python
a = [1, 2, 3]      # nhãn "a" dán lên list [1,2,3]
b = a              # nhãn "b" dán lên CHÍNH list đó, không phải bản sao

b.append(4)
print(a)           # [1, 2, 3, 4]  ← a cũng đổi!
```

```
    a ────┐
          ├──▶  [1, 2, 3, 4]      ← chỉ có MỘT list
    b ────┘
```

**Muốn hai list độc lập:**
```python
b = a.copy()       # tạo list mới
b.append(4)
print(a)           # [1, 2, 3]  ← không đổi
```

Đây là bug bạn **chắc chắn** sẽ gặp khi làm việc với dữ liệu. Nhớ kỹ từ bây giờ tiết kiệm được nhiều giờ debug sau này.

### Mutable vs Immutable

| Sửa được (mutable) | Không sửa được (immutable) |
|---|---|
| `list`, `dict`, `set` | `int`, `float`, `str`, `bool`, `tuple` |
| Gán qua biến khác → dùng chung | Gán qua biến khác → an toàn |

```python
x = 5
y = x
y = 10
print(x)        # 5 — không ảnh hưởng, vì int là immutable
```

## 2. Quy tắc đặt tên

Code được **đọc nhiều hơn được viết**. Tên biến tốt là tài liệu miễn phí.

```python
# ❌ Người khác (và chính bạn 2 tuần sau) không hiểu gì
d = {}
x = calc(a, b)
tmp = df[df.c > 0]

# ✅ Đọc là hiểu
diem_hoc_vien = {}
tong_chi_phi = tinh_chi_phi(so_luong, don_gia)
don_hang_hop_le = df[df.gia_tri > 0]
```

**Quy ước Python (PEP 8):**

| Loại | Quy ước | Ví dụ |
|---|---|---|
| Biến, hàm | `snake_case` | `tong_doanh_thu`, `tinh_bmi()` |
| Hằng số | `UPPER_CASE` | `SO_TUAN_HOC = 22` |
| Class | `PascalCase` | `TaiKhoan`, `DataLoader` |
| Nội bộ (private) | `_gach_duoi_dau` | `_cache` |

## 3. Điều kiện

```python
if diem >= 9:
    xep_loai = "Gioi"
elif diem >= 8:
    xep_loai = "Kha"
else:
    xep_loai = "Trung binh"
```

**Thứ tự quan trọng.** Python xét từ trên xuống, gặp điều kiện đúng đầu tiên thì dừng. Viết ngược thứ tự là bug thầm lặng:

```python
# ❌ SAI — điểm 9.5 sẽ ra "Trung binh"
if diem >= 6.5:
    xep_loai = "Trung binh"
elif diem >= 9:
    xep_loai = "Gioi"          # không bao giờ chạy tới
```

### Giá trị "giả" (falsy)

Python coi những thứ này là `False` khi đưa vào `if`:

```python
False, None, 0, 0.0, "", [], {}, set()
```

Nhờ vậy viết được:
```python
if not danh_sach:            # thay vì  if len(danh_sach) == 0
    print("Danh sach rong")
```

> ⚠️ Cẩn thận: `if not so_luong:` sẽ đúng cả khi `so_luong = 0`. Nếu 0 là giá trị hợp lệ, phải viết rõ `if so_luong is None:`.

## 4. Vòng lặp

```python
for i in range(5):                 # 0,1,2,3,4
for ten in danh_sach:              # duyệt phần tử
for i, ten in enumerate(ds):       # kèm chỉ số
for a, b in zip(ds1, ds2):         # duyệt song song
for k, v in tu_dien.items():       # duyệt dict
```

**Nguyên tắc:** trong Python, gần như không bao giờ cần `for i in range(len(ds))`. Nếu bạn đang viết vậy, thường có cách hay hơn:

```python
# ❌ Kiểu C/Java
for i in range(len(ten_list)):
    print(ten_list[i])

# ✅ Kiểu Python
for ten in ten_list:
    print(ten)

# ✅ Khi thật sự cần chỉ số
for i, ten in enumerate(ten_list):
    print(f"{i}. {ten}")
```

**`break` và `continue`:**
```python
for x in nums:
    if x < 0:
        continue        # bỏ qua lượt này, sang phần tử tiếp
    if x > 100:
        break           # thoát hẳn vòng lặp
    xu_ly(x)
```

---

# TUẦN 3 — Cấu trúc dữ liệu & Hàm

## 5. Chọn đúng cấu trúc dữ liệu

Đây là quyết định ảnh hưởng lớn tới cả tính đúng đắn lẫn tốc độ code của bạn.

| Cấu trúc | Đặc điểm | Dùng khi | Tìm một phần tử |
|---|---|---|---|
| **list** `[]` | Có thứ tự, sửa được, cho trùng | Dãy dữ liệu cùng loại | Chậm — O(n) |
| **dict** `{}` | Cặp khoá–giá trị | Tra cứu theo khoá | **Nhanh — O(1)** |
| **set** `set()` | Không thứ tự, không trùng | Loại trùng, kiểm tra thành viên | **Nhanh — O(1)** |
| **tuple** `()` | Như list nhưng không sửa được | Nhóm giá trị cố định, khoá dict | Chậm — O(n) |

### Ví dụ thực tế về hiệu năng

```python
# Kiểm tra 10.000 email có nằm trong danh sách 100.000 email không

emails_list = [...]          # list
for e in can_kiem_tra:
    if e in emails_list:     # ❌ mỗi lần quét cả 100.000 phần tử
        ...                  #    → 1 tỷ phép so sánh, mất vài phút

emails_set = set(emails_list)
for e in can_kiem_tra:
    if e in emails_set:      # ✅ tra bảng băm, tức thì
        ...                  #    → xong trong tích tắc
```

Đổi một chữ `list` thành `set` làm code nhanh hơn hàng nghìn lần. Đây chính là loại quyết định phân biệt người biết cú pháp với kỹ sư.

### Comprehension — cách viết Python-ish

```python
[x * 2 for x in nums]                  # list comprehension
[x for x in nums if x > 0]             # có lọc
{k: v for k, v in d.items() if v}      # dict comprehension
{x % 3 for x in nums}                  # set comprehension
(x * 2 for x in nums)                  # generator — không tạo list trong bộ nhớ
```

> Nguyên tắc: nếu comprehension dài quá một dòng dễ đọc, hãy viết thành vòng lặp `for` thường. Ngắn không đồng nghĩa với tốt.

## 6. Hàm — đơn vị tư duy của lập trình

Hàm không chỉ để tránh lặp code. Hàm là cách bạn **đặt tên cho một ý tưởng**.

```python
def tinh_diem_rui_ro(so_ngay_tre: int, so_lan_khieu_nai: int) -> float:
    """Tính điểm rủi ro rời bỏ của khách hàng, thang 0–1.

    Args:
        so_ngay_tre: số ngày thanh toán trễ trong 90 ngày qua
        so_lan_khieu_nai: số lần khiếu nại trong 90 ngày qua

    Returns:
        Điểm từ 0.0 (an toàn) tới 1.0 (rủi ro cao)
    """
    diem = so_ngay_tre * 0.02 + so_lan_khieu_nai * 0.15
    return min(diem, 1.0)
```

### Bốn nguyên tắc viết hàm tốt

**① Một hàm làm một việc.** Nếu tên hàm phải có chữ "và" thì nó đang làm hai việc — tách ra.

**② Tên hàm là động từ.** `tinh_tong()`, `doc_file()`, `kiem_tra_hop_le()` — không phải `data()`, `process()`.

**③ Trả về giá trị, đừng in ra.** Hàm `print` thì chỉ dùng được một chỗ; hàm `return` thì dùng được mọi nơi.

```python
# ❌ Kém linh hoạt
def tinh_tong(nums):
    print(sum(nums))

# ✅ Dùng được mọi nơi: in, lưu file, tính tiếp
def tinh_tong(nums):
    return sum(nums)
```

**④ Ít tham số.** Quá 4 tham số là dấu hiệu nên gom chúng vào một object hoặc dict.

### ⚠️ Bẫy: mutable default argument

```python
def them(item, gio=[]):      # ❌ list này chỉ được tạo MỘT LẦN
    gio.append(item)
    return gio

them("tao")     # ['tao']
them("cam")     # ['tao', 'cam']  ← BẤT NGỜ!
```

Sửa:
```python
def them(item, gio=None):    # ✅
    if gio is None:
        gio = []
    gio.append(item)
    return gio
```

Câu hỏi phỏng vấn rất hay gặp. Nhớ kỹ.

## 7. File I/O

```python
from pathlib import Path

duong_dan = Path("data") / "sales.csv"     # ✅ đúng trên mọi hệ điều hành
```

> Đừng bao giờ viết `"data\sales.csv"` trong Python — dấu `\` là ký tự thoát, `\n` sẽ thành xuống dòng. Dùng `Path` hoặc `/`.

**Luôn dùng `with` và `encoding="utf-8"`:**

```python
# Đọc
with open(duong_dan, "r", encoding="utf-8") as f:
    noi_dung = f.read()

# Ghi ("w" ghi đè, "a" ghi thêm)
with open("ket_qua.txt", "w", encoding="utf-8") as f:
    f.write("Xin chào\n")

# JSON
import json
with open("data.json", encoding="utf-8") as f:
    du_lieu = json.load(f)

with open("out.json", "w", encoding="utf-8") as f:
    json.dump(du_lieu, f, ensure_ascii=False, indent=2)
```

`ensure_ascii=False` để tiếng Việt được ghi nguyên chữ thay vì `ạ`.

**Vì sao bắt buộc dùng `with`?** Nó tự đóng file kể cả khi có lỗi. Quên đóng file dẫn tới rò rỉ tài nguyên và dữ liệu chưa được ghi xuống đĩa.

---

# TUẦN 4 — OOP, lỗi, test

## 8. OOP — vừa đủ dùng

Là AI Engineer, bạn sẽ **dùng class nhiều hơn viết class**. Cần hiểu đủ để đọc code thư viện và tổ chức code của mình, không cần học sâu về đa kế thừa hay metaclass.

```python
class KhachHang:
    def __init__(self, ten: str, email: str):
        self.ten = ten            # thuộc tính
        self.email = email
        self.don_hang: list[float] = []

    def them_don(self, gia_tri: float) -> None:      # phương thức
        if gia_tri <= 0:
            raise ValueError("Gia tri don hang phai duong")
        self.don_hang.append(gia_tri)

    def tong_chi_tieu(self) -> float:
        return sum(self.don_hang)

    def __repr__(self) -> str:
        return f"KhachHang({self.ten!r}, {len(self.don_hang)} don)"
```

**`self` là gì?** Là chính đối tượng đang gọi. Khi bạn viết `kh.them_don(100)`, Python thực chất gọi `KhachHang.them_don(kh, 100)`.

### Khi nào dùng class, khi nào dùng hàm?

| Dùng **hàm** khi | Dùng **class** khi |
|---|---|
| Chỉ biến đổi dữ liệu vào → ra | Cần giữ **trạng thái** giữa các lần gọi |
| Không cần nhớ gì | Dữ liệu và hành vi gắn chặt với nhau |
| 90% trường hợp | Ví dụ: kết nối DB, client API, model đã train |

> Người mới hay lạm dụng class. Nếu class của bạn chỉ có `__init__` và một method, nó nên là một hàm.

### `dataclass` — class chứa dữ liệu, viết gọn

```python
from dataclasses import dataclass, field

@dataclass
class SanPham:
    ten: str
    gia: float
    ton_kho: int = 0
    tags: list[str] = field(default_factory=list)   # ✅ đúng cách cho list

sp = SanPham("Laptop", 25_000_000)
print(sp)      # SanPham(ten='Laptop', gia=25000000, ton_kho=0, tags=[])
```

`dataclass` tự sinh `__init__`, `__repr__`, `__eq__` — tiết kiệm hàng chục dòng. Bạn sẽ gặp lại ý tưởng này ở Phase 07 với **Pydantic**, thứ dùng để ép LLM trả JSON đúng cấu trúc.

## 9. Xử lý lỗi

```python
try:
    du_lieu = doc_file(duong_dan)
except FileNotFoundError:
    print(f"Khong tim thay {duong_dan}")
    du_lieu = {}
except json.JSONDecodeError as e:
    print(f"File hong o dong {e.lineno}")
    raise                            # ném tiếp lên trên
finally:
    print("Da xong")                 # luôn chạy
```

### Ba quy tắc

**① Bắt lỗi cụ thể, không bắt tất cả.**
```python
except Exception:      # ❌ nuốt luôn cả lỗi lập trình của chính bạn
except ValueError:     # ✅ chỉ bắt thứ bạn dự đoán được
```

**② Không bao giờ `pass` trong `except`.**
```python
except ValueError:
    pass               # ❌ lỗi biến mất, bạn không bao giờ tìm ra bug
```

**③ Chỉ bắt lỗi khi bạn xử lý được nó.** Nếu chỉ để in ra rồi crash, cứ để nó crash — traceback gốc còn nhiều thông tin hơn.

### Tự ném lỗi

```python
def chia(a: float, b: float) -> float:
    if b == 0:
        raise ValueError("Mau so khong duoc bang 0")
    return a / b
```

Thông báo lỗi tốt cho biết **cái gì sai** và **giá trị nào gây ra**:
```python
raise ValueError(f"Tuoi phai trong khoang 0-150, nhan duoc: {tuoi}")
```

## 10. Test — lưới an toàn của bạn

```python
# file: test_tinh_toan.py
from tinh_toan import chia

def test_chia_binh_thuong():
    assert chia(10, 2) == 5.0

def test_chia_cho_khong():
    import pytest
    with pytest.raises(ValueError):
        chia(10, 0)
```

Chạy: `pytest -v`

**Vì sao viết test khi code còn nhỏ?**
- Test là **cách kiểm tra nhanh nhất** — nhanh hơn chạy tay và gõ lại input mỗi lần
- Test là **tài liệu sống** — đọc test biết hàm dùng thế nào
- Test cho phép bạn **sửa code không sợ hỏng** — đây mới là giá trị lớn nhất

**Ba trường hợp luôn phải test:**
1. Trường hợp bình thường
2. Trường hợp biên (list rỗng, số 0, chuỗi rỗng)
3. Trường hợp lỗi (đầu vào sai kiểu, giá trị vô lý)

Ở Phase 07 bạn sẽ thấy: **eval cho LLM chính là test, chỉ khác ở chỗ đầu ra không xác định tuyệt đối.** Kỹ năng bắt đầu từ đây.

## 11. Module & tổ chức code

```
du_an/
├── main.py              # điểm khởi chạy
├── xu_ly_du_lieu.py     # các hàm xử lý
└── cau_hinh.py          # hằng số, thiết lập
```

```python
# main.py
from xu_ly_du_lieu import doc_csv, lam_sach
from cau_hinh import DUONG_DAN_DATA

if __name__ == "__main__":       # chỉ chạy khi gọi trực tiếp file này
    df = doc_csv(DUONG_DAN_DATA)
```

**`if __name__ == "__main__":` để làm gì?** Để code bên trong chỉ chạy khi bạn gọi `python main.py`, chứ không chạy khi file bị `import` từ nơi khác. Không có nó, mỗi lần import module là cả chương trình chạy lại.

---

## 📝 Thực hành

```powershell
# Tuần 2
code curriculum/01-python-foundations/lessons/01_bien_va_kieu_du_lieu.ipynb
code curriculum/01-python-foundations/lessons/02_dieu_kien_vong_lap.ipynb
code curriculum/01-python-foundations/exercises/ex01_co_ban.py
code curriculum/01-python-foundations/exercises/ex02_dieu_kien_vong_lap.py

# Tuần 3
code curriculum/01-python-foundations/lessons/03_list_dict_set.ipynb
code curriculum/01-python-foundations/lessons/04_ham_va_file.ipynb
code curriculum/01-python-foundations/exercises/ex03_collections.py
code curriculum/01-python-foundations/exercises/ex04_ham.py
code curriculum/01-python-foundations/exercises/ex05_file.py

# Tuần 4
code curriculum/01-python-foundations/lessons/05_oop_va_module.ipynb
code curriculum/01-python-foundations/lessons/06_loi_va_test.ipynb
code curriculum/01-python-foundations/exercises/ex06_oop.py

# Chấm điểm (chạy bất cứ lúc nào)
pytest tests/phase01 -v

# Chỉ chấm một bài
pytest tests/phase01/test_ex03.py -v
```

---

## ✅ Tự kiểm tra cuối phase

1. `b = a` và `b = a.copy()` khác nhau thế nào? Khi nào khác biệt đó gây bug?
2. Khi nào dùng `set` thay vì `list`? Vì sao nhanh hơn?
3. Vì sao `def f(items=[])` là bug?
4. Vì sao hàm nên `return` thay vì `print`?
5. Vì sao phải dùng `with open(...)`?
6. Khi nào dùng class thay vì hàm?
7. Vì sao không nên viết `except Exception: pass`?
8. `if __name__ == "__main__":` dùng làm gì?

📌 Đáp án chi tiết + 8 câu phỏng vấn: [`resources/interview/phase01-python.md`](../../resources/interview/phase01-python.md)

---

## 📌 Nộp bài

```powershell
pytest tests/phase01 -v          # phải xanh hết
git add .
git commit -m "Tuan 4: hoan thanh phase 01 - python nen tang"
git push
```

---

⬅️ [Phase 00](../00-setup/README.md) · ➡️ [Phase 02 — Toán vừa đủ dùng](../02-math-essentials/README.md)
