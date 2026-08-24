"""Cham diem ex01_co_ban.py — Phase 01."""

from __future__ import annotations

import pytest

from tests.conftest import bao_chua_lam, nap_module

pytestmark = pytest.mark.phase01


@pytest.fixture(scope="module")
def ex():
    return nap_module("curriculum/01-python-foundations/exercises/ex01_co_ban.py")


class TestDinhDangTien:
    def test_co_ket_qua(self, ex):
        assert ex.dinh_dang_tien(1000) is not None, bao_chua_lam("dinh_dang_tien")

    def test_phan_cach_hang_nghin(self, ex):
        assert ex.dinh_dang_tien(1234567) == "1,234,567 VND"
        assert ex.dinh_dang_tien(1000) == "1,000 VND"

    def test_so_nho(self, ex):
        assert ex.dinh_dang_tien(0) == "0 VND"
        assert ex.dinh_dang_tien(999) == "999 VND"

    def test_lam_tron(self, ex):
        assert ex.dinh_dang_tien(1000.6) == "1,001 VND"


class TestChuanHoaTen:
    def test_co_ket_qua(self, ex):
        assert ex.chuan_hoa_ten("a") is not None, bao_chua_lam("chuan_hoa_ten")

    def test_viet_hoa(self, ex):
        assert ex.chuan_hoa_ten("nguyen van nam") == "Nguyen Van Nam"
        assert ex.chuan_hoa_ten("TRAN THI B") == "Tran Thi B"

    def test_bo_khoang_trang_thua(self, ex):
        assert ex.chuan_hoa_ten("  nguyen van nam  ") == "Nguyen Van Nam"
        assert ex.chuan_hoa_ten("le  van   c") == "Le Van C"

    def test_mot_tu(self, ex):
        assert ex.chuan_hoa_ten("nam") == "Nam"


class TestTachHoTen:
    def test_co_ket_qua(self, ex):
        assert ex.tach_ho_ten("A B") is not None, bao_chua_lam("tach_ho_ten")

    def test_ba_tu(self, ex):
        assert ex.tach_ho_ten("Nguyen Van Nam") == ("Nguyen Van", "Nam")

    def test_hai_tu(self, ex):
        assert ex.tach_ho_ten("Tran An") == ("Tran", "An")

    def test_mot_tu(self, ex):
        assert ex.tach_ho_ten("Nam") == ("", "Nam")

    def test_tra_ve_tuple(self, ex):
        assert isinstance(ex.tach_ho_ten("Tran An"), tuple), "Phai tra ve tuple"


class TestEmailHopLe:
    def test_co_ket_qua(self, ex):
        assert ex.email_hop_le("a@b.com") is not None, bao_chua_lam("email_hop_le")

    def test_email_dung(self, ex):
        assert ex.email_hop_le("a@b.com") is True
        assert ex.email_hop_le("a.b@c.co.uk") is True
        assert ex.email_hop_le("nguyen.van.a@gmail.com") is True

    def test_thieu_at(self, ex):
        assert ex.email_hop_le("ab.com") is False

    def test_nhieu_at(self, ex):
        assert ex.email_hop_le("a@b@c.com") is False

    def test_truoc_at_rong(self, ex):
        assert ex.email_hop_le("@b.com") is False

    def test_sau_at_khong_co_cham(self, ex):
        assert ex.email_hop_le("a@bcom") is False

    def test_duoi_rong(self, ex):
        assert ex.email_hop_le("a@b.") is False


class TestRutGon:
    def test_co_ket_qua(self, ex):
        assert ex.rut_gon("abc") is not None, bao_chua_lam("rut_gon")

    def test_khong_can_cat(self, ex):
        assert ex.rut_gon("Xin chao", 50) == "Xin chao"
        assert ex.rut_gon("abcdefghij", 10) == "abcdefghij"

    def test_co_cat(self, ex):
        assert ex.rut_gon("Xin chao cac ban", 8) == "Xin c..."

    def test_khong_vuot_gioi_han(self, ex):
        """Loi hay gap: ket qua dai hon gioi han 3 ky tu."""
        for gioi_han in (5, 8, 10, 20):
            kq = ex.rut_gon("a" * 100, gioi_han)
            assert len(kq) <= gioi_han, f"Ket qua dai {len(kq)} > gioi han {gioi_han}"


class TestDemTu:
    def test_co_ket_qua(self, ex):
        assert ex.dem_tu("a") is not None, bao_chua_lam("dem_tu")

    def test_binh_thuong(self, ex):
        assert ex.dem_tu("Xin chao cac ban") == 4
        assert ex.dem_tu("mot") == 1

    def test_khoang_trang_thua(self, ex):
        assert ex.dem_tu("  nhieu   khoang  ") == 2

    def test_chuoi_rong(self, ex):
        assert ex.dem_tu("") == 0
        assert ex.dem_tu("   ") == 0
