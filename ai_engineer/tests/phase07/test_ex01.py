"""Cham diem ex01_prompt_va_token.py — Phase 07.

Cac test nay KHONG can API key.
"""

from __future__ import annotations

import pytest

from tests.conftest import bao_chua_lam, nap_module

pytestmark = pytest.mark.phase07


@pytest.fixture(scope="module")
def ex():
    return nap_module("curriculum/07-llm-engineering/exercises/ex01_prompt_va_token.py")


class _Khoi:
    """Gia lap mot khoi noi dung tra ve tu API."""

    def __init__(self, type_, text=None):
        self.type = type_
        if text is not None:
            self.text = text


class TestTaoMessages:
    def test_co_ket_qua(self, ex):
        assert ex.tao_messages([], "A") is not None, bao_chua_lam("tao_messages")

    def test_lich_su_rong(self, ex):
        assert ex.tao_messages([], "Xin chao") == [
            {"role": "user", "content": "Xin chao"}
        ]

    def test_them_vao_cuoi(self, ex):
        ls = [{"role": "user", "content": "A"}, {"role": "assistant", "content": "B"}]
        assert ex.tao_messages(ls, "C")[-1] == {"role": "user", "content": "C"}

    def test_giu_nguyen_lich_su(self, ex):
        ls = [{"role": "user", "content": "A"}]
        assert ex.tao_messages(ls, "B")[:1] == ls

    def test_khong_sua_lich_su_goc(self, ex):
        ls = [{"role": "user", "content": "A"}]
        ex.tao_messages(ls, "B")
        assert len(ls) == 1, "Ham da sua lich su goc! Phai tra ve list MOI."


class TestKiemTraMessages:
    def test_hop_le(self, ex):
        assert ex.kiem_tra_messages([{"role": "user", "content": "A"}]) == []

    def test_danh_sach_rong(self, ex):
        assert ex.kiem_tra_messages([]) == ["Danh sach rong"]

    def test_dau_khong_phai_user(self, ex):
        assert ex.kiem_tra_messages([{"role": "assistant", "content": "A"}]) == [
            "Tin nhan dau phai la user"
        ]

    def test_noi_dung_rong(self, ex):
        assert ex.kiem_tra_messages([{"role": "user", "content": "  "}]) == [
            "Noi dung rong o vi tri 0"
        ]

    def test_vai_tro_la(self, ex):
        loi = ex.kiem_tra_messages(
            [{"role": "user", "content": "A"}, {"role": "bot", "content": "B"}]
        )
        assert any("bot" in x for x in loi)

    def test_kiem_tra_het_moi_phan_tu(self, ex):
        loi = ex.kiem_tra_messages(
            [
                {"role": "user", "content": "A"},
                {"role": "assistant", "content": ""},
                {"role": "user", "content": " "},
            ]
        )
        assert "Noi dung rong o vi tri 1" in loi
        assert "Noi dung rong o vi tri 2" in loi

    def test_hoi_thoai_dai_hop_le(self, ex):
        ls = [
            {"role": "user", "content": "A"},
            {"role": "assistant", "content": "B"},
            {"role": "user", "content": "C"},
        ]
        assert ex.kiem_tra_messages(ls) == []

    def test_content_dang_list_khong_gay_loi(self, ex):
        """content co the la LIST cac khoi, khong duoc goi .strip() len no."""
        ls = [{"role": "user", "content": [{"type": "text", "text": "A"}]}]
        try:
            ex.kiem_tra_messages(ls)
        except AttributeError:
            pytest.fail("Phai kiem tra isinstance(content, str) truoc khi .strip()")


class TestTrichVanBan:
    def test_noi_nhieu_khoi(self, ex):
        assert ex.trich_van_ban([_Khoi("text", "Xin "), _Khoi("text", "chao")]) == "Xin chao"

    def test_bo_qua_khoi_khac(self, ex):
        assert ex.trich_van_ban([_Khoi("thinking"), _Khoi("text", "A")]) == "A"

    def test_danh_sach_rong(self, ex):
        assert ex.trich_van_ban([]) == ""

    def test_khong_lay_khoi_dau_tien(self, ex):
        """Loi kinh dien: response.content[0].text"""
        khoi = [_Khoi("tool_use"), _Khoi("text", "ket qua")]
        assert ex.trich_van_ban(khoi) == "ket qua", (
            "Ban dang lay content[0]? Phai LOC theo type == 'text'."
        )

    def test_khong_co_khoi_text(self, ex):
        assert ex.trich_van_ban([_Khoi("thinking"), _Khoi("tool_use")]) == ""


class TestChanDoanStopReason:
    def test_end_turn(self, ex):
        assert ex.chan_doan_stop_reason("end_turn") == "Binh thuong"

    def test_max_tokens(self, ex):
        assert "max_tokens" in ex.chan_doan_stop_reason("max_tokens")

    def test_tool_use(self, ex):
        assert "tool" in ex.chan_doan_stop_reason("tool_use").lower()

    def test_refusal(self, ex):
        assert "tu choi" in ex.chan_doan_stop_reason("refusal").lower()

    def test_gia_tri_la(self, ex):
        kq = ex.chan_doan_stop_reason("gi_do_moi")
        assert "Khong ro" in kq and "gi_do_moi" in kq


class TestChiPhi:
    def test_mot_trieu_token(self, ex):
        assert ex.uoc_tinh_chi_phi(1_000_000, 1_000_000, "claude-haiku-4-5") == 6.0

    def test_so_nho(self, ex):
        assert abs(ex.uoc_tinh_chi_phi(1000, 500, "claude-haiku-4-5") - 0.0035) < 1e-9

    def test_khong_token(self, ex):
        assert ex.uoc_tinh_chi_phi(0, 0, "claude-opus-5") == 0.0

    def test_opus_dat_hon_haiku(self, ex):
        assert ex.uoc_tinh_chi_phi(1000, 1000, "claude-opus-5") > ex.uoc_tinh_chi_phi(
            1000, 1000, "claude-haiku-4-5"
        )

    def test_token_ra_dat_gap_5_lan(self, ex):
        ra = ex.uoc_tinh_chi_phi(0, 1000, "claude-haiku-4-5")
        vao = ex.uoc_tinh_chi_phi(1000, 0, "claude-haiku-4-5")
        assert abs(ra / vao - 5.0) < 1e-9, "Token ra phai dat gap 5 lan token vao"

    def test_model_sai_nem_loi(self, ex):
        with pytest.raises(ValueError):
            ex.uoc_tinh_chi_phi(1, 1, "claude-3-opus")

    def test_hau_to_ngay_thang_la_sai(self, ex):
        """ID co hau to ngay thang KHONG hop le."""
        with pytest.raises(ValueError) as loi:
            ex.uoc_tinh_chi_phi(1, 1, "claude-haiku-4-5-20251001")
        assert "claude-haiku-4-5-20251001" in str(loi.value)

    def test_hoi_thoai(self, ex):
        kq = ex.chi_phi_hoi_thoai([(1000, 200), (1500, 300)], "claude-haiku-4-5")
        assert kq["tong_token_vao"] == 2500
        assert kq["tong_token_ra"] == 500
        assert kq["so_luot"] == 2
        assert abs(kq["tong_chi_phi"] - 0.005) < 1e-9

    def test_hoi_thoai_rong(self, ex):
        kq = ex.chi_phi_hoi_thoai([], "claude-haiku-4-5")
        assert kq["so_luot"] == 0 and kq["tong_chi_phi"] == 0.0


class TestChonModel:
    def test_mac_dinh_re(self, ex):
        assert ex.chon_model(False, 1000) == "claude-haiku-4-5"

    def test_can_chat_luong(self, ex):
        assert ex.chon_model(True, 1000) == "claude-opus-5"

    def test_ngu_canh_lon_uu_tien_hon_gia_re(self, ex):
        """Rang buoc CUNG phai xet truoc so thich."""
        assert ex.chon_model(False, 500_000) == "claude-opus-5", (
            "Haiku chi co 200K ngu canh - re den may cung khong dung duoc"
        )

    def test_khong_uu_tien_re(self, ex):
        assert ex.chon_model(False, 1000, uu_tien_re=False) == "claude-sonnet-5"

    def test_bien_200k(self, ex):
        assert ex.chon_model(False, 200_000) == "claude-haiku-4-5"
        assert ex.chon_model(False, 200_001) == "claude-opus-5"

    def test_vua_ngu_canh(self, ex):
        assert ex.vua_ngu_canh(150_000, "claude-haiku-4-5") is True
        assert ex.vua_ngu_canh(300_000, "claude-haiku-4-5") is False
        assert ex.vua_ngu_canh(300_000, "claude-opus-5") is True

    def test_vua_ngu_canh_model_sai(self, ex):
        with pytest.raises(ValueError):
            ex.vua_ngu_canh(100, "gpt-4")


class TestCatLichSu:
    @pytest.fixture
    def ls(self):
        return [
            {"role": "user", "content": "u1"},
            {"role": "assistant", "content": "a1"},
            {"role": "user", "content": "u2"},
            {"role": "assistant", "content": "a2"},
            {"role": "user", "content": "u3"},
        ]

    def test_giu_0_cap(self, ex, ls):
        assert [m["content"] for m in ex.cat_lich_su(ls, 0)] == ["u3"]

    def test_giu_1_cap(self, ex, ls):
        assert [m["content"] for m in ex.cat_lich_su(ls, 1)] == ["u2", "a2", "u3"]

    def test_giu_het(self, ex, ls):
        assert [m["content"] for m in ex.cat_lich_su(ls, 99)] == [
            "u1", "a1", "u2", "a2", "u3"
        ]

    def test_luon_bat_dau_bang_user(self, ex, ls):
        for n in range(5):
            kq = ex.cat_lich_su(ls, n)
            if kq:
                assert kq[0]["role"] == "user", f"so_luot_giu={n} cho ket qua sai"

    def test_khong_co_user_le(self, ex):
        ls = [
            {"role": "user", "content": "u1"},
            {"role": "assistant", "content": "a1"},
            {"role": "user", "content": "u2"},
            {"role": "assistant", "content": "a2"},
        ]
        assert [m["content"] for m in ex.cat_lich_su(ls, 1)] == ["u2", "a2"]

    def test_lich_su_rong(self, ex):
        assert ex.cat_lich_su([], 3) == []

    def test_ket_qua_van_hop_le(self, ex, ls):
        """Ket qua phai qua duoc kiem_tra_messages."""
        assert ex.kiem_tra_messages(ex.cat_lich_su(ls, 1)) == []
