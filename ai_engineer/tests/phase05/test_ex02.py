"""Cham diem ex02_training_loop.py — Phase 05."""

from __future__ import annotations

import pytest

from tests.conftest import bao_chua_lam, nap_module

pytestmark = pytest.mark.phase05

torch = pytest.importorskip("torch", reason="Chua cai PyTorch. Chay:  pip install torch")

import torch.nn as nn  # noqa: E402


@pytest.fixture(scope="module")
def ex():
    return nap_module("curriculum/05-deep-learning/exercises/ex02_training_loop.py")


@pytest.fixture
def du_lieu():
    """Bai toan de: y = 1 neu x0 + x1 > 0."""
    torch.manual_seed(0)
    X = torch.randn(600, 4)
    y = (X[:, 0] + X[:, 1] > 0).long()
    return X[:500], y[:500], X[500:], y[500:]


class TestTaoMLP:
    def test_co_ket_qua(self, ex):
        assert ex.tao_mlp(4, [8], 2) is not None, bao_chua_lam("tao_mlp")

    def test_la_module(self, ex):
        assert isinstance(ex.tao_mlp(4, [8], 2), nn.Module)

    def test_so_lop(self, ex):
        """Linear, ReLU, Linear = 3 lop."""
        assert len(ex.tao_mlp(4, [8], 2)) == 3

    def test_khong_co_lop_an(self, ex):
        assert len(ex.tao_mlp(10, [], 2)) == 1, "Khong lop an -> chi mot Linear"

    def test_nhieu_lop_an(self, ex):
        m = ex.tao_mlp(784, [128, 64], 10)
        assert len(m) == 5, "Linear ReLU Linear ReLU Linear"

    def test_lop_cuoi_khong_co_relu(self, ex):
        m = ex.tao_mlp(4, [8], 2)
        assert isinstance(m[-1], nn.Linear), (
            "Lop cuoi phai la Linear (tra ve logits), KHONG duoc co ReLU/Softmax"
        )

    def test_khong_co_softmax(self, ex):
        """CrossEntropyLoss da bao gom softmax — them nua la sai."""
        m = ex.tao_mlp(4, [8], 2)
        assert not any(isinstance(lop, (nn.Softmax, nn.LogSoftmax)) for lop in m), (
            "KHONG duoc them Softmax vao model dung CrossEntropyLoss"
        )

    def test_forward_dung_shape(self, ex):
        m = ex.tao_mlp(4, [8], 3)
        assert m(torch.randn(5, 4)).shape == (5, 3)

    def test_dem_tham_so(self, ex):
        """Linear(4,8)=40, Linear(8,2)=18 -> 58."""
        assert ex.dem_tham_so(ex.tao_mlp(4, [8], 2)) == 58

    def test_dem_tham_so_mang_lon(self, ex):
        assert ex.dem_tham_so(ex.tao_mlp(784, [128, 64], 10)) == 109_386


class TestTaoBatch:
    @pytest.fixture
    def xy(self):
        return torch.randn(10, 4), torch.randint(0, 2, (10,))

    def test_so_batch(self, ex, xy):
        X, y = xy
        b = ex.tao_batch(X, y, 4)
        assert b is not None, bao_chua_lam("tao_batch")
        assert len(b) == 3

    def test_kich_thuoc_tung_batch(self, ex, xy):
        X, y = xy
        b = ex.tao_batch(X, y, 4)
        assert [len(xb) for xb, _ in b] == [4, 4, 2], "Batch cuoi nho hon, khong bo di"

    def test_khong_mat_mau(self, ex, xy):
        X, y = xy
        b = ex.tao_batch(X, y, 3)
        assert sum(len(xb) for xb, _ in b) == 10

    def test_X_va_y_khop_nhau(self, ex, xy):
        """Xao tron phai giu dung cap (X, y)."""
        X, y = xy
        b = ex.tao_batch(X, y, 4)
        for xb, yb in b:
            for i in range(len(xb)):
                vi_tri = (X == xb[i]).all(dim=1).nonzero()[0, 0]
                assert y[vi_tri] == yb[i], "X va y bi xao tron RIENG!"

    def test_khong_xao_tron(self, ex, xy):
        X, y = xy
        b = ex.tao_batch(X, y, 4, xao_tron=False)
        assert torch.allclose(b[0][0], X[:4])

    def test_co_xao_tron(self, ex, xy):
        X, y = xy
        b = ex.tao_batch(X, y, 4, xao_tron=True)
        assert not torch.allclose(b[0][0], X[:4])

    def test_tai_lap_duoc(self, ex, xy):
        X, y = xy
        a = ex.tao_batch(X, y, 4, seed=7)
        b = ex.tao_batch(X, y, 4, seed=7)
        assert torch.allclose(a[0][0], b[0][0])

    def test_seed_khac_cho_ket_qua_khac(self, ex, xy):
        X, y = xy
        a = ex.tao_batch(X, y, 4, seed=1)
        b = ex.tao_batch(X, y, 4, seed=2)
        assert not torch.allclose(a[0][0], b[0][0])


class TestTrainMotEpoch:
    def test_tra_ve_loss(self, ex, du_lieu):
        Xtr, ytr, _, _ = du_lieu
        torch.manual_seed(0)
        m = ex.tao_mlp(4, [16], 2)
        b = ex.tao_batch(Xtr, ytr, 32)
        loss = ex.train_mot_epoch(m, b, nn.CrossEntropyLoss(), torch.optim.Adam(m.parameters()))
        assert loss is not None, bao_chua_lam("train_mot_epoch")
        assert isinstance(loss, float)
        assert loss > 0

    def test_tham_so_thay_doi(self, ex, du_lieu):
        Xtr, ytr, _, _ = du_lieu
        torch.manual_seed(0)
        m = ex.tao_mlp(4, [16], 2)
        truoc = [p.clone() for p in m.parameters()]

        b = ex.tao_batch(Xtr, ytr, 32)
        ex.train_mot_epoch(m, b, nn.CrossEntropyLoss(), torch.optim.Adam(m.parameters()))

        assert any(not torch.allclose(a, p) for a, p in zip(truoc, m.parameters())), (
            "Tham so khong thay doi — thieu optimizer.step()?"
        )

    def test_loss_giam_qua_nhieu_epoch(self, ex, du_lieu):
        Xtr, ytr, _, _ = du_lieu
        torch.manual_seed(0)
        m = ex.tao_mlp(4, [16], 2)
        opt = torch.optim.Adam(m.parameters(), lr=1e-2)
        lf = nn.CrossEntropyLoss()

        dau = ex.train_mot_epoch(m, ex.tao_batch(Xtr, ytr, 32, seed=0), lf, opt)
        for e in range(1, 15):
            cuoi = ex.train_mot_epoch(m, ex.tao_batch(Xtr, ytr, 32, seed=e), lf, opt)

        assert cuoi < dau * 0.7, f"Loss phai giam ro ret ({dau:.3f} -> {cuoi:.3f})"

    def test_bat_che_do_train(self, ex, du_lieu):
        """Phai goi model.train() — kiem tra bang model co Dropout."""
        Xtr, ytr, _, _ = du_lieu
        torch.manual_seed(0)
        m = nn.Sequential(nn.Linear(4, 16), nn.ReLU(), nn.Dropout(0.5), nn.Linear(16, 2))
        m.eval()                                    # co y dat sai che do
        b = ex.tao_batch(Xtr, ytr, 32)
        ex.train_mot_epoch(m, b, nn.CrossEntropyLoss(), torch.optim.Adam(m.parameters()))
        assert m.training is True, "train_mot_epoch phai goi model.train()"


class TestDanhGia:
    def test_du_khoa(self, ex, du_lieu):
        Xtr, ytr, _, _ = du_lieu
        m = ex.tao_mlp(4, [16], 2)
        kq = ex.danh_gia(m, Xtr, ytr, nn.CrossEntropyLoss())
        assert kq is not None, bao_chua_lam("danh_gia")
        assert set(kq) == {"loss", "accuracy"}

    def test_gia_tri_hop_ly(self, ex, du_lieu):
        Xtr, ytr, _, _ = du_lieu
        m = ex.tao_mlp(4, [16], 2)
        kq = ex.danh_gia(m, Xtr, ytr, nn.CrossEntropyLoss())
        assert kq["loss"] > 0
        assert 0.0 <= kq["accuracy"] <= 1.0

    def test_model_hoan_hao(self, ex):
        """Model doan dung het -> accuracy = 1.0"""
        class LuonDung(nn.Module):
            def forward(self, x):
                return torch.stack([1 - x[:, 0], x[:, 0]], dim=1) * 100

        X = torch.tensor([[0.0], [1.0], [0.0], [1.0]])
        y = torch.tensor([0, 1, 0, 1])
        kq = ex.danh_gia(LuonDung(), X, y, nn.CrossEntropyLoss())
        assert kq["accuracy"] == 1.0

    def test_bat_che_do_eval(self, ex, du_lieu):
        Xtr, ytr, _, _ = du_lieu
        m = nn.Sequential(nn.Linear(4, 16), nn.ReLU(), nn.Dropout(0.5), nn.Linear(16, 2))
        m.train()
        ex.danh_gia(m, Xtr, ytr, nn.CrossEntropyLoss())
        assert m.training is False, "danh_gia phai goi model.eval()"

    def test_tra_ve_so_python(self, ex, du_lieu):
        Xtr, ytr, _, _ = du_lieu
        kq = ex.danh_gia(ex.tao_mlp(4, [16], 2), Xtr, ytr, nn.CrossEntropyLoss())
        assert isinstance(kq["loss"], float)
        assert isinstance(kq["accuracy"], float)


@pytest.fixture(scope="module")
def ket_qua(ex):
    """Train mot lan, dung chung cho ca nhom test ben duoi."""
    torch.manual_seed(0)
    X = torch.randn(600, 4)
    y = (X[:, 0] + X[:, 1] > 0).long()
    m = ex.tao_mlp(4, [16], 2)
    return ex.train_model(m, X[:500], y[:500], X[500:], y[500:],
                          so_epoch=15, batch_size=32)


class TestTrainModel:
    def test_du_khoa(self, ex, ket_qua):
        assert ket_qua is not None, bao_chua_lam("train_model")
        assert set(ket_qua) == {"train_loss", "val_loss", "train_acc", "val_acc"}

    def test_do_dai_lich_su(self, ex, ket_qua):
        for k, v in ket_qua.items():
            assert len(v) == 15, f"{k} phai co dung so_epoch phan tu"

    def test_loss_giam(self, ex, ket_qua):
        assert ket_qua["train_loss"][-1] < ket_qua["train_loss"][0]

    def test_hoc_duoc_that(self, ex, ket_qua):
        assert ket_qua["val_acc"][-1] > 0.85, (
            f"Bai toan de, phai dat >85%, duoc {ket_qua['val_acc'][-1]:.3f}"
        )

    def test_accuracy_trong_khoang(self, ex, ket_qua):
        assert all(0.0 <= a <= 1.0 for a in ket_qua["val_acc"])


class TestChanDoan:
    def test_tot(self, ex):
        assert ex.chan_doan_duong_cong([2.0, 1.0, 0.5], [2.0, 1.1, 0.9]) == "Tot"

    def test_overfit_val_tang(self, ex):
        assert ex.chan_doan_duong_cong([2.0, 0.5, 0.1], [2.0, 0.8, 1.5]) == "Overfit"

    def test_chua_hoc_duoc(self, ex):
        assert ex.chan_doan_duong_cong([2.0, 1.99, 1.98], [2.0, 2.0, 2.0]) == "Chua hoc duoc"

    def test_overfit_khoang_cach_lon(self, ex):
        """train tot hon val qua nhieu — van la overfit."""
        assert ex.chan_doan_duong_cong([2.0, 0.5, 0.1], [2.0, 0.9, 0.85]) == "Overfit"

    def test_uu_tien_val_tang(self, ex):
        """Quy tac 1 phai duoc xet TRUOC."""
        assert ex.chan_doan_duong_cong([2.0, 1.0, 0.9], [2.0, 0.5, 1.0]) == "Overfit"
