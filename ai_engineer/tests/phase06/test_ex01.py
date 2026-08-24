"""Cham diem ex01_tokenizer.py — Phase 06."""

from __future__ import annotations

from collections import Counter

import pytest

from tests.conftest import bao_chua_lam, nap_module

pytestmark = pytest.mark.phase06


@pytest.fixture(scope="module")
def ex():
    return nap_module("curriculum/06-nlp-transformers/exercises/ex01_tokenizer.py")


class TestTuVungKyTu:
    def test_co_ket_qua(self, ex):
        assert ex.xay_tu_vung_ky_tu("abc") is not None, bao_chua_lam("xay_tu_vung_ky_tu")

    def test_sap_xep_va_danh_so(self, ex):
        assert ex.xay_tu_vung_ky_tu("cba") == {"a": 0, "b": 1, "c": 2}

    def test_loai_trung(self, ex):
        assert ex.xay_tu_vung_ky_tu("aab") == {"a": 0, "b": 1}

    def test_rong(self, ex):
        assert ex.xay_tu_vung_ky_tu("") == {}

    def test_on_dinh_giua_cac_lan_goi(self, ex):
        """Phai sorted() — neu dung set() truc tiep thi thu tu khong on dinh."""
        vb = "xin chào các bạn"
        assert ex.xay_tu_vung_ky_tu(vb) == ex.xay_tu_vung_ky_tu(vb)

    def test_tieng_viet(self, ex):
        tv = ex.xay_tu_vung_ky_tu("ăâđêô")
        assert len(tv) == 5


class TestMaHoaGiaiMa:
    TV = {"a": 0, "b": 1}

    def test_ma_hoa(self, ex):
        assert ex.ma_hoa_ky_tu("aba", self.TV) == [0, 1, 0]

    def test_bo_qua_ky_tu_la(self, ex):
        assert ex.ma_hoa_ky_tu("axb", self.TV) == [0, 1]

    def test_giai_ma(self, ex):
        assert ex.giai_ma_ky_tu([0, 1, 0], self.TV) == "aba"

    def test_khu_hoi(self, ex):
        """Ma hoa roi giai ma phai ra chinh no."""
        vb = "xin chào"
        tv = ex.xay_tu_vung_ky_tu(vb)
        assert ex.giai_ma_ky_tu(ex.ma_hoa_ky_tu(vb, tv), tv) == vb

    def test_rong(self, ex):
        assert ex.ma_hoa_ky_tu("", self.TV) == []
        assert ex.giai_ma_ky_tu([], self.TV) == ""


class TestTuVungTu:
    def test_co_ket_qua(self, ex):
        assert ex.xay_tu_vung_tu("a b") is not None, bao_chua_lam("xay_tu_vung_tu")

    def test_theo_tan_suat(self, ex):
        assert ex.xay_tu_vung_tu("a b a c a b", so_tu_toi_da=2) == {
            "a": 0, "b": 1, "<unk>": 2
        }

    def test_co_token_unk(self, ex):
        tv = ex.xay_tu_vung_tu("a b c")
        assert "<unk>" in tv

    def test_unk_o_cuoi(self, ex):
        tv = ex.xay_tu_vung_tu("a b c")
        assert tv["<unk>"] == max(tv.values())

    def test_gioi_han_so_tu(self, ex):
        tv = ex.xay_tu_vung_tu("a b c d e f g", so_tu_toi_da=3)
        assert len(tv) == 4          # 3 tu + <unk>

    def test_khong_phan_biet_hoa_thuong(self, ex):
        tv = ex.xay_tu_vung_tu("Nam nam NAM")
        assert "nam" in tv
        assert len(tv) == 2          # "nam" + <unk>

    def test_pha_the_hoa_on_dinh(self, ex):
        """Tan suat bang nhau -> sap theo bang chu cai."""
        tv = ex.xay_tu_vung_tu("b a c", so_tu_toi_da=3)
        assert tv["a"] < tv["b"] < tv["c"]

    def test_ma_hoa_tu(self, ex):
        tv = {"a": 0, "b": 1, "<unk>": 2}
        assert ex.ma_hoa_tu("a b z", tv) == [0, 1, 2]

    def test_ma_hoa_tu_ha_chu_thuong(self, ex):
        tv = {"a": 0, "b": 1, "<unk>": 2}
        assert ex.ma_hoa_tu("A B", tv) == [0, 1]


class TestDemCap:
    def test_dem_dung(self, ex):
        assert ex.dem_cap(["a", "b", "a", "b", "c"]) == Counter(
            {("a", "b"): 2, ("b", "a"): 1, ("b", "c"): 1}
        )

    def test_mot_phan_tu(self, ex):
        assert ex.dem_cap(["a"]) == Counter()

    def test_rong(self, ex):
        assert ex.dem_cap([]) == Counter()

    def test_cap_lien_nhau_thoi(self, ex):
        """("a","c") KHONG phai cap lien nhau trong ["a","b","c"]."""
        d = ex.dem_cap(["a", "b", "c"])
        assert ("a", "c") not in d


class TestGopCap:
    def test_gop_dung(self, ex):
        assert ex.gop_cap(["a", "b", "a", "b", "c"], ("a", "b")) == ["ab", "ab", "c"]

    def test_khong_chong_lan(self, ex):
        assert ex.gop_cap(["a", "a", "a"], ("a", "a")) == ["aa", "a"]

    def test_khong_co_cap_nao(self, ex):
        assert ex.gop_cap(["a", "b", "c"], ("x", "y")) == ["a", "b", "c"]

    def test_giu_phan_tu_cuoi(self, ex):
        assert ex.gop_cap(["a", "b", "c"], ("a", "b")) == ["ab", "c"]

    def test_rong(self, ex):
        assert ex.gop_cap([], ("a", "b")) == []


class TestBPE:
    def test_co_ket_qua(self, ex):
        assert ex.huan_luyen_bpe("ab ab", 1) is not None, bao_chua_lam("huan_luyen_bpe")

    def test_gop_cap_pho_bien_nhat(self, ex):
        assert ex.huan_luyen_bpe("ab ab ab", 1) == [("a", "b")]

    def test_so_lan_gop(self, ex):
        assert len(ex.huan_luyen_bpe("abcabcabc", 3)) == 3

    def test_dung_khi_het_cap(self, ex):
        """Van ban 1 ky tu -> khong co cap nao -> tra ve rong."""
        assert ex.huan_luyen_bpe("a", 10) == []

    def test_tai_lap_duoc(self, ex):
        vb = "nam nam nha nha lap lap"
        assert ex.huan_luyen_bpe(vb, 5) == ex.huan_luyen_bpe(vb, 5)

    def test_ap_dung_bpe(self, ex):
        gop = ex.huan_luyen_bpe("ab ab ab", 1)
        assert ex.ap_dung_bpe("aab", gop) == ["a", "ab"]

    def test_ap_dung_khong_co_phep_gop(self, ex):
        assert ex.ap_dung_bpe("abc", []) == ["a", "b", "c"]

    def test_bpe_rut_ngan_chuoi(self, ex):
        vb = "nam nam nam nam nha nha nha"
        gop = ex.huan_luyen_bpe(vb, 5)
        assert len(ex.ap_dung_bpe(vb, gop)) < len(vb)

    def test_giai_ma_lai_duoc(self, ex):
        """Noi cac token lai phai ra chinh van ban goc."""
        vb = "nam nam nha"
        gop = ex.huan_luyen_bpe(vb, 4)
        assert "".join(ex.ap_dung_bpe(vb, gop)) == vb

    def test_thu_tu_phep_gop_quan_trong(self, ex):
        """Phep gop sau co the phu thuoc phep gop truoc."""
        vb = "nam nam nam"
        gop = ex.huan_luyen_bpe(vb, 2)
        assert len(ex.ap_dung_bpe(vb, gop)) < len(ex.ap_dung_bpe(vb, gop[:1]))


class TestSoSanhTokenizer:
    VB = "nam nam nha nha lap trinh lap trinh hoc hoc"

    def test_du_khoa(self, ex):
        ss = ex.so_sanh_tokenizer(self.VB, so_lan_gop=10)
        assert ss is not None, bao_chua_lam("so_sanh_tokenizer")
        assert set(ss) == {"ky_tu", "tu", "bpe"}

    def test_moi_muc_du_khoa(self, ex):
        ss = ex.so_sanh_tokenizer(self.VB, so_lan_gop=10)
        for muc in ss.values():
            assert set(muc) == {"so_token", "tu_vung"}

    def test_ky_tu_cho_chuoi_dai_nhat(self, ex):
        ss = ex.so_sanh_tokenizer(self.VB, so_lan_gop=10)
        assert ss["ky_tu"]["so_token"] > ss["tu"]["so_token"]

    def test_bpe_nam_giua(self, ex):
        """Danh doi co ban: bpe o giua ky tu va tu."""
        ss = ex.so_sanh_tokenizer(self.VB, so_lan_gop=15)
        assert ss["ky_tu"]["so_token"] >= ss["bpe"]["so_token"] >= ss["tu"]["so_token"]

    def test_so_token_ky_tu_bang_do_dai(self, ex):
        ss = ex.so_sanh_tokenizer(self.VB, so_lan_gop=5)
        assert ss["ky_tu"]["so_token"] == len(self.VB)
