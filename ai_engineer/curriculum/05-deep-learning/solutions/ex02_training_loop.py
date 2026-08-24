"""LOI GIAI - Bai tap 2, Phase 05."""

from __future__ import annotations

import torch
import torch.nn as nn


# ===========================================================================
def tao_mlp(so_dau_vao: int, cac_lop_an: list[int], so_lop_ra: int) -> nn.Module:
    cac_lop: list[nn.Module] = []
    kich_thuoc_truoc = so_dau_vao

    for kich_thuoc in cac_lop_an:
        cac_lop.append(nn.Linear(kich_thuoc_truoc, kich_thuoc))
        cac_lop.append(nn.ReLU())
        kich_thuoc_truoc = kich_thuoc

    cac_lop.append(nn.Linear(kich_thuoc_truoc, so_lop_ra))
    return nn.Sequential(*cac_lop)


def dem_tham_so(model: nn.Module) -> int:
    return sum(p.numel() for p in model.parameters() if p.requires_grad)


# nn.Linear(a, b) LAM GI?
#   Chinh la phep ban da viet o Phase 02:   output = input @ W + bias
#   voi W shape (a, b) va bias shape (b,).
#   So tham so = a*b + b
#
# VI SAO LOP CUOI KHONG CO ReLU?
#   Hai ly do:
#   1. ReLU cat het gia tri am. Logits can duoc phep am -
#      "rat khong phai lop nay" la thong tin co ich.
#   2. CrossEntropyLoss DA bao gom log-softmax ben trong.
#      Them softmax vao model = ap dung hai lan -> model hoc rat te
#      ma KHONG BAO LOI GI. Day la bay so 1 cua nguoi moi.
#
#   QUY TAC: model phan loai tra ve LOGITS THO.
#   Chi dung softmax khi can hien thi xac suat cho nguoi xem.
#
# VI SAO KHONG CO ReLU SAU LOP CUOI CUNG NHUNG CO GIUA CAC LOP?
#   Khong co ham phi tuyen, chong bao nhieu lop tuyen tinh cung
#   tuong duong MOT lop:
#       (X @ W1) @ W2 = X @ (W1 @ W2) = X @ W_moi
#   Ham kich hoat la thu DUY NHAT lam mang sau co y nghia.
#
# CACH VIET KHAC - dung class (linh hoat hon khi kien truc phuc tap):
#     class MLP(nn.Module):
#         def __init__(self, ...):
#             super().__init__()
#             self.lop1 = nn.Linear(784, 128)
#             self.lop2 = nn.Linear(128, 10)
#         def forward(self, x):
#             x = torch.relu(self.lop1(x))
#             return self.lop2(x)
#
#   nn.Sequential gon hon cho mang tuyen tinh don gian.
#   Dung class khi can nhanh re, skip connection, hoac nhieu dau vao.
#
# DEM THAM SO de lam gi?
#   - Uoc luong bo nho va toc do
#   - So sanh do phuc tap giua cac kien truc
#   - Phat hien nham lan: neu ban dinh xay mang nho ma ra 50 trieu
#     tham so, chac chan co cho sai
#   Con so nay chinh la thu nguoi ta noi khi bao "GPT-3 co 175 ty tham so".


# ===========================================================================
def tao_batch(
    X: torch.Tensor, y: torch.Tensor, batch_size: int, xao_tron: bool = True, seed: int = 42
) -> list[tuple[torch.Tensor, torch.Tensor]]:
    n = len(X)

    if xao_tron:
        g = torch.Generator().manual_seed(seed)
        chi_so = torch.randperm(n, generator=g)
    else:
        chi_so = torch.arange(n)

    cac_batch = []
    for i in range(0, n, batch_size):
        idx = chi_so[i : i + batch_size]
        cac_batch.append((X[idx], y[idx]))

    return cac_batch


# VI SAO CHIA BATCH?
#   - Ca tap mot luc: khong du RAM/VRAM voi du lieu lon, va chi cap nhat
#     tham so mot lan moi epoch -> hoc rat cham
#   - Tung mau mot: cap nhat lien tuc nhung gradient rat nhieu, va
#     khong tan dung duoc kha nang tinh song song cua GPU
#   - Mini-batch (32-256): can bang tot nhat
#
#   Nhieu trong mini-batch thuc ra CO LOI: no giup thoat khoi cac cuc
#   tieu dia phuong nong. Do la ly do thuat toan ten la
#   "Stochastic Gradient Descent" - chu "stochastic" nghia la ngau nhien.
#
# VI SAO XAO TRON MOI EPOCH?
#   Neu du lieu duoc sap xep theo lop (2000 anh tron, roi 2000 anh vuong...)
#   thi khong xao tron se khien moi batch chi chua MOT lop.
#   Gradient cua batch do chi noi "hay doan lop nay cho moi thu" -
#   model dao qua dao lai va khong hoi tu.
#
#   Ke ca khi du lieu da ngau nhien, xao tron van giup: model gap cac
#   to hop mau khac nhau moi epoch -> it hoc thuoc thu tu hon.
#
# BATCH CUOI NHO HON CO SAO KHONG?
#   Khong sao. 8000 mau voi batch_size 64 -> 125 batch chan.
#   Nhung 8010 mau -> 125 batch day + 1 batch 10 mau.
#   PyTorch xu ly binh thuong. (DataLoader co drop_last=True neu ban
#   muon bo batch le - can khi dung BatchNorm voi batch qua nho.)
#
# TRONG THUC TE ban dung torch.utils.data.DataLoader:
#     loader = DataLoader(dataset, batch_size=64, shuffle=True, num_workers=4)
#   No lo them: nap du lieu song song, ghim bo nho, tang toc chuyen GPU.
#   Bai tap nay tu viet de ban hieu no lam gi ben trong.


# ===========================================================================
def train_mot_epoch(
    model: nn.Module,
    cac_batch: list[tuple[torch.Tensor, torch.Tensor]],
    ham_loss: nn.Module,
    optimizer: torch.optim.Optimizer,
) -> float:
    model.train()
    tong_loss = 0.0

    for X_batch, y_batch in cac_batch:
        y_pred = model(X_batch)                 # ① FORWARD
        loss = ham_loss(y_pred, y_batch)        # ② LOSS

        optimizer.zero_grad()                   # ③ XOA GRADIENT CU
        loss.backward()                         #    BACKWARD
        optimizer.step()                        # ④ UPDATE

        tong_loss += loss.item()

    return tong_loss / len(cac_batch)


# SAU DONG NAY LA TOAN BO DEEP LEARNING.
#
#   Doi chieu voi Phase 02, noi ban tu viet moi thu:
#
#     Phase 02 (numpy)                  PyTorch
#     ------------------------------    -----------------------
#     y_pred = X @ w + b                y_pred = model(X)
#     loss = np.mean((y_pred-y)**2)     loss = ham_loss(y_pred, y)
#     grad_w = (2/n) * X.T @ sai_so     loss.backward()
#     w = w - lr * grad_w               optimizer.step()
#
#   PyTorch chi thay ban lam BUOC 3 - buoc kho nhat. Ba buoc kia
#   ban van tu viet, va chung giong het thuat toan ban da hieu.
#
# VI SAO model.train()?
#   Bat che do train cho Dropout (bat viec tat ngau nhien no-ron) va
#   BatchNorm (dung thong ke cua batch hien tai). Voi model khong co
#   hai lop nay thi goi cung khong hai gi - nen cu tao thoi quen goi.
#
# VI SAO loss.item() MA KHONG PHAI loss?
#   `loss` la tensor GAN VOI do thi tinh toan cua ca batch do.
#   Cong don tensor nghia la giu lai do thi cua MOI batch trong epoch
#   -> bo nho phinh len tuyen tinh -> het RAM sau vai tram batch.
#
#   .item() lay ra so Python thuan, cat dut moi lien he voi do thi.
#   Day la mot trong nhung nguyen nhan "CUDA out of memory" kho hieu nhat.
#
# THU TU zero_grad() - dat o dau cung duoc?
#   Ba cach deu chay dung:
#       zero_grad() -> forward -> backward -> step
#       forward -> loss -> zero_grad() -> backward -> step   (o day)
#       forward -> loss -> backward -> step -> zero_grad()
#   Mien la zero_grad() nam GIUA hai lan backward().
#   Dat truoc backward() la an toan va de doc nhat.


# ===========================================================================
def danh_gia(
    model: nn.Module, X: torch.Tensor, y: torch.Tensor, ham_loss: nn.Module
) -> dict[str, float]:
    model.eval()

    with torch.no_grad():
        logits = model(X)
        loss = ham_loss(logits, y)
        du_doan = logits.argmax(dim=1)
        accuracy = (du_doan == y).float().mean()

    return {"loss": float(loss), "accuracy": float(accuracy)}


# HAI THU BAT BUOC KHI DANH GIA:
#
#   model.eval()      - doi HANH VI cua model
#       Dropout: tat viec tat no-ron ngau nhien (khi suy luan phai dung
#                toan bo mang)
#       BatchNorm: dung thong ke trung binh dong da tich luy trong qua
#                trinh train, thay vi thong ke cua batch hien tai
#
#       Quen eval() -> ket qua danh gia SAI va dao dong giua cac lan chay.
#       Day la mot trong nhung bug kho tim nhat voi nguoi moi, vi
#       model van chay va van cho ra so.
#
#   torch.no_grad()   - tat TINH DAO HAM
#       Nhanh hon, ton it RAM hon. Khong anh huong den ket qua,
#       chi anh huong hieu nang.
#
#   HAI THU NAY KHAC NHAU, phai dung CA HAI khi danh gia.
#   Nho quay lai model.train() truoc epoch tiep theo!
#
# argmax(dim=1) LAM GI?
#   logits co shape (n_mau, n_lop). Voi moi hang, tim vi tri co gia tri
#   lon nhat -> do la lop duoc du doan.
#       logits = [[1.2, 3.5, 0.1],     -> argmax = 1
#                 [0.3, 0.2, 4.1]]     -> argmax = 2
#
#   Khong can softmax de tim argmax: softmax la ham DONG BIEN, no khong
#   doi thu tu. Vi tri lon nhat cua logits cung la vi tri lon nhat cua
#   xac suat. Chi dung softmax khi ban can chinh gia tri XAC SUAT.
#
# (du_doan == y).float().mean() LA MEO TINH ACCURACY:
#   So sanh cho ra tensor boolean, .float() doi True/False thanh 1.0/0.0,
#   .mean() cho ra ty le dung. Giong het meo (dieu_kien).mean() voi numpy
#   ban da dung o Phase 03.


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
    ham_loss = nn.CrossEntropyLoss()
    optimizer = torch.optim.Adam(model.parameters(), lr=learning_rate)

    lich_su: dict[str, list[float]] = {
        "train_loss": [], "val_loss": [], "train_acc": [], "val_acc": []
    }

    for epoch in range(so_epoch):
        cac_batch = tao_batch(X_train, y_train, batch_size, xao_tron=True, seed=seed + epoch)
        train_mot_epoch(model, cac_batch, ham_loss, optimizer)

        kq_train = danh_gia(model, X_train, y_train, ham_loss)
        kq_val = danh_gia(model, X_val, y_val, ham_loss)

        lich_su["train_loss"].append(kq_train["loss"])
        lich_su["train_acc"].append(kq_train["accuracy"])
        lich_su["val_loss"].append(kq_val["loss"])
        lich_su["val_acc"].append(kq_val["accuracy"])

    return lich_su


# VI SAO seed = seed + epoch?
#   Moi epoch can mot cach xao tron KHAC NHAU (neu giong nhau thi
#   xao tron mat y nghia). Nhung toan bo qua trinh train van phai
#   TAI LAP DUOC. Cong so epoch vao seed dat duoc ca hai.
#
# VI SAO DANH GIA CA TREN TAP TRAIN?
#   De so sanh train vs val - cach duy nhat phat hien overfit.
#   Chi nhin val loss thi khong biet model dang overfit hay
#   bai toan von kho.
#
#   Luu y: loss tra ve tu train_mot_epoch la TRUNG BINH TRONG epoch,
#   trong khi kq_train["loss"] duoc do SAU epoch voi model.eval().
#   Hai con so nay khac nhau (cai sau thuong thap hon) - do la binh thuong.
#   Vi ta muon so sanh cong bang train vs val nen dung cai do sau.
#
# CrossEntropyLoss NHAN GI?
#   logits shape (n_mau, n_lop)   - so thuc bat ky, KHONG qua softmax
#   nhan   shape (n_mau,)         - so nguyen 0..n_lop-1, KHONG one-hot
#
#   Loi hay gap:
#     - Truyen xac suat da softmax -> model hoc te
#     - Truyen nhan one-hot -> loi shape
#     - Nhan kieu float -> loi "expected Long"
#
# Adam(lr=1e-3) LA LUA CHON MAC DINH TOT CHO GAN NHU MOI BAI TOAN.
#   Adam tu dieu chinh learning rate cho TUNG tham so dua tren lich su
#   gradient cua no. Nho vay it phai chinh tay hon SGD rat nhieu.
#   Voi Transformer/LLM, nguoi ta dung AdamW (Adam + weight decay dung cach).
#
# TRONG THUC TE nen bo sung:
#   - Early stopping: dung khi val_loss khong cai thien sau N epoch
#   - Luu checkpoint tot nhat: torch.save(model.state_dict(), ...)
#   - Learning rate scheduler: giam lr dan ve cuoi
#   Bai tap giu don gian de tap trung vao vong lap cot loi.


# ===========================================================================
def chan_doan_duong_cong(train_loss: list[float], val_loss: list[float]) -> str:
    if val_loss[-1] > min(val_loss) * 1.1:
        return "Overfit"
    if train_loss[-1] > train_loss[0] * 0.9:
        return "Chua hoc duoc"
    if train_loss[-1] < val_loss[-1] * 0.5:
        return "Overfit"
    return "Tot"


# DUONG CONG HOC CHO BIET NHIEU HON BAT KY CON SO DON LE NAO.
#
#   Loss                              Loss
#    │╲                                │╲
#    │ ╲___ train                      │ ╲___ train
#    │     ╲_____                      │     ╲______
#    │  ╲___                           │  ╲___    ___╱─── val  <- TANG TRO LAI
#    │      ╲____ val                  │      ╲__╱
#    └──────────────> epoch            └──────────────> epoch
#         TOT                              OVERFIT tu day
#
# BON DAU HIEU VA CACH XU LY:
#
#   1. val_loss TANG TRO LAI sau khi da giam  ->  OVERFIT
#      Chua: early stopping (dung o diem val_loss thap nhat), them du lieu,
#            dropout, weight decay, augmentation
#
#   2. Ca hai loss GAN NHU KHONG GIAM  ->  CHUA HOC DUOC
#      Chua: tang learning rate, model lon hon, train lau hon,
#            KIEM TRA LAI DU LIEU (nhan co dung khong? da chuan hoa chua?)
#      Neu loss dung im tu dau, rat co the co bug - vi du quen zero_grad()
#      hoac quen truyen tham so vao optimizer.
#
#   3. Loss thanh nan hoac bung no  ->  LEARNING RATE QUA LON
#      Chua: giam lr 10 lan. Neu van nan, kiem tra du lieu co nan khong,
#            hoac dung gradient clipping.
#
#   4. train_loss THAP HON HAN val_loss  ->  OVERFIT
#      Khoang cach bao nhieu la nhieu? Khong co con so tuyet doi -
#      dieu quan trong la XU HUONG: khoang cach dang no rong ra hay
#      giu on dinh?
#
# EARLY STOPPING - ky thuat re va hieu qua nhat:
#       tot_nhat = float("inf"); kien_nhan = 0
#       for epoch in ...:
#           ...
#           if val_loss < tot_nhat:
#               tot_nhat = val_loss; kien_nhan = 0
#               torch.save(model.state_dict(), "tot_nhat.pt")
#           else:
#               kien_nhan += 1
#               if kien_nhan >= 5:
#                   break
#   Nho vay ban luon giu duoc model tai diem val tot nhat, khong phai
#   model o epoch cuoi (thuong da overfit).


# ===========================================================================
if __name__ == "__main__":
    torch.manual_seed(0)

    m = tao_mlp(4, [8], 2)
    assert dem_tham_so(m) == 58
    assert len(tao_mlp(10, [], 2)) == 1, "Khong co lop an -> chi mot Linear"

    X = torch.randn(10, 4)
    y = torch.randint(0, 2, (10,))
    b = tao_batch(X, y, 4)
    assert len(b) == 3
    assert [len(xb) for xb, _ in b] == [4, 4, 2]

    # Train thu tren du lieu tong hop de dam bao vong lap chay dung
    torch.manual_seed(0)
    n = 600
    X = torch.randn(n, 4)
    y = (X[:, 0] + X[:, 1] > 0).long()
    model = tao_mlp(4, [16], 2)

    ls = train_model(model, X[:500], y[:500], X[500:], y[500:], so_epoch=15, batch_size=32)

    assert set(ls) == {"train_loss", "val_loss", "train_acc", "val_acc"}
    assert len(ls["train_loss"]) == 15
    assert ls["train_loss"][-1] < ls["train_loss"][0], "Loss phai giam"
    assert ls["val_acc"][-1] > 0.85, f"Bai toan de, phai dat >85%, duoc {ls['val_acc'][-1]:.3f}"

    assert chan_doan_duong_cong([2.0, 1.0, 0.5], [2.0, 1.1, 0.9]) == "Tot"
    assert chan_doan_duong_cong([2.0, 0.5, 0.1], [2.0, 0.8, 1.5]) == "Overfit"
    assert chan_doan_duong_cong([2.0, 1.99, 1.98], [2.0, 2.0, 2.0]) == "Chua hoc duoc"

    print(f"  val_acc cuoi = {ls['val_acc'][-1]:.4f}")
    print("Tat ca deu dung.")
