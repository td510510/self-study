"""BAI TAP 1 - NumPy cho du lieu that (Tuan 6).

Cham diem:  pytest tests/phase03/test_ex01.py -v
Loi giai:   curriculum/03-data-toolkit/solutions/ex01_numpy.py

QUY TAC: KHONG dung vong lap `for` de duyet mang. Moi bai deu co cach
vectorized. Neu ban dang viet `for`, hay dung lai va tim ham NumPy tuong ung.
"""

from __future__ import annotations

import numpy as np


# ===========================================================================
#  1.1 - Dem gia tri thieu
# ===========================================================================
def dem_thieu(a: np.ndarray) -> int:
    """Dem so o bi thieu (nan) trong mang.

    Vi du:
        dem_thieu(np.array([1.0, np.nan, 3.0, np.nan]))  ->  2
        dem_thieu(np.array([1.0, 2.0]))                  ->  0

    LUU Y: `x == np.nan` LUON tra ve False, ke ca khi x dung la nan.
           Phai dung np.isnan().
    """
    # TODO
    pass


# ===========================================================================
#  1.2 - Thong ke bo qua nan
# ===========================================================================
def thong_ke_an_toan(a: np.ndarray) -> dict[str, float]:
    """Tinh thong ke, BO QUA cac o nan.

    Tra ve dict co dung 4 khoa: "mean", "median", "std", "so_o_hop_le"

    Vi du:
        thong_ke_an_toan(np.array([1.0, 2.0, np.nan, 3.0]))
        ->  {"mean": 2.0, "median": 2.0, "std": ..., "so_o_hop_le": 3}

    Neu TAT CA deu la nan thi tra ve mean/median/std bang 0.0 va so_o_hop_le = 0.

    Goi y: np.nanmean, np.nanmedian, np.nanstd
    """
    # TODO
    pass


# ===========================================================================
#  1.3 - Dien gia tri thieu
# ===========================================================================
def dien_thieu_bang_median(a: np.ndarray) -> np.ndarray:
    """Thay moi o nan bang gia tri median cua cac o KHONG thieu.

    Tra ve mang MOI, khong sua mang goc.

    Vi du:
        dien_thieu_bang_median(np.array([1.0, 2.0, np.nan, 3.0]))
        ->  [1.0, 2.0, 2.0, 3.0]

    Neu tat ca deu nan thi tra ve mang toan so 0.

    Goi y: np.nanmedian + np.where(np.isnan(a), gia_tri, a)
    """
    # TODO
    pass


# ===========================================================================
#  1.4 - Loc theo nhieu dieu kien
# ===========================================================================
def loc_khoang(a: np.ndarray, thap: float, cao: float) -> np.ndarray:
    """Tra ve cac gia tri nam trong khoang [thap, cao] (bao gom hai dau).

    Bo qua cac o nan.

    Vi du:
        loc_khoang(np.array([1.0, 5.0, np.nan, 10.0, 20.0]), 2, 15)
        ->  [5.0, 10.0]

    Goi y: dung & de noi dieu kien, moi ve TRONG NGOAC.
           Nho loai nan bang ~np.isnan(a).
    """
    # TODO
    pass


# ===========================================================================
#  1.5 - Phat hien ngoai lai bang IQR
# ===========================================================================
def tim_ngoai_lai_iqr(a: np.ndarray) -> np.ndarray:
    """Tim CHI SO cua cac gia tri ngoai lai theo quy tac IQR.

    Quy tac:
        q1, q3 = phan vi 25% va 75%   (bo qua nan)
        iqr = q3 - q1
        ngoai lai la gia tri < q1 - 1.5*iqr  HOAC  > q3 + 1.5*iqr

    Tra ve mang CHI SO, sap tang dan. O nan KHONG tinh la ngoai lai.

    Vi du:
        a = np.array([10., 12., 11., 13., 12., 100.])
        tim_ngoai_lai_iqr(a)  ->  [5]        (gia tri 100 o vi tri 5)

    Goi y: np.nanpercentile(a, [25, 75]) va np.where(...)[0]
    """
    # TODO
    pass


# ===========================================================================
#  1.6 - Thong ke theo nhom
# ===========================================================================
def tong_theo_nhom(gia_tri: np.ndarray, nhom: np.ndarray) -> dict:
    """Tinh TONG gia_tri cho tung nhom.

    gia_tri va nhom co cung do dai. Phan tu thu i cua gia_tri thuoc
    ve nhom[i].

    Tra ve dict {ten_nhom: tong}

    Vi du:
        gia_tri = np.array([10., 20., 30., 40.])
        nhom    = np.array(["A", "B", "A", "B"])
        ->  {"A": 40.0, "B": 60.0}

    Goi y: np.unique(nhom) roi voi moi nhom dung mat na boolean
           gia_tri[nhom == ten].sum()
           (Vong lap qua CAC NHOM thi duoc - thuong chi vai nhom.
            Dung vong lap qua tung PHAN TU.)
    """
    # TODO
    pass


# ===========================================================================
#  1.7 - Chuan hoa min-max
# ===========================================================================
def chuan_hoa_minmax(a: np.ndarray) -> np.ndarray:
    """Dua mang ve khoang [0, 1] theo cong thuc (x - min) / (max - min).

    Bo qua nan khi tinh min/max, nhung GIU nan trong ket qua.
    Neu max == min (moi gia tri giong nhau) thi tra ve mang toan so 0.

    Vi du:
        chuan_hoa_minmax(np.array([10., 20., 30.]))  ->  [0.0, 0.5, 1.0]
        chuan_hoa_minmax(np.array([5., 5., 5.]))     ->  [0.0, 0.0, 0.0]

    Goi y: np.nanmin, np.nanmax
    """
    # TODO
    pass


# ===========================================================================
if __name__ == "__main__":
    a = np.array([1.0, 2.0, np.nan, 4.0, 100.0])

    print("Ket qua cua ban:\n")
    print(f"  dem_thieu              = {dem_thieu(a)}")
    print(f"  thong_ke_an_toan       = {thong_ke_an_toan(a)}")
    print(f"  dien_thieu_bang_median = {dien_thieu_bang_median(a)}")
    print(f"  loc_khoang(a, 1, 10)   = {loc_khoang(a, 1, 10)}")
    print(f"  chuan_hoa_minmax       = {chuan_hoa_minmax(np.array([10., 20., 30.]))}")
