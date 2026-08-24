"""BAI TAP 1 - Hoi quy va danh gia model (Tuan 9).

Cham diem:  pytest tests/phase04/test_ex01.py -v
Loi giai:   curriculum/04-classical-ml/solutions/ex01_hoi_quy.py

Bai nay ban TU VIET cac ham ma sklearn cung cap san. Muc dich khong phai
thay the sklearn, ma de ban hieu chinh xac tung con so nghia la gi.
Sau bai nay, khi doc `r2_score(y, pred) = 0.85` ban se biet no duoc tinh ra sao.

CHI DUNG numpy. Khong import sklearn trong file nay.
"""

from __future__ import annotations

import numpy as np


# ===========================================================================
#  1.1 - Chia du lieu
# ===========================================================================
def chia_train_test(
    X: np.ndarray, y: np.ndarray, ty_le_test: float = 0.2, seed: int = 42
) -> tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
    """Chia du lieu thanh tap train va test, co XAO TRON.

    Tra ve (X_train, X_test, y_train, y_test) - dung thu tu nay.

    Yeu cau:
        - Phai XAO TRON truoc khi chia (du lieu that thuong da duoc sap xep san)
        - Kich thuoc tap test = int(n * ty_le_test)
        - Dung seed de chay lai ra ket qua y het

    Vi du: n=100, ty_le_test=0.2  ->  80 dong train, 20 dong test

    Goi y:
        rng = np.random.default_rng(seed)
        chi_so = rng.permutation(len(X))
    """
    # TODO
    pass


# ===========================================================================
#  1.2 - Cac metric hoi quy
# ===========================================================================
def mae(y_that: np.ndarray, y_du_doan: np.ndarray) -> float:
    """Mean Absolute Error: trung binh cua |sai so|.

    Vi du: mae([100, 200], [110, 190])  ->  10.0
    """
    # TODO
    pass


def rmse(y_that: np.ndarray, y_du_doan: np.ndarray) -> float:
    """Root Mean Squared Error: can bac hai cua trung binh (sai so)^2.

    Vi du: mae va rmse cua ([0, 0], [1, 1]) deu bang 1.0
           nhung voi ([0, 0], [0, 2]): mae = 1.0 con rmse = 1.414
           -> rmse PHAT NANG sai so lon hon.
    """
    # TODO
    pass


def r2(y_that: np.ndarray, y_du_doan: np.ndarray) -> float:
    """He so xac dinh R^2 = 1 - SS_res / SS_tot

    trong do:
        SS_res = tong (y_that - y_du_doan)^2      <- sai so cua MODEL
        SS_tot = tong (y_that - mean(y_that))^2   <- sai so neu luon doan TRUNG BINH

    Y nghia: model giai thich duoc bao nhieu % bien thien cua du lieu.

    Vi du:
        Du doan hoan hao          ->  1.0
        Luon doan dung trung binh ->  0.0
        Te hon ca doan trung binh ->  SO AM

    Neu SS_tot = 0 (moi gia tri y giong nhau) thi tra ve 0.0.
    """
    # TODO
    pass


# ===========================================================================
#  1.3 - Baseline
# ===========================================================================
def baseline_trung_binh(y_train: np.ndarray, n_test: int) -> np.ndarray:
    """Model NGU NGOC NHAT: luon du doan gia tri trung binh cua tap TRAIN.

    Tra ve mang do dai n_test, moi phan tu deu bang mean(y_train).

    VI SAO CAN BASELINE?
        De biet model cua ban co thuc su hoc duoc gi khong.
        Neu model phuc tap chi hon baseline mot chut, no khong dang dua
        vao san xuat - vi ton tien van hanh va tang rui ro.

    LUU Y QUAN TRONG: dung mean cua TRAIN, khong phai cua test.
        Dung mean cua test la DATA LEAKAGE.
    """
    # TODO
    pass


# ===========================================================================
#  1.4 - Hoi quy tuyen tinh bang nghiem giai tich
# ===========================================================================
def fit_hoi_quy(X: np.ndarray, y: np.ndarray) -> tuple[np.ndarray, float]:
    """Tim w va b toi uu cho mo hinh y = X @ w + b.

    Tra ve (w, b) trong do w co shape (n_dac_trung,) va b la mot so.

    CACH LAM - nghiem binh phuong toi thieu:
        1. Them mot cot toan so 1 vao BEN TRAI cua X  -> X_mo_rong
           (cot nay dai dien cho he so chan b)
        2. Giai he phuong trinh bang np.linalg.lstsq:
               theta, *_ = np.linalg.lstsq(X_mo_rong, y, rcond=None)
        3. theta[0] la b, theta[1:] la w

    Vi du:
        X = [[1], [2], [3]],  y = [3, 5, 7]      (y = 2x + 1)
        -> w = [2.0], b = 1.0

    LUU Y: khong dung gradient descent o day. sklearn cung dung nghiem
    giai tich cho hoi quy tuyen tinh - nhanh va chinh xac hon.
    Gradient descent chi can khi du lieu qua lon hoac model phi tuyen.

    Goi y: np.column_stack([np.ones(len(X)), X])
    """
    # TODO
    pass


def du_doan(X: np.ndarray, w: np.ndarray, b: float) -> np.ndarray:
    """Tinh du doan: X @ w + b"""
    # TODO
    pass


# ===========================================================================
#  1.5 - Chan doan overfitting
# ===========================================================================
def chan_doan(diem_train: float, diem_test: float, nguong: float = 0.1) -> str:
    """Chan doan tinh trang model dua tren R^2 cua train va test.

    Quy tac (xet theo thu tu nay):
        1. diem_test > diem_train + nguong   ->  "Bat thuong"
           (test tot hon train dang ke -> gan nhu chac chan co bug)
        2. diem_train - diem_test > nguong   ->  "Overfit"
           (hoc thuoc long tap train)
        3. diem_train < 0.5                  ->  "Underfit"
           (model qua don gian, sai ca tren train)
        4. con lai                           ->  "Tot"

    Vi du:
        chan_doan(0.99, 0.62)  ->  "Overfit"
        chan_doan(0.85, 0.83)  ->  "Tot"
        chan_doan(0.30, 0.28)  ->  "Underfit"
        chan_doan(0.60, 0.85)  ->  "Bat thuong"
    """
    # TODO
    pass


# ===========================================================================
#  1.6 - Tao dac trung da thuc
# ===========================================================================
def them_dac_trung_da_thuc(X: np.ndarray, bac: int = 2) -> np.ndarray:
    """Them cac luy thua cua tung dac trung de model hoc duoc quan he phi tuyen.

    X co shape (n_mau, n_dac_trung).
    Ket qua co shape (n_mau, n_dac_trung * bac) theo THU TU:
        [X, X^2, X^3, ..., X^bac]

    Vi du:
        X = [[2], [3]],  bac=3
        -> [[2, 4, 8],
            [3, 9, 27]]

        X = [[1, 2]],  bac=2
        -> [[1, 2, 1, 4]]      <- [X, X^2] chu KHONG phai xen ke

    Bac 1 thi tra ve chinh X.

    VI SAO CAN?
        Hoi quy tuyen tinh chi ve duoc duong THANG. Them X^2, X^3 cho phep
        no ve duong CONG - nhung bac cang cao cang de OVERFIT.
        Ban se thay tan mat dieu do trong bai tap va notebook.

    Goi y: np.column_stack([X ** i for i in range(1, bac + 1)])
    """
    # TODO
    pass


# ===========================================================================
if __name__ == "__main__":
    rng = np.random.default_rng(0)
    X = rng.normal(size=(200, 3))
    y = X @ np.array([2.0, -1.0, 0.5]) + 5.0 + rng.normal(0, 0.5, 200)

    kq = chia_train_test(X, y)
    if kq is None:
        print("chia_train_test chua lam.")
        raise SystemExit(0)

    X_tr, X_te, y_tr, y_te = kq
    print(f"  Train: {X_tr.shape}   Test: {X_te.shape}\n")

    w, b = fit_hoi_quy(X_tr, y_tr)
    print(f"  w hoc duoc = {np.round(w, 3)}   (that: [2, -1, 0.5])")
    print(f"  b hoc duoc = {b:.3f}            (that: 5)\n")

    p_tr, p_te = du_doan(X_tr, w, b), du_doan(X_te, w, b)
    print(f"  R2  train = {r2(y_tr, p_tr):.4f}")
    print(f"  R2  test  = {r2(y_te, p_te):.4f}")
    print(f"  MAE test  = {mae(y_te, p_te):.4f}")
    print(f"  RMSE test = {rmse(y_te, p_te):.4f}")
    print(f"  Chan doan : {chan_doan(r2(y_tr, p_tr), r2(y_te, p_te))}\n")

    bl = baseline_trung_binh(y_tr, len(y_te))
    print(f"  Baseline R2 = {r2(y_te, bl):.4f}   (luon ~0 hoac am)")
