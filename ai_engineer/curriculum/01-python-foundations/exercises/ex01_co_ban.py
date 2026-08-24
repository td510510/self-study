"""BAI TAP 1 - Bien, kieu du lieu, chuoi (Tuan 2).

Cham diem:  pytest tests/phase01/test_ex01.py -v
Loi giai:   curriculum/01-python-foundations/solutions/ex01_co_ban.py

Nho: vat lon 20 phut roi moi xem loi giai.
"""

from __future__ import annotations


# ===========================================================================
#  1.1 - Dinh dang tien te
# ===========================================================================
def dinh_dang_tien(so_tien: float) -> str:
    """Dinh dang so tien theo kieu Viet Nam.

    Vi du:
        dinh_dang_tien(1234567)   ->  "1,234,567 VND"
        dinh_dang_tien(0)         ->  "0 VND"
        dinh_dang_tien(1000.6)    ->  "1,001 VND"   (lam tron ve so nguyen)

    Goi y: f"{so:,.0f}"
    """
    # TODO
    pass


# ===========================================================================
#  1.2 - Viet hoa ten rieng
# ===========================================================================
def chuan_hoa_ten(ten: str) -> str:
    """Bo khoang trang thua va viet hoa chu cai dau moi tu.

    Vi du:
        chuan_hoa_ten("  nguyen van nam  ")  ->  "Nguyen Van Nam"
        chuan_hoa_ten("TRAN THI B")          ->  "Tran Thi B"
        chuan_hoa_ten("le  van   c")         ->  "Le Van C"   (khoang trang giua bi gop lai)

    Goi y: .split() khong tham so se tu tach theo moi khoang trang
           va bo cac khoang trang thua. Sau do " ".join(...)
    """
    # TODO
    pass


# ===========================================================================
#  1.3 - Tach ho va ten
# ===========================================================================
def tach_ho_ten(ho_ten: str) -> tuple[str, str]:
    """Tach ho ten thanh (ho_dem, ten).

    Nguoi Viet dat ten kieu "Ho Dem Ten", ten la tu CUOI CUNG.

    Vi du:
        tach_ho_ten("Nguyen Van Nam")  ->  ("Nguyen Van", "Nam")
        tach_ho_ten("Tran An")         ->  ("Tran", "An")
        tach_ho_ten("Nam")             ->  ("", "Nam")

    Goi y: tach thanh list, phan tu cuoi la ten, phan con lai la ho dem.
    """
    # TODO
    pass


# ===========================================================================
#  1.4 - Kiem tra email hop le (don gian)
# ===========================================================================
def email_hop_le(email: str) -> bool:
    """Kiem tra email co ve hop le khong.

    Quy tac (don gian hoa):
        - Co dung MOT dau @
        - Phan truoc @ khong rong
        - Phan sau @ co chua dau chAM (.)
        - Phan sau dau cham cuoi cung khong rong

    Vi du:
        email_hop_le("a@b.com")      ->  True
        email_hop_le("a.b@c.co.uk")  ->  True
        email_hop_le("ab.com")       ->  False   (khong co @)
        email_hop_le("@b.com")       ->  False   (truoc @ rong)
        email_hop_le("a@bcom")       ->  False   (sau @ khong co dau cham)
        email_hop_le("a@b@c.com")    ->  False   (hai dau @)

    Goi y: dung .count("@") va .split("@")
    """
    # TODO
    pass


# ===========================================================================
#  1.5 - Rut gon van ban
# ===========================================================================
def rut_gon(van_ban: str, do_dai_toi_da: int = 50) -> str:
    """Cat ngan van ban neu no qua dai, them "..." vao cuoi.

    QUAN TRONG: chuoi ket qua (ke ca dau "...") KHONG duoc dai hon do_dai_toi_da.

    Vi du:
        rut_gon("Xin chao", 50)          ->  "Xin chao"        (khong doi)
        rut_gon("Xin chao cac ban", 8)   ->  "Xin c..."        (dai dung 8)
        rut_gon("abcdefghij", 10)        ->  "abcdefghij"      (vua du, khong cat)

    Goi y: neu len(van_ban) <= do_dai_toi_da thi tra ve nguyen.
           Nguoc lai lay van_ban[:do_dai_toi_da - 3] roi noi them "..."
    """
    # TODO
    pass


# ===========================================================================
#  1.6 - Dem tu
# ===========================================================================
def dem_tu(van_ban: str) -> int:
    """Dem so tu trong van ban.

    Vi du:
        dem_tu("Xin chao cac ban")   ->  4
        dem_tu("  nhieu   khoang  ") ->  2
        dem_tu("")                   ->  0
        dem_tu("   ")                ->  0

    Goi y: .split() da xu ly san khoang trang thua giup ban.
    """
    # TODO
    pass


# ===========================================================================
if __name__ == "__main__":
    print("Ket qua cua ban:\n")
    print(f"  dinh_dang_tien(1234567)        = {dinh_dang_tien(1234567)!r}")
    print(f"  chuan_hoa_ten('  nguyen van ') = {chuan_hoa_ten('  nguyen van ')!r}")
    print(f"  tach_ho_ten('Nguyen Van Nam')  = {tach_ho_ten('Nguyen Van Nam')!r}")
    print(f"  email_hop_le('a@b.com')        = {email_hop_le('a@b.com')!r}")
    print(f"  rut_gon('Xin chao cac ban', 8) = {rut_gon('Xin chao cac ban', 8)!r}")
    print(f"  dem_tu('Xin chao cac ban')     = {dem_tu('Xin chao cac ban')!r}")
