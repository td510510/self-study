# 📖 Glossary Việt – Anh

> Tra cứu nhanh khi gặp thuật ngữ lạ. **Luôn ghi nhớ tên tiếng Anh** — tài liệu, lỗi, và câu hỏi phỏng vấn đều dùng tiếng Anh.
>
> Ký hiệu: 🔰 cơ bản · ⭐ quan trọng cho AI Engineer · 🎯 hay hỏi phỏng vấn

---

## Mục lục
[Lập trình](#1-lập-trình--python) · [Toán](#2-toán--thống-kê) · [Dữ liệu](#3-dữ-liệu) · [Machine Learning](#4-machine-learning) · [Đánh giá model](#5-đánh-giá-model) · [Deep Learning](#6-deep-learning) · [NLP & Transformers](#7-nlp--transformers) · [LLM Engineering](#8-llm-engineering) · [RAG](#9-rag) · [Agents](#10-agents) · [MLOps & Deploy](#11-mlops--deploy)

---

## 1. Lập trình & Python

| Tiếng Anh | Tiếng Việt | Giải thích ngắn |
|---|---|---|
| Variable 🔰 | Biến | Cái tên gắn vào một giá trị |
| Function 🔰 | Hàm | Khối code có tên, tái sử dụng được |
| Argument / Parameter 🔰 | Đối số / Tham số | Giá trị truyền vào hàm / tên nhận giá trị đó |
| Return value 🔰 | Giá trị trả về | Kết quả hàm đưa ra ngoài |
| Loop 🔰 | Vòng lặp | Lặp lại code nhiều lần (`for`, `while`) |
| Conditional 🔰 | Câu điều kiện | `if / elif / else` |
| List 🔰 | Danh sách | Dãy phần tử có thứ tự, sửa được |
| Tuple 🔰 | Bộ | Dãy phần tử có thứ tự, **không** sửa được |
| Dictionary (dict) 🔰 | Từ điển | Cặp khoá–giá trị |
| Set 🔰 | Tập hợp | Các phần tử không trùng nhau, không thứ tự |
| Comprehension | Cú pháp rút gọn | `[x*2 for x in nums]` |
| Iterable / Iterator | Đối tượng lặp được | Thứ có thể duyệt bằng `for` |
| Generator | Bộ sinh | Sinh giá trị dần, tiết kiệm bộ nhớ (`yield`) |
| Class / Object 🔰 | Lớp / Đối tượng | Khuôn mẫu / thực thể tạo ra từ khuôn |
| Method | Phương thức | Hàm thuộc về một class |
| Attribute | Thuộc tính | Biến thuộc về một object |
| Inheritance | Kế thừa | Class con dùng lại code class cha |
| Module / Package | Mô-đun / Gói | File `.py` / thư mục chứa nhiều module |
| Import | Nhập khẩu | Nạp code từ module khác |
| Exception 🔰 | Ngoại lệ | Lỗi xảy ra lúc chạy |
| Traceback 🔰🎯 | Vết lỗi | Bản đồ chỉ lỗi xảy ra ở đâu — **đọc từ dưới lên** |
| Type hint ⭐ | Chú thích kiểu | `def f(x: int) -> str` — giúp IDE bắt lỗi sớm |
| Decorator | Bộ trang trí | Hàm bọc quanh hàm khác (`@something`) |
| Virtual environment 🔰⭐ | Môi trường ảo | Hộp riêng chứa thư viện của một project |
| Dependency | Phụ thuộc | Thư viện mà code của bạn cần |
| Unit test ⭐ | Kiểm thử đơn vị | Test một hàm nhỏ có chạy đúng không |
| Refactor | Tái cấu trúc | Sửa code cho sạch, không đổi hành vi |
| Repository (repo) 🔰 | Kho code | Thư mục được git quản lý |
| Commit 🔰 | Lưu mốc | Một điểm lưu trong lịch sử code |
| Branch | Nhánh | Dòng phát triển song song |
| Merge conflict | Xung đột hợp nhất | Hai nhánh sửa cùng chỗ, git không tự quyết được |

---

## 2. Toán & Thống kê

| Tiếng Anh | Tiếng Việt | Giải thích ngắn |
|---|---|---|
| Scalar | Đại lượng vô hướng | Một con số |
| Vector ⭐ | Vector | Dãy số — ví dụ `[1.2, 0.5, -3]` |
| Matrix ⭐ | Ma trận | Bảng số 2 chiều |
| Tensor ⭐ | Tensor | Mảng số n chiều (khái quát của ma trận) |
| Dot product ⭐ | Tích vô hướng | Nhân từng cặp rồi cộng — đo độ "cùng hướng" |
| Matrix multiplication ⭐ | Nhân ma trận | Phép tính lõi của mọi mạng neural |
| Transpose | Chuyển vị | Lật hàng thành cột |
| Norm | Chuẩn | Độ dài của vector |
| Derivative 🎯 | Đạo hàm | Tốc độ thay đổi của hàm |
| Gradient ⭐🎯 | Gradient | Vector đạo hàm — chỉ hướng dốc nhất |
| Gradient descent ⭐🎯 | Hạ gradient | Đi ngược hướng dốc để giảm lỗi — cách model "học" |
| Learning rate ⭐🎯 | Tốc độ học | Bước đi mỗi lần cập nhật. Quá lớn → nhảy loạn; quá nhỏ → học chậm |
| Local minimum | Cực tiểu địa phương | Hố thấp nhưng chưa phải thấp nhất |
| Probability 🔰 | Xác suất | Khả năng xảy ra, từ 0 đến 1 |
| Distribution | Phân phối | Cách xác suất trải trên các giá trị |
| Normal / Gaussian | Phân phối chuẩn | Hình chuông |
| Mean / Median / Mode | Trung bình / Trung vị / Yếu vị | Ba cách đo "giá trị điển hình" |
| Variance / Std deviation | Phương sai / Độ lệch chuẩn | Dữ liệu phân tán nhiều hay ít |
| Correlation 🎯 | Tương quan | Hai biến đi cùng nhau đến mức nào (−1 → 1) |
| Causation 🎯 | Nhân quả | **Tương quan ≠ nhân quả** |
| Outlier ⭐ | Giá trị ngoại lai | Điểm dữ liệu bất thường |
| Sampling | Lấy mẫu | Chọn một phần đại diện cho toàn bộ |
| Bayes' theorem | Định lý Bayes | Cập nhật niềm tin khi có bằng chứng mới |

---

## 3. Dữ liệu

| Tiếng Anh | Tiếng Việt | Giải thích ngắn |
|---|---|---|
| Dataset 🔰 | Tập dữ liệu | Toàn bộ dữ liệu bạn có |
| Feature ⭐🎯 | Đặc trưng / Biến đầu vào | Một cột dùng để dự đoán (tuổi, giá, số lần mua...) |
| Label / Target ⭐🎯 | Nhãn / Biến mục tiêu | Cột cần dự đoán |
| Row / Record / Sample | Hàng / Bản ghi / Mẫu | Một quan sát |
| DataFrame ⭐ | Khung dữ liệu | Bảng dữ liệu của pandas |
| Series | Chuỗi | Một cột của DataFrame |
| Missing value ⭐ | Giá trị thiếu | Ô trống (`NaN`, `None`, `null`) |
| Imputation | Điền khuyết | Điền giá trị thiếu bằng mean/median/... |
| Duplicate | Trùng lặp | Bản ghi lặp lại |
| Data cleaning ⭐ | Làm sạch dữ liệu | Chiếm ~60–80% thời gian thực tế |
| EDA ⭐ | Phân tích khám phá | *Exploratory Data Analysis* — nhìn dữ liệu trước khi model |
| Categorical / Numerical | Biến hạng mục / Biến số | "Hà Nội, HCM" vs "1.5, 200" |
| Encoding ⭐ | Mã hoá | Biến chữ thành số (one-hot, label encoding) |
| One-hot encoding ⭐ | Mã hoá one-hot | Mỗi hạng mục thành một cột 0/1 |
| Normalization / Scaling ⭐🎯 | Chuẩn hoá | Đưa các cột về cùng thang đo |
| Standardization | Chuẩn hoá z-score | Trừ mean, chia std |
| Aggregation | Tổng hợp | `groupby` rồi tính sum/mean/count |
| Join / Merge ⭐ | Ghép bảng | Nối hai bảng theo khoá chung |
| Pivot | Xoay bảng | Đổi hàng thành cột |
| Schema | Lược đồ | Cấu trúc bảng: tên cột + kiểu dữ liệu |
| Data leakage ⭐🎯 | Rò rỉ dữ liệu | Model "nhìn trộm" đáp án → điểm cao giả. **Lỗi chết người #1** |

---

## 4. Machine Learning

| Tiếng Anh | Tiếng Việt | Giải thích ngắn |
|---|---|---|
| Machine Learning 🔰 | Học máy | Máy học quy luật từ dữ liệu thay vì được lập trình cứng |
| Model ⭐ | Mô hình | Hàm toán học đã học từ dữ liệu |
| Training ⭐ | Huấn luyện | Quá trình model điều chỉnh tham số để giảm lỗi |
| Inference / Prediction ⭐ | Suy luận / Dự đoán | Dùng model đã train trên dữ liệu mới |
| Supervised learning ⭐🎯 | Học có giám sát | Có nhãn đúng để học theo |
| Unsupervised learning 🎯 | Học không giám sát | Không có nhãn, tự tìm cấu trúc (clustering) |
| Reinforcement learning | Học tăng cường | Học qua thưởng/phạt |
| Regression ⭐ | Hồi quy | Dự đoán **số** (giá nhà, doanh thu) |
| Classification ⭐ | Phân loại | Dự đoán **nhãn** (spam / không spam) |
| Clustering | Phân cụm | Gom nhóm dữ liệu giống nhau |
| Parameter ⭐ | Tham số | Con số model **tự học** (weights) |
| Hyperparameter ⭐🎯 | Siêu tham số | Con số **bạn chọn** trước khi train (learning rate, số cây) |
| Weight / Bias ⭐ | Trọng số / Độ lệch | Các con số bên trong model |
| Loss function ⭐🎯 | Hàm mất mát | Đo model sai bao nhiêu — càng nhỏ càng tốt |
| Cost function | Hàm chi phí | Loss trung bình trên toàn bộ dữ liệu |
| Optimizer ⭐ | Bộ tối ưu | Thuật toán cập nhật tham số (SGD, Adam) |
| Epoch ⭐ | Vòng huấn luyện | Một lượt duyệt hết dữ liệu train |
| Batch / Batch size ⭐ | Lô / Kích thước lô | Số mẫu xử lý cùng lúc |
| Train / Validation / Test set ⭐🎯 | Tập huấn luyện / kiểm định / kiểm tra | Học / chỉnh siêu tham số / chấm điểm cuối cùng |
| Overfitting ⭐🎯 | Quá khớp | Học thuộc lòng dữ liệu train, gặp dữ liệu mới thì dốt |
| Underfitting 🎯 | Chưa khớp | Model quá đơn giản, sai cả trên train |
| Bias–Variance tradeoff 🎯 | Đánh đổi thiên lệch–phương sai | Đơn giản quá thì sai hệ thống, phức tạp quá thì nhạy nhiễu |
| Regularization ⭐ | Điều chuẩn | Phạt model phức tạp để chống overfitting (L1, L2) |
| Cross-validation ⭐🎯 | Kiểm định chéo | Chia k phần, luân phiên test → đánh giá ổn định hơn |
| Feature engineering ⭐🎯 | Tạo đặc trưng | Chế biến cột mới có ích cho model |
| Feature importance | Độ quan trọng đặc trưng | Cột nào ảnh hưởng nhiều đến dự đoán |
| Pipeline ⭐ | Đường ống xử lý | Chuỗi bước (làm sạch → scale → model) đóng gói lại |
| Ensemble | Tổ hợp model | Gộp nhiều model cho kết quả tốt hơn |
| Random Forest | Rừng ngẫu nhiên | Ensemble của nhiều cây quyết định |
| Gradient Boosting / XGBoost ⭐ | Tăng cường gradient | Cây sau sửa lỗi cây trước — vua của dữ liệu dạng bảng |
| Baseline ⭐🎯 | Mốc cơ sở | Model ngu ngốc nhất để so sánh. **Luôn phải có** |

---

## 5. Đánh giá model

| Tiếng Anh | Tiếng Việt | Giải thích ngắn |
|---|---|---|
| Metric ⭐ | Chỉ số đánh giá | Con số đo chất lượng model |
| Accuracy ⭐🎯 | Độ chính xác | % dự đoán đúng. **Vô dụng khi dữ liệu mất cân bằng** |
| Precision ⭐🎯 | Độ chuẩn xác | Trong số dự đoán "có", bao nhiêu % thật sự "có" |
| Recall ⭐🎯 | Độ bao phủ | Trong số thật sự "có", bắt được bao nhiêu % |
| F1-score ⭐ | Điểm F1 | Trung bình điều hoà của precision & recall |
| Confusion matrix ⭐🎯 | Ma trận nhầm lẫn | Bảng 2×2: đúng/sai × dương/âm |
| True/False Positive/Negative 🎯 | Dương/Âm tính thật/giả | TP, FP, TN, FN |
| ROC curve / AUC ⭐ | Đường ROC / Diện tích dưới đường | Đo khả năng phân biệt hai lớp (0.5 = đoán mò, 1.0 = hoàn hảo) |
| MAE / MSE / RMSE ⭐ | Sai số tuyệt đối / bình phương / căn bình phương | Metrics cho bài toán hồi quy |
| R² (R-squared) | Hệ số xác định | Model giải thích được bao nhiêu % biến thiên |
| Class imbalance ⭐🎯 | Mất cân bằng lớp | 99% "không gian lận" → đoán bừa cũng 99% accuracy |
| Threshold | Ngưỡng | Điểm cắt xác suất để quyết định nhãn (mặc định 0.5) |

---

## 6. Deep Learning

| Tiếng Anh | Tiếng Việt | Giải thích ngắn |
|---|---|---|
| Neural network ⭐ | Mạng neural | Nhiều lớp phép nhân ma trận + hàm phi tuyến |
| Neuron / Node | Nơ-ron / Nút | Một đơn vị tính toán |
| Layer ⭐ | Lớp | Một tầng nơ-ron |
| Hidden layer | Lớp ẩn | Lớp giữa input và output |
| Deep learning ⭐ | Học sâu | Mạng neural nhiều lớp |
| Activation function ⭐🎯 | Hàm kích hoạt | Thêm tính phi tuyến (ReLU, sigmoid, GELU) |
| ReLU ⭐ | ReLU | `max(0, x)` — hàm kích hoạt phổ biến nhất |
| Softmax ⭐ | Softmax | Biến dãy số thành xác suất cộng bằng 1 |
| Forward pass ⭐ | Lượt truyền xuôi | Đưa dữ liệu qua mạng để ra dự đoán |
| Backpropagation ⭐🎯 | Lan truyền ngược | Tính gradient ngược từ loss về từng tham số |
| Autograd ⭐ | Tự động vi phân | PyTorch tự tính gradient giúp bạn |
| Dropout ⭐ | Bỏ ngẫu nhiên | Tắt ngẫu nhiên nơ-ron khi train để chống overfitting |
| Batch normalization | Chuẩn hoá theo lô | Ổn định quá trình train |
| Vanishing/Exploding gradient 🎯 | Gradient tiêu biến / bùng nổ | Gradient quá nhỏ hoặc quá lớn khiến mạng không học được |
| CNN ⭐ | Mạng tích chập | Chuyên xử lý ảnh |
| RNN / LSTM | Mạng hồi quy | Xử lý chuỗi — đã bị Transformer thay thế phần lớn |
| Transfer learning ⭐🎯 | Học chuyển giao | Lấy model đã train sẵn, chỉnh lại cho việc của mình |
| Pretrained model ⭐ | Model tiền huấn luyện | Model đã train trên dữ liệu khổng lồ |
| Checkpoint | Điểm lưu | File lưu trọng số model |
| GPU / CUDA ⭐ | Card đồ hoạ | Phần cứng tăng tốc train hàng chục lần |

---

## 7. NLP & Transformers

| Tiếng Anh | Tiếng Việt | Giải thích ngắn |
|---|---|---|
| NLP | Xử lý ngôn ngữ tự nhiên | Cho máy hiểu/sinh văn bản |
| Corpus | Kho ngữ liệu | Tập văn bản dùng để train |
| Token ⭐🎯 | Token | Đơn vị nhỏ nhất model xử lý (~0.75 từ tiếng Anh) |
| Tokenizer ⭐🎯 | Bộ tách token | Biến văn bản thành dãy số |
| Vocabulary | Từ vựng | Tập tất cả token model biết |
| Embedding ⭐🎯 | Vector nhúng | Biến token/câu thành vector số mang ngữ nghĩa |
| Semantic similarity ⭐ | Độ tương đồng ngữ nghĩa | Hai đoạn văn gần nghĩa nhau đến đâu |
| Cosine similarity ⭐ | Độ tương đồng cosin | Cách đo góc giữa hai vector (−1 → 1) |
| Transformer ⭐🎯 | Kiến trúc Transformer | Nền tảng của mọi LLM hiện đại (2017) |
| Attention ⭐🎯 | Cơ chế chú ý | Mỗi token "nhìn" các token khác để hiểu ngữ cảnh |
| Self-attention ⭐🎯 | Tự chú ý | Attention trong cùng một chuỗi |
| Multi-head attention | Chú ý đa đầu | Nhiều "góc nhìn" attention song song |
| Positional encoding 🎯 | Mã hoá vị trí | Cho model biết thứ tự từ (attention vốn không có thứ tự) |
| Encoder / Decoder | Bộ mã hoá / giải mã | Hiểu văn bản / sinh văn bản |
| Autoregressive ⭐ | Tự hồi quy | Sinh từng token, mỗi token dựa trên các token trước |
| Causal mask | Mặt nạ nhân quả | Che token tương lai khi train mô hình sinh |
| Perplexity | Độ bối rối | Metric đo model ngôn ngữ — càng thấp càng tốt |

---

## 8. LLM Engineering

| Tiếng Anh | Tiếng Việt | Giải thích ngắn |
|---|---|---|
| LLM ⭐ | Mô hình ngôn ngữ lớn | *Large Language Model* — Claude, GPT, Gemini... |
| Prompt ⭐ | Câu lệnh / Lời nhắc | Văn bản bạn gửi cho model |
| System prompt ⭐🎯 | Prompt hệ thống | Chỉ dẫn vai trò & quy tắc, đặt ngoài hội thoại |
| Context window ⭐🎯 | Cửa sổ ngữ cảnh | Tổng token model xử lý được trong một lần |
| Input / Output token ⭐ | Token vào / ra | Cơ sở tính tiền. Output thường đắt hơn input nhiều lần |
| Temperature ⭐🎯 | Nhiệt độ | 0 = ổn định, nhất quán; cao = sáng tạo, ngẫu nhiên |
| Top-p / Top-k | Lấy mẫu nhân / top-k | Cách khác để điều chỉnh độ ngẫu nhiên |
| Max tokens ⭐ | Giới hạn token đầu ra | Chặn model trả lời dài vô tận |
| Stop sequence | Chuỗi dừng | Gặp chuỗi này thì ngừng sinh |
| Streaming ⭐ | Truyền dòng | Nhận từng chữ thay vì chờ cả câu trả lời |
| Zero-shot / Few-shot ⭐🎯 | Không ví dụ / Vài ví dụ | Không cho ví dụ / cho vài ví dụ mẫu trong prompt |
| Chain-of-thought (CoT) ⭐🎯 | Chuỗi suy luận | Bắt model trình bày các bước suy nghĩ → chính xác hơn |
| Prompt engineering ⭐ | Kỹ thuật viết prompt | Nghệ thuật + kỹ thuật viết chỉ dẫn cho model |
| Structured output ⭐🎯 | Đầu ra có cấu trúc | Ép model trả JSON đúng schema |
| Tool use / Function calling ⭐🎯 | Gọi công cụ | Model yêu cầu chạy hàm của bạn rồi dùng kết quả |
| Hallucination ⭐🎯 | Ảo giác / Bịa đặt | Model bịa thông tin sai nhưng nghe rất thuyết phục |
| Grounding ⭐ | Neo vào nguồn | Buộc câu trả lời dựa trên tài liệu thật |
| Guardrails ⭐ | Rào chắn an toàn | Kiểm soát đầu vào/ra để tránh nội dung xấu hoặc sai |
| Prompt injection ⭐🎯 | Tiêm prompt | Kẻ xấu nhét lệnh vào dữ liệu để chiếm quyền model |
| Prompt caching ⭐ | Cache prompt | Lưu lại phần prompt lặp lại → giảm chi phí & độ trễ |
| Latency ⭐ | Độ trễ | Thời gian từ lúc gửi đến lúc nhận trả lời |
| TTFT | Thời gian tới token đầu | *Time To First Token* — cảm nhận "nhanh" của người dùng |
| Rate limit ⭐ | Giới hạn tần suất | Số request/token tối đa mỗi phút |
| Eval ⭐🎯 | Bộ đánh giá | Test tự động đo chất lượng đầu ra LLM. **Kỹ năng phân biệt pro/amateur** |
| LLM-as-judge ⭐ | Dùng LLM chấm điểm | Dùng một model để chấm đầu ra của model khác |
| Golden dataset ⭐ | Bộ dữ liệu chuẩn | Tập câu hỏi + đáp án đúng dùng để đo model |
| Regression (in eval) | Thoái lui chất lượng | Sửa prompt làm hỏng case đã chạy tốt |
| Fine-tuning ⭐🎯 | Tinh chỉnh | Train tiếp model trên dữ liệu riêng của bạn |
| LoRA / QLoRA | Tinh chỉnh nhẹ | Fine-tune chỉ một phần nhỏ tham số → rẻ hơn nhiều |
| Distillation | Chưng cất | Dạy model nhỏ bắt chước model lớn |
| Quantization | Lượng tử hoá | Nén model (16-bit → 4-bit) để chạy máy yếu |
| Idempotent retry ⭐ | Thử lại an toàn | Gọi lại khi lỗi mà không gây tác dụng phụ nhân đôi |

---

## 9. RAG

| Tiếng Anh | Tiếng Việt | Giải thích ngắn |
|---|---|---|
| RAG ⭐🎯 | Sinh có tăng cường truy xuất | *Retrieval-Augmented Generation* — tìm tài liệu liên quan rồi đưa vào prompt |
| Retrieval ⭐ | Truy xuất | Bước tìm tài liệu liên quan |
| Chunk / Chunking ⭐🎯 | Mảnh / Cắt mảnh | Cắt tài liệu dài thành đoạn nhỏ để tìm kiếm |
| Chunk overlap | Phần chồng lấn | Cho các mảnh gối lên nhau để không cắt đứt ý |
| Vector database ⭐ | Cơ sở dữ liệu vector | Kho lưu embedding, tìm theo độ tương đồng |
| Index | Chỉ mục | Cấu trúc giúp tìm nhanh |
| ANN search | Tìm láng giềng gần đúng | Đánh đổi chút chính xác lấy tốc độ |
| Top-k retrieval ⭐ | Lấy k kết quả đầu | Số mảnh đưa vào prompt |
| Semantic search ⭐ | Tìm kiếm ngữ nghĩa | Tìm theo *ý nghĩa*, không theo từ khoá |
| Keyword search / BM25 ⭐ | Tìm theo từ khoá | Tìm khớp chữ — vẫn rất mạnh với mã sản phẩm, tên riêng |
| Hybrid search ⭐🎯 | Tìm kiếm lai | Kết hợp semantic + keyword → tốt hơn cả hai |
| Reranking ⭐🎯 | Xếp hạng lại | Dùng model mạnh hơn sắp xếp lại top-k |
| Citation ⭐ | Trích dẫn nguồn | Chỉ rõ câu trả lời lấy từ đoạn nào |
| Faithfulness ⭐🎯 | Độ trung thực | Câu trả lời có bám đúng tài liệu không |
| Recall@k ⭐ | Độ bao phủ @k | Tài liệu đúng có nằm trong top-k không |
| Context stuffing | Nhồi ngữ cảnh | Nhét quá nhiều tài liệu → model loạn, tốn tiền |
| Lost in the middle 🎯 | Lạc giữa chừng | Model hay bỏ sót thông tin nằm giữa prompt dài |
| RRF ⭐🎯 | Hợp nhất nghịch đảo thứ hạng | *Reciprocal Rank Fusion* — gộp nhiều bảng xếp hạng bằng `1/(k0+hạng)`, không cần chuẩn hoá điểm |
| MRR ⭐ | Thứ hạng nghịch đảo trung bình | *Mean Reciprocal Rank* — kết quả đúng đầu tiên nằm ở hạng mấy. Recall hỏi "có không", MRR hỏi "hạng mấy" |
| Golden set / Gold labels ⭐🎯 | Bộ câu hỏi vàng | Tập câu hỏi kèm đáp án đúng **do người gán tay** — nền tảng của mọi phép đo RAG |

---

## 10. Agents

| Tiếng Anh | Tiếng Việt | Giải thích ngắn |
|---|---|---|
| Agent ⭐🎯 | Tác tử | LLM tự lặp: suy nghĩ → gọi tool → xem kết quả → lặp lại |
| Agent loop ⭐ | Vòng lặp agent | Chu trình chạy cho đến khi xong việc hoặc hết lượt |
| Tool ⭐ | Công cụ | Hàm bạn cho phép model gọi (tìm kiếm, đọc file, tính toán) |
| Tool schema ⭐ | Lược đồ công cụ | Mô tả tên, mục đích, tham số của tool cho model hiểu |
| ReAct 🎯 | ReAct | Mẫu *Reason + Act* — suy luận xen kẽ hành động |
| Memory ⭐ | Bộ nhớ | Lưu thông tin giữa các lượt / phiên |
| Short/Long-term memory | Bộ nhớ ngắn/dài hạn | Trong hội thoại / lưu ra ngoài |
| Planning | Lập kế hoạch | Model chia việc lớn thành các bước |
| Multi-agent ⭐ | Đa tác tử | Nhiều agent chuyên môn phối hợp |
| Orchestration | Điều phối | Ai làm gì, theo thứ tự nào |
| Human-in-the-loop ⭐🎯 | Có người duyệt | Chặn lại hỏi ý người trước hành động rủi ro |
| MCP ⭐ | Model Context Protocol | Chuẩn kết nối model với tool/dữ liệu ngoài |
| Max iterations ⭐ | Số vòng tối đa | Chặn agent lặp vô hạn đốt tiền |
| Sandbox | Hộp cát | Môi trường cách ly để chạy code sinh ra an toàn |
| Trajectory ⭐🎯 | Đường đi | Chuỗi hành động agent đã làm. Với agent phải chấm **cả đường đi**, không chỉ câu trả lời cuối |
| Idempotent ⭐ | Bất biến khi lặp | Gọi hai lần không hại thêm — bắt buộc với công cụ agent, vì agent hay quên và làm lại |
| Least privilege ⭐🎯 | Đặc quyền tối thiểu | Agent chỉ được cấp đúng công cụ nó cần. Phần lớn agent nên bắt đầu ở mức **chỉ đọc** |

---

## 11. MLOps & Deploy

| Tiếng Anh | Tiếng Việt | Giải thích ngắn |
|---|---|---|
| API ⭐ | Giao diện lập trình | Cách các chương trình gọi nhau |
| REST / Endpoint ⭐ | REST / Điểm cuối | Kiểu API phổ biến / một URL cụ thể |
| Request / Response 🔰 | Yêu cầu / Phản hồi | Gửi đi / nhận về |
| JSON ⭐ | JSON | Định dạng trao đổi dữ liệu phổ biến nhất |
| Schema validation ⭐ | Kiểm tra lược đồ | Đảm bảo dữ liệu đúng cấu trúc (Pydantic) |
| Environment variable ⭐ | Biến môi trường | Nơi cất API key an toàn |
| Container / Docker ⭐🎯 | Container | Đóng gói app + môi trường để chạy giống nhau ở mọi máy |
| Image | Ảnh container | Bản đóng gói tĩnh, chạy lên thành container |
| CI/CD ⭐ | Tích hợp & triển khai liên tục | Tự động test và deploy khi push code |
| Deployment ⭐ | Triển khai | Đưa app lên chạy thật |
| Logging ⭐ | Ghi nhật ký | Ghi lại chuyện gì đã xảy ra |
| Tracing ⭐🎯 | Truy vết | Theo dõi một request đi qua từng bước — bắt buộc với app LLM |
| Observability ⭐ | Khả năng quan sát | Nhìn được hệ thống đang khoẻ hay ốm |
| Monitoring ⭐ | Giám sát | Theo dõi chỉ số liên tục, cảnh báo khi bất thường |
| Caching ⭐ | Bộ nhớ đệm | Lưu kết quả cũ để khỏi tính lại → nhanh & rẻ hơn |
| Throughput | Thông lượng | Số request xử lý được mỗi giây |
| Cost per request ⭐ | Chi phí mỗi yêu cầu | Chỉ số sống còn của app LLM |
| Model drift 🎯 | Trôi dạt model | Model kém dần vì dữ liệu thực tế thay đổi |
| A/B testing | Kiểm thử A/B | So sánh hai phiên bản trên người dùng thật |
| Rollback | Quay lui | Trả về phiên bản cũ khi bản mới hỏng |
| Percentile / p95, p99 ⭐🎯 | Phân vị | p95 = 95% request nhanh hơn mức này. **Trung bình nói dối** vì độ trễ lệch phải — luôn báo p50/p95/p99 cùng nhau |
| Liveness probe ⭐🎯 | Kiểm tra còn sống | `/khoe` — sai thì **khởi động lại** container. Phải rẻ và cục bộ |
| Readiness probe ⭐🎯 | Kiểm tra sẵn sàng | `/san_sang` — sai thì **ngừng gửi traffic**, KHÔNG khởi động lại. Gộp hai cái là tự tạo bão restart |
| Rate limiting ⭐ | Giới hạn tần suất | Chặn số request. **Token bucket** không có ranh giới cửa sổ để lách như "N request mỗi phút" |
| Circuit breaker ⭐🎯 | Ngắt mạch | Dịch vụ phụ thuộc hỏng → từ chối **ngay** thay vì chờ timeout 30 giây và chết theo |
| Fail fast ⭐ | Hỏng sớm | Cấu hình sai thì **không cho khởi động**, thay vì hỏng lúc 3 giờ sáng |
| Secret scanning ⭐ | Quét bí mật | Tìm API key bị commit nhầm. **Bắt buộc có allowlist**, nếu không CI đỏ liên tục rồi người ta tắt luôn |

---

## 🔤 Viết tắt hay gặp

| Viết tắt | Đầy đủ |
|---|---|
| **AI** | Artificial Intelligence |
| **ML** | Machine Learning |
| **DL** | Deep Learning |
| **NLP** | Natural Language Processing |
| **LLM** | Large Language Model |
| **RAG** | Retrieval-Augmented Generation |
| **CoT** | Chain-of-Thought |
| **EDA** | Exploratory Data Analysis |
| **CNN** | Convolutional Neural Network |
| **RNN / LSTM** | Recurrent Neural Network / Long Short-Term Memory |
| **SGD** | Stochastic Gradient Descent |
| **MAE / MSE / RMSE** | Mean Absolute / Squared / Root Mean Squared Error |
| **AUC / ROC** | Area Under Curve / Receiver Operating Characteristic |
| **API** | Application Programming Interface |
| **MCP** | Model Context Protocol |
| **CI/CD** | Continuous Integration / Continuous Deployment |
| **TTFT** | Time To First Token |
| **SOTA** | State Of The Art (tốt nhất hiện tại) |

---

> 💡 **Mẹo học thuật ngữ:** Mỗi khi tra một từ ở đây, hãy tự đặt một câu ví dụ dùng từ đó. Ví dụ với *overfitting*: *"Model của tôi đạt 99% trên train nhưng 62% trên test — chắc chắn overfitting."*
