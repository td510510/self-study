# 20 câu phỏng vấn AI Engineer — đáp án chi tiết

> Thuộc [lo-trinh-tu-hoc-ai-engineer.md](./lo-trinh-tu-hoc-ai-engineer.md) — dùng ở Tuần 40, nhưng nên đọc từ Tuần 18 (khi bắt đầu rải hồ sơ) để biết thị trường hỏi gì.

## Cách dùng tài liệu này

Mỗi câu có 5 phần:

- **⏱️ Trả lời 30 giây** — câu chốt. Nói đúng chừng này rồi **dừng lại**, để người phỏng vấn hỏi tiếp.
- **📖 Trả lời đầy đủ** — khi họ hỏi sâu.
- **📊 Số của bạn** — chỗ điền số liệu thật từ đồ án của bạn. **Đây là phần tạo khác biệt.**
- **🔍 Họ sẽ hỏi tiếp** — câu đào sâu và cách trả lời.
- **⚠️ Bẫy** — sai lầm khiến bạn mất điểm.

### Ba nguyên tắc trả lời

1. **Ngắn trước, sâu sau.** Trả lời 30 giây rồi im lặng. Nói một mạch 3 phút là dấu hiệu học thuộc, không phải hiểu.
2. **Luôn kèm số hoặc ví dụ từ dự án của bạn.** "Chunk nhỏ thì mất ngữ cảnh" là kiến thức đọc được. "Tôi đo Recall@5 ở 3 mức chunk trên 30 câu golden, 400 token cho 0,71 còn 800 token cho 0,86" là kinh nghiệm.
3. **Nói cả đánh đổi.** Câu trả lời chỉ có ưu điểm là câu trả lời của người chưa từng triển khai thật.

### Bảng số cần thuộc lòng trước buổi phỏng vấn

Điền từ đồ án của bạn, học thuộc 10 con số này:

| Chỉ số | Số của bạn |
|---|---|
| Kích thước corpus (tài liệu / chunk) | |
| Recall@5 và faithfulness của cấu hình sản xuất | |
| p95 latency | |
| Chi phí / 1.000 câu hỏi | |
| % tiết kiệm nhờ router + cache | |
| Throughput self-host (tok/s ở concurrency nào) | |
| Task success rate của agent + độ lệch | |
| Cost per successful task (agent) | |
| Tỉ lệ tấn công red-team bị chặn (trước/sau guardrail) | |
| Điểm hoà vốn self-host vs API | |

---

# NHÓM A — NỀN TẢNG

## Câu 1. RAG, fine-tune hay prompt — chọn thế nào?

**⏱️ Trả lời 30 giây**

> "Nguyên tắc của tôi: **fine-tune dạy model *cách làm*, RAG cung cấp cho model *cái để biết*, prompt định hình *hành vi*.** Nếu model không biết thông tin thì dùng RAG; nếu model biết nhưng làm sai cách thì fine-tune; và luôn thử prompt cho tử tế trước vì nó gần như miễn phí. Nhầm giữa RAG và fine-tune là sai lầm tốn kém nhất trong dự án LLM."

**📖 Trả lời đầy đủ**

| | Prompt | RAG | Fine-tune |
|---|---|---|---|
| Dạy được gì | Hành vi, định dạng, giọng | Kiến thức mới, hay thay đổi | Phong cách, định dạng chặt, miền hẹp |
| Chi phí | ~0 | thấp | trung bình–cao |
| Thời gian | phút | giờ | ngày |
| Cập nhật kiến thức | — | tức thì (đổi tài liệu) | phải train lại |
| Trích dẫn nguồn | — | có | không |

Vì sao **không** nên fine-tune để nhồi kiến thức: (1) đắt và chậm cập nhật — kiến thức đổi hàng tháng thì phải train lại hàng tháng; (2) không trích dẫn được nguồn, người dùng không kiểm chứng được; (3) model **vẫn bịa** — fine-tune làm nó bịa *tự tin hơn* chứ không chính xác hơn; (4) khó kiểm soát: không xoá được một sự thật đã học.

Ngược lại, fine-tune thắng rõ khi cần: định dạng đầu ra rất chặt lặp lại hàng nghìn lần, giọng văn thương hiệu, thuật ngữ chuyên ngành mà prompt mô tả mãi không đúng, hoặc muốn dùng model nhỏ rẻ thay model lớn cho một tác vụ hẹp.

**📊 Số của bạn** *(từ Đồ án môn 8, T31)*

> "Tôi đã đo cả 4 phương pháp trên cùng bộ test cho tác vụ ___: prompt-only đạt ___, prompt + few-shot ___, RAG ___, fine-tuned LoRA ___. Chi phí cho 1.000 lượt lần lượt là ___. Kết luận của tôi là ___ vì ___."

Nếu kết luận của bạn là "không đáng fine-tune" thì **vẫn là câu trả lời tốt** — miễn có số liệu. Nó chứng tỏ bạn đo thay vì chạy theo xu hướng.

**🔍 Họ sẽ hỏi tiếp**

- *"Kết hợp cả ba được không?"* → Được, và thường là kiến trúc tốt nhất: fine-tune để model tuân thủ định dạng và giọng, RAG để cấp kiến thức cập nhật, prompt để điều chỉnh hành vi từng trường hợp.
- *"Chi phí fine-tune gồm những gì?"* → Không chỉ tiền GPU: chuẩn bị và làm sạch dữ liệu (chiếm phần lớn công sức), thử nghiệm, eval, và **chi phí ẩn lớn nhất là phải làm lại khi đổi model gốc**. Model gốc ra bản mới sau 6 tháng thì adapter của bạn thành nợ kỹ thuật.

**⚠️ Bẫy**

Trả lời "tùy trường hợp" rồi dừng. Phải đưa ra **tiêu chí quyết định cụ thể**. Và đừng nói "fine-tune tốt hơn vì chính xác hơn" — không đúng với kiến thức.

---

## Câu 2. Chunking ảnh hưởng chất lượng RAG thế nào?

**⏱️ Trả lời 30 giây**

> "Chunking là biến số ảnh hưởng lớn nhất tới chất lượng RAG — theo kinh nghiệm của tôi còn lớn hơn cả việc chọn model. Chunk quá nhỏ thì mất ngữ cảnh, chunk mồ côi vô nghĩa; chunk quá lớn thì context loãng, tốn tiền và model bỏ sót ý ở giữa. Tôi không chọn theo cảm tính mà đo Recall@5 trên bộ golden với vài cấu hình."

**📖 Trả lời đầy đủ**

Năm chiến lược và khi dùng:

| Chiến lược | Hợp với |
|---|---|
| Fixed-size | Baseline để so sánh |
| **Recursive** (cắt ưu tiên `\n\n` → `\n` → `. `) | Mặc định tốt cho hầu hết trường hợp |
| Theo cấu trúc (heading/điều khoản) | Luật, quy định, giáo trình |
| Semantic (cắt nơi embedding lệch) | Văn xuôi dài, chủ đề đan xen; đắt hơn |
| Parent-child | Cần vừa chính xác khi tìm vừa đủ ngữ cảnh khi sinh |

Ba nguyên tắc thực chiến:
1. **Overlap 10–20% chunk size** — ít quá mất ngữ cảnh ở mép cắt, nhiều quá phình chi phí và trả kết quả trùng lặp.
2. **Mỗi chunk mang metadata đủ để trích dẫn**: `doc_id`, `source`, `page`, `heading`.
3. **Contextual retrieval** — thêm tiêu đề tài liệu và heading vào đầu chunk. Nhờ vậy chunk "Mức phạt là 5 triệu đồng" không còn mồ côi mà biết nó thuộc điều nào.

**📊 Số của bạn** *(T10)*

> "Tôi so 3 cấu hình trên 15 câu golden: fixed-400 cho Recall@5 = ___, recursive-800/120 = ___, recursive-1500/200 = ___. Chọn ___ vì ___. Có một câu cụ thể mà cấu hình A trúng còn B trượt: ___."

**🔍 Họ sẽ hỏi tiếp**

- *"Với tài liệu có bảng biểu thì sao?"* → Không cắt giữa bảng. Trích xuất bảng riêng, chuyển sang Markdown để LLM đọc hiểu được, giữ nguyên làm một chunk kèm caption.
- *"Tài liệu tiếng Việt có gì khác?"* → Tokenizer cắt tiếng Việt tốn token gấp 1,5–2,5 lần tiếng Anh, nên cùng một chunk size tính bằng ký tự sẽ chứa ít nội dung hơn khi tính bằng token. Và bắt buộc chuẩn hoá NFC — cùng một chữ có thể mã hoá bằng hai chuỗi Unicode khác nhau, gây trượt tìm kiếm mà nhìn bằng mắt không phát hiện được.

**⚠️ Bẫy**

Đưa ra một con số tuyệt đối ("nên dùng 512 token"). Không có con số đúng chung — chỉ có con số đúng cho corpus và loại câu hỏi cụ thể, và phải đo mới biết.

---

## Câu 3. Vì sao cần hybrid search?

**⏱️ Trả lời 30 giây**

> "Vì embedding mạnh ở khái niệm nhưng **yếu ở định danh chính xác**. Hỏi mã sản phẩm SKU-99123 thì vector search trả về các mã khác có hình thái tương tự, vì với model chúng 'gần nghĩa' nhau. BM25 khớp chính xác nên luôn đúng ca đó. Tôi gộp hai bảng xếp hạng bằng RRF."

**📖 Trả lời đầy đủ**

Vector search giỏi: "phương tiện đi lại" tìm ra tài liệu về xe máy dù không có từ nào trùng. Vector search dở: mã số, tên riêng hiếm, số hiệu văn bản, thuật ngữ viết tắt, từ khoá kỹ thuật — những thứ mà **hình thái giống nhau nhưng ý nghĩa hoàn toàn khác**.

**RRF (Reciprocal Rank Fusion)**: `score(d) = Σ 1/(c + rank_i(d))`, thường `c = 60`. Ưu điểm lớn nhất là **không cần chuẩn hoá điểm** giữa hai hệ thang đo khác hẳn nhau (cosine 0–1 và BM25 0–∞), chỉ dùng thứ hạng. Tài liệu được cả hai nguồn xếp cao sẽ thắng — đồng thuận được thưởng.

**📊 Số của bạn** *(T13)*

> "Trên bộ golden của tôi, thêm BM25 tăng Recall@5 từ ___ lên ___. Cụ thể có 2 câu vector-only trượt hoàn toàn: câu hỏi về mã ___ và về số hiệu văn bản ___ — vector trả về các mã cùng định dạng nhưng khác nội dung."

**🔍 Họ sẽ hỏi tiếp**

- *"Có cách nào khác ngoài BM25?"* → Sparse embedding (SPLADE, BGE-M3 hỗ trợ cả dense lẫn sparse) cho kết quả tương tự mà không cần giữ hai index riêng. Hoặc lọc theo metadata trước khi tìm nếu truy vấn có cấu trúc rõ.
- *"Cân trọng số hai nhánh thế nào?"* → RRF không cần trọng số, đó là ưu điểm. Nếu muốn ưu tiên một nhánh thì nhân hệ số vào công thức và **hiệu chuẩn trên bộ golden**, đừng đoán.

**⚠️ Bẫy**

Nói "hybrid luôn tốt hơn" mà không nêu chi phí: phải duy trì thêm một index, tăng độ trễ, và với corpus toàn văn xuôi thì BM25 đóng góp rất ít. Cũng phải đo.

---

## Câu 4. Reranker khác embedding model thế nào?

**⏱️ Trả lời 30 giây**

> "Embedding là **bi-encoder**: mã hoá câu hỏi và tài liệu **độc lập** thành hai vector rồi so sánh — nên tính trước được, tìm trong hàng triệu chunk rất nhanh, nhưng kém chính xác. Reranker là **cross-encoder**: đưa cặp (câu hỏi, tài liệu) vào cùng một lượt để model nhìn thấy tương tác giữa chúng — chính xác hơn nhiều nhưng không tính trước được, nên chỉ dùng để tinh lọc top-20 chứ không quét cả corpus."

**📖 Trả lời đầy đủ**

Kiến trúc chuẩn là **rộng → hẹp → sinh**:

```
truy hồi rộng (k=20–50)  →  rerank (top 3–5)  →  sinh câu trả lời
nhanh, rẻ, bao phủ          chậm, chính xác      đắt nhất
```

Lý do bi-encoder kém chính xác hơn: nó phải nén toàn bộ ý nghĩa tài liệu vào một vector cố định **trước khi biết câu hỏi là gì**. Cross-encoder được nhìn cả hai cùng lúc nên đánh giá được mức liên quan theo đúng ngữ cảnh câu hỏi.

Chi phí: rerank 20 chunk thường thêm 100–400ms. Đổi lại thường tăng vài đến hơn chục điểm phần trăm faithfulness, vì context đưa vào LLM sạch hơn.

**📊 Số của bạn** *(T13–T14)*

> "Thêm reranker vào pipeline: faithfulness ___ → ___, context precision ___ → ___, p95 tăng từ ___ lên ___. Tôi vẫn giữ vì phần tăng chất lượng đáng giá hơn ___ms; nhưng ở cấu hình tối ưu chi phí tôi bỏ reranker và bù bằng ___."

**🔍 Họ sẽ hỏi tiếp**

- *"Dùng LLM để rerank được không?"* → Được và thường chính xác hơn nữa, nhưng đắt và chậm hơn nhiều. Hợp lý khi số lượng nhỏ hoặc chất lượng quan trọng hơn chi phí.
- *"Chọn k bao nhiêu cho tầng truy hồi?"* → Đủ lớn để đoạn đúng chắc chắn lọt vào (đo bằng Recall@k trên golden), thường 20–50. Lớn hơn nữa chỉ tốn thời gian rerank mà không tăng recall.

**⚠️ Bẫy**

Nhầm reranker với việc "sắp xếp lại theo điểm cosine". Đó vẫn là bi-encoder, không phải rerank.

---

## Câu 5. Giải thích self-attention

**⏱️ Trả lời 30 giây**

> "Mỗi token sinh ra ba vector: Query — 'tôi đang tìm gì', Key — 'tôi chứa gì', Value — 'nội dung của tôi'. Nhân Q với K của mọi token để ra điểm liên quan, chia căn d_k, softmax thành trọng số, rồi lấy trung bình có trọng số các Value. Kết quả là mỗi token trở thành hỗn hợp của những token liên quan tới nó. Trong câu 'con mèo ngồi trên thảm vì **nó** mềm', token 'nó' sẽ có trọng số cao với 'thảm'."

**📖 Trả lời đầy đủ**

`Attention(Q,K,V) = softmax(QKᵀ/√d_k)·V`

Từng phần:
- `QKᵀ` — ma trận điểm số, mỗi token hỏi mọi token "bạn có liên quan tới tôi không". Bản chất là **tích vô hướng đo độ tương đồng**, giống hệt cosine similarity trong RAG.
- `/√d_k` — nếu không chia, với `d_k` lớn thì điểm số phân tán rộng, softmax bão hoà về one-hot và **gradient gần như biến mất**, model không học được.
- `softmax` — biến điểm thành trọng số cộng lại bằng 1.
- `·V` — trung bình có trọng số.

Bốn thành phần còn lại của Transformer:
- **Multi-head**: chạy attention nhiều lần song song với các phép chiếu khác nhau, mỗi "đầu" học một kiểu quan hệ.
- **Positional encoding**: attention là hoán vị bất biến — không có mã hoá vị trí thì "chó cắn người" và "người cắn chó" giống hệt nhau.
- **Residual + LayerNorm**: cho phép xếp chồng hàng chục lớp mà gradient không biến mất.
- **Feed-forward**: chứa phần lớn tham số, là nơi "lưu kiến thức".

Và **causal mask** trong decoder: token vị trí i chỉ được nhìn ≤ i. Không có mask thì model nhìn trộm đáp án khi train — loss giảm rất đẹp nhưng sinh ra rác.

**📊 Số của bạn** *(T30)*

> "Tôi tự cài đặt một GPT nhỏ ~___M tham số, train trên ___MB văn bản tiếng Việt. Có làm ablation: bỏ causal mask thì train loss giảm về gần 0 rất nhanh — vì model chép đáp án — nhưng sinh ra rác; bỏ positional encoding thì loss dừng ở mức cao và đầu ra thành túi từ không có cấu trúc câu."

**🔍 Họ sẽ hỏi tiếp**

- *"Encoder-only, decoder-only, encoder-decoder khác nhau ra sao?"* → Encoder-only (BERT, các model embedding) attention hai chiều, dùng để hiểu và tạo vector. Decoder-only (GPT, Claude) attention một chiều có mask, dùng để sinh. Encoder-decoder (T5) dùng cho dịch/tóm tắt. **Model embedding bạn dùng trong RAG là encoder-only** — nêu được liên hệ này rất được điểm.
- *"Vì sao attention tốn O(n²)?"* → Mỗi token phải so với mọi token. Đó là lý do context window dài rất tốn kém, và là động lực cho các kỹ thuật như FlashAttention, sliding window, hay PagedAttention trong vLLM.

**⚠️ Bẫy**

Đọc thuộc công thức mà không giải thích được ý nghĩa. Người phỏng vấn muốn nghe bạn **kể lại bằng lời của mình** — dùng ví dụ câu có đại từ là cách nhanh nhất để chứng minh bạn hiểu.

---

# NHÓM B — ĐÁNH GIÁ

## Câu 6. Đo chất lượng RAG bằng gì?

**⏱️ Trả lời 30 giây**

> "Tôi tách làm hai nửa để biết hỏng ở đâu. Nửa truy hồi đo **Context Recall** và **Context Precision**; nửa sinh đo **Faithfulness** và **Answer Relevancy**. Faithfulness là chỉ số quan trọng nhất vì nó đo mức bịa. Ngoài chất lượng thì luôn báo cáo kèm p95 latency và chi phí trên 1.000 câu — vì cấu hình tốt nhất về chất lượng thường không phải cấu hình nên chọn."

**📖 Trả lời đầy đủ**

| Chỉ số | Đo gì | Thấp nghĩa là |
|---|---|---|
| Context Recall | Đoạn chứa đáp án có trong context không | Pipeline dữ liệu hỏng |
| Context Precision | Bao nhiêu phần context là liên quan | Context loãng, tốn token |
| **Faithfulness** | Câu trả lời có dựa trên context không | Model bịa |
| Answer Relevancy | Có đúng trọng tâm câu hỏi không | Trả lời lạc đề |

Nền tảng của mọi phép đo là **bộ golden**: 30–50 câu hỏi có ground truth ghi tay, gồm 20% câu **không có đáp án trong tài liệu** — để đo khả năng nói "không biết", chỉ số chống ảo giác quan trọng nhất.

**📊 Số của bạn** *(T14)*

> "Tôi xây bộ golden ___ câu, chạy ___ cấu hình. Cấu hình sản xuất đạt faithfulness ___, context recall ___, p95 ___s, $___/1.000 câu. Tôi chọn nó thay vì cấu hình chất lượng cao nhất vì cấu hình kia đắt hơn ___% mà chỉ hơn ___ điểm."

**🔍 Họ sẽ hỏi tiếp**

- *"Không có ground truth thì đo thế nào?"* → Vẫn đo được faithfulness (so câu trả lời với context, không cần đáp án đúng) và các tín hiệu gián tiếp: tỉ lệ "không tìm thấy", điểm similarity top-1, tỉ lệ người dùng hỏi lại ngay. Nhưng nên đầu tư một buổi ghi tay 30 câu golden — lợi ích kéo dài cả dự án.
- *"Bao lâu chạy eval một lần?"* → Eval nhanh 20 ca trên mỗi PR, eval đầy đủ hằng đêm và trước mỗi lần phát hành.

**⚠️ Bẫy**

Nói "tôi kiểm tra thủ công thấy ổn". Đó là câu trả lời loại bạn ngay lập tức.

---

## Câu 7. Faithfulness thấp thì sửa ở đâu?

**⏱️ Trả lời 30 giây**

> "Trước khi sửa phải chẩn đoán, và cách chẩn đoán là **nhìn Context Recall cùng lúc**. Recall thấp nghĩa là model không có tài liệu đúng để dựa vào — lỗi ở pipeline truy hồi. Recall cao mà faithfulness thấp nghĩa là có đủ tài liệu mà vẫn bịa — lỗi ở prompt hoặc model. Sửa nhầm chỗ có thể mất hàng tuần."

**📖 Trả lời đầy đủ**

| Recall | Faithfulness | Chẩn đoán | Sửa ở đâu |
|---|---|---|---|
| Thấp | Thấp | Không tìm được tài liệu đúng | Chunking, embedding, hybrid search, tăng k |
| Cao | Thấp | Có tài liệu mà vẫn bịa | Prompt (cấm dùng kiến thức ngoài, cho phép nói không biết), hạ temperature, đổi model |
| Cao | Cao, Precision thấp | Context loãng | Giảm k, thêm reranker |

Bốn tầng chống ảo giác, làm theo thứ tự: (1) chỉ thị "chỉ dùng tài liệu"; (2) **cho phép nói không biết** — hiệu quả nhất; (3) bắt trích dẫn nguồn cho từng ý; (4) hậu kiểm tự động.

Hậu kiểm rẻ mà rất hiệu quả: kiểm tra **mọi con số trong câu trả lời có xuất hiện trong context không**, và mọi câu khẳng định dài có trích dẫn không. Chạy được trong CI, không cần LLM judge.

**📊 Số của bạn** *(T11, T14)*

> "Tôi làm ablation trên 4 biến thể prompt. Bỏ chỉ thị 'được phép nói không biết' làm tỉ lệ bịa trên nhóm câu không có đáp án tăng từ ___% lên ___%. Đó là chỉ thị đáng giá nhất trong prompt của tôi."

**🔍 Họ sẽ hỏi tiếp**

- *"Model vẫn bịa dù prompt đã chặt thì sao?"* → Hạ temperature về 0–0,1; thử model mạnh hơn cho khâu sinh; thêm lớp verify riêng kiểm tra từng khẳng định có trong context không; và cuối cùng chấp nhận từ chối trả lời khi độ tin cậy thấp — thà không trả lời còn hơn trả lời sai.

**⚠️ Bẫy**

Nhảy vào sửa prompt ngay khi thấy faithfulness thấp. Người phỏng vấn muốn nghe **quy trình chẩn đoán**, không phải phản xạ.

---

## Câu 8. Cạm bẫy của LLM-as-judge?

**⏱️ Trả lời 30 giây**

> "Bốn cái: thiên vị độ dài — câu trả lời dài hay được chấm cao hơn dù không tốt hơn; thiên vị vị trí khi so cặp — phải đảo A/B rồi lấy trung bình; tự thiên vị — model chấm cao cho đầu ra của chính họ model đó nên phải dùng model khác để chấm; và quan trọng nhất là **không hiệu chuẩn** — điểm 0,8 của judge nghĩa là gì nếu chưa bao giờ so với người thật?"

**📖 Trả lời đầy đủ**

Hiệu chuẩn judge là bước bắt buộc mà hầu như không ai làm: tự chấm tay 20 mẫu theo đúng tiêu chí, rồi tính tương quan với điểm của judge và tỉ lệ đồng thuận khi quy về nhị phân. Tương quan trên 0,7 và đồng thuận trên 80% thì tin được; thấp hơn thì phải sửa prompt judge (thêm ví dụ chấm mẫu, định nghĩa tiêu chí chặt hơn) rồi hiệu chuẩn lại.

Kiểm định thiên vị độ dài: lấy 10 câu, tạo hai phiên bản trả lời cùng nội dung nhưng một bản dài gấp đôi nhờ thêm diễn giải thừa, so điểm. Nếu bản dài thắng thì thêm vào prompt judge: *"Độ dài không phải tiêu chí. Câu ngắn mà đủ ý phải được điểm bằng hoặc cao hơn câu dài dòng."*

**📊 Số của bạn** *(T14)*

> "Tôi hiệu chuẩn judge bằng 20 mẫu chấm tay: tương quan Pearson ___, đồng thuận nhị phân ___%. Kiểm định thiên vị độ dài cho thấy ___, nên tôi đã sửa prompt judge bằng cách ___."

**🔍 Họ sẽ hỏi tiếp**

- *"Có cách đo nào không cần LLM judge?"* → Có, và nên dùng kết hợp: khớp chính xác cho tác vụ có đáp án đóng; kiểm tra tính chất (có trích dẫn không, có số nào không nằm trong context không, độ dài trong khoảng cho phép); và các chỉ số truy hồi như Recall@k vốn hoàn toàn khách quan.

**⚠️ Bẫy**

Trình bày điểm số từ judge chưa hiệu chuẩn như thể đó là sự thật. Người phỏng vấn có kinh nghiệm sẽ hỏi ngay "sao anh biết judge đúng?"

---

## Câu 9. Xây bộ eval như thế nào?

**⏱️ Trả lời 30 giây**

> "Nguyên tắc số một: **soạn eval trước khi code**, không phải sau. Bộ golden của tôi có 30–50 ca, ba mức khó, và bắt buộc 20% là câu **không có đáp án trong tài liệu**. Ground truth ghi tay, không sinh tự động bằng chính hệ thống đang đo — làm thế là tự chấm điểm mình."

**📖 Trả lời đầy đủ**

Tiêu chí một bộ golden tốt:
- Câu hỏi viết **như người dùng thật hỏi**, không copy nguyên văn câu trong tài liệu — nếu copy thì chỉ đang test khớp chuỗi.
- Đủ ba mức: tra cứu trực tiếp / cần tổng hợp nhiều nguồn / cần suy luận.
- 20% ca âm tính: câu không có đáp án, câu ngoài phạm vi, câu mơ hồ cần hỏi lại.
- Ground truth ghi tay: `expected_doc_ids` và `expected_answer`.

Với **agent** thì mỗi ca cần thêm: `allowed_tools`, `must_call`, `must_not_call`, `max_steps`, và cờ `should_refuse` cho ca âm tính.

Bộ golden là **tài sản sống**: mỗi khi phát hiện một ca hỏng trong production, thêm nó vào golden. Sau vài tháng nó phản ánh đúng cách người dùng thật sự dùng hệ thống.

**📊 Số của bạn**

> "Golden của tôi khởi đầu 15 ca ở T10, mở lên ___ ca ở T13, và hiện có ___ ca sau khi bổ sung các ca hỏng gặp trong thực tế."

**🔍 Họ sẽ hỏi tiếp**

- *"30 ca có ít quá không?"* → Ít cho kết luận thống kê chặt, nhưng đủ để bắt hồi quy — mục đích chính. Quan trọng hơn số lượng là **độ phủ**: có ca dễ, ca khó, ca âm tính, và ca đại diện cho từng loại tài liệu trong corpus.
- *"Ai nên soạn golden?"* → Lý tưởng là người hiểu nghiệp vụ, không phải kỹ sư. Kỹ sư soạn thì thường ra những câu hệ thống vốn đã trả lời tốt.

**⚠️ Bẫy**

Dùng LLM sinh cả câu hỏi lẫn đáp án rồi dùng LLM chấm. Vòng lặp khép kín này đo được đúng một thứ: model có nhất quán với chính nó hay không.

---

## Câu 10. Vì sao eval agent phải chạy nhiều lần mỗi ca?

**⏱️ Trả lời 30 giây**

> "Vì agent **không tất định** — cùng một đầu vào có thể cho quỹ đạo hoàn toàn khác nhau. Chạy một lần rồi kết luận là đo may rủi. Tôi chạy mỗi ca 3–5 lần và báo cáo cả trung bình lẫn độ lệch. Và **độ lệch cao chính nó là phát hiện quan trọng nhất**: nó nghĩa là agent không đáng tin cho phần việc đó."

**📖 Trả lời đầy đủ**

Ba tầng eval cho agent: **kết quả cuối** (nhiệm vụ có xong đúng không — quan trọng nhất), **quỹ đạo** (có đi đường vòng, gọi tool thừa, lặp lại không), **từng bước** (chỉ dùng khi chẩn đoán).

Chỉ số phải báo cáo:
- Task success rate **kèm độ lệch giữa các lần chạy**
- Steps p50/p95 — p95 tăng là dấu hiệu agent đang lạc, cảnh báo sớm trước khi hoá đơn tăng
- **Cost per *successful* task** — chia cho số thành công, không phải tổng. Chia cho tổng sẽ khiến agent thất bại nhanh trông có vẻ rẻ.
- Vi phạm `must_not_call` — agent gọi tool nó không được phép gọi

Khi một ca có độ lệch cao, ba hướng xử lý: siết system prompt, giảm không gian lựa chọn (bớt tool), hoặc **chuyển hẳn phần đó sang workflow tất định**.

**📊 Số của bạn** *(T26)*

> "Eval set của tôi có ___ ca gồm 5 ca âm tính, chạy 3 lần mỗi ca. Task success rate ___, độ lệch trung bình ___. Có ___ ca độ lệch trên 0,4 — tôi đã chuyển phần đó sang workflow tất định và tỉ lệ thành công lên ___."

**⚠️ Bẫy**

Báo cáo chỉ có trung bình. Với hệ thống không tất định, giấu độ lệch là báo cáo gây hiểu nhầm.

---

# NHÓM C — KỸ THUẬT HỆ THỐNG

## Câu 11. Giảm chi phí LLM bằng những cách nào?

**⏱️ Trả lời 30 giây**

> "Theo thứ tự hiệu quả trên công sức: định tuyến model theo độ khó, cache, rút gọn context, giới hạn `max_tokens`, rồi mới đến self-host. Nhưng trước hết phải **đo xem tiền đang đi đâu** — tôi từng thấy 70% chi phí đến từ một tính năng chiếm 5% lưu lượng."

**📖 Trả lời đầy đủ**

| Cách | Mức tiết kiệm | Công sức | Rủi ro |
|---|---|---|---|
| Router theo độ khó | 40–70% | trung bình | Định tuyến sai làm hỏng ca khó |
| Cache chính xác | 5–20% | thấp | gần như không |
| Cache ngữ nghĩa | 20–40% | trung bình | **Trả lời sai nếu ngưỡng thấp** |
| Rút gọn context (rerank, giảm k) | 20–40% | thấp | Giảm recall nếu cắt quá tay |
| Giới hạn `max_tokens` + yêu cầu ngắn gọn | 10–30% | rất thấp | Cắt cụt câu trả lời |
| Prompt caching / prefix caching | 20–50% chi phí input | thấp | Phải đặt phần cố định ở đầu prompt |
| Self-host | tuỳ tải | **cao** | Chỉ rẻ hơn khi utilization cao |

Hai điểm ít người biết: **token đầu ra đắt gấp 3–5 lần token đầu vào**, nên "yêu cầu model trả lời ngắn gọn" là quyết định chi phí chứ không chỉ là UX. Và **prefix caching chỉ hoạt động khi phần cố định nằm ở đầu prompt** — đảo thứ tự là mất sạch lợi ích.

**📊 Số của bạn** *(T33)*

> "Router định tuyến ___% câu sang model nhỏ, tiết kiệm ___% chi phí với chất lượng giảm ___ điểm. Cache ngữ nghĩa hit rate ___% ở ngưỡng ___. Tổng cộng chi phí/1.000 câu giảm từ $___ xuống $___."

**🔍 Họ sẽ hỏi tiếp**

- *"Router phân loại độ khó bằng gì?"* → Phải rẻ hơn nhiều so với phần tiết kiệm được: heuristic (độ dài, từ khoá suy luận) hoặc một classifier nhỏ. **Không** dùng LLM lớn để phân loại — thế thì mất hết ý nghĩa.
- *"Đo tác động của router thế nào cho đúng?"* → Phải **tách kết quả theo nhóm định tuyến**. Nếu 5% câu khó bị gửi nhầm sang model nhỏ và sai hoàn toàn, con số "chất lượng giảm 2% trung bình" đã che giấu trải nghiệm rất tệ cho 5% người dùng.

**⚠️ Bẫy**

Nhảy ngay vào self-host. Đó là cách tốn công nhất và thường không rẻ hơn ở tải vừa.

---

## Câu 12. Khi nào self-host rẻ hơn API?

**⏱️ Trả lời 30 giây**

> "Bẫy lớn nhất là người ta tính theo token, nhưng GPU tính theo **giờ**. 5 triệu token/ngày chỉ dùng hết khoảng 2 giờ GPU, nhưng bạn trả tiền 24 giờ — nên API thực ra rẻ hơn. Self-host chỉ thắng khi **utilization cao và tải ổn định**; điểm hoà vốn trong tính toán của tôi rơi vào khoảng 30 triệu token/ngày."

**📖 Trả lời đầy đủ**

Cách tính:
```
Self-host: throughput (tok/s) × 3600 × utilization thực tế (~0,6)  = token/giờ
           chi phí GPU/giờ ÷ (token/giờ ÷ 1e6)                     = USD per 1M token
API:       giá_in × tỉ lệ input + giá_out × tỉ lệ output           = USD per 1M token
```

Nhưng con số trên **chưa đủ**. Phải cộng vào TCO: hạ tầng (vector DB, storage, băng thông), giám sát, CI/CD, **con người vận hành và trực sự cố**, và chi phí ẩn của downtime.

Ba lý do chính đáng để self-host **ngoài chi phí**: dữ liệu không được ra khỏi hệ thống (quy định ngành, hợp đồng); cần chạy model đã fine-tune riêng; cần kiểm soát hoàn toàn về phiên bản và độ trễ.

**📊 Số của bạn** *(T32)*

> "Tôi chạy vLLM với Qwen3-8B, đo được ___ tok/s ở concurrency ___. Với GPU $___/giờ thì chi phí là $___/1M token, so với $___/1M của API. Điểm hoà vốn ở mức ___ token/ngày. Với tải hiện tại của dự án là ___ thì API vẫn rẻ hơn."

**🔍 Họ sẽ hỏi tiếp**

- *"Lượng tử hoá có ảnh hưởng chất lượng không?"* → Có, và mức ảnh hưởng **khác nhau theo bài toán** — phải chạy bộ golden của mình chứ đừng tin benchmark chung. Kinh nghiệm của tôi: với RAG (chủ yếu trích xuất và diễn đạt lại), 4-bit thường chấp nhận được; với suy luận nhiều bước hoặc sinh code thì mất mát rõ hơn.
- *"Chọn concurrency vận hành thế nào?"* → Ngay trước điểm p95 vọt lên, **không phải** điểm throughput cực đại. Chạy ở throughput cực đại nghĩa là hàng đợi luôn đầy và trải nghiệm rất tệ.

**⚠️ Bẫy**

Chỉ so giá token mà quên chi phí giờ GPU nhàn rỗi, và quên chi phí con người.

---

## Câu 13. Vì sao vLLM nhanh hơn nhiều so với transformers thông thường?

**⏱️ Trả lời 30 giây**

> "Ba kỹ thuật. **PagedAttention** quản lý KV cache theo trang như bộ nhớ ảo, tránh phân mảnh, tiết kiệm 50–70% VRAM nên chứa được nhiều request đồng thời hơn. **Continuous batching** ghép và thả request liên tục thay vì chờ cả batch xong, nên GPU không nhàn rỗi. **Prefix caching** tái sử dụng phần prompt dùng chung. Cộng lại throughput cao hơn 5–20 lần."

**📖 Trả lời đầy đủ**

Vấn đề với batch tĩnh: 8 request trong một batch, 7 cái xong sau 50 token nhưng 1 cái cần 500 token → GPU chạy 7 chỗ trống suốt phần còn lại. Continuous batching thả request đã xong và nạp request mới vào chỗ trống ngay.

Vấn đề với KV cache thông thường: phải cấp phát trước theo độ dài tối đa có thể → phần lớn bị lãng phí. PagedAttention cấp phát theo khối nhỏ khi cần, như phân trang bộ nhớ của hệ điều hành.

Cần phân biệt **hai giai đoạn suy luận** để đọc số liệu đúng:
- **Prefill** — xử lý toàn bộ prompt, song song hoá tốt, giới hạn bởi **tính toán**. Quyết định TTFT.
- **Decode** — sinh từng token, giới hạn bởi **băng thông bộ nhớ**. Quyết định tốc độ chữ chạy.

Gộp hai cái vào một con số "latency" là mất thông tin — prompt dài làm TTFT tăng, đầu ra dài làm tổng thời gian tăng, và hai thứ này tối ưu bằng cách khác nhau.

**📊 Số của bạn** *(T32)*

> "Benchmark của tôi ở concurrency 1/4/8/16/32/64: throughput ___ tok/s, TTFT p95 từ ___s lên ___s. Bật prefix caching với system prompt 2.000 token giảm TTFT ___%."

**⚠️ Bẫy**

Chỉ nói "nó tối ưu hơn". Nêu được tên và cơ chế của ít nhất PagedAttention và continuous batching mới chứng tỏ bạn thật sự đã dùng.

---

## Câu 14. Thiết kế gateway cho nhiều model?

**⏱️ Trả lời 30 giây**

> "Một endpoint **tương thích chuẩn OpenAI** để mọi client hiện có dùng được không cần sửa code. Bên trong: định tuyến theo độ khó, chuyển dự phòng khi provider lỗi kèm circuit breaker, cache hai tầng, rate limit và quota, ghi nhận chi phí theo khoá API, và che giấu khoá provider thật. Gateway là **một điểm kiểm soát duy nhất** cho mọi thứ đó."

**📖 Trả lời đầy đủ**

Không có gateway: mỗi ứng dụng gọi provider riêng → đổi model phải sửa code khắp nơi, không biết tổng chi phí, provider sập là ứng dụng sập, không áp được chính sách chung, khoá API rải rác.

Quyết định kiến trúc quan trọng nhất là **phơi ra chuẩn `/v1/chat/completions`**: SDK OpenAI, LangChain, IDE, và cả vLLM đều nói được giao thức này. Client cũ dùng được ngay.

Thứ tự xử lý trong gateway: xác thực khoá của gateway → thử cache → chọn backend → gọi, lỗi thì chuyển dự phòng → ghi nhận chi phí → lưu cache → trả về kèm metadata (model nào, variant nào, có cache không).

**Circuit breaker** là chi tiết hay bị bỏ: sau N lỗi liên tiếp thì ngừng thử backend đó trong 60 giây, thay vì mỗi request đều chờ hết timeout.

**📊 Số của bạn** *(T33)*

> "Gateway của tôi có 3 backend: một model local qua vLLM và hai API thương mại. Fallback tự động, có test. Ghi nhận chi phí theo khoá, endpoint `/usage` cho biết mỗi tenant tiêu bao nhiêu."

**🔍 Họ sẽ hỏi tiếp**

- *"Gateway thành điểm hỏng duy nhất thì sao?"* → Chạy nhiều replica không trạng thái sau load balancer; cache và usage lưu ở Redis/Postgres chung; health check và tự khởi động lại. Và giữ đường thoát: client có thể cấu hình gọi thẳng provider khi gateway sập.
- *"Streaming qua gateway xử lý thế nào?"* → Chuyển tiếp SSE nguyên vẹn, không đệm. Nhưng phải cộng dồn token khi stream để ghi nhận chi phí ở cuối, và xử lý được trường hợp client ngắt giữa chừng.

---

## Câu 15. Cache ngữ nghĩa có rủi ro gì?

**⏱️ Trả lời 30 giây**

> "Hai rủi ro lớn. Thứ nhất là **trả lời sai**: 'chính sách nghỉ phép 2024' và 'chính sách nghỉ phép 2025' rất giống nhau về vector, ngưỡng thấp là trả nhầm. Thứ hai, nghiêm trọng hơn, là **rò rỉ dữ liệu giữa các tenant** nếu cache dùng chung — user công ty B hỏi câu tương tự và nhận được câu trả lời chứa dữ liệu công ty A."

**📖 Trả lời đầy đủ**

Bốn quy tắc dùng cache ngữ nghĩa an toàn:
1. **Ngưỡng cao** (≥0,93), hiệu chuẩn bằng bộ cặp câu hỏi có nhãn — chọn ngưỡng cao nhất mà **false hit = 0**, rồi mới tối ưu hit rate bằng cách khác.
2. **Namespace theo tenant/user** trong mọi truy vấn cache — bắt buộc, không phải tuỳ chọn.
3. **Không cache** khi câu hỏi chứa thời gian, số hiệu, mã định danh, hoặc khi `temperature` cao (người dùng đang muốn kết quả đa dạng).
4. **TTL ngắn** cho nội dung hay thay đổi.

Nguyên tắc tổng quát: **mọi lớp cache trong hệ thống nhiều tenant đều là bề mặt rò rỉ tiềm tàng** cho đến khi được chứng minh ngược lại bằng test tự động trong CI.

**📊 Số của bạn** *(T33)*

> "Tôi hiệu chuẩn ngưỡng bằng 200 cặp câu hỏi có nhãn same/different. Ở ngưỡng ___ thì hit rate ___% với false hit bằng 0. Dưới 0,90 bắt đầu có false hit ở các cặp khác năm và khác mã số."

**⚠️ Bẫy**

Khoe hit rate cao mà không nói đã kiểm chứng false hit. Một câu trả lời sai do cache đắt hơn nhiều so với chi phí gọi lại LLM.

---

# NHÓM D — VẬN HÀNH & AN TOÀN

## Câu 16. Chống prompt injection thế nào?

**⏱️ Trả lời 30 giây**

> "Trước hết phải nói rõ: **không có bản vá triệt để**. SQL injection chặn được bằng prepared statement vì mã và dữ liệu tách bạch được; với LLM thì chỉ dẫn và dữ liệu **cùng là văn bản tự nhiên**, không có ranh giới cứng. Nên chiến lược là phòng thủ nhiều lớp và giảm thiểu thiệt hại — trong đó **giảm quyền quan trọng hơn mọi bộ lọc**."

**📖 Trả lời đầy đủ**

Hai loại: **trực tiếp** (người dùng gõ "bỏ qua hướng dẫn trước") và **gián tiếp** — chỉ dẫn độc nằm trong tài liệu RAG truy hồi, trong trang web agent đọc, trong email agent xử lý. Loại gián tiếp mới là mối nguy thật, vì người dùng hoàn toàn vô tội và bạn đã nạp dữ liệu từ Internet vào corpus.

Các lớp phòng thủ, xếp theo hiệu quả:

1. **Đặc quyền tối thiểu** — agent không có tool xoá thì injection tinh vi đến mấy cũng không xoá được. Tài khoản DB chỉ có quyền SELECT trên đúng bảng cần.
2. **Allowlist năng lực** — `web_fetch` chỉ được gọi domain đã duyệt. Đây là kiểm soát *năng lực*, mạnh hơn hẳn lọc nội dung.
3. **HITL cho hành động không hoàn tác** — gửi mail, xoá, chuyển tiền phải có người duyệt.
4. **Spotlighting** — bọc tài liệu trong thẻ có delimiter ngẫu nhiên, và nói rõ trong system prompt: nội dung trong thẻ là *dữ liệu để đọc*, không phải chỉ dẫn.
5. **Quét đầu vào và quét tài liệu** — bắt mẫu đáng ngờ, loại ký tự vô hình dùng để giấu chỉ dẫn.
6. **Quét đầu ra** — chặn rò rỉ system prompt, PII, và URL ngoài allowlist (chống exfiltration).

Và nguyên tắc bao trùm: **coi mọi đầu ra của LLM là dữ liệu chưa tin cậy** — không `eval`, không nối vào SQL, không render HTML thô, luôn validate schema trước khi dùng.

**📊 Số của bạn** *(T34)*

> "Tôi tự red-team hệ thống của mình bằng 25 prompt chia 5 nhóm. Trước guardrail có ___ nhóm thành công, sau khi thêm phòng thủ còn ___. Nhóm tôi thua nhiều nhất là injection gián tiếp qua tài liệu — và đó là phát hiện có giá trị nhất, vì nó buộc tôi chuyển từ lọc nội dung sang giảm quyền."

**🔍 Họ sẽ hỏi tiếp**

- *"Bộ lọc regex có đủ không?"* → Không. Luôn vượt qua được bằng mã hoá (base64, ROT13), viết ngôn ngữ khác, hoặc tách chữ. Bộ lọc chỉ là lớp bổ sung, không bao giờ là lớp duy nhất.
- *"Guardrail có làm phiền người dùng thật không?"* → Có, và phải đo. Tôi đo tỉ lệ dương tính giả trên 100 câu hợp lệ. Cách xử lý tốt là **không chặn cứng mà nâng mức cảnh giác** — ghi log, siết guardrail đầu ra, thay vì từ chối trả lời.

**⚠️ Bẫy**

Nói "tôi lọc bằng regex là xong". Đó là câu trả lời cho thấy chưa từng nghĩ nghiêm túc về vấn đề này.

---

## Câu 17. Giám sát hệ thống LLM đo những gì?

**⏱️ Trả lời 30 giây**

> "Bốn nhóm chuẩn — lưu lượng, độ trễ, lỗi, chi phí — cộng thêm nhóm đặc thù LLM: tỉ lệ trúng cache, tỉ lệ định tuyến theo tier, tỉ lệ trả lời 'không tìm thấy', tỉ lệ bị guardrail chặn. Điểm mấu chốt là **`request_id` xuyên suốt log, metric và trace**; không có nó thì có đủ dữ liệu mà không nối được với nhau."

**📖 Trả lời đầy đủ**

| Nhóm | Chỉ số | Cảnh báo khi |
|---|---|---|
| Lưu lượng | req/s, token/s, inflight | Tăng/giảm đột ngột |
| Độ trễ | TTFT p50/p95/p99, e2e p95 | p95 vượt SLO trong 5 phút |
| Lỗi | tỉ lệ 5xx, timeout, lỗi tool, retry | >1% trong 5 phút |
| Chi phí | USD/giờ, USD/request, theo model và tenant | Vượt ngân sách giờ |

Phân biệt ba thứ: **log** cho biết chuyện gì xảy ra ở một thời điểm (dùng để điều tra một ca); **metric** là số liệu tổng hợp (dùng để phát hiện và cảnh báo); **trace** là chuỗi nhân quả qua nhiều thành phần (dùng để tìm nút thắt trong một request).

Về cảnh báo: mỗi cảnh báo mức khẩn phải **đáng để đánh thức người lúc 3 giờ sáng**, và phải kèm link runbook. Cảnh báo không nói được phải làm gì thì không đáng tồn tại. Cảnh báo theo **triệu chứng** ("p95 > 4s") thay vì theo nguyên nhân, để khỏi có 5 cảnh báo cho 5 nguyên nhân có thể.

**📊 Số của bạn** *(T36)*

> "Dashboard của tôi có 4 hàng đúng theo 4 nhóm trên, thiết kế để trả lời câu 'có ổn không' trong 10 giây. Cảnh báo gồm ___, mỗi cái có runbook riêng. Tôi cũng đẩy kết quả eval hằng đêm thành metric để thấy chất lượng theo thời gian."

**🔍 Họ sẽ hỏi tiếp**

- *"Điều tra khi p95 tăng từ 2s lên 9s?"* → Theo thứ tự: xác định phạm vi (mọi endpoint hay một?); kiểm tra có deploy nào trùng thời điểm không (nguyên nhân trong phần lớn ca); tách TTFT với tổng thời gian để biết nghẽn ở prefill hay decode; xem tài nguyên (inflight, GPU, connection pool); trace một request chậm; và **rollback trước nếu trùng deploy** — sửa trước, tìm nguyên nhân sau.

---

## Câu 18. Phát hiện trôi chất lượng ra sao?

**⏱️ Trả lời 30 giây**

> "Chất lượng LLM tụt âm thầm mà không có lỗi nào — đó là điều nguy hiểm nhất. Tôi dùng bốn tín hiệu gián tiếp theo dõi liên tục không cần nhãn: tỉ lệ trả lời 'không tìm thấy', độ dài câu trả lời trung bình, điểm similarity của kết quả top-1, và tỉ lệ người dùng hỏi lại ngay. Cộng với eval hằng đêm trên bộ golden để có số liệu trực tiếp."

**📖 Trả lời đầy đủ**

| Tín hiệu | Tăng/giảm nghĩa là |
|---|---|
| Tỉ lệ "không tìm thấy" tăng | Truy hồi đang hỏng, hoặc câu hỏi người dùng lệch khỏi corpus |
| Độ dài trả lời đổi đột ngột | Model hoặc prompt đã đổi (có thể do provider cập nhật model) |
| Similarity top-1 giảm | Câu hỏi đang lệch khỏi corpus — cần bổ sung tài liệu |
| Tỉ lệ hỏi lại ngay tăng | Câu trả lời không thoả mãn |

Bốn nguồn gây trôi: **provider âm thầm cập nhật model**; **corpus thay đổi** (thêm tài liệu làm loãng, xoá tài liệu làm thiếu); **phân bố câu hỏi thay đổi** (mùa vụ, tính năng mới, người dùng mới); và **thay đổi từ chính đội** (prompt, cấu hình) mà không đo.

Đây chính là lý do phải **version cả prompt, model, cấu hình pipeline và index**, ghi vào metadata mọi response. Trường hay bị quên nhất là `index_version` — corpus thay đổi âm thầm mà không có commit nào, và bạn sẽ đi tìm bug trong code suốt nhiều ngày.

**📊 Số của bạn** *(T35–T36)*

> "Tôi có cảnh báo khi tỉ lệ 'không tìm thấy' vượt 25% trong 30 phút. Eval hằng đêm đẩy faithfulness thành metric, có cảnh báo khi xuống dưới ___. Metadata mỗi response ghi ___ trường, gồm cả hash của corpus."

**⚠️ Bẫy**

Chỉ nói "chạy eval định kỳ". Eval hằng đêm phát hiện sau nhiều giờ; tín hiệu gián tiếp phát hiện trong vài phút. Cần cả hai.

---

## Câu 19. Khi nào dùng agent, khi nào workflow?

**⏱️ Trả lời 30 giây**

> "Câu hỏi quyết định là: **bạn có liệt kê được đầy đủ các bước không?** Nếu có thì viết workflow tất định — đó là đáp án đúng cho khoảng 70% trường hợp. Chỉ dùng agent khi **số bước phụ thuộc kết quả trung gian**. Agent đắt hơn 3–10 lần, chậm hơn, khó debug hơn và kém tin cậy hơn."

**📖 Trả lời đầy đủ**

| Loại | Ai quyết định luồng | Chi phí | Độ tin cậy |
|---|---|---|---|
| Workflow tất định | Bạn, trong code | 1× | Cao |
| Workflow có LLM (router, chain) | Bạn viết luồng, LLM quyết một nhánh | 1–2× | Khá cao |
| Agent | LLM quyết toàn bộ | 3–10× | Thấp hơn |

Ví dụ cụ thể: "tóm tắt tài liệu rồi gửi email" = workflow, 2 bước biết trước. "Nghiên cứu một chủ đề, tìm bao nhiêu nguồn tuỳ độ phức tạp, tổng hợp báo cáo" = agent, số bước không biết trước. "Gỡ lỗi build CI hỏng" = agent, vì số bước phụ thuộc lỗi gặp phải.

Thêm một tiêu chí: nếu hành động có **tác dụng phụ không hoàn tác được** (trừ tiền, gửi mail, xoá dữ liệu), ưu tiên workflow tất định có điểm duyệt, đừng để LLM tự quyết thứ tự.

Và nếu đã dùng agent thì bắt buộc có: **ngân sách** (bước/token/tiền/thời gian), **điều kiện dừng rõ ràng**, **trace đầy đủ**. Agent không có trace thì không debug được, chấm hết.

**📊 Số của bạn** *(T19, T24)*

> "Tôi đo cùng 5 nhiệm vụ qua một agent có đủ tool và qua supervisor + 3 worker: multi-agent tốn token gấp ___ lần, chậm hơn ___ lần, và chỉ tốt hơn ở nhiệm vụ có các mảng thật sự tách bạch. Với 3–5 tool trong một miền thì **một agent thắng**."

**🔍 Họ sẽ hỏi tiếp**

- *"Khi nào thì multi-agent xứng đáng?"* → Lý do kỹ thuật vững nhất là **cách ly context** — mỗi agent chỉ thấy phần nó cần, giảm context rot và giảm chi phí. Tôi đo được tiết kiệm 40–60% token ở worker và chất lượng *tăng* vì context sạch hơn. Lý do "chia vai cho giống con người" không phải lập luận kỹ thuật.

**⚠️ Bẫy**

Nói agent tốt hơn vì "linh hoạt hơn". Linh hoạt là chi phí, không phải lợi ích, trừ khi bài toán thật sự cần.

---

## Câu 20. Kể một lần bạn sai và đã sửa thế nào

**⏱️ Cách tiếp cận**

Đây là câu **luôn được hỏi**, và là câu phân biệt rõ nhất người đã làm thật với người học lý thuyết. Trả lời theo bốn nhịp:

1. **Bối cảnh** — đang làm gì, mục tiêu là gì (1 câu).
2. **Sai lầm** — cụ thể, có số. Nhận trách nhiệm, không đổ lỗi công cụ.
3. **Cách phát hiện** — càng cụ thể càng đáng tin.
4. **Bài học hệ thống** — đã thay đổi *quy trình* gì để nó không lặp lại. Đây là phần quan trọng nhất.

**📖 Ba mẫu lấy từ chính lộ trình này**

> **Mẫu 1 — đo nhầm chỗ.**
> "Khi làm RAG bot, faithfulness chỉ đạt 0,62. Tôi mất gần một tuần sửa prompt: thêm chỉ thị, thêm few-shot, đổi model. Không cải thiện đáng kể. Sau đó tôi đo Context Recall và phát hiện nó chỉ 0,55 — model không hề có tài liệu đúng để dựa vào, nên sửa prompt không bao giờ giải quyết được. Nguyên nhân thật là chiến lược chunking cắt vụn các điều khoản. Sửa chunking xong recall lên 0,86 và faithfulness lên 0,89.
> **Bài học hệ thống:** từ đó tôi luôn đo cả hai nửa — truy hồi và sinh — trước khi sửa bất cứ thứ gì. Và tôi thêm bảng chẩn đoán Recall × Faithfulness vào tài liệu dự án để người sau không mất một tuần như tôi."

> **Mẫu 2 — tin vào thước đo chưa kiểm chứng.**
> "Tôi báo cáo rằng cấu hình mới tốt hơn 8% dựa trên LLM judge. Sau đó tôi tự chấm tay 20 mẫu để hiệu chuẩn và phát hiện judge thiên vị độ dài — cấu hình mới chỉ trả lời dài hơn chứ không đúng hơn. Tương quan giữa điểm của tôi và judge chỉ 0,4.
> **Bài học hệ thống:** mọi judge phải được hiệu chuẩn trước khi dùng số của nó, và tôi thêm bước kiểm định thiên vị độ dài vào quy trình eval chuẩn."

> **Mẫu 3 — rò rỉ dữ liệu qua cache.**
> "Tôi thêm cache ngữ nghĩa và rất hài lòng vì hit rate 45%, tiết kiệm đáng kể. Đến khi viết test cách ly tenant thì phát hiện cache dùng chung namespace — về nguyên tắc user của tenant B có thể nhận câu trả lời chứa dữ liệu tenant A. Chưa xảy ra trong thực tế vì hệ thống còn ít người dùng, nhưng đó là lỗ hổng nghiêm trọng.
> **Bài học hệ thống:** tôi thêm test cách ly tenant qua cả bốn kênh — RAG, cache, bộ nhớ agent, log — vào CI vĩnh viễn. Và nguyên tắc tôi rút ra: mọi lớp cache trong hệ thống nhiều tenant đều là bề mặt rò rỉ tiềm tàng cho đến khi có test chứng minh ngược lại."

**⚠️ Bẫy**

- Kể lỗi giả vờ khiêm tốn ("tôi quá cầu toàn") — mất điểm ngay.
- Kể lỗi mà đổ cho công cụ hoặc người khác.
- Kể lỗi nhưng không nêu **thay đổi về quy trình**. Sửa một bug là bình thường; thay đổi cách làm việc để cả lớp bug đó không tái diễn mới là kỹ sư.

> Đây chính là lý do lộ trình bắt bạn ghi `ERRORS.md` suốt 40 tuần. Đến buổi phỏng vấn, bạn có sẵn 40 câu chuyện có thật, có số, có bài học.

---

# Phụ lục A — Câu hỏi bạn nên hỏi lại họ

Hỏi lại là cơ hội thể hiện tư duy kỹ sư, đừng bỏ qua:

1. "Hệ thống AI hiện tại của anh/chị đang **đo chất lượng bằng gì**?" — câu trả lời cho biết đội trưởng thành đến đâu.
2. "Chi phí LLM hằng tháng đang ở mức nào và ai theo dõi nó?"
3. "Khi model trả lời sai trong production, quy trình phát hiện và xử lý ra sao?"
4. "Có bộ eval tự động trong CI chưa, hay eval vẫn làm thủ công?"
5. "Team đang tự host model hay dùng API? Quyết định đó dựa trên phân tích nào?"
6. "Ranh giới giữa vai trò này với data scientist / backend engineer trong team thế nào?"

## Dấu hiệu cảnh báo khi nghe câu trả lời của họ

- Không có bộ eval nào → bạn sẽ phải xây từ đầu, và sẽ khó thuyết phục về giá trị công việc của mình.
- "Chúng tôi kiểm tra thủ công thấy ổn" → đội chưa có văn hoá đo lường.
- Không ai biết chi phí LLM hằng tháng → sẽ có ngày bị cắt ngân sách đột ngột.
- Yêu cầu bạn vừa làm ML research, vừa backend, vừa DevOps, vừa frontend → vai trò chưa được định nghĩa rõ.

# Phụ lục B — Checklist trước buổi phỏng vấn

- [ ] Thuộc 10 con số trong bảng ở đầu tài liệu này.
- [ ] Chuẩn bị 3 câu chuyện từ `ERRORS.md` theo khuôn 4 nhịp của câu 20.
- [ ] Mở sẵn repo portfolio, biết chính xác chỗ nào có bảng kết quả để chia sẻ màn hình.
- [ ] Chuẩn bị 1 sơ đồ kiến trúc vẽ được trong 2 phút trên giấy hoặc bảng trắng.
- [ ] Luyện giải thích attention trong 60 giây, không nhìn giấy.
- [ ] Chuẩn bị 3 câu hỏi lại họ từ Phụ lục A.
- [ ] Chuẩn bị câu trả lời cho "vì sao anh/chị chuyển sang AI Engineering?" — nối với nền tảng cũ của bạn thành lợi thế, không phải điểm yếu cần biện minh.
