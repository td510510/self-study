"""BAI TAP 2 - Gradient descent (Tuan 5).

Cham diem:  pytest tests/phase02/test_ex02.py -v
Loi giai:   curriculum/02-math-essentials/solutions/ex02_gradient_descent.py

DAY LA BAI TAP QUAN TRONG NHAT CUA PHASE 02.
Ban sap tu code lai co che ma MOI mo hinh AI - tu hoi quy tuyen tinh
den GPT - deu dung de hoc.

Doc notebook 02_gradient_descent.ipynb truoc khi lam bai nay.
"""

from __future__ import annotations

import numpy as np


# ===========================================================================
#  2.1 - Ham mat mat va dao ham cua no
# ===========================================================================
def loss_binh_phuong(w: float) -> float:
    """Ham mat mat don gian de tap: f(w) = (w - 3)^2

    Diem thap nhat nam tai w = 3, gia tri loss = 0.

    Vi du:
        loss_binh_phuong(3)  ->  0.0
        loss_binh_phuong(5)  ->  4.0
        loss_binh_phuong(0)  ->  9.0
    """
    # TODO
    pass


def gradient_binh_phuong(w: float) -> float:
    """Dao ham cua f(w) = (w - 3)^2 theo w.

    Quy tac dao ham:  d/dw (w - 3)^2  =  2 * (w - 3)

    Vi du:
        gradient_binh_phuong(3)  ->  0.0    (tai day, do doc = 0 -> dang o day)
        gradient_binh_phuong(5)  ->  4.0    (duong -> dang o ben PHAI day)
        gradient_binh_phuong(0)  -> -6.0    (am   -> dang o ben TRAI day)

    Dau cua gradient cho biet ban dang o phia nao cua day.
    """
    # TODO
    pass


# ===========================================================================
#  2.2 - Vong lap gradient descent  <- TRAI TIM CUA BAI NAY
# ===========================================================================
def gradient_descent(
    w_ban_dau: float,
    learning_rate: float,
    so_buoc: int,
) -> list[float]:
    """Chay gradient descent tren ham f(w) = (w - 3)^2.

    Tra ve LICH SU cac gia tri w, bao gom ca w_ban_dau.
    Do dai ket qua = so_buoc + 1

    Cong thuc moi buoc:
        w_moi = w_cu - learning_rate * gradient(w_cu)

    Vi du:
        gradient_descent(0, 0.1, 3)
        buoc 0: w = 0
        buoc 1: w = 0   - 0.1 * (-6)   = 0.6
        buoc 2: w = 0.6 - 0.1 * (-4.8) = 1.08
        buoc 3: w = 1.08 - 0.1 * (-3.84) = 1.464
        ->  [0, 0.6, 1.08, 1.464]

    Goi y: dung gradient_binh_phuong() ban vua viet.
    """
    # TODO
    pass


# ===========================================================================
#  2.3 - Hoi quy tuyen tinh bang gradient descent
# ===========================================================================
def train_hoi_quy(
    X: np.ndarray,
    y: np.ndarray,
    learning_rate: float = 0.01,
    so_epoch: int = 100,
) -> tuple[np.ndarray, float, list[float]]:
    """Train mo hinh y = X @ w + b bang gradient descent.

    X shape (n_mau, n_dac_trung)
    y shape (n_mau,)

    Tra ve (w, b, lich_su_loss) trong do:
        w            - vector trong so da hoc, shape (n_dac_trung,)
        b            - do lech (bias)
        lich_su_loss - list MSE sau moi epoch, do dai = so_epoch

    KHOI TAO:
        w = mang toan so 0, shape (n_dac_trung,)
        b = 0.0

    MOI EPOCH lam 4 buoc:
        1. Du doan:      y_pred = X @ w + b
        2. Tinh loss:    mse = trung binh cua (y_pred - y)^2
        3. Tinh gradient:
                sai_so = y_pred - y                       shape (n_mau,)
                grad_w = (2 / n_mau) * (X.T @ sai_so)     shape (n_dac_trung,)
                grad_b = (2 / n_mau) * sai_so.sum()       mot so
        4. Cap nhat:
                w = w - learning_rate * grad_w
                b = b - learning_rate * grad_b

        Ghi loss cua buoc 2 vao lich_su_loss.

    Sau khi train, w va b phai xap xi gia tri that dung de sinh du lieu.
    """
    # TODO
    pass


# ===========================================================================
#  2.4 - Sigmoid
# ===========================================================================
def sigmoid(z: np.ndarray | float) -> np.ndarray | float:
    """Ham sigmoid: 1 / (1 + e^(-z))

    Bien mot so bat ky thanh gia tri trong khoang (0, 1) - dung lam XAC SUAT.

    Vi du:
        sigmoid(0)     ->  0.5
        sigmoid(100)   ->  ~1.0
        sigmoid(-100)  ->  ~0.0

    LUU Y: voi z rat am (vi du -1000), e^(-z) tran so va bao canh bao overflow.
    Cach xu ly on dinh: dung np.where de tinh khac nhau cho z >= 0 va z < 0.
    Bai tap nay chap nhan ban dung cong thuc truc tiep, nhung hay doc phan
    giai thich trong loi giai.
    """
    # TODO
    pass


# ===========================================================================
if __name__ == "__main__":
    print("=== Bai 2.2: gradient descent tren f(w) = (w-3)^2 ===\n")

    for lr in (0.01, 0.1, 0.5, 1.1):
        ls = gradient_descent(0.0, lr, 20)
        if ls is None:
            print(f"  lr={lr}: chua lam")
            continue
        print(f"  lr={lr:<5} -> w cuoi = {ls[-1]:10.4f}   (dich la 3.0)")

    print("\n  Nhan xet: lr qua nho hoi tu cham, lr qua lon (1.1) phan ky.")
