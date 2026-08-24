"""Cham diem bai tap ex01_first_program.py (Phase 00).

Chay:
    pytest tests/phase00 -v

Doc ket qua:
    PASSED  = dung
    FAILED  = sai, doc dong "assert ..." de biet ky vong la gi
"""

from __future__ import annotations

import pytest

from tests.conftest import bao_chua_lam, nap_module

BAI_TAP = "curriculum/00-setup/exercises/ex01_first_program.py"


@pytest.fixture(scope="module")
def ex():
    return nap_module(BAI_TAP)


pytestmark = pytest.mark.phase00


# ---------------------------------------------------------------------------
class TestChao:
    def test_chao_co_ket_qua(self, ex):
        assert ex.chao("Nam") is not None, bao_chua_lam("chao")

    def test_chao_dung_dinh_dang(self, ex):
        assert ex.chao("Nam") == "Xin chao, Nam!"
        assert ex.chao("An") == "Xin chao, An!"

    def test_chao_voi_ten_dai(self, ex):
        assert ex.chao("Nguyen Van A") == "Xin chao, Nguyen Van A!"


# ---------------------------------------------------------------------------
class TestTongGioHoc:
    def test_co_ket_qua(self, ex):
        assert ex.tong_gio_hoc(22, 12) is not None, bao_chua_lam("tong_gio_hoc")

    def test_tinh_dung(self, ex):
        assert ex.tong_gio_hoc(22, 12) == 264
        assert ex.tong_gio_hoc(4, 10) == 40
        assert ex.tong_gio_hoc(1, 1) == 1

    def test_truong_hop_khong(self, ex):
        assert ex.tong_gio_hoc(0, 12) == 0


# ---------------------------------------------------------------------------
class TestDoiPhut:
    def test_co_ket_qua(self, ex):
        assert ex.doi_phut(130) is not None, bao_chua_lam("doi_phut")

    def test_gio_va_phut(self, ex):
        assert ex.doi_phut(130) == "2h 10m"
        assert ex.doi_phut(95) == "1h 35m"

    def test_tron_gio(self, ex):
        assert ex.doi_phut(60) == "1h 0m"
        assert ex.doi_phut(120) == "2h 0m"

    def test_duoi_mot_gio(self, ex):
        assert ex.doi_phut(45) == "0h 45m"
        assert ex.doi_phut(0) == "0h 0m"


# ---------------------------------------------------------------------------
class TestXepLoai:
    def test_co_ket_qua(self, ex):
        assert ex.xep_loai(8.0) is not None, bao_chua_lam("xep_loai")

    def test_gioi(self, ex):
        assert ex.xep_loai(10) == "Gioi"
        assert ex.xep_loai(9.0) == "Gioi"

    def test_kha(self, ex):
        assert ex.xep_loai(8.9) == "Kha"
        assert ex.xep_loai(8.0) == "Kha"

    def test_trung_binh(self, ex):
        assert ex.xep_loai(7.9) == "Trung binh"
        assert ex.xep_loai(6.5) == "Trung binh"

    def test_yeu(self, ex):
        assert ex.xep_loai(6.4) == "Yeu"
        assert ex.xep_loai(0) == "Yeu"

    def test_diem_bien(self, ex):
        """Diem nam dung ranh gioi - cho hay sai nhat."""
        assert ex.xep_loai(9.0) == "Gioi", "diem 9.0 phai la Gioi, khong phai Kha"
        assert ex.xep_loai(8.0) == "Kha", "diem 8.0 phai la Kha"
        assert ex.xep_loai(6.5) == "Trung binh", "diem 6.5 phai la Trung binh"


# ---------------------------------------------------------------------------
class TestChiaAnToan:
    def test_co_ket_qua(self, ex):
        assert ex.chia_an_toan(10, 2) is not None, bao_chua_lam("chia_an_toan")

    def test_chia_binh_thuong(self, ex):
        assert ex.chia_an_toan(10, 2) == 5.0
        assert ex.chia_an_toan(7, 2) == 3.5

    def test_chia_cho_khong(self, ex):
        assert ex.chia_an_toan(10, 0) is None, "chia cho 0 phai tra ve None"

    def test_khong_gay_loi(self, ex):
        """Ham phai tra ve None chu KHONG duoc nem ZeroDivisionError."""
        assert ex.chia_an_toan(10, 2) is not None, bao_chua_lam("chia_an_toan")
        try:
            ket_qua = ex.chia_an_toan(5, 0)
        except ZeroDivisionError:
            pytest.fail(
                "Ham van nem ZeroDivisionError. "
                "Yeu cau la BAT truong hop nay va tra ve None."
            )
        assert ket_qua is None

    def test_tu_so_bang_khong(self, ex):
        assert ex.chia_an_toan(0, 5) == 0.0


# ---------------------------------------------------------------------------
class TestPhanTram:
    def test_co_ket_qua(self, ex):
        assert ex.phan_tram_hoan_thanh(11) is not None, bao_chua_lam("phan_tram_hoan_thanh")

    def test_dinh_dang(self, ex):
        assert ex.phan_tram_hoan_thanh(11) == "50.0%"
        assert ex.phan_tram_hoan_thanh(0) == "0.0%"
        assert ex.phan_tram_hoan_thanh(22) == "100.0%"

    def test_tham_so_mac_dinh(self, ex):
        """Goi voi mot doi so phai dung mac dinh 22 tuan."""
        ket_qua = ex.phan_tram_hoan_thanh(11)
        assert ket_qua is not None, bao_chua_lam("phan_tram_hoan_thanh")
        assert ket_qua == ex.phan_tram_hoan_thanh(11, 22)

    def test_ghi_de_tham_so(self, ex):
        assert ex.phan_tram_hoan_thanh(3, 10) == "30.0%"
        assert ex.phan_tram_hoan_thanh(1, 3) == "33.3%"
