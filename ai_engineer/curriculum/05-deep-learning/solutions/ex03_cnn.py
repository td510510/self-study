"""LOI GIAI - Bai tap 3, Phase 05."""

from __future__ import annotations

import torch
import torch.nn as nn


# ===========================================================================
def kich_thuoc_conv(
    kich_thuoc_vao: int, kernel: int, stride: int = 1, padding: int = 0
) -> int:
    return (kich_thuoc_vao + 2 * padding - kernel) // stride + 1


def kich_thuoc_pool(kich_thuoc_vao: int, kernel: int, stride: int | None = None) -> int:
    if stride is None:
        stride = kernel
    return (kich_thuoc_vao - kernel) // stride + 1


# CONG THUC NAY PHAI THUOC. 90% loi khi viet CNN la loi shape.
#
#     out = (vao + 2*padding - kernel) // stride + 1
#
# HIEU TRUC GIAC:
#   - kernel truot tren anh. Neu khong co padding, no khong the dat tam
#     len sat vien -> anh bi teo di (kernel - 1) pixel.
#   - padding them vien so 0 quanh anh de bu lai phan teo do.
#   - stride la buoc nhay. Stride 2 nghia la nhay cach mot -> kich thuoc
#     giam khoang mot nua.
#
# BA CAU HINH BAN SE GAP 95% THOI GIAN:
#
#   kernel=3, padding=1, stride=1   ->  GIU NGUYEN kich thuoc
#   kernel=5, padding=2, stride=1   ->  GIU NGUYEN kich thuoc
#   MaxPool2d(2)                    ->  GIAM NUA
#
#   Cong thuc chung de giu nguyen: padding = (kernel - 1) // 2
#   Do la ly do ban thay `Conv2d(..., kernel_size=3, padding=1)` o khap noi
#   trong moi bai bao va moi thu vien.
#
# VI SAO KERNEL THUONG LA SO LE (3, 5, 7)?
#   Kernel le co MOT o trung tam ro rang, nen "giu nguyen kich thuoc"
#   la doi xung. Voi kernel chan, padding phai lech mot ben.
#
# VI SAO CHIA LAY PHAN NGUYEN (//)?
#   Neu kernel truot khong vua het, phan du o vien bi BO DI.
#   Vi du pool(7, 2): 7 = 3 lan pool (6 pixel) + 1 pixel thua -> bo.
#   Ket qua 3, khong phai 3.5.
#
# CONG THUC CHO TICH CHAP CHUYEN VI (upsampling, dung trong GAN/U-Net)
# thi nguoc lai - nhung ban chua can den o Phase 05.


# ===========================================================================
def theo_dau_shape(kich_thuoc_anh: int, cac_buoc: list[tuple]) -> list[int]:
    kich_thuoc = kich_thuoc_anh
    duong_di = []

    for buoc in cac_buoc:
        loai = buoc[0]
        if loai == "conv":
            _, kernel, stride, padding = buoc
            kich_thuoc = kich_thuoc_conv(kich_thuoc, kernel, stride, padding)
        elif loai == "pool":
            _, kernel, stride = buoc
            kich_thuoc = kich_thuoc_pool(kich_thuoc, kernel, stride)
        else:
            raise ValueError(f"Khong biet loai buoc: {loai!r}")
        duong_di.append(kich_thuoc)

    return duong_di


# VI SAO HAM NAY DANG VIET?
#   Vi cau hoi thuc te khi xay CNN luon la:
#       "Lop Linear cuoi cung phai nhan bao nhieu dau vao?"
#
#   Neu tinh nham, ban nhan duoc:
#       RuntimeError: mat1 and mat2 shapes cannot be multiplied
#                     (8x1568 and 800x64)
#   Con so 1568 trong thong bao chinh la dieu ham nay tinh ra.
#
# HAI CACH KHAC DE TIM CON SO DO:
#
#   1. Cho mot tensor gia chay qua phan conv roi in shape:
#          x = torch.zeros(1, 1, 28, 28)
#          print(phan_conv(x).shape)     # torch.Size([1, 32, 7, 7])
#      Nhanh va khong the sai. Rat hay dung khi thu nghiem.
#
#   2. Dung nn.AdaptiveAvgPool2d((1, 1)) truoc Flatten
#      -> ep dau ra ve kich thuoc co dinh bat ke anh vao to nho the nao.
#      Cach nay duoc dung trong ResNet va cac kien truc hien dai, vi no
#      cho phep model nhan anh KICH THUOC BAT KY.
#
#   Ham nay day ban cach TINH TRUOC - hieu duoc thi hai cach kia moi
#   khong con la phep thuat.
#
# raise ValueError cho loai buoc la: neu ai do go nham "polling" thay vi
# "pool", tot hon la bao loi ngay chu khong am tham bo qua.


# ===========================================================================
def tao_cnn(so_kenh_vao: int, so_lop_ra: int, kich_thuoc_anh: int = 28) -> nn.Module:
    # Tinh kich thuoc sau hai lan conv(giu nguyen) + hai lan pool(giam nua)
    k = theo_dau_shape(
        kich_thuoc_anh,
        [("conv", 3, 1, 1), ("pool", 2, None), ("conv", 3, 1, 1), ("pool", 2, None)],
    )[-1]

    return nn.Sequential(
        nn.Conv2d(so_kenh_vao, 16, kernel_size=3, padding=1),
        nn.ReLU(),
        nn.MaxPool2d(2),
        nn.Conv2d(16, 32, kernel_size=3, padding=1),
        nn.ReLU(),
        nn.MaxPool2d(2),
        nn.Flatten(),
        nn.Linear(32 * k * k, 64),
        nn.ReLU(),
        nn.Linear(64, so_lop_ra),
    )


# DOC KIEN TRUC NAY:
#
#   Dau vao       (batch, 1, 28, 28)
#   Conv2d(1,16)  (batch, 16, 28, 28)   16 bo loc, moi bo tim mot dac trung
#   MaxPool2d(2)  (batch, 16, 14, 14)   giam nua
#   Conv2d(16,32) (batch, 32, 14, 14)   32 bo loc, ket hop cac dac trung tho
#   MaxPool2d(2)  (batch, 32, 7, 7)     giam nua
#   Flatten       (batch, 1568)         32*7*7 = 1568
#   Linear        (batch, 64)
#   Linear        (batch, 4)            logits
#
# MAU CHUNG CUA MOI CNN: kich thuoc khong gian GIAM, so kenh TANG.
#       28x28x1  ->  14x14x16  ->  7x7x32
#   Mang di tu "nhieu vi tri, it dac trung" sang "it vi tri, nhieu dac trung".
#   Truc quan: lop dau hoi "co canh o day khong?", lop sau hoi
#   "toan bo hinh nay la vat the gi?".
#
# VI SAO KHONG HARD-CODE SO 7?
#   Vi ham phai chay dung voi kich_thuoc_anh = 32, 64, hay bat ky.
#   Hard-code la lam gay ham ngay khi doi bo du lieu.
#
# nn.Flatten() LAM GI?
#   Bien (batch, 32, 7, 7) thanh (batch, 1568).
#   Giu nguyen chieu batch, gop moi chieu con lai.
#   Tuong duong x.view(x.size(0), -1) nhung ro rang hon.
#
# VI SAO PHAI Flatten TRUOC Linear?
#   nn.Linear chi lam viec voi tensor 2 chieu (batch, dac_trung).
#   Conv2d tra ve 4 chieu (batch, kenh, cao, rong).
#
# CAC CAI TIEN THUC TE (bai tap giu don gian):
#   - BatchNorm2d sau moi Conv2d      -> train nhanh va on dinh hon
#   - Dropout truoc lop Linear cuoi   -> chong overfit
#   - Them lop conv thu ba            -> hoc duoc dac trung phuc tap hon
#   - AdaptiveAvgPool2d thay Flatten  -> nhan anh kich thuoc bat ky


# ===========================================================================
def tham_so_theo_lop(model: nn.Module) -> list[tuple[str, int]]:
    ket_qua = []
    for lop in model.children():
        so = sum(p.numel() for p in lop.parameters())
        if so > 0:
            ket_qua.append((type(lop).__name__, so))
    return ket_qua


# CACH TINH THAM SO TUNG LOAI LOP:
#
#   Linear(a, b)          -> a*b + b
#       Vi du Linear(1568, 64) = 1568*64 + 64 = 100.416
#
#   Conv2d(vao, ra, k)    -> vao * ra * k * k + ra
#       Vi du Conv2d(1, 16, 3)  = 1*16*9 + 16  = 160
#             Conv2d(16, 32, 3) = 16*32*9 + 32 = 4.640
#
#   ReLU, MaxPool, Flatten -> 0 tham so (chi la phep bien doi co dinh)
#
# CON SO GAY BAT NGO:
#   Trong CNN nay, hai lop CONV chi co 4.800 tham so,
#   nhung lop LINEAR dau tien co 100.416 - chiem 95% toan mang!
#
#   Do la nghich ly quen thuoc: phan "thong minh" (conv, hoc dac trung)
#   rat nhe, con phan "ngo ngan" (linear) lai nang nhat.
#
#   Cac kien truc hien dai giai quyet bang GlobalAveragePooling:
#       nn.AdaptiveAvgPool2d(1) -> (batch, 32, 1, 1) -> Flatten -> (batch, 32)
#       roi Linear(32, so_lop) chi ton 132 tham so thay vi 100.416.
#   ResNet, EfficientNet deu lam vay.
#
# TRONG THUC TE dung thu vien de xem tom tat:
#       from torchinfo import summary
#       summary(model, input_size=(1, 1, 28, 28))
#   No in bang day du: shape tung lop, so tham so, uoc luong bo nho.


# ===========================================================================
def so_sanh_tham_so(kich_thuoc_anh: int, so_kenh: int, so_lop_ra: int) -> dict[str, int]:
    cnn = tao_cnn(so_kenh, so_lop_ra, kich_thuoc_anh)

    so_dau_vao = so_kenh * kich_thuoc_anh * kich_thuoc_anh
    mlp = nn.Sequential(
        nn.Linear(so_dau_vao, 128),
        nn.ReLU(),
        nn.Linear(128, 64),
        nn.ReLU(),
        nn.Linear(64, so_lop_ra),
    )

    return {
        "cnn": sum(p.numel() for p in cnn.parameters()),
        "mlp": sum(p.numel() for p in mlp.parameters()),
    }


# KET QUA THUC TE (chay ham nay de tu kiem chung):
#
#   Anh 28x28 xam,  4 lop:  CNN ~105.000   MLP ~109.000   (xap xi nhau)
#   Anh 224x224 mau, 4 lop:  CNN ~6.4 trieu MLP ~19.3 trieu (CNN it hon 3 lan)
#
#   Va neu MLP dung lop an 1000 no-ron (thuong thay trong tai lieu cu):
#       Chi rieng lop dau da la 150.528 * 1000 = HON 150 TRIEU tham so.
#
# BA LY DO CNN THANG MLP VOI ANH - theo thu tu quan trong:
#
#   1. BAT BIEN VOI DICH CHUYEN
#      CNN hoc "canh doc trong the nao" MOT LAN va dung o moi vi tri.
#      MLP phai hoc rieng cho tung vi tri. Voi bo du lieu hinh khoi cua
#      chung ta (hinh xuat hien o vi tri ngau nhien), day la khac biet
#      quyet dinh: 82% so voi 96%.
#
#   2. GIU CAU TRUC KHONG GIAN
#      MLP flatten anh thanh vector -> hai pixel canh nhau va hai pixel
#      o hai goc doi dien duoc doi xu Y NHU NHAU. Thong tin "gan nhau"
#      bien mat hoan toan.
#
#   3. IT THAM SO HON (khi anh lon)
#      Chia se trong so nghia la mot bo loc 3x3 dung cho ca anh, thay vi
#      moi vi tri mot bo trong so rieng.
#
#   Voi anh nho 28x28, ly do 3 khong ro. Voi anh 224x224 hoac lon hon,
#   no tro thanh khac biet giua "train duoc" va "khong the train".
#
# LIEN HE PHASE 06: Transformer cung dung y tuong CHIA SE TRONG SO -
#   cung mot khoi attention duoc ap dung cho moi vi tri trong chuoi.
#   Do la ly do no xu ly duoc van ban dai bat ky.


# ===========================================================================
def kiem_tra_forward(
    model: nn.Module, batch_size: int, so_kenh: int, kich_thuoc_anh: int
) -> tuple:
    x = torch.randn(batch_size, so_kenh, kich_thuoc_anh, kich_thuoc_anh)
    model.eval()
    with torch.no_grad():
        out = model(x)
    return tuple(out.shape)


# THOI QUEN NEN CO SUOT SU NGHIEP:
#   Truoc khi train hang gio, cho MOT batch gia chay qua model.
#   Phat hien loi shape trong 1 giay thay vi sau 20 phut train.
#
#       x = torch.randn(2, 1, 28, 28)      # batch gia
#       print(model(x).shape)              # co dung mong doi khong?
#
# QUY UOC SHAPE CUA ANH TRONG PYTORCH:
#       (batch, kenh, cao, rong)      goi la NCHW
#
#   Luu y: thu vien anh (PIL, OpenCV, matplotlib) dung (cao, rong, kenh) - HWC.
#   Chuyen doi:
#       tensor = torch.tensor(anh).permute(2, 0, 1)     # HWC -> CHW
#       anh = tensor.permute(1, 2, 0).numpy()           # CHW -> HWC (de ve)
#
#   Quen permute la loi rat pho bien khi doc anh tu file. Trieu chung:
#   model bao loi "expected 3 channels but got 224".
#
# ANH XAM CO CAN CHIEU KENH KHONG?
#   CO. Conv2d luon can 4 chieu (batch, kenh, cao, rong), ke ca khi
#   chi co 1 kenh. Voi mang numpy shape (n, 28, 28):
#       X = torch.tensor(X).unsqueeze(1)     # -> (n, 1, 28, 28)
#   .unsqueeze(1) them mot chieu co kich thuoc 1 tai vi tri 1.
#
# VI SAO model.eval() VA no_grad() O DAY?
#   Vi day chi la kiem tra shape, khong phai train. Tao thoi quen tot.


# ===========================================================================
if __name__ == "__main__":
    assert kich_thuoc_conv(28, 3, 1, 1) == 28
    assert kich_thuoc_conv(28, 3, 1, 0) == 26
    assert kich_thuoc_conv(28, 5, 1, 2) == 28
    assert kich_thuoc_conv(28, 3, 2, 1) == 14
    assert kich_thuoc_conv(32, 5, 1, 0) == 28

    assert kich_thuoc_pool(28, 2) == 14
    assert kich_thuoc_pool(7, 2) == 3
    assert kich_thuoc_pool(28, 3, 1) == 26

    assert theo_dau_shape(
        28, [("conv", 3, 1, 1), ("pool", 2, None), ("conv", 3, 1, 1), ("pool", 2, None)]
    ) == [28, 14, 14, 7]

    cnn28 = tao_cnn(1, 4, 28)
    assert kiem_tra_forward(cnn28, 8, 1, 28) == (8, 4)

    cnn32 = tao_cnn(3, 10, 32)
    assert kiem_tra_forward(cnn32, 4, 3, 32) == (4, 10), "Phai chay dung voi anh 32x32"

    lop = tham_so_theo_lop(cnn28)
    assert [t for t, _ in lop] == ["Conv2d", "Conv2d", "Linear", "Linear"]
    assert lop[0][1] == 160        # Conv2d(1,16,3) = 1*16*9 + 16

    ss = so_sanh_tham_so(28, 1, 4)
    assert 90_000 < ss["cnn"] < 130_000
    assert 100_000 < ss["mlp"] < 130_000

    ss_lon = so_sanh_tham_so(224, 3, 4)
    assert ss_lon["mlp"] > ss_lon["cnn"] * 2, "Voi anh lon, MLP phai phinh to hon nhieu"

    print(f"  Anh 28x28 xam   : CNN {ss['cnn']:>12,}   MLP {ss['mlp']:>12,}")
    print(f"  Anh 224x224 mau : CNN {ss_lon['cnn']:>12,}   MLP {ss_lon['mlp']:>12,}")
    print("\nTat ca deu dung.")
