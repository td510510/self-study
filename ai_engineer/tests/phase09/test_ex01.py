"""Cham diem ex01_vong_lap_agent.py — Phase 09.

KHONG can API key: `chay_agent` nhan ham goi_model lam tham so.
"""

from __future__ import annotations

import sys
from pathlib import Path

import pytest

from tests.conftest import bao_chua_lam, nap_module

pytestmark = pytest.mark.phase09

GOC = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(GOC / "curriculum" / "09-agents"))

from the_gioi import CONG_CU_THAY_DOI, TheGioi  # noqa: E402


@pytest.fixture(scope="module")
def ex():
    return nap_module("curriculum/09-agents/exercises/ex01_vong_lap_agent.py")


@pytest.fixture
def tg():
    """The gioi MOI cho moi test - khong test nao anh huong test khac."""
    return TheGioi()


def kich_ban(*cac_quyet_dinh):
    """Tao ham goi_model tra ve lan luot cac quyet dinh cho san."""
    it = iter(cac_quyet_dinh)

    def goi_model(lich_su):
        return next(it)

    return goi_model


TEN_CONG_CU = {"tra_cuu_don", "tra_cuu_kho", "liet_ke_don", "cap_nhat_trang_thai",
               "huy_don", "dat_hang_bo_sung", "gui_email"}


class TestDangKyCongCu:
    def test_du_7_cong_cu(self, ex, tg):
        sdk = ex.dang_ky_cong_cu(tg)
        assert sdk is not None, bao_chua_lam("dang_ky_cong_cu")
        assert set(sdk) == TEN_CONG_CU

    def test_goi_duoc(self, ex, tg):
        assert ex.dang_ky_cong_cu(tg)["tra_cuu_don"]("DH1001")["ok"] is True

    def test_gan_voi_dung_the_gioi(self, ex):
        """Hai the gioi khac nhau -> hai so dang ky doc lap."""
        a, b = TheGioi(), TheGioi()
        ex.dang_ky_cong_cu(a)["huy_don"]("DH1002")
        assert a.don_hang["DH1002"]["trang_thai"] == "da_huy"
        assert b.don_hang["DH1002"]["trang_thai"] == "dang_xu_ly"


class TestMoTaCongCu:
    def test_du_cong_cu(self, ex):
        d = ex.mo_ta_cong_cu()
        assert d is not None, bao_chua_lam("mo_ta_cong_cu")
        assert {x["name"] for x in d} == TEN_CONG_CU

    def test_du_ba_khoa(self, ex):
        for x in ex.mo_ta_cong_cu():
            assert set(x) == {"name", "description", "input_schema"}

    def test_mo_ta_du_dai(self, ex):
        """Description la thu DUY NHAT model dua vao de chon cong cu."""
        for x in ex.mo_ta_cong_cu():
            assert len(x["description"]) > 40, f"{x['name']}: mo ta qua ngan"

    def test_cong_cu_thay_doi_phai_canh_bao(self, ex):
        """Model can biet cong cu nao co tac dung THAT len du lieu."""
        tu_khoa = ("thay đổi", "không hoàn tác", "không thu hồi", "tốn tiền")
        for x in ex.mo_ta_cong_cu():
            if x["name"] in CONG_CU_THAY_DOI:
                mo_ta = x["description"].lower()
                assert any(t in mo_ta for t in tu_khoa), \
                    f"{x['name']}: mo ta khong noi ro no thay doi du lieu"

    def test_moi_tham_so_co_mo_ta(self, ex):
        for x in ex.mo_ta_cong_cu():
            for ten_ts, ts in x["input_schema"]["properties"].items():
                assert ts.get("description"), f"{x['name']}.{ten_ts} thieu mo ta"

    def test_required_nam_trong_properties(self, ex):
        for x in ex.mo_ta_cong_cu():
            props = set(x["input_schema"]["properties"])
            assert set(x["input_schema"].get("required", [])) <= props

    def test_schema_dung_kieu_object(self, ex):
        for x in ex.mo_ta_cong_cu():
            assert x["input_schema"]["type"] == "object"


class TestThucThi:
    def test_goi_thanh_cong(self, ex, tg):
        kq = ex.thuc_thi("tra_cuu_don", {"ma_don": "DH1001"}, ex.dang_ky_cong_cu(tg))
        assert kq is not None, bao_chua_lam("thuc_thi")
        assert kq["ok"] is True

    def test_cong_cu_khong_ton_tai(self, ex, tg):
        """Model go nham ten cong cu la chuyen binh thuong, khong duoc sap."""
        kq = ex.thuc_thi("bay_len_troi", {}, ex.dang_ky_cong_cu(tg))
        assert kq["ok"] is False
        assert "bay_len_troi" in kq["loi"]

    def test_sai_tham_so(self, ex, tg):
        kq = ex.thuc_thi("tra_cuu_don", {"sai_ten": "x"}, ex.dang_ky_cong_cu(tg))
        assert kq["ok"] is False
        assert "tham so" in kq["loi"].lower()

    def test_thieu_tham_so(self, ex, tg):
        kq = ex.thuc_thi("cap_nhat_trang_thai", {"ma_don": "DH1001"},
                         ex.dang_ky_cong_cu(tg))
        assert kq["ok"] is False

    def test_cong_cu_nem_exception(self, ex):
        def no_ra(**kwargs):
            raise ValueError("hong roi")

        kq = ex.thuc_thi("hay_no", {}, {"hay_no": no_ra})
        assert kq["ok"] is False
        assert "ValueError" in kq["loi"]

    def test_khong_bao_gio_nem_ra_ngoai(self, ex, tg):
        sdk = ex.dang_ky_cong_cu(tg)
        for ten, ts in [("khong_co", {}), ("huy_don", {}), ("huy_don", {"x": 1})]:
            assert ex.thuc_thi(ten, ts, sdk)["ok"] is False

    def test_tham_so_none(self, ex, tg):
        assert ex.thuc_thi("liet_ke_don", None, ex.dang_ky_cong_cu(tg))["ok"] is True


class TestChayAgent:
    def test_tra_loi_ngay(self, ex, tg):
        kq = ex.chay_agent("Xin chào",
                           kich_ban({"loai": "tra_loi", "noi_dung": "Chào bạn"}),
                           ex.dang_ky_cong_cu(tg))
        assert kq is not None, bao_chua_lam("chay_agent")
        assert kq["ket_qua"] == "Chào bạn"
        assert kq["so_vong"] == 1
        assert kq["ly_do_dung"] == "tra_loi"

    def test_du_khoa(self, ex, tg):
        kq = ex.chay_agent("x", kich_ban({"loai": "tra_loi", "noi_dung": "y"}),
                           ex.dang_ky_cong_cu(tg))
        for khoa in ("ket_qua", "duong_di", "so_vong", "ly_do_dung"):
            assert khoa in kq, f"Thieu khoa {khoa!r}"

    def test_nhiem_vu_la_phan_tu_dau(self, ex, tg):
        kq = ex.chay_agent("Nhiệm vụ A",
                           kich_ban({"loai": "tra_loi", "noi_dung": "z"}),
                           ex.dang_ky_cong_cu(tg))
        assert kq["duong_di"][0] == {"vai": "nhiem_vu", "noi_dung": "Nhiệm vụ A"}

    def test_goi_cong_cu_roi_tra_loi(self, ex, tg):
        kq = ex.chay_agent(
            "Đơn DH1001 sao rồi?",
            kich_ban({"loai": "cong_cu", "ten": "tra_cuu_don",
                      "tham_so": {"ma_don": "DH1001"}},
                     {"loai": "tra_loi", "noi_dung": "Đang giao."}),
            ex.dang_ky_cong_cu(tg))
        assert kq["so_vong"] == 2
        assert kq["ket_qua"] == "Đang giao."
        assert [b["vai"] for b in kq["duong_di"]] == ["nhiem_vu", "cong_cu", "ket_qua"]

    def test_hanh_dong_co_tac_dung_that(self, ex, tg):
        """Agent khac chatbot o cho no THAY DOI thu gi do - phai kiem duoc."""
        ex.chay_agent("Huỷ đơn DH1002",
                      kich_ban({"loai": "cong_cu", "ten": "huy_don",
                                "tham_so": {"ma_don": "DH1002"}},
                               {"loai": "tra_loi", "noi_dung": "Đã huỷ."}),
                      ex.dang_ky_cong_cu(tg))
        assert tg.don_hang["DH1002"]["trang_thai"] == "da_huy"

    def test_het_vong(self, ex, tg):
        """Agent khong gioi han vong co the dot sach ngan sach trong mot dem."""
        kq = ex.chay_agent(
            "lặp mãi",
            lambda ls: {"loai": "cong_cu", "ten": "liet_ke_don", "tham_so": {}},
            ex.dang_ky_cong_cu(tg), max_vong=4)
        assert kq["ly_do_dung"] == "het_vong"
        assert kq["so_vong"] == 4
        assert kq["ket_qua"] == ""

    def test_model_nem_exception(self, ex, tg):
        def hong(lich_su):
            raise RuntimeError("mất mạng")

        kq = ex.chay_agent("x", hong, ex.dang_ky_cong_cu(tg))
        assert kq["ly_do_dung"] == "loi_model"

    def test_loi_model_giu_nguyen_duong_di(self, ex, tg):
        """Phan da lam khong duoc bien mat khi model hong o vong sau."""
        lan = {"n": 0}

        def doi_khi_hong(lich_su):
            lan["n"] += 1
            if lan["n"] == 1:
                return {"loai": "cong_cu", "ten": "tra_cuu_don",
                        "tham_so": {"ma_don": "DH1001"}}
            raise RuntimeError("mất mạng")

        kq = ex.chay_agent("x", doi_khi_hong, ex.dang_ky_cong_cu(tg))
        assert kq["ly_do_dung"] == "loi_model"
        assert len(kq["duong_di"]) == 3

    def test_quyet_dinh_sai_dinh_dang(self, ex, tg):
        for xau in ({}, {"khong_co_loai": 1}, {"loai": "la_lung"}, "chuoi"):
            kq = ex.chay_agent("x", kich_ban(xau), ex.dang_ky_cong_cu(tg))
            assert kq["ly_do_dung"] == "loi_model", f"Chua bat duoc: {xau!r}"

    def test_cong_cu_loi_van_di_tiep(self, ex, tg):
        """Loi cong cu duoc gui NGUOC cho model, agent khong dung lai."""
        kq = ex.chay_agent(
            "Huỷ đơn đã giao",
            kich_ban({"loai": "cong_cu", "ten": "huy_don",
                      "tham_so": {"ma_don": "DH1003"}},
                     {"loai": "tra_loi", "noi_dung": "Đơn đã giao, không huỷ được."}),
            ex.dang_ky_cong_cu(tg))
        assert kq["ly_do_dung"] == "tra_loi"
        assert kq["duong_di"][2]["noi_dung"]["ok"] is False

    def test_max_vong_1(self, ex, tg):
        kq = ex.chay_agent("x", kich_ban({"loai": "cong_cu", "ten": "liet_ke_don",
                                          "tham_so": {}}),
                           ex.dang_ky_cong_cu(tg), max_vong=1)
        assert kq["ly_do_dung"] == "het_vong"


class TestTomTatDuongDi:
    def _kq(self, ex, tg):
        return ex.chay_agent(
            "Huỷ đơn DH1003",
            kich_ban({"loai": "cong_cu", "ten": "tra_cuu_don",
                      "tham_so": {"ma_don": "DH1003"}},
                     {"loai": "cong_cu", "ten": "huy_don",
                      "tham_so": {"ma_don": "DH1003"}},
                     {"loai": "tra_loi",
                      "noi_dung": "Đơn đã giao nên không huỷ được."}),
            ex.dang_ky_cong_cu(tg))

    def test_danh_so_tu_1(self, ex, tg):
        s = ex.tom_tat_duong_di(self._kq(ex, tg))
        assert s is not None, bao_chua_lam("tom_tat_duong_di")
        assert s.startswith("1. tra_cuu_don(")

    def test_co_tham_so(self, ex, tg):
        assert "ma_don='DH1003'" in ex.tom_tat_duong_di(self._kq(ex, tg))

    def test_danh_dau_thanh_cong_va_loi(self, ex, tg):
        s = ex.tom_tat_duong_di(self._kq(ex, tg))
        assert "-> ok" in s
        assert "-> LOI:" in s

    def test_dong_cuoi_la_cau_tra_loi(self, ex, tg):
        s = ex.tom_tat_duong_di(self._kq(ex, tg))
        assert s.splitlines()[-1] == "=> Đơn đã giao nên không huỷ được."

    def test_khong_co_cau_tra_loi(self, ex, tg):
        kq = ex.chay_agent("x", lambda ls: {"loai": "cong_cu", "ten": "liet_ke_don",
                                            "tham_so": {}},
                           ex.dang_ky_cong_cu(tg), max_vong=2)
        assert ex.tom_tat_duong_di(kq).splitlines()[-1] == "=> (không có câu trả lời)"

    def test_khong_goi_cong_cu_nao(self, ex, tg):
        kq = ex.chay_agent("x", kich_ban({"loai": "tra_loi", "noi_dung": "y"}),
                           ex.dang_ky_cong_cu(tg))
        assert ex.tom_tat_duong_di(kq) == "=> y"
