# Phase 03 · Data Toolkit

**Thời gian:** Tuần 6–8 (~36 giờ) · **Điều kiện:** xong [Phase 02](../02-math-essentials/README.md)

---

## 🎯 Mục tiêu

Phase này dạy bạn kỹ năng chiếm **60–80% thời gian thực tế** của người làm AI: lấy dữ liệu bẩn từ thế giới thật và biến nó thành thứ dùng được.

- [ ] NumPy cho dữ liệu thật: `NaN`, thống kê theo trục, lọc theo điều kiện
- [ ] Pandas: đọc, lọc, nhóm, ghép bảng
- [ ] Vẽ biểu đồ để **nhìn** dữ liệu thay vì đoán
- [ ] Làm sạch: giá trị thiếu, trùng lặp, ngoại lai, định dạng lộn xộn
- [ ] SQL cơ bản
- [ ] Quy trình EDA có hệ thống → 🎯 **Project P1**

> **Sự thật ít ai nói với người mới:** model tốt nhất trên dữ liệu bẩn luôn thua model tầm thường trên dữ liệu sạch. Đây là phase quyết định chất lượng mọi thứ về sau.

---

## ⚙️ Chuẩn bị — chạy trước khi bắt đầu

```powershell
python curriculum/03-data-toolkit/tao_du_lieu.py
```

Lệnh này tạo 3 file trong `data/`:

| File | Nội dung |
|---|---|
| `ban_hang.csv` | ~3.065 đơn hàng — **cố ý để bẩn** |
| `khach_hang.csv` | 400 khách hàng — để tập ghép bảng |
| `ban_hang.db` | SQLite — để tập SQL |

**Dữ liệu cố ý bẩn** vì dữ liệu thật ngoài đời luôn bẩn. Các lỗi được cài sẵn đều là lỗi có thật:

```
□ Ô trống ở cột so_luong                  □ Số lượng âm, đơn giá bằng 0
□ Dòng trùng lặp hoàn toàn                □ Cột đơn giá đôi khi là chuỗi "12.000.000"
□ Ngày tháng có 3 định dạng khác nhau     □ Vài đơn hàng ngoại lai cực lớn
□ Tên thành phố viết lung tung: "HN" / "Ha Noi" / "ha noi" / "HÀ NỘI"
□ Khoảng trắng thừa ở đầu/cuối tên        □ Tuổi 999, tuổi 0
```

Nhiệm vụ của bạn trong 3 tuần: tìm ra hết và xử lý từng cái.

---

## 📅 Chia theo tuần

| Tuần | Chủ đề | Bài học | Bài tập |
|---|---|---|---|
| **6** | NumPy cho dữ liệu thật | `01` | `ex01` |
| **7** | Pandas + trực quan hoá | `02`, `03` | `ex02` |
| **8** | Làm sạch + SQL → **P1** | `04`, `05` | `ex03` |

---

# TUẦN 6 — NumPy cho dữ liệu thật

Phase 02 đã dạy vector, ma trận, broadcasting. Tuần này là những thứ chỉ xuất hiện khi đụng dữ liệu thật.

## 1. `NaN` — giá trị thiếu

```python
a = np.array([1.0, 2.0, np.nan, 4.0])

a.mean()          # nan   ← MỘT ô thiếu làm hỏng TOÀN BỘ phép tính
np.nanmean(a)     # 2.33  ← bỏ qua nan
```

| Thao tác | Cách đúng |
|---|---|
| Kiểm tra thiếu | `np.isnan(a)` |
| Đếm số ô thiếu | `np.isnan(a).sum()` |
| Thống kê bỏ qua nan | `np.nanmean`, `np.nanstd`, `np.nanmax`, `np.nanmedian` |
| Lọc bỏ nan | `a[~np.isnan(a)]` |

> ⚠️ **`nan != nan`.** So sánh `x == np.nan` luôn cho `False`, kể cả khi `x` đúng là nan. Phải dùng `np.isnan(x)`. Đây là bẫy khiến rất nhiều người mới mất hàng giờ.

## 2. Lọc theo điều kiện

```python
gia = np.array([100, 250, 80, 900, 150])

gia[gia > 100]                      # lấy các giá trị thoả điều kiện
np.where(gia > 100)[0]              # lấy VỊ TRÍ của chúng
np.where(gia > 100, "cao", "thấp")  # gán nhãn theo điều kiện
gia[(gia > 100) & (gia < 500)]      # & và |, mỗi vế trong ngoặc
```

> Dùng `&` `|` `~` chứ **không** dùng `and` `or` `not` — NumPy làm việc trên cả mảng, còn `and` chỉ hiểu một giá trị đúng/sai.

## 3. Thống kê theo trục

```python
X.mean(axis=0)     # trung bình từng CỘT (từng đặc trưng)  ← thường là cái bạn muốn
X.mean(axis=1)     # trung bình từng HÀNG (từng mẫu)
```

Vì dữ liệu ML luôn có dạng `(số_mẫu, số_đặc_trưng)`, `axis=0` gần như luôn đúng ý.

---

# TUẦN 7 — Pandas & trực quan hoá

## 4. Năm lệnh đầu tiên với MỌI dataset

Nhận file lạ, **luôn** chạy đúng năm lệnh này trước khi làm bất cứ điều gì:

```python
df.shape           # 1. To cỡ nào? Có đúng số dòng tôi mong đợi không?
df.head(10)        # 2. Dữ liệu trông ra sao? Cột nào là gì?
df.info()          # 3. Kiểu dữ liệu có đúng không? Cột nào thiếu nhiều?
df.describe()      # 4. Có giá trị vô lý không (tuổi âm, giá bằng 0)?
df.isna().mean()   # 5. TỶ LỆ thiếu từng cột
```

Sau đó:
```python
df.duplicated().sum()          # có dòng trùng không?
df["thanh_pho"].value_counts() # giá trị hạng mục có viết nhất quán không?
df.sample(5)                   # 5 dòng ngẫu nhiên — đại diện hơn head()
```

> 💡 **Câu hỏi quan trọng nhất khi nhận dữ liệu mới không nằm trong code:** *"Mỗi dòng ở đây đại diện cho cái gì?"* Một dòng là một đơn hàng, hay một sản phẩm trong đơn hàng? Hiểu sai điều này làm sai toàn bộ phân tích về sau.

## 5. `loc` và `iloc`

```python
df.loc[0:5, "ten":"gia"]     # NHÃN,  lấy CẢ cận phải
df.iloc[0:5, 0:3]            # VỊ TRÍ, KHÔNG lấy cận phải
```

**`loc` = label, `iloc` = integer.** Nhớ được câu này là hết 70% bối rối với pandas.

Bẫy thường gặp: sau khi lọc, index không còn liên tục.
```python
sub = df[df["gia"] > 100]     # index có thể là 3, 7, 12...
sub.loc[0]                    # ❌ KeyError
sub.iloc[0]                   # ✅ dòng đầu tiên
sub = sub.reset_index(drop=True)   # đánh số lại từ 0
```

## 6. Lọc

```python
df[(df["gia"] > 100) & (df["thanh_pho"] == "HN")]   # mỗi vế TRONG NGOẶC
df[df["kenh"].isin(["App", "Website"])]
df[df["ho_ten"].str.contains("Nguyen", na=False)]
df.query("gia > 100 and thanh_pho == 'HN'")          # dễ đọc hơn
```

## 7. `groupby` — split, apply, combine

```
    Dữ liệu gốc          Chia theo nhóm        Tính từng nhóm      Ghép lại
   ┌──────────┐          ┌─────────┐            ┌────────┐       ┌─────────┐
   │ HN   100 │    →     │ HN  100 │    →       │ HN 250 │   →   │ HN  250 │
   │ HCM  200 │          │ HN  150 │            └────────┘       │ HCM 200 │
   │ HN   150 │          ├─────────┤            ┌────────┐       └─────────┘
   └──────────┘          │ HCM 200 │            │ HCM 200│
                         └─────────┘            └────────┘
```

```python
df.groupby("thanh_pho").agg(
    tong_doanh_thu=("thanh_tien", "sum"),
    so_don=("don_id", "count"),
    gia_tri_tb=("thanh_tien", "mean"),
).reset_index()
```

**`agg` vs `transform`:**
- `agg` — **giảm** số dòng, mỗi nhóm một dòng
- `transform` — **giữ nguyên** số dòng, phát giá trị nhóm về từng thành viên

```python
# Tỷ lệ đóng góp của mỗi đơn trong thành phố của nó
df["ty_le"] = df["thanh_tien"] / df.groupby("tp")["thanh_tien"].transform("sum")
```

## 8. Ghép bảng — và cái bẫy chết người

```python
merged = pd.merge(df_don, df_khach, on="khach_id", how="left")
```

> ✅ **Sau MỌI lần merge, kiểm tra `.shape`.**

| Triệu chứng | Nguyên nhân |
|---|---|
| Số dòng **tăng** bất ngờ | Khoá bị trùng ở bảng phải → **dữ liệu bị nhân bản** |
| Số dòng **giảm** | Dùng nhầm `inner` khi đáng ra phải `left` → mất dữ liệu âm thầm |
| Nhiều `NaN` sau merge | Khoá không khớp: khác kiểu (`"123"` vs `123`), khoảng trắng thừa, hoa/thường |

Hai công cụ nên dùng:
```python
pd.merge(a, b, on="id", how="left", validate="many_to_one")  # pandas tự báo lỗi
pd.merge(a, b, on="id", how="left", indicator=True)          # xem dòng nào khớp
```

## 9. Vẽ biểu đồ — vì sao bắt buộc

| Câu hỏi | Biểu đồ |
|---|---|
| Biến này phân bố thế nào? Có lệch không? | **Histogram** |
| Có ngoại lai không? | **Boxplot** |
| Hai biến có liên quan không? | **Scatter** |
| Nhóm nào lớn hơn? | **Bar chart** |
| Xu hướng theo thời gian? | **Line chart** |
| Cột nào liên quan tới nhau? | **Heatmap tương quan** |

> ⚠️ **Đừng bao giờ chỉ nhìn con số tương quan.** Hệ số tương quan chỉ đo quan hệ *tuyến tính*. Dữ liệu hình parabol có quan hệ cực rõ nhưng `r ≈ 0`. Bốn bộ dữ liệu hoàn toàn khác nhau có thể có cùng mean, std và r — bạn sẽ thấy tận mắt trong notebook `03`.

---

# TUẦN 8 — Làm sạch dữ liệu & SQL

## 10. Giá trị thiếu

**Bước 0, quan trọng nhất: hỏi TẠI SAO nó thiếu.**

| Cơ chế thiếu | Ví dụ | Xử lý |
|---|---|---|
| Ngẫu nhiên | Lỗi nhập liệu | Điền được |
| Có hệ thống | Khách không muốn khai thu nhập | **Bản thân sự thiếu là thông tin** → tạo thêm cột `thu_nhap_bi_thieu` (0/1) |

| Cách | Khi nào | Rủi ro |
|---|---|---|
| Xoá dòng | Thiếu ít (<5%), ngẫu nhiên | Mất dữ liệu, có thể gây thiên lệch |
| Xoá cột | Thiếu >50% và không quan trọng | Mất một đặc trưng có thể hữu ích |
| Điền median | Cột số | Giảm phương sai, dữ liệu "phẳng" hơn thực tế |
| Điền theo nhóm | `df.groupby("tp")["gia"].transform("median")` | Chính xác hơn điền toàn cục |
| Giữ nguyên `NaN` | Dùng XGBoost/LightGBM | Chúng xử lý `NaN` trực tiếp, thường tốt hơn |

> ⚠️ Giá trị dùng để điền phải tính **từ tập train**, rồi áp dụng cho test. Tính trên toàn bộ dữ liệu là **data leakage**.

## 11. Chuẩn hoá giá trị hạng mục

```python
df["thanh_pho"] = (
    df["thanh_pho"]
      .str.strip()
      .str.lower()
      .replace({"hn": "ha noi", "hà nội": "ha noi",
                "hcm": "tp hcm", "sg": "tp hcm", "tphcm": "tp hcm"})
)
```

Luôn kiểm tra lại bằng `value_counts()` — nếu vẫn còn biến thể lạ, bạn chưa xong.

## 12. Ngoại lai — xoá hay giữ?

**Không có câu trả lời chung. Phải hỏi: đây là lỗi hay là sự thật?**

| Loại | Ví dụ | Xử lý |
|---|---|---|
| **Lỗi nhập liệu** | Tuổi = 999, giá = 0 | Xoá hoặc sửa |
| **Sự thật hiếm** | Đơn hàng doanh nghiệp 100 laptop | **Giữ lại** — có thể chính là thứ đáng quan tâm |

```python
q1, q3 = df["gia"].quantile([0.25, 0.75])
iqr = q3 - q1
ngoai_lai = df[(df["gia"] < q1 - 1.5*iqr) | (df["gia"] > q3 + 1.5*iqr)]
```

> IQR bền vững hơn z-score, vì mean và std bản thân chúng đã bị ngoại lai kéo lệch.

## 13. SQL cơ bản

Rất nhiều dữ liệu doanh nghiệp nằm trong database, không phải file CSV.

```sql
SELECT thanh_pho, COUNT(*) AS so_don, SUM(so_luong * don_gia) AS doanh_thu
FROM don_hang
JOIN khach_hang USING (khach_id)
WHERE ngay_dat >= '2025-01-01'
GROUP BY thanh_pho
HAVING so_don > 10
ORDER BY doanh_thu DESC
LIMIT 10;
```

**Thứ tự thực thi** (khác thứ tự viết — hiểu điều này giải thích rất nhiều lỗi):
```
FROM → JOIN → WHERE → GROUP BY → HAVING → SELECT → ORDER BY → LIMIT
```

Vì `WHERE` chạy **trước** `GROUP BY`, bạn không lọc được theo kết quả tổng hợp bằng `WHERE` — phải dùng `HAVING`.

| SQL | Pandas |
|---|---|
| `SELECT a, b` | `df[["a", "b"]]` |
| `WHERE x > 5` | `df[df["x"] > 5]` |
| `GROUP BY a` | `df.groupby("a")` |
| `JOIN` | `pd.merge()` |
| `ORDER BY x DESC` | `df.sort_values("x", ascending=False)` |
| `LIMIT 10` | `df.head(10)` |

---

## 14. Quy trình EDA có hệ thống

Đây là checklist bạn sẽ dùng cho **mọi** dataset trong đời:

```
① CHẤT LƯỢNG
   □ shape có đúng như mong đợi?      □ Có dòng trùng?
   □ Kiểu dữ liệu từng cột có đúng?   □ Tỷ lệ thiếu từng cột?
   □ Có giá trị vô lý (âm, 0, 999)?   □ Hạng mục có viết nhất quán?

② PHÂN BỐ
   □ Histogram mỗi biến số            □ Boxplot tìm ngoại lai
   □ Mean vs median lệch nhau nhiều?  □ value_counts mỗi biến hạng mục

③ QUAN HỆ
   □ Scatter với biến mục tiêu        □ Heatmap tương quan
   □ Có quan hệ phi tuyến không?

④ PHÂN KHÚC
   □ Các nhóm có hành xử khác nhau?   □ Có xu hướng theo thời gian?

⑤ KẾT LUẬN
   □ 5 insight có SỐ LIỆU kèm theo    □ Việc cần làm tiếp theo là gì?
```

---

## 📝 Thực hành

```powershell
# Chuẩn bị (chạy một lần)
python curriculum/03-data-toolkit/tao_du_lieu.py

# Tuần 6
code curriculum/03-data-toolkit/lessons/01_numpy_cho_du_lieu.ipynb
code curriculum/03-data-toolkit/exercises/ex01_numpy.py

# Tuần 7
code curriculum/03-data-toolkit/lessons/02_pandas_co_ban.ipynb
code curriculum/03-data-toolkit/lessons/03_truc_quan_hoa.ipynb
code curriculum/03-data-toolkit/exercises/ex02_pandas.py

# Tuần 8
code curriculum/03-data-toolkit/lessons/04_lam_sach_du_lieu.ipynb
code curriculum/03-data-toolkit/lessons/05_sql_co_ban.ipynb
code curriculum/03-data-toolkit/exercises/ex03_lam_sach.py

# Chấm điểm
pytest tests/phase03 -v
```

---

## ✅ Tự kiểm tra

1. Nhận một CSV lạ, bạn chạy những lệnh gì đầu tiên?
2. `loc` và `iloc` khác nhau thế nào?
3. Data leakage là gì? Cho một ví dụ khi tiền xử lý.
4. Gặp giá trị thiếu, bạn hỏi câu gì trước khi điền?
5. Sau khi merge, bạn kiểm tra gì? Vì sao?
6. `agg` và `transform` khác nhau ra sao?
7. Vì sao không được chỉ nhìn hệ số tương quan?
8. Vì sao NumPy nhanh hơn vòng lặp Python?

📌 Đáp án đầy đủ: [`resources/interview/phase03-data.md`](../../resources/interview/phase03-data.md)

---

## 🎯 Project P1

Xong Tuần 8, làm [**P1 — Báo cáo EDA**](../../projects/P1-eda-report/README.md). Đây là project đầu tiên vào portfolio của bạn.

---

## 📌 Nộp bài

```powershell
pytest tests/phase03 -v
git add .
git commit -m "Tuan 8: hoan thanh phase 03 - data toolkit"
git push
```

---

⬅️ [Phase 02](../02-math-essentials/README.md) · ➡️ [Phase 04 — Classical ML](../04-classical-ml/README.md)
