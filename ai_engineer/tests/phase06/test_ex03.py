"""Cham diem ex03_attention.py — Phase 06."""

from __future__ import annotations

import math

import pytest

from tests.conftest import bao_chua_lam, nap_module

pytestmark = pytest.mark.phase06

torch = pytest.importorskip("torch", reason="Chua cai PyTorch. Chay:  pip install torch")


@pytest.fixture(scope="module")
def ex():
    return nap_module("curriculum/06-nlp-transformers/exercises/ex03_attention.py")


class TestSoftmax:
    def test_co_ket_qua(self, ex):
        assert ex.softmax(torch.tensor([1.0, 2.0])) is not None, bao_chua_lam("softmax")

    def test_deu_nhau(self, ex):
        assert torch.allclose(ex.softmax(torch.tensor([1.0, 1.0, 1.0])), torch.full((3,), 1 / 3))

    def test_tong_bang_1(self, ex):
        torch.manual_seed(0)
        x = torch.randn(4, 6)
        assert torch.allclose(ex.softmax(x, dim=-1).sum(dim=-1), torch.ones(4), atol=1e-6)

    def test_on_dinh_so_hoc(self, ex):
        """Bai hoc cot loi: phai tru di max truoc khi mu."""
        kq = ex.softmax(torch.tensor([1000.0, 1000.0]))
        assert not torch.isnan(kq).any(), (
            "Softmax ra nan voi gia tri lon. Phai tru di max(x) truoc khi exp."
        )
        assert torch.allclose(kq, torch.tensor([0.5, 0.5]))

    def test_on_dinh_voi_gia_tri_am_lon(self, ex):
        kq = ex.softmax(torch.tensor([-1000.0, -1000.0]))
        assert not torch.isnan(kq).any()

    def test_khop_voi_pytorch(self, ex):
        torch.manual_seed(1)
        x = torch.randn(3, 5)
        assert torch.allclose(ex.softmax(x, dim=-1), torch.softmax(x, dim=-1), atol=1e-6)

    def test_gia_tri_lon_ap_dao(self, ex):
        assert abs(ex.softmax(torch.tensor([0.0, 10.0]))[1] - 1.0) < 1e-4

    def test_dim_khac(self, ex):
        x = torch.randn(3, 4)
        assert torch.allclose(ex.softmax(x, dim=0).sum(dim=0), torch.ones(4), atol=1e-6)


class TestAttention:
    @pytest.fixture
    def qkv(self):
        torch.manual_seed(0)
        return torch.randn(1, 4, 8), torch.randn(1, 4, 8), torch.randn(1, 4, 8)

    def test_co_ket_qua(self, ex, qkv):
        assert ex.attention(*qkv) is not None, bao_chua_lam("attention")

    def test_tra_ve_hai_gia_tri(self, ex, qkv):
        assert len(ex.attention(*qkv)) == 2

    def test_shape(self, ex, qkv):
        out, w = ex.attention(*qkv)
        assert out.shape == (1, 4, 8)
        assert w.shape == (1, 4, 4)

    def test_trong_so_tong_bang_1(self, ex, qkv):
        _, w = ex.attention(*qkv)
        assert torch.allclose(w.sum(dim=-1), torch.ones(1, 4), atol=1e-5)

    def test_trong_so_khong_am(self, ex, qkv):
        _, w = ex.attention(*qkv)
        assert (w >= 0).all()

    def test_co_chia_sqrt_d(self, ex):
        """Kiem tra co CHIA cho sqrt(d) hay khong."""
        torch.manual_seed(0)
        d = 64
        Q, K, V = torch.randn(1, 4, d), torch.randn(1, 4, d), torch.randn(1, 4, d)
        _, w = ex.attention(Q, K, V)

        diem = Q @ K.transpose(-2, -1)
        w_co_chia = torch.softmax(diem / math.sqrt(d), dim=-1)
        w_khong_chia = torch.softmax(diem, dim=-1)

        assert torch.allclose(w, w_co_chia, atol=1e-5), (
            "Trong so khong khop cong thuc softmax(QK^T / sqrt(d))"
        )
        assert not torch.allclose(w, w_khong_chia, atol=1e-3), (
            "Ban quen chia cho sqrt(d)"
        )

    def test_khop_voi_cong_thuc(self, ex, qkv):
        Q, K, V = qkv
        d = Q.shape[-1]
        mong_doi = torch.softmax(Q @ K.transpose(-2, -1) / math.sqrt(d), dim=-1) @ V
        out, _ = ex.attention(Q, K, V)
        assert torch.allclose(out, mong_doi, atol=1e-5)

    def test_mask_hoat_dong(self, ex, qkv):
        Q, K, V = qkv
        mask = torch.tensor([[1.0, 0, 0, 0], [1, 1, 0, 0], [1, 1, 1, 0], [1, 1, 1, 1]])
        _, w = ex.attention(Q, K, V, mask=mask)
        assert torch.allclose(w[0].triu(diagonal=1), torch.zeros(4, 4), atol=1e-6)

    def test_hoat_dong_voi_4_chieu(self, ex):
        """Phai chay duoc voi shape (B, so_dau, T, d) cua multi-head."""
        torch.manual_seed(0)
        Q = K = V = torch.randn(2, 3, 5, 8)
        out, w = ex.attention(Q, K, V)
        assert out.shape == (2, 3, 5, 8)
        assert w.shape == (2, 3, 5, 5)


class TestCausalMask:
    def test_shape(self, ex):
        assert ex.tao_causal_mask(4).shape == (4, 4)

    def test_tam_giac_duoi(self, ex):
        m = ex.tao_causal_mask(4)
        assert m[0].tolist() == [1, 0, 0, 0]
        assert m[1].tolist() == [1, 1, 0, 0]
        assert m[3].tolist() == [1, 1, 1, 1]

    def test_duong_cheo_bang_1(self, ex):
        m = ex.tao_causal_mask(5)
        assert torch.allclose(torch.diagonal(m), torch.ones(5))

    def test_kich_thuoc_1(self, ex):
        assert ex.tao_causal_mask(1).tolist() == [[1.0]]

    def test_attention_nhan_qua(self, ex):
        torch.manual_seed(0)
        Q = K = V = torch.randn(1, 5, 8)
        _, w = ex.attention_nhan_qua(Q, K, V)
        assert (w[0].triu(diagonal=1).abs() < 1e-6).all(), "Tam giac tren phai bang 0"

    def test_token_dau_chi_nhin_chinh_no(self, ex):
        torch.manual_seed(0)
        Q = K = V = torch.randn(1, 5, 8)
        _, w = ex.attention_nhan_qua(Q, K, V)
        assert torch.allclose(w[0, 0], torch.tensor([1.0, 0, 0, 0, 0]), atol=1e-6)

    def test_moi_hang_van_tong_bang_1(self, ex):
        torch.manual_seed(0)
        Q = K = V = torch.randn(1, 6, 8)
        _, w = ex.attention_nhan_qua(Q, K, V)
        assert torch.allclose(w.sum(dim=-1), torch.ones(1, 6), atol=1e-5)


class TestMultiHead:
    def test_chia_dau_shape(self, ex):
        assert ex.chia_dau(torch.zeros(2, 5, 12), 4).shape == (2, 4, 5, 3)

    def test_gop_dau_shape(self, ex):
        assert ex.gop_dau(torch.zeros(2, 4, 5, 3)).shape == (2, 5, 12)

    def test_chia_roi_gop_ra_chinh_no(self, ex):
        torch.manual_seed(0)
        x = torch.randn(2, 6, 12)
        assert torch.allclose(ex.gop_dau(ex.chia_dau(x, 4)), x, atol=1e-6)

    def test_chia_dau_khong_chia_het(self, ex):
        with pytest.raises(ValueError):
            ex.chia_dau(torch.zeros(1, 3, 10), 4)

    def test_mot_dau(self, ex):
        x = torch.randn(1, 4, 8)
        assert ex.chia_dau(x, 1).shape == (1, 1, 4, 8)

    def test_multi_head_shape(self, ex):
        torch.manual_seed(0)
        x = torch.randn(2, 6, 12)
        W = [torch.randn(12, 12) * 0.1 for _ in range(4)]
        assert ex.multi_head_attention(x, *W, so_dau=4).shape == (2, 6, 12)

    def test_multi_head_khong_nhan_qua(self, ex):
        torch.manual_seed(0)
        x = torch.randn(1, 5, 8)
        W = [torch.randn(8, 8) * 0.1 for _ in range(4)]
        assert ex.multi_head_attention(x, *W, so_dau=2, nhan_qua=False).shape == (1, 5, 8)

    def test_nhan_qua_khac_khong_nhan_qua(self, ex):
        torch.manual_seed(0)
        x = torch.randn(1, 5, 8)
        W = [torch.randn(8, 8) * 0.1 for _ in range(4)]
        a = ex.multi_head_attention(x, *W, so_dau=2, nhan_qua=True)
        b = ex.multi_head_attention(x, *W, so_dau=2, nhan_qua=False)
        assert not torch.allclose(a, b), "Mask phai lam thay doi ket qua"

    def test_token_dau_giong_nhau_du_co_mask(self, ex):
        """Token dau tien chi nhin chinh no -> mask khong anh huong no."""
        torch.manual_seed(0)
        x = torch.randn(1, 5, 8)
        W = [torch.randn(8, 8) * 0.1 for _ in range(4)]
        a = ex.multi_head_attention(x, *W, so_dau=2, nhan_qua=True)
        b = ex.multi_head_attention(x[:, :1], *W, so_dau=2, nhan_qua=True)
        assert torch.allclose(a[:, 0], b[:, 0], atol=1e-5)


class TestPositionalEncoding:
    def test_shape(self, ex):
        assert ex.positional_encoding(10, 16).shape == (10, 16)

    def test_vi_tri_0(self, ex):
        """pos=0: sin(0)=0 o chieu chan, cos(0)=1 o chieu le."""
        pe = ex.positional_encoding(1, 4)
        assert torch.allclose(pe[0], torch.tensor([0.0, 1.0, 0.0, 1.0]), atol=1e-6)

    def test_trong_khoang(self, ex):
        pe = ex.positional_encoding(50, 32)
        assert pe.min() >= -1.0001 and pe.max() <= 1.0001, "Gia tri phai trong [-1, 1]"

    def test_moi_vi_tri_khac_nhau(self, ex):
        pe = ex.positional_encoding(20, 16)
        for i in range(1, 10):
            assert not torch.allclose(pe[i], pe[i + 1], atol=1e-4)

    def test_khong_co_nan(self, ex):
        pe = ex.positional_encoding(100, 64)
        assert not torch.isnan(pe).any()

    def test_tai_lap_duoc(self, ex):
        assert torch.allclose(ex.positional_encoding(5, 8), ex.positional_encoding(5, 8))

    def test_do_dai_1(self, ex):
        assert ex.positional_encoding(1, 8).shape == (1, 8)
