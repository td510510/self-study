"""Cham diem ex02_dieu_kien_vong_lap.py — Phase 01."""

from __future__ import annotations

import pytest

from tests.conftest import bao_chua_lam, nap_module

pytestmark = pytest.mark.phase01


@pytest.fixture(scope="module")
def ex():
    return nap_module("curriculum/01-python-foundations/exercises/ex02_dieu_kien_vong_lap.py")


class TestPhanLoaiBMI:
    def test_co_ket_qua(self, ex):
        assert ex.phan_loai_bmi(60, 1.7) is not None, bao_chua_lam("phan_loai_bmi")

    def test_cac_muc(self, ex):
        assert ex.phan_loai_bmi(45, 1.70) == "Thieu can"
        assert ex.phan_loai_bmi(60, 1.70) == "Binh thuong"
        assert ex.phan_loai_bmi(80, 1.70) == "Thua can"
        assert ex.phan_loai_bmi(95, 1.70) == "Beo phi"

    def test_bien(self, ex):
        """BMI dung 18.5 va dung 25 - cho hay sai nhat."""
        # can_nang sao cho BMI = 18.5 voi chieu cao 2m -> 18.5 * 4 = 74
        assert ex.phan_loai_bmi(74, 2.0) == "Binh thuong"
        # BMI = 25 voi chieu cao 2m -> 100
        assert ex.phan_loai_bmi(100, 2.0) == "Thua can"
        # BMI = 30 -> 120
        assert ex.phan_loai_bmi(120, 2.0) == "Beo phi"


class TestTienDien:
    def test_co_ket_qua(self, ex):
        assert ex.tien_dien(10) is not None, bao_chua_lam("tien_dien")

    def test_bac_1(self, ex):
        assert ex.tien_dien(0) == 0
        assert ex.tien_dien(30) == 54_000
        assert ex.tien_dien(50) == 90_000

    def test_bac_2(self, ex):
        assert ex.tien_dien(80) == 150_000
        assert ex.tien_dien(100) == 190_000

    def test_bac_3(self, ex):
        assert ex.tien_dien(150) == 315_000
        assert ex.tien_dien(101) == 192_500


class TestLocSoDuong:
    def test_loc_dung(self, ex):
        assert ex.loc_so_duong([1, -2, 3, 0, -5]) == [1, 3]

    def test_rong(self, ex):
        assert ex.loc_so_duong([]) == []
        assert ex.loc_so_duong([-1, -2]) == []

    def test_so_khong_bi_loai(self, ex):
        assert ex.loc_so_duong([0]) == []

    def test_khong_sua_list_goc(self, ex):
        goc = [1, -2, 3]
        ex.loc_so_duong(goc)
        assert goc == [1, -2, 3], "Ham da sua list goc!"


class TestLonThuHai:
    def test_binh_thuong(self, ex):
        assert ex.lon_thu_hai([3, 1, 4, 1, 5]) == 4

    def test_bo_qua_trung(self, ex):
        assert ex.lon_thu_hai([5, 5, 3]) == 3

    def test_khong_co(self, ex):
        assert ex.lon_thu_hai([7]) is None
        assert ex.lon_thu_hai([5, 5, 5]) is None
        assert ex.lon_thu_hai([]) is None

    def test_so_am(self, ex):
        assert ex.lon_thu_hai([-1, -5, -3]) == -3


class TestFibonacci:
    def test_cac_truong_hop_dau(self, ex):
        assert ex.fibonacci(0) == []
        assert ex.fibonacci(1) == [0]
        assert ex.fibonacci(2) == [0, 1]

    def test_day_dai(self, ex):
        assert ex.fibonacci(7) == [0, 1, 1, 2, 3, 5, 8]
        assert ex.fibonacci(10) == [0, 1, 1, 2, 3, 5, 8, 13, 21, 34]


class TestDemKyTu:
    def test_co_ket_qua(self, ex):
        assert ex.dem_ky_tu("a") is not None, bao_chua_lam("dem_ky_tu")

    def test_dem_dung(self, ex):
        assert ex.dem_ky_tu("aba") == {"a": 2, "b": 1}

    def test_khong_phan_biet_hoa_thuong(self, ex):
        assert ex.dem_ky_tu("Hi hi") == {"h": 2, "i": 2}

    def test_bo_khoang_trang(self, ex):
        assert " " not in ex.dem_ky_tu("a b c")

    def test_rong(self, ex):
        assert ex.dem_ky_tu("") == {}
        assert ex.dem_ky_tu("   ") == {}
