"""Cham diem ex01_numpy.py — Phase 03."""

from __future__ import annotations

import numpy as np
import pytest

from tests.conftest import bao_chua_lam, nap_module

pytestmark = pytest.mark.phase03


@pytest.fixture(scope="module")
def ex():
    return nap_module("curriculum/03-data-toolkit/exercises/ex01_numpy.py")


class TestDemThieu:
    def test_co_ket_qua(self, ex):
        assert ex.dem_thieu(np.array([1.0, np.nan])) is not None, bao_chua_lam("dem_thieu")

    def test_dem_dung(self, ex):
        assert ex.dem_thieu(np.array([1.0, np.nan, 3.0, np.nan])) == 2
        assert ex.dem_thieu(np.array([1.0, 2.0])) == 0

    def test_toan_nan(self, ex):
        assert ex.dem_thieu(np.array([np.nan, np.nan, np.nan])) == 3

    def test_khong_dung_so_sanh_bang(self, ex):
        """`a == np.nan` luon False -> cach do se tra ve 0."""
        assert ex.dem_thieu(np.array([np.nan])) == 1, (
            "Ban dang dung `a == np.nan`? Cach do LUON tra ve False. "
            "Phai dung np.isnan()."
        )


class TestThongKeAnToan:
    def test_co_ket_qua(self, ex):
        assert ex.thong_ke_an_toan(np.array([1.0, 2.0])) is not None, bao_chua_lam(
            "thong_ke_an_toan"
        )

    def test_du_khoa(self, ex):
        kq = ex.thong_ke_an_toan(np.array([1.0, 2.0, 3.0]))
        assert set(kq) == {"mean", "median", "std", "so_o_hop_le"}

    def test_bo_qua_nan(self, ex):
        kq = ex.thong_ke_an_toan(np.array([1.0, 2.0, np.nan, 3.0]))
        assert kq["so_o_hop_le"] == 3
        assert abs(kq["mean"] - 2.0) < 1e-9
        assert abs(kq["median"] - 2.0) < 1e-9

    def test_khong_tra_ve_nan(self, ex):
        kq = ex.thong_ke_an_toan(np.array([1.0, np.nan]))
        assert not np.isnan(kq["mean"]), (
            "Ket qua la nan - ban dang dung .mean() thay vi np.nanmean()"
        )

    def test_toan_nan(self, ex):
        kq = ex.thong_ke_an_toan(np.array([np.nan, np.nan]))
        assert kq["so_o_hop_le"] == 0
        assert kq["mean"] == 0.0


class TestDienThieu:
    def test_dien_dung(self, ex):
        kq = ex.dien_thieu_bang_median(np.array([1.0, 2.0, np.nan, 3.0]))
        assert np.allclose(kq, [1.0, 2.0, 2.0, 3.0])

    def test_khong_con_nan(self, ex):
        kq = ex.dien_thieu_bang_median(np.array([1.0, np.nan, 5.0, np.nan]))
        assert not np.isnan(kq).any()

    def test_khong_sua_mang_goc(self, ex):
        a = np.array([1.0, np.nan, 3.0])
        ex.dien_thieu_bang_median(a)
        assert np.isnan(a[1]), "Ham da sua mang goc!"

    def test_toan_nan(self, ex):
        kq = ex.dien_thieu_bang_median(np.array([np.nan, np.nan]))
        assert np.allclose(kq, [0.0, 0.0])

    def test_khong_co_nan(self, ex):
        a = np.array([1.0, 2.0, 3.0])
        assert np.allclose(ex.dien_thieu_bang_median(a), a)


class TestLocKhoang:
    def test_loc_dung(self, ex):
        kq = ex.loc_khoang(np.array([1.0, 5.0, np.nan, 10.0, 20.0]), 2, 15)
        assert np.allclose(kq, [5.0, 10.0])

    def test_bao_gom_hai_dau(self, ex):
        kq = ex.loc_khoang(np.array([1.0, 5.0, 10.0]), 1, 10)
        assert np.allclose(kq, [1.0, 5.0, 10.0]), "Khoang phai BAO GOM ca hai dau"

    def test_loai_nan(self, ex):
        kq = ex.loc_khoang(np.array([np.nan, 5.0]), 0, 100)
        assert len(kq) == 1
        assert not np.isnan(kq).any()

    def test_khong_co_gia_tri_nao(self, ex):
        assert len(ex.loc_khoang(np.array([1.0, 2.0]), 100, 200)) == 0


class TestNgoaiLaiIQR:
    def test_tim_dung(self, ex):
        a = np.array([10.0, 12.0, 11.0, 13.0, 12.0, 100.0])
        assert list(ex.tim_ngoai_lai_iqr(a)) == [5]

    def test_tra_ve_chi_so(self, ex):
        a = np.array([10.0, 12.0, 11.0, 13.0, 12.0, 100.0])
        kq = ex.tim_ngoai_lai_iqr(a)
        assert int(kq[0]) == 5, "Phai tra ve CHI SO (vi tri), khong phai gia tri"

    def test_khong_co_ngoai_lai(self, ex):
        assert len(ex.tim_ngoai_lai_iqr(np.array([10.0, 11.0, 12.0, 13.0]))) == 0

    def test_ngoai_lai_hai_phia(self, ex):
        a = np.array([-500.0, 10.0, 11.0, 12.0, 11.0, 13.0, 500.0])
        kq = list(ex.tim_ngoai_lai_iqr(a))
        assert 0 in kq and 6 in kq, "Phai bat ngoai lai o CA HAI phia"

    def test_nan_khong_phai_ngoai_lai(self, ex):
        a = np.array([10.0, 11.0, np.nan, 12.0, 13.0])
        assert len(ex.tim_ngoai_lai_iqr(a)) == 0

    def test_chi_so_sap_tang_dan(self, ex):
        a = np.array([-500.0, 10.0, 11.0, 12.0, 11.0, 13.0, 500.0])
        kq = list(ex.tim_ngoai_lai_iqr(a))
        assert kq == sorted(kq)


class TestTongTheoNhom:
    def test_tinh_dung(self, ex):
        kq = ex.tong_theo_nhom(
            np.array([10.0, 20.0, 30.0, 40.0]), np.array(["A", "B", "A", "B"])
        )
        assert kq == {"A": 40.0, "B": 60.0}

    def test_mot_nhom(self, ex):
        kq = ex.tong_theo_nhom(np.array([1.0, 2.0]), np.array(["X", "X"]))
        assert kq == {"X": 3.0}

    def test_nhieu_nhom(self, ex):
        kq = ex.tong_theo_nhom(
            np.array([1.0, 2.0, 3.0]), np.array(["A", "B", "C"])
        )
        assert len(kq) == 3


class TestChuanHoaMinMax:
    def test_chuan_hoa_dung(self, ex):
        assert np.allclose(ex.chuan_hoa_minmax(np.array([10.0, 20.0, 30.0])), [0, 0.5, 1])

    def test_nam_trong_0_1(self, ex):
        rng = np.random.default_rng(0)
        kq = ex.chuan_hoa_minmax(rng.normal(100, 30, 50))
        assert kq.min() >= -1e-9 and kq.max() <= 1 + 1e-9

    def test_hang_so(self, ex):
        kq = ex.chuan_hoa_minmax(np.array([5.0, 5.0, 5.0]))
        assert not np.isnan(kq).any(), "Cot hang so bi chia cho 0 -> nan"
        assert np.allclose(kq, 0)

    def test_giu_nan(self, ex):
        kq = ex.chuan_hoa_minmax(np.array([10.0, np.nan, 30.0]))
        assert np.isnan(kq[1]), "nan phai duoc GIU trong ket qua"
        assert abs(kq[0] - 0.0) < 1e-9 and abs(kq[2] - 1.0) < 1e-9
