"""BAI TAP 6 - Class va xu ly loi (Tuan 4).

Cham diem:  pytest tests/phase01/test_ex06.py -v
Loi giai:   curriculum/01-python-foundations/solutions/ex06_oop.py
"""

from __future__ import annotations

from dataclasses import dataclass, field


# ===========================================================================
#  6.1 - Loai loi rieng
# ===========================================================================
class LoiSoDuKhongDu(Exception):
    """Nem ra khi rut tien nhieu hon so du."""

    # TODO: khong can viet gi them, chi can `pass` de day la mot Exception hop le.
    # (Da co docstring nen ky thuat ma noi la du roi - nhung hay hieu vi sao:
    #  than class khong duoc de trong, docstring tinh la mot cau lenh.)
    pass


# ===========================================================================
#  6.2 - Class TaiKhoan
# ===========================================================================
class TaiKhoan:
    """Tai khoan ngan hang don gian.

    Cach dung:
        tk = TaiKhoan("An", 1000)
        tk.nap(500)             ->  so_du = 1500
        tk.rut(200)             ->  so_du = 1300
        tk.rut(99999)           ->  nem LoiSoDuKhongDu
        tk.lich_su              ->  [("nap", 500), ("rut", 200)]
        str(tk)                 ->  "TaiKhoan(An, so du 1,300 VND)"
    """

    def __init__(self, chu_tai_khoan: str, so_du_ban_dau: float = 0):
        """Khoi tao tai khoan.

        Yeu cau:
            - Luu chu_tai_khoan vao self.chu_tai_khoan
            - Luu so_du_ban_dau vao self.so_du
            - Tao self.lich_su la list RONG
            - Neu so_du_ban_dau < 0 thi nem ValueError
        """
        # TODO
        pass

    def nap(self, so_tien: float) -> None:
        """Nap tien vao tai khoan.

        Yeu cau:
            - so_tien <= 0  ->  nem ValueError
            - Cong vao so_du
            - Them ("nap", so_tien) vao lich_su
        """
        # TODO
        pass

    def rut(self, so_tien: float) -> None:
        """Rut tien khoi tai khoan.

        Yeu cau:
            - so_tien <= 0        ->  nem ValueError
            - so_tien > so_du     ->  nem LoiSoDuKhongDu
            - Tru khoi so_du
            - Them ("rut", so_tien) vao lich_su
        """
        # TODO
        pass

    def __str__(self) -> str:
        """Tra ve chuoi dang: "TaiKhoan(An, so du 1,300 VND)"

        Goi y: f"{self.so_du:,.0f}"
        """
        # TODO
        pass


# ===========================================================================
#  6.3 - dataclass
# ===========================================================================
@dataclass
class HocVien:
    """Hoc vien voi danh sach diem.

    Cach dung:
        hv = HocVien("An")
        hv.them_diem(8)
        hv.them_diem(9)
        hv.diem_trung_binh()   ->  8.5
        hv.xep_loai()          ->  "Kha"
    """

    ten: str
    # TODO: khai bao truong `diem` la list[float], mac dinh la LIST RONG.
    #       CANH BAO: viet `diem: list[float] = []` se bao loi ngay khi chay.
    #       Dung: field(default_factory=list)
    diem: list[float] = None  # <- sua dong nay

    def them_diem(self, gia_tri: float) -> None:
        """Them mot diem. Diem phai trong khoang 0-10, khong thi nem ValueError."""
        # TODO
        pass

    def diem_trung_binh(self) -> float:
        """Diem trung binh. Chua co diem nao thi tra ve 0.0."""
        # TODO
        pass

    def xep_loai(self) -> str:
        """Xep loai theo diem trung binh.

            >= 9    ->  "Gioi"
            >= 8    ->  "Kha"
            >= 6.5  ->  "Trung binh"
            < 6.5   ->  "Yeu"
        """
        # TODO
        pass


# ===========================================================================
#  6.4 - Ham dung try/except
# ===========================================================================
def chuyen_tien(tu_tk: TaiKhoan, den_tk: TaiKhoan, so_tien: float) -> bool:
    """Chuyen tien giua hai tai khoan.

    Tra ve True neu thanh cong, False neu that bai.

    Yeu cau QUAN TRONG:
        - Neu rut that bai (khong du so du, so tien khong hop le)
          thi KHONG duoc nap vao tai khoan dich.
          Nghia la: hai tai khoan phai giu nguyen nhu truoc khi goi ham.
        - Khong duoc de ngoai le thoat ra ngoai ham nay.

    Vi du:
        a = TaiKhoan("A", 1000)
        b = TaiKhoan("B", 0)
        chuyen_tien(a, b, 500)     ->  True,  a.so_du=500,  b.so_du=500
        chuyen_tien(a, b, 99999)   ->  False, a.so_du=500,  b.so_du=500  (khong doi)

    Goi y: rut TRUOC, nap SAU. Bat LoiSoDuKhongDu va ValueError.
    """
    # TODO
    pass


# ===========================================================================
if __name__ == "__main__":
    tk = TaiKhoan("An", 1000)
    tk.nap(500)
    print(f"  Sau khi nap 500: {tk}")

    try:
        tk.rut(99999)
    except LoiSoDuKhongDu as e:
        print(f"  Rut qua so du -> bat duoc loi: {e}")

    hv = HocVien("Binh")
    hv.them_diem(8)
    hv.them_diem(9)
    print(f"  {hv.ten}: TB = {hv.diem_trung_binh()}, xep loai = {hv.xep_loai()}")
