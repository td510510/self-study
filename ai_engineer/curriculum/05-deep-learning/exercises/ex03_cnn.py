"""BAI TAP 3 - CNN (Tuan 13).

Cham diem:  pytest tests/phase05/test_ex03.py -v
Loi giai:   curriculum/05-deep-learning/solutions/ex03_cnn.py

Muc tieu: hieu hinh dang du lieu chay qua CNN. 90% loi khi viet CNN
la loi shape - bai nay dạy ban tinh truoc thay vi doan.
"""

from __future__ import annotations

import torch
import torch.nn as nn


# ===========================================================================
#  3.1 - Cong thuc kich thuoc dau ra  <- PHAI THUOC
# ===========================================================================
def kich_thuoc_conv(
    kich_thuoc_vao: int, kernel: int, stride: int = 1, padding: int = 0
) -> int:
    """Tinh kich thuoc dau ra cua mot lop tich chap (mot chieu).

    Cong thuc:
        out = (kich_thuoc_vao + 2*padding - kernel) // stride + 1

    Vi du:
        kich_thuoc_conv(28, 3, 1, 1)  ->  28    (giu nguyen)
        kich_thuoc_conv(28, 3, 1, 0)  ->  26    (mat 2 pixel o vien)
        kich_thuoc_conv(28, 5, 1, 2)  ->  28    (giu nguyen)
        kich_thuoc_conv(28, 3, 2, 1)  ->  14    (stride 2 -> giam nua)
        kich_thuoc_conv(32, 5, 1, 0)  ->  28

    MEO DUNG CA SU NGHIEP:
        padding = (kernel - 1) // 2  thi kich thuoc GIU NGUYEN (voi stride=1).
        Do la ly do ban thay `kernel_size=3, padding=1` o khap noi.
    """
    # TODO
    pass


def kich_thuoc_pool(kich_thuoc_vao: int, kernel: int, stride: int | None = None) -> int:
    """Tinh kich thuoc dau ra cua MaxPool.

    Neu stride la None thi stride = kernel (mac dinh cua PyTorch).
    Cong thuc giong conv voi padding = 0.

    Vi du:
        kich_thuoc_pool(28, 2)      ->  14
        kich_thuoc_pool(14, 2)      ->   7
        kich_thuoc_pool(7, 2)       ->   3    (lam tron XUONG)
        kich_thuoc_pool(28, 3, 1)   ->  26
    """
    # TODO
    pass


# ===========================================================================
#  3.2 - Theo dau shape qua ca mang
# ===========================================================================
def theo_dau_shape(kich_thuoc_anh: int, cac_buoc: list[tuple]) -> list[int]:
    """Tinh kich thuoc sau TUNG buoc cua mang.

    cac_buoc la list cac tuple:
        ("conv", kernel, stride, padding)
        ("pool", kernel, stride)          stride co the la None

    Tra ve list kich thuoc SAU moi buoc (khong gom kich thuoc ban dau).

    Vi du:
        theo_dau_shape(28, [("conv", 3, 1, 1), ("pool", 2, None),
                            ("conv", 3, 1, 1), ("pool", 2, None)])
        ->  [28, 14, 14, 7]

    HAM NAY GIAI QUYET VAN DE THUC TE:
        Khi xay CNN, ban phai biet dau vao cua lop Linear cuoi cung
        la bao nhieu. Tinh nham -> RuntimeError ve shape.
        Ham nay cho ban tinh truoc thay vi chay thu roi doan.
    """
    # TODO
    pass


# ===========================================================================
#  3.3 - Xay CNN
# ===========================================================================
def tao_cnn(so_kenh_vao: int, so_lop_ra: int, kich_thuoc_anh: int = 28) -> nn.Module:
    """Tao CNN theo kien truc chuan.

    Kien truc CHINH XAC (theo dung thu tu):
        Conv2d(so_kenh_vao, 16, kernel_size=3, padding=1)
        ReLU
        MaxPool2d(2)
        Conv2d(16, 32, kernel_size=3, padding=1)
        ReLU
        MaxPool2d(2)
        Flatten
        Linear(32 * k * k, 64)          voi k = kich_thuoc sau 2 lan pool
        ReLU
        Linear(64, so_lop_ra)

    Voi kich_thuoc_anh=28:  28 -> 28 -> 14 -> 14 -> 7   nen k = 7
    -> Linear(32*7*7, 64) = Linear(1568, 64)

    Voi kich_thuoc_anh=32:  32 -> 32 -> 16 -> 16 -> 8   nen k = 8

    Goi y: dung lai theo_dau_shape hoac kich_thuoc_pool de tinh k,
           dung khong hard-code so 7.
    """
    # TODO
    pass


# ===========================================================================
#  3.4 - Dem tham so theo tung lop
# ===========================================================================
def tham_so_theo_lop(model: nn.Module) -> list[tuple[str, int]]:
    """Liet ke so tham so cua tung lop CO tham so.

    Tra ve list cac tuple (ten_lop, so_tham_so), chi gom cac lop
    co it nhat mot tham so (bo qua ReLU, MaxPool, Flatten).

    ten_lop la ten CLASS cua lop, vi du "Conv2d", "Linear".

    Vi du voi nn.Sequential(nn.Linear(4, 8), nn.ReLU(), nn.Linear(8, 2)):
        [("Linear", 40), ("Linear", 18)]

    Goi y: duyet model.children(), voi moi lop tinh
           sum(p.numel() for p in lop.parameters())
    """
    # TODO
    pass


# ===========================================================================
#  3.5 - So sanh so tham so CNN vs MLP
# ===========================================================================
def so_sanh_tham_so(kich_thuoc_anh: int, so_kenh: int, so_lop_ra: int) -> dict[str, int]:
    """So sanh so tham so giua CNN va MLP cho cung bai toan.

    Tra ve dict co dung 2 khoa: "cnn" va "mlp"

        "cnn" - so tham so cua tao_cnn(so_kenh, so_lop_ra, kich_thuoc_anh)
        "mlp" - so tham so cua MLP co cung "quy mo":
                Linear(so_kenh * kich_thuoc_anh^2, 128) -> ReLU
                -> Linear(128, 64) -> ReLU -> Linear(64, so_lop_ra)

    Vi du voi anh 28x28 xam, 4 lop:
        CNN co ~105.000 tham so
        MLP co ~109.000 tham so       (xap xi nhau)

    Voi anh 224x224 MAU (3 kenh):
        CNN tang KHONG DANG KE (chi lop Linear cuoi tang)
        MLP tang len HANG CHUC TRIEU

    Do la mot trong ba ly do CNN thang MLP voi anh.
    """
    # TODO
    pass


# ===========================================================================
#  3.6 - Kiem tra model chay duoc
# ===========================================================================
def kiem_tra_forward(
    model: nn.Module, batch_size: int, so_kenh: int, kich_thuoc_anh: int
) -> tuple:
    """Cho mot batch gia chay qua model, tra ve shape dau ra.

    Tao tensor ngau nhien shape (batch_size, so_kenh, kich_thuoc_anh,
    kich_thuoc_anh), cho chay qua model trong torch.no_grad(),
    tra ve tuple(shape cua ket qua).

    Vi du:
        kiem_tra_forward(cnn, 8, 1, 28)  ->  (8, 4)

    DAY LA THOI QUEN NEN CO:
        Truoc khi train hang gio, cho mot batch gia chay qua model de
        chac chan moi shape khop nhau. Phat hien loi trong 1 giay
        thay vi sau 20 phut train.
    """
    # TODO
    pass


# ===========================================================================
if __name__ == "__main__":
    print("Kich thuoc dau ra:")
    for vao, k, s, p in [(28, 3, 1, 1), (28, 3, 1, 0), (28, 5, 1, 2), (28, 3, 2, 1)]:
        print(f"  conv({vao}, kernel={k}, stride={s}, padding={p}) = "
              f"{kich_thuoc_conv(vao, k, s, p)}")

    print(f"\n  pool(28, 2) = {kich_thuoc_pool(28, 2)}")

    duong_di = theo_dau_shape(28, [("conv", 3, 1, 1), ("pool", 2, None),
                                   ("conv", 3, 1, 1), ("pool", 2, None)])
    print(f"\n  Duong di shape 28 -> {duong_di}")

    cnn = tao_cnn(1, 4, 28)
    if cnn is None:
        print("\n  Chua lam tao_cnn.")
        raise SystemExit(0)

    print(f"\n  Forward thu: {kiem_tra_forward(cnn, 8, 1, 28)}")
    print("\n  Tham so tung lop:")
    for ten, so in tham_so_theo_lop(cnn):
        print(f"    {ten:<10} {so:>10,}")

    print("\n  So sanh CNN vs MLP:")
    for ten_bo, kt, kenh in [("Anh 28x28 xam", 28, 1), ("Anh 224x224 mau", 224, 3)]:
        ss = so_sanh_tham_so(kt, kenh, 4)
        print(f"    {ten_bo:<18} CNN {ss['cnn']:>12,}   MLP {ss['mlp']:>12,}")
