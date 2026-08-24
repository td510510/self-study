# 🛠 Mini-project Phase 06 — Bộ công cụ tìm kiếm ngữ nghĩa

**Thời gian:** 4–6 giờ (Tuần 15) · **Không có lời giải**

> Bài **khởi động** trước [project P4](../../../projects/P4-mini-gpt/README.md).
>
> P4 xây *mô hình sinh*. Mini-project này xây *công cụ tìm kiếm* — và nó chính là **bộ khung RAG** bạn sẽ dùng lại nguyên vẹn ở Phase 08.

---

## Đề bài

Xây một công cụ tìm kiếm ngữ nghĩa hoàn chỉnh trên tập câu mẫu, **chỉ dùng `torch`** (chưa cần model embedding thật).

```
mini_project/
├── kho_vector.py        # class KhoVector: thêm, tìm kiếm, lưu, nạp
├── danh_gia.py          # đo chất lượng tìm kiếm
├── chay.py              # CLI: nạp dữ liệu → tìm kiếm tương tác
└── test_kho_vector.py   # ít nhất 10 test
```

---

## Yêu cầu bắt buộc

### `kho_vector.py` — class `KhoVector`

```python
class KhoVector:
    def __init__(self, so_chieu: int): ...

    def them(self, van_ban: str, vector: torch.Tensor, sieu_du_lieu: dict | None = None): ...
    def them_nhieu(self, cac_muc: list[tuple[str, torch.Tensor, dict]]): ...

    def tim_kiem(self, truy_van: torch.Tensor, k: int = 5) -> list[dict]: ...
    def tim_kiem_theo_nguong(self, truy_van, nguong: float) -> list[dict]: ...
    def tim_kiem_co_loc(self, truy_van, k, loc: dict) -> list[dict]: ...   # lọc theo siêu dữ liệu

    def luu(self, duong_dan): ...
    @classmethod
    def nap(cls, duong_dan) -> "KhoVector": ...

    def __len__(self): ...
```

**Bắt buộc:**
- [ ] **Chuẩn hoá vector khi thêm vào** — để tìm kiếm chỉ còn một phép nhân ma trận
- [ ] `tim_kiem` trả về list dict có khoá `"van_ban"`, `"diem"`, `"sieu_du_lieu"`, sắp giảm dần
- [ ] Nem `ValueError` rõ ràng nếu vector sai số chiều
- [ ] Kho **rỗng** → `tim_kiem` trả về list rỗng, không crash
- [ ] `luu`/`nap` giữ nguyên mọi thứ (dùng `torch.save`)

### `danh_gia.py` — đo chất lượng

- [ ] `recall_at_k(ket_qua, dung, k)` — trong top-k có bao nhiêu % kết quả đúng
- [ ] `mrr(ket_qua, dung)` — Mean Reciprocal Rank: `1/thứ_hạng` của kết quả đúng đầu tiên
- [ ] `danh_gia_kho(kho, bo_test, k)` → dict tổng hợp

> 🔗 **Đây chính là cách đo chất lượng RAG ở Phase 08.** Không có eval thì bạn không biết cải tiến có thật hay không — đúng bài học từ Phase 04.

### `chay.py` — CLI tương tác

```powershell
python chay.py --data data/cau_mau.json
```

```
Da nap 200 cau, 5 chu de
Nhap truy van (hoac 'thoat'):

> am thuc mien Tay
  0.847  [am_thuc ] Canh chua ca loc dam da huong vi mien Tay.
  0.812  [am_thuc ] Banh xeo gion rum cuon voi rau thom.
  0.798  [am_thuc ] Hu tieu Nam Vang co nhieu loai topping.

> lap trinh --chu-de lap_trinh --k 2
  0.891  [lap_trinh] Python la ngon ngu lap trinh de hoc.
  0.856  [lap_trinh] Debug la ky nang quan trong cua lap trinh vien.
```

- [ ] Hỗ trợ `--k` và lọc theo chủ đề
- [ ] In điểm cosine kèm mỗi kết quả
- [ ] Không crash khi nhập rỗng hoặc chủ đề không tồn tại

### `test_kho_vector.py` — ít nhất 10 test

Bắt buộc phải có:
- [ ] Thêm rồi tìm kiếm ra đúng mục vừa thêm (điểm ≈ 1.0)
- [ ] Kho rỗng không crash
- [ ] Vector sai số chiều → `ValueError`
- [ ] `luu` rồi `nap` cho kết quả tìm kiếm **y hệt**
- [ ] Lọc theo siêu dữ liệu hoạt động đúng
- [ ] `k` lớn hơn số mục → trả về hết, không lỗi

---

## Nâng cao

- [ ] **Hybrid search**: kết hợp cosine với đếm từ khoá trùng khớp — so sánh recall
- [ ] Tìm và loại **mục trùng lặp** (cosine > 0.95)
- [ ] Gom cụm các mục theo chủ đề, **không dùng nhãn** — so với nhãn thật
- [ ] Đo tốc độ: vòng lặp vs nhân ma trận, trên 10.000 vector
- [ ] Nén vector xuống 8-bit và đo mất mát chất lượng *(ý tưởng của quantization)*

---

## ✅ Tự chấm

| Tiêu chí | Đạt khi |
|---|---|
| **Chạy được** | CLI tìm kiếm hoạt động, kết quả hợp lý |
| **Chuẩn hoá đúng** | Test chứng minh tìm kiếm = một phép nhân ma trận |
| **Xử lý biên** | Kho rỗng, vector sai chiều, k quá lớn — không crash |
| **Lưu/nạp đúng** | Kết quả sau khi nạp lại **y hệt** trước khi lưu |
| **Có eval** | Đo được recall@k và MRR |
| **Có test** | ≥ 10 test, `pytest` xanh |

> Tiêu chí **"có eval"** là quan trọng nhất. Nó là thứ phân biệt một công cụ tìm kiếm nghiêm túc với một đoạn code chạy được.

---

## 💡 Gợi ý

<details><summary>Làm sao tạo vector khi chưa có model embedding thật?</summary>

Mô phỏng như bài 2: mỗi chủ đề một "tâm", câu = tâm + nhiễu.

```python
torch.manual_seed(0)
tam = {cd: torch.randn(D) for cd in chu_de}

def gia_lap_embedding(cau: str, chu_de: str, nhieu: float = 0.45) -> torch.Tensor:
    return tam[chu_de] + torch.randn(D) * nhieu
```

Tham số `nhieu` cho bạn **điều chỉnh độ khó**: nhiễu nhỏ → tìm kiếm dễ, nhiễu lớn → khó. Rất hữu ích để test hàm eval của bạn có nhạy không.

> Ở Phase 08 bạn chỉ cần thay hàm này bằng `sentence-transformers`. **Mọi thứ còn lại giữ nguyên.**
</details>

<details><summary>Làm sao lưu/nạp cả class?</summary>

```python
def luu(self, duong_dan):
    torch.save({
        "so_chieu": self.so_chieu,
        "vectors": self.vectors,          # tensor (n, d) đã chuẩn hoá
        "van_ban": self.van_ban,          # list[str]
        "sieu_du_lieu": self.sieu_du_lieu,  # list[dict]
    }, duong_dan)

@classmethod
def nap(cls, duong_dan):
    d = torch.load(duong_dan, weights_only=False)
    kho = cls(d["so_chieu"])
    kho.vectors = d["vectors"]
    kho.van_ban = d["van_ban"]
    kho.sieu_du_lieu = d["sieu_du_lieu"]
    return kho
```

> ⚠️ `weights_only=False` cần cho dữ liệu Python thuần (list, dict). Chỉ dùng với file **bạn tự tạo** — nạp file lạ với tuỳ chọn này là rủi ro bảo mật.
</details>

<details><summary>Làm sao tính MRR?</summary>

**Mean Reciprocal Rank** — vị trí của kết quả đúng **đầu tiên**:

```python
def mrr(ket_qua: list[str], dung: set[str]) -> float:
    for thu_hang, r in enumerate(ket_qua, start=1):
        if r in dung:
            return 1.0 / thu_hang
    return 0.0
```

```
Đúng ở vị trí 1  ->  MRR = 1.00
Đúng ở vị trí 2  ->  MRR = 0.50
Đúng ở vị trí 5  ->  MRR = 0.20
Không có         ->  MRR = 0.00
```

**Khác gì recall@k?** Recall chỉ hỏi *"có trong top-k không"*; MRR quan tâm **thứ hạng**. Với RAG, thứ hạng rất quan trọng vì tài liệu xếp đầu ảnh hưởng câu trả lời nhiều nhất.
</details>

<details><summary>Làm sao lọc theo siêu dữ liệu?</summary>

```python
def tim_kiem_co_loc(self, truy_van, k, loc: dict):
    hop_le = [i for i, sdl in enumerate(self.sieu_du_lieu)
              if all(sdl.get(kh) == gt for kh, gt in loc.items())]
    if not hop_le:
        return []

    idx = torch.tensor(hop_le)
    diem = self.vectors[idx] @ self._chuan_hoa(truy_van)
    top = torch.topk(diem, min(k, len(hop_le)))
    return [self._tao_ket_qua(int(idx[i]), float(d))
            for i, d in zip(top.indices, top.values)]
```

> 📌 **Lọc trước rồi mới tìm** — đó là cách mọi vector database làm (gọi là *pre-filtering*). Tìm trước rồi lọc sau có thể trả về ít hơn `k` kết quả.
</details>

---

## 📌 Nộp bài

```powershell
pytest curriculum/06-nlp-transformers/mini_project -v
git add .
git commit -m "Mini-project phase 06: bo cong cu tim kiem ngu nghia"
git push
```

---

⬅️ [Phase 06](../README.md) · ➡️ [🎯 Project P4 — Mini-GPT](../../../projects/P4-mini-gpt/README.md)
