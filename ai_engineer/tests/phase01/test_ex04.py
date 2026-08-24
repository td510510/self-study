"""Cham diem ex04_ham.py — Phase 01."""

from __future__ import annotations

import pytest

from tests.conftest import bao_chua_lam, nap_module

pytestmark = pytest.mark.phase01


@pytest.fixture(scope="module")
def ex():
    return nap_module("curriculum/01-python-foundations/exercises/ex04_ham.py")


class TestThemVaoGio:
    def test_co_ket_qua(self, ex):
        assert ex.them_vao_gio("tao") is not None, bao_chua_lam("them_vao_gio")

    def test_them_vao_gio_co_san(self, ex):
        assert ex.them_vao_gio("cam", ["tao"]) == ["tao", "cam"]

    def test_bay_mutable_default(self, ex):
        """Bay kinh dien: goi hai lan lien tiep phai ra hai gio RIENG."""
        lan_1 = ex.them_vao_gio("tao")
        lan_2 = ex.them_vao_gio("cam")
        assert lan_1 == ["tao"]
        assert lan_2 == ["cam"], (
            "Lan goi thu hai tra ve ['tao','cam'] - ban dang dung "
            "`gio_hang=[]` lam gia tri mac dinh. Phai dung None."
        )

    def test_goi_nhieu_lan(self, ex):
        for _ in range(5):
            assert ex.them_vao_gio("x") == ["x"]


class TestApDungChoTatCa:
    def test_nhan_doi(self, ex):
        assert ex.ap_dung_cho_tat_ca([1, 2, 3], lambda x: x * 2) == [2, 4, 6]

    def test_can_bac_hai(self, ex):
        assert ex.ap_dung_cho_tat_ca([1, 4, 9], lambda x: x**0.5) == [1.0, 2.0, 3.0]

    def test_ham_dung_san(self, ex):
        assert ex.ap_dung_cho_tat_ca([-1, -2], abs) == [1, 2]

    def test_rong(self, ex):
        assert ex.ap_dung_cho_tat_ca([], abs) == []


class TestThongKe:
    def test_co_ket_qua(self, ex):
        assert ex.thong_ke([1]) is not None, bao_chua_lam("thong_ke")

    def test_binh_thuong(self, ex):
        assert ex.thong_ke([1, 2, 3]) == (1, 3, 2.0)
        assert ex.thong_ke([5]) == (5, 5, 5.0)

    def test_list_rong(self, ex):
        assert ex.thong_ke([]) == (0.0, 0.0, 0.0)

    def test_so_am(self, ex):
        assert ex.thong_ke([-5, 0, 5]) == (-5, 5, 0.0)


class TestTaoCauThongBao:
    def test_co_ket_qua(self, ex):
        assert ex.tao_cau_thong_bao("An", "X") is not None, bao_chua_lam(
            "tao_cau_thong_bao"
        )

    def test_nhieu_muc(self, ex):
        assert ex.tao_cau_thong_bao("An", "Hoc bai", "Nop bai") == (
            "Thong bao cho An:\n- Hoc bai\n- Nop bai"
        )

    def test_doi_tieu_de(self, ex):
        assert ex.tao_cau_thong_bao("An", "Hoc bai", tieu_de="Nhac nho") == (
            "Nhac nho cho An:\n- Hoc bai"
        )

    def test_khong_co_muc(self, ex):
        assert ex.tao_cau_thong_bao("An") == "Thong bao cho An:"

    def test_tieu_de_la_keyword_only(self, ex):
        """tieu_de phai nam sau dau * -> chi truyen duoc bang ten."""
        kq = ex.tao_cau_thong_bao("An", "Nhac")
        assert "- Nhac" in kq, (
            "Doi so vi tri thu 2 phai duoc coi la mot MUC, khong phai tieu de"
        )


class TestTinhLaiKep:
    def test_tinh_dung(self, ex):
        assert abs(ex.tinh_lai_kep(1000, 0.1, 2) - 1210) < 1e-6
        assert abs(ex.tinh_lai_kep(1000, 0, 5) - 1000) < 1e-6

    def test_von_khong_hop_le(self, ex):
        with pytest.raises(ValueError):
            ex.tinh_lai_kep(-5, 0.1, 1)
        with pytest.raises(ValueError):
            ex.tinh_lai_kep(0, 0.1, 1)

    def test_lai_suat_am(self, ex):
        with pytest.raises(ValueError):
            ex.tinh_lai_kep(1000, -0.1, 1)

    def test_so_nam_am(self, ex):
        with pytest.raises(ValueError):
            ex.tinh_lai_kep(1000, 0.1, -1)

    def test_thong_bao_loi_co_gia_tri(self, ex):
        """Thong bao loi tot phai noi ro gia tri nao gay loi."""
        with pytest.raises(ValueError) as loi:
            ex.tinh_lai_kep(-999, 0.1, 1)
        assert "-999" in str(loi.value), (
            "Thong bao loi nen chua gia tri gay loi de de debug"
        )


class TestTangGia:
    def test_tang_dung(self, ex):
        assert ex.tang_gia([{"ten": "A", "gia": 100}], 10) == [{"ten": "A", "gia": 110}]

    def test_khong_sua_du_lieu_goc(self, ex):
        goc = [{"ten": "A", "gia": 100}]
        ex.tang_gia(goc, 10)
        assert goc == [{"ten": "A", "gia": 100}], (
            "Ham da sua du lieu goc! Phai tao dict moi."
        )

    def test_lam_tron(self, ex):
        assert ex.tang_gia([{"ten": "A", "gia": 101}], 5) == [{"ten": "A", "gia": 106}]

    def test_giu_cac_khoa_khac(self, ex):
        kq = ex.tang_gia([{"ten": "A", "gia": 100, "mau": "do"}], 0)
        assert kq[0]["mau"] == "do", "Phai giu lai moi khoa khac cua san pham"

    def test_rong(self, ex):
        assert ex.tang_gia([], 10) == []
