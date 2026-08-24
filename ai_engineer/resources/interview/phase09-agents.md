# Phỏng vấn — Phase 09: Agents

12 câu hỏi thường gặp về AI agent cho vị trí **AI/LLM Application Engineer**.

Cách dùng: che phần đáp án, tự trả lời thành tiếng trong 60 giây, rồi đối chiếu.
Với chủ đề này, nhà tuyển dụng quan tâm nhất một điều: **bạn có ý thức được rằng
agent hành động thật hay không.**

---

## 1. Khi nào KHÔNG nên dùng agent?

<details><summary>Đáp án</summary>

**Khi bạn viết được các bước ra giấy theo thứ tự cố định.** Lúc đó đó là một
**workflow**, và workflow rẻ hơn, nhanh hơn, dễ gỡ lỗi hơn, an toàn hơn.

Agent chỉ đáng khi **số bước và thứ tự phụ thuộc vào những gì phát hiện dọc đường**.

Bốn câu hỏi sàng lọc:

| Câu hỏi | Nếu "không" |
|---|---|
| Nhiệm vụ nhiều bước và khó đặc tả trước? | Dùng workflow |
| Kết quả đáng với chi phí và độ trễ? | Dùng cách rẻ hơn |
| Model đủ giỏi ở loại việc này? | Thu hẹp phạm vi |
| Sai thì phát hiện và sửa được? | **Đừng cho agent tự chạy** |

**Điểm cộng lớn:** nói rằng *"dùng agent" không phải một thành tích kỹ thuật* —
chọn đúng công cụ mới là. Người kể được một trường hợp *"chỗ này tôi đã cân nhắc
agent nhưng cuối cùng dùng workflow, và đây là lý do"* gây ấn tượng hơn hẳn người
khoe đã dựng agent.

</details>

---

## 2. Model có tự chạy công cụ của bạn không? Hệ quả là gì?

<details><summary>Đáp án</summary>

**Không. Model không bao giờ chạy công cụ của bạn** — nó chỉ *nói* nó muốn gọi
công cụ nào với tham số gì. **Bạn** chạy, rồi gửi kết quả về.

Với chatbot đây chỉ là chi tiết kỹ thuật. Với agent nó là điều quan trọng nhất:

> **Mọi hành động có hậu quả đều đi qua code của bạn — nên code của bạn là nơi
> duy nhất đặt được chốt chặn.**

Đó là toàn bộ cơ sở để guardrail tồn tại. Nếu model tự chạy được công cụ thì
không có lớp kiểm soát nào là khả thi.

**Điểm cộng:** nhắc rằng chính vì thế, tách hàm gọi model ra thành tham số
(dependency injection) cho phép bạn chạy hàng trăm lần eval mà không tốn một
đồng nào — thứ mà bạn sẽ cần rất nhiều ở câu 11.

</details>

---

## 3. `max_vong` để làm gì? Agent dừng vì hết vòng có phải là thất bại?

<details><summary>Đáp án</summary>

**`max_vong` không phải "nên có" — nó bắt buộc.**

Agent kẹt **không báo lỗi**: nó gọi một công cụ, thấy kết quả không như ý, gọi
lại y hệt, rồi lại... Nhìn từ ngoài giống *"agent đang suy nghĩ kỹ"*. Nhìn vào
hoá đơn API thì không — **mỗi vòng là một lần tính tiền**. Một agent không giới
hạn vòng, chạy không người trông qua đêm, đủ để đốt sạch ngân sách tháng.

**Dừng vì hết vòng KHÔNG phải thất bại** — đó là một giới hạn an toàn đã hoạt
động đúng. Thất bại là khi bạn không có giới hạn nào.

**Điểm cộng:** nói thêm về **phát hiện lặp** — đếm các lần gọi trùng cả tên lẫn
tham số để dừng sớm hơn nhiều so với đợi hết `max_vong`, rồi chọn: chèn gợi ý
*"bạn đã thử cách này rồi"*, đổi chiến lược, hoặc dừng và báo người.

Chi tiết dễ sai khi cài đặt: `dict` không băm được nên phải chuyển thành chuỗi —
và **phải sắp xếp khoá**, nếu không `{"a":1,"b":2}` và `{"b":2,"a":1}` thành hai
khoá khác nhau và bạn bỏ sót đúng cái lặp mình đang tìm.

</details>

---

## 4. Chi phí của agent tăng thế nào theo số bước?

<details><summary>Đáp án</summary>

**Theo bình phương, không phải tuyến tính.** API là stateless (Phase 07) nên mỗi
bước phải gửi lại toàn bộ lịch sử.

Số đo thật trên một kho hàng nhỏ:

| Bước | Token gửi ở bước đó | **Tổng đã gửi** |
|---|---|---|
| 1 | 197 | 197 |
| 5 | 906 | 2.757 |
| 15 | 2.679 | **21.570** |

Một nhiệm vụ 15 bước tốn gấp khoảng **100 lần** một bước, không phải 15 lần.

Tệ hơn: kết quả công cụ thường **rất dài**. Sau vài bước, phần lớn ngữ cảnh là
dữ liệu model không còn cần nữa.

**Điểm cộng:** nói rằng đây là lý do `max_vong` vừa là chốt an toàn vừa là chốt
chi phí — và rằng con số ước lượng "ký tự chia 3" chỉ đủ để quyết định *"có cần
nén không"*, còn con số chính xác phải lấy từ `count_tokens()`.

</details>

---

## 5. Ba cách nén ngữ cảnh. Thứ tự nào và vì sao?

<details><summary>Đáp án</summary>

| Chiến lược | Giữ được gì | Mất gì | Tốn thêm |
|---|---|---|---|
| **Rút gọn** kết quả dài | Cấu trúc + ý nghĩa | Chi tiết | Không |
| **Tóm tắt** bước cũ | Ý nghĩa | Chi tiết | **Một lần gọi API** |
| **Cắt bỏ** bước cũ | Các bước gần nhất | Toàn bộ bước cũ | Không |

**Luôn dùng biện pháp ít mất mát nhất trước.** Người mới hay làm ngược — cắt bỏ
trước vì dễ code nhất.

**Điểm cộng — cái giá cụ thể của việc cắt:** agent **quên** việc nó vừa làm và
**làm lại**. Với `huy_don` idempotent thì chỉ báo lỗi; với `gui_email` thì khách
nhận hai email; với `dat_hang` thì bạn mua hàng hai lần.

Vì thế hai thiết kế sau **không phải tuỳ chọn**:

1. **Công cụ idempotent** — gọi hai lần không hại thêm
2. **Nhật ký riêng**, nằm ngoài lịch sử gửi cho model — nó không bị cắt cùng ngữ cảnh

**Điểm cộng nữa:** tóm tắt là **một lần gọi API** nên nó có thể rate limit hoặc
timeout — phải có đường lui (lùi về cắt), đừng biến một tối ưu chi phí thành một
điểm hỏng mới.

Và: Claude API có sẵn **context editing** (`clear_tool_uses`) và **compaction**
làm đúng việc này, đều là beta.

</details>

---

## 6. Agent dừng giữa chừng vì mất mạng. Vấn đề gì riêng của agent ở đây?

<details><summary>Đáp án</summary>

**Nó để lại thế giới ở trạng thái dở dang.**

Chatbot hỏng thì người dùng thấy lỗi và hỏi lại — không mất gì. Agent hỏng giữa
chừng thì *đơn đã huỷ nhưng khách chưa được báo*. **Không có giao dịch nào để
rollback** — `huy_don` đã chạy thật rồi.

Ba cách giảm đau, theo thứ tự nên làm:

| Cách | Ý tưởng |
|---|---|
| **Sắp xếp thứ tự hành động** | Làm việc có hậu quả **muộn nhất có thể** |
| **Idempotent** | Gọi lại không hại thêm |
| **Nhật ký ngoài** | Ghi vào chỗ tồn tại lâu hơn tiến trình agent |

**Điểm cộng:** nói rằng vì thế `duong_di` phải được **giữ nguyên khi lỗi**, không
được vứt đi — nó là thứ duy nhất cho bạn biết agent đã kịp làm gì trước khi chết,
để người xử lý nốt.

</details>

---

## 7. Mô tả bốn cửa guardrail. Vì sao theo đúng thứ tự đó?

<details><summary>Đáp án</summary>

```
① QUYỀN      công cụ này có được phép dùng không?
② THAM SỐ    giá trị model đưa có hợp lệ không?
③ NGÂN SÁCH  đã thay đổi thế giới quá nhiều lần chưa?
④ XÁC NHẬN   việc này có cần hỏi người không?
```

Thứ tự **không tuỳ tiện**:

| Cặp | Vì sao |
|---|---|
| Quyền **trước** tham số | Không tiết lộ định dạng tham số của công cụ mà người gọi vốn không được dùng |
| Ngân sách **trước** xác nhận | Hỏi người rồi mới báo hết ngân sách là làm phiền vô ích — và người dùng sẽ học cách bấm "có" cho nhanh, tức là bạn vừa phá huỷ chính lớp bảo vệ của mình |

**Và quan trọng không kém: guardrail phải là một LỚP RIÊNG**, nằm giữa model và
mọi công cụ. Nếu lớp bảo vệ duy nhất nằm rải rác bên trong từng công cụ thì công
cụ thứ tám bạn viết vội lúc 6 giờ chiều sẽ không có nó.

**Điểm cộng:** chi tiết *hành động thất bại không tính vào ngân sách* — một lần
huỷ đơn thất bại (đơn đã giao) không tiêu tốn gì của thế giới, nên không nên tính.

</details>

---

## 8. Không cấu hình hàm xác nhận thì agent nên làm gì?

<details><summary>Đáp án</summary>

**Từ chối.** Mặc định phải an toàn: quên cấu hình thì agent **không làm gì**, chứ
không phải **làm tất cả**.

Đây là câu hỏi ngắn nhưng nó lộ ra rất nhiều về cách người trả lời nghĩ. Cách cài
đặt sai rất tự nhiên:

```python
# ❌ Quên cấu hình -> mọi hành động nguy hiểm được cho qua
dong_y = self.ham_xac_nhan(ten, ts) if self.ham_xac_nhan else True

# ✅
dong_y = self.ham_xac_nhan(ten, ts) if self.ham_xac_nhan else False
```

**Điểm cộng:** nói rộng ra nguyên tắc **đặc quyền tối thiểu** — phần lớn agent
trong thực tế nên bắt đầu ở mức **chỉ đọc**. Một agent tra cứu và báo cáo đã tạo
ra rất nhiều giá trị mà gần như không có rủi ro. Chỉ mở quyền ghi khi bạn đã có
bộ eval chứng minh nó hành xử đúng — chứ không phải khi nó "có vẻ thông minh".

</details>

---

## 9. ⭐ Người dùng gõ "nếu tôi muốn huỷ đơn này thì có được không?" và agent huỷ luôn. Sửa thế nào?

<details><summary>Đáp án</summary>

**Đây là lỗi agent phổ biến nhất trong thực tế.** Người dùng **hỏi**; model hiểu
thành **mệnh lệnh** và thực hiện. Với chatbot đây chỉ là hiểu nhầm; với agent đây
là một đơn hàng bị huỷ thật.

**Câu trả lời quan trọng nhất: không prompt nào chặn được việc này một cách chắc chắn.**

Bạn có thể viết *"chỉ hành động khi được yêu cầu rõ ràng"* và nó sẽ đúng **phần
lớn** thời gian — nhưng "phần lớn" không phải một đảm bảo an toàn. Với hành động
không hoàn tác được, "thường thì đúng" là không đủ.

**Cửa xác nhận là thứ chắc chắn**, vì nó không phụ thuộc vào việc model hiểu đúng
hay sai.

**Điểm cộng lớn:** nói rằng bạn đưa **chính tình huống này** vào bộ test dưới dạng
một ca `cam_goi` — và rằng nó **không thể phát hiện được** nếu chỉ chấm câu trả
lời cuối, vì câu *"Tôi đã huỷ giúp bạn"* nghe rất trôi chảy.

</details>

---

## 10. Hành động nào cần hỏi người? Hỏi nhiều quá thì sao?

<details><summary>Đáp án</summary>

**Quy tắc: hỏi khi hành động vừa thay đổi thế giới, vừa không hoàn tác được.**

| Công cụ | Đổi thế giới | Hoàn tác được | Nên hỏi? |
|---|---|---|---|
| tra cứu, liệt kê | không | được | không |
| cập nhật trạng thái | có | được | cân nhắc |
| huỷ đơn, gửi email | có | **KHÔNG** | **CÓ** |

Hai thuộc tính `doi_the_gioi` và `hoan_tac_duoc` nên được **khai báo cho từng công
cụ ngay khi viết nó**, chứ không phải suy luận lại sau — người viết công cụ là
người biết rõ nhất.

**Mặt trái — mệt mỏi vì xác nhận:** hỏi quá nhiều thì người dùng học cách bấm "có"
theo phản xạ, và cửa xác nhận trở thành **trang trí**. Hỏi quá nhiều nguy hiểm
không kém hỏi quá ít.

**Điểm cộng:** câu hỏi xác nhận phải cho người **đủ thông tin để nói KHÔNG**.

```
❌ Cho phép huy_don(DH1004)?
✅ Huỷ đơn DH1004 của Phạm Thu Dung (2.500.000đ, đang xử lý)?
```

Nếu họ phải đi tra cứu mới biết mình đang duyệt cái gì, họ sẽ bấm "có".

</details>

---

## 11. ⭐⭐ Chấm chất lượng agent thế nào? Vì sao chấm câu trả lời cuối là không đủ?

<details><summary>Đáp án</summary>

> Hai agent cùng trả lời *"Đã huỷ đơn DH1002"*. Một cái đã tra cứu trạng thái đơn
> trước rồi mới huỷ. Cái kia huỷ bừa rồi báo cáo.
> **Nhìn câu trả lời cuối thì chúng giống hệt nhau.**

Nên với agent phải chấm **cả đường đi** và **cả hậu quả**:

| Chấm gì | Trọng số |
|---|---|
| **Không làm việc bị cấm** | **0 điểm tuyệt đối nếu vi phạm** |
| Gọi đủ công cụ cần thiết | 0.4 |
| Câu trả lời đủ ý | 0.3 |
| Kết thúc đàng hoàng (không phải hết vòng) | 0.3 |

**Vì sao "làm việc bị cấm" là 0 tuyệt đối chứ không phải trừ điểm?** Một agent
huỷ nhầm đơn rồi trả lời rất hay **không phải là "được 70%"** — đó là một sự cố.
Nếu cho nó 0.7 thì khi tối ưu, hệ thống sẽ học cách **trả lời hay hơn** thay vì
học cách **không phá**.

**Ba điểm cộng, mỗi cái đều đáng giá:**

1. **Bộ test phải có ca bẫy.** Số đo thật: agent hấp tấp được 0.66 tổng nhưng
   **1.00 trên mọi ca dễ** và **ít bước hơn** agent cẩn thận. Nếu bộ test chỉ có
   ca dễ, bạn sẽ kết luận agent hấp tấp tốt hơn — nó rẻ hơn mà.
2. **Ba chỉ số báo cáo cùng nhau:** điểm (làm đúng không), số bước (tốn bao
   nhiêu), số hành động đổi thế giới (**bề mặt rủi ro**).
3. **Thế giới mới cho mỗi ca.** Nếu không, ca sau chạy trên hậu quả của ca trước
   và điểm số vô nghĩa. Dấu hiệu nhận biết: đảo thứ tự bộ test làm đổi điểm.

**Và một điểm cộng nữa:** đường đi **không tất định** — hai đường khác nhau đều
có thể đúng. Nên đừng so khớp một chuỗi công cụ cố định; dùng `phai_goi` /
`cam_goi` để kiểm **cái bắt buộc phải có** và **cái tuyệt đối không được có**,
phần giữa để agent tự do.

</details>

---

## 12. ⭐ Bạn tối ưu agent, số bước giảm từ 6 xuống 5. Rẻ hơn và nhanh hơn. Deploy được chưa?

<details><summary>Đáp án</summary>

**Chưa — và câu này là bẫy.**

"Tối ưu" đó là **bỏ bước tra cứu trước khi hành động**. Nghe rất hợp lý: ít bước
hơn, rẻ hơn, nhanh hơn. Nhưng không tra cứu trước nghĩa là agent **không biết
trạng thái hiện tại** — nên nó hành động mù và báo cáo *"Đã xử lý"*, một câu trôi
chảy mô tả một việc không hề xảy ra.

Số đo thật: điểm chất lượng giảm 1.00 → 0.94, trong khi số bước giảm 6 → 5.

> **Nếu bạn chỉ theo dõi chi phí và độ trễ — hai chỉ số mà đội ngũ thật theo dõi
> hằng ngày — thì "tối ưu" này thắng rõ ràng và sẽ được deploy.**

**Điểm cộng — nhận ra đây là cùng một bài học lặp lại lần thứ ba:**

| Phase | Chỉ số "tốt lên" | Thứ bị giấu |
|---|---|---|
| 07 | điểm trung bình 0.62 → 0.88 | một câu phân loại bị hỏng |
| 08 | recall trung bình 0.90 → 0.94 | cả nhóm câu hỏi mã lỗi |
| **09** | **số bước 6 → 5** | **một hành động sai trên dữ liệu** |

Cùng một cơ chế, hậu quả tăng dần. Và cách phát hiện vẫn y hệt: **so sánh theo
từng ca**, không nhìn con số tổng.

**Câu kết đáng nói:** bộ eval không quyết định thay bạn. Nó chỉ đảm bảo bạn quyết
định trong lúc **biết** mình đang đánh đổi cái gì. Đó là ranh giới giữa kỹ sư và
người chỉnh tham số theo cảm giác.

</details>

---

## Câu hỏi ngược nên hỏi nhà tuyển dụng

- "Agent của team hiện có guardrail ở tầng nào? Có nhật ký kiểm toán không?"
- "Hành động nào agent được tự làm, hành động nào vẫn cần người duyệt — và ai quyết định ranh giới đó?"
- "Team đo chất lượng agent bằng cách nào? Có chấm đường đi hay chỉ chấm kết quả cuối?"

Ba câu này cho thấy bạn nghĩ về **vận hành và an toàn**, không chỉ về việc dựng
được vòng lặp.

---

[← Về mục lục phỏng vấn](README.md)
