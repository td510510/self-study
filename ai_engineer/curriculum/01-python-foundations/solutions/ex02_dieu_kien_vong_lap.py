"""LOI GIAI - Bai tap 2, Phase 01."""

from __future__ import annotations


# ===========================================================================
def phan_loai_bmi(can_nang: float, chieu_cao: float) -> str:
    bmi = can_nang / (chieu_cao**2)

    if bmi < 18.5:
        return "Thieu can"
    elif bmi < 25:
        return "Binh thuong"
    elif bmi < 30:
        return "Thua can"
    else:
        return "Beo phi"


# VI SAO chi can so sanh MOT VE?
#   Khi da di qua `if bmi < 18.5` ma khong khop, ta BIET CHAC bmi >= 18.5.
#   Nen `elif bmi < 25` la du, khong can viet `elif 18.5 <= bmi < 25`.
#   Viet du ca hai ve khong sai, nhung thua va de go nham.
#
# CHU Y thu tu: phai di tu THAP len CAO (hoac cao xuong thap), nhat quan.
#   Neu dao lon thu tu, cac dieu kien se "che" nhau va cho ket qua sai.
#
# TINH BMI: dung ** de luy thua. chieu_cao**2 giong chieu_cao * chieu_cao.


# ===========================================================================
def tien_dien(so_kwh: int) -> int:
    tong = 0
    con_lai = so_kwh

    # Bac 1: 50 kWh dau
    bac1 = min(con_lai, 50)
    tong += bac1 * 1800
    con_lai -= bac1

    # Bac 2: 50 kWh tiep theo
    bac2 = min(con_lai, 50)
    tong += bac2 * 2000
    con_lai -= bac2

    # Bac 3: phan con lai
    tong += con_lai * 2500

    return tong


# VI SAO dung min(con_lai, 50)?
#   Day la meo rat huu ich cho bai toan bac thang.
#   min(con_lai, 50) cho biet "bac nay tieu thu bao nhieu":
#       con_lai = 30  ->  min(30, 50) = 30   (chua het bac 1)
#       con_lai = 80  ->  min(80, 50) = 50   (day bac 1, con du sang bac 2)
#   Khong can viet if/else long nhau.
#
# CACH VIET GON HON (khi so bac nhieu):
#     BANG_GIA = [(50, 1800), (50, 2000), (float("inf"), 2500)]
#     tong = 0
#     con_lai = so_kwh
#     for gioi_han, don_gia in BANG_GIA:
#         dung = min(con_lai, gioi_han)
#         tong += dung * don_gia
#         con_lai -= dung
#
#   Cach nay tot hon vi khi bieu gia thay doi, ban chi sua BANG_GIA
#   chu khong sua logic. Nguyen tac: TACH DU LIEU KHOI LOGIC.


# ===========================================================================
def loc_so_duong(cac_so: list[float]) -> list[float]:
    return [x for x in cac_so if x > 0]


# VI SAO khong sua list goc?
#   Ham sua doi du lieu dau vao ("side effect") rat de gay bug, vi nguoi goi
#   khong ngo den. Ham TRA VE gia tri moi thi an toan va de test hon.
#
#   Cach lam SAI - vua sai ket qua vua sua list goc:
#       for x in cac_so:
#           if x <= 0:
#               cac_so.remove(x)     # <- xoa khi dang duyet: BO SOT phan tu!
#
#   Vi sao bo sot: khi xoa phan tu thu i, cac phan tu sau don len mot bac,
#   nhung vong lap van nhay sang chi so i+1 -> phan tu vua don len bi bo qua.
#   QUY TAC: KHONG BAO GIO sua mot list trong luc dang duyet no.


# ===========================================================================
def lon_thu_hai(cac_so: list[float]) -> float | None:
    gia_tri_khac_nhau = sorted(set(cac_so), reverse=True)

    if len(gia_tri_khac_nhau) < 2:
        return None
    return gia_tri_khac_nhau[1]


# VI SAO set() truoc?
#   Yeu cau la "lon thu hai theo GIA TRI KHAC NHAU".
#   [5, 5, 3] -> so lon thu hai la 3, khong phai 5.
#   set() loai trung, giai quyet goi.
#
# VI SAO kiem tra len < 2?
#   Neu chi co 0 hoac 1 gia tri khac nhau thi khong ton tai "thu hai".
#   Truy cap [1] luc do se nem IndexError.
#
# LUU Y VE HIEU NANG:
#   sorted() ton O(n log n). Neu chi can 2 phan tu lon nhat tren du lieu
#   rat lon, co cach O(n) bang cach duyet mot lan va giu 2 bien.
#   Voi bai tap nay, sorted() ro rang va du nhanh. Toi uu som la lang phi.


# ===========================================================================
def fibonacci(n: int) -> list[int]:
    ket_qua: list[int] = []
    a, b = 0, 1

    for _ in range(n):
        ket_qua.append(a)
        a, b = b, a + b

    return ket_qua


# VI SAO `a, b = b, a + b` ma khong viet hai dong?
#   Neu viet:
#       a = b          # a bi ghi de NGAY LAP TUC
#       b = a + b      # a o day da la gia tri MOI -> SAI
#
#   Python tinh TOAN BO ve phai truoc, roi moi gan.
#   `a, b = b, a + b` -> tinh (b, a+b) voi gia tri CU, roi gan cung luc.
#   Day la mot trong nhung diem dep nhat cua Python.
#
# VI SAO dung `_` lam ten bien?
#   `_` la quy uoc cho "bien nay toi khong dung den".
#   Nguoi doc thay ngay: vong lap chay n lan, khong quan tam so thu tu.


# ===========================================================================
def dem_ky_tu(van_ban: str) -> dict[str, int]:
    ket_qua: dict[str, int] = {}

    for ky_tu in van_ban.lower():
        if ky_tu == " ":
            continue
        ket_qua[ky_tu] = ket_qua.get(ky_tu, 0) + 1

    return ket_qua


# VI SAO dung .get(ky_tu, 0)?
#   Lan dau gap mot ky tu, no chua co trong dict.
#       ket_qua[ky_tu] += 1        # -> KeyError
#       ket_qua.get(ky_tu, 0) + 1  # -> khong co thi coi nhu 0
#
# CACH CHUYEN NGHIEP HON - thu vien chuan da co san:
#     from collections import Counter
#     def dem_ky_tu(van_ban):
#         return dict(Counter(van_ban.lower().replace(" ", "")))
#
#   Counter la mot dict chuyen de dem, con co .most_common(3) rat tien.
#   Ban se dung Counter rat nhieu khi phan tich van ban o Phase 06.
#   Bai tap nay bat tu viet de ban hieu ben trong Counter lam gi.
#
# VI SAO dung `continue` ma khong dung `if ky_tu != " ":`?
#   Ca hai deu duoc. `continue` giup tranh long them mot tang thut le,
#   code phang hon thi de doc hon. Voi nhieu dieu kien loai tru,
#   `continue` cang co loi.


# ===========================================================================
if __name__ == "__main__":
    assert phan_loai_bmi(60, 1.70) == "Binh thuong"
    assert tien_dien(80) == 150000
    assert tien_dien(150) == 315000
    assert loc_so_duong([1, -2, 3, 0, -5]) == [1, 3]
    assert lon_thu_hai([5, 5, 3]) == 3
    assert lon_thu_hai([5, 5, 5]) is None
    assert fibonacci(7) == [0, 1, 1, 2, 3, 5, 8]
    assert dem_ky_tu("Hi hi") == {"h": 2, "i": 2}
    print("Tat ca deu dung.")
