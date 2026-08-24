# Phase 00 · Setup & Nền móng

**Thời gian:** Tuần 1 (~8 giờ) · **Điều kiện:** đã làm xong [SETUP.md](../../SETUP.md)

---

## 🎯 Mục tiêu tuần này

Kết thúc tuần 1, bạn sẽ:

- [ ] Hiểu **code chạy như thế nào** trên máy tính — không còn cảm giác "phép thuật"
- [ ] Chạy được chương trình Python đầu tiên, cả bằng file `.py` lẫn notebook
- [ ] Biết **đọc traceback** để tự sửa lỗi (kỹ năng quan trọng nhất của tuần này)
- [ ] Dùng được git ở mức: add → commit → push
- [ ] Có repo GitHub với commit đầu tiên

> Tuần này **rất ít code**. Đừng sốt ruột. Bạn đang xây móng — móng lệch thì 21 tuần sau đều lệch theo.

---

## 1. Code chạy như thế nào?

### Máy tính chỉ hiểu số

CPU không hiểu `print("hello")`. Nó chỉ hiểu các con số biểu diễn lệnh máy. Vậy khoảng cách giữa hai thứ đó được lấp bằng gì?

```
   Bạn viết                Python đọc và               CPU thực thi
   file .py                dịch từng dòng
  ┌──────────┐            ┌──────────────┐            ┌──────────┐
  │ print(   │  ───────▶  │ Trình thông  │  ───────▶  │ 01001010 │
  │  "hello" │            │ dịch Python  │            │ 11010011 │
  │ )        │            │ (python.exe) │            │ ...      │
  └──────────┘            └──────────────┘            └──────────┘
```

**Python là ngôn ngữ thông dịch (interpreted).** Khi bạn chạy `python main.py`, chương trình `python.exe` đọc file của bạn **từng dòng một**, dịch và thực thi ngay.

Điều này giải thích ba hiện tượng bạn sẽ gặp liên tục:

| Hiện tượng | Vì sao |
|---|---|
| Lỗi chỉ xuất hiện **khi chạy tới dòng đó** | Python không kiểm tra trước toàn bộ file |
| Python chậm hơn C/Rust nhiều lần | Phải dịch lại mỗi lần chạy |
| Sửa code xong chạy lại được ngay, không cần "build" | Không có bước biên dịch riêng |

> 💡 Đây cũng là lý do NumPy tồn tại: phần lõi của nó viết bằng C đã biên dịch sẵn, nên nhanh hơn vòng lặp Python 10–100 lần. Bạn sẽ gặp lại ý này ở Tuần 6.

### Thứ tự thực thi: từ trên xuống dưới

```python
print("Một")      # chạy trước
print("Hai")      # rồi tới đây
print("Ba")       # rồi tới đây
```

Nghe hiển nhiên, nhưng đây là mô hình tinh thần bạn cần giữ chặt: **máy tính làm đúng từng bước bạn viết, theo đúng thứ tự bạn viết, không suy diễn gì thêm.**

99% lỗi của người mới đến từ việc *tưởng* máy hiểu ý mình. Máy không hiểu ý — nó chỉ làm theo chữ.

---

## 2. Script `.py` và Notebook `.ipynb`

Bạn sẽ dùng cả hai suốt chương trình, mỗi loại cho một mục đích khác nhau.

| | Script `.py` | Notebook `.ipynb` |
|---|---|---|
| **Chạy** | Cả file, từ đầu đến cuối | Từng ô (cell), theo thứ tự bạn muốn |
| **Xem kết quả** | Phải `print()` | Ô cuối tự hiển thị |
| **Vẽ biểu đồ** | Mở ra cửa sổ riêng | Hiện ngay dưới ô |
| **Hợp với** | Chương trình thật, hàm, test, deploy | Khám phá dữ liệu, thử nghiệm, dạy học |
| **Điểm yếu** | Muốn thử nhanh phải chạy lại cả file | Trạng thái ẩn gây lỗi khó hiểu |

**Trong chương trình này:**
- `lessons/*.ipynb` — notebook để bạn đọc và nghịch
- `exercises/*.py` — bài tập viết dưới dạng script, chấm bằng pytest
- `projects/` — code thật, luôn là `.py`

### ⚠️ Cạm bẫy lớn nhất của notebook

Notebook nhớ **trạng thái** của các ô bạn đã chạy, bất kể thứ tự trên màn hình.

```python
# Ô 1
x = 10

# Ô 2
print(x)      # in ra 10

# Bây giờ bạn quay lên SỬA ô 1 thành x = 99 nhưng KHÔNG chạy lại nó
# Ô 2 vẫn in ra 10 — vì trong bộ nhớ x vẫn đang là 10
```

**Kết quả:** notebook trông có vẻ chạy đúng nhưng thực ra đang dùng dữ liệu cũ. Đây là nguồn gốc của những bug khiến người ta mất cả buổi chiều.

**Thói quen bắt buộc:** trước khi tin vào kết quả của một notebook, chạy `Kernel → Restart & Run All`. Nếu vẫn ra kết quả đó thì mới thật.

---

## 3. Đọc traceback — kỹ năng số 1

Bạn sẽ gặp lỗi nhiều hơn viết code đúng. Chuyện đó bình thường với **mọi lập trình viên**, kể cả người 20 năm kinh nghiệm. Khác biệt duy nhất là người có kinh nghiệm đọc lỗi trong 5 giây, còn người mới hoảng loạn.

Hãy nhìn kỹ ví dụ này:

```
Traceback (most recent call last):
  File "main.py", line 12, in <module>
    ket_qua = tinh_trung_binh(diem)
              ^^^^^^^^^^^^^^^^^^^^^
  File "main.py", line 6, in tinh_trung_binh
    return sum(nums) / len(nums)
           ~~~~~~~~~~^~~~~~~~~~~
ZeroDivisionError: division by zero
```

### Quy trình 3 bước

**① Đọc dòng CUỐI CÙNG trước tiên.**
`ZeroDivisionError: division by zero` → chia cho 0.
Dòng cuối luôn cho biết **lỗi gì**. Đừng đọc từ trên xuống, đọc từ dưới lên.

**② Tìm dòng `File ...` gần cuối nhất.**
`File "main.py", line 6` → mở file `main.py`, nhảy tới dòng 6. Đó là **nơi lỗi thật sự xảy ra**.

**③ Nhìn ngược lên để hiểu bối cảnh.**
`line 12, in <module>` cho biết dòng 6 được gọi từ dòng 12. Đây là "lịch sử cuộc gọi" — hữu ích khi lỗi nằm sâu trong nhiều tầng hàm.

**④ Đặt câu hỏi đúng:**
> *"Tại dòng 6, biến `nums` đang chứa gì mà `len(nums)` lại bằng 0?"*

Trả lời được câu này là sửa được lỗi. Câu trả lời ở đây: `nums` là một list rỗng.

### Ba lỗi bạn chắc chắn gặp trong tuần này

```python
# ① SyntaxError — Python không hiểu bạn viết gì
print("hello"          # thiếu dấu ) đóng
# → Kiểm tra dấu ngoặc, dấu nháy, dấu hai chấm

# ② NameError — dùng cái chưa tồn tại
print(ten)             # chưa hề gán ten = ...
# → Gõ sai chính tả, hoặc dùng biến trước khi tạo

# ③ ModuleNotFoundError — không tìm thấy thư viện
import numpy
# → 99% là quên kích hoạt .venv. Kiểm tra dòng lệnh có (.venv) không
```

📌 Bảng tra lỗi đầy đủ: [`resources/cheatsheets/debugging.md`](../../resources/cheatsheets/debugging.md)

---

## 4. Git — nút save của lập trình viên

### Vì sao cần

Bạn sửa code, nó hỏng, bạn không nhớ đã sửa gì. Không có git, bạn mất trắng. Có git, bạn quay lại điểm lưu gần nhất trong 2 giây.

Git còn là **bằng chứng tiến bộ**. Sau 22 tuần, biểu đồ commit trên GitHub là thứ nhà tuyển dụng nhìn thấy đầu tiên.

### Mô hình tinh thần

```
   Thư mục làm việc        Vùng chờ           Kho lưu trữ        GitHub
      (bạn sửa)          (staging)           (local)          (remote)
          │                   │                   │                │
          │──── git add ─────▶│                   │                │
          │                   │─── git commit ───▶│                │
          │                   │                   │─── git push ──▶│
```

**Vì sao có "vùng chờ" mà không commit thẳng?** Vì bạn có thể muốn commit *một phần* thay đổi. Ví dụ sửa 5 file nhưng chỉ 3 file thuộc về một ý — bạn `add` 3 file đó rồi commit riêng, để lịch sử sạch và dễ đọc.

### 4 lệnh cho tuần này

```bash
git status                      # Đang có gì thay đổi? — CHẠY LIÊN TỤC
git add .                       # Đưa mọi thay đổi vào vùng chờ
git commit -m "mo ta ngan"      # Tạo điểm lưu
git push                        # Đẩy lên GitHub
```

📌 Chi tiết hơn: [`resources/cheatsheets/git.md`](../../resources/cheatsheets/git.md)

---

## 5. Môi trường ảo — vì sao bắt buộc

Bạn đã tạo `.venv` khi làm SETUP. Giờ hiểu tại sao.

**Vấn đề:** project A cần `numpy 1.24`, project B cần `numpy 2.1`. Máy chỉ có một chỗ cài chung → một trong hai project sẽ hỏng.

**Giải pháp:** mỗi project một cái hộp riêng.

```
Máy tính
├── Python hệ thống               ← không cài gì vào đây
├── project-A/.venv/  → numpy 1.24
└── ai_engineer/.venv/ → numpy 2.1, pandas 2.2, ...
```

**Dấu hiệu bạn đang ở trong hộp đúng:** dòng lệnh có tiền tố `(.venv)`.

```
(.venv) PS D:\Study\IT\Teach\ai_engineer>
 ^^^^^^ đây
```

> 🔁 **Mỗi lần mở terminal mới đều phải kích hoạt lại.** Không có `(.venv)` → mọi `import` sẽ báo `ModuleNotFoundError`. Đây là lỗi bạn sẽ gặp ít nhất 5 lần trong tháng đầu — nhận ra nó ngay là tiết kiệm được rất nhiều thời gian.

---

## 📝 Thực hành

### Bước 1 — Kiểm tra môi trường

```powershell
python curriculum/00-setup/exercises/check_environment.py
```

Chưa thấy dòng `SAN SANG!` thì đừng đi tiếp. Quay lại [SETUP.md](../../SETUP.md).

### Bước 2 — Chạy bài học

```powershell
# Script đầu tiên
python curriculum/00-setup/lessons/01_hello_python.py

# Notebook — mở trong VSCode rồi bấm "Run All"
code curriculum/00-setup/lessons/02_notebook_tour.ipynb
```

### Bước 3 — Bài tập cố ý gây lỗi

```powershell
python curriculum/00-setup/lessons/03_gay_loi_de_hoc.py
```

File này chứa **5 lỗi cố ý**. Nhiệm vụ của bạn: chạy, đọc traceback, sửa từng lỗi một cho tới khi file chạy sạch. Đây là bài tập giá trị nhất của cả tuần.

### Bước 4 — Bài tập chấm tự động

```powershell
# Mở file, làm theo TODO bên trong
code curriculum/00-setup/exercises/ex01_first_program.py

# Chấm
pytest tests/phase00 -v
```

### Bước 5 — Mini-project

Xem [`mini_project/README.md`](mini_project/README.md)

---

## ✅ Tự kiểm tra cuối tuần

Trả lời **thành tiếng**, không nhìn tài liệu:

1. Vì sao Python chậm hơn C?
2. Khi đọc traceback, bạn đọc dòng nào trước tiên? Vì sao?
3. `ModuleNotFoundError` thường do đâu?
4. Khác biệt giữa `git add` và `git commit`?
5. Vì sao notebook có thể cho kết quả sai dù nhìn có vẻ đúng?
6. Môi trường ảo giải quyết vấn đề gì?

Câu nào ấp úng → đọc lại mục tương ứng ở trên.

---

## 📌 Nộp bài tuần 1

```powershell
git add .
git commit -m "Tuan 1: hoan thanh phase 00 - setup va nen mong"
git push
```

---

⬅️ [Roadmap](../../README.md) · ➡️ [Phase 01 — Python nền tảng](../01-python-foundations/README.md)
