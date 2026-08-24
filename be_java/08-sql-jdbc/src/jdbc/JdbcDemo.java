package jdbc;

import java.math.BigDecimal;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * JDBC đầy đủ: CRUD, PreparedStatement, transaction, batch, SQL injection.
 *
 * Chuẩn bị:
 *   docker run --name pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=learndb -p 5432:5432 -d postgres:16
 *   psql -U postgres -d learndb -f 08-sql-jdbc/sql/01-schema.sql
 *   psql -U postgres -d learndb -f 08-sql-jdbc/sql/02-seed.sql
 *
 * Chạy (cần driver postgresql jar):
 *   java -cp "out:postgresql-42.7.3.jar" jdbc.JdbcDemo
 */
public class JdbcDemo {

    static final String URL = System.getenv().getOrDefault("DB_URL", "jdbc:postgresql://localhost:5432/learndb");
    static final String USER = System.getenv().getOrDefault("DB_USER", "postgres");
    static final String PASS = System.getenv().getOrDefault("DB_PASS", "postgres");

    record User(Long id, String email, String fullName, String city) { }

    public static void main(String[] args) {
        try (Connection conn = DriverManager.getConnection(URL, USER, PASS)) {
            System.out.println("Đã kết nối: " + conn.getMetaData().getDatabaseProductName()
                    + " " + conn.getMetaData().getDatabaseProductVersion());

            docDuLieu(conn);
            themVaLayId(conn);
            capNhatVaXoa(conn);
            transaction(conn);
            batchInsert(conn);
            sqlInjection(conn);
            phanTrang(conn);

        } catch (SQLException e) {
            System.err.println("Lỗi kết nối DB: " + e.getMessage());
            System.err.println("""
                    Kiểm tra:
                      1. PostgreSQL đã chạy chưa? (docker ps)
                      2. Đã tạo bảng và nạp dữ liệu chưa? (01-schema.sql, 02-seed.sql)
                      3. Đã có driver postgresql trong classpath chưa?""");
        }
    }

    // ------------------------------------------------------------ SELECT
    static void docDuLieu(Connection conn) throws SQLException {
        System.out.println("\n--- SELECT với PreparedStatement ---");
        String sql = """
                SELECT id, email, full_name, city
                FROM users
                WHERE status = ? AND (age IS NULL OR age >= ?)
                ORDER BY id""";

        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, "ACTIVE");
            ps.setInt(2, 18);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    User u = map(rs);
                    System.out.printf("  %d | %-20s | %-18s | %s%n",
                            u.id(), u.email(), u.fullName(), u.city() == null ? "-" : u.city());
                }
            }
        }
    }

    static User map(ResultSet rs) throws SQLException {
        return new User(rs.getLong("id"), rs.getString("email"),
                rs.getString("full_name"), rs.getString("city"));
    }

    // ------------------------------------------------------------ INSERT
    static void themVaLayId(Connection conn) throws SQLException {
        System.out.println("\n--- INSERT và lấy id sinh ra ---");
        String sql = "INSERT INTO users (email, password, full_name, age, city) VALUES (?,?,?,?,?)";

        try (PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            ps.setString(1, "test-" + System.currentTimeMillis() + "@example.com");
            ps.setString(2, "hashed");
            ps.setString(3, "Người Dùng Mới");
            ps.setInt(4, 28);
            ps.setString(5, "Cần Thơ");
            ps.executeUpdate();

            try (ResultSet keys = ps.getGeneratedKeys()) {
                if (keys.next()) System.out.println("  Id vừa tạo: " + keys.getLong(1));
            }
        }
    }

    // ------------------------------------------------------ UPDATE/DELETE
    static void capNhatVaXoa(Connection conn) throws SQLException {
        System.out.println("\n--- UPDATE / DELETE ---");

        try (PreparedStatement ps = conn.prepareStatement(
                "UPDATE users SET city = ? WHERE city IS NULL")) {
            ps.setString(1, "Chưa rõ");
            System.out.println("  Số dòng UPDATE: " + ps.executeUpdate());
        }

        try (PreparedStatement ps = conn.prepareStatement(
                "DELETE FROM users WHERE email LIKE 'test-%@example.com'")) {
            System.out.println("  Số dòng DELETE: " + ps.executeUpdate());
        }
    }

    // ------------------------------------------------------- TRANSACTION
    static void transaction(Connection conn) throws SQLException {
        System.out.println("\n--- Transaction: chuyển tiền kiểu ngân hàng ---");
        conn.setAutoCommit(false);
        try {
            // Trừ tồn kho sản phẩm 5, tạo đơn hàng — hai việc phải cùng thành công
            try (PreparedStatement ps = conn.prepareStatement(
                    "UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?")) {
                ps.setInt(1, 2); ps.setLong(2, 5); ps.setInt(3, 2);
                if (ps.executeUpdate() == 0) throw new SQLException("Không đủ tồn kho");
            }

            long orderId;
            try (PreparedStatement ps = conn.prepareStatement(
                    "INSERT INTO orders (user_id, total, status) VALUES (?,?,?)",
                    Statement.RETURN_GENERATED_KEYS)) {
                ps.setLong(1, 1);
                ps.setBigDecimal(2, new BigDecimal("900000"));
                ps.setString(3, "PENDING");
                ps.executeUpdate();
                try (ResultSet k = ps.getGeneratedKeys()) { k.next(); orderId = k.getLong(1); }
            }

            conn.commit();
            System.out.println("  COMMIT thành công, đơn hàng #" + orderId);

            // Minh họa ROLLBACK
            conn.setAutoCommit(false);
            try (PreparedStatement ps = conn.prepareStatement("DELETE FROM orders WHERE id = ?")) {
                ps.setLong(1, orderId);
                ps.executeUpdate();
                throw new SQLException("Giả lập lỗi giữa chừng");
            } catch (SQLException e) {
                conn.rollback();
                System.out.println("  ROLLBACK: " + e.getMessage() + " -> đơn hàng vẫn còn");
            }

        } catch (SQLException e) {
            conn.rollback();
            System.out.println("  Đã rollback: " + e.getMessage());
        } finally {
            conn.setAutoCommit(true);
        }
    }

    // ------------------------------------------------------------- BATCH
    static void batchInsert(Connection conn) throws SQLException {
        System.out.println("\n--- Batch insert: 1000 dòng ---");
        conn.setAutoCommit(false);

        long t = System.currentTimeMillis();
        try (PreparedStatement ps = conn.prepareStatement(
                "INSERT INTO users (email, password, full_name) VALUES (?,?,?)")) {
            for (int i = 0; i < 1000; i++) {
                ps.setString(1, "batch-" + i + "-" + System.nanoTime() + "@example.com");
                ps.setString(2, "hash");
                ps.setString(3, "Batch User " + i);
                ps.addBatch();
                if (i % 200 == 0) ps.executeBatch();
            }
            ps.executeBatch();
            conn.commit();
        } catch (SQLException e) {
            conn.rollback();
            throw e;
        } finally {
            conn.setAutoCommit(true);
        }
        System.out.println("  Batch xong trong " + (System.currentTimeMillis() - t) + "ms");

        try (PreparedStatement ps = conn.prepareStatement("DELETE FROM users WHERE email LIKE 'batch-%'")) {
            System.out.println("  Đã dọn " + ps.executeUpdate() + " dòng test");
        }
    }

    // ----------------------------------------------------- SQL INJECTION
    static void sqlInjection(Connection conn) throws SQLException {
        System.out.println("\n--- SQL Injection ---");
        String inputDocHai = "' OR '1'='1";

        // ❌ Nối chuỗi: câu lệnh bị biến dạng, trả về TOÀN BỘ user
        String sqlXau = "SELECT COUNT(*) FROM users WHERE email = '" + inputDocHai + "'";
        try (Statement st = conn.createStatement(); ResultSet rs = st.executeQuery(sqlXau)) {
            rs.next();
            System.out.println("  Nối chuỗi        -> trả về " + rs.getInt(1) + " user  ❌ LỘ TOÀN BỘ DỮ LIỆU");
        }

        // ✅ PreparedStatement: input được coi là DỮ LIỆU, không phải SQL
        try (PreparedStatement ps = conn.prepareStatement("SELECT COUNT(*) FROM users WHERE email = ?")) {
            ps.setString(1, inputDocHai);
            try (ResultSet rs = ps.executeQuery()) {
                rs.next();
                System.out.println("  PreparedStatement -> trả về " + rs.getInt(1) + " user  ✅ AN TOÀN");
            }
        }
    }

    // ---------------------------------------------------------- PHÂN TRANG
    static void phanTrang(Connection conn) throws SQLException {
        System.out.println("\n--- Phân trang + đếm tổng ---");
        int page = 0, size = 3;

        long total;
        try (PreparedStatement ps = conn.prepareStatement("SELECT COUNT(*) FROM users");
             ResultSet rs = ps.executeQuery()) {
            rs.next(); total = rs.getLong(1);
        }

        List<User> items = new ArrayList<>();
        try (PreparedStatement ps = conn.prepareStatement(
                "SELECT id, email, full_name, city FROM users ORDER BY id LIMIT ? OFFSET ?")) {
            ps.setInt(1, size);
            ps.setInt(2, page * size);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) items.add(map(rs));
            }
        }

        System.out.printf("  Trang %d/%d, tổng %d bản ghi:%n",
                page + 1, (total + size - 1) / size, total);
        items.forEach(u -> System.out.println("    " + u.id() + " - " + u.fullName()));
    }

    /** Mẫu repository: cách viết bạn sẽ dùng lại ở Dự án 1. */
    static Optional<User> findById(Connection conn, Long id) throws SQLException {
        try (PreparedStatement ps = conn.prepareStatement(
                "SELECT id, email, full_name, city FROM users WHERE id = ?")) {
            ps.setLong(1, id);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() ? Optional.of(map(rs)) : Optional.empty();
            }
        }
    }
}
