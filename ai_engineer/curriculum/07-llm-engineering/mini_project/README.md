# 🛠 Mini-project Phase 07 — Trợ lý CSKH có tool use

**Thời gian:** 6–8 giờ (Tuần 18) · **Không có lời giải** · **Chi phí ước tính: < $1**

> Bài **khởi động** trước [project P5](../../../projects/P5-structured-extractor/README.md).
>
> Tuần 18 không có bài tập pytest riêng — vì tool use, streaming và caching chỉ thật sự
> hiểu được khi bạn ghép chúng lại thành **một sản phẩm chạy được**.

---

## Đề bài

Xây một trợ lý chăm sóc khách hàng cho một cửa hàng online. Trợ lý phải:

- tra cứu đơn hàng **thật** trong dữ liệu của bạn (tool use),
- trả lời theo **chính sách** của cửa hàng nạp từ file (prompt caching),
- in ra **từng chữ một** khi trả lời (streaming),
- và có **bộ eval** chứng minh nó hoạt động đúng (thứ quan trọng nhất).

```
mini_project/
├── du_lieu.py           # sinh đơn hàng giả + chính sách cửa hàng
├── cong_cu.py           # các tool: tra cứu đơn, huỷ đơn, tính phí ship
├── tro_ly.py            # class TroLy: vòng lặp tool use + caching + streaming
├── chay.py              # CLI hội thoại
├── eval_bo_test.py      # bộ test + hàm chấm
├── chay_eval.py         # chạy eval, in bảng kết quả, so sánh phiên bản
└── test_cong_cu.py      # ít nhất 8 test cho phần KHÔNG gọi API
```

> 📌 **Tách bạch quan trọng:** `cong_cu.py` là code Python thuần — test được bằng pytest, không cần key.
> Chỉ `tro_ly.py` mới chạm API. Giữ ranh giới này là một quyết định thiết kế, không phải tiểu tiết.

---

## Yêu cầu bắt buộc

### ① `du_lieu.py` — dữ liệu offline

- [ ] Sinh **≥ 30 đơn hàng** với `ma_don`, `trang_thai`, `ngay_dat`, `ngay_giao_du_kien`, `mat_hang`, `tong_tien`, `dia_chi`
- [ ] Trạng thái đa dạng: `dang_xu_ly`, `dang_giao`, `da_giao`, `da_huy`
- [ ] `CHINH_SACH` — văn bản chính sách **dài ≥ 2.500 token** (đổi trả, ship, hoàn tiền, bảo hành)
- [ ] Dùng `random.seed()` để chạy lại ra **y hệt**

> ⚠️ Chính sách phải đủ dài **có lý do**: dưới ngưỡng tối thiểu (2048 token với Haiku, 1024 với Sonnet/Opus)
> thì `cache_control` bị **bỏ qua im lặng** — bài học về caching sẽ không xảy ra và bạn không hề biết.

### ② `cong_cu.py` — tool và schema

```python
def tra_cuu_don(ma_don: str) -> dict: ...
def huy_don(ma_don: str) -> dict: ...
def tinh_phi_ship(tinh: str, khoi_luong_kg: float) -> dict: ...

TOOLS = [ ... ]   # input_schema đúng chuẩn JSON Schema
```

- [ ] Mã đơn không tồn tại → trả `{"loi": "..."}`, **không** ném exception
- [ ] `huy_don` **từ chối** khi đơn đã ở trạng thái `da_giao` hoặc `da_huy` — đây là quy tắc nghiệp vụ, không phải lỗi
- [ ] `description` của mỗi tool viết cho **model đọc**: nói rõ *khi nào dùng*, không chỉ *nó làm gì*
- [ ] Mỗi tham số trong `input_schema` cũng có `description` riêng
- [ ] `khoi_luong_kg` âm hoặc bằng 0 → trả lỗi rõ ràng

<details><summary>Vì sao description lại quan trọng đến vậy?</summary>

`description` là **thứ duy nhất** model dựa vào để chọn tool. Nó là prompt engineering, không phải tài liệu cho người đọc.

```python
# ❌ Model sẽ chọn nhầm
"description": "Huỷ đơn hàng"

# ✅
"description": ("Huỷ một đơn hàng theo mã đơn. Chỉ dùng khi khách NÓI RÕ muốn huỷ. "
                "Không dùng để tra cứu trạng thái. Sẽ thất bại nếu đơn đã giao xong.")
```

Khi model gọi sai tool, **phản xạ đầu tiên phải là sửa description** — không phải đổi sang model mạnh hơn.
</details>

### ③ `tro_ly.py` — class `TroLy`

```python
class TroLy:
    def __init__(self, model=MODEL_RE, dung_cache=True, prompt_he_thong=None): ...

    def hoi(self, cau: str, stream: bool = False) -> str: ...
    def reset(self): ...

    @property
    def chi_phi(self) -> dict: ...   # {"token_vao", "token_ra", "cache_ghi", "cache_doc", "usd"}
```

**Bắt buộc:**

- [ ] Vòng lặp tool use đầy đủ, có `max_vong` để **không lặp vô hạn**
- [ ] Append **nguyên** `response.content` vào `messages` — không phải chuỗi text
- [ ] Mọi khối `tool_use` đều có `tool_result` khớp `tool_use_id`
- [ ] Tool ném exception → gửi lỗi **về cho model** với `is_error: True`, chương trình **không sập**
- [ ] Lấy text bằng hàm duyệt danh sách khối, **không dùng** `content[0].text`
- [ ] Kiểm tra `stop_reason == "max_tokens"` và báo lỗi rõ ràng
- [ ] `cache_control` đặt trên khối chính sách (phần **tĩnh**), câu hỏi khách ở **sau**
- [ ] Cộng dồn `usage` qua **mọi** vòng lặp — không chỉ vòng cuối
- [ ] `stream=True` in ra từng chunk; vẫn phải gom đủ khối `tool_use` khi stream kết thúc

### ④ `chay.py` — CLI

```powershell
python chay.py --stream
```

```
Tro ly CSKH - go 'thoat' de ket thuc, 'chi phi' de xem thong ke

Ban: don DH1042 toi dau roi?
Tro ly: [tool: tra_cuu_don(ma_don='DH1042')]
Don DH1042 dang tren duong giao, du kien den ngay 26/08...

Ban: chi phi
  Token vao: 8.412  (cache doc: 6.100)
  Token ra:    391
  Tong:      $0.0043
```

- [ ] Hiện **tool nào được gọi** với tham số gì — người dùng phải thấy trợ lý đang làm gì
- [ ] Lệnh `chi phi` in thống kê tích luỹ
- [ ] `Ctrl+C` thoát sạch, không đổ traceback

### ⑤ `eval_bo_test.py` + `chay_eval.py` — ⭐ phần quan trọng nhất

- [ ] **≥ 12 test case**, chia nhãn `de` / `kho` / `bien`
- [ ] Có case **bẫy**: hỏi về đơn không tồn tại, yêu cầu huỷ đơn đã giao, câu hỏi không liên quan cửa hàng
- [ ] Có case cần **hai tool liên tiếp** (tra cứu đơn rồi tính phí ship về địa chỉ của đơn đó)
- [ ] Hàm chấm ba mức: đúng tool được gọi / có từ khoá bắt buộc / không bịa thông tin
- [ ] **Baseline**: một trợ lý *không có tool* — chứng minh tool thật sự đóng góp
- [ ] `so_sanh_phien_ban(v1, v2)` phát hiện **thoái lui theo từng case**
- [ ] Chạy eval với `temperature=0` (hoặc bỏ `temperature` nếu model không nhận) để tái lập được

```powershell
python chay_eval.py --luu ket_qua_v1.json
# sửa prompt hệ thống...
python chay_eval.py --luu ket_qua_v2.json --so-sanh ket_qua_v1.json
```

```
TONG: 0.88 (11/12.5)   baseline khong tool: 0.31

  de   4/4    1.00
  kho  4/5    0.72
  bien 3/3    0.95

So voi v1 (0.62):
  ✅ Cai thien: huy_don_da_giao, hai_tool, don_khong_ton_tai
  ⚠️  THOAI LUI: cau_hoi_lac_de  1.00 -> 0.00
```

> ⚠️ **Điểm trung bình tăng KHÔNG có nghĩa là deploy được.** Bảng trên là ví dụ thật của cái bẫy đó:
> trung bình nhảy từ 0.62 lên 0.88 trong khi một case đang chạy tốt đã hỏng. Nếu chỉ nhìn con số tổng,
> bạn deploy mà không hề biết. Đây chính là bài học của [notebook 04](../lessons/04_eval.ipynb).

### ⑥ `test_cong_cu.py` — ≥ 8 test, không cần API key

- [ ] `tra_cuu_don` với mã hợp lệ trả đủ khoá
- [ ] Mã không tồn tại → có khoá `loi`, không ném exception
- [ ] `huy_don` trên đơn `dang_xu_ly` → thành công
- [ ] `huy_don` trên đơn `da_giao` → bị từ chối, và **trạng thái đơn không đổi**
- [ ] `huy_don` hai lần → lần hai bị từ chối
- [ ] `tinh_phi_ship` với khối lượng âm → lỗi
- [ ] Mỗi tool trong `TOOLS` có `name`, `description`, `input_schema` với `required` hợp lệ
- [ ] Tên trong `TOOLS` khớp đúng các hàm thật sự tồn tại

> Test cuối cùng bắt một lỗi rất hay xảy ra: bạn đổi tên hàm mà quên sửa `TOOLS`. Model sẽ gọi
> một tool không tồn tại và bạn chỉ phát hiện lúc chạy thật.

---

## Nâng cao

- [ ] **Đo caching thật:** chạy 5 câu hỏi, in `cache_read_input_tokens` từng lượt, tính tiền tiết kiệm được
- [ ] Cố tình nhét timestamp vào **đầu** system prompt → xem cache trượt hoàn toàn, rồi sửa lại
- [ ] So sánh **Haiku 4.5 vs Sonnet 5** trên cùng bộ eval: điểm bao nhiêu, tiền bao nhiêu, có đáng không
- [ ] Cắt lịch sử khi hội thoại dài (giữ N lượt gần nhất) — đo chi phí trước/sau
- [ ] Structured output cho một tool: buộc model tóm tắt đơn thành JSON đúng schema
- [ ] Thêm tool `gui_email_xac_nhan` **giả lập** — và bắt trợ lý luôn hỏi xác nhận trước khi gọi

---

## ✅ Tự chấm

| Tiêu chí | Đạt khi |
|---|---|
| **Vòng lặp tool đúng** | Có `max_vong`, append nguyên `content`, `tool_use_id` khớp |
| **Không sập** | Tool lỗi → model nhận `is_error` và tự phục hồi |
| **Caching hoạt động** | In được `cache_read` > 0 từ lượt thứ hai |
| **Theo dõi chi phí** | Cộng dồn qua mọi vòng lặp, số tiền hợp lý |
| **Có eval** | ≥ 12 case, có baseline, phát hiện được thoái lui |
| **Có test** | ≥ 8 test, `pytest` xanh, chạy được **không cần key** |

> Hai dòng cuối là hai dòng quan trọng nhất. Một trợ lý chạy được mà không có eval thì bạn
> **không biết** nó đúng hay may — và bạn cũng không thể cải tiến nó, vì không có gì để so sánh.

---

## 💡 Gợi ý

<details><summary>Khung vòng lặp tool use</summary>

```python
def hoi(self, cau: str) -> str:
    self.messages.append({"role": "user", "content": cau})

    for _ in range(self.max_vong):
        r = self.client.messages.create(
            model=self.model,
            max_tokens=1024,
            system=self.system,           # có cache_control ở đây
            tools=TOOLS,
            messages=self.messages,
        )
        self._cong_don_usage(r.usage)     # MỌI vòng, không chỉ vòng cuối
        self.messages.append({"role": "assistant", "content": r.content})   # NGUYÊN content

        if r.stop_reason != "tool_use":
            return van_ban(r)

        ket_qua = []
        for khoi in r.content:
            if khoi.type != "tool_use":
                continue
            try:
                out = HAM[khoi.name](**khoi.input)
                ket_qua.append({"type": "tool_result", "tool_use_id": khoi.id,
                                "content": json.dumps(out, ensure_ascii=False)})
            except Exception as e:
                ket_qua.append({"type": "tool_result", "tool_use_id": khoi.id,
                                "content": f"Loi: {e}", "is_error": True})

        self.messages.append({"role": "user", "content": ket_qua})   # vai trò "user"

    return "Xin loi, toi khong xu ly duoc yeu cau nay."
```

Bốn chỗ dễ sai đã được đánh dấu bằng comment. Nếu trợ lý của bạn "quên" mất nó vừa gọi tool gì,
gần như chắc chắn bạn đã append text thay vì `r.content`.
</details>

<details><summary>Đặt cache_control ở đâu?</summary>

```python
system = [
    {"type": "text",
     "text": "Bạn là trợ lý CSKH của cửa hàng X. Trả lời ngắn gọn, lịch sự.\n\n" + CHINH_SACH,
     "cache_control": {"type": "ephemeral"}},
]
```

Mọi thứ **trước** điểm đánh dấu được cache. Vì thế phần **tĩnh** (hướng dẫn + chính sách) phải nằm
**trước**, còn phần **động** (câu hỏi khách) nằm trong `messages` — tức là sau.

**Cách kiểm tra duy nhất:**

```python
print(r.usage.cache_creation_input_tokens, r.usage.cache_read_input_tokens)
```

Lượt 1: ghi > 0, đọc = 0. Lượt 2 trở đi: **đọc phải > 0**. Nếu lượt 2 mà đọc vẫn bằng 0 →
cache đang trượt. Hai nguyên nhân thường gặp: (1) có gì đó thay đổi trong tiền tố, (2) chính sách
của bạn chưa đủ dài so với ngưỡng tối thiểu.
</details>

<details><summary>Chấm điểm thế nào khi đầu ra là văn xuôi tự do?</summary>

Đừng cố so khớp chuỗi chính xác — đầu ra không tất định. Chấm theo **ba mức**, cộng lại:

```python
def cham(dau_ra: str, tool_da_goi: list[str], mong_doi: dict) -> float:
    diem = 0.0
    # ① đúng tool (quan trọng nhất)
    if set(tool_da_goi) == set(mong_doi["tool"]):
        diem += 0.5
    # ② có thông tin bắt buộc
    if all(tu.lower() in dau_ra.lower() for tu in mong_doi["phai_co"]):
        diem += 0.3
    # ③ không bịa
    if not any(tu.lower() in dau_ra.lower() for tu in mong_doi.get("khong_duoc_co", [])):
        diem += 0.2
    return diem
```

Mức ① đo *hành vi*, mức ② đo *nội dung*, mức ③ bắt **ảo giác** — mức mà người mới hay quên nhất.

Với case "đơn không tồn tại", `khong_duoc_co` nên chứa các trạng thái hợp lệ như `"dang giao"`:
nếu chúng xuất hiện thì model đang **bịa ra** một đơn hàng không có thật.
</details>

<details><summary>Streaming mà vẫn dùng được tool?</summary>

```python
with self.client.messages.stream(**kwargs) as s:
    for text in s.text_stream:
        print(text, end="", flush=True)
    r = s.get_final_message()      # đủ content, stop_reason, usage
```

`text_stream` chỉ trả phần **text**. Các khối `tool_use` được ráp lại đầy đủ trong
`get_final_message()` — nên vòng lặp tool phía sau giữ nguyên, không cần viết lại.

> Mẹo trình bày: khi `stop_reason == "tool_use"`, in một dòng `[đang tra cứu...]` trước khi chạy tool.
> Người dùng không thấy gì trong lúc chờ sẽ tưởng chương trình treo.
</details>

---

## 📌 Nộp bài

```powershell
pytest curriculum/07-llm-engineering/mini_project -v
python chay_eval.py --luu ket_qua_cuoi.json
git add .
git commit -m "Mini-project phase 07: tro ly CSKH co tool use"
git push
```

Bài test khắt khe nhất cho project này:

> Đưa trợ lý cho một người **không biết code** dùng thử 10 phút.
> Ghi lại mọi câu nó trả lời sai — rồi **biến từng câu đó thành một test case** trong bộ eval.

Đó chính xác là cách một team LLM thật sự làm việc.

---

⬅️ [Phase 07](../README.md) · ➡️ [🎯 Project P5 — Structured Extractor](../../../projects/P5-structured-extractor/README.md)
