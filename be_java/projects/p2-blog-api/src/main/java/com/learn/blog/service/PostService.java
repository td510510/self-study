package com.learn.blog.service;

import com.learn.blog.domain.Post;
import com.learn.blog.domain.PostStatus;
import com.learn.blog.domain.Tag;
import com.learn.blog.domain.User;
import com.learn.blog.dto.common.PageResponse;
import com.learn.blog.dto.post.CreatePostRequest;
import com.learn.blog.dto.post.PostResponse;
import com.learn.blog.dto.post.PostSummaryResponse;
import com.learn.blog.dto.post.UpdatePostRequest;
import com.learn.blog.exception.ConflictException;
import com.learn.blog.exception.ForbiddenException;
import com.learn.blog.exception.NotFoundException;
import com.learn.blog.repository.PostRepository;
import com.learn.blog.repository.TagRepository;
import com.learn.blog.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.util.HashSet;
import java.util.Locale;
import java.util.Set;

/**
 * Nghiệp vụ bài viết.
 *
 * Quy ước trong class này:
 *  - Mọi method chỉ đọc đều @Transactional(readOnly = true).
 *  - Kiểm tra quyền sở hữu ở SERVER, không tin tham số client gửi lên.
 *  - Trả DTO, không bao giờ trả entity ra ngoài.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PostService {

    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final TagRepository tagRepository;

    // -------------------------------------------------------------- đọc
    @Transactional(readOnly = true)
    public PageResponse<PostSummaryResponse> search(String keyword, String tag, Pageable pageable) {
        var page = postRepository.search(PostStatus.PUBLISHED,
                blankToNull(keyword), blankToNull(tag), pageable);
        return PageResponse.of(page, PostSummaryResponse::from);
    }

    @Transactional(readOnly = true)
    public PageResponse<PostSummaryResponse> findByAuthor(Long authorId, Pageable pageable) {
        return PageResponse.of(postRepository.findByAuthorId(authorId, pageable),
                PostSummaryResponse::from);
    }

    /**
     * Chi tiết bài viết theo slug.
     * Bài chưa xuất bản chỉ tác giả hoặc admin mới xem được.
     */
    @Transactional
    public PostResponse getBySlug(String slug, Long currentUserId, boolean isAdmin) {
        Post post = postRepository.findBySlugWithDetails(slug)
                .orElseThrow(() -> new NotFoundException("bài viết", slug));

        if (!post.isPublished() && !isAdmin && !post.isOwnedBy(currentUserId)) {
            // Trả 404 thay vì 403: không tiết lộ sự tồn tại của bản nháp người khác
            throw new NotFoundException("bài viết", slug);
        }

        if (post.isPublished()) {
            postRepository.increaseViewCount(post.getId());   // UPDATE nguyên tử, tránh race
        }
        return PostResponse.from(post);
    }

    // -------------------------------------------------------------- ghi
    @Transactional
    public PostResponse create(CreatePostRequest request, Long authorId) {
        User author = userRepository.findById(authorId)
                .orElseThrow(() -> new NotFoundException("người dùng", authorId));

        String slug = uniqueSlug(toSlug(request.title()));

        Post post = new Post(slug, request.title().trim(),
                request.summary(), request.content(), author);
        post.replaceTags(resolveTags(request.tags()));

        Post saved = postRepository.save(post);
        log.info("Tạo bài viết id={} slug={} bởi user={}", saved.getId(), slug, authorId);
        return PostResponse.from(saved);
    }

    @Transactional
    public PostResponse update(Long id, UpdatePostRequest request, Long currentUserId, boolean isAdmin) {
        Post post = loadOwned(id, currentUserId, isAdmin);

        // Cập nhật một phần: field null nghĩa là "giữ nguyên"
        if (request.title() != null) post.setTitle(request.title().trim());
        if (request.summary() != null) post.setSummary(request.summary());
        if (request.content() != null) post.setContent(request.content());
        if (request.tags() != null) post.replaceTags(resolveTags(request.tags()));

        // Không cần gọi save(): dirty checking tự ghi khi commit transaction
        return PostResponse.from(post);
    }

    @Transactional
    public PostResponse publish(Long id, Long currentUserId, boolean isAdmin) {
        Post post = loadOwned(id, currentUserId, isAdmin);
        post.publish();
        log.info("Xuất bản bài viết id={}", id);
        return PostResponse.from(post);
    }

    @Transactional
    public PostResponse archive(Long id, Long currentUserId, boolean isAdmin) {
        Post post = loadOwned(id, currentUserId, isAdmin);
        post.archive();
        return PostResponse.from(post);
    }

    @Transactional
    public void delete(Long id, Long currentUserId, boolean isAdmin) {
        Post post = loadOwned(id, currentUserId, isAdmin);
        postRepository.delete(post);      // comments bị xóa theo nhờ cascade + FK ON DELETE CASCADE
        log.info("Xóa bài viết id={} bởi user={}", id, currentUserId);
    }

    // ------------------------------------------------------------ nội bộ
    /** Nạp bài viết và kiểm tra quyền sở hữu — dùng chung cho mọi thao tác ghi. */
    private Post loadOwned(Long id, Long currentUserId, boolean isAdmin) {
        Post post = postRepository.findByIdWithAuthor(id)
                .orElseThrow(() -> new NotFoundException("bài viết", id));

        if (!isAdmin && !post.isOwnedBy(currentUserId)) {
            throw new ForbiddenException("Bạn chỉ có thể thao tác trên bài viết của chính mình");
        }
        return post;
    }

    private Set<Tag> resolveTags(Set<String> names) {
        Set<Tag> tags = new HashSet<>();
        if (names == null) return tags;
        for (String raw : names) {
            if (raw == null || raw.isBlank()) continue;
            String name = raw.trim().toLowerCase(Locale.ROOT);
            tags.add(tagRepository.findByName(name).orElseGet(() -> tagRepository.save(new Tag(name))));
        }
        return tags;
    }

    private String uniqueSlug(String base) {
        if (!postRepository.existsBySlug(base)) return base;
        for (int i = 2; i < 1000; i++) {
            String candidate = base + "-" + i;
            if (!postRepository.existsBySlug(candidate)) return candidate;
        }
        throw new ConflictException("Không tạo được slug duy nhất cho tiêu đề này");
    }

    /** "Học Java từ đâu?" -> "hoc-java-tu-dau" */
    static String toSlug(String title) {
        String normalized = Normalizer.normalize(title, Normalizer.Form.NFD)
                .replaceAll("\\p{InCombiningDiacriticalMarks}+", "")
                .replace('đ', 'd').replace('Đ', 'D');
        String slug = normalized.toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9\\s-]", "")
                .trim()
                .replaceAll("\\s+", "-")
                .replaceAll("-{2,}", "-");
        return slug.isBlank() ? "bai-viet" : slug.substring(0, Math.min(slug.length(), 200));
    }

    private static String blankToNull(String s) {
        return (s == null || s.isBlank()) ? null : s.trim();
    }
}
