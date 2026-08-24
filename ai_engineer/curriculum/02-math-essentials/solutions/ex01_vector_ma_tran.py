"""LOI GIAI - Bai tap 1, Phase 02."""

from __future__ import annotations

import numpy as np


# ===========================================================================
def tich_vo_huong(a: np.ndarray, b: np.ndarray) -> float:
    return float(a @ b)


# VI SAO ep float()?
#   a @ b tra ve np.float64, khong phai float thuan Python.
#   Hai cai nay gan nhu tuong duong, nhung ep ve float giup:
#     - So sanh va in ra sach hon
#     - Serialize sang JSON duoc (np.float64 lam json.dumps bao loi)
#
# @ vs * :
#   a * b  -> nhan TUNG PHAN TU: [1*4, 2*5, 3*6] = [4, 10, 18]
#   a @ b  -> tich vo huong: 4 + 10 + 18 = 32
#   Nham hai cai nay la bug kinh dien. Luon kiem tra .shape cua ket qua.


# ===========================================================================
def do_dai(v: np.ndarray) -> float:
    return float(np.linalg.norm(v))


# np.linalg.norm tuong duong np.sqrt(np.sum(v ** 2)) nhung on dinh so hon
# (tranh tran so khi gia tri rat lon hoac rat nho).
#
# NGUYEN TAC CHUNG: neu NumPy da co ham san, dung no.
# Chung duoc toi uu ky va xu ly cac truong hop bien ma ban chua nghi toi.


# ===========================================================================
def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)

    if norm_a == 0 or norm_b == 0:
        return 0.0

    return float(a @ b / (norm_a * norm_b))


# VI SAO PHAI KIEM TRA norm = 0?
#   Vector [0, 0] khong co "huong", nen khong the noi no giong ai.
#   Chia cho 0 trong NumPy khong crash - no tra ve nan va in canh bao.
#   nan lay lan: moi phep tinh sau do cung thanh nan. Rat kho truy nguon.
#
# VI SAO CHIA CHO DO DAI?
#   Tich vo huong bi anh huong boi DO LON cua vector:
#       [1, 0] . [1, 0]     = 1
#       [1, 0] . [100, 0]   = 100    <- cung huong y het, nhung so khac han
#   Chia cho do dai loai bo anh huong do, chi con lai GOC giua hai vector.
#
# UNG DUNG THUC TE (Phase 08):
#   Doan van dai co vector "lon" hon doan ngan. Neu dung tich vo huong tho,
#   doan dai luon thang. Cosine chuan hoa dieu do -> so sanh cong bang.
#
# MEO TOI UU: neu ban chuan hoa san moi vector trong kho ve do dai 1
#   (goi la "normalize"), thi cosine chi con la tich vo huong -> nhanh hon
#   nhieu. Moi vector database deu lam vay.


# ===========================================================================
def chuan_hoa_cot(X: np.ndarray) -> np.ndarray:
    mean = X.mean(axis=0)
    std = X.std(axis=0)

    # Tranh chia cho 0: cot nao co std = 0 thi thay bang 1
    std_an_toan = np.where(std == 0, 1.0, std)

    return (X - mean) / std_an_toan


# GIAI THICH axis=0:
#   X.mean(axis=0) -> gop cac HANG lai, con lai mot gia tri cho MOI COT
#   X.mean(axis=1) -> gop cac COT lai, con lai mot gia tri cho MOI HANG
#
#   Meo nho: axis=0 la chieu di XUONG (doc theo cot).
#
#   Voi X shape (3, 2):
#       X.mean(axis=0).shape -> (2,)    mot mean cho moi cot
#       X.mean(axis=1).shape -> (3,)    mot mean cho moi hang
#
# BROADCASTING lam viec o day the nao?
#       X       shape (3, 2)
#       mean    shape (2,)  -> duoc hieu la (1, 2) -> lap lai cho ca 3 hang
#       X - mean  ->  shape (3, 2)     dung y muon
#
#   Neu khong co broadcasting, ban se phai viet vong lap qua tung cot.
#
# np.where(dieu_kien, gia_tri_neu_dung, gia_tri_neu_sai)
#   Hoat dong tren CA MANG cung luc - la phien ban vectorized cua if/else.
#
# VE MAT ML - DIEU QUAN TRONG NHAT:
#   Trong thuc te, mean va std phai duoc tinh CHI TU TAP TRAIN, roi ap dung
#   cho ca train lan test. Neu tinh tren toan bo du lieu, thong tin tu tap
#   test "ro ri" vao qua trinh train -> DATA LEAKAGE.
#   sklearn giai quyet bang scaler.fit(X_train) roi scaler.transform(X_test).
#   Ban se hoc ky o Phase 04.


# ===========================================================================
def du_doan_tuyen_tinh(X: np.ndarray, w: np.ndarray, b: float) -> np.ndarray:
    return X @ w + b


# KIEM TRA SHAPE:
#   X    (n_mau, n_dac_trung)
#   w    (n_dac_trung,)
#   X@w  (n_mau,)              <- hai so o giua trung khop va bi "trieu tieu"
#   + b  (n_mau,)              <- b la mot so, broadcasting cong vao het
#
# DAY LA PHEP TINH LOI CUA MOI MANG NEURAL:
#       output = activation(X @ W + b)
#
#   Hoi quy tuyen tinh  = phep nay, khong co activation
#   Hoi quy logistic    = phep nay + sigmoid
#   Mot lop neural      = phep nay + ReLU
#   GPT                 = rat nhieu phep nay xen ke attention
#
#   Nghia la: ban vua viet xong "trai tim" cua deep learning trong mot dong.
#
# GHI NHO QUY UOC SHAPE: X luon la (so_mau, so_dac_trung).
# Nham thanh (so_dac_trung, so_mau) la loi rat hay gap - ket qua se sai shape
# hoac nem loi ngay.


# ===========================================================================
def mse(y_that: np.ndarray, y_du_doan: np.ndarray) -> float:
    return float(np.mean((y_that - y_du_doan) ** 2))


def mae(y_that: np.ndarray, y_du_doan: np.ndarray) -> float:
    return float(np.mean(np.abs(y_that - y_du_doan)))


# MSE vs MAE - CHON CAI NAO?
#
#   MSE binh phuong sai so -> PHAT NANG cac sai so lon.
#       Sai 10 don vi bi phat gap 100 lan sai 1 don vi.
#       -> Dung khi sai so lon la tham hoa (du bao ton kho, chan doan y te)
#       -> Nhay cam voi ngoai lai: mot diem di thuong keo lech ca model
#
#   MAE phat tuyen tinh.
#       Sai 10 don vi bi phat gap 10 lan sai 1 don vi.
#       -> Ben vung hon voi ngoai lai
#       -> Kho toi uu hon mot chut (dao ham khong lien tuc tai 0)
#
#   MSE con mot ly do ky thuat de duoc ua chuong: no kha vi o moi diem,
#   nen gradient descent chay muot. Do la vi sao no la mac dinh.
#
# RMSE = sqrt(MSE) - hay dung khi bao cao vi no CUNG DON VI voi du lieu goc.
#   "Sai so trung binh 50 trieu VND" de hieu hon "MSE = 2.5e15".


# ===========================================================================
def tim_gan_nhat(truy_van: np.ndarray, kho: np.ndarray, k: int = 3) -> np.ndarray:
    diem = np.array([cosine_similarity(truy_van, v) for v in kho])
    return np.argsort(diem)[::-1][:k]


# GIAI THICH TUNG BUOC:
#   1. Tinh cosine similarity giua truy_van va TUNG vector trong kho
#   2. np.argsort(diem) -> tra ve CHI SO sap theo thu tu TANG dan
#   3. [::-1]           -> dao nguoc -> giam dan
#   4. [:k]             -> lay k cai dau
#
# LUU Y: argsort tra ve CHI SO, khong phai gia tri. Day la diem hay nham.
#       diem = [0.1, 0.9, 0.5]
#       np.argsort(diem)        -> [0, 2, 1]   (chi so cua gia tri tang dan)
#       np.argsort(diem)[::-1]  -> [1, 2, 0]   (giam dan)
#
# PHIEN BAN VECTORIZED (nhanh hon nhieu voi kho lon):
#     kho_norm = kho / np.linalg.norm(kho, axis=1, keepdims=True)
#     tv_norm = truy_van / np.linalg.norm(truy_van)
#     diem = kho_norm @ tv_norm          # mot phep nhan ma tran duy nhat
#     return np.argsort(diem)[::-1][:k]
#
#   keepdims=True giu shape (n, 1) thay vi (n,) de broadcasting chia dung chieu.
#
# DAY CHINH LA CO CHE CUA VECTOR DATABASE:
#   Chroma, Qdrant, Pinecone deu lam dung viec nay, chi khac la chung dung
#   thuat toan ANN (Approximate Nearest Neighbor) de khong phai so sanh voi
#   TAT CA vector - danh doi mot chut chinh xac lay toc do gap hang nghin lan.
#   Ban se dung chung o Phase 08.


# ===========================================================================
if __name__ == "__main__":
    a = np.array([1.0, 2.0, 3.0])
    b = np.array([4.0, 5.0, 6.0])

    assert tich_vo_huong(a, b) == 32.0
    assert do_dai(np.array([3.0, 4.0])) == 5.0
    assert cosine_similarity(np.array([1.0, 0]), np.array([1.0, 0])) == 1.0
    assert cosine_similarity(np.array([1.0, 0]), np.array([0.0, 1.0])) == 0.0
    assert cosine_similarity(np.array([0.0, 0]), np.array([1.0, 0])) == 0.0

    X = np.array([[1.0, 10.0], [2.0, 20.0], [3.0, 30.0]])
    Z = chuan_hoa_cot(X)
    assert np.allclose(Z.mean(axis=0), 0)
    assert np.allclose(Z.std(axis=0), 1)

    assert np.allclose(
        du_doan_tuyen_tinh(np.array([[1.0, 2.0], [3.0, 4.0]]), np.array([0.5, 1.5]), 1.0),
        [4.5, 8.5],
    )
    assert mse(np.array([1.0, 2.0]), np.array([1.0, 4.0])) == 2.0
    assert mae(np.array([1.0, 2.0]), np.array([1.0, 4.0])) == 1.0

    kho = np.array([[1.0, 0.0], [0.0, 1.0], [0.9, 0.1]])
    assert list(tim_gan_nhat(np.array([1.0, 0.0]), kho, k=2)) == [0, 2]

    print("Tat ca deu dung.")
