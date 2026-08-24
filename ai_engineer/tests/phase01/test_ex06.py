"""Cham diem ex06_oop.py — Phase 01."""

from __future__ import annotations

import pytest

from tests.conftest import nap_module

pytestmark = pytest.mark.phase01


@pytest.fixture(scope="module")
def ex():
    return nap_module("curriculum/01-python-foundations/exercises/ex06_oop.py")


class TestLoiRieng:
    def test_la_exception(self, ex):
        assert issubclass(ex.LoiSoDuKhongDu, Exception)

    def test_nem_duoc(self, ex):
        with pytest.raises(ex.LoiSoDuKhongDu):
            raise ex.LoiSoDuKhongDu("thu")


class TestTaiKhoan:
    def test_khoi_tao(self, ex):
        tk = ex.TaiKhoan("An", 1000)
        assert tk.chu_tai_khoan == "An"
        assert tk.so_du == 1000
        assert tk.lich_su == []

    def test_so_du_mac_dinh(self, ex):
        assert ex.TaiKhoan("An").so_du == 0

    def test_so_du_ban_dau_am(self, ex):
        with pytest.raises(ValueError):
            ex.TaiKhoan("An", -100)

    def test_nap(self, ex):
        tk = ex.TaiKhoan("An", 1000)
        tk.nap(500)
        assert tk.so_du == 1500
        assert tk.lich_su == [("nap", 500)]

    def test_nap_so_am(self, ex):
        tk = ex.TaiKhoan("An", 1000)
        with pytest.raises(ValueError):
            tk.nap(-100)
        with pytest.raises(ValueError):
            tk.nap(0)

    def test_rut(self, ex):
        tk = ex.TaiKhoan("An", 1000)
        tk.rut(300)
        assert tk.so_du == 700
        assert tk.lich_su == [("rut", 300)]

    def test_rut_qua_so_du(self, ex):
        tk = ex.TaiKhoan("An", 1000)
        with pytest.raises(ex.LoiSoDuKhongDu):
            tk.rut(99999)

    def test_rut_that_bai_khong_doi_so_du(self, ex):
        """Kiem tra dieu kien TRUOC khi thay doi du lieu."""
        tk = ex.TaiKhoan("An", 1000)
        with pytest.raises(ex.LoiSoDuKhongDu):
            tk.rut(99999)
        assert tk.so_du == 1000, "Rut that bai ma so du van bi thay doi!"
        assert tk.lich_su == [], "Rut that bai ma van ghi vao lich su!"

    def test_rut_dung_bang_so_du(self, ex):
        tk = ex.TaiKhoan("An", 1000)
        tk.rut(1000)
        assert tk.so_du == 0

    def test_lich_su_nhieu_giao_dich(self, ex):
        tk = ex.TaiKhoan("An", 1000)
        tk.nap(500)
        tk.rut(200)
        assert tk.lich_su == [("nap", 500), ("rut", 200)]

    def test_str(self, ex):
        tk = ex.TaiKhoan("An", 1300)
        assert str(tk) == "TaiKhoan(An, so du 1,300 VND)"


class TestHocVien:
    def test_khoi_tao(self, ex):
        hv = ex.HocVien("An")
        assert hv.ten == "An"
        assert hv.diem == []

    def test_moi_hoc_vien_co_list_rieng(self, ex):
        """Bay mutable default - phai dung field(default_factory=list)."""
        a = ex.HocVien("A")
        b = ex.HocVien("B")
        a.them_diem(8)
        assert b.diem == [], (
            "Hai hoc vien dang dung chung mot list diem! "
            "Phai dung field(default_factory=list)"
        )

    def test_them_diem(self, ex):
        hv = ex.HocVien("An")
        hv.them_diem(8)
        hv.them_diem(9)
        assert hv.diem == [8, 9]

    def test_diem_khong_hop_le(self, ex):
        hv = ex.HocVien("An")
        with pytest.raises(ValueError):
            hv.them_diem(11)
        with pytest.raises(ValueError):
            hv.them_diem(-1)

    def test_diem_bien_hop_le(self, ex):
        hv = ex.HocVien("An")
        hv.them_diem(0)
        hv.them_diem(10)
        assert hv.diem == [0, 10]

    def test_trung_binh(self, ex):
        hv = ex.HocVien("An")
        hv.them_diem(8)
        hv.them_diem(9)
        assert hv.diem_trung_binh() == 8.5

    def test_trung_binh_khi_chua_co_diem(self, ex):
        assert ex.HocVien("An").diem_trung_binh() == 0.0

    @pytest.mark.parametrize(
        ("cac_diem", "mong_doi"),
        [
            ([9, 10], "Gioi"),
            ([8, 9], "Kha"),
            ([7, 7], "Trung binh"),
            ([5, 5], "Yeu"),
            ([9, 9], "Gioi"),
            ([8, 8], "Kha"),
        ],
    )
    def test_xep_loai(self, ex, cac_diem, mong_doi):
        hv = ex.HocVien("An")
        for d in cac_diem:
            hv.them_diem(d)
        assert hv.xep_loai() == mong_doi


class TestChuyenTien:
    def test_thanh_cong(self, ex):
        a = ex.TaiKhoan("A", 1000)
        b = ex.TaiKhoan("B", 0)
        assert ex.chuyen_tien(a, b, 500) is True
        assert a.so_du == 500
        assert b.so_du == 500

    def test_that_bai_khong_du_so_du(self, ex):
        a = ex.TaiKhoan("A", 100)
        b = ex.TaiKhoan("B", 0)
        assert ex.chuyen_tien(a, b, 99999) is False

    def test_that_bai_khong_lam_doi_so_du(self, ex):
        """QUAN TRONG: that bai thi KHONG duoc tu nhien sinh ra tien."""
        a = ex.TaiKhoan("A", 100)
        b = ex.TaiKhoan("B", 50)
        ex.chuyen_tien(a, b, 99999)
        assert a.so_du == 100, "Tai khoan nguon bi thay doi du chuyen that bai"
        assert b.so_du == 50, (
            "Tai khoan dich duoc cong tien du chuyen that bai! "
            "Phai rut TRUOC, nap SAU."
        )

    def test_so_tien_am(self, ex):
        a = ex.TaiKhoan("A", 1000)
        b = ex.TaiKhoan("B", 0)
        assert ex.chuyen_tien(a, b, -100) is False
        assert (a.so_du, b.so_du) == (1000, 0)

    def test_khong_de_loi_thoat_ra(self, ex):
        """Ham phai tra ve False chu khong duoc nem ngoai le."""
        a = ex.TaiKhoan("A", 10)
        b = ex.TaiKhoan("B", 0)
        try:
            kq = ex.chuyen_tien(a, b, 999)
        except Exception as e:  # noqa: BLE001
            pytest.fail(f"Ham de ngoai le thoat ra ngoai: {type(e).__name__}")
        assert kq is False
