"""Cham diem ex03_cnn.py — Phase 05."""

from __future__ import annotations

import pytest

from tests.conftest import bao_chua_lam, nap_module

pytestmark = pytest.mark.phase05

torch = pytest.importorskip("torch", reason="Chua cai PyTorch. Chay:  pip install torch")

import torch.nn as nn  # noqa: E402


@pytest.fixture(scope="module")
def ex():
    return nap_module("curriculum/05-deep-learning/exercises/ex03_cnn.py")


class TestKichThuocConv:
    def test_co_ket_qua(self, ex):
        assert ex.kich_thuoc_conv(28, 3, 1, 1) is not None, bao_chua_lam("kich_thuoc_conv")

    def test_giu_nguyen(self, ex):
        assert ex.kich_thuoc_conv(28, 3, 1, 1) == 28
        assert ex.kich_thuoc_conv(28, 5, 1, 2) == 28
        assert ex.kich_thuoc_conv(32, 7, 1, 3) == 32

    def test_khong_padding(self, ex):
        assert ex.kich_thuoc_conv(28, 3, 1, 0) == 26
        assert ex.kich_thuoc_conv(32, 5, 1, 0) == 28

    def test_stride_2(self, ex):
        assert ex.kich_thuoc_conv(28, 3, 2, 1) == 14
        assert ex.kich_thuoc_conv(32, 3, 2, 1) == 16

    def test_khop_voi_pytorch(self, ex):
        """Kiem chung bang chinh PyTorch."""
        for vao, k, s, p in [(28, 3, 1, 1), (28, 3, 1, 0), (32, 5, 2, 2), (64, 7, 2, 3)]:
            conv = nn.Conv2d(1, 1, kernel_size=k, stride=s, padding=p)
            that = conv(torch.zeros(1, 1, vao, vao)).shape[-1]
            assert ex.kich_thuoc_conv(vao, k, s, p) == that, (
                f"conv({vao},k={k},s={s},p={p}): tinh ra "
                f"{ex.kich_thuoc_conv(vao, k, s, p)} nhung PyTorch cho {that}"
            )


class TestKichThuocPool:
    def test_giam_nua(self, ex):
        assert ex.kich_thuoc_pool(28, 2) == 14
        assert ex.kich_thuoc_pool(14, 2) == 7

    def test_lam_tron_xuong(self, ex):
        assert ex.kich_thuoc_pool(7, 2) == 3, "7 // 2 = 3, phan du bi bo"

    def test_stride_tuy_chinh(self, ex):
        assert ex.kich_thuoc_pool(28, 3, 1) == 26

    def test_khop_voi_pytorch(self, ex):
        for vao, k in [(28, 2), (14, 2), (7, 2), (32, 4)]:
            that = nn.MaxPool2d(k)(torch.zeros(1, 1, vao, vao)).shape[-1]
            assert ex.kich_thuoc_pool(vao, k) == that


class TestTheoDauShape:
    def test_kien_truc_chuan(self, ex):
        kq = ex.theo_dau_shape(
            28, [("conv", 3, 1, 1), ("pool", 2, None), ("conv", 3, 1, 1), ("pool", 2, None)]
        )
        assert kq == [28, 14, 14, 7]

    def test_anh_32(self, ex):
        kq = ex.theo_dau_shape(
            32, [("conv", 3, 1, 1), ("pool", 2, None), ("conv", 3, 1, 1), ("pool", 2, None)]
        )
        assert kq == [32, 16, 16, 8]

    def test_khong_padding(self, ex):
        assert ex.theo_dau_shape(28, [("conv", 3, 1, 0)]) == [26]

    def test_danh_sach_rong(self, ex):
        assert ex.theo_dau_shape(28, []) == []

    def test_do_dai_bang_so_buoc(self, ex):
        buoc = [("conv", 3, 1, 1)] * 5
        assert len(ex.theo_dau_shape(28, buoc)) == 5


class TestTaoCNN:
    def test_co_ket_qua(self, ex):
        assert ex.tao_cnn(1, 4, 28) is not None, bao_chua_lam("tao_cnn")

    def test_forward_28(self, ex):
        m = ex.tao_cnn(1, 4, 28)
        assert m(torch.randn(8, 1, 28, 28)).shape == (8, 4)

    def test_forward_32_mau(self, ex):
        """Khong duoc hard-code so 7 — phai chay dung voi anh 32x32."""
        m = ex.tao_cnn(3, 10, 32)
        assert m(torch.randn(4, 3, 32, 32)).shape == (4, 10), (
            "Ban dang hard-code kich thuoc? Phai tinh tu kich_thuoc_anh."
        )

    def test_forward_64(self, ex):
        m = ex.tao_cnn(1, 2, 64)
        assert m(torch.randn(2, 1, 64, 64)).shape == (2, 2)

    def test_co_hai_lop_conv(self, ex):
        m = ex.tao_cnn(1, 4, 28)
        assert sum(isinstance(lop, nn.Conv2d) for lop in m) == 2

    def test_co_hai_lop_pool(self, ex):
        m = ex.tao_cnn(1, 4, 28)
        assert sum(isinstance(lop, nn.MaxPool2d) for lop in m) == 2

    def test_lop_cuoi_la_linear(self, ex):
        m = ex.tao_cnn(1, 4, 28)
        assert isinstance(m[-1], nn.Linear)

    def test_khong_co_softmax(self, ex):
        m = ex.tao_cnn(1, 4, 28)
        assert not any(isinstance(lop, (nn.Softmax, nn.LogSoftmax)) for lop in m)

    def test_so_kenh_dung(self, ex):
        m = ex.tao_cnn(3, 4, 28)
        conv = [lop for lop in m if isinstance(lop, nn.Conv2d)]
        assert conv[0].in_channels == 3
        assert conv[0].out_channels == 16
        assert conv[1].out_channels == 32

    def test_hoc_duoc(self, ex):
        """Kiem tra thuc su: CNN phai giam duoc loss tren bai toan de."""
        torch.manual_seed(0)
        X = torch.zeros(200, 1, 12, 12)
        y = torch.randint(0, 2, (200,))
        X[y == 1, :, 3:9, 3:9] = 1.0            # lop 1 co o vuong sang o giua

        m = ex.tao_cnn(1, 2, 12)
        opt = torch.optim.Adam(m.parameters(), lr=1e-2)
        lf = nn.CrossEntropyLoss()

        dau = lf(m(X), y).item()
        for _ in range(30):
            opt.zero_grad()
            lf(m(X), y).backward()
            opt.step()
        cuoi = lf(m(X), y).item()

        assert cuoi < dau * 0.5, f"CNN phai hoc duoc ({dau:.3f} -> {cuoi:.3f})"


class TestThamSoTheoLop:
    def test_mlp_don_gian(self, ex):
        m = nn.Sequential(nn.Linear(4, 8), nn.ReLU(), nn.Linear(8, 2))
        assert ex.tham_so_theo_lop(m) == [("Linear", 40), ("Linear", 18)]

    def test_bo_qua_lop_khong_tham_so(self, ex):
        m = nn.Sequential(nn.ReLU(), nn.MaxPool2d(2), nn.Flatten())
        assert ex.tham_so_theo_lop(m) == []

    def test_cnn(self, ex):
        lop = ex.tham_so_theo_lop(ex.tao_cnn(1, 4, 28))
        assert [t for t, _ in lop] == ["Conv2d", "Conv2d", "Linear", "Linear"]

    def test_conv_dung_cong_thuc(self, ex):
        """Conv2d(1,16,3) = 1*16*3*3 + 16 = 160"""
        lop = ex.tham_so_theo_lop(ex.tao_cnn(1, 4, 28))
        assert lop[0][1] == 160
        assert lop[1][1] == 4640          # 16*32*9 + 32

    def test_ten_la_ten_class(self, ex):
        lop = ex.tham_so_theo_lop(nn.Sequential(nn.Linear(2, 2)))
        assert lop[0][0] == "Linear"


class TestSoSanhThamSo:
    def test_du_khoa(self, ex):
        kq = ex.so_sanh_tham_so(28, 1, 4)
        assert kq is not None, bao_chua_lam("so_sanh_tham_so")
        assert set(kq) == {"cnn", "mlp"}

    def test_anh_nho_xap_xi_nhau(self, ex):
        kq = ex.so_sanh_tham_so(28, 1, 4)
        assert 90_000 < kq["cnn"] < 130_000
        assert 100_000 < kq["mlp"] < 130_000

    def test_anh_lon_mlp_phinh_to(self, ex):
        """Bai hoc: voi anh lon, MLP tang nhanh hon CNN nhieu."""
        kq = ex.so_sanh_tham_so(224, 3, 4)
        assert kq["mlp"] > kq["cnn"] * 2, (
            f"Voi anh 224x224, MLP ({kq['mlp']:,}) phai lon hon nhieu "
            f"so voi CNN ({kq['cnn']:,})"
        )

    def test_ty_le_tang_theo_kich_thuoc(self, ex):
        nho = ex.so_sanh_tham_so(28, 1, 4)
        lon = ex.so_sanh_tham_so(224, 3, 4)
        assert lon["mlp"] / nho["mlp"] > lon["cnn"] / nho["cnn"]


class TestKiemTraForward:
    def test_shape_dau_ra(self, ex):
        kq = ex.kiem_tra_forward(ex.tao_cnn(1, 4, 28), 8, 1, 28)
        assert kq is not None, bao_chua_lam("kiem_tra_forward")
        assert kq == (8, 4)

    def test_batch_khac(self, ex):
        assert ex.kiem_tra_forward(ex.tao_cnn(1, 4, 28), 3, 1, 28) == (3, 4)

    def test_anh_mau(self, ex):
        assert ex.kiem_tra_forward(ex.tao_cnn(3, 10, 32), 5, 3, 32) == (5, 10)

    def test_tra_ve_tuple(self, ex):
        kq = ex.kiem_tra_forward(ex.tao_cnn(1, 4, 28), 2, 1, 28)
        assert isinstance(kq, tuple), "Phai tra ve tuple, dung tuple(out.shape)"

    def test_hoat_dong_voi_mlp(self, ex):
        """Ham phai dung duoc voi model bat ky, khong chi CNN."""
        m = nn.Sequential(nn.Flatten(), nn.Linear(28 * 28, 5))
        assert ex.kiem_tra_forward(m, 4, 1, 28) == (4, 5)
