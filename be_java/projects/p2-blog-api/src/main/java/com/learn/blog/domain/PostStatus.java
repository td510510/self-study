package com.learn.blog.domain;

public enum PostStatus {
    DRAFT("Bản nháp"),
    PUBLISHED("Đã xuất bản"),
    ARCHIVED("Đã lưu trữ");

    private final String label;

    PostStatus(String label) { this.label = label; }

    public String getLabel() { return label; }

    /** Quy tắc chuyển trạng thái hợp lệ. */
    public boolean canTransitionTo(PostStatus next) {
        return switch (this) {
            case DRAFT -> next == PUBLISHED || next == ARCHIVED;
            case PUBLISHED -> next == ARCHIVED || next == DRAFT;
            case ARCHIVED -> next == DRAFT;
        };
    }
}
