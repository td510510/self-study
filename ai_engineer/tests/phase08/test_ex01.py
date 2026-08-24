"""Cham diem ex01_chunking.py — Phase 08.

Cac test nay KHONG can API key va khong can model embedding.
"""

from __future__ import annotations

import pytest

from tests.conftest import bao_chua_lam, nap_module

pytestmark = pytest.mark.phase08


@pytest.fixture(scope="module")
def ex():
    return nap_module("curriculum/08-rag/exercises/ex01_chunking.py")


class TestCatCoDinh:
    def test_khong_chong_lap(self, ex):
        kq = ex.cat_co_dinh("abcdefghij", 4, 0)
        assert kq is not None, bao_chua_lam("cat_co_dinh")
        assert kq == ["abcd", "efgh", "ij"]

    def test_co_chong_lap(self, ex):
        assert ex.cat_co_dinh("abcdefghij", 4, 2) == ["abcd", "cdef", "efgh", "ghij", "ij"]

    def test_ghep_lai_khong_mat_ky_tu(self, ex):
        """Khong chong lap thi ghep cac chunk phai ra dung van ban ban dau."""
        vb = "Nghi phep nam la 12 ngay lam viec moi nam."
        assert "".join(ex.cat_co_dinh(vb, 7, 0)) == vb

    def test_van_ban_rong(self, ex):
        assert ex.cat_co_dinh("", 10, 2) == []

    def test_ngan_hon_kich_thuoc(self, ex):
        assert ex.cat_co_dinh("abc", 10, 0) == ["abc"]

    def test_chong_lap_bang_kich_thuoc_thi_loi(self, ex):
        """Neu khong chan, buoc nhay = 0 va vong lap chay mai mai."""
        with pytest.raises(ValueError):
            ex.cat_co_dinh("abcdef", 3, 3)

    def test_chong_lap_lon_hon_kich_thuoc_thi_loi(self, ex):
        with pytest.raises(ValueError):
            ex.cat_co_dinh("abcdef", 3, 5)

    def test_kich_thuoc_khong_hop_le_thi_loi(self, ex):
        with pytest.raises(ValueError):
            ex.cat_co_dinh("abcdef", 0, 0)

    def test_moi_chunk_khong_vuot_kich_thuoc(self, ex):
        vb = "x" * 100
        assert all(len(c) <= 12 for c in ex.cat_co_dinh(vb, 12, 3))


class TestCatTheoDoan:
    def test_gop_cac_doan_ngan(self, ex):
        kq = ex.cat_theo_doan("aaa\n\nbbb\n\n" + "c" * 26, 20)
        assert kq is not None, bao_chua_lam("cat_theo_doan")
        assert kq == ["aaa\n\nbbb", "c" * 26]

    def test_doan_dai_giu_nguyen_khong_cat_doi(self, ex):
        """Doan dai la mot don vi y nghia - cat doi thuong hong ca hai nua."""
        dai = "d" * 50
        assert dai in ex.cat_theo_doan(dai, 10)

    def test_bo_qua_doan_trong(self, ex):
        kq = ex.cat_theo_doan("aaa\n\n   \n\nbbb", 100)
        assert kq == ["aaa\n\nbbb"]

    def test_van_ban_rong(self, ex):
        assert ex.cat_theo_doan("", 100) == []
        assert ex.cat_theo_doan("   \n\n  ", 100) == []

    def test_kich_thuoc_khong_hop_le_thi_loi(self, ex):
        with pytest.raises(ValueError):
            ex.cat_theo_doan("aaa", 0)

    def test_khong_mat_doan_nao(self, ex):
        vb = "\n\n".join(f"doan {i}" for i in range(10))
        kq = ex.cat_theo_doan(vb, 25)
        for i in range(10):
            assert any(f"doan {i}" in c for c in kq)


class TestCatTheoTieuDe:
    VB = "# T\n\nmo dau\n\n## A\n\nnoi dung A\n\n## B\n\nnoi dung B"

    def test_cat_dung_so_chunk(self, ex):
        kq = ex.cat_theo_tieu_de(self.VB)
        assert kq is not None, bao_chua_lam("cat_theo_tieu_de")
        assert len(kq) == 3

    def test_giu_lai_dong_tieu_de(self, ex):
        kq = ex.cat_theo_tieu_de(self.VB)
        assert kq[1].startswith("## A")
        assert kq[2].startswith("## B")

    def test_phan_mo_dau_thanh_chunk_rieng(self, ex):
        assert ex.cat_theo_tieu_de(self.VB)[0] == "# T\n\nmo dau"

    def test_khong_cat_o_tieu_de_cap_sau_hon(self, ex):
        """'### C' KHONG duoc cat khi muc=2 - day la loi startswith kinh dien."""
        vb = "## A\n\nnoi dung\n\n### C\n\nchi tiet\n\n## B\n\nkhac"
        kq = ex.cat_theo_tieu_de(vb, muc=2)
        assert len(kq) == 2
        assert "### C" in kq[0]

    def test_khong_co_tieu_de(self, ex):
        assert ex.cat_theo_tieu_de("chi la van ban thuong") == ["chi la van ban thuong"]

    def test_loai_chunk_rong(self, ex):
        assert all(c.strip() for c in ex.cat_theo_tieu_de("## A\n\n## B\n\nnoi dung"))

    def test_muc_khong_hop_le_thi_loi(self, ex):
        with pytest.raises(ValueError):
            ex.cat_theo_tieu_de("## A", muc=0)


class TestThongKeChunk:
    def test_cac_gia_tri(self, ex):
        kq = ex.thong_ke_chunk(["abc", "de", "fghij"])
        assert kq is not None, bao_chua_lam("thong_ke_chunk")
        assert kq["so_chunk"] == 3
        assert kq["ngan_nhat"] == 2
        assert kq["dai_nhat"] == 5
        assert kq["tong_ky_tu"] == 10
        assert kq["do_dai_tb"] == pytest.approx(10 / 3)

    def test_danh_sach_rong(self, ex):
        kq = ex.thong_ke_chunk([])
        assert kq["so_chunk"] == 0
        assert kq["do_dai_tb"] == 0.0
        assert kq["tong_ky_tu"] == 0

    def test_du_khoa(self, ex):
        kq = ex.thong_ke_chunk(["abc"])
        for khoa in ("so_chunk", "do_dai_tb", "ngan_nhat", "dai_nhat", "tong_ky_tu"):
            assert khoa in kq, f"Thieu khoa {khoa!r}"

    def test_do_dai_tb_la_float(self, ex):
        assert isinstance(ex.thong_ke_chunk(["abcd", "efgh"])["do_dai_tb"], float)


class TestChunkChua:
    def test_tim_thay_binh_thuong(self, ex):
        kq = ex.chunk_chua(["nghi om toi da 3 ngay"], "toi da 3 ngay")
        assert kq is not None, bao_chua_lam("chunk_chua")
        assert kq is True

    def test_bo_qua_xuong_dong_va_khoang_trang_thua(self, ex):
        """Tai lieu that bi xuong dong giua chung - day la case hay gap NHAT."""
        assert ex.chunk_chua(["nghi  om\ntoi da 3 ngay"], "om toi da 3 ngay") is True

    def test_khong_tim_thay(self, ex):
        assert ex.chunk_chua(["nghi om 3 ngay"], "nghi thai san") is False

    def test_trich_dan_rong(self, ex):
        assert ex.chunk_chua(["abc"], "") is True
        assert ex.chunk_chua([], "   ") is True

    def test_danh_sach_rong(self, ex):
        assert ex.chunk_chua([], "abc") is False

    def test_phan_biet_hoa_thuong(self, ex):
        """Bo eval de dai hon that su se cho diem cao gia - con te hon khong co."""
        assert ex.chunk_chua(["Nghi Om 3 Ngay"], "nghi om 3 ngay") is False

    def test_tim_trong_chunk_thu_hai(self, ex):
        assert ex.chunk_chua(["aaa", "bbb ccc"], "bbb ccc") is True
