# 💼 Phỏng vấn — Phase 03: Data toolkit

---

### 1. Bạn nhận một file CSV lạ hoàn toàn. Bạn làm gì đầu tiên?

<details><summary>Đáp án</summary>

Đây là câu hỏi kiểm tra **quy trình làm việc**, không phải kiến thức. Trả lời có hệ thống:

```python
df.shape          # 1. To cỡ nào? Có đúng số dòng tôi mong đợi không?
df.head(10)       # 2. Dữ liệu trông ra sao? Cột nào là gì?
df.info()         # 3. Kiểu dữ liệu có đúng không? Cột nào thiếu nhiều?
df.describe()     # 4. Có giá trị vô lý không (tuổi âm, giá bằng 0)?
df.isna().mean()  # 5. Tỷ lệ thiếu từng cột
df.duplicated().sum()   # 6. Có dòng trùng không?
```

Sau đó:
- Kiểm tra cột thời gian có đúng định dạng và đúng khoảng thời gian mong đợi không
- Với cột hạng mục: `value_counts()` xem có giá trị viết sai chính tả, viết hoa không nhất quán ("HCM", "hcm", "Hồ Chí Minh")
- Vẽ histogram các cột số để phát hiện ngoại lai

**Ý ăn điểm:** "Trước khi code gì, tôi hỏi người đưa dữ liệu ba câu: dữ liệu này thu thập thế nào, mỗi dòng đại diện cho cái gì, và cột nào là đáng tin nhất. Rất nhiều lỗi phân tích bắt nguồn từ hiểu sai ý nghĩa một cột."
</details>

---

### 2. `loc` và `iloc` khác nhau thế nào?

<details><summary>Đáp án</summary>

- **`loc`** truy cập theo **nhãn** (label) — tên hàng và tên cột
- **`iloc`** truy cập theo **vị trí** (integer position) — đánh số từ 0

```python
df.loc[0:5, "ten":"gia"]     # nhãn, LẤY CẢ cận phải (dòng 5 được lấy)
df.iloc[0:5, 0:3]            # vị trí, KHÔNG lấy cận phải (dòng 5 không lấy)
```

**Điểm hay bị hỏi vặn:** vì sao `loc` lấy cả cận phải còn `iloc` thì không? Vì với nhãn, `df.loc["A":"C"]` không có khái niệm "nhãn kế tiếp sau C" nên phải bao gồm C thì mới trực giác. Với số nguyên, pandas theo quy ước slicing của Python.

**Bẫy thực tế:** sau khi lọc, index không còn liên tục:
```python
sub = df[df["gia"] > 100]     # index có thể là 3, 7, 12...
sub.loc[0]      # ❌ KeyError — không có nhãn 0
sub.iloc[0]     # ✅ dòng đầu tiên
sub = sub.reset_index(drop=True)   # đánh số lại từ 0
```
</details>

---

### 3. Data leakage là gì? Cho ví dụ và cách phòng.

<details><summary>Đáp án</summary>

**Data leakage** là khi thông tin lẽ ra model không được biết lúc dự đoán lại lọt vào quá trình train. Kết quả: điểm test cao ngất, nhưng ra đời thật thì thất bại thảm hại.

**Ba dạng phổ biến:**

| Dạng | Ví dụ | Cách phòng |
|---|---|---|
| **Leakage do tiền xử lý** | `fit` scaler trên toàn bộ dữ liệu rồi mới chia train/test | `fit` chỉ trên train; dùng `Pipeline` của sklearn |
| **Leakage do đặc trưng** | Dự đoán "khách có mua không" nhưng có cột `so_tien_da_thanh_toan` | Hỏi: *"lúc dự đoán thật, tôi có cột này chưa?"* |
| **Leakage do thời gian** | Train trên dữ liệu tháng 12, test trên tháng 6 | Chia theo thời gian: train quá khứ, test tương lai |

**Dấu hiệu nhận biết:** accuracy 99.8% ngay lần chạy đầu → **luôn nghi ngờ leakage trước khi ăn mừng**.

**Ý ăn điểm:** "Đây là lỗi tôi kiểm tra đầu tiên khi thấy kết quả tốt bất thường. Tôi thường xem feature importance — nếu một cột chiếm gần hết độ quan trọng, khả năng cao nó đang rò rỉ đáp án."
</details>

---

### 4. Gặp giá trị thiếu, bạn xử lý thế nào?

<details><summary>Đáp án</summary>

**Bước 0 — quan trọng nhất: hỏi TẠI SAO nó thiếu.** Cơ chế thiếu quyết định cách xử lý:
- Thiếu ngẫu nhiên (lỗi nhập liệu) → điền được
- Thiếu có hệ thống (khách không muốn khai thu nhập) → **bản thân sự thiếu vắng là thông tin**, nên tạo thêm cột `thu_nhap_bi_thieu` (0/1)

**Các phương án:**

| Cách | Khi nào dùng | Rủi ro |
|---|---|---|
| **Xoá dòng** | Thiếu ít (<5%) và ngẫu nhiên | Mất dữ liệu, có thể gây thiên lệch |
| **Xoá cột** | Cột thiếu quá nhiều (>50%) và không quan trọng | Mất một đặc trưng có thể hữu ích |
| **Điền median/mean** | Cột số, thiếu vừa phải | Giảm phương sai, làm dữ liệu "phẳng" hơn thực tế |
| **Điền mode / "Không rõ"** | Cột hạng mục | Có thể tạo nhóm giả |
| **Điền theo nhóm** | `df.groupby("tp")["gia"].transform("median")` | Chính xác hơn điền toàn cục |
| **Giữ nguyên NaN** | Dùng XGBoost/LightGBM | Chúng xử lý NaN thẳng, thường tốt hơn điền |

**Nguyên tắc bắt buộc:** giá trị dùng để điền (median chẳng hạn) phải tính **từ tập train**, rồi áp dụng cho test. Tính trên toàn bộ dữ liệu là leakage.
</details>

---

### 5. Giải thích `groupby`. Nó hoạt động thế nào bên trong?

<details><summary>Đáp án</summary>

`groupby` theo mô hình **split – apply – combine**:

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
    tong=("doanh_thu", "sum"),
    trung_binh=("doanh_thu", "mean"),
    so_don=("don_id", "count"),
).reset_index()
```

**Phân biệt `agg` và `transform`:**
- `agg` — **giảm số dòng**, mỗi nhóm ra một dòng
- `transform` — **giữ nguyên số dòng**, phát giá trị của nhóm về từng dòng thành viên

```python
# Tính tỷ lệ đóng góp của mỗi đơn trong thành phố của nó
df["ty_le"] = df["doanh_thu"] / df.groupby("tp")["doanh_thu"].transform("sum")
```

**Ý ăn điểm:** nhắc `count` bỏ qua NaN còn `size` thì không — đây là nguồn sai lệch số liệu âm thầm.
</details>

---

### 6. Sau khi merge hai bảng, bạn kiểm tra gì?

<details><summary>Đáp án</summary>

**Luôn kiểm tra `shape` trước và sau merge.**

```python
print(df1.shape, df2.shape)
merged = pd.merge(df1, df2, on="khach_id", how="left")
print(merged.shape)
```

**Ba vấn đề cần soi:**

1. **Số dòng tăng bất ngờ** → khoá bị trùng ở bảng phải → dữ liệu bị nhân bản
   ```python
   df2["khach_id"].duplicated().sum()    # phải bằng 0 với quan hệ 1-1
   ```

2. **Số dòng giảm** → dùng nhầm `inner` khi đáng ra phải `left` → mất dữ liệu âm thầm

3. **Nhiều NaN sau merge** → khoá không khớp. Nguyên nhân thường gặp: khác kiểu dữ liệu (`"123"` vs `123`), khoảng trắng thừa, viết hoa/thường khác nhau
   ```python
   merged["cot_tu_df2"].isna().sum()
   ```

**Mẹo chuyên nghiệp:** dùng tham số `validate` để pandas tự báo lỗi thay vì hỏng âm thầm:
```python
pd.merge(df1, df2, on="khach_id", how="left", validate="many_to_one")
```

Và `indicator=True` để xem dòng nào khớp, dòng nào không:
```python
merged["_merge"].value_counts()   # both / left_only / right_only
```
</details>

---

### 7. Vì sao NumPy nhanh hơn vòng lặp Python nhiều lần?

<details><summary>Đáp án</summary>

**Ba lý do:**

1. **Code nền là C, không phải Python.** Vòng lặp Python phải diễn giải từng lệnh qua bộ thông dịch; NumPy đẩy cả phép toán xuống mã máy đã biên dịch sẵn.

2. **Bộ nhớ liên tục và đồng nhất kiểu.** List Python là mảng con trỏ trỏ tới các object rải rác khắp bộ nhớ, mỗi object có header riêng. Mảng NumPy là một khối bộ nhớ liền mạch cùng kiểu → CPU cache hoạt động hiệu quả.

3. **Vectorization / SIMD.** CPU hiện đại xử lý được nhiều số cùng một lệnh. NumPy tận dụng điều này, vòng lặp Python thì không.

```python
# Chậm — khoảng 100ms với 1 triệu phần tử
ket_qua = [x * 2 for x in danh_sach]

# Nhanh — khoảng 1ms
ket_qua = mang * 2
```

**Ý ăn điểm:** "Nguyên tắc của tôi là: nếu đang viết `for` để duyệt qua một mảng NumPy hay DataFrame, gần như chắc chắn có cách vectorized nhanh hơn 10–100 lần. `iterrows()` trong pandas là dấu hiệu code cần viết lại."
</details>

---

### 8. EDA là gì? Bạn tìm những gì trong EDA?

<details><summary>Đáp án</summary>

**EDA (Exploratory Data Analysis)** — giai đoạn khám phá dữ liệu bằng thống kê mô tả và biểu đồ **trước khi** xây model, để hiểu dữ liệu và phát hiện vấn đề.

**Bốn nhóm câu hỏi tôi luôn tìm lời đáp:**

| Nhóm | Câu hỏi | Công cụ |
|---|---|---|
| **Chất lượng** | Thiếu bao nhiêu? Trùng không? Có giá trị vô lý không? | `isna()`, `duplicated()`, `describe()` |
| **Phân bố** | Mỗi biến trải ra sao? Có lệch, có ngoại lai không? | histogram, boxplot |
| **Quan hệ** | Biến nào liên quan tới biến mục tiêu? | scatter, `corr()`, heatmap |
| **Phân khúc** | Các nhóm có hành xử khác nhau không? | `groupby`, boxplot theo nhóm |

**Vì sao không bỏ qua được:** model chỉ tốt bằng dữ liệu nuôi nó. Bỏ EDA nghĩa là bạn train trên dữ liệu bẩn mà không biết, rồi mất hàng tuần đi tinh chỉnh siêu tham số cho một vấn đề vốn nằm ở dữ liệu.

**Ý ăn điểm:** "EDA cũng là lúc tôi sinh ra ý tưởng feature engineering. Ví dụ thấy giá nhà tương quan yếu với diện tích nhưng tương quan mạnh với *giá trên mét vuông theo quận*, tôi biết mình cần tạo đặc trưng theo khu vực."
</details>
