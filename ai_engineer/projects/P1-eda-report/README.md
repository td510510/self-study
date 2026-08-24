# 🎯 P1 · Báo cáo EDA

**Làm khi:** xong Phase 03 (Tuần 8) · **Thời gian:** 8–12 giờ · **Đây là project đầu tiên vào portfolio của bạn**

---

## Mục tiêu

Biến một dataset bẩn thành một **báo cáo phân tích** mà người không biết code vẫn đọc hiểu và ra được quyết định.

> **Đây không phải bài tập.** Đây là thứ bạn đưa vào CV và bị hỏi trong phỏng vấn. Hãy làm như đang làm cho khách hàng thật.

---

## Dataset

Dùng dữ liệu đã sinh ở Phase 03:

```powershell
python curriculum/03-data-toolkit/tao_du_lieu.py
```

| File | Nội dung |
|---|---|
| `data/ban_hang.csv` | ~3.065 đơn hàng (bẩn) |
| `data/khach_hang.csv` | 400 khách hàng (bẩn) |
| `data/ban_hang.db` | SQLite, dùng nếu muốn luyện SQL |

<details><summary>Muốn dùng dataset thật khác?</summary>

Hoàn toàn được — thậm chí **tốt hơn** nếu bạn có dữ liệu từ công việc hoặc lĩnh vực bạn quan tâm. Yêu cầu tối thiểu:

- ≥ 1.000 dòng, ≥ 6 cột
- Có ít nhất một cột thời gian, một cột hạng mục, hai cột số
- Có vấn đề thật (thiếu, trùng, định dạng lộn xộn)

Nguồn gợi ý: Kaggle, data.gov.vn, Tổng cục Thống kê, dữ liệu bán hàng của chính công ty bạn (nhớ ẩn danh thông tin nhạy cảm).
</details>

---

## Câu hỏi kinh doanh phải trả lời

Báo cáo của bạn phải trả lời được **5 câu** này, mỗi câu kèm **số liệu** và **biểu đồ**:

1. **Doanh thu đến từ đâu?** Danh mục / kênh / thành phố nào đóng góp nhiều nhất?
2. **Xu hướng theo thời gian ra sao?** Tháng nào cao/thấp? Có tính mùa vụ không?
3. **Khách hàng phân bố thế nào?** Bao nhiêu % khách tạo ra 80% doanh thu?
4. **Có phân khúc nào hành xử khác biệt rõ rệt?** (theo tuổi, thành phố, kênh…)
5. **Dữ liệu có vấn đề gì cần cảnh báo?** Chất lượng ra sao, kết luận nào chưa chắc chắn?

> Câu 5 là câu phân biệt người mới với người chuyên nghiệp. Người mới giấu vấn đề dữ liệu; người chuyên nghiệp nêu rõ chúng cùng mức độ ảnh hưởng.

---

## Deliverable

```
projects/P1-eda-report/
├── README.md              # BÁO CÁO — người không biết code cũng đọc được
├── 01_lam_sach.ipynb      # quy trình làm sạch, có ghi chép quyết định
├── 02_phan_tich.ipynb     # phân tích + biểu đồ
├── hinh/                  # biểu đồ xuất ra .png để nhúng vào README
└── data_sach.csv          # dữ liệu đã làm sạch (nếu < 10MB)
```

### `README.md` — cấu trúc bắt buộc

```markdown
# Phân tích bán hàng 2025

## Tóm tắt cho lãnh đạo            ← viết CUỐI CÙNG, đọc ĐẦU TIÊN
5 gạch đầu dòng. Mỗi gạch một con số. Không thuật ngữ kỹ thuật.

## Dữ liệu
Nguồn, phạm vi thời gian, số dòng ban đầu → sau khi làm sạch.

## Chất lượng dữ liệu               ← đừng giấu phần này
Bảng: vấn đề | số dòng ảnh hưởng | cách xử lý | ảnh hưởng tới kết luận

## Phát hiện chính
### 1. <Tiêu đề là KẾT LUẬN, không phải chủ đề>
[biểu đồ]
2–3 câu diễn giải. Con số cụ thể.
**Đề xuất:** hành động cụ thể.

### 2. ... (5 phát hiện)

## Hạn chế
Kết luận nào chưa chắc chắn và vì sao.

## Bước tiếp theo
Cần thêm dữ liệu gì? Phân tích gì tiếp?
```

---

## Yêu cầu chi tiết

### Làm sạch (notebook 01)

- [ ] Chạy đủ 7 bước của quy trình làm sạch
- [ ] **Ghi lại mọi quyết định và lý do** — không chỉ code
- [ ] Báo cáo trước–sau: bao nhiêu dòng bị loại, vì sao
- [ ] Xử lý ngoại lai **có suy nghĩ** (lỗi hay sự thật hiếm?)

### Phân tích (notebook 02)

- [ ] Ít nhất **6 biểu đồ**, đủ 4 dạng khác nhau
- [ ] Mỗi biểu đồ có **tiêu đề nói lên kết luận**, nhãn trục đầy đủ, đơn vị rõ ràng
- [ ] Ít nhất một phân tích theo **thời gian**
- [ ] Ít nhất một phân tích **phân khúc** (chia nhóm rồi so sánh)
- [ ] Ít nhất một phân tích **tương quan/quan hệ** giữa hai biến

### Báo cáo (README.md)

- [ ] Tóm tắt lãnh đạo ≤ 5 gạch đầu dòng, **mỗi gạch có một con số**
- [ ] 5 phát hiện, mỗi phát hiện có biểu đồ + số liệu + đề xuất hành động
- [ ] Mục chất lượng dữ liệu trung thực
- [ ] Mục hạn chế — nêu rõ điều bạn **không** kết luận được

---

## Ví dụ: viết phát hiện thế nào

**❌ Kém — mô tả cái ai cũng thấy trên biểu đồ:**
> ### Doanh thu theo danh mục
> Biểu đồ cho thấy Laptop có doanh thu cao nhất, sau đó là Điện thoại.

**✅ Tốt — có kết luận, số liệu, và hành động:**
> ### Laptop tạo 47% doanh thu nhưng chỉ chiếm 18% số đơn
> `![Doanh thu theo danh mục](hinh/doanh_thu_danh_muc.png)`  ← biểu đồ của bạn nhúng ở đây
>
> Laptop đóng góp **8.2 tỷ / 17.4 tỷ** tổng doanh thu (47%) chỉ với **512 đơn** (18% số đơn).
> Giá trị đơn trung bình của Laptop là **16.0 triệu**, gấp **4.2 lần** mức trung bình chung (3.8 triệu).
>
> Ngược lại, Phụ kiện chiếm **31% số đơn** nhưng chỉ **6% doanh thu** — chi phí xử lý mỗi đơn
> gần như nhau nên nhóm này có thể đang lỗ về mặt vận hành.
>
> **Đề xuất:** dồn ngân sách quảng cáo sang nhóm Laptop; với Phụ kiện, đặt ngưỡng giá trị
> đơn tối thiểu hoặc gộp bán kèm để tăng giá trị mỗi lần xử lý.

**Ba khác biệt:** tiêu đề là **kết luận** · có **so sánh** (gấp 4.2 lần) · có **hành động** cụ thể.

---

## ✅ Tiêu chí chấm

| Hạng mục | Điểm | Đạt khi |
|---|---|---|
| **Làm sạch** | 25 | Đủ 7 bước, có ghi chép lý do, xử lý ngoại lai có suy nghĩ |
| **Phân tích** | 25 | ≥ 6 biểu đồ đúng dạng, có phân khúc, có thời gian |
| **Diễn giải** | 30 | 5 phát hiện có số liệu + đề xuất; tiêu đề là kết luận |
| **Trung thực** | 10 | Nêu rõ hạn chế và vấn đề chất lượng dữ liệu |
| **Trình bày** | 10 | README sạch, biểu đồ rõ, người không biết code đọc được |

**Tự chấm mức độ:**

| Mức | Dấu hiệu |
|---|---|
| ❌ Chưa đạt | Chỉ có notebook với biểu đồ, không có kết luận bằng chữ |
| ⚠️ Tạm được | Có báo cáo nhưng chỉ mô tả biểu đồ, không có đề xuất hành động |
| ✅ Tốt | 5 phát hiện có số liệu + đề xuất, có nêu hạn chế |
| 🌟 Xuất sắc | Người không biết code đọc xong ra được quyết định kinh doanh |

---

## 💡 Bảy lỗi người mới hay mắc

| Lỗi | Cách tránh |
|---|---|
| **Nhảy thẳng vào vẽ biểu đồ** | Làm sạch trước. Biểu đồ trên dữ liệu bẩn là kết luận sai đẹp mắt |
| **Vẽ 30 biểu đồ, không kết luận gì** | 6 biểu đồ có kết luận > 30 biểu đồ không ai đọc |
| **Tiêu đề biểu đồ là chủ đề** | *"Doanh thu theo tháng"* → *"Doanh thu tháng 11 gấp đôi trung bình năm"* |
| **Giấu vấn đề dữ liệu** | Nêu rõ. Người đọc có kinh nghiệm sẽ tin bạn hơn |
| **Kết luận nhân quả từ tương quan** | *"Khách trẻ mua nhiều hơn"* ≠ *"nhắm vào khách trẻ sẽ tăng doanh thu"* |
| **Không có đơn vị / không định dạng số** | `17400000000` → `17.4 tỷ VND` |
| **Báo cáo chỉ dành cho người biết code** | Sếp bạn không đọc notebook. README phải tự đứng được |

---

## 📌 Nộp bài

```powershell
git add .
git commit -m "P1: bao cao EDA ban hang 2025"
git push
```

Sau đó **gửi link GitHub cho một người không làm kỹ thuật** và hỏi: *"Đọc xong bạn hiểu gì?"*

Nếu họ tóm tắt lại đúng 3 phát hiện chính của bạn → báo cáo đạt.
Nếu họ nói *"nhìn nhiều số quá không hiểu gì"* → viết lại phần tóm tắt.

---

⬅️ [Phase 03](../../curriculum/03-data-toolkit/README.md) · ➡️ [Phase 04 — Classical ML](../../curriculum/04-classical-ml/README.md)
