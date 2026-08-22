# Buổi 46 — Code review & API contract

> **Phase 5** · Production-ready
> **Mục tiêu:** Rèn kỹ năng làm việc nhóm — thứ quyết định năng suất dài hạn nhiều hơn kỹ thuật thuần tuý.

---

## Dòng thời gian 180 phút

| Thời gian | Nội dung |
|---|---|
| 0–15′ | Chữa bài tập buổi 45 |
| 15–70′ | **Đọc code người khác có hệ thống** |
| 70–110′ | Viết nhận xét: cách nói quan trọng ngang nội dung |
| 110–150′ | API contract để FE–BE làm song song |
| 150–175′ | **Thực hành review chéo** |
| 175–180′ | Bài tập |

---

## 1. Đọc code người khác có hệ thống (15–70′)

> **📝 Ghi chú giảng viên**
> Học viên frontend thường đã từng review UI. Review backend khác ở chỗ: **lỗi không nhìn thấy được**. Không có gì "trông sai" — phải biết **tìm gì**.

### Thứ tự đọc: từ ngoài vào trong

```
1. Mô tả PR   — người viết định làm gì?
2. Test       — họ nghĩ hành vi đúng là gì?
3. Giao diện  — route, DTO, kiểu dữ liệu
4. Cài đặt    — logic bên trong
5. Migration  — thay đổi database (KHÓ HOÀN TÁC NHẤT)
```

> **Đọc test trước code.** Test cho biết **ý định**; code chỉ cho biết **cái đã làm**. Nếu hai thứ lệch nhau, đó là phát hiện quan trọng nhất.

### Danh sách kiểm tra — rút từ chính khoá học

| Nhóm | Kiểm tra | Buổi |
|---|---|---|
| **Bảo mật** | Có kiểm quyền theo **chủ sở hữu** không? (IDOR) | 16 |
| | `data: req.body` ở đâu không? (mass assignment) | 22 |
| | `$queryRawUnsafe` với input người dùng? | 22 |
| | Response/log có lộ hash, token, stack trace? | 15, 18 |
| **Dữ liệu** | Tiền có dùng `Float` không? | 18 |
| | Thao tác nhiều bước có transaction + khoá? | 19 |
| | `onDelete` có đúng nghiệp vụ? | 18 |
| **Hiệu năng** | Có `await` trong vòng lặp database? (N+1) | 13 |
| | Cột trong `WHERE`/`ORDER BY` có index? | 19 |
| | Có gọi API bên ngoài trong transaction? | 20 |
| **Đúng đắn** | Status code đúng ngữ nghĩa? | 24 |
| | Lỗi được xử lý hay bị **nuốt**? | 03 |
| | Job/endpoint có idempotent? | 24, 26 |
| **Vận hành** | Log có che dữ liệu nhạy cảm? | 18 |
| | Migration có tương thích ngược? | 41 |
| | Có test cho nhánh lỗi, không chỉ nhánh thành công? | 09 |

> In bảng này ra, dán cạnh màn hình. Sau vài chục lần review nó thành phản xạ.

### Ba câu hỏi luôn hỏi

```
1. Nếu HAI người làm việc này CÙNG LÚC thì sao?      (buổi 19)
2. Nếu bước này THẤT BẠI GIỮA CHỪNG thì dữ liệu ra sao?  (buổi 19, 26)
3. Nếu dữ liệu tăng 1000 lần thì code này còn chạy được không?  (buổi 19, 20)
```

> Ba câu này bắt được phần lớn bug nghiêm trọng — và chúng là ba câu **frontend không bao giờ phải hỏi**.

---

## 2. Viết nhận xét (70–110′)

> **📝 Ghi chú giảng viên**
> Review làm hỏng quan hệ team nhanh hơn bất kỳ thứ gì. Cách nói quan trọng **ngang** nội dung.

### Phân loại rõ mức độ

| Nhãn | Nghĩa | Chặn merge? |
|---|---|---|
| **[Chặn]** | phải sửa — bug, lỗ hổng bảo mật | ✅ |
| **[Nên sửa]** | cải thiện đáng kể, nên làm | thảo luận |
| **[Gợi ý]** | ý kiến cá nhân, tuỳ tác giả | ❌ |
| **[Hỏi]** | tôi chưa hiểu, giải thích giúp | ❌ |
| **[Khen]** | chỗ này làm tốt | ❌ |

> Không phân loại thì mọi nhận xét trông như nhau — tác giả không biết cái nào bắt buộc.

### Viết về CODE, không về NGƯỜI

| ❌ | ✅ |
|---|---|
| "Bạn quên kiểm quyền" | "[Chặn] Endpoint này thiếu kiểm chủ sở hữu — người dùng khác đoán id là sửa được. Xem buổi 16." |
| "Code này tệ" | "[Nên sửa] Vòng lặp này gọi database mỗi lần → N+1. Dùng `include` gộp lại được không?" |
| "Sao không dùng transaction?" | "[Hỏi] Nếu bước 2 lỗi thì tồn kho đã trừ có được hoàn lại không? Mình chưa thấy transaction." |

### Nêu VÌ SAO và ĐỀ XUẤT

> Nhận xét tốt có ba phần: **vấn đề** → **hậu quả** → **đề xuất**.
>
> *"[Chặn] `data: req.body` cho phép client gửi `vaiTro: 'admin'` (mass assignment, buổi 22). Hậu quả: khách tự nâng quyền. Đề xuất: liệt kê trường tường minh, hoặc bật `forbidNonWhitelisted`."*

### Khen cũng là một phần của review

> Nếu review chỉ toàn chê, người ta sẽ **sợ** mở PR. Ghi nhận chỗ làm tốt — đặc biệt là **test cho trường hợp biên** và **comment giải thích quyết định khó**.

### Phía người nhận review

| Nên | Không nên |
|---|---|
| Trả lời **mọi** nhận xét (dù chỉ "đã sửa") | im lặng sửa rồi push |
| Hỏi lại khi không đồng ý | tranh cãi để thắng |
| Cảm ơn khi tìm ra bug thật | coi là bị công kích |

> **Review là về code, không phải về người viết.** Nhắc cả lớp điều này trước khi thực hành.

---

## 3. API contract để FE–BE làm song song (110–150′)

### Vấn đề

```
Không có contract:
  BE làm 2 tuần  →  FE mới bắt đầu  →  phát hiện thiếu trường  →  BE sửa  →  ...
```

### Cách làm

```
1. FE và BE THỐNG NHẤT contract trước (OpenAPI hoặc markdown)
2. FE dựng mock server từ contract  →  làm ngay, không chờ
3. BE implement theo contract
4. Test tự động kiểm chứng contract
```

> **Lợi ích lớn nhất không phải tài liệu, mà là hai bên làm SONG SONG.**

### Contract phải chốt những gì

| Mục | Ví dụ |
|---|---|
| Đường dẫn + method | `POST /don-hang` |
| Body vào (kèm ràng buộc) | `diaChiGiao` ≥ 5 ký tự |
| Body ra khi thành công | kèm ví dụ thật |
| **Mọi mã lỗi có thể xảy ra** | `400`, `401`, `403`, `409`, `429` |
| **Mã lỗi ổn định** | `HET_HANG`, `KHONG_DU_QUYEN` |
| Phân trang | offset hay cursor (buổi 20) |
| Header đặc biệt | `Idempotency-Key` (buổi 24) |

> **📝 Ghi chú giảng viên**
> Dòng *"mọi mã lỗi có thể xảy ra"* hay bị bỏ sót nhất. FE thường chỉ được cho biết luồng thành công, rồi tự xoay xở khi gặp lỗi.
>
> Nối lại buổi 18: FE so khớp **`ma`**, không so khớp chuỗi tiếng Việt — nên `ma` **phải** nằm trong contract.

### Sinh contract tự động

> Nối lại buổi 39: NestJS sinh OpenAPI **từ DTO**, nên contract **luôn khớp code**.
>
> Nhưng nó chỉ sinh được **cấu trúc**. Phần *"khi nào trả `409`"* và *"trường này nghĩa là gì"* vẫn phải **người viết**.

---

## 4. Thực hành review chéo (150–175′)

Chia cặp. Mỗi người review Project 2 hoặc Project 4 của bạn cùng cặp, theo bảng kiểm tra ở mục 1.

**Yêu cầu:** ít nhất
- 2 nhận xét **[Chặn]** hoặc **[Nên sửa]** có nêu vì sao + đề xuất
- 1 nhận xét **[Hỏi]**
- 1 nhận xét **[Khen]**

> **📝 Ghi chú giảng viên**
> Dành 10 phút cuối cho cả lớp chia sẻ: *"phát hiện thú vị nhất là gì?"*
>
> Thường sẽ có ít nhất một học viên tìm ra lỗ hổng IDOR hoặc N+1 thật trong code bạn mình — và đó là khoảnh khắc họ tin vào giá trị của review.

---

## 5. Quy ước làm việc nhóm

### Commit message

```
feat(don-hang): thêm idempotency key cho endpoint đặt hàng

Chống tạo trùng đơn khi client retry hoặc người dùng bấm hai lần.
Khoá lưu ở Redis kèm userId, TTL 24 giờ.

Refs: #142
```

| Phần | Vai trò |
|---|---|
| Loại (`feat`/`fix`/`refactor`/`test`/`docs`) | quét được để sinh changelog |
| Phạm vi | biết ngay đụng module nào |
| Mô tả | **vì sao**, không chỉ **cái gì** |

> Code cho biết **cái gì** đã thay đổi. Commit message cho biết **vì sao** — thứ không đọc được từ code.

### PR nhỏ

| Kích thước PR | Chất lượng review |
|---|---|
| < 200 dòng | đọc kỹ được |
| 200–500 dòng | bắt đầu bỏ sót |
| > 500 dòng | *"LGTM"* — review hình thức |

> **PR lớn không được review, chúng chỉ được phê duyệt.**

---

## 6. Bài tập về nhà

1. **Review chéo hoàn chỉnh.** Review Project 4 của một bạn khác theo đủ bảng kiểm tra. Nộp danh sách nhận xét có phân loại.

2. **Tự review.** Đọc lại Project 2 của **chính mình** bằng bảng kiểm tra, như thể là code người khác. Tìm được bao nhiêu vấn đề?

3. **Viết API contract.** Viết contract cho luồng đặt hàng đầy đủ, **bao gồm mọi mã lỗi**. Đưa cho một bạn và hỏi: đủ để làm frontend chưa?

4. **Mock server.** Từ `openapi.json` của Project 4, dựng mock server (Prism hoặc Mockoon). Viết một trang HTML gọi mock đó. Chứng minh FE làm được khi BE chưa xong.

5. **Sửa commit message.** Lấy 5 commit gần nhất của bạn, viết lại theo chuẩn. Có commit nào bạn **không nhớ vì sao** đã làm không?

6. **Nâng cao — contract testing.** Tìm hiểu Pact. Nó khác gì so với chỉ có OpenAPI? Nó bắt được lỗi gì mà OpenAPI không bắt?

---

## 7. Checklist kết thúc buổi

- [ ] Thứ tự đọc một PR? Vì sao đọc test trước code?
- [ ] Kể 5 mục trong danh sách kiểm tra bảo mật.
- [ ] Ba câu hỏi luôn hỏi khi review backend?
- [ ] Vì sao phải phân loại mức độ nhận xét?
- [ ] Ba phần của một nhận xét tốt?
- [ ] Vì sao khen cũng là một phần của review?
- [ ] Lợi ích lớn nhất của API contract là gì?
- [ ] Vì sao mã lỗi ổn định phải nằm trong contract?
- [ ] PR bao nhiêu dòng thì review bắt đầu hình thức?

---

**Buổi trước:** [Buổi 45 — System Design nhập môn](./buoi-45-system-design.md)
**Buổi tiếp theo:** Buổi 47 — Capstone: thiết kế
