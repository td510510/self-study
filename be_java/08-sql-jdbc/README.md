# Module 08 — Cơ sở dữ liệu: SQL, thiết kế bảng & JDBC

> Mục tiêu: viết được SQL thành thạo, thiết kế bảng đúng chuẩn, hiểu index & transaction, và kết nối DB từ Java bằng JDBC.
> Thời lượng: 2 tuần. **Đây là module quyết định bạn có phải backend developer thật hay không.**

Nhắc lại từ Module 07: ~80% API chậm là do database. Học kỹ phần này còn quan trọng hơn học Spring.

---

## 1. Cài đặt PostgreSQL

**Cách 1 — Docker (khuyến nghị, sạch sẽ):**
```bash
docker run --name pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=learndb -p 5432:5432 -d postgres:16
docker exec -it pg psql -U postgres -d learndb
```

**Cách 2 — Cài trực tiếp**: https://www.postgresql.org/download/windows/

**Công cụ GUI**: [DBeaver](https://dbeaver.io/) (miễn phí, hỗ trợ mọi DB) hoặc pgAdmin.

Lệnh psql cần biết: `\l` (liệt kê DB), `\c learndb` (chuyển DB), `\dt` (liệt kê bảng), `\d users` (mô tả bảng), `\q` (thoát).

## 2. Thiết kế bảng

```sql
CREATE TABLE users (
    id          BIGSERIAL PRIMARY KEY,
    email       VARCHAR(255) NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL,
    full_name   VARCHAR(100) NOT NULL,
    age         INT CHECK (age >= 0 AND age <= 150),
    status      VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ
);

CREATE TABLE orders (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    total       NUMERIC(15,2) NOT NULL,
    status      VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Kiểu dữ liệu — chọn cho đúng

| Nhu cầu | PostgreSQL | Java |
|---|---|---|
| Khóa chính tự tăng | `BIGSERIAL` / `IDENTITY` | `Long` |
| Chuỗi ngắn | `VARCHAR(n)` | `String` |
| Chuỗi dài | `TEXT` | `String` |
| **Tiền** | `NUMERIC(15,2)` | `BigDecimal` |
| Số nguyên | `INT` / `BIGINT` | `Integer` / `Long` |
| Đúng/sai | `BOOLEAN` | `Boolean` |
| Thời điểm | `TIMESTAMPTZ` | `Instant` / `OffsetDateTime` |
| Ngày | `DATE` | `LocalDate` |
| JSON | `JSONB` | `String` / object |
| Mã định danh | `UUID` | `UUID` |

> **Không bao giờ** dùng `FLOAT`/`DOUBLE` cho tiền — dùng `NUMERIC`. Cùng lý do như `BigDecimal` ở Module 01.

### Ràng buộc (constraint)
`PRIMARY KEY`, `FOREIGN KEY`, `UNIQUE`, `NOT NULL`, `CHECK`, `DEFAULT`.
Hãy để **database** giữ ràng buộc, đừng chỉ dựa vào code Java: nhiều instance ứng dụng cùng ghi, chỉ DB mới đảm bảo được tính toàn vẹn.

### Chuẩn hóa (normalization) — mức cần biết
- **1NF**: mỗi ô một giá trị (không nhét `"1,2,3"` vào một cột).
- **2NF**: mọi cột phụ thuộc **toàn bộ** khóa chính.
- **3NF**: không có cột phụ thuộc vào cột không phải khóa.

Thực tế: chuẩn hóa tới 3NF, rồi **cố ý phi chuẩn hóa** vài chỗ khi cần tốc độ đọc (ví dụ lưu sẵn `total` của đơn hàng thay vì tính lại mỗi lần).

### Quan hệ
```sql
-- 1-n: một user có nhiều order -> khóa ngoại ở bảng "nhiều"
orders.user_id -> users.id

-- n-n: cần bảng trung gian
CREATE TABLE order_items (
    order_id   BIGINT NOT NULL REFERENCES orders(id),
    product_id BIGINT NOT NULL REFERENCES products(id),
    qty        INT NOT NULL,
    price      NUMERIC(15,2) NOT NULL,
    PRIMARY KEY (order_id, product_id)
);
```

## 3. SQL — những câu phải viết được không cần tra

```sql
-- CRUD
INSERT INTO users (email, password, full_name) VALUES ('a@b.com', 'hash', 'An') RETURNING id;
SELECT id, email FROM users WHERE status = 'ACTIVE' ORDER BY created_at DESC LIMIT 20 OFFSET 0;
UPDATE users SET full_name = 'An Nguyen', updated_at = NOW() WHERE id = 1;
DELETE FROM users WHERE id = 1;

-- WHERE
WHERE age BETWEEN 18 AND 65
WHERE email LIKE '%@gmail.com'
WHERE status IN ('ACTIVE', 'PENDING')
WHERE deleted_at IS NULL
WHERE LOWER(full_name) LIKE LOWER('%an%')

-- Gom nhóm
SELECT status, COUNT(*) AS so_don, SUM(total) AS doanh_thu, AVG(total) AS trung_binh
FROM orders
WHERE created_at >= '2026-01-01'
GROUP BY status
HAVING COUNT(*) > 5
ORDER BY doanh_thu DESC;
```
> `WHERE` lọc **trước** khi gom nhóm, `HAVING` lọc **sau** khi gom nhóm.

### JOIN — phải thuộc

```sql
-- INNER JOIN: chỉ lấy bản ghi khớp cả hai bên
SELECT u.full_name, o.id, o.total
FROM users u
JOIN orders o ON o.user_id = u.id;

-- LEFT JOIN: giữ hết bên trái, bên phải thiếu thì NULL
SELECT u.full_name, COUNT(o.id) AS so_don
FROM users u
LEFT JOIN orders o ON o.user_id = u.id
GROUP BY u.id, u.full_name;

-- Tìm user CHƯA có đơn nào
SELECT u.* FROM users u
LEFT JOIN orders o ON o.user_id = u.id
WHERE o.id IS NULL;
```
```
INNER JOIN      LEFT JOIN       Bên trái không khớp
  A ∩ B          A + (A∩B)         A - B
```

### Subquery & CTE
```sql
-- Subquery
SELECT * FROM users
WHERE id IN (SELECT user_id FROM orders WHERE total > 1000000);

-- CTE — dễ đọc hơn nhiều khi query phức tạp
WITH doanh_thu AS (
    SELECT user_id, SUM(total) AS tong
    FROM orders WHERE status = 'PAID'
    GROUP BY user_id
)
SELECT u.full_name, d.tong
FROM users u JOIN doanh_thu d ON d.user_id = u.id
WHERE d.tong > 5000000
ORDER BY d.tong DESC;
```

### Window function (rất hay dùng cho báo cáo)
```sql
SELECT full_name, total,
       RANK() OVER (ORDER BY total DESC)                       AS xep_hang,
       SUM(total) OVER (PARTITION BY user_id)                  AS tong_theo_user,
       LAG(total) OVER (PARTITION BY user_id ORDER BY created_at) AS don_truoc
FROM orders JOIN users ON users.id = orders.user_id;

-- Đơn hàng mới nhất của mỗi user
SELECT * FROM (
    SELECT o.*, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) rn
    FROM orders o
) t WHERE rn = 1;
```

## 4. Index — chìa khóa của tốc độ

Index giống mục lục sách: thay vì đọc cả triệu dòng, DB tra thẳng.

```sql
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status_created ON orders(status, created_at DESC);  -- index tổ hợp
CREATE UNIQUE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_name_lower ON users(LOWER(full_name));               -- index biểu thức
```

**Nên đánh index cho**: cột khóa ngoại, cột hay dùng trong `WHERE`, cột dùng để `ORDER BY`, cột `UNIQUE`.

**Không nên**: bảng quá nhỏ; cột ít giá trị khác nhau (như `gender`); bảng ghi rất nhiều mà đọc ít (index làm `INSERT`/`UPDATE` chậm hơn).

**Index tổ hợp có thứ tự quan trọng**: index `(status, created_at)` dùng được cho `WHERE status = ?` và `WHERE status = ? ORDER BY created_at`, nhưng **không** dùng được cho `WHERE created_at = ?` (quy tắc "tiền tố trái").

**Index bị vô hiệu khi**:
```sql
WHERE LOWER(email) = 'a@b.com'     -- ❌ trừ khi có index trên LOWER(email)
WHERE email LIKE '%abc'            -- ❌ ký tự đại diện ở đầu
WHERE age + 1 = 20                 -- ❌ tính toán trên cột
```

### EXPLAIN — công cụ số 1 để tối ưu query
```sql
EXPLAIN ANALYZE
SELECT * FROM orders WHERE user_id = 5;
```
Đọc kết quả:
- `Seq Scan` = quét toàn bảng → **thường là dấu hiệu thiếu index**.
- `Index Scan` / `Bitmap Index Scan` = đang dùng index ✅.
- `rows=` số dòng ước lượng, `actual time=` thời gian thật.

## 5. Transaction

```sql
BEGIN;
UPDATE accounts SET balance = balance - 1000 WHERE id = 1;
UPDATE accounts SET balance = balance + 1000 WHERE id = 2;
COMMIT;     -- hoặc ROLLBACK nếu có lỗi
```

**ACID**:
- **A**tomicity: toàn bộ hoặc không gì cả.
- **C**onsistency: dữ liệu luôn thỏa ràng buộc.
- **I**solation: các transaction không giẫm lên nhau.
- **D**urability: đã commit là còn mãi, kể cả mất điện.

### Mức cô lập (isolation level)

| Mức | Dirty read | Non-repeatable read | Phantom read |
|---|:--:|:--:|:--:|
| READ UNCOMMITTED | có | có | có |
| **READ COMMITTED** (mặc định Postgres) | không | có | có |
| REPEATABLE READ | không | không | có* |
| SERIALIZABLE | không | không | không |

Thực tế: giữ `READ COMMITTED`, và xử lý tranh chấp bằng khóa lạc quan (`version`) hoặc `SELECT ... FOR UPDATE` khi cần.

```sql
-- Khóa bi quan: khóa dòng tới khi commit (dùng cho trừ tồn kho)
SELECT * FROM products WHERE id = 1 FOR UPDATE;
```

**Deadlock ở DB** cũng có thật — cách phòng giống Java: luôn cập nhật các bảng/dòng theo cùng một thứ tự.

## 6. JDBC — Java nói chuyện với DB

JDBC là API chuẩn. Bạn sẽ dùng JPA/Hibernate sau, nhưng **phải hiểu JDBC trước** để biết framework làm gì bên dưới.

```java
String url = "jdbc:postgresql://localhost:5432/learndb";
try (Connection conn = DriverManager.getConnection(url, "postgres", "postgres")) {

    // ✅ LUÔN dùng PreparedStatement
    String sql = "SELECT id, email, full_name FROM users WHERE status = ? AND age > ?";
    try (PreparedStatement ps = conn.prepareStatement(sql)) {
        ps.setString(1, "ACTIVE");
        ps.setInt(2, 18);
        try (ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                Long id = rs.getLong("id");
                String email = rs.getString("email");
            }
        }
    }
}
```

### SQL Injection — lỗi bảo mật số 1
```java
// ❌ CHẾT NGƯỜI
String sql = "SELECT * FROM users WHERE email = '" + email + "'";
// Kẻ tấn công nhập:  ' OR '1'='1' --      -> lấy được toàn bộ user
// Hoặc:              '; DROP TABLE users; --

// ✅ PreparedStatement tách dữ liệu khỏi câu lệnh — driver không bao giờ coi input là SQL
PreparedStatement ps = conn.prepareStatement("SELECT * FROM users WHERE email = ?");
ps.setString(1, email);
```
Quy tắc tuyệt đối: **không bao giờ nối chuỗi để dựng SQL từ dữ liệu người dùng.**

### Transaction trong JDBC
```java
conn.setAutoCommit(false);
try {
    // nhiều lệnh...
    conn.commit();
} catch (SQLException e) {
    conn.rollback();
    throw e;
} finally {
    conn.setAutoCommit(true);
}
```

### Batch — insert hàng loạt
```java
try (PreparedStatement ps = conn.prepareStatement("INSERT INTO users(email, full_name) VALUES (?, ?)")) {
    for (User u : users) {
        ps.setString(1, u.email());
        ps.setString(2, u.name());
        ps.addBatch();
        if (++count % 1000 == 0) ps.executeBatch();
    }
    ps.executeBatch();
}
```
Chèn 10.000 dòng: từng dòng một mất ~30s, batch chỉ mất ~1s.

### Connection Pool
Mở một kết nối DB tốn ~50–100ms. Ứng dụng thật **luôn** dùng pool (HikariCP — mặc định của Spring Boot):
```java
HikariConfig config = new HikariConfig();
config.setJdbcUrl(url);
config.setUsername("postgres");
config.setPassword("postgres");
config.setMaximumPoolSize(10);
DataSource ds = new HikariDataSource(config);
```
Kích thước pool hợp lý thường nhỏ hơn nhiều so với trực giác: `số nhân CPU × 2 + số đĩa` là điểm khởi đầu tốt. Pool 100 kết nối thường làm hệ thống **chậm hơn**.

## 7. Mẫu Repository (chuẩn bị cho Dự án 1 & Spring)

```java
public interface UserRepository {
    User save(User user);
    Optional<User> findById(Long id);
    List<User> findAll(int page, int size);
    void deleteById(Long id);
}

public class JdbcUserRepository implements UserRepository {
    private final DataSource ds;
    public JdbcUserRepository(DataSource ds) { this.ds = ds; }

    @Override
    public Optional<User> findById(Long id) {
        String sql = "SELECT id, email, full_name FROM users WHERE id = ?";
        try (Connection c = ds.getConnection();
             PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setLong(1, id);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() ? Optional.of(map(rs)) : Optional.empty();
            }
        } catch (SQLException e) {
            throw new DataAccessException("Không đọc được user " + id, e);
        }
    }
    private User map(ResultSet rs) throws SQLException {
        return new User(rs.getLong("id"), rs.getString("email"), rs.getString("full_name"));
    }
}
```
Nhìn kỹ đoạn này: Spring Data JPA sẽ **sinh tự động** toàn bộ phần lặp lại ở trên cho bạn (Module 12).

---

## Tổng kết
- Thiết kế bảng: đúng kiểu dữ liệu, đủ ràng buộc, chuẩn hóa 3NF.
- JOIN, GROUP BY, CTE, window function — luyện tới mức viết không cần tra.
- Index quyết định tốc độ; dùng `EXPLAIN ANALYZE` để kiểm chứng.
- Transaction + isolation level; khóa lạc quan/bi quan.
- JDBC: `PreparedStatement` (chống SQL Injection), try-with-resources, batch, connection pool.

## Code & tài nguyên trong module
- [sql/01-schema.sql](sql/01-schema.sql) — tạo bảng đầy đủ ràng buộc & index
- [sql/02-seed.sql](sql/02-seed.sql) — dữ liệu mẫu
- [sql/03-queries.sql](sql/03-queries.sql) — 30 câu truy vấn từ dễ tới khó, có lời giải
- [src/jdbc/JdbcDemo.java](src/jdbc/JdbcDemo.java) — CRUD, transaction, batch, SQL injection

👉 Làm [bai-tap.md](bai-tap.md) rồi sang [Module 09 — Maven, Git & Testing](../09-maven-git-testing/).
