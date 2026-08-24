package io;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.Period;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;

/** java.time — API ngày giờ hiện đại (Java 8+). Quên Date/Calendar cũ đi. */
public class DateTimeDemo {

    public static void main(String[] args) {
        cacLoai();
        tinhToan();
        dinhDangVaParse();
        muiGio();
        ungDungThucTe();
    }

    static void cacLoai() {
        System.out.println("--- Các kiểu chính ---");
        System.out.println("LocalDate      : " + LocalDate.now()          + "  (chỉ ngày)");
        System.out.println("LocalTime      : " + LocalTime.now()          + "  (chỉ giờ)");
        System.out.println("LocalDateTime  : " + LocalDateTime.now()      + "  (ngày + giờ, không múi giờ)");
        System.out.println("Instant        : " + Instant.now()            + "  (mốc UTC — dùng lưu DB)");
        System.out.println("ZonedDateTime  : " + ZonedDateTime.now(ZoneId.of("Asia/Ho_Chi_Minh")));
    }

    static void tinhToan() {
        System.out.println("\n--- Tính toán ---");
        LocalDate today = LocalDate.of(2026, 8, 24);
        System.out.println("Hôm nay        : " + today);
        System.out.println("+7 ngày        : " + today.plusDays(7));
        System.out.println("-1 tháng       : " + today.minusMonths(1));
        System.out.println("Đầu tháng      : " + today.withDayOfMonth(1));
        System.out.println("Thứ mấy        : " + today.getDayOfWeek());
        System.out.println("Năm nhuận?     : " + today.isLeapYear());

        LocalDate birthday = LocalDate.of(1998, 3, 15);
        Period age = Period.between(birthday, today);
        System.out.printf("Tuổi           : %d năm %d tháng %d ngày%n",
                age.getYears(), age.getMonths(), age.getDays());
        System.out.println("Tổng số ngày   : " + ChronoUnit.DAYS.between(birthday, today));

        LocalDateTime start = LocalDateTime.of(2026, 8, 24, 9, 0);
        LocalDateTime end = LocalDateTime.of(2026, 8, 24, 17, 30);
        Duration d = Duration.between(start, end);
        System.out.println("Thời lượng làm : " + d.toHours() + "h" + d.toMinutesPart() + "m");
    }

    static void dinhDangVaParse() {
        System.out.println("\n--- Format & parse ---");
        LocalDateTime dt = LocalDateTime.of(2026, 8, 24, 14, 30, 5);
        DateTimeFormatter vn = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss");
        DateTimeFormatter iso = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

        System.out.println("Kiểu VN        : " + dt.format(vn));
        System.out.println("Kiểu ISO       : " + dt.format(iso) + "  (dùng cho API/JSON)");

        LocalDateTime parsed = LocalDateTime.parse("24/08/2026 14:30:05", vn);
        System.out.println("Parse lại      : " + parsed);

        try {
            LocalDate.parse("32/13/2026", DateTimeFormatter.ofPattern("dd/MM/yyyy"));
        } catch (java.time.format.DateTimeParseException e) {
            System.out.println("Ngày sai định dạng -> DateTimeParseException");
        }
    }

    static void muiGio() {
        System.out.println("\n--- Múi giờ ---");
        Instant now = Instant.parse("2026-08-24T07:00:00Z");
        System.out.println("UTC lưu trong DB : " + now);
        System.out.println("Hiển thị VN      : " + now.atZone(ZoneId.of("Asia/Ho_Chi_Minh")));
        System.out.println("Hiển thị Tokyo   : " + now.atZone(ZoneId.of("Asia/Tokyo")));
        System.out.println("Hiển thị New York: " + now.atZone(ZoneId.of("America/New_York")));
        System.out.println("=> Quy tắc: lưu UTC, đổi múi giờ khi hiển thị.");
    }

    static void ungDungThucTe() {
        System.out.println("\n--- Ứng dụng thực tế ---");

        // Hạn trả sách của thư viện (dùng ở Dự án 1)
        LocalDate borrowed = LocalDate.of(2026, 8, 1);
        LocalDate due = borrowed.plusDays(14);
        LocalDate returned = LocalDate.of(2026, 8, 20);
        long lateDays = Math.max(0, ChronoUnit.DAYS.between(due, returned));
        long fee = lateDays * 5_000;
        System.out.printf("Mượn %s, hạn %s, trả %s -> trễ %d ngày, phí %,dđ%n",
                borrowed, due, returned, lateDays, fee);

        // Token hết hạn
        Instant issued = Instant.now();
        Instant expiry = issued.plus(15, ChronoUnit.MINUTES);
        System.out.println("Token phát hành  : " + issued);
        System.out.println("Hết hạn lúc      : " + expiry);
        System.out.println("Còn hiệu lực?    : " + Instant.now().isBefore(expiry));

        // Đo thời gian chạy
        long t = System.nanoTime();
        for (int i = 0; i < 1_000_000; i++) { Math.sqrt(i); }
        System.out.printf("Đo hiệu năng     : %.2f ms%n", (System.nanoTime() - t) / 1e6);
    }
}
