"""LOI GIAI - Bai tap 2, Phase 06."""

from __future__ import annotations

import torch
import torch.nn as nn


# ===========================================================================
def tao_bang_embedding(so_token: int, so_chieu: int, seed: int = 42) -> nn.Embedding:
    torch.manual_seed(seed)
    return nn.Embedding(so_token, so_chieu)


def dem_tham_so_embedding(so_token: int, so_chieu: int) -> int:
    return so_token * so_chieu


# nn.Embedding CHI LA MOT BANG TRA CUU.
#   Ma tran trong so shape (so_token, so_chieu).
#   e(tensor([5])) tra ve DUNG hang thu 5. Khong co phep nhan nao.
#
#   Tuong duong voi one-hot roi nhan ma tran:
#       one_hot(5) @ W   ==   W[5]
#   nhung nn.Embedding lam truc tiep -> nhanh hon rat nhieu va it bo nho hon.
#   Voi tu vung 50.000, one-hot nghia la mot vector 50.000 chieu toan so 0
#   tru mot so 1 - lang phi khung khiep.
#
# VI SAO CAC HANG LAI "CO NGHIA"?
#   Ban dau chung NGAU NHIEN hoan toan. Trong qua trinh train, gradient
#   day cac token xuat hien trong ngu canh giong nhau lai gan nhau.
#   Sau khi train, "vua" va "hoang hau" o gan nhau khong phai vi ai do
#   lap trinh the, ma vi chung hay xuat hien o nhung cho giong nhau.
#
#   Do la y tuong cot loi cua "phan bo ngu nghia" (distributional semantics):
#   "You shall know a word by the company it keeps" (Firth, 1957).
#
# SO THAM SO - con so quyet dinh kich thuoc model:
#   GPT-2 nho : 50.257 x 768   = 38.6 trieu tham so CHI cho embedding
#   Llama 3   : 128.256 x 4096 = 525 trieu
#
#   Ma tran embedding thuong la mot trong nhung phan NANG nhat cua model.
#   Do la ly do tu vung khong the phinh to tuy y - va la mot ly do nua
#   khien BPE (tu vung vua phai) thang cach tokenize theo tu.
#
# MEO THUC TE: nhieu model dung "weight tying" - dung CHUNG ma tran cho
#   ca embedding dau vao lan lop chieu ra logits o cuoi. Tiet kiem mot
#   nua so tham so do va thuong cho ket qua tot hon.


# ===========================================================================
def cosine_similarity(a: torch.Tensor, b: torch.Tensor) -> float:
    do_dai_a = torch.linalg.norm(a)
    do_dai_b = torch.linalg.norm(b)

    if do_dai_a == 0 or do_dai_b == 0:
        return 0.0

    return float(a @ b / (do_dai_a * do_dai_b))


# GIONG HET ham ban viet bang NumPy o Phase 02, chi doi ten thu vien.
#
# VI SAO CHIA CHO DO DAI?
#   Tich vo huong bi anh huong boi DO LON cua vector:
#       [1,0] . [1,0]    = 1
#       [1,0] . [100,0]  = 100     <- cung huong y het, so khac han
#   Chia cho do dai loai bo anh huong do, chi con lai GOC giua hai vector.
#
# VI SAO DIEU NAY QUAN TRONG VOI RAG?
#   Doan van DAI co vector "lon" hon doan NGAN. Neu dung tich vo huong tho,
#   doan dai luon thang bat ke noi dung. Cosine chuan hoa dieu do, cho
#   phep so sanh cong bang giua doan 20 tu va doan 200 tu.
#
# torch cung co san: torch.nn.functional.cosine_similarity(a, b, dim=0)
#   No xu ly luon truong hop chia 0 (bang cach cong eps rat nho).
#   Bai tap bat tu viet de ban hieu ben trong.


# ===========================================================================
def chuan_hoa(X: torch.Tensor) -> torch.Tensor:
    do_dai = torch.linalg.norm(X, dim=1, keepdim=True)
    return torch.where(do_dai == 0, X, X / do_dai.clamp(min=1e-12))


# keepdim=True QUAN TRONG:
#   X       shape (n, d)
#   norm khong keepdim -> (n,)     -> broadcasting SAI
#   norm co  keepdim   -> (n, 1)   -> broadcasting DUNG, chia tung hang
#
#   Quen keepdim la loi shape rat hay gap. Trieu chung: ket qua co shape
#   la, hoac loi "size mismatch".
#
# torch.where(dieu_kien, neu_dung, neu_sai) - phien ban vectorized cua if/else,
#   giong np.where ban da dung o Phase 03.
#   .clamp(min=1e-12) la lop bao ve thu hai: ngay ca khi torch.where chon
#   nhanh khac, phep chia VAN duoc tinh -> can tranh chia 0 sinh ra nan
#   (nan lay lan sang moi phep tinh sau do).
#
# VI SAO CHUAN HOA LA MEO QUAN TRONG NHAT TRONG BAI NAY?
#
#   Sau khi chuan hoa (|a| = |b| = 1):
#       cos(a, b) = a . b / (1 * 1) = a . b
#
#   Nghia la COSINE TRO THANH TICH VO HUONG. Thay vi tinh cosine cho
#   tung cap (vong lap), ta lam MOT phep nhan ma tran cho toan bo kho:
#
#       diem = kho_da_chuan_hoa @ truy_van_da_chuan_hoa      # (n,)
#
#   Voi 1 trieu vector, khac biet la giua vai phut va vai mili giay.
#   MOI vector database (Chroma, Qdrant, Pinecone) deu luu vector DA
#   CHUAN HOA san vi ly do nay.


# ===========================================================================
def ma_tran_tuong_dong(X: torch.Tensor) -> torch.Tensor:
    Xn = chuan_hoa(X)
    return Xn @ Xn.T


# MOT DONG THAY CHO HAI VONG LAP LONG NHAU.
#   Cach ngay tho: n^2 lan goi cosine_similarity -> rat cham.
#   Cach nay: mot phep nhan ma tran (n,d) @ (d,n) -> (n,n), duoc BLAS
#   toi uu, chay song song tren nhieu nhan CPU/GPU.
#
# KIEM TRA NHANH KHI DEBUG:
#   - Duong cheo chinh phai bang 1.0 (moi vector giong chinh no)
#   - Ma tran phai DOI XUNG: M[i,j] == M[j,i]
#   - Moi gia tri phai trong [-1, 1]
#   Neu mot trong ba dieu tren sai -> ban co bug.
#
# UNG DUNG THUC TE:
#   - Tim tai lieu TRUNG LAP trong kho (cosine > 0.95)
#   - Gom cum van ban theo chu de
#   - Phat hien dao van
#   - Danh gia chat luong embedding: cac cau cung chu de co gan nhau khong?


# ===========================================================================
def tim_gan_nhat(
    truy_van: torch.Tensor, kho: torch.Tensor, k: int = 3
) -> tuple[list[int], list[float]]:
    kho_n = chuan_hoa(kho)
    tv_n = truy_van / torch.linalg.norm(truy_van).clamp(min=1e-12)

    diem = kho_n @ tv_n                       # (n,)
    k = min(k, len(kho))
    diem_top, chi_so = torch.topk(diem, k)

    return chi_so.tolist(), diem_top.tolist()


def tim_kiem_theo_nguong(
    truy_van: torch.Tensor, kho: torch.Tensor, nguong: float = 0.5
) -> list[int]:
    chi_so, diem = tim_gan_nhat(truy_van, kho, k=len(kho))
    return [i for i, d in zip(chi_so, diem) if d >= nguong]


# torch.topk(x, k) TRA VE (gia_tri, chi_so) - da sap giam dan san.
#   Nhanh hon sort roi cat, vi no khong sap xep toan bo mang.
#   Tuong duong np.argsort(...)[::-1][:k] nhung hieu qua hon.
#
# VI SAO k = min(k, len(kho))?
#   torch.topk NEM LOI neu k lon hon so phan tu. numpy thi im lang tra ve
#   it hon. Xu ly truoc de ham khong sap khi kho nho hon k.
#
# TOP-K vs NGUONG - khi nao dung cai nao:
#
#   TOP-K   luon tra ve dung k ket qua
#           + Chi phi du doan duoc (prompt luon dai tuong tu nhau)
#           - Tra ve ca ket qua KHONG lien quan khi kho khong co gi hop
#
#   NGUONG  so luong thay doi, co the RONG
#           + Khong nhet rac vao prompt
#           - Kho chon nguong: 0.7 voi model nay co the la 0.5 voi model khac
#
#   TRONG RAG THUC TE nguoi ta ket hop: lay top-20, loc theo nguong,
#   rerank, roi lay top-5 cuoi cung. Ban se lam dung quy trinh nay o Phase 08.
#
# LUU Y VE VECTOR DATABASE THAT:
#   Chung khong quet toan bo kho nhu ham nay (goi la "brute force").
#   Voi hang trieu vector, chung dung ANN (Approximate Nearest Neighbor)
#   nhu HNSW hoac IVF - danh doi mot chut chinh xac lay toc do gap hang
#   nghin lan. Nhung Y TUONG thi dung nhu ban vua viet.


# ===========================================================================
def embedding_cau(
    chi_so_token: torch.Tensor, bang_embedding: nn.Embedding
) -> torch.Tensor:
    if len(chi_so_token) == 0:
        return torch.zeros(bang_embedding.embedding_dim)

    return bang_embedding(chi_so_token).mean(dim=0)


def embedding_cau_co_mask(
    chi_so_token: torch.Tensor, mask: torch.Tensor, bang_embedding: nn.Embedding
) -> torch.Tensor:
    vec = bang_embedding(chi_so_token)              # (B, T, d)
    m = mask.unsqueeze(-1).float()                  # (B, T, 1)

    tong = (vec * m).sum(dim=1)                     # (B, d)
    so_token = m.sum(dim=1).clamp(min=1)            # (B, 1) - tranh chia 0

    return tong / so_token


# MEAN POOLING - cach don gian nhat de bien MOT CAU thanh MOT vector.
#
# DIEM YEU CHET NGUOI: no BO QUA THU TU TU.
#       "meo duoi chuot"  va  "chuot duoi meo"
#   cho ra vector GIONG HET nhau, vi trung binh cong khong quan tam thu tu.
#
#   Do chinh la van de ma TRANSFORMER giai quyet: attention cho phep moi
#   token nhin cac token khac VA biet vi tri cua chung (nho positional
#   encoding), nen bieu dien cuoi cung phu thuoc thu tu.
#
# VI SAO MASK QUAN TRONG - vi du cu the:
#
#   Batch co hai cau, phai dem cho bang do dai:
#       cau 1: [12, 45, 78,  0,  0]   mask [1, 1, 1, 0, 0]
#       cau 2: [33, 21, 56, 90, 11]   mask [1, 1, 1, 1, 1]
#
#   KHONG co mask: cau 1 duoc chia cho 5 thay vi 3, va hai vector cua
#   token <pad> bi cong vao -> vector cua cau 1 bi keo ve phia embedding
#   cua <pad>, lech han so voi y nghia that.
#
#   Loi nay RAT hay gap va KHO phat hien: model van chay, ket qua van
#   "co ve" hop ly, chi la chat luong kem hon dang ke. Neu ban thay
#   cac cau NGAN bi tim kiem sai nhieu hon cau dai - hay kiem tra mask.
#
# .clamp(min=1) O MAU SO:
#   Neu mot cau toan padding (mask toan 0), so_token = 0 -> chia cho 0 -> nan.
#   clamp(min=1) bien no thanh 0/1 = 0 - tra ve vector 0, hop ly va an toan.
#
# CAC CACH POOLING KHAC:
#   mean pooling  - trung binh, cach mac dinh, on dinh
#   max pooling   - lay max tung chieu, bat duoc dac trung "manh nhat"
#   CLS token     - dung vector cua mot token dac biet dat o dau cau (BERT)
#   weighted mean - trong so theo IDF hoac theo attention
#
#   sentence-transformers (ban se dung o Phase 08) mac dinh dung
#   MEAN POOLING CO MASK - dung nhu ham ban vua viet.


# ===========================================================================
if __name__ == "__main__":
    e = tao_bang_embedding(100, 16)
    assert e(torch.tensor([0, 5])).shape == (2, 16)
    assert dem_tham_so_embedding(50_000, 768) == 38_400_000

    a, b, c = (
        torch.tensor([1.0, 0.0]),
        torch.tensor([0.0, 1.0]),
        torch.tensor([-1.0, 0.0]),
    )
    assert abs(cosine_similarity(a, a) - 1.0) < 1e-6
    assert abs(cosine_similarity(a, b)) < 1e-6
    assert abs(cosine_similarity(a, c) + 1.0) < 1e-6
    assert abs(cosine_similarity(torch.tensor([1.0, 2.0]), torch.tensor([2.0, 4.0])) - 1) < 1e-6
    assert cosine_similarity(torch.zeros(2), a) == 0.0

    X = torch.tensor([[3.0, 4.0], [0.0, 0.0]])
    Xn = chuan_hoa(X)
    assert torch.allclose(Xn[0], torch.tensor([0.6, 0.8]), atol=1e-6)
    assert torch.allclose(Xn[1], torch.zeros(2))

    M = ma_tran_tuong_dong(torch.tensor([[1.0, 0.0], [0.0, 1.0], [1.0, 0.0]]))
    assert M.shape == (3, 3)
    assert torch.allclose(torch.diagonal(M), torch.ones(3), atol=1e-6)
    assert torch.allclose(M, M.T, atol=1e-6)

    kho = torch.tensor([[1.0, 0.0], [0.0, 1.0], [0.9, 0.1]])
    idx, diem = tim_gan_nhat(torch.tensor([1.0, 0.0]), kho, k=2)
    assert idx == [0, 2]
    assert diem[0] > diem[1]
    assert tim_gan_nhat(torch.tensor([1.0, 0.0]), kho, k=99)[0] == [0, 2, 1]
    assert tim_kiem_theo_nguong(torch.tensor([1.0, 0.0]), kho, nguong=0.9) == [0, 2]

    emb = tao_bang_embedding(10, 4)
    assert embedding_cau(torch.tensor([1, 2, 3]), emb).shape == (4,)
    assert torch.allclose(embedding_cau(torch.tensor([], dtype=torch.long), emb), torch.zeros(4))

    ids = torch.tensor([[1, 2, 0], [3, 4, 5]])
    mask = torch.tensor([[1, 1, 0], [1, 1, 1]])
    kq = embedding_cau_co_mask(ids, mask, emb)
    assert kq.shape == (2, 4)
    # Cau 1 chi tinh tren 2 token that
    assert torch.allclose(kq[0], emb(torch.tensor([1, 2])).mean(dim=0), atol=1e-6)

    print("Tat ca deu dung.")
