# Design Patterns bằng JavaScript — Giáo trình cho người mới

Bộ tài liệu này dùng để **giảng dạy**, không phải để tra cứu. Mỗi bài được thiết kế cho một buổi
học 60–90 phút: kể vấn đề trước, đưa pattern ra sau, rồi để học viên tự làm.

Toàn bộ code chạy bằng **Node.js thuần (>= 18)**, không cần cài package nào.

```bash
node src/01-factory/demo.js
```

---

## Lộ trình

| # | Bài | Nhóm | Ý một câu |
|---|-----|------|-----------|
| 00 | [Vì sao cần Design Patterns](docs/00-gioi-thieu.md) | Nền tảng | Pattern là tên gọi chung cho những cách giải quyết đã được kiểm chứng |
| 01 | [Factory](docs/01-factory.md) | Creational | Giấu chuyện "tạo object nào" khỏi nơi sử dụng |
| 02 | [Singleton](docs/02-singleton.md) | Creational | Đảm bảo cả hệ thống chỉ có đúng một thể hiện |
| 03 | [Builder](docs/03-builder.md) | Creational | Dựng object phức tạp theo từng bước |
| 04 | [Prototype](docs/04-prototype.md) | Creational | Tạo object mới bằng cách nhân bản object có sẵn |
| 05 | [Adapter](docs/05-adapter.md) | Structural | Bọc một interface lạ thành interface mình quen |
| 06 | [Decorator](docs/06-decorator.md) | Structural | Thêm hành vi cho object mà không sửa class gốc |
| 07 | [Facade](docs/07-facade.md) | Structural | Một cửa đơn giản che đi hệ thống con phức tạp |
| 08 | [Proxy](docs/08-proxy.md) | Structural | Người gác cổng đứng trước object thật |
| 09 | [Strategy](docs/09-strategy.md) | Behavioral | Thay thuật toán như thay pin, không sửa code gọi |
| 10 | [Observer](docs/10-observer.md) | Behavioral | Một thay đổi, nhiều nơi tự biết |
| 11 | [Command](docs/11-command.md) | Behavioral | Đóng gói hành động thành object để undo/queue/log |
| 12 | [State](docs/12-state.md) | Behavioral | Object đổi hành vi khi đổi trạng thái, thay cho rừng if |
| 13 | [Module](docs/13-module.md) | JS đặc thù | Đóng gói private/public — pattern gốc rễ của JS |
| 14 | [Middleware / Chain of Responsibility](docs/14-middleware.md) | JS đặc thù | Xâu chuỗi xử lý kiểu Express |
| 15 | [Pub/Sub — Event Bus](docs/15-pubsub.md) | JS đặc thù | Observer nhưng hai bên không biết nhau |
| 16 | [Dependency Injection](docs/16-dependency-injection.md) | JS đặc thù | Đưa phụ thuộc từ ngoài vào để test được |
| 17 | [Reactive / Signal](docs/17-signal.md) | JS đặc thù | Giá trị tự lan truyền — nền tảng của UI hiện đại |
| 99 | [Tổng kết & so sánh](docs/99-tong-ket.md) | Nền tảng | Phân biệt các pattern hay bị nhầm lẫn |

---

## Cấu trúc thư mục

```
design_patterns/
├── README.md              ← bạn đang ở đây
├── docs/                  ← bài giảng (lý thuyết, sơ đồ, đề bài)
│   ├── 00-gioi-thieu.md
│   ├── 01-factory.md
│   └── ...
└── src/                   ← code chạy được
    ├── 01-factory/
    │   ├── demo.js        ← ví dụ minh họa, chạy để xem output
    │   ├── bai-tap.js     ← khung sẵn, có TODO cho học viên
    │   └── loi-giai.js    ← đáp án tham khảo
    └── ...
```

Mỗi file `demo.js` đều **tự chạy độc lập** và in ra output có chú thích, để bạn chiếu lên
màn hình trong lúc giảng.

---

## Gợi ý cách dạy mỗi buổi

1. **10 phút — Đau trước, thuốc sau.** Chiếu đoạn code "xấu" ở đầu mỗi bài. Hỏi học viên:
   "Giờ sếp bảo thêm một loại nữa, các bạn phải sửa mấy chỗ?"
2. **15 phút — Giới thiệu pattern.** Vẽ sơ đồ lên bảng. Nêu tên từng vai trò.
3. **15 phút — Đọc `demo.js` cùng nhau.** Chạy thật, xem output.
4. **25 phút — Học viên làm `bai-tap.js`.** Bạn đi vòng quanh hỗ trợ.
5. **10 phút — Chữa bài, so với `loi-giai.js`.** Nhấn mạnh phần "Khi nào KHÔNG nên dùng".

> **Nguyên tắc xuyên suốt:** đừng dạy pattern như một danh sách phải thuộc lòng. Mỗi pattern chỉ
> có nghĩa khi học viên đã tự tay chạm vào cái đau mà nó chữa.

---

## Ba câu hỏi luôn phải trả lời được cho mỗi pattern

1. **Nó chống lại thay đổi nào?** (pattern nào cũng là một hàng rào chắn một loại thay đổi)
2. **Cái giá phải trả là gì?** (thêm class, thêm gián tiếp, khó debug hơn)
3. **Nếu không dùng thì code trông thế nào?** (nếu câu trả lời là "cũng ổn thôi" → đừng dùng)
