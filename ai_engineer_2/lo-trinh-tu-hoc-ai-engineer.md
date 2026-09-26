# Lộ trình tự học AI Engineer — 40 tuần × 10h/tuần

> Bám theo khung chương trình trong [noi-dung-khoa-hoc-ai-engineering.md](./noi-dung-khoa-hoc-ai-engineering.md) (3 phần / 10 môn / 362 giờ).
> **Hồ sơ người học giả định:** lập trình viên có kinh nghiệm (nền Java/Spring), Python gần như mới, quỹ thời gian ~10h/tuần khi vẫn đi làm full-time.

---

## 0. Thiết kế lộ trình

### Điều chỉnh so với khung gốc

| Môn | Giờ gốc | Giờ tự học | Lý do |
|---|---|---|---|
| 1. Tư duy lập trình Python | 40 | **20** | Bạn đã có tư duy lập trình. Chỉ cần "chuyển ngữ" cú pháp + idiom, không cần học lại vòng lặp/OOP từ đầu. |
| 2. Kỹ thuật lập trình cho AI | 36 | 36 | Giữ nguyên. Async, embedding, token là kiến thức mới hoàn toàn. |
| 3. Kỹ thuật dữ liệu | 36 | 36 | Giữ nguyên. |
| 4. Lập trình AI cơ bản | 36 | 36 | Giữ nguyên. |
| 5. Web AI | 40 | 40 | Giữ nguyên (frontend là điểm mù của dev backend). |
| 6. Nền tảng AI Agent | 36 | 36 | Giữ nguyên. |
| 7. Multi-agent | 36 | 36 | Giữ nguyên. |
| 8. Deep Learning & Transformer | 36 | **46** | +10h. Đây là môn khó nhất với người không nền toán/ML; tự học không có giảng viên gỡ rối nên phải cộng giờ. |
| 9. AI Engineering / hạ tầng | 36 | **46** | +10h. Phần tạo ra khác biệt giữa "AI Developer" và "AI Engineer" — và tốn thời gian vì phải vật lộn với GPU, Docker, quota. |
| 10. Đồ án | 30 | 30 | Giữ nguyên. |
| **Tổng** | **362** | **~367** | + Tuần 0 (5h setup) |

### Quy tắc bất di bất dịch

1. **Tỉ lệ 30/70.** Tối đa 3h/tuần đọc–xem, tối thiểu 7h/tuần gõ code. Xem video không phải là học.
2. **Mỗi tuần đóng 1 commit có ý nghĩa.** Repo `ai-engineer-journey` trên GitHub, mỗi tuần 1 thư mục `wNN-<chủ-đề>` + README ghi "làm được gì / hỏng ở đâu / hiểu ra điều gì".
3. **Không xem lời giải trước 25 phút vật lộn.** Nhưng cũng không vật lộn quá 90 phút — quá 90 phút là dấu hiệu thiếu kiến thức nền, quay lại lấp chứ đừng cố.
4. **Mỗi phần kết thúc bằng một artefact chạy được**, không phải bằng "đã học xong".
5. **Không nhảy cóc sang Agent/LLMOps khi Phần I chưa xong.** 90% người tự học chết ở đây: build agent hào nhoáng trên nền Python lởm khởm, rồi không debug nổi.
6. **Nhật ký lỗi (`ERRORS.md`).** Mỗi lỗi mất >30 phút thì ghi: triệu chứng → nguyên nhân thật → cách sửa. Sau 9 tháng đây là tài sản giá trị nhất, và cũng là kho câu chuyện khi phỏng vấn.

### Lịch tuần mẫu (10h)

| Ngày | Thời lượng | Việc |
|---|---|---|
| T2, T4, T6 | 1,5h/buổi tối | Học khái niệm mới + code theo |
| T3, T5 | 0,5h | Ôn nhanh / đọc tài liệu / xem lại code hôm trước |
| T7 hoặc CN | 4h liền mạch | Thực hành sâu — làm deliverable của tuần |

> Buổi 4h cuối tuần là **bất khả xâm phạm**. Việc kỹ thuật sâu cần khối thời gian liền, không chia nhỏ được.

### Chuẩn cấu trúc mỗi tuần — 4 khối bắt buộc

Mọi tuần trong mọi giáo án đều theo đúng khuôn này. Thiếu một khối là tuần đó chưa hoàn thành.

| Khối | Thời lượng | Nội dung | Tiêu chí "xong" |
|---|---|---|---|
| **① Lý thuyết** | ~2h (30%) | Khái niệm, mô hình tư duy, bảng so sánh, khi nào dùng / khi nào không | Giải thích lại được bằng lời trong 2 phút, không nhìn tài liệu |
| **② Code ví dụ** | ~2h | Code mẫu chạy được, gõ lại tay (không copy-paste), có chú thích ❌/✅ chỉ rõ cách sai và cách đúng | Chạy được trên máy bạn, sửa được tham số và giải thích được kết quả đổi |
| **③ Thực hành** | ~2h | 3–5 bài tập nhỏ tăng dần độ khó, **có lời giải gấp trong `<details>`** | Làm đúng ≥4/5 bài, tự làm trước khi mở lời giải |
| **④ Đồ án tuần** | ~4h | Một sản phẩm nhỏ chạy được, ghép vào hệ thống đang xây | Vượt hết checklist nghiệm thu, commit lên GitHub |

> **Luật vàng khi làm khối ③:** vật lộn tối thiểu 25 phút mới được mở lời giải, nhưng không quá 90 phút. Quá 90 phút là dấu hiệu thiếu kiến thức nền — quay lại khối ① chứ đừng cố.

### Hệ thống đồ án 4 tầng

Đây là điểm khác biệt lớn nhất so với cách "học xong 10 môn". Kiến thức chỉ đọng lại khi được dùng lại nhiều lần ở quy mô lớn dần.

```
Tầng 1 — Bài thực hành      : mỗi buổi, 20–40 phút, có lời giải       → nắm cú pháp/API
Tầng 2 — Đồ án tuần         : 4h cuối tuần, 40 đồ án nhỏ              → ghép mảnh vào hệ thống
Tầng 3 — Đồ án môn học      : cuối mỗi môn, 10 đồ án, có báo cáo      → tích hợp cả môn
Tầng 4 — Sản phẩm portfolio : cuối mỗi phần, 4 sản phẩm + đồ án TN    → thứ đưa vào CV
```

**Mười đồ án môn học:**

| Môn | Tuần | Đồ án môn học | Sản phẩm nộp |
|---|---|---|---|
| 1. Python | T1–T2 | `textkit` — thư viện xử lý văn bản tiếng Việt | Package cài được + test ≥80% |
| 2. Kỹ thuật lập trình AI | T3–T6 | `llm-lab` — CLI gọi LLM song song, đo token/chi phí/độ trễ | CLI + báo cáo benchmark có biểu đồ |
| 3. Kỹ thuật dữ liệu | T7–T10 | `ingest` — pipeline thu thập → trích xuất → chunk → vector index | CLI một lệnh + báo cáo so sánh 3 chiến lược chunking |
| 4. Lập trình AI cơ bản | T11–T14 | 🏆 **Sản phẩm 1** — RAG có bằng chứng | Bot + báo cáo eval 6 cấu hình |
| 5. Web AI | T15–T18 | 🏆 **Sản phẩm 2** — Web app AI deploy công khai | URL HTTPS + tài khoản demo + GIF |
| 6. Nền tảng Agent | T19–T22 | `research-agent` — agent nghiên cứu có bộ nhớ dài hạn | Agent + sơ đồ graph + trace |
| 7. Multi-agent | T23–T26 | 🏆 **Sản phẩm 3** — hệ multi-agent + MCP server + HITL | Hệ thống + eval agent |
| 8. Deep Learning | T27–T31 | `mini-gpt` + fine-tune LoRA | Model train được + báo cáo so sánh fine-tune vs RAG vs prompt |
| 9. AI Engineering | T32–T36 | 🏆 **Sản phẩm 4** — nền tảng LLM tự vận hành | Gateway + CI/CD + dashboard |
| 10. Đồ án tốt nghiệp | T37–T39 | Bài toán thuộc miền nghiệp vụ của bạn | Hệ thống + design doc + báo cáo + video demo |

**Mỗi đồ án môn học phải nộp kèm `BAOCAO.md`** gồm 5 mục — đây là khuôn viết báo cáo bạn dùng lại cho đồ án tốt nghiệp:

1. **Bài toán** — giải quyết cái gì, cho ai, vì sao cần.
2. **Kiến trúc** — sơ đồ + giải thích từng thành phần.
3. **Kết quả đo được** — bảng số liệu, biểu đồ (không được viết "chạy tốt" mà không có số).
4. **Đánh đổi** — đã cân nhắc phương án nào, chọn gì, bỏ gì, vì sao.
5. **Hạn chế & hướng phát triển** — chỗ nào còn yếu, làm tiếp thì làm gì.

> Mục 4 và 5 là thứ phân biệt kỹ sư với người làm theo tutorial. Người phỏng vấn đọc đúng hai mục đó.

---

## GIAI ĐOẠN 0 — Tuần 0: Dựng môi trường (5h)

Không học lý thuyết, chỉ để mọi thứ chạy được. Nếu không làm tuần này, bạn sẽ mất rải rác 15h trong 3 tháng tới.

- [ ] Cài **Python 3.12** + `uv` (thay pip/venv/poetry — nhanh và gọn hơn hẳn).
- [ ] VS Code + extension: Python, Pylance, Ruff, Jupyter, Docker.
- [ ] Cài **Docker Desktop** (Windows: bật WSL2).
- [ ] Git + GitHub, tạo repo `ai-engineer-journey`, push commit đầu tiên.
- [ ] Đăng ký API key: một provider trả phí (Anthropic hoặc OpenAI, nạp $20) + một provider free-tier (Google AI Studio / Groq) để test thoải mái.
- [ ] Cài **Ollama**, chạy thử `ollama run qwen3:8b` — để sau này có model local dùng miễn phí.
- [ ] Tạo file `ERRORS.md` và `PROGRESS.md` trong repo.

**Kiểm tra đạt:** chạy được `uv run python -c "print('ok')"`, `docker run hello-world`, và một script Python gọi API LLM in ra câu trả lời.

---

## PHẦN I — NỀN TẢNG ỨNG DỤNG AI (Tuần 1–18 · 168h)

### Môn 1+2 — Python & kỹ thuật lập trình cho AI (Tuần 1–6 · 56h)

Học Python theo kiểu **"chuyển ngữ từ Java"**, không học lại lập trình.

| Tuần | Nội dung | Deliverable cuối tuần |
|---|---|---|
| **T1** (10h) | Cú pháp Python cho dev Java: kiểu động, truthy/falsy, f-string, list/dict/set/tuple, comprehension, unpacking, `*args/**kwargs`, EAFP vs LBYL. Type hints + `mypy` (quen thuộc và nên dùng ngay). | Viết lại 5 bài thuật toán bạn từng làm bằng Java sang Python idiomatic — không dùng vòng lặp `for i in range(len(x))` một lần nào. |
| **T2** (10h) | OOP Python: `dataclass`, `@property`, duck typing, `__init__` vs `__new__`, context manager (`with`), iterator/generator, decorator. `Pydantic v2` — sẽ dùng xuyên suốt phần sau. | Một package nhỏ `mylib/` có `pyproject.toml`, class + generator + decorator, cài được bằng `uv pip install -e .` |
| **T3** (10h) | Công cụ nghề: `uv` quản môi trường, `ruff` lint/format, `pytest` (fixture, parametrize, mock), `logging` chuẩn, biến môi trường với `.env` + `pydantic-settings`. Git branching, PR, conventional commits. | Package tuần 2 đạt **coverage ≥ 80%**, CI GitHub Actions chạy lint + test xanh. |
| **T4** (10h) | Nền tảng web/API: HTTP method, status code, header, REST, JSON schema. `httpx` (sync + async), retry/backoff, timeout, xử lý lỗi mạng. Gọi LLM API bằng SDK và bằng raw HTTP. | CLI tool gọi 1 REST API công khai + 1 LLM API, có retry, timeout, log, test bằng mock. |
| **T5** (10h) | **Async/await** — chương quan trọng nhất tuần này. Event loop, coroutine, `asyncio.gather`, `TaskGroup`, semaphore giới hạn concurrency, async context manager. So sánh với thread pool Java: vì sao LLM app bắt buộc phải async. | Script gọi **50 request LLM song song**, giới hạn 5 concurrent, đo thời gian so với chạy tuần tự. Ghi lại con số. |
| **T6** (6h) | **Token & embedding — nền tảng khái niệm.** Tokenization (`tiktoken`), context window, tính chi phí theo token. Vector là gì, cosine similarity, embedding model, vì sao "gần nhau về nghĩa" = "gần nhau trong không gian vector". | Script: nhập 20 câu → sinh embedding → tìm câu gần nhất với câu truy vấn, in điểm similarity. Tự tay viết cosine bằng numpy (đừng gọi thư viện). |

**Cổng kiểm tra Phần 1 (bắt buộc vượt qua mới đi tiếp):**
- Giải thích được async/await bằng lời trong 2 phút, không nhìn giấy.
- Ước tính được chi phí của một prompt 3000 token in + 800 token out.
- Repo có CI xanh, test, type hint.

---

### Môn 3 — Kỹ thuật dữ liệu cho hệ thống AI (Tuần 7–10 · 36h)

> Môn bị đánh giá thấp nhất nhưng quyết định 70% chất lượng RAG. Học nghiêm túc.

| Tuần | Nội dung | Deliverable |
|---|---|---|
| **T7** (9h) | Vòng đời dữ liệu. **Pandas**: Series/DataFrame, `loc/iloc`, filter, `groupby`, `merge`, xử lý missing/duplicate/outlier. SQL ôn nhanh (bạn đã biết): join, window function, CTE. Đọc/ghi CSV, Parquet, SQLite. | Notebook làm sạch một bộ dữ liệu thật (Kaggle) từ raw → clean, ghi rõ mỗi bước loại bỏ bao nhiêu dòng và tại sao. |
| **T8** (9h) | **Thu thập dữ liệu**: `httpx` + `BeautifulSoup`, `selectolax`, phân trang, rate limit, tôn trọng `robots.txt`, RSS feed, API có phân trang/cursor. Lưu trữ thô có versioning. | Crawler thu 500+ bài viết từ một nguồn tin, lưu JSONL + metadata (url, ngày, tác giả), chạy lại được mà không trùng lặp. |
| **T9** (9h) | **Trích xuất tài liệu**: PDF (`pymupdf`, `pdfplumber`), DOCX (`python-docx`), HTML→text, bảng biểu trong PDF, OCR (`tesseract` / `paddleocr`) cho ảnh và PDF scan. Xử lý tiếng Việt có dấu, chuẩn hóa Unicode NFC. | Pipeline nhận thư mục hỗn hợp (PDF/DOCX/ảnh) → xuất text sạch + metadata, có báo cáo file nào thất bại và vì sao. |
| **T10** (9h) | **Chunking & embedding cho RAG**: fixed-size, recursive, semantic, chunking theo cấu trúc tài liệu; overlap; giữ metadata (nguồn, trang) để trích dẫn. Batch embedding, chi phí, cache. Vector DB: **Qdrant** (Docker) hoặc Chroma; index, filter theo metadata. | Nạp toàn bộ dữ liệu tuần 8+9 vào Qdrant. Viết script truy vấn top-k. **So sánh 3 chiến lược chunking** trên cùng 15 câu hỏi, ghi bảng kết quả. |

**Cổng kiểm tra:** trả lời được "vì sao chunk 200 token và chunk 1500 token cho kết quả khác nhau, và khi nào chọn cái nào" bằng dữ liệu của chính bạn, không phải bằng lý thuyết đọc được.

---

### Môn 4 — Lập trình AI cơ bản (Tuần 11–14 · 36h)

| Tuần | Nội dung | Deliverable |
|---|---|---|
| **T11** (9h) | **Prompt engineering ở cấp lập trình** (không phải mẹo copy-paste): system vs user vs assistant role, few-shot, chain-of-thought, prompt template có biến, versioning prompt trong code, nhiệt độ và các tham số sampling. Kỹ thuật giảm ảo giác. | Module `prompts/` với template có version, 1 hàm render + test snapshot. Bộ 20 test case cho một tác vụ (vd. phân loại phản hồi khách hàng). |
| **T12** (9h) | **Đầu ra có cấu trúc**: JSON mode, structured output với Pydantic schema, validate + retry khi model trả sai định dạng. **Function/Tool calling**: định nghĩa tool, vòng lặp gọi tool, xử lý lỗi tool. Quản lý lịch sử hội thoại: cắt cửa sổ, tóm tắt lịch sử, đếm token. | Chatbot CLI có 3 tool thật (tra thời tiết, tính toán, tra cứu dữ liệu tuần 10), tự động retry khi JSON hỏng, không bao giờ vượt context window. |
| **T13** (9h) | **Xây chatbot RAG hoàn chỉnh**: pipeline retrieve → rerank → augment → generate. Hybrid search (BM25 + vector), reranker (`bge-reranker` / Cohere), trích dẫn nguồn, xử lý "không tìm thấy thì nói không biết". | RAG bot trả lời trên kho tài liệu tuần 9, **mọi câu trả lời đều kèm trích dẫn nguồn + số trang**. |
| **T14** (9h) | **Đo lường** — thứ tách AI Engineer khỏi người nghịch prompt. Bộ eval "vàng" 30–50 câu, các chỉ số RAG (faithfulness, answer relevancy, context precision/recall) với `ragas`; LLM-as-judge và cạm bẫy của nó. Theo dõi chi phí + độ trễ p50/p95. | **Báo cáo eval**: bảng so sánh ≥3 cấu hình (model rẻ/đắt, có/không rerank, 2 kiểu chunk) trên cùng bộ test — kèm chất lượng, chi phí/1000 câu, độ trễ p95. Kết luận chọn cấu hình nào và vì sao. |

> 🏆 **Sản phẩm 1 — "RAG có bằng chứng"**: chatbot RAG + báo cáo đánh giá định lượng. Riêng cái báo cáo eval này đã hơn phần lớn portfolio ứng viên AI ngoài thị trường.

---

### Môn 5 — Lập trình ứng dụng Web AI (Tuần 15–18 · 40h)

| Tuần | Nội dung | Deliverable |
|---|---|---|
| **T15** (10h) | **FastAPI** (ánh xạ từ Spring Boot: router ≈ controller, dependency injection ≈ `@Autowired`, Pydantic ≈ DTO + validation). Path/query/body, response model, middleware, exception handler, `lifespan`, OpenAPI docs tự sinh. Test API với `TestClient` + Postman. | REST API bọc RAG bot tuần 13, có docs Swagger, validation đầy đủ, test tích hợp. |
| **T16** (10h) | **Auth & session**: JWT (access + refresh), hash mật khẩu, dependency bảo vệ route, RBAC cơ bản, CORS. **Streaming**: SSE token-by-token, xử lý ngắt kết nối giữa chừng. Lưu lịch sử hội thoại vào Postgres. | API có đăng ký/đăng nhập, mỗi user có lịch sử chat riêng, endpoint chat **stream** từng token. |
| **T17** (10h) | **Frontend đủ dùng**: HTML/CSS/JS hiện đại (module, fetch, async), rồi **React + Next.js** (component, hook `useState`/`useEffect`, gọi API, đọc SSE stream), Tailwind cho giao diện. Không cần giỏi — cần đủ để trình bày sản phẩm. | Giao diện chat: đăng nhập, danh sách hội thoại, tin nhắn hiện dần theo stream, hiển thị nguồn trích dẫn. |
| **T18** (10h) | **Docker hóa**: Dockerfile cho backend và frontend, `docker compose` (app + Postgres + Qdrant), biến môi trường, healthcheck, volume. Deploy lên một VPS rẻ (hoặc Railway/Fly.io). | `docker compose up` là chạy toàn bộ hệ thống. Ứng dụng **có URL công khai truy cập được**. |

> 🏆 **Sản phẩm 2 — Web app RAG hoàn chỉnh, deploy công khai.** Đây là link bạn đưa vào CV.

**🚩 Mốc 4,5 tháng:** đến đây bạn đã đủ trình độ ứng tuyển vị trí **AI Developer / LLM Application Developer**. Bắt đầu rải CV song song với việc học tiếp — phỏng vấn là hình thức eval tốt nhất.

---

## PHẦN II — AI AGENT (Tuần 19–26 · 72h)

### Môn 6 — Nền tảng AI Agent (Tuần 19–22 · 36h)

| Tuần | Nội dung | Deliverable |
|---|---|---|
| **T19** (9h) | Agent là gì và **khi nào KHÔNG nên dùng agent** (rất quan trọng: workflow tất định rẻ và ổn định hơn agent trong đa số ca). Vòng lặp ReAct viết tay bằng Python thuần — tự tay code trước, dùng framework sau. | Agent ReAct **không dùng framework**, 3 tool, giới hạn số vòng lặp, log lại từng bước suy luận. |
| **T20** (9h) | **LangGraph**: State (TypedDict/Pydantic), Node, Edge, Conditional Edge, routing, checkpointer. Viết lại agent tuần 19 bằng LangGraph để thấy framework giải quyết gì. | Cùng agent đó trên LangGraph, có sơ đồ graph xuất ra ảnh, chạy lại được từ checkpoint. |
| **T21** (9h) | Điều phối tác vụ: tuần tự, song song (`fan-out/fan-in`), rẽ nhánh có điều kiện, retry node lỗi. Planner–Executor: tách "lập kế hoạch" khỏi "thực thi". Xử lý khi tool lỗi hoặc trả rác. | Agent nghiên cứu: nhận 1 chủ đề → lập kế hoạch → tìm song song 3 nguồn → tổng hợp báo cáo có trích dẫn. |
| **T22** (9h) | **Bộ nhớ**: short-term (cửa sổ hội thoại, tóm tắt cuộn), long-term (vector memory, hồ sơ người dùng, semantic memory), khi nào ghi/khi nào quên. Quản lý context: nén, chọn lọc, tránh "context rot". | Agent nhớ được sở thích người dùng qua nhiều phiên khác nhau, chứng minh bằng test 3 phiên liên tiếp. |

### Môn 7 — Agent nâng cao & Multi-agent (Tuần 23–26 · 36h)

| Tuần | Nội dung | Deliverable |
|---|---|---|
| **T23** (9h) | **MCP (Model Context Protocol)**: kiến trúc client–server, tool/resource/prompt. Dùng MCP server có sẵn, rồi **tự viết một MCP server** phục vụ dữ liệu của bạn. | MCP server riêng (vd. truy vấn kho tài liệu tuần 10), kết nối được từ Claude Desktop / Claude Code. |
| **T24** (9h) | **Mẫu multi-agent**: Router, Supervisor, Handoff, Sequential, Parallel, Hierarchical. Đánh đổi của từng mẫu (chi phí token nhân lên, lỗi lan truyền, khó debug). Giao thức trao đổi giữa agent. | Hệ multi-agent theo mẫu Supervisor: 1 điều phối + 3 agent chuyên trách, có sơ đồ kiến trúc. |
| **T25** (9h) | **Human-in-the-loop**: điểm dừng phê duyệt, interrupt/resume, chỉnh sửa state giữa chừng. **An toàn agent**: giới hạn quyền tool, sandbox, ngân sách token/thời gian, cắt vòng lặp vô hạn. Quan sát agent (LangSmith / Langfuse). | Agent có hành động "nguy hiểm" (gửi mail/ghi DB) **bắt buộc chờ người duyệt**, có trace đầy đủ trong Langfuse. |
| **T26** (9h) | **Đóng gói & triển khai agent**: FastAPI + streaming trạng thái agent, chạy nền bằng queue, Docker, xử lý tác vụ dài (webhook/polling). Eval cho agent: tỉ lệ hoàn thành nhiệm vụ, số bước, chi phí trung bình. | Multi-agent tuần 24 chạy sau API có xác thực, có giao diện xem tiến trình từng bước, có báo cáo eval agent. |

> 🏆 **Sản phẩm 3 — Hệ multi-agent có kiểm soát người dùng, MCP server riêng, trace và eval.**

---

## PHẦN III — AI ENGINEERING (Tuần 27–39 · 122h)

### Môn 8 — Deep Learning & Transformer (Tuần 27–31 · 46h)

> Đây là giai đoạn dễ bỏ cuộc nhất. Mục tiêu **không phải** trở thành nhà nghiên cứu — mà là hiểu bên trong mô hình đủ để chẩn đoán lỗi, chọn model và fine-tune. Chấp nhận học toán vừa đủ.

| Tuần | Nội dung | Deliverable |
|---|---|---|
| **T27** (9h) | Nền ML: học có/không giám sát, train/val/test, overfitting, regularization. **Chỉ số**: accuracy vs precision/recall/F1, confusion matrix, vì sao accuracy lừa dối trên dữ liệu mất cân bằng. scikit-learn: pipeline, cross-validation. | Bài phân loại thật (dữ liệu mất cân bằng), báo cáo confusion matrix + lý do chọn ngưỡng quyết định. |
| **T28** (10h) | **PyTorch từ gốc**: tensor, autograd, `nn.Module`, loss, optimizer, training loop viết tay, Dataset/DataLoader, GPU (dùng Google Colab free nếu máy không có GPU). | Mạng neural viết tay huấn luyện trên MNIST/Fashion-MNIST, vẽ đường loss, đạt >90%. |
| **T29** (9h) | **CNN & Transfer Learning**: convolution, pooling, augmentation; fine-tune ResNet/EfficientNet trên tập ảnh nhỏ của riêng bạn. RNN/LSTM (hiểu ngắn gọn để thấy vì sao Transformer thay thế). | Phân loại ảnh trên tập tự thu (~500 ảnh, 5 lớp) bằng transfer learning, so sánh với train from scratch. |
| **T30** (10h) | **Transformer — trái tim của mọi thứ**: self-attention (Q/K/V) tính tay trên ma trận nhỏ, multi-head, positional encoding, layer norm, residual, encoder vs decoder vs encoder-decoder. Đọc "The Illustrated Transformer" + code theo "Let's build GPT" của Karpathy. | **Tự code một GPT nhỏ** (~10M tham số) train trên văn bản tiếng Việt, sinh ra được câu tạm đọc được. |
| **T31** (8h) | **Hugging Face**: `transformers`, `datasets`, pipeline, tokenizer, dùng pretrained cho NLP/CV. **Fine-tuning**: full vs LoRA/QLoRA với `peft`; khi nào fine-tune, khi nào chỉ cần RAG hoặc prompt (câu hỏi phỏng vấn kinh điển). | Fine-tune LoRA một model nhỏ (vd. Qwen3-1.7B) cho tác vụ riêng, **so sánh với prompt-only trên cùng bộ eval** — kết luận có đáng fine-tune không. |

**Cổng kiểm tra:** vẽ được sơ đồ một khối Transformer trên giấy trắng và giải thích attention làm gì, không nhìn tài liệu.

### Môn 9 — Ứng dụng nâng cao & Tích hợp hệ thống (Tuần 32–36 · 46h)

> Phần biến bạn thành **AI Engineer** thật sự. Học kỹ, đây là thứ nhà tuyển dụng trả tiền cao.

| Tuần | Nội dung | Deliverable |
|---|---|---|
| **T32** (9h) | **Tự vận hành model**: `Ollama` → `vLLM` (PagedAttention, continuous batching) và TGI. Chạy model open-weight, đo throughput/latency. **Lượng tử hóa**: GGUF, AWQ, FP8 — đánh đổi chất lượng ↔ VRAM ↔ tốc độ. Thuê GPU giá rẻ (RunPod/Vast.ai, ~$0.3/h) khi cần. | Chạy vLLM phục vụ 1 model 7–8B, **benchmark** throughput/latency ở 1, 8, 32 request đồng thời — vẽ biểu đồ. |
| **T33** (9h) | **API tương thích OpenAI** bằng FastAPI (chuẩn `/v1/chat/completions`, streaming SSE) → đổi backend model mà client không phải sửa code. **LLM Gateway/Router**: định tuyến theo chi phí/độ khó, fallback khi provider lỗi, LiteLLM. **Semantic caching**. | Gateway riêng: 1 endpoint, 3 backend (API thương mại + model local), tự fallback, có cache ngữ nghĩa, đo tỉ lệ cache hit và tiền tiết kiệm. |
| **T34** (9h) | **Bảo mật AI**: prompt injection (trực tiếp và gián tiếp qua tài liệu RAG), rò rỉ dữ liệu, guardrails đầu vào/đầu ra, lọc PII, rate limiting, RBAC, quản lý secret. Đọc OWASP Top 10 for LLM. | Bộ **red-team 25 prompt tấn công** đánh vào chính app của bạn + lớp guardrail chặn được, báo cáo trước/sau. |
| **T35** (10h) | **Vận hành**: Docker multi-stage, image nhỏ, cấu hình GPU trong container. **CI/CD GitHub Actions**: lint → test → eval tự động → build → deploy. Quản lý phiên bản model + prompt template. **Canary deployment** và rollback. | Pipeline CI/CD: mỗi PR **tự chạy bộ eval**, chặn merge nếu chất lượng tụt quá ngưỡng. Deploy canary 10% traffic. |
| **T36** (9h) | **Giám sát**: Prometheus + Grafana (độ trễ p50/p95/p99, token/s, tỉ lệ lỗi, chi phí theo giờ), tracing LLM bằng Langfuse/LangSmith, phát hiện trôi chất lượng, cảnh báo. Tính TCO: self-host vs API thương mại — điểm hòa vốn. | **Dashboard Grafana** cho hệ thống của bạn + tài liệu 1 trang phân tích chi phí self-host vs API ở 3 mức tải. |

> 🏆 **Sản phẩm 4 — Nền tảng LLM tự vận hành**: gateway + model self-host + guardrails + CI/CD + monitoring. Đây là portfolio cấp AI Engineer, không phải cấp học viên.

### Môn 10 — Đồ án tốt nghiệp (Tuần 37–39 · 30h)

| Tuần | Nội dung | Deliverable |
|---|---|---|
| **T37** (10h) | **Chọn bài toán thật** — ưu tiên bài toán trong chính công việc/ngành của bạn (lợi thế cạnh tranh lớn nhất khi phỏng vấn). Viết tài liệu thiết kế: yêu cầu, tiêu chí thành công đo được, kiến trúc, lựa chọn model, ước tính chi phí, rủi ro. | Design doc 4–6 trang + sơ đồ kiến trúc + bộ eval xác định TRƯỚC khi code. |
| **T38** (10h) | Xây dựng, tích hợp tất cả những gì đã học: dữ liệu → RAG/agent → API → UI → guardrails → deploy → monitor. | Hệ thống chạy được end-to-end trên môi trường công khai. |
| **T39** (10h) | Đo đạc, tối ưu, viết báo cáo đánh giá (chất lượng, độ trễ, chi phí vận hành/tháng), quay demo 5 phút, viết README chuẩn, chuẩn bị bài trình bày kiến trúc. | Repo hoàn chỉnh + báo cáo + video demo + slide 10 trang. |

### Tuần 40 — Đóng gói sự nghiệp (10h)

- [ ] Viết lại CV theo hướng AI Engineer: mỗi dòng là **con số** (giảm p95 từ 4,2s → 1,1s; giảm chi phí 62% nhờ routing; tăng faithfulness 0,71 → 0,89).
- [ ] Dọn GitHub: 4 repo sản phẩm chính, README có ảnh/GIF demo, kiến trúc, kết quả eval.
- [ ] Viết 2 bài blog kỹ thuật từ `ERRORS.md` (vd. "So sánh 3 chiến lược chunking trên tài liệu tiếng Việt", "vLLM vs Ollama: benchmark thật").
- [ ] Ôn phỏng vấn: 20 câu hỏi hệ thống LLM (khi nào RAG vs fine-tune, xử lý ảo giác, thiết kế eval, tối ưu chi phí, chống prompt injection).
- [ ] LinkedIn + rải hồ sơ.

---

## Bốn sản phẩm portfolio (thứ thực sự được tuyển)

| # | Sản phẩm | Xong ở tuần | Chứng minh năng lực |
|---|---|---|---|
| 1 | RAG bot + báo cáo eval định lượng | T14 | Biết đo lường, không chỉ biết build |
| 2 | Web app AI full-stack deploy công khai | T18 | Giao được sản phẩm hoàn chỉnh |
| 3 | Hệ multi-agent + MCP server + HITL | T26 | Kiến trúc agent, an toàn, quan sát được |
| 4 | Nền tảng LLM self-host: gateway, CI/CD, monitoring | T36 | Năng lực AI Engineer/LLMOps thực thụ |
| 5 | Đồ án theo bài toán ngành của bạn | T39 | Hiểu miền nghiệp vụ + kỹ thuật |

---

## Ngân sách dự kiến (~9,5 tháng)

| Khoản | Ước tính |
|---|---|
| API LLM thương mại (dùng có kiểm soát, cache, model rẻ khi test) | 40–70 USD |
| Thuê GPU theo giờ (Tuần 30–33, ~40h × $0,3–0,5) | 15–25 USD |
| VPS deploy sản phẩm | 5 USD/tháng × 6 = 30 USD |
| Colab Pro (tùy chọn, cho Tuần 28–31) | 0–30 USD |
| **Tổng** | **~90–160 USD** |

Cách giữ chi phí thấp: dùng free-tier (Google AI Studio, Groq) để thử nghiệm; Ollama chạy local cho vòng lặp phát triển; chỉ gọi model đắt khi chạy eval chính thức; luôn bật cache.

---

## Tài nguyên chọn lọc (ít mà tinh — đừng sưu tầm khóa học)

**Python:** *Fluent Python* (Ramalho) — đọc chương 1, 2, 5, 7, 17 · docs `uv`, `ruff`, `pytest`
**Async:** tài liệu `asyncio` chính thức + bài "async/await" của Real Python
**Dữ liệu:** *Python for Data Analysis* (McKinney) · docs Qdrant
**LLM app:** docs API của Anthropic/OpenAI (đọc trực tiếp, không đọc qua blog) · Anthropic "Building effective agents" · docs `ragas`
**Agent:** LangGraph docs + tutorial chính thức · spec MCP (modelcontextprotocol.io)
**Deep Learning:** Karpathy "Neural Networks: Zero to Hero" (bắt buộc, xem hết) · "The Illustrated Transformer" (Jay Alammar) · Hugging Face NLP Course
**Hạ tầng:** docs vLLM · LiteLLM · OWASP Top 10 for LLM · *Designing Machine Learning Systems* (Chip Huyen)

---

## Bảy sai lầm giết chết người tự học AI

1. **Học lý thuyết chờ "đủ giỏi rồi mới làm".** Ngược lại: build trước, lấp lỗ hổng sau.
2. **Chỉ chạy theo tutorial.** Tutorial luôn chạy được; chỉ khi tự làm bài toán riêng bạn mới thật sự học.
3. **Bỏ qua eval.** Không đo thì không phải kỹ sư — chỉ là người nghịch prompt.
4. **Nhảy vào agent/fine-tune quá sớm**, khi RAG cơ bản và Python còn yếu.
5. **Sưu tầm khóa học thay vì viết code.** Sáu khóa xem dở = 0 năng lực.
6. **Bỏ phần triển khai/vận hành** vì "chán". Đó chính là phần được trả tiền nhiều nhất.
7. **Học một mình tuyệt đối.** Mỗi tháng chia sẻ 1 kết quả lên LinkedIn/cộng đồng để nhận phản hồi và tạo áp lực tích cực.

---

## Bảng theo dõi tiến độ

Chép vào `PROGRESS.md` và tick hằng tuần:

```
[ ] T0  Setup môi trường
[ ] T1  Python cú pháp          [ ] T2  OOP & Pydantic       [ ] T3  Tooling & test
[ ] T4  HTTP & API              [ ] T5  Async                [ ] T6  Token & embedding
[ ] T7  Pandas & SQL            [ ] T8  Crawling             [ ] T9  Trích xuất tài liệu
[ ] T10 Chunking & vector DB
[ ] T11 Prompt engineering      [ ] T12 Structured & tools   [ ] T13 RAG hoàn chỉnh
[ ] T14 Eval  ★ SẢN PHẨM 1
[ ] T15 FastAPI                 [ ] T16 Auth & streaming     [ ] T17 React/Next.js
[ ] T18 Docker & deploy  ★ SẢN PHẨM 2
[ ] T19 ReAct thủ công          [ ] T20 LangGraph            [ ] T21 Điều phối tác vụ
[ ] T22 Memory                  [ ] T23 MCP                  [ ] T24 Multi-agent
[ ] T25 HITL & an toàn          [ ] T26 Deploy agent  ★ SẢN PHẨM 3
[ ] T27 ML cơ bản               [ ] T28 PyTorch              [ ] T29 CNN & transfer
[ ] T30 Transformer từ số 0     [ ] T31 HF & LoRA
[ ] T32 vLLM & lượng tử hóa     [ ] T33 Gateway & cache      [ ] T34 Bảo mật LLM
[ ] T35 CI/CD & canary          [ ] T36 Monitoring  ★ SẢN PHẨM 4
[ ] T37 Thiết kế đồ án          [ ] T38 Xây dựng             [ ] T39 Báo cáo  ★ ĐỒ ÁN
[ ] T40 CV, portfolio, phỏng vấn
```

**Quy tắc bù trượt:** trượt 1 tuần thì cắt bớt phạm vi deliverable, **không dời lịch**. Trượt 3 tuần liên tiếp thì dừng lại xem xét lại quỹ thời gian — lộ trình 12 tháng hoàn thành vẫn tốt hơn lộ trình 9 tháng bỏ dở.
