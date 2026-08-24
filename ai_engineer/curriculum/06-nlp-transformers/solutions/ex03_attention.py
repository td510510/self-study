"""LOI GIAI - Bai tap 3, Phase 06."""

from __future__ import annotations

import math

import torch


# ===========================================================================
def softmax(x: torch.Tensor, dim: int = -1) -> torch.Tensor:
    x_on_dinh = x - x.max(dim=dim, keepdim=True).values
    e = torch.exp(x_on_dinh)
    return e / e.sum(dim=dim, keepdim=True)


# MEO "TRU DI MAX" - ky thuat kinh dien trong tinh toan so hoc.
#
#   Ve mat toan hoc:
#       softmax(x)_i = e^(x_i) / sum e^(x_j)
#                    = e^(x_i - c) / sum e^(x_j - c)     voi c bat ky
#   Nhan ca tu va mau voi e^(-c) - gia tri khong doi.
#
#   Chon c = max(x) thi so mu lon nhat bang 0 -> e^0 = 1 -> khong bao gio tran.
#
#   KHONG co meo nay:
#       e^1000 = inf  ->  inf/inf = nan  ->  moi phep tinh sau deu nan
#
#   Thu nghiem: bo dong tru max di roi chay lai. Ban se thay nan xuat hien.
#
# VI SAO keepdim=True?
#   x        shape (B, T, T)
#   max khong keepdim -> (B, T)     -> broadcasting SAI
#   max co  keepdim   -> (B, T, 1)  -> broadcasting DUNG
#   Loi shape hay gap nhat khi tu viet cac phep gop chieu.
#
# .max(dim=...) tra ve NamedTuple (values, indices) - phai lay .values.
#   Khac voi .max() khong tham so (tra ve mot so).
#
# TRONG THUC TE dung torch.softmax(x, dim=-1) - da toi uu va on dinh san.
#   Bai tap bat tu viet de ban hieu vi sao no on dinh.


# ===========================================================================
def attention(
    Q: torch.Tensor, K: torch.Tensor, V: torch.Tensor, mask: torch.Tensor | None = None
) -> tuple[torch.Tensor, torch.Tensor]:
    d = Q.shape[-1]

    diem = Q @ K.transpose(-2, -1) / math.sqrt(d)          # (..., T_q, T_k)

    if mask is not None:
        diem = diem.masked_fill(mask == 0, float("-inf"))

    trong_so = softmax(diem, dim=-1)
    return trong_so @ V, trong_so


# BON DONG NAY LA TRAI TIM CUA MOI LLM.
#
# DOC TUNG BUOC BANG AN DU THU VIEN:
#
#   Q (Query)  "Toi dang tim gi?"        - cau hoi tra cuu
#   K (Key)    "Toi chua thong tin gi?"  - nhan tren gay sach
#   V (Value)  "Noi dung that cua toi"   - noi dung trong sach
#
#   1. Q @ K^T           : moi cau hoi so voi moi nhan  -> diem giong nhau
#   2. / sqrt(d)         : giu phuong sai on dinh
#   3. masked_fill(-inf) : che nhung sach khong duoc phep xem
#   4. softmax           : doi diem thanh TRONG SO, tong bang 1
#   5. @ V               : trung binh CO TRONG SO cac noi dung
#
# VI SAO CHIA CHO sqrt(d)? - giai thich day du:
#
#   Neu cac phan tu cua Q va K doc lap, ky vong 0, phuong sai 1, thi
#   tich vo huong Q.K co phuong sai bang d. Voi d = 512, do lech chuan
#   la ~22.6 - cac diem nam rai tu -70 den +70.
#
#   Softmax tren dai gia tri rong nhu vay tro nen CUC NHON: mot phan tu
#   gan bang 1, con lai gan bang 0. Dao ham cua softmax o vung bao hoa
#   gan bang 0 -> GRADIENT BIEN MAT -> model khong hoc duoc gi.
#
#   Chia cho sqrt(d) dua phuong sai ve 1 -> softmax "mem" -> gradient chay.
#
#   Thu nghiem trong notebook: bo phep chia va nhin ma tran attention -
#   ban se thay no gan nhu one-hot ngay tu dau.
#
# masked_fill(mask == 0, -inf) hoat dong the nao?
#   e^(-inf) = 0, nen sau softmax cac vi tri do co trong so DUNG BANG 0.
#   Dung -1e9 thay -inf cung duoc va tranh duoc mot so canh bao,
#   nhung -inf ro rang ve y dinh hon.
#
#   CANH BAO: neu MOT HANG bi che TOAN BO, softmax cua toan -inf ra nan.
#   Voi causal mask thi khong xay ra (moi token luon nhin duoc chinh no),
#   nhung voi padding mask thi co the - can chu y.
#
# VI SAO TRA VE CA trong_so?
#   De VE DUOC ma tran attention. Do la cong cu chan doan manh nhat khi
#   debug Transformer: nhin vao no ban thay model dang chu y vao dau.
#   Ban se ve no o bai 3 va bai 4 trong lessons/.


# ===========================================================================
def tao_causal_mask(T: int) -> torch.Tensor:
    return torch.tril(torch.ones(T, T))


def attention_nhan_qua(
    Q: torch.Tensor, K: torch.Tensor, V: torch.Tensor
) -> tuple[torch.Tensor, torch.Tensor]:
    T = Q.shape[-2]
    return attention(Q, K, V, mask=tao_causal_mask(T))


# torch.tril = TRIangular Lower - giu tam giac DUOI, phan tren thanh 0.
#   torch.triu la tam giac tren.
#
# MOT DONG NAY TAO RA KHAC BIET GIUA GPT VA BERT:
#
#   CO mask (causal / decoder-only):
#       GPT, Claude, Llama - model SINH van ban
#       Moi token chi nhin duoc qua khu -> co the sinh tuan tu
#
#   KHONG mask (bidirectional / encoder-only):
#       BERT, PhoBERT - model HIEU van ban
#       Moi token nhin duoc CA HAI PHIA -> hieu ngu canh day du hon
#       Nhung KHONG sinh van ban tuan tu duoc
#
#   Ca hai deu la Transformer. Khac biet chi la mot dong masked_fill.
#
# VI SAO KHONG DE MODEL NHIN TUONG LAI KHI TRAIN?
#   Vi luc SINH that, tuong lai chua ton tai. Neu train co nhin tuong lai,
#   model se hoc cach "gian lan" - du doan token thu i bang cach nhin
#   chinh token thu i. Loss se rat thap khi train nhung model hoan toan
#   vo dung khi sinh. Day la mot dang DATA LEAKAGE (Phase 04) o cap do
#   kien truc.
#
# HIEU QUA CUA CAUSAL MASK KHI TRAIN:
#   Nho mask, MOT lan forward tren chuoi dai T cho ta T bai toan du doan
#   cung luc (du doan token 2 tu token 1, token 3 tu 1-2, ...).
#   Do la ly do train GPT rat hieu qua - moi token trong kho ngu lieu
#   deu la mot vi du huan luyen.


# ===========================================================================
def chia_dau(x: torch.Tensor, so_dau: int) -> torch.Tensor:
    B, T, d = x.shape

    if d % so_dau != 0:
        raise ValueError(f"So chieu d={d} khong chia het cho so_dau={so_dau}")

    dk = d // so_dau
    return x.reshape(B, T, so_dau, dk).transpose(1, 2)


def gop_dau(x: torch.Tensor) -> torch.Tensor:
    B, so_dau, T, dk = x.shape
    return x.transpose(1, 2).contiguous().reshape(B, T, so_dau * dk)


# VI SAO PHAI transpose(1, 2)?
#
#   Sau reshape ta co (B, T, so_dau, dk) - hai chieu cuoi la
#   "dau nao" va "chieu nao". Nhung attention can lam viec tren
#   (T, dk) cho TUNG dau DOC LAP.
#
#   transpose(1, 2) dua so_dau len truoc T:
#       (B, T, so_dau, dk)  ->  (B, so_dau, T, dk)
#
#   Gio phep nhan ma tran Q @ K^T tu dong chay tren hai chieu CUOI
#   (T, dk), va broadcasting lo phan (B, so_dau) - moi dau duoc tinh
#   SONG SONG ma khong can vong lap nao.
#
# .contiguous() LA BAT BUOC SAU transpose - VI SAO?
#
#   transpose khong di chuyen du lieu trong bo nho, no chi doi cach
#   "doc" tensor (thay doi stride). Sau do bo nho khong con lien tuc
#   theo thu tu moi.
#
#   .reshape() can bo nho lien tuc. Khong goi .contiguous() truoc se gap:
#       RuntimeError: view size is not compatible with input tensor's
#       size and stride
#
#   (.reshape() doi khi tu xu ly duoc, nhung .view() thi khong.
#    Goi .contiguous() la cach an toan trong moi truong hop.)
#
# TAI SAO KHONG DUNG so_dau BANG ma tran RIENG cho tung dau?
#   Vi lam trong MOT ma tran lon roi chia ra thi nhanh hon nhieu:
#   mot phep nhan (B,T,d) @ (d,d) hieu qua hon so_dau phep nhan nho.
#   GPU thich it phep tinh lon hon nhieu phep tinh nho.


# ===========================================================================
def multi_head_attention(
    x: torch.Tensor,
    Wq: torch.Tensor,
    Wk: torch.Tensor,
    Wv: torch.Tensor,
    Wo: torch.Tensor,
    so_dau: int,
    nhan_qua: bool = True,
) -> torch.Tensor:
    Q = chia_dau(x @ Wq, so_dau)          # (B, so_dau, T, dk)
    K = chia_dau(x @ Wk, so_dau)
    V = chia_dau(x @ Wv, so_dau)

    mask = tao_causal_mask(x.shape[1]) if nhan_qua else None
    dau_ra, _ = attention(Q, K, V, mask=mask)

    return gop_dau(dau_ra) @ Wo


# VI SAO CAN NHIEU DAU?
#
#   Mot dau attention chi hoc duoc MOT kieu quan he - vi softmax buoc
#   trong so phai tong bang 1, nen no phai "chon" chu y vao dau.
#
#   Nhieu dau chay song song, moi dau chuyen mon hoa:
#       dau 1: chu y vao chu ngu cua cau
#       dau 2: chu y vao tu lien truoc (quan he cuc bo)
#       dau 3: chu y vao dong tu chinh
#       dau 4: chu y vao dau cau, ranh gioi menh de
#
#   Cac nghien cuu dien giai (interpretability) da tim thay nhung dau
#   attention chuyen mon that su nhu vay trong GPT-2 va BERT.
#
# VI SAO CHIA d THANH so_dau PHAN thay vi moi dau dung ca d chieu?
#   De TONG chi phi tinh toan khong doi. Voi d=768 va 12 dau, moi dau
#   lam viec voi 64 chieu. Tong chi phi bang mot dau 768 chieu, nhung
#   ta co 12 goc nhin khac nhau - gan nhu mien phi.
#
# VI SAO CAN Wo O CUOI?
#   Sau gop_dau, cac dau chi nam CANH NHAU trong vector, chua "tron"
#   voi nhau. Wo la mot phep bien doi tuyen tinh cho phep model ket hop
#   thong tin tu cac dau khac nhau.
#   Khong co Wo, dau ra chi la phep noi don thuan - kem bieu cam hon nhieu.
#
# TRONG THUC TE:
#   PyTorch co san nn.MultiheadAttention. Va F.scaled_dot_product_attention
#   dung FlashAttention - thuat toan toi uu bo nho, nhanh hon nhieu lan
#   tren chuoi dai. Bai tap tu viet de ban hieu ben trong chung lam gi.
#
# DO PHUC TAP O(T^2):
#   Ma tran attention co kich thuoc T x T. Chuoi dai gap doi -> tinh toan
#   gap BON, bo nho cung gap bon.
#   Do la ly do context window dat do, va la ly do co ca mot dong nghien
#   cuu ve "efficient attention" (FlashAttention, sliding window, linear
#   attention...).


# ===========================================================================
def positional_encoding(T: int, d: int) -> torch.Tensor:
    pe = torch.zeros(T, d)

    pos = torch.arange(T, dtype=torch.float32).unsqueeze(1)      # (T, 1)
    i = torch.arange(0, d, 2, dtype=torch.float32)               # (d/2,)
    mau_so = torch.pow(10000.0, i / d)                           # (d/2,)

    pe[:, 0::2] = torch.sin(pos / mau_so)
    pe[:, 1::2] = torch.cos(pos / mau_so)[:, : pe[:, 1::2].shape[1]]

    return pe


# VI SAO TRANSFORMER CAN POSITIONAL ENCODING?
#
#   Attention xu ly moi token CUNG LUC va doi xung - no khong co khai niem
#   thu tu. Voi no, "meo duoi chuot" va "chuot duoi meo" GIONG HET nhau.
#
#   (Doi lap voi RNN: RNN doc tuan tu nen thu tu la co san. Do la thu
#   Transformer danh doi de duoc tinh SONG SONG - va phai bu lai bang
#   positional encoding.)
#
# VI SAO DUNG SIN/COS ma khong danh so 0, 1, 2, 3...?
#
#   1. GIA TRI BI CHAN trong [-1, 1] - khong phinh to voi chuoi dai.
#      Danh so tho: vi tri 5000 se ap dao moi tin hieu ngu nghia.
#
#   2. MOI VI TRI CO MOT "VAN TAY" DUY NHAT - to hop cac tan so khac nhau
#      (giong cach so nhi phan bieu dien so bang cac bit).
#
#   3. QUAN HE TUONG DOI SUY RA DUOC: PE(pos + k) la mot phep QUAY tuyen
#      tinh cua PE(pos). Nho vay model hoc duoc "cach nhau k vi tri"
#      thay vi chi "o vi tri tuyet doi bao nhieu".
#
#   4. TONG QUAT HOA sang do dai chua tung thay khi train (ve ly thuyet).
#
# 10000 LA SO GI?
#   Mot sieu tham so trong bai bao goc (Vaswani 2017), chon bang thuc
#   nghiem. No quyet dinh dai buoc song: chieu dau tien doi rat nhanh
#   (bat vi tri cuc bo), chieu cuoi doi rat cham (bat vi tri toan cuc).
#
# CAC CACH KHAC:
#   Learned (nn.Embedding) - GPT-2 va mini-GPT cua ban dung. Don gian
#       nhat, nhung KHONG tong quat hoa duoc qua do dai da train.
#   RoPE (Rotary) - Llama, Claude va hau het LLM hien dai. Ma hoa vi tri
#       bang phep QUAY vector Q, K - tong quat hoa tot hon nhieu.
#   ALiBi - cong mot do lech tuyen tinh vao diem attention theo khoang cach.
#
#   Day chinh la ly do LLM co CONTEXT WINDOW gioi han: model chi hoc
#   cach xu ly vi tri den mot do dai nhat dinh. Cac ky thuat mo rong
#   context (rope scaling...) deu xoay quanh viec sua phan nay.


# ===========================================================================
if __name__ == "__main__":
    # --- softmax
    assert torch.allclose(softmax(torch.tensor([1.0, 1.0, 1.0])), torch.full((3,), 1 / 3))
    kq = softmax(torch.tensor([1000.0, 1000.0]))
    assert not torch.isnan(kq).any(), "Softmax phai on dinh so hoc"
    assert torch.allclose(kq, torch.tensor([0.5, 0.5]))
    assert abs(softmax(torch.tensor([0.0, 10.0]))[1] - 1.0) < 1e-4

    # --- attention
    torch.manual_seed(0)
    Q = K = V = torch.randn(1, 4, 8)
    out, w = attention(Q, K, V)
    assert out.shape == (1, 4, 8)
    assert w.shape == (1, 4, 4)
    assert torch.allclose(w.sum(dim=-1), torch.ones(1, 4), atol=1e-5), "Moi hang tong = 1"

    # --- causal mask
    m = tao_causal_mask(4)
    assert m.shape == (4, 4)
    assert m[0].tolist() == [1, 0, 0, 0]
    assert m[3].tolist() == [1, 1, 1, 1]

    out_c, w_c = attention_nhan_qua(Q, K, V)
    assert torch.allclose(w_c[0, 0], torch.tensor([1.0, 0.0, 0.0, 0.0]), atol=1e-6), (
        "Token dau tien chi nhin duoc chinh no"
    )
    assert (w_c[0].triu(diagonal=1) == 0).all(), "Tam giac tren phai toan 0"

    # --- multi-head
    assert chia_dau(torch.zeros(2, 5, 12), 4).shape == (2, 4, 5, 3)
    assert gop_dau(torch.zeros(2, 4, 5, 3)).shape == (2, 5, 12)

    x = torch.randn(2, 6, 12)
    assert torch.allclose(gop_dau(chia_dau(x, 4)), x, atol=1e-6), "Gop(Chia(x)) == x"

    try:
        chia_dau(torch.zeros(1, 3, 10), 4)
        raise AssertionError("Le ra phai nem ValueError")
    except ValueError:
        pass

    W = [torch.randn(12, 12) * 0.1 for _ in range(4)]
    ra = multi_head_attention(x, *W, so_dau=4)
    assert ra.shape == (2, 6, 12)

    # --- positional encoding
    pe = positional_encoding(10, 16)
    assert pe.shape == (10, 16)
    assert torch.allclose(pe[0, 0::2], torch.zeros(8), atol=1e-6), "pos=0: sin(0)=0"
    assert torch.allclose(pe[0, 1::2], torch.ones(8), atol=1e-6), "pos=0: cos(0)=1"
    assert pe.abs().max() <= 1.0 + 1e-6, "Gia tri phai nam trong [-1, 1]"
    assert not torch.allclose(pe[1], pe[2]), "Moi vi tri phai khac nhau"

    print("Tat ca deu dung.")
