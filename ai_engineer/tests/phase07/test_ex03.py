"""Cham diem ex03_eval.py — Phase 07.

Cac test nay KHONG can API key — do chinh la diem manh cua thiet ke:
`chay_eval` nhan mot HAM goi model, nen test truyen ham gia lap vao.
"""

from __future__ import annotations

import pytest

from tests.conftest import bao_chua_lam, nap_module

pytestmark = pytest.mark.phase07


@pytest.fixture(scope="module")
def ex():
    return nap_module("curriculum/07-llm-engineering/exercises/ex03_eval.py")


@pytest.fixture
def bo_test():
    return [
        {"ten": "vui", "dau_vao": "San pham tuyet voi!", "mong_doi": "tich cuc"},
        {"ten": "buon", "dau_vao": "Hang loi, that vong", "mong_doi": "tieu cuc"},
        {"ten": "trung", "dau_vao": "Cung binh thuong", "mong_doi": "trung tinh"},
    ]


def model_hoan_hao(dau_vao: str) -> str:
    if "tuyet" in dau_vao:
        return "tich cuc"
    if "that vong" in dau_vao:
        return "tieu cuc"
    return "trung tinh"


class TestHamCham:
    def test_khop_chinh_xac(self, ex):
        assert ex.khop_chinh_xac("Tich cuc", "tich cuc") is True
        assert ex.khop_chinh_xac("  tich cuc  ", "tich cuc") is True
        assert ex.khop_chinh_xac("tieu cuc", "tich cuc") is False

    def test_khop_chinh_xac_rong(self, ex):
        assert ex.khop_chinh_xac("", "") is True

    def test_chua_tat_ca(self, ex):
        assert ex.chua_tat_ca("Gia 100k, giao trong 2 ngay", ["100k", "2 ngay"]) is True
        assert ex.chua_tat_ca("Gia 100k", ["100k", "2 ngay"]) is False

    def test_chua_tat_ca_khong_phan_biet_hoa_thuong(self, ex):
        assert ex.chua_tat_ca("GIAO HANG NHANH", ["giao hang"]) is True

    def test_chua_tat_ca_danh_sach_rong(self, ex):
        assert ex.chua_tat_ca("bat ky", []) is True

    def test_json_hop_le(self, ex):
        assert ex.json_hop_le('{"a": 1}') is True
        assert ex.json_hop_le("khong phai json") is False

    def test_json_hop_le_kiem_khoa(self, ex):
        assert ex.json_hop_le('{"a": 1}', ["a"]) is True
        assert ex.json_hop_le('{"a": 1}', ["a", "b"]) is False

    def test_json_mang_khong_phai_dict(self, ex):
        assert ex.json_hop_le("[1, 2]", ["a"]) is False

    def test_json_mang_khong_yeu_cau_khoa(self, ex):
        assert ex.json_hop_le("[1, 2]") is True

    def test_cham_theo_truong(self, ex):
        assert ex.cham_theo_truong({"a": 1, "b": 2}, {"a": 1, "b": 3}) == 0.5
        assert ex.cham_theo_truong({"a": 1}, {"a": 1}) == 1.0
        assert ex.cham_theo_truong({}, {"a": 1}) == 0.0

    def test_cham_theo_truong_chuan_rong(self, ex):
        assert ex.cham_theo_truong({"a": 1}, {}) == 0.0


class TestChayEval:
    def test_co_ket_qua(self, ex, bo_test):
        kq = ex.chay_eval(bo_test, model_hoan_hao, ex.khop_chinh_xac)
        assert kq is not None, bao_chua_lam("chay_eval")

    def test_du_so_case(self, ex, bo_test):
        assert len(ex.chay_eval(bo_test, model_hoan_hao, ex.khop_chinh_xac)) == 3

    def test_du_khoa(self, ex, bo_test):
        kq = ex.chay_eval(bo_test, model_hoan_hao, ex.khop_chinh_xac)
        assert set(kq[0]) == {"ten", "dau_vao", "dau_ra", "diem", "loi"}

    def test_model_hoan_hao_dat_diem_toi_da(self, ex, bo_test):
        kq = ex.chay_eval(bo_test, model_hoan_hao, ex.khop_chinh_xac)
        assert all(r["diem"] == 1.0 for r in kq)
        assert all(r["loi"] is None for r in kq)

    def test_diem_la_float(self, ex, bo_test):
        """bool True phai thanh 1.0 de tron duoc voi ham cham lien tuc."""
        kq = ex.chay_eval(bo_test, model_hoan_hao, ex.khop_chinh_xac)
        assert all(isinstance(r["diem"], float) for r in kq)

    def test_ten_mac_dinh(self, ex):
        bt = [{"dau_vao": "a", "mong_doi": "a"}]
        kq = ex.chay_eval(bt, lambda x: x, ex.khop_chinh_xac)
        assert kq[0]["ten"] == "case_0"

    def test_bat_loi_khong_lam_dung_ca_bo(self, ex, bo_test):
        """⭐ Mot case loi la MOT diem 0, khong phai ly do dung toan bo."""

        def model_loi(_):
            raise ConnectionError("mat mang")

        kq = ex.chay_eval(bo_test, model_loi, ex.khop_chinh_xac)
        assert len(kq) == 3, "Phai chay tiep cac case con lai"
        assert all(r["diem"] == 0.0 for r in kq)
        assert all(r["loi"] is not None for r in kq)

    def test_loi_ghi_ro_loai_ngoai_le(self, ex, bo_test):
        def model_loi(_):
            raise ValueError("sai tham so")

        kq = ex.chay_eval(bo_test, model_loi, ex.khop_chinh_xac)
        assert "ValueError" in kq[0]["loi"]

    def test_chi_mot_case_loi(self, ex, bo_test):
        def model_thi_thoang_loi(dau_vao):
            if "that vong" in dau_vao:
                raise TimeoutError("qua han")
            return model_hoan_hao(dau_vao)

        kq = ex.chay_eval(bo_test, model_thi_thoang_loi, ex.khop_chinh_xac)
        assert sum(1 for r in kq if r["loi"] is not None) == 1
        assert sum(1 for r in kq if r["diem"] == 1.0) == 2

    def test_ham_cham_tra_ve_float(self, ex):
        bt = [{"ten": "x", "dau_vao": "a", "mong_doi": {"a": 1, "b": 2}}]
        kq = ex.chay_eval(bt, lambda _: {"a": 1, "b": 9}, ex.cham_theo_truong)
        assert kq[0]["diem"] == 0.5

    def test_bo_test_rong(self, ex):
        assert ex.chay_eval([], model_hoan_hao, ex.khop_chinh_xac) == []


class TestTomTat:
    def test_du_khoa(self, ex, bo_test):
        kq = ex.chay_eval(bo_test, model_hoan_hao, ex.khop_chinh_xac)
        t = ex.tom_tat(kq)
        assert set(t) == {"so_case", "diem_tb", "so_dat", "ty_le_dat", "so_loi"}

    def test_hoan_hao(self, ex, bo_test):
        t = ex.tom_tat(ex.chay_eval(bo_test, model_hoan_hao, ex.khop_chinh_xac))
        assert t["so_case"] == 3 and t["diem_tb"] == 1.0
        assert t["ty_le_dat"] == 1.0 and t["so_loi"] == 0

    def test_diem_le(self, ex):
        kq = [{"diem": 1.0, "loi": None}, {"diem": 0.5, "loi": None}]
        t = ex.tom_tat(kq)
        assert t["diem_tb"] == 0.75
        assert t["so_dat"] == 1, "so_dat dem case co diem >= 1.0"
        assert t["ty_le_dat"] == 0.5

    def test_dem_loi(self, ex):
        kq = [{"diem": 0.0, "loi": "X"}, {"diem": 1.0, "loi": None}]
        assert ex.tom_tat(kq)["so_loi"] == 1

    def test_rong(self, ex):
        t = ex.tom_tat([])
        assert t["so_case"] == 0 and t["diem_tb"] == 0.0 and t["ty_le_dat"] == 0.0


class TestSoSanhPhienBan:
    def test_phat_hien_thoai_lui(self, ex):
        """⭐ Ly do eval ton tai."""
        cu = [{"ten": "a", "diem": 1.0}, {"ten": "b", "diem": 1.0}]
        moi = [{"ten": "a", "diem": 1.0}, {"ten": "b", "diem": 0.0}]
        ss = ex.so_sanh_phien_ban(cu, moi)
        assert ss["thoai_lui"] == ["b"]
        assert ss["cai_thien"] == []
        assert ss["khong_doi"] == 1

    def test_diem_tb(self, ex):
        cu = [{"ten": "a", "diem": 1.0}, {"ten": "b", "diem": 1.0}]
        moi = [{"ten": "a", "diem": 1.0}, {"ten": "b", "diem": 0.0}]
        ss = ex.so_sanh_phien_ban(cu, moi)
        assert ss["diem_tb_cu"] == 1.0 and ss["diem_tb_moi"] == 0.5

    def test_vua_cai_thien_vua_thoai_lui(self, ex):
        """Diem TB tang nhung van co case hong - dung tinh huong that."""
        cu = [{"ten": f"c{i}", "diem": d} for i, d in enumerate([1, 1, 1, 0, 0, 0, 0, 0])]
        moi = [{"ten": f"c{i}", "diem": d} for i, d in enumerate([0, 0, 0, 1, 1, 1, 1, 1])]
        ss = ex.so_sanh_phien_ban(cu, moi)
        assert ss["diem_tb_moi"] > ss["diem_tb_cu"]
        assert len(ss["thoai_lui"]) == 3, "Diem TB tang nhung 3 case da hong"

    def test_chi_xet_case_chung(self, ex):
        cu = [{"ten": "a", "diem": 1.0}, {"ten": "chi_co_cu", "diem": 0.0}]
        moi = [{"ten": "a", "diem": 1.0}, {"ten": "chi_co_moi", "diem": 1.0}]
        ss = ex.so_sanh_phien_ban(cu, moi)
        assert ss["khong_doi"] == 1
        assert ss["diem_tb_cu"] == 1.0 and ss["diem_tb_moi"] == 1.0

    def test_khong_co_case_chung(self, ex):
        ss = ex.so_sanh_phien_ban([{"ten": "a", "diem": 1.0}], [{"ten": "b", "diem": 1.0}])
        assert ss["khong_doi"] == 0 and ss["diem_tb_cu"] == 0.0

    def test_danh_sach_da_sap_xep(self, ex):
        cu = [{"ten": t, "diem": 0.0} for t in ["z", "a", "m"]]
        moi = [{"ten": t, "diem": 1.0} for t in ["z", "a", "m"]]
        assert ex.so_sanh_phien_ban(cu, moi)["cai_thien"] == ["a", "m", "z"]


class TestJudge:
    def test_prompt_co_du_phan(self, ex):
        p = ex.tao_prompt_judge("Hoi gi?", "Dap an", "Tra loi")
        assert "<cau_hoi>" in p and "<dap_an_chuan>" in p and "<cau_tra_loi>" in p

    def test_prompt_co_tieu_chi(self, ex):
        p = ex.tao_prompt_judge("a", "b", "c")
        assert "1-5" in p
        assert "5 =" in p and "1 =" in p

    def test_prompt_ep_json(self, ex):
        p = ex.tao_prompt_judge("a", "b", "c")
        assert '"diem"' in p and '"ly_do"' in p

    def test_parse_diem_toi_da(self, ex):
        assert ex.parse_ket_qua_judge('{"diem": 5, "ly_do": "Chinh xac"}') == (
            1.0, "Chinh xac"
        )

    def test_parse_diem_giua(self, ex):
        assert ex.parse_ket_qua_judge('{"diem": 3, "ly_do": "Thieu y"}') == (0.5, "Thieu y")

    def test_parse_diem_thap_nhat(self, ex):
        assert ex.parse_ket_qua_judge('{"diem": 1, "ly_do": "Sai"}') == (0.0, "Sai")

    def test_parse_co_van_xuoi(self, ex):
        assert ex.parse_ket_qua_judge('Danh gia: {"diem": 4, "ly_do": "Tot"}')[0] == 0.75

    def test_parse_that_bai(self, ex):
        assert ex.parse_ket_qua_judge("khong phai json") == (
            0.0, "Khong parse duoc ket qua judge"
        )

    def test_diem_ngoai_khoang(self, ex):
        assert ex.parse_ket_qua_judge('{"diem": 9}')[0] == 0.0
        assert ex.parse_ket_qua_judge('{"diem": 0}')[0] == 0.0

    def test_thieu_khoa_diem(self, ex):
        assert ex.parse_ket_qua_judge('{"ly_do": "abc"}')[0] == 0.0

    def test_diem_luon_trong_khoang(self, ex):
        for d in range(1, 6):
            diem, _ = ex.parse_ket_qua_judge(f'{{"diem": {d}, "ly_do": "x"}}')
            assert 0.0 <= diem <= 1.0


class TestBaseline:
    def test_luon_tra_ve_hang_so(self, ex):
        f = ex.tao_baseline_hang_so("tich cuc")
        assert f("bat ky") == "tich cuc"
        assert f("") == "tich cuc"

    def test_dung_duoc_voi_chay_eval(self, ex, bo_test):
        kq = ex.chay_eval(bo_test, ex.tao_baseline_hang_so("tich cuc"), ex.khop_chinh_xac)
        assert ex.tom_tat(kq)["so_dat"] == 1

    def test_baseline_kem_hon_model_that(self, ex, bo_test):
        bl = ex.tom_tat(
            ex.chay_eval(bo_test, ex.tao_baseline_hang_so("tich cuc"), ex.khop_chinh_xac)
        )
        that = ex.tom_tat(ex.chay_eval(bo_test, model_hoan_hao, ex.khop_chinh_xac))
        assert bl["diem_tb"] < that["diem_tb"]

    def test_hai_baseline_doc_lap(self, ex):
        a = ex.tao_baseline_hang_so("A")
        b = ex.tao_baseline_hang_so("B")
        assert a("x") == "A" and b("x") == "B"
