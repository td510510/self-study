"""BAI TAP 2 - Training loop va MLP (Tuan 12).

Cham diem:  pytest tests/phase05/test_ex02.py -v
Loi giai:   curriculum/05-deep-learning/solutions/ex02_training_loop.py

DAY LA BAI TAP QUAN TRONG NHAT PHASE 05.

Ban se tu viet vong lap train ma MOI model AI - tu MLP nho den GPT -
deu dung. Sau bai nay, doc code training cua bat ky du an nao ban
cung nhan ra ngay bon buoc quen thuoc.
"""

from __future__ import annotations

import numpy as np
import torch
import torch.nn as nn


# ===========================================================================
#  2.1 - Xay MLP
# ===========================================================================
def tao_mlp(so_dau_vao: int, cac_lop_an: list[int], so_lop_ra: int) -> nn.Module:
    """Tao mang neural nhieu lop (MLP) bang nn.Sequential.

    Cau truc:
        Linear(so_dau_vao, an[0]) -> ReLU
        Linear(an[0], an[1])      -> ReLU
        ...
        Linear(an[-1], so_lop_ra)      <- KHONG co ReLU o lop cuoi

    Vi du:
        tao_mlp(784, [128, 64], 10)
        ->  Linear(784,128) ReLU Linear(128,64) ReLU Linear(64,10)

        tao_mlp(10, [], 2)
        ->  Linear(10, 2)              (khong co lop an nao)

    VI SAO LOP CUOI KHONG CO ReLU?
        Lop cuoi tra ve LOGITS - so thuc bat ky, co the am.
        ReLU se cat het phan am -> mat thong tin.
        Ngoai ra CrossEntropyLoss da bao gom softmax ben trong,
        nen KHONG duoc them softmax vao model.

    Goi y: xay mot list cac lop roi nn.Sequential(*danh_sach)
    """
    # TODO
    pass


def dem_tham_so(model: nn.Module) -> int:
    """Dem tong so tham so HOC DUOC cua model.

    Vi du: tao_mlp(4, [8], 2) co
        Linear(4,8): 4*8 weights + 8 bias = 40
        Linear(8,2): 8*2 weights + 2 bias = 18
        -> tong 58

    Goi y: sum(p.numel() for p in model.parameters() if p.requires_grad)
    """
    # TODO
    pass


# ===========================================================================
#  2.2 - Chia batch
# ===========================================================================
def tao_batch(
    X: torch.Tensor, y: torch.Tensor, batch_size: int, xao_tron: bool = True, seed: int = 42
) -> list[tuple[torch.Tensor, torch.Tensor]]:
    """Chia du lieu thanh cac batch.

    Tra ve list cac cap (X_batch, y_batch).
    Batch CUOI CUNG co the nho hon batch_size (khong bo di).

    Neu xao_tron=True thi tron thu tu mau truoc khi chia,
    dung torch.randperm voi generator co seed de tai lap duoc.

    Vi du: 10 mau, batch_size=4  ->  3 batch co kich thuoc 4, 4, 2

    VI SAO PHAI XAO TRON MOI EPOCH?
        Neu khong, model gap cac mau theo cung mot thu tu moi epoch.
        Voi du lieu duoc sap xep san (vi du toan lop 0 roi den lop 1),
        moi batch chi chua mot lop -> gradient lech han, model hoc rat te.

    Goi y:
        g = torch.Generator().manual_seed(seed)
        chi_so = torch.randperm(len(X), generator=g) if xao_tron else torch.arange(len(X))
    """
    # TODO
    pass


# ===========================================================================
#  2.3 - MOT epoch train  <- TRAI TIM CUA BAI NAY
# ===========================================================================
def train_mot_epoch(
    model: nn.Module,
    cac_batch: list[tuple[torch.Tensor, torch.Tensor]],
    ham_loss: nn.Module,
    optimizer: torch.optim.Optimizer,
) -> float:
    """Chay MOT epoch train. Tra ve loss TRUNG BINH cua epoch do.

    Voi moi batch, lam DUNG bon buoc:
        1. y_pred = model(X_batch)              FORWARD
        2. loss = ham_loss(y_pred, y_batch)     LOSS
        3. optimizer.zero_grad()                XOA GRADIENT CU  <- DUNG QUEN
           loss.backward()                      BACKWARD
        4. optimizer.step()                     UPDATE

    Nho:
        - Goi model.train() o dau ham (bat che do train cho Dropout/BatchNorm)
        - Cong don loss bang loss.item() chu KHONG phai loss
          (neu khong se giu lai do thi tinh toan cua moi batch -> ro ri bo nho)
        - Loss trung binh = tong loss / so batch

    BON DONG NAY LA TOAN BO DEEP LEARNING. ResNet, BERT, GPT-4
    deu duoc train bang dung vong lap nay.
    """
    # TODO
    pass


# ===========================================================================
#  2.4 - Danh gia
# ===========================================================================
def danh_gia(
    model: nn.Module, X: torch.Tensor, y: torch.Tensor, ham_loss: nn.Module
) -> dict[str, float]:
    """Danh gia model tren mot tap du lieu.

    Tra ve dict co dung 2 khoa:
        "loss"     - gia tri loss
        "accuracy" - ty le du doan dung (0.0 den 1.0)

    Nho:
        - Goi model.eval()          (tat Dropout, doi hanh vi BatchNorm)
        - Bao quanh bang torch.no_grad()   (nhanh hon, it RAM hon)
        - Nhan du doan = argmax cua logits theo chieu 1

    VI SAO CAN CA eval() LAN no_grad()?
        eval()   -> doi HANH VI cua model (van de DUNG/SAI)
        no_grad -> tat tinh dao ham (van de TOC DO/BO NHO)
        Hai thu khac nhau, phai dung ca hai.
    """
    # TODO
    pass


# ===========================================================================
#  2.5 - Ghep tat ca lai
# ===========================================================================
def train_model(
    model: nn.Module,
    X_train: torch.Tensor,
    y_train: torch.Tensor,
    X_val: torch.Tensor,
    y_val: torch.Tensor,
    so_epoch: int = 10,
    batch_size: int = 32,
    learning_rate: float = 1e-3,
    seed: int = 42,
) -> dict[str, list[float]]:
    """Train model day du va ghi lai lich su.

    Tra ve dict co dung 4 khoa, moi khoa la list do dai so_epoch:
        "train_loss", "val_loss", "train_acc", "val_acc"

    Cac buoc:
        - Dung nn.CrossEntropyLoss() lam ham loss
        - Dung torch.optim.Adam(model.parameters(), lr=learning_rate)
        - Moi epoch:
            + tao batch MOI (xao tron, seed = seed + so thu tu epoch
              de moi epoch tron khac nhau nhung van tai lap duoc)
            + train_mot_epoch(...)
            + danh_gia tren train va val
            + ghi 4 gia tri vao lich su

    LICH SU NAY DE LAM GI?
        De VE DUONG CONG HOC. Nhin do thi train_loss va val_loss
        ban biet ngay model dang underfit, vua, hay overfit -
        thong tin ma khong con so don le nao cho duoc.
    """
    # TODO
    pass


# ===========================================================================
#  2.6 - Chan doan tu duong cong hoc
# ===========================================================================
def chan_doan_duong_cong(train_loss: list[float], val_loss: list[float]) -> str:
    """Chan doan tinh trang train dua tren lich su loss.

    Quy tac (xet theo dung thu tu nay):
        1. val_loss cuoi > val_loss NHO NHAT * 1.1
           -> "Overfit"      (val loss da tang tro lai dang ke)
        2. train_loss cuoi > train_loss[0] * 0.9
           -> "Chua hoc duoc"  (loss gan nhu khong giam)
        3. train_loss cuoi < val_loss cuoi * 0.5
           -> "Overfit"      (train tot hon val qua nhieu)
        4. con lai
           -> "Tot"

    Vi du:
        chan_doan_duong_cong([2.0, 1.0, 0.5], [2.0, 1.1, 0.9])  -> "Tot"
        chan_doan_duong_cong([2.0, 0.5, 0.1], [2.0, 0.8, 1.5])  -> "Overfit"
        chan_doan_duong_cong([2.0, 1.99, 1.98], [2.0, 2.0, 2.0]) -> "Chua hoc duoc"
    """
    # TODO
    pass


# ===========================================================================
if __name__ == "__main__":
    from pathlib import Path

    p = Path("data/hinh_khoi.npz")
    if not p.exists():
        print("Chay truoc: python curriculum/05-deep-learning/tao_du_lieu.py")
        raise SystemExit(1)

    d = np.load(p)
    X = torch.tensor(d["X_train"]).flatten(1)      # (8000, 784)
    y = torch.tensor(d["y_train"])
    X_val = torch.tensor(d["X_test"]).flatten(1)
    y_val = torch.tensor(d["y_test"])

    torch.manual_seed(0)
    model = tao_mlp(784, [128, 64], 4)
    if model is None:
        print("Chua lam tao_mlp.")
        raise SystemExit(0)

    print(f"  So tham so: {dem_tham_so(model):,}\n")

    ls = train_model(model, X, y, X_val, y_val, so_epoch=8, batch_size=64)

    print(f"  {'epoch':>6} {'train_loss':>12} {'val_loss':>10} {'val_acc':>9}")
    print("  " + "-" * 40)
    for i in range(len(ls["train_loss"])):
        print(f"  {i+1:>6} {ls['train_loss'][i]:>12.4f} "
              f"{ls['val_loss'][i]:>10.4f} {ls['val_acc'][i]:>9.4f}")

    print(f"\n  Chan doan: {chan_doan_duong_cong(ls['train_loss'], ls['val_loss'])}")
