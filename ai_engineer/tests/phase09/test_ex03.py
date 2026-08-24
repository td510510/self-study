"""Cham diem ex03_guardrails.py — Phase 09. KHONG can API key."""

from __future__ import annotations

import sys
from pathlib import Path

import pytest

from tests.conftest import bao_chua_lam, nap_module

pytestmark = pytest.mark.phase09

GOC = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(GOC / "curriculum" / "09-agents"))

from the_gioi import TheGioi  # noqa: E402


@pytest.fixture(scope="module")
def ex():
    return nap_module("curriculum/09-agents/exercises/ex03_guardrails.py")


@pytest.fixture
def tg():
    return TheGioi()


@pytest.fixture
def sdk(tg):
    return {
        "tra_cuu_don": tg.tra_cuu_don,
        "tra_cuu_kho": tg.tra_cuu_kho,
        "liet_ke_don": tg.liet_ke_don,
        "cap_nhat_trang_thai": tg.cap_nhat_trang_thai,
        "huy_don": tg.huy_don,
        "dat_hang_bo_sung": tg.dat_hang_bo_sung,
        "gui_email": tg.gui_email,
    }


class TestKiemTraThamSo:
    def test_ma_don_hop_le(self, ex):
        kq = ex.kiem_tra_tham_so("huy_don", {"ma_don": "DH1002"})
        assert kq is not None, bao_chua_lam("kiem_tra_tham_so")
        assert kq["ok"] is True

    def test_ma_don_sai_dinh_dang(self, ex):
        for xau in ("XX", "DH12", "1002", "dh1002", ""):
            assert ex.kiem_tra_tham_so("huy_don", {"ma_don": xau})["ok"] is False

    def test_thieu_ma_don(self, ex):
        assert ex.kiem_tra_tham_so("tra_cuu_don", {})["ok"] is False

    def test_loi_neu_ro_ten_tham_so(self, ex):
        """Nguoi doc thong bao nay la MODEL o vong sau - no can biet sua gi."""
        assert "ma_don" in ex.kiem_tra_tham_so("huy_don", {"ma_don": "X"})["loi"]

    def test_ma_hang_hop_le(self, ex):
        assert ex.kiem_tra_tham_so("tra_cuu_kho", {"ma_hang": "VX-BAN-01"})["ok"] is True

    def test_ma_hang_sai(self, ex):
        for xau in ("BAN-01", "VX-BAN-1", "vx-ban-01", 123):
            assert ex.kiem_tra_tham_so("tra_cuu_kho", {"ma_hang": xau})["ok"] is False

    def test_so_luong_hop_le(self, ex):
        kq = ex.kiem_tra_tham_so("dat_hang_bo_sung",
                                 {"ma_hang": "VX-DEN-03", "so_luong": 50})
        assert kq["ok"] is True

    def test_so_luong_vo_ly(self, ex):
        """10000 mon hang vi model doc nham mot con so - day la TIEN THAT."""
        kq = ex.kiem_tra_tham_so("dat_hang_bo_sung",
                                 {"ma_hang": "VX-DEN-03", "so_luong": 10000})
        assert kq["ok"] is False
        assert "10000" in kq["loi"]

    def test_so_luong_bang_0_va_am(self, ex):
        for sl in (0, -5):
            kq = ex.kiem_tra_tham_so("dat_hang_bo_sung",
                                     {"ma_hang": "VX-DEN-03", "so_luong": sl})
            assert kq["ok"] is False

    def test_so_luong_la_bool_bi_tu_choi(self, ex):
        """isinstance(True, int) la True - quen loai bool thi True thanh so 1."""
        kq = ex.kiem_tra_tham_so("dat_hang_bo_sung",
                                 {"ma_hang": "VX-DEN-03", "so_luong": True})
        assert kq["ok"] is False

    def test_so_luong_khong_phai_so(self, ex):
        for sl in ("50", 5.5, None):
            kq = ex.kiem_tra_tham_so("dat_hang_bo_sung",
                                     {"ma_hang": "VX-DEN-03", "so_luong": sl})
            assert kq["ok"] is False, f"lot qua: {sl!r}"

    def test_email_hop_le(self, ex):
        kq = ex.kiem_tra_tham_so("gui_email", {"dia_chi": "a@b.com",
                                               "tieu_de": "x", "noi_dung": "y"})
        assert kq["ok"] is True

    def test_email_sai_dia_chi(self, ex):
        kq = ex.kiem_tra_tham_so("gui_email", {"dia_chi": "khong-co-a-cong",
                                               "noi_dung": "y"})
        assert kq["ok"] is False

    def test_email_noi_dung_rong(self, ex):
        kq = ex.kiem_tra_tham_so("gui_email", {"dia_chi": "a@b.com", "noi_dung": "   "})
        assert kq["ok"] is False

    def test_cong_cu_khong_co_quy_tac(self, ex):
        assert ex.kiem_tra_tham_so("liet_ke_don", {})["ok"] is True


class TestBoKiemSoat:
    def test_chay_duoc_cong_cu_binh_thuong(self, ex, sdk):
        bks = ex.BoKiemSoat(sdk, ex.CHINH_SACH_BINH_THUONG)
        kq = bks.thuc_thi("tra_cuu_don", {"ma_don": "DH1001"})
        assert kq is not None, bao_chua_lam("BoKiemSoat.thuc_thi")
        assert kq["ok"] is True

    def test_chan_theo_quyen(self, ex, sdk, tg):
        bks = ex.BoKiemSoat(sdk, ex.CHINH_SACH_CHI_DOC)
        kq = bks.thuc_thi("huy_don", {"ma_don": "DH1002"})
        assert kq["ok"] is False
        assert tg.don_hang["DH1002"]["trang_thai"] == "dang_xu_ly"

    def test_ghi_nhat_ky_chan(self, ex, sdk):
        bks = ex.BoKiemSoat(sdk, ex.CHINH_SACH_CHI_DOC)
        bks.thuc_thi("huy_don", {"ma_don": "DH1002"})
        assert len(bks.nhat_ky_chan) == 1
        assert bks.nhat_ky_chan[0]["ly_do"] == "quyen"

    def test_chan_tham_so_sai(self, ex, sdk, tg):
        bks = ex.BoKiemSoat(sdk, ex.CHINH_SACH_BINH_THUONG, lambda t, ts: True)
        kq = bks.thuc_thi("dat_hang_bo_sung",
                          {"ma_hang": "VX-DEN-03", "so_luong": 99999})
        assert kq["ok"] is False
        assert tg.kho["VX-DEN-03"]["ton"] == 0
        assert bks.nhat_ky_chan[0]["ly_do"] == "tham_so"

    def test_quyen_duoc_kiem_TRUOC_tham_so(self, ex, sdk):
        """Khong tiet lo dinh dang tham so cua cong cu nguoi goi khong duoc dung."""
        bks = ex.BoKiemSoat(sdk, ex.CHINH_SACH_CHI_DOC)
        bks.thuc_thi("huy_don", {"ma_don": "SAI_HET"})
        assert bks.nhat_ky_chan[0]["ly_do"] == "quyen"

    def test_hoi_xac_nhan_va_nguoi_dong_y(self, ex, sdk, tg):
        bks = ex.BoKiemSoat(sdk, ex.CHINH_SACH_BINH_THUONG, lambda t, ts: True)
        assert bks.thuc_thi("huy_don", {"ma_don": "DH1002"})["ok"] is True
        assert tg.don_hang["DH1002"]["trang_thai"] == "da_huy"

    def test_nguoi_tu_choi_thi_khong_chay(self, ex, sdk, tg):
        bks = ex.BoKiemSoat(sdk, ex.CHINH_SACH_BINH_THUONG, lambda t, ts: False)
        kq = bks.thuc_thi("huy_don", {"ma_don": "DH1002"})
        assert kq["ok"] is False
        assert tg.don_hang["DH1002"]["trang_thai"] == "dang_xu_ly"
        assert bks.nhat_ky_chan[0]["ly_do"] == "xac_nhan"

    def test_khong_co_ham_xac_nhan_thi_TU_CHOI(self, ex, sdk, tg):
        """Mac dinh phai an toan: quen cau hinh thi agent khong lam gi."""
        bks = ex.BoKiemSoat(sdk, ex.CHINH_SACH_BINH_THUONG, None)
        assert bks.thuc_thi("huy_don", {"ma_don": "DH1002"})["ok"] is False
        assert tg.don_hang["DH1002"]["trang_thai"] == "dang_xu_ly"

    def test_cong_cu_khong_can_xac_nhan_thi_khong_hoi(self, ex, sdk):
        da_hoi = []
        bks = ex.BoKiemSoat(sdk, ex.CHINH_SACH_BINH_THUONG,
                            lambda t, ts: da_hoi.append(t) or True)
        kq = bks.thuc_thi("cap_nhat_trang_thai",
                          {"ma_don": "DH1002", "trang_thai": "dang_giao"})
        assert kq is not None, bao_chua_lam("BoKiemSoat.thuc_thi")
        assert kq["ok"] is True
        assert da_hoi == []

    def test_ngan_sach_thay_doi(self, ex, sdk, tg):
        cs = ex.ChinhSach(cong_cu_cho_phep=None, can_xac_nhan=set(), max_thay_doi=1)
        bks = ex.BoKiemSoat(sdk, cs)
        assert bks.thuc_thi("cap_nhat_trang_thai",
                            {"ma_don": "DH1001", "trang_thai": "da_giao"})["ok"] is True
        kq = bks.thuc_thi("huy_don", {"ma_don": "DH1002"})
        assert kq["ok"] is False
        assert bks.nhat_ky_chan[-1]["ly_do"] == "ngan_sach"

    def test_ngan_sach_khong_chan_cong_cu_chi_doc(self, ex, sdk):
        cs = ex.ChinhSach(cong_cu_cho_phep=None, can_xac_nhan=set(), max_thay_doi=0)
        bks = ex.BoKiemSoat(sdk, cs)
        for _ in range(5):
            assert bks.thuc_thi("tra_cuu_don", {"ma_don": "DH1001"})["ok"] is True

    def test_ngan_sach_kiem_TRUOC_xac_nhan(self, ex, sdk):
        """Hoi nguoi roi moi bao het ngan sach la lam phien vo ich."""
        da_hoi = []
        cs = ex.ChinhSach(cong_cu_cho_phep=None, can_xac_nhan={"huy_don"},
                          max_thay_doi=0)
        bks = ex.BoKiemSoat(sdk, cs, lambda t, ts: da_hoi.append(t) or True)
        bks.thuc_thi("huy_don", {"ma_don": "DH1002"})
        assert da_hoi == []
        assert bks.nhat_ky_chan[-1]["ly_do"] == "ngan_sach"

    def test_that_bai_khong_tinh_vao_ngan_sach(self, ex, sdk):
        """Huy mot don da giao that bai - the gioi khong doi gi."""
        cs = ex.ChinhSach(cong_cu_cho_phep=None, can_xac_nhan=set(), max_thay_doi=1)
        bks = ex.BoKiemSoat(sdk, cs)
        bks.thuc_thi("huy_don", {"ma_don": "DH1003"})       # da giao -> that bai
        assert bks.thuc_thi("huy_don", {"ma_don": "DH1002"})["ok"] is True

    def test_theo_doi_da_thay_doi(self, ex, sdk):
        bks = ex.BoKiemSoat(sdk, ex.CHINH_SACH_BINH_THUONG, lambda t, ts: True)
        bks.thuc_thi("huy_don", {"ma_don": "DH1002"})
        assert bks.da_thay_doi == ["huy_don"]

    def test_cong_cu_khong_ton_tai(self, ex, sdk):
        bks = ex.BoKiemSoat(sdk, ex.CHINH_SACH_BINH_THUONG)
        assert bks.thuc_thi("bay_len_troi", {})["ok"] is False

    def test_khong_nem_exception_ra_ngoai(self, ex, sdk):
        def no_ra(**kwargs):
            raise ValueError("hong")

        bks = ex.BoKiemSoat({"hay_no": no_ra}, ex.CHINH_SACH_BINH_THUONG)
        assert bks.thuc_thi("hay_no", {})["ok"] is False


def kq_agent(cong_cu=(), ket_qua="", ly_do="tra_loi"):
    duong_di = [{"vai": "nhiem_vu", "noi_dung": "x"}]
    for t in cong_cu:
        duong_di.append({"vai": "cong_cu", "ten": t, "tham_so": {}})
        duong_di.append({"vai": "ket_qua", "noi_dung": {"ok": True}})
    return {"ket_qua": ket_qua, "duong_di": duong_di,
            "so_vong": len(cong_cu) + 1, "ly_do_dung": ly_do}


class TestChamDuongDi:
    KV = {"phai_goi": ["huy_don"], "cam_goi": ["gui_email"], "tu_khoa": ["DH1002"]}

    def test_diem_tuyet_doi(self, ex):
        kq = ex.cham_duong_di(kq_agent(["huy_don"], "Đã huỷ DH1002"), self.KV)
        assert kq is not None, bao_chua_lam("cham_duong_di")
        assert kq["diem"] == pytest.approx(1.0)

    def test_du_khoa(self, ex):
        kq = ex.cham_duong_di(kq_agent(["huy_don"], "Đã huỷ DH1002"), self.KV)
        for khoa in ("dung_cong_cu", "khong_cam", "du_tu_khoa", "hoan_thanh",
                     "so_buoc", "diem"):
            assert khoa in kq, f"Thieu khoa {khoa!r}"

    def test_goi_cong_cu_bi_cam_la_0_TUYET_DOI(self, ex):
        """Agent huy nham don roi tra loi rat hay khong phai la 'duoc 70%'."""
        kq = ex.cham_duong_di(
            kq_agent(["huy_don", "gui_email"], "Đã huỷ DH1002 và báo khách"), self.KV)
        assert kq["khong_cam"] is False
        assert kq["diem"] == 0.0

    def test_thieu_cong_cu_bat_buoc(self, ex):
        kq = ex.cham_duong_di(kq_agent([], "Đã huỷ DH1002"), self.KV)
        assert kq["dung_cong_cu"] is False
        assert kq["diem"] == pytest.approx(0.6)

    def test_thieu_tu_khoa(self, ex):
        kq = ex.cham_duong_di(kq_agent(["huy_don"], "Xong rồi bạn nhé"), self.KV)
        assert kq["du_tu_khoa"] is False
        assert kq["diem"] == pytest.approx(0.7)

    def test_khong_hoan_thanh(self, ex):
        kq = ex.cham_duong_di(
            kq_agent(["huy_don"], "", ly_do="het_vong"), self.KV)
        assert kq["hoan_thanh"] is False
        assert kq["diem"] == pytest.approx(0.4)

    def test_tu_khoa_khong_phan_biet_hoa_thuong(self, ex):
        kq = ex.cham_duong_di(kq_agent(["huy_don"], "đã huỷ dh1002"), self.KV)
        assert kq["du_tu_khoa"] is True

    def test_dem_so_buoc(self, ex):
        kq = ex.cham_duong_di(kq_agent(["a", "b", "c"], "x"), {})
        assert kq["so_buoc"] == 3

    def test_ky_vong_rong(self, ex):
        kq = ex.cham_duong_di(kq_agent([], "gì đó"), {})
        assert kq["diem"] == pytest.approx(1.0)

    def test_ca_bay_khong_duoc_lam_gi(self, ex):
        """Nguoi dung HOI ve hanh dong, agent LAM luon - loi kinh dien nhat."""
        ky_vong = {"phai_goi": [], "cam_goi": ["huy_don"], "tu_khoa": []}
        tot = ex.cham_duong_di(kq_agent([], "Được, bạn có thể huỷ đơn này."), ky_vong)
        xau = ex.cham_duong_di(kq_agent(["huy_don"], "Tôi đã huỷ giúp bạn."), ky_vong)
        assert tot["diem"] == pytest.approx(1.0)
        assert xau["diem"] == 0.0

    def test_diem_luon_trong_0_1(self, ex):
        for cc in ([], ["huy_don"], ["huy_don", "gui_email"]):
            d = ex.cham_duong_di(kq_agent(cc, "x"), self.KV)["diem"]
            assert 0.0 <= d <= 1.0


class TestChayEvalAgent:
    BO_TEST = [
        {"id": "a", "loai": "de", "nhiem_vu": "x",
         "ky_vong": {"phai_goi": ["tra_cuu_don"], "cam_goi": [], "tu_khoa": []}},
        {"id": "b", "loai": "bay", "nhiem_vu": "y",
         "ky_vong": {"phai_goi": [], "cam_goi": ["huy_don"], "tu_khoa": []}},
    ]

    def test_chay_het_bo_test(self, ex):
        kq = ex.chay_eval_agent(self.BO_TEST,
                                lambda ca: kq_agent(["tra_cuu_don"], "ok"))
        assert kq is not None, bao_chua_lam("chay_eval_agent")
        assert len(kq) == 2

    def test_du_khoa(self, ex):
        r = ex.chay_eval_agent(self.BO_TEST, lambda ca: kq_agent([], "x"))[0]
        for khoa in ("id", "loai", "diem", "chi_tiet", "loi"):
            assert khoa in r, f"Thieu khoa {khoa!r}"

    def test_giu_dung_id_va_thu_tu(self, ex):
        kq = ex.chay_eval_agent(self.BO_TEST, lambda ca: kq_agent([], "x"))
        assert [r["id"] for r in kq] == ["a", "b"]

    def test_cham_dung(self, ex):
        kq = ex.chay_eval_agent(self.BO_TEST,
                                lambda ca: kq_agent(["tra_cuu_don"], "ok"))
        assert kq[0]["diem"] == pytest.approx(1.0)
        assert kq[1]["diem"] == pytest.approx(1.0)

    def test_mot_ca_loi_khong_lam_dung_ca_bo(self, ex):
        def hong(ca):
            raise RuntimeError("agent sập")

        kq = ex.chay_eval_agent(self.BO_TEST, hong)
        assert len(kq) == 2
        assert all(r["diem"] == 0.0 and r["loi"] for r in kq)

    def test_loi_co_ten_exception(self, ex):
        def hong(ca):
            raise ValueError("x")

        assert "ValueError" in ex.chay_eval_agent(self.BO_TEST, hong)[0]["loi"]

    def test_chi_mot_ca_loi(self, ex):
        def doi_khi(ca):
            if ca["id"] == "b":
                raise RuntimeError("hỏng")
            return kq_agent(["tra_cuu_don"], "ok")

        kq = ex.chay_eval_agent(self.BO_TEST, doi_khi)
        assert kq[0]["diem"] == pytest.approx(1.0) and kq[0]["loi"] is None
        assert kq[1]["diem"] == 0.0 and kq[1]["loi"]

    def test_bo_test_rong(self, ex):
        assert ex.chay_eval_agent([], lambda ca: kq_agent()) == []
