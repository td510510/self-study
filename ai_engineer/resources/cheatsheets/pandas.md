# 🐼 Pandas — Cheatsheet

> Pandas = Excel dành cho lập trình viên. Đây là công cụ bạn dùng nhiều nhất trong công việc dữ liệu thực tế.

```python
import pandas as pd
```

## Đọc & ghi dữ liệu

```python
df = pd.read_csv("data.csv")
df = pd.read_csv("data.csv", encoding="utf-8", sep=",", na_values=["", "NA", "-"])
df = pd.read_excel("data.xlsx", sheet_name="Sheet1")
df = pd.read_json("data.json")
df = pd.read_sql("SELECT * FROM sales", con)

df.to_csv("out.csv", index=False, encoding="utf-8-sig")   # utf-8-sig để Excel đọc đúng tiếng Việt
df.to_excel("out.xlsx", index=False)
```

## Nhìn dữ liệu lần đầu — LUÔN chạy 5 lệnh này

```python
df.head(10)        # 10 dòng đầu — dữ liệu trông thế nào?
df.shape           # (số dòng, số cột) — to cỡ nào?
df.info()          # kiểu dữ liệu + số giá trị non-null — cột nào thiếu?
df.describe()      # thống kê các cột số — có gì bất thường?
df.isna().sum()    # đếm giá trị thiếu từng cột
```

Thêm:
```python
df.columns                          # tên các cột
df.dtypes                           # kiểu từng cột
df["cot"].value_counts()            # đếm tần suất từng giá trị
df["cot"].nunique()                 # số giá trị khác nhau
df.duplicated().sum()               # số dòng trùng lặp
df.sample(5)                        # 5 dòng ngẫu nhiên (đại diện hơn head)
```

---

## Chọn dữ liệu

```python
df["gia"]                     # một cột → Series
df[["ten", "gia"]]            # nhiều cột → DataFrame

df.loc[0]                     # dòng có NHÃN là 0
df.loc[0:5, "ten":"gia"]      # loc dùng NHÃN, lấy CẢ cận phải
df.iloc[0]                    # dòng có VỊ TRÍ 0
df.iloc[0:5, 0:3]             # iloc dùng VỊ TRÍ, KHÔNG lấy cận phải

df.loc[df["gia"] > 100, "ten"]     # lọc dòng + chọn cột
```

> 🔑 **`loc` = nhãn (label), `iloc` = chỉ số (integer).** Nhớ được cái này là hết 70% bối rối với pandas.

## Lọc

```python
df[df["gia"] > 100]
df[(df["gia"] > 100) & (df["thanh_pho"] == "HCM")]     # & và |, MỖI ĐIỀU KIỆN TRONG NGOẶC
df[df["thanh_pho"].isin(["HN", "HCM"])]
df[df["ten"].str.contains("Nguyen", na=False)]
df[df["gia"].between(100, 500)]
df[df["email"].isna()]                                  # dòng thiếu email
df.query("gia > 100 and thanh_pho == 'HCM'")            # cú pháp dễ đọc hơn
```

> ⚠️ Dùng `&` `|` `~` chứ **không** dùng `and` `or` `not`. Và luôn bọc mỗi điều kiện trong ngoặc đơn.

---

## Tạo & sửa cột

```python
df["thanh_tien"] = df["gia"] * df["so_luong"]
df["ten"] = df["ten"].str.strip().str.title()
df["ngay"] = pd.to_datetime(df["ngay"])
df["nam"] = df["ngay"].dt.year

df["nhom"] = pd.cut(df["tuoi"], bins=[0, 18, 35, 60, 100],
                    labels=["Trẻ em", "Thanh niên", "Trung niên", "Cao tuổi"])

df["loai"] = df["gia"].apply(lambda x: "Đắt" if x > 100 else "Rẻ")
df["ma"] = df["ma"].map({"A": "Loại A", "B": "Loại B"})

df = df.rename(columns={"cu": "moi"})
df = df.drop(columns=["cot_thua"])
```

## Sắp xếp

```python
df.sort_values("gia", ascending=False)
df.sort_values(["thanh_pho", "gia"], ascending=[True, False])
df.nlargest(10, "doanh_thu")        # top 10 — nhanh hơn sort rồi head
df.nsmallest(5, "gia")
```

---

## Xử lý giá trị thiếu

```python
df.isna().sum()                          # đếm thiếu theo cột
df.isna().mean().sort_values(ascending=False)   # TỶ LỆ thiếu — hữu ích hơn

df.dropna()                              # bỏ dòng có bất kỳ ô thiếu nào
df.dropna(subset=["gia"])                # chỉ bỏ khi cột gia thiếu
df.dropna(axis=1, thresh=len(df)*0.5)    # bỏ cột thiếu quá 50%

df["gia"] = df["gia"].fillna(df["gia"].median())     # điền trung vị
df["tp"] = df["tp"].fillna("Không rõ")
df["gia"] = df["gia"].ffill()                        # lấy giá trị dòng trên
```

> 💡 Điền bằng **median** an toàn hơn **mean** khi có ngoại lai. Nhưng luôn tự hỏi trước: *"vì sao dữ liệu này thiếu?"* — đôi khi bản thân sự thiếu vắng lại là thông tin.

## Trùng lặp

```python
df.duplicated().sum()
df = df.drop_duplicates()
df = df.drop_duplicates(subset=["email"], keep="last")
```

---

## Nhóm & tổng hợp

```python
df.groupby("thanh_pho")["doanh_thu"].sum()
df.groupby("thanh_pho")["doanh_thu"].agg(["sum", "mean", "count"])

df.groupby(["thanh_pho", "nam"]).agg(
    tong_doanh_thu=("doanh_thu", "sum"),
    so_don=("don_id", "count"),
    gia_tb=("gia", "mean"),
).reset_index()

df.groupby("nhom")["gia"].transform("mean")     # giữ nguyên số dòng
```

**Mô hình tinh thần cho `groupby`:** *chia nhỏ theo nhóm → tính toán từng nhóm → ghép lại*.

## Bảng chéo & pivot

```python
df.pivot_table(index="thanh_pho", columns="nam",
               values="doanh_thu", aggfunc="sum", fill_value=0)

pd.crosstab(df["thanh_pho"], df["loai"])
```

## Ghép bảng

```python
pd.merge(df1, df2, on="khach_id", how="left")
#   how: "left" (giữ hết bên trái) | "inner" (chỉ phần chung)
#        "outer" (giữ hết cả hai)  | "right"

pd.concat([df1, df2], axis=0)      # nối theo chiều dọc (thêm dòng)
pd.concat([df1, df2], axis=1)      # nối theo chiều ngang (thêm cột)
```

> ✅ **Sau MỌI lần merge, kiểm tra `df.shape`.** Số dòng tăng bất ngờ = khoá bị trùng → dữ liệu bị nhân bản. Đây là bug âm thầm nguy hiểm nhất trong xử lý dữ liệu.

---

## Vẽ nhanh

```python
df["gia"].hist(bins=30)                          # phân bố
df["thanh_pho"].value_counts().plot(kind="bar")  # cột
df.plot(x="ngay", y="doanh_thu", kind="line")    # đường
df.plot.scatter(x="dien_tich", y="gia")          # phân tán
df.corr(numeric_only=True)                       # ma trận tương quan

import seaborn as sns
sns.heatmap(df.corr(numeric_only=True), annot=True, cmap="coolwarm")
sns.boxplot(data=df, x="thanh_pho", y="gia")     # phát hiện ngoại lai
```

---

## Chuỗi & thời gian

```python
df["ten"].str.lower() / .upper() / .strip() / .title()
df["ten"].str.replace("  ", " ", regex=False)
df["email"].str.split("@").str[1]
df["ma"].str.extract(r"(\d+)")

df["ngay"] = pd.to_datetime(df["ngay"], errors="coerce")   # lỗi → NaT thay vì crash
df["ngay"].dt.year / .month / .day / .dayofweek / .quarter
df.set_index("ngay").resample("ME")["doanh_thu"].sum()     # tổng theo tháng
```

---

## Bẫy hay gặp

| Bẫy | Vấn đề | Cách đúng |
|---|---|---|
| `SettingWithCopyWarning` | Sửa trên bản sao, không tác dụng | Dùng `df.loc[mask, "cot"] = x` |
| Quên gán lại kết quả | `df.dropna()` không đổi `df` | `df = df.dropna()` |
| Dùng `and`/`or` khi lọc | Lỗi ambiguous truth value | Dùng `&` `|` và bọc ngoặc |
| Lẫn `loc` với `iloc` | Lấy sai dòng | label vs vị trí |
| Merge làm phình số dòng | Dữ liệu bị nhân bản | Kiểm tra `.shape` trước & sau |
| `apply` trên bảng lớn | Rất chậm | Tìm phép vectorized thay thế |
| Excel làm hỏng tiếng Việt | Sai bảng mã | `encoding="utf-8-sig"` khi `to_csv` |
| `inplace=True` | Đang bị khai tử, khó đọc | Luôn gán lại `df = df...` |
