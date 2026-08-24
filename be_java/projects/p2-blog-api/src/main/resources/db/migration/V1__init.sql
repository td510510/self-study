-- =====================================================================
-- V1 — Schema khởi tạo cho Blog API
-- Quy tắc Flyway: file đã chạy thì KHÔNG BAO GIỜ sửa, muốn đổi thì thêm V2, V3...
-- =====================================================================

CREATE TABLE users (
    id          BIGSERIAL PRIMARY KEY,
    email       VARCHAR(255) NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL,          -- BCrypt hash, không bao giờ là mật khẩu thô
    full_name   VARCHAR(100) NOT NULL,
    bio         TEXT,
    enabled     BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ
);

CREATE TABLE user_roles (
    user_id BIGINT      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role    VARCHAR(30) NOT NULL CHECK (role IN ('ROLE_USER', 'ROLE_AUTHOR', 'ROLE_ADMIN')),
    PRIMARY KEY (user_id, role)
);

CREATE TABLE refresh_tokens (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token       VARCHAR(255) NOT NULL UNIQUE,
    expires_at  TIMESTAMPTZ  NOT NULL,
    revoked     BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);

CREATE TABLE tags (
    id   BIGSERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE posts (
    id           BIGSERIAL PRIMARY KEY,
    slug         VARCHAR(255) NOT NULL UNIQUE,
    title        VARCHAR(255) NOT NULL,
    summary      VARCHAR(500),
    content      TEXT         NOT NULL,
    status       VARCHAR(20)  NOT NULL DEFAULT 'DRAFT'
                 CHECK (status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED')),
    author_id    BIGINT       NOT NULL REFERENCES users(id),
    view_count   BIGINT       NOT NULL DEFAULT 0,
    published_at TIMESTAMPTZ,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ,
    version      INTEGER      NOT NULL DEFAULT 0       -- optimistic locking
);
-- Index cho khóa ngoại (Postgres không tự tạo) và cho truy vấn hay dùng
CREATE INDEX idx_posts_author        ON posts(author_id);
CREATE INDEX idx_posts_status_pub    ON posts(status, published_at DESC);
CREATE INDEX idx_posts_title_lower   ON posts(LOWER(title));

CREATE TABLE post_tags (
    post_id BIGINT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    tag_id  BIGINT NOT NULL REFERENCES tags(id)  ON DELETE CASCADE,
    PRIMARY KEY (post_id, tag_id)
);
CREATE INDEX idx_post_tags_tag ON post_tags(tag_id);

CREATE TABLE comments (
    id         BIGSERIAL PRIMARY KEY,
    post_id    BIGINT      NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    author_id  BIGINT      NOT NULL REFERENCES users(id),
    parent_id  BIGINT      REFERENCES comments(id) ON DELETE CASCADE,   -- bình luận lồng nhau
    content    TEXT        NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);
CREATE INDEX idx_comments_post   ON comments(post_id, created_at);
CREATE INDEX idx_comments_author ON comments(author_id);
