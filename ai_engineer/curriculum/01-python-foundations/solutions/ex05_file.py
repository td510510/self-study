"""LOI GIAI - Bai tap 5, Phase 01."""

from __future__ import annotations

import csv
import json
from collections import Counter
from pathlib import Path


# ===========================================================================
def ghi_danh_sach(duong_dan: Path, cac_dong: list[str]) -> None:
    with open(duong_dan, "w", encoding="utf-8") as f:
        for dong in cac_dong:
            f.write(dong + "\n")


# CACH KHAC (ngan hon):
#     Path(duong_dan).write_text("".join(d + "\n" for d in cac_dong), encoding="utf-8")
#
# VI SAO khong dung f.writelines(cac_dong)?
#   writelines KHONG tu them dau xuong dong. Ket qua se dinh lien:
#   "ab" thay vi "a\nb\n". Ten ham gay hieu nham - mot bay quen thuoc.
#
# CHE DO MO FILE:
#   "r"  doc (mac dinh), loi neu file khong ton tai
#   "w"  ghi, XOA SACH noi dung cu, tao moi neu chua co
#   "a"  ghi them vao cuoi, giu noi dung cu
#   "x"  tao moi, loi neu file DA ton tai (an toan, tranh ghi de nham)
#
#   "w" la che do nguy hiem nhat: no xoa sach file cu ngay khi mo,
#   ke ca khi ban chua ghi gi. Can than khi duong dan bi sai.


# ===========================================================================
def doc_danh_sach(duong_dan: Path) -> list[str]:
    if not Path(duong_dan).exists():
        return []

    with open(duong_dan, encoding="utf-8") as f:
        return [dong.strip() for dong in f if dong.strip()]


# GIAI THICH `for dong in f`:
#   File object la mot iterator theo dong. Cach nay doc TUNG DONG,
#   khong nap ca file vao bo nho. Voi file 10GB van chay duoc.
#   Nguoc lai f.read() nap het vao RAM - de tran bo nho.
#
# `if dong.strip()` lam gi?
#   Chuoi rong la falsy. Dong chi chua khoang trang -> .strip() ra ""
#   -> falsy -> bi loai. Giai quyet ca hai yeu cau bang mot dieu kien.
#
# VI SAO kiem tra exists() thay vi bat FileNotFoundError?
#   Ca hai deu duoc. O day exists() ro rang hon vi day la truong hop
#   ta CHU DONG cho phep. Nhung luu y: giua luc kiem tra va luc mo file,
#   file co the bi xoa (goi la "race condition"). Trong he thong nhieu
#   tien trinh, try/except an toan hon.


# ===========================================================================
def luu_json(duong_dan: Path, du_lieu: dict) -> None:
    with open(duong_dan, "w", encoding="utf-8") as f:
        json.dump(du_lieu, f, ensure_ascii=False, indent=2)


# ensure_ascii=False QUAN TRONG THE NAO?
#   Mac dinh json.dump doi tieng Viet thanh ma escape:
#       {"ten": "Nguyễn Văn Nam"}      <- van doc lai dung, nhung nguoi khong doc noi
#   Voi ensure_ascii=False:
#       {"ten": "Nguyễn Văn Nam"}                <- de doc, de debug
#
# indent=2 de lam gi?
#   Xuong dong va thut le cho de doc. Khong co indent thi tat ca nam tren
#   mot dong dai. Danh doi: file to hon mot chut.
#   File cau hinh -> nen co indent. File du lieu lon -> bo indent cho gon.
#
# json.dump vs json.dumps:
#   dump   -> ghi thang vao file
#   dumps  -> tra ve CHUOI (chu "s" la string)
#   Nhieu nguoi moi nham hai cai nay.


# ===========================================================================
def doc_json(duong_dan: Path, mac_dinh: dict | None = None) -> dict:
    if mac_dinh is None:
        mac_dinh = {}

    try:
        with open(duong_dan, encoding="utf-8") as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return mac_dinh


# VI SAO bat CA HAI loai loi?
#   FileNotFoundError    - chua co file (lan chay dau tien)
#   json.JSONDecodeError - file co nhung noi dung hong
#                          (bi cat giua chung, ai do sua tay sai cu phap)
#   Ca hai deu nen tra ve mac dinh thay vi lam sap chuong trinh.
#
# CU PHAP bat nhieu loai loi: dung tuple trong ngoac
#       except (LoaiA, LoaiB):
#
# VI SAO KHONG viet `except Exception:`?
#   No nuot luon ca loi lap trinh cua chinh ban (go sai ten bien,
#   sai kieu du lieu...). Ban se ngoi hang gio khong hieu vi sao ham
#   luon tra ve dict rong. Chi bat dung thu ban du doan duoc.
#
# LUU Y ve tham so mac dinh:
#   `mac_dinh: dict | None = None` roi gan trong than ham - dung mau
#   an toan da hoc o bai 4.1. Neu viet `mac_dinh: dict = {}` thi dict do
#   dung chung giua moi lan goi.


# ===========================================================================
def ghi_csv(duong_dan: Path, cac_dong: list[dict]) -> None:
    if not cac_dong:
        Path(duong_dan).write_text("", encoding="utf-8")
        return

    ten_cot = list(cac_dong[0].keys())

    with open(duong_dan, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=ten_cot)
        writer.writeheader()
        writer.writerows(cac_dong)


# newline="" QUAN TRONG THE NAO?
#   Tren Windows, ky tu xuong dong mac dinh la "\r\n". Module csv cung tu
#   them "\r\n". Neu khong co newline="", ban duoc "\r\r\n" -> file CSV
#   co mot DONG TRONG xen giua moi dong du lieu.
#   Day la loi kinh dien ma ai lam viec voi CSV tren Windows cung tung gap.
#   QUY TAC: lam viec voi module csv thi LUON dat newline="".
#
# VI SAO khong tu noi chuoi bang dau phay?
#   Vi du lieu that co the chua chinh dau phay:
#       {"ten": "Nguyen, Van A"}
#   Tu noi chuoi -> file hong. Module csv tu dong boc dau nhay cho ban.
#   Con nhieu bay khac: dau xuong dong trong o, dau nhay kep long nhau...
#   ĐỪNG BAO GIO tu viet parser CSV.
#
# VE TIENG VIET VA EXCEL:
#   Excel tren Windows khong tu nhan utf-8. Muon Excel mo dung tieng Viet,
#   dung encoding="utf-8-sig" (them BOM o dau file).
#   Ban se gap lai chi tiet nay o Phase 03 khi xuat bao cao.


# ===========================================================================
def doc_csv(duong_dan: Path) -> list[dict]:
    if not Path(duong_dan).exists():
        return []

    with open(duong_dan, encoding="utf-8", newline="") as f:
        return list(csv.DictReader(f))


# csv.DictReader tu lay dong dau lam ten cot va tra ve tung dong duoi
# dang dict. Rat tien so voi csv.reader (tra ve list, phai nho thu tu cot).
#
# LUU Y QUAN TRONG: moi gia tri deu la CHUOI.
#       {"diem": "8"}   chu khong phai   {"diem": 8}
#   Muon tinh toan phai tu ep kieu: int(dong["diem"]).
#   Day chinh la mot ly do pandas ton tai - no tu doan kieu du lieu cho ban.


# ===========================================================================
def dem_tu_trong_file(duong_dan: Path, top: int = 3) -> list[tuple[str, int]]:
    if not Path(duong_dan).exists():
        return []

    noi_dung = Path(duong_dan).read_text(encoding="utf-8").lower()

    cac_tu = []
    for tu in noi_dung.split():
        tu = tu.strip(".,!?;:\"'()")
        if tu:
            cac_tu.append(tu)

    dem = Counter(cac_tu)

    # Sap: so lan giam dan (-so_lan), roi bang chu cai tang dan
    return sorted(dem.items(), key=lambda cap: (-cap[1], cap[0]))[:top]


# MEO SAP XEP HAI TIEU CHI:
#   key tra ve mot TUPLE. Python so sanh tuple theo thu tu tung phan tu:
#   so sanh phan tu dau truoc, bang nhau moi xet phan tu sau.
#
#       key=lambda cap: (-cap[1], cap[0])
#                        ^^^^^^^  ^^^^^^
#                        so lan   ten tu
#                        giam dan tang dan
#
#   Dau tru bien "tang dan" thanh "giam dan" - meo chi dung duoc voi SO.
#   Voi chuoi phai dung reverse=True (nhung reverse ap dung cho CA tuple,
#   nen khi tron hai chieu sap xep khac nhau thi dung dau tru nhu tren).
#
# .strip(".,!?") lam gi?
#   Bo MOI ky tu nam trong chuoi do, o CA HAI DAU, cho den khi gap ky tu khac.
#       "ca.".strip(".,!?")   -> "ca"
#       "!!hay!!".strip("!")  -> "hay"
#   Luu y: no khong bo ky tu o GIUA tu. "a.b".strip(".") van la "a.b".
#
# Counter la gi?
#   Mot dict chuyen de dem, nam trong thu vien chuan collections.
#       Counter(["a","b","a"])  ->  Counter({"a": 2, "b": 1})
#       .most_common(3)         ->  3 phan tu nhieu nhat
#
#   O day khong dung .most_common() vi no khong dam bao thu tu on dinh
#   khi cac phan tu co so lan BANG NHAU. Bai tap yeu cau sap theo bang
#   chu cai trong truong hop do, nen phai tu sorted().


# ===========================================================================
if __name__ == "__main__":
    import tempfile

    with tempfile.TemporaryDirectory() as tmp:
        d = Path(tmp)

        ghi_danh_sach(d / "a.txt", ["dong 1", "dong 2"])
        assert doc_danh_sach(d / "a.txt") == ["dong 1", "dong 2"]
        assert doc_danh_sach(d / "khong_co.txt") == []

        luu_json(d / "a.json", {"ten": "Nguyễn Văn Nam"})
        assert doc_json(d / "a.json") == {"ten": "Nguyễn Văn Nam"}
        assert doc_json(d / "khong_co.json") == {}

        ghi_csv(d / "a.csv", [{"ten": "An", "diem": 8}])
        assert doc_csv(d / "a.csv") == [{"ten": "An", "diem": "8"}]

        (d / "van.txt").write_text("Meo an ca. Meo ngu. Ca ngon!", encoding="utf-8")
        assert dem_tu_trong_file(d / "van.txt", 3) == [("ca", 2), ("meo", 2), ("an", 1)]

    print("Tat ca deu dung.")
