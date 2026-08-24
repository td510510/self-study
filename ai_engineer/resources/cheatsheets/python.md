# 🐍 Python — Cheatsheet

## Kiểu dữ liệu cơ bản

```python
so_nguyen   = 42              # int
so_thuc     = 3.14            # float
chuoi       = "xin chào"      # str
dung_sai    = True            # bool
khong_co_gi = None            # NoneType

type(so_nguyen)               # <class 'int'>
int("42")                     # ép kiểu: chuỗi → số
str(42)                       # số → chuỗi
float("3.14")                 # chuỗi → số thực
```

## Chuỗi (string)

```python
ten = "Nam"
tuoi = 25

f"Toi la {ten}, {tuoi} tuoi"          # f-string — CÁCH NÊN DÙNG
f"Gia: {1234567:,.0f} VND"            # 1,234,567 VND
f"Ty le: {0.8567:.1%}"                # 85.7%
f"So PI: {3.14159:.2f}"               # 3.14

s = "  Xin Chao Cac Ban  "
s.strip()                              # bỏ khoảng trắng 2 đầu
s.lower() / s.upper()                  # thường / hoa
s.replace("Chao", "Biet")              # thay thế
s.split()                              # tách theo khoảng trắng → list
",".join(["a", "b", "c"])              # "a,b,c"
"Chao" in s                            # True — kiểm tra chứa
s.startswith(" ") / s.endswith(" ")    # kiểm tra đầu/cuối
len(s)                                 # độ dài
```

## Toán tử

```python
7 + 3   # 10        7 / 3    # 2.333...  (luôn ra float)
7 - 3   # 4         7 // 3   # 2         (chia lấy phần nguyên)
7 * 3   # 21        7 % 3    # 1         (chia lấy dư)
                    7 ** 3   # 343       (luỹ thừa)

x += 1      # x = x + 1
==  !=  <  >  <=  >=          # so sánh
and  or  not                  # logic
in   not in                   # kiểm tra thành viên
is   is not                   # so sánh danh tính (dùng cho None)
```

---

## Điều kiện

```python
diem = 8.5

if diem >= 9:
    xep_loai = "Giỏi"
elif diem >= 7:
    xep_loai = "Khá"
else:
    xep_loai = "Trung bình"

# Dạng một dòng (ternary)
trang_thai = "Đậu" if diem >= 5 else "Rớt"
```

## Vòng lặp

```python
for i in range(5):              # 0,1,2,3,4
for i in range(2, 10, 2):       # 2,4,6,8
for ten in ["An", "Bình"]:      # duyệt list
for i, ten in enumerate(names): # có kèm chỉ số
for a, b in zip(list1, list2):  # duyệt song song 2 list
for k, v in my_dict.items():    # duyệt dict

while dieu_kien:
    ...

break        # thoát hẳn vòng lặp
continue     # bỏ qua lượt này, sang lượt tiếp
```

---

## List

```python
nums = [3, 1, 4, 1, 5]

nums[0]         # 3     — phần tử đầu
nums[-1]        # 5     — phần tử cuối
nums[1:3]       # [1,4] — cắt lát: từ 1 đến TRƯỚC 3
nums[:2]        # [3,1]
nums[::-1]      # đảo ngược

nums.append(9)          # thêm vào cuối
nums.insert(0, 9)       # chèn vào vị trí
nums.remove(1)          # xoá phần tử có giá trị 1 (đầu tiên)
nums.pop()              # lấy ra & xoá phần tử cuối
nums.sort()             # sắp xếp tại chỗ
sorted(nums, reverse=True)   # trả về list mới đã sắp giảm dần
len(nums) / sum(nums) / max(nums) / min(nums)

# Comprehension — cách viết Python-ish
[x * 2 for x in nums]                    # nhân đôi mọi phần tử
[x for x in nums if x > 2]               # lọc
[x * 2 for x in nums if x > 2]           # vừa lọc vừa biến đổi
```

## Dict

```python
nguoi = {"ten": "An", "tuoi": 25}

nguoi["ten"]                  # "An"  — lỗi KeyError nếu không có
nguoi.get("email")            # None  — an toàn hơn
nguoi.get("email", "N/A")     # có giá trị mặc định

nguoi["email"] = "a@b.com"    # thêm/sửa
del nguoi["tuoi"]             # xoá
"ten" in nguoi                # True

nguoi.keys() / nguoi.values() / nguoi.items()

{k: v for k, v in nguoi.items() if v}    # dict comprehension
```

## Set & Tuple

```python
s = {1, 2, 2, 3}          # → {1, 2, 3}  (tự loại trùng)
set([1,1,2])              # cách loại trùng khỏi list
s1 & s2                   # giao
s1 | s2                   # hợp
s1 - s2                   # hiệu

t = (10, 20)              # tuple — KHÔNG sửa được
x, y = t                  # giải nén
```

---

## Hàm

```python
def tinh_bmi(can_nang: float, chieu_cao: float) -> float:
    """Tính chỉ số BMI.

    Args:
        can_nang: cân nặng tính bằng kg
        chieu_cao: chiều cao tính bằng mét
    Returns:
        Chỉ số BMI
    """
    return can_nang / (chieu_cao ** 2)


# Tham số mặc định
def chao(ten: str, loi_chao: str = "Xin chào") -> str:
    return f"{loi_chao}, {ten}!"

chao("An")                       # dùng mặc định
chao("An", loi_chao="Hi")        # gọi bằng tên tham số — rõ ràng hơn

# Trả về nhiều giá trị
def min_max(nums):
    return min(nums), max(nums)

nho_nhat, lon_nhat = min_max([3, 1, 4])
```

> ⚠️ **Bẫy kinh điển:** không bao giờ dùng list/dict làm giá trị mặc định.
> ```python
> def sai(items=[]):      # ❌ list này bị DÙNG CHUNG giữa các lần gọi
> def dung(items=None):   # ✅
>     items = items or []
> ```

---

## Class (OOP vừa đủ)

```python
class TaiKhoan:
    def __init__(self, chu_tk: str, so_du: float = 0):
        self.chu_tk = chu_tk          # thuộc tính
        self.so_du = so_du

    def nap(self, tien: float) -> None:
        if tien <= 0:
            raise ValueError("So tien phai duong")
        self.so_du += tien

    def __repr__(self) -> str:        # cách hiển thị khi print
        return f"TaiKhoan({self.chu_tk!r}, {self.so_du})"


tk = TaiKhoan("An", 100)
tk.nap(50)
print(tk.so_du)      # 150
```

```python
# dataclass — viết class chứa dữ liệu ngắn gọn hơn nhiều
from dataclasses import dataclass

@dataclass
class SanPham:
    ten: str
    gia: float
    ton_kho: int = 0
```

---

## File & đường dẫn

```python
from pathlib import Path

p = Path("data") / "sales.csv"       # ✅ đúng trên mọi hệ điều hành
p.exists()  /  p.stem  /  p.suffix  /  p.parent

# Đọc file — LUÔN dùng with và encoding="utf-8"
with open(p, "r", encoding="utf-8") as f:
    noi_dung = f.read()              # cả file thành 1 chuỗi
    # hoặc
    for dong in f:                   # từng dòng, tiết kiệm bộ nhớ
        print(dong.strip())

# Ghi file
with open("ket_qua.txt", "w", encoding="utf-8") as f:   # "w" ghi đè, "a" ghi thêm
    f.write("Xin chào\n")

# JSON
import json
with open("data.json", "r", encoding="utf-8") as f:
    data = json.load(f)
with open("out.json", "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)     # ensure_ascii=False để giữ tiếng Việt

# CSV
import csv
with open("data.csv", newline="", encoding="utf-8") as f:
    for row in csv.DictReader(f):
        print(row["ten_cot"])
```

---

## Xử lý lỗi

```python
try:
    ket_qua = 10 / mau_so
except ZeroDivisionError:
    print("Không chia được cho 0")
except (ValueError, TypeError) as e:
    print(f"Lỗi dữ liệu: {e}")
else:
    print("Không có lỗi")            # chạy khi try thành công
finally:
    print("Luôn chạy")               # dọn dẹp

raise ValueError("Thông báo lỗi rõ ràng")     # tự ném lỗi
```

> ❌ Không bao giờ viết `except:` trống hoặc `except Exception: pass` — bạn sẽ nuốt mất lỗi và không bao giờ tìm ra bug.

---

## Type hints

```python
from typing import Optional

def f(
    ten: str,
    tuoi: int,
    diem: float,
    tags: list[str],
    config: dict[str, int],
    email: str | None = None,        # có thể là None
) -> bool:
    ...
```

Type hints **không** ép kiểu lúc chạy — chúng để IDE bắt lỗi và để người đọc hiểu code.

---

## Module & import

```python
import math                          # math.sqrt(16)
import numpy as np                   # bí danh
from pathlib import Path             # nhập một thứ cụ thể
from mymodule import ham_a, ham_b

# Chỉ chạy khi file được chạy trực tiếp, không chạy khi bị import
if __name__ == "__main__":
    main()
```

---

## Hàm dựng sẵn hay dùng

```python
len(x)  sum(x)  max(x)  min(x)  abs(-5)  round(3.14159, 2)
sorted(x, key=lambda i: i["gia"], reverse=True)
any([True, False])      # True nếu có ít nhất một True
all([True, False])      # True nếu tất cả đều True
zip(a, b)  enumerate(x)  range(n)  reversed(x)
isinstance(x, int)      # kiểm tra kiểu
print(x, sep=", ", end="\n")
```

---

## Bẫy hay gặp với người mới

| Bẫy | Sai | Đúng |
|---|---|---|
| Chỉ số bắt đầu từ 0 | `nums[1]` là phần tử đầu | `nums[0]` |
| Slice không lấy cận phải | `nums[0:3]` lấy 4 phần tử | lấy 3 phần tử (0,1,2) |
| So sánh vs gán | `if x = 5` | `if x == 5` |
| Sửa list khi đang duyệt | `for x in l: l.remove(x)` | `l = [x for x in l if ...]` |
| Copy nông | `b = a` (cùng một list!) | `b = a.copy()` |
| Số thực không chính xác tuyệt đối | `0.1 + 0.2 == 0.3` → False | `abs(a - b) < 1e-9` |
| Thụt lề | Trộn tab và space | Chỉ dùng 4 space |
