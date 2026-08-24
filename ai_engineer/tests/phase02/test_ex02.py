"""Cham diem ex02_gradient_descent.py — Phase 02."""

from __future__ import annotations

import numpy as np
import pytest

from tests.conftest import bao_chua_lam, nap_module

pytestmark = pytest.mark.phase02


@pytest.fixture(scope="module")
def ex():
    return nap_module("curriculum/02-math-essentials/exercises/ex02_gradient_descent.py")


class TestLossVaGradient:
    def test_loss_co_ket_qua(self, ex):
        assert ex.loss_binh_phuong(0) is not None, bao_chua_lam("loss_binh_phuong")

    def test_loss_tinh_dung(self, ex):
        assert ex.loss_binh_phuong(3) == 0
        assert ex.loss_binh_phuong(5) == 4
        assert ex.loss_binh_phuong(0) == 9

    def test_loss_khong_am(self, ex):
        for w in (-10, -1, 0, 3, 7, 100):
            assert ex.loss_binh_phuong(w) >= 0

    def test_loss_nho_nhat_tai_3(self, ex):
        assert ex.loss_binh_phuong(3) < ex.loss_binh_phuong(2.9)
        assert ex.loss_binh_phuong(3) < ex.loss_binh_phuong(3.1)

    def test_gradient_co_ket_qua(self, ex):
        assert ex.gradient_binh_phuong(0) is not None, bao_chua_lam("gradient_binh_phuong")

    def test_gradient_tinh_dung(self, ex):
        assert ex.gradient_binh_phuong(3) == 0
        assert ex.gradient_binh_phuong(5) == 4
        assert ex.gradient_binh_phuong(0) == -6

    def test_dau_gradient(self, ex):
        """Ben phai day -> duong. Ben trai day -> am."""
        assert ex.gradient_binh_phuong(10) > 0, "w > 3 thi gradient phai duong"
        assert ex.gradient_binh_phuong(-10) < 0, "w < 3 thi gradient phai am"

    def test_gradient_khop_voi_loss(self, ex):
        """Kiem chung bang dao ham so: (f(w+h) - f(w-h)) / (2h)."""
        h = 1e-6
        for w in (-2.0, 0.0, 1.5, 4.0, 8.0):
            xap_xi = (ex.loss_binh_phuong(w + h) - ex.loss_binh_phuong(w - h)) / (2 * h)
            assert abs(ex.gradient_binh_phuong(w) - xap_xi) < 1e-4, (
                f"Gradient tai w={w} khong khop voi dao ham so cua ham loss"
            )


class TestGradientDescent:
    def test_co_ket_qua(self, ex):
        assert ex.gradient_descent(0.0, 0.1, 3) is not None, bao_chua_lam("gradient_descent")

    def test_do_dai_lich_su(self, ex):
        assert len(ex.gradient_descent(0.0, 0.1, 3)) == 4, (
            "Lich su phai co so_buoc + 1 phan tu (ke ca gia tri ban dau)"
        )
        assert len(ex.gradient_descent(0.0, 0.1, 10)) == 11

    def test_phan_tu_dau_la_gia_tri_ban_dau(self, ex):
        assert ex.gradient_descent(7.0, 0.1, 5)[0] == 7.0

    def test_ba_buoc_dau(self, ex):
        ls = ex.gradient_descent(0.0, 0.1, 3)
        assert abs(ls[1] - 0.6) < 1e-9
        assert abs(ls[2] - 1.08) < 1e-9
        assert abs(ls[3] - 1.464) < 1e-9

    def test_hoi_tu_ve_3(self, ex):
        ls = ex.gradient_descent(0.0, 0.1, 200)
        assert abs(ls[-1] - 3.0) < 1e-3, f"Phai hoi tu ve 3.0, nhan duoc {ls[-1]}"

    def test_hoi_tu_tu_ca_hai_phia(self, ex):
        assert abs(ex.gradient_descent(-50.0, 0.1, 300)[-1] - 3.0) < 1e-3
        assert abs(ex.gradient_descent(50.0, 0.1, 300)[-1] - 3.0) < 1e-3

    def test_loss_giam_dan(self, ex):
        ls = ex.gradient_descent(0.0, 0.1, 30)
        cac_loss = [ex.loss_binh_phuong(w) for w in ls]
        for truoc, sau in zip(cac_loss, cac_loss[1:]):
            assert sau <= truoc + 1e-12, "Voi lr hop ly, loss phai giam dan"

    def test_lr_qua_lon_thi_phan_ky(self, ex):
        """Kiem chung hien tuong: lr > 1.0 lam thuat toan bay ra vo cuc."""
        ls = ex.gradient_descent(0.0, 1.5, 30)
        assert abs(ls[-1]) > 1000, (
            "Voi lr = 1.5 thuat toan phai PHAN KY (w bay ra rat xa). "
            "Neu khong, kiem tra lai cong thuc cap nhat."
        )

    def test_lr_nho_thi_cham(self, ex):
        cham = ex.gradient_descent(0.0, 0.001, 20)
        nhanh = ex.gradient_descent(0.0, 0.1, 20)
        assert abs(cham[-1] - 3) > abs(nhanh[-1] - 3), (
            "lr nho hon phai tien ve dich cham hon"
        )

    def test_dung_tai_diem_toi_uu(self, ex):
        """Xuat phat dung tai w=3 thi gradient=0 -> khong di dau nua."""
        ls = ex.gradient_descent(3.0, 0.1, 10)
        assert all(abs(w - 3.0) < 1e-9 for w in ls)


class TestTrainHoiQuy:
    @staticmethod
    def _du_lieu(seed=42, n=200):
        rng = np.random.default_rng(seed)
        X = rng.normal(size=(n, 2))
        y = X @ np.array([2.0, -1.0]) + 5.0
        return X, y

    def test_co_ket_qua(self, ex):
        X, y = self._du_lieu()
        assert ex.train_hoi_quy(X, y, 0.1, 10) is not None, bao_chua_lam("train_hoi_quy")

    def test_tra_ve_ba_gia_tri(self, ex):
        X, y = self._du_lieu()
        kq = ex.train_hoi_quy(X, y, 0.1, 10)
        assert len(kq) == 3, "Phai tra ve (w, b, lich_su_loss)"

    def test_shape_cua_w(self, ex):
        X, y = self._du_lieu()
        w, _, _ = ex.train_hoi_quy(X, y, 0.1, 10)
        assert np.shape(w) == (2,), f"w phai co shape (2,), nhan duoc {np.shape(w)}"

    def test_do_dai_lich_su_loss(self, ex):
        X, y = self._du_lieu()
        _, _, lich_su = ex.train_hoi_quy(X, y, 0.1, 50)
        assert len(lich_su) == 50, "lich_su_loss phai co dung so_epoch phan tu"

    def test_loss_giam(self, ex):
        X, y = self._du_lieu()
        _, _, lich_su = ex.train_hoi_quy(X, y, 0.1, 100)
        assert lich_su[-1] < lich_su[0], "Loss phai giam sau khi train"

    def test_hoc_dung_tham_so(self, ex):
        """Kiem tra thuc su: model co tim lai duoc w=[2,-1], b=5 khong."""
        X, y = self._du_lieu()
        w, b, _ = ex.train_hoi_quy(X, y, learning_rate=0.1, so_epoch=500)
        assert np.allclose(w, [2.0, -1.0], atol=0.05), (
            f"w hoc duoc {w}, ky vong gan [2, -1]"
        )
        assert abs(b - 5.0) < 0.05, f"b hoc duoc {b}, ky vong gan 5"

    def test_khoi_tao_bang_khong(self, ex):
        """Train 0 epoch -> w va b van la gia tri khoi tao."""
        X, y = self._du_lieu()
        w, b, lich_su = ex.train_hoi_quy(X, y, 0.1, 0)
        assert np.allclose(w, 0), "w phai duoc khoi tao bang 0"
        assert b == 0, "b phai duoc khoi tao bang 0"
        assert lich_su == []

    def test_hoat_dong_voi_nhieu_dac_trung(self, ex):
        rng = np.random.default_rng(3)
        X = rng.normal(size=(300, 5))
        w_that = np.array([1.0, -2.0, 0.5, 3.0, -0.5])
        y = X @ w_that + 2.0
        w, b, _ = ex.train_hoi_quy(X, y, learning_rate=0.1, so_epoch=800)
        assert np.allclose(w, w_that, atol=0.05)
        assert abs(b - 2.0) < 0.05


class TestSigmoid:
    def test_co_ket_qua(self, ex):
        assert ex.sigmoid(0) is not None, bao_chua_lam("sigmoid")

    def test_tai_khong(self, ex):
        assert abs(ex.sigmoid(0) - 0.5) < 1e-12

    def test_hai_dau(self, ex):
        assert ex.sigmoid(100) > 0.999
        assert ex.sigmoid(-100) < 0.001

    def test_luon_trong_khoang_0_1(self, ex):
        for z in (-50, -5, -1, 0, 1, 5, 50):
            kq = ex.sigmoid(z)
            assert 0 <= kq <= 1, f"sigmoid({z}) = {kq}, phai nam trong [0, 1]"

        # Voi z vua phai, ket qua phai nam HAN trong khoang (khong cham bien)
        for z in (-6, -1, 0, 1, 6):
            kq = ex.sigmoid(z)
            assert 0 < kq < 1, f"sigmoid({z}) = {kq}, phai nam trong (0, 1)"

    def test_dong_bien(self, ex):
        gia_tri = [ex.sigmoid(z) for z in (-3, -1, 0, 1, 3)]
        for truoc, sau in zip(gia_tri, gia_tri[1:]):
            assert sau > truoc, "sigmoid phai dong bien (z lon hon -> ket qua lon hon)"

    def test_doi_xung(self, ex):
        """sigmoid(-z) = 1 - sigmoid(z)"""
        for z in (0.5, 2.0, 4.0):
            assert abs(ex.sigmoid(-z) - (1 - ex.sigmoid(z))) < 1e-9

    def test_hoat_dong_voi_mang(self, ex):
        kq = ex.sigmoid(np.array([-100.0, 0.0, 100.0]))
        assert np.shape(kq) == (3,), "sigmoid phai xu ly duoc ca mang NumPy"
        assert abs(kq[1] - 0.5) < 1e-12
