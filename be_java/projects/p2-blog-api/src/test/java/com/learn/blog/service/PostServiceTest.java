package com.learn.blog.service;

import com.learn.blog.domain.Post;
import com.learn.blog.domain.PostStatus;
import com.learn.blog.domain.User;
import com.learn.blog.dto.post.CreatePostRequest;
import com.learn.blog.dto.post.PostResponse;
import com.learn.blog.dto.post.UpdatePostRequest;
import com.learn.blog.exception.ForbiddenException;
import com.learn.blog.exception.NotFoundException;
import com.learn.blog.repository.PostRepository;
import com.learn.blog.repository.TagRepository;
import com.learn.blog.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
@DisplayName("PostService")
class PostServiceTest {

    @Mock PostRepository postRepository;
    @Mock UserRepository userRepository;
    @Mock TagRepository tagRepository;
    @InjectMocks PostService postService;

    User author;
    User other;
    Post post;

    @BeforeEach
    void setUp() {
        author = new User();
        author.setId(1L);
        author.setEmail("an@blog.com");
        author.setFullName("Nguyễn Văn An");

        other = new User();
        other.setId(2L);
        other.setEmail("binh@blog.com");
        other.setFullName("Trần Thị Bình");

        post = new Post("bai-viet-mau", "Bài viết mẫu", "Tóm tắt",
                "Nội dung đủ dài để hợp lệ trong bài test này", author);
    }

    @Nested
    @DisplayName("Tạo bài viết")
    class Create {

        @Test
        @DisplayName("tạo mới -> trạng thái DRAFT, slug sinh từ tiêu đề")
        void taoMoi() {
            given(userRepository.findById(1L)).willReturn(Optional.of(author));
            given(postRepository.existsBySlug(anyString())).willReturn(false);
            given(postRepository.save(any(Post.class))).willAnswer(inv -> inv.getArgument(0));

            var request = new CreatePostRequest("Học Java từ đâu", "Lộ trình",
                    "Nội dung bài viết đủ dài để qua validate", Set.of());

            PostResponse result = postService.create(request, 1L);

            assertThat(result.status()).isEqualTo(PostStatus.DRAFT.name());
            assertThat(result.slug()).isEqualTo("hoc-java-tu-dau");
            assertThat(result.author().fullName()).isEqualTo("Nguyễn Văn An");
        }

        @Test
        @DisplayName("slug trùng -> tự thêm hậu tố số")
        void slugTrung() {
            given(userRepository.findById(1L)).willReturn(Optional.of(author));
            given(postRepository.existsBySlug("hoc-java-tu-dau")).willReturn(true);
            given(postRepository.existsBySlug("hoc-java-tu-dau-2")).willReturn(false);
            given(postRepository.save(any(Post.class))).willAnswer(inv -> inv.getArgument(0));

            var request = new CreatePostRequest("Học Java từ đâu", null,
                    "Nội dung bài viết đủ dài để qua validate", null);

            assertThat(postService.create(request, 1L).slug()).isEqualTo("hoc-java-tu-dau-2");
        }

        @Test
        void tacGiaKhongTonTai() {
            given(userRepository.findById(99L)).willReturn(Optional.empty());

            assertThatThrownBy(() -> postService.create(
                    new CreatePostRequest("Tiêu đề", null, "Nội dung đủ dài cho validate", null), 99L))
                    .isInstanceOf(NotFoundException.class);

            verify(postRepository, never()).save(any());
        }
    }

    @Nested
    @DisplayName("Quyền sở hữu")
    class Ownership {

        @Test
        @DisplayName("người khác sửa bài -> 403")
        void nguoiKhacSua() {
            given(postRepository.findByIdWithAuthor(10L)).willReturn(Optional.of(post));

            assertThatThrownBy(() -> postService.update(10L,
                    new UpdatePostRequest("Tiêu đề mới", null, null, null), other.getId(), false))
                    .isInstanceOf(ForbiddenException.class)
                    .hasMessageContaining("của chính mình");
        }

        @Test
        @DisplayName("admin sửa được bài của người khác")
        void adminSuaDuoc() {
            given(postRepository.findByIdWithAuthor(10L)).willReturn(Optional.of(post));

            PostResponse result = postService.update(10L,
                    new UpdatePostRequest("Tiêu đề đã sửa", null, null, null), other.getId(), true);

            assertThat(result.title()).isEqualTo("Tiêu đề đã sửa");
        }

        @Test
        @DisplayName("người khác xóa bài -> 403 và KHÔNG gọi delete")
        void nguoiKhacXoa() {
            given(postRepository.findByIdWithAuthor(10L)).willReturn(Optional.of(post));

            assertThatThrownBy(() -> postService.delete(10L, other.getId(), false))
                    .isInstanceOf(ForbiddenException.class);

            verify(postRepository, never()).delete(any());
        }
    }

    @Nested
    @DisplayName("Cập nhật một phần")
    class PartialUpdate {

        @Test
        @DisplayName("field null -> giữ nguyên giá trị cũ")
        void fieldNullGiuNguyen() {
            given(postRepository.findByIdWithAuthor(10L)).willReturn(Optional.of(post));

            PostResponse result = postService.update(10L,
                    new UpdatePostRequest(null, "Tóm tắt mới", null, null), author.getId(), false);

            assertThat(result.title()).isEqualTo("Bài viết mẫu");     // giữ nguyên
            assertThat(result.summary()).isEqualTo("Tóm tắt mới");    // đã đổi
        }
    }

    @Nested
    @DisplayName("Xem chi tiết")
    class GetBySlug {

        @Test
        @DisplayName("bài đã xuất bản -> tăng lượt xem")
        void baiDaXuatBan() {
            post.publish();
            given(postRepository.findBySlugWithDetails("bai-viet-mau")).willReturn(Optional.of(post));

            postService.getBySlug("bai-viet-mau", null, false);

            verify(postRepository).increaseViewCount(post.getId());
        }

        @Test
        @DisplayName("bản nháp của người khác -> 404 (không tiết lộ sự tồn tại)")
        void banNhapNguoiKhac() {
            given(postRepository.findBySlugWithDetails("bai-viet-mau")).willReturn(Optional.of(post));

            assertThatThrownBy(() -> postService.getBySlug("bai-viet-mau", other.getId(), false))
                    .isInstanceOf(NotFoundException.class);
        }

        @Test
        @DisplayName("bản nháp của chính mình -> xem được, không tăng lượt xem")
        void banNhapCuaMinh() {
            given(postRepository.findBySlugWithDetails("bai-viet-mau")).willReturn(Optional.of(post));

            PostResponse result = postService.getBySlug("bai-viet-mau", author.getId(), false);

            assertThat(result.status()).isEqualTo(PostStatus.DRAFT.name());
            verify(postRepository, never()).increaseViewCount(any());
        }
    }

    @Nested
    @DisplayName("Sinh slug")
    class Slug {

        @Test
        void boDauTiengViet() {
            assertThat(PostService.toSlug("Học Java từ đâu cho người mới"))
                    .isEqualTo("hoc-java-tu-dau-cho-nguoi-moi");
        }

        @Test
        void boKyTuDacBiet() {
            assertThat(PostService.toSlug("Spring Boot: N+1 là gì?!"))
                    .isEqualTo("spring-boot-n1-la-gi");
        }

        @Test
        void tieuDeToanKyTuLa() {
            assertThat(PostService.toSlug("!!!???")).isEqualTo("bai-viet");
        }
    }

    @Test
    @DisplayName("xuất bản -> đặt publishedAt và lưu đúng trạng thái")
    void publish() {
        given(postRepository.findByIdWithAuthor(10L)).willReturn(Optional.of(post));

        PostResponse result = postService.publish(10L, author.getId(), false);

        assertThat(result.status()).isEqualTo(PostStatus.PUBLISHED.name());
        assertThat(result.publishedAt()).isNotNull();
    }
}
