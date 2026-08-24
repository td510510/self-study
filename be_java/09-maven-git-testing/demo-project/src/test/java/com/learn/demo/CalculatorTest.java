package com.learn.demo;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.ValueSource;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DisplayName("Calculator — test logic thuần")
class CalculatorTest {

    Calculator calc;

    @BeforeEach
    void setUp() {
        calc = new Calculator();     // chạy trước MỖI test -> các test độc lập nhau
    }

    @Test
    @DisplayName("add: cộng hai số dương trả về tổng")
    void add_haiSoDuong_traVeTong() {
        // Given
        int a = 2, b = 3;
        // When
        int result = calc.add(a, b);
        // Then
        assertThat(result).isEqualTo(5);
    }

    @ParameterizedTest(name = "{0} + {1} = {2}")
    @CsvSource({"1,1,2", "2,3,5", "-1,1,0", "0,0,0", "-5,-5,-10"})
    void add_nhieuTruongHop(int a, int b, int expected) {
        assertThat(calc.add(a, b)).isEqualTo(expected);
    }

    @Test
    @DisplayName("divide: chia cho 0 ném ArithmeticException với thông báo rõ ràng")
    void divide_chiaChoKhong_nemException() {
        assertThatThrownBy(() -> calc.divide(10, 0))
                .isInstanceOf(ArithmeticException.class)
                .hasMessage("Không thể chia cho 0");
    }

    @ParameterizedTest
    @ValueSource(ints = {2, 3, 5, 7, 11, 13, 97})
    void isPrime_soNguyenTo_traVeTrue(int n) {
        assertThat(calc.isPrime(n)).isTrue();
    }

    @ParameterizedTest
    @ValueSource(ints = {-1, 0, 1, 4, 9, 100})
    void isPrime_khongPhaiSoNguyenTo_traVeFalse(int n) {
        assertThat(calc.isPrime(n)).isFalse();
    }

    @Nested
    @DisplayName("factorial — chú ý các ca biên")
    class Factorial {

        @Test
        void bienBangKhong() {
            assertThat(calc.factorial(0)).isEqualTo(1);
        }

        @Test
        void giaTriThuong() {
            assertThat(calc.factorial(5)).isEqualTo(120);
        }

        @Test
        void soAm_nemException() {
            assertThatThrownBy(() -> calc.factorial(-1))
                    .isInstanceOf(IllegalArgumentException.class);
        }

        @Test
        void quaLon_nemException() {
            assertThatThrownBy(() -> calc.factorial(21))
                    .hasMessageContaining("tràn long");
        }
    }
}
