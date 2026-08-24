# Phase 08 · RAG ⭐

**Thời gian:** Tuần 20–21 (~24 giờ) · **Điều kiện:** xong [Phase 07](../07-llm-engineering/README.md)

---

## 🎯 Mục tiêu

Phase 07 dạy bạn nói chuyện với model. Phase 08 dạy bạn cho model **đọc tài liệu của bạn** trước khi nó trả lời.

- [ ] Hiểu **vì sao** cần RAG — và khi nào thì *không* cần
- [ ] **Chunking** — ba chiến lược cắt tài liệu và cái giá của từng cái
- [ ] Embedding, vector store, tìm kiếm ngữ nghĩa
- [ ] **BM25** — vì sao tìm theo từ khoá vẫn chưa chết
- [ ] **Hybrid search** và Reciprocal Rank Fusion
- [ ] Rerank — và khi nào nó đáng tiền
- [ ] **Trích dẫn nguồn** — điều kiện cần để chống bịa đặt
- [ ] ⭐⭐ **Đo chất lượng RAG**: recall@k, MRR, faithfulness, và bộ câu hỏi vàng
- [ ] → 🎯 **Project P6: RAG Q&A**

> **Điểm mấu chốt của phase này:** ghép LangChain với Chroma trong 20 dòng thì ai cũng làm được, và nó sẽ *chạy*. Câu hỏi phân biệt kỹ sư là: **"nó đúng bao nhiêu phần trăm, và hôm nay bạn đổi chunk size — nó tốt lên hay bạn vừa làm hỏng 3 câu đang chạy đúng?"**

---

## ⚙️ Chuẩn bị

```powershell
pip install -e ".[rag]"
python curriculum/08-rag/tao_du_lieu.py
```

Lệnh thứ hai tạo ra kho tài liệu nội bộ của một công ty giả định:

```
data/phase08/
├── tai_lieu/                 6 tài liệu Markdown (~9.500 ký tự)
│   ├── so_tay_nhan_vien.md
│   ├── chinh_sach_nghi_phep.md
│   ├── chinh_sach_luong_thuong.md
│   ├── huong_dan_ky_thuat.md
│   ├── faq_khach_hang.md
│   └── quy_dinh_bao_mat.md
├── cau_hoi_vang.json         18 câu hỏi kèm ĐÁP ÁN ĐÚNG
└── khai_niem.json            từ điển cho embedding giả lập
```

> 💡 **Bài tập của phase này chạy được KHÔNG CẦN API key và KHÔNG CẦN tải model.** Chúng kiểm tra logic bạn viết (cắt chunk, BM25, RRF, chấm eval). Chỉ notebook phần sinh câu trả lời và project mới cần key.

### Ngân sách

Toàn bộ Phase 08 ước tính **dưới $2**. Retrieval không tốn tiền API — chỉ bước sinh câu trả lời cuối cùng mới tốn, và nó dùng Haiku 4.5.

### ⚠️ Một chuyện về tiếng Việt trên Windows

Console Windows mặc định dùng bảng mã cp1252. `print("Nghỉ phép")` sẽ ném `UnicodeEncodeError` và làm sập chương trình — ngay cả khi phần tính toán hoàn toàn đúng. Phase 08 in ra rất nhiều tiếng Việt, nên hãy gọi đầu mỗi script:

```python
from tien_ich import bat_utf8
bat_utf8()
```

Lỗi này **không xuất hiện khi chạy pytest** (pytest bắt stdout riêng), nên rất dễ lọt qua cho tới lúc bạn demo.

---

## 📅 Chia theo tuần

| Tuần | Chủ đề | Bài học | Bài tập |
|---|---|---|---|
| **20** | Vì sao RAG, chunking, embedding, vector search | `01`, `02` | `ex01`, `ex02` |
| **21** | BM25, hybrid, rerank, citation, ⭐ đo chất lượng | `03`, `04` | `ex03` → **P6** |

---

# TUẦN 20 — Từ tài liệu đến câu trả lời

## 1. Vì sao cần RAG?

Bạn có 500 trang tài liệu nội bộ và muốn model trả lời câu hỏi dựa trên chúng. Có bốn cách:

| Cách | Vấn đề |
|---|---|
| Hỏi thẳng model | Model **không biết** tài liệu của bạn. Nó sẽ bịa ra một câu trả lời nghe rất hợp lý |
| Nhét cả 500 trang vào prompt | Tốn tiền khủng khiếp mỗi câu hỏi, và vượt context window khi tài liệu lớn hơn |
| Fine-tune model trên tài liệu | Đắt, chậm, phải làm lại mỗi lần tài liệu đổi, và model vẫn **không trích dẫn được nguồn** |
| **RAG** | Chỉ tìm 3–5 đoạn liên quan rồi đưa vào prompt |

RAG giải quyết bốn thứ cùng lúc: **chi phí** (chỉ gửi phần cần), **giới hạn context**, **cập nhật** (sửa tài liệu là xong, không train lại), và quan trọng nhất — **truy vết được nguồn**.

> ⚠️ **Khi nào KHÔNG cần RAG?** Khi toàn bộ tài liệu của bạn chỉ 20 trang và không đổi. Lúc đó nhét thẳng vào system prompt kèm **prompt caching** (Phase 07) vừa rẻ hơn vừa chính xác hơn RAG — vì không có bước retrieval nào để mà sai. Rất nhiều dự án dựng RAG cho một tập tài liệu mà lẽ ra chỉ cần cache.

## 2. Kiến trúc RAG

```
  MỘT LẦN (indexing)                      MỖI CÂU HỎI (truy vấn)
  ─────────────────                       ──────────────────────
  tài liệu                                câu hỏi
     │ ① cắt                                 │ ④ nhúng
     ▼                                       ▼
  các chunk                               vector câu hỏi
     │ ② nhúng                               │ ⑤ tìm top-k
     ▼                                       ▼
  vector  ──③ lưu──►  kho vector  ────────► 3-5 đoạn liên quan
                                             │ ⑥ ghép vào prompt
                                             ▼
                                          model sinh câu trả lời + trích dẫn
```

**Chỗ hỏng nhiều nhất là bước ① và ⑤** — chứ không phải bước ⑥. Người mới dành 90% thời gian sửa prompt trong khi lỗi nằm ở chỗ retrieval lấy về sai đoạn. Đó là lý do bài 4 bắt bạn **đo tách riêng** hai bước này.

## 3. Chunking — bước bị coi thường nhất

Ba chiến lược, không cái nào thắng tuyệt đối:

| Cách cắt | Ưu | Nhược |
|---|---|---|
| **Kích thước cố định** | Chunk đều nhau → chi phí dự đoán được | Cắt giữa chừng một câu, một bảng, một mã lỗi |
| **Theo đoạn văn** | Không cắt giữa câu | Độ dài rất chênh lệch |
| **Theo tiêu đề Markdown** | Mỗi chunk là một đơn vị ý nghĩa trọn vẹn | Tài liệu viết *"cách sửa lỗi ở mục trên"* là đứt mạch |

### Chồng lấn (overlap) làm gì?

Câu trả lời hay nằm **vắt qua ranh giới** hai chunk. Chồng lấn khiến mỗi câu nằm trọn vẹn trong ít nhất một chunk.

```
Không chồng lấn:  [....chunk 1....][....chunk 2....]
                              ↑ câu trả lời bị cắt đôi ở đây

Chồng lấn 20%:    [....chunk 1....]
                          [....chunk 2....]
                              ↑ câu này nằm trọn trong chunk 2
```

Giá phải trả: chồng lấn 20% nghĩa là kho vector của bạn **to hơn 25%** và mỗi câu hỏi tốn thêm token.

### Con số thật trên bộ dữ liệu này

Đây là recall trung bình (18 câu hỏi vàng, đo ở mức **đoạn trích chính xác**, k=3):

| Cách cắt | Số chunk | BM25 | Embedding |
|---|---|---|---|
| 300 ký tự, không chồng lấn | 36 | 0.75 | 0.75 |
| 300 ký tự, chồng lấn 60 | 43 | 0.78 | 0.72 |
| **600 ký tự, chồng lấn 120** | 24 | **0.91** | 0.81 |
| 1000 ký tự, chồng lấn 200 | 15 | 0.94 | 0.88 |

Hai điều đọc được từ bảng này:

1. **Chunk to hơn cho recall cao hơn** — vì đoạn chứa đáp án ít bị cắt rời hơn.
2. Nhưng chunk to nghĩa là mỗi câu hỏi bạn nhét **nhiều token rác hơn** vào prompt. Với chunk 1000 ký tự × 3 đoạn, bạn gửi ~750 token mỗi câu; con số này nhân với số lượt hỏi chính là hoá đơn cuối tháng. Và mục 12 sẽ cho bạn thấy nhồi nhiều chưa chắc trả lời tốt hơn.

> 📌 **Không có chunk size "đúng".** Chỉ có chunk size bạn đã **đo** trên tài liệu và câu hỏi của chính mình. Ai nói với bạn "cứ để 512 token là chuẩn" thì người đó chưa đo bao giờ.

## 4. Embedding

**Anthropic không có endpoint embedding.** Claude sinh văn bản; nó không trả về vector. Ba lựa chọn thực tế:

| Lựa chọn | Chi phí | Ghi chú |
|---|---|---|
| **sentence-transformers** chạy máy bạn | Miễn phí | Tải ~90 MB một lần, chạy CPU được. Có model đa ngữ hỗ trợ tiếng Việt |
| Voyage AI | Trả phí | Anthropic khuyến nghị cho RAG chất lượng cao |
| API embedding của nhà cung cấp khác | Trả phí | Ràng buộc bạn vào hệ sinh thái đó |

Khoá học dùng **sentence-transformers** (đã có trong `pip install -e ".[rag]"`), kèm một **bản giả lập offline** (`nhung_gia_lap.py`) để bạn chạy được cả khi chưa tải model.

<details><summary>Embedding giả lập hoạt động thế nào — và giới hạn của nó</summary>

Mỗi **chiều** của vector là một **khái niệm** (`nghi_phep`, `bao_hanh`, `tu_xa`...). Giá trị = số lần văn bản nhắc tới khái niệm đó, sau đó chuẩn hoá về độ dài 1.

```
"ngồi nhà làm việc"   -> khái niệm TU_XA
"làm việc từ xa"      -> khái niệm TU_XA     -> hai câu này GẦN NHAU
```

Nó có đúng **tính chất** quan trọng nhất của embedding thật: diễn đạt khác nhau của cùng một ý cho ra vector gần nhau.

Nhưng khác biệt cốt lõi: **model thật HỌC quan hệ ngữ nghĩa từ hàng tỷ câu; ở đây ta GÁN TAY bằng một từ điển 27 khái niệm.** Vì vậy bản giả lập mù tịt với mọi từ nằm ngoài từ điển. Notebook 01 sẽ bắt bạn so sánh hai bên nếu đã cài `[rag]` — **thấy rõ giới hạn của bản giả lập là một phần của bài học**, không phải lỗi của nó.
</details>

## 5. Kho vector

Ý tưởng cốt lõi ngắn đến bất ngờ: **chuẩn hoá mọi vector về độ dài 1, thì cosine giữa chúng đúng bằng tích vô hướng.** Tìm kiếm trở thành *một* phép nhân ma trận:

```python
diem = kho_da_chuan_hoa @ vector_cau_hoi      # (n, d) @ (d,) -> (n,)
top_k = np.argsort(-diem)[:k]
```

Với vài nghìn chunk, numpy là quá đủ và bạn **không cần vector database nào cả**. Bạn cần Chroma/FAISS/pgvector khi: dữ liệu không nằm vừa RAM, cần lọc theo siêu dữ liệu ở quy mô lớn, cần nhiều tiến trình cùng đọc ghi, hoặc cần index xấp xỉ (HNSW) vì tìm tuyến tính đã quá chậm.

> 💡 Bạn đã viết class `KhoVector` ở mini-project Phase 06. Đó chính là bộ khung này — giờ chỉ thay hàm nhúng giả lập bằng model thật.

---

# TUẦN 21 — Tìm cho đúng, trả lời cho có căn cứ

## 6. BM25 — tìm theo từ khoá vẫn chưa chết

Rất nhiều hướng dẫn RAG bỏ qua tìm kiếm từ khoá vì "embedding hiện đại hơn". Đây là số đo thật trên bộ dữ liệu này (recall ở mức đoạn trích, k=3, chunk 600/120):

| Loại câu hỏi | BM25 | Embedding |
|---|---|---|
| Dễ (từ vựng trùng tài liệu) | 1.00 | 1.00 |
| **Mã lỗi** (`VX-204`, `VX-305`) | **1.00** | **0.00** |
| **Diễn đạt khác** ("ngồi nhà làm việc") | 0.75 | **1.00** |
| Đáp án nằm ở hai chỗ | 1.00 | 0.50 |
| Nhiều tài liệu / số dễ nhầm | 0.83 | 1.00 |
| **Trung bình** | **0.91** | **0.81** |

Hai dòng in đậm là toàn bộ câu chuyện:

- Với **mã lỗi**, embedding được **0.00** — không phải vì bản giả lập kém, mà vì embedding thật cũng yếu với chuỗi định danh hiếm: model chưa từng thấy `VX-204` đủ nhiều lần để học ý nghĩa của nó. Ngược lại BM25 khớp chính xác từng ký tự.
- Với **cách diễn đạt khác**, BM25 trượt vì không có một từ nào trùng, còn embedding bắt được vì cùng khái niệm.

> 📌 **Đây là lý do tồn tại của hybrid search.** Không phải vì "gộp lại thì hay hơn", mà vì hai phương pháp hỏng ở hai chỗ hoàn toàn khác nhau.

BM25 tính điểm bằng ba thành phần: tần suất từ (có **bão hoà** — xuất hiện 20 lần không đáng giá gấp 20 lần), **IDF** (từ hiếm đáng giá hơn — nên nó tự động coi nhẹ từ phổ biến mà không cần danh sách stopword), và **phạt tài liệu dài**.

## 7. Hybrid search và RRF

Vấn đề khi gộp: điểm BM25 chạy từ 0 đến vô cùng, điểm cosine chạy từ −1 đến 1. **Cộng thẳng hai con số đó là vô nghĩa** — BM25 sẽ nuốt chửng cosine.

**Reciprocal Rank Fusion** vứt bỏ điểm gốc và chỉ giữ **thứ hạng**:

```
điểm(mục) = Σ  1 / (k0 + thứ_hạng_trong_bảng_đó)        k0 thường = 60
```

Vì chỉ dùng thứ hạng nên không cần chuẩn hoá gì cả. Kết quả trên bộ dữ liệu này:

| Cách tìm | Trung bình | mã lỗi | diễn đạt khác | nhiều đoạn |
|---|---|---|---|---|
| BM25 | 0.91 | 1.00 | 0.75 | 1.00 |
| Embedding | 0.81 | 0.00 | 1.00 | 0.50 |
| **Hybrid RRF** | **0.94** | **0.50** | **1.00** | **1.00** |

Hybrid tốt nhất về trung bình — **nhưng nhìn cột `mã lỗi`: nó tụt từ 1.00 xuống 0.50 so với BM25 đơn thuần.**

> ⚠️ **Hybrid không miễn phí.** RRF coi hai bảng xếp hạng quan trọng như nhau. Khi một bên chắc chắn đúng và bên kia mù tịt, RRF vẫn kéo kết quả của bên mù tịt lên — và đẩy đoạn đúng ra khỏi top-k.
>
> Nếu chỉ nhìn con số trung bình 0.91 → 0.94, bạn sẽ kết luận "hybrid tốt hơn, xong" và **không hề biết mình vừa làm hỏng toàn bộ nhóm câu hỏi mã lỗi.** Đây chính xác là bài học "trung bình tăng không có nghĩa là tốt hơn" của Phase 07, lặp lại ở một chỗ khác.

## 8. Rerank

Rerank là bước thứ hai: lấy top-20 bằng cách rẻ (BM25/vector), rồi dùng một model **cross-encoder** đọc *từng cặp (câu hỏi, đoạn)* để chấm lại và giữ top-3.

| | Bi-encoder (retrieval) | Cross-encoder (rerank) |
|---|---|---|
| Cách làm | Nhúng câu hỏi và đoạn **riêng biệt** | Đọc **cùng lúc** cả hai |
| Tốc độ | Rất nhanh (một phép nhân ma trận) | Chậm — mỗi cặp một lần chạy model |
| Chính xác | Khá | Cao hơn rõ rệt |

Vì thế người ta không bao giờ dùng cross-encoder để quét cả kho: **retrieval lấy rộng, rerank lọc tinh.**

Rerank đáng làm khi retrieval của bạn *có lấy được đoạn đúng nhưng xếp nó ở hạng 7–8*. Nếu recall@20 đã thấp thì rerank vô ích — nó không tạo ra được đoạn mà retrieval chưa lấy về. **Đo recall@20 trước khi quyết định thêm rerank.**

## 9. Sinh câu trả lời có trích dẫn

Không có trích dẫn thì bạn không kiểm chứng được câu trả lời — và với tài liệu nội bộ công ty, "nghe có vẻ đúng" không phải tiêu chuẩn chấp nhận được.

Cách thủ công: **đánh số các đoạn** rồi yêu cầu model trích dẫn theo số.

```python
ngu_canh = "[1] (so_tay_nhan_vien.md)\n...\n\n[2] (chinh_sach_nghi_phep.md)\n..."

HUONG_DAN = """Trả lời CHỈ dựa trên các đoạn được cung cấp.
Mỗi ý phải kèm số đoạn dạng [n].
Nếu các đoạn không chứa thông tin cần thiết, hãy nói rõ "Không tìm thấy
thông tin trong tài liệu" — TUYỆT ĐỐI không dùng kiến thức bên ngoài."""
```

Sau đó **kiểm tra bằng code**, không phải bằng cảm giác: mọi số `[n]` model dùng có nằm trong phạm vi số đoạn thực tế không?

> ⚠️ **Trích dẫn ngoài phạm vi là dạng bịa đặt nguy hiểm nhất.** Model viết `[5]` khi bạn chỉ đưa 3 đoạn. Câu trả lời trông **càng đáng tin** vì có số trích dẫn — và người đọc sẽ không bao giờ đi kiểm tra. `kiem_tra_trich_dan()` trong bài tập 3 bắt đúng lỗi này.

### Citations có sẵn của Claude API

Claude hỗ trợ trích dẫn **ở mức API**: đặt `citations: {"enabled": True}` trên mỗi khối `document`, model sẽ trả về các khối text kèm mảng `citations` chỉ đúng vị trí ký tự trong tài liệu gốc.

```python
{"type": "document",
 "source": {"type": "text", "media_type": "text/plain", "data": noi_dung},
 "title": "chinh_sach_nghi_phep.md",
 "citations": {"enabled": True}}
```

Ưu điểm so với cách đánh số thủ công: vị trí trích dẫn do **API** trả về (`start_char_index`/`end_char_index`), model không tự bịa được số.

> ⚠️ Hai lưu ý: bật `citations` cho **một** document thì phải bật cho **tất cả**, và tính năng này **không dùng chung được với structured output** (`output_config.format`) — API trả lỗi 400. Cần cả hai thì phải tách làm hai lượt gọi.

## 10. ⭐⭐ Đo chất lượng RAG

Một hệ RAG hỏng ở **hai chỗ độc lập**, và bạn phải đo tách chúng ra:

```
        retrieval sai                    sinh câu trả lời sai
        (lấy nhầm đoạn)                  (có đoạn đúng mà vẫn trả lời sai)
              │                                    │
        recall@k, MRR                    faithfulness, trích dẫn hợp lệ
```

Nếu chỉ có một con số "đúng/sai", bạn thấy điểm tụt mà **không biết đi sửa chỗ nào** — và người mới gần như luôn đoán nhầm là do prompt.

| Chỉ số | Hỏi gì | Đo bước nào |
|---|---|---|
| **recall@k** | Đoạn chứa đáp án có nằm trong k đoạn lấy về không? | Retrieval |
| **MRR** | Nó nằm ở **hạng mấy**? | Retrieval |
| **Từ khoá bắt buộc** | Câu trả lời có nói đúng ý không? | Sinh |
| **Trích dẫn hợp lệ** | Có dẫn nguồn, và nguồn có thật không? | Sinh |
| **Từ chối đúng** | Câu hỏi không có đáp án — nó có nói "không biết" không? | Sinh |

### Bộ câu hỏi vàng

`cau_hoi_vang.json` có 18 câu, mỗi câu kèm **đoạn trích chính xác** chứa đáp án. Đo recall ở mức đoạn trích chứ không phải mức tên file — vì "lấy đúng file" là một tiêu chuẩn dễ dãi đến vô dụng: với 6 tài liệu và k=3, gần như câu nào cũng "đúng file".

Sáu loại câu hỏi trong bộ test, mỗi loại có lý do tồn tại:

| Loại | Số câu | Bẫy gì |
|---|---|---|
| `de` | 5 | Câu cơ bản. Sai ở đây là hệ thống hỏng chỗ rất căn bản |
| `ma_loi` | 2 | Chuỗi định danh chính xác — embedding mù |
| `dien_dat_khac` | 4 | Không trùng một từ nào với tài liệu — BM25 mù |
| `nhieu_doan` | 2 | Đáp án nằm ở **hai chỗ**; mô tả lỗi ở mục 2, cách sửa ở mục 3 |
| `kho` | 3 | Đáp án ở hai tài liệu khác nhau, hoặc số dễ nhầm (150/200/300%) |
| `khong_co` | 2 | **Không có đáp án.** Trả lời đúng = từ chối |

> ⭐ Hai câu `khong_co` là hai câu quý nhất. Câu "công ty có xe đưa đón không?" được đặt cạnh một tài liệu có "phụ cấp đi lại" — retrieval **chắc chắn** trả về đoạn đó với điểm cao. Hệ thống phải đủ tỉnh táo để nói *"tài liệu chỉ nói về phụ cấp đi lại, không nói về xe đưa đón"*.
>
> **Một hệ thống trả lời được mọi câu là một hệ thống biết bịa.** Không có câu `khong_co` trong bộ test thì bạn không bao giờ phát hiện ra điều đó.

### Baseline bắt buộc

Trước khi nói "RAG của tôi đạt 0.85", hãy chạy hai baseline:

| Baseline | Nó trả lời gì |
|---|---|
| **Không retrieval** | Hỏi thẳng model, không đưa tài liệu. Cho biết RAG *thật sự* đóng góp bao nhiêu |
| **Lấy k đoạn đầu tiên** | Không tìm kiếm gì, cứ lấy 3 chunk đầu kho |

Nếu hệ RAG của bạn không hơn baseline thứ hai một cách rõ ràng, phần tìm kiếm của bạn đang **không làm gì cả** — và điều đó xảy ra thường xuyên hơn bạn nghĩ (nhúng nhầm, quên chuẩn hoá, chỉ số lệch một đơn vị).

## 11. Faithfulness — câu trả lời có bám vào đoạn không?

Câu trả lời có thể **đúng sự thật nhưng không đến từ tài liệu** (model dùng kiến thức nền), hoặc **mâu thuẫn với tài liệu**. Cả hai đều là lỗi trong hệ RAG.

Cách đo rẻ mà hiệu quả bất ngờ: kiểm tra các **con số** trong câu trả lời có xuất hiện trong đoạn ngữ cảnh không. Phần lớn ảo giác trong tài liệu nội bộ là ảo giác về con số — "12 ngày phép" thành "15 ngày phép".

Cách đo đầy đủ hơn là **LLM-as-judge**: đưa (đoạn ngữ cảnh, câu trả lời) cho một model và hỏi *"mọi khẳng định trong câu trả lời có được đoạn văn chống lưng không?"*.

> ⚠️ **Judge cũng cần được kiểm tra.** Trước khi tin nó, hãy cho nó chấm vài ca bạn đã biết đáp án — gồm cả ca bạn cố tình làm sai. Một judge luôn nói "đạt" thì tệ hơn là không có judge, vì nó cho bạn cảm giác an toàn giả.

## 12. Ba lỗi kinh điển

| Lỗi | Triệu chứng | Cách sửa |
|---|---|---|
| **Context stuffing** | Nhét top-20 vào prompt cho "chắc ăn" | Nhiều đoạn rác làm loãng đoạn đúng. Ít mà đúng thắng nhiều mà loãng |
| **Lost in the middle** | Đoạn đúng nằm giữa prompt bị bỏ qua | Model chú ý phần **đầu** và **cuối** hơn phần giữa. Xếp đoạn liên quan nhất lên đầu |
| **Không đo, chỉ cảm giác** | "Tôi thử 5 câu thấy ổn" | 5 câu bạn nghĩ ra là 5 câu bạn *biết* hệ thống trả lời được |

> 📌 **"Lost in the middle" giải thích một hiện tượng gây bối rối:** tăng k từ 3 lên 10 làm recall tăng nhưng **chất lượng câu trả lời lại giảm**. Retrieval tốt lên trong khi hệ thống tệ đi. Nếu bạn chỉ đo recall, bạn sẽ đi sai hướng một cách tự tin.

---

## 📝 Bài tập

| Bài | Nội dung | Test |
|---|---|---|
| `ex01_chunking.py` | Ba cách cắt, thống kê, so khớp đoạn trích | `pytest tests/phase08/test_ex01.py` |
| `ex02_tim_kiem.py` | Tách từ, BM25, cosine, RRF, recall@k, MRR | `pytest tests/phase08/test_ex02.py` |
| `ex03_eval_rag.py` ⭐⭐ | Ngữ cảnh đánh số, kiểm trích dẫn, chấm eval, bắt thoái lui | `pytest tests/phase08/test_ex03.py` |

Chạy hết:

```powershell
pytest tests/phase08 -v
```

---

## ✅ Checklist trước khi sang Phase 09

- [ ] Giải thích được **khi nào không nên dùng RAG**
- [ ] Nói được vì sao BM25 thắng ở mã lỗi còn embedding thắng ở diễn đạt khác
- [ ] Giải thích được vì sao RRF cộng **nghịch đảo thứ hạng** thay vì cộng điểm gốc
- [ ] Chỉ ra được **một trường hợp hybrid làm tệ đi** (bảng ở mục 7)
- [ ] Phân biệt được lỗi retrieval với lỗi sinh câu trả lời, và biết chỉ số nào đo cái nào
- [ ] Hiểu vì sao bộ test **phải có** câu không có đáp án
- [ ] `pytest tests/phase08 -v` xanh toàn bộ
- [ ] Xong [mini-project](mini_project/README.md)

---

## 📌 Nộp bài

```powershell
pytest tests/phase08 -v
git add .
git commit -m "Tuan 21: hoan thanh phase 08 - RAG"
git push
```

Xong Tuần 21 → làm [**P6 — RAG Q&A**](../../projects/P6-rag-qa/README.md).

---

⬅️ [Phase 07](../07-llm-engineering/README.md) · ➡️ [Phase 09 — Agents](../09-agents/README.md)
