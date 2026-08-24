"""LOI GIAI - Bai tap 3, Phase 01."""

from __future__ import annotations


# ===========================================================================
def loai_trung(cac_phan_tu: list) -> list:
    da_gap = set()
    ket_qua = []

    for phan_tu in cac_phan_tu:
        if phan_tu not in da_gap:
            da_gap.add(phan_tu)
            ket_qua.append(phan_tu)

    return ket_qua


# VI SAO can CA set lan list?
#   - set `da_gap` de kiem tra "da gap chua" trong thoi gian O(1)
#   - list `ket_qua` de GIU THU TU
#   Moi cau truc lam mot viec no gioi nhat. Day la mot mau rat pho bien.
#
# VI SAO khong dung `if phan_tu not in ket_qua`?
#   Van dung, nhung kiem tra `in` tren list la O(n) -> tong cong O(n^2).
#   Voi 100.000 phan tu, cach set nhanh hon hang nghin lan.
#
# MEO NGAN GON (Python 3.7+):
#   dict giu nguyen thu tu chen vao, nen:
#       return list(dict.fromkeys(cac_phan_tu))
#   Mot dong, dung, va nhanh. Nhung hoi "ao thuat" - can biet meo nay.


# ===========================================================================
def gop_dict(d1: dict, d2: dict) -> dict:
    return {**d1, **d2}


# VI SAO {**d1, **d2}?
#   Dau ** "trai" dict ra thanh cac cap khoa-gia tri.
#   Dat d2 sau nen khi trung khoa, d2 ghi de d1 - dung yeu cau.
#
# CACH KHAC (Python 3.9+):
#     return d1 | d2
#
# CACH SAI - sua doi d1:
#     d1.update(d2)      # <- SUA d1! Nguoi goi khong ngo den
#     return d1
#
#   Neu that su muon dung update thi phai copy truoc:
#     ket_qua = d1.copy()
#     ket_qua.update(d2)
#     return ket_qua
#
# LUU Y: .copy() la copy NONG (shallow). Neu gia tri ben trong la list/dict
# thi chung van dung chung. Can doc lap hoan toan thi dung copy.deepcopy().


# ===========================================================================
def nhom_theo_thanh_pho(khach_hang: list[dict]) -> dict[str, list[str]]:
    ket_qua: dict[str, list[str]] = {}

    for kh in khach_hang:
        thanh_pho = kh["thanh_pho"]
        ket_qua.setdefault(thanh_pho, []).append(kh["ten"])

    return ket_qua


# .setdefault(khoa, mac_dinh) lam gi?
#   - Neu khoa da co: tra ve gia tri hien tai
#   - Neu chua co: dat gia tri = mac_dinh roi tra ve no
#   Nho vay .append() luon co list de them vao.
#
#   Tuong duong voi:
#       if thanh_pho not in ket_qua:
#           ket_qua[thanh_pho] = []
#       ket_qua[thanh_pho].append(kh["ten"])
#
# CACH CHUYEN NGHIEP HON:
#     from collections import defaultdict
#     ket_qua = defaultdict(list)
#     for kh in khach_hang:
#         ket_qua[kh["thanh_pho"]].append(kh["ten"])
#     return dict(ket_qua)
#
#   defaultdict tu tao list rong khi gap khoa moi. Rat tien khi nhom du lieu.
#   (Nho `dict(...)` o cuoi neu ham phai tra ve dict thuong.)
#
# LIEN HE VE SAU: day chinh la y tuong cua df.groupby() trong pandas
# ma ban se hoc o Tuan 7. Hieu no bang tay truoc thi dung thu vien de hon.


# ===========================================================================
def top_n(diem: dict[str, float], n: int = 3) -> list[tuple[str, float]]:
    return sorted(diem.items(), key=lambda cap: cap[1], reverse=True)[:n]


# GIAI THICH TUNG PHAN:
#   diem.items()            -> [("An", 8), ("Binh", 9.5), ...]
#   key=lambda cap: cap[1]  -> sap xep theo phan tu thu 2 cua cap (diem)
#   reverse=True            -> giam dan
#   [:n]                    -> lay n cai dau; neu it hon n thi lay het,
#                              Python KHONG bao loi khi cat lat vuot gioi han
#
# `lambda` la gi?
#   Ham nho khong ten, viet gon tren mot dong.
#       lambda cap: cap[1]
#   tuong duong:
#       def lay_diem(cap):
#           return cap[1]
#   Dung lambda khi ham chi phuc vu mot cho, don gian. Neu logic dai
#   hon mot dong, hay viet ham co ten - de doc va de test hon.
#
# CACH KHAC - dung operator.itemgetter (nhanh hon chut):
#     from operator import itemgetter
#     return sorted(diem.items(), key=itemgetter(1), reverse=True)[:n]


# ===========================================================================
def so_sanh_hai_danh_sach(a: list, b: list) -> dict[str, list]:
    sa, sb = set(a), set(b)
    return {
        "chung": sorted(sa & sb),
        "chi_a": sorted(sa - sb),
        "chi_b": sorted(sb - sa),
    }


# PHEP TOAN TREN SET:
#   sa & sb   giao   - co o ca hai
#   sa | sb   hop    - co o it nhat mot ben
#   sa - sb   hieu   - co o sa, khong co o sb
#   sa ^ sb   hieu doi xung - chi co o mot ben (bang (sa|sb) - (sa&sb))
#
# VI SAO phai sorted()?
#   Set KHONG co thu tu. Neu tra ve list(sa & sb), thu tu co the khac nhau
#   giua cac lan chay -> test luc pass luc fail, rat kho debug.
#   Nguyen tac: ham nen cho ket qua ON DINH, lap lai duoc.
#
# UNG DUNG THUC TE: so sanh danh sach email truoc/sau chien dich,
# tim khach hang moi va khach hang da roi bo - chinh la bai toan nay.


# ===========================================================================
def lam_phang(danh_sach_long: list[list]) -> list:
    return [phan_tu for danh_sach_con in danh_sach_long for phan_tu in danh_sach_con]


# DOC COMPREHENSION LONG NHAU THE NAO?
#   Doc theo dung thu tu vong for, y het khi viet vong lap thuong:
#
#       ket_qua = []
#       for danh_sach_con in danh_sach_long:      <- for thu nhat
#           for phan_tu in danh_sach_con:         <- for thu hai
#               ket_qua.append(phan_tu)           <- bieu thuc dau tien
#
#   Trong comprehension, BIEU THUC dung truoc nhung cac vong for
#   van theo thu tu tu ngoai vao trong.
#
# LUU Y: chi nen long TOI DA 2 tang. Nhieu hon thi viet vong lap thuong.
#
# CACH KHAC:
#     from itertools import chain
#     return list(chain.from_iterable(danh_sach_long))
#
#   Nhanh hon voi du lieu lon va y do rat ro rang.
#   itertools la thu vien dang doc qua mot luot - rat nhieu cong cu hay.


# ===========================================================================
if __name__ == "__main__":
    assert loai_trung([3, 1, 3, 2, 1]) == [3, 1, 2]
    assert gop_dict({"a": 1}, {"a": 9, "b": 2}) == {"a": 9, "b": 2}
    assert nhom_theo_thanh_pho(
        [
            {"ten": "An", "thanh_pho": "HN"},
            {"ten": "Binh", "thanh_pho": "HCM"},
            {"ten": "Cuong", "thanh_pho": "HN"},
        ]
    ) == {"HN": ["An", "Cuong"], "HCM": ["Binh"]}
    assert top_n({"An": 8, "Binh": 9.5, "Cuong": 7}, 2) == [("Binh", 9.5), ("An", 8)]
    assert so_sanh_hai_danh_sach([1, 2, 3], [2, 3, 4]) == {
        "chung": [2, 3],
        "chi_a": [1],
        "chi_b": [4],
    }
    assert lam_phang([[1, 2], [3], [4, 5]]) == [1, 2, 3, 4, 5]
    print("Tat ca deu dung.")
