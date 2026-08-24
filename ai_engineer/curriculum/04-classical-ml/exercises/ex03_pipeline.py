"""BAI TAP 3 - Pipeline, leakage, cross-validation (Tuan 11).

Cham diem:  pytest tests/phase04/test_ex03.py -v
Loi giai:   curriculum/04-classical-ml/solutions/ex03_pipeline.py

Bai nay DUNG sklearn (khac hai bai truoc). Can cai truoc:
    pip install -e ".[ml]"

Muc tieu: viet code ML dung chuan cong nghiep - khong ro ri du lieu,
danh gia on dinh, so sanh model cong bang.
"""

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
#  3.1 - Tach cot theo kieu du lieu
# ===========================================================================
def tach_cot_theo_kieu(X: pd.DataFrame) -> tuple[list[str], list[str]]:
    """Tach ten cot thanh (cot_so, cot_chu).

    cot_so - cac cot co kieu SO (int, float)
    cot_chu - moi cot con lai (chuoi, hang muc)

    Ca hai list phai giu nguyen THU TU xuat hien trong X.

    Vi du:
        X co cot ["tuoi", "thanh_pho", "luong"]  (int, str, float)
        -> (["tuoi", "luong"], ["thanh_pho"])

    Goi y: pd.api.types.is_numeric_dtype(X[cot])
    """
    # TODO
    pass


# ===========================================================================
#  3.2 - Bo tien xu ly khong ro ri
# ===========================================================================
def tao_tien_xu_ly(cot_so: list[str], cot_chu: list[str]) -> ColumnTransformer:
    """Tao ColumnTransformer xu ly rieng cot so va cot chu.

    Voi COT SO - mot Pipeline hai buoc:
        1. SimpleImputer(strategy="median")   - dien gia tri thieu
        2. StandardScaler()                   - chuan hoa ve mean=0, std=1

    Voi COT CHU:
        OneHotEncoder(handle_unknown="ignore") - ma hoa one-hot

    Ten cac buoc trong ColumnTransformer phai la "so" va "chu".

    VI SAO handle_unknown="ignore" QUAN TRONG?
        Tap test co the chua gia tri hang muc chua tung xuat hien o train
        (vi du mot quan moi). Mac dinh sklearn se NEM LOI va sap chuong trinh.
        "ignore" ma hoa chung thanh toan so 0 - khong ly tuong nhung
        khong lam sap he thong dang chay.

    Goi y:
        ColumnTransformer([
            ("so",  Pipeline([...]), cot_so),
            ("chu", OneHotEncoder(...), cot_chu),
        ])
    """
    # TODO
    pass


# ===========================================================================
#  3.3 - Pipeline hoan chinh
# ===========================================================================
def tao_pipeline(
    cot_so: list[str], cot_chu: list[str], model: BaseEstimator
) -> Pipeline:
    """Ghep tien xu ly va model thanh mot Pipeline.

    Ten cac buoc phai la "tien_xu_ly" va "model".

    VI SAO PIPELINE CHONG DUOC LEAKAGE?
        Khi goi pipeline.fit(X_train, y_train):
            - imputer hoc median CHI tu X_train
            - scaler hoc mean/std CHI tu X_train
            - encoder hoc danh sach hang muc CHI tu X_train
        Khi goi pipeline.predict(X_test):
            - moi buoc chi TRANSFORM, khong fit lai
        Ban khong the vo tinh fit tren test duoc nua.

        Quan trong hon: khi dung voi cross-validation, MOI FOLD tu tien
        xu ly rieng. Neu tien xu ly thu cong truoc CV, moi fold deu
        "nhin thay" du lieu cua cac fold khac -> leakage tinh vi.
    """
    # TODO
    pass


# ===========================================================================
#  3.4 - Danh gia bang cross-validation
# ===========================================================================
def danh_gia_cv(
    pipeline: Pipeline,
    X: pd.DataFrame,
    y: pd.Series,
    so_fold: int = 5,
    scoring: str = "roc_auc",
) -> dict[str, float]:
    """Danh gia pipeline bang StratifiedKFold cross-validation.

    Tra ve dict co dung 4 khoa:
        "mean"  - diem trung binh cua cac fold
        "std"   - do lech chuan
        "min"   - diem thap nhat
        "max"   - diem cao nhat

    Yeu cau:
        - Dung StratifiedKFold(n_splits=so_fold, shuffle=True, random_state=42)
        - Moi gia tri lam tron 4 chu so thap phan

    VI SAO PHAI XEM CA std?
        "AUC = 0.85 +- 0.02"  -> model on dinh, tin duoc
        "AUC = 0.85 +- 0.12"  -> diem so phan lon do may rui, KHONG tin duoc
        Bao cao chi co mean la bao cao thieu mot nua su that.
    """
    # TODO
    pass


# ===========================================================================
#  3.5 - Phat hien dac trung ro ri  <- BAI QUAN TRONG NHAT
# ===========================================================================
def tim_dac_trung_ro_ri(
    X: pd.DataFrame, y: pd.Series, nguong_auc: float = 0.9
) -> list[str]:
    """Tim cac dac trung DANG NGHI la bi ro ri (data leakage).

    Y TUONG:
        Neu CHI DUNG MOT dac trung ma da du doan duoc gan nhu hoan hao,
        dac trung do rat dang nghi - no co the chua thong tin ma thuc te
        ban chua co tai thoi diem du doan.

    CACH LAM cho tung cot:
        1. Tao pipeline chi voi DUY NHAT cot do + LogisticRegression(max_iter=1000)
        2. Danh gia bang cross-validation 3 fold, scoring="roc_auc"
        3. Neu diem trung binh >= nguong_auc thi cot do DANG NGHI

    Tra ve list ten cot dang nghi, sap GIAM DAN theo diem AUC.

    LUU Y: day la cong cu SANG LOC, khong phai ket luan.
        Mot dac trung co AUC cao co the that su la dac trung tot.
        Sau khi co danh sach, ban PHAI tu hoi voi tung cot:
            "Luc du doan THAT, toi da co cot nay chua?"
        Do moi la cau tra loi cuoi cung.

    Goi y: dung lai tach_cot_theo_kieu, tao_tien_xu_ly, tao_pipeline
           va danh_gia_cv ban vua viet, voi X[[cot]].
    """
    # TODO
    pass


# ===========================================================================
#  3.6 - So sanh nhieu model
# ===========================================================================
def so_sanh_model(
    cac_model: dict[str, BaseEstimator],
    X: pd.DataFrame,
    y: pd.Series,
    so_fold: int = 5,
) -> pd.DataFrame:
    """So sanh nhieu model tren CUNG mot cach chia du lieu.

    cac_model - dict {ten_model: doi_tuong_model}

    Tra ve DataFrame co dung 4 cot, theo thu tu:
        "model", "auc_mean", "auc_std", "auc_min"

    Sap GIAM DAN theo auc_mean, index danh so lai tu 0.

    VI SAO PHAI DUNG CUNG CACH CHIA?
        Neu moi model duoc danh gia tren mot cach chia khac nhau,
        chenh lech co the chi do may rui cua lan chia chu khong phai
        do model tot hon. StratifiedKFold voi random_state co dinh
        dam bao moi model gap DUNG cung cac fold.
    """
    # TODO
    pass


# ===========================================================================
if __name__ == "__main__":
    from pathlib import Path

    p = Path("data/churn.csv")
    if not p.exists():
        print("Chua co du lieu. Chay truoc:")
        print("    python curriculum/04-classical-ml/tao_du_lieu.py")
        raise SystemExit(1)

    df = pd.read_csv(p)
    X = df.drop(columns=["churn", "khach_id"])
    y = df["churn"]

    cot_so, cot_chu = tach_cot_theo_kieu(X)
    if cot_so is None:
        print("Chua lam tach_cot_theo_kieu.")
        raise SystemExit(0)

    print(f"  Cot so : {cot_so}")
    print(f"  Cot chu: {cot_chu}\n")

    pipe = tao_pipeline(cot_so, cot_chu, LogisticRegression(max_iter=1000))
    print(f"  CV voi TOAN BO dac trung : {danh_gia_cv(pipe, X, y)}")

    nghi_ngo = tim_dac_trung_ro_ri(X, y)
    print(f"\n  Dac trung DANG NGHI ro ri: {nghi_ngo}")

    if nghi_ngo:
        X_sach = X.drop(columns=nghi_ngo)
        cs, cc = tach_cot_theo_kieu(X_sach)
        pipe2 = tao_pipeline(cs, cc, LogisticRegression(max_iter=1000))
        print(f"  CV sau khi BO cot ro ri  : {danh_gia_cv(pipe2, X_sach, y)}")
        print("\n  -> Con so thu hai moi la hieu nang THAT ngoai doi.")
