# Cheat Sheet — In ra và dán lên tường

## 1. Khung 4 bước (45 phút phỏng vấn)

```
1. LÀM RÕ (5-10')     Functional | Non-functional | Cắt scope rõ ràng
2. ƯỚC LƯỢNG (5')     DAU → QPS ghi → QPS đọc → Storage → Bandwidth
3. THIẾT KẾ (15-20')  API → Data model → Sơ đồ (trái sang phải)
4. ĐÀO SÂU (15-20')   Bottleneck | Nếu X chết? | Hot key | Đánh đổi
```

## 2. Số cần thuộc

```
RAM đọc 1 dòng             100 ns
SSD đọc ngẫu nhiên 4KB     100 µs      (RAM nhanh hơn ~1000 lần)
Round-trip trong DC        0,5 ms
Round-trip VN → SG         ~40 ms
Round-trip VN → US         ~200 ms
Gửi 1MB qua mạng 1Gbps     10 ms

1 ngày                     86.400 s ≈ 10⁵ s
1 triệu/ngày               ≈ 12 QPS
1 tỷ/ngày                  ≈ 12.000 QPS
1 KB × 1 triệu             = 1 GB
```

## 3. Sức chứa một máy (con số an toàn để nói)

| Thành phần | Con số |
|---|---|
| App server Node.js | 1.000–5.000 QPS |
| PostgreSQL (query có index) | 5.000–15.000 QPS đọc |
| Redis | 50.000–200.000 ops/s |
| RAM 1 máy | 64–512 GB |
| Dữ liệu 1 máy chứa nổi | tới ~5 TB (trên đó mới cần shard) |

## 4. SLA → downtime

```
99%      3,65 ngày/năm
99,9%    8,77 giờ/năm    (43 phút/tháng)
99,99%   52,6 phút/năm   (4,3 phút/tháng)
99,999%  5,26 phút/năm
```

## 5. Cây quyết định nhanh

```
Đọc nhiều?          → cache + read replica
Ghi nhiều?          → queue đệm ghi, LSM-tree, sharding
Dữ liệu > 5 TB?     → sharding (không sớm hơn!)
Cần tìm toàn văn?   → inverted index / Elasticsearch (nguồn chân lý VẪN là DB)
Việc chậm/không cần ngay? → message queue
Nhiều team giẫm chân? → tách microservice (chỉ vì lý do này)
Cần dữ liệu gần user? → CDN / multi-region
File nhị phân?      → object storage, KHÔNG bao giờ để trong DB
```

## 6. "Nếu X chết thì sao?"

| Chết | Hậu quả | Giảm nhẹ |
|---|---|---|
| Cache | Tải dồn 10-100× xuống DB | Rate limit + circuit breaker + warm cache |
| DB primary | Không ghi được | Failover có quorum, đọc vẫn chạy từ replica |
| Queue | Task nền dừng | Ghi vào outbox, chức năng chính vẫn sống |
| Service phụ | — | Circuit breaker + fallback tĩnh |
| 1 AZ | Mất 1/3 công suất | Multi-AZ, chừa dư địa |

## 7. Sổ tay resilience

```
Timeout      = p99 × 1,5      (timeout trong PHẢI ngắn hơn timeout ngoài)
Retry        = chỉ với lỗi tạm thời + thao tác idempotent
Backoff      = 50 × 2^lần
Jitter       = Math.random() × backoff        ← BẮT BUỘC, không phải tuỳ chọn
Retry budget = tối đa ~10% tổng request
Circuit      = mở khi lỗi > 50% trên >= 10 mẫu; half-open sau ~30s
Rate limit   = token bucket (mặc định tốt nhất)
Autoscale    = kích hoạt ở 60-70%, KHÔNG phải 90%
```

## 8. Bốn tín hiệu vàng

```
Latency (tách riêng thành công/lỗi) · Traffic · Errors · Saturation
```

## 9. Đảm bảo trong hệ phân tán

```
At-most-once   → có thể MẤT
At-least-once  → có thể TRÙNG   ← dùng cái này + làm consumer idempotent
Exactly-once   → ảo tưởng (Two Generals)

W + R > N      → quorum đọc chắc chắn thấy ghi mới nhất
Đa số          → chống split-brain (cụm luôn SỐ LẺ node)
```

## 10. Rubric chấm mock interview

| Tiêu chí | % | Dấu hiệu tốt |
|---|---|---|
| Làm rõ yêu cầu | 15 | Hỏi trước khi vẽ, cắt scope |
| Ước lượng | 10 | **Rút ra kết luận** từ con số |
| Thiết kế tổng thể | 25 | API → model → sơ đồ, mạch lạc |
| Đào sâu | 25 | Bottleneck, failure, hot key |
| Đánh đổi | 15 | Luôn nói "được X mất Y" |
| Giao tiếp | 10 | Vừa vẽ vừa nói |

**Ba lỗi trượt nhanh nhất**: (1) over-engineer cho 1.000 user · (2) không bao giờ nói nhược điểm ·
(3) im lặng suy nghĩ.

## 11. Mười hai điều mang theo

1. "Được cái này thì mất cái gì?"
2. Đơn giản nhất mà đủ dùng = đúng nhất
3. Ước lượng **trước** khi vẽ
4. Latency ≠ throughput
5. Latency nổ tung khi tải > 80%
6. Đo bằng p99, không bao giờ trung bình
7. Cache là đòn bẩy lớn nhất — và nguồn bug tinh vi nhất
8. Mọi cuộc gọi mạng sẽ thất bại
9. At-least-once + idempotent
10. Sharding là biện pháp cuối cùng
11. Không quan sát được thì không sửa được
12. Microservices là giải pháp **tổ chức**
