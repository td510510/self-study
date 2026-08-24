"""LOI GIAI - Bai tap 1, Phase 04."""

from __future__ import annotations

import numpy as np


# ===========================================================================
def chia_train_test(
    X: np.ndarray, y: np.ndarray, ty_le_test: float = 0.2, seed: int = 42
) -> tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
    rng = np.random.default_rng(seed)
    chi_so = rng.permutation(len(X))

    n_test = int(len(X) * ty_le_test)
    cs_test, cs_train = chi_so[:n_test], chi_so[n_test:]

    return X[cs_train], X[cs_test], y[cs_train], y[cs_test]


# VI SAO PHAI XAO TRON?
#   Du lieu that hau nhu luon co thu tu an: sap theo ngay, theo ma khach,
#   theo nhom da nhap lieu. Neu cat thang 20% cuoi lam tap test:
#       - Test co the toan du lieu thang 12 -> khong dai dien cho ca nam
#       - Test co the toan mot loai khach hang
#   Ket qua danh gia se sai lech nghiem trong.
#
# VI SAO DUNG CHI SO ma khong xao tron truc tiep X va y?
#   Vi X va y phai duoc xao tron THEO CUNG MOT THU TU. Neu xao tron rieng,
#   nhan cua mau i se gan vao dac trung cua mau j -> du lieu vo nghia.
#   Tao mot mang chi so roi dung chung cho ca hai la cach an toan.
#
# VI SAO CAN seed?
#   Khong co seed, moi lan chay ban duoc mot tap test khac -> diem so
#   nhay len xuong va ban khong biet cai tien cua minh co that khong.
#   Trong nghien cuu, khong co seed nghia la ket qua khong tai lap duoc.
#
# NGOAI LE QUAN TRONG - DU LIEU CHUOI THOI GIAN:
#   Voi du lieu theo thoi gian, TUYET DOI khong xao tron. Phai chia theo
#   moc thoi gian: train tren qua khu, test tren tuong lai. Xao tron
#   khien model "nhin thay tuong lai" -> mot dang data leakage.
#
# VOI PHAN LOAI, sklearn con co stratify de giu ty le lop trong moi tap.
#   Bai tap nay khong yeu cau, nhung ban se dung no o Tuan 10.


# ===========================================================================
def mae(y_that: np.ndarray, y_du_doan: np.ndarray) -> float:
    return float(np.mean(np.abs(y_that - y_du_doan)))


def rmse(y_that: np.ndarray, y_du_doan: np.ndarray) -> float:
    return float(np.sqrt(np.mean((y_that - y_du_doan) ** 2)))


# MAE hay RMSE - CHON CAI NAO?
#
#   Vi du hai model, cung 4 du doan:
#       Model A sai deu:    [2, 2, 2, 2]   -> MAE = 2.0   RMSE = 2.0
#       Model B sai lech:   [0, 0, 0, 8]   -> MAE = 2.0   RMSE = 4.0
#
#   MAE noi hai model NHU NHAU. RMSE noi model A TOT HON.
#   Ai dung? Tuy bai toan:
#
#     - Du bao ton kho: sai 8 don vi mot lan la tham hoa (het hang hoac
#       ton kho chet). Chon RMSE - no phat nang truong hop do.
#
#     - Du doan thoi gian giao hang: sai deu 2 phut moi don kho chiu hon
#       la dung het tru mot don sai 8 phut. Chon MAE.
#
#   RMSE con nhay cam voi NGOAI LAI: mot du doan sai cuc lon keo RMSE len
#   rat cao. Neu du lieu co ngoai lai ma ban khong quan tam chung,
#   MAE phan anh trung thuc hon.
#
# LUON BAO CAO CUNG DON VI GOC:
#   "MAE = 1259" vo nghia neu nguoi nghe khong biet don vi.
#   "Sai so trung binh 1.26 ty tren can nha gia trung binh 6 ty (~21%)"
#   moi la mot cau bao cao dung nghia.


# ===========================================================================
def r2(y_that: np.ndarray, y_du_doan: np.ndarray) -> float:
    ss_res = np.sum((y_that - y_du_doan) ** 2)
    ss_tot = np.sum((y_that - np.mean(y_that)) ** 2)

    if ss_tot == 0:
        return 0.0
    return float(1 - ss_res / ss_tot)


# R^2 THUC RA LA MOT PHEP SO SANH:
#       SS_res = model cua ban sai bao nhieu
#       SS_tot = model NGU NGOC (luon doan trung binh) sai bao nhieu
#
#       R^2 = 1 - (sai so cua ban) / (sai so cua model ngu ngoc)
#
#   Nen R^2 = 0.85 doc la: "toi giam duoc 85% sai so so voi viec
#   luon doan gia tri trung binh".
#
# VI SAO R^2 CO THE AM?
#   Khi model cua ban con te hon ca doan trung binh. Nghe vo ly nhung
#   xay ra thuong xuyen khi:
#       - Model overfit nang tren tap train, gap test la loan
#       - Ban tinh R^2 tren tap test bang model fit tren phan bo khac han
#   R^2 am tren test luon la tin hieu bao dong.
#
# CANH BAO VE R^2:
#   1. R^2 LUON TANG khi them dac trung, ke ca dac trung ngau nhien vo nghia.
#      Do la ly do co "Adjusted R^2" - phat vi so luong dac trung.
#   2. R^2 cao KHONG co nghia model dung. Bo tu Anscombe (Phase 03) co
#      cung R^2 nhung bon hinh dang hoan toan khac nhau.
#   3. R^2 khong noi gi ve DO LON sai so. Luon bao cao kem MAE.
#
# VI SAO kiem tra ss_tot == 0?
#   Khi moi gia tri y giong het nhau (vi du toan bo tap test cung mot gia),
#   mau so bang 0 -> chia cho 0 -> nan hoac inf. Truong hop nay R^2
#   khong co y nghia, tra ve 0.0 la lua chon an toan.


# ===========================================================================
def baseline_trung_binh(y_train: np.ndarray, n_test: int) -> np.ndarray:
    return np.full(n_test, np.mean(y_train))


# BASELINE LA BUOC MA 90% NGUOI MOI BO QUA.
#
#   Truoc khi khoe "model cua toi dat R^2 = 0.85", phai tra loi duoc:
#   so voi cai gi?
#
#   Trong thuc te, rat nhieu du an ML tieu hang tram gio de xay model
#   chi hon baseline vai phan tram - va khong ai kiem tra dieu do
#   cho den khi trien khai xong.
#
# BASELINE CHO TUNG LOAI BAI TOAN:
#   Hoi quy    : luon doan mean (hoac median neu du lieu lech)
#   Phan loai  : luon doan lop pho bien nhat
#   Chuoi thoi gian: du doan = gia tri hom qua (goi la "naive forecast")
#                    Baseline nay manh bat ngo, rat nhieu model thua no.
#   Goi y (recommendation): goi y san pham ban chay nhat
#
# VI SAO DUNG mean CUA TRAIN, KHONG PHAI TEST?
#   Vi dung mean cua test la DATA LEAKAGE: luc du doan that, ban KHONG
#   biet trung binh cua du lieu tuong lai. Baseline phai tuan thu cung
#   mot luat choi voi model - neu khong, so sanh khong con cong bang.
#
# sklearn co san: DummyRegressor(strategy="mean") va
#                 DummyClassifier(strategy="most_frequent")


# ===========================================================================
def fit_hoi_quy(X: np.ndarray, y: np.ndarray) -> tuple[np.ndarray, float]:
    X_mo_rong = np.column_stack([np.ones(len(X)), X])
    theta, *_ = np.linalg.lstsq(X_mo_rong, y, rcond=None)
    return theta[1:], float(theta[0])


def du_doan(X: np.ndarray, w: np.ndarray, b: float) -> np.ndarray:
    return X @ w + b


# MEO "THEM COT SO 1":
#   Ta muon tim  y = w1*x1 + w2*x2 + b
#   Neu them mot cot toan so 1 vao X, cong thuc thanh:
#       y = w1*x1 + w2*x2 + b*1
#   -> b tro thanh mot he so binh thuong nhu w1, w2.
#   Nho vay chi can giai MOT he phuong trinh thay vi xu ly b rieng.
#
#   Cot nay goi la "bias term" hoac "intercept". Moi thu vien ML deu lam
#   dieu nay ben trong, chi la ban khong nhin thay.
#
# VI SAO KHONG DUNG GRADIENT DESCENT?
#   Hoi quy tuyen tinh co NGHIEM GIAI TICH (closed-form solution):
#       theta = (X^T X)^(-1) X^T y            <- goi la "normal equation"
#   Tinh mot phat ra dap an chinh xac, khong can lap.
#
#   np.linalg.lstsq giai bai toan nay bang phan ra SVD - on dinh so hon
#   nhieu so voi tu nghich dao ma tran (co the that bai khi cac cot
#   tuong quan cao - hien tuong "da cong tuyen").
#
#   KHI NAO VAN CAN GRADIENT DESCENT?
#     - Du lieu qua lon de nghich dao ma tran (hang trieu dac trung)
#     - Model phi tuyen: mang neural, hoi quy logistic
#     - Ham loss khong co nghiem giai tich
#   Do la vi sao Phase 05 quay lai voi gradient descent.
#
# KIEM TRA SHAPE:
#   X          (n_mau, n_dac_trung)
#   X_mo_rong  (n_mau, n_dac_trung + 1)
#   theta      (n_dac_trung + 1,)
#   theta[0]   = b
#   theta[1:]  = w, shape (n_dac_trung,)


# ===========================================================================
def chan_doan(diem_train: float, diem_test: float, nguong: float = 0.1) -> str:
    if diem_test > diem_train + nguong:
        return "Bat thuong"
    if diem_train - diem_test > nguong:
        return "Overfit"
    if diem_train < 0.5:
        return "Underfit"
    return "Tot"


# THU TU KIEM TRA QUAN TRONG:
#   "Bat thuong" phai xet TRUOC, vi mot model vua underfit vua co test
#   tot hon train thi van la dau hieu bug - can bao cai do truoc.
#
# GIAI THICH TUNG TRUONG HOP:
#
#   OVERFIT (train >> test)
#     Model hoc thuoc long ca nhieu trong tap train.
#     Chua bang, theo thu tu nen thu:
#       1. Them DU LIEU  - cach hieu qua nhat, nhung thuong khong co san
#       2. Don gian hoa model (giam do sau cay, giam so dac trung)
#       3. Regularization (Ridge/Lasso, dropout)
#       4. Early stopping - dung train khi diem validation bat dau xau di
#
#   UNDERFIT (ca hai deu dở)
#     Model qua don gian de nam bat quy luat.
#     Chua bang:
#       1. Model phuc tap hon (them dac trung da thuc, doi sang cay/ensemble)
#       2. Train lau hon
#       3. Giam regularization
#       4. KIEM TRA LAI DU LIEU - doi khi don gian la du lieu khong chua
#          thong tin du de du doan. Khong phai bai toan nao cung giai duoc.
#
#   BAT THUONG (test > train dang ke)
#     Gan nhu LUON la bug. Cac nguyen nhan thuong gap:
#       - Tap test qua nho -> diem so nhieu ngau nhien
#       - Chia du lieu sai, tap test "de" hon mot cach ngau nhien
#       - Co regularization manh (dropout) chi bat khi train
#       - Data leakage theo huong nguoc
#     Dung mung. Hay di tim bug.
#
# NGUONG 0.1 chi la quy uoc. Voi du lieu it (vai tram dong), chenh lech
# 0.1 co the chi la nhieu. Voi du lieu lon, chenh 0.05 da dang lo.


# ===========================================================================
def them_dac_trung_da_thuc(X: np.ndarray, bac: int = 2) -> np.ndarray:
    return np.column_stack([X**i for i in range(1, bac + 1)])


# DAY LA VI DU DEP NHAT VE BIAS-VARIANCE TRADEOFF.
#
#   Voi du lieu co quan he cong (vi du y = x^2):
#       bac 1  -> duong thang, khong the khop  -> UNDERFIT (bias cao)
#       bac 2  -> khop dung ban chat           -> TOT
#       bac 15 -> duong uon luon qua tung diem -> OVERFIT (variance cao)
#
#   Bac cang cao, model cang "deo" - va cang de hoc thuoc ca nhieu.
#   Ban se ve do thi nay trong notebook 01 va thay ro bang mat.
#
# LUU Y THUC TE:
#   1. Dac trung da thuc lam so cot TANG NHANH. Voi 10 dac trung goc va
#      bac 3, ban co 30 cot. Neu them ca tich cheo (x1*x2) thi con nhieu hon.
#
#   2. PHAI CHUAN HOA sau khi tao. x = 1000 thi x^3 = 1 ty - chenh lech
#      thang do khong lo lam gradient descent va cac model tuyen tinh
#      hoat dong rat te.
#
#   3. sklearn co PolynomialFeatures(degree=2, include_bias=False) - no
#      con tao ca TICH CHEO giua cac dac trung (x1*x2), manh hon ham nay.
#
#   4. Cac model dang CAY khong can dac trung da thuc - chung tu hoc duoc
#      quan he phi tuyen bang cach chia nho khong gian. Day la mot ly do
#      Gradient Boosting rat manh voi du lieu bang.


# ===========================================================================
if __name__ == "__main__":
    rng = np.random.default_rng(0)
    X = rng.normal(size=(200, 3))
    y = X @ np.array([2.0, -1.0, 0.5]) + 5.0 + rng.normal(0, 0.5, 200)

    X_tr, X_te, y_tr, y_te = chia_train_test(X, y)
    assert len(X_tr) == 160 and len(X_te) == 40

    w, b = fit_hoi_quy(X_tr, y_tr)
    assert np.allclose(w, [2.0, -1.0, 0.5], atol=0.15)
    assert abs(b - 5.0) < 0.15

    p_tr, p_te = du_doan(X_tr, w, b), du_doan(X_te, w, b)
    assert r2(y_tr, p_tr) > 0.9
    assert chan_doan(r2(y_tr, p_tr), r2(y_te, p_te)) == "Tot"

    assert mae(np.array([100.0, 200.0]), np.array([110.0, 190.0])) == 10.0
    assert abs(rmse(np.array([0.0, 0.0]), np.array([0.0, 2.0])) - 1.4142) < 1e-3
    assert r2(np.array([1.0, 2.0, 3.0]), np.array([1.0, 2.0, 3.0])) == 1.0

    bl = baseline_trung_binh(y_tr, len(y_te))
    assert len(bl) == len(y_te)
    assert r2(y_te, bl) < 0.1

    assert np.allclose(
        them_dac_trung_da_thuc(np.array([[2.0], [3.0]]), 3),
        [[2, 4, 8], [3, 9, 27]],
    )
    assert np.allclose(them_dac_trung_da_thuc(np.array([[1.0, 2.0]]), 2), [[1, 2, 1, 4]])

    print("Tat ca deu dung.")
