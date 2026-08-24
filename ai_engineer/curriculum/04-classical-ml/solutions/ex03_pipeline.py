"""LOI GIAI - Bai tap 3, Phase 04."""

from __future__ import annotations

import numpy as np
import pandas as pd
from sklearn.base import BaseEstimator
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import StratifiedKFold, cross_val_score
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler


# ===========================================================================
def tach_cot_theo_kieu(X: pd.DataFrame) -> tuple[list[str], list[str]]:
    cot_so = [c for c in X.columns if pd.api.types.is_numeric_dtype(X[c])]
    cot_chu = [c for c in X.columns if c not in cot_so]
    return cot_so, cot_chu


# VI SAO KHONG DUNG X.select_dtypes("number").columns?
#   Dung duoc, va ngan hon. Nhung cach viet nay giu nguyen THU TU cot goc
#   va de doc hon voi nguoi moi.
#
# CANH BAO - KIEU SO KHONG PHAI LUC NAO CUNG LA BIEN SO:
#   Cot "ma_quan" chua 1, 2, 3 co kieu int nhung ban chat la HANG MUC.
#   Chuan hoa no thanh z-score la vo nghia, va model se hieu nham rang
#   "quan 3 gap ba lan quan 1".
#
#   Nguoc lai, cot "so_luong" luu duoi dang chuoi "12" lai la bien SO.
#
#   Ham tu dong nay chi la diem xuat phat. Trong du an that, ban PHAI
#   nhin qua danh sach va sua tay:
#       cot_so.remove("ma_quan")
#       cot_chu.append("ma_quan")
#
#   Mot dau hieu de nhan ra: cot so co RAT IT gia tri khac nhau
#   (nunique < 15) thuong la hang muc bi ma hoa thanh so.


# ===========================================================================
def tao_tien_xu_ly(cot_so: list[str], cot_chu: list[str]) -> ColumnTransformer:
    return ColumnTransformer(
        [
            (
                "so",
                Pipeline(
                    [
                        ("dien", SimpleImputer(strategy="median")),
                        ("chuan_hoa", StandardScaler()),
                    ]
                ),
                cot_so,
            ),
            ("chu", OneHotEncoder(handle_unknown="ignore"), cot_chu),
        ]
    )


# THU TU HAI BUOC VOI COT SO QUAN TRONG:
#   Phai DIEN gia tri thieu TRUOC roi moi CHUAN HOA.
#   StandardScaler khong xu ly duoc NaN - no se nem loi.
#
# VI SAO median CHU KHONG PHAI mean?
#   Median ben vung voi ngoai lai. Neu cot thu nhap co mot gia tri 10 ty,
#   mean bi keo len rat cao va ban dien con so do vao moi o trong.
#
# VI SAO PHAI CHUAN HOA?
#   Voi cac model TUYEN TINH (Logistic/Linear Regression, SVM) va cac model
#   dua tren KHOANG CACH (KNN, K-means): bat buoc. Khong chuan hoa thi cot
#   thang do lon ap dao moi thu.
#
#   Voi CAY va ENSEMBLE (Decision Tree, Random Forest, XGBoost): KHONG can.
#   Chung chi so nguong nen bat bien voi thang do. Chuan hoa khong hai gi,
#   chi la thua mot buoc tinh toan.
#
# ONE-HOT ENCODING lam gi?
#   Cot "quan" co 6 gia tri -> thanh 6 cot 0/1:
#       quan          quan_Q1  quan_Q3  quan_Q7  ...
#       "Quan 1"  ->     1        0        0
#       "Quan 7"  ->     0        0        1
#
#   VI SAO KHONG MA HOA THANH SO (Q1=1, Q3=2, Q7=3)?
#   Vi model se hieu nham rang co THU TU va KHOANG CACH:
#   "Quan 7 lon hon Quan 1 ba lan", "Q3 nam giua Q1 va Q7".
#   Voi hang muc khong co thu tu, dieu do sai hoan toan.
#
#   NGOAI LE: neu hang muc CO thu tu that su (Kem < Trung binh < Kha < Gioi)
#   thi ma hoa thanh so lai dung, va con tot hon one-hot.
#   Dung OrdinalEncoder voi thu tu chi dinh ro.
#
# handle_unknown="ignore" - QUAN TRONG TRONG SAN XUAT:
#   Thang sau xuat hien mot quan moi chua tung co trong tap train.
#   Mac dinh sklearn NEM LOI va API cua ban tra ve 500.
#   Voi "ignore", hang muc la duoc ma hoa thanh toan so 0 - model van
#   du doan duoc (kem chinh xac hon, nhung he thong khong sap).
#
# LUU Y VE SO CHIEU: one-hot tren cot co 1000 gia tri khac nhau tao ra
#   1000 cot moi. Voi hang muc nhieu gia tri, can nhac:
#     - Gop cac gia tri hiem thanh "Khac"
#     - Target encoding (nhung rat de gay leakage, phai lam trong CV)


# ===========================================================================
def tao_pipeline(
    cot_so: list[str], cot_chu: list[str], model: BaseEstimator
) -> Pipeline:
    return Pipeline(
        [
            ("tien_xu_ly", tao_tien_xu_ly(cot_so, cot_chu)),
            ("model", model),
        ]
    )


# PIPELINE KHONG PHAI DE "CHO DEP". Day la ba ly do that:
#
#   1. CHONG LEAKAGE TU DONG
#      Khong the vo tinh fit scaler tren tap test duoc nua.
#
#   2. HOAT DONG DUNG VOI CROSS-VALIDATION
#      Day la ly do quan trong nhat va tinh vi nhat.
#
#      Neu ban chuan hoa THU CONG truoc khi chay CV:
#          X_scaled = scaler.fit_transform(X)     # <- nhin thay TOAN BO X
#          cross_val_score(model, X_scaled, y)
#      thi trong moi fold, tap "test" cua fold do da gop phan tinh ra
#      mean/std -> diem CV cao hon thuc te.
#
#      Voi Pipeline, cross_val_score fit lai TOAN BO pipeline tren
#      phan train cua tung fold. Dung tuyet doi.
#
#   3. TRIEN KHAI CHI MOT DOI TUONG
#      joblib.dump(pipeline, "model.pkl") luu ca tien xu ly lan model.
#      Khi phuc vu, chi can pipeline.predict(du_lieu_tho) - khong the
#      quen mot buoc tien xu ly nao.
#
#      Loi "quen mot buoc tien xu ly khi trien khai" la mot trong nhung
#      loi pho bien nhat khi dua ML vao san xuat.
#
# TRUY CAP CAC BUOC BEN TRONG:
#       pipeline.named_steps["model"].coef_
#       pipeline.named_steps["tien_xu_ly"].get_feature_names_out()


# ===========================================================================
def danh_gia_cv(
    pipeline: Pipeline,
    X: pd.DataFrame,
    y: pd.Series,
    so_fold: int = 5,
    scoring: str = "roc_auc",
) -> dict[str, float]:
    cv = StratifiedKFold(n_splits=so_fold, shuffle=True, random_state=42)
    diem = cross_val_score(pipeline, X, y, cv=cv, scoring=scoring)

    return {
        "mean": round(float(diem.mean()), 4),
        "std": round(float(diem.std()), 4),
        "min": round(float(diem.min()), 4),
        "max": round(float(diem.max()), 4),
    }


# VI SAO StratifiedKFold CHU KHONG PHAI KFold?
#   KFold chia ngau nhien -> ty le lop trong tung fold co the lech nhieu.
#   Voi du lieu mat can bang, mot fold co the chi co 10% lop duong thay vi 26%
#   -> diem so cua fold do khong the so sanh voi cac fold khac.
#   StratifiedKFold giu nguyen ty le lop trong MOI fold.
#
#   Voi bai toan PHAN LOAI, gan nhu luon dung StratifiedKFold.
#
# shuffle=True CAN THIET vi du lieu that thuong co thu tu an
#   (sap theo ngay, theo ma khach). Khong xao tron thi fold 1 co the
#   toan khach cu, fold 5 toan khach moi.
#
# VI SAO TRA VE CA min VA max?
#   "AUC = 0.85 +- 0.02" van chua du. Nhin min/max ban thay:
#       min=0.83, max=0.87  -> on dinh that
#       min=0.62, max=0.95  -> mot fold hong han, phai di tim hieu vi sao
#   Fold co diem thap bat thuong thuong lo ra van de ve du lieu.
#
# CHON so_fold BAO NHIEU?
#   5 hoac 10 la chuan. Nhieu fold hon -> uoc luong chinh xac hon nhung
#   cham hon (phai train nhieu lan).
#   Voi du lieu rat it (<200 dong), dung Leave-One-Out (so_fold = n).
#
# CANH BAO VOI CHUOI THOI GIAN:
#   TUYET DOI khong dung KFold thong thuong. Xao tron khien model train
#   tren du lieu tuong lai roi test tren qua khu.
#   Dung TimeSeriesSplit - no chi cho phep train tren du lieu TRUOC diem test.


# ===========================================================================
def tim_dac_trung_ro_ri(
    X: pd.DataFrame, y: pd.Series, nguong_auc: float = 0.9
) -> list[str]:
    ket_qua = []

    for cot in X.columns:
        X_mot = X[[cot]]
        cot_so, cot_chu = tach_cot_theo_kieu(X_mot)
        pipe = tao_pipeline(cot_so, cot_chu, LogisticRegression(max_iter=1000))

        diem = danh_gia_cv(pipe, X_mot, y, so_fold=3, scoring="roc_auc")
        if diem["mean"] >= nguong_auc:
            ket_qua.append((cot, diem["mean"]))

    ket_qua.sort(key=lambda x: -x[1])
    return [cot for cot, _ in ket_qua]


# DAY LA CONG CU SANG LOC LEAKAGE DON GIAN MA HIEU QUA BAT NGO.
#
#   Y tuong: mot dac trung DUY NHAT ma du doan duoc gan nhu hoan hao
#   thi rat dang nghi. Trong doi that, khong co bien nao vua re vua
#   du doan duoc moi thu - neu co, cong ty da khong can thue ban.
#
# TREN BO DU LIEU CHURN CUA CHUNG TA:
#       da_goi_tong_dai_huy  ->  AUC ~0.92 khi dung MOT MINH
#   Trong khi toan bo cac dac trung con lai gop lai chi dat ~0.79.
#   Mot cot le manh hon ca phan con lai cong lai - do la co xanh.
#
# NHUNG DAY CHI LA SANG LOC, KHONG PHAI KET LUAN:
#
#   Co the DUONG TINH GIA: mot dac trung that su rat manh.
#     Vi du du doan "khach co mua goi premium khong" thi cot
#     "thu nhap" co the co AUC cao ma hoan toan hop le.
#
#   Co the AM TINH GIA: leakage phan tan tren nhieu cot, khong cot nao
#     mot minh vuot nguong. Vi du hai cot cong lai moi lo dap an.
#
# BA CAU HOI PHAI TU TRA LOI cho moi cot dang nghi:
#   1. Cot nay duoc GHI NHAN LUC NAO? Truoc hay sau su kien can du doan?
#   2. Luc chay model THAT SU, toi da co gia tri nay chua?
#   3. Cot nay co duoc TAO RA TU chinh dap an khong?
#
#   Cau 1 la cau quyet dinh. `da_goi_tong_dai_huy` duoc ghi nhan SAU KHI
#   khach quyet dinh huy - nen khi ta can du doan (truoc do), no chua ton tai.
#
# CAC CACH PHAT HIEN LEAKAGE KHAC:
#   - Nhin feature_importances_: mot cot chiem >50% la dau hieu do
#   - Ket qua tot bat thuong so voi ky vong nghiep vu
#   - Tuong quan cua dac trung voi nhan gan 1.0
#   - HOI NGUOI HIEU NGHIEP VU ve tung cot - cach hieu qua nhat


# ===========================================================================
def so_sanh_model(
    cac_model: dict[str, BaseEstimator],
    X: pd.DataFrame,
    y: pd.Series,
    so_fold: int = 5,
) -> pd.DataFrame:
    cot_so, cot_chu = tach_cot_theo_kieu(X)

    dong = []
    for ten, model in cac_model.items():
        pipe = tao_pipeline(cot_so, cot_chu, model)
        d = danh_gia_cv(pipe, X, y, so_fold=so_fold, scoring="roc_auc")
        dong.append(
            {"model": ten, "auc_mean": d["mean"], "auc_std": d["std"], "auc_min": d["min"]}
        )

    return (
        pd.DataFrame(dong)
        .sort_values("auc_mean", ascending=False)
        .reset_index(drop=True)
    )


# QUY TRINH SO SANH MODEL DUNG DAN:
#
#   1. LUON co BASELINE trong danh sach
#          DummyClassifier(strategy="most_frequent")
#      Neu model phuc tap khong hon baseline dang ke, dung dua vao san xuat.
#
#   2. Cung mot cach chia du lieu cho moi model (random_state co dinh)
#
#   3. So sanh co tinh den DO LECH CHUAN:
#          Model A: 0.851 +- 0.03
#          Model B: 0.845 +- 0.03
#      Chenh lech 0.006 nho hon do lech chuan -> HAI MODEL NHU NHAU.
#      Chon cai DON GIAN HON. Day la loi rat pho bien: nguoi ta chon
#      model phuc tap hon vi hon 0.3% ma khong nhin std.
#
#   4. Ngoai AUC, con phai can nhac:
#          - Thoi gian train va thoi gian du doan
#          - Kha nang giai thich cho nguoi dung nghiep vu
#          - Do phuc tap khi trien khai va bao tri
#          - Do on dinh khi du lieu thay doi
#
#      Trong san xuat, mot Logistic Regression 0.84 giai thich duoc
#      thuong TOT HON mot XGBoost 0.86 khong ai hieu.
#      "Vi sao khach nay bi tu choi vay?" la cau hoi phai tra loi duoc,
#      doi khi con la yeu cau phap ly.
#
# THU TU THU MODEL NEN LA:
#   1. Baseline (Dummy)
#   2. Logistic/Linear Regression        <- don gian, giai thich duoc
#   3. Random Forest                     <- manh, it phai chinh
#   4. Gradient Boosting (XGBoost/LGBM)  <- manh nhat voi du lieu bang
#   Chi di tiep khi buoc truoc that su khong du.


# ===========================================================================
if __name__ == "__main__":
    from pathlib import Path

    from sklearn.dummy import DummyClassifier
    from sklearn.ensemble import RandomForestClassifier

    p = Path("data/churn.csv")
    if not p.exists():
        print("Chay truoc: python curriculum/04-classical-ml/tao_du_lieu.py")
        raise SystemExit(1)

    df = pd.read_csv(p)
    X = df.drop(columns=["churn", "khach_id"])
    y = df["churn"]

    cot_so, cot_chu = tach_cot_theo_kieu(X)
    assert "tuoi" in cot_so and "loai_hop_dong" in cot_chu

    pipe = tao_pipeline(cot_so, cot_chu, LogisticRegression(max_iter=1000))
    co_ro_ri = danh_gia_cv(pipe, X, y)
    print(f"  CV voi TOAN BO dac trung : {co_ro_ri}")

    nghi_ngo = tim_dac_trung_ro_ri(X, y)
    print(f"  Dac trung DANG NGHI      : {nghi_ngo}")
    assert "da_goi_tong_dai_huy" in nghi_ngo, "Phai phat hien duoc cot ro ri"

    X_sach = X.drop(columns=nghi_ngo)
    cs, cc = tach_cot_theo_kieu(X_sach)
    khong_ro_ri = danh_gia_cv(tao_pipeline(cs, cc, LogisticRegression(max_iter=1000)), X_sach, y)
    print(f"  CV sau khi BO cot ro ri  : {khong_ro_ri}")
    assert khong_ro_ri["mean"] < co_ro_ri["mean"]

    print("\n  So sanh model (tren du lieu SACH):")
    bang = so_sanh_model(
        {
            "Baseline": DummyClassifier(strategy="most_frequent"),
            "LogisticRegression": LogisticRegression(max_iter=1000),
            "RandomForest": RandomForestClassifier(n_estimators=100, random_state=42),
        },
        X_sach,
        y,
        so_fold=3,
    )
    print(bang.to_string(index=False))

    print("\nTat ca deu dung.")
