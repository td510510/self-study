# 🛠 Mini-project Phase 05 — Khung huấn luyện tái sử dụng

**Thời gian:** 5–7 giờ (Tuần 13) · **Không có lời giải**

> Bài **khởi động** trước [project P3](../../../projects/P3-image-classifier/README.md). Mini-project này xây *khung train*; P3 dùng khung đó để làm ra sản phẩm có giao diện.

---

## Đề bài

Đóng gói training loop thành một **thư viện nhỏ** dùng lại được cho mọi bài toán phân loại ảnh — thứ bạn mang theo sang mọi dự án PyTorch sau này.

```
mini_project/
├── khung_train.py       # vòng lặp train, đánh giá, early stopping, checkpoint
├── mo_hinh.py           # các kiến trúc: MLP, CNN, CNN + regularization
├── truc_quan.py         # vẽ đường cong học, confusion matrix, ảnh sai
├── chay.py              # CLI: nạp .npz → train → báo cáo → lưu model
└── test_khung_train.py  # ít nhất 10 test
```

> **Vì sao tách?** `khung_train.py` không `print`, không đọc file, không vẽ → **test được**. Nguyên tắc bạn đã dùng ở mini-project Phase 01, 03, 04.

---

## Yêu cầu bắt buộc

### `khung_train.py` — 6 hàm

- [ ] `tao_batch(X, y, batch_size, seed)` → list các batch, có xáo trộn tái lập được
- [ ] `train_mot_epoch(model, batches, ham_loss, opt, device, augment=None)` → loss trung bình
- [ ] `danh_gia(model, X, y, ham_loss, device)` → `{loss, accuracy}`
- [ ] `train(model, ...)` → lịch sử 4 đường + **early stopping** + **lưu checkpoint tốt nhất**
- [ ] `chan_doan(lich_su)` → `"Tot"` / `"Overfit"` / `"Chua hoc duoc"` / `"Loss nan"`
- [ ] `du_doan(model, X, device)` → nhãn + xác suất

**Mọi hàm phải:**
- Có type hint và docstring
- Nhận `device` và hoạt động đúng trên cả CPU lẫn GPU
- Gọi đúng `model.train()` / `model.eval()`
- Không phụ thuộc vào bài toán cụ thể (không hard-code 4 lớp, 28×28)

### `chay.py` — CLI

```powershell
python chay.py data/hinh_khoi.npz --model cnn --epoch 20 --augment --patience 5
```

Phải in báo cáo:

```
==================================================
  HUAN LUYEN: hinh_khoi.npz
==================================================
  Thiet bi     : cpu
  Train / Test : 8000 / 2000
  So lop       : 4  (tron, vuong, tam_giac, chu_thap)
  Kien truc    : cnn  (105,476 tham so)

  epoch  1/20   train_loss 1.1204   val_loss 0.8831   val_acc 0.6420
  epoch  5/20   train_loss 0.2145   val_loss 0.2530   val_acc 0.9105
  epoch 12/20   train_loss 0.0891   val_loss 0.1702   val_acc 0.9480   * tot nhat
  epoch 17/20   train_loss 0.0512   val_loss 0.1988   val_acc 0.9455
  -> Early stopping tai epoch 17 (khong cai thien 5 epoch)

  Chan doan    : Tot
  Val acc cuoi : 0.9480  (epoch 12)
  Thoi gian    : 24.3 giay

  Da luu: model_tot_nhat.pt
  Da luu: hinh/duong_cong.png, hinh/confusion.png, hinh/anh_sai.png
==================================================
```

- [ ] Chạy được với `--model mlp` **và** `--model cnn` trên cùng file dữ liệu
- [ ] Không crash khi thiếu file / sai tham số → thông báo rõ ràng
- [ ] Tự phát hiện GPU, dùng nếu có
- [ ] Lưu `state_dict` của model **tốt nhất**, không phải epoch cuối

### `truc_quan.py` — 3 biểu đồ

- [ ] Đường cong học (train + val, loss + accuracy)
- [ ] Confusion matrix có ghi số
- [ ] Lưới 12 ảnh model **đoán sai**, ghi rõ *thật* vs *đoán*

### `test_khung_train.py` — ít nhất 10 test

Bắt buộc phải có:
- [ ] `train_mot_epoch` làm **thay đổi** tham số model
- [ ] `train_mot_epoch` gọi `model.train()`, `danh_gia` gọi `model.eval()`
- [ ] `tao_batch` giữ đúng cặp (X, y) sau khi xáo trộn
- [ ] Early stopping **thật sự dừng sớm** khi val loss không cải thiện
- [ ] Checkpoint lưu được model **tốt nhất**, không phải cuối cùng

---

## Nâng cao

- [ ] `--lr-finder` quét learning rate và vẽ biểu đồ để chọn
- [ ] Learning rate scheduler (`CosineAnnealingLR` hoặc `ReduceLROnPlateau`)
- [ ] Gradient clipping cho trường hợp loss bùng nổ
- [ ] `--resume ckpt.pt` train tiếp từ checkpoint (lưu cả `optimizer.state_dict()`)
- [ ] Ghi log ra CSV để so sánh nhiều lần chạy
- [ ] Hỗ trợ ảnh màu (3 kênh) và kích thước bất kỳ

---

## ✅ Tự chấm

| Tiêu chí | Đạt khi |
|---|---|
| **Chạy được** | Cả `--model mlp` lẫn `--model cnn` không crash |
| **Tách module** | `khung_train.py` không `print`, không đọc file, không vẽ |
| **Không hard-code** | Đổi sang bộ dữ liệu 3 lớp / ảnh 32×32 vẫn chạy |
| **Đúng train/eval** | Test chứng minh được |
| **Early stopping** | Thật sự dừng sớm, và lưu model **tốt nhất** |
| **Có test** | ≥ 10 test, `pytest` xanh |
| **Chạy được trên GPU** | Chỉ cần đổi `--device cuda`, không sửa code |

---

## 💡 Gợi ý

<details><summary>Làm sao viết hàm chạy đúng trên cả CPU lẫn GPU?</summary>

```python
def train_mot_epoch(model, batches, ham_loss, opt, device="cpu", augment=None):
    model.train()
    tong = 0.0
    for xb, yb in batches:
        xb, yb = xb.to(device), yb.to(device)     # ← CHUYỂN dữ liệu
        if augment is not None:
            xb = augment(xb)
        loss = ham_loss(model(xb), yb)
        opt.zero_grad(); loss.backward(); opt.step()
        tong += loss.item()
    return tong / len(batches)
```

Model được `.to(device)` **một lần** ở ngoài; dữ liệu phải chuyển ở **mỗi batch** (vì nó được cắt ra từ tensor gốc trên CPU).
</details>

<details><summary>Làm sao viết early stopping đúng cách?</summary>

```python
tot_nhat, kien_nhan, epoch_tot = float("inf"), 0, 0

for epoch in range(so_epoch):
    ...
    if val_loss < tot_nhat - 1e-4:            # cần cải thiện RÕ RỆT
        tot_nhat, kien_nhan, epoch_tot = val_loss, 0, epoch
        torch.save(model.state_dict(), duong_dan_ckpt)
    else:
        kien_nhan += 1
        if kien_nhan >= patience:
            break

model.load_state_dict(torch.load(duong_dan_ckpt))   # NẠP LẠI bản tốt nhất
```

> ⚠️ Hai lỗi thường gặp: quên nạp lại checkpoint ở cuối (bạn giữ model đã overfit), và so sánh `<` thay vì `< tot_nhat - epsilon` (dao động nhỏ cũng reset bộ đếm).
</details>

<details><summary>Làm sao test được early stopping?</summary>

Dùng dữ liệu ngẫu nhiên — model không thể học được nên val loss sẽ không cải thiện:

```python
def test_early_stopping_dung_som():
    torch.manual_seed(0)
    X = torch.randn(100, 1, 8, 8)
    y = torch.randint(0, 2, (100,))          # nhãn NGẪU NHIÊN — không học được
    model = tao_cnn(1, 2, 8)

    ls = train(model, X, y, X, y, so_epoch=100, patience=3)
    assert len(ls["val_loss"]) < 100, "Phai dung som"
```
</details>

<details><summary>Làm sao viết augmentation chỉ với torch?</summary>

```python
def augment(xb, seed=None):
    g = torch.Generator(device=xb.device)
    if seed is not None:
        g.manual_seed(seed)
    out = xb.clone()

    lat = torch.rand(len(xb), generator=g, device=xb.device) < 0.5
    out[lat] = torch.flip(out[lat], dims=[3])                # lật ngang

    dy, dx = torch.randint(-3, 4, (2,), generator=g).tolist()
    return torch.roll(out, shifts=(dy, dx), dims=(2, 3))     # dịch chuyển
```

> ⚠️ **Chỉ augment tập train, không bao giờ augment tập test.**
</details>

---

## 📌 Nộp bài

```powershell
pytest curriculum/05-deep-learning/mini_project -v
git add .
git commit -m "Mini-project phase 05: khung huan luyen tai su dung"
git push
```

---

⬅️ [Phase 05](../README.md) · ➡️ [🎯 Project P3 — Image Classifier](../../../projects/P3-image-classifier/README.md)
