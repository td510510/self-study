"""BAI TAP 5 - Doc/ghi file (Tuan 3).

Cham diem:  pytest tests/phase01/test_ex05.py -v
Loi giai:   curriculum/01-python-foundations/solutions/ex05_file.py

LUU Y: moi ham deu nhan `duong_dan` kieu Path. Test se tu tao thu muc tam,
ban khong lam hong du lieu that duoc.

NHO: luon dung `with open(...)` va `encoding="utf-8"`.
"""

from __future__ import annotations

import csv
import json
from pathlib import Path


# ===========================================================================
#  5.1 - Ghi va doc file van ban
# ===========================================================================
def ghi_danh_sach(duong_dan: Path, cac_dong: list[str]) -> None:
    """Ghi moi phan tu thanh mot dong trong file.

    File ket qua co dau xuong dong o CUOI moi dong, ke ca dong cuoi.

    Vi du: ghi_danh_sach(p, ["a", "b"]) tao file noi dung:
        a
        b
    (tuc la chuoi "a\\nb\\n")

    Neu list rong thi tao file rong.
    """
    # TODO
    pass


def doc_danh_sach(duong_dan: Path) -> list[str]:
    """Doc file, tra ve list cac dong da bo ky tu xuong dong.

    Bo qua cac dong TRONG (chi co khoang trang cung tinh la trong).

    Vi du: file chua "a\\n\\nb\\n"  ->  ["a", "b"]

    Neu file khong ton tai thi tra ve list rong (KHONG duoc nem loi).
    """
    # TODO
    pass


# ===========================================================================
#  5.2 - JSON
# ===========================================================================
def luu_json(duong_dan: Path, du_lieu: dict) -> None:
    """Luu dict ra file JSON.

    Yeu cau:
        - Tieng Viet phai giu nguyen chu (khong bi thanh \\u1ea1...)
        - Thut le 2 dau cach cho de doc

    Goi y: json.dump(..., ensure_ascii=False, indent=2)
    """
    # TODO
    pass


def doc_json(duong_dan: Path, mac_dinh: dict | None = None) -> dict:
    """Doc file JSON.

    Neu file khong ton tai HOAC file hong (khong phai JSON hop le)
    thi tra ve `mac_dinh`. Neu mac_dinh la None thi tra ve dict rong.

    Day la mau rat hay dung khi doc file cau hinh.

    Goi y: bat FileNotFoundError va json.JSONDecodeError.
    """
    # TODO
    pass


# ===========================================================================
#  5.3 - CSV
# ===========================================================================
def ghi_csv(duong_dan: Path, cac_dong: list[dict]) -> None:
    """Ghi list dict ra file CSV, dong dau tien la ten cot.

    Ten cot lay tu khoa cua dict DAU TIEN.
    Neu list rong thi tao file rong.

    Vi du:
        ghi_csv(p, [{"ten": "An", "diem": 8}, {"ten": "Binh", "diem": 9}])
    tao file:
        ten,diem
        An,8
        Binh,9

    Goi y: csv.DictWriter. Nho tham so newline="" khi mo file
           (neu khong, tren Windows se co dong trong xen giua).
    """
    # TODO
    pass


def doc_csv(duong_dan: Path) -> list[dict]:
    """Doc file CSV thanh list dict.

    Moi gia tri deu la CHUOI (csv khong biet kieu du lieu).
    File khong ton tai -> tra ve list rong.

    Vi du: file tren  ->  [{"ten": "An", "diem": "8"}, {"ten": "Binh", "diem": "9"}]
    """
    # TODO
    pass


# ===========================================================================
#  5.4 - Dem tu trong file
# ===========================================================================
def dem_tu_trong_file(duong_dan: Path, top: int = 3) -> list[tuple[str, int]]:
    """Dem tu xuat hien nhieu nhat trong file van ban.

    Quy tac:
        - Khong phan biet hoa/thuong
        - Bo dau cham, phay, cham than, hoi cham o dau/cuoi tu
        - Sap giam dan theo so lan; neu bang nhau thi sap theo bang chu cai
        - Tra ve toi da `top` phan tu
        - File khong ton tai -> list rong

    Vi du: file chua "Meo an ca. Meo ngu. Ca ngon!"
        ->  [("ca", 2), ("meo", 2), ("an", 1)]

    Goi y: .strip(".,!?") de bo dau cau.
           Sap xep hai tieu chi: key=lambda x: (-x[1], x[0])
    """
    # TODO
    pass


# ===========================================================================
if __name__ == "__main__":
    thu_muc = Path("_thu_nghiem")
    thu_muc.mkdir(exist_ok=True)

    ghi_danh_sach(thu_muc / "test.txt", ["dong 1", "dong 2"])
    print(f"  doc_danh_sach = {doc_danh_sach(thu_muc / 'test.txt')!r}")

    luu_json(thu_muc / "test.json", {"ten": "Nguyễn Văn Nam"})
    print(f"  doc_json      = {doc_json(thu_muc / 'test.json')!r}")
    print(f"  doc_json (thieu file) = {doc_json(thu_muc / 'khong_co.json')!r}")

    print("\nXem ket qua trong thu muc _thu_nghiem/")
