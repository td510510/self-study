"""Cham diem ex02_bo_nho.py — Phase 09. KHONG can API key."""

from __future__ import annotations

import pytest

from tests.conftest import bao_chua_lam, nap_module

pytestmark = pytest.mark.phase09


@pytest.fixture(scope="module")
def ex():
    return nap_module("curriculum/09-agents/exercises/ex02_bo_nho.py")


def tao_lich_su(so_cap: int = 5, dai_ket_qua: int = 300) -> list[dict]:
    ls = [{"vai": "nhiem_vu", "noi_dung": "Kiểm tra tồn kho"}]
    for i in range(so_cap):
        ls.append({"vai": "cong_cu", "ten": "tra_cuu_kho",
                   "tham_so": {"ma_hang": f"VX-{i:02d}"}})
        ls.append({"vai": "ket_qua",
                   "noi_dung": {"ok": True, "ket_qua": "x" * dai_ket_qua}})
    return ls


class TestDemTokenUoc:
    def test_co_ket_qua(self, ex):
        n = ex.dem_token_uoc(tao_lich_su(2))
        assert n is not None, bao_chua_lam("dem_token_uoc")
        assert n > 0

    def test_la_so_nguyen(self, ex):
        assert isinstance(ex.dem_token_uoc(tao_lich_su(1)), int)

    def test_lich_su_dai_hon_thi_nhieu_token_hon(self, ex):
        assert ex.dem_token_uoc(tao_lich_su(5)) > ex.dem_token_uoc(tao_lich_su(2))

    def test_lich_su_rong(self, ex):
        assert ex.dem_token_uoc([]) == 0

    def test_dem_ca_noi_dung_long_nhau(self, ex):
        """tham_so va noi_dung la dict - quen dem chung la uoc luong thap han."""
        it = [{"vai": "ket_qua", "noi_dung": {"ok": True, "ket_qua": "a" * 3}}]
        nhieu = [{"vai": "ket_qua", "noi_dung": {"ok": True, "ket_qua": "a" * 300}}]
        assert ex.dem_token_uoc(nhieu) > ex.dem_token_uoc(it) + 50


class TestRutGonKetQua:
    def test_cat_chuoi_dai(self, ex):
        kq = ex.rut_gon_ket_qua(tao_lich_su(1, 300), max_ky_tu=10)
        assert kq is not None, bao_chua_lam("rut_gon_ket_qua")
        assert len(kq[2]["noi_dung"]["ket_qua"]) < 40

    def test_co_dau_hieu_da_rut_gon(self, ex):
        kq = ex.rut_gon_ket_qua(tao_lich_su(1, 300), max_ky_tu=10)
        assert "rút gọn" in kq[2]["noi_dung"]["ket_qua"]

    def test_giu_nguyen_chuoi_ngan(self, ex):
        ls = [{"vai": "ket_qua", "noi_dung": {"ok": True, "ket_qua": "ngắn"}}]
        assert ex.rut_gon_ket_qua(ls, max_ky_tu=100)[0]["noi_dung"]["ket_qua"] == "ngắn"

    def test_giu_nguyen_gia_tri_khong_phai_chuoi(self, ex):
        ls = [{"vai": "ket_qua", "noi_dung": {"ok": True, "so": 12345}}]
        kq = ex.rut_gon_ket_qua(ls, max_ky_tu=2)
        assert kq[0]["noi_dung"]["ok"] is True
        assert kq[0]["noi_dung"]["so"] == 12345

    def test_khong_dong_vao_buoc_khac(self, ex):
        kq = ex.rut_gon_ket_qua(tao_lich_su(1, 300), max_ky_tu=5)
        assert kq[0]["noi_dung"] == "Kiểm tra tồn kho"
        assert kq[1]["ten"] == "tra_cuu_kho"

    def test_khong_sua_lich_su_goc(self, ex):
        """Ham thuan tuy la thu duy nhat ban test duoc mot cach yen tam."""
        goc = tao_lich_su(1, 300)
        moi = ex.rut_gon_ket_qua(goc, max_ky_tu=5)
        assert moi is not None, bao_chua_lam("rut_gon_ket_qua")
        assert len(moi[2]["noi_dung"]["ket_qua"]) < 300
        assert len(goc[2]["noi_dung"]["ket_qua"]) == 300

    def test_giam_token_that_su(self, ex):
        ls = tao_lich_su(4, 500)
        assert ex.dem_token_uoc(ex.rut_gon_ket_qua(ls, 50)) < ex.dem_token_uoc(ls)


class TestCatLichSu:
    def test_giu_dung_so_cap(self, ex):
        kq = ex.cat_lich_su(tao_lich_su(5), giu_cap=2)
        assert kq is not None, bao_chua_lam("cat_lich_su")
        assert len(kq) == 5

    def test_giu_nhiem_vu(self, ex):
        assert ex.cat_lich_su(tao_lich_su(5), 2)[0]["vai"] == "nhiem_vu"

    def test_giu_cap_GAN_NHAT(self, ex):
        kq = ex.cat_lich_su(tao_lich_su(5), 2)
        assert kq[1]["tham_so"]["ma_hang"] == "VX-03"
        assert kq[3]["tham_so"]["ma_hang"] == "VX-04"

    def test_it_cap_hon_thi_giu_het(self, ex):
        assert len(ex.cat_lich_su(tao_lich_su(2), 5)) == 5

    def test_giu_cap_0(self, ex):
        kq = ex.cat_lich_su(tao_lich_su(5), 0)
        assert len(kq) == 1 and kq[0]["vai"] == "nhiem_vu"

    def test_giu_cap_am_thi_loi(self, ex):
        with pytest.raises(ValueError):
            ex.cat_lich_su(tao_lich_su(3), -1)

    def test_khong_sua_goc(self, ex):
        goc = tao_lich_su(5)
        moi = ex.cat_lich_su(goc, 1)
        assert moi is not None, bao_chua_lam("cat_lich_su")
        assert len(moi) == 3
        assert len(goc) == 11


class TestTomTatCu:
    def test_chen_khoi_tom_tat(self, ex):
        kq = ex.tom_tat_cu(tao_lich_su(5), 2, lambda b: "đã tra 3 mặt hàng")
        assert kq is not None, bao_chua_lam("tom_tat_cu")
        assert [b["vai"] for b in kq] == ["nhiem_vu", "tom_tat", "cong_cu",
                                          "ket_qua", "cong_cu", "ket_qua"]

    def test_noi_dung_tom_tat(self, ex):
        kq = ex.tom_tat_cu(tao_lich_su(5), 2, lambda b: "đã tra 3 mặt hàng")
        assert kq[1]["noi_dung"] == "đã tra 3 mặt hàng"

    def test_truyen_dung_cac_buoc_bi_thay(self, ex):
        nhan = {}

        def ghi_lai(cac_buoc):
            nhan["so"] = len(cac_buoc)
            return "tt"

        ex.tom_tat_cu(tao_lich_su(5), 2, ghi_lai)
        assert nhan["so"] == 6          # 3 cap bi thay = 6 phan tu

    def test_khong_co_gi_de_tom_tat(self, ex):
        """Chen khoi tom tat rong chi ton token va lam model boi roi."""
        kq = ex.tom_tat_cu(tao_lich_su(2), 5, lambda b: "tt")
        assert all(b["vai"] != "tom_tat" for b in kq)
        assert len(kq) == 5

    def test_ham_tom_tat_hong_thi_quay_ve_cat(self, ex):
        """Tom tat la mot lan goi API nua - no co the hong."""
        def no_ra(cac_buoc):
            raise RuntimeError("rate limit")

        kq = ex.tom_tat_cu(tao_lich_su(5), 2, no_ra)
        assert all(b["vai"] != "tom_tat" for b in kq)
        assert len(kq) == 5

    def test_giu_cap_gan_nhat(self, ex):
        kq = ex.tom_tat_cu(tao_lich_su(5), 2, lambda b: "tt")
        assert kq[2]["tham_so"]["ma_hang"] == "VX-03"

    def test_khong_sua_goc(self, ex):
        goc = tao_lich_su(5)
        moi = ex.tom_tat_cu(goc, 1, lambda b: "tt")
        assert moi is not None, bao_chua_lam("tom_tat_cu")
        assert any(b["vai"] == "tom_tat" for b in moi)
        assert len(goc) == 11

    def test_giam_token(self, ex):
        ls = tao_lich_su(6, 400)
        assert ex.dem_token_uoc(ex.tom_tat_cu(ls, 2, lambda b: "ngắn")) < \
               ex.dem_token_uoc(ls)


class TestNenDeVua:
    def test_von_da_vua_thi_khong_lam_gi(self, ex):
        ls = tao_lich_su(1, 10)
        moi, da_dung = ex.nen_de_vua(ls, 99999)
        assert da_dung is not None, bao_chua_lam("nen_de_vua")
        assert da_dung == []
        assert len(moi) == len(ls)

    def test_rut_gon_truoc_tien(self, ex):
        """Luon dung bien phap it mat mat nhat truoc."""
        _, da_dung = ex.nen_de_vua(tao_lich_su(3, 900), 200, lambda b: "tt")
        assert da_dung[0] == "rut_gon"

    def test_dung_ngay_khi_da_vua(self, ex):
        ls = tao_lich_su(3, 900)
        vua_du = ex.dem_token_uoc(ex.rut_gon_ket_qua(ls, 200)) + 5
        _, da_dung = ex.nen_de_vua(ls, vua_du, lambda b: "tt")
        assert da_dung == ["rut_gon"]

    def test_bo_qua_tom_tat_khi_khong_co_ham(self, ex):
        _, da_dung = ex.nen_de_vua(tao_lich_su(6, 900), 30, None)
        assert "tom_tat" not in da_dung
        assert "cat" in da_dung

    def test_dung_du_ba_chien_luoc(self, ex):
        _, da_dung = ex.nen_de_vua(tao_lich_su(6, 900), 30, lambda b: "tt")
        assert da_dung == ["rut_gon", "tom_tat", "cat"]

    def test_van_khong_vua_thi_van_tra_ve(self, ex):
        """Nhiem vu qua dai thi de model tu bao, khong lam sap chuong trinh."""
        moi, da_dung = ex.nen_de_vua(tao_lich_su(6, 900), 1, lambda b: "tt")
        assert isinstance(moi, list) and len(moi) >= 1
        assert len(da_dung) == 3

    def test_tra_ve_tuple_hai_phan(self, ex):
        kq = ex.nen_de_vua(tao_lich_su(2, 10), 99999)
        assert isinstance(kq, tuple) and len(kq) == 2

    def test_khong_sua_goc(self, ex):
        goc = tao_lich_su(6, 900)
        kq = ex.nen_de_vua(goc, 10, lambda b: "tt")
        assert kq is not None, bao_chua_lam("nen_de_vua")
        assert kq[1] == ["rut_gon", "tom_tat", "cat"]
        assert len(goc[2]["noi_dung"]["ket_qua"]) == 900


class TestPhatHienLap:
    def _lap(self, so_lan):
        ls = [{"vai": "nhiem_vu", "noi_dung": "x"}]
        for _ in range(so_lan):
            ls.append({"vai": "cong_cu", "ten": "tra_cuu_don",
                       "tham_so": {"ma_don": "DH1001"}})
            ls.append({"vai": "ket_qua", "noi_dung": {"ok": False, "loi": "x"}})
        return ls

    def test_phat_hien_lap(self, ex):
        kq = ex.phat_hien_lap(self._lap(3), nguong=2)
        assert kq is not None, bao_chua_lam("phat_hien_lap")
        assert len(kq) == 1
        assert kq[0]["so_lan"] == 3
        assert kq[0]["ten"] == "tra_cuu_don"

    def test_duoi_nguong_thi_khong_bao(self, ex):
        assert ex.phat_hien_lap(self._lap(1), nguong=2) == []

    def test_khac_tham_so_thi_khong_tinh_la_lap(self, ex):
        ls = [{"vai": "cong_cu", "ten": "t", "tham_so": {"a": 1}},
              {"vai": "cong_cu", "ten": "t", "tham_so": {"a": 2}}]
        assert ex.phat_hien_lap(ls, nguong=2) == []

    def test_thu_tu_tham_so_khong_anh_huong(self, ex):
        """dict khong bam duoc - quen sap xep khoa la bo sot dung cai lap."""
        ls = [{"vai": "cong_cu", "ten": "t", "tham_so": {"a": 1, "b": 2}},
              {"vai": "cong_cu", "ten": "t", "tham_so": {"b": 2, "a": 1}}]
        assert len(ex.phat_hien_lap(ls, nguong=2)) == 1

    def test_sap_theo_so_lan_giam_dan(self, ex):
        ls = [{"vai": "cong_cu", "ten": "it", "tham_so": {}}] * 2 + \
             [{"vai": "cong_cu", "ten": "nhieu", "tham_so": {}}] * 4
        kq = ex.phat_hien_lap(ls, nguong=2)
        assert [x["ten"] for x in kq] == ["nhieu", "it"]

    def test_bo_qua_buoc_khong_phai_cong_cu(self, ex):
        ls = [{"vai": "ket_qua", "noi_dung": {"ok": True}}] * 5
        assert ex.phat_hien_lap(ls, nguong=2) == []

    def test_nguong_khong_hop_le(self, ex):
        with pytest.raises(ValueError):
            ex.phat_hien_lap(self._lap(3), nguong=0)

    def test_lich_su_rong(self, ex):
        assert ex.phat_hien_lap([], nguong=2) == []
