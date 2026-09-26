package patterns;

import java.util.List;

/**
 * Tái cấu trúc một hàm "if/else" thật thường gặp: tính giá cuối cùng của đơn hàng.
 * So sánh TRƯỚC và SAU, và kiểm chứng hai phiên bản cho cùng kết quả.
 */
public class RefactoringDemo {

    record Cart(String customerType, long subtotal, String voucher, String paymentMethod) { }

    // ============================================================ TRƯỚC

    /**
     * Vấn đề:
     *  - Mọi luật trộn trong một hàm, thêm hạng khách hàng / voucher / phương thức thanh toán là phải sửa hàm này.
     *  - Không test riêng được từng luật.
     *  - Magic string khắp nơi.
     */
    static long priceBefore(Cart cart) {
        long price = cart.subtotal();
        if (cart.customerType().equals("VIP")) {
            price = price * 90 / 100;
        } else if (cart.customerType().equals("GOLD")) {
            price = price * 95 / 100;
        }
        if (cart.voucher() != null) {
            if (cart.voucher().equals("FREESHIP")) {
                // không giảm giá hàng, chỉ miễn ship ở dưới
            } else if (cart.voucher().equals("GIAM50K")) {
                if (price >= 500_000) price -= 50_000;
            } else if (cart.voucher().startsWith("PCT")) {
                int pct = Integer.parseInt(cart.voucher().substring(3));
                price = price * (100 - pct) / 100;
            }
        }
        long shipping = price >= 1_000_000 ? 0 : 30_000;
        if ("FREESHIP".equals(cart.voucher())) shipping = 0;
        price += shipping;
        if (cart.paymentMethod().equals("COD")) {
            price += 10_000;
        } else if (cart.paymentMethod().equals("CARD")) {
            price += price * 2 / 100;
        }
        return price;
    }

    // ============================================================ SAU

    /** Mỗi bước là một luật nhỏ, test riêng được. Pipeline = Chain of Responsibility đơn giản. */
    record PriceContext(Cart cart, long goods, long shipping, long fee) {
        long total() { return goods + shipping + fee; }
        PriceContext withGoods(long g) { return new PriceContext(cart, g, shipping, fee); }
        PriceContext withShipping(long s) { return new PriceContext(cart, goods, s, fee); }
        PriceContext withFee(long f) { return new PriceContext(cart, goods, shipping, f); }
    }

    @FunctionalInterface
    interface PricingRule {
        PriceContext apply(PriceContext ctx);
    }

    enum CustomerTier {
        REGULAR(100), GOLD(95), VIP(90);

        final int percentToPay;

        CustomerTier(int percentToPay) { this.percentToPay = percentToPay; }
    }

    enum PaymentMethod {
        BANK_TRANSFER { long fee(long amount) { return 0; } },
        COD { long fee(long amount) { return 10_000; } },
        CARD { long fee(long amount) { return amount * 2 / 100; } };

        abstract long fee(long amount);          // mỗi hằng enum tự mang strategy của mình
    }

    static final PricingRule TIER_DISCOUNT = ctx ->
            ctx.withGoods(ctx.goods() * CustomerTier.valueOf(ctx.cart().customerType()).percentToPay / 100);

    static final PricingRule VOUCHER = ctx -> {
        String v = ctx.cart().voucher();
        if (v == null || v.equals("FREESHIP")) return ctx;
        if (v.equals("GIAM50K")) return ctx.goods() >= 500_000 ? ctx.withGoods(ctx.goods() - 50_000) : ctx;
        if (v.startsWith("PCT")) return ctx.withGoods(ctx.goods() * (100 - Integer.parseInt(v.substring(3))) / 100);
        throw new IllegalArgumentException("Voucher không hợp lệ: " + v);
    };

    static final PricingRule SHIPPING = ctx -> {
        boolean free = ctx.goods() >= 1_000_000 || "FREESHIP".equals(ctx.cart().voucher());
        return ctx.withShipping(free ? 0 : 30_000);
    };

    static final PricingRule PAYMENT_FEE = ctx -> {
        long beforeFee = ctx.goods() + ctx.shipping();
        return ctx.withFee(PaymentMethod.valueOf(ctx.cart().paymentMethod()).fee(beforeFee));
    };

    /** Thứ tự luật được khai báo một chỗ, thêm luật mới = thêm một phần tử. */
    static final List<PricingRule> PIPELINE = List.of(TIER_DISCOUNT, VOUCHER, SHIPPING, PAYMENT_FEE);

    static long priceAfter(Cart cart) {
        PriceContext ctx = new PriceContext(cart, cart.subtotal(), 0, 0);
        for (PricingRule rule : PIPELINE) ctx = rule.apply(ctx);
        return ctx.total();
    }

    public static void main(String[] args) {
        List<Cart> carts = List.of(
                new Cart("REGULAR", 300_000, null, "COD"),
                new Cart("VIP", 2_000_000, "GIAM50K", "CARD"),
                new Cart("GOLD", 800_000, "FREESHIP", "BANK_TRANSFER"),
                new Cart("VIP", 1_200_000, "PCT20", "COD"),
                new Cart("REGULAR", 400_000, "GIAM50K", "CARD"));

        System.out.printf("%-8s %12s %-9s %-14s %12s %12s%n", "Hạng", "Tạm tính", "Voucher", "Thanh toán", "Trước", "Sau");
        boolean allMatch = true;
        for (Cart c : carts) {
            long before = priceBefore(c);
            long after = priceAfter(c);
            allMatch &= before == after;
            System.out.printf("%-8s %,12d %-9s %-14s %,12d %,12d%n",
                    c.customerType(), c.subtotal(), c.voucher(), c.paymentMethod(), before, after);
        }
        System.out.println(allMatch
                ? "\n✓ Hai phiên bản cho kết quả giống hệt nhau — tái cấu trúc an toàn."
                : "\n✗ Kết quả lệch — tái cấu trúc đã làm thay đổi hành vi!");
        System.out.println("Bài học: TRƯỚC khi refactor phải có test chốt hành vi cũ (ở đây là vòng lặp so sánh trên).");
    }
}
