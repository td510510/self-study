# 🛠 Mini-project Phase 04 — Khung ML tái sử dụng

**Thời gian:** 5–7 giờ (Tuần 11) · **Không có lời giải**

> Bài **khởi động** trước [project P2](../../../projects/P2-churn-prediction/README.md). Mini-project này xây *khung*; P2 dùng khung đó để *giải bài toán kinh doanh*.

---

## Đề bài

Đóng gói mọi thứ Phase 04 thành một **thư viện nhỏ** dùng lại được cho mọi bài toán phân loại nhị phân — thứ bạn thật sự mang theo sang mọi dự án sau.

```
mini_project/
├── khung_ml.py          # các hàm ML, KHÔNG print, KHÔNG đọc file
├── bao_cao.py           # in báo cáo + vẽ biểu đồ
├── chay.py              # CLI: đọc CSV → train → báo cáo → lưu model
└── test_khung_ml.py     # ít nhất 10 test
```

---

## Yêu cầu bắt buộc

### `khung_ml.py` — 7 hàm

- [ ] `tao_pipeline(X, model)` — tự nhận diện cột số/chữ, dựng Pipeline hoàn chỉnh
- [ ] `danh_gia_cv(pipeline, X, y, so_fold, scoring)` → `{mean, std, min, max}`
- [ ] `kiem_tra_leakage(X, y, nguong)` → list cột đáng nghi
- [ ] `so_sanh_model(cac_model, X, y)` → DataFrame xếp hạng, **luôn có baseline**
- [ ] `quet_nguong(y_that, xac_suat)` → DataFrame precision/recall/F1 theo ngưỡng
- [ ] `nguong_theo_chi_phi(y_that, xac_suat, chi_phi_fp, chi_phi_fn)` → ngưỡng rẻ nhất
- [ ] `bao_cao_model(pipeline, X_test, y_test, nguong)` → dict đầy đủ metrics

**Mọi hàm phải:**
- Có type hint và docstring
- **Không** phụ thuộc tên cột cụ thể (`"churn"`, `"tuoi"`…)
- Xử lý được trường hợp biên: chỉ một lớp, cột hằng số, cột toàn `NaN`

### `chay.py` — CLI

```powershell
python chay.py data/churn.csv --target churn --bo-cot khach_id --fp 200000 --fn 3000000
```

In ra báo cáo:

```
==================================================
  HUAN LUYEN: churn.csv
==================================================
  5000 dong | 10 dac trung | ty le lop duong: 26.0%

  [1] Kiem tra leakage
      CANH BAO: da_goi_tong_dai_huy (AUC mot minh = 0.92)
      -> Da loai khoi tap dac trung

  [2] So sanh model (CV 5-fold, ROC-AUC)
      LogisticRegression   0.7699 +- 0.0079
      GradientBoosting     0.7195 +- 0.0076
      RandomForest         0.7190 +- 0.0050
      Baseline             0.5000 +- 0.0000

  [3] Model tot nhat: LogisticRegression
      Test AUC       : 0.7752
      Nguong toi uu  : 0.24  (theo chi phi kinh doanh)
      Precision      : 0.451
      Recall         : 0.812
      Chi phi/thang  : 246 trieu  (mac dinh 0.5: 402 trieu)
      TIET KIEM      : 156 trieu

  Da luu: model.pkl
==================================================
```

- [ ] Không crash khi file/cột không tồn tại → thông báo rõ ràng
- [ ] Lưu model bằng `joblib.dump` — **cả Pipeline**, không chỉ estimator
- [ ] Xuất 3 biểu đồ: so sánh model, ROC curve, chi phí theo ngưỡng

### `test_khung_ml.py` — ít nhất 10 test

Bắt buộc phải có:
- [ ] Test `kiem_tra_leakage` **phát hiện được** cột rò rỉ cố ý cài vào
- [ ] Test `so_sanh_model` **luôn có baseline** trong kết quả
- [ ] Test `nguong_theo_chi_phi` — FN đắt hơn ⇒ ngưỡng thấp hơn
- [ ] Test pipeline **không sập** khi gặp hạng mục lạ

---

## Nâng cao

- [ ] `--time-split ngay_dat` — chia theo thời gian thay vì ngẫu nhiên
- [ ] Tinh chỉnh siêu tham số bằng `RandomizedSearchCV`
- [ ] Xuất báo cáo HTML
- [ ] `du_doan.py` nạp `model.pkl` và chấm điểm file CSV mới
- [ ] Hỗ trợ cả bài toán hồi quy (`--task regression`)

---

## ✅ Tự chấm

| Tiêu chí | Đạt khi |
|---|---|
| **Chạy được** | `python chay.py data/churn.csv --target churn` không crash |
| **Tách module** | `khung_ml.py` không có `print`, không đọc file |
| **Không hard-code** | Chạy được với **cả** `churn.csv` lẫn một CSV khác |
| **Chống leakage** | Mọi tiền xử lý nằm trong Pipeline |
| **Có baseline** | Luôn xuất hiện trong bảng so sánh |
| **Có test** | ≥ 10 test, `pytest` xanh |
| **Nói bằng tiền** | Báo cáo có dòng chi phí và tiết kiệm |

> Hai tiêu chí cuối là thứ phân biệt bài này với một notebook nghịch chơi.

---

## 💡 Gợi ý

<details><summary>Làm sao hàm không phụ thuộc tên cột?</summary>

```python
# ❌ Chỉ dùng được cho một dataset
def tao_pipeline(X, model):
    cot_so = ["tuoi", "cuoc_hang_thang"]      # hard-code!
    ...

# ✅ Tự nhận diện
def tao_pipeline(X: pd.DataFrame, model: BaseEstimator) -> Pipeline:
    cot_so = [c for c in X.columns if pd.api.types.is_numeric_dtype(X[c])]
    cot_chu = [c for c in X.columns if c not in cot_so]
    ...
```

**Kiểm chứng:** thử chạy `chay.py` với `data/gia_nha.csv` (đổi target thành cột nhị phân bất kỳ). Nếu phải sửa code thì bạn chưa đạt.
</details>

<details><summary>Làm sao lưu và nạp lại model?</summary>

```python
import joblib

joblib.dump(pipeline, "model.pkl")           # lưu CẢ pipeline
pipeline = joblib.load("model.pkl")
pipeline.predict(du_lieu_tho)                # dùng ngay với dữ liệu THÔ
```

> ⚠️ Lưu **pipeline**, không lưu riêng estimator. Lưu riêng thì lúc phục vụ bạn phải nhớ và lặp lại đúng mọi bước tiền xử lý — nguồn bug kinh điển khi đưa ML vào sản xuất.
</details>

<details><summary>Làm sao test hàm phát hiện leakage?</summary>

Tự tạo dữ liệu có cột rò rỉ cố ý:

```python
def test_phat_hien_leakage():
    rng = np.random.default_rng(0)
    n = 400
    y = pd.Series(rng.integers(0, 2, n))
    X = pd.DataFrame({
        "binh_thuong": rng.normal(size=n),
        "ro_ri": y + rng.normal(0, 0.05, n),      # gần như là chính đáp án
    })
    nghi = kiem_tra_leakage(X, y, nguong=0.9)
    assert "ro_ri" in nghi
    assert "binh_thuong" not in nghi
```
</details>

<details><summary>Làm sao vẽ biểu đồ chi phí theo ngưỡng?</summary>

```python
nguongs = np.arange(0.05, 0.96, 0.05)
chi_phi = []
for ng in nguongs:
    tn, fp, fn, tp = confusion_matrix(y_test, (p >= ng).astype(int)).ravel()
    chi_phi.append(fp * CHI_PHI_FP + fn * CHI_PHI_FN)

plt.plot(nguongs, np.array(chi_phi) / 1e6, marker="o")
plt.axvline(nguongs[np.argmin(chi_phi)], color="red", ls="--")
plt.xlabel("ngưỡng"); plt.ylabel("chi phí (triệu VND)")
```

Đây là biểu đồ bạn đưa cho sếp xem — không phải bảng F1.
</details>

---

## 📌 Nộp bài

```powershell
pytest curriculum/04-classical-ml/mini_project -v
git add .
git commit -m "Mini-project phase 04: khung ML tai su dung"
git push
```

---

⬅️ [Phase 04](../README.md) · ➡️ [🎯 Project P2 — Churn Prediction](../../../projects/P2-churn-prediction/README.md)
