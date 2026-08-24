# 🎯 P6 · RAG Q&A

**Làm khi:** xong Phase 08 (Tuần 21) · **Thời gian:** 14–18 giờ · **Chi phí: $1–3**

> 📌 Phase 10 sẽ đưa chính hệ thống này lên internet qua FastAPI + Docker.
> Hãy xây với ý thức đó: **tách phần lõi RAG khỏi phần giao diện ngay từ đầu.**

---

## Mục tiêu

Xây một hệ thống hỏi đáp trên **tài liệu thật của bạn**, có trích dẫn nguồn,
và **chứng minh bằng số** rằng nó hoạt động.

> Ai cũng ghép được LangChain với Chroma trong 20 dòng, và nó sẽ *chạy*.
> Thứ tách bạn ra khỏi đám đông là trả lời được: **"nó đúng bao nhiêu phần trăm,
> sai ở loại câu hỏi nào, tốn bao nhiêu tiền mỗi câu, và lần sửa gần nhất có làm
> hỏng gì không?"**

---

## Chọn tài liệu

Chọn **một** miền và làm cho tới.

| Mức | Tài liệu | Ghi chú |
|---|---|---|
| 🟢 **Tối thiểu** | Kho `data/phase08/tai_lieu/` có sẵn | Chạy ngay, nhưng đã có sẵn bộ câu hỏi vàng nên bạn bỏ lỡ phần đáng giá nhất |
| 🟡 **Nên làm** | Tài liệu **PDF thật** bạn tự chọn | Giáo trình, tài liệu kỹ thuật mã nguồn mở, luật, quy chuẩn |
| 🔴 **Tốt nhất cho CV** | Tài liệu của **lĩnh vực bạn hiểu** | Bạn tự đánh giá được câu trả lời đúng hay sai — lợi thế rất lớn |

**Kích thước khuyến nghị:** 50–300 trang. Nhỏ hơn thì prompt caching rẻ hơn RAG;
lớn hơn thì việc gán nhãn câu hỏi vàng sẽ ngốn hết thời gian.

> ⚠️ **Về dữ liệu và bản quyền:** dùng tài liệu công khai, tài liệu bạn có quyền
> sử dụng, hoặc tài liệu do chính bạn viết. **Không** đưa dữ liệu cá nhân của
> người khác lên API. Nếu dùng tài liệu nội bộ công ty, hãy **hỏi trước** —
> gửi dữ liệu ra dịch vụ bên ngoài là một quyết định về quyền riêng tư, không
> phải một chi tiết kỹ thuật.

---

## Deliverable

```
projects/P6-rag-qa/
├── README.md            # BÁO CÁO (có bảng số, không chỉ mô tả)
├── nap_tai_lieu.py      # PDF/Markdown -> chunk có siêu dữ liệu
├── kho.py               # index: nhúng, lưu, nạp lại, tìm kiếm
├── rag.py               # lớp RAG: tìm -> dựng ngữ cảnh -> sinh -> kiểm trích dẫn
├── eval/
│   ├── cau_hoi_vang.json   # >= 30 câu do BẠN gán nhãn
│   └── chay_eval.py        # chấm + so sánh phiên bản
├── chay.py              # CLI hỏi đáp tương tác
├── phan_tich.ipynb      # biểu đồ, ma trận lỗi, phân tích chi phí
└── test_rag.py          # >= 12 test, chạy không cần API key
```

---

## Yêu cầu

### ① `nap_tai_lieu.py` — từ PDF đến chunk

- [ ] Đọc PDF bằng `pypdf`, giữ lại **số trang** cho mỗi chunk
- [ ] Chunk mang **siêu dữ liệu**: tên file, số trang, tiêu đề mục (nếu có)
- [ ] Chiến lược cắt **đổi được bằng tham số** — không hardcode
- [ ] Bỏ chunk rác: quá ngắn, chỉ có số trang, chỉ có mục lục
- [ ] Chạy lại trên cùng tài liệu ra **kết quả y hệt**

<details><summary>PDF thật bẩn hơn bạn tưởng</summary>

Ba thứ gần như chắc chắn gặp:

- **Ngắt dòng giữa câu** — PDF xuống dòng theo chiều rộng trang, không theo câu
- **Header/footer lặp ở mọi trang** — "Chương 3 | 47" chen vào giữa nội dung
- **Bảng biến thành cháo** — cột bị trộn thành dòng vô nghĩa

Cái thứ hai đặc biệt độc: nó xuất hiện ở **mọi** chunk, nên nó vẫn ngốn token
trong từng lần gọi API dù chẳng mang thông tin gì.

**Hãy in ra 5 chunk ngẫu nhiên và ĐỌC chúng trước khi làm tiếp.** Đây là bước
người mới hay bỏ qua nhất, và cũng là bước tiết kiệm nhiều thời gian nhất.
</details>

### ② `kho.py` — index

- [ ] Nhúng bằng `sentence-transformers` (có model đa ngữ cho tiếng Việt)
- [ ] `luu()` / `nap()` — **không nhúng lại mỗi lần khởi động**
- [ ] Tìm kiếm **hybrid** (BM25 + vector) như Phase 08
- [ ] Lọc theo siêu dữ liệu (theo file, theo khoảng trang)
- [ ] Kho rỗng, truy vấn rỗng, `k` lớn hơn số chunk → không crash

> 💡 Dùng Chroma cũng được, nhưng **hãy biết vì sao**. Với vài nghìn chunk,
> numpy + một file `.npz` là đủ và bạn hiểu toàn bộ. Viết một dòng trong báo cáo
> giải thích lựa chọn của bạn.

### ③ `rag.py` — lớp lõi

```python
class HeRAG:
    def __init__(self, kho, cau_hinh): ...

    def hoi(self, cau_hoi: str, k: int = 3) -> KetQua: ...
    # KetQua: cau_tra_loi, cac_doan, cac_nguon, trich_dan_hop_le, usage, chi_phi
```

- [ ] Ngữ cảnh **đánh số**, mỗi đoạn kèm nguồn và số trang
- [ ] Prompt buộc: chỉ dùng đoạn được cung cấp / trích dẫn `[n]` / câu từ chối cố định
- [ ] **Kiểm trích dẫn bằng code** — bắt `[n]` vượt quá số đoạn
- [ ] Kiểm `stop_reason == "max_tokens"` và coi đó là lỗi, không phải kết quả
- [ ] Cộng dồn token và **chi phí theo từng câu hỏi**
- [ ] Một câu hỏi lỗi **không được** làm sập tiến trình
- [ ] Prompt và cấu hình có **số phiên bản** — để về sau so sánh được

### ④ `eval/` — ⭐⭐ trái tim của project

- [ ] **≥ 30 câu hỏi vàng do bạn gán nhãn**, mỗi câu kèm **đoạn trích chính xác**
- [ ] Đủ sáu loại: `de`, `dien_dat_khac`, thuật ngữ/mã, `nhieu_doan`, `kho`, `khong_co`
- [ ] **≥ 5 câu `khong_co`**, thuộc loại "gần giống một thứ có thật"
- [ ] Chấm tách **retrieval** (recall@k, MRR) khỏi **sinh** (từ khoá, trích dẫn, từ chối)
- [ ] **Hai baseline**: không retrieval, và lấy k chunk đầu
- [ ] So sánh **theo từng câu** giữa hai phiên bản, phát hiện thoái lui
- [ ] Kiểm **số bịa**: con số trong câu trả lời có trong ngữ cảnh không

```
=== EVAL v3  (chunk=600/120, hybrid, k=3, haiku-4-5) ===

loại              n   recall   điểm      baseline(3 đầu)
de               10     1.00   0.95                 0.20
dien_dat_khac     6     0.83   0.78                 0.08
thuat_ngu         4     0.75   0.70                 0.00
nhieu_doan        3     0.67   0.60                 0.00
kho               4     0.50   0.55                 0.00
khong_co          5        -   0.80                 1.00   <- baseline an tron
TỔNG             32     0.79   0.77                 0.19

Chi phí: $0.019 / câu hỏi   ->   ~$19 / 1.000 câu
Độ trễ trung bình: 2,1 giây

So với v2 (0.71):
  ✅ Cải thiện: 6 câu    ⚠️  THOÁI LUI: 2 câu (thuat_ngu_02, kho_01)
```

> ⚠️ **Chú ý dòng `khong_co` ở cột baseline.** Một hệ thống luôn từ chối được
> 1.00 ở loại đó. Nếu bạn không tách loại khi báo cáo, con số tổng sẽ **giấu**
> mất sự thật đó — và bạn sẽ đem một con số vô nghĩa đi khoe.

### ⑤ `chay.py` — CLI

```powershell
python chay.py --kho index.npz
python chay.py --kho index.npz --hoi "Chính sách nghỉ phép thế nào?" --k 5
```

- [ ] Hiện câu trả lời + **danh sách nguồn kèm số trang**
- [ ] Lệnh `chi phi` in thống kê tích luỹ của phiên làm việc
- [ ] Lệnh `nguon` in đầy đủ các đoạn vừa dùng — để người dùng tự kiểm chứng
- [ ] `Ctrl+C` thoát sạch, không đổ traceback

### ⑥ `phan_tich.ipynb`

- [ ] Điểm **theo từng loại câu hỏi** — chỉ ra ngay loại nào yếu nhất
- [ ] **Đọc tay ít nhất 5 câu sai** và phân loại nguyên nhân *(phần giá trị nhất)*
- [ ] Recall và chi phí **theo k** trên cùng một biểu đồ
- [ ] So sánh **≥ 3 cấu hình** (chunk size / cách tìm), kèm bảng thoái lui
- [ ] So sánh **≥ 2 model** (Haiku 4.5 vs Sonnet 5): điểm, chi phí, độ trễ → **kết luận chọn cái nào**
- [ ] Ngoại suy chi phí cho 1.000 và 100.000 câu hỏi

### ⑦ `test_rag.py` — ≥ 12 test, không cần API key

- [ ] Chunker: chồng lấn đúng, không mất ký tự, chunk rác bị loại
- [ ] Kho: lưu rồi nạp cho kết quả tìm kiếm **y hệt**
- [ ] Kho rỗng / `k` quá lớn / truy vấn rỗng → không crash
- [ ] Ngữ cảnh đánh số từ 1; lệch số nguồn → `ValueError`
- [ ] Bắt được trích dẫn ngoài phạm vi
- [ ] Câu `khong_co`: từ chối → 1.0, trả lời trôi chảy → 0.0
- [ ] Một câu ném exception → 0 điểm, các câu còn lại vẫn chạy
- [ ] So sánh phiên bản phát hiện thoái lui **khi trung bình vẫn tăng**

### ⑧ Báo cáo (README.md của bạn)

```markdown
# Hỏi đáp trên <loại tài liệu>

## Vấn đề
Tài liệu gì, ai cần hỏi, hiện họ tra cứu thế nào và mất bao lâu.

## Dữ liệu
Nguồn, số trang, số chunk, cách gán nhãn 30 câu hỏi vàng.

## Kiến trúc
Sơ đồ luồng. Vì sao chọn chunk size này, cách tìm này. (Kèm SỐ ĐO.)

## Kết quả
[BẢNG điểm theo loại câu hỏi] + baseline + chi phí/câu + độ trễ.

## Sai ở đâu
5 ví dụ sai thật, phân loại nguyên nhân (retrieval hay sinh), cách đã sửa.

## So sánh cấu hình & model
Bảng. Kết luận chọn cái nào và VÌ SAO.

## Hạn chế
Nó KHÔNG dùng được cho loại câu hỏi nào.

## Bài học
```

---

## ✅ Tiêu chí chấm

| Hạng mục | Điểm | Đạt khi |
|---|---|---|
| **Nạp tài liệu** | 10 | PDF thật, giữ số trang, loại chunk rác, tái lập được |
| **Retrieval** | 20 | Hybrid, lưu/nạp index, lọc siêu dữ liệu, xử lý biên |
| **Sinh + trích dẫn** | 20 | Ngữ cảnh đánh số, kiểm trích dẫn bằng code, từ chối đúng lúc |
| **Bộ câu hỏi vàng** | 15 | ≥ 30 câu tự gán nhãn, đủ 6 loại, ≥ 5 câu `khong_co` |
| **Eval** | 20 | Tách retrieval/sinh, có baseline, bắt được thoái lui |
| **Phân tích + báo cáo** | 15 | Đọc tay câu sai, so cấu hình và model, có phần hạn chế trung thực |

**Tự chấm mức độ:**

| Mức | Dấu hiệu |
|---|---|
| ❌ Chưa đạt | Chạy được, chưa có bộ câu hỏi vàng hoặc chưa có eval |
| ⚠️ Tạm được | Có eval nhưng chỉ một con số tổng, không có baseline |
| ✅ Tốt | Tách retrieval/sinh, có baseline, so sánh được hai phiên bản |
| 🌟 Xuất sắc | Thêm so sánh model + phân tích chi phí + **bộ eval đã tìm ra một lỗi bạn không tự nhìn thấy** |

> Dấu hiệu 🌟 quan trọng nhất: **bộ eval của bạn tìm ra một lỗi mà bạn không hề
> biết là có.** Nếu điều đó xảy ra, bạn đã thật sự hiểu vì sao cần đo lường.

---

## 💡 Tám lỗi người mới hay mắc

| Lỗi | Triệu chứng | Cách sửa |
|---|---|---|
| **Không đọc chunk** | Retrieval "vô lý" mà không hiểu vì sao | In 5 chunk ngẫu nhiên và ĐỌC |
| **Nhúng lại mỗi lần chạy** | Khởi động mất 30 giây | `luu()` / `nap()` index |
| **Quên chuẩn hoá vector** | Điểm cosine kỳ lạ, thứ hạng lộn xộn | Chuẩn hoá ngay khi thêm vào kho |
| **Chỉ dùng vector** | Hỏi mã hoặc thuật ngữ chính xác thì trượt | Thêm BM25, dùng hybrid |
| **k càng lớn càng tốt** | Chi phí tăng gấp ba, chất lượng không tăng | Đo recall **và** chất lượng theo k |
| **Không có câu `khong_co`** | Hệ thống trả lời mọi thứ, nghe rất tự tin | ≥ 5 câu không có đáp án |
| **Nhãn do model sinh** | Điểm eval đẹp bất thường ngay lần đầu | Gán tay — đo *đúng*, không phải *nhất quán* |
| **Chỉ nhìn điểm tổng** | Deploy xong mới biết hỏng nhóm câu nào | So sánh theo từng câu |

> ⚠️ Hai lỗi cuối tinh vi nhất. Nếu điểm eval của bạn cao bất thường ngay lần
> chạy đầu tiên, hãy **nghi ngờ bộ nhãn** trước khi ăn mừng.

---

## 🌟 Thử thách thêm

- [ ] **Rerank** bằng cross-encoder — đo recall@20 trước để biết có đáng không
- [ ] **Citations API của Claude** thay cho đánh số thủ công — so độ chính xác nguồn của hai cách
- [ ] **Prompt caching** cho phần hướng dẫn — đo tiền tiết kiệm thật
- [ ] **Định tuyến truy vấn:** câu chứa mã định danh → BM25; còn lại → hybrid
- [ ] **Hỏi nối tiếp:** "còn nghỉ ốm thì sao?" — viết lại truy vấn theo lịch sử hội thoại
- [ ] **LLM-as-judge** cho faithfulness, kèm phần kiểm chính judge
- [ ] Giao diện Gradio hiển thị câu trả lời cạnh các đoạn nguồn được tô sáng
- [ ] Chuẩn bị cho Phase 10: tách `rag.py` thành thư viện thuần, không dính CLI

---

## 📌 Nộp bài

```powershell
pytest projects/P6-rag-qa -v
python eval/chay_eval.py --luu eval/kq_v3.json --so-sanh eval/kq_v2.json
git add .
git commit -m "P6: he thong RAG Q&A + eval"
git push
```

Bài test khắt khe nhất cho project này:

> Một người quản lý hỏi: **"Cho nhân viên dùng cái này thay vì tra tài liệu tay
> được không?"**
>
> Bạn phải trả lời trong 2 phút bằng **số**: đúng bao nhiêu phần trăm, sai ở loại
> câu hỏi nào, bao nhiêu phần trăm câu nó **từ chối đúng lúc**, chi phí mỗi câu,
> và bao nhiêu phần trăm câu vẫn cần người kiểm lại.

Trả lời được câu đó nghĩa là bạn đã là AI Engineer — không phải người ghép thư viện.

---

⬅️ [Phase 08](../../curriculum/08-rag/README.md) · ➡️ [Phase 09 — Agents](../../curriculum/09-agents/README.md)
