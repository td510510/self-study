# Phase 10 · Deploy & Vận hành

**Thời gian:** Tuần 22 (~12 giờ) · **Điều kiện:** xong [Phase 09](../09-agents/README.md)

---

## 🎯 Mục tiêu

Chín phase trước dạy bạn **xây**. Phase này dạy bạn **giao cho người khác dùng** — và giữ cho nó chạy được.

- [ ] Cấu hình an toàn: đọc một lần, kiểm ngay, đóng băng
- [ ] **Bảo mật secret** — che trong log, không lọt vào ảnh Docker
- [ ] FastAPI: validate đầu vào, mã lỗi, streaming
- [ ] `/khoe` và `/san_sang` — hai thứ khác nhau
- [ ] **Quan sát**: p95 thay vì trung bình, log có cấu trúc, trace ID
- [ ] ⭐ **Kiểm soát chi phí**: ngân sách chặn, giới hạn tần suất
- [ ] ⭐ **Ngắt mạch** khi dịch vụ phụ thuộc gián đoạn
- [ ] Docker nhiều tầng, CI không gọi API thật
- [ ] → Đưa **P6** hoặc **P7** lên internet

> **Điểm mấu chốt của phase này:** một dịch vụ LLM chạy được thì dễ. Một dịch vụ **không làm bạn phá sản, không lộ key, và không chết theo Anthropic** thì cần đúng những thứ trong phase này.

---

## ⚙️ Chuẩn bị

```powershell
pip install -e ".[deploy]"
```

> 💡 **Toàn bộ bài tập chạy được KHÔNG CẦN API key** — và đó không phải sự tiện lợi ngẫu nhiên. Nó là hệ quả trực tiếp của việc mọi bài tập từ Phase 07 tới giờ đều nhận hàm gọi model làm **tham số**. Bộ test của bạn chạy được ở nơi không có mạng và không có tiền, tức là chạy được trong CI.

Phase này có thêm thư mục `mau/` chứa file dùng thật:

```
curriculum/10-deploy-ops/mau/
├── Dockerfile        build nhiều tầng, không chạy root, healthcheck đúng chỗ
├── .dockerignore     danh sách file KHÔNG được vào ảnh
└── ci.yml            GitHub Actions: lint + test + build + quét secret
```

---

## 📅 Nội dung

| Bài | Chủ đề | Bài tập |
|---|---|---|
| `01` | Từ script đến dịch vụ: cấu hình, secret, FastAPI, health check | `ex01`, `ex02` |
| `02` ⭐⭐ | Quan sát và kiểm soát chi phí | `ex03` |
| `03` | Đóng gói Docker và CI | mini-project |

---

## 1. Cấu hình: đọc một lần, kiểm ngay, đóng băng

Sai lầm đầu tiên của mọi dịch vụ mới là đọc `os.environ` rải rác khắp code.

| Vấn đề | Hậu quả |
|---|---|
| Cấu hình sai chỉ lộ khi request đầu tiên chạm tới | Sửa lúc 3 giờ sáng thay vì lúc khởi động |
| Không biết dịch vụ cần biến nào nếu không đọc hết code | Deploy thiếu biến, phát hiện ở production |
| Không test được nếu không sửa biến môi trường thật | Test chậm, rò rỉ giữa các test, không chạy song song |

Cách đúng: một hàm `doc_cau_hinh(bien_moi_truong)` **nhận dict làm tham số**, kiểm mọi thứ, trả về một dataclass `frozen=True`.

```python
cau_hinh = doc_cau_hinh(os.environ)   # MỘT dòng chạm tới trạng thái toàn cục
```

### Fail fast

Cấu hình nguy hiểm thì **không cho khởi động**, đừng chỉ ghi cảnh báo:

```python
if moi_truong == "prod" and ghi_log_prompt:
    raise ValueError("Không được bật GHI_LOG_PROMPT ở prod: prompt chứa dữ liệu người dùng")
```

> ⚠️ Ghi log prompt ở prod nghĩa là bạn vừa tạo một **bản sao dữ liệu người dùng** — số điện thoại, địa chỉ, nội dung email — ở nơi không ai bảo vệ.
>
> Ở dev thì tiện và chấp nhận được. Ở prod thì không. Một cảnh báo trong log sẽ bị bỏ qua; một `ValueError` lúc khởi động thì không.

## 2. Secret

### Che, nhưng đừng che hết

```
sk-ant-api03-abcdefghij-XYZW   ->   sk-ant-...XYZW
```

Che **hết** thì log an toàn nhưng vô dụng: bạn không phân biệt được *"không có key"* với *"có key nhưng sai key"*. Giữ 4 ký tự cuối là đủ để phân biệt hai key mà không đủ để dùng.

### Lọc log phải ĐỆ QUY

Thực tế bạn không log một dict phẳng — bạn log cả đối tượng request, và key nằm ở `{"cau_hinh": {"client": {"api_key": ...}}}`. Một hàm chỉ quét tầng đầu sẽ bỏ sót đúng chỗ quan trọng nhất.

### Nếu đã lộ key thật

**Xoá khỏi code là chưa đủ. Phải xoay key** (tạo mới, thu hồi cũ) ở Console. Key vẫn nằm trong lịch sử Git, trong bản sao của người khác, và có thể đã bị bot quét GitHub thu thập.

Xoay key mất 2 phút. Không xoay có thể mất cả hạn mức chi tiêu của bạn.

## 3. Health check: hai thứ khác nhau

| | `/khoe` (liveness) | `/san_sang` (readiness) |
|---|---|---|
| Hỏi gì | Tiến trình còn sống không? | Nhận traffic được chưa? |
| Sai thì sao | **KHỞI ĐỘNG LẠI** container | **NGỪNG GỬI** traffic tới |
| Kiểm gì | Không gì cả | Cấu hình, kết nối nội bộ |

> ⚠️ **Vì sao gộp hai cái này là một lỗi tốn kém?**
>
> Giả sử `/khoe` cũng kiểm tra kết nối tới Anthropic. Anthropic gián đoạn 5 phút → health check thất bại trên **mọi** instance → hệ thống điều phối tưởng tiến trình chết → **khởi động lại toàn bộ** → mất cache và connection pool → khi Anthropic hồi phục, dịch vụ của bạn vẫn đang khởi động.
>
> Một sự cố 5 phút của người khác vừa thành sự cố 20 phút của bạn.

**Liveness phải rẻ và cục bộ.** Sức khoẻ của dịch vụ bên ngoài thuộc về monitoring, không thuộc về liveness probe. Và `HEALTHCHECK` trong Dockerfile phải trỏ vào `/khoe`.

## 4. Không tin đầu vào

**Pydantic lo hình dạng, code của bạn lo ý nghĩa.** `"   "` là chuỗi hợp lệ về mặt kiểu — chỉ logic nghiệp vụ mới biết nó vô nghĩa.

> ⚠️ **Giới hạn độ dài là chuyện tiền bạc.** Không giới hạn thì một request 500.000 ký tự đi thẳng vào API và **bạn** trả tiền. Đó là cách rất rẻ để ai đó làm cạn ví bạn — không cần kỹ năng gì.
>
> Nguyên tắc: **cái gì từ chối được sớm thì từ chối sớm** — trước khi chạm tới bất cứ thứ gì tính tiền.

## 5. Lỗi phải có mã, và không được lộ ruột gan

| Lỗi | HTTP | Vì sao |
|---|---|---|
| `RateLimitError` | 429 | Người gọi thử lại sau |
| `AuthenticationError` | **500** | Key của **bạn** sai — không phải lỗi của người gọi |
| `APIConnectionError` | 503 | Dịch vụ phụ thuộc gián đoạn |
| Không biết trước | 500 | Mặc định an toàn |

Dòng thứ hai là chỗ nhiều người làm sai. Trả 401 là **nói dối** và làm người dùng đi tìm nhầm chỗ.

Và thông điệp ra ngoài **không chứa chi tiết kỹ thuật**:

```
❌ "AuthenticationError: invalid x-api-key sk-ant-api03-..."
✅ "Lỗi cấu hình máy chủ"
```

Chi tiết đầy đủ đi vào **log của bạn**, kèm `trace_id`. Thông báo lỗi chi tiết là một kênh rò rỉ thông tin.

## 6. ⭐⭐ Quan sát: vì sao trung bình nói dối

Số đo thật từ notebook 02, trên 1.000 request của một dịch vụ hoàn toàn bình thường:

| Chỉ số | Giá trị |
|---|---|
| Trung bình | 595 ms ← *nghe ổn* |
| p50 | 201 ms |
| p95 | 350 ms |
| **p99** | **10.087 ms** |
| Chậm nhất | 12.102 ms |

Trung bình (595 ms) **cao hơn cả p95** (350 ms). Nó không mô tả một người dùng nào cả: 95% người dùng nhanh hơn thế nhiều, và 5% còn lại chậm hơn thế rất nhiều.

> 📌 **Độ trễ là phân bố lệch phải.** Trung bình chỉ mô tả được phân bố đối xứng.
>
> Và 5% người dùng chậm đó không phải 5% ngẫu nhiên mỗi lần — họ thường là người có prompt dài nhất, tức là **người dùng nặng nhất của bạn**.

> ⚠️ **Nhưng bảng này còn dạy một điều nữa, và nó quan trọng không kém:** p95 ở đây là **350 ms** — trông rất đẹp. Cái đuôi 10 giây chỉ lộ ra ở **p99**.
>
> Lý do đơn giản: đúng 5% request chậm, nên p95 rơi ngay vào ranh giới và vẫn nằm bên phần nhanh. **Chọn nhầm phân vị thì bạn không thấy gì cả.**
>
> Nguyên tắc thực dụng: báo cáo **p50, p95 và p99 cùng nhau**. Một con số duy nhất — dù là trung bình hay p95 — đều giấu được một sự thật khó chịu.

Ba thứ phải có trong log:

| Thứ | Vì sao |
|---|---|
| **Có cấu trúc** (JSON) | *"Request nào chậm hơn 2 giây?"* là phép lọc, không phải bài toán regex |
| **`trace_id`** | Thứ duy nhất nối 12 dòng log rời rạc của cùng một request |
| **Đã lọc secret** | Kiểm bằng cách **đọc log thật**, không phải đọc code |

## 7. ⭐ Kiểm soát chi phí

### Ngân sách: `cho_phep` ≠ `ghi_nhan`

Trước khi gọi API bạn chỉ **ước lượng** được chi phí; con số thật chỉ có sau, dựa trên `usage`. Gộp làm một hàm nghĩa là hoặc bạn chặn dựa trên số liệu sai, hoặc bạn ghi nhận một chi phí chưa xảy ra.

Và ngân sách phải **CHẶN**, không chỉ cảnh báo. Một cảnh báo lúc 2 giờ sáng không ngăn được gì.

### Giới hạn tần suất: token bucket

> ⚠️ **Vì sao không dùng "tối đa N request mỗi phút"?**
>
> Đếm theo cửa sổ cố định cho phép **gấp đôi** tải ở ranh giới: 100 request lúc 10:00:59 và 100 request nữa lúc 10:01:00 đều "hợp lệ" — nhưng máy chủ nhận 200 request trong một giây.
>
> Token bucket không có ranh giới để mà lách.

### Thứ tự các cửa

```
giới hạn tần suất  →  ngân sách  →  ngắt mạch  →  gọi API thật
      (phép trừ)     (phép cộng)   (so sánh)    (một vòng mạng)
```

Mỗi cửa đắt hơn cửa trước, nên cửa rẻ nhất đứng đầu. Đặt sai thứ tự nghĩa là bạn trả tiền cho những request lẽ ra đã bị từ chối miễn phí.

## 8. ⭐ Ngắt mạch

Khi dịch vụ phụ thuộc gián đoạn, mỗi request của bạn chờ tới khi timeout — 30 giây chẳng hạn. Người dùng đợi 30 giây để nhận một lỗi. Kết nối của bạn bị chiếm hết bởi những request **chắc chắn thất bại**. Ứng dụng của bạn chết theo, dù lỗi không phải của nó.

Ba trạng thái:

```
dong     --(đủ N lỗi LIÊN TIẾP)-->  mo
mo       --(qua thời gian chờ)-->   thu_lai
thu_lai  --(thành công)-->          dong
thu_lai  --(thất bại)-->            mo, đếm lại thời gian
```

Ngắt mạch biến **30 giây chờ đợi vô ích thành một lỗi trả về tức thì**, và giữ lại tài nguyên cho những việc còn chạy được.

> 📌 **Trạng thái được TÍNH, không được LƯU.** Nếu lưu `"thu_lai"` vào một biến, phải có ai đó gọi để cập nhật nó đúng lúc. Tính lại mỗi lần đọc thì không bao giờ lệch, và không cần thành phần nào khác.

## 9. Docker

Ba quyết định trong `mau/Dockerfile`:

| Quyết định | Giải quyết gì |
|---|---|
| **Hai tầng** | Ảnh nhỏ hơn, và không có compiler trong ảnh production |
| **Copy `pyproject.toml` trước** | Giữ cache Docker khi chỉ sửa một dòng code |
| **`USER ungdung`** | Thoát ra được thì cũng không phải root |

> ⚠️ **`.dockerignore` không phải chuyện kích thước.**
>
> Ảnh Docker là một chuỗi **tầng**, và mỗi tầng đọc lại được. Xoá file ở tầng sau **không** xoá nó khỏi tầng trước — `docker history --no-trunc` vẫn lấy ra được.
>
> Một file `.env` lọt vào build context sẽ nằm trong ảnh **vĩnh viễn**, kể cả khi dòng lệnh tiếp theo là `RUN rm .env`.

Mục nguy hiểm nhất là **`.git`** — nó chứa toàn bộ lịch sử, kể cả key đã bị xoá ở commit sau.

**Bí mật truyền lúc CHẠY, không phải lúc build:**

```
❌ ENV ANTHROPIC_API_KEY=...     ❌ COPY .env .     ❌ ARG API_KEY
✅ docker run --env-file .env ...
```

## 10. CI không được gọi API thật

| Lý do | Hậu quả nếu vi phạm |
|---|---|
| Chậm và không ổn định | Test đỏ vì mạng, không phải vì code |
| Tốn tiền mỗi lần push | Hoá đơn tăng theo số lần sửa typo |
| Cần API key trong CI | Thêm một chỗ để lộ key |

Đặt một **key giả** trong CI. Nếu test nào đó lỡ gọi API thật, nó thất bại ngay — và đó chính là điều bạn muốn: **CI phát hiện ra, không phải hoá đơn phát hiện ra.**

### Quét secret cần danh sách cho phép

> ⚠️ Bộ dò bí mật nào cũng bắt nhầm. Không có allowlist thì CI đỏ ở mọi lần push vì cảnh báo giả — và điều xảy ra tiếp theo luôn giống nhau: **người ta tắt luôn công cụ.** Rồi lần key thật bị commit, không còn ai canh nữa.
>
> Mọi bộ dò thật (gitleaks, trufflehog, GitHub secret scanning) đều có cơ chế này. **Một cảnh báo bị bỏ qua tệ hơn không có cảnh báo**, vì nó cho bạn cảm giác an toàn giả.

---

## 📝 Bài tập

| Bài | Nội dung | Test |
|---|---|---|
| `ex01_cau_hinh_bao_mat.py` | Đọc cấu hình, che secret, lọc log, readiness | `pytest tests/phase10/test_ex01.py` |
| `ex02_api.py` | Ánh xạ lỗi, validate, SSE, FastAPI app | `pytest tests/phase10/test_ex02.py` |
| `ex03_van_hanh.py` ⭐⭐ | p95, bộ đếm, ngân sách, token bucket, ngắt mạch, trace | `pytest tests/phase10/test_ex03.py` |

```powershell
pytest tests/phase10 -v
```

---

## ✅ Danh sách kiểm trước khi lên production

**Bí mật**
- [ ] API key KHÔNG nằm trong code, ảnh Docker, hay lịch sử Git
- [ ] `.env` nằm trong `.gitignore` **VÀ** `.dockerignore`
- [ ] Log đã lọc secret — kiểm bằng cách **đọc log thật**
- [ ] Đã đặt hạn mức chi tiêu ở Console Anthropic

**Cấu hình**
- [ ] Fail fast: cấu hình sai thì không khởi động
- [ ] `GHI_LOG_PROMPT` tắt ở prod
- [ ] Model ID không có hậu tố ngày tháng

**Khả dụng**
- [ ] `/khoe` và `/san_sang` là hai endpoint **khác nhau**
- [ ] `HEALTHCHECK` trỏ vào `/khoe`
- [ ] Có timeout cho mọi lời gọi ra ngoài
- [ ] Có ngắt mạch cho dịch vụ phụ thuộc

**Chi phí**
- [ ] Có giới hạn độ dài đầu vào
- [ ] Có giới hạn tần suất
- [ ] Ngân sách **CHẶN**, không chỉ cảnh báo
- [ ] Đã ngoại suy chi phí cho lưu lượng dự kiến

**Quan sát**
- [ ] Log có cấu trúc, có `trace_id`
- [ ] Đo p95, không chỉ trung bình
- [ ] Có cảnh báo khi tỷ lệ lỗi hoặc chi phí vượt ngưỡng

**Vận hành**
- [ ] CI chạy test mà **không gọi API thật**
- [ ] Biết cách rollback về phiên bản trước
- [ ] ⭐ **Đã thử tắt dịch vụ phụ thuộc và xem ứng dụng phản ứng thế nào**

> ⭐ Mục cuối cùng ít người làm nhất và đáng giá nhất. Bạn viết ngắt mạch, viết timeout, viết xử lý lỗi — nhưng cho tới khi thử tắt thật, bạn chỉ đang **hy vọng** chúng hoạt động.
>
> Cách thử rẻ nhất: đổi `ANTHROPIC_API_KEY` thành chuỗi rác, hoặc trỏ `base_url` vào một cổng không có gì. Rồi nhìn: dịch vụ trả về gì? Sau bao lâu? Log có đủ để gỡ lỗi không?

---

## 📌 Nộp bài

```powershell
pytest tests/phase10 -v
git add .
git commit -m "Tuan 22: hoan thanh phase 10 - Deploy va Van hanh"
git push
```

Xong Phase 10 → làm [mini-project](mini_project/README.md), rồi đưa **P6** hoặc **P7** lên internet thật.

---

⬅️ [Phase 09](../09-agents/README.md) · ➡️ [Phase 11 — Capstone](../11-capstone/README.md)
