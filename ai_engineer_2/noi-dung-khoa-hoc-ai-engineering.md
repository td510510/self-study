# Chuyên viên AI Engineering — Nội dung khóa học

> Nguồn: https://csc.edu.vn/ai-engineering/chuyen-vien-ai-engineering_364 (Trung tâm Tin học — Trường ĐH Khoa học Tự nhiên, ĐHQG-HCM)

## 1. Thông tin chung

| Hạng mục | Nội dung |
|---|---|
| Tên khóa học | Chuyên viên AI Engineering |
| Thời lượng | 362 giờ (khoảng 1 năm) |
| Học phí | 45.250.000đ — ưu đãi 34.900.000đ |
| Cấu trúc | 3 phần (module) — 10 môn học |
| Chứng chỉ | Chứng nhận "Chuyên viên AI Engineering" của Trường ĐH Khoa học Tự nhiên |
| Điều kiện cấp chứng chỉ | Tất cả môn đạt ≥ 5 điểm, hoàn tất chương trình trong tối đa 2 năm |

### Mục tiêu

Trang bị năng lực toàn diện để **xây dựng, tích hợp, triển khai và vận hành hệ thống AI trong môi trường thực tế**, tập trung vào việc lựa chọn mô hình, lựa chọn hạ tầng phù hợp và kiểm soát hệ thống AI xuyên suốt vòng đời vận hành.

### Đối tượng

- Học viên đã có nền tảng phát triển ứng dụng AI, muốn đi chuyên sâu về mô hình và hạ tầng.
- Lập trình viên / AI Developer muốn chuyển sang vai trò AI Engineer.
- Người cần vận hành mô hình trên hạ tầng riêng (self-hosted).
- Người muốn hoàn thiện một đồ án AI có kiến trúc rõ ràng kèm báo cáo đánh giá.

### Kết quả đạt được

- Chọn được mô hình phù hợp bài toán và chẩn đoán lỗi mô hình.
- Huấn luyện, tinh chỉnh mô hình với PyTorch và Hugging Face.
- Vận hành mô hình open-weight trên hạ tầng riêng.
- Tự động hóa kiểm thử và phát hành qua CI/CD.
- Giám sát chất lượng, độ trễ và chi phí sau phát hành.
- Hoàn thành sản phẩm tốt nghiệp kèm kiến trúc và báo cáo đánh giá.

---

## PHẦN I — NỀN TẢNG ỨNG DỤNG AI (188 giờ · 5 môn)

### Môn 1. Tư duy lập trình với Python — 40 giờ

- Biến, kiểu dữ liệu, toán tử.
- Cấu trúc điều khiển: `if/else`, vòng lặp `for` / `while`.
- Hàm và cách tổ chức code.
- Cấu trúc dữ liệu: List, Tuple, Dictionary, Set.
- Lập trình hướng đối tượng cơ bản.

### Môn 2. Kỹ thuật lập trình cho ứng dụng AI — 36 giờ

- Lập trình cùng AI IDE; viết unit test.
- Quản lý môi trường (virtual environment, dependency); Git/GitHub.
- Vector và embedding — nền tảng cho ứng dụng AI.
- HTTP, REST, JSON; gọi API.
- Tokenization, context window.
- Lập trình bất đồng bộ với `async/await`.

### Môn 3. Kỹ thuật dữ liệu cho hệ thống AI — 36 giờ

- Vòng đời dữ liệu: thu thập → làm sạch → chuẩn hóa.
- Xử lý dữ liệu có cấu trúc bằng SQL và Pandas.
- Scraping dữ liệu từ API, RSS, HTML.
- Trích xuất dữ liệu từ DOCX, PDF; OCR ảnh.
- Chunking và embedding phục vụ RAG.

### Môn 4. Lập trình AI cơ bản — 36 giờ

- Prompt Engineering ở cấp độ lập trình.
- Quản lý lịch sử trò chuyện (conversation history) với LLM.
- Xây dựng chatbot RAG.
- Đo lường chất lượng và chi phí của mô hình.
- Kiểm soát đầu ra dạng JSON; Function Calling.

### Môn 5. Lập trình ứng dụng Web AI — 40 giờ

- Phương pháp "vibe coding".
- Kiến trúc client–server.
- Frontend: HTML, CSS, JavaScript và ReactJS / NextJS / VueJS.
- Backend với FastAPI: Session, JWT, Authentication.
- RESTful API; kiểm thử bằng Postman.
- Streaming response; quản lý session.
- Triển khai bằng Docker.

---

## PHẦN II — AI AGENT (72 giờ · 2 môn)

### Môn 6. Nền tảng AI Agent — 36 giờ

- Cấu trúc các thành phần của một AI Agent; LangGraph.
- State, Node, Edge, Conditional Edge, Routing.
- Tích hợp Tool Calling.
- Phân tích tác vụ: xử lý tuần tự, song song, có điều kiện.
- Chiến lược suy luận: ReAct, Planner–Executor.
- Quản lý context; bộ nhớ ngắn hạn và dài hạn.
- Xây dựng một AI Agent hoàn chỉnh.

### Môn 7. Lập trình AI Agent nâng cao và Multi-agent — 36 giờ

- Các framework xây dựng Agent / Multi-Agent.
- Tích hợp skill; Human-in-the-loop.
- MCP (Model Context Protocol).
- Các mô hình Multi-Agent: Router, Supervisor, Handoff, Sequential, Parallel, Hierarchical.
- Tích hợp Agent với hệ thống quản lý hiện có.
- Đóng gói và triển khai bằng FastAPI, Docker.

---

## PHẦN III — AI ENGINEERING (102 giờ · 3 môn)

### Môn 8. Deep Learning và Transformer — 36 giờ

- Machine Learning: học có giám sát và không giám sát.
- Đánh giá mô hình: precision, recall, F1, confusion matrix.
- scikit-learn: xây dựng mô hình phân loại.
- PyTorch: Tensor, Dataset, DataLoader, training loop.
- CNN, Transfer Learning, RNN/LSTM.
- Self-attention, multi-head attention, kiến trúc Transformer.
- Positional encoding, encoder–decoder.
- Hugging Face: sử dụng pretrained model cho NLP và Computer Vision.

### Môn 9. Ứng dụng AI nâng cao và Tích hợp hệ thống — 36 giờ

- Xây dựng API tương thích OpenAI bằng FastAPI.
- Async concurrency khi xử lý request LLM.
- Docker multi-stage build; cấu hình GPU.
- Hạ tầng suy luận: vLLM, TGI, Ollama.
- Mô hình open-weight; lượng tử hóa GGUF / FP8.
- LLM Gateway / Router.
- Quản lý phiên bản mô hình và prompt template.
- CI/CD bằng GitHub Actions.
- Semantic caching.
- Guardrails; phòng chống Prompt Injection.
- Rate Limiting, RBAC.
- Monitoring với Prometheus / Grafana / LangSmith.
- Canary Deployment.

### Môn 10. Đồ án tốt nghiệp — 30 giờ

- Xác định bài toán và thiết kế kiến trúc hệ thống.
- Xây dựng và triển khai sản phẩm AI hoàn chỉnh.
- Chuẩn bị hồ sơ tốt nghiệp: trình bày kiến trúc, đánh giá chất lượng, phân tích chi phí vận hành.

---

## 2. Tổng hợp thời lượng

| Phần | Môn học | Giờ |
|---|---|---|
| I. Nền tảng ứng dụng AI | 1. Tư duy lập trình với Python | 40 |
| | 2. Kỹ thuật lập trình cho ứng dụng AI | 36 |
| | 3. Kỹ thuật dữ liệu cho hệ thống AI | 36 |
| | 4. Lập trình AI cơ bản | 36 |
| | 5. Lập trình ứng dụng Web AI | 40 |
| | **Cộng phần I** | **188** |
| II. AI Agent | 6. Nền tảng AI Agent | 36 |
| | 7. Lập trình AI Agent nâng cao và Multi-agent | 36 |
| | **Cộng phần II** | **72** |
| III. AI Engineering | 8. Deep Learning và Transformer | 36 |
| | 9. Ứng dụng AI nâng cao và Tích hợp hệ thống | 36 |
| | 10. Đồ án tốt nghiệp | 30 |
| | **Cộng phần III** | **102** |
| | **TỔNG CỘNG** | **362** |

## 3. Lịch khai giảng (theo website tại thời điểm tham khảo)

| Ngày khai giảng | Lịch học | Hình thức |
|---|---|---|
| 16/09/2026 | Thứ 2 – 4 – 6, 08:00–11:00 | Offline (Q.5) |
| 17/09/2026 | Thứ 3 – 5 – 7, 18:00–21:00 | Online |
| 19/09/2026 | Thứ 7 – CN, 13:30–17:30 | Offline (Q.5) |
