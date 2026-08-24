# 🎯 P2 · Churn Prediction

**Làm khi:** xong Phase 04 (Tuần 11) · **Thời gian:** 10–14 giờ

---

## Bối cảnh

Bạn là AI Engineer tại một nhà mạng viễn thông. Giám đốc kinh doanh nói:

> *"Mỗi tháng chúng ta mất khoảng 26% khách hàng. Marketing có ngân sách gửi khuyến mãi giữ chân, nhưng không biết gửi cho ai. Gửi hết thì lỗ. Anh xây model dự đoán ai sắp rời bỏ được không?"*

**Đây không phải bài toán "đạt AUC cao nhất".** Đây là bài toán: *tiêu ngân sách giữ chân vào đúng người để tiết kiệm được nhiều tiền nhất.*

---

## Dữ liệu

```powershell
python curriculum/04-classical-ml/tao_du_lieu.py
```

`data/churn.csv` — 5.000 khách hàng, 26% churn.

| Cột | Ý nghĩa |
|---|---|
| `tuoi`, `so_thang_su_dung`, `cuoc_hang_thang`, `tong_chi_tieu` | Số |
| `loai_hop_dong`, `dich_vu_internet`, `phuong_thuc_thanh_toan` | Hạng mục |
| `so_lan_ho_tro`, `co_ho_tro_ky_thuat`, `da_goi_tong_dai_huy` | Hành vi |
| `churn` | **Biến mục tiêu** (0/1) |

> ⚠️ **Trong dữ liệu có hai cái bẫy.** Tìm ra chúng là một phần bài chấm điểm.

### Chi phí kinh doanh (do bên nghiệp vụ cung cấp)

| | Chi phí |
|---|---|
| Gửi khuyến mãi cho khách **không** định rời bỏ (FP) | **200.000 đ** |
| Bỏ sót một khách **thật sự** rời bỏ (FN) | **3.000.000 đ** |

---

## Deliverable

```
projects/P2-churn-prediction/
├── README.md              # BÁO CÁO — viết cho giám đốc kinh doanh
├── 01_kham_pha.ipynb      # EDA + phát hiện leakage
├── 02_model.ipynb         # so sánh model, chọn ngưỡng
├── src/                   # code sạch (dùng lại từ mini-project)
├── hinh/                  # biểu đồ .png
└── model.pkl              # Pipeline đã train
```

---

## Yêu cầu

### ① Khám phá & phát hiện leakage (notebook 01)

- [ ] EDA đầy đủ theo quy trình Phase 03
- [ ] Tỷ lệ churn theo từng biến hạng mục (biểu đồ)
- [ ] **Chạy kiểm tra leakage** — báo cáo cột nào đáng nghi và **vì sao**
- [ ] **Giải thích bằng lời** vì sao cột đó không dùng được, không chỉ nêu con số
- [ ] Phát hiện **đa cộng tuyến** giữa các cột số
- [ ] Ghi rõ: AUC **có** cột rò rỉ vs **không có** cột rò rỉ

### ② Mô hình (notebook 02)

- [ ] Pipeline hoàn chỉnh, **mọi** tiền xử lý nằm bên trong
- [ ] So sánh **≥ 4 model**, trong đó **bắt buộc có baseline**
- [ ] Cross-validation ≥ 5 fold, báo cáo **mean ± std**
- [ ] Chọn model có lập luận — nêu cả đánh đổi, không chỉ chọn AUC cao nhất
- [ ] **Chọn ngưỡng bằng chi phí kinh doanh**, không dùng mặc định 0.5
- [ ] Biểu đồ: so sánh model · ROC · precision-recall theo ngưỡng · **chi phí theo ngưỡng**
- [ ] Feature importance (nên dùng **permutation importance**)
- [ ] Lưu `model.pkl` bằng `joblib`

### ③ Báo cáo (README.md)

Viết cho **giám đốc kinh doanh**, không phải cho kỹ sư:

```markdown
# Dự đoán khách hàng rời bỏ

## Tóm tắt cho lãnh đạo
- Model xác định đúng X% khách sắp rời bỏ
- Chiến dịch nhắm mục tiêu tiết kiệm ~Y triệu/tháng so với gửi đại trà
- Ba yếu tố dự báo mạnh nhất: ...
- Hạn chế: ...

## Bài toán & chi phí
Vì sao FN đắt gấp 15 lần FP, và điều đó thay đổi cách chọn ngưỡng ra sao.

## Chất lượng dữ liệu — CẢNH BÁO QUAN TRỌNG
Cột `da_goi_tong_dai_huy` bị loại. Giải thích vì sao.
Nếu giữ lại: AUC 0.96 — nhưng model vô dụng ngoài đời. Vì sao.

## Model
Bảng so sánh + lý do chọn.

## Ngưỡng quyết định
[biểu đồ chi phí theo ngưỡng]
Vì sao chọn ngưỡng 0.XX thay vì 0.5. Tiết kiệm bao nhiêu.

## Ai nên được nhắm mục tiêu
Chân dung nhóm rủi ro cao + số lượng ước tính mỗi tháng.

## Hạn chế & rủi ro
Điều gì có thể sai. Khi nào cần train lại.

## Bước tiếp theo
```

---

## Ví dụ: viết kết quả thế nào

**❌ Kém — nói ngôn ngữ kỹ thuật với người không kỹ thuật:**
> Model đạt ROC-AUC 0.775 với F1-score 0.58 tại ngưỡng tối ưu. Random Forest cho kết quả 0.719, kém hơn Logistic Regression.

**✅ Tốt — nói bằng tiền và hành động:**
> ### Nhắm mục tiêu 1.850 khách/tháng tiết kiệm ~156 triệu so với gửi đại trà
>
> `![Chi phí theo ngưỡng](hinh/chi_phi_nguong.png)`
>
> Model xếp hạng khách theo rủi ro rời bỏ. Nếu gửi khuyến mãi cho **37% khách rủi ro cao nhất**
> (≈1.850 người), ta bắt được **81%** số khách thật sự sắp rời bỏ.
>
> - Gửi đại trà cho tất cả: tốn **1.000 triệu**/tháng
> - Không làm gì: mất **390 triệu**/tháng do khách rời bỏ
> - **Nhắm mục tiêu theo model: 246 triệu/tháng** ← tiết kiệm 156 triệu so với phương án tốt thứ nhì
>
> Ngưỡng 0.24 được chọn vì mất một khách (3 triệu) đắt gấp 15 lần một khuyến mãi nhầm (200k),
> nên chấp nhận báo nhầm nhiều để ít bỏ sót.
>
> **Đề xuất:** chạy thử A/B test một tháng trên 20% khách rủi ro cao để đo hiệu quả thật của
> khuyến mãi — model nói *ai sắp rời bỏ*, chưa nói *khuyến mãi có giữ được họ không*.

**Ba khác biệt:** tiêu đề là **kết quả kinh doanh** · mọi con số quy về **tiền** · có **đề xuất hành động** kèm giới hạn.

---

## ✅ Tiêu chí chấm

| Hạng mục | Điểm | Đạt khi |
|---|---|---|
| **Phát hiện leakage** | 25 | Tìm ra, giải thích được **vì sao**, và loại đúng |
| **Phương pháp** | 25 | Pipeline sạch, CV có std, có baseline, không rò rỉ |
| **Quyết định kinh doanh** | 25 | Chọn ngưỡng bằng chi phí, quy kết quả ra tiền |
| **Trung thực** | 15 | Nêu rõ hạn chế, không giấu con số xấu |
| **Trình bày** | 10 | Giám đốc kinh doanh đọc hiểu và ra được quyết định |

**Tự chấm mức độ:**

| Mức | Dấu hiệu |
|---|---|
| ❌ Chưa đạt | Giữ cột rò rỉ, khoe AUC 0.96 |
| ⚠️ Tạm được | Bỏ cột rò rỉ nhưng vẫn chỉ báo cáo AUC/F1, dùng ngưỡng 0.5 |
| ✅ Tốt | Chọn ngưỡng bằng chi phí, báo cáo bằng tiền, nêu hạn chế |
| 🌟 Xuất sắc | Thêm đề xuất A/B test và kế hoạch theo dõi model sau triển khai |

---

## 💡 Bảy lỗi người mới hay mắc

| Lỗi | Cách tránh |
|---|---|
| **Giữ cột rò rỉ vì nó làm điểm đẹp** | Hỏi *"lúc dự đoán thật tôi có cột này chưa?"* |
| **Chỉ báo cáo accuracy** | 26% churn → đoán bừa đã được 74% |
| **Dùng ngưỡng 0.5 mặc định** | Tính chi phí, chọn ngưỡng rẻ nhất |
| **Chọn model phức tạp hơn vì hơn 0.3%** | Nhìn `std` — chênh nhỏ hơn std là **như nhau** |
| **Tiền xử lý ngoài Pipeline** | Leakage âm thầm, điểm CV cao giả tạo |
| **Quên baseline** | *"AUC 0.77"* — so với cái gì? |
| **Kết luận nhân quả từ importance** | *"Gọi tổng đài nhiều → sắp rời bỏ"* ≠ *"chặn tổng đài giữ được khách"* |

---

## 🌟 Thử thách thêm (không bắt buộc)

- [ ] **Chia theo thời gian** thay vì ngẫu nhiên — điểm số thay đổi thế nào? Vì sao?
- [ ] Với ngân sách chỉ đủ gửi **500** khuyến mãi/tháng, chọn ai? *(gợi ý: xếp hạng theo xác suất, không dùng ngưỡng)*
- [ ] Ước tính **giá trị vòng đời khách hàng** rồi tối ưu lợi nhuận thay vì chi phí
- [ ] Viết `du_doan.py` nạp `model.pkl` và chấm điểm file CSV mới

---

## 📌 Nộp bài

```powershell
git add .
git commit -m "P2: du doan khach hang roi bo"
git push
```

Sau đó **đọc lại phần Tóm tắt cho lãnh đạo** và tự hỏi:

> *"Nếu tôi là giám đốc kinh doanh, đọc 5 dòng này tôi có biết phải làm gì tiếp không?"*

Nếu câu trả lời là "không" → viết lại.

---

⬅️ [Phase 04](../../curriculum/04-classical-ml/README.md) · ➡️ [Phase 05 — Deep Learning](../../curriculum/05-deep-learning/README.md)
