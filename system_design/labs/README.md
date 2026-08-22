# Hướng dẫn chung cho các lab

## Chạy lab

Mọi lab đều là Node.js thuần, **không cần cài package nào**:

```bash
node labs/lab05-cache/03-stampede.js
```

Hoặc dùng shortcut trong `package.json`:

```bash
npm run lab05
```

## Nguyên tắc thiết kế các lab này

| Nguyên tắc | Vì sao |
|---|---|
| **Không dùng thư viện ngoài** | Để nhìn thấy *cơ chế*, không bị che bởi abstraction |
| **Mọi lab đều IN RA SỐ** | Con số thuyết phục hơn lời giảng |
| **Luôn có phiên bản SAI để so sánh** | Học viên phải thấy vấn đề trước khi thấy giải pháp |
| **Comment giải thích "vì sao", không phải "làm gì"** | Code đã nói "làm gì" rồi |
| **Kết bằng bài tập mở rộng** | Học thật sự xảy ra khi tự sửa code |

## Về "đồng hồ mô phỏng"

Một vài lab (05.2, 15) dùng **đồng hồ ảo** thay vì `setTimeout` thật. Lý do: mô phỏng 5.000 request
với độ trễ thật mất hơn 80 giây — quá lâu cho một buổi học. Các lab đó cộng dồn độ trễ vào một biến
đếm, cho ra con số latency đúng như hệ thống thật nhưng chạy trong 1 giây.

Các lab về **đồng thời** (04, 08, 09) thì dùng `setTimeout` **thật**, vì bản chất của chúng là các
race condition — mô phỏng thời gian sẽ làm mất hiện tượng cần quan sát.

⚠️ Lưu ý trên Windows: độ phân giải timer khoảng 15ms, nên các lab dùng `setTimeout` với giá trị
nhỏ (1-5ms) sẽ cho latency thực tế cao hơn cấu hình. Điều này **không ảnh hưởng kết luận** vì các
lab luôn so sánh tương đối giữa hai cách làm.

## Danh sách lab

| Lab | Chủ đề | Điểm nhấn |
|---|---|---|
| 01 | Khung 4 bước | Tự chấm xem quên bước nào |
| 02 | REST API thuần `node:http` | 12 test tự động kiểm tra API có đạt chuẩn |
| 03 | Đo lường | Latency nổ tung khi tải > 80% |
| 04 | Load balancer | least-conn cho throughput gấp 3 round-robin |
| 05 | Caching | Stampede: 520 query → 5 query |
| 06 | Index & transaction | Bán 100 sản phẩm từ kho 10 cái |
| 07 | Sharding & replication | `hash % N` phải di chuyển 80% dữ liệu |
| 08 | Message queue | At-least-once gửi trùng 16 email |
| 09 | Resilience | Jitter nâng tỉ lệ thành công từ 20% lên 59% |
| 10 | Hệ phân tán | LWW chọn sai người thắng 34% số lần |
| 11 | Search | Inverted index nhanh hơn LIKE 174 lần |
| 12 | Observability | Trung bình của p99 = 3500ms, p99 thật = 1000ms |
| 13 | Bảo mật | `alg:none` cho toàn quyền admin |
| 14 | Gateway | 12 microservice → 11% request dính đuôi |
| 15 | Case study | URL shortener hoàn chỉnh |

> Các con số trên là kết quả tham khảo — mỗi lần chạy sẽ khác chút ít vì có yếu tố ngẫu nhiên.
> Nếu kết quả của học viên lệch **hẳn** so với bảng này, đó là cơ hội thảo luận tốt: vì sao?
