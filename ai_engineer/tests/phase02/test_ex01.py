"""Cham diem ex01_vector_ma_tran.py — Phase 02."""

from __future__ import annotations

import numpy as np
import pytest

from tests.conftest import bao_chua_lam, nap_module

pytestmark = pytest.mark.phase02


@pytest.fixture(scope="module")
def ex():
    return nap_module("curriculum/02-math-essentials/exercises/ex01_vector_ma_tran.py")


class TestTichVoHuong:
    def test_co_ket_qua(self, ex):
        kq = ex.tich_vo_huong(np.array([1.0, 2.0]), np.array([3.0, 4.0]))
        assert kq is not None, bao_chua_lam("tich_vo_huong")

    def test_tinh_dung(self, ex):
        assert ex.tich_vo_huong(np.array([1.0, 2.0, 3.0]), np.array([4.0, 5.0, 6.0])) == 32.0
        assert ex.tich_vo_huong(np.array([1.0, 0.0]), np.array([0.0, 1.0])) == 0.0

    def test_so_am(self, ex):
        assert ex.tich_vo_huong(np.array([1.0, 0.0]), np.array([-1.0, 0.0])) == -1.0

    def test_khong_nham_voi_nhan_tung_phan_tu(self, ex):
        """a * b tra ve MANG, a @ b tra ve MOT SO."""
        kq = ex.tich_vo_huong(np.array([1.0, 2.0]), np.array([3.0, 4.0]))
        assert np.isscalar(kq) or np.ndim(kq) == 0, (
            "Ket qua phai la MOT SO. Ban dang dung a * b (nhan tung phan tu) "
            "thay vi a @ b (tich vo huong)?"
        )
        assert kq == 11.0


class TestDoDai:
    def test_co_ket_qua(self, ex):
        assert ex.do_dai(np.array([3.0, 4.0])) is not None, bao_chua_lam("do_dai")

    def test_tam_giac_345(self, ex):
        assert ex.do_dai(np.array([3.0, 4.0])) == 5.0

    def test_vector_khong(self, ex):
        assert ex.do_dai(np.array([0.0, 0.0])) == 0.0

    def test_nhieu_chieu(self, ex):
        assert abs(ex.do_dai(np.array([1.0, 1.0, 1.0, 1.0])) - 2.0) < 1e-9


class TestCosineSimilarity:
    def test_co_ket_qua(self, ex):
        kq = ex.cosine_similarity(np.array([1.0, 0.0]), np.array([1.0, 0.0]))
        assert kq is not None, bao_chua_lam("cosine_similarity")

    def test_cung_huong(self, ex):
        assert abs(ex.cosine_similarity(np.array([1.0, 0.0]), np.array([1.0, 0.0])) - 1.0) < 1e-9

    def test_vuong_goc(self, ex):
        assert abs(ex.cosine_similarity(np.array([1.0, 0.0]), np.array([0.0, 1.0]))) < 1e-9

    def test_nguoc_huong(self, ex):
        assert abs(ex.cosine_similarity(np.array([1.0, 0.0]), np.array([-1.0, 0.0])) + 1.0) < 1e-9

    def test_khong_phu_thuoc_do_lon(self, ex):
        """Diem cot loi: [1,2] va [2,4] cung huong -> cosine = 1."""
        assert abs(ex.cosine_similarity(np.array([1.0, 2.0]), np.array([2.0, 4.0])) - 1.0) < 1e-9
        assert abs(ex.cosine_similarity(np.array([1.0, 0.0]), np.array([100.0, 0.0])) - 1.0) < 1e-9

    def test_vector_khong(self, ex):
        """Khong duoc chia cho 0 -> tra ve 0.0, khong duoc ra nan."""
        kq = ex.cosine_similarity(np.array([0.0, 0.0]), np.array([1.0, 0.0]))
        assert not np.isnan(kq), "Ket qua la nan - ban dang chia cho 0"
        assert kq == 0.0

    def test_luon_trong_khoang(self, ex):
        rng = np.random.default_rng(0)
        for _ in range(20):
            a, b = rng.normal(size=5), rng.normal(size=5)
            kq = ex.cosine_similarity(a, b)
            assert -1.0001 <= kq <= 1.0001, f"Cosine phai trong [-1, 1], nhan: {kq}"


class TestChuanHoaCot:
    X = np.array([[1.0, 10.0], [2.0, 20.0], [3.0, 30.0]])

    def test_co_ket_qua(self, ex):
        assert ex.chuan_hoa_cot(self.X) is not None, bao_chua_lam("chuan_hoa_cot")

    def test_giu_nguyen_shape(self, ex):
        assert ex.chuan_hoa_cot(self.X).shape == (3, 2)

    def test_mean_bang_khong(self, ex):
        assert np.allclose(ex.chuan_hoa_cot(self.X).mean(axis=0), 0, atol=1e-9)

    def test_std_bang_mot(self, ex):
        assert np.allclose(ex.chuan_hoa_cot(self.X).std(axis=0), 1, atol=1e-9)

    def test_chuan_hoa_theo_COT_khong_phai_HANG(self, ex):
        """Loi hay gap: dung axis=1 thay vi axis=0."""
        Z = ex.chuan_hoa_cot(self.X)
        assert np.allclose(Z.mean(axis=0), 0, atol=1e-9), (
            "Mean theo COT phai bang 0. Ban dung axis=1 thay vi axis=0?"
        )

    def test_cot_hang_so_khong_gay_nan(self, ex):
        X = np.array([[1.0, 5.0], [2.0, 5.0], [3.0, 5.0]])   # cot 2 co std = 0
        Z = ex.chuan_hoa_cot(X)
        assert not np.isnan(Z).any(), (
            "Co gia tri nan - cot co std=0 dang bi chia cho 0"
        )
        assert np.allclose(Z[:, 1], 0)


class TestDuDoanTuyenTinh:
    def test_co_ket_qua(self, ex):
        kq = ex.du_doan_tuyen_tinh(np.array([[1.0, 2.0]]), np.array([1.0, 1.0]), 0.0)
        assert kq is not None, bao_chua_lam("du_doan_tuyen_tinh")

    def test_tinh_dung(self, ex):
        X = np.array([[1.0, 2.0], [3.0, 4.0]])
        kq = ex.du_doan_tuyen_tinh(X, np.array([0.5, 1.5]), 1.0)
        assert np.allclose(kq, [4.5, 8.5])

    def test_shape_ket_qua(self, ex):
        X = np.zeros((10, 3))
        kq = ex.du_doan_tuyen_tinh(X, np.ones(3), 0.0)
        assert kq.shape == (10,), f"Shape phai la (10,), nhan duoc {kq.shape}"

    def test_bias_duoc_cong_vao_moi_mau(self, ex):
        X = np.zeros((3, 2))
        kq = ex.du_doan_tuyen_tinh(X, np.array([1.0, 1.0]), 7.0)
        assert np.allclose(kq, [7.0, 7.0, 7.0])


class TestHamMatMat:
    def test_mse(self, ex):
        assert ex.mse(np.array([1.0, 2.0]), np.array([1.0, 4.0])) == 2.0
        assert ex.mse(np.array([1.0, 2.0]), np.array([1.0, 2.0])) == 0.0

    def test_mae(self, ex):
        assert ex.mae(np.array([1.0, 2.0]), np.array([1.0, 4.0])) == 1.0
        assert ex.mae(np.array([1.0, 2.0]), np.array([1.0, 2.0])) == 0.0

    def test_mse_phat_nang_sai_so_lon(self, ex):
        """MSE binh phuong -> sai so lon bi phat nang hon MAE."""
        y = np.array([0.0, 0.0])
        deu = np.array([1.0, 1.0])       # moi diem sai 1
        lech = np.array([0.0, 2.0])      # mot diem sai 2

        assert ex.mae(y, deu) == ex.mae(y, lech), "MAE phai bang nhau o hai truong hop"
        assert ex.mse(y, lech) > ex.mse(y, deu), "MSE phai phat nang truong hop sai lech"

    def test_khong_am(self, ex):
        rng = np.random.default_rng(1)
        for _ in range(10):
            a, b = rng.normal(size=8), rng.normal(size=8)
            assert ex.mse(a, b) >= 0
            assert ex.mae(a, b) >= 0


class TestTimGanNhat:
    KHO = np.array([[1.0, 0.0], [0.0, 1.0], [0.9, 0.1]])

    def test_co_ket_qua(self, ex):
        kq = ex.tim_gan_nhat(np.array([1.0, 0.0]), self.KHO, k=2)
        assert kq is not None, bao_chua_lam("tim_gan_nhat")

    def test_dung_thu_tu(self, ex):
        kq = ex.tim_gan_nhat(np.array([1.0, 0.0]), self.KHO, k=2)
        assert list(kq) == [0, 2]

    def test_so_luong_k(self, ex):
        assert len(ex.tim_gan_nhat(np.array([1.0, 0.0]), self.KHO, k=1)) == 1
        assert len(ex.tim_gan_nhat(np.array([1.0, 0.0]), self.KHO, k=3)) == 3

    def test_tra_ve_chi_so_khong_phai_gia_tri(self, ex):
        kq = ex.tim_gan_nhat(np.array([1.0, 0.0]), self.KHO, k=1)
        assert int(kq[0]) == 0, (
            "Phai tra ve CHI SO (dung np.argsort), khong phai gia tri (np.sort)"
        )

    def test_kho_lon_hon(self, ex):
        rng = np.random.default_rng(7)
        kho = rng.normal(size=(50, 8))
        truy_van = kho[17].copy()          # copy chinh mot vector trong kho
        kq = ex.tim_gan_nhat(truy_van, kho, k=1)
        assert int(kq[0]) == 17, "Vector giong het truy van phai xep hang dau"
