"""LOI GIAI - Bai tap 2, Phase 03."""

from __future__ import annotations

import pandas as pd


# ===========================================================================
def tom_tat(df: pd.DataFrame) -> dict:
    thieu = df.isna().sum()
    return {
        "so_dong": int(df.shape[0]),
        "so_cot": int(df.shape[1]),
        "so_trung_lap": int(df.duplicated().sum()),
        "cot_thieu": {cot: int(so) for cot, so in thieu.items() if so > 0},
        "kieu_du_lieu": {cot: str(kieu) for cot, kieu in df.dtypes.items()},
    }


# VI SAO HAM NAY DANG VIET?
#   Vi ban se goi no cho MOI dataset moi trong doi. Dong goi thanh ham
#   giup ban khong bao gio quen mot buoc kiem tra nao.
#
# df.duplicated() tra ve Series boolean: True cho cac ban SAO CHEP,
#   ban XUAT HIEN DAU TIEN duoc danh dau False. Nen .sum() cho biet
#   "co bao nhieu dong thua co the xoa di".
#
# CHU Y ve df.isna().sum():
#   Tra ve Series (mot so cho moi cot). Neu muon TONG so o thieu toan bang
#   thi phai .sum().sum() - goi hai lan.
#
# TY LE THIEU HUU ICH HON SO TUYET DOI:
#       df.isna().mean().sort_values(ascending=False)
#   "500 o thieu" khong noi len gi neu ban khong biet tong so dong.
#   "38% thieu" thi biet ngay phai lam gi.
#
# .items() tren Series duyet qua (index, gia_tri) - giong dict.
# Phai ep int() vi pandas tra ve np.int64, khong serialize sang JSON duoc.


# ===========================================================================
def loc_don_hang(df: pd.DataFrame, gia_toi_thieu: float, cac_kenh: list[str]) -> pd.DataFrame:
    mat_na = (df["thanh_tien"] >= gia_toi_thieu) & (df["kenh"].isin(cac_kenh))
    return df[mat_na].reset_index(drop=True)


# BA DIEM CAN NHO KHI LOC TRONG PANDAS:
#
#   1. Dung & | ~ chu KHONG dung and or not
#      Loi thay ngay: "The truth value of a Series is ambiguous"
#
#   2. MOI VE PHAI TRONG NGOAC
#      & co do uu tien cao hon >=, khong boc ngoac se sai hoac loi.
#
#   3. .isin(danh_sach) thay cho chuoi dieu kien ==
#      Thay vi (df.kenh == "App") | (df.kenh == "Web") | ...
#      viet df.kenh.isin(["App", "Web"]) - ngan va nhanh hon.
#
# VI SAO reset_index(drop=True)?
#   Sau khi loc, index giu nguyen so cu: 0, 3, 7, 12...
#   Dieu do gay hai bay:
#       sub.loc[0]   -> co the KeyError neu dong 0 bi loc mat
#       sub.iloc[0]  -> luon la dong dau tien
#
#   drop=True nghia la "vut bo index cu", khong giu no thanh mot cot moi.
#   Quen drop=True thi ban co them mot cot ten "index" khong ai can.
#
# df[mat_na] tao ra mot BAN SAO moi, nen df goc khong bi anh huong.


# ===========================================================================
def them_thanh_tien(df: pd.DataFrame) -> pd.DataFrame:
    kq = df.copy()
    kq["thanh_tien"] = (kq["so_luong"] * kq["don_gia"] * (1 - kq["giam_gia"])).round(0).astype(int)
    return kq


# VI SAO .copy()?
#   Khong copy thi ban dang sua DataFrame cua nguoi goi. Pandas se canh bao:
#       SettingWithCopyWarning
#   Day la canh bao noi tieng gay bối rối nhat cua pandas. Y no la:
#   "toi khong chac ban dang sua ban goc hay ban sao, ket qua co the
#    khong nhu ban mong doi".
#
#   Cach tranh trien de: LUON .copy() o dau ham nao co sua doi DataFrame.
#
# PHEP TINH TREN CA COT - khong can vong lap:
#   kq["a"] * kq["b"]  ->  nhan tung dong, tra ve Series moi
#   Neu ban dang viet `for idx, row in df.iterrows()` thi hay dung lai:
#   iterrows CHAM hon vectorized hang tram lan va gan nhu luon co cach thay the.
#
# VI SAO .round(0).astype(int) MA KHONG PHAI .astype(int) THANG?
#   astype(int) CAT phan thap phan (179.99 -> 179), khong lam tron.
#   Voi tien bac, cat di la sai. Phai round() truoc.
#
# LUU Y VE SO THUC VA TIEN:
#   0.1 + 0.2 != 0.3 trong may tinh. Voi he thong ke toan that, nguoi ta
#   luu tien duoi dang so nguyen (don vi dong) hoac kieu Decimal.
#   Trong phan tich du lieu thi float chap nhan duoc, nhung phai biet
#   gioi han cua no.


# ===========================================================================
def doanh_thu_theo_nhom(df: pd.DataFrame, cot_nhom: str) -> pd.DataFrame:
    kq = (
        df.groupby(cot_nhom)
        .agg(
            tong_doanh_thu=("thanh_tien", "sum"),
            so_don=("thanh_tien", "count"),
            gia_tri_tb=("thanh_tien", "mean"),
        )
        .reset_index()
    )
    kq["gia_tri_tb"] = kq["gia_tri_tb"].round(2)
    return kq.sort_values("tong_doanh_thu", ascending=False).reset_index(drop=True)


# CU PHAP "NAMED AGGREGATION" - cach hien dai va de doc nhat:
#       ten_cot_moi=("cot_nguon", "ham")
#
#   So sanh voi cach cu:
#       df.groupby("tp").agg({"thanh_tien": ["sum", "count", "mean"]})
#   Cach cu tao cot da tang (MultiIndex) rat kho lam viec tiep.
#   Cach moi cho ban dat ten cot ngay, ket qua dung la mot bang phang.
#
# CAC HAM TONG HOP THUONG DUNG:
#   sum, mean, median, count, min, max, std, nunique, first, last
#
# CAN THAN count vs size:
#       count  BO QUA o nan
#       size   dem tat ca ke ca nan
#   Neu cot dung de dem co gia tri thieu, hai ham cho ket qua KHAC NHAU.
#   Day la nguon sai lech so lieu rat am tham. Khi dem so dong, an toan nhat
#   la dem tren mot cot chac chan khong bao gio thieu (nhu id).
#
# VI SAO .reset_index()?
#   Sau groupby, cot nhom tro thanh INDEX chu khong phai cot binh thuong.
#   reset_index() dua no tro lai thanh cot - de ghep bang, ve bieu do,
#   hay xuat file ve sau.
#
# CO HAI reset_index TRONG HAM NAY:
#   - Cai dau: dua cot_nhom tu index thanh cot
#   - Cai sau (drop=True): danh so lai 0,1,2... sau khi sap xep


# ===========================================================================
def ghep_khach_hang(don: pd.DataFrame, khach: pd.DataFrame) -> pd.DataFrame:
    so_dong_truoc = len(don)
    kq = pd.merge(don, khach, on="khach_id", how="left")

    if len(kq) != so_dong_truoc:
        raise ValueError(
            f"Merge lam thay doi so dong: {so_dong_truoc} -> {len(kq)}. "
            f"Bang khach hang co khach_id trung lap "
            f"({int(khach['khach_id'].duplicated().sum())} ma bi trung)."
        )

    return kq


# DAY LA BUG AM THAM NGUY HIEM NHAT KHI XU LY DU LIEU.
#
#   Neu bang `khach` co khach_id KH001 xuat hien 2 lan, thi MOI don hang cua
#   KH001 se bi NHAN DOI sau khi merge. Doanh thu bao cao tang gap doi.
#   Khong co thong bao loi nao. Ban chi phat hien khi sep hoi
#   "sao thang nay doanh thu tang 40%?"
#
# BA CACH PHONG - nen dung ca ba:
#
#   1. Kiem tra len() truoc va sau (cach trong bai nay)
#
#   2. Dung tham so validate - pandas tu nem loi:
#          pd.merge(don, khach, on="khach_id", how="left",
#                   validate="many_to_one")
#      "many_to_one" nghia la: nhieu don hang -> mot khach hang.
#      Neu bang phai co khoa trung, pandas bao loi ngay.
#      Cac gia tri khac: "one_to_one", "one_to_many", "many_to_many"
#
#   3. Dung indicator de kiem tra ty le khop:
#          kq = pd.merge(..., indicator=True)
#          print(kq["_merge"].value_counts())
#          # both / left_only / right_only
#      Neu left_only cao bat thuong -> khoa khong khop
#      (khac kieu du lieu, khoang trang thua, hoa/thuong khac nhau).
#
# CHON how NAO?
#   how="left"   giu HET dong ben trai       <- an toan nhat, mac dinh nen dung
#   how="inner"  chi giu dong khop CA HAI    <- am tham lam mat du lieu
#   how="outer"  giu het ca hai ben
#   how="right"  giu het ben phai
#
#   Nguoi moi hay dung inner theo quan tinh roi mat 30% du lieu ma khong biet.


# ===========================================================================
def top_khach_hang(df: pd.DataFrame, n: int = 5) -> pd.DataFrame:
    return (
        df.groupby("khach_id")["thanh_tien"]
        .sum()
        .sort_values(ascending=False)
        .head(n)
        .reset_index(name="tong_chi")
    )


# DOC CHUOI PHUONG THUC (method chaining) TU TREN XUONG:
#   groupby("khach_id")     nhom theo khach
#   ["thanh_tien"]          chi quan tam cot nay
#   .sum()                  tong moi nhom      -> Series
#   .sort_values(...)       sap giam dan
#   .head(n)                lay n dau
#   .reset_index(name=...)  Series -> DataFrame, dat ten cot gia tri
#
# reset_index(name="tong_chi") chi dung duoc voi SERIES, khong dung duoc
# voi DataFrame. Voi Series no doi ten cot gia tri luon - rat tien.
#
# CACH NGAN HON:
#       df.groupby("khach_id")["thanh_tien"].sum().nlargest(n)
#   .nlargest(n) nhanh hon sort_values().head(n) vi no khong sap xep
#   toan bo - chi giu n phan tu lon nhat. Voi bang lon, khac biet dang ke.
#
# METHOD CHAINING co nen dung khong?
#   Nen, nhung dung qua 5-6 buoc thi kho debug (khong xem duoc ket qua
#   giua chung). Luc do hay tach ra bien trung gian co ten ro nghia.


# ===========================================================================
def ty_le_trong_nhom(df: pd.DataFrame, cot_nhom: str) -> pd.Series:
    tong_nhom = df.groupby(cot_nhom)["thanh_tien"].transform("sum")
    return df["thanh_tien"] / tong_nhom


# agg vs transform - PHAN BIET CHO NAY LA DIEM MAU CHOT
#
#   df.groupby("tp")["tien"].sum()        -> agg
#       Ha Noi   100
#       TP HCM   200
#       (2 dong - MOI NHOM MOT DONG)
#
#   df.groupby("tp")["tien"].transform("sum")   -> transform
#       0    100     <- dong nay thuoc Ha Noi -> nhan tong cua Ha Noi
#       1    200     <- dong nay thuoc TP HCM
#       2    100     <- dong nay thuoc Ha Noi
#       (GIU NGUYEN so dong va index cua df goc)
#
#   Nho transform giu nguyen index nen chia truc tiep duoc voi cot goc.
#   Neu dung agg roi merge lai thi phai qua 3 buoc va de sai.
#
# CAC UNG DUNG THUC TE CUA transform - ban se dung rat nhieu:
#
#   Ty le dong gop trong nhom:
#       df["ty_le"] = df["tien"] / df.groupby("tp")["tien"].transform("sum")
#
#   Dien gia tri thieu bang median CUA NHOM (tot hon median toan cuc):
#       df["gia"] = df["gia"].fillna(df.groupby("dm")["gia"].transform("median"))
#
#   Chuan hoa trong tung nhom (z-score theo nhom):
#       g = df.groupby("tp")["tien"]
#       df["z"] = (df["tien"] - g.transform("mean")) / g.transform("std")
#
#   So voi trung binh nhom:
#       df["cao_hon_tb_nhom"] = df["tien"] > df.groupby("tp")["tien"].transform("mean")


# ===========================================================================
if __name__ == "__main__":
    df = pd.DataFrame(
        {
            "don_id": ["D1", "D2", "D3", "D4"],
            "khach_id": ["K1", "K2", "K1", "K3"],
            "so_luong": [1, 2, 1, 3],
            "don_gia": [100, 200, 300, 100],
            "giam_gia": [0.0, 0.1, 0.0, 0.2],
            "kenh": ["App", "Website", "App", "Shopee"],
        }
    )

    tt = tom_tat(df)
    assert tt["so_dong"] == 4 and tt["so_cot"] == 6
    assert tt["cot_thieu"] == {}

    df2 = them_thanh_tien(df)
    assert list(df2["thanh_tien"]) == [100, 360, 300, 240]
    assert "thanh_tien" not in df.columns, "Ham da sua df goc!"

    loc = loc_don_hang(df2, 200, ["App", "Shopee"])
    assert list(loc["don_id"]) == ["D3", "D4"]

    dt = doanh_thu_theo_nhom(df2, "kenh")
    assert list(dt.columns) == ["kenh", "tong_doanh_thu", "so_don", "gia_tri_tb"]
    assert dt.iloc[0]["kenh"] == "App"

    top = top_khach_hang(df2, 2)
    assert list(top.columns) == ["khach_id", "tong_chi"]
    assert top.iloc[0]["khach_id"] == "K1"

    tl = ty_le_trong_nhom(df2, "kenh")
    assert abs(tl.iloc[0] - 0.25) < 1e-9

    khach = pd.DataFrame({"khach_id": ["K1", "K2", "K3"], "ten": ["A", "B", "C"]})
    assert len(ghep_khach_hang(df2, khach)) == 4

    khach_trung = pd.DataFrame({"khach_id": ["K1", "K1"], "ten": ["A", "A2"]})
    try:
        ghep_khach_hang(df2, khach_trung)
        raise AssertionError("Le ra phai nem ValueError")
    except ValueError:
        pass

    print("Tat ca deu dung.")
