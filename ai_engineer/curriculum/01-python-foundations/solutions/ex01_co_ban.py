"""LOI GIAI - Bai tap 1, Phase 01.

Doc phan "VI SAO" - do moi la thu dang gia.
"""

from __future__ import annotations


# ===========================================================================
def dinh_dang_tien(so_tien: float) -> str:
    return f"{so_tien:,.0f} VND"


# VI SAO:
#   Cu phap dinh dang trong f-string: {gia_tri:<dinh_dang>}
#       ,     -> them dau phan cach hang nghin
#       .0f   -> lam tron ve 0 chu so thap phan
#   Ket hop: ",.0f"
#
#   1000.6 -> "1,001" vi .0f lam tron chu khong cat.
#   Neu muon CAT (bo phan le) thi phai dung int() truoc.
#
#   Mot so dinh dang khac hay dung:
#       f"{0.8567:.1%}"   -> "85.7%"
#       f"{42:>8}"        -> "      42"   (can phai, do rong 8)
#       f"{42:<8}|"       -> "42      |"  (can trai)
#       f"{42:^8}|"       -> "   42   |"  (can giua)


# ===========================================================================
def chuan_hoa_ten(ten: str) -> str:
    cac_tu = ten.split()          # tu dong bo moi khoang trang thua
    return " ".join(tu.capitalize() for tu in cac_tu)


# VI SAO khong dung .title() cho gon?
#   .title() xu ly sai voi dau nhay va so:
#       "o'brien".title()  -> "O'Brien"   (co ve dung)
#       "1st place".title() -> "1St Place" (sai!)
#   .capitalize() tren tung tu an toan hon va y do ro rang hon.
#
# VI SAO .split() khong tham so?
#   .split()      -> tach theo BAT KY khoang trang nao, bo phan tu rong
#   .split(" ")   -> tach theo dung mot dau cach, giu lai chuoi rong
#
#   "a  b".split()      -> ['a', 'b']
#   "a  b".split(" ")   -> ['a', '', 'b']    <- co phan tu rong!
#   Day la ly do gan nhu luon dung .split() khong tham so voi van ban.


# ===========================================================================
def tach_ho_ten(ho_ten: str) -> tuple[str, str]:
    cac_tu = ho_ten.split()
    if not cac_tu:
        return ("", "")
    ten = cac_tu[-1]
    ho_dem = " ".join(cac_tu[:-1])
    return (ho_dem, ten)


# VI SAO kiem tra `if not cac_tu` truoc?
#   Voi chuoi rong, cac_tu = [] va cac_tu[-1] se nem IndexError.
#   Thoi quen tot: nghi ve truong hop RONG truoc khi viet phan chinh.
#   Day la mot trong "bo ba" truong hop bien luon phai nghi toi:
#       rong / mot phan tu / rat nhieu phan tu
#
# VE cach cat lat:
#   cac_tu[-1]   -> phan tu cuoi
#   cac_tu[:-1]  -> tat ca TRU phan tu cuoi
#   Hai cai nay di voi nhau rat thuong xuyen.
#
# VI SAO tra ve tuple ma khong phai list?
#   Vi day la mot nhom co dinh 2 phan tu, moi phan tu co Y NGHIA RIENG
#   (cai dau la ho dem, cai sau la ten). Do la dinh nghia cua tuple.
#   List danh cho day cac phan tu cung loai, so luong thay doi.


# ===========================================================================
def email_hop_le(email: str) -> bool:
    if email.count("@") != 1:
        return False

    phan_truoc, phan_sau = email.split("@")

    if not phan_truoc:
        return False
    if "." not in phan_sau:
        return False

    duoi = phan_sau.split(".")[-1]
    return bool(duoi)


# VI SAO kiem tra count("@") != 1 truoc tien?
#   Vi neu co 2 dau @, dong `a, b = email.split("@")` se nem ValueError
#   (khong giai nen 3 phan tu vao 2 bien duoc).
#   Nguyen tac: loai bo truong hop xau SOM, roi moi xu ly truong hop tot.
#   Kieu viet nay goi la "early return" - de doc hon if/else long nhau.
#
# VI SAO `return bool(duoi)` ma khong phai `return duoi != ""`?
#   Ca hai deu dung. bool() ngan hon, va the hien ro y "chuoi rong la sai".
#   Nhung `duoi != ""` ro rang hon cho nguoi moi doc. Chon cai nao cung duoc,
#   mien la nhat quan trong ca du an.
#
# TRONG THUC TE:
#   Kiem tra email dung chuan RFC 5322 rat phuc tap. Ngoai doi nguoi ta dung
#   thu vien (email-validator) hoac don gian la GUI MAIL XAC NHAN - cach duy
#   nhat biet email co that hay khong.


# ===========================================================================
def rut_gon(van_ban: str, do_dai_toi_da: int = 50) -> str:
    if len(van_ban) <= do_dai_toi_da:
        return van_ban
    return van_ban[: do_dai_toi_da - 3] + "..."


# VI SAO tru 3?
#   Vi "..." chiem 3 ky tu. Yeu cau la ket qua KHONG duoc vuot qua gioi han.
#   Rat nhieu nguoi viet `van_ban[:do_dai_toi_da] + "..."` -> ket qua dai
#   hon gioi han 3 ky tu. Loi nay pha vo giao dien khi hien thi.
#
#   Kiem chung:
#       rut_gon("Xin chao cac ban", 8)
#       -> "Xin c" (5 ky tu) + "..." (3) = "Xin c..." (8 ky tu)  OK
#
# TRUONG HOP BIEN can luu y:
#   Neu do_dai_toi_da < 3 thi sao? van_ban[:-1] hoac van_ban[:0] cho ket qua
#   ky quac. Code that trong san pham nen kiem tra them:
#       if do_dai_toi_da < 3:
#           raise ValueError("do_dai_toi_da phai >= 3")
#   Bai tap nay khong yeu cau, nhung day la kieu suy nghi ban can tap.


# ===========================================================================
def dem_tu(van_ban: str) -> int:
    return len(van_ban.split())


# VI SAO ngan the nay?
#   Vi .split() da lam het viec: tach theo khoang trang, bo phan tu rong.
#       "".split()       -> []        -> 0
#       "   ".split()    -> []        -> 0
#       " a  b ".split() -> ['a','b'] -> 2
#
#   Bai hoc: truoc khi tu viet vong lap, hay tim xem Python da co san chua.
#   Ham dung san hau nhu luon nhanh hon va it bug hon code tu viet.


# ===========================================================================
if __name__ == "__main__":
    assert dinh_dang_tien(1234567) == "1,234,567 VND"
    assert chuan_hoa_ten("  nguyen van nam  ") == "Nguyen Van Nam"
    assert tach_ho_ten("Nguyen Van Nam") == ("Nguyen Van", "Nam")
    assert email_hop_le("a@b.com") is True
    assert email_hop_le("a@b@c.com") is False
    assert rut_gon("Xin chao cac ban", 8) == "Xin c..."
    assert dem_tu("Xin chao cac ban") == 4
    print("Tat ca deu dung.")
