"""BAI HOC 3 - Hoc doc loi bang cach GAY RA LOI.

Day la bai tap gia tri nhat cua tuan 1.

File nay chua 5 LOI CO Y. Nhiem vu cua ban:

    1. Chay:  python curriculum/00-setup/lessons/03_gay_loi_de_hoc.py
    2. Doc traceback - DONG CUOI CUNG truoc tien
    3. Tim dong bi loi (dong "File ..., line N")
    4. Sua loi do
    5. Chay lai -> se lo ra loi tiep theo
    6. Lap lai cho den khi file chay sach va in ra dong chuc mung

QUY TAC: dung nho AI sua ho. Tu doc loi truoc.
Bang tra loi: resources/cheatsheets/debugging.md

Moi loi deu co goi y o cuoi file (dung xem truoc khi tu thu 5 phut).
"""

print("Bat dau kiem tra kha nang doc loi cua ban...\n")

# ===========================================================================
#  LOI 1
# ===========================================================================
print("--- Loi 1 ---")

ten = "Nam"
print(f"Xin chao {ho_ten}")


# ===========================================================================
#  LOI 2
# ===========================================================================
print("--- Loi 2 ---")

tuoi = "25"
tuoi_nam_sau = tuoi + 1
print(f"Nam sau: {tuoi_nam_sau}")


# ===========================================================================
#  LOI 3
# ===========================================================================
print("--- Loi 3 ---")

diem = [8, 9, 7]
print(f"Diem thu tu: {diem[3]}")


# ===========================================================================
#  LOI 4
# ===========================================================================
print("--- Loi 4 ---")

hoc_vien = {"ten": "Nam", "tuoi": 25}
print(f"Email: {hoc_vien['email']}")


# ===========================================================================
#  LOI 5
# ===========================================================================
print("--- Loi 5 ---")


def tinh_trung_binh(cac_diem):
    return sum(cac_diem) / len(cac_diem)


print(f"Trung binh: {tinh_trung_binh([])}")


# ===========================================================================
#  DICH DEN
# ===========================================================================
print("\n" + "=" * 60)
print("  CHUC MUNG! Ban da sua het 5 loi.")
print("  Ky nang doc traceback la ky nang quan trong nhat tuan nay.")
print("=" * 60)


# ===========================================================================
#  GOI Y - chi doc sau khi da tu thu it nhat 5 phut moi loi
# ===========================================================================
# LOI 1: NameError
#   Bien duoc TAO ten "ten" nhung duoc DUNG voi ten "ho_ten".
#   Python phan biet chu hoa/thuong va tung ky tu - phai khop tuyet doi.
#
# LOI 2: TypeError
#   "25" (co dau nhay) la CHUOI, khong phai so. Chuoi khong cong duoc voi so.
#   Sua: ep kieu bang int("25"), hoac bo dau nhay ngay tu dau.
#
# LOI 3: IndexError
#   List [8, 9, 7] co 3 phan tu, danh so 0, 1, 2. Khong co so 3.
#   Nho: Python dem tu 0. Phan tu cuoi cua list n phan tu la [n-1] (hoac [-1]).
#
# LOI 4: KeyError
#   Dict chi co khoa "ten" va "tuoi". Khong co "email".
#   Sua: them khoa do, hoac dung .get("email", "khong ro") de khong bi loi.
#
# LOI 5: ZeroDivisionError
#   List rong -> len([]) bang 0 -> chia cho 0.
#   Sua: kiem tra list rong truoc khi chia, va nem loi ro rang:
#       if not cac_diem:
#           raise ValueError("Danh sach diem rong")
# ===========================================================================
