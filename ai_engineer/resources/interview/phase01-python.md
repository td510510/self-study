# 💼 Phỏng vấn — Phase 01: Python nền tảng

> Trả lời to trong 60 giây trước khi mở đáp án.

---

### 1. `list` và `tuple` khác nhau thế nào? Khi nào dùng cái nào?

<details><summary>Đáp án</summary>

**Khác biệt cốt lõi:** `list` sửa được (mutable), `tuple` không sửa được (immutable).

| | list | tuple |
|---|---|---|
| Sửa được | ✅ | ❌ |
| Cú pháp | `[1, 2]` | `(1, 2)` |
| Làm khoá dict | ❌ | ✅ |
| Tốc độ | chậm hơn chút | nhanh hơn chút |

**Dùng khi nào:**
- `list` — tập hợp cùng loại, số lượng thay đổi: danh sách sản phẩm, kết quả đo
- `tuple` — nhóm cố định các giá trị có ý nghĩa khác nhau: toạ độ `(x, y)`, kích thước `(width, height)`, hoặc giá trị trả về nhiều phần từ hàm

**Ý ăn điểm:** tuple immutable nên **hashable** → dùng được làm khoá dict hoặc phần tử của set. List thì không.
</details>

---

### 2. `is` và `==` khác nhau ra sao?

<details><summary>Đáp án</summary>

- `==` so sánh **giá trị**: hai đối tượng có nội dung giống nhau không
- `is` so sánh **danh tính**: có phải cùng một đối tượng trong bộ nhớ không

```python
a = [1, 2, 3]
b = [1, 2, 3]
a == b     # True  — cùng nội dung
a is b     # False — hai đối tượng khác nhau

c = a
c is a     # True  — cùng một đối tượng
```

**Quy tắc thực hành:** chỉ dùng `is` với `None`, `True`, `False` (`if x is None`). Còn lại luôn dùng `==`.

**Ý ăn điểm:** Python cache số nguyên nhỏ (−5 đến 256) nên `256 is 256` ra True còn `257 is 257` có thể ra False — đó chính là lý do không nên dùng `is` để so sánh giá trị.
</details>

---

### 3. Mutable default argument là gì? Tại sao nguy hiểm?

<details><summary>Đáp án</summary>

Giá trị mặc định của tham số được tạo **một lần duy nhất** khi định nghĩa hàm, không phải mỗi lần gọi. Nếu nó là list/dict, mọi lần gọi sẽ dùng chung một đối tượng.

```python
def them(item, gio=[]):      # ❌
    gio.append(item)
    return gio

them("táo")     # ['táo']
them("cam")     # ['táo', 'cam']  ← BẤT NGỜ! Không phải ['cam']
```

**Cách sửa:**
```python
def them(item, gio=None):    # ✅
    if gio is None:
        gio = []
    gio.append(item)
    return gio
```

Đây là câu hỏi lọc rất phổ biến vì nó cho thấy ứng viên có hiểu vòng đời đối tượng trong Python hay không.
</details>

---

### 4. List comprehension là gì? Khi nào KHÔNG nên dùng?

<details><summary>Đáp án</summary>

Cú pháp gọn để tạo list mới từ một iterable:

```python
[x * 2 for x in nums if x > 0]
```

Tương đương:
```python
ket_qua = []
for x in nums:
    if x > 0:
        ket_qua.append(x * 2)
```

**Ưu điểm:** ngắn, nhanh hơn vòng lặp thường một chút, đọc quen thì rất rõ ý.

**KHÔNG nên dùng khi:**
- Logic phức tạp, lồng nhiều tầng → khó đọc hơn vòng lặp thường
- Cần side effect (in ra, ghi file) → dùng vòng lặp `for` cho rõ ràng
- Dữ liệu rất lớn và không cần giữ hết trong bộ nhớ → dùng **generator** `(x*2 for x in nums)`

**Ý ăn điểm:** "Nếu comprehension dài quá một dòng dễ đọc, tôi chuyển về vòng lặp thường. Code được đọc nhiều lần hơn được viết."
</details>

---

### 5. `*args` và `**kwargs` dùng để làm gì?

<details><summary>Đáp án</summary>

Cho phép hàm nhận số lượng đối số không xác định trước.

```python
def f(*args, **kwargs):
    print(args)      # tuple các đối số vị trí
    print(kwargs)    # dict các đối số có tên

f(1, 2, ten="An")
# (1, 2)
# {'ten': 'An'}
```

**Dùng khi:** viết hàm bọc (wrapper/decorator) cần chuyển tiếp mọi đối số xuống hàm bên dưới, hoặc hàm thật sự nhận số lượng đầu vào linh hoạt như `print()`.

Dấu `*` và `**` cũng dùng để **giải nén**:
```python
nums = [1, 2, 3]
f(*nums)                  # tương đương f(1, 2, 3)
config = {"ten": "An"}
f(**config)               # tương đương f(ten="An")
```
</details>

---

### 6. Tại sao phải dùng `with open(...)` thay vì `open(...)`?

<details><summary>Đáp án</summary>

`with` là **context manager** — nó tự động đóng file khi ra khỏi khối, **kể cả khi có lỗi xảy ra**.

```python
# ❌ nếu process() ném lỗi, file không bao giờ được đóng
f = open("data.txt")
process(f.read())
f.close()

# ✅ file luôn được đóng
with open("data.txt", encoding="utf-8") as f:
    process(f.read())
```

**Hậu quả nếu không đóng file:** rò rỉ file handle (hệ điều hành giới hạn số file mở cùng lúc), dữ liệu ghi có thể chưa được flush xuống đĩa, file bị khoá không xoá/sửa được trên Windows.

**Ý ăn điểm:** nhắc luôn `encoding="utf-8"` — trên Windows mặc định không phải UTF-8, đây là nguồn gốc rất nhiều lỗi với tiếng Việt.
</details>

---

### 7. Type hints có ép kiểu lúc chạy không? Vậy dùng để làm gì?

<details><summary>Đáp án</summary>

**Không.** Python bỏ qua type hints khi chạy — `def f(x: int)` vẫn nhận được chuỗi bình thường.

**Vậy dùng để làm gì:**
1. **IDE bắt lỗi trước khi chạy** — Pylance gạch đỏ ngay khi bạn truyền sai kiểu
2. **Tài liệu sống** — đọc chữ ký hàm là hiểu ngay đầu vào/ra, không cần đọc thân hàm
3. **Kiểm tra tĩnh** với `mypy` / `pyright` trong CI
4. **Một số thư viện dùng thật** — Pydantic và FastAPI đọc type hints để validate dữ liệu lúc chạy

**Ý ăn điểm:** "Trong project LLM tôi dùng Pydantic, ở đó type hints không chỉ là gợi ý mà thật sự dùng để validate JSON model trả về."
</details>

---

### 8. Vì sao phải dùng môi trường ảo?

<details><summary>Đáp án</summary>

**Vấn đề:** project A cần `numpy 1.24`, project B cần `numpy 2.1`. Cài chung vào Python hệ thống thì một trong hai sẽ hỏng.

**Giải pháp:** mỗi project một môi trường ảo riêng — thư mục chứa bản Python và bộ thư viện độc lập.

**Lợi ích khác:**
- **Tái lập được**: `pip freeze > requirements.txt` cho phép người khác dựng lại y hệt môi trường của bạn
- **Không làm bẩn Python hệ thống** (trên Linux/macOS, cài đè có thể làm hỏng công cụ của hệ điều hành)
- **Xoá sạch dễ dàng**: xoá thư mục `.venv` là xong, không để lại dấu vết

**Ý ăn điểm:** liên hệ với Docker — "môi trường ảo cô lập ở mức thư viện Python, Docker cô lập ở mức toàn bộ hệ điều hành. Cùng một triết lý ở hai tầng khác nhau."
</details>
