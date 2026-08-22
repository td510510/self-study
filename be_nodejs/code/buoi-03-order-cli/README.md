# Project 0 — CLI phân tích đơn hàng

Sản phẩm đầu tay của khoá học. Một công cụ dòng lệnh đọc file JSON đơn hàng, lọc và thống kê, in báo cáo ra terminal hoặc ghi ra file.

**Không framework, không thư viện ngoài — chỉ Node core.**

---

## Chạy thử

```bash
cp .env.example .env

npm start                                    # báo cáo toàn bộ
node --env-file=.env src/cli.js --status=paid --top=2
node --env-file=.env src/cli.js --out=bao-cao.txt
node src/cli.js --help
```

Kết quả mẫu:

```
BÁO CÁO ĐƠN HÀNG — lọc: paid
──────────────────────────────────────────────
Số đơn          : 4
Tổng sản phẩm   : 23
Doanh thu       : 5.440.000 ₫
Giá trị TB/đơn  : 1.360.000 ₫

Theo trạng thái
  paid           4

Khách hàng hàng đầu
  1. Mai Anh             2.340.000 ₫ (2 đơn)
  2. Thu Hà              2.340.000 ₫ (1 đơn)
```

---

## Tham số

| Tham số | Ý nghĩa | Mặc định |
|---|---|---|
| `--status=paid\|pending\|cancelled` | Chỉ tính đơn có trạng thái này | không lọc |
| `--top=5` | Số khách hàng hàng đầu hiển thị | `DEFAULT_TOP` trong `.env` |
| `--out=bao-cao.txt` | Ghi ra file thay vì in màn hình | in màn hình |
| `--help`, `-h` | Hiển thị hướng dẫn | |

---

## Kiến trúc

```
src/
├── cli.js      ← điểm vào: parse tham số, điều phối, xử lý lỗi cuối cùng
├── loader.js   ← đọc & kiểm tra dữ liệu đầu vào (chạm I/O)
├── report.js   ← logic nghiệp vụ THUẦN — vào dữ liệu, ra dữ liệu
└── format.js   ← trình bày kết quả ra terminal
```

**Vì sao chia như vậy?** `report.js` không đọc file, không in màn hình, không đụng `process.env`. Nó là **hàm thuần** — nên test được mà không cần chạy cả chương trình.

Nguyên tắc này theo ta suốt khoá học, đến tận tầng **Service** của NestJS ở buổi 34.

---

## Exit code

| Mã | Ý nghĩa |
|---|---|
| `0` | Thành công |
| `1` | Lỗi đã lường trước (`DataError`) — file không tồn tại, JSON hỏng, tham số sai |
| `2` | Lỗi ngoài dự kiến — in đầy đủ stack trace để debug |

Kiểm chứng:

```bash
node --env-file=.env src/cli.js --sai=1
echo $?    # → 1
```

> Frontend dev gần như chưa bao giờ quan tâm khái niệm này, nhưng nó là cách **duy nhất** để mọi hệ thống tự động (CI, cron, Docker, Kubernetes) biết chương trình của bạn chạy có ổn không.

---

## Debug

```bash
# Dừng ngay dòng đầu tiên và chờ debugger gắn vào
node --inspect-brk --env-file=.env src/cli.js --status=paid
# → mở Chrome, vào chrome://inspect, bấm "inspect"
```

Hoặc trong VS Code: nhấn **F5** (đã có sẵn `.vscode/launch.json`).

Đặt breakpoint trong `topCustomers` và quan sát `byCustomer` lớn dần qua từng vòng lặp.

> **Từ giờ trở đi, debugger là công cụ chính, `console.log` chỉ là phương án phụ.**

---

## Bài tập mở rộng

1. Thêm `--from=2026-07-05` và `--to=2026-07-11` để lọc theo khoảng ngày. Nhớ kiểm tra định dạng ngày và báo lỗi rõ ràng nếu sai.
2. Thêm `--format=json|text`. Khi chọn `json`, in ra JSON thuần để công cụ khác đọc được.
3. Tạo `data/orders-broken.json` với **ba loại lỗi** khác nhau (không phải JSON, không phải mảng, `total` là chuỗi). Kiểm chứng CLI báo đúng lỗi và trả exit code `1` cho cả ba.
4. Viết `README.md` của riêng bạn, đủ để người lạ clone về chạy được ngay.
