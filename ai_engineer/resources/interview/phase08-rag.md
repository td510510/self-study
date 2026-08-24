# Phỏng vấn — Phase 08: RAG

12 câu hỏi thường gặp về hệ thống RAG cho vị trí **AI/LLM Application Engineer**.

Cách dùng: che phần đáp án, tự trả lời thành tiếng trong 60 giây, rồi đối chiếu.
Nhà tuyển dụng quan tâm bạn có **đo được** hệ thống hay không, hơn là bạn kể tên
được bao nhiêu thư viện.

---

## 1. Khi nào KHÔNG nên dùng RAG?

<details><summary>Đáp án</summary>

Khi kho tài liệu **nhỏ và ít thay đổi**. Lúc đó nhét thẳng vào system prompt kèm
**prompt caching** vừa rẻ hơn vừa chính xác hơn — vì không có bước retrieval nào
để mà sai.

RAG chỉ đáng khi kho **vượt context window**, **thay đổi thường xuyên**, hoặc bạn
cần **truy vết nguồn** ở mức từng đoạn.

**Điểm cộng:** nói rằng rất nhiều dự án dựng cả hệ RAG cho một tập tài liệu mà lẽ
ra chỉ cần `cache_control` — và bạn luôn hỏi "kho có thật sự lớn không?" trước khi
xây. Câu trả lời này cho thấy bạn cân nhắc chi phí kỹ thuật, không chỉ chạy theo
kiến trúc thời thượng.

</details>

---

## 2. Chồng lấn (overlap) khi chunking để làm gì? Cái giá của nó?

<details><summary>Đáp án</summary>

Để câu trả lời **không bị cắt đôi** ở ranh giới hai chunk. Không chồng lấn, một
câu nằm vắt qua ranh giới sẽ không nằm trọn trong bất kỳ chunk nào — và retrieval
không bao giờ lấy được nó đầy đủ.

**Giá phải trả:** chồng lấn 20% làm kho vector to hơn ~25%, và mỗi câu hỏi tốn
thêm token.

**Điểm cộng — nói được cái giá thứ hai mà ít người biết:** chồng lấn tạo ra các
chunk **gần trùng nhau**. Ba chunk chồng lấn cùng nói về một chủ đề sẽ cùng ghi
điểm cao và **chiếm hết top-k**, đẩy đoạn về chủ đề khác ra ngoài. Nghĩa là
chồng lấn cải thiện *tính toàn vẹn của chunk* nhưng làm hỏng *tính đa dạng của
top-k*. Cách xử lý: lấy rộng hơn rồi **loại chunk gần trùng** (cosine > 0.95).

</details>

---

## 3. Cắt tài liệu theo tiêu đề nghe rất hợp lý. Nó có vấn đề gì?

<details><summary>Đáp án</summary>

Nó **cắt đứt các tham chiếu chéo**. Tài liệu kỹ thuật hay viết *"cách khắc phục
lỗi ở mục trên"* — mục sau **không nhắc lại** tên lỗi. Cắt theo tiêu đề vừa tách
nguyên nhân khỏi cách sửa.

Hệ quả: hỏi "sửa lỗi VX-204 thế nào?" sẽ lấy về đoạn mô tả lỗi, và câu trả lời là
*"đây là lỗi xung đột dữ liệu"* — **đúng nhưng vô dụng**.

**Điểm cộng:** gọi đúng tên kiểu hỏng này — **hỏng im lặng**. Không có exception,
câu trả lời vẫn trôi chảy, chỉ thiếu mất nửa quan trọng. Chỉ bộ câu hỏi vàng có
case đòi **hai đoạn trích** mới phát hiện được.

</details>

---

## 4. Bạn dùng gì để tạo embedding khi làm RAG với Claude?

<details><summary>Đáp án</summary>

**Anthropic không có endpoint embedding.** Claude sinh văn bản, không trả vector.
Đây là câu hỏi kiểm tra bạn có thật sự làm hay chỉ đọc.

Ba lựa chọn:

| Lựa chọn | Ghi chú |
|---|---|
| `sentence-transformers` chạy máy mình | Miễn phí, offline, có model đa ngữ cho tiếng Việt |
| Voyage AI | Trả phí, Anthropic khuyến nghị cho RAG chất lượng cao |
| API embedding của nhà cung cấp khác | Ràng buộc bạn vào hệ sinh thái đó |

**Điểm cộng:** nói rằng đổi model embedding nghĩa là **phải nhúng lại toàn bộ
kho** — vector của hai model khác nhau không so sánh được với nhau. Nên đây là
quyết định nên cân nhắc kỹ từ đầu, không phải thứ đổi nhẹ nhàng về sau.

</details>

---

## 5. Người dùng hỏi về mã lỗi `VX-204`. BM25 hay embedding sẽ tìm tốt hơn? Vì sao?

<details><summary>Đáp án</summary>

**BM25, và cách biệt rất lớn.** Trên bộ dữ liệu của khoá học, nhóm câu hỏi mã lỗi
cho recall **1.00 với BM25** và **0.00 với embedding**.

Lý do: embedding học ý nghĩa từ dữ liệu. Model chưa từng thấy chuỗi `VX-204` đủ
nhiều lần để học được nó nghĩa là gì, nên vector gần như không có tín hiệu. BM25
thì khớp chính xác từng ký tự.

Điều này áp dụng cho **mọi mã định danh hiếm**: mã đơn hàng, số hợp đồng, SKU,
tên biến, mã lỗi — tức là chính xác những thứ người dùng doanh nghiệp hay hỏi nhất.

**Chiều ngược lại:** với câu diễn đạt khác hẳn tài liệu ("ngồi nhà làm việc" so
với "làm việc từ xa"), embedding thắng vì BM25 không có từ nào để khớp.

**Điểm cộng:** kết luận đúng — **hai phương pháp hỏng ở hai chỗ hoàn toàn khác
nhau**, và đó mới là lý do tồn tại của hybrid search, chứ không phải vì "gộp lại
thì hay hơn".

</details>

---

## 6. Vì sao RRF cộng nghịch đảo thứ hạng thay vì cộng điểm gốc?

<details><summary>Đáp án</summary>

Vì hai thang điểm **không so sánh được**: BM25 chạy từ 0 đến vô cùng, cosine chạy
từ −1 đến 1. Cộng thẳng thì BM25 nuốt chửng cosine.

RRF vứt bỏ điểm gốc, chỉ giữ **thứ hạng**:

```
điểm(mục) = Σ  1 / (k0 + thứ_hạng)          k0 thường = 60
```

Vì chỉ dùng thứ hạng nên **không cần chuẩn hoá gì cả** — đó là ưu điểm lớn nhất
của nó.

**`k0` làm gì?** Làm dịu chênh lệch giữa các hạng đầu. Với `k0=60`, hạng 1 được
1/61 và hạng 2 được 1/62 — gần bằng nhau. Với `k0=1`, hạng 1 được 1/2 còn hạng 2
chỉ 1/3, tức là rất thiên vị hạng nhất.

</details>

---

## 7. Hybrid search có bao giờ tệ hơn dùng một phương pháp không?

<details><summary>Đáp án</summary>

**Có, và đây là câu nhiều người trả lời sai.**

RRF coi hai bảng xếp hạng **quan trọng như nhau**. Khi một bên chắc chắn đúng
(BM25 với mã lỗi) và bên kia mù tịt, RRF vẫn kéo kết quả của bên mù tịt lên — và
có thể đẩy đoạn đúng ra khỏi top-k.

Số đo thật trên bộ dữ liệu khoá học:

| | Trung bình | nhóm mã lỗi |
|---|---|---|
| BM25 | 0.91 | **1.00** |
| Hybrid | **0.94** | **0.50** |

Trung bình tăng, nhóm mã lỗi **tụt một nửa**. Nếu chỉ nhìn con số tổng, bạn kết
luận "hybrid tốt hơn" và không hề biết vừa làm hỏng nhóm câu mà nhân viên hỗ trợ
kỹ thuật hỏi nhiều nhất.

**Cách xử lý:** định tuyến truy vấn — phát hiện mã định danh bằng regex rồi cho
BM25 trọng số cao hơn với riêng những câu đó. Nhưng bạn chỉ biết cần làm thế
**sau khi đã đo theo từng loại câu hỏi**.

</details>

---

## 8. Khi nào thêm bước rerank là đáng?

<details><summary>Đáp án</summary>

Rerank = lấy rộng bằng cách rẻ (top-20), rồi dùng **cross-encoder** đọc từng cặp
(câu hỏi, đoạn) để chấm lại và giữ top-3.

| | Bi-encoder (retrieval) | Cross-encoder (rerank) |
|---|---|---|
| Cách làm | Nhúng câu hỏi và đoạn **riêng biệt** | Đọc **cùng lúc** cả hai |
| Tốc độ | Rất nhanh — một phép nhân ma trận | Chậm — mỗi cặp một lần chạy model |

Vì chậm nên không ai quét cả kho bằng cross-encoder.

**Cách quyết định — đo trước khi thêm:**

- `recall@20` ≫ `recall@3` → đoạn đúng **có** được lấy về, chỉ xếp hạng thấp.
  Rerank sẽ giúp, đó đúng là việc nó làm.
- `recall@20` cũng thấp → đoạn đúng chưa từng được lấy về. Rerank **vô ích**;
  phải quay lại sửa chunking hoặc embedding.

**Điểm cộng:** nói rằng mỗi thành phần thêm vào là thêm độ trễ, thêm chi phí và
thêm một chỗ có thể hỏng — nên bạn không thêm rerank chỉ vì "ai cũng bảo nên có".

</details>

---

## 9. Làm sao chống bịa đặt trong RAG? "Trích dẫn ngoài phạm vi" là gì?

<details><summary>Đáp án</summary>

Ba lớp, theo thứ tự:

1. **Đánh số các đoạn** trong ngữ cảnh và buộc model trích dẫn `[n]`. Không đánh
   số thì model không có cách nào trỏ tới đoạn cụ thể, và bạn không có cách nào
   kiểm chứng.
2. **Câu từ chối cố định** — "Không tìm thấy thông tin trong tài liệu." Cố định
   thì code so khớp được; để model tuỳ ý diễn đạt thì không đo được.
3. **Kiểm bằng code, không bằng cảm giác.**

**Trích dẫn ngoài phạm vi:** model viết `[7]` khi bạn chỉ đưa 3 đoạn. Đây là dạng
bịa **nguy hiểm nhất** vì câu trả lời trông *càng đáng tin* nhờ có số trích dẫn —
và đúng vì thế mà người đọc sẽ không đi kiểm tra. Một dòng regex bắt được nó.

**Điểm cộng:** nhắc tới **citations có sẵn của Claude API** (`citations: {"enabled": True}`
trên khối `document`) — vị trí ký tự do API trả về nên model không bịa số được.
Kèm hai ràng buộc: bật cho một document thì phải bật cho tất cả, và **không dùng
chung được với structured output** (`output_config.format` trả lỗi 400).

</details>

---

## 10. ⭐ Vì sao bộ test RAG bắt buộc phải có câu KHÔNG có đáp án?

<details><summary>Đáp án</summary>

**Vì một hệ thống trả lời được mọi câu là một hệ thống biết bịa** — và nếu bộ test
chỉ có câu trả lời được, bạn sẽ không bao giờ biết điều đó.

Retrieval **không có cách nào "đúng"** với câu này: nó buộc phải trả về đoạn gì đó.
Trách nhiệm nằm hoàn toàn ở bước sinh câu trả lời.

**Câu `khong_co` tốt phải gần giống một thứ CÓ THẬT trong tài liệu:**

- Dở: *"Công ty có chi nhánh ở sao Hoả không?"* — retrieval trả về đoạn hoàn toàn
  không liên quan, từ chối quá dễ, không kiểm tra được gì.
- Tốt: *"Công ty có xe đưa đón không?"* khi tài liệu có "phụ cấp đi lại" —
  retrieval **chắc chắn** trả về đoạn đó với điểm cao, và model phải đủ tỉnh táo
  để nói *"tài liệu nói về phụ cấp đi lại, không nói về xe đưa đón"*.

**Điểm cộng — mặt trái:** nếu bộ test có 40% câu `khong_co` thì một hệ thống
**luôn từ chối** đạt 0.40 mà không làm gì cả. Vì thế phải **báo cáo điểm theo
từng loại**, không chỉ điểm tổng.

</details>

---

## 11. recall@k, MRR, faithfulness — mỗi cái đo bước nào?

<details><summary>Đáp án</summary>

Một hệ RAG hỏng ở **hai chỗ độc lập**, và phải đo tách:

| Chỉ số | Hỏi gì | Đo bước nào |
|---|---|---|
| **recall@k** | Đoạn chứa đáp án có trong k đoạn lấy về không? | Retrieval |
| **MRR** | Nó nằm ở **hạng mấy**? | Retrieval |
| **Từ khoá bắt buộc** | Câu trả lời có nói đúng ý không? | Sinh |
| **Trích dẫn hợp lệ** | Có dẫn nguồn, và nguồn có thật không? | Sinh |
| **Faithfulness** | Mọi khẳng định có được đoạn văn chống lưng không? | Sinh |

**Vì sao phải tách?** Vì khi điểm tụt, bạn cần biết đi sửa chỗ nào. `recall` tụt
là lỗi chunking/tìm kiếm. `recall` vẫn 1.00 mà câu trả lời thiếu ý là lỗi
prompt/model. **Một con số duy nhất không bao giờ nói cho bạn biết đi sửa chỗ nào**
— và người mới gặp điểm thấp gần như luôn lao vào sửa prompt.

**Điểm cộng:** cách đo faithfulness rẻ mà hiệu quả — kiểm **các con số** trong câu
trả lời có xuất hiện trong ngữ cảnh không. Phần lớn ảo giác về tài liệu nội bộ là
ảo giác về con số. Kèm giới hạn thành thật: nó không bắt được trường hợp model lấy
nhầm một con số **có thật nhưng ở đoạn khác** — chỗ đó cần LLM-as-judge.

</details>

---

## 12. ⭐ Bạn đổi cách tìm kiếm, điểm eval tăng từ 0.90 lên 0.94. Deploy được chưa?

<details><summary>Đáp án</summary>

**Chưa. Điểm trung bình tăng không loại trừ khả năng có câu đang đúng bị làm hỏng.**

Đây chính xác là tình huống ở câu 7: chuyển từ BM25 sang hybrid làm trung bình
tăng 0.90 → 0.94 **trong khi một câu mã lỗi đang chạy hoàn hảo tụt xuống 0.00**.

Phải so sánh **theo từng câu**:

```python
ss = so_sanh_cau_hinh(kq_truoc, kq_sau)
if ss["thoai_lui"]:
    # ĐỌC từng câu hỏng trước khi quyết định
```

**Và khi có thoái lui, việc tiếp theo KHÔNG phải là quay về cấu hình cũ.** Việc
tiếp theo là đọc từng câu hỏng rồi quyết định:

- Câu bị hỏng có thuộc loại người dùng hay hỏi không? (Nhân viên hỗ trợ kỹ thuật
  hỏi mã lỗi suốt ngày — nên nó **quan trọng hơn** trọng số 1/16 của nó trong bộ test.)
- Có cách nào lấy được cả hai không? (Định tuyến truy vấn theo regex.)

**Điểm cộng — hai ý làm câu trả lời nổi bật:**

- **Luôn kèm baseline.** "RAG đạt 0.85" vô nghĩa cho tới khi biết baseline. Một hệ
  thống *luôn từ chối* vẫn được điểm dương nhờ các câu `khong_co`.
- **Hỏi về cỡ mẫu.** Bộ test 16 câu thì một câu lật làm trung bình đổi ~6 điểm
  phần trăm — chênh lệch 0.90 với 0.94 có thể chỉ là **một câu hỏi duy nhất**. Bộ
  test thật nên có 50–200 câu.

> **Bộ eval không quyết định thay bạn.** Nó chỉ đảm bảo bạn quyết định trong lúc
> **biết** mình đang đánh đổi cái gì. Đó là ranh giới giữa kỹ sư và người chỉnh
> tham số theo cảm giác.

</details>

---

## Câu hỏi ngược nên hỏi nhà tuyển dụng

- "Team đang đo chất lượng RAG bằng cách nào? Có bộ câu hỏi vàng không, ai gán nhãn?"
- "Khi tài liệu nguồn thay đổi, quy trình cập nhật index là gì?"
- "Hệ thống hiện xử lý câu hỏi không có đáp án trong tài liệu ra sao?"

Ba câu này cho thấy bạn nghĩ về **vận hành và chất lượng**, không chỉ về việc
ghép thư viện.

---

[← Về mục lục phỏng vấn](README.md)
