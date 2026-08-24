package com.learn.demo;

/** Class thuần logic — hợp để tập viết test và tập TDD. */
public class Calculator {

    public int add(int a, int b) { return a + b; }

    public int divide(int a, int b) {
        if (b == 0) throw new ArithmeticException("Không thể chia cho 0");
        return a / b;
    }

    public boolean isPrime(int n) {
        if (n < 2) return false;
        for (int i = 2; (long) i * i <= n; i++) {
            if (n % i == 0) return false;
        }
        return true;
    }

    public long factorial(int n) {
        if (n < 0) throw new IllegalArgumentException("n phải >= 0");
        if (n > 20) throw new IllegalArgumentException("n > 20 sẽ tràn long");
        long r = 1;
        for (int i = 2; i <= n; i++) r *= i;
        return r;
    }
}
