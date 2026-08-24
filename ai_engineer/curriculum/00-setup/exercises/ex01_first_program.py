"""BAI TAP 1 - Chuong trinh dau tien (Phase 00).

CACH LAM:
    1. Doc yeu cau cua tung ham
    2. Xoa dong `pass` va viet code cua ban thay vao
    3. Chay thu:   python curriculum/00-setup/exercises/ex01_first_program.py
    4. Cham diem:  pytest tests/phase00 -v

QUY TAC:
    - Bi thi vat lon it nhat 20 phut roi moi xem solutions/
    - Dung hoi AI lam ho. Hoi AI de HIEU thi duoc.

Loi giai: curriculum/00-setup/solutions/ex01_first_program.py
"""

from __future__ import annotations

# ===========================================================================
#  BAI 1.1 - Chao hoi
# ===========================================================================
def chao(ten: str) -> str:
    """Tra ve loi chao.

    Vi du:
        chao("Nam")  ->  "Xin chao, Nam!"
        chao("An")   ->  "Xin chao, An!"

    Goi y: dung f-string.
    """
    # TODO: viet code cua ban o day (xoa dong pass)
    pass


# ===========================================================================
#  BAI 1.2 - Tinh tong gio hoc
# ===========================================================================
def tong_gio_hoc(so_tuan: int, gio_moi_tuan: int) -> int:
    """Tinh tong so gio hoc.

    Vi du:
        tong_gio_hoc(22, 12)  ->  264
        tong_gio_hoc(4, 10)   ->  40
    """
    # TODO
    pass


# ===========================================================================
#  BAI 1.3 - Doi phut sang gio va phut
# ===========================================================================
def doi_phut(tong_phut: int) -> str:
    """Doi so phut thanh chuoi dang "Xh Ym".

    Vi du:
        doi_phut(130)  ->  "2h 10m"
        doi_phut(60)   ->  "1h 0m"
        doi_phut(45)   ->  "0h 45m"

    Goi y: dung // de lay phan nguyen va % de lay phan du.
    """
    # TODO
    pass


# ===========================================================================
#  BAI 1.4 - Xep loai diem
# ===========================================================================
def xep_loai(diem: float) -> str:
    """Xep loai theo thang diem 10.

        diem >= 9        ->  "Gioi"
        8 <= diem < 9    ->  "Kha"
        6.5 <= diem < 8  ->  "Trung binh"
        diem < 6.5       ->  "Yeu"

    Vi du:
        xep_loai(9.5)  ->  "Gioi"
        xep_loai(8.0)  ->  "Kha"
        xep_loai(7.0)  ->  "Trung binh"
        xep_loai(5.0)  ->  "Yeu"

    Goi y: dung if / elif / else, xet tu diem cao xuong thap.
    """
    # TODO
    pass


# ===========================================================================
#  BAI 1.5 - An toan khi chia
# ===========================================================================
def chia_an_toan(a: float, b: float) -> float | None:
    """Chia a cho b. Neu b bang 0 thi tra ve None thay vi gay loi.

    Vi du:
        chia_an_toan(10, 2)  ->  5.0
        chia_an_toan(10, 0)  ->  None
        chia_an_toan(7, 2)   ->  3.5

    Day la thoi quen quan trong: du doan truoc truong hop hong
    va xu ly no, thay vi de chuong trinh crash.
    """
    # TODO
    pass


# ===========================================================================
#  BAI 1.6 - Tinh phan tram tien do
# ===========================================================================
def phan_tram_hoan_thanh(so_tuan_xong: int, tong_so_tuan: int = 22) -> str:
    """Tra ve chuoi phan tram, lam tron 1 chu so thap phan, kem dau %.

    Vi du:
        phan_tram_hoan_thanh(11)      ->  "50.0%"
        phan_tram_hoan_thanh(0)       ->  "0.0%"
        phan_tram_hoan_thanh(22)      ->  "100.0%"
        phan_tram_hoan_thanh(3, 10)   ->  "30.0%"

    Goi y: f"{gia_tri:.1f}%"
    """
    # TODO
    pass


# ===========================================================================
#  Chay thu - phan nay giup ban tu kiem tra truoc khi chay pytest
# ===========================================================================
if __name__ == "__main__":
    print("Ket qua cac ham cua ban:\n")
    print(f"  chao('Nam')              = {chao('Nam')!r}")
    print(f"  tong_gio_hoc(22, 12)     = {tong_gio_hoc(22, 12)!r}")
    print(f"  doi_phut(130)            = {doi_phut(130)!r}")
    print(f"  xep_loai(8.5)            = {xep_loai(8.5)!r}")
    print(f"  chia_an_toan(10, 0)      = {chia_an_toan(10, 0)!r}")
    print(f"  phan_tram_hoan_thanh(11) = {phan_tram_hoan_thanh(11)!r}")
    print("\nThay 'None' o dau tuc la ham do chua lam xong.")
    print("Cham diem day du:  pytest tests/phase00 -v")
