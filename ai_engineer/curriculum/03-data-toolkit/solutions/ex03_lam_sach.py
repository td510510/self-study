"""LOI GIAI - Bai tap 3, Phase 03."""

from __future__ import annotations

import numpy as np
import pandas as pd

BANG_THANH_PHO = {
    "hn": "Ha Noi", "ha noi": "Ha Noi", "hà nội": "Ha Noi",
    "hcm": "TP HCM", "tphcm": "TP HCM", "tp hcm": "TP HCM",
    "tp.hcm": "TP HCM", "ho chi minh": "TP HCM", "sg": "TP HCM",
    "dn": "Da Nang", "da nang": "Da Nang", "đà nẵng": "Da Nang",
    "ct": "Can Tho", "can tho": "Can Tho",
    "hp": "Hai Phong", "hai phong": "Hai Phong",
}


# ===========================================================================
def chuan_hoa_thanh_pho(s: pd.Series) -> pd.Series:
    thieu_goc = s.isna()

    chuan = s.astype(str).str.strip().str.lower().map(BANG_THANH_PHO)
    chuan = chuan.fillna("Khac")
    chuan[thieu_goc] = "Khong ro"

    return chuan


# VI SAO PHAI GHI NHO thieu_goc TRUOC?
#   Sau khi .map(), co HAI loai NaN tron lan nhau:
#       - NaN von co trong du lieu goc      -> phai thanh "Khong ro"
#       - NaN do map sinh ra (khong co trong bang) -> phai thanh "Khac"
#   Neu khong ghi nho truoc, ban khong con phan biet duoc hai loai nay.
#
#   Day la mau rat hay gap khi lam sach: LUU LAI trang thai truoc khi bien doi.
#
# CHUOI .str.strip().str.lower() - VI SAO CA HAI?
#   " HN " va "hn" va "Hn" phai cung ra mot ket qua.
#   Chuan hoa ve mot dang duy nhat TRUOC khi tra bang la nguyen tac chung.
#
# VI SAO astype(str) truoc?
#   Neu cot co gia tri thieu, .str.strip() tra ve NaN cho o do, van chay duoc.
#   Nhung neu cot co kieu lan lon (vai o la so), .str khong hoat dong.
#   astype(str) dam bao moi o deu la chuoi. Doi lai, NaN thanh chuoi "nan"
#   - do la ly do ta da ghi nho thieu_goc tu truoc.
#
# .map(dict) vs .replace(dict) - KHAC BIET QUAN TRONG:
#       .map      gia tri khong co trong dict -> NaN
#       .replace  gia tri khong co trong dict -> GIU NGUYEN
#   O day ta muon phat hien gia tri la, nen .map dung y hon.
#
# QUY TRINH THUC TE:
#   1. df["tp"].value_counts()  -> xem co bao nhieu bien the
#   2. Viet bang anh xa cho cac bien the pho bien
#   3. Chay ham, roi value_counts() LAI
#   4. Neu "Khac" van nhieu -> con bien the chua bat het, quay lai buoc 2
#   Day la vong lap, khong phai lam mot lan la xong.


# ===========================================================================
def doi_sang_so(s: pd.Series) -> pd.Series:
    lam_sach = (
        s.astype(str)
        .str.strip()
        .str.replace(".", "", regex=False)
        .str.replace(",", "", regex=False)
    )
    return pd.to_numeric(lam_sach, errors="coerce")


# errors="coerce" LA THAM SO QUAN TRONG NHAT O DAY.
#   Ba lua chon:
#       errors="raise"   (mac dinh) - gap gia tri xau thi NEM LOI, dung ca chuong trinh
#       errors="coerce"  - gia tri xau thanh NaN, chay tiep
#       errors="ignore"  - tra ve nguyen ban (da bi khai tu)
#
#   Voi du lieu that, "coerce" gan nhu luon la lua chon dung: ban muon
#   xu ly xong roi DEM xem co bao nhieu o hong, chu khong muon dung lai
#   o dong dau tien gap loi.
#
#   Nho kiem tra sau khi doi:
#       print(f"Khong doi duoc: {kq.isna().sum()} o")
#   Neu con so do lon bat thuong, dinh dang du lieu khac voi ban tuong.
#
# CAN THAN VOI DAU CHAM:
#   O day ta bo HET dau cham vi du lieu Viet Nam dung cham lam phan cach
#   hang nghin: "1.200.000" = mot trieu hai.
#
#   NHUNG neu du lieu dung dau cham lam dau THAP PHAN kieu Anh My
#   ("1200.50" = mot nghin hai tram phay nam), bo dau cham se lam sai
#   ket qua 100 lan!
#
#   => LUON NHIN DU LIEU THAT truoc khi quyet dinh. In vai gia tri mau ra xem.
#   Day la loi lam sach du lieu nguy hiem nhat: no khong bao loi, chi
#   lam moi con so sai lech mot cach am tham.
#
# regex=False de pandas hieu "." la dau cham THAT, khong phai ky tu dac biet
#   cua bieu thuc chinh quy (trong regex, "." nghia la "mot ky tu bat ky").
#   Quen tham so nay se lam xoa SACH moi ky tu.


# ===========================================================================
def doi_sang_ngay(s: pd.Series) -> pd.Series:
    dinh_dang = ["%Y-%m-%d", "%d/%m/%Y", "%m-%d-%Y"]

    ket_qua = pd.to_datetime(s, format=dinh_dang[0], errors="coerce")
    for fmt in dinh_dang[1:]:
        con_thieu = ket_qua.isna()
        if not con_thieu.any():
            break
        ket_qua[con_thieu] = pd.to_datetime(s[con_thieu], format=fmt, errors="coerce")

    return ket_qua


# VI SAO PHAI THU TUNG DINH DANG?
#   pandas co the tu doan dinh dang, nhung khi mot cot co NHIEU dinh dang
#   tron lan, viec tu doan tro nen nguy hiem:
#
#       "03/04/2025" la ngay 3 thang 4, hay thang 3 ngay 4?
#
#   pandas se doan, va co the doan KHAC NHAU cho tung dong.
#   Ket qua: du lieu sai lech ma khong co canh bao nao.
#   Voi bao cao doanh thu theo thang, sai lech nay cuc ky tai hai.
#
#   Chi ro format cho tung buoc thi ban KIEM SOAT duoc chuyen gi xay ra.
#
# CACH LAM: thu dinh dang pho bien nhat truoc, cac o chua doi duoc
#   ("con thieu") thi thu dinh dang tiep theo. Giong nhu loc nhieu lan.
#
# NaT la gi?
#   "Not a Time" - phien ban NaN danh cho kieu datetime.
#   Kiem tra bang .isna() giong nhu NaN thong thuong.
#
# SAU KHI DOI XONG - kho bau mo ra:
#       df["thang"]     = df["ngay"].dt.month
#       df["nam"]       = df["ngay"].dt.year
#       df["thu"]       = df["ngay"].dt.dayofweek     # 0 = thu Hai
#       df["quy"]       = df["ngay"].dt.quarter
#       df.set_index("ngay").resample("ME")["tien"].sum()   # tong theo thang
#
#   Chung chi hoat dong khi cot DA la kieu datetime. Neu van la chuoi thi
#   .dt se bao loi. Do la ly do doi kieu ngay la mot trong nhung viec
#   dau tien phai lam khi lam sach.
#
# LUU Y: neu cot ngay cua ban chi co MOT dinh dang, dung don gian:
#       pd.to_datetime(s, format="%Y-%m-%d", errors="coerce")
#   Van nen ghi ro format - vua nhanh hon vua an toan hon.


# ===========================================================================
def loc_dong_hop_le(df: pd.DataFrame) -> pd.DataFrame:
    hop_le = (
        df["so_luong"].notna()
        & (df["so_luong"] > 0)
        & df["don_gia"].notna()
        & (df["don_gia"] > 0)
    )
    return df[hop_le].reset_index(drop=True)


# VI SAO PHAI KIEM TRA notna() RIENG?
#   Moi so sanh voi NaN deu ra False, nen (NaN > 0) da la False roi.
#   Ve mat ket qua thi notna() la thua.
#
#   NHUNG viet ro rang the hien Y DINH: "toi da nghi den truong hop thieu
#   va co y loai no". Nguoi doc code sau nay (ke ca ban) khong phai doan.
#
#   Code tot khong chi dung - no con phai NOI RO no dang lam gi.
#
# QUAN TRONG - LUON GHI LAI SO DONG DA LOAI:
#       truoc = len(df)
#       df = loc_dong_hop_le(df)
#       print(f"Da loai {truoc - len(df)} dong ({(truoc-len(df))/truoc:.1%})")
#
#   Neu ban loai mat 40% du lieu ma khong biet, moi ket luan phia sau
#   deu dua tren mot mau da bi thien lech. Trong bao cao EDA (project P1),
#   BAT BUOC phai ghi ro da loai bao nhieu dong va vi sao.
#
# SO LUONG AM CO PHAI LUC NAO CUNG LA LOI?
#   Khong! Trong nhieu he thong, so luong am nghia la HOAN TRA HANG.
#   Truoc khi xoa, phai hoi nguoi hieu nghiep vu. Neu do la don hoan tra
#   that su, xoa di se lam bao cao doanh thu bi thoi phong.
#
#   Day la ly do bao cao EDA nen liet ke cac gia tri bat thuong TRUOC,
#   roi moi quyet dinh xu ly - dung xoa ngay khi vua nhin thay.


# ===========================================================================
def bo_trung_lap(df: pd.DataFrame, cot_khoa: str | None = None) -> tuple[pd.DataFrame, int]:
    subset = [cot_khoa] if cot_khoa else None
    so_trung = int(df.duplicated(subset=subset).sum())
    sach = df.drop_duplicates(subset=subset, keep="first").reset_index(drop=True)
    return sach, so_trung


# HAI KIEU TRUNG LAP KHAC NHAU HOAN TOAN:
#
#   1. Trung TOAN BO cac cot (subset=None)
#      -> gan nhu chac chan la loi ky thuat: chay import hai lan,
#         goi API bi lap. Xoa duoc yen tam.
#
#   2. Trung theo KHOA nghiep vu (vi du don_id)
#      -> phai CAN THAN. Hai dong cung don_id nhung khac so_luong nghia la gi?
#         Ban ghi da bi sua? Hay day la hai dong san pham trong cung don?
#         Xoa mu quang o day co the lam mat du lieu that.
#
#   Truoc khi xoa theo khoa, hay NHIN cac dong trung do:
#       trung = df[df.duplicated(subset=["don_id"], keep=False)]
#       print(trung.sort_values("don_id").head(20))
#
#   keep=False danh dau TAT CA cac ban trung (ke ca ban dau tien),
#   nen ban thay duoc ca nhom de so sanh.
#
# THAM SO keep:
#       keep="first"  giu ban dau tien   (mac dinh)
#       keep="last"   giu ban cuoi cung  - dung khi ban sau la ban da cap nhat
#       keep=False    xoa HET moi ban trung
#
# VI SAO HAM TRA VE CA SO DONG DA XOA?
#   De ban ghi vao bao cao. "Da xoa 61 dong trung lap (2.0%)" la mot cau
#   phai co trong moi bao cao EDA nghiem tuc.


# ===========================================================================
def dien_theo_nhom(df: pd.DataFrame, cot_can_dien: str, cot_nhom: str) -> pd.Series:
    median_nhom = df.groupby(cot_nhom)[cot_can_dien].transform("median")
    median_toan_cuc = df[cot_can_dien].median()

    kq = df[cot_can_dien].fillna(median_nhom)
    kq = kq.fillna(median_toan_cuc)
    kq = kq.fillna(0)

    return kq


# BA TANG DU PHONG - tu chinh xac nhat den an toan nhat:
#   1. median cua NHOM        - chinh xac nhat
#   2. median TOAN CUC        - khi ca nhom deu thieu
#   3. so 0                   - khi toan bo cot deu thieu
#
#   Moi tang bat truong hop ma tang truoc khong xu ly duoc.
#   Neu chi dung tang 1, ban van con NaN sot lai va se bi loi o buoc sau.
#   Mau "fallback nhieu tang" nay rat hay dung khi lam sach du lieu.
#
# VI SAO transform CHU KHONG PHAI agg?
#   agg tra ve MOT dong cho moi nhom -> khong the gan vao cot goc.
#   transform tra ve DUNG SO DONG va DUNG INDEX cua df -> fillna dung ngay.
#
# VI SAO DIEN THEO NHOM TOT HON TOAN CUC? - vi du cu the:
#
#       danh_muc     gia
#       Laptop       25.000.000
#       Laptop       NaN            <- dien gi day?
#       Phu kien     50.000
#       Phu kien     80.000
#
#   Median toan cuc = 65.000  -> dien 65.000 cho mot cai LAPTOP. Vo ly.
#   Median nhom Laptop = 25.000.000 -> hop ly hon rat nhieu.
#
#   Nguyen tac: dien bang thong tin GAN NHAT ma ban co.
#
# VAN CON MOT CANH BAO QUAN TRONG:
#   Du dien kheo den may, ban van dang BIA du lieu. Neu mot cot thieu 60%,
#   dien vao khong lam no thanh that. Luc do nen:
#       - Xoa han cot do, HOAC
#       - Tao cot danh dau: df["gia_bi_thieu"] = df["gia"].isna().astype(int)
#         roi moi dien - de model biet dong nao la so that, dong nao la so bia.


# ===========================================================================
def bao_cao_chat_luong(df: pd.DataFrame) -> pd.DataFrame:
    bc = pd.DataFrame(
        {
            "cot": df.columns,
            "kieu": [str(k) for k in df.dtypes],
            "so_thieu": df.isna().sum().to_numpy(),
            "ty_le_thieu": df.isna().mean().round(4).to_numpy(),
            "so_gia_tri": df.nunique().to_numpy(),
        }
    )
    return bc.sort_values("ty_le_thieu", ascending=False).reset_index(drop=True)


# DOC BAO CAO NAY THE NAO - bon dau hieu can chu y:
#
#   1. ty_le_thieu > 0.5
#      Cot thieu qua nua. Can nhac xoa han, hoac tim hieu VI SAO no thieu
#      nhieu the (co khi chi mot nhom khach hang moi co du lieu nay).
#
#   2. so_gia_tri == 1
#      Cot HANG SO - moi dong deu giong nhau. Khong co gia tri cho model
#      (khong phan biet duoc gi). Xoa di cho gon.
#
#   3. so_gia_tri == so_dong
#      Cot ID - moi dong mot gia tri khac nhau. Huu ich de ghep bang,
#      NHUNG TUYET DOI khong dua vao model lam dac trung:
#      model se "hoc thuoc" tung dong -> overfitting hoan hao tren train,
#      vo dung tren du lieu moi.
#
#   4. kieu = "object" o cot le ra phai la SO
#      Dau hieu cot bi luu duoi dang chuoi ("1.200.000"), hoac co lan
#      gia tri rac trong do. Can doi_sang_so().
#
# VI SAO .to_numpy()?
#   df.isna().sum() tra ve mot Series co INDEX la ten cot. Neu dua thang
#   vao dict tao DataFrame, pandas se cang chinh theo index va co the
#   sinh ra ket qua la. .to_numpy() vut bo index, chi lay gia tri tho.
#   Day la loai chi tiet nho ma bug rat kho tim - luon can chinh index
#   khi ghep nhieu Series lai.
#
# HAY DUNG HAM NAY CHO MOI DATASET MOI. No la buoc DAU TIEN, truoc khi
# ve bat cu bieu do nao.


# ===========================================================================
if __name__ == "__main__":
    # --- 3.1
    s = pd.Series(["HN", " ha noi ", "SG", "Hue", None])
    assert list(chuan_hoa_thanh_pho(s)) == ["Ha Noi", "Ha Noi", "TP HCM", "Khac", "Khong ro"]

    # --- 3.2
    s = pd.Series(["1.200.000", "1,200,000", " 5000 ", 1200000, "", "abc"])
    kq = doi_sang_so(s)
    assert kq[0] == 1_200_000 and kq[1] == 1_200_000 and kq[2] == 5000
    assert kq[3] == 1_200_000 and pd.isna(kq[4]) and pd.isna(kq[5])

    # --- 3.3
    s = pd.Series(["2025-03-15", "15/03/2025", "03-15-2025", "khong phai ngay"])
    kq = doi_sang_ngay(s)
    assert (kq[:3] == pd.Timestamp("2025-03-15")).all()
    assert pd.isna(kq[3])

    # --- 3.4
    df = pd.DataFrame({"so_luong": [1.0, -2.0, np.nan, 3.0], "don_gia": [10.0, 10.0, 10.0, 0.0]})
    assert len(loc_dong_hop_le(df)) == 1

    # --- 3.5
    df = pd.DataFrame({"a": [1, 1, 2], "b": ["x", "x", "y"]})
    sach, so = bo_trung_lap(df)
    assert so == 1 and len(sach) == 2

    # --- 3.6
    df = pd.DataFrame({"dm": ["A", "A", "A", "B"], "gia": [100.0, np.nan, 200.0, 500.0]})
    assert list(dien_theo_nhom(df, "gia", "dm")) == [100.0, 150.0, 200.0, 500.0]

    # --- 3.7
    df = pd.DataFrame({"a": [1, 2, np.nan], "b": ["x", "y", "z"]})
    bc = bao_cao_chat_luong(df)
    assert list(bc.columns) == ["cot", "kieu", "so_thieu", "ty_le_thieu", "so_gia_tri"]
    assert bc.iloc[0]["cot"] == "a"

    print("Tat ca deu dung.")
