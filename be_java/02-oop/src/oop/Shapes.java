package oop;

import java.util.List;

/**
 * Đa hình + sealed interface + record + pattern matching cho switch (Java 21).
 */
public class Shapes {

    // sealed: chỉ 3 kiểu hình này được phép implement -> switch không cần default
    public sealed interface Shape permits Circle, Rectangle, Triangle {
        double area();
        default String describe() {
            return getClass().getSimpleName() + " có diện tích " + String.format("%.2f", area());
        }
    }

    public record Circle(double radius) implements Shape {
        public Circle {
            if (radius <= 0) throw new IllegalArgumentException("Bán kính phải > 0");
        }
        @Override public double area() { return Math.PI * radius * radius; }
    }

    public record Rectangle(double width, double height) implements Shape {
        @Override public double area() { return width * height; }
        public boolean isSquare() { return width == height; }
    }

    public record Triangle(double base, double height) implements Shape {
        @Override public double area() { return base * height / 2; }
    }

    /** Pattern matching for switch — compiler kiểm tra đã phủ hết các nhánh. */
    static String phanLoai(Shape s) {
        return switch (s) {
            case Circle c when c.radius() > 10 -> "Hình tròn lớn";
            case Circle c -> "Hình tròn bán kính " + c.radius();
            case Rectangle r when r.isSquare() -> "Hình vuông cạnh " + r.width();
            case Rectangle r -> "Hình chữ nhật " + r.width() + "x" + r.height();
            case Triangle t -> "Tam giác đáy " + t.base();
        };
    }

    public static void main(String[] args) {
        List<Shape> shapes = List.of(
                new Circle(3),
                new Circle(12),
                new Rectangle(4, 4),
                new Rectangle(4, 6),
                new Triangle(3, 8));

        // Đa hình: cùng lời gọi area(), mỗi object xử lý theo cách riêng
        for (Shape s : shapes) {
            System.out.printf("%-28s | %s%n", s.describe(), phanLoai(s));
        }

        double total = shapes.stream().mapToDouble(Shape::area).sum();
        System.out.printf("Tổng diện tích: %.2f%n", total);

        // record tự có equals/hashCode/toString
        System.out.println("\nrecord toString : " + new Circle(3));
        System.out.println("record equals   : " + new Circle(3).equals(new Circle(3)));
    }
}
