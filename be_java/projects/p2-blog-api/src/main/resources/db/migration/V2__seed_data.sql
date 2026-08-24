-- =====================================================================
-- V2: Dữ liệu mẫu để có sẵn nội dung khi chạy thử.
--
-- ⚠ 3 tài khoản dưới đây KHÔNG đăng nhập được: cột password chỉ là chuỗi
--   giữ chỗ, không phải hash BCrypt hợp lệ. Có 2 cách để có tài khoản thật:
--     1. Gọi POST /api/v1/auth/register để tự tạo tài khoản, hoặc
--     2. Chạy `PasswordHashGenerator` (trong package util) để sinh hash BCrypt
--        thật rồi UPDATE vào bảng users.
--   Cố tình làm vậy để bạn không bao giờ quen với việc commit hash thật vào git.
-- =====================================================================

INSERT INTO users (email, password, full_name, bio) VALUES
('admin@blog.com',  '{CHUA-CAI-DAT}', 'Quản trị viên', 'Admin hệ thống'),
('an@blog.com',     '{CHUA-CAI-DAT}', 'Nguyễn Văn An', 'Lập trình viên backend'),
('binh@blog.com',   '{CHUA-CAI-DAT}', 'Trần Thị Bình', 'Yêu thích viết lách');

INSERT INTO user_roles (user_id, role) VALUES
(1, 'ROLE_ADMIN'), (1, 'ROLE_USER'),
(2, 'ROLE_USER'),
(3, 'ROLE_USER');

INSERT INTO tags (name) VALUES ('java'), ('spring'), ('database'), ('devops'), ('career');

INSERT INTO posts (slug, title, summary, content, status, author_id, published_at) VALUES
('hoc-java-tu-dau', 'Học Java từ đâu cho người mới',
 'Lộ trình 6 tháng từ zero tới backend developer',
 'Nội dung chi tiết về lộ trình học Java...', 'PUBLISHED', 2, NOW() - INTERVAL '10 days'),
('hieu-ve-n-plus-1', 'Hiểu về vấn đề N+1 trong JPA',
 'Nguyên nhân, cách phát hiện và 4 cách xử lý',
 'N+1 là vấn đề hiệu năng phổ biến nhất khi dùng JPA...', 'PUBLISHED', 2, NOW() - INTERVAL '5 days'),
('spring-security-jwt', 'Spring Security và JWT trong thực tế',
 'Từ luồng xác thực tới các bẫy bảo mật',
 'Bài viết mô tả chi tiết luồng JWT...', 'PUBLISHED', 3, NOW() - INTERVAL '2 days'),
('bai-viet-nhap', 'Bài viết đang soạn',
 'Chưa xuất bản', 'Nội dung nháp...', 'DRAFT', 2, NULL);

INSERT INTO post_tags (post_id, tag_id) VALUES
(1, 1), (1, 5),
(2, 1), (2, 2), (2, 3),
(3, 2),
(4, 1);

INSERT INTO comments (post_id, author_id, content) VALUES
(1, 3, 'Bài viết rất hữu ích, cảm ơn tác giả!'),
(1, 1, 'Bổ sung thêm phần Collections nhé.'),
(2, 3, 'Mình từng bị N+1 mà không biết, giờ mới hiểu.');

INSERT INTO comments (post_id, author_id, parent_id, content) VALUES
(1, 2, 1, 'Cảm ơn bạn đã đọc!');
