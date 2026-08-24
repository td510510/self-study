package com.learn.demo;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;

@ExtendWith(MockitoExtension.class)
@DisplayName("OrderService — test có mock phụ thuộc")
class OrderServiceTest {

    @Mock OrderRepository repository;         // hàng giả thay cho DB
    @Mock PaymentGateway paymentGateway;      // hàng giả thay cho cổng thanh toán
    @InjectMocks OrderService service;        // Mockito tự tiêm 2 mock trên qua constructor

    @Nested
    @DisplayName("placeOrder")
    class PlaceOrder {

        @Test
        @DisplayName("thanh toán thành công -> đơn PAID và được lưu")
        void thanhCong() {
            // Given
            given(paymentGateway.charge(1L, 100_000L)).willReturn(true);
            given(repository.save(any(Order.class))).willAnswer(inv -> inv.getArgument(0));

            // When
            Order order = service.placeOrder(1L, 100_000L);

            // Then
            assertThat(order.getStatus()).isEqualTo(Order.Status.PAID);
            assertThat(order.getAmount()).isEqualTo(100_000L);
            verify(paymentGateway).charge(1L, 100_000L);
            verify(repository, times(1)).save(any(Order.class));
        }

        @Test
        @DisplayName("thanh toán thất bại -> ném PaymentFailedException và KHÔNG lưu đơn")
        void thanhToanThatBai() {
            given(paymentGateway.charge(anyLong(), anyLong())).willReturn(false);

            assertThatThrownBy(() -> service.placeOrder(1L, 100_000L))
                    .isInstanceOf(PaymentFailedException.class)
                    .hasMessageContaining("user 1");

            verify(repository, never()).save(any());       // kiểm chứng điều KHÔNG được xảy ra
        }

        @Test
        @DisplayName("vượt hạn mức -> từ chối ngay, không gọi cổng thanh toán")
        void vuotHanMuc() {
            assertThatThrownBy(() -> service.placeOrder(1L, 60_000_000L))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("hạn mức");

            verifyNoInteractions(paymentGateway, repository);
        }

        @Test
        @DisplayName("số tiền <= 0 -> lỗi validate")
        void soTienKhongHopLe() {
            assertThatThrownBy(() -> service.placeOrder(1L, 0))
                    .isInstanceOf(IllegalArgumentException.class);
        }

        @Test
        @DisplayName("ArgumentCaptor: kiểm tra chính xác object được lưu xuống")
        void batThamSoDuocLuu() {
            given(paymentGateway.charge(anyLong(), anyLong())).willReturn(true);
            given(repository.save(any(Order.class))).willAnswer(inv -> inv.getArgument(0));

            service.placeOrder(7L, 250_000L);

            ArgumentCaptor<Order> captor = ArgumentCaptor.forClass(Order.class);
            verify(repository).save(captor.capture());
            Order saved = captor.getValue();

            assertThat(saved.getUserId()).isEqualTo(7L);
            assertThat(saved.getAmount()).isEqualTo(250_000L);
            assertThat(saved.getStatus()).isEqualTo(Order.Status.PAID);
        }
    }

    @Nested
    @DisplayName("cancelOrder")
    class CancelOrder {

        @Test
        void donKhongTonTai_nemException() {
            given(repository.findById(99L)).willReturn(Optional.empty());

            assertThatThrownBy(() -> service.cancelOrder(99L))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("99");
        }

        @Test
        void donDaThanhToan_khongHuyDuoc() {
            Order paid = new Order(1L, 100_000L);
            paid.markPaid();
            given(repository.findById(1L)).willReturn(Optional.of(paid));

            assertThatThrownBy(() -> service.cancelOrder(1L))
                    .isInstanceOf(IllegalStateException.class);
        }

        @Test
        void donPending_huyThanhCong() {
            Order pending = new Order(1L, 100_000L);
            given(repository.findById(1L)).willReturn(Optional.of(pending));
            given(repository.save(any(Order.class))).willAnswer(inv -> inv.getArgument(0));

            Order result = service.cancelOrder(1L);

            assertThat(result.getStatus()).isEqualTo(Order.Status.CANCELLED);
        }
    }

    @Test
    @DisplayName("totalSpent chỉ cộng đơn đã thanh toán")
    void totalSpent_chiTinhDonPaid() {
        Order paid1 = new Order(1L, 100_000L); paid1.markPaid();
        Order paid2 = new Order(1L, 250_000L); paid2.markPaid();
        Order pending = new Order(1L, 999_000L);
        Order cancelled = new Order(1L, 500_000L); cancelled.cancel();

        given(repository.findByUserId(1L)).willReturn(List.of(paid1, paid2, pending, cancelled));

        assertThat(service.totalSpent(1L)).isEqualTo(350_000L);
    }
}
