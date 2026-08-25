package com.learn.playground.m10core;

import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Module 10 + 06 — vì sao bean singleton KHÔNG được có state thay đổi được.
 *
 * Bean này là singleton: MỘT object dùng chung cho MỌI request.
 * Hai field dưới đây bị nhiều thread ghi đồng thời -> dữ liệu sai khi tải cao.
 * Bug loại này không bao giờ xuất hiện lúc bạn tự bấm thử trên trình duyệt.
 */
@Service
public class CounterService {

    // ❌ state thay đổi được trong bean singleton
    private int unsafeCounter = 0;
    private final List<String> unsafeList = new ArrayList<>();

    // ✅ cách đúng nếu buộc phải giữ state
    private final AtomicInteger safeCounter = new AtomicInteger();

    public void incrementUnsafe() {
        unsafeCounter++;                 // đọc - cộng - ghi: KHÔNG nguyên tử
        unsafeList.add("x");             // ArrayList không an toàn đa luồng
    }

    public void incrementSafe() { safeCounter.incrementAndGet(); }

    public int getUnsafeCounter() { return unsafeCounter; }
    public int getUnsafeListSize() { return unsafeList.size(); }
    public int getSafeCounter() { return safeCounter.get(); }

    public void reset() {
        unsafeCounter = 0;
        unsafeList.clear();
        safeCounter.set(0);
    }
}
