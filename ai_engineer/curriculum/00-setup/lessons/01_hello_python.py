"""BAI HOC 1 - Chuong trinh Python dau tien.

Cach chay:
    python curriculum/00-setup/lessons/01_hello_python.py

Muc tieu:
    - Thay tan mat code chay tu tren xuong duoi
    - Lam quen print(), bien, va input tu nguoi dung
    - Hieu cach Python doc file cua ban

HAY THU: sua cac dong ben duoi roi chay lai. Sai cung khong sao,
xem loi bao gi chinh la cach hoc nhanh nhat.
"""

# ---------------------------------------------------------------------------
# PHAN 1: In ra man hinh
# ---------------------------------------------------------------------------
# print() la lenh dau tien moi lap trinh vien hoc.
# Moi lan goi print(), Python ghi mot dong ra man hinh.

print("=" * 55)
print("  Xin chao! Day la chuong trinh Python dau tien cua ban.")
print("=" * 55)

# THU NGHIEM 1: doi so 55 thanh 20 roi chay lai. Chuyen gi xay ra?


# ---------------------------------------------------------------------------
# PHAN 2: Bien - cai ten gan vao mot gia tri
# ---------------------------------------------------------------------------
# Dau = KHONG phai "bang nhau" trong toan hoc.
# No co nghia la "gan gia tri ben phai vao cai ten ben trai".

ten_khoa_hoc = "Zero to AI Engineer"
so_tuan = 22
gio_moi_tuan = 12

# f-string: dat chu f truoc dau nhay, roi nhet bien vao trong {}
print(f"\nKhoa hoc: {ten_khoa_hoc}")
print(f"Thoi luong: {so_tuan} tuan")

# Python tinh toan duoc ngay trong {}
print(f"Tong thoi gian: {so_tuan * gio_moi_tuan} gio")

# THU NGHIEM 2: doi gio_moi_tuan thanh 20. Dong "Tong thoi gian" thay doi khong?
#               Vi sao? (Goi y: thu tu thuc thi tu tren xuong)


# ---------------------------------------------------------------------------
# PHAN 3: Kieu du lieu - Python phan biet cac loai gia tri
# ---------------------------------------------------------------------------
print("\n--- Kieu du lieu ---")

mot_chuoi = "22"        # str  - chuoi ky tu, co dau nhay
mot_so = 22             # int  - so nguyen, khong dau nhay
mot_so_thuc = 22.5      # float - so thuc
dung_hay_sai = True     # bool - chi True hoac False

print(f"{mot_chuoi!r:>8}  ->  {type(mot_chuoi).__name__}")
print(f"{mot_so!r:>8}  ->  {type(mot_so).__name__}")
print(f"{mot_so_thuc!r:>8}  ->  {type(mot_so_thuc).__name__}")
print(f"{dung_hay_sai!r:>8}  ->  {type(dung_hay_sai).__name__}")

# QUAN TRONG: "22" va 22 la HAI THU KHAC NHAU
print(f'\n"22" + "22" = {"22" + "22"}    <- noi chuoi')
print(f"  22  +  22  = {22 + 22}    <- cong so")

# THU NGHIEM 3: bo dau # o dong duoi roi chay. Doc ky loi bao gi.
# print("22" + 22)


# ---------------------------------------------------------------------------
# PHAN 4: Tinh toan
# ---------------------------------------------------------------------------
print("\n--- Phep toan ---")

a, b = 7, 3     # gan cung luc hai bien

print(f"{a} + {b}  = {a + b}")
print(f"{a} - {b}  = {a - b}")
print(f"{a} * {b}  = {a * b}")
print(f"{a} / {b}  = {a / b:.4f}   <- chia luon ra so thuc")
print(f"{a} // {b} = {a // b}        <- chia lay phan nguyen")
print(f"{a} % {b}  = {a % b}        <- chia lay du")
print(f"{a} ** {b} = {a ** b}      <- luy thua")


# ---------------------------------------------------------------------------
# PHAN 5: Nhan du lieu tu nguoi dung
# ---------------------------------------------------------------------------
print("\n--- Tuong tac ---")

ten = input("Ban ten gi? ")

# LUU Y CUC KY QUAN TRONG:
# input() LUON tra ve mot CHUOI, ke ca khi ban go so.
# Muon tinh toan thi phai ep kieu bang int() hoac float().

tuoi_chuoi = input("Ban bao nhieu tuoi? ")
tuoi = int(tuoi_chuoi)      # ep chuoi thanh so nguyen

print(f"\nChao {ten}!")
print(f"Nam sau ban {tuoi + 1} tuoi.")
print(f"Sau 22 tuan hoc, ban van {tuoi} hoac {tuoi + 1} tuoi - nhung biet lam AI. :)")

# THU NGHIEM 4: chay lai chuong trinh va go "hai muoi" vao cau hoi tuoi.
#               Doc loi. Ban co doan duoc vi sao khong?


# ---------------------------------------------------------------------------
# PHAN 6: Dong nay chay cuoi cung
# ---------------------------------------------------------------------------
print("\n" + "=" * 55)
print("  Ket thuc. Python da doc file nay tu dong 1 den day.")
print("=" * 55)

# ===========================================================================
#  BAI TAP TU LAM (khong cham diem, lam de quen tay)
#
#  1. Them mot bien ten "muc_tieu" chua nghe nghiep ban muon, roi in ra
#  2. Hoi nguoi dung so tien ho muon tiet kiem moi thang,
#     in ra so tien sau 22 tuan (goi y: 22 tuan ~ 5.5 thang)
#  3. Tao mot loi tren file nay, chay, doc traceback, roi sua lai
# ===========================================================================
