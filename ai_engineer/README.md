# 🚀 Zero → AI/LLM Application Engineer

Chương trình tự học **22 tuần** đưa bạn từ *chưa biết Python* đến *xây được sản phẩm AI chạy thật trên internet*.

> **Triết lý:** Không học toán trước rồi mới code. Mỗi khái niệm xuất hiện **đúng lúc bạn cần nó** để giải một bài toán cụ thể.

---

## 📖 Mục lục

- [Chương trình này dành cho ai](#-chương-trình-này-dành-cho-ai)
- [Bạn sẽ làm được gì sau 22 tuần](#-bạn-sẽ-làm-được-gì-sau-22-tuần)
- [Cách học](#-cách-học-quan-trọng--đọc-trước-khi-bắt-đầu)
- [Lộ trình 22 tuần](#-lộ-trình-22-tuần)
- [Hệ thống project](#-hệ-thống-project)
- [Checklist tiến độ](#-checklist-tiến-độ)
- [Cấu trúc thư mục](#-cấu-trúc-thư-mục)
- [Chi phí & yêu cầu máy móc](#-chi-phí--yêu-cầu-máy-móc)
- [Bắt đầu ngay](#️-bắt-đầu-ngay)

---

## 🎯 Chương trình này dành cho ai

| Phù hợp nếu bạn... | KHÔNG phù hợp nếu bạn... |
|---|---|
| Chưa biết lập trình, muốn vào ngành AI | Muốn học nghiên cứu AI để làm PhD |
| Biết chút Python, muốn hệ thống hoá | Muốn học sâu về toán/lý thuyết ML |
| Muốn làm **sản phẩm** AI, không phải paper | Chỉ muốn học prompt engineering trong 1 tuần |
| Có ~12 giờ/tuần và kiên trì được 5 tháng | Không thực hành được đều đặn |

**Đích đến:** vị trí **AI/LLM Application Engineer** — người xây ứng dụng chạy trên nền LLM (chatbot doanh nghiệp, hệ thống RAG, AI agent, tự động hoá quy trình). Đây hiện là vai trò có nhu cầu tuyển dụng lớn nhất trong ngành AI.

---

## 🏆 Bạn sẽ làm được gì sau 22 tuần

1. **Viết Python** ở mức kỹ sư: code sạch, có type hint, có test, quản lý được môi trường và thư viện.
2. **Phân tích dữ liệu**: đọc CSV/Excel/SQL, làm sạch, vẽ biểu đồ, rút ra insight.
3. **Hiểu bản chất Machine Learning**: biết vì sao model học được, khi nào nó sai, đo chất lượng thế nào — không còn coi AI là "hộp đen".
4. **Tự code một mô hình GPT thu nhỏ** từ đầu (~200 dòng) → hiểu chính xác thứ đang chạy bên trong ChatGPT/Claude.
5. **Xây ứng dụng LLM production**: gọi API, ép model trả JSON đúng schema, cho model dùng tool, đo chất lượng bằng eval tự động, kiểm soát chi phí.
6. **Xây hệ thống RAG** hỏi đáp trên tài liệu riêng, có trích dẫn nguồn, chống bịa đặt.
7. **Xây AI Agent** tự thực hiện nhiều bước, gọi công cụ, biết dừng đúng lúc.
8. **Deploy lên internet**: FastAPI + Docker, có logging, monitoring, cost control, CI tự động.
9. **Có portfolio 7 project + 1 capstone** để đi phỏng vấn.

---

## 🧭 Cách học (QUAN TRỌNG – đọc trước khi bắt đầu)

### Vòng lặp 4 bước cho MỌI bài học

```
┌─────────────────────────────────────────────────────────────┐
│  1. ĐỌC LÝ THUYẾT   →  README.md của module (~20 phút)      │
│         ↓              Hiểu "tại sao", không học thuộc      │
│  2. CHẠY CODE MẪU   →  lessons/*.ipynb                      │
│         ↓              Chạy từng cell, SỬA THỬ rồi chạy lại │
│  3. LÀM BÀI TẬP     →  exercises/*.py  + pytest tự chấm     │
│         ↓              Bí quá mới xem solutions/            │
│  4. MINI-PROJECT    →  mini_project/  (~3–5 giờ)            │
│                        Không có lời giải — tự làm           │
└─────────────────────────────────────────────────────────────┘
```

### 7 nguyên tắc bất di bất dịch

| # | Nguyên tắc | Vì sao |
|---|---|---|
| 1 | **Gõ lại code, đừng copy-paste** | Ngón tay ghi nhớ nhanh hơn mắt. Copy-paste = ảo giác đã hiểu. |
| 2 | **Chạy được rồi thì SỬA THỬ cho nó lỗi** | Hiểu một thứ = biết nó hỏng khi nào. Đọc lỗi là kỹ năng số 1. |
| 3 | **Đừng xem lời giải trước 20 phút vật lộn** | Bế tắc chính là lúc não học. Xem sớm = học được 0. |
| 4 | **Học 1 tiếng mỗi ngày > 7 tiếng Chủ nhật** | Kiến thức cần thời gian "ngấm" giữa các buổi. |
| 5 | **Không nhảy phase** | Phase sau giả định bạn đã nắm phase trước. Nhảy = xây nhà trên cát. |
| 6 | **Commit git mỗi ngày học** | Vừa tập git, vừa có bằng chứng tiến bộ để tự tạo động lực. |
| 7 | **Viết lại bằng lời của mình** | Cuối mỗi module, viết 5 dòng "hôm nay tôi hiểu gì". Không viết được = chưa hiểu. |

### Dùng AI (Claude/ChatGPT) thế nào cho ĐÚNG

AI là gia sư tuyệt vời và cũng là cách phá hỏng việc học nhanh nhất. Ranh giới:

| ✅ NÊN hỏi AI | ❌ KHÔNG nên hỏi AI |
|---|---|
| "Giải thích lỗi này cho tôi" | "Làm hộ bài tập này" |
| "Tại sao code này chạy chậm?" | "Viết code cho bài 3" |
| "Cho tôi 3 ví dụ khác về decorator" | "Đáp án bài tập là gì" |
| "Review code tôi vừa viết" | (dán đề, copy đáp án, pytest xanh, không hiểu gì) |
| "Ra thêm 5 bài tập tương tự" | |

> **Quy tắc vàng:** Hỏi AI để *hiểu*, không bao giờ để *xong bài*. pytest xanh mà bạn không giải thích được code thì bạn vừa tự lừa mình.

### Khi bí — thứ tự xử lý

1. **Đọc kỹ dòng CUỐI CÙNG của traceback** (nó nói đúng lỗi gì, file nào, dòng nào)
2. Thêm `print()` vào giữa code xem biến đang chứa gì
3. Đọc lại README của module
4. Google nguyên văn thông báo lỗi (tiếng Anh)
5. Hỏi AI: *"Tôi gặp lỗi này [dán lỗi], code tôi là [dán code], tôi nghĩ nguyên nhân là X. Đúng không?"*
6. Vẫn bí → xem `solutions/`, nhưng **đọc xong phải đóng lại và tự gõ lại từ đầu**

---

## 📅 Lộ trình 22 tuần

### Giai đoạn A — Nền tảng (Tuần 1–8)
*Mục tiêu: viết được Python và xử lý được dữ liệu*

| Phase | Tuần | Nội dung | Đầu ra |
|---|---|---|---|
| **[00 · Setup](curriculum/00-setup/)** | 1 | Cài Python + uv, Git/GitHub, VSCode, Jupyter, đọc traceback | Môi trường chạy được |
| **[01 · Python nền tảng](curriculum/01-python-foundations/)** | 2–4 | Biến, hàm, list/dict, vòng lặp, OOP vừa đủ, file I/O, type hints, pytest | CLI quản lý dữ liệu |
| **[02 · Toán vừa đủ dùng](curriculum/02-math-essentials/)** | 5 | Vector, ma trận, gradient, xác suất — code bằng NumPy | Tự code gradient descent |
| **[03 · Data toolkit](curriculum/03-data-toolkit/)** | 6–8 | NumPy, Pandas, biểu đồ, làm sạch dữ liệu, EDA, SQL cơ bản | 🎯 **P1** |

### Giai đoạn B — Hiểu bản chất AI (Tuần 9–15)
*Mục tiêu: LLM không còn là hộp đen*

| Phase | Tuần | Nội dung | Đầu ra |
|---|---|---|---|
| **[04 · Classical ML](curriculum/04-classical-ml/)** | 9–11 | Sklearn pipeline, hồi quy/phân loại, train-val-test, overfitting, metrics | 🎯 **P2** |
| **[05 · Deep Learning](curriculum/05-deep-learning/)** | 12–13 | PyTorch tensor, autograd, training loop tự viết, MLP, CNN | 🎯 **P3** |
| **[06 · NLP & Transformers](curriculum/06-nlp-transformers/)** | 14–15 | Tokenizer, embedding, attention, **tự code mini-GPT**, HuggingFace | 🎯 **P4** |

### Giai đoạn C — Chuyên môn LLM ⭐ (Tuần 16–22)
*Mục tiêu: xây được sản phẩm thật — phần quan trọng nhất của chương trình*

| Phase | Tuần | Nội dung | Đầu ra |
|---|---|---|---|
| **[07 · LLM Engineering](curriculum/07-llm-engineering/)** | 16–19 | Claude API, prompt engineering, structured output, tool use, streaming, token & chi phí, prompt caching, **eval tự động** | 🎯 **P5** |
| **[08 · RAG](curriculum/08-rag/)** | 20–21 | Chunking, embedding, vector DB, hybrid search, reranking, citation, đo chất lượng RAG | 🎯 **P6** |
| **[09 · Agents](curriculum/09-agents/)** | 21–22 | Vòng lặp agent, bộ nhớ & nén ngữ cảnh, guardrails, human-in-the-loop, **đánh giá agent** | 🎯 **P7** |
| **[10 · Deploy & Vận hành](curriculum/10-deploy-ops/)** | 22 | FastAPI, health check, bảo mật secret, p95/p99, ngân sách & ngắt mạch, Docker, CI | P6/P7 chạy trên internet |
| **[11 · Capstone](curriculum/11-capstone/)** | 23+ | Chọn đề tài, gán nhãn eval trước khi xây, ghép RAG/Agent + deploy, README + blog, câu chuyện 5 phút | 🏆 **Portfolio** |

---

## 🛠 Hệ thống project

Mỗi project là **một dòng trong CV**, không phải bài tập vứt đi.

| # | Sau phase | Tên | Bạn sẽ xây | Deliverable |
|---|---|---|---|---|
| **P1** | 03 | [Báo cáo EDA](projects/P1-eda-report/) | Phân tích một dataset thật, tìm insight | Notebook + 5 insight có số liệu |
| **P2** | 04 | [Churn Prediction](projects/P2-churn-prediction/) | Dự đoán khách hàng rời bỏ, so sánh 4 model | Pipeline + báo cáo metrics |
| **P3** | 05 | [Image Classifier](projects/P3-image-classifier/) | CNN phân loại ảnh + web demo | Gradio app |
| **P4** | 06 | [Mini-GPT](projects/P4-mini-gpt/) | Tự code & train GPT thu nhỏ trên văn bản tiếng Việt | Model sinh được văn bản |
| **P5** | 07 | [Structured Extractor](projects/P5-structured-extractor/) | Trích xuất JSON từ CV/hoá đơn + eval tự động | CLI + eval suite |
| **P6** | 08+09 | [RAG Q&A](projects/P6-rag-qa/) | Hỏi đáp tài liệu PDF, có trích dẫn nguồn | FastAPI + UI |
| **P7** | 09 | [AI Agent](projects/P7-agent/) | Agent nhiều bước gọi công cụ | Agent chạy được |
| 🏆 | 11 | [Capstone](curriculum/11-capstone/) | RAG + Agent + Eval + Deploy + Monitor | Docker, CI, public URL, blog |

---

## ✅ Checklist tiến độ

Đánh dấu `[x]` khi hoàn thành. Cập nhật mỗi tuần rồi commit lại.

### Giai đoạn A — Nền tảng
- [ ] **Tuần 1** · Phase 00 — Setup xong, chạy được `python`, `git`, Jupyter
- [ ] **Tuần 2** · Phase 01 — Biến, kiểu dữ liệu, hàm, điều kiện, vòng lặp
- [ ] **Tuần 3** · Phase 01 — List/dict/set, comprehension, file I/O
- [ ] **Tuần 4** · Phase 01 — OOP, module, type hints, pytest → **mini-project CLI**
- [ ] **Tuần 5** · Phase 02 — Vector, ma trận, gradient descent, xác suất
- [ ] **Tuần 6** · Phase 03 — NumPy
- [ ] **Tuần 7** · Phase 03 — Pandas + biểu đồ
- [ ] **Tuần 8** · Phase 03 — Làm sạch dữ liệu + SQL → 🎯 **P1**

### Giai đoạn B — Hiểu bản chất AI
- [ ] **Tuần 9** · Phase 04 — Hồi quy, train/val/test, overfitting
- [ ] **Tuần 10** · Phase 04 — Phân loại, metrics, cross-validation
- [ ] **Tuần 11** · Phase 04 — Pipeline, feature engineering → 🎯 **P2**
- [ ] **Tuần 12** · Phase 05 — Tensor, autograd, training loop, MLP
- [ ] **Tuần 13** · Phase 05 — CNN, GPU/Colab → 🎯 **P3**
- [ ] **Tuần 14** · Phase 06 — Tokenizer, embedding, attention
- [ ] **Tuần 15** · Phase 06 — Mini-GPT + HuggingFace → 🎯 **P4**

### Giai đoạn C — Chuyên môn LLM
- [ ] **Tuần 16** · Phase 07 — Claude API, messages, token, chi phí
- [ ] **Tuần 17** · Phase 07 — Prompt engineering, structured output
- [ ] **Tuần 18** · Phase 07 — Tool use, streaming, xử lý lỗi
- [ ] **Tuần 19** · Phase 07 — Eval tự động → 🎯 **P5**
- [ ] **Tuần 20** · Phase 08 — Embedding, vector DB, retrieval cơ bản
- [ ] **Tuần 21** · Phase 08 — Hybrid search, rerank, citation, đo chất lượng
- [ ] **Tuần 21** · Phase 09 — Vòng lặp agent, bộ nhớ, ngữ cảnh
- [ ] **Tuần 22** · Phase 09 — Guardrails, đánh giá agent → 🎯 **P7**
- [ ] **Tuần 22** · Phase 10 — FastAPI, quan sát & chi phí, Docker, CI → **lên internet**
- [ ] **Tuần 23+** · Phase 11 — 🏆 **Capstone + blog**

---

## 📂 Cấu trúc thư mục

```
ai_engineer/
├── README.md              ← bạn đang ở đây
├── SETUP.md               ← cài đặt môi trường (đọc thứ 2)
├── pyproject.toml         ← khai báo thư viện theo từng phase
├── .env.example           ← mẫu file chứa API key
│
├── curriculum/            ← 12 phase học
│   └── <phase>/
│       ├── README.md      ← lý thuyết (đọc trước)
│       ├── lessons/       ← notebook demo (chạy thử)
│       ├── exercises/     ← bài tập TODO (tự làm)
│       ├── solutions/     ← lời giải (xem sau cùng)
│       ├── mini_project/  ← bài tổng hợp cuối phase
│       └── mau/           ← file mẫu dùng thật (Dockerfile, CI, template)
│
├── projects/              ← 7 project portfolio
├── tests/                 ← pytest tự chấm bài tập
├── data/                  ← dataset tải về (không commit lên git)
└── resources/
    ├── glossary.md        ← 150+ thuật ngữ Việt–Anh
    ├── cheatsheets/       ← tra cứu nhanh
    └── interview/         ← câu hỏi phỏng vấn theo phase
```

---

## 💰 Chi phí & yêu cầu máy móc

| Hạng mục | Chi tiết |
|---|---|
| **Phần mềm** | Miễn phí 100% (Python, VSCode, Git đều free) |
| **Máy tính** | Laptop thường là đủ cho Phase 00–04 và 07–11 |
| **GPU** | Phase 05–06 cần GPU → dùng **Google Colab free**, không cần mua máy |
| **API LLM** | Bắt đầu tốn tiền từ **Tuần 16** (Phase 07). Trước đó hoàn toàn miễn phí |

### Chi phí API theo đường bạn chọn

| Đường đi | Gồm những gì | Ước tính |
|---|---|---|
| **Tối thiểu** | Chỉ bài tập + notebook của Phase 07–10 | **~$3–5** |
| **Nên làm** | Thêm 4 mini-project và 1–2 project lớn | **~$8–12** |
| **Đầy đủ** | Thêm cả P5+P6+P7, capstone, và các bài so sánh model | **~$15–25** |

> 💡 **Toàn bộ bài tập pytest chạy được KHÔNG CẦN API key** — từ Phase 07 trở đi mọi bài đều nhận hàm gọi model làm tham số. Tiền chỉ tiêu ở notebook, mini-project và project.
>
> ⚠️ **Việc đầu tiên phải làm sau khi có key:** vào Console → Billing → Spend limits và đặt hạn mức tháng. Đó là lưới an toàn khi code bị lỗi gọi API trong vòng lặp — và Phase 10 sẽ dạy bạn xây thêm hai lớp chặn nữa ở phía ứng dụng.

> Cách nạp tiền và lấy API key: xem [SETUP.md](SETUP.md).

---

## ▶️ Bắt đầu ngay

```bash
# 1. Đọc hướng dẫn cài đặt và làm theo từng bước
#    → SETUP.md

# 2. Kiểm tra môi trường đã sẵn sàng
python curriculum/00-setup/exercises/check_environment.py

# 3. Vào bài học đầu tiên
#    → curriculum/00-setup/README.md
```

**Tài liệu tra cứu khi học:**
- [📖 Glossary Việt–Anh](resources/glossary.md) — không hiểu thuật ngữ nào thì tra ở đây
- [📋 Cheatsheets](resources/cheatsheets/) — cú pháp hay quên
- [💼 Câu hỏi phỏng vấn](resources/interview/) — ôn sau mỗi phase

---

<p align="center">
<b>Tuần 1 là tuần khó nhất — không phải vì nội dung, mà vì bắt đầu luôn khó.</b><br>
Cứ mở SETUP.md ra và làm dòng đầu tiên.
</p>
