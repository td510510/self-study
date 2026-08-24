# 🛠 Mini-project Phase 00 — Hồ sơ học tập của tôi

**Thời gian:** 2–3 giờ · **Không có lời giải** — mục đích là bạn tự vật lộn

---

## Đề bài

Viết một chương trình Python in ra "hồ sơ học tập" của bạn, rồi đưa nó lên GitHub.

Nghe đơn giản, nhưng nó buộc bạn dùng đủ mọi thứ đã học tuần này: biến, kiểu dữ liệu, f-string, tính toán, input, và toàn bộ quy trình git.

---

## Yêu cầu bắt buộc

Tạo file `ho_so.py` **ngay trong thư mục này** và làm cho nó:

- [ ] In ra một tiêu đề có khung trang trí (dùng `"=" * 50`)
- [ ] Hiển thị: họ tên, ngày bắt đầu học, mục tiêu nghề nghiệp của bạn
- [ ] Có ít nhất **5 biến** với tên tiếng Việt không dấu, đặt tên rõ nghĩa
- [ ] Dùng ít nhất **3 kiểu dữ liệu** khác nhau (`str`, `int`, `float`, `bool`)
- [ ] Hỏi người dùng: *"Bạn học được bao nhiêu giờ tuần này?"*
- [ ] Tính và in ra:
  - Số giờ còn lại để đạt mục tiêu 264 giờ (22 tuần × 12 giờ)
  - Phần trăm đã hoàn thành, làm tròn 1 chữ số thập phân
  - Dự đoán: với tốc độ này thì còn bao nhiêu tuần nữa xong
- [ ] Toàn bộ chương trình chạy **không lỗi**

## Yêu cầu nâng cao (làm nếu còn sức)

- [ ] Vẽ thanh tiến độ bằng ký tự: `[████░░░░░░] 40%`
- [ ] Xử lý trường hợp người dùng gõ chữ thay vì số (gợi ý: `try / except ValueError`)
- [ ] Đưa phần tính toán vào một hàm riêng có `def`
- [ ] In lời nhắn khác nhau tuỳ theo mức tiến độ (dùng `if / elif / else`)

---

## Ví dụ kết quả mong đợi

```
==================================================
           HO SO HOC TAP AI ENGINEER
==================================================

  Ho ten     : Nguyen Van Nam
  Bat dau    : 22/08/2026
  Muc tieu   : AI/LLM Application Engineer
  Cam ket    : 12 gio/tuan trong 22 tuan

--------------------------------------------------
Ban hoc duoc bao nhieu gio tuan nay? 14

  Da hoc     : 14 gio
  Con lai    : 250 gio
  Tien do    : [█░░░░░░░░░] 5.3%
  Du kien    : con khoang 18 tuan nua

  Tuan dau tien luon la tuan kho nhat. Ban da vuot qua roi!
==================================================
```

Bạn không cần giống hệt. Hãy làm theo phong cách của bạn.

---

## Nộp bài

```powershell
git add .
git commit -m "Mini-project phase 00: ho so hoc tap"
git push
```

---

## ✅ Tự chấm

| Tiêu chí | Đạt khi |
|---|---|
| **Chạy được** | `python ho_so.py` không văng lỗi |
| **Đủ yêu cầu** | Tick hết các ô bắt buộc ở trên |
| **Code sạch** | Tên biến rõ nghĩa, có dòng trống ngăn các phần |
| **Hiểu code** | Bạn giải thích được **từng dòng** mình viết |
| **Đã push** | Nhìn thấy file trên github.com |

> ⚠️ Tiêu chí quan trọng nhất là dòng thứ tư. Nếu có dòng nào bạn copy về mà không giải thích được, hãy xoá nó đi và viết lại theo cách bạn hiểu.

---

## 💡 Gợi ý khi bí

<details><summary>Làm sao vẽ thanh tiến độ?</summary>

Ý tưởng: tính xem cần bao nhiêu ô đầy, rồi phần còn lại là ô rỗng.

```python
tong_o = 10
o_day = int(phan_tram / 100 * tong_o)
o_rong = tong_o - o_day
thanh = "█" * o_day + "░" * o_rong
print(f"[{thanh}] {phan_tram:.1f}%")
```

Nếu terminal của bạn không hiện được ký tự `█`, dùng `#` và `-` cũng được.
</details>

<details><summary>Làm sao xử lý khi người dùng gõ chữ?</summary>

```python
gio_nhap = input("Ban hoc bao nhieu gio? ")
try:
    gio = float(gio_nhap)
except ValueError:
    print("Ban can nhap mot con so. Tam dat bang 0.")
    gio = 0
```

Bạn sẽ học kỹ `try/except` ở Phase 01 — giờ cứ dùng theo mẫu này.
</details>

<details><summary>Làm sao tính số tuần còn lại?</summary>

```python
gio_con_lai = 264 - gio_da_hoc
if gio_moi_tuan > 0:
    so_tuan = gio_con_lai / gio_moi_tuan
else:
    so_tuan = 0     # tránh chia cho 0
```

Nhớ bài `chia_an_toan` trong bài tập ex01 chứ? Đây là lúc dùng nó thật.
</details>

---

⬅️ [Phase 00](../README.md) · ➡️ [Phase 01 — Python nền tảng](../../01-python-foundations/README.md)
