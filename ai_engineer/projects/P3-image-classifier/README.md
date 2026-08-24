# 🎯 P3 · Image Classifier + Web Demo

**Làm khi:** xong Phase 05 (Tuần 13) · **Thời gian:** 10–14 giờ

---

## Mục tiêu

Đây là project đầu tiên có **giao diện người dùng thật**. Kết thúc, bạn có một trang web mà bất kỳ ai cũng vào được, kéo thả ảnh vào và nhận kết quả — không cần biết code.

> **Khác biệt so với P1, P2:** hai project trước là *báo cáo*. Project này là *sản phẩm*. Người dùng không đọc notebook của bạn — họ dùng thứ bạn làm ra.

---

## Chọn dữ liệu

**Ba lựa chọn**, theo thứ tự tăng dần độ khó và giá trị portfolio:

| Mức | Dữ liệu | Ghi chú |
|---|---|---|
| 🟢 **Tối thiểu** | `data/hinh_khoi.npz` (đã có) | Chạy được ngay, CPU đủ. Nhưng *"phân loại hình khối"* không ấn tượng trong CV |
| 🟡 **Nên làm** | CIFAR-10 / Fashion-MNIST qua `torchvision` | Dataset thật, có tên tuổi. Cần Colab hoặc kiên nhẫn với CPU |
| 🔴 **Ấn tượng nhất** | **Ảnh bạn tự thu thập** | Ví dụ: phân loại rác tái chế, nhận diện lá cây bệnh, phân loại món ăn Việt |

> 💡 **Khuyến nghị:** làm mức 🟡 trước cho chắc, rồi nếu còn thời gian thì đổi sang 🔴. Một project *"phân loại 5 món ăn Việt Nam"* với 500 ảnh tự chụp gây ấn tượng hơn nhiều so với CIFAR-10 thứ 10.000 trên GitHub.

<details><summary>Cách tự thu thập ~500 ảnh</summary>

1. Chọn 3–5 lớp **dễ phân biệt bằng mắt** nhưng không quá dễ (phở / bún bò / hủ tiếu là bài toán hay)
2. Mỗi lớp 100–150 ảnh — tự chụp, hoặc tải về (chú ý giấy phép)
3. Sắp xếp thư mục:
   ```
   data/mon_an/
   ├── pho/       anh001.jpg ...
   ├── bun_bo/
   └── hu_tieu/
   ```
4. Dùng `torchvision.datasets.ImageFolder` — nó tự đọc cấu trúc này
5. **Với 500 ảnh, transfer learning là bắt buộc** — train từ đầu sẽ thất bại

</details>

---

## Deliverable

```
projects/P3-image-classifier/
├── README.md            # BÁO CÁO + ảnh chụp màn hình demo
├── 01_kham_pha.ipynb    # xem dữ liệu, phân bố lớp, ảnh mẫu
├── 02_train.ipynb       # so sánh model, đường cong học, phân tích lỗi
├── src/                 # code sạch (dùng lại từ mini-project)
├── app.py               # Gradio app
├── model_tot_nhat.pt    # checkpoint (nếu < 50MB)
└── hinh/                # biểu đồ + ảnh chụp màn hình
```

---

## Yêu cầu

### ① Khám phá dữ liệu (notebook 01)

- [ ] Hiển thị lưới ảnh mẫu của **mỗi lớp**
- [ ] Phân bố lớp — có mất cân bằng không?
- [ ] Kích thước ảnh: đồng nhất hay khác nhau?
- [ ] Nhìn vài ảnh **khó** — bạn có tự phân loại đúng không? *(nếu người còn nhầm thì đừng kỳ vọng model đạt 99%)*

### ② Huấn luyện (notebook 02)

- [ ] **Baseline bắt buộc:** đoán lớp phổ biến nhất → accuracy bao nhiêu?
- [ ] So sánh **≥ 3 model**: MLP · CNN tự xây · CNN + chống overfit (hoặc transfer learning)
- [ ] Vẽ **đường cong học** (train + val) cho từng model
- [ ] **Data augmentation** — đo hiệu quả thật, có/không bao nhiêu điểm
- [ ] **Early stopping** + lưu checkpoint tốt nhất
- [ ] Confusion matrix — model nhầm **giữa những lớp nào**?
- [ ] Lưới ảnh **đoán sai** kèm nhãn thật/đoán
- [ ] Kết luận có lập luận về model được chọn

### ③ Web demo (`app.py`)

```python
import gradio as gr

def phan_loai(anh):
    # tiền xử lý -> model -> softmax
    return {ten_lop[i]: float(xac_suat[i]) for i in range(len(ten_lop))}

gr.Interface(
    fn=phan_loai,
    inputs=gr.Image(type="pil"),
    outputs=gr.Label(num_top_classes=3),
    title="Phân loại ...",
    description="Kéo thả ảnh vào để thử",
    examples=["hinh/vd1.jpg", "hinh/vd2.jpg"],
).launch()
```

- [ ] Kéo thả ảnh → hiện **top-3 lớp kèm xác suất**
- [ ] Có sẵn **ảnh ví dụ** để người dùng bấm thử ngay
- [ ] Không crash với ảnh lạ: sai kích thước, ảnh xám, ảnh RGBA, file quá lớn
- [ ] Deploy lên **Hugging Face Spaces** (miễn phí) → có link công khai
- [ ] Ảnh chụp màn hình trong README

<details><summary>Cách deploy lên Hugging Face Spaces (miễn phí)</summary>

1. Tạo tài khoản tại https://huggingface.co
2. **New Space** → SDK chọn **Gradio** → Public
3. Upload: `app.py`, `model_tot_nhat.pt`, `requirements.txt`
4. `requirements.txt`:
   ```
   torch
   gradio
   pillow
   ```
5. Space tự build và chạy — bạn có URL công khai dạng
   `huggingface.co/spaces/<username>/<ten-space>`

> ⚠️ Space miễn phí chỉ có CPU. Model CNN nhỏ chạy tốt; ResNet50 thì chậm nhưng vẫn dùng được.
</details>

### ④ Báo cáo (README.md)

```markdown
# Phân loại <chủ đề>

## Demo
🔗 <link Hugging Face Space>
![ảnh chụp màn hình](hinh/demo.png)

## Bài toán
Phân loại gì, vì sao, dùng để làm gì.

## Dữ liệu
Nguồn, số ảnh mỗi lớp, cách chia train/val/test.

## Kết quả

| Model | Tham số | Val acc | Ghi chú |
|---|---|---|---|
| Baseline | 0 | 0.XX | đoán lớp phổ biến nhất |
| MLP | XX | 0.XX | |
| CNN | XX | 0.XX | |
| CNN + augment | XX | **0.XX** | ← chọn |

## Model sai ở đâu
[confusion matrix] + [lưới ảnh đoán sai]
Nhận xét: model nhầm nhiều nhất giữa X và Y, vì ...

## Hạn chế
Khi nào model sẽ thất bại ngoài đời thực.

## Bài học
```

---

## ✅ Tiêu chí chấm

| Hạng mục | Điểm | Đạt khi |
|---|---|---|
| **Phương pháp** | 25 | Có baseline, ≥3 model, đường cong học, early stopping |
| **Phân tích lỗi** | 25 | Confusion matrix + nhìn ảnh sai + **giải thích vì sao** |
| **Demo hoạt động** | 25 | Deploy được, không crash với ảnh lạ, có link công khai |
| **Trung thực** | 15 | Nêu rõ hạn chế, khi nào model thất bại |
| **Trình bày** | 10 | README có ảnh demo, bảng kết quả rõ ràng |

**Tự chấm mức độ:**

| Mức | Dấu hiệu |
|---|---|
| ❌ Chưa đạt | Chỉ có notebook train, không có demo |
| ⚠️ Tạm được | Có demo chạy local, chưa deploy, không phân tích lỗi |
| ✅ Tốt | Deploy được, có link, có phân tích lỗi và hạn chế |
| 🌟 Xuất sắc | Dữ liệu tự thu thập + demo mượt + nêu rõ giới hạn thực tế |

---

## 💡 Bảy lỗi người mới hay mắc

| Lỗi | Cách tránh |
|---|---|
| **Quên `model.eval()` trong `app.py`** | Dropout vẫn bật → mỗi lần dự đoán một kết quả khác nhau |
| **Tiền xử lý lúc demo khác lúc train** | Cùng resize, cùng chuẩn hoá. Đóng gói thành **một hàm dùng chung** |
| **Quên `.unsqueeze(0)` tạo chiều batch** | Model cần `(1, C, H, W)`, ảnh đơn chỉ có `(C, H, W)` |
| **Augment cả tập test** | Test phải phản ánh dữ liệu thật |
| **Không có baseline** | *"Accuracy 85%"* — nhưng 3 lớp mất cân bằng, đoán bừa đã 80% |
| **Chỉ báo cáo accuracy** | Confusion matrix cho biết model nhầm **kiểu gì** |
| **Commit file model 500MB lên git** | Dùng Git LFS, hoặc chỉ để trên HF Space |

> ⚠️ **Lỗi số 2 là nguyên nhân số 1 khiến demo hoạt động tệ hơn hẳn kết quả trong notebook.** Nếu lúc train bạn chuẩn hoá `(x - 0.5) / 0.5` mà lúc demo quên, model nhận đầu vào ở thang đo hoàn toàn khác.
>
> **Cách phòng:** viết đúng **một** hàm `tien_xu_ly(anh)` trong `src/` và gọi nó ở **cả hai** nơi.

---

## 🌟 Thử thách thêm (không bắt buộc)

- [ ] So sánh **CNN tự xây** vs **transfer learning (ResNet18)** trên cùng dữ liệu — chênh bao nhiêu?
- [ ] Hiển thị **feature map** của lớp conv đầu tiên trong demo
- [ ] Grad-CAM: tô sáng vùng ảnh mà model dựa vào để quyết định
- [ ] Thêm cảnh báo *"độ tin cậy thấp"* khi xác suất cao nhất < 0.5
- [ ] Đo **thời gian suy luận** và ghi vào báo cáo

---

## 📌 Nộp bài

```powershell
git add .
git commit -m "P3: phan loai anh + web demo"
git push
```

Sau đó **gửi link demo cho một người không biết lập trình** và bảo họ thử.

Nếu họ dùng được mà không cần bạn hướng dẫn → demo đạt.
Nếu họ hỏi *"rồi giờ làm gì?"* → sửa lại phần mô tả và ảnh ví dụ.

---

⬅️ [Phase 05](../../curriculum/05-deep-learning/README.md) · ➡️ [Phase 06 — NLP & Transformers](../../curriculum/06-nlp-transformers/README.md)
