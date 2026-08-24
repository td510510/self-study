"""Cham diem ex02_embedding.py — Phase 06."""

from __future__ import annotations

import pytest

from tests.conftest import bao_chua_lam, nap_module

pytestmark = pytest.mark.phase06

torch = pytest.importorskip("torch", reason="Chua cai PyTorch. Chay:  pip install torch")

import torch.nn as nn  # noqa: E402


@pytest.fixture(scope="module")
def ex():
    return nap_module("curriculum/06-nlp-transformers/exercises/ex02_embedding.py")


class TestBangEmbedding:
    def test_co_ket_qua(self, ex):
        assert ex.tao_bang_embedding(10, 4) is not None, bao_chua_lam("tao_bang_embedding")

    def test_la_nn_embedding(self, ex):
        assert isinstance(ex.tao_bang_embedding(10, 4), nn.Embedding)

    def test_shape_dau_ra(self, ex):
        e = ex.tao_bang_embedding(100, 16)
        assert e(torch.tensor([0, 5])).shape == (2, 16)

    def test_tai_lap_duoc(self, ex):
        a = ex.tao_bang_embedding(10, 4, seed=7)
        b = ex.tao_bang_embedding(10, 4, seed=7)
        assert torch.allclose(a.weight, b.weight), "Cung seed phai ra cung trong so"

    def test_seed_khac_cho_ket_qua_khac(self, ex):
        a = ex.tao_bang_embedding(10, 4, seed=1)
        b = ex.tao_bang_embedding(10, 4, seed=2)
        assert not torch.allclose(a.weight, b.weight)

    def test_dem_tham_so(self, ex):
        assert ex.dem_tham_so_embedding(50_000, 768) == 38_400_000
        assert ex.dem_tham_so_embedding(100, 16) == 1600


class TestCosineSimilarity:
    A = torch.tensor([1.0, 0.0])

    def test_co_ket_qua(self, ex):
        assert ex.cosine_similarity(self.A, self.A) is not None, bao_chua_lam(
            "cosine_similarity"
        )

    def test_cung_huong(self, ex):
        assert abs(ex.cosine_similarity(self.A, self.A) - 1.0) < 1e-6

    def test_vuong_goc(self, ex):
        assert abs(ex.cosine_similarity(self.A, torch.tensor([0.0, 1.0]))) < 1e-6

    def test_nguoc_huong(self, ex):
        assert abs(ex.cosine_similarity(self.A, torch.tensor([-1.0, 0.0])) + 1.0) < 1e-6

    def test_khong_phu_thuoc_do_lon(self, ex):
        assert abs(ex.cosine_similarity(torch.tensor([1.0, 2.0]), torch.tensor([2.0, 4.0])) - 1) < 1e-6
        assert abs(ex.cosine_similarity(self.A, torch.tensor([100.0, 0.0])) - 1) < 1e-6

    def test_vector_khong(self, ex):
        kq = ex.cosine_similarity(torch.zeros(2), self.A)
        assert kq == 0.0, "Vector 0 -> tra ve 0.0, khong duoc chia cho 0"

    def test_luon_trong_khoang(self, ex):
        torch.manual_seed(0)
        for _ in range(20):
            a, b = torch.randn(8), torch.randn(8)
            assert -1.0001 <= ex.cosine_similarity(a, b) <= 1.0001

    def test_tra_ve_float(self, ex):
        assert isinstance(ex.cosine_similarity(self.A, self.A), float)


class TestChuanHoa:
    def test_do_dai_bang_1(self, ex):
        X = torch.tensor([[3.0, 4.0], [1.0, 0.0]])
        Xn = ex.chuan_hoa(X)
        assert torch.allclose(torch.linalg.norm(Xn, dim=1), torch.ones(2), atol=1e-6)

    def test_gia_tri_dung(self, ex):
        Xn = ex.chuan_hoa(torch.tensor([[3.0, 4.0]]))
        assert torch.allclose(Xn[0], torch.tensor([0.6, 0.8]), atol=1e-6)

    def test_hang_khong_giu_nguyen(self, ex):
        Xn = ex.chuan_hoa(torch.tensor([[3.0, 4.0], [0.0, 0.0]]))
        assert not torch.isnan(Xn).any(), "Hang 0 bi chia cho 0 -> nan"
        assert torch.allclose(Xn[1], torch.zeros(2))

    def test_giu_shape(self, ex):
        assert ex.chuan_hoa(torch.randn(5, 8)).shape == (5, 8)

    def test_giu_huong(self, ex):
        """Chuan hoa khong doi huong, chi doi do dai."""
        X = torch.tensor([[2.0, 4.0]])
        Xn = ex.chuan_hoa(X)
        assert abs(ex.cosine_similarity(X[0], Xn[0]) - 1.0) < 1e-6


class TestMaTranTuongDong:
    X = torch.tensor([[1.0, 0.0], [0.0, 1.0], [1.0, 0.0]])

    def test_shape(self, ex):
        assert ex.ma_tran_tuong_dong(self.X).shape == (3, 3)

    def test_duong_cheo_bang_1(self, ex):
        M = ex.ma_tran_tuong_dong(self.X)
        assert torch.allclose(torch.diagonal(M), torch.ones(3), atol=1e-6)

    def test_doi_xung(self, ex):
        M = ex.ma_tran_tuong_dong(self.X)
        assert torch.allclose(M, M.T, atol=1e-6)

    def test_gia_tri_dung(self, ex):
        M = ex.ma_tran_tuong_dong(self.X)
        assert abs(M[0, 2] - 1.0) < 1e-6, "Hang 0 va 2 giong het nhau"
        assert abs(M[0, 1]) < 1e-6, "Hang 0 va 1 vuong goc"

    def test_trong_khoang(self, ex):
        torch.manual_seed(0)
        M = ex.ma_tran_tuong_dong(torch.randn(10, 6))
        assert M.min() >= -1.0001 and M.max() <= 1.0001


class TestTimGanNhat:
    KHO = torch.tensor([[1.0, 0.0], [0.0, 1.0], [0.9, 0.1]])
    TV = torch.tensor([1.0, 0.0])

    def test_co_ket_qua(self, ex):
        assert ex.tim_gan_nhat(self.TV, self.KHO, k=2) is not None, bao_chua_lam(
            "tim_gan_nhat"
        )

    def test_tra_ve_hai_list(self, ex):
        idx, diem = ex.tim_gan_nhat(self.TV, self.KHO, k=2)
        assert len(idx) == 2 and len(diem) == 2

    def test_dung_thu_tu(self, ex):
        idx, _ = ex.tim_gan_nhat(self.TV, self.KHO, k=2)
        assert idx == [0, 2]

    def test_diem_giam_dan(self, ex):
        _, diem = ex.tim_gan_nhat(self.TV, self.KHO, k=3)
        assert diem == sorted(diem, reverse=True)

    def test_k_lon_hon_kho(self, ex):
        idx, _ = ex.tim_gan_nhat(self.TV, self.KHO, k=99)
        assert len(idx) == 3, "k lon hon so vector -> tra ve het, khong duoc sap"

    def test_tim_chinh_no(self, ex):
        torch.manual_seed(0)
        kho = torch.randn(20, 8)
        idx, diem = ex.tim_gan_nhat(kho[7].clone(), kho, k=1)
        assert idx[0] == 7
        assert abs(diem[0] - 1.0) < 1e-5

    def test_theo_nguong(self, ex):
        assert ex.tim_kiem_theo_nguong(self.TV, self.KHO, nguong=0.9) == [0, 2]

    def test_nguong_cao_tra_ve_rong(self, ex):
        assert ex.tim_kiem_theo_nguong(torch.tensor([0.0, 1.0]), self.KHO, nguong=0.99) == [1]

    def test_nguong_thap_lay_het(self, ex):
        assert len(ex.tim_kiem_theo_nguong(self.TV, self.KHO, nguong=-1.0)) == 3


class TestEmbeddingCau:
    def test_shape(self, ex):
        e = ex.tao_bang_embedding(10, 4)
        assert ex.embedding_cau(torch.tensor([1, 2, 3]), e).shape == (4,)

    def test_la_trung_binh(self, ex):
        e = ex.tao_bang_embedding(10, 4)
        ids = torch.tensor([1, 2, 3])
        assert torch.allclose(ex.embedding_cau(ids, e), e(ids).mean(dim=0), atol=1e-6)

    def test_cau_rong(self, ex):
        e = ex.tao_bang_embedding(10, 4)
        kq = ex.embedding_cau(torch.tensor([], dtype=torch.long), e)
        assert kq.shape == (4,)
        assert torch.allclose(kq, torch.zeros(4))

    def test_bo_qua_thu_tu(self, ex):
        """Mean pooling KHONG quan tam thu tu — day la diem yeu cua no."""
        e = ex.tao_bang_embedding(10, 4)
        a = ex.embedding_cau(torch.tensor([1, 2, 3]), e)
        b = ex.embedding_cau(torch.tensor([3, 2, 1]), e)
        assert torch.allclose(a, b, atol=1e-6)


class TestEmbeddingCauCoMask:
    def test_shape(self, ex):
        e = ex.tao_bang_embedding(10, 4)
        ids = torch.tensor([[1, 2, 0], [3, 4, 5]])
        mask = torch.tensor([[1, 1, 0], [1, 1, 1]])
        assert ex.embedding_cau_co_mask(ids, mask, e).shape == (2, 4)

    def test_bo_qua_padding(self, ex):
        """Cau ngan chi tinh tren token that."""
        e = ex.tao_bang_embedding(10, 4)
        ids = torch.tensor([[1, 2, 0]])
        mask = torch.tensor([[1, 1, 0]])
        kq = ex.embedding_cau_co_mask(ids, mask, e)
        mong_doi = e(torch.tensor([1, 2])).mean(dim=0)
        assert torch.allclose(kq[0], mong_doi, atol=1e-6), (
            "Padding phai bi BO QUA, khong duoc tinh vao trung binh"
        )

    def test_mask_toan_1_giong_mean_thuong(self, ex):
        e = ex.tao_bang_embedding(10, 4)
        ids = torch.tensor([[1, 2, 3]])
        mask = torch.ones(1, 3, dtype=torch.long)
        assert torch.allclose(
            ex.embedding_cau_co_mask(ids, mask, e)[0],
            ex.embedding_cau(torch.tensor([1, 2, 3]), e),
            atol=1e-6,
        )

    def test_mask_toan_0(self, ex):
        e = ex.tao_bang_embedding(10, 4)
        ids = torch.tensor([[0, 0]])
        mask = torch.tensor([[0, 0]])
        kq = ex.embedding_cau_co_mask(ids, mask, e)
        assert not torch.isnan(kq).any(), "Mask toan 0 -> chia cho 0 -> nan"
        assert torch.allclose(kq[0], torch.zeros(4))

    def test_moi_cau_doc_lap(self, ex):
        e = ex.tao_bang_embedding(10, 4)
        ids = torch.tensor([[1, 0], [2, 3]])
        mask = torch.tensor([[1, 0], [1, 1]])
        kq = ex.embedding_cau_co_mask(ids, mask, e)
        assert torch.allclose(kq[0], e(torch.tensor([1])).mean(dim=0), atol=1e-6)
        assert torch.allclose(kq[1], e(torch.tensor([2, 3])).mean(dim=0), atol=1e-6)
