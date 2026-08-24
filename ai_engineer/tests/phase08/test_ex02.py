"""Cham diem ex02_tim_kiem.py — Phase 08.

KHONG can API key va KHONG can model embedding: cac test tu tao vector.
"""

from __future__ import annotations

import numpy as np
import pytest

from tests.conftest import bao_chua_lam, nap_module

pytestmark = pytest.mark.phase08


@pytest.fixture(scope="module")
def ex():
    return nap_module("curriculum/08-rag/exercises/ex02_tim_kiem.py")


KHO_MAU = [
    "Nhan vien chinh thuc co 12 ngay phep nam moi nam",
    "Ma loi VX-204 la xung dot du lieu cham cong",
    "Luong duoc tra vao ngay 5 hang thang",
    "Nghi om toi da 3 ngay khong can giay to",
]


class TestTachTu:
    def test_giu_ma_loi_nguyen_ven(self, ex):
        kq = ex.tach_tu("Ma loi VX-204!")
        assert kq is not None, bao_chua_lam("tach_tu")
        assert kq == ["ma", "loi", "vx-204"]

    def test_giu_so_co_dau_cham(self, ex):
        assert ex.tach_tu("Phi 40.000 dong.") == ["phi", "40.000", "dong"]

    def test_dau_cau_don_le_khong_thanh_tu(self, ex):
        assert ex.tach_tu("Nghi phep - 12 ngay") == ["nghi", "phep", "12", "ngay"]

    def test_ha_thuong(self, ex):
        assert ex.tach_tu("NGHI PHEP") == ["nghi", "phep"]

    def test_tieng_viet_co_dau(self, ex):
        """Chu HOA co dau khong nam trong dai a-y: quen ha thuong la vo tu."""
        assert ex.tach_tu("Nghỉ Phép") == ["nghỉ", "phép"]

    def test_chuoi_rong(self, ex):
        assert ex.tach_tu("") == []

    def test_chi_dau_cau(self, ex):
        assert ex.tach_tu("!!! ... ---") == []


class TestBM25:
    def test_tim_dung_tai_lieu(self, ex):
        bm = ex.BM25(KHO_MAU)
        kq = bm.tim("VX-204", k=1)
        assert kq is not None, bao_chua_lam("BM25.tim")
        assert kq[0][0] == 1

    def test_diem_dung_so_luong(self, ex):
        diem = ex.BM25(KHO_MAU).diem("phep nam")
        assert len(diem) == len(KHO_MAU)

    def test_tu_khong_co_thi_diem_0(self, ex):
        diem = ex.BM25(KHO_MAU).diem("bao hanh san pham")
        assert all(d == 0 for d in diem)

    def test_tai_lieu_khong_lien_quan_duoc_0(self, ex):
        diem = ex.BM25(KHO_MAU).diem("VX-204")
        assert diem[1] > 0
        assert diem[0] == 0

    def test_kho_rong(self, ex):
        """Kho rong phai tao duoc doi tuong va tra ve [] - khong chia cho 0."""
        bm = ex.BM25([])
        assert bm.diem("bat ky") == []
        assert bm.tim("bat ky", 5) == []

    def test_k_lon_hon_so_tai_lieu(self, ex):
        assert len(ex.BM25(KHO_MAU).tim("phep", k=100)) == len(KHO_MAU)

    def test_k_khong_duong(self, ex):
        assert ex.BM25(KHO_MAU).tim("phep", k=0) == []

    def test_sap_giam_dan(self, ex):
        kq = ex.BM25(KHO_MAU).tim("ngay", k=4)
        diem = [d for _, d in kq]
        assert diem == sorted(diem, reverse=True)

    def test_tai_lap_duoc_khi_bang_diem(self, ex):
        """Nhieu tai lieu cung 0 diem -> thu tu phai on dinh giua cac lan chay."""
        bm = ex.BM25(KHO_MAU)
        kq = bm.tim("khongcotutnay", k=4)
        assert kq is not None, bao_chua_lam("BM25.tim")
        assert [i for i, _ in kq] == [0, 1, 2, 3]
        assert kq == bm.tim("khongcotutnay", k=4)

    def test_tra_ve_chi_so_va_diem(self, ex):
        i, d = ex.BM25(KHO_MAU).tim("phep", k=1)[0]
        assert isinstance(i, int)
        assert isinstance(d, float)

    def test_tu_lap_lai_khong_lam_idf_am(self, ex):
        """df phai dem MOI tai lieu mot lan; quen set() la IDF am."""
        bm = ex.BM25(["a a a a a b", "a c"])
        assert all(d >= 0 for d in bm.diem("a"))


class TestChuanHoa:
    def test_vector_don(self, ex):
        v = ex.chuan_hoa(np.array([3.0, 4.0]))
        assert v is not None, bao_chua_lam("chuan_hoa")
        assert np.linalg.norm(v) == pytest.approx(1.0)

    def test_vector_0_khong_gay_nan(self, ex):
        v = ex.chuan_hoa(np.array([0.0, 0.0]))
        assert not np.isnan(v).any()

    def test_ma_tran_chuan_hoa_tung_dong(self, ex):
        m = ex.chuan_hoa(np.array([[3.0, 4.0], [1.0, 0.0]]))
        assert np.allclose(np.linalg.norm(m, axis=1), [1.0, 1.0])

    def test_ma_tran_co_dong_0(self, ex):
        m = ex.chuan_hoa(np.array([[3.0, 4.0], [0.0, 0.0]]))
        assert not np.isnan(m).any()

    def test_giu_nguyen_huong(self, ex):
        v = ex.chuan_hoa(np.array([2.0, 0.0]))
        assert v[0] > 0 and v[1] == pytest.approx(0.0)


class TestTimTheoVector:
    KHO = np.array([[1.0, 0.0], [0.0, 1.0], [1.0, 1.0]], dtype=np.float32)

    def test_tim_dung_muc_gan_nhat(self, ex):
        kq = ex.tim_theo_vector(self.KHO, np.array([1.0, 0.0]), k=1)
        assert kq is not None, bao_chua_lam("tim_theo_vector")
        assert kq[0][0] == 0

    def test_diem_cosine_dung(self, ex):
        kq = dict(ex.tim_theo_vector(self.KHO, np.array([1.0, 0.0]), k=3))
        assert kq[0] == pytest.approx(1.0, abs=1e-5)
        assert kq[2] == pytest.approx(0.7071, abs=1e-3)

    def test_tu_chuan_hoa_truy_van(self, ex):
        """Truy van chua chuan hoa van phai ra diem cosine dung."""
        kq = ex.tim_theo_vector(self.KHO, np.array([5.0, 0.0]), k=1)
        assert kq[0][1] == pytest.approx(1.0, abs=1e-5)

    def test_kho_rong(self, ex):
        assert ex.tim_theo_vector(np.zeros((0, 2)), np.array([1.0, 0.0]), k=3) == []

    def test_k_khong_duong(self, ex):
        assert ex.tim_theo_vector(self.KHO, np.array([1.0, 0.0]), k=0) == []

    def test_k_lon_hon_so_muc(self, ex):
        assert len(ex.tim_theo_vector(self.KHO, np.array([1.0, 0.0]), k=99)) == 3

    def test_sai_so_chieu_thi_loi(self, ex):
        with pytest.raises(ValueError):
            ex.tim_theo_vector(self.KHO, np.array([1.0, 0.0, 0.0]), k=1)

    def test_thong_bao_loi_co_ca_hai_so_chieu(self, ex):
        """'Sai so chieu' khong giup ai; '3 vs 2' cho biet ngay van de o dau."""
        with pytest.raises(ValueError) as e:
            ex.tim_theo_vector(self.KHO, np.array([1.0, 0.0, 0.0]), k=1)
        assert "3" in str(e.value) and "2" in str(e.value)

    def test_diem_la_float_thuong(self, ex):
        """numpy.float32 khong json.dumps duoc - loi chi lo ra luc luu ket qua."""
        kq = ex.tim_theo_vector(self.KHO, np.array([1.0, 0.0]), k=1)
        assert type(kq[0][1]) is float


class TestHopNhatRRF:
    def test_muc_co_o_ca_hai_bang_duoc_uu_tien(self, ex):
        kq = ex.hop_nhat_rrf([[3, 1, 2], [1, 3, 5]], k=1)
        assert kq is not None, bao_chua_lam("hop_nhat_rrf")
        assert kq[0][0] in (1, 3)

    def test_sap_giam_dan(self, ex):
        diem = [d for _, d in ex.hop_nhat_rrf([[3, 1, 2], [1, 3, 5]], k=5)]
        assert diem == sorted(diem, reverse=True)

    def test_gop_du_muc(self, ex):
        kq = ex.hop_nhat_rrf([[1, 2], [3, 4]], k=10)
        assert {i for i, _ in kq} == {1, 2, 3, 4}

    def test_bang_diem_thi_chi_so_nho_truoc(self, ex):
        """Tai lap duoc la dieu kien bat buoc de eval co nghia."""
        kq2 = ex.hop_nhat_rrf([[7, 3], [3, 7]], k=2)
        assert kq2[0][0] == 3

    def test_mot_bang_duy_nhat(self, ex):
        kq = ex.hop_nhat_rrf([[9, 8, 7]], k=3)
        assert [i for i, _ in kq] == [9, 8, 7]

    def test_khong_co_bang_nao(self, ex):
        assert ex.hop_nhat_rrf([], k=5) == []

    def test_k_khong_duong(self, ex):
        assert ex.hop_nhat_rrf([[1, 2]], k=0) == []

    def test_k0_lon_lam_diu_chenh_lech(self, ex):
        nho = ex.hop_nhat_rrf([[1, 2]], k=2, k0=1)
        lon = ex.hop_nhat_rrf([[1, 2]], k=2, k0=1000)
        assert (nho[0][1] - nho[1][1]) > (lon[0][1] - lon[1][1])


class TestDoChatLuong:
    def test_recall_mot_phan(self, ex):
        kq = ex.recall_at_k([3, 1, 7], {1, 5})
        assert kq is not None, bao_chua_lam("recall_at_k")
        assert kq == pytest.approx(0.5)

    def test_recall_day_du(self, ex):
        assert ex.recall_at_k([1, 5, 9], {1, 5}) == pytest.approx(1.0)

    def test_recall_khong_co_gi(self, ex):
        assert ex.recall_at_k([2, 3], {1}) == 0.0

    def test_recall_tap_dung_rong(self, ex):
        assert ex.recall_at_k([1, 2], set()) == 1.0

    def test_recall_khong_dem_trung_lap(self, ex):
        assert ex.recall_at_k([1, 1, 1], {1, 2}) == pytest.approx(0.5)

    def test_mrr_hang_hai(self, ex):
        kq = ex.mrr([3, 1, 7], {1, 5})
        assert kq is not None, bao_chua_lam("mrr")
        assert kq == pytest.approx(0.5)

    def test_mrr_hang_nhat(self, ex):
        assert ex.mrr([1, 3], {1}) == pytest.approx(1.0)

    def test_mrr_khong_tim_thay(self, ex):
        assert ex.mrr([3, 9], {1}) == 0.0

    def test_mrr_tap_dung_rong_tra_ve_0(self, ex):
        """Khac recall: khong co thu dung nao thi khong co thu hang nao."""
        assert ex.mrr([1, 2], set()) == 0.0

    def test_mrr_chi_tinh_muc_dung_dau_tien(self, ex):
        assert ex.mrr([9, 1, 2], {1, 2}) == pytest.approx(0.5)
