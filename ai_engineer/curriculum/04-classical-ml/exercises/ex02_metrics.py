"""BAI TAP 2 - Metrics phan loai (Tuan 10).

Cham diem:  pytest tests/phase04/test_ex02.py -v
Loi giai:   curriculum/04-classical-ml/solutions/ex02_metrics.py

DAY LA BAI TAP QUAN TRONG NHAT PHASE 04.

Ban se tu viet moi metric phan loai. Sau bai nay, khi doc bao cao
"precision 0.76, recall 0.59" ban se biet chinh xac tung con so nghia la gi
va no danh doi cai gi.

Ky nang nay quay lai NGUYEN VEN o Phase 07: eval cho LLM cung dung
chinh nhung khai niem nay.

CHI DUNG numpy. Khong import sklearn.

QUY UOC: nhan 1 = "duong tinh" (lop ta quan tam, vi du: khach churn)
         nhan 0 = "am tinh"
"""

from __future__ import annotations

import numpy as np


# ===========================================================================
#  2.1 - Confusion matrix
# ===========================================================================
def confusion_matrix(y_that: np.ndarray, y_du_doan: np.ndarray) -> dict[str, int]:
    """Dem 4 truong hop co ban.

    Tra ve dict co dung 4 khoa: "tp", "tn", "fp", "fn"

        tp - du doan 1, that su 1   (bat dung)
        tn - du doan 0, that su 0   (bo qua dung)
        fp - du doan 1, that su 0   (BAO DONG GIA)
        fn - du doan 0, that su 1   (BO SOT)

    Vi du:
        y_that    = [1, 1, 0, 0, 1]
        y_du_doan = [1, 0, 0, 1, 1]
        -> {"tp": 2, "tn": 1, "fp": 1, "fn": 1}

    Goi y: dung phep & tren mang boolean roi .sum()
    """
    # TODO
    pass


# ===========================================================================
#  2.2 - Cac metric co ban
# ===========================================================================
def accuracy(y_that: np.ndarray, y_du_doan: np.ndarray) -> float:
    """Ty le du doan dung tren TONG SO.

        accuracy = (tp + tn) / tong

    Vi du: accuracy([1,1,0,0], [1,0,0,0])  ->  0.75
    """
    # TODO
    pass


def precision(y_that: np.ndarray, y_du_doan: np.ndarray) -> float:
    """Trong so ta BAO la 1, bao nhieu % dung?

        precision = tp / (tp + fp)

    Neu khong bao ai la 1 (tp + fp = 0) thi tra ve 0.0.

    Vi du: y_that=[1,1,0,0,1], y_du_doan=[1,0,0,1,1]
           tp=2, fp=1  ->  2/3 = 0.667
    """
    # TODO
    pass


def recall(y_that: np.ndarray, y_du_doan: np.ndarray) -> float:
    """Trong so THAT SU la 1, ta bat duoc bao nhieu %?

        recall = tp / (tp + fn)

    Neu khong co ai that su la 1 (tp + fn = 0) thi tra ve 0.0.

    Vi du: cung du lieu tren, tp=2, fn=1  ->  2/3 = 0.667
    """
    # TODO
    pass


def f1(y_that: np.ndarray, y_du_doan: np.ndarray) -> float:
    """Trung binh DIEU HOA cua precision va recall.

        f1 = 2 * (p * r) / (p + r)

    Neu p + r = 0 thi tra ve 0.0.

    VI SAO TRUNG BINH DIEU HOA MA KHONG PHAI TRUNG BINH CONG?
        p=1.0, r=0.0  ->  trung binh cong = 0.50  (nghe khong te)
                      ->  f1              = 0.00  (dung: model vo dung)
        Trung binh dieu hoa PHAT NANG khi mot trong hai qua thap.
    """
    # TODO
    pass


# ===========================================================================
#  2.3 - Ap dung nguong
# ===========================================================================
def ap_dung_nguong(xac_suat: np.ndarray, nguong: float = 0.5) -> np.ndarray:
    """Doi xac suat thanh nhan 0/1 theo nguong.

        xac_suat >= nguong  ->  1
        nguoc lai           ->  0

    Tra ve mang so nguyen (dtype int).

    Vi du: ap_dung_nguong([0.2, 0.6, 0.5], 0.5)  ->  [0, 1, 1]
    """
    # TODO
    pass


# ===========================================================================
#  2.4 - Quet nguong
# ===========================================================================
def quet_nguong(
    y_that: np.ndarray, xac_suat: np.ndarray, cac_nguong: np.ndarray
) -> list[dict]:
    """Tinh metrics tai NHIEU nguong khac nhau.

    Tra ve list dict, moi dict co 5 khoa:
        "nguong", "precision", "recall", "f1", "accuracy"

    Thu tu ket qua giong thu tu cac_nguong dua vao.

    Day la cach ban CHON nguong trong thuc te: quet het roi nhin
    xem nguong nao phu hop voi bai toan kinh doanh.
    """
    # TODO
    pass


def nguong_tot_nhat(
    y_that: np.ndarray, xac_suat: np.ndarray, chi_so: str = "f1"
) -> float:
    """Tim nguong cho `chi_so` cao nhat.

    Quet cac nguong tu 0.05 den 0.95, buoc 0.05 (dung np.arange).
    Neu nhieu nguong cho cung ket qua, tra ve nguong NHO NHAT.

    chi_so co the la "f1", "precision", "recall", hoac "accuracy".

    Tra ve nguong (float), lam tron 2 chu so thap phan.
    """
    # TODO
    pass


# ===========================================================================
#  2.5 - ROC-AUC
# ===========================================================================
def auc(y_that: np.ndarray, xac_suat: np.ndarray) -> float:
    """Tinh dien tich duoi duong ROC.

    DINH NGHIA DE HIEU NHAT (va de code nhat):
        Lay ngau nhien MOT mau duong tinh va MOT mau am tinh.
        AUC = xac suat model cham diem mau duong tinh CAO HON.
        Neu bang diem thi tinh 0.5.

    CACH TINH TRUC TIEP:
        1. Lay tat ca xac suat cua mau duong tinh -> mang p_duong
        2. Lay tat ca xac suat cua mau am tinh    -> mang p_am
        3. Dem so cap (i, j) ma p_duong[i] > p_am[j], cong 0.5 cho moi cap bang nhau
        4. Chia cho tong so cap = len(p_duong) * len(p_am)

    Neu chi co MOT lop (khong co mau duong hoac khong co mau am)
    thi tra ve 0.5.

    Vi du:
        y_that   = [0, 0, 1, 1]
        xac_suat = [0.1, 0.4, 0.35, 0.8]
        -> AUC = 0.75

    Goi y: co the dung broadcasting de so sanh moi cap cung luc:
        p_duong[:, None] > p_am[None, :]
    """
    # TODO
    pass


# ===========================================================================
#  2.6 - Chi phi kinh doanh
# ===========================================================================
def chi_phi_kinh_doanh(
    y_that: np.ndarray,
    y_du_doan: np.ndarray,
    chi_phi_fp: float,
    chi_phi_fn: float,
) -> float:
    """Tinh TONG CHI PHI cua model bang tien.

        chi phi = fp * chi_phi_fp + fn * chi_phi_fn

    VI SAO HAM NAY QUAN TRONG NHAT TRONG FILE?
        Sep cua ban khong hieu F1-score. Sep hieu TIEN.

        Vi du bai toan churn:
            chi_phi_fp = 200_000   (khuyen mai nham cho khach khong dinh bo)
            chi_phi_fn = 3_000_000 (mat han mot khach hang)

        FN dat gap 15 lan FP -> nen ha nguong de tang recall,
        chap nhan bao nham nhieu hon.

        Day la cach chon nguong DUNG DAN nhat: khong phai toi da hoa F1,
        ma toi thieu hoa chi phi.
    """
    # TODO
    pass


# ===========================================================================
if __name__ == "__main__":
    rng = np.random.default_rng(42)
    n = 1000
    y_that = (rng.random(n) < 0.26).astype(int)
    xac_suat = np.clip(rng.normal(np.where(y_that == 1, 0.62, 0.35), 0.16), 0, 1)

    y_pred = ap_dung_nguong(xac_suat, 0.5)
    if y_pred is None:
        print("Chua lam ap_dung_nguong.")
        raise SystemExit(0)

    print(f"  Ty le lop duong tinh : {y_that.mean():.1%}\n")
    print(f"  confusion  = {confusion_matrix(y_that, y_pred)}")
    print(f"  accuracy   = {accuracy(y_that, y_pred):.4f}")
    print(f"  precision  = {precision(y_that, y_pred):.4f}")
    print(f"  recall     = {recall(y_that, y_pred):.4f}")
    print(f"  f1         = {f1(y_that, y_pred):.4f}")
    print(f"  auc        = {auc(y_that, xac_suat):.4f}")
    print()
    print(f"  Baseline (luon doan 0) accuracy = {1 - y_that.mean():.4f}  <- so sanh voi tren!")
