"""LOI GIAI - Bai tap 2, Phase 04."""

from __future__ import annotations

import numpy as np


# ===========================================================================
def confusion_matrix(y_that: np.ndarray, y_du_doan: np.ndarray) -> dict[str, int]:
    y_that = np.asarray(y_that)
    y_du_doan = np.asarray(y_du_doan)

    return {
        "tp": int(((y_that == 1) & (y_du_doan == 1)).sum()),
        "tn": int(((y_that == 0) & (y_du_doan == 0)).sum()),
        "fp": int(((y_that == 0) & (y_du_doan == 1)).sum()),
        "fn": int(((y_that == 1) & (y_du_doan == 0)).sum()),
    }


# MEO NHO TEN GOI - doc theo goc nhin cua MODEL:
#   Chu thu hai (P/N) = MODEL doan gi
#   Chu dau (True/False) = model doan DUNG hay SAI
#
#   False Positive = model noi "Positive" (co) nhung SAI  -> bao dong gia
#   False Negative = model noi "Negative" (khong) nhung SAI -> bo sot
#
# TAT CA metric phan loai deu duoc tinh tu 4 con so nay. Nam vung bang nay
# la nam vung toan bo chu de danh gia phan loai.
#
# LUU Y: tp + tn + fp + fn = tong so mau. Neu khong bang, ban co bug.


# ===========================================================================
def accuracy(y_that: np.ndarray, y_du_doan: np.ndarray) -> float:
    cm = confusion_matrix(y_that, y_du_doan)
    tong = cm["tp"] + cm["tn"] + cm["fp"] + cm["fn"]
    if tong == 0:
        return 0.0
    return (cm["tp"] + cm["tn"]) / tong


# ACCURACY LA CHI SO NGUY HIEM NHAT vi no de hieu nhat.
#
#   Du lieu gian lan the tin dung: 0.1% gian lan.
#   Model "moi giao dich deu sach" -> accuracy = 99.9%
#   Nghe nhu mot thanh tuu. Thuc te: vo dung hoan toan.
#
#   Trong bo du lieu churn cua chung ta (26% churn):
#       Model luon doan "khong churn" -> accuracy = 74%
#   Bat cu bao cao nao khoe accuracy ma khong noi ty le lop
#   deu dang che giau dieu gi do.
#
# CHI DUNG ACCURACY KHI:
#   - Cac lop can bang (khoang 40-60%), VA
#   - Hai loai sai co gia tri ngang nhau
#   Ca hai dieu kien hiem khi dung cung luc trong thuc te.


# ===========================================================================
def precision(y_that: np.ndarray, y_du_doan: np.ndarray) -> float:
    cm = confusion_matrix(y_that, y_du_doan)
    mau = cm["tp"] + cm["fp"]
    if mau == 0:
        return 0.0
    return cm["tp"] / mau


def recall(y_that: np.ndarray, y_du_doan: np.ndarray) -> float:
    cm = confusion_matrix(y_that, y_du_doan)
    mau = cm["tp"] + cm["fn"]
    if mau == 0:
        return 0.0
    return cm["tp"] / mau


# CACH NHO PHAN BIET - nhin vao MAU SO:
#
#   precision: tp / (tp + fp)   <- mau so la moi thu MODEL BAO la 1
#              "Trong nhung gi toi bao, bao nhieu la dung?"
#
#   recall:    tp / (tp + fn)   <- mau so la moi thu THAT SU la 1
#              "Trong nhung gi that su co, toi bat duoc bao nhieu?"
#
# HAI CACH GIAN LAN DE DAT DIEM CAO:
#
#   Precision = 1.0 de dat: chi bao "1" cho MOT mau ma ban chac chan nhat.
#              Precision hoan hao, recall gan 0. Vo dung.
#
#   Recall = 1.0 de dat: bao "1" cho TAT CA moi mau.
#              Recall hoan hao, precision = ty le lop duong. Vo dung.
#
#   Do la ly do KHONG BAO GIO bao cao mot minh mot chi so.
#   Luon bao cao ca cap, hoac dung F1 - nhung F1 che mat su danh doi
#   nen tot nhat van la bao cao ca hai.
#
# VI SAO KIEM TRA MAU SO = 0?
#   - precision: model khong bao ai la 1 -> 0/0. Tra ve 0.0 la quy uoc
#     (sklearn cung lam vay va in canh bao).
#   - recall: khong co mau duong tinh nao trong tap test -> tap test
#     cua ban co van de, hoac lop qua hiem. Day la tin hieu can kiem tra lai.


# ===========================================================================
def f1(y_that: np.ndarray, y_du_doan: np.ndarray) -> float:
    p = precision(y_that, y_du_doan)
    r = recall(y_that, y_du_doan)
    if p + r == 0:
        return 0.0
    return 2 * p * r / (p + r)


# VI SAO TRUNG BINH DIEU HOA?
#
#   So sanh hai cach tinh khi p=1.0, r=0.0:
#       Trung binh cong:   (1.0 + 0.0) / 2 = 0.50    <- nghe khong te lam
#       Trung binh dieu hoa: 2*1*0/(1+0)  = 0.00    <- dung: model vo dung
#
#   Trung binh dieu hoa luon GAN VOI SO NHO HON. No khong cho ban
#   "bu" mot chi so te bang mot chi so xuat sac.
#
#   Vai con so de cam nhan:
#       p=0.9, r=0.9  ->  F1 = 0.900
#       p=1.0, r=0.8  ->  F1 = 0.889   (thap hon du tong lon hon)
#       p=1.0, r=0.5  ->  F1 = 0.667
#       p=1.0, r=0.1  ->  F1 = 0.182
#
# F-BETA - khi hai loai sai KHONG ngang nhau:
#       F_beta = (1 + b^2) * p * r / (b^2 * p + r)
#
#       beta = 1    -> F1, can bang
#       beta = 2    -> F2, coi recall quan trong GAP DOI  (y te, an ninh)
#       beta = 0.5  -> F0.5, coi precision quan trong hon (loc spam)
#
# GIOI HAN CUA F1: no che mat su danh doi. Hai model cung F1 = 0.7
# co the la (p=0.9, r=0.57) hoac (p=0.57, r=0.9) - hai model rat khac nhau
# ve mat kinh doanh. LUON nhin ca p va r truoc khi rut gon thanh F1.


# ===========================================================================
def ap_dung_nguong(xac_suat: np.ndarray, nguong: float = 0.5) -> np.ndarray:
    return (np.asarray(xac_suat) >= nguong).astype(int)


# NGUONG 0.5 KHONG THIENG LIENG.
#   No chi la mac dinh cua .predict() trong sklearn.
#
#   Ha nguong (0.3):  bao "1" nhieu hon  -> recall TANG, precision GIAM
#   Nang nguong (0.7): bao "1" it hon    -> precision TANG, recall GIAM
#
# LUU Y KY THUAT: dung >= chu khong phai >.
#   Voi nguong 0.5 va xac suat dung 0.5, quy uoc chung la xep vao lop 1.
#   sklearn cung lam vay. Chi tiet nho nhung lam lech ket qua test.
#
# VI SAO GAN NHU LUON DUNG predict_proba THAY VI predict?
#   1. Chon duoc nguong theo bai toan
#   2. Xep hang duoc khach hang theo do rui ro (goi 100 khach rui ro nhat)
#   3. Tinh duoc chi phi ky vong
#   4. Ghep duoc nhieu model bang cach trung binh xac suat
#   .predict() vut bo het thong tin do de lay mot bit 0/1.


# ===========================================================================
def quet_nguong(
    y_that: np.ndarray, xac_suat: np.ndarray, cac_nguong: np.ndarray
) -> list[dict]:
    ket_qua = []
    for ng in cac_nguong:
        y_pred = ap_dung_nguong(xac_suat, ng)
        ket_qua.append(
            {
                "nguong": float(ng),
                "precision": precision(y_that, y_pred),
                "recall": recall(y_that, y_pred),
                "f1": f1(y_that, y_pred),
                "accuracy": accuracy(y_that, y_pred),
            }
        )
    return ket_qua


def nguong_tot_nhat(
    y_that: np.ndarray, xac_suat: np.ndarray, chi_so: str = "f1"
) -> float:
    cac_nguong = np.arange(0.05, 1.0, 0.05)
    bang = quet_nguong(y_that, xac_suat, cac_nguong)

    tot_nhat = max(bang, key=lambda d: (d[chi_so], -d["nguong"]))
    return round(tot_nhat["nguong"], 2)


# MEO `key=lambda d: (d[chi_so], -d["nguong"])`:
#   max() so sanh tuple theo thu tu tung phan tu.
#   - Uu tien chi so cao nhat
#   - Neu bang nhau, -nguong lon hon nghia la nguong NHO hon -> chon no
#   Nho vay ket qua on dinh, khong phu thuoc thu tu duyet.
#
# TOI DA HOA F1 CO PHAI LUON DUNG?
#   KHONG. F1 gia dinh precision va recall quan trong NGANG NHAU.
#   Trong thuc te dieu do hiem khi dung.
#
#   Cach chuyen nghiep hon: toi thieu hoa CHI PHI (ham 2.6 ben duoi).
#   Cach tot nhat: ve duong precision-recall theo nguong, dua cho nguoi
#   phu trach nghiep vu xem va de HO chon diem can bang.
#
# TRONG THUC TE, nguong nen duoc chon tren tap VALIDATION, khong phai test.
#   Chon nguong tren test la mot dang overfitting len tap test.


# ===========================================================================
def auc(y_that: np.ndarray, xac_suat: np.ndarray) -> float:
    y_that = np.asarray(y_that)
    xac_suat = np.asarray(xac_suat, dtype=float)

    p_duong = xac_suat[y_that == 1]
    p_am = xac_suat[y_that == 0]

    if len(p_duong) == 0 or len(p_am) == 0:
        return 0.5

    lon_hon = (p_duong[:, None] > p_am[None, :]).sum()
    bang_nhau = (p_duong[:, None] == p_am[None, :]).sum()

    return float((lon_hon + 0.5 * bang_nhau) / (len(p_duong) * len(p_am)))


# DINH NGHIA NAY DE HIEU HON "dien tich duoi duong ROC":
#   AUC = xac suat model cham cho mot mau duong tinh ngau nhien
#         diem CAO HON mot mau am tinh ngau nhien.
#
#   Hai dinh nghia hoan toan tuong duong ve mat toan hoc (day la
#   thong ke Mann-Whitney U), nhung cach nay de code va de giai thich
#   cho nguoi khong lam ky thuat hon nhieu.
#
# BROADCASTING p_duong[:, None] > p_am[None, :]:
#       p_duong[:, None]  shape (n_duong, 1)
#       p_am[None, :]     shape (1, n_am)
#       ket qua           shape (n_duong, n_am)   <- so sanh MOI CAP
#   Mot dong thay cho hai vong lap long nhau.
#
#   CANH BAO BO NHO: voi 100.000 mau moi lop, ma tran nay co 10 ty phan tu.
#   Voi du lieu lon, dung thuat toan dua tren sap xep (O(n log n)) nhu
#   sklearn lam. Bai tap nay uu tien de hieu hon la toi uu.
#
# VI SAO CONG 0.5 CHO CAC CAP BANG NHAU?
#   Diem bang nhau nghia la model KHONG PHAN BIET duoc hai mau do
#   - tuong duong tung dong xu. Cong 0.5 phan anh dung dieu do.
#   Neu bo qua, model tra ve toan hang so se co AUC = 0 thay vi 0.5.
#
# DOC AUC:
#   1.0   hoan hao
#   0.85  tot
#   0.70  tam duoc
#   0.5   doan mo
#   <0.5  te hon doan mo - thuong do DAO NHAN. Dao lai la duoc AUC = 1-x.
#
# UU DIEM LON NHAT: AUC KHONG phu thuoc nguong. No do chat luong cua
#   XAC SUAT, nen so sanh giua cac model rat cong bang.
#
# NHUOC DIEM: khi du lieu cuc ky mat can bang (<1% lop duong), AUC van
#   dep mot cach gay hieu nham vi phan lon cac cap so sanh la "de".
#   Luc do dung PR-AUC (average precision) - no tap trung vao lop hiem.


# ===========================================================================
def chi_phi_kinh_doanh(
    y_that: np.ndarray,
    y_du_doan: np.ndarray,
    chi_phi_fp: float,
    chi_phi_fn: float,
) -> float:
    cm = confusion_matrix(y_that, y_du_doan)
    return cm["fp"] * chi_phi_fp + cm["fn"] * chi_phi_fn


# DAY LA HAM QUAN TRONG NHAT TRONG FILE NAY.
#
#   Moi metric phia tren deu la con so ky thuat. Ham nay doi chung
#   sang ngon ngu ma nguoi ra quyet dinh hieu duoc: TIEN.
#
# VI DU DAY DU - bai toan churn:
#       chi_phi_fp = 200_000     (goi khuyen mai cho khach khong dinh bo)
#       chi_phi_fn = 3_000_000   (mat han mot khach hang)
#
#   FN dat gap 15 lan FP. Nen ta CHAP NHAN bao nham nhieu de it bo sot:
#
#       Nguong 0.5:  fp=60,  fn=130  ->  60*0.2tr + 130*3tr = 402 trieu
#       Nguong 0.3:  fp=180, fn=70   ->  180*0.2tr + 70*3tr = 246 trieu
#       Nguong 0.2:  fp=340, fn=45   ->  340*0.2tr + 45*3tr = 203 trieu
#       Nguong 0.1:  fp=700, fn=25   ->  700*0.2tr + 25*3tr = 215 trieu
#
#   Nguong toi uu la khoang 0.2 - THAP HON nhieu so voi mac dinh 0.5,
#   va cung khac voi nguong toi da hoa F1.
#
# CACH LAM VIEC CHUYEN NGHIEP:
#   1. Hoi nguoi phu trach nghiep vu: mot FP ton bao nhieu? mot FN ton bao nhieu?
#      (Ho thuong chua bao gio duoc hoi cau nay va se phai suy nghi that.)
#   2. Quet nguong, tinh chi phi tai tung nguong
#   3. Trinh bay bang bieu do chi phi theo nguong
#   4. De HO chon diem can bang
#
#   Cach nay bien ban tu "nguoi lam model" thanh "nguoi giai bai toan
#   kinh doanh" - khac biet lon nhat giua junior va senior.
#
# MO RONG: co the them ca LOI ICH cua TP (giu duoc khach) va TN
# (khong ton gi). Luc do toi da hoa LOI NHUAN thay vi toi thieu hoa chi phi.


# ===========================================================================
if __name__ == "__main__":
    y_that = np.array([1, 1, 0, 0, 1])
    y_pred = np.array([1, 0, 0, 1, 1])

    assert confusion_matrix(y_that, y_pred) == {"tp": 2, "tn": 1, "fp": 1, "fn": 1}
    assert abs(precision(y_that, y_pred) - 2 / 3) < 1e-9
    assert abs(recall(y_that, y_pred) - 2 / 3) < 1e-9
    assert abs(f1(y_that, y_pred) - 2 / 3) < 1e-9
    assert accuracy(y_that, y_pred) == 0.6

    assert list(ap_dung_nguong(np.array([0.2, 0.6, 0.5]), 0.5)) == [0, 1, 1]

    assert abs(auc(np.array([0, 0, 1, 1]), np.array([0.1, 0.4, 0.35, 0.8])) - 0.75) < 1e-9
    assert auc(np.array([1, 1]), np.array([0.5, 0.9])) == 0.5      # chi mot lop

    assert chi_phi_kinh_doanh(y_that, y_pred, 200_000, 3_000_000) == 3_200_000

    # Nguong tot nhat tren du lieu co tin hieu ro
    rng = np.random.default_rng(0)
    yt = (rng.random(500) < 0.3).astype(int)
    p = np.clip(rng.normal(np.where(yt == 1, 0.7, 0.3), 0.15), 0, 1)
    ng = nguong_tot_nhat(yt, p, "f1")
    assert 0.05 <= ng <= 0.95

    bang = quet_nguong(yt, p, np.array([0.3, 0.5, 0.7]))
    assert len(bang) == 3
    assert bang[0]["recall"] >= bang[2]["recall"], "Nguong thap phai cho recall cao hon"

    print("Tat ca deu dung.")
