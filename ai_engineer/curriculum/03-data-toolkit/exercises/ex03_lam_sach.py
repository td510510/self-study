"""BAI TAP 3 - Lam sach du lieu (Tuan 8).

Cham diem:  pytest tests/phase03/test_ex03.py -v
Loi giai:   curriculum/03-data-toolkit/solutions/ex03_lam_sach.py

Day la bai tap sat thuc te nhat cua Phase 03. Moi ham deu xu ly mot loi
CO THAT trong file data/ban_hang.csv.

Sau khi lam xong, thu chay tung ham tren du lieu that:
    df = pd.read_csv("data/ban_hang.csv")
"""

from __future__ import annotations

import numpy as np
import pandas as pd


# ===========================================================================
#  3.1 - Chuan hoa ten thanh pho
# ===========================================================================
BANG_THANH_PHO = {
    "hn": "Ha Noi", "ha noi": "Ha Noi", "hà nội": "Ha Noi",
    "hcm": "TP HCM", "tphcm": "TP HCM", "tp hcm": "TP HCM",
    "tp.hcm": "TP HCM", "ho chi minh": "TP HCM", "sg": "TP HCM",
    "dn": "Da Nang", "da nang": "Da Nang", "đà nẵng": "Da Nang",
    "ct": "Can Tho", "can tho": "Can Tho",
    "hp": "Hai Phong", "hai phong": "Hai Phong",
}


def chuan_hoa_thanh_pho(s: pd.Series) -> pd.Series:
    """Chuan hoa cot ten thanh pho ve dang chuan.

    Cac buoc:
        1. Bo khoang trang thua o dau/cuoi
        2. Doi ve chu THUONG het
        3. Tra bang BANG_THANH_PHO o tren de doi ve ten chuan
        4. Gia tri khong co trong bang -> "Khac"
        5. Gia tri thieu (NaN) -> "Khong ro"

    Vi du:
        Series(["HN", " ha noi ", "SG", "Hue", None])
        ->  ["Ha Noi", "Ha Noi", "TP HCM", "Khac", "Khong ro"]

    Goi y: .str.strip().str.lower() roi .map(BANG_THANH_PHO)
           .map() tra ve NaN cho gia tri khong co trong bang.
           Nho xu ly NaN GOC truoc, de phan biet voi NaN do map sinh ra.
    """
    # TODO
    pass


# ===========================================================================
#  3.2 - Doi cot so bi luu duoi dang chuoi
# ===========================================================================
def doi_sang_so(s: pd.Series) -> pd.Series:
    """Doi cot chua so o dang chuoi thanh so thuc.

    Xu ly duoc cac dang:
        "1.200.000"  ->  1200000.0     (dau cham phan cach hang nghin)
        "1,200,000"  ->  1200000.0     (dau phay phan cach hang nghin)
        " 5000 "     ->  5000.0        (co khoang trang)
        1200000      ->  1200000.0     (von da la so)
        ""           ->  NaN
        "abc"        ->  NaN           (khong doi duoc thi thanh NaN)

    Tra ve Series kieu float.

    Goi y: doi ca cot sang chuoi bang .astype(str), bo dau . va , va khoang trang,
           roi dung pd.to_numeric(..., errors="coerce").
           errors="coerce" bien gia tri khong doi duoc thanh NaN thay vi nem loi.
    """
    # TODO
    pass


# ===========================================================================
#  3.3 - Doi cot ngay co nhieu dinh dang
# ===========================================================================
def doi_sang_ngay(s: pd.Series) -> pd.Series:
    """Doi cot ngay thang co NHIEU dinh dang thanh datetime.

    Phai xu ly duoc CA BA dang cung ton tai trong mot cot:
        "2025-03-15"    (ISO)
        "15/03/2025"    (ngay/thang/nam - kieu Viet Nam)
        "03-15-2025"    (thang-ngay-nam - kieu My)

    Gia tri khong doi duoc -> NaT (Not a Time, tuong duong NaN cho ngay).

    Vi du:
        Series(["2025-03-15", "15/03/2025", "03-15-2025", "khong phai ngay"])
        -> ba gia tri dau deu la 2025-03-15, gia tri cuoi la NaT

    Goi y: khong co mot lenh nao lam duoc ca ba. Hay thu tung dinh dang
           mot bang pd.to_datetime(..., format=..., errors="coerce"),
           roi dung .fillna() de gop ket qua lai.
           Ba format can dung: "%Y-%m-%d", "%d/%m/%Y", "%m-%d-%Y"
    """
    # TODO
    pass


# ===========================================================================
#  3.4 - Loai bo dong khong hop le
# ===========================================================================
def loc_dong_hop_le(df: pd.DataFrame) -> pd.DataFrame:
    """Giu lai cac dong HOP LE.

    Mot dong hop le khi thoa TAT CA:
        - so_luong khong thieu VA > 0
        - don_gia  khong thieu VA > 0

    Cac cot so_luong va don_gia da la kieu so (float).

    Tra ve DataFrame moi, index danh so lai tu 0.

    Vi du: bo cac dong co so_luong am, so_luong rong, don_gia = 0
    """
    # TODO
    pass


# ===========================================================================
#  3.5 - Bo dong trung lap
# ===========================================================================
def bo_trung_lap(df: pd.DataFrame, cot_khoa: str | None = None) -> tuple[pd.DataFrame, int]:
    """Bo dong trung lap.

    Neu cot_khoa la None  -> coi trung lap khi TOAN BO cac cot giong nhau
    Neu cot_khoa co gia tri -> coi trung lap khi cot do giong nhau

    Giu lai ban XUAT HIEN DAU TIEN.

    Tra ve (DataFrame da bo trung, so dong da bo).
    Index danh so lai tu 0.

    Goi y: df.duplicated(subset=...) va df.drop_duplicates(subset=...)
    """
    # TODO
    pass


# ===========================================================================
#  3.6 - Dien gia tri thieu theo nhom
# ===========================================================================
def dien_theo_nhom(df: pd.DataFrame, cot_can_dien: str, cot_nhom: str) -> pd.Series:
    """Dien gia tri thieu bang MEDIAN CUA NHOM ma dong do thuoc ve.

    Neu ca nhom deu thieu thi dung median TOAN CUC.
    Neu toan bo cot deu thieu thi dien 0.

    Vi du:
        danh_muc  gia
        A         100
        A         NaN    <- dien 150 (median cua nhom A: [100, 200])
        A         200
        B         500

    Tra ve Series cung index voi df.

    VI SAO DIEN THEO NHOM TOT HON DIEN TOAN CUC?
        Gia laptop thieu ma dien bang median cua CA BANG (gom ca phu kien
        gia 50 nghin) thi ra con so vo nghia. Dien bang median cua rieng
        nhom laptop moi hop ly.

    Goi y: df.groupby(cot_nhom)[cot_can_dien].transform("median")
           roi .fillna() nhieu tang.
    """
    # TODO
    pass


# ===========================================================================
#  3.7 - Bao cao chat luong du lieu
# ===========================================================================
def bao_cao_chat_luong(df: pd.DataFrame) -> pd.DataFrame:
    """Tao bang bao cao chat luong cho TUNG COT.

    Tra ve DataFrame co dung 5 cot, theo thu tu:
        cot          - ten cot
        kieu         - kieu du lieu (chuoi)
        so_thieu     - so o thieu
        ty_le_thieu  - ty le thieu, lam tron 4 chu so (0.0 den 1.0)
        so_gia_tri   - so gia tri KHAC NHAU (nunique)

    Moi cot cua df thanh mot DONG trong bao cao.
    Sap giam dan theo ty_le_thieu, index danh so lai tu 0.

    Day la ham ban se dung cho MOI dataset moi trong doi.
    """
    # TODO
    pass


# ===========================================================================
if __name__ == "__main__":
    from pathlib import Path

    duong_dan = Path("data/ban_hang.csv")
    if not duong_dan.exists():
        print("Chua co du lieu. Chay truoc:")
        print("    python curriculum/03-data-toolkit/tao_du_lieu.py")
        raise SystemExit(1)

    df = pd.read_csv(duong_dan)
    print(f"Doc {len(df)} dong tu {duong_dan}\n")

    bc = bao_cao_chat_luong(df)
    print("Bao cao chat luong:")
    print(bc if bc is not None else "  (chua lam)")
