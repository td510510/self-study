"""Cham diem ex03_collections.py — Phase 01."""

from __future__ import annotations

import pytest

from tests.conftest import bao_chua_lam, nap_module

pytestmark = pytest.mark.phase01


@pytest.fixture(scope="module")
def ex():
    return nap_module("curriculum/01-python-foundations/exercises/ex03_collections.py")


class TestLoaiTrung:
    def test_co_ket_qua(self, ex):
        assert ex.loai_trung([1]) is not None, bao_chua_lam("loai_trung")

    def test_giu_thu_tu(self, ex):
        """Diem mau chot: list(set(x)) se KHONG qua duoc test nay."""
        assert ex.loai_trung([3, 1, 3, 2, 1]) == [3, 1, 2]
        assert ex.loai_trung([5, 4, 3, 2, 1]) == [5, 4, 3, 2, 1]

    def test_chuoi(self, ex):
        assert ex.loai_trung(["a", "b", "a"]) == ["a", "b"]

    def test_rong(self, ex):
        assert ex.loai_trung([]) == []


class TestGopDict:
    def test_khoa_khac_nhau(self, ex):
        assert ex.gop_dict({"a": 1}, {"b": 2}) == {"a": 1, "b": 2}

    def test_trung_khoa_d2_thang(self, ex):
        assert ex.gop_dict({"a": 1}, {"a": 9, "b": 2}) == {"a": 9, "b": 2}

    def test_rong(self, ex):
        assert ex.gop_dict({}, {}) == {}

    def test_khong_sua_dau_vao(self, ex):
        d1, d2 = {"a": 1}, {"a": 9}
        ex.gop_dict(d1, d2)
        assert d1 == {"a": 1}, "Ham da sua d1!"
        assert d2 == {"a": 9}, "Ham da sua d2!"


class TestNhomTheoThanhPho:
    DU_LIEU = [
        {"ten": "An", "thanh_pho": "HN"},
        {"ten": "Binh", "thanh_pho": "HCM"},
        {"ten": "Cuong", "thanh_pho": "HN"},
    ]

    def test_co_ket_qua(self, ex):
        assert ex.nhom_theo_thanh_pho(self.DU_LIEU) is not None, bao_chua_lam(
            "nhom_theo_thanh_pho"
        )

    def test_nhom_dung(self, ex):
        assert ex.nhom_theo_thanh_pho(self.DU_LIEU) == {
            "HN": ["An", "Cuong"],
            "HCM": ["Binh"],
        }

    def test_giu_thu_tu_trong_nhom(self, ex):
        assert ex.nhom_theo_thanh_pho(self.DU_LIEU)["HN"] == ["An", "Cuong"]

    def test_rong(self, ex):
        assert ex.nhom_theo_thanh_pho([]) == {}


class TestTopN:
    DIEM = {"An": 8, "Binh": 9.5, "Cuong": 7}

    def test_co_ket_qua(self, ex):
        assert ex.top_n(self.DIEM, 2) is not None, bao_chua_lam("top_n")

    def test_sap_giam_dan(self, ex):
        assert ex.top_n(self.DIEM, 2) == [("Binh", 9.5), ("An", 8)]

    def test_n_lon_hon_so_phan_tu(self, ex):
        assert ex.top_n({"An": 8}, 5) == [("An", 8)]

    def test_rong(self, ex):
        assert ex.top_n({}, 3) == []

    def test_mac_dinh_la_3(self, ex):
        assert len(ex.top_n({"a": 1, "b": 2, "c": 3, "d": 4})) == 3


class TestSoSanhHaiDanhSach:
    def test_co_ket_qua(self, ex):
        assert ex.so_sanh_hai_danh_sach([1], [1]) is not None, bao_chua_lam(
            "so_sanh_hai_danh_sach"
        )

    def test_day_du(self, ex):
        assert ex.so_sanh_hai_danh_sach([1, 2, 3], [2, 3, 4]) == {
            "chung": [2, 3],
            "chi_a": [1],
            "chi_b": [4],
        }

    def test_khong_giao_nhau(self, ex):
        assert ex.so_sanh_hai_danh_sach([1], [2]) == {
            "chung": [],
            "chi_a": [1],
            "chi_b": [2],
        }

    def test_ket_qua_da_sap_xep(self, ex):
        kq = ex.so_sanh_hai_danh_sach([5, 3, 1], [5, 3, 1])
        assert kq["chung"] == [1, 3, 5], "Ket qua phai duoc sap xep tang dan"


class TestLamPhang:
    def test_co_ket_qua(self, ex):
        assert ex.lam_phang([[1]]) is not None, bao_chua_lam("lam_phang")

    def test_binh_thuong(self, ex):
        assert ex.lam_phang([[1, 2], [3], [4, 5]]) == [1, 2, 3, 4, 5]

    def test_co_list_con_rong(self, ex):
        assert ex.lam_phang([[], [1], []]) == [1]

    def test_rong(self, ex):
        assert ex.lam_phang([]) == []
