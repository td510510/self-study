"""Cham diem ex02_structured_output.py — Phase 07.

Cac test nay KHONG can API key, nhung can pydantic:
    pip install -e ".[llm]"
"""

from __future__ import annotations

import pytest

from tests.conftest import bao_chua_lam, nap_module

pytestmark = pytest.mark.phase07

pytest.importorskip(
    "pydantic", reason='Chua cai pydantic. Chay:  pip install -e ".[llm]"'
)


@pytest.fixture(scope="module")
def ex():
    return nap_module("curriculum/07-llm-engineering/exercises/ex02_structured_output.py")


MAU_TOT = """```json
{
  "ten_cua_hang": "Sieu thi ABC",
  "tong_tien": 250000,
  "ngay": "2026-08-22",
  "so_dien_thoai": null,
  "cac_mat_hang": ["Sua", "Banh mi"]
}
```"""


class TestSchemaHoaDon:
    def test_tao_duoc_voi_truong_bat_buoc(self, ex):
        hd = ex.HoaDon(ten_cua_hang="A", tong_tien=100.0, ngay="2026-01-01")
        assert hd.ten_cua_hang == "A"

    def test_truong_tuy_chon_mac_dinh(self, ex):
        hd = ex.HoaDon(ten_cua_hang="A", tong_tien=100.0, ngay="2026-01-01")
        assert hd.so_dien_thoai is None
        assert hd.cac_mat_hang == []

    def test_thieu_truong_bat_buoc_thi_loi(self, ex):
        from pydantic import ValidationError

        with pytest.raises(ValidationError):
            ex.HoaDon(ten_cua_hang="A")

    def test_moi_hoa_don_co_list_rieng(self, ex):
        """Bay mutable default - phai dung default_factory=list."""
        a = ex.HoaDon(ten_cua_hang="A", tong_tien=1.0, ngay="x")
        b = ex.HoaDon(ten_cua_hang="B", tong_tien=1.0, ngay="x")
        a.cac_mat_hang.append("X")
        assert b.cac_mat_hang == [], "Hai hoa don dang dung chung mot list!"

    def test_moi_truong_co_description(self, ex):
        schema = ex.HoaDon.model_json_schema()
        for ten, tt in schema["properties"].items():
            assert "description" in tt, (
                f"Truong {ten} thieu Field(description=...) - "
                "model can mo ta nay de biet phai dien gi"
            )

    def test_tong_tien_la_so(self, ex):
        hd = ex.HoaDon(ten_cua_hang="A", tong_tien="250000", ngay="x")
        assert isinstance(hd.tong_tien, float)


class TestGoRaoMarkdown:
    def test_rao_co_json(self, ex):
        assert ex.go_rao_markdown('```json\n{"a": 1}\n```') == '{"a": 1}'

    def test_rao_khong_ten(self, ex):
        assert ex.go_rao_markdown('```\n{"a": 1}\n```') == '{"a": 1}'

    def test_khong_co_rao(self, ex):
        assert ex.go_rao_markdown('{"a": 1}') == '{"a": 1}'

    def test_co_khoang_trang_thua(self, ex):
        assert ex.go_rao_markdown('  {"a": 1}  ') == '{"a": 1}'

    def test_json_nhieu_dong(self, ex):
        kq = ex.go_rao_markdown('```json\n{\n  "a": 1\n}\n```')
        assert kq.startswith("{") and kq.endswith("}")


class TestTrichJson:
    def test_co_van_xuoi_xung_quanh(self, ex):
        assert ex.trich_json_dau_tien('Ket qua: {"a": 1} xong.') == '{"a": 1}'

    def test_json_long_nhau(self, ex):
        assert ex.trich_json_dau_tien('{"a": {"b": 2}}') == '{"a": {"b": 2}}'

    def test_khong_co_json(self, ex):
        assert ex.trich_json_dau_tien("khong co json") is None

    def test_ngoac_khong_can_bang(self, ex):
        assert ex.trich_json_dau_tien('{"a": 1') is None

    def test_ngoac_trong_chuoi(self, ex):
        """Chuoi JSON co the CHUA dau ngoac - khong duoc dem chung."""
        s = '{"a": "co { trong chuoi"}'
        assert ex.trich_json_dau_tien(s) == s

    def test_dau_nhay_da_thoat(self, ex):
        s = '{"a": "co \\" trong chuoi"}'
        assert ex.trich_json_dau_tien(s) == s

    def test_lay_doi_tuong_dau_tien(self, ex):
        assert ex.trich_json_dau_tien('{"a": 1} {"b": 2}') == '{"a": 1}'

    def test_ket_qua_parse_duoc(self, ex):
        import json

        s = ex.trich_json_dau_tien('Day: {"a": {"b": [1, 2]}} het.')
        assert json.loads(s) == {"a": {"b": [1, 2]}}


class TestPhanTichHoaDon:
    def test_thanh_cong(self, ex):
        ok, hd = ex.phan_tich_hoa_don(MAU_TOT)
        assert ok is True
        assert hd.ten_cua_hang == "Sieu thi ABC"
        assert hd.tong_tien == 250000.0
        assert hd.cac_mat_hang == ["Sua", "Banh mi"]

    def test_khong_co_json(self, ex):
        ok, loi = ex.phan_tich_hoa_don("khong co gi o day")
        assert ok is False and "Khong tim thay JSON" in loi

    def test_json_hong(self, ex):
        ok, loi = ex.phan_tich_hoa_don('{"a": 1,}')
        assert ok is False and "JSON khong hop le" in loi

    def test_thieu_truong(self, ex):
        ok, loi = ex.phan_tich_hoa_don('{"ten_cua_hang": "A"}')
        assert ok is False and "Thieu hoac sai truong" in loi

    def test_json_tran_khong_rao(self, ex):
        ok, hd = ex.phan_tich_hoa_don(
            '{"ten_cua_hang": "B", "tong_tien": 1, "ngay": "x"}'
        )
        assert ok is True and hd.ten_cua_hang == "B"

    def test_co_van_xuoi_truoc_sau(self, ex):
        ok, hd = ex.phan_tich_hoa_don(
            'Toi da trich xuat: {"ten_cua_hang": "C", "tong_tien": 1, "ngay": "x"} Xong!'
        )
        assert ok is True and hd.ten_cua_hang == "C"

    def test_khong_nem_ngoai_le(self, ex):
        """Mau Result type - khong duoc nem loi, phai tra ve (False, loi)."""
        for xau in ["", "   ", "{{{", '{"a"']:
            try:
                ok, _ = ex.phan_tich_hoa_don(xau)
            except Exception as e:  # noqa: BLE001
                pytest.fail(f"Khong duoc nem ngoai le: {type(e).__name__}")
            assert ok is False


class TestMoTaSchema:
    def test_moi_truong_mot_dong(self, ex):
        mt = ex.mo_ta_schema(ex.HoaDon)
        assert mt.count("\n") == 4          # 5 truong -> 4 dau xuong dong

    def test_dinh_dang_dong(self, ex):
        mt = ex.mo_ta_schema(ex.HoaDon)
        assert "- ten_cua_hang (string):" in mt

    def test_truong_co_the_none(self, ex):
        """so_dien_thoai la str|None -> schema dung anyOf, phai xu ly duoc."""
        mt = ex.mo_ta_schema(ex.HoaDon)
        assert "- so_dien_thoai (string):" in mt, (
            "Truong co the None dung anyOf thay vi type - can xu ly rieng"
        )

    def test_co_mo_ta(self, ex):
        mt = ex.mo_ta_schema(ex.HoaDon)
        assert "YYYY-MM-DD" in mt

    def test_model_khac(self, ex):
        from pydantic import BaseModel, Field

        class M(BaseModel):
            ten: str = Field(description="Ten day du")
            tuoi: int = Field(description="Tuoi tinh bang nam")

        assert ex.mo_ta_schema(M) == (
            "- ten (string): Ten day du\n- tuoi (integer): Tuoi tinh bang nam"
        )


class TestTaoPromptTrichXuat:
    def test_chua_van_ban(self, ex):
        p = ex.tao_prompt_trich_xuat("Hoa don ABC", ex.HoaDon)
        assert "Hoa don ABC" in p

    def test_co_the_xml(self, ex):
        p = ex.tao_prompt_trich_xuat("X", ex.HoaDon)
        assert "<van_ban>" in p and "</van_ban>" in p

    def test_co_ba_quy_tac(self, ex):
        p = ex.tao_prompt_trich_xuat("X", ex.HoaDon)
        assert "Chi tra ve JSON" in p
        assert "null" in p
        assert "Khong bia" in p

    def test_co_mo_ta_schema(self, ex):
        p = ex.tao_prompt_trich_xuat("X", ex.HoaDon)
        assert "- ten_cua_hang" in p


class TestSoSanhTrichXuat:
    def test_mot_nua_dung(self, ex):
        assert ex.so_sanh_trich_xuat({"a": 1, "b": 2}, {"a": 1, "b": 3}) == {
            "so_truong": 2, "so_dung": 1, "do_chinh_xac": 0.5, "truong_sai": ["b"]
        }

    def test_dung_het(self, ex):
        kq = ex.so_sanh_trich_xuat({"a": 1}, {"a": 1})
        assert kq["do_chinh_xac"] == 1.0 and kq["truong_sai"] == []

    def test_truong_thieu_tinh_la_sai(self, ex):
        kq = ex.so_sanh_trich_xuat({}, {"a": 1, "b": 2})
        assert kq["so_dung"] == 0
        assert kq["truong_sai"] == ["a", "b"]

    def test_chuan_rong(self, ex):
        kq = ex.so_sanh_trich_xuat({"a": 1}, {})
        assert kq["do_chinh_xac"] == 0.0 and kq["so_truong"] == 0

    def test_bo_qua_truong_thua(self, ex):
        kq = ex.so_sanh_trich_xuat({"a": 1, "thua": 9}, {"a": 1})
        assert kq["do_chinh_xac"] == 1.0

    def test_truong_sai_da_sap_xep(self, ex):
        kq = ex.so_sanh_trich_xuat({}, {"z": 1, "a": 2, "m": 3})
        assert kq["truong_sai"] == ["a", "m", "z"]
