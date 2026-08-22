# Hướng dẫn cài đặt môi trường thực hành

Mục tiêu: sau 20 phút, mọi máy trong lớp đều kết nối được vào **SQL Server** và **MongoDB**.

---

## Cách 1 — Cài trực tiếp trên Windows (khuyến nghị cho lớp học ở VN)

### Bước 1. SQL Server 2022 Developer Edition

1. Tải tại <https://www.microsoft.com/sql-server/sql-server-downloads> → chọn
   **Developer** (miễn phí, đầy đủ tính năng như bản Enterprise).
2. Chạy installer → chọn kiểu cài **Basic** → Accept → Install.
3. Khi cài xong, cửa sổ hiện chuỗi kết nối dạng `localhost` hoặc
   `DESKTOP-XXXX\SQLEXPRESS`. **Ghi lại tên instance này.**

> Bản cài Basic mặc định dùng **Windows Authentication** — không cần mật khẩu,
> đăng nhập bằng chính tài khoản Windows. Đủ dùng cho cả khóa học.

### Bước 2. SSMS (SQL Server Management Studio)

Tải riêng tại <https://aka.ms/ssmsfullsetup>. Đây là công cụ giao diện chính
để viết truy vấn, xem sơ đồ quan hệ, xem execution plan.

> Máy yếu hoặc dùng macOS/Linux: cài **Azure Data Studio** hoặc **DBeaver** thay thế.

### Bước 3. MongoDB Community Server

1. Tải tại <https://www.mongodb.com/try/download/community>.
2. Trong quá trình cài, **tích chọn "Install MongoDB as a Service"** và
   **"Install MongoDB Compass"** (công cụ giao diện chính thức).
3. Cài thêm **mongosh** (MongoDB Shell) tại
   <https://www.mongodb.com/try/download/shell> để gõ lệnh.

Kiểm tra:

```bash
mongosh
# > db.version()
```

---

## Cách 2 — Docker (đồng nhất trên mọi hệ điều hành)

### Bước 1. Cài Docker Desktop
<https://www.docker.com/products/docker-desktop> — đợi biểu tượng cá voi *Running*.

### Bước 2. Khởi động

```bash
cd setup
docker compose up -d
docker compose ps      # cả 3 container phải ở trạng thái Up
```

> **Máy Mac dùng chip Apple Silicon (M1–M4):** image `mssql/server` chỉ có bản
> x86, chạy qua emulation sẽ rất chậm hoặc lỗi. Hãy đổi dòng `image:` trong
> `docker-compose.yml` sang `mcr.microsoft.com/azure-sql-edge:latest` — cú pháp
> T-SQL trong khóa học vẫn chạy bình thường.

### Bước 3. Kết nối

| Dịch vụ | Địa chỉ | Tài khoản |
|---------|---------|-----------|
| SQL Server | `localhost,1433` | `sa` / `Student@123` |
| MongoDB | `mongodb://student:student123@localhost:27017/?authSource=admin` | `student` / `student123` |
| Mongo Express (web) | <http://localhost:8081> | không cần đăng nhập |

Trong SSMS: **Server name** gõ `localhost,1433` (dấu **phẩy**, không phải hai chấm),
**Authentication** chọn `SQL Server Authentication`.

---

## Nạp dữ liệu mẫu BookStore

### Nếu dùng SSMS
Mở `thuc-hanh/00-schema-bookstore.sql` → nhấn **Execute (F5)**.
Sau đó mở `thuc-hanh/01-seed-bookstore.sql` → **Execute**.

### Nếu dùng dòng lệnh (sqlcmd)

> ⚠️ **Bắt buộc có cờ `-f 65001`.** Các file `.sql` được lưu ở mã hóa UTF-8,
> còn sqlcmd mặc định đọc theo bảng mã ANSI của Windows. Thiếu cờ này thì mọi
> chuỗi tiếng Việt — kể cả trong các ràng buộc `CHECK` — sẽ bị hỏng, và script
> sẽ báo lỗi `conflicted with the CHECK constraint` rất khó hiểu.
> Chạy trong SSMS thì không cần, SSMS tự nhận UTF-8.

```bash
# Cài trực tiếp trên Windows
sqlcmd -S localhost -E -f 65001 -i thuc-hanh\00-schema-bookstore.sql
sqlcmd -S localhost -E -f 65001 -i thuc-hanh\01-seed-bookstore.sql

# Chạy bằng Docker
docker exec -i db-lop-mssql /opt/mssql-tools18/bin/sqlcmd \
  -S localhost -U sa -P 'Student@123' -C -f 65001 -i /thuc-hanh/00-schema-bookstore.sql
docker exec -i db-lop-mssql /opt/mssql-tools18/bin/sqlcmd \
  -S localhost -U sa -P 'Student@123' -C -f 65001 -i /thuc-hanh/01-seed-bookstore.sql
```

Kiểm tra:

Script seed tự in bảng đối chiếu ở cuối. Kết quả đúng phải là:

| Bảng | Số dòng |
|------|---------|
| DanhMuc | 8 |
| TacGia | 12 |
| Sach | 20 |
| Sach_TacGia | 21 |
| KhachHang | 15 |
| DonHang | 25 |
| ChiTietDonHang | 47 |
| DanhGia | 22 |

Nếu lệch, chạy lại `00-schema-bookstore.sql` rồi `01-seed-bookstore.sql`.

### Nạp dữ liệu MongoDB

```bash
mongosh "mongodb://student:student123@localhost:27017/?authSource=admin" \
  --file thuc-hanh/mongo-00-seed.js
```

---

## Công cụ khuyến nghị

| Công cụ | Dùng để | Buổi dùng nhiều nhất |
|---------|---------|----------------------|
| **SSMS** | Viết T-SQL, Database Diagram, Execution Plan | 3, 5–8 |
| **MongoDB Compass** | Xem document dạng cây, dựng Aggregation bằng giao diện | 9, 10 |
| **mongosh** | Gõ lệnh MongoDB | 9, 10 |
| **DBeaver** | Thay thế đa nền tảng cho cả hai | mọi buổi |

---

## Xử lý sự cố thường gặp

**SSMS báo `A network-related or instance-specific error occurred`**
Sai tên server. Mở **SQL Server Configuration Manager** → *SQL Server Services*
→ đảm bảo `SQL Server (MSSQLSERVER)` đang **Running**. Thử tên server là
`localhost`, `.` , hoặc `.\SQLEXPRESS`.

**Docker: `Login failed for user 'sa'`**
Mật khẩu không đạt yêu cầu độ phức tạp nên container không khởi tạo được.
Xem log bằng `docker compose logs mssql`, sửa `MSSQL_SA_PASSWORD`, rồi
`docker compose down -v && docker compose up -d`.

**Docker: container mssql khởi động rồi tắt ngay**
Thường do thiếu RAM. SQL Server cần tối thiểu 2 GB. Vào Docker Desktop →
Settings → Resources → tăng Memory lên ≥ 4 GB.

**sqlcmd báo lỗi certificate**
Thêm cờ `-C` (trust server certificate) như trong ví dụ trên.

**Tiếng Việt hiển thị thành `?????` trong SQL Server**
Cột đang dùng kiểu `VARCHAR`. Phải dùng **`NVARCHAR`** và thêm tiền tố `N`
trước chuỗi: `INSERT INTO Sach(TenSach) VALUES (N'Nhà giả kim');`
Đây là lỗi kinh điển — sẽ nhắc lại kỹ ở buổi 5.

**MongoDB báo `Authentication failed`**
Thiếu `?authSource=admin` trong chuỗi kết nối.
