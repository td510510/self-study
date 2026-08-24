"""LOI GIAI - Bai tap 4, Phase 01."""

from __future__ import annotations

from collections.abc import Callable


# ===========================================================================
def them_vao_gio(san_pham: str, gio_hang: list[str] | None = None) -> list[str]:
    if gio_hang is None:
        gio_hang = []
    gio_hang.append(san_pham)
    return gio_hang


# VI SAO PHAI LAM VAY - giai thich ky vi day la cau hoi phong van kinh dien:
#
#   Gia tri mac dinh cua tham so duoc tao MOT LAN DUY NHAT, luc Python doc
#   dinh nghia ham - KHONG PHAI moi lan goi ham.
#
#   def sai(sp, gio=[]):     <- list [] nay duoc tao 1 lan, ton tai mai mai
#       gio.append(sp)
#       return gio
#
#   sai("tao")   -> ["tao"]
#   sai("cam")   -> ["tao", "cam"]     <- van la CHINH list cu!
#
#   Kiem chung: `print(sai.__defaults__)` se thay list do va thay no lon dan.
#
#   Voi None thi khac: None la bat bien, va moi lan goi ta TAO LIST MOI
#   ben trong than ham.
#
# QUY TAC: gia tri mac dinh chi duoc phep la thu BAT BIEN
#          (int, float, str, bool, None, tuple).


# ===========================================================================
def ap_dung_cho_tat_ca(cac_so: list[float], ham: Callable[[float], float]) -> list[float]:
    return [ham(x) for x in cac_so]


# Callable[[float], float] doc la:
#   "mot thu goi duoc, nhan mot float, tra ve mot float"
#
# VI SAO Y NAY QUAN TRONG?
#   Trong Python, ham la "cong dan hang nhat": gan vao bien duoc,
#   truyen lam tham so duoc, tra ve tu ham khac duoc.
#
#       f = len          # gan ham vao bien
#       f("abc")         # 3
#
#   Ban se gap lai y nay o khap noi:
#       df["gia"].apply(lam_tron)        # pandas
#       sorted(ds, key=lay_diem)         # sap xep tuy bien
#       @decorator                       # decorator chinh la ham nhan ham
#
# LUU Y: Python da co san `map`:
#       list(map(ham, cac_so))
#   Tuong duong, nhung comprehension thuong de doc hon voi nguoi Viet code.


# ===========================================================================
def thong_ke(cac_so: list[float]) -> tuple[float, float, float]:
    if not cac_so:
        return (0.0, 0.0, 0.0)
    return (min(cac_so), max(cac_so), sum(cac_so) / len(cac_so))


# VI SAO xu ly list rong ngay dau ham?
#   min([]) va max([]) deu nem ValueError, sum([])/len([]) nem ZeroDivisionError.
#   Kieu viet "kiem tra truong hop dac biet roi return som" goi la
#   GUARD CLAUSE - giup than ham chinh khong bi long nhieu tang if.
#
# VE VIEC TRA VE NHIEU GIA TRI:
#   Python tra ve tuple. Nguoi goi giai nen duoc:
#       nho, lon, tb = thong_ke([1, 2, 3])
#
#   Neu ham tra ve qua 3 gia tri, hay cannhac dung dataclass hoac
#   NamedTuple de nguoi doc biet tung gia tri la gi:
#       from typing import NamedTuple
#       class ThongKe(NamedTuple):
#           nho_nhat: float
#           lon_nhat: float
#           trung_binh: float
#   Luc do goi duoc `kq.trung_binh` thay vi `kq[2]` - ro rang hon nhieu.


# ===========================================================================
def tao_cau_thong_bao(ten: str, *cac_muc: str, tieu_de: str = "Thong bao") -> str:
    dong_dau = f"{tieu_de} cho {ten}:"
    if not cac_muc:
        return dong_dau
    cac_dong = [f"- {muc}" for muc in cac_muc]
    return dong_dau + "\n" + "\n".join(cac_dong)


# *cac_muc la gi?
#   Thu gom MOI doi so vi tri con lai vao mot tuple.
#       tao_cau_thong_bao("An", "X", "Y")  ->  ten="An", cac_muc=("X", "Y")
#
# tieu_de dat SAU dau * nghia la gi?
#   No tro thanh tham so CHI TRUYEN BANG TEN (keyword-only).
#       tao_cau_thong_bao("An", "X", tieu_de="Nhac")   OK
#       tao_cau_thong_bao("An", "X", "Nhac")           -> "Nhac" thanh mot muc!
#
#   Day la ky thuat thiet ke API tot: cac tuy chon bat buoc phai goi bang ten
#   se lam code cho goi de doc hon nhieu:
#       ham(du_lieu, verbose=True)   ro rang hon   ham(du_lieu, True)
#
# VI SAO xu ly rieng truong hop khong co muc?
#   Neu khong, ket qua se co mot dau xuong dong thua o cuoi.
#   Chi tiet nho nhung day chinh la loai loi ma test bat duoc.


# ===========================================================================
def tinh_lai_kep(von: float, lai_suat: float, so_nam: int) -> float:
    if von <= 0:
        raise ValueError(f"Von phai lon hon 0, nhan duoc: {von}")
    if lai_suat < 0:
        raise ValueError(f"Lai suat khong duoc am, nhan duoc: {lai_suat}")
    if so_nam < 0:
        raise ValueError(f"So nam khong duoc am, nhan duoc: {so_nam}")

    return von * (1 + lai_suat) ** so_nam


# VI SAO KIEM TRA DAU VAO?
#   Nguyen tac "fail fast": phat hien sai SOM va bao RO,
#   thay vi tra ve mot con so vo nghia roi bug lan xuong tan cuoi he thong.
#
#   Khong kiem tra: tinh_lai_kep(-1000, 0.1, 5) -> -1610.51
#   Nguoi dung thay so am, khong hieu tu dau ra, mat ca buoi do tim.
#
# THONG BAO LOI TOT phai tra loi duoc 2 cau hoi:
#   1. Cai gi sai?          -> "Von phai lon hon 0"
#   2. Gia tri nao gay ra?  -> "nhan duoc: -1000"
#
#   So sanh:
#       raise ValueError("Loi")                    <- vo dung
#       raise ValueError("Von khong hop le")       <- kha hon
#       raise ValueError(f"Von phai > 0, nhan: {von}")  <- tot
#
# CHON LOAI LOI NAO?
#   ValueError  - dung kieu nhung sai gia tri  (von = -1000)
#   TypeError   - sai kieu du lieu             (von = "nhieu")
#   KeyError    - khong co khoa trong dict
#   Dung dung loai giup nguoi goi bat loi chinh xac.


# ===========================================================================
def tang_gia(san_pham: list[dict], phan_tram: float) -> list[dict]:
    return [{**sp, "gia": round(sp["gia"] * (1 + phan_tram / 100))} for sp in san_pham]


# HAM THUAN KHIET (pure function) la ham:
#   1. Cung dau vao -> luon cung dau ra
#   2. KHONG sua doi gi ben ngoai (khong side effect)
#
# VI SAO nen uu tien ham thuan khiet?
#   - De test: goi, so sanh ket qua, xong
#   - De suy luan: doc ham la hieu, khong phai lan theo xem no sua gi o dau
#   - An toan khi chay song song
#
# CACH SAI (sua du lieu goc):
#     for sp in san_pham:
#         sp["gia"] = round(sp["gia"] * ...)     # <- sua dict goc!
#     return san_pham
#
#   Nguoi goi se ngac nhien khi thay du lieu ban dau cua ho bi doi.
#   Day la nguon bug cuc kho tim trong du an lon.
#
# {**sp, "gia": ...} lam gi?
#   Tao dict MOI: sao chep moi khoa cua sp, roi ghi de khoa "gia".
#   Ngan gon va ro y "khong dung vao ban goc".
#
# LUU Y: day van la copy NONG. Neu sp co khoa chua list (vi du "tags"),
# list do van dung chung giua ban goc va ban moi. Voi bai nay khong sao
# vi ta chi doi "gia" (mot so, bat bien).


# ===========================================================================
if __name__ == "__main__":
    assert them_vao_gio("tao") == ["tao"]
    assert them_vao_gio("cam") == ["cam"]
    assert ap_dung_cho_tat_ca([1, 2, 3], lambda x: x * 2) == [2, 4, 6]
    assert thong_ke([1, 2, 3]) == (1, 3, 2.0)
    assert thong_ke([]) == (0.0, 0.0, 0.0)
    assert tao_cau_thong_bao("An", "X", "Y") == "Thong bao cho An:\n- X\n- Y"
    assert tao_cau_thong_bao("An") == "Thong bao cho An:"
    assert abs(tinh_lai_kep(1000, 0.1, 2) - 1210) < 1e-6

    goc = [{"ten": "A", "gia": 100}]
    assert tang_gia(goc, 10) == [{"ten": "A", "gia": 110}]
    assert goc == [{"ten": "A", "gia": 100}], "Ham da sua du lieu goc!"
    print("Tat ca deu dung.")
