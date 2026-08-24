"""BAI TAP 3 - List, dict, set, tuple (Tuan 3).

Cham diem:  pytest tests/phase01/test_ex03.py -v
Loi giai:   curriculum/01-python-foundations/solutions/ex03_collections.py
"""

from __future__ import annotations


# ===========================================================================
#  3.1 - Loai trung nhung GIU NGUYEN THU TU
# ===========================================================================
def loai_trung(cac_phan_tu: list) -> list:
    """Loai bo phan tu trung lap, giu thu tu xuat hien lan dau.

    Vi du:
        loai_trung([3, 1, 3, 2, 1])       ->  [3, 1, 2]
        loai_trung(["a", "b", "a"])       ->  ["a", "b"]
        loai_trung([])                    ->  []

    LUU Y: list(set(x)) KHONG dung vi set khong giu thu tu.
    Goi y: duyet qua list, dung mot set de nho da gap gi.
    """
    # TODO
    pass


# ===========================================================================
#  3.2 - Gop hai dict
# ===========================================================================
def gop_dict(d1: dict, d2: dict) -> dict:
    """Gop hai dict. Neu trung khoa, gia tri cua d2 thang.

    KHONG duoc sua d1 hay d2.

    Vi du:
        gop_dict({"a": 1}, {"b": 2})           ->  {"a": 1, "b": 2}
        gop_dict({"a": 1}, {"a": 9, "b": 2})   ->  {"a": 9, "b": 2}
        gop_dict({}, {})                       ->  {}
    """
    # TODO
    pass


# ===========================================================================
#  3.3 - Nhom theo tieu chi
# ===========================================================================
def nhom_theo_thanh_pho(khach_hang: list[dict]) -> dict[str, list[str]]:
    """Nhom ten khach hang theo thanh pho.

    Dau vao: list cac dict, moi dict co khoa "ten" va "thanh_pho".
    Dau ra: dict {ten_thanh_pho: [danh sach ten khach]}

    Vi du:
        nhom_theo_thanh_pho([
            {"ten": "An",  "thanh_pho": "HN"},
            {"ten": "Binh","thanh_pho": "HCM"},
            {"ten": "Cuong","thanh_pho": "HN"},
        ])
        ->  {"HN": ["An", "Cuong"], "HCM": ["Binh"]}

    Goi y: dung dict.setdefault(khoa, []).append(gia_tri)
    """
    # TODO
    pass


# ===========================================================================
#  3.4 - Top N theo gia tri
# ===========================================================================
def top_n(diem: dict[str, float], n: int = 3) -> list[tuple[str, float]]:
    """Tra ve n cap (ten, diem) co diem cao nhat, sap giam dan.

    Vi du:
        top_n({"An": 8, "Binh": 9.5, "Cuong": 7}, 2)
        ->  [("Binh", 9.5), ("An", 8)]

        top_n({"An": 8}, 5)   ->  [("An", 8)]     (it hon n thi tra ve het)
        top_n({}, 3)          ->  []

    Goi y: sorted(d.items(), key=..., reverse=True)[:n]
           Ham `key` nhan mot cap (ten, diem) va tra ve thu de so sanh.
    """
    # TODO
    pass


# ===========================================================================
#  3.5 - Phan chung va phan rieng
# ===========================================================================
def so_sanh_hai_danh_sach(a: list, b: list) -> dict[str, list]:
    """So sanh hai list, tra ve dict co 3 khoa:

        "chung"    : phan tu co o CA HAI          (sap xep tang dan)
        "chi_a"    : phan tu chi co o a           (sap xep tang dan)
        "chi_b"    : phan tu chi co o b           (sap xep tang dan)

    Vi du:
        so_sanh_hai_danh_sach([1, 2, 3], [2, 3, 4])
        ->  {"chung": [2, 3], "chi_a": [1], "chi_b": [4]}

    Goi y: doi sang set roi dung phep &, -
    """
    # TODO
    pass


# ===========================================================================
#  3.6 - Lam phang list long nhau
# ===========================================================================
def lam_phang(danh_sach_long: list[list]) -> list:
    """Gop list cua cac list thanh mot list duy nhat.

    Chi can xu ly MOT tang long nhau.

    Vi du:
        lam_phang([[1, 2], [3], [4, 5]])  ->  [1, 2, 3, 4, 5]
        lam_phang([[], [1]])              ->  [1]
        lam_phang([])                     ->  []

    Goi y: list comprehension long hai vong for, hoac vong lap thuong.
    """
    # TODO
    pass


# ===========================================================================
if __name__ == "__main__":
    print("Ket qua cua ban:\n")
    print(f"  loai_trung([3,1,3,2,1]) = {loai_trung([3, 1, 3, 2, 1])!r}")
    print(f"  gop_dict({{'a':1}}, {{'a':9}}) = {gop_dict({'a': 1}, {'a': 9})!r}")
    print(f"  top_n({{'A':8,'B':9}}, 1)    = {top_n({'A': 8, 'B': 9}, 1)!r}")
    print(f"  lam_phang([[1,2],[3]])     = {lam_phang([[1, 2], [3]])!r}")
