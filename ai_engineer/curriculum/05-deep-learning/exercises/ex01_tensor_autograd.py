"""BAI TAP 1 - Tensor va Autograd (Tuan 12).

Cham diem:  pytest tests/phase05/test_ex01.py -v
Loi giai:   curriculum/05-deep-learning/solutions/ex01_tensor_autograd.py

Can cai truoc:
    pip install torch

Muc tieu: hieu autograd tinh dao ham the nao. Sau bai nay, `loss.backward()`
khong con la phep thuat.
"""

from __future__ import annotations

import torch


# ===========================================================================
#  1.1 - Tao tensor dung kieu
# ===========================================================================
def tao_tensor(du_lieu: list) -> torch.Tensor:
    """Tao tensor kieu float32 tu list Python.

    Vi du:
        tao_tensor([1, 2, 3])        -> tensor([1., 2., 3.])  dtype float32
        tao_tensor([[1, 2], [3, 4]]) -> tensor 2 chieu, float32

    VI SAO PHAI float32?
        torch.tensor([1, 2, 3]) cho int64. Moi phep nhan voi trong so
        float32 se bao loi kieu. Deep learning LUON dung float32
        (nhanh gap doi float64 va du chinh xac).

    Goi y: torch.tensor(du_lieu, dtype=torch.float32)
    """
    # TODO
    pass


# ===========================================================================
#  1.2 - Cac phep tensor co ban
# ===========================================================================
def thong_tin_tensor(t: torch.Tensor) -> dict:
    """Tra ve thong tin co ban cua tensor.

    Tra ve dict co dung 5 khoa:
        "shape"    - tuple kich thuoc
        "so_chieu" - so chieu (ndim)
        "so_phan_tu" - tong so phan tu
        "kieu"     - ten kieu du lieu dang CHUOI, vi du "torch.float32"
        "can_grad" - True/False, tensor nay co tinh dao ham khong

    Vi du voi torch.zeros(2, 3):
        {"shape": (2, 3), "so_chieu": 2, "so_phan_tu": 6,
         "kieu": "torch.float32", "can_grad": False}

    Goi y: t.shape, t.ndim, t.numel(), t.dtype, t.requires_grad
           Nho ep tuple(t.shape) va str(t.dtype).
    """
    # TODO
    pass


def nhan_ma_tran(a: torch.Tensor, b: torch.Tensor) -> torch.Tensor:
    """Nhan ma tran a @ b.

    LUU Y: a @ b (nhan ma tran) KHAC a * b (nhan tung phan tu).
    Nham hai cai nay la bug kinh dien - kiem tra shape ket qua de phat hien.

    Vi du:
        a shape (2, 3), b shape (3, 4)  ->  ket qua shape (2, 4)
    """
    # TODO
    pass


# ===========================================================================
#  1.3 - Autograd co ban
# ===========================================================================
def dao_ham_binh_phuong(gia_tri: float) -> float:
    """Tinh dao ham cua f(w) = (w - 3)^2 tai diem `gia_tri`, DUNG AUTOGRAD.

    KHONG duoc tu viet cong thuc 2*(w-3). Phai de PyTorch tinh.

    Cac buoc:
        1. Tao tensor w tu gia_tri, voi requires_grad=True
        2. Tinh loss = (w - 3) ** 2
        3. Goi loss.backward()
        4. Tra ve w.grad dang float

    Vi du:
        dao_ham_binh_phuong(0.0)  ->  -6.0
        dao_ham_binh_phuong(5.0)  ->   4.0
        dao_ham_binh_phuong(3.0)  ->   0.0

    Goi y: torch.tensor(gia_tri, requires_grad=True)
           Nho float(w.grad) o cuoi.
    """
    # TODO
    pass


def dao_ham_nhieu_bien(x: float, y: float) -> tuple[float, float]:
    """Tinh dao ham rieng cua f(x, y) = x^2 * y + 3*y theo CA x va y.

    Bang tay:
        df/dx = 2*x*y
        df/dy = x^2 + 3

    Nhung ban phai dung AUTOGRAD, khong viet cong thuc tren.

    Tra ve (df/dx, df/dy).

    Vi du:
        dao_ham_nhieu_bien(2.0, 3.0)  ->  (12.0, 7.0)
        (2*2*3 = 12,  2^2 + 3 = 7)

    Goi y: mot lan .backward() tinh duoc dao ham theo MOI bien
           co requires_grad=True trong bieu thuc.
    """
    # TODO
    pass


# ===========================================================================
#  1.4 - Bay cong don gradient
# ===========================================================================
def gradient_cong_don(gia_tri: float, so_lan: int) -> float:
    """Goi .backward() nhieu lan MA KHONG xoa grad, tra ve w.grad cuoi cung.

    Bai tap nay de ban THAY tan mat bay cong don gradient.

    Cac buoc:
        1. Tao w = tensor(gia_tri, requires_grad=True)
        2. Lap `so_lan` lan:
              tinh loss = (w - 3) ** 2
              goi loss.backward()
           (KHONG goi w.grad.zero_() giua cac lan)
        3. Tra ve float(w.grad)

    Vi du:
        gradient_cong_don(0.0, 1)  ->  -6.0
        gradient_cong_don(0.0, 3)  -> -18.0     <- CONG DON!

    DAY LA LY DO moi training loop deu bat dau bang optimizer.zero_grad().
    Quen no thi gradient cua cac batch truoc con nguyen, model hoc sai
    ma KHONG BAO LOI GI.
    """
    # TODO
    pass


def gradient_da_xoa(gia_tri: float, so_lan: int) -> float:
    """Giong ham tren, NHUNG xoa grad truoc moi lan backward.

    Ket qua phai LUON bang dao ham dung, bat ke so_lan.

    Vi du:
        gradient_da_xoa(0.0, 1)  ->  -6.0
        gradient_da_xoa(0.0, 3)  ->  -6.0     <- khong cong don

    Goi y: neu w.grad khong phai None thi goi w.grad.zero_()
           truoc khi tinh loss moi.
    """
    # TODO
    pass


# ===========================================================================
#  1.5 - Gradient descent bang PyTorch
# ===========================================================================
def toi_uu_bang_tay(
    gia_tri_dau: float, learning_rate: float, so_buoc: int
) -> list[float]:
    """Chay gradient descent tren f(w) = (w-3)^2, TU VIET buoc cap nhat.

    Tra ve lich su cac gia tri w, gom ca gia tri ban dau.
    Do dai ket qua = so_buoc + 1

    Cac buoc moi vong lap:
        1. Xoa grad cu (neu co)
        2. Tinh loss = (w - 3) ** 2
        3. loss.backward()
        4. Cap nhat w TRONG khoi torch.no_grad():
               w -= learning_rate * w.grad
        5. Ghi float(w.detach()) vao lich su
           (dung .detach() de PyTorch khong canh bao)

    VI SAO PHAI torch.no_grad() KHI CAP NHAT?
        Neu khong, PyTorch se coi phep cap nhat la mot phan cua do thi
        tinh toan va tiep tuc theo doi no -> sai va ton bo nho.
        Buoc cap nhat KHONG phai la phep tinh can dao ham.

    Vi du:
        toi_uu_bang_tay(0.0, 0.1, 3)  ->  [0.0, 0.6, 1.08, 1.464]
        (giong het ket qua Phase 02!)
    """
    # TODO
    pass


def toi_uu_bang_optimizer(
    gia_tri_dau: float, learning_rate: float, so_buoc: int
) -> list[float]:
    """Giong ham tren, nhung dung torch.optim.SGD thay vi tu cap nhat.

    Ket qua phai GIONG HET toi_uu_bang_tay.

    Cac buoc:
        1. w = torch.tensor(gia_tri_dau, requires_grad=True)
        2. opt = torch.optim.SGD([w], lr=learning_rate)
        3. Moi vong lap:
               opt.zero_grad()
               loss = (w - 3) ** 2
               loss.backward()
               opt.step()
               ghi float(w.detach()) vao lich su

    Muc dich: thay ro optimizer chi la ban dong goi cua buoc cap nhat
    ban vua tu viet - khong co gi bi an.
    """
    # TODO
    pass


# ===========================================================================
#  1.6 - no_grad
# ===========================================================================
def du_doan_khong_grad(X: torch.Tensor, w: torch.Tensor, b: float) -> torch.Tensor:
    """Tinh X @ w + b trong khoi torch.no_grad().

    Ket qua tra ve phai co requires_grad = False, ke ca khi w co
    requires_grad = True.

    VI SAO CAN?
        Khi danh gia hoac suy luan, ta khong can dao ham. Tat autograd:
            - Nhanh hon
            - Ton it RAM hon (khong luu do thi tinh toan)
        Voi model lon, day la khac biet giua "chay duoc" va "het bo nho".

    Goi y:
        with torch.no_grad():
            return X @ w + b
    """
    # TODO
    pass


# ===========================================================================
if __name__ == "__main__":
    print("Ket qua cua ban:\n")

    t = tao_tensor([1, 2, 3])
    if t is None:
        print("  Chua lam tao_tensor.")
        raise SystemExit(0)

    print(f"  tao_tensor([1,2,3])          = {t}  dtype={t.dtype}")
    print(f"  dao_ham_binh_phuong(0.0)     = {dao_ham_binh_phuong(0.0)}")
    print(f"  dao_ham_nhieu_bien(2.0, 3.0) = {dao_ham_nhieu_bien(2.0, 3.0)}")
    print()
    print(f"  gradient_cong_don(0.0, 3)    = {gradient_cong_don(0.0, 3)}   <- cong don!")
    print(f"  gradient_da_xoa(0.0, 3)      = {gradient_da_xoa(0.0, 3)}   <- dung")
    print()
    print(f"  toi_uu_bang_tay(0, 0.1, 3)      = {toi_uu_bang_tay(0.0, 0.1, 3)}")
    print(f"  toi_uu_bang_optimizer(0, 0.1, 3) = {toi_uu_bang_optimizer(0.0, 0.1, 3)}")
