package com.learn.blog.service;

import com.learn.blog.domain.Comment;
import com.learn.blog.domain.Post;
import com.learn.blog.domain.User;
import com.learn.blog.dto.comment.CommentResponse;
import com.learn.blog.dto.comment.CreateCommentRequest;
import com.learn.blog.dto.common.PageResponse;
import com.learn.blog.exception.BusinessRuleException;
import com.learn.blog.exception.ForbiddenException;
import com.learn.blog.exception.NotFoundException;
import com.learn.blog.repository.CommentRepository;
import com.learn.blog.repository.PostRepository;
import com.learn.blog.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Nghiệp vụ bình luận.
 *
 * Điểm đáng chú ý về hiệu năng: khi lấy danh sách bình luận kèm trả lời,
 * ta nạp TẤT CẢ trả lời bằng MỘT query (findRepliesByParentIds) thay vì
 * mỗi bình luận một query — đó chính là cách tránh N+1 (Module 12).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CommentService {

    /** Chỉ cho lồng 1 cấp: bình luận gốc -> trả lời. Không cho trả lời của trả lời. */
    private static final int MAX_DEPTH = 1;

    private final CommentRepository commentRepository;
    private final PostRepository postRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public PageResponse<CommentResponse> listByPost(Long postId, Pageable pageable) {
        Page<Comment> roots = commentRepository
                .findByPostIdAndParentIsNullOrderByCreatedAtDesc(postId, pageable);

        List<Long> rootIds = roots.getContent().stream().map(Comment::getId).toList();

        // 1 query duy nhất cho toàn bộ trả lời của trang hiện tại
        Map<Long, List<CommentResponse>> repliesByParent = rootIds.isEmpty()
                ? Map.of()
                : commentRepository.findRepliesByParentIds(rootIds).stream()
                        .collect(Collectors.groupingBy(
                                c -> c.getParent().getId(),
                                Collectors.mapping(CommentResponse::from, Collectors.toList())));

        return PageResponse.of(roots,
                c -> CommentResponse.from(c, repliesByParent.getOrDefault(c.getId(), List.of())));
    }

    @Transactional
    public CommentResponse create(Long postId, CreateCommentRequest request, Long authorId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new NotFoundException("bài viết", postId));

        if (!post.isPublished()) {
            throw new BusinessRuleException("POST_NOT_PUBLISHED",
                    "Chỉ có thể bình luận trên bài viết đã xuất bản");
        }

        User author = userRepository.findById(authorId)
                .orElseThrow(() -> new NotFoundException("người dùng", authorId));

        Comment parent = null;
        if (request.parentId() != null) {
            parent = commentRepository.findById(request.parentId())
                    .orElseThrow(() -> new NotFoundException("bình luận", request.parentId()));

            if (!parent.getPost().getId().equals(postId)) {
                throw new BusinessRuleException("Bình luận cha không thuộc bài viết này");
            }
            if (depthOf(parent) >= MAX_DEPTH) {
                throw new BusinessRuleException("COMMENT_TOO_DEEP",
                        "Chỉ hỗ trợ trả lời 1 cấp");
            }
        }

        Comment comment = new Comment(post, author, request.content().trim(), parent);
        Comment saved = commentRepository.save(comment);
        log.debug("Thêm bình luận id={} vào bài viết={}", saved.getId(), postId);

        return CommentResponse.from(saved);
    }

    @Transactional
    public CommentResponse update(Long commentId, String content, Long currentUserId, boolean isAdmin) {
        Comment comment = loadOwned(commentId, currentUserId, isAdmin);
        comment.setContent(content.trim());
        return CommentResponse.from(comment);       // dirty checking tự lưu
    }

    @Transactional
    public void delete(Long commentId, Long currentUserId, boolean isAdmin) {
        Comment comment = loadOwned(commentId, currentUserId, isAdmin);
        commentRepository.delete(comment);          // các trả lời bị xóa theo (orphanRemoval)
    }

    @Transactional(readOnly = true)
    public long countByPost(Long postId) { return commentRepository.countByPostId(postId); }

    // ------------------------------------------------------------ nội bộ
    private Comment loadOwned(Long commentId, Long currentUserId, boolean isAdmin) {
        Comment comment = commentRepository.findWithAuthorById(commentId)
                .orElseThrow(() -> new NotFoundException("bình luận", commentId));

        if (!isAdmin && !comment.isOwnedBy(currentUserId)) {
            throw new ForbiddenException("Bạn chỉ có thể sửa/xóa bình luận của chính mình");
        }
        return comment;
    }

    private int depthOf(Comment comment) {
        int depth = 0;
        Comment current = comment;
        while (current.getParent() != null && depth < 10) {
            depth++;
            current = current.getParent();
        }
        return depth;
    }
}
