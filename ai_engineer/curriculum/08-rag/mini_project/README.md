# 🛠 Mini-project Phase 08 — Bàn thử nghiệm cấu hình RAG

**Thời gian:** 6–8 giờ (Tuần 21) · **Không có lời giải** · **Chi phí: $0–1**

> Bài **khởi động** trước [project P6](../../../projects/P6-rag-qa/README.md).
>
> P6 xây một sản phẩm hỏi đáp hoàn chỉnh. Mini-project này xây **thứ bạn cần
> trước khi xây sản phẩm đó**: một cái bàn thử nghiệm cho phép đổi cấu hình và
> biết ngay điều gì tốt lên, điều gì hỏng đi.

---

## Đề bài

Bài 4 đã cho thấy chuyển từ BM25 sang hybrid làm **điểm trung bình tăng** trong
khi một câu mã lỗi đang chạy hoàn hảo **bị hỏng**. Bạn phát hiện được điều đó vì
đã so sánh theo từng câu.

Giờ hãy biến thao tác đó thành một **công cụ chạy được bằng một dòng lệnh**.

```powershell
python chay.py --chunk 600 --overlap 120 --cach hybrid --k 3 --luu kq_hybrid.json
python chay.py --chunk 600 --overlap 120 --cach bm25   --k 3 --luu kq_bm25.json
python so_sanh.py kq_bm25.json kq_hybrid.json
```

```
mini_project/
├── cau_hinh.py          # dataclass CauHinh + đọc/ghi JSON
├── chunker.py           # ba cách cắt, chọn bằng tham số
├── tim_kiem.py          # bm25 / vector / hybrid, chọn bằng tham số
├── danh_gia.py          # chấm điểm, tổng hợp theo loại
├── chay.py              # CLI: chạy 1 cấu hình -> lưu JSON
├── so_sanh.py           # CLI: so 2 file kết quả -> bảng thoái lui
├── cau_hoi_cua_toi.json # ≥ 10 câu hỏi vàng do BẠN tự viết
└── test_danh_gia.py     # ≥ 8 test, chạy không cần API key
```

---

## Yêu cầu bắt buộc

### ① `cau_hinh.py` — cấu hình là dữ liệu, không phải hằng số rải rác

```python
@dataclass(frozen=True)
class CauHinh:
    chunk: int = 600
    overlap: int = 120
    cach_cat: str = "co_dinh"        # co_dinh | theo_doan | theo_tieu_de
    cach_tim: str = "hybrid"         # bm25 | vector | hybrid
    k: int = 3
    k0: int = 60
    model: str = "claude-haiku-4-5"

    def ma(self) -> str: ...          # chuỗi ngắn định danh cấu hình
```

- [ ] `frozen=True` — cấu hình **không được đổi** giữa chừng một lần chạy
- [ ] `ma()` sinh chuỗi kiểu `600-120-codinh-hybrid-k3` để đặt tên file kết quả
- [ ] Cấu hình được **lưu kèm** trong file kết quả

> 📌 **Vì sao lưu cấu hình cùng kết quả?** Vì ba tuần sau bạn sẽ tìm thấy file
> `ket_qua_tot.json` và **không nhớ nổi** nó chạy với chunk size bao nhiêu.
> Một kết quả không kèm cấu hình sinh ra nó là một kết quả vô dụng.

### ② `chunker.py` và `tim_kiem.py`

- [ ] Cả ba cách cắt của `ex01`, chọn qua `cau_hinh.cach_cat`
- [ ] Cả ba cách tìm của `ex02`, chọn qua `cau_hinh.cach_tim`
- [ ] **Không** có `if` nào rải rác trong `chay.py` — việc chọn nằm gọn ở đây
- [ ] Tìm kiếm phải **tái lập được**: chạy hai lần ra kết quả y hệt

### ③ `danh_gia.py` — chấm và tổng hợp

- [ ] Chấm ba phần như bài 4: recall / từ khoá / trích dẫn
- [ ] Tổng hợp **theo loại câu hỏi**, không chỉ điểm tổng
- [ ] Câu `khong_co`: chỉ đúng khi từ chối
- [ ] Một câu ném exception → 0 điểm, **các câu còn lại vẫn chạy**
- [ ] Ghi lại **thời gian truy vấn trung bình** — hybrid chậm hơn bao nhiêu?

### ④ `chay.py` — CLI chạy một cấu hình

```powershell
python chay.py --chunk 300 --overlap 0 --cach vector --k 5 --luu kq.json
python chay.py --that            # dùng model thật thay vì trình sinh giả lập
```

- [ ] Mặc định dùng **trình sinh giả lập** (không cần API key)
- [ ] `--that` chuyển sang gọi Claude, và **in ước tính chi phí trước khi chạy**
- [ ] In bảng điểm theo loại ngay trên màn hình
- [ ] Lưu JSON gồm: cấu hình, điểm từng câu, chi tiết, thời gian, tổng chi phí

### ⑤ `so_sanh.py` — ⭐ phần quan trọng nhất

```powershell
python so_sanh.py kq_bm25.json kq_hybrid.json
```

```
                    bm25      hybrid
TỔNG                0.90  ->  0.94   (+0.04)

  de                1.00  ->  1.00
  ma_loi            1.00  ->  0.50   ⚠️  -0.50
  dien_dat_khac     0.75  ->  1.00
  nhieu_doan        1.00  ->  1.00
  kho               0.73  ->  1.00
  khong_co          1.00  ->  1.00

⚠️  THOÁI LUI (1 câu):
  vx305_lam_sao   1.00 -> 0.00   (ma_loi)
     recall  1.00 -> 0.00     <- hỏng ở RETRIEVAL
     Gặp mã VX-305 thì phải xử lý thế nào?

✅ Cải thiện (2 câu): ngoi_nha_lam_viec, han_che_thu_viec

Kết luận: điểm trung bình TĂNG nhưng có thoái lui. ĐỌC từng câu trước khi deploy.
```

- [ ] So sánh **theo từng câu**, chỉ tính các id có ở **cả hai** file
- [ ] Với mỗi câu thoái lui, chỉ ra hỏng ở **retrieval** hay ở **sinh**
- [ ] Cảnh báo rõ khi có thoái lui — **kể cả khi điểm tổng tăng**
- [ ] Thoát với mã khác 0 nếu có thoái lui *(để cắm được vào CI sau này)*

> ⭐ Dòng cuối cùng của bảng trên là toàn bộ lý do mini-project này tồn tại.
> Nếu công cụ của bạn chỉ in ra `0.90 -> 0.94`, nó đang **giúp bạn tự lừa mình**
> một cách rất hiệu quả.

### ⑥ `cau_hoi_cua_toi.json` — ≥ 10 câu hỏi vàng **do bạn tự viết**

Bộ 18 câu có sẵn là do người khác viết. Giờ đến lượt bạn.

- [ ] **≥ 10 câu mới** trên cùng kho tài liệu, cùng định dạng
- [ ] Phải có **≥ 2 câu `khong_co`** — loại "gần giống một thứ có thật"
- [ ] Phải có **≥ 2 câu cần hai đoạn trích** ở hai chỗ khác nhau
- [ ] Phải có **≥ 1 câu sai giả định** *(ví dụ "phép năm 20 ngày thì dùng sao?"
      trong khi tài liệu ghi 12 ngày — hệ thống phải sửa lại giả định, không hùa theo)*
- [ ] Mỗi câu có `ghi_chu` nói **vì sao câu này được đưa vào bộ test**

> 📌 **Đây là phần tốn công nhất và cũng đáng giá nhất.** Trong lúc viết, bạn sẽ
> liên tục phải quyết định những ca mập mờ: câu này tính là "có đáp án" hay
> "không"? Đoạn trích lấy tới đâu là đủ? Ghi lại các quyết định đó — chúng chính
> là **đặc tả thật sự** của hệ thống bạn đang xây.
>
> ⚠️ **Đừng dùng model sinh câu hỏi vàng rồi chấm chính model đó.** Bạn sẽ chỉ đo
> được nó có nhất quán với chính nó hay không, chứ không đo được nó có **đúng** không.

### ⑦ `test_danh_gia.py` — ≥ 8 test, không cần API key

- [ ] Câu trả lời hoàn hảo → 1.0
- [ ] Lấy nhầm đoạn → mất đúng 0.4
- [ ] Thiếu từ khoá → mất đúng 0.4
- [ ] Trích dẫn `[9]` khi chỉ có 3 đoạn → `trich_dan_ok` False
- [ ] Câu `khong_co`: từ chối → 1.0; trả lời trôi chảy → 0.0
- [ ] Một câu ném exception → 0 điểm và **các câu sau vẫn chạy**
- [ ] `so_sanh` phát hiện thoái lui **khi điểm trung bình vẫn tăng**
- [ ] `so_sanh` bỏ qua id chỉ có ở một bên

---

## Nâng cao

- [ ] **Quét lưới:** chạy 12 cấu hình (3 chunk size × 2 overlap × 2 cách tìm), in bảng xếp hạng — rồi kiểm tra cấu hình đứng đầu có thoái lui ở đâu không
- [ ] **Loại chunk gần trùng** trước khi đưa vào prompt (cosine > 0.95) — bài 1 cho thấy chồng lấn làm top-k mất đa dạng
- [ ] **Định tuyến truy vấn:** phát hiện mã định danh bằng regex → dùng BM25 riêng cho câu đó, hybrid cho phần còn lại. Đo xem có lấy lại được nhóm `ma_loi` không
- [ ] **Rerank** bằng cross-encoder của `sentence-transformers` — đo xem có đáng độ trễ không
- [ ] **LLM-as-judge** cho faithfulness, và kiểm chính judge trên các ca bạn đã biết đáp án
- [ ] Vẽ recall theo k và chi phí theo k trên cùng một biểu đồ

---

## ✅ Tự chấm

| Tiêu chí | Đạt khi |
|---|---|
| **Đổi cấu hình bằng tham số** | Không phải sửa code để thử cấu hình khác |
| **Kết quả tái lập được** | Chạy hai lần cùng cấu hình ra số y hệt |
| **Lưu cấu hình cùng kết quả** | Mở file JSON là biết nó sinh ra thế nào |
| **Bắt được thoái lui** | Có cảnh báo kể cả khi điểm trung bình tăng |
| **Chỉ ra khâu hỏng** | Phân biệt được lỗi retrieval với lỗi sinh |
| **Bộ câu hỏi của riêng bạn** | ≥ 10 câu tự viết, có `khong_co` và câu nhiều đoạn |
| **Có test** | ≥ 8 test, `pytest` xanh, chạy không cần key |

> Hai dòng cuối quan trọng nhất. Một bàn thử nghiệm không có test là một cái cân
> chưa hiệu chuẩn: nó vẫn cho ra số, và bạn vẫn tin những con số đó.

---

## 💡 Gợi ý

<details><summary>Cấu trúc file kết quả nên như thế nào?</summary>

```json
{
  "cau_hinh": {"chunk": 600, "overlap": 120, "cach_tim": "hybrid", "k": 3},
  "thoi_gian": "2026-08-23T14:20:11",
  "tong": 0.94,
  "theo_loai": {"de": 1.0, "ma_loi": 0.5},
  "thoi_gian_tb_ms": 12.4,
  "chi_phi_usd": 0.0,
  "cac_cau": [
    {"id": "vx305_lam_sao", "loai": "ma_loi", "diem": 0.0,
     "chi_tiet": {"recall": 0.0, "du_tu_khoa": false, "trich_dan_ok": true},
     "cau_tra_loi": "...", "nguon_lay_ve": ["huong_dan_ky_thuat.md"], "loi": null}
  ]
}
```

Ba thứ hay bị quên mà sau này rất cần: **`cau_hinh`** (không có thì kết quả vô
nghĩa), **`cau_tra_loi`** (để đọc lại xem nó sai thế nào), và **`nguon_lay_ve`**
(để biết retrieval đang nhặt phải cái gì).
</details>

<details><summary>Làm sao chỉ ra thoái lui hỏng ở khâu nào?</summary>

```python
def khau_hong(ct_truoc: dict, ct_sau: dict) -> str:
    if ct_sau["recall"] < ct_truoc["recall"]:
        return "RETRIEVAL"                       # lấy về ít đoạn đúng hơn
    if ct_sau["recall"] == 1.0 and not ct_sau["du_tu_khoa"]:
        return "SINH"                            # có đoạn đúng mà vẫn trả lời thiếu
    return "KHÁC"
```

Phân biệt này quyết định bạn đi sửa cái gì tiếp theo:

| Khâu hỏng | Sửa ở đâu |
|---|---|
| RETRIEVAL | chunk size, chồng lấn, cách tìm, k |
| SINH | prompt, model, thứ tự đoạn trong ngữ cảnh |

Người mới gặp điểm thấp thường lao vào sửa prompt. Bảng này ngăn điều đó.
</details>

<details><summary>Viết câu hỏi "khong_co" thế nào cho khó?</summary>

Câu dễ: *"Công ty có chi nhánh ở sao Hoả không?"* — retrieval trả về đoạn hoàn
toàn không liên quan, model từ chối rất dễ. Câu này **không kiểm tra được gì**.

Câu khó: **gần giống một thứ CÓ THẬT trong tài liệu.**

| Có thật trong tài liệu | Câu `khong_co` khó |
|---|---|
| Phụ cấp đi lại 500.000đ | "Công ty có xe đưa đón không?" |
| Bảo hành 12 tháng | "Mua thêm gói bảo hành 24 tháng được không?" |
| Làm từ xa 8 ngày/tháng | "Được làm từ xa hẳn ở nước ngoài không?" |

Với những câu này, retrieval **chắc chắn** trả về đoạn liên quan điểm cao, và
model phải đủ tỉnh táo để nói *"tài liệu nói về X, không nói về Y"*.

> Đây là dạng câu người dùng thật hay hỏi nhất, và cũng là dạng hệ thống hay bịa nhất.
</details>

<details><summary>Đo thời gian truy vấn cho đúng</summary>

```python
import time

t0 = time.perf_counter()
idx = tim(cau_hoi, k)
ms = (time.perf_counter() - t0) * 1000
```

Dùng `perf_counter()`, không dùng `time()` — `time()` có độ phân giải thô và có
thể **nhảy lùi** khi hệ thống đồng bộ đồng hồ.

Và nhớ **bỏ lần chạy đầu tiên** ra khỏi trung bình: lần đầu gánh cả việc nạp
model và dựng index, nên nó không đại diện cho gì cả.
</details>

---

## 📌 Nộp bài

```powershell
pytest curriculum/08-rag/mini_project -v
python chay.py --cach bm25   --luu kq_bm25.json
python chay.py --cach hybrid --luu kq_hybrid.json
python so_sanh.py kq_bm25.json kq_hybrid.json
git add .
git commit -m "Mini-project phase 08: ban thu nghiem cau hinh RAG"
git push
```

Bài test khắt khe nhất cho project này:

> Nhờ một người khác đổi giúp bạn **một** tham số bất kỳ trong cấu hình mà không
> cho bạn biết là tham số nào.
>
> Chạy công cụ của bạn. Nếu nó không nói được **thay đổi đó tốt hay xấu, và hỏng
> ở câu nào**, thì bạn chưa xây xong bàn thử nghiệm.

---

⬅️ [Phase 08](../README.md) · ➡️ [🎯 Project P6 — RAG Q&A](../../../projects/P6-rag-qa/README.md)
