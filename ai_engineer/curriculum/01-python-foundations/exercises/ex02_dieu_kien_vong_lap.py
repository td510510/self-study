"""BAI TAP 2 - Dieu kien va vong lap (Tuan 2).

Cham diem:  pytest tests/phase01/test_ex02.py -v
Loi giai:   curriculum/01-python-foundations/solutions/ex02_dieu_kien_vong_lap.py
"""

from __future__ import annotations


# ===========================================================================
#  2.1 - Phan loai BMI
# ===========================================================================
def phan_loai_bmi(can_nang: float, chieu_cao: float) -> str:
    """Tinh BMI = can_nang / chieu_cao^2 roi phan loai.

        BMI < 18.5          ->  "Thieu can"
        18.5 <= BMI < 25    ->  "Binh thuong"
        25 <= BMI < 30      ->  "Thua can"
        BMI >= 30           ->  "Beo phi"

    can_nang tinh bang kg, chieu_cao tinh bang MET.

    Vi du:
        phan_loai_bmi(60, 1.70)  ->  "Binh thuong"   (BMI = 20.8)
        phan_loai_bmi(45, 1.70)  ->  "Thieu can"     (BMI = 15.6)
        phan_loai_bmi(80, 1.70)  ->  "Thua can"      (BMI = 27.7)
    """
    # TODO
    pass


# ===========================================================================
#  2.2 - Tinh tien dien bac thang
# ===========================================================================
def tien_dien(so_kwh: int) -> int:
    """Tinh tien dien theo bac thang (don gian hoa).

        50 kWh dau tien       : 1.800 d/kWh
        50 kWh tiep theo      : 2.000 d/kWh
        Tu kWh thu 101 tro di : 2.500 d/kWh

    Tra ve so tien (so nguyen).

    Vi du:
        tien_dien(30)   ->  54000     (30 * 1800)
        tien_dien(50)   ->  90000     (50 * 1800)
        tien_dien(80)   ->  150000    (50*1800 + 30*2000)
        tien_dien(150)  ->  315000    (50*1800 + 50*2000 + 50*2500)
        tien_dien(0)    ->  0

    Goi y: xu ly tung bac mot, tru dan so kwh con lai.
    """
    # TODO
    pass


# ===========================================================================
#  2.3 - Loc so duong
# ===========================================================================
def loc_so_duong(cac_so: list[float]) -> list[float]:
    """Tra ve list moi chi chua cac so lon hon 0.

    Vi du:
        loc_so_duong([1, -2, 3, 0, -5])  ->  [1, 3]
        loc_so_duong([])                 ->  []
        loc_so_duong([-1, -2])           ->  []

    LUU Y: khong duoc sua list goc.
    Goi y: dung list comprehension.
    """
    # TODO
    pass


# ===========================================================================
#  2.4 - Tim so lon thu hai
# ===========================================================================
def lon_thu_hai(cac_so: list[float]) -> float | None:
    """Tim so LON THU HAI trong list (theo gia tri khac nhau).

    Neu khong co so lon thu hai (list rong, hoac moi phan tu bang nhau)
    thi tra ve None.

    Vi du:
        lon_thu_hai([3, 1, 4, 1, 5])  ->  4
        lon_thu_hai([5, 5, 3])        ->  3     (bo qua gia tri trung)
        lon_thu_hai([7])              ->  None
        lon_thu_hai([5, 5, 5])        ->  None
        lon_thu_hai([])               ->  None

    Goi y: set() de loai trung, sorted() de sap xep.
    """
    # TODO
    pass


# ===========================================================================
#  2.5 - Chuoi Fibonacci
# ===========================================================================
def fibonacci(n: int) -> list[int]:
    """Tra ve list n so Fibonacci dau tien.

    Fibonacci: moi so bang tong hai so truoc do, bat dau tu 0 va 1.

    Vi du:
        fibonacci(0)  ->  []
        fibonacci(1)  ->  [0]
        fibonacci(2)  ->  [0, 1]
        fibonacci(7)  ->  [0, 1, 1, 2, 3, 5, 8]

    Goi y: dung vong lap while hoac for, giu hai bien a, b.
    """
    # TODO
    pass


# ===========================================================================
#  2.6 - Dem ky tu
# ===========================================================================
def dem_ky_tu(van_ban: str) -> dict[str, int]:
    """Dem so lan xuat hien cua tung ky tu (khong tinh khoang trang).

    Khong phan biet chu hoa/thuong.

    Vi du:
        dem_ky_tu("aba")      ->  {"a": 2, "b": 1}
        dem_ky_tu("Hi hi")    ->  {"h": 2, "i": 2}
        dem_ky_tu("")         ->  {}

    Goi y: duyet tung ky tu, dung dict.get(ky_tu, 0) + 1
    """
    # TODO
    pass


# ===========================================================================
if __name__ == "__main__":
    print("Ket qua cua ban:\n")
    print(f"  phan_loai_bmi(60, 1.70) = {phan_loai_bmi(60, 1.70)!r}")
    print(f"  tien_dien(80)           = {tien_dien(80)!r}")
    print(f"  loc_so_duong([1,-2,3])  = {loc_so_duong([1, -2, 3])!r}")
    print(f"  lon_thu_hai([3,1,4,5])  = {lon_thu_hai([3, 1, 4, 5])!r}")
    print(f"  fibonacci(7)            = {fibonacci(7)!r}")
    print(f"  dem_ky_tu('aba')        = {dem_ky_tu('aba')!r}")
