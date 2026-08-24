# 🏆 Phase 11 · Capstone

**Thời gian:** Tuần 23+ (~40–60 giờ) · **Điều kiện:** xong [Phase 10](../10-deploy-ops/README.md)

---

## 🎯 Mục tiêu

Mười phase trước dạy bạn từng mảnh. Capstone là lúc ghép chúng thành **một thứ có thật, người khác dùng được, và bạn nói được về nó trong 5 phút**.

- [ ] Chọn một bài toán **thật** và giới hạn phạm vi cho đúng sức
- [ ] Ghép **RAG hoặc Agent** + **eval** + **API** + **deploy** + **quan sát**
- [ ] Viết README như một sản phẩm, không như một bài tập
- [ ] Viết một bài **blog** kể lại quá trình — kể cả những chỗ sai
- [ ] Chuẩn bị được **câu chuyện 5 phút** để kể trong phỏng vấn

> **Điểm mấu chốt của phase này:** capstone không phải để chứng minh bạn dùng được nhiều công nghệ. Nó để chứng minh bạn **đưa được một thứ vào tay người dùng và biết nó chạy tốt đến đâu**.
>
> Một hệ thống nhỏ có eval và số liệu **luôn** ấn tượng hơn một hệ thống hoành tráng không ai biết nó đúng bao nhiêu phần trăm.

---

## 1. Chọn đề tài

### Ba tiêu chí, phải đạt cả ba

| Tiêu chí | Câu hỏi kiểm tra |
|---|---|
| **Có người cần** | Bạn kể tên được **một người cụ thể** sẽ dùng nó không? |
| **Bạn hiểu miền** | Bạn tự đánh giá được câu trả lời đúng hay sai không? |
| **Có dữ liệu** | Bạn có 30–50 mẫu để gán nhãn làm bộ eval không? |

Tiêu chí thứ hai quan trọng hơn vẻ ngoài của nó. Nếu bạn không hiểu miền, bạn **không thể gán nhãn** — và không có bộ eval thì capstone của bạn tụt xuống mức "⚠️ Tạm được" bất kể code đẹp đến đâu.

> ⚠️ **Đừng chọn đề tài vì nó "nghe ấn tượng".** Một trợ lý tra cứu quy chế của chính trường bạn, có 40 câu hỏi vàng và số đo thật, mạnh hơn nhiều so với "nền tảng AI đa năng cho doanh nghiệp" không ai dùng.

### Vài hướng đã được kiểm chứng là vừa sức

| Đề tài | Dùng gì | Vì sao đáng làm |
|---|---|---|
| Tra cứu tài liệu nội bộ / quy chế | RAG | Nhu cầu rõ nhất, dễ tìm người dùng thật |
| Trợ lý vận hành (đơn hàng, kho, ticket) | Agent | Thể hiện guardrail và eval đường đi |
| Trích xuất dữ liệu từ tài liệu | Structured output | Eval cực kỳ rõ ràng, dễ ra số đẹp |
| Trợ giảng cho một môn học | RAG | Dễ tìm dữ liệu, dễ demo, có người dùng ngay |
| Phân loại & định tuyến yêu cầu hỗ trợ | Classification + eval | Có chỉ số kinh doanh đo được |

### Giới hạn phạm vi — phần khó nhất

Đây là chỗ hầu hết capstone chết: đề tài phình ra cho tới khi không kịp làm gì cho tới.

**Viết ra ba dòng này trước khi gõ dòng code đầu tiên:**

```
Hệ thống của tôi LÀM:        ...
Hệ thống của tôi KHÔNG LÀM:  ...
Tôi biết nó tốt khi:         ...
```

Dòng thứ hai dài hơn dòng thứ nhất là dấu hiệu **tốt**. Dòng thứ ba phải là một **con số**, không phải một cảm giác.

---

## 2. Lịch làm việc gợi ý

Capstone nên chia làm **bốn tuần**, và thứ tự dưới đây có chủ đích.

| Tuần | Làm gì | Xong khi |
|---|---|---|
| **1** | Chọn đề tài, thu dữ liệu, **gán nhãn bộ eval** | Có ≥ 30 mẫu vàng và một baseline |
| **2** | Xây lõi (RAG/Agent), chạy eval, sửa | Số liệu tốt hơn baseline rõ ràng |
| **3** | API + guardrail + quan sát + Docker | Chạy được trong container, có `/so_lieu` |
| **4** | Deploy, người dùng thật, README + blog | Có URL công khai và ≥ 3 người đã dùng |

> ⭐ **Vì sao gán nhãn bộ eval ở TUẦN 1, trước khi xây gì cả?**
>
> Vì bộ eval là **đặc tả** của hệ thống. Trong lúc gán nhãn, bạn sẽ liên tục phải quyết định những ca mập mờ — *"câu này tính là có đáp án hay không?"*, *"trả lời thế này đã đủ chưa?"*. Mỗi quyết định đó là một dòng trong bản đặc tả mà bạn không viết ra nếu không gán nhãn.
>
> Và nó cứu bạn khỏi cái bẫy lớn nhất: xây hai tuần rồi mới phát hiện mình đang giải sai bài toán.

---

## 3. Kiến trúc tối thiểu

```
        người dùng
             │
             ▼
      ┌─────────────┐
      │  API layer  │  validate · rate limit · ngân sách · ngắt mạch
      └──────┬──────┘
             ▼
      ┌─────────────┐
      │    lõi      │  RAG hoặc Agent (hoặc cả hai)
      └──────┬──────┘
             ▼
      ┌─────────────┐
      │ Claude API  │
      └─────────────┘

  chạy song song, KHÔNG nằm trong đường request:
      bộ eval  ·  log có trace_id  ·  /so_lieu
```

**Đừng thêm gì ngoài sơ đồ này ở phiên bản đầu.** Không vector database phân tán, không hàng đợi, không microservice. Mỗi thành phần thêm vào là một chỗ có thể hỏng vào đúng hôm bạn demo.

Danh sách kiểm bắt buộc — mỗi mục đều đã học ở một phase cụ thể:

| Mục | Học ở | Bằng chứng |
|---|---|---|
| Bộ eval ≥ 30 mẫu **tự gán nhãn** | 07, 08, 09 | `eval/bo_test.json` |
| Có **baseline** để so | 04, 08 | Bảng trong README |
| So sánh **≥ 2 phiên bản**, bắt được thoái lui | 07–09 | Bảng so sánh theo từng ca |
| Validate đầu vào + mã lỗi | 10 | `test_app.py` |
| Ngân sách **chặn**, giới hạn tần suất | 10 | Test khẳng định model **không được gọi** |
| Log có `trace_id`, đã lọc secret | 10 | Một đoạn log thật trong README |
| p50/p95/p99 + chi phí mỗi request | 10 | `/so_lieu` |
| Docker + CI không gọi API thật | 10 | `.github/workflows/ci.yml` |
| URL công khai | 10 | Link trong README |

---

## 4. Tự kiểm bằng script

```powershell
python curriculum/11-capstone/kiem_tra_capstone.py duong/dan/toi/capstone
```

Script quét thư mục capstone và báo những gì còn thiếu — cấu trúc file, bộ eval, test, Docker, CI, và **quét cả secret bị commit nhầm**.

Nó không chấm chất lượng code. Nó chỉ đảm bảo bạn **không quên** thứ gì trước khi nộp.

---

## 5. README của capstone

README là thứ nhà tuyển dụng đọc, và với nhiều người đó là thứ **duy nhất** họ đọc.

Dùng mẫu tại `mau/README_capstone.md`. Cấu trúc:

```
Vấn đề  →  Cách tiếp cận  →  Kết quả (CÓ SỐ)  →  Sai ở đâu  →  Hạn chế  →  Bài học
```

Ba mục đáng nói:

| Mục | Vì sao |
|---|---|
| **Kết quả có số** | "Hệ thống hoạt động tốt" là câu vô nghĩa. "0.87 trên 42 ca, baseline 0.31, $0.02/câu" thì không |
| **Sai ở đâu** | Mục này gây ấn tượng mạnh hơn mục kết quả. Nó chứng minh bạn đã đo, đã đọc lỗi, đã sửa |
| **Hạn chế** | Người viết được phần này là người hiểu hệ thống của mình. Người bỏ qua nó thường chưa dùng thử đủ |

> ⚠️ **Đặt ảnh chụp màn hình hoặc GIF demo ở ngay đầu README.** Người đọc quyết định có đọc tiếp hay không trong 10 giây đầu, và một bảng số liệu không giữ chân được ai trong 10 giây đó.

---

## 6. Bài blog

Blog không phải để khoe. Nó là **bản nháp của câu trả lời phỏng vấn**, và nó buộc bạn sắp xếp lại những gì đã làm.

Dùng mẫu tại `mau/blog.md`. Bố cục hiệu quả nhất:

| Phần | Nội dung |
|---|---|
| Mở | Vấn đề cụ thể của một người cụ thể |
| Thử lần 1 | Cách làm ngây thơ nhất, và **con số** cho thấy nó chưa đủ |
| Điều bất ngờ | Thứ bạn tưởng đúng mà đo ra sai |
| Thử lần 2 | Sửa gì, số liệu đổi thế nào |
| Cái giá | Đánh đổi bạn đã chấp nhận, và vì sao |
| Còn lại | Nó chưa làm được gì |

> ⭐ **Phần "Điều bất ngờ" là phần người ta đọc và nhớ.**
>
> Khoá học này có sẵn ba ví dụ mẫu cho dạng đó: hybrid search làm *tăng* điểm trung bình nhưng *giảm* nhóm câu mã lỗi (Phase 08); agent "tối ưu" ít bước hơn nhưng hành động mù (Phase 09); p95 trông đẹp trong khi cái đuôi 10 giây nằm ở p99 (Phase 10).
>
> Capstone của bạn gần như chắc chắn có một thứ tương tự — **nếu bạn có đo**. Đó là bài viết đáng đọc.

**Nơi đăng:** blog cá nhân, dev.to, Medium, hoặc một file `blog.md` trong repo. Nơi đăng ít quan trọng hơn việc **có viết**.

---

## 7. Câu chuyện 5 phút

Cuối cùng, luyện nói. Đây là thứ bạn thật sự sẽ dùng.

```
30 giây   Vấn đề: ai, đang khổ vì gì, hiện họ làm thế nào
60 giây   Cách tiếp cận: kiến trúc, và VÌ SAO chọn thế
90 giây   Kết quả: SỐ. Bao nhiêu ca test, điểm bao nhiêu, so baseline nào,
          chi phí mỗi request
60 giây   Chỗ khó nhất: thứ bạn tưởng đúng mà đo ra sai, và cách sửa
30 giây   Hạn chế: nó chưa làm được gì, và bạn sẽ làm gì tiếp
30 giây   Đưa link demo
```

Luyện nói to, **bấm giờ thật**. Nếu bạn ấp úng ở đoạn 90 giây (phần số liệu), đó là dấu hiệu bạn chưa đo đủ — không phải dấu hiệu bạn nói chưa hay.

> 📌 **Đoạn 60 giây "chỗ khó nhất" thường quyết định buổi phỏng vấn.** Nó là chỗ duy nhất chứng minh bạn đã va vào thực tế chứ không chỉ làm theo hướng dẫn.

---

## ✅ Tiêu chí chấm

| Hạng mục | Điểm | Đạt khi |
|---|---|---|
| **Phạm vi rõ** | 10 | Ba dòng LÀM / KHÔNG LÀM / BIẾT TỐT KHI được viết ra và tôn trọng |
| **Bộ eval** | 25 | ≥ 30 mẫu tự gán nhãn, có baseline, có ca bẫy |
| **Lõi hoạt động** | 20 | Số liệu tốt hơn baseline rõ ràng, có so sánh ≥ 2 phiên bản |
| **Vận hành** | 20 | Validate, ngân sách chặn, log có trace_id, p50/p95/p99, Docker, CI |
| **Deploy thật** | 10 | URL công khai, người khác mở được |
| **README + blog** | 15 | Có số, có phần "sai ở đâu", có hạn chế trung thực |

**Tự chấm mức độ:**

| Mức | Dấu hiệu |
|---|---|
| ❌ Chưa đạt | Chỉ là notebook; hoặc có deploy nhưng không có eval |
| ⚠️ Tạm được | Chạy được, deploy được, nhưng chưa đo chất lượng bằng số |
| ✅ Tốt | Có bộ eval tự gán nhãn, có baseline, có số liệu trong README |
| 🌟 Xuất sắc | Có **người dùng thật**, và bộ eval đã **bắt được một lỗi bạn không ngờ tới** |

> Dấu hiệu 🌟 thứ hai là dấu hiệu thật. Nếu bạn chưa từng thấy bộ eval của mình báo một thứ khiến bạn ngạc nhiên, khả năng cao là bộ test của bạn còn quá dễ.

---

## 💡 Sáu cách capstone chết

| Cách chết | Dấu hiệu sớm | Cách tránh |
|---|---|---|
| **Phạm vi phình ra** | Tuần 3 vẫn đang thêm tính năng | Viết dòng "KHÔNG LÀM" và giữ nó |
| **Không có bộ eval** | "Tôi thử vài câu thấy ổn" | Gán nhãn ở **tuần 1**, trước khi xây |
| **Nhãn do model sinh** | Điểm eval cao bất thường ngay lần đầu | Gán tay. Đo *đúng*, không phải *nhất quán* |
| **Không có người dùng thật** | Bạn là người duy nhất từng chạy nó | Đưa cho 3 người ở tuần 4, ghi lại mọi câu nó sai |
| **Deploy phút chót** | Tuần 4 mới lần đầu chạy `docker build` | Dựng Docker ở **tuần 3**, không phải tuần 4 |
| **README viết vội** | Không có số nào trong README | Viết README **song song**, không phải cuối cùng |

> ⚠️ Cách chết phổ biến nhất là cách thứ hai. Nó không giết capstone của bạn — nó chỉ khiến capstone dừng ở mức "⚠️ Tạm được" mãi mãi, và bạn không biết vì sao người phỏng vấn không ấn tượng.

---

## 🌟 Nếu còn thời gian

Theo thứ tự đáng làm giảm dần:

- [ ] **Đưa cho 3 người dùng thật** và biến mọi câu nó sai thành ca test *(đáng nhất, và rẻ nhất)*
- [ ] **Theo dõi chất lượng theo thời gian** — chạy eval hằng tuần, vẽ đường
- [ ] **So sánh 2 model** (Haiku 4.5 vs Sonnet 5): điểm, chi phí, độ trễ → kết luận
- [ ] Prompt caching — đo tiền tiết kiệm thật
- [ ] Giao diện Gradio hoặc một trang HTML tối giản
- [ ] Chạy eval trong **CI** — mỗi PR đều biết mình có làm hỏng gì không
- [ ] Video demo 2 phút

> ⭐ Ý áp chót là ý biến capstone thành thứ nhìn giống một hệ thống **được vận hành**, không phải một bài tập được nộp: mỗi lần đổi prompt, CI chạy lại 30 ca và báo bạn vừa cải thiện hay vừa làm hỏng.

---

## 📌 Nộp bài

```powershell
python curriculum/11-capstone/kiem_tra_capstone.py duong/dan/toi/capstone
git add .
git commit -m "Capstone: <ten du an>"
git push
```

Bài test khắt khe nhất — và cũng là bài test cuối cùng của cả khoá học:

> Gửi link capstone cho một người **không học ngành này**, kèm đúng một câu:
> *"Bạn xem giúp mình cái này làm gì và nó có tốt không."*
>
> Nếu họ trả lời được **cả hai** vế chỉ bằng cách đọc README, bạn đã xong.
>
> Nếu họ hỏi lại *"nhưng nó dùng để làm gì?"* — README của bạn đang viết cho chính bạn, không phải cho người đọc.

---

⬅️ [Phase 10](../10-deploy-ops/README.md) · 🏠 [Về roadmap chính](../../README.md)
