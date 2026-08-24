"""Cham diem ex03_van_hanh.py — Phase 10.

KHONG can API key va KHONG dung sleep(): moi thu nhan dong ho lam tham so.
"""

from __future__ import annotations

import pytest

from tests.conftest import bao_chua_lam, nap_module

pytestmark = pytest.mark.phase10


@pytest.fixture(scope="module")
def ex():
    return nap_module("curriculum/10-deploy-ops/exercises/ex03_van_hanh.py")


class DongHo:
    """Dong ho gia lap - test khong phai cho doi that."""

    def __init__(self, bat_dau=0.0):
        self.luc = float(bat_dau)

    def __call__(self):
        return self.luc

    def tien(self, giay):
        self.luc += giay


class TestPhanVi:
    X = [10, 20, 30, 40, 50]

    def test_p50(self, ex):
        kq = ex.phan_vi(self.X, 50)
        assert kq is not None, bao_chua_lam("phan_vi")
        assert kq == 30

    def test_p95(self, ex):
        assert ex.phan_vi(self.X, 95) == 50

    def test_p0(self, ex):
        """ceil(0) = 0 va danh sach[-1] tra ve phan tu CUOI - loi lech mot don vi."""
        assert ex.phan_vi(self.X, 0) == 10

    def test_p100(self, ex):
        assert ex.phan_vi(self.X, 100) == 50

    def test_danh_sach_rong(self, ex):
        assert ex.phan_vi([], 50) == 0.0

    def test_p_ngoai_khoang(self, ex):
        for p in (-1, 101, 1000):
            with pytest.raises(ValueError):
                ex.phan_vi(self.X, p)

    def test_khong_sua_danh_sach_goc(self, ex):
        goc = [50, 10, 30]
        kq = ex.phan_vi(goc, 50)
        assert kq == 30
        assert goc == [50, 10, 30]

    def test_mot_phan_tu(self, ex):
        assert ex.phan_vi([42], 95) == 42

    def test_p95_khong_bang_trung_binh(self, ex):
        """95 request 200ms + 5 request 10 giay: trung binh 690ms, p95 = 10000ms."""
        x = [200] * 95 + [10000] * 5
        assert ex.phan_vi(x, 95) == 200
        assert ex.phan_vi(x, 96) == 10000


class TestBoDem:
    def test_ghi_va_tom_tat(self, ex):
        bd = ex.BoDem()
        assert bd is not None, bao_chua_lam("BoDem.__init__")
        bd.ghi(100, True, 0.001)
        bd.ghi(200, True, 0.002)
        t = bd.tom_tat()
        assert t["so_request"] == 2
        assert t["so_loi"] == 0
        assert t["tong_chi_phi"] == pytest.approx(0.003)

    def test_du_khoa(self, ex):
        bd = ex.BoDem()
        bd.ghi(100, True)
        for khoa in ("so_request", "so_loi", "ty_le_loi", "p50_ms", "p95_ms",
                     "tong_chi_phi", "chi_phi_tb"):
            assert khoa in bd.tom_tat(), f"Thieu khoa {khoa!r}"

    def test_ty_le_loi_tinh_tren_TAT_CA_request(self, ex):
        """Chia cho so loi thay vi so request -> dashboard luon bao 100%."""
        bd = ex.BoDem()
        for _ in range(9):
            bd.ghi(100, True)
        bd.ghi(100, False)
        assert bd.tom_tat()["ty_le_loi"] == pytest.approx(0.1)

    def test_chua_co_request_nao(self, ex):
        t = ex.BoDem().tom_tat()
        assert t["so_request"] == 0
        assert t["ty_le_loi"] == 0.0
        assert t["chi_phi_tb"] == 0.0
        assert t["p95_ms"] == 0.0

    def test_p95_bat_duoc_duoi_dai(self, ex):
        bd = ex.BoDem()
        for _ in range(95):
            bd.ghi(200, True)
        for _ in range(5):
            bd.ghi(10000, True)
        t = bd.tom_tat()
        assert t["p50_ms"] == 200
        assert t["p95_ms"] == 200
        assert t["p95_ms"] < 10000

    def test_chi_phi_mac_dinh_bang_0(self, ex):
        bd = ex.BoDem()
        bd.ghi(100, True)
        assert bd.tom_tat()["tong_chi_phi"] == 0.0

    def test_chi_phi_trung_binh(self, ex):
        bd = ex.BoDem()
        bd.ghi(100, True, 0.004)
        bd.ghi(100, True, 0.006)
        assert bd.tom_tat()["chi_phi_tb"] == pytest.approx(0.005)


class TestSoChiPhi:
    def test_khoi_tao(self, ex):
        so = ex.SoChiPhi(5.0)
        assert so is not None, bao_chua_lam("SoChiPhi.__init__")
        assert so.con_lai() == pytest.approx(5.0)

    def test_ngan_sach_khong_hop_le(self, ex):
        for xau in (0, -1):
            with pytest.raises(ValueError):
                ex.SoChiPhi(xau)

    def test_nguong_canh_bao_khong_hop_le(self, ex):
        for xau in (0, -0.5, 1.5):
            with pytest.raises(ValueError):
                ex.SoChiPhi(5.0, nguong_canh_bao=xau)

    def test_ghi_nhan_va_con_lai(self, ex):
        so = ex.SoChiPhi(1.0)
        so.ghi_nhan(0.3)
        so.ghi_nhan(0.2)
        assert so.con_lai() == pytest.approx(0.5)

    def test_cho_phep_khi_con_ngan_sach(self, ex):
        so = ex.SoChiPhi(1.0)
        so.ghi_nhan(0.9)
        assert so.cho_phep(0.05) is True
        assert so.cho_phep(0.2) is False

    def test_cho_phep_KHONG_ghi_nhan(self, ex):
        """Truoc khi goi ban chi UOC LUONG duoc chi phi."""
        so = ex.SoChiPhi(1.0)
        so.cho_phep(0.5)
        so.cho_phep(0.5)
        assert so.con_lai() == pytest.approx(1.0)

    def test_chi_phi_am_bi_tu_choi(self, ex):
        with pytest.raises(ValueError):
            ex.SoChiPhi(1.0).ghi_nhan(-0.1)

    def test_con_lai_khong_bao_gio_am(self, ex):
        """'Còn lại -0,03 USD' tren dashboard lam nguoi doc mat 5 phut."""
        so = ex.SoChiPhi(1.0)
        so.ghi_nhan(1.5)
        assert so.con_lai() == 0.0

    def test_canh_bao_theo_nguong(self, ex):
        so = ex.SoChiPhi(1.0, nguong_canh_bao=0.8)
        so.ghi_nhan(0.75)
        assert so.trang_thai()["can_canh_bao"] is False
        so.ghi_nhan(0.10)
        assert so.trang_thai()["can_canh_bao"] is True

    def test_du_khoa_trang_thai(self, ex):
        t = ex.SoChiPhi(1.0).trang_thai()
        for khoa in ("da_dung", "con_lai", "ty_le", "can_canh_bao"):
            assert khoa in t, f"Thieu khoa {khoa!r}"

    def test_ty_le_co_the_vuot_1(self, ex):
        so = ex.SoChiPhi(1.0)
        so.ghi_nhan(1.5)
        assert so.trang_thai()["ty_le"] == pytest.approx(1.5)


class TestGioiHanTanSuat:
    def test_bat_dau_voi_xo_day(self, ex):
        dh = DongHo()
        gh = ex.GioiHanTanSuat(3, 1.0, dh)
        assert gh is not None, bao_chua_lam("GioiHanTanSuat.__init__")
        assert [gh.cho_phep() for _ in range(3)] == [True, True, True]

    def test_het_token_thi_tu_choi(self, ex):
        dh = DongHo()
        gh = ex.GioiHanTanSuat(2, 1.0, dh)
        gh.cho_phep()
        gh.cho_phep()
        assert gh.cho_phep() is False

    def test_nap_lai_theo_thoi_gian(self, ex):
        dh = DongHo()
        gh = ex.GioiHanTanSuat(2, 1.0, dh)
        gh.cho_phep()
        gh.cho_phep()
        assert gh.cho_phep() is False
        dh.tien(1.0)
        assert gh.cho_phep() is True

    def test_khong_vuot_qua_suc_chua(self, ex):
        """Nghi 1 tieng khong cho phep ban gui 3600 request cung luc."""
        dh = DongHo()
        gh = ex.GioiHanTanSuat(3, 1.0, dh)
        dh.tien(3600)
        assert [gh.cho_phep() for _ in range(5)] == [True, True, True, False, False]

    def test_tu_choi_thi_KHONG_tru_token(self, ex):
        """Tru 'mot phan' khien ke goi lien tuc giu xo o muc 0 vinh vien."""
        dh = DongHo()
        gh = ex.GioiHanTanSuat(2, 1.0, dh)
        gh.cho_phep(2)
        for _ in range(10):
            gh.cho_phep()
        dh.tien(1.0)
        assert gh.cho_phep() is True

    def test_tieu_nhieu_token(self, ex):
        dh = DongHo()
        gh = ex.GioiHanTanSuat(10, 1.0, dh)
        assert gh.cho_phep(7) is True
        assert gh.cho_phep(5) is False
        assert gh.cho_phep(3) is True

    def test_tham_so_khong_hop_le(self, ex):
        with pytest.raises(ValueError):
            ex.GioiHanTanSuat(0, 1.0)
        with pytest.raises(ValueError):
            ex.GioiHanTanSuat(5, 0)

    def test_dong_ho_mac_dinh(self, ex):
        """ham_gio la None -> dung time.monotonic, van phai chay duoc."""
        gh = ex.GioiHanTanSuat(2, 1.0)
        assert gh.cho_phep() is True


class TestNgatMach:
    def test_bat_dau_o_trang_thai_dong(self, ex):
        nm = ex.NgatMach(2, 10.0, DongHo())
        assert nm is not None, bao_chua_lam("NgatMach.__init__")
        assert nm.trang_thai == "dong"
        assert nm.cho_goi() is True

    def test_du_nguong_thi_mo(self, ex):
        nm = ex.NgatMach(2, 10.0, DongHo())
        nm.ghi_that_bai()
        assert nm.trang_thai == "dong"
        nm.ghi_that_bai()
        assert nm.trang_thai == "mo"
        assert nm.cho_goi() is False

    def test_thanh_cong_dat_lai_bo_dem(self, ex):
        """Phai la loi LIEN TIEP - mot lan thanh cong xen vao thi dem lai."""
        nm = ex.NgatMach(3, 10.0, DongHo())
        nm.ghi_that_bai()
        nm.ghi_that_bai()
        nm.ghi_thanh_cong()
        nm.ghi_that_bai()
        nm.ghi_that_bai()
        assert nm.trang_thai == "dong"

    def test_het_thoi_gian_cho_thi_thu_lai(self, ex):
        dh = DongHo()
        nm = ex.NgatMach(1, 10.0, dh)
        nm.ghi_that_bai()
        assert nm.trang_thai == "mo"
        dh.tien(10.0)
        assert nm.trang_thai == "thu_lai"
        assert nm.cho_goi() is True

    def test_thu_lai_thanh_cong_thi_dong(self, ex):
        dh = DongHo()
        nm = ex.NgatMach(1, 10.0, dh)
        nm.ghi_that_bai()
        dh.tien(11.0)
        nm.ghi_thanh_cong()
        assert nm.trang_thai == "dong"

    def test_thu_lai_that_bai_thi_mo_NGAY(self, ex):
        """Mot lan thu that bai la bang chung du de noi dich vu chua hoi phuc."""
        dh = DongHo()
        nm = ex.NgatMach(3, 10.0, dh)
        for _ in range(3):
            nm.ghi_that_bai()
        dh.tien(11.0)
        assert nm.trang_thai == "thu_lai"
        nm.ghi_that_bai()
        assert nm.trang_thai == "mo"

    def test_thu_lai_that_bai_dem_lai_thoi_gian_cho(self, ex):
        dh = DongHo()
        nm = ex.NgatMach(1, 10.0, dh)
        nm.ghi_that_bai()
        dh.tien(11.0)
        nm.ghi_that_bai()
        dh.tien(5.0)
        assert nm.trang_thai == "mo"
        dh.tien(6.0)
        assert nm.trang_thai == "thu_lai"

    def test_tham_so_khong_hop_le(self, ex):
        with pytest.raises(ValueError):
            ex.NgatMach(0, 10.0)
        with pytest.raises(ValueError):
            ex.NgatMach(3, 0)

    def test_dong_ho_mac_dinh(self, ex):
        nm = ex.NgatMach(2, 10.0)
        assert nm.trang_thai == "dong"


class TestTaoBanGhiTrace:
    def test_ban_ghi_co_cau_truc(self, ex):
        kq = ex.tao_ban_ghi_trace("abc123", "goi_model", do_tre_ms=210)
        assert kq is not None, bao_chua_lam("tao_ban_ghi_trace")
        assert kq == {"trace_id": "abc123", "su_kien": "goi_model", "do_tre_ms": 210}

    def test_khong_co_truong_them(self, ex):
        assert ex.tao_ban_ghi_trace("abc", "bat_dau") == {"trace_id": "abc",
                                                          "su_kien": "bat_dau"}

    def test_trace_id_rong(self, ex):
        for xau in ("", "   "):
            with pytest.raises(ValueError):
                ex.tao_ban_ghi_trace(xau, "x")

    def test_su_kien_rong(self, ex):
        with pytest.raises(ValueError):
            ex.tao_ban_ghi_trace("abc", "")

    def test_khong_cho_ghi_de_trace_id(self, ex):
        """Ghi de tao ra ban ghi co trace_id khac request that - khong noi lai duoc."""
        with pytest.raises(ValueError):
            ex.tao_ban_ghi_trace("abc", "x", trace_id="gia")

    def test_khong_cho_ghi_de_su_kien(self, ex):
        with pytest.raises(ValueError):
            ex.tao_ban_ghi_trace("abc", "x", su_kien="gia")

    def test_nhieu_truong_them(self, ex):
        kq = ex.tao_ban_ghi_trace("abc", "xong", do_tre_ms=210, chi_phi=0.001,
                                  model="claude-haiku-4-5")
        assert kq["chi_phi"] == 0.001
        assert kq["model"] == "claude-haiku-4-5"
