"""LOI GIAI - Bai tap 2, Phase 02."""

from __future__ import annotations

import numpy as np


# ===========================================================================
def loss_binh_phuong(w: float) -> float:
    return (w - 3) ** 2


def gradient_binh_phuong(w: float) -> float:
    return 2 * (w - 3)


# DAO HAM TU DAU:
#   f(w) = (w - 3)^2
#   Dat u = w - 3, thi f = u^2
#   df/du = 2u,  du/dw = 1
#   df/dw = 2u * 1 = 2(w - 3)
#
# Y NGHIA CUA DAU GRADIENT:
#   w = 5  ->  grad = +4   dang o ben PHAI day  -> phai di sang TRAI
#   w = 0  ->  grad = -6   dang o ben TRAI day  -> phai di sang PHAI
#   w = 3  ->  grad =  0   dang O DAY           -> dung lai
#
#   Cong thuc  w = w - lr * grad  tu dong dung huong trong ca hai truong hop:
#       grad duong -> tru di so duong -> w giam -> di sang trai   OK
#       grad am    -> tru di so am    -> w tang -> di sang phai   OK
#
#   Do la ly do co dau TRU trong cong thuc.
#
# DO LON CUA GRADIENT cung mang thong tin:
#   Cang xa day, gradient cang lon -> buoc di cang dai.
#   Cang gan day, gradient cang nho -> buoc di cang ngan.
#   Nho vay thuat toan tu dong "ha canh mem" ma khong can lam gi them.


# ===========================================================================
def gradient_descent(w_ban_dau: float, learning_rate: float, so_buoc: int) -> list[float]:
    w = w_ban_dau
    lich_su = [w]

    for _ in range(so_buoc):
        grad = gradient_binh_phuong(w)
        w = w - learning_rate * grad
        lich_su.append(w)

    return lich_su


# BA DONG NAY LA TOAN BO DEEP LEARNING.
#   Mo hinh phuc tap den dau - CNN, Transformer, GPT - deu chi la:
#       1. Tinh gradient cua loss theo tung tham so
#       2. Tru di learning_rate * gradient
#       3. Lap lai
#
#   Cai kho khong nam o vong lap nay, ma o buoc 1: tinh gradient cho hang ty
#   tham so lien ket chang chit. Do la viec cua BACKPROPAGATION va autograd
#   (Phase 05) - PyTorch se lam ho ban.
#
# THU NGHIEM VOI f(w) = (w-3)^2, xuat phat tu w = 0:
#
#   lr = 0.01  ->  sau 20 buoc: w = 0.99    (qua cham, con xa dich 3.0)
#   lr = 0.1   ->  sau 20 buoc: w = 2.97    (vua dep)
#   lr = 0.5   ->  sau 20 buoc: w = 3.00    (nhanh, may man dung ham nay)
#   lr = 1.0   ->  w nhay qua nhay lai giua 0 va 6, KHONG BAO GIO hoi tu
#   lr = 1.1   ->  w bay ra vo cuc -> PHAN KY
#
#   Voi ham nay, nguong phan ky la lr = 1.0. Moi ham co nguong rieng, va
#   ta khong biet truoc -> phai thu nghiem. Do la ly do learning rate la
#   sieu tham so quan trong nhat can chinh.


# ===========================================================================
def train_hoi_quy(
    X: np.ndarray,
    y: np.ndarray,
    learning_rate: float = 0.01,
    so_epoch: int = 100,
) -> tuple[np.ndarray, float, list[float]]:
    n_mau, n_dac_trung = X.shape

    w = np.zeros(n_dac_trung)
    b = 0.0
    lich_su_loss: list[float] = []

    for _ in range(so_epoch):
        # 1. Du doan (forward pass)
        y_pred = X @ w + b

        # 2. Tinh loss
        sai_so = y_pred - y
        loss = float(np.mean(sai_so**2))
        lich_su_loss.append(loss)

        # 3. Tinh gradient
        grad_w = (2 / n_mau) * (X.T @ sai_so)
        grad_b = (2 / n_mau) * sai_so.sum()

        # 4. Cap nhat tham so
        w = w - learning_rate * grad_w
        b = b - learning_rate * grad_b

    return w, b, lich_su_loss


# GRADIENT NAY O DAU RA?
#   Loss = (1/n) * sum((X@w + b - y)^2)
#
#   Dao ham theo w (dung quy tac chuoi):
#       dLoss/dw = (2/n) * X.T @ (X@w + b - y)
#                = (2/n) * X.T @ sai_so
#
#   Dao ham theo b:
#       dLoss/db = (2/n) * sum(sai_so)
#
#   Ban KHONG can thuoc cong thuc nay. Diem can hieu la:
#   gradient noi cho ta biet "neu tang w mot chut thi loss thay doi bao nhieu".
#
# VI SAO X.T (chuyen vi)?
#   Kiem tra shape:
#       X       (n_mau, n_dac_trung)
#       X.T     (n_dac_trung, n_mau)
#       sai_so  (n_mau,)
#       X.T @ sai_so  ->  (n_dac_trung,)     <- dung shape voi w
#
#   Meo: khi khong chac co can .T hay khong, cu kiem tra shape ket qua
#   co khop voi tham so can cap nhat khong. Do la cach nhanh nhat.
#
# VI SAO khoi tao w = 0?
#   Voi hoi quy tuyen tinh thi khong sao - ham loss co dang bat, chi co
#   MOT day duy nhat, xuat phat dau cung ve day.
#
#   Voi MANG NEURAL thi KHONG duoc khoi tao toan 0: moi no-ron se tinh ra
#   cung mot gia tri, cung mot gradient, va mai mai giong nhau ("symmetry
#   breaking problem"). Phai khoi tao ngau nhien. Ban se gap lai o Phase 05.
#
# GHI LOSS TRUOC HAY SAU KHI CAP NHAT?
#   O day ta ghi TRUOC khi cap nhat, nen lich_su_loss[0] la loss cua tham so
#   ban dau. Ca hai cach deu duoc, mien nhat quan. Diem quan trong:
#   loss phai GIAM DAN. Neu no tang -> learning rate qua lon.


# ===========================================================================
def sigmoid(z: np.ndarray | float) -> np.ndarray | float:
    return 1 / (1 + np.exp(-z))


# VI SAO SIGMOID QUAN TRONG?
#   No bien MOI so thuc thanh gia tri trong (0, 1) -> dung lam XAC SUAT.
#
#       z = -5  ->  0.007    "gan nhu chac chan la lop 0"
#       z =  0  ->  0.5      "khong biet"
#       z = +5  ->  0.993    "gan nhu chac chan la lop 1"
#
#   Hoi quy logistic = hoi quy tuyen tinh + sigmoid.
#   Do cung la cach lop cuoi cua mang neural phan loai nhi phan hoat dong.
#
# VAN DE TRAN SO (overflow):
#   Voi z = -1000, np.exp(1000) vuot qua gioi han float64 -> canh bao
#   RuntimeWarning va tra ve inf. Ket qua 1/inf = 0.0 van dung, nhung
#   canh bao lam ban roi.
#
#   PHIEN BAN ON DINH:
#       def sigmoid_on_dinh(z):
#           z = np.asarray(z, dtype=float)
#           duong = z >= 0
#           kq = np.empty_like(z)
#           kq[duong] = 1 / (1 + np.exp(-z[duong]))
#           exp_z = np.exp(z[~duong])
#           kq[~duong] = exp_z / (1 + exp_z)
#           return kq
#
#   Y tuong: voi z am, nhan ca tu va mau voi e^z de mu luon <= 0.
#   Cac thu vien that (PyTorch, scipy) deu lam kieu nay.
#   Ban khong can tu viet - nhung nen biet vi sao no ton tai.
#
# HAM KICH HOAT KHAC (Phase 05):
#   ReLU      max(0, x)   - pho bien nhat cho lop an, nhanh, don gian
#   Softmax               - phien ban nhieu lop cua sigmoid
#   GELU                  - dung trong Transformer/GPT
#   Sigmoid ngay nay chu yeu dung o LOP CUOI cho bai toan nhi phan,
#   khong con dung cho lop an vi gay "vanishing gradient".


# ===========================================================================
if __name__ == "__main__":
    assert loss_binh_phuong(3) == 0
    assert loss_binh_phuong(5) == 4
    assert gradient_binh_phuong(5) == 4
    assert gradient_binh_phuong(3) == 0

    ls = gradient_descent(0.0, 0.1, 3)
    assert len(ls) == 4
    assert abs(ls[1] - 0.6) < 1e-9

    # Sinh du lieu voi w that = [2, -1], b that = 5
    rng = np.random.default_rng(42)
    X = rng.normal(size=(200, 2))
    y = X @ np.array([2.0, -1.0]) + 5.0

    w, b, lich_su = train_hoi_quy(X, y, learning_rate=0.1, so_epoch=500)
    print(f"  w hoc duoc = {w}          (that: [2, -1])")
    print(f"  b hoc duoc = {b:.4f}      (that: 5)")
    print(f"  loss dau   = {lich_su[0]:.4f}")
    print(f"  loss cuoi  = {lich_su[-1]:.8f}")

    assert np.allclose(w, [2.0, -1.0], atol=0.01)
    assert abs(b - 5.0) < 0.01
    assert lich_su[-1] < lich_su[0]

    assert abs(sigmoid(0) - 0.5) < 1e-9
    assert sigmoid(100) > 0.99

    print("\nTat ca deu dung.")
