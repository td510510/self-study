# 🛠 Mini-project Phase 10 — Đưa dịch vụ lên internet

**Thời gian:** 6–8 giờ (Tuần 22) · **Không có lời giải** · **Chi phí: $0–2**

> Đây là mini-project **duy nhất trong khoá học có kết quả là một URL người khác
> mở được**. Nó cũng là thứ bạn dán vào CV.

---

## Đề bài

Lấy **P6 (RAG Q&A)** hoặc **P7 (Agent)** — thứ bạn đã xây — và biến nó thành một
dịch vụ chạy trên internet, có đủ lớp vận hành của Phase 10.

Không xây lại logic. Chỉ **bọc** nó lại cho đúng.

```
mini_project/
├── app.py               # FastAPI: /khoe /san_sang /hoi /phien_ban /so_lieu
├── cau_hinh.py          # đọc một lần, kiểm ngay, đóng băng
├── van_hanh.py          # bộ đếm, ngân sách, giới hạn tần suất, ngắt mạch
├── ghi_log.py           # log JSON có trace_id, đã lọc secret
├── Dockerfile
├── .dockerignore
├── .github/workflows/ci.yml
├── test_app.py          # >= 12 test, chạy KHÔNG cần API key
└── README.md            # hướng dẫn deploy + URL công khai
```

Bắt đầu từ `curriculum/10-deploy-ops/mau/` — ba file ở đó đã đúng, bạn chỉ cần
chỉnh cho khớp dự án của mình.

---

## Yêu cầu bắt buộc

### ① Cấu hình và bí mật

- [ ] `doc_cau_hinh(os.environ)` — một chỗ duy nhất chạm tới môi trường
- [ ] Dataclass `frozen=True`
- [ ] **Fail fast**: cấu hình sai thì không khởi động
- [ ] Log đã lọc secret **đệ quy** — kiểm bằng cách đọc log thật
- [ ] `.env` nằm trong **cả** `.gitignore` và `.dockerignore`

### ② API

- [ ] `/khoe` luôn 200 nếu tiến trình còn sống, **không kiểm gì khác**
- [ ] `/san_sang` trả 503 khi chưa sẵn sàng
- [ ] `/hoi` validate đầu vào, có **giới hạn độ dài**
- [ ] `/phien_ban` **không lộ** bất kỳ bí mật nào
- [ ] `/so_lieu` trả về p50/p95/p99, tỷ lệ lỗi, chi phí tích luỹ
- [ ] Mọi lỗi trả về `{"ma_loi": ..., "thong_diep": ...}`, không lộ traceback
- [ ] Streaming qua SSE cho `/hoi?stream=true` *(nếu dự án của bạn hợp)*

### ③ Vận hành

- [ ] Bộ đếm: p50, **p95 và p99** *(đừng chỉ p95 — bài 2 cho thấy vì sao)*
- [ ] Ngân sách **CHẶN**, không chỉ cảnh báo
- [ ] Giới hạn tần suất bằng token bucket
- [ ] Ngắt mạch cho lời gọi ra Anthropic
- [ ] Thứ tự bốn cửa: tần suất → ngân sách → ngắt mạch → gọi thật
- [ ] Timeout cho mọi lời gọi ra ngoài

### ④ Log

- [ ] JSON có cấu trúc, mỗi request một `trace_id`
- [ ] Ghi ít nhất 4 sự kiện mỗi request: nhận, gọi model, model trả về, trả về
- [ ] Có `do_tre_ms`, `token_vao`, `token_ra`, `chi_phi_usd`
- [ ] **Không có** prompt người dùng ở prod

### ⑤ Docker và CI

- [ ] Build nhiều tầng, `USER` không phải root
- [ ] `HEALTHCHECK` trỏ vào `/khoe`
- [ ] `docker history` **không** chứa chuỗi giống API key
- [ ] CI: lint + test + build ảnh + quét secret (có allowlist)
- [ ] CI chạy test với **key giả** và vẫn xanh

### ⑥ Deploy thật

- [ ] Chạy được trên một nền tảng công khai
- [ ] URL mở được từ máy khác
- [ ] Secret đặt qua secret manager của nền tảng, **không** trong ảnh
- [ ] README có hướng dẫn deploy lại từ đầu

Vài nền tảng có gói miễn phí đủ dùng cho việc này:

| Nền tảng | Ghi chú |
|---|---|
| **Fly.io** | `fly launch` đọc được Dockerfile của bạn, có `fly secrets set` |
| **Railway** | Deploy từ GitHub, giao diện đơn giản |
| **Render** | Có gói miễn phí, dịch vụ ngủ khi không dùng |
| **Hugging Face Spaces** | Miễn phí, hợp nếu bạn thêm giao diện Gradio |

> ⚠️ **Đặt hạn mức chi tiêu ở Console Anthropic trước khi deploy.** Một URL công
> khai nghĩa là bất kỳ ai cũng gọi được — và bạn trả tiền cho mọi lời gọi. Giới
> hạn tần suất là lớp bảo vệ đầu, hạn mức chi tiêu là lớp cuối.

### ⑦ `test_app.py` — ≥ 12 test, không cần API key

- [ ] `/khoe` trả 200 **kể cả khi** `/san_sang` trả 503
- [ ] `/san_sang` trả 503 khi cấu hình hỏng
- [ ] `/phien_ban` không chứa `sk-ant` và không chứa `api_key`
- [ ] Câu hỏi rỗng → 400 với `ma_loi`
- [ ] Câu hỏi quá dài → 400
- [ ] Lỗi rate limit của SDK → 429
- [ ] Lỗi xác thực của SDK → **500** (không phải 401)
- [ ] Lỗi bất kỳ → không lộ traceback, không lộ key
- [ ] Vượt giới hạn tần suất → 429
- [ ] Hết ngân sách → từ chối, và **không gọi model**
- [ ] Ngắt mạch mở → từ chối **ngay**, không chờ timeout
- [ ] Log của một request có `trace_id` và **không** chứa secret

> ⭐ Ba dòng cuối là ba dòng dễ bỏ qua nhất, và chúng kiểm đúng thứ Phase 10 dạy:
> **guardrail phải thật sự chặn**, không chỉ trả về một dict trông giống chặn.
> Test phải khẳng định hàm gọi model **không được gọi**.

---

## Nâng cao

- [ ] **Cache câu trả lời**: câu hỏi giống hệt trong N phút → trả lại kết quả cũ. Đo tiền tiết kiệm được
- [ ] **Prompt caching** của Claude cho phần hướng dẫn — đo `cache_read_input_tokens` thật
- [ ] `/so_lieu` xuất theo định dạng Prometheus
- [ ] **Ngân sách theo người dùng**, không chỉ theo toàn hệ thống
- [ ] Chạy 2 instance sau một load balancer — phát hiện ra ngân sách và giới hạn tần suất **không còn đúng** vì mỗi tiến trình đếm riêng
- [ ] Đẩy log lên một nơi tìm kiếm được, rồi thử trả lời: *"request chậm nhất hôm qua là request nào, nó làm gì?"*

> ⭐ Ý áp chót là ý đáng làm nhất. Mọi thứ bạn viết ở Phase 10 đều là **trạng thái
> trong bộ nhớ của một tiến trình**. Chạy hai bản sao thì bạn có hai cái ngân sách,
> hai cái xô token, hai cái ngắt mạch — và tổng chi tiêu thật gấp đôi con số bạn đang theo dõi.
>
> Đó là lúc bạn cần Redis hoặc một kho đếm dùng chung. Không cần làm ngay, nhưng
> **phải biết là mình chưa làm** — chứ không phải phát hiện ra khi nhìn hoá đơn.

---

## ✅ Tự chấm

| Tiêu chí | Đạt khi |
|---|---|
| **URL công khai** | Người khác mở được từ máy họ |
| **Không lộ secret** | `docker history` sạch, `/phien_ban` sạch, log sạch |
| **Health check đúng** | `/khoe` và `/san_sang` tách bạch, HEALTHCHECK trỏ `/khoe` |
| **Guardrail thật sự chặn** | Test khẳng định hàm gọi model KHÔNG được gọi |
| **Quan sát được** | `/so_lieu` cho p50/p95/p99, tỷ lệ lỗi, chi phí |
| **CI xanh, không tốn tiền** | Test chạy với key giả |
| **Deploy lại được** | README đủ để người khác dựng lại từ đầu |

---

## 💡 Gợi ý

<details><summary>Thứ tự bốn cửa trong một endpoint</summary>

```python
@app.post("/hoi")
def hoi(yeu_cau: YeuCauHoi):
    trace_id = uuid.uuid4().hex[:8]

    # Rẻ nhất trước - đừng trả tiền cho request đã bị từ chối miễn phí
    if not gioi_han.cho_phep():
        return _loi(429, "qua_nhieu_yeu_cau", "Quá nhiều yêu cầu", trace_id)
    if not so.cho_phep(UOC_LUONG_CHI_PHI):
        return _loi(429, "het_ngan_sach", "Hệ thống tạm ngưng phục vụ", trace_id)
    if not ngat_mach.cho_goi():
        return _loi(503, "dich_vu_gian_doan", "Dịch vụ tạm gián đoạn", trace_id)

    ...  # gọi thật
```

Ba cửa đầu là **phép trừ, phép cộng và một so sánh**. Cửa thứ tư là một vòng
mạng mất một giây. Đặt sai thứ tự thì bạn đang trả tiền cho việc từ chối.
</details>

<details><summary>Test "guardrail thật sự chặn" viết thế nào?</summary>

```python
def test_het_ngan_sach_thi_KHONG_goi_model():
    da_goi = []

    def goi_model(cau_hoi, max_token):
        da_goi.append(cau_hoi)
        return "trả lời"

    app = tao_app(goi_model, cau_hinh_ngan_sach_0)
    r = TestClient(app).post("/hoi", json={"cau_hoi": "xin chào"})

    assert r.status_code == 429
    assert da_goi == []          # <- DÒNG QUAN TRỌNG NHẤT
```

Dòng cuối là dòng phân biệt *"trả về đúng mã lỗi"* với *"thật sự không tiêu tiền"*.

Một guardrail trả về `{"ok": False}` nhưng vẫn để lời gọi chạy là guardrail
**nguy hiểm hơn không có** — vì bạn tin là mình đang được bảo vệ.
</details>

<details><summary>Ghi log JSON có trace_id</summary>

```python
import json, logging, sys, uuid

def ghi(trace_id, su_kien, **truong):
    ban_ghi = loc_ban_ghi({"trace_id": trace_id, "su_kien": su_kien, **truong})
    print(json.dumps(ban_ghi, ensure_ascii=False), file=sys.stdout, flush=True)
```

Ba chi tiết dễ bỏ qua:

| Chi tiết | Vì sao |
|---|---|
| `flush=True` | Container bị dừng đột ngột thì log chưa flush sẽ mất — đúng lúc bạn cần nó nhất |
| Ghi ra **stdout** | Docker và mọi nền tảng đều thu log từ stdout. Ghi ra file là tự tạo việc |
| Qua `loc_ban_ghi` | Lọc ở **một chỗ duy nhất**. Nhớ lọc ở 12 chỗ gọi thì sẽ quên ở chỗ thứ 13 |
</details>

<details><summary>Kiểm ảnh Docker không chứa key</summary>

```powershell
docker build -t dich-vu .
docker history --no-trunc dich-vu | Select-String "sk-ant"
docker run --rm dich-vu env | Select-String "sk-ant"
```

Lệnh thứ hai đọc **mọi tầng**, kể cả tầng đã bị ghi đè. Đây là lệnh chứng minh
vì sao `RUN rm .env` không cứu được bạn.
</details>

---

## 📌 Nộp bài

```powershell
pytest curriculum/10-deploy-ops/mini_project -v
docker build -t dich-vu .
docker run --rm -p 8000:8000 --env-file .env dich-vu
# máy khác: curl https://<url-cua-ban>/khoe
git add .
git commit -m "Mini-project phase 10: dua dich vu len internet"
git push
```

Bài test khắt khe nhất cho project này:

> Deploy xong, **đổi API key trên máy chủ thành một chuỗi rác** rồi gọi dịch vụ.
>
> Đúng: trả về 503 kèm mã lỗi rõ ràng **trong dưới một giây**, `/san_sang` báo đỏ,
> `/khoe` vẫn xanh, log có `trace_id` và đủ thông tin để gỡ lỗi, và **không có
> chuỗi key nào trong log**.
>
> Sai: treo 30 giây rồi trả về một trang traceback.
>
> Bạn chỉ biết mình ở phía nào sau khi **thử thật**.

---

⬅️ [Phase 10](../README.md) · ➡️ [Phase 11 — Capstone](../../11-capstone/README.md)
