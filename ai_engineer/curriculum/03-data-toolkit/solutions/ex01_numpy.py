"""LOI GIAI - Bai tap 1, Phase 03."""

from __future__ import annotations

import numpy as np


# ===========================================================================
def dem_thieu(a: np.ndarray) -> int:
    return int(np.isnan(a).sum())


# VI SAO KHONG DUNG `a == np.nan`?
#   Theo chuan IEEE 754, nan KHONG BANG bat cu thu gi, ke ca chinh no:
#       np.nan == np.nan   ->  False
#
#   Ly do triet ly: nan nghia la "khong biet gia tri nay". Hai gia tri
#   khong biet thi khong the khang dinh la bang nhau.
#
#   Hau qua thuc te: `a[a == np.nan]` luon tra ve mang RONG. Rat nhieu nguoi
#   moi mat hang gio vi bug nay ma khong bao gio thay thong bao loi nao.
#
# np.isnan(a) tra ve mang BOOLEAN cung shape.
# .sum() tren mang boolean dem so gia tri True (True = 1, False = 0).
# Day la meo rat hay dung: dem dieu kien = (dieu_kien).sum()


# ===========================================================================
def thong_ke_an_toan(a: np.ndarray) -> dict[str, float]:
    hop_le = a[~np.isnan(a)]

    if len(hop_le) == 0:
        return {"mean": 0.0, "median": 0.0, "std": 0.0, "so_o_hop_le": 0}

    return {
        "mean": float(np.nanmean(a)),
        "median": float(np.nanmedian(a)),
        "std": float(np.nanstd(a)),
        "so_o_hop_le": int(len(hop_le)),
    }


# VI SAO CAN HO nan* ?
#   MOT o nan lam hong TOAN BO phep tinh:
#       np.array([1, 2, np.nan]).mean()  ->  nan
#
#   Do la thiet ke co chu dich: NumPy khong tu quyet dinh giup ban rang
#   "bo qua o thieu". Bo qua hay khong la QUYET DINH cua ban, va no co
#   hau qua thong ke that su.
#
# CAN THAN: bo qua nan khong phai luon dung!
#   Neu 40% du lieu bi thieu, np.nanmean chi tinh tren 60% con lai va
#   im lang cho ban mot con so trong co ve binh thuong. Do la ly do
#   ham nay tra ve luon `so_o_hop_le` - de nguoi doc biet con so dua tren
#   bao nhieu quan sat.
#
# ~ la phep NOT tren mang boolean:
#       ~np.array([True, False])  ->  [False, True]
#   Dung ~ chu khong dung `not` - `not` chi hieu mot gia tri don le.


# ===========================================================================
def dien_thieu_bang_median(a: np.ndarray) -> np.ndarray:
    if np.isnan(a).all():
        return np.zeros_like(a)

    median = np.nanmedian(a)
    return np.where(np.isnan(a), median, a)


# np.where(dieu_kien, gia_tri_neu_dung, gia_tri_neu_sai)
#   Phien ban vectorized cua if/else, chay tren CA MANG cung luc.
#   Doc la: "o nao la nan thi lay median, con lai giu nguyen".
#
# VI SAO MEDIAN MA KHONG PHAI MEAN?
#   Median ben vung voi ngoai lai. Neu du lieu co mot gia tri 1 ty giua
#   cac gia tri 10 trieu, mean bi keo len rat cao va ban se dien mot con so
#   sai lech vao moi o trong.
#
# CANH BAO VE MAT ML:
#   Dien gia tri thieu LAM GIAM PHUONG SAI cua du lieu - moi o trong deu
#   thanh cung mot so, khien phan bo "nhon" hon thuc te.
#
#   Ngoai ra, viec MOT O BI THIEU doi khi chinh la thong tin:
#       "khach khong khai thu nhap" co the tuong quan voi hanh vi mua hang
#   Cach lam chuyen nghiep la tao them mot cot danh dau:
#       df["thu_nhap_bi_thieu"] = df["thu_nhap"].isna().astype(int)
#   roi moi dien. Model duoc giu lai ca hai thong tin.
#
# np.zeros_like(a) tao mang 0 cung shape va cung dtype voi a.


# ===========================================================================
def loc_khoang(a: np.ndarray, thap: float, cao: float) -> np.ndarray:
    mat_na = (~np.isnan(a)) & (a >= thap) & (a <= cao)
    return a[mat_na]


# BOOLEAN MASKING - ky thuat quan trong nhat cua NumPy/pandas
#   (a >= thap)  tra ve mang boolean cung shape
#   & noi cac mang boolean lai theo tung phan tu
#   a[mat_na]    lay ra cac phan tu ung voi True
#
# VI SAO & MA KHONG PHAI `and`?
#   `and` chi lam viec voi MOT gia tri dung/sai. Voi mang, Python khong biet
#   "ca mang nay dung hay sai" nen nem loi:
#       ValueError: The truth value of an array with more than one element
#       is ambiguous
#   Thay loi nay o dau la biet ngay: ban dang dung and/or thay vi &/|.
#
# VI SAO MOI VE PHAI TRONG NGOAC?
#   Trong Python, & co do uu tien CAO HON >= va <=.
#   Viet  a >= thap & a <= cao  se duoc hieu la  a >= (thap & a) <= cao
#   -> ket qua sai hoac loi kho hieu. LUON boc ngoac.
#
# VI SAO PHAI LOAI nan TRUONG MINH?
#   Moi so sanh voi nan deu ra False, nen (a >= thap) da tu loai nan roi.
#   Nhung viet ro ~np.isnan(a) the hien Y DO, va tranh canh bao runtime.


# ===========================================================================
def tim_ngoai_lai_iqr(a: np.ndarray) -> np.ndarray:
    q1, q3 = np.nanpercentile(a, [25, 75])
    iqr = q3 - q1
    duoi, tren = q1 - 1.5 * iqr, q3 + 1.5 * iqr

    mat_na = (~np.isnan(a)) & ((a < duoi) | (a > tren))
    return np.where(mat_na)[0]


# IQR (Interquartile Range) = khoang giua phan vi 25% va 75%
#   Do la khoang chua 50% du lieu O GIUA.
#
#   Nguong 1.5 * IQR la quy uoc do John Tukey dat ra khi phat minh boxplot.
#   Voi phan phoi chuan, no tuong ung khoang +-2.7 std, tuc ~0.7% du lieu.
#   Con so 1.5 khong co gi thieng lieng - co the dung 3.0 neu muon chat hon.
#
# VI SAO IQR TOT HON Z-SCORE?
#   z-score = (x - mean) / std. Nhung ban than mean va std DA BI ngoai lai
#   keo lech. Mot gia tri 1 ty lam std phong to, khien chinh no khong con
#   vuot nguong 3 std nua -> ngoai lai tu che giau minh.
#
#   Quartile thi khong bi anh huong: du gia tri lon nhat co la 1 ty hay
#   1 nghin ty, phan vi 75% van the.
#   Thuat ngu: IQR la phuong phap "robust" (ben vung).
#
# np.where(mat_na)[0] tra ve CHI SO cac vi tri True.
#   Vi sao co [0]? np.where tren mang 1 chieu tra ve mot TUPLE co 1 phan tu.
#   Voi mang 2 chieu no tra ve tuple 2 phan tu (chi so hang, chi so cot).
#
# QUAN TRONG - TIM DUOC ROI THI SAO?
#   KHONG tu dong xoa. Phai hoi: day la LOI hay la SU THAT hiem?
#       Tuoi = 999            -> loi nhap lieu, xoa hoac sua
#       Don hang 100 laptop   -> khach doanh nghiep that, GIU LAI
#   Xoa ngoai lai mot cach may moc la cach tot nhat de vut di dung
#   nhung khach hang gia tri nhat.


# ===========================================================================
def tong_theo_nhom(gia_tri: np.ndarray, nhom: np.ndarray) -> dict:
    ket_qua = {}
    for ten in np.unique(nhom):
        ket_qua[ten] = float(gia_tri[nhom == ten].sum())
    return ket_qua


# VONG LAP O DAY CO CHAP NHAN DUOC KHONG?
#   Co. Vong lap chay qua CAC NHOM (thuong vai chuc), khong phai qua tung
#   PHAN TU (co the hang trieu). Ben trong moi lan lap, phep tinh van la
#   vectorized: gia_tri[nhom == ten].sum()
#
#   Nguyen tac: tranh vong lap qua DU LIEU, khong phai tranh moi vong lap.
#
# np.unique(nhom) tra ve cac gia tri khac nhau, DA SAP XEP.
#   Nho vay ket qua on dinh giua cac lan chay.
#
# DAY CHINH LA groupby LAM BANG TAY:
#       df.groupby("nhom")["gia_tri"].sum()
#   Tuan 7 ban se dung pandas thay vi tu viet. Nhung hieu co che ben trong
#   giup ban debug khi groupby cho ket qua la.


# ===========================================================================
def chuan_hoa_minmax(a: np.ndarray) -> np.ndarray:
    nho_nhat = np.nanmin(a)
    lon_nhat = np.nanmax(a)

    if lon_nhat == nho_nhat:
        return np.zeros_like(a)

    return (a - nho_nhat) / (lon_nhat - nho_nhat)


# MIN-MAX vs Z-SCORE - chon cai nao?
#
#   Min-max:  (x - min) / (max - min)   ->  luon nam trong [0, 1]
#       + Khoang gia tri co dinh, de hieu
#       + Bat buoc khi dau vao can nam trong [0,1] (vi du gia tri pixel anh)
#       - RAT nhay voi ngoai lai: mot gia tri 1 ty lam moi gia tri khac
#         bi nen xuong gan 0
#
#   Z-score:  (x - mean) / std          ->  mean=0, std=1
#       + Ben vung hon voi ngoai lai
#       + La lua chon MAC DINH trong ML
#       - Khong co khoang co dinh
#
#   Quy tac ngon tay cai: dung z-score tru khi co ly do cu the can [0,1].
#
# VI SAO PHAI KIEM TRA max == min?
#   Cot hang so (moi gia tri giong nhau) lam mau so bang 0 -> ket qua nan.
#   Trong du lieu that, cot hang so xuat hien nhieu hon ban tuong:
#   cot "nam" trong du lieu chi cua mot nam, cot "quoc gia" khi chi ban o VN...
#
#   Ban than cot hang so KHONG CO GIA TRI cho model (no khong phan biet duoc
#   gi ca) - phat hien ra thi nen xoa han cot do.
#
# LUU Y ML: giong z-score, min/max phai lay TU TAP TRAIN.
#   Neu tinh tren toan bo du lieu, gia tri lon nhat cua tap test "ro ri"
#   vao qua trinh train -> data leakage.


# ===========================================================================
if __name__ == "__main__":
    a = np.array([1.0, 2.0, np.nan, 4.0])

    assert dem_thieu(a) == 1
    assert dem_thieu(np.array([1.0, 2.0])) == 0

    tk = thong_ke_an_toan(a)
    assert tk["so_o_hop_le"] == 3
    assert abs(tk["mean"] - 7 / 3) < 1e-9

    assert np.allclose(dien_thieu_bang_median(a), [1.0, 2.0, 2.0, 4.0])
    assert np.allclose(loc_khoang(np.array([1.0, 5.0, np.nan, 10.0, 20.0]), 2, 15), [5.0, 10.0])

    assert list(tim_ngoai_lai_iqr(np.array([10.0, 12.0, 11.0, 13.0, 12.0, 100.0]))) == [5]

    assert tong_theo_nhom(
        np.array([10.0, 20.0, 30.0, 40.0]), np.array(["A", "B", "A", "B"])
    ) == {"A": 40.0, "B": 60.0}

    assert np.allclose(chuan_hoa_minmax(np.array([10.0, 20.0, 30.0])), [0.0, 0.5, 1.0])
    assert np.allclose(chuan_hoa_minmax(np.array([5.0, 5.0, 5.0])), [0.0, 0.0, 0.0])

    print("Tat ca deu dung.")
