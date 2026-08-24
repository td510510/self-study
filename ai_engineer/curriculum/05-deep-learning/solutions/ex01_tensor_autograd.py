"""LOI GIAI - Bai tap 1, Phase 05."""

from __future__ import annotations

import torch


# ===========================================================================
def tao_tensor(du_lieu: list) -> torch.Tensor:
    return torch.tensor(du_lieu, dtype=torch.float32)


# VI SAO PHAI CHI RO dtype?
#   torch.tensor([1, 2, 3])      -> int64    (suy ra tu list Python)
#   torch.tensor([1., 2., 3.])   -> float32  (co dau cham)
#   torch.tensor([1, 2], dtype=torch.float32) -> float32 (ro rang nhat)
#
#   Loi hay gap nhat cua nguoi moi voi PyTorch:
#       RuntimeError: expected scalar type Float but found Long
#   Nguyen nhan: mot tensor la int64, mot tensor la float32.
#
# VI SAO DEEP LEARNING DUNG float32 MA KHONG PHAI float64?
#   - Nhanh gap doi, ton nua bo nho
#   - GPU duoc thiet ke toi uu cho float32
#   - Do chinh xac 32-bit thua du cho mang neural (gradient von da nhieu)
#
#   Thuc te con di xa hon: float16 (half) va bfloat16 duoc dung rong rai
#   khi train model lon - nhanh hon nua, va do chinh xac van du.
#   NumPy thi nguoc lai, mac dinh float64 vi no phuc vu tinh toan khoa hoc.


# ===========================================================================
def thong_tin_tensor(t: torch.Tensor) -> dict:
    return {
        "shape": tuple(t.shape),
        "so_chieu": t.ndim,
        "so_phan_tu": t.numel(),
        "kieu": str(t.dtype),
        "can_grad": t.requires_grad,
    }


def nhan_ma_tran(a: torch.Tensor, b: torch.Tensor) -> torch.Tensor:
    return a @ b


# TENSOR vs NUMPY ARRAY - gan nhu giong het, tru ba diem:
#   1. requires_grad  - theo doi de tinh dao ham
#   2. .to(device)    - chuyen sang GPU
#   3. dtype mac dinh float32 (NumPy la float64)
#
# CHUYEN QUA LAI:
#   torch.from_numpy(mang_np)   # numpy -> tensor (DUNG CHUNG bo nho!)
#   tensor.numpy()              # tensor -> numpy (chi khi o CPU va khong co grad)
#   tensor.detach().cpu().numpy()   # cach an toan trong moi truong hop
#
#   Luu y "dung chung bo nho": sua mang numpy se sua ca tensor va nguoc lai.
#   Muon doc lap thi .clone().
#
# @ vs * - NHAC LAI vi day la bug im lang:
#   a * b  nhan tung phan tu, ket qua cung shape
#   a @ b  nhan ma tran, shape doi theo quy tac (m,n)@(n,p) -> (m,p)
#   Cach phat hien: in .shape cua ket qua ra xem co dung mong doi khong.


# ===========================================================================
def dao_ham_binh_phuong(gia_tri: float) -> float:
    w = torch.tensor(gia_tri, requires_grad=True)
    loss = (w - 3) ** 2
    loss.backward()
    return float(w.grad)


# CHUYEN GI XAY RA BEN TRONG?
#
#   1. w = tensor(0.0, requires_grad=True)
#      -> PyTorch danh dau: "theo doi moi phep tinh lien quan den w"
#
#   2. loss = (w - 3) ** 2
#      -> PyTorch xay DO THI TINH TOAN:
#            w --(tru 3)--> u --(binh phuong)--> loss
#         Moi nut ghi nho cach tinh dao ham cua rieng no.
#
#   3. loss.backward()
#      -> Lan NGUOC do thi, ap dung quy tac chuoi:
#            dloss/du = 2u
#            du/dw    = 1
#            dloss/dw = 2u * 1 = 2(w-3) = -6
#      -> Ket qua duoc luu vao w.grad
#
#   DO CHINH LA BACKPROPAGATION. Khong co gi huyen bi - chi la quy tac
#   chuoi duoc ap dung tu dong tren mot do thi.
#
# VI SAO KHONG TU VIET CONG THUC?
#   Voi f(w) = (w-3)^2 thi de. Voi mang neural 50 lop va 10 trieu tham so,
#   viet tay la bat kha thi. Autograd lam viec do trong mili giay.
#
#   Truoc khi co autograd (truoc ~2015), nguoi ta phai TU VIET ham backward
#   cho tung loai lop. Do la ly do deep learning bung no sau khi
#   TensorFlow/PyTorch xuat hien.
#
# float(w.grad) de tra ve so Python thuong thay vi tensor 0 chieu.


# ===========================================================================
def dao_ham_nhieu_bien(x: float, y: float) -> tuple[float, float]:
    tx = torch.tensor(x, requires_grad=True)
    ty = torch.tensor(y, requires_grad=True)

    f = tx**2 * ty + 3 * ty
    f.backward()

    return float(tx.grad), float(ty.grad)


# MOT LAN backward() TINH DAO HAM THEO MOI BIEN.
#   Do la diem manh cot loi cua autograd: du bieu thuc co 1 bien hay
#   175 TY bien (GPT-3), van chi mot lenh .backward().
#
#   Chi phi tinh backward xap xi bang 2 lan chi phi forward - bat ke
#   so luong tham so. Day la ket qua toan hoc dep va la ly do
#   deep learning kha thi ve mat tinh toan.
#
# KIEM CHUNG BANG TAY:
#   f(x,y) = x^2 * y + 3y
#   df/dx = 2xy        tai (2,3) -> 2*2*3 = 12   OK
#   df/dy = x^2 + 3    tai (2,3) -> 4 + 3  = 7   OK
#
# MEO KIEM TRA GRADIENT (gradient checking):
#   Khi tu viet mot lop moi, so sanh gradient cua autograd voi dao ham so:
#       (f(w+h) - f(w-h)) / (2h)   voi h ~ 1e-5
#   Neu lech qua 1e-4 thi ban co bug. torch.autograd.gradcheck() lam
#   viec nay tu dong.


# ===========================================================================
def gradient_cong_don(gia_tri: float, so_lan: int) -> float:
    w = torch.tensor(gia_tri, requires_grad=True)

    for _ in range(so_lan):
        loss = (w - 3) ** 2
        loss.backward()

    return float(w.grad)


def gradient_da_xoa(gia_tri: float, so_lan: int) -> float:
    w = torch.tensor(gia_tri, requires_grad=True)

    for _ in range(so_lan):
        if w.grad is not None:
            w.grad.zero_()
        loss = (w - 3) ** 2
        loss.backward()

    return float(w.grad)


# DAY LA BUG PHO BIEN NHAT CUA NGUOI MOI HOC PYTORCH.
#
#   .grad duoc CONG DON chu khong ghi de. Quen xoa thi gradient cua
#   cac batch truoc con nguyen, va model cap nhat theo mot huong
#   khong con y nghia gi.
#
#   Trieu chung: loss giam rat cham, hoac dao dong, hoac bung no.
#   KHONG co thong bao loi nao. Rat kho tim neu khong biet truoc.
#
# VI SAO PYTORCH THIET KE NHU VAY thay vi tu xoa?
#   Vi co truong hop ta MUON cong don, goi la "gradient accumulation":
#
#       for i, (xb, yb) in enumerate(loader):
#           loss = ham_loss(model(xb), yb) / so_buoc_gop
#           loss.backward()                      # cong don
#           if (i + 1) % so_buoc_gop == 0:
#               opt.step()
#               opt.zero_grad()
#
#   Ky thuat nay mo phong batch lon tren GPU nho: gop gradient cua
#   4 batch nho de tuong duong mot batch gap 4 lan. Rat hay dung khi
#   fine-tune model lon tren GPU pho thong.
#
# TRONG THUC TE ban goi optimizer.zero_grad() thay vi w.grad.zero_() -
# no xoa gradient cua TAT CA tham so trong model chi bang mot lenh.
#
# LUU Y: w.grad la None truoc lan backward dau tien, nen phai kiem tra
# `if w.grad is not None` - neu khong se loi AttributeError.


# ===========================================================================
def toi_uu_bang_tay(
    gia_tri_dau: float, learning_rate: float, so_buoc: int
) -> list[float]:
    w = torch.tensor(gia_tri_dau, requires_grad=True)
    lich_su = [float(w.detach())]

    for _ in range(so_buoc):
        if w.grad is not None:
            w.grad.zero_()

        loss = (w - 3) ** 2
        loss.backward()

        with torch.no_grad():
            w -= learning_rate * w.grad

        lich_su.append(float(w.detach()))

    return lich_su


def toi_uu_bang_optimizer(
    gia_tri_dau: float, learning_rate: float, so_buoc: int
) -> list[float]:
    w = torch.tensor(gia_tri_dau, requires_grad=True)
    opt = torch.optim.SGD([w], lr=learning_rate)
    lich_su = [float(w.detach())]

    for _ in range(so_buoc):
        opt.zero_grad()
        loss = (w - 3) ** 2
        loss.backward()
        opt.step()
        lich_su.append(float(w.detach()))

    return lich_su


# HAI HAM NAY CHO KET QUA GIONG HET NHAU.
#   Do la muc dich cua bai tap: cho ban thay optimizer KHONG phai
#   phep thuat. torch.optim.SGD chi lam dung mot viec:
#       tham_so -= lr * tham_so.grad
#   cho moi tham so trong danh sach.
#
#   Va ket qua cung giong het bai tap Phase 02:
#       [0.0, 0.6, 1.08, 1.464]
#   Cung mot thuat toan, chi khac cong cu.
#
# VI SAO PHAI torch.no_grad() KHI CAP NHAT?
#   Neu khong, phep `w -= lr * w.grad` bi coi la mot phep tinh moi
#   trong do thi tinh toan. Hau qua:
#     - PyTorch bao loi: "a leaf Variable that requires grad is being
#       used in an in-place operation"
#     - Hoac do thi phinh to mai, ton bo nho
#
#   Buoc cap nhat tham so KHONG phai la phep tinh can dao ham -
#   no la HANH DONG dua tren dao ham da tinh xong.
#
# CAC OPTIMIZER KHAC:
#   SGD(lr=0.01)                     co ban nhat
#   SGD(lr=0.01, momentum=0.9)       nho huong di truoc -> muot hon,
#                                    vuot qua duoc cac ho nong
#   Adam(lr=1e-3)                    tu dieu chinh lr cho TUNG tham so
#                                    -> MAC DINH NEN DUNG
#   AdamW(lr=1e-3, weight_decay=..)  Adam + weight decay dung cach,
#                                    la lua chon cho Transformer/LLM
#
#   Voi Adam, lr = 1e-3 la diem khoi dau tot cho gan nhu moi bai toan.


# ===========================================================================
def du_doan_khong_grad(X: torch.Tensor, w: torch.Tensor, b: float) -> torch.Tensor:
    with torch.no_grad():
        return X @ w + b


# torch.no_grad() TAT VIEC GHI DO THI TINH TOAN.
#
#   Loi ich:
#     - Nhanh hon (khong phai ghi lai lich su phep tinh)
#     - Ton it RAM hon DANG KE
#
#   Voi model lon, day la khac biet giua "chay duoc" va "CUDA out of memory".
#   Vi du: dung ResNet suy luan tren batch 256 anh - co no thi vua GPU,
#   khong co thi tran bo nho.
#
# LUON DUNG KHI:
#   - Danh gia tren tap validation/test
#   - Suy luan trong san xuat
#   - Tinh toan phu tro khong lien quan den hoc
#
# BA CACH TUONG TU, KHAC NHAU O SAC THAI:
#
#   with torch.no_grad():        # tat autograd trong khoi lenh
#       ...
#
#   @torch.no_grad()             # tat autograd cho ca ham
#   def danh_gia(...): ...
#
#   x.detach()                   # tach MOT tensor khoi do thi
#
#   .detach() hay dung khi ban muon lay gia tri ra de ghi log ma khong
#   muon giu ca do thi tinh toan:
#       tong_loss += loss.detach()      # hoac loss.item()
#
#   Quen .detach()/.item() khi cong don loss la mot nguyen nhan
#   ro ri bo nho kinh dien: ban vo tinh giu lai do thi cua MOI batch.
#
#   Cung vi vay, khi ghi lich su gia tri tham so ta viet float(w.detach())
#   chu khong phai float(w) - neu khong PyTorch se canh bao.
#
# LUU Y: torch.no_grad() KHONG thay the model.eval().
#   no_grad  -> tat tinh dao ham (van de bo nho/toc do)
#   eval()   -> doi hanh vi cua Dropout va BatchNorm (van de DUNG/SAI)
#   Khi danh gia, phai dung CA HAI.


# ===========================================================================
if __name__ == "__main__":
    t = tao_tensor([1, 2, 3])
    assert t.dtype == torch.float32

    tt = thong_tin_tensor(torch.zeros(2, 3))
    assert tt["shape"] == (2, 3) and tt["so_phan_tu"] == 6
    assert tt["kieu"] == "torch.float32" and tt["can_grad"] is False

    assert nhan_ma_tran(torch.ones(2, 3), torch.ones(3, 4)).shape == (2, 4)

    assert abs(dao_ham_binh_phuong(0.0) + 6.0) < 1e-6
    assert abs(dao_ham_binh_phuong(5.0) - 4.0) < 1e-6

    dx, dy = dao_ham_nhieu_bien(2.0, 3.0)
    assert abs(dx - 12.0) < 1e-6 and abs(dy - 7.0) < 1e-6

    assert abs(gradient_cong_don(0.0, 3) + 18.0) < 1e-6
    assert abs(gradient_da_xoa(0.0, 3) + 6.0) < 1e-6

    ls1 = toi_uu_bang_tay(0.0, 0.1, 3)
    ls2 = toi_uu_bang_optimizer(0.0, 0.1, 3)
    assert len(ls1) == 4
    assert abs(ls1[1] - 0.6) < 1e-5
    assert all(abs(a - b) < 1e-5 for a, b in zip(ls1, ls2))

    w = torch.ones(3, requires_grad=True)
    kq = du_doan_khong_grad(torch.ones(2, 3), w, 1.0)
    assert kq.requires_grad is False

    print("Tat ca deu dung.")
