package oop;

import java.util.ArrayList;
import java.util.List;

/**
 * Đóng gói (encapsulation): field private, mọi thay đổi đi qua method có validate.
 * Tiền dùng long (đơn vị: đồng) — KHÔNG dùng double.
 */
public class BankAccount {

    private final String owner;
    private long balance;
    private final List<String> history = new ArrayList<>();

    public BankAccount(String owner, long initialBalance) {
        if (owner == null || owner.isBlank()) {
            throw new IllegalArgumentException("Tên chủ tài khoản không được rỗng");
        }
        if (initialBalance < 0) {
            throw new IllegalArgumentException("Số dư ban đầu không được âm");
        }
        this.owner = owner;
        this.balance = initialBalance;
        history.add("Mở tài khoản với " + initialBalance);
    }

    public void deposit(long amount) {
        requirePositive(amount);
        balance += amount;
        history.add("Nạp " + amount + ", số dư " + balance);
    }

    public void withdraw(long amount) {
        requirePositive(amount);
        if (amount > balance) {
            throw new IllegalStateException("Không đủ số dư: cần " + amount + ", có " + balance);
        }
        balance -= amount;
        history.add("Rút " + amount + ", số dư " + balance);
    }

    private static void requirePositive(long amount) {
        if (amount <= 0) throw new IllegalArgumentException("Số tiền phải > 0");
    }

    public long getBalance() { return balance; }

    public String getOwner() { return owner; }

    /** Trả bản sao — không cho bên ngoài sửa danh sách bên trong. */
    public List<String> getHistory() { return List.copyOf(history); }

    @Override
    public String toString() { return "BankAccount{" + owner + ", balance=" + balance + "}"; }

    public static void main(String[] args) {
        BankAccount acc = new BankAccount("Thinh", 1_000_000);
        acc.deposit(500_000);
        acc.withdraw(200_000);
        System.out.println(acc);

        try {
            acc.withdraw(10_000_000);
        } catch (IllegalStateException e) {
            System.out.println("Bị chặn: " + e.getMessage());
        }

        try {
            acc.getHistory().add("hack");   // danh sách trả về là bất biến
        } catch (UnsupportedOperationException e) {
            System.out.println("Không sửa được lịch sử từ bên ngoài ✅");
        }

        acc.getHistory().forEach(System.out::println);
    }
}
