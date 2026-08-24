# 🐞 Debug — Cheatsheet

> Kỹ năng đọc lỗi quan trọng hơn kỹ năng viết code. Lập trình viên giỏi không phải người ít gặp lỗi — mà là người sửa lỗi nhanh.

## Đọc traceback: ĐỌC TỪ DƯỚI LÊN

```
Traceback (most recent call last):
  File "main.py", line 12, in <module>          ← ③ Chuỗi lời gọi hàm
    ket_qua = tinh_trung_binh(diem)                 (đọc sau cùng, để hiểu bối cảnh)
  File "main.py", line 6, in tinh_trung_binh    ← ② Lỗi xảy ra ở ĐÂY
    return sum(nums) / len(nums)                     file main.py, dòng 6
ZeroDivisionError: division by zero             ← ① ĐỌC DÒNG NÀY TRƯỚC TIÊN
                                                     Lỗi gì: chia cho 0
```

**Quy trình 3 bước:**
1. Đọc **dòng cuối cùng** → biết lỗi *gì*
2. Đọc **dòng `File ...` gần cuối nhất có tên file của bạn** → biết lỗi ở *đâu*
3. Mở đúng dòng đó, hỏi: *"biến ở đây đang chứa gì mà gây ra lỗi này?"*

---

## Bảng tra lỗi thường gặp

| Lỗi | Nghĩa là | Nguyên nhân phổ biến nhất |
|---|---|---|
| `SyntaxError` | Python không hiểu bạn viết gì | Thiếu `:`, thiếu `)`, thiếu `"` |
| `IndentationError` | Thụt lề sai | Trộn tab với space, hoặc lệch số space |
| `NameError: name 'x' is not defined` | Dùng biến chưa tồn tại | Gõ sai tên, hoặc dùng trước khi gán |
| `TypeError` | Sai kiểu dữ liệu | `"5" + 5` — cộng chuỗi với số |
| `ValueError` | Đúng kiểu nhưng sai giá trị | `int("abc")` |
| `IndexError: list index out of range` | Truy cập ngoài phạm vi list | List có 3 phần tử mà gọi `nums[3]` |
| `KeyError: 'ten'` | Dict không có khoá đó | Gõ sai tên khoá → dùng `.get()` |
| `AttributeError` | Object không có thuộc tính/method đó | Gõ sai tên method, hoặc biến là `None` |
| `ModuleNotFoundError` | Không tìm thấy thư viện | **Quên kích hoạt `.venv`**, hoặc chưa `pip install` |
| `FileNotFoundError` | Không tìm thấy file | Sai đường dẫn, hoặc đang chạy ở sai thư mục |
| `ZeroDivisionError` | Chia cho 0 | Mẫu số là 0 hoặc list rỗng |
| `UnicodeDecodeError` | Sai bảng mã | Thiếu `encoding="utf-8"` khi mở file |
| `RecursionError` | Đệ quy vô hạn | Hàm gọi chính nó mà không có điều kiện dừng |

---

## 4 kỹ thuật debug, theo thứ tự nên dùng

### 1. `print()` — thô sơ nhưng hiệu quả nhất

```python
def tinh_trung_binh(nums):
    print(f"[DEBUG] nums = {nums}, kieu = {type(nums)}, do dai = {len(nums)}")
    return sum(nums) / len(nums)
```

Mẹo: luôn in **cả tên biến, giá trị VÀ kiểu**. Rất nhiều bug là do biến có kiểu bạn không ngờ tới.

```python
print(f"{x=}")        # in ra: x=42  — cú pháp tắt tiện lợi từ Python 3.8
```

### 2. Chia đôi để tìm

Code 100 dòng bị lỗi? Đừng đọc cả 100 dòng. Đặt `print("den day roi")` ở dòng 50:
- In ra được → lỗi ở nửa sau
- Không in ra → lỗi ở nửa trước

Lặp lại. 100 dòng chỉ cần ~7 lần chia là tìm ra.

### 3. Breakpoint trong VSCode

1. Bấm vào lề trái cạnh số dòng → hiện chấm đỏ 🔴
2. Bấm `F5` để chạy ở chế độ debug
3. Chương trình dừng tại đó, panel bên trái hiện **giá trị mọi biến**

| Phím | Tác dụng |
|---|---|
| `F5` | Chạy / chạy tiếp tới breakpoint sau |
| `F10` | Chạy qua dòng hiện tại (Step Over) |
| `F11` | Đi *vào trong* hàm (Step Into) |
| `Shift+F5` | Dừng debug |

### 4. Thu nhỏ bài toán

Tách phần lỗi ra một file riêng với dữ liệu bé nhất có thể tái hiện lỗi. Thường trong lúc thu nhỏ, bạn sẽ tự tìm ra nguyên nhân.

---

## Checklist khi "code không chạy"

```
□ Đã kích hoạt môi trường ảo chưa?  → dòng lệnh có (.venv) không?
□ Đang đứng ở đúng thư mục chưa?     → chạy pwd
□ Đã lưu file chưa?                  → Ctrl+S
□ Đã đọc dòng CUỐI của traceback chưa?
□ Tên biến/hàm có gõ sai chính tả không?
□ Đã print biến ra xem giá trị thật chưa?
□ Có bị lẫn tab với space không?
□ File đang chạy có đúng file mình vừa sửa không?
```

---

## Hỏi AI cho hiệu quả

**❌ Cách hỏi kém:**
> "Code tôi bị lỗi, sửa giúp"

**✅ Cách hỏi tốt:**
> Tôi đang viết hàm tính trung bình. Đây là code:
> ```python
> def tinh_tb(nums):
>     return sum(nums) / len(nums)
> ```
> Khi gọi `tinh_tb([])` tôi nhận lỗi:
> ```
> ZeroDivisionError: division by zero
> ```
> Tôi nghĩ nguyên nhân là list rỗng nên `len(nums)` bằng 0. Cách xử lý đúng cho trường hợp này là gì, và nên trả về giá trị nào?

**Công thức:** *Mục tiêu + Code + Lỗi nguyên văn + Giả thuyết của tôi + Câu hỏi cụ thể*

Nêu giả thuyết của mình là phần quan trọng nhất — nó biến AI từ "người làm hộ" thành "người xác nhận và dạy thêm".

---

## Phòng bệnh hơn chữa bệnh

```python
# 1. Kiểm tra đầu vào sớm, báo lỗi rõ ràng
def tinh_tb(nums: list[float]) -> float:
    if not nums:
        raise ValueError("Danh sach rong, khong the tinh trung binh")
    return sum(nums) / len(nums)

# 2. Viết type hints — IDE gạch đỏ trước cả khi bạn chạy
# 3. Viết test nhỏ ngay sau khi viết hàm
# 4. Chạy code thường xuyên, đừng viết 200 dòng rồi mới chạy lần đầu
```
