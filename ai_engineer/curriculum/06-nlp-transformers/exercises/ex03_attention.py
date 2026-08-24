"""BAI TAP 3 - Attention (Tuan 14).

Cham diem:  pytest tests/phase06/test_ex03.py -v
Loi giai:   curriculum/06-nlp-transformers/solutions/ex03_attention.py

DAY LA BAI TAP QUAN TRONG NHAT PHASE 06.

Ban se tu code co che attention - trai tim cua moi LLM. Sau bai nay,
kien truc GPT khong con la hop den.

Can: pip install torch
"""

from __future__ import annotations

import math

import torch


# ===========================================================================
#  3.1 - Softmax on dinh so hoc
# ===========================================================================
def softmax(x: torch.Tensor, dim: int = -1) -> torch.Tensor:
    """Tu viet softmax, ON DINH SO HOC.

        softmax(x)_i = e^(x_i) / sum_j e^(x_j)

    VAN DE: voi x lon (vi du 1000), e^1000 tran so -> inf -> nan.

    CACH SUA (meo kinh dien): tru di gia tri LON NHAT truoc khi mu.
        softmax(x) = softmax(x - max(x))
    Hai ve bang nhau ve toan hoc, nhung ve phai khong bao gio tran so
    vi so mu lon nhat luon bang 0 -> e^0 = 1.

    Vi du:
        softmax(tensor([1., 1., 1.]))     ->  [0.333, 0.333, 0.333]
        softmax(tensor([0., 10.]))        ->  [~0.0, ~1.0]
        softmax(tensor([1000., 1000.]))   ->  [0.5, 0.5]   (khong duoc ra nan!)

    Goi y: x.max(dim=dim, keepdim=True).values
    """
    # TODO
    pass


# ===========================================================================
#  3.2 - Scaled dot-product attention  <- TRAI TIM
# ===========================================================================
def attention(
    Q: torch.Tensor, K: torch.Tensor, V: torch.Tensor, mask: torch.Tensor | None = None
) -> tuple[torch.Tensor, torch.Tensor]:
    """Tinh scaled dot-product attention.

                        Q K^T
        Attention = softmax(-----) V
                          sqrt(d)

    Shape:
        Q  (..., T_q, d)
        K  (..., T_k, d)
        V  (..., T_k, d_v)
        mask (T_q, T_k) hoac None  - gia tri 0 nghia la BI CHE

    Tra ve (dau_ra, trong_so_attention):
        dau_ra           shape (..., T_q, d_v)
        trong_so_attention shape (..., T_q, T_k)   - de ve bieu do

    Cac buoc:
        1. diem = Q @ K.transpose(-2, -1)
        2. Chia cho sqrt(d)          voi d la so chieu CUOI cua Q
        3. Neu co mask: dat -inf o cac vi tri mask == 0
        4. trong_so = softmax(diem) theo chieu CUOI
        5. dau_ra = trong_so @ V

    VI SAO CHIA CHO sqrt(d)?
        Khi d lon, tich vo huong Q.K co gia tri rat lon -> softmax tro nen
        cuc nhon (gan nhu one-hot) -> gradient gan bang 0 -> model khong
        hoc duoc. Chia cho sqrt(d) giu phuong sai on dinh.
        Do la chu "scaled" trong ten goi.

    Goi y: dung ham softmax ban vua viet, va masked_fill de dat -inf.
    """
    # TODO
    pass


# ===========================================================================
#  3.3 - Causal mask  <- THU LAM NEN GPT
# ===========================================================================
def tao_causal_mask(T: int) -> torch.Tensor:
    """Tao mat na nhan qua kich thuoc (T, T).

    Gia tri 1 = duoc nhin, 0 = bi che.
    Token thu i chi duoc nhin cac token 0..i (KHONG duoc nhin tuong lai).

    Vi du T = 4:
        [[1, 0, 0, 0],
         [1, 1, 0, 0],
         [1, 1, 1, 0],
         [1, 1, 1, 1]]

    Kieu du lieu: float (de nhan/so sanh de dang).

    VI SAO CAN?
        Khi SINH van ban, token thu 5 khong duoc nhin token thu 6, 7, 8 -
        vi luc chay that chung CHUA TON TAI. Neu cho nhin, model se
        "gian lan" trong luc train va that bai hoan toan khi sinh that.

    Goi y: torch.tril(torch.ones(T, T))
    """
    # TODO
    pass


def attention_nhan_qua(
    Q: torch.Tensor, K: torch.Tensor, V: torch.Tensor
) -> tuple[torch.Tensor, torch.Tensor]:
    """Attention CO causal mask - dung cho model sinh van ban (GPT).

    Tu tao mask theo do dai chuoi cua Q roi goi attention().

    KIEM TRA QUAN TRONG: trong_so_attention[0] phai co dang [1, 0, 0, ...]
    - token dau tien chi nhin duoc chinh no.
    """
    # TODO
    pass


# ===========================================================================
#  3.4 - Multi-head attention
# ===========================================================================
def chia_dau(x: torch.Tensor, so_dau: int) -> torch.Tensor:
    """Chia tensor thanh nhieu "dau" attention.

    x      shape (B, T, d)
    ket qua shape (B, so_dau, T, d // so_dau)

    Neu d khong chia het cho so_dau thi nem ValueError voi thong bao ro rang.

    Vi du:
        chia_dau(torch.zeros(2, 5, 12), 4).shape  ->  (2, 4, 5, 3)

    VI SAO PHAI DOI THU TU CHIEU?
        Sau khi reshape ta co (B, T, so_dau, dk). Nhung attention can
        lam viec tren (T, dk) cho TUNG dau doc lap, nen phai dua so_dau
        len truoc T -> (B, so_dau, T, dk).
        Nho vay phep nhan ma tran tu dong chay song song tren moi dau.

    Goi y: x.reshape(B, T, so_dau, dk).transpose(1, 2)
    """
    # TODO
    pass


def gop_dau(x: torch.Tensor) -> torch.Tensor:
    """Gop cac dau lai (phep nguoc cua chia_dau).

    x      shape (B, so_dau, T, dk)
    ket qua shape (B, T, so_dau * dk)

    Vi du:
        gop_dau(torch.zeros(2, 4, 5, 3)).shape  ->  (2, 5, 12)

    Goi y: transpose(1, 2) roi .contiguous().reshape(B, T, -1)
           .contiguous() la BAT BUOC sau transpose - neu khong,
           reshape se bao loi vi bo nho khong lien tuc.
    """
    # TODO
    pass


def multi_head_attention(
    x: torch.Tensor,
    Wq: torch.Tensor,
    Wk: torch.Tensor,
    Wv: torch.Tensor,
    Wo: torch.Tensor,
    so_dau: int,
    nhan_qua: bool = True,
) -> torch.Tensor:
    """Multi-head attention day du.

    x   shape (B, T, d)
    Wq, Wk, Wv, Wo  shape (d, d)
    Ket qua shape (B, T, d)

    Cac buoc:
        1. Q = x @ Wq,  K = x @ Wk,  V = x @ Wv        (B, T, d)
        2. Chia ca ba thanh so_dau dau                 (B, so_dau, T, dk)
        3. Chay attention (co mask neu nhan_qua=True) tren tung dau
        4. Gop cac dau lai                             (B, T, d)
        5. Chieu qua Wo                                (B, T, d)

    VI SAO CAN NHIEU DAU?
        Mot dau chi hoc duoc MOT kieu quan he. Nhieu dau chay song song,
        moi dau hoc mot kieu: dau nay chu y chu ngu, dau kia chu y tu
        lien truoc, dau khac chu y dong tu chinh...

    VI SAO CAN Wo o cuoi?
        Sau khi gop, cac dau chi nam canh nhau chu chua "tron" voi nhau.
        Wo cho phep model ket hop thong tin tu cac dau khac nhau.
    """
    # TODO
    pass


# ===========================================================================
#  3.5 - Positional encoding
# ===========================================================================
def positional_encoding(T: int, d: int) -> torch.Tensor:
    """Tao positional encoding dang sin/cos (nhu bai bao Transformer 2017).

    Tra ve tensor shape (T, d).

        PE[pos, 2i]   = sin(pos / 10000^(2i/d))
        PE[pos, 2i+1] = cos(pos / 10000^(2i/d))

    Nghia la: chieu CHAN dung sin, chieu LE dung cos.

    Vi du:
        positional_encoding(10, 16).shape  ->  (10, 16)
        positional_encoding(1, 4)[0]       ->  [0., 1., 0., 1.]
        (vi pos=0: sin(0)=0, cos(0)=1)

    VI SAO CAN?
        Attention xu ly moi token CUNG LUC - no khong biet thu tu.
        Voi no, "meo duoi chuot" va "chuot duoi meo" GIONG HET nhau.
        Positional encoding cong them thong tin vi tri vao embedding.

    VI SAO DUNG SIN/COS ma khong phai danh so 0,1,2,3...?
        - Gia tri luon nam trong [-1, 1], khong phinh to voi chuoi dai
        - Moi vi tri co mot "van tay" duy nhat
        - Khoang cach tuong doi giua hai vi tri co the suy ra duoc bang
          phep quay - giup model tong quat hoa sang do dai chua tung thay

    Goi y:
        pos = torch.arange(T).unsqueeze(1)                     # (T, 1)
        i = torch.arange(0, d, 2)                              # (d/2,)
        mau_so = torch.pow(10000, i / d)                       # (d/2,)
        pe[:, 0::2] = torch.sin(pos / mau_so)
        pe[:, 1::2] = torch.cos(pos / mau_so)
    """
    # TODO
    pass


# ===========================================================================
if __name__ == "__main__":
    x = torch.tensor([1000.0, 1000.0])
    kq = softmax(x)
    if kq is None:
        print("Chua lam softmax.")
        raise SystemExit(0)

    print(f"  softmax([1000, 1000]) = {kq}   (khong duoc ra nan)")
    print()

    torch.manual_seed(0)
    B, T, d, H = 1, 5, 8, 2
    xx = torch.randn(B, T, d)

    out, w = attention_nhan_qua(xx, xx, xx)
    print(f"  Attention nhan qua, shape dau ra: {tuple(out.shape)}")
    print(f"  Ma tran trong so (hang = token dang hoi):")
    for i in range(T):
        print("    " + "  ".join(f"{v:.2f}" for v in w[0, i]))
    print("  -> Tam giac tren phai toan 0: khong token nao nhin duoc tuong lai")
    print()

    pe = positional_encoding(6, 8)
    print(f"  Positional encoding shape: {tuple(pe.shape)}")
    print(f"  PE[0] = {pe[0].tolist()}")
