"""Cham diem ex05_file.py — Phase 01.

Cac test nay dung fixture `tmp_path` cua pytest: mot thu muc tam duoc tao moi
cho tung test roi tu xoa. Du lieu that cua ban khong the bi anh huong.
"""

from __future__ import annotations

import json

import pytest

from tests.conftest import nap_module

pytestmark = pytest.mark.phase01


@pytest.fixture(scope="module")
def ex():
    return nap_module("curriculum/01-python-foundations/exercises/ex05_file.py")


class TestFileVanBan:
    def test_ghi_roi_doc(self, ex, tmp_path):
        p = tmp_path / "a.txt"
        ex.ghi_danh_sach(p, ["dong 1", "dong 2"])
        assert ex.doc_danh_sach(p) == ["dong 1", "dong 2"]

    def test_noi_dung_file_dung(self, ex, tmp_path):
        p = tmp_path / "a.txt"
        ex.ghi_danh_sach(p, ["a", "b"])
        assert p.read_text(encoding="utf-8") == "a\nb\n"

    def test_list_rong(self, ex, tmp_path):
        p = tmp_path / "rong.txt"
        ex.ghi_danh_sach(p, [])
        assert p.exists()
        assert ex.doc_danh_sach(p) == []

    def test_bo_qua_dong_trong(self, ex, tmp_path):
        p = tmp_path / "a.txt"
        p.write_text("a\n\n   \nb\n", encoding="utf-8")
        assert ex.doc_danh_sach(p) == ["a", "b"]

    def test_file_khong_ton_tai(self, ex, tmp_path):
        assert ex.doc_danh_sach(tmp_path / "khong_co.txt") == []

    def test_tieng_viet(self, ex, tmp_path):
        p = tmp_path / "vn.txt"
        ex.ghi_danh_sach(p, ["Nguyễn Văn Nam", "Trần Thị B"])
        assert ex.doc_danh_sach(p) == ["Nguyễn Văn Nam", "Trần Thị B"]


class TestJSON:
    def test_luu_roi_doc(self, ex, tmp_path):
        p = tmp_path / "a.json"
        du_lieu = {"ten": "An", "diem": [8, 9]}
        ex.luu_json(p, du_lieu)
        assert ex.doc_json(p) == du_lieu

    def test_tieng_viet_khong_bi_escape(self, ex, tmp_path):
        p = tmp_path / "vn.json"
        ex.luu_json(p, {"ten": "Nguyễn Văn Nam"})
        noi_dung = p.read_text(encoding="utf-8")
        assert "Nguyễn Văn Nam" in noi_dung, (
            "Thieu ensure_ascii=False - tieng Viet bi ghi thanh ma \\uXXXX"
        )

    def test_co_thut_le(self, ex, tmp_path):
        p = tmp_path / "a.json"
        ex.luu_json(p, {"a": 1, "b": 2})
        assert "\n" in p.read_text(encoding="utf-8"), "Thieu indent=2"

    def test_file_khong_ton_tai(self, ex, tmp_path):
        assert ex.doc_json(tmp_path / "khong_co.json") == {}

    def test_mac_dinh_tuy_chinh(self, ex, tmp_path):
        assert ex.doc_json(tmp_path / "khong_co.json", {"a": 1}) == {"a": 1}

    def test_file_hong(self, ex, tmp_path):
        p = tmp_path / "hong.json"
        p.write_text("{day khong phai json", encoding="utf-8")
        assert ex.doc_json(p) == {}, "File hong cung phai tra ve mac dinh"


class TestCSV:
    DU_LIEU = [{"ten": "An", "diem": 8}, {"ten": "Binh", "diem": 9}]

    def test_ghi_roi_doc(self, ex, tmp_path):
        p = tmp_path / "a.csv"
        ex.ghi_csv(p, self.DU_LIEU)
        assert ex.doc_csv(p) == [
            {"ten": "An", "diem": "8"},
            {"ten": "Binh", "diem": "9"},
        ]

    def test_co_dong_tieu_de(self, ex, tmp_path):
        p = tmp_path / "a.csv"
        ex.ghi_csv(p, self.DU_LIEU)
        dong_dau = p.read_text(encoding="utf-8").splitlines()[0]
        assert dong_dau == "ten,diem"

    def test_khong_co_dong_trong_thua(self, ex, tmp_path):
        """Thieu newline='' se sinh dong trong xen giua tren Windows."""
        p = tmp_path / "a.csv"
        ex.ghi_csv(p, self.DU_LIEU)
        cac_dong = p.read_text(encoding="utf-8").splitlines()
        assert "" not in cac_dong, (
            "File CSV co dong trong xen giua - thieu tham so newline=\"\" khi mo file"
        )

    def test_list_rong(self, ex, tmp_path):
        p = tmp_path / "rong.csv"
        ex.ghi_csv(p, [])
        assert p.exists()
        assert ex.doc_csv(p) == []

    def test_file_khong_ton_tai(self, ex, tmp_path):
        assert ex.doc_csv(tmp_path / "khong_co.csv") == []


class TestDemTuTrongFile:
    def test_dem_dung(self, ex, tmp_path):
        p = tmp_path / "van.txt"
        p.write_text("Meo an ca. Meo ngu. Ca ngon!", encoding="utf-8")
        assert ex.dem_tu_trong_file(p, 3) == [("ca", 2), ("meo", 2), ("an", 1)]

    def test_gioi_han_top(self, ex, tmp_path):
        p = tmp_path / "van.txt"
        p.write_text("a a a b b c", encoding="utf-8")
        assert ex.dem_tu_trong_file(p, 1) == [("a", 3)]
        assert len(ex.dem_tu_trong_file(p, 2)) == 2

    def test_khong_phan_biet_hoa_thuong(self, ex, tmp_path):
        p = tmp_path / "van.txt"
        p.write_text("Meo meo MEO", encoding="utf-8")
        assert ex.dem_tu_trong_file(p, 1) == [("meo", 3)]

    def test_bo_dau_cau(self, ex, tmp_path):
        p = tmp_path / "van.txt"
        p.write_text("ca. ca, ca!", encoding="utf-8")
        assert ex.dem_tu_trong_file(p, 1) == [("ca", 3)]

    def test_file_khong_ton_tai(self, ex, tmp_path):
        assert ex.dem_tu_trong_file(tmp_path / "khong_co.txt") == []


def test_json_ghi_dung_chuan(ex, tmp_path):
    """File ghi ra phai doc lai duoc bang json chuan."""
    p = tmp_path / "a.json"
    ex.luu_json(p, {"a": [1, 2], "b": {"c": 3}})
    with open(p, encoding="utf-8") as f:
        assert json.load(f) == {"a": [1, 2], "b": {"c": 3}}
