"""BAI TAP 1 - Vector va ma tran voi NumPy (Tuan 5).

Cham diem:  pytest tests/phase02/test_ex01.py -v
Loi giai:   curriculum/02-math-essentials/solutions/ex01_vector_ma_tran.py

QUY TAC QUAN TRONG: KHONG dung vong lap `for` de duyet mang.
Moi bai deu co cach viet vectorized (dung phep toan tren ca mang).
Do chinh la thu ban can hoc o day.
"""

from __future__ import annotations

import numpy as np


# ===========================================================================
#  1.1 - Tich vo huong
# ===========================================================================
def tich_vo_huong(a: np.ndarray, b: np.ndarray) -> float:
    """Tinh tich vo huong cua hai vector: a1*b1 + a2*b2 + ...

    Vi du:
        tich_vo_huong(np.array([1, 2, 3]), np.array([4, 5, 6]))  ->  32.0
        (1*4 + 2*5 + 3*6 = 4 + 10 + 18 = 32)

    Goi y: dung a @ b hoac np.dot(a, b). Nho ep ve float().
    """
    # TODO
    pass


# ===========================================================================
#  1.2 - Do dai vector (norm)
# ===========================================================================
def do_dai(v: np.ndarray) -> float:
    """Tinh do dai (Euclidean norm) cua vector: sqrt(v1^2 + v2^2 + ...)

    Vi du:
        do_dai(np.array([3, 4]))  ->  5.0
        do_dai(np.array([0, 0]))  ->  0.0

    Goi y: np.linalg.norm(v)
    """
    # TODO
    pass


# ===========================================================================
#  1.3 - Cosine similarity  <- QUAN TRONG NHAT BAI NAY
# ===========================================================================
def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    """Tinh do tuong dong cosin: (a . b) / (|a| * |b|)

    Ket qua luon nam trong [-1, 1]:
        1.0  = cung huong hoan toan
        0.0  = vuong goc, khong lien quan
       -1.0  = nguoc huong hoan toan

    Neu MOT trong hai vector co do dai bang 0 thi tra ve 0.0
    (khong duoc chia cho 0).

    Vi du:
        cosine_similarity(np.array([1, 0]), np.array([1, 0]))   ->  1.0
        cosine_similarity(np.array([1, 0]), np.array([0, 1]))   ->  0.0
        cosine_similarity(np.array([1, 0]), np.array([-1, 0]))  -> -1.0
        cosine_similarity(np.array([1, 2]), np.array([2, 4]))   ->  1.0  (cung huong)

    DAY LA CONG THUC BAN SE DUNG RAT NHIEU O PHASE 08 (RAG).
    """
    # TODO
    pass


# ===========================================================================
#  1.4 - Chuan hoa theo cot (z-score)
# ===========================================================================
def chuan_hoa_cot(X: np.ndarray) -> np.ndarray:
    """Chuan hoa TUNG COT ve mean=0, std=1.

    Cong thuc cho moi cot:  (x - mean_cot) / std_cot

    X co shape (so_mau, so_dac_trung) - moi HANG la mot mau.

    Neu mot cot co std = 0 (moi gia tri giong nhau) thi de nguyen cot do
    tru di mean (ket qua thanh toan so 0), KHONG chia cho 0.

    Vi du:
        X = np.array([[1.0, 10.0],
                      [2.0, 20.0],
                      [3.0, 30.0]])
        chuan_hoa_cot(X)  ->  [[-1.22, -1.22],
                               [ 0.  ,  0.  ],
                               [ 1.22,  1.22]]

    Goi y: X.mean(axis=0) va X.std(axis=0) cho ra vector do dai = so cot,
           roi broadcasting lo phan con lai. KHONG can vong lap.
           Dung np.where de xu ly std = 0.
    """
    # TODO
    pass


# ===========================================================================
#  1.5 - Du doan tuyen tinh
# ===========================================================================
def du_doan_tuyen_tinh(X: np.ndarray, w: np.ndarray, b: float) -> np.ndarray:
    """Tinh du doan cua mo hinh tuyen tinh:  y = X @ w + b

    X shape (n_mau, n_dac_trung)
    w shape (n_dac_trung,)
    Ket qua shape (n_mau,)

    Vi du:
        X = np.array([[1.0, 2.0], [3.0, 4.0]])
        w = np.array([0.5, 1.5])
        b = 1.0
        -> [1*0.5 + 2*1.5 + 1,  3*0.5 + 4*1.5 + 1]  =  [4.5, 8.5]

    DAY LA PHEP TINH LOI CUA MOI MANG NEURAL.
    """
    # TODO
    pass


# ===========================================================================
#  1.6 - Hai ham mat mat
# ===========================================================================
def mse(y_that: np.ndarray, y_du_doan: np.ndarray) -> float:
    """Mean Squared Error: trung binh cua (sai so)^2

    Vi du:
        mse(np.array([1.0, 2.0]), np.array([1.0, 4.0]))  ->  2.0
        ((0)^2 + (2)^2) / 2 = 4/2 = 2

    Goi y: np.mean((y_that - y_du_doan) ** 2)
    """
    # TODO
    pass


def mae(y_that: np.ndarray, y_du_doan: np.ndarray) -> float:
    """Mean Absolute Error: trung binh cua |sai so|

    Vi du:
        mae(np.array([1.0, 2.0]), np.array([1.0, 4.0]))  ->  1.0
        (|0| + |2|) / 2 = 2/2 = 1
    """
    # TODO
    pass


# ===========================================================================
#  1.7 - Tim lang gieng gan nhat
# ===========================================================================
def tim_gan_nhat(truy_van: np.ndarray, kho: np.ndarray, k: int = 3) -> np.ndarray:
    """Tim k vector trong `kho` giong `truy_van` nhat (theo cosine similarity).

    truy_van shape (n_chieu,)
    kho      shape (n_vector, n_chieu)
    Tra ve   shape (k,)  - CHI SO cua cac vector giong nhat, giam dan theo do giong

    Vi du:
        kho = np.array([[1.0, 0.0],      # chi so 0 - giong het truy van
                        [0.0, 1.0],      # chi so 1 - vuong goc
                        [0.9, 0.1]])     # chi so 2 - kha giong
        tim_gan_nhat(np.array([1.0, 0.0]), kho, k=2)  ->  [0, 2]

    DAY CHINH LA CO CHE TIM KIEM CUA MOI HE THONG RAG.

    Goi y: tinh cosine cho tung vector trong kho (co the dung vong lap o day
           cho de hieu, hoac vectorized neu ban muon thu thach),
           roi np.argsort(...)[::-1][:k]
    """
    # TODO
    pass


# ===========================================================================
if __name__ == "__main__":
    a = np.array([1.0, 2.0, 3.0])
    b = np.array([4.0, 5.0, 6.0])

    print("Ket qua cua ban:\n")
    print(f"  tich_vo_huong(a, b)     = {tich_vo_huong(a, b)}")
    print(f"  do_dai([3, 4])          = {do_dai(np.array([3.0, 4.0]))}")
    print(f"  cosine([1,0], [1,0])    = {cosine_similarity(np.array([1.0, 0]), np.array([1.0, 0]))}")
    print(f"  mse([1,2], [1,4])       = {mse(np.array([1.0, 2]), np.array([1.0, 4]))}")
