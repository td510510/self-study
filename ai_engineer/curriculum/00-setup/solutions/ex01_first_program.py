"""LOI GIAI - Bai tap 1, Phase 00.

DUNG DOC FILE NAY TRUOC KHI TU LAM IT NHAT 20 PHUT MOI CAU.

Doc xong roi thi DONG LAI va tu go lai tu dau trong file bai tap.
Doc hieu va viet duoc la hai chuyen khac nhau.

Moi loi giai deu co phan "VI SAO" - do moi la thu dang gia,
khong phai doan code.
"""

from __future__ import annotations


# ===========================================================================
#  BAI 1.1
# ===========================================================================
def chao(ten: str) -> str:
    return f"Xin chao, {ten}!"


# VI SAO dung f-string?
#   Co 3 cach noi chuoi trong Python:
#       "Xin chao, " + ten + "!"          <- cong chuoi, de sai dau cach
#       "Xin chao, {}!".format(ten)       <- cach cu, dai dong
#       f"Xin chao, {ten}!"               <- f-string: ngan, de doc nhat
#   Tu Python 3.6 tro di, f-string la cach duoc khuyen dung.


# ===========================================================================
#  BAI 1.2
# ===========================================================================
def tong_gio_hoc(so_tuan: int, gio_moi_tuan: int) -> int:
    return so_tuan * gio_moi_tuan


# VI SAO ham nay "tam thuong" ma van dang viet thanh ham?
#   Vi ten ham la tai lieu. Doc `tong_gio_hoc(22, 12)` hieu ngay,
#   con doc `22 * 12` giua mot doan code dai thi phai doan.
#   Dat ten tot la ky nang, khong phai thu tuc.


# ===========================================================================
#  BAI 1.3
# ===========================================================================
def doi_phut(tong_phut: int) -> str:
    gio = tong_phut // 60      # chia lay phan nguyen
    phut = tong_phut % 60      # chia lay phan du
    return f"{gio}h {phut}m"


# VI SAO dung // va % ?
#   130 / 60  = 2.1666...  <- so thuc, khong dung duoc truc tiep
#   130 // 60 = 2          <- so gio tron ven
#   130 % 60  = 10         <- so phut con lai
#   Cap // va % di voi nhau rat thuong xuyen khi chia don vi.


# ===========================================================================
#  BAI 1.4
# ===========================================================================
def xep_loai(diem: float) -> str:
    if diem >= 9:
        return "Gioi"
    elif diem >= 8:
        return "Kha"
    elif diem >= 6.5:
        return "Trung binh"
    else:
        return "Yeu"


# VI SAO xet tu CAO xuong THAP?
#   Python kiem tra tung dieu kien theo thu tu, gap cai dung dau tien
#   thi dung lai. Neu viet nguoc:
#       if diem >= 6.5:  return "Trung binh"   <- diem 9.5 cung khop!
#   thi moi diem tren 6.5 deu ra "Trung binh". Day la bug rat pho bien.
#
# LUU Y: sau `return` thi ham ket thuc luon, nen o day khong bat buoc
# phai dung `elif` - dung `if` lien tiep cung cho ket qua dung.
# Nhung `elif` the hien ro y "cac truong hop loai tru nhau", nen de doc hon.


# ===========================================================================
#  BAI 1.5
# ===========================================================================
def chia_an_toan(a: float, b: float) -> float | None:
    if b == 0:
        return None
    return a / b


# Cach 2 - dung try/except (se hoc ky o Phase 01):
#     try:
#         return a / b
#     except ZeroDivisionError:
#         return None
#
# CACH NAO TOT HON?
#   O day cach 1 tot hon: dieu kien don gian, kiem tra truoc ro rang hon.
#   try/except hop khi loi kho du doan truoc (doc file, goi mang).
#   Nguyen tac chung: "xin phep truoc" khi de kiem tra,
#   "xin loi sau" khi kho kiem tra truoc.
#
# VI SAO tra ve None ma khong phai 0?
#   0 la mot ket qua chia hop le (0/5 = 0). Tra ve 0 se lam nguoi doc
#   khong phan biet duoc "khong chia duoc" voi "ket qua bang 0".
#   None mang nghia "khong co gia tri" - dung y hon.


# ===========================================================================
#  BAI 1.6
# ===========================================================================
def phan_tram_hoan_thanh(so_tuan_xong: int, tong_so_tuan: int = 22) -> str:
    ty_le = so_tuan_xong / tong_so_tuan * 100
    return f"{ty_le:.1f}%"


# VI SAO co tham so mac dinh `tong_so_tuan: int = 22`?
#   Vi 99% truong hop dung la 22 tuan. Dat mac dinh giup goi ham gon:
#       phan_tram_hoan_thanh(11)        <- dung mac dinh
#       phan_tram_hoan_thanh(3, 10)     <- ghi de khi can
#
# CANH BAO QUAN TRONG:
#   Chi dung gia tri BAT BIEN lam mac dinh (so, chuoi, True/False, None).
#   TUYET DOI khong dung list hay dict:
#       def sai(items=[]):     # <- bug kinh dien, list dung chung giua cac lan goi
#       def dung(items=None):  # <- cach dung
#   Day la cau hoi phong van rat hay gap. Xem resources/interview/phase01-python.md
#
# VE DINH DANG `:.1f`
#   f"{3.14159:.1f}"  -> "3.1"     lam tron 1 chu so thap phan
#   f"{3.14159:.2f}"  -> "3.14"
#   f"{1234567:,}"    -> "1,234,567"   them dau phan cach hang nghin
#   f"{0.856:.1%}"    -> "85.6%"   tu nhan 100 va them dau %


# ===========================================================================
if __name__ == "__main__":
    print("Kiem tra nhanh loi giai:")
    assert chao("Nam") == "Xin chao, Nam!"
    assert tong_gio_hoc(22, 12) == 264
    assert doi_phut(130) == "2h 10m"
    assert xep_loai(9.5) == "Gioi"
    assert chia_an_toan(10, 0) is None
    assert phan_tram_hoan_thanh(11) == "50.0%"
    print("Tat ca deu dung.")
