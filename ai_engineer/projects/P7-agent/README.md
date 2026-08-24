# 🎯 P7 · AI Agent nhiều bước

**Làm khi:** xong Phase 09 (Tuần 22) · **Thời gian:** 16–20 giờ · **Chi phí: $2–5**

> 📌 Đây là project **cuối cùng trước Capstone**, và là project khó nhất.
> Nó cũng là project mà nhà tuyển dụng hỏi kỹ nhất — vì rất ít người làm agent
> đến mức có bộ eval và guardrail thật.

---

## Mục tiêu

Xây một agent **làm được việc thật trong miền của bạn**, có kiểm soát an toàn
đầy đủ, và **chứng minh bằng số** rằng nó vừa hữu ích vừa không nguy hiểm.

> Ai cũng dựng được một agent gọi vài công cụ, và nó sẽ *chạy*.
> Thứ tách bạn ra khỏi đám đông là trả lời được:
> **"nó làm đúng bao nhiêu phần trăm, nó đã cố làm gì sai mà bị chặn, tốn bao
> nhiêu tiền mỗi nhiệm vụ, và bạn biết điều đó bằng cách nào?"**

---

## Chọn miền việc

Chọn **một** miền và làm cho tới. Yêu cầu bắt buộc: agent phải có **ít nhất 2
công cụ thay đổi thứ gì đó**, nếu không thì đây chỉ là RAG có thêm bước.

| Mức | Miền | Ghi chú |
|---|---|---|
| 🟢 **Tối thiểu** | Mở rộng `the_gioi.py` của Phase 09 | Thêm công cụ, thêm quy tắc nghiệp vụ |
| 🟡 **Nên làm** | Trợ lý trên **dữ liệu giả của công việc bạn** | Quản lý task, lịch, kho, vé hỗ trợ |
| 🔴 **Tốt nhất cho CV** | Agent thao tác trên **hệ thống thật của bạn** | Git repo cá nhân, file hệ thống, API công khai |

Vài ý tưởng đã được kiểm chứng là vừa sức:

| Agent | Công cụ đọc | Công cụ thay đổi |
|---|---|---|
| **Quản lý task** | liệt kê, tìm, xem chi tiết | tạo, đổi trạng thái, gán người |
| **Trợ lý repo** | đọc file, tìm kiếm, `git log` | tạo nhánh, sửa file, commit |
| **Vận hành kho** | tra tồn, xem đơn | đặt hàng, cập nhật đơn, gửi thông báo |
| **Trợ lý lịch** | xem lịch, tìm chỗ trống | tạo lịch hẹn, huỷ, gửi lời mời |

> ⚠️ **Về an toàn dữ liệu:** nếu agent thao tác trên hệ thống thật, hãy chạy nó
> trên **bản sao** hoặc **tài khoản riêng** cho tới khi bộ eval của bạn xanh.
> Đây không phải lời khuyên hình thức — mục 5 của Phase 09 tồn tại vì lý do này.
>
> Với agent thao tác trên Git: dùng repo test, và **không bao giờ** cho nó
> `push --force` hay quyền xoá nhánh.

---

## Deliverable

```
projects/P7-agent/
├── README.md            # BÁO CÁO (có bảng số, không chỉ mô tả)
├── the_gioi.py          # hoặc lớp bọc quanh hệ thống thật của bạn
├── cong_cu.py           # schema + đăng ký + hai thuộc tính an toàn
├── kiem_soat.py         # bốn cửa + nhật ký kiểm toán
├── agent.py             # vòng lặp: gọi Claude, nén ngữ cảnh, phát hiện lặp
├── chay.py              # CLI cho người thật dùng
├── eval/
│   ├── bo_test.json     # >= 20 ca do BẠN viết
│   └── chay_eval.py     # chấm đường đi + so sánh phiên bản
├── phan_tich.ipynb      # biểu đồ, phân tích lỗi, chi phí
└── test_agent.py        # >= 15 test, chạy không cần API key
```

---

## Yêu cầu

### ① `cong_cu.py` — từ 5 đến 10 công cụ

- [ ] **≥ 5 công cụ**, trong đó **≥ 2 công cụ thay đổi thứ gì đó**
- [ ] **≥ 1 công cụ không hoàn tác được** — đây là chỗ guardrail thực sự có ý nghĩa
- [ ] Mỗi công cụ khai báo `doi_the_gioi` và `hoan_tac_duoc` ngay khi viết
- [ ] `description` nói rõ **dùng khi nào** và **không dùng để làm gì**
- [ ] Công cụ nguy hiểm mở đầu mô tả bằng cảnh báo viết hoa
- [ ] Mọi công cụ **idempotent** ở mức có thể — gọi hai lần không hại thêm

### ② `kiem_soat.py` — bốn cửa

- [ ] Đúng thứ tự **quyền → tham số → ngân sách → xác nhận**
- [ ] `kiem_tra_tham_so` cho **mọi** công cụ, không tin gì model gửi tới
- [ ] Ít nhất một kiểm tra **giá trị vô lý** (số quá lớn, ngày quá xa, đường dẫn ra ngoài thư mục cho phép)
- [ ] Mặc định an toàn: thiếu hàm xác nhận → **từ chối**
- [ ] Hành động thất bại **không** tính vào ngân sách
- [ ] **Nhật ký kiểm toán** ghi ra file, không chỉ trong bộ nhớ

> ⭐ Nhật ký kiểm toán là thứ bạn sẽ mang ra khoe trong phỏng vấn. Nó trả lời
> *"agent đã cố làm gì mà bị chặn?"* — và câu trả lời đó cho thấy bạn hiểu hệ
> thống của mình ở mức mà rất ít ứng viên đạt tới.

### ③ `agent.py` — vòng lặp

- [ ] Gọi Claude thật với `tools=`, vòng lặp `stop_reason == "tool_use"`
- [ ] Append **nguyên** `response.content` vào `messages`, không phải chuỗi text
- [ ] Mọi khối `tool_use` có `tool_result` khớp `tool_use_id`
- [ ] Tool lỗi → gửi lỗi **về cho model** với `is_error: True`
- [ ] `max_vong` bắt buộc + **phát hiện lặp**, dừng sớm khi kẹt
- [ ] **Nén ngữ cảnh** khi vượt ngưỡng: rút gọn → tóm tắt → cắt
- [ ] Cộng dồn token và chi phí qua **mọi** vòng
- [ ] Kiểm `stop_reason == "max_tokens"` và coi đó là lỗi
- [ ] Prompt và cấu hình có **số phiên bản** — để so sánh được về sau

### ④ `eval/` — ⭐⭐ trái tim của project

- [ ] **≥ 20 ca test do bạn viết**, phân loại rõ ràng
- [ ] **≥ 6 ca `bay`**, gồm đủ bốn kiểu:
  - Người dùng **hỏi** về hành động (agent không được làm)
  - Hành động **bất khả thi** — đúng là thất bại lịch sự
  - Yêu cầu **mơ hồ** — agent phải hỏi lại, không đoán
  - Yêu cầu **vượt quyền** so với chính sách đang chạy
- [ ] **≥ 3 ca nhiều bước**, bước sau phụ thuộc kết quả bước trước
- [ ] **≥ 1 ca prompt injection**: dữ liệu chứa câu lệnh giả dạng chỉ dẫn
- [ ] **Thế giới mới cho mỗi ca**
- [ ] Chấm đường đi + **gọi công cụ bị cấm = 0 tuyệt đối**
- [ ] Báo cáo **ba chỉ số**: điểm, số bước, số hành động đổi thế giới
- [ ] So sánh **theo từng ca** giữa hai phiên bản, phát hiện thoái lui

```
=== EVAL v3  (chính sách: bình thường, haiku-4-5, max_vòng=8) ===

loại            n   điểm   bước   đổi t.giới   ghi chú
de              6   0.97    2.2          0.0
thay_doi        5   0.88    3.0          1.0
bay             6   0.83    1.7          0.2   1 ca làm việc bị cấm
nhieu_buoc      3   0.73    4.7          1.3
injection       1   1.00    1.0          0.0   không làm theo dữ liệu
TỔNG           21   0.88    2.7          0.5

Chi phí: $0.031 / nhiệm vụ  ->  ~$31 / 1.000 nhiệm vụ
Bị chặn: 7 lần (tham_so=4, xac_nhan=2, quyen=1)

So với v2 (0.84):
  ✅ Cải thiện: 4 ca    ⚠️  THOÁI LUI: 2 ca (hoi_ve_huy, yeu_cau_mo_ho)
```

> ⚠️ Dòng **"Bị chặn: 7 lần"** quan trọng ngang dòng điểm. Nó nói rằng guardrail
> của bạn **đang thực sự làm việc**. Một agent chưa bao giờ bị chặn lần nào thì
> hoặc là hoàn hảo, hoặc là guardrail của bạn không hoạt động — và khả năng thứ
> hai cao hơn nhiều.

### ⑤ `chay.py` — CLI

- [ ] Hiện **từng bước agent đang làm**, không để người dùng nhìn màn hình trống
- [ ] Câu xác nhận kèm **hậu quả cụ thể**, đủ để người nói KHÔNG
- [ ] Lệnh `chi phi` và `nhat ky` in thống kê phiên
- [ ] Cờ `--dry-run`: hiện agent *định* làm gì mà không thực hiện
- [ ] `Ctrl+C` thoát sạch, không đổ traceback

### ⑥ `phan_tich.ipynb`

- [ ] Điểm **theo từng loại ca** — chỉ ra ngay loại nào yếu nhất
- [ ] **Đọc tay ít nhất 5 đường đi sai** và phân loại nguyên nhân *(phần giá trị nhất)*
- [ ] Phân bố **số bước** — có ca nào đi lòng vòng bất thường không?
- [ ] Thống kê **lý do bị chặn** — chỗ nào model hay hiểu sai nhất?
- [ ] So sánh **≥ 2 model** (Haiku 4.5 vs Sonnet 5): điểm, số bước, chi phí, độ trễ → **kết luận chọn cái nào**
- [ ] So sánh **≥ 2 chính sách** (chỉ đọc vs bình thường): mất bao nhiêu khả năng, đổi lấy bao nhiêu an toàn?
- [ ] Ngoại suy chi phí cho 1.000 nhiệm vụ

### ⑦ `test_agent.py` — ≥ 15 test, không cần API key

- [ ] Vòng lặp: `max_vong`, model lỗi giữa chừng, quyết định sai định dạng
- [ ] Công cụ: tên sai, tham số sai, exception — **không cái nào được bay ra ngoài**
- [ ] Guardrail: đủ bốn cửa, đúng thứ tự, mặc định an toàn
- [ ] **Hậu quả**: mỗi test chặn phải kiểm cả **trạng thái thế giới không đổi**
- [ ] Nén ngữ cảnh: rút gọn/tóm tắt/cắt và đường lui khi tóm tắt hỏng
- [ ] Phát hiện lặp: trùng tên + tham số, thứ tự khoá không ảnh hưởng
- [ ] Chấm điểm: công cụ bị cấm = 0 tuyệt đối
- [ ] Eval: một ca lỗi không làm dừng cả bộ

### ⑧ Báo cáo (README.md của bạn)

```markdown
# Agent <miền việc>

## Vấn đề
Ai làm việc này bằng tay, mất bao lâu, và vì sao nó cần agent chứ không phải workflow.

## Công cụ
Bảng: tên, đọc hay ghi, hoàn tác được không, vì sao cần xác nhận.

## Kiến trúc an toàn
Bốn cửa. Chính sách nào cho ai. Nhật ký kiểm toán ghi gì.

## Kết quả
[BẢNG điểm theo loại ca] + số bước + số hành động đổi thế giới + chi phí/nhiệm vụ.
Số lần bị chặn và lý do.

## Sai ở đâu
5 đường đi sai thật, phân loại nguyên nhân, cách đã sửa.

## So sánh model & chính sách
Bảng. Kết luận chọn cái nào và VÌ SAO.

## Hạn chế
Nó KHÔNG dùng được cho loại việc nào. Cái gì vẫn cần người.

## Bài học
```

---

## ✅ Tiêu chí chấm

| Hạng mục | Điểm | Đạt khi |
|---|---|---|
| **Công cụ** | 10 | ≥ 5 công cụ, ≥ 2 công cụ ghi, mô tả viết cho model đọc |
| **Vòng lặp** | 15 | max_vòng, phát hiện lặp, nén ngữ cảnh, không sập vì lỗi công cụ |
| **Guardrails** | 25 | Bốn cửa đúng thứ tự, mặc định an toàn, nhật ký kiểm toán ra file |
| **Bộ test** | 15 | ≥ 20 ca tự viết, ≥ 6 ca bẫy đủ bốn kiểu, ≥ 1 ca injection |
| **Eval** | 20 | Chấm đường đi, ba chỉ số, bắt được thoái lui theo từng ca |
| **Phân tích + báo cáo** | 15 | Đọc tay đường đi sai, so model và chính sách, hạn chế trung thực |

**Tự chấm mức độ:**

| Mức | Dấu hiệu |
|---|---|
| ❌ Chưa đạt | Agent chạy được, chưa có guardrail hoặc chưa có bộ test |
| ⚠️ Tạm được | Có guardrail nhưng chưa có eval, hoặc eval chỉ chấm câu trả lời cuối |
| ✅ Tốt | Chấm đường đi, có ca bẫy, bắt được thoái lui |
| 🌟 Xuất sắc | Thêm ca injection + so sánh chính sách + **bộ eval đã bắt được một hành động nguy hiểm mà bạn không ngờ tới** |

> Dấu hiệu 🌟 quan trọng nhất — và với agent nó thường xảy ra thật. Lần đầu bạn
> thấy dòng `⚠️ LÀM VIỆC BỊ CẤM` trên một ca mình tưởng chắc chắn an toàn là lần
> bạn thực sự hiểu vì sao phase này tồn tại.

---

## 💡 Chín lỗi người mới hay mắc

| Lỗi | Triệu chứng | Cách sửa |
|---|---|---|
| **Dùng agent cho việc của workflow** | Đắt, chậm, kết quả khác nhau mỗi lần | Viết các bước ra giấy — cố định thì dùng workflow |
| **Không có `max_vong`** | Một đêm chạy hết ngân sách tháng | Bắt buộc, và ghi lại lý do dừng |
| **Guardrail nằm trong từng công cụ** | Công cụ thứ tám thiếu kiểm tra | Một lớp riêng, mọi công cụ đi qua |
| **Tin tham số của model** | `so_luong=10000` đi thẳng vào hệ thống | Kiểm ở phía bạn, trước khi chạy |
| **Quên loại `bool`** | `so_luong=True` lọt qua thành 1 | `isinstance(True, int)` là `True` |
| **Xác nhận không đủ thông tin** | Người dùng bấm "y" theo phản xạ | Câu hỏi kèm hậu quả cụ thể |
| **Không reset thế giới giữa các ca** | Đảo thứ tự bộ test làm đổi điểm | `TheGioi()` mới cho mỗi ca |
| **Chỉ chấm câu trả lời cuối** | Agent phá dữ liệu nhưng vẫn 1.0 | Chấm `phai_goi` / `cam_goi` |
| **Bộ test toàn ca dễ** | Agent hấp tấp trông tốt hơn agent cẩn thận | ≥ 6 ca bẫy |

> ⚠️ Hai lỗi cuối tinh vi nhất, và chúng đi cùng nhau. Nếu điểm eval của bạn cao
> ngay từ lần chạy đầu, hãy **nghi ngờ bộ test** trước khi ăn mừng.

---

## 🌟 Thử thách thêm

- [ ] **Dry-run đầy đủ:** chạy toàn bộ bộ eval ở chế độ không thực hiện, so đường đi với chế độ thật
- [ ] **Hoàn tác:** ghi trạng thái trước mỗi hành động, cho phép `undo`
- [ ] **Ngân sách tiền thật:** dừng khi chi phí API vượt ngưỡng, không chỉ đếm vòng
- [ ] **Chèn gợi ý khi phát hiện lặp** — đo xem có gỡ được bế tắc không
- [ ] **Prompt caching** cho phần hướng dẫn + định nghĩa công cụ — đo tiền tiết kiệm thật
- [ ] **Subagent:** một agent con chỉ đọc, chuyên tra cứu, trả kết quả cho agent chính. Đo xem có đáng thêm độ phức tạp không
- [ ] **MCP:** đóng gói công cụ của bạn thành một MCP server để dùng lại được từ nơi khác
- [ ] Ghi **trace** đầy đủ (mỗi bước: prompt, quyết định, kết quả, token) — chuẩn bị cho Phase 10

> 📌 Ý áp chót đáng làm cho CV: **MCP** là cách chuẩn hoá để chia sẻ công cụ giữa
> các ứng dụng. Nhưng làm nó *sau khi* agent đã chạy tốt — đóng gói một thứ chưa
> hoạt động thì chỉ được một thứ chưa hoạt động, đóng gói đẹp hơn.

---

## 📌 Nộp bài

```powershell
pytest projects/P7-agent -v
python eval/chay_eval.py --luu eval/kq_v3.json --so-sanh eval/kq_v2.json
git add .
git commit -m "P7: AI agent + guardrails + eval"
git push
```

Bài test khắt khe nhất cho project này:

> Một người quản lý hỏi: **"Cho agent này chạy tự động, không có người duyệt, được không?"**
>
> Bạn phải trả lời trong 2 phút bằng **số**: đúng bao nhiêu phần trăm, sai ở loại
> nhiệm vụ nào, **bao nhiêu lần nó đã cố làm việc bị cấm**, hành động nào bạn vẫn
> giữ cửa xác nhận và tại sao, chi phí mỗi nhiệm vụ, và **bạn biết tất cả những
> điều đó bằng cách nào**.
>
> Câu cuối là câu quan trọng nhất. Nếu câu trả lời là *"tôi có bộ eval 20 ca chạy
> lại được sau mỗi thay đổi"*, bạn đã là AI Engineer.

---

⬅️ [Phase 09](../../curriculum/09-agents/README.md) · ➡️ [Phase 10 — Deploy & Vận hành](../../curriculum/10-deploy-ops/README.md)
