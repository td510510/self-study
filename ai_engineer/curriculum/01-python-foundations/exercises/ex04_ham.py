"""BAI TAP 4 - Ham (Tuan 3).

Cham diem:  pytest tests/phase01/test_ex04.py -v
Loi giai:   curriculum/01-python-foundations/solutions/ex04_ham.py
"""

from __future__ import annotations

from collections.abc import Callable


# ===========================================================================
#  4.1 - Tham so mac dinh AN TOAN
# ===========================================================================
def them_vao_gio(san_pham: str, gio_hang: list[str] | None = None) -> list[str]:
    """Them san pham vao gio hang va tra ve gio hang.

    Neu khong truyen gio_hang thi tao gio moi (RONG).

    Vi du:
        them_vao_gio("tao")                 ->  ["tao"]
        them_vao_gio("cam")                 ->  ["cam"]      <- gio MOI, khong phai ["tao","cam"]
        them_vao_gio("cam", ["tao"])        ->  ["tao", "cam"]

    DAY LA BAY KINH DIEN. Neu ban viet `gio_hang: list = []` thi lan goi
    thu hai se tra ve ["tao", "cam"] - list mac dinh bi DUNG CHUNG.
    """
    # TODO
    pass


# ===========================================================================
#  4.2 - Ham nhan ham khac lam tham so
# ===========================================================================
def ap_dung_cho_tat_ca(cac_so: list[float], ham: Callable[[float], float]) -> list[float]:
    """Ap dung `ham` cho tung phan tu, tra ve list ket qua.

    Vi du:
        ap_dung_cho_tat_ca([1, 2, 3], lambda x: x * 2)   ->  [2, 4, 6]
        ap_dung_cho_tat_ca([1, 4, 9], lambda x: x ** 0.5) ->  [1.0, 2.0, 3.0]
        ap_dung_cho_tat_ca([], abs)                       ->  []

    Trong Python, HAM CUNG LA GIA TRI - truyen di duoc nhu so hay chuoi.
    Ban se dung y nay rat nhieu voi pandas (.apply) va PyTorch.
    """
    # TODO
    pass


# ===========================================================================
#  4.3 - Tra ve nhieu gia tri
# ===========================================================================
def thong_ke(cac_so: list[float]) -> tuple[float, float, float]:
    """Tra ve (nho_nhat, lon_nhat, trung_binh).

    Neu list rong thi tra ve (0.0, 0.0, 0.0).

    Vi du:
        thong_ke([1, 2, 3])   ->  (1, 3, 2.0)
        thong_ke([5])         ->  (5, 5, 5.0)
        thong_ke([])          ->  (0.0, 0.0, 0.0)
    """
    # TODO
    pass


# ===========================================================================
#  4.4 - Tham so linh hoat
# ===========================================================================
def tao_cau_thong_bao(ten: str, *cac_muc: str, tieu_de: str = "Thong bao") -> str:
    """Tao mot thong bao nhieu dong.

    Dinh dang chinh xac:
        "<tieu_de> cho <ten>:\\n- muc 1\\n- muc 2"

    Vi du:
        tao_cau_thong_bao("An", "Hoc bai", "Nop bai")
        ->  "Thong bao cho An:\\n- Hoc bai\\n- Nop bai"

        tao_cau_thong_bao("An", "Hoc bai", tieu_de="Nhac nho")
        ->  "Nhac nho cho An:\\n- Hoc bai"

        tao_cau_thong_bao("An")
        ->  "Thong bao cho An:"        (khong co muc nao thi khong co dong nao them)

    Goi y: dung "\\n".join(...) va nho xu ly truong hop khong co muc nao.
    """
    # TODO
    pass


# ===========================================================================
#  4.5 - Kiem tra dau vao va nem loi ro rang
# ===========================================================================
def tinh_lai_kep(von: float, lai_suat: float, so_nam: int) -> float:
    """Tinh so tien sau khi gui tiet kiem lai kep.

    Cong thuc:  von * (1 + lai_suat) ** so_nam

    lai_suat la so thap phan (0.07 nghia la 7%/nam).

    PHAI kiem tra dau vao va nem ValueError voi thong bao ro rang neu:
        - von <= 0
        - lai_suat < 0
        - so_nam < 0

    Vi du:
        tinh_lai_kep(1000, 0.1, 2)   ->  1210.0000000000002
        tinh_lai_kep(1000, 0, 5)     ->  1000.0
        tinh_lai_kep(-5, 0.1, 1)     ->  nem ValueError
    """
    # TODO
    pass


# ===========================================================================
#  4.6 - Ham thuan khiet (pure function)
# ===========================================================================
def tang_gia(san_pham: list[dict], phan_tram: float) -> list[dict]:
    """Tang gia moi san pham theo phan tram, tra ve LIST MOI.

    KHONG duoc sua list goc hay cac dict ben trong no.

    Moi san pham la dict co khoa "ten" va "gia".
    Gia moi lam tron ve so nguyen bang round().

    Vi du:
        goc = [{"ten": "A", "gia": 100}]
        tang_gia(goc, 10)   ->  [{"ten": "A", "gia": 110}]
        goc van la          ->  [{"ten": "A", "gia": 100}]

    Goi y: tao dict moi cho tung san pham, dung {**sp, "gia": gia_moi}
    """
    # TODO
    pass


# ===========================================================================
if __name__ == "__main__":
    print("Ket qua cua ban:\n")
    print(f"  them_vao_gio('tao')          = {them_vao_gio('tao')!r}")
    print(f"  them_vao_gio('cam')          = {them_vao_gio('cam')!r}  <- phai la ['cam']")
    print(f"  ap_dung_cho_tat_ca([1,2], lambda x: x*2) = {ap_dung_cho_tat_ca([1, 2], lambda x: x * 2)!r}")
    print(f"  thong_ke([1,2,3])            = {thong_ke([1, 2, 3])!r}")
    print(f"  tao_cau_thong_bao('An','X')  = {tao_cau_thong_bao('An', 'X')!r}")
