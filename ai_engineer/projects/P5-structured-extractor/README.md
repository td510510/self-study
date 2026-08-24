# 🎯 P5 · Structured Extractor

**Làm khi:** xong Phase 07 (Tuần 19) · **Thời gian:** 12–16 giờ · **Chi phí ước tính: $1–3**

---

## Mục tiêu

Xây một hệ thống **trích xuất dữ liệu có cấu trúc** từ văn bản tự do — và chứng minh bằng số rằng nó hoạt động.

> **Đây là project "đi làm được" nhất trong chương trình.** Rất nhiều công việc AI Engineer thật sự
> chỉ là bài toán này: có một đống văn bản lộn xộn, cần biến thành bảng để đưa vào hệ thống khác.
>
> Điều tách bạn ra khỏi người khác **không phải** là bạn gọi được API. Mà là bạn trả lời được:
> *"Nó đúng bao nhiêu phần trăm, sai ở trường nào, và tốn bao nhiêu tiền cho 1.000 bản ghi?"*

---

## Chọn miền dữ liệu

Chọn **một** miền và làm cho tới. Đừng làm ba miền hời hợt.

| Miền | Đầu vào | Trích ra |
|---|---|---|
| 🟢 **Tin tuyển dụng** | Bài đăng tuyển dụng | Vị trí, cấp bậc, kỹ năng, lương, địa điểm, remote? |
| 🟢 **Email đặt hàng** | Email khách gửi | Mặt hàng, số lượng, địa chỉ, thời gian mong muốn |
| 🟡 **Hoá đơn / biên lai** | Text hoá đơn | Người bán, ngày, các dòng hàng, thuế, tổng |
| 🟡 **Đơn thuốc / bệnh án** | Ghi chú y tế | Thuốc, liều, tần suất, thời gian dùng |
| 🔴 **CV ứng viên** | CV dạng text | Học vấn, kinh nghiệm, kỹ năng, số năm |

> ⚠️ **Không dùng dữ liệu cá nhân thật.** CV thật, hoá đơn thật, bệnh án thật đều là dữ liệu cá nhân —
> gửi lên API là một quyết định về quyền riêng tư, không phải chi tiết kỹ thuật. Hãy **tự sinh** dữ liệu
> mẫu, hoặc dùng dữ liệu công khai đã ẩn danh. Nếu ở công ty bạn có dữ liệu thật, hãy **hỏi trước**.

---

## Deliverable

```
projects/P5-structured-extractor/
├── README.md            # BÁO CÁO (có bảng số, không chỉ mô tả)
├── schema.py            # model Pydantic — nguồn sự thật duy nhất
├── trich_xuat.py        # class TrichXuat: gọi API, validate, retry
├── du_lieu/
│   ├── mau.jsonl        # ≥ 40 văn bản đầu vào
│   └── nhan.jsonl       # nhãn đúng do BẠN gán tay
├── eval.py              # chấm theo TỪNG TRƯỜNG + tổng hợp
├── chay.py              # CLI: 1 file hoặc cả thư mục → JSONL
├── phan_tich.ipynb      # biểu đồ, ma trận lỗi, phân tích chi phí
└── test_schema.py       # ≥ 10 test, chạy không cần API key
```

---

## Yêu cầu

### ① `schema.py` — schema là nguồn sự thật

- [ ] Model Pydantic có **≥ 8 trường**, đủ các kiểu: `str`, `int`/`float`, `bool`, `Enum`, `list[...]`, và **ít nhất một trường lồng nhau**
- [ ] **Ít nhất 2 trường `Optional`** — vì văn bản thật thường thiếu thông tin
- [ ] Mỗi trường có `description` — model đọc nó, nên viết cho model
- [ ] Có `Field` ràng buộc: `ge=0` cho tiền, `max_length`, giá trị hợp lệ cho enum
- [ ] Có **validator** kiểm tra ràng buộc chéo (ví dụ `luong_min <= luong_max`)

<details><summary>Vì sao Optional lại quan trọng đến thế?</summary>

Nếu một trường bắt buộc nhưng văn bản không hề có thông tin đó, model **buộc phải điền gì đó** —
và nó sẽ **bịa**. Bạn vừa tự tay tạo ra ảo giác bằng schema của mình.

```python
luong_min: int | None = Field(None, description="Lương tối thiểu, VND/tháng. None nếu tin không ghi.")
```

Câu `"None nếu tin không ghi"` trong description quan trọng ngang chính kiểu dữ liệu.
**Cho model một lối thoát hợp lệ, nó sẽ dùng lối thoát đó thay vì bịa.**
</details>

### ② `trich_xuat.py` — lớp trích xuất

```python
class TrichXuat:
    def __init__(self, model=MODEL_RE, prompt_phien_ban="v1"): ...

    def mot(self, van_ban: str) -> KetQua: ...          # KetQua: thành công HOẶC lỗi
    def nhieu(self, ds: list[str]) -> list[KetQua]: ...

    @property
    def thong_ke(self) -> dict: ...   # số lần gọi, token, tiền, số lần retry
```

- [ ] Dùng **structured output** (`output_config` / `client.messages.parse()`), không phải "hãy trả JSON"
- [ ] **Không bao giờ ném exception ra ngoài** — trả về `KetQua` có `.ok` / `.loi`. Một bản ghi hỏng không được làm chết cả lô 500 bản ghi
- [ ] Kiểm tra `stop_reason == "max_tokens"` và coi đó là lỗi, không phải kết quả
- [ ] Phân biệt lỗi **thử lại được** (429, 5xx, mạng) với lỗi **không** (400, 401, 404)
- [ ] Cộng dồn token và chi phí qua mọi lần gọi, kể cả lần retry
- [ ] `prompt_phien_ban` cho phép giữ **nhiều phiên bản prompt** cùng lúc — để so sánh chứ không phải sửa đè

### ③ Dữ liệu (`du_lieu/`) — phần tốn công nhất, và đáng nhất

- [ ] **≥ 40 văn bản** đầu vào, độ dài đa dạng
- [ ] **≥ 8 case khó** cố ý: thiếu thông tin, thông tin mâu thuẫn, viết tắt, sai chính tả, lẫn tiếng Anh, số viết bằng chữ ("hai mươi triệu")
- [ ] **≥ 3 case biên**: văn bản rỗng, văn bản hoàn toàn lạc đề, văn bản dài bất thường
- [ ] `nhan.jsonl` — nhãn đúng **do bạn gán tay**, cùng schema

> ⚠️ **Đừng dùng model để tạo nhãn rồi chấm chính model đó.** Bạn sẽ chỉ đo được model có nhất quán với
> chính nó hay không — không đo được nó **đúng** hay không. Gán tay 40 bản ghi mất khoảng 2 giờ.
> Hai giờ đó là thứ làm project này có giá trị.

> 💡 Trong lúc gán tay, bạn sẽ **liên tục phải quyết định** những ca mập mờ. Ghi lại các quyết định đó
> vào một file `quy_uoc_gan_nhan.md` — rồi đưa chính các quy ước đó vào prompt. Đây là vòng lặp
> quan trọng nhất của bài toán trích xuất, và nó chỉ xuất hiện khi bạn tự gán nhãn.

### ④ `eval.py` — ⭐ trái tim của project

- [ ] Chấm **theo từng trường**, không chỉ "cả bản ghi đúng/sai"
- [ ] Ba loại lỗi tách riêng: **sai giá trị** / **thiếu** (đáng ra có mà trả None) / **bịa** (đáng ra None mà điền)
- [ ] So sánh có khoan dung cho `str` (bỏ hoa thường, khoảng trắng thừa), **chặt** cho số và enum
- [ ] `list` chấm bằng độ chồng lấn (Jaccard hoặc precision/recall), không đòi đúng thứ tự
- [ ] **Baseline bắt buộc**: heuristic không dùng LLM (regex + từ khoá) — với vài trường nó có thể **thắng** LLM
- [ ] `so_sanh_phien_ban(v1, v2)` phát hiện thoái lui **theo từng bản ghi và từng trường**
- [ ] `temperature=0` (hoặc bỏ hẳn nếu model không nhận) để tái lập

```
=== EVAL v2  (model=claude-haiku-4-5, n=40) ===

Truong          Dung   Sai   Thieu   Bia    Diem
vi_tri           38     2      0       0     0.95
cap_bac          31     7      2       0     0.78
luong_min        29     3      6       2     0.72   <-- 2 lan BIA
ky_nang          --     --     --      --    0.81   (Jaccard)
remote           40     0      0       0     1.00

TONG: 0.85    baseline regex: 0.41
Chi phi: $0.31 cho 40 ban ghi  ->  ~$7.75 / 1.000 ban ghi
```

> Bảng này — chứ không phải đoạn code — là thứ bạn đưa cho nhà tuyển dụng xem.

### ⑤ `chay.py` — CLI

```powershell
python chay.py --file du_lieu/mau.jsonl --ra ket_qua.jsonl --model claude-haiku-4-5
python chay.py --text "Tuyen Backend Python 3 nam kinh nghiem, HN, 25-35tr"
```

- [ ] Xử lý được cả một file lô lẫn một chuỗi đơn lẻ
- [ ] Ghi kết quả ra JSONL, **kèm cả các bản ghi lỗi** với lý do lỗi
- [ ] In tiến độ và **tổng chi phí** khi xong
- [ ] `--gioi-han N` để thử trên vài bản ghi trước khi chạy cả lô *(thói quen tiết kiệm tiền)*

### ⑥ `phan_tich.ipynb`

- [ ] Biểu đồ điểm **theo từng trường** — chỉ ra ngay trường nào yếu nhất
- [ ] **Đọc tay ít nhất 5 bản ghi sai** và phân loại nguyên nhân. Đây là phần có giá trị nhất của notebook
- [ ] So sánh **≥ 2 phiên bản prompt**, có bảng thoái lui theo từng case
- [ ] So sánh **≥ 2 model** (ví dụ Haiku 4.5 vs Sonnet 5): điểm, chi phí, độ trễ — rồi **kết luận nên dùng cái nào và vì sao**
- [ ] Ngoại suy chi phí cho 1.000 và 100.000 bản ghi
- [ ] Đo tác động của **prompt caching** nếu prompt của bạn đủ dài

### ⑦ `test_schema.py` — ≥ 10 test, không cần API key

- [ ] Schema chấp nhận một bản ghi hợp lệ đầy đủ
- [ ] Schema chấp nhận bản ghi thiếu các trường Optional
- [ ] Schema **từ chối** enum sai, số âm, `luong_min > luong_max`
- [ ] Hàm chấm: hai bản ghi giống hệt → 1.0
- [ ] Hàm chấm: phân biệt đúng **thiếu** với **bịa** (đây là test dễ sai nhất)
- [ ] Hàm chấm: `list` khác thứ tự vẫn tính là khớp
- [ ] So sánh chuỗi khoan dung hoa thường/khoảng trắng
- [ ] `so_sanh_phien_ban` phát hiện được thoái lui khi trung bình vẫn **tăng**

### ⑧ Báo cáo (README.md của bạn)

```markdown
# Trích xuất <loại dữ liệu> bằng Claude

## Vấn đề
Đầu vào là gì, ai cần bảng đầu ra này, thủ công thì tốn bao lâu.

## Dữ liệu
40 bản ghi, nguồn, cách gán nhãn, các quy ước xử lý ca mập mờ.

## Cách tiếp cận
Schema, prompt, structured output, cách xử lý lỗi.

## Kết quả
[BẢNG điểm theo từng trường] + baseline + chi phí / 1.000 bản ghi.

## Sai ở đâu
5 ví dụ sai thật, phân loại nguyên nhân, cách bạn đã sửa (hoặc vì sao chưa sửa được).

## So sánh model
Bảng: điểm / chi phí / độ trễ. Kết luận chọn cái nào.

## Hạn chế
Nó KHÔNG dùng được cho trường hợp nào.

## Bài học
```

---

## ✅ Tiêu chí chấm

| Hạng mục | Điểm | Đạt khi |
|---|---|---|
| **Schema tốt** | 15 | ≥ 8 trường đủ kiểu, có Optional, có validator, có description viết cho model |
| **Trích xuất bền** | 20 | Structured output, không sập vì 1 bản ghi lỗi, phân loại lỗi retry được |
| **Dữ liệu + nhãn tay** | 15 | ≥ 40 bản ghi, có case khó và case biên, nhãn do người gán |
| **Eval theo trường** | 25 | Tách sai/thiếu/bịa, có baseline, bắt được thoái lui |
| **Phân tích** | 15 | Đọc tay bản ghi sai, so sánh model, ngoại suy chi phí |
| **Báo cáo** | 10 | Có số thật, có phần hạn chế trung thực |

**Tự chấm mức độ:**

| Mức | Dấu hiệu |
|---|---|
| ❌ Chưa đạt | Gọi được API, chưa có nhãn hoặc chưa có eval |
| ⚠️ Tạm được | Có eval nhưng chỉ đo "cả bản ghi đúng/sai", không có baseline |
| ✅ Tốt | Eval theo trường, có baseline, có so sánh phiên bản prompt |
| 🌟 Xuất sắc | Thêm so sánh model + phân tích chi phí + đã sửa được một lỗi nhờ chính eval chỉ ra |

> Dấu hiệu 🌟 quan trọng nhất: **bộ eval của bạn đã tìm ra một lỗi mà bạn không tự nhìn thấy.**
> Nếu điều đó xảy ra, bạn đã thật sự hiểu vì sao cần eval.

---

## 💡 Bảy lỗi người mới hay mắc

| Lỗi | Triệu chứng | Cách sửa |
|---|---|---|
| **Xin JSON trong prompt** | Thỉnh thoảng có rào ```json hoặc văn xuôi kèm theo | Dùng `output_config` với JSON schema |
| **Mọi trường đều bắt buộc** | Model bịa số lương cho tin không ghi lương | Cho `Optional` + description "None nếu không có" |
| **Không kiểm `stop_reason`** | Lỗi parse JSON ngẫu nhiên | `max_tokens` = output bị cắt, tăng `max_tokens` |
| **Một bản ghi lỗi giết cả lô** | Chạy 500 bản, chết ở bản 137 | Trả `KetQua` có lỗi, không ném exception |
| **Nhãn do model tạo** | Điểm eval đẹp bất thường (> 0.95) | Gán tay — đo được *đúng*, không phải *nhất quán* |
| **Chỉ đo đúng/sai cả bản ghi** | Điểm 0.4, không biết sửa gì | Chấm theo từng trường mới biết trường nào yếu |
| **Không có baseline** | "Model đạt 85%" | Viết heuristic regex — đôi khi nó thắng LLM ở vài trường |

> ⚠️ Lỗi **"nhãn do model tạo"** là lỗi tinh vi nhất và cũng phổ biến nhất. Nếu điểm eval của bạn
> cao bất thường ngay từ lần chạy đầu, hãy nghi ngờ bộ nhãn trước khi ăn mừng.

---

## 🌟 Thử thách thêm

- [ ] **LLM-as-judge** cho một trường văn xuôi (ví dụ "tóm tắt yêu cầu") — rồi kiểm tra chính judge đó bằng cách cho nó chấm các ca bạn đã biết đáp án
- [ ] **Confidence**: bắt model tự chấm độ chắc chắn cho mỗi trường, xem nó có tương quan với đúng/sai thật không *(thường là không — và đó là một phát hiện đáng viết vào báo cáo)*
- [ ] Chạy **3 lần** cùng một bản ghi rồi lấy đa số (self-consistency) — đắt hơn bao nhiêu, tốt hơn bao nhiêu?
- [ ] **Batch API** cho lô lớn — rẻ hơn 50%
- [ ] Pipeline hai bước: bước 1 phân loại loại văn bản, bước 2 dùng schema riêng cho từng loại
- [ ] Giao diện Gradio: dán văn bản → xem JSON + trường nào model không chắc
- [ ] Nếu miền của bạn có ảnh (hoá đơn chụp): thử **vision** và so với trích xuất từ text

---

## 📌 Nộp bài

```powershell
pytest projects/P5-structured-extractor -v
python chay.py --file du_lieu/mau.jsonl --ra ket_qua.jsonl
git add .
git commit -m "P5: structured extractor + eval"
git push
```

Bài test khắt khe nhất cho project này:

> Một người quản lý hỏi bạn: **"Dùng cái này cho 10.000 bản ghi được không?"**
>
> Bạn phải trả lời được trong 2 phút, bằng **số**: độ chính xác từng trường, trường nào chưa dùng được,
> chi phí, thời gian, và bao nhiêu bản ghi vẫn cần người kiểm lại.

Nếu bạn trả lời được câu đó, bạn đã là AI Engineer — chứ không phải người biết gọi API.

---

⬅️ [Phase 07](../../curriculum/07-llm-engineering/README.md) · ➡️ [Phase 08 — RAG](../../curriculum/08-rag/README.md)
