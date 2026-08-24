"""BAI TAP 2 - Pandas (Tuan 7).

Cham diem:  pytest tests/phase03/test_ex02.py -v
Loi giai:   curriculum/03-data-toolkit/solutions/ex02_pandas.py

Test tu tao DataFrame nho de cham, ban khong can file du lieu that.
Nhung hay thu cac ham nay tren data/ban_hang.csv de thay chung hoat dong
tren du lieu that.
"""

from __future__ import annotations

import pandas as pd


# ===========================================================================
#  2.1 - Nhin dataset lan dau
# ===========================================================================
def tom_tat(df: pd.DataFrame) -> dict:
    """Tra ve tom tat nhanh ve DataFrame.

    Tra ve dict co dung 5 khoa:
        "so_dong"       - so dong
        "so_cot"        - so cot
        "so_trung_lap"  - so dong TRUNG LAP (khong tinh ban dau tien)
        "cot_thieu"     - dict {ten_cot: SO O thieu}, CHI cac cot co thieu
        "kieu_du_lieu"  - dict {ten_cot: ten kieu dang chuoi}

    Vi du voi df co 3 dong, 2 cot ("a" thieu 1 o, "b" khong thieu),
    khong co dong trung:
        {"so_dong": 3, "so_cot": 2, "so_trung_lap": 0,
         "cot_thieu": {"a": 1}, "kieu_du_lieu": {"a": "float64", "b": "object"}}

    Goi y: df.shape, df.duplicated().sum(), df.isna().sum(), df.dtypes
           Doi Series thanh dict bang .to_dict()
           Ep ten kieu thanh chuoi bang str(...)
    """
    # TODO
    pass


# ===========================================================================
#  2.2 - Loc nhieu dieu kien
# ===========================================================================
def loc_don_hang(df: pd.DataFrame, gia_toi_thieu: float, cac_kenh: list[str]) -> pd.DataFrame:
    """Loc cac don hang thoa CA HAI dieu kien:
        - cot "thanh_tien" >= gia_toi_thieu
        - cot "kenh" nam trong danh sach cac_kenh

    Tra ve DataFrame moi, index duoc danh so lai tu 0.
    KHONG duoc sua df goc.

    Goi y: dung & noi hai dieu kien, MOI VE TRONG NGOAC.
           .isin() de kiem tra thuoc danh sach.
           .reset_index(drop=True) o cuoi.
    """
    # TODO
    pass


# ===========================================================================
#  2.3 - Them cot tinh toan
# ===========================================================================
def them_thanh_tien(df: pd.DataFrame) -> pd.DataFrame:
    """Them cot "thanh_tien" = so_luong * don_gia * (1 - giam_gia).

    Lam tron ve so nguyen bang .round(0) roi doi kieu sang int.
    Tra ve DataFrame MOI (dung .copy()), khong sua df goc.

    Vi du: so_luong=2, don_gia=100, giam_gia=0.1  ->  thanh_tien = 180
    """
    # TODO
    pass


# ===========================================================================
#  2.4 - Nhom va tong hop
# ===========================================================================
def doanh_thu_theo_nhom(df: pd.DataFrame, cot_nhom: str) -> pd.DataFrame:
    """Tinh doanh thu theo nhom.

    Tra ve DataFrame co dung 4 cot, theo dung thu tu nay:
        <cot_nhom>, tong_doanh_thu, so_don, gia_tri_tb

    trong do:
        tong_doanh_thu = tong cot "thanh_tien"
        so_don         = so dong trong nhom
        gia_tri_tb     = trung binh cot "thanh_tien", lam tron 2 chu so

    Sap xep GIAM DAN theo tong_doanh_thu, index danh so lai tu 0.

    Goi y: df.groupby(cot_nhom).agg(ten_moi=("cot", "ham"), ...)
           roi .reset_index() va .sort_values(...)
    """
    # TODO
    pass


# ===========================================================================
#  2.5 - Ghep bang an toan
# ===========================================================================
def ghep_khach_hang(don: pd.DataFrame, khach: pd.DataFrame) -> pd.DataFrame:
    """Ghep thong tin khach hang vao bang don hang theo cot "khach_id".

    Yeu cau:
        - Giu LAI TAT CA don hang, ke ca don khong tim thay khach (how="left")
        - So dong sau khi ghep phai BANG so dong cua `don` ban dau.
          Neu khong bang, nem ValueError voi thong bao ro rang.
          (Dong nghia: bang `khach` khong duoc co khach_id trung lap.)

    Goi y: kiem tra len() truoc va sau merge.
    """
    # TODO
    pass


# ===========================================================================
#  2.6 - Top N theo nhom
# ===========================================================================
def top_khach_hang(df: pd.DataFrame, n: int = 5) -> pd.DataFrame:
    """Tim n khach hang chi tieu nhieu nhat.

    Tra ve DataFrame co 2 cot: "khach_id", "tong_chi"
    Sap giam dan theo tong_chi, index danh so lai tu 0.

    df co cac cot "khach_id" va "thanh_tien".

    Goi y: groupby -> sum -> sort_values -> head(n) -> reset_index
    """
    # TODO
    pass


# ===========================================================================
#  2.7 - Ty le tren tong cua nhom
# ===========================================================================
def ty_le_trong_nhom(df: pd.DataFrame, cot_nhom: str) -> pd.Series:
    """Voi moi dong, tinh ty le thanh_tien cua dong do tren TONG cua nhom.

    Tra ve Series cung do dai va cung index voi df.

    Vi du: nhom "A" co 2 don 30 va 70 -> ty le lan luot 0.3 va 0.7

    DAY LA CHO DUNG transform, KHONG PHAI agg:
        agg       -> giam so dong (moi nhom mot dong)
        transform -> giu nguyen so dong, phat gia tri nhom ve tung dong

    Goi y: df["thanh_tien"] / df.groupby(cot_nhom)["thanh_tien"].transform("sum")
    """
    # TODO
    pass


# ===========================================================================
if __name__ == "__main__":
    df = pd.DataFrame(
        {
            "don_id": ["D1", "D2", "D3", "D4"],
            "khach_id": ["K1", "K2", "K1", "K3"],
            "so_luong": [1, 2, 1, 3],
            "don_gia": [100, 200, 300, 100],
            "giam_gia": [0.0, 0.1, 0.0, 0.2],
            "kenh": ["App", "Website", "App", "Shopee"],
        }
    )

    print("Ket qua cua ban:\n")
    print("tom_tat:", tom_tat(df))
    print("\nthem_thanh_tien:")
    print(them_thanh_tien(df))
