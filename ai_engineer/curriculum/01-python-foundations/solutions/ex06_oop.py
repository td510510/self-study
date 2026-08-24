"""LOI GIAI - Bai tap 6, Phase 01."""

from __future__ import annotations

from dataclasses import dataclass, field


# ===========================================================================
class LoiSoDuKhongDu(Exception):
    """Nem ra khi rut tien nhieu hon so du."""


# VI SAO TAO LOAI LOI RIENG?
#   So sanh hai cach:
#       raise ValueError("Khong du so du")     <- nguoi goi phai doc CHUOI de biet
#       raise LoiSoDuKhongDu("...")            <- nguoi goi bat DUNG loai
#
#   Nho vay nguoi goi xu ly rieng tung tinh huong:
#       try:
#           tk.rut(x)
#       except LoiSoDuKhongDu:
#           goi_y_vay_them()          # xu ly rieng
#       except ValueError:
#           bao_nhap_sai()            # xu ly khac
#
#   Neu dung chung ValueError cho ca hai, phai doc noi dung chuoi de phan biet
#   - cach lam rat de vo khi doi thong bao.
#
# CU PHAP: chi can ke thua Exception. Than class co docstring la du,
# khong can `pass`. (Neu khong co docstring thi phai co `pass`, vi Python
# khong cho phep than class rong.)
#
# NEN ke thua Exception, KHONG nen ke thua BaseException
# (BaseException con bao gom KeyboardInterrupt, SystemExit - dung bat chung).


# ===========================================================================
class TaiKhoan:
    def __init__(self, chu_tai_khoan: str, so_du_ban_dau: float = 0):
        if so_du_ban_dau < 0:
            raise ValueError(f"So du ban dau khong duoc am, nhan duoc: {so_du_ban_dau}")

        self.chu_tai_khoan = chu_tai_khoan
        self.so_du = so_du_ban_dau
        self.lich_su: list[tuple[str, float]] = []

    def nap(self, so_tien: float) -> None:
        if so_tien <= 0:
            raise ValueError(f"So tien nap phai duong, nhan duoc: {so_tien}")

        self.so_du += so_tien
        self.lich_su.append(("nap", so_tien))

    def rut(self, so_tien: float) -> None:
        if so_tien <= 0:
            raise ValueError(f"So tien rut phai duong, nhan duoc: {so_tien}")
        if so_tien > self.so_du:
            raise LoiSoDuKhongDu(
                f"Khong du so du: can {so_tien:,.0f} nhung chi co {self.so_du:,.0f}"
            )

        self.so_du -= so_tien
        self.lich_su.append(("rut", so_tien))

    def __str__(self) -> str:
        return f"TaiKhoan({self.chu_tai_khoan}, so du {self.so_du:,.0f} VND)"


# `self` la gi?
#   La chinh doi tuong dang duoc thao tac. Khi ban viet:
#       tk.nap(500)
#   Python thuc chat goi:
#       TaiKhoan.nap(tk, 500)
#   `tk` duoc truyen vao tham so dau tien, ten quy uoc la `self`.
#   Do la ly do moi phuong thuc deu co self o dau.
#
# VI SAO KIEM TRA TRUOC KHI SUA so_du?
#   Neu tru tien roi moi phat hien loi, tai khoan da bi sai trang thai.
#   Nguyen tac: kiem tra HET dieu kien, roi moi thay doi du lieu.
#   Trong he thong that day goi la tinh "nguyen tu" (atomicity):
#   hoac lam tron ven, hoac khong lam gi ca.
#
# __str__ vs __repr__:
#   __str__   -> danh cho NGUOI DUNG, goi khi print(tk) hay str(tk)
#   __repr__  -> danh cho LAP TRINH VIEN, goi khi go `tk` trong terminal
#                hoac khi tk nam trong mot list duoc in ra
#   Neu chi viet mot cai, hay viet __repr__ - Python se dung no lam ca hai.
#   Quy uoc: __repr__ nen tra ve chuoi ma copy vao code chay lai duoc,
#   vi du: "TaiKhoan('An', 1300)"


# ===========================================================================
@dataclass
class HocVien:
    ten: str
    diem: list[float] = field(default_factory=list)

    def them_diem(self, gia_tri: float) -> None:
        if not 0 <= gia_tri <= 10:
            raise ValueError(f"Diem phai trong khoang 0-10, nhan duoc: {gia_tri}")
        self.diem.append(gia_tri)

    def diem_trung_binh(self) -> float:
        if not self.diem:
            return 0.0
        return sum(self.diem) / len(self.diem)

    def xep_loai(self) -> str:
        tb = self.diem_trung_binh()
        if tb >= 9:
            return "Gioi"
        elif tb >= 8:
            return "Kha"
        elif tb >= 6.5:
            return "Trung binh"
        return "Yeu"


# VI SAO PHAI DUNG field(default_factory=list)?
#   Viet `diem: list[float] = []` -> Python NEM LOI NGAY khi doc file:
#       ValueError: mutable default <class 'list'> for field diem is not allowed
#
#   dataclass chu dong chan loi nay - chinh la bay "mutable default argument"
#   ban da gap o bai 4.1. Neu cho phep, moi HocVien se dung chung MOT list diem:
#       a = HocVien("A"); a.them_diem(8)
#       b = HocVien("B"); print(b.diem)   -> [8]  !!!
#
#   default_factory=list nghia la: "moi lan tao doi tuong moi, hay GOI list()
#   de tao mot list rong rieng". Hay de y: truyen `list` (ten ham),
#   khong phai `list()` (ket qua goi ham).
#
# @dataclass tu sinh giup ban:
#   __init__   - khoi tao cac truong
#   __repr__   - HocVien(ten='An', diem=[8, 9])
#   __eq__     - so sanh hai doi tuong theo gia tri cac truong
#   Tiet kiem hang chuc dong code lap di lap lai.
#
# `if not 0 <= gia_tri <= 10` - Python cho phep noi chuoi so sanh,
#   doc gan giong toan hoc. Trong C/Java phai viet:
#       if (gia_tri < 0 || gia_tri > 10)
#
# LIEN HE VE SAU: o Phase 07 ban se dung Pydantic - co the coi la
# "dataclass co kiem tra kieu du lieu that su". No chinh la cong cu de ep
# LLM tra ve JSON dung cau truc.


# ===========================================================================
def chuyen_tien(tu_tk: TaiKhoan, den_tk: TaiKhoan, so_tien: float) -> bool:
    try:
        tu_tk.rut(so_tien)
    except (LoiSoDuKhongDu, ValueError):
        return False

    den_tk.nap(so_tien)
    return True


# VI SAO RUT TRUOC, NAP SAU?
#   Rut la buoc CO THE THAT BAI. Nap thi gan nhu luon thanh cong.
#   Lam viec de hong truoc: neu hong thi chua co gi thay doi, tra ve False
#   la xong - hai tai khoan van nguyen ven.
#
#   Neu nap truoc roi rut sau, khi rut that bai ta da lo nap tien vao
#   tai khoan dich -> TU NHIEN SINH RA TIEN. Trong he thong that,
#   day la loi nghiem trong nhat co the mac phai.
#
# VI SAO nap KHONG nam trong try?
#   Vi ta chi muon bat loi cua buoc RUT. Neu dat ca hai trong try,
#   loi tu nap se bi nuot mat - luc do tien da bi tru ma khong den noi.
#   QUY TAC: pham vi try cang HEP cang tot. Chi bao quanh dong that su
#   co the nem loi ma ban biet cach xu ly.
#
# VE GIAO DICH THUC TE:
#   He thong ngan hang that dung "transaction" cua co so du lieu de dam bao
#   ca hai buoc cung thanh cong hoac cung bi huy bo. Ham nay la phien ban
#   don gian hoa cua chinh y do.


# ===========================================================================
if __name__ == "__main__":
    tk = TaiKhoan("An", 1000)
    tk.nap(500)
    tk.rut(200)
    assert tk.so_du == 1300
    assert tk.lich_su == [("nap", 500), ("rut", 200)]
    assert str(tk) == "TaiKhoan(An, so du 1,300 VND)"

    try:
        tk.rut(99999)
        raise AssertionError("Le ra phai nem LoiSoDuKhongDu")
    except LoiSoDuKhongDu:
        pass

    hv = HocVien("Binh")
    hv.them_diem(8)
    hv.them_diem(9)
    assert hv.diem_trung_binh() == 8.5
    assert hv.xep_loai() == "Kha"

    hv2 = HocVien("Cuong")
    assert hv2.diem == [], "Moi hoc vien phai co list diem RIENG"

    a, b = TaiKhoan("A", 1000), TaiKhoan("B", 0)
    assert chuyen_tien(a, b, 500) is True
    assert (a.so_du, b.so_du) == (500, 500)
    assert chuyen_tien(a, b, 99999) is False
    assert (a.so_du, b.so_du) == (500, 500), "That bai ma van lam doi so du!"

    print("Tat ca deu dung.")
