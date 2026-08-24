"""Cham diem ex01_hoi_quy.py — Phase 04."""

from __future__ import annotations

import numpy as np
import pytest

from tests.conftest import bao_chua_lam, nap_module

pytestmark = pytest.mark.phase04


@pytest.fixture(scope="module")
def ex():
    return nap_module("curriculum/04-classical-ml/exercises/ex01_hoi_quy.py")


@pytest.fixture
def du_lieu():
    rng = np.random.default_rng(0)
    X = rng.normal(size=(200, 3))
    y = X @ np.array([2.0, -1.0, 0.5]) + 5.0 + rng.normal(0, 0.5, 200)
    return X, y


class TestChiaTrainTest:
    def test_co_ket_qua(self, ex, du_lieu):
        X, y = du_lieu
        assert ex.chia_train_test(X, y) is not None, bao_chua_lam("chia_train_test")

    def test_tra_ve_bon_phan(self, ex, du_lieu):
        X, y = du_lieu
        assert len(ex.chia_train_test(X, y)) == 4

    def test_kich_thuoc(self, ex, du_lieu):
        X, y = du_lieu
        X_tr, X_te, y_tr, y_te = ex.chia_train_test(X, y, ty_le_test=0.2)
        assert len(X_tr) == 160 and len(X_te) == 40
        assert len(y_tr) == 160 and len(y_te) == 40

    def test_ty_le_khac(self, ex, du_lieu):
        X, y = du_lieu
        _, X_te, _, _ = ex.chia_train_test(X, y, ty_le_test=0.3)
        assert len(X_te) == 60

    def test_khong_mat_du_lieu(self, ex, du_lieu):
        X, y = du_lieu
        X_tr, X_te, _, _ = ex.chia_train_test(X, y)
        assert len(X_tr) + len(X_te) == len(X)

    def test_khong_trung_lap(self, ex, du_lieu):
        """Mot dong khong duoc vua o train vua o test."""
        X, y = du_lieu
        X_tr, X_te, _, _ = ex.chia_train_test(X, y)
        tap_tr = {tuple(r) for r in X_tr}
        tap_te = {tuple(r) for r in X_te}
        assert len(tap_tr & tap_te) == 0, "Co dong xuat hien o CA train va test!"

    def test_co_xao_tron(self, ex, du_lieu):
        """Khong duoc cat thang 20% cuoi lam test."""
        X, y = du_lieu
        _, X_te, _, _ = ex.chia_train_test(X, y)
        cuoi = X[-40:]
        assert not np.allclose(X_te, cuoi), (
            "Ban dang cat thang phan cuoi lam test. Phai XAO TRON truoc."
        )

    def test_X_va_y_khop_nhau(self, ex, du_lieu):
        """Sau khi xao tron, dac trung va nhan phai van di cung nhau."""
        X, y = du_lieu
        X_tr, X_te, y_tr, y_te = ex.chia_train_test(X, y)
        goc = {tuple(np.round(r, 9)): v for r, v in zip(X, y)}
        for r, v in zip(X_te, y_te):
            assert abs(goc[tuple(np.round(r, 9))] - v) < 1e-9, (
                "X va y bi xao tron RIENG -> nhan gan sai vao dac trung!"
            )

    def test_tai_lap_duoc(self, ex, du_lieu):
        X, y = du_lieu
        a = ex.chia_train_test(X, y, seed=7)[1]
        b = ex.chia_train_test(X, y, seed=7)[1]
        assert np.allclose(a, b), "Cung seed phai cho ket qua y het"

    def test_seed_khac_cho_ket_qua_khac(self, ex, du_lieu):
        X, y = du_lieu
        a = ex.chia_train_test(X, y, seed=1)[1]
        b = ex.chia_train_test(X, y, seed=2)[1]
        assert not np.allclose(a, b)


class TestMetrics:
    def test_mae(self, ex):
        assert ex.mae(np.array([100.0, 200.0]), np.array([110.0, 190.0])) == 10.0
        assert ex.mae(np.array([1.0, 2.0]), np.array([1.0, 2.0])) == 0.0

    def test_rmse(self, ex):
        assert abs(ex.rmse(np.array([0.0, 0.0]), np.array([1.0, 1.0])) - 1.0) < 1e-9
        assert abs(ex.rmse(np.array([0.0, 0.0]), np.array([0.0, 2.0])) - 1.4142) < 1e-3

    def test_rmse_phat_nang_hon_mae(self, ex):
        """Sai so lech -> RMSE lon hon MAE."""
        y = np.array([0.0, 0.0, 0.0, 0.0])
        lech = np.array([0.0, 0.0, 0.0, 8.0])
        assert ex.rmse(y, lech) > ex.mae(y, lech)

    def test_mae_bang_rmse_khi_sai_deu(self, ex):
        y = np.array([0.0, 0.0])
        deu = np.array([2.0, 2.0])
        assert abs(ex.mae(y, deu) - ex.rmse(y, deu)) < 1e-9

    def test_r2_hoan_hao(self, ex):
        y = np.array([1.0, 2.0, 3.0])
        assert ex.r2(y, y) == 1.0

    def test_r2_bang_khong_khi_doan_trung_binh(self, ex):
        y = np.array([1.0, 2.0, 3.0, 4.0])
        assert abs(ex.r2(y, np.full(4, y.mean()))) < 1e-9

    def test_r2_am(self, ex):
        y = np.array([1.0, 2.0, 3.0])
        assert ex.r2(y, np.array([100.0, 100.0, 100.0])) < 0

    def test_r2_khi_y_hang_so(self, ex):
        y = np.array([5.0, 5.0, 5.0])
        kq = ex.r2(y, np.array([5.0, 5.0, 5.0]))
        assert not np.isnan(kq), "y hang so -> mau so bang 0, phai xu ly"
        assert kq == 0.0


class TestBaseline:
    def test_do_dai(self, ex):
        assert len(ex.baseline_trung_binh(np.array([1.0, 2.0, 3.0]), 5)) == 5

    def test_gia_tri(self, ex):
        kq = ex.baseline_trung_binh(np.array([1.0, 2.0, 3.0]), 3)
        assert np.allclose(kq, 2.0)

    def test_dung_mean_cua_train(self, ex):
        """Khong duoc dung mean cua test -> do la leakage."""
        y_train = np.array([10.0, 10.0, 10.0])
        assert np.allclose(ex.baseline_trung_binh(y_train, 2), 10.0)

    def test_r2_baseline_gan_khong(self, ex, du_lieu):
        X, y = du_lieu
        _, _, y_tr, y_te = ex.chia_train_test(X, y)
        bl = ex.baseline_trung_binh(y_tr, len(y_te))
        assert ex.r2(y_te, bl) < 0.1


class TestFitHoiQuy:
    def test_co_ket_qua(self, ex, du_lieu):
        X, y = du_lieu
        assert ex.fit_hoi_quy(X, y) is not None, bao_chua_lam("fit_hoi_quy")

    def test_quan_he_don_gian(self, ex):
        """y = 2x + 1"""
        X = np.array([[1.0], [2.0], [3.0], [4.0]])
        y = np.array([3.0, 5.0, 7.0, 9.0])
        w, b = ex.fit_hoi_quy(X, y)
        assert abs(w[0] - 2.0) < 1e-6
        assert abs(b - 1.0) < 1e-6

    def test_nhieu_dac_trung(self, ex, du_lieu):
        X, y = du_lieu
        w, b = ex.fit_hoi_quy(X, y)
        assert np.allclose(w, [2.0, -1.0, 0.5], atol=0.15)
        assert abs(b - 5.0) < 0.15

    def test_shape_cua_w(self, ex, du_lieu):
        X, y = du_lieu
        w, _ = ex.fit_hoi_quy(X, y)
        assert np.shape(w) == (3,), f"w phai co shape (3,), nhan {np.shape(w)}"

    def test_du_doan(self, ex):
        X = np.array([[1.0, 2.0], [3.0, 4.0]])
        kq = ex.du_doan(X, np.array([0.5, 1.5]), 1.0)
        assert np.allclose(kq, [4.5, 8.5])

    def test_fit_roi_du_doan_khop(self, ex, du_lieu):
        X, y = du_lieu
        w, b = ex.fit_hoi_quy(X, y)
        assert ex.r2(y, ex.du_doan(X, w, b)) > 0.9


class TestChanDoan:
    def test_overfit(self, ex):
        assert ex.chan_doan(0.99, 0.62) == "Overfit"

    def test_tot(self, ex):
        assert ex.chan_doan(0.85, 0.83) == "Tot"

    def test_underfit(self, ex):
        assert ex.chan_doan(0.30, 0.28) == "Underfit"

    def test_bat_thuong(self, ex):
        assert ex.chan_doan(0.60, 0.85) == "Bat thuong"

    def test_bat_thuong_uu_tien_hon_underfit(self, ex):
        """Vua underfit vua co test tot hon -> phai bao 'Bat thuong'."""
        assert ex.chan_doan(0.20, 0.60) == "Bat thuong"

    def test_nguong_tuy_chinh(self, ex):
        assert ex.chan_doan(0.90, 0.85, nguong=0.02) == "Overfit"
        assert ex.chan_doan(0.90, 0.85, nguong=0.20) == "Tot"


class TestDacTrungDaThuc:
    def test_mot_dac_trung(self, ex):
        kq = ex.them_dac_trung_da_thuc(np.array([[2.0], [3.0]]), 3)
        assert np.allclose(kq, [[2, 4, 8], [3, 9, 27]])

    def test_nhieu_dac_trung(self, ex):
        kq = ex.them_dac_trung_da_thuc(np.array([[1.0, 2.0]]), 2)
        assert np.allclose(kq, [[1, 2, 1, 4]]), (
            "Thu tu phai la [X, X^2] chu khong phai xen ke"
        )

    def test_bac_1_giu_nguyen(self, ex):
        X = np.array([[1.0, 2.0], [3.0, 4.0]])
        assert np.allclose(ex.them_dac_trung_da_thuc(X, 1), X)

    def test_shape(self, ex):
        X = np.ones((10, 4))
        assert ex.them_dac_trung_da_thuc(X, 3).shape == (10, 12)

    def test_giup_khop_quan_he_cong(self, ex):
        """Voi y = x^2, bac 2 phai tot hon HAN bac 1."""
        rng = np.random.default_rng(1)
        X = rng.uniform(-3, 3, size=(200, 1))
        y = (X[:, 0] ** 2) + rng.normal(0, 0.2, 200)

        w1, b1 = ex.fit_hoi_quy(X, y)
        r2_bac1 = ex.r2(y, ex.du_doan(X, w1, b1))

        X2 = ex.them_dac_trung_da_thuc(X, 2)
        w2, b2 = ex.fit_hoi_quy(X2, y)
        r2_bac2 = ex.r2(y, ex.du_doan(X2, w2, b2))

        assert r2_bac2 > r2_bac1 + 0.5, (
            f"Bac 2 (R2={r2_bac2:.3f}) phai tot hon han bac 1 (R2={r2_bac1:.3f})"
        )
