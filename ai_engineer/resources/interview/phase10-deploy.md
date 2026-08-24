# Phỏng vấn — Phase 10: Deploy & Vận hành

12 câu hỏi thường gặp về đưa ứng dụng LLM lên production.

Cách dùng: che phần đáp án, tự trả lời thành tiếng trong 60 giây, rồi đối chiếu.
Chủ đề này là chỗ nhà tuyển dụng phân biệt **người đã vận hành thật** với người
mới chỉ chạy trên máy mình.

---

## 1. Bạn quản lý API key thế nào?

<details><summary>Đáp án</summary>

Bốn tầng, và câu trả lời tốt nhắc cả bốn:

| Tầng | Làm gì |
|---|---|
| **Đọc** | Từ biến môi trường, **một chỗ duy nhất**, lúc khởi động |
| **Che** | Log đi qua bộ lọc **đệ quy** che mọi trường tên giống bí mật |
| **Đóng gói** | `.env` nằm trong cả `.gitignore` và `.dockerignore`; không bao giờ `ENV`/`ARG`/`COPY .env` |
| **Xoay** | Lỡ lộ thì tạo key mới và thu hồi key cũ ở Console |

**Điểm cộng — hai chi tiết ít người biết:**

1. **Che nhưng đừng che hết.** Giữ `sk-ant-...XYZW` để phân biệt được *"không có
   key"* với *"có key nhưng sai key"*. Che sạch thì log an toàn nhưng vô dụng.

2. **Xoá khỏi code là chưa đủ khi đã lộ.** Key vẫn nằm trong lịch sử Git, trong
   bản sao của người khác, và có thể đã bị bot quét GitHub thu thập. Xoay key mất
   2 phút; không xoay có thể mất cả hạn mức chi tiêu.

</details>

---

## 2. Vì sao ảnh Docker chứa `.env` là chuyện không sửa được bằng `RUN rm .env`?

<details><summary>Đáp án</summary>

**Vì ảnh Docker là một chuỗi TẦNG, và mỗi tầng đọc lại được.**

Xoá file ở tầng sau không xoá nó khỏi tầng trước. `docker history --no-trunc`
vẫn lấy ra được nội dung tầng đó.

Nghĩa là một file `.env` lọt vào build context nằm trong ảnh **vĩnh viễn** — kể
cả khi dòng lệnh ngay sau là `RUN rm .env`.

Cách đúng: chặn từ đầu bằng `.dockerignore`, và truyền bí mật **lúc chạy**:

```bash
docker run --env-file .env ...          # hoặc secret manager của nền tảng
```

**Điểm cộng:** nhắc tới `.git` trong `.dockerignore`. Đây là mục tinh vi nhất —
bạn commit nhầm key, phát hiện ra, xoá và commit lại; nhưng key vẫn nằm trong
**lịch sử Git**, và `.git` đi vào ảnh Docker.

</details>

---

## 3. `/khoe` và `/san_sang` khác nhau thế nào? Gộp lại thì sao?

<details><summary>Đáp án</summary>

| | `/khoe` (liveness) | `/san_sang` (readiness) |
|---|---|---|
| Hỏi gì | Tiến trình còn sống không? | Nhận traffic được chưa? |
| Sai thì sao | **KHỞI ĐỘNG LẠI** container | **NGỪNG GỬI** traffic tới |
| Kiểm gì | Không gì cả | Cấu hình, kết nối nội bộ |

**Hậu quả của việc gộp — đây là phần làm câu trả lời nổi bật:**

Giả sử `/khoe` cũng kiểm tra kết nối tới Anthropic. Anthropic gián đoạn 5 phút →
health check thất bại trên **mọi** instance → hệ thống điều phối tưởng tiến trình
chết → **khởi động lại toàn bộ** → mất cache và connection pool → khi Anthropic
hồi phục, dịch vụ của bạn vẫn đang khởi động.

**Một sự cố 5 phút của người khác vừa thành sự cố 20 phút của bạn.**

**Điểm cộng:** `HEALTHCHECK` trong Dockerfile phải trỏ vào `/khoe`, không phải
`/san_sang` — vì `HEALTHCHECK` thất bại nghĩa là khởi động lại container.

</details>

---

## 4. Lỗi xác thực với Anthropic thì API của bạn trả mã HTTP nào?

<details><summary>Đáp án</summary>

**500, không phải 401.**

Key của **bạn** sai — đó không phải lỗi của người gọi API của bạn. Trả 401 là
**nói dối** và làm họ đi tìm nhầm chỗ (họ sẽ đi kiểm token của chính họ).

Bảng ánh xạ đầy đủ:

| Lỗi SDK | HTTP | Vì sao |
|---|---|---|
| `RateLimitError` | 429 | Người gọi thử lại sau được |
| `AuthenticationError` | **500** | Lỗi cấu hình phía bạn |
| `APIConnectionError` | 503 | Dịch vụ phụ thuộc gián đoạn |
| `APITimeoutError` | 504 | Quá hạn |
| Không biết trước | 500 | Mặc định an toàn |

**Điểm cộng — nguyên tắc quan trọng hơn cả bảng:** thông điệp ra ngoài **không
chứa chi tiết kỹ thuật**. `"AuthenticationError: invalid x-api-key sk-ant-..."`
đi vào **log của bạn** kèm `trace_id`; ra ngoài chỉ có `"Lỗi cấu hình máy chủ"`.

Thông báo lỗi chi tiết là một **kênh rò rỉ thông tin** — và nếu bạn không bắt
exception ở biên, FastAPI trả về trang 500 mặc định kèm stack trace, tức là lộ
cả cấu trúc code và đường dẫn file.

</details>

---

## 5. Vì sao đo p95 thay vì trung bình? Và p95 có đủ không?

<details><summary>Đáp án</summary>

Số đo thật trên 1.000 request của một dịch vụ bình thường:

| Chỉ số | Giá trị |
|---|---|
| Trung bình | 595 ms |
| p50 | 201 ms |
| p95 | 350 ms |
| **p99** | **10.087 ms** |

**Trung bình (595 ms) cao hơn cả p95 (350 ms)** — nó không mô tả một người dùng
nào cả. Độ trễ là phân bố **lệch phải**; trung bình chỉ mô tả được phân bố đối xứng.

**Và p95 cũng chưa đủ.** Ở bảng trên p95 chỉ 350 ms, trông rất đẹp — cái đuôi 10
giây chỉ lộ ra ở **p99**. Lý do: đúng 5% request chậm, nên p95 rơi ngay vào ranh
giới và vẫn nằm bên phần nhanh.

**Nguyên tắc: báo cáo p50, p95 và p99 cùng nhau.** Một con số duy nhất — dù là
trung bình hay p95 — đều giấu được một sự thật khó chịu.

**Điểm cộng:** 5% người dùng chậm đó không phải 5% ngẫu nhiên mỗi lần. Họ thường
là người có prompt dài nhất — tức là **người dùng nặng nhất của bạn**.

</details>

---

## 6. Bạn kiểm soát chi phí API thế nào?

<details><summary>Đáp án</summary>

Bốn lớp, từ ngoài vào trong:

| Lớp | Làm gì |
|---|---|
| **Giới hạn độ dài đầu vào** | Chặn request 500.000 ký tự trước khi nó chạm API |
| **Giới hạn tần suất** | Token bucket |
| **Ngân sách** | Đếm chi phí tích luỹ, **CHẶN** khi vượt |
| **Hạn mức ở Console** | Lưới an toàn cuối cùng |

**Ba điểm cộng:**

1. **Ngân sách phải CHẶN, không chỉ cảnh báo.** Một cảnh báo lúc 2 giờ sáng không
   ngăn được gì.

2. **`cho_phep` và `ghi_nhan` là hai hàm riêng.** Trước khi gọi bạn chỉ *ước
   lượng* được chi phí; con số thật chỉ có sau, dựa trên `usage`. Gộp làm một
   nghĩa là hoặc bạn chặn dựa trên số liệu sai, hoặc ghi nhận một chi phí chưa xảy ra.

3. **Thứ tự các cửa: rẻ nhất trước.** Giới hạn tần suất là một phép trừ; gọi API
   là một vòng mạng mất một giây. Đặt sai thứ tự nghĩa là bạn trả tiền cho những
   request lẽ ra đã bị từ chối miễn phí.

</details>

---

## 7. Token bucket khác gì "tối đa N request mỗi phút"?

<details><summary>Đáp án</summary>

**Đếm theo cửa sổ cố định cho phép gấp đôi tải ở ranh giới.**

100 request lúc 10:00:59 và 100 request nữa lúc 10:01:00 đều "hợp lệ" theo luật
*"tối đa 100 mỗi phút"* — nhưng máy chủ của bạn nhận **200 request trong một giây**.

Token bucket không có ranh giới để mà lách: xô nạp liên tục theo thời gian, và có
trần cứng.

```
token = min(sức_chứa, token + thời_gian_trôi_qua × tốc_độ_nạp)
```

**Hai điểm cộng:**

1. **Nghỉ một tiếng không cho phép gửi 3.600 request cùng lúc** — `min(suc_chua, ...)`
   là dòng đảm bảo điều đó. Xô có trần.

2. **Từ chối thì KHÔNG trừ token.** Trừ "một phần" sẽ khiến một kẻ gọi liên tục
   giữ xô ở mức 0 vĩnh viễn, và người dùng bình thường không bao giờ còn token.

</details>

---

## 8. Ngắt mạch (circuit breaker) giải quyết vấn đề gì?

<details><summary>Đáp án</summary>

**Khi dịch vụ phụ thuộc gián đoạn, mỗi request của bạn chờ tới khi timeout.**

30 giây chờ để nhận một lỗi. Kết nối của bạn bị chiếm hết bởi những request
**chắc chắn thất bại**. Ứng dụng của bạn chết theo, dù lỗi không phải của nó.

Ngắt mạch biến 30 giây chờ vô ích thành **một lỗi trả về tức thì**, và giữ lại
tài nguyên cho những việc còn chạy được.

Ba trạng thái:

```
dong     --(đủ N lỗi LIÊN TIẾP)-->  mo
mo       --(qua thời gian chờ)-->   thu_lai
thu_lai  --(thành công)-->          dong
thu_lai  --(thất bại)-->            mo, đếm lại thời gian chờ
```

**Ba điểm cộng:**

1. **Lỗi phải LIÊN TIẾP** — một lần thành công xen vào thì đếm lại từ 0.
2. **Ở `thu_lai` mà thất bại thì mở lại NGAY**, không đếm tiếp. Một lần thử thất
   bại đã là bằng chứng đủ để nói dịch vụ chưa hồi phục.
3. **Trạng thái được TÍNH, không được LƯU.** Nếu lưu `"thu_lai"` vào một biến,
   phải có ai đó gọi để cập nhật nó đúng lúc. Tính lại mỗi lần đọc thì không bao
   giờ lệch, và không cần thành phần nào khác.

</details>

---

## 9. Log của ứng dụng LLM nên có gì?

<details><summary>Đáp án</summary>

Ba thứ bắt buộc:

| Thứ | Vì sao |
|---|---|
| **Có cấu trúc** (JSON) | *"Request nào chậm hơn 2 giây?"* là phép lọc, không phải bài toán regex |
| **`trace_id`** | Thứ duy nhất nối 12 dòng log rời rạc của cùng một request |
| **Đã lọc secret** | Kiểm bằng cách **đọc log thật**, không phải đọc code |

Mỗi request nên ghi ít nhất bốn sự kiện: nhận request, gọi model, model trả về,
trả về cho người dùng — kèm `do_tre_ms`, `token_vao`, `token_ra`, `chi_phi_usd`.

**Ba điểm cộng, đều là chi tiết vận hành thật:**

1. **`flush=True`.** Container bị dừng đột ngột thì log chưa flush sẽ mất — đúng
   lúc bạn cần nó nhất.
2. **Ghi ra stdout**, không phải file. Docker và mọi nền tảng đều thu log từ
   stdout; ghi ra file là tự tạo việc (xoay file, dọn đĩa, mount volume).
3. **Không ghi prompt người dùng ở prod.** Đó là dữ liệu cá nhân của họ — số điện
   thoại, địa chỉ, nội dung email. Ghi vào log nghĩa là bạn vừa tạo một bản sao ở
   nơi không ai bảo vệ.

</details>

---

## 10. Vì sao CI không được gọi API thật?

<details><summary>Đáp án</summary>

| Lý do | Hậu quả nếu vi phạm |
|---|---|
| Chậm và không ổn định | Test đỏ vì mạng, không phải vì code |
| Tốn tiền mỗi lần push | Hoá đơn tăng theo số lần bạn sửa typo |
| Cần API key trong CI | Thêm một chỗ để lộ key |

Cách làm: **truyền hàm gọi model vào như tham số** (dependency injection). Test
truyền hàm giả lập; production truyền hàm gọi Claude thật.

**Điểm cộng — hai ý làm câu trả lời có sức nặng:**

1. Đặt một **key giả** trong CI. Nếu một test nào đó lỡ gọi API thật, nó thất bại
   ngay — và đó chính là điều bạn muốn: **CI phát hiện ra, không phải hoá đơn
   phát hiện ra.**

2. Bộ quét secret trong CI **cần danh sách cho phép**. Không có nó thì CI đỏ ở
   mọi lần push vì cảnh báo giả (chuỗi ví dụ trong tài liệu, key giả trong test)
   — và điều xảy ra tiếp theo luôn giống nhau: **người ta tắt luôn công cụ.** Rồi
   lần key thật bị commit, không còn ai canh nữa.

   **Một cảnh báo bị bỏ qua tệ hơn không có cảnh báo**, vì nó cho bạn cảm giác an
   toàn giả.

</details>

---

## 11. ⭐ Dịch vụ của bạn chạy 2 instance sau load balancer. Ngân sách và giới hạn tần suất còn đúng không?

<details><summary>Đáp án</summary>

**Không. Và đây là câu bẫy hay gặp.**

Mọi thứ ở Phase 10 — bộ đếm, ngân sách, token bucket, ngắt mạch — đều là **trạng
thái trong bộ nhớ của một tiến trình**.

Chạy hai bản sao nghĩa là bạn có:

- **Hai cái ngân sách** → chi tiêu thật gấp đôi con số bạn đang theo dõi
- **Hai cái xô token** → giới hạn tần suất thật gấp đôi mức bạn đặt
- **Hai cái ngắt mạch** → instance này mở mạch, instance kia vẫn đang gọi vào dịch vụ hỏng
- **Hai bộ đếm** → `/so_lieu` chỉ cho bạn thấy một nửa bức tranh

Cách xử lý: chuyển trạng thái dùng chung sang một kho ngoài — Redis là lựa chọn
phổ biến cho cả bộ đếm lẫn token bucket.

**Điểm cộng lớn nhất ở câu này không phải là biết cách sửa, mà là:**

> **Không cần làm ngay, nhưng phải BIẾT là mình chưa làm** — chứ không phải phát
> hiện ra khi nhìn hoá đơn.

Với một dịch vụ nhỏ chạy một instance, trạng thái trong bộ nhớ là lựa chọn đúng:
đơn giản, nhanh, không thêm phụ thuộc. Nó chỉ trở thành sai **lúc bạn scale** —
và đó là điều cần ghi vào phần hạn chế của README.

</details>

---

## 12. ⭐ Bạn deploy xong. Làm sao biết nó thật sự chịu được sự cố?

<details><summary>Đáp án</summary>

**Bằng cách gây ra sự cố và nhìn xem chuyện gì xảy ra.**

Bạn viết ngắt mạch, viết timeout, viết xử lý lỗi — nhưng cho tới khi thử tắt
thật, bạn chỉ đang **hy vọng** chúng hoạt động.

Phép thử rẻ nhất: **đổi `ANTHROPIC_API_KEY` trên máy chủ thành một chuỗi rác**,
rồi gọi dịch vụ.

| Đúng | Sai |
|---|---|
| 503 kèm mã lỗi rõ ràng **trong dưới một giây** | Treo 30 giây |
| `/san_sang` báo đỏ | `/san_sang` vẫn xanh |
| `/khoe` vẫn xanh | `/khoe` cũng đỏ → container bị khởi động lại |
| Log có `trace_id` và đủ để gỡ lỗi | Log chỉ có "Error" |
| **Không có chuỗi key nào trong log** | Key nằm trong thông báo lỗi |

Các phép thử khác đáng làm: trỏ `base_url` vào một cổng không có gì (mô phỏng
timeout), gửi một request 500.000 ký tự, gọi 200 lần trong một giây.

**Điểm cộng — câu kết đáng nói:**

> Danh sách kiểm trước khi lên production có nhiều mục, nhưng mục *"đã thử tắt
> dịch vụ phụ thuộc và xem ứng dụng phản ứng thế nào"* là mục **ít người làm nhất
> và đáng giá nhất**.
>
> Mọi mục khác bạn xác nhận bằng cách đọc code. Mục này chỉ xác nhận được bằng
> cách thử.

</details>

---

## Câu hỏi ngược nên hỏi nhà tuyển dụng

- "Team theo dõi chi phí LLM ở mức nào — theo tính năng, theo người dùng, hay chỉ tổng?"
- "Khi Anthropic gián đoạn, hệ thống hiện tại phản ứng thế nào? Đã thử chưa?"
- "Quy trình xoay API key là gì, và bao lâu một lần?"

Ba câu này cho thấy bạn nghĩ về **vận hành thật**, không chỉ về việc deploy lần đầu.

---

[← Về mục lục phỏng vấn](README.md)
