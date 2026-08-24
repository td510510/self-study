"""Cham diem ex01_tensor_autograd.py — Phase 05.

Cac test nay can PyTorch:
    pip install torch
"""

from __future__ import annotations

import pytest

from tests.conftest import bao_chua_lam, nap_module

pytestmark = pytest.mark.phase05

torch = pytest.importorskip(
    "torch", reason="Chua cai PyTorch. Chay:  pip install torch"
)


@pytest.fixture(scope="module")
def ex():
    return nap_module("curriculum/05-deep-learning/exercises/ex01_tensor_autograd.py")


class TestTaoTensor:
    def test_co_ket_qua(self, ex):
        assert ex.tao_tensor([1, 2, 3]) is not None, bao_chua_lam("tao_tensor")

    def test_la_tensor(self, ex):
        assert isinstance(ex.tao_tensor([1, 2, 3]), torch.Tensor)

    def test_kieu_float32(self, ex):
        """torch.tensor([1,2,3]) cho int64 — phải chỉ rõ float32."""
        assert ex.tao_tensor([1, 2, 3]).dtype == torch.float32, (
            "Phai la float32. Dung torch.tensor(du_lieu, dtype=torch.float32)"
        )

    def test_gia_tri_dung(self, ex):
        t = ex.tao_tensor([1, 2, 3])
        assert torch.allclose(t, torch.tensor([1.0, 2.0, 3.0]))

    def test_hai_chieu(self, ex):
        t = ex.tao_tensor([[1, 2], [3, 4]])
        assert t.shape == (2, 2)
        assert t.dtype == torch.float32


class TestThongTinTensor:
    def test_du_khoa(self, ex):
        kq = ex.thong_tin_tensor(torch.zeros(2, 3))
        assert kq is not None, bao_chua_lam("thong_tin_tensor")
        assert set(kq) == {"shape", "so_chieu", "so_phan_tu", "kieu", "can_grad"}

    def test_gia_tri_dung(self, ex):
        kq = ex.thong_tin_tensor(torch.zeros(2, 3))
        assert kq["shape"] == (2, 3)
        assert kq["so_chieu"] == 2
        assert kq["so_phan_tu"] == 6
        assert kq["kieu"] == "torch.float32"
        assert kq["can_grad"] is False

    def test_shape_la_tuple(self, ex):
        kq = ex.thong_tin_tensor(torch.zeros(2, 3))
        assert isinstance(kq["shape"], tuple), "shape phai la tuple, dung tuple(t.shape)"

    def test_kieu_la_chuoi(self, ex):
        kq = ex.thong_tin_tensor(torch.zeros(2))
        assert isinstance(kq["kieu"], str), "kieu phai la CHUOI, dung str(t.dtype)"

    def test_can_grad(self, ex):
        kq = ex.thong_tin_tensor(torch.zeros(2, requires_grad=True))
        assert kq["can_grad"] is True


class TestNhanMaTran:
    def test_shape_ket_qua(self, ex):
        kq = ex.nhan_ma_tran(torch.ones(2, 3), torch.ones(3, 4))
        assert kq.shape == (2, 4)

    def test_gia_tri(self, ex):
        a = torch.tensor([[1.0, 2.0], [3.0, 4.0]])
        b = torch.tensor([[1.0, 0.0], [0.0, 1.0]])
        assert torch.allclose(ex.nhan_ma_tran(a, b), a)

    def test_khong_phai_nhan_tung_phan_tu(self, ex):
        """a * b va a @ b khac nhau — kiem tra bang shape."""
        kq = ex.nhan_ma_tran(torch.ones(2, 3), torch.ones(3, 5))
        assert kq.shape == (2, 5), "Ban dang dung a * b thay vi a @ b?"


class TestAutogradCoBan:
    def test_co_ket_qua(self, ex):
        assert ex.dao_ham_binh_phuong(0.0) is not None, bao_chua_lam(
            "dao_ham_binh_phuong"
        )

    def test_cac_diem(self, ex):
        assert abs(ex.dao_ham_binh_phuong(0.0) + 6.0) < 1e-5
        assert abs(ex.dao_ham_binh_phuong(5.0) - 4.0) < 1e-5
        assert abs(ex.dao_ham_binh_phuong(3.0)) < 1e-5

    def test_dau_gradient(self, ex):
        assert ex.dao_ham_binh_phuong(10.0) > 0, "w > 3 -> gradient duong"
        assert ex.dao_ham_binh_phuong(-10.0) < 0, "w < 3 -> gradient am"

    def test_tra_ve_so_python(self, ex):
        kq = ex.dao_ham_binh_phuong(0.0)
        assert isinstance(kq, float), "Phai tra ve float, nho float(w.grad)"

    def test_khop_dao_ham_so(self, ex):
        """Kiem chung bang dao ham so."""
        h = 1e-4
        for w in (-2.0, 0.0, 1.5, 4.0):
            f = lambda x: (x - 3) ** 2  # noqa: E731
            xap_xi = (f(w + h) - f(w - h)) / (2 * h)
            assert abs(ex.dao_ham_binh_phuong(w) - xap_xi) < 1e-3


class TestDaoHamNhieuBien:
    def test_co_ket_qua(self, ex):
        assert ex.dao_ham_nhieu_bien(2.0, 3.0) is not None, bao_chua_lam(
            "dao_ham_nhieu_bien"
        )

    def test_tra_ve_hai_gia_tri(self, ex):
        assert len(ex.dao_ham_nhieu_bien(2.0, 3.0)) == 2

    def test_gia_tri_dung(self, ex):
        dx, dy = ex.dao_ham_nhieu_bien(2.0, 3.0)
        assert abs(dx - 12.0) < 1e-5, "df/dx = 2xy = 2*2*3 = 12"
        assert abs(dy - 7.0) < 1e-5, "df/dy = x^2 + 3 = 4 + 3 = 7"

    def test_diem_khac(self, ex):
        dx, dy = ex.dao_ham_nhieu_bien(1.0, 5.0)
        assert abs(dx - 10.0) < 1e-5
        assert abs(dy - 4.0) < 1e-5

    def test_x_bang_khong(self, ex):
        dx, dy = ex.dao_ham_nhieu_bien(0.0, 7.0)
        assert abs(dx) < 1e-5
        assert abs(dy - 3.0) < 1e-5


class TestCongDonGradient:
    def test_mot_lan(self, ex):
        assert abs(ex.gradient_cong_don(0.0, 1) + 6.0) < 1e-5

    def test_cong_don_that(self, ex):
        """Bai hoc cot loi: khong xoa thi gradient CONG DON."""
        assert abs(ex.gradient_cong_don(0.0, 3) + 18.0) < 1e-5, (
            "Ba lan backward khong xoa -> gradient phai gap 3 lan (-18)"
        )
        assert abs(ex.gradient_cong_don(0.0, 5) + 30.0) < 1e-5

    def test_da_xoa_khong_cong_don(self, ex):
        assert abs(ex.gradient_da_xoa(0.0, 1) + 6.0) < 1e-5
        assert abs(ex.gradient_da_xoa(0.0, 3) + 6.0) < 1e-5, (
            "Da xoa grad thi ket qua phai LUON bang dao ham dung"
        )
        assert abs(ex.gradient_da_xoa(0.0, 10) + 6.0) < 1e-5

    def test_hai_ham_khac_nhau(self, ex):
        assert ex.gradient_cong_don(0.0, 4) != ex.gradient_da_xoa(0.0, 4)


class TestToiUu:
    def test_do_dai_lich_su(self, ex):
        ls = ex.toi_uu_bang_tay(0.0, 0.1, 3)
        assert ls is not None, bao_chua_lam("toi_uu_bang_tay")
        assert len(ls) == 4, "so_buoc + 1 (gom ca gia tri ban dau)"

    def test_gia_tri_dau(self, ex):
        assert abs(ex.toi_uu_bang_tay(7.0, 0.1, 3)[0] - 7.0) < 1e-6

    def test_ba_buoc_dau(self, ex):
        """Giong het ket qua Phase 02."""
        ls = ex.toi_uu_bang_tay(0.0, 0.1, 3)
        assert abs(ls[1] - 0.6) < 1e-4
        assert abs(ls[2] - 1.08) < 1e-4
        assert abs(ls[3] - 1.464) < 1e-4

    def test_hoi_tu_ve_3(self, ex):
        ls = ex.toi_uu_bang_tay(0.0, 0.1, 200)
        assert abs(ls[-1] - 3.0) < 1e-2

    def test_optimizer_giong_bang_tay(self, ex):
        """optimizer chi la ban dong goi cua buoc cap nhat."""
        a = ex.toi_uu_bang_tay(0.0, 0.1, 10)
        b = ex.toi_uu_bang_optimizer(0.0, 0.1, 10)
        assert all(abs(x - y) < 1e-4 for x, y in zip(a, b)), (
            "Hai cach phai cho ket qua GIONG HET nhau"
        )

    def test_optimizer_hoi_tu(self, ex):
        ls = ex.toi_uu_bang_optimizer(-5.0, 0.1, 200)
        assert abs(ls[-1] - 3.0) < 1e-2

    def test_lr_lon_thi_phan_ky(self, ex):
        ls = ex.toi_uu_bang_tay(0.0, 1.5, 30)
        assert abs(ls[-1]) > 1000, "lr = 1.5 phai lam thuat toan phan ky"


class TestNoGrad:
    def test_tat_grad(self, ex):
        w = torch.ones(3, requires_grad=True)
        kq = ex.du_doan_khong_grad(torch.ones(2, 3), w, 1.0)
        assert kq is not None, bao_chua_lam("du_doan_khong_grad")
        assert kq.requires_grad is False, (
            "Ket qua phai co requires_grad=False. Dung torch.no_grad()"
        )

    def test_gia_tri_dung(self, ex):
        X = torch.tensor([[1.0, 2.0], [3.0, 4.0]])
        w = torch.tensor([0.5, 1.5], requires_grad=True)
        kq = ex.du_doan_khong_grad(X, w, 1.0)
        assert torch.allclose(kq, torch.tensor([4.5, 8.5]))

    def test_khong_co_grad_fn(self, ex):
        w = torch.ones(3, requires_grad=True)
        kq = ex.du_doan_khong_grad(torch.ones(2, 3), w, 0.0)
        assert kq.grad_fn is None, "Ket qua khong duoc gan vao do thi tinh toan"
