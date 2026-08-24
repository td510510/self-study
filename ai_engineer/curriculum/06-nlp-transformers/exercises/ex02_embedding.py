"""BAI TAP 2 - Embedding & tim kiem ngu nghia (Tuan 14).

Cham diem:  pytest tests/phase06/test_ex02.py -v
Loi giai:   curriculum/06-nlp-transformers/solutions/ex02_embedding.py

Muc tieu: hieu embedding va cosine similarity o muc code duoc.
DAY LA NEN TANG TRUC TIEP CUA RAG (Phase 08) - moi thu ban viet o day
se duoc dung lai nguyen ven.

Can: pip install torch
"""

from __future__ import annotations

import torch
import torch.nn as nn


# ===========================================================================
#  2.1 - Bang embedding
# ===========================================================================
def tao_bang_embedding(so_token: int, so_chieu: int, seed: int = 42) -> nn.Embedding:
    """Tao bang embedding co the hoc duoc.

    Dat torch.manual_seed(seed) TRUOC khi tao de ket qua tai lap duoc.

    Vi du:
        e = tao_bang_embedding(100, 16)
        e(torch.tensor([0, 5]))   ->  tensor shape (2, 16)

    nn.Embedding LA GI?
        Chi la mot BANG TRA CUU: token id -> vector.
        Ma tran trong so co shape (so_token, so_chieu).
        e(torch.tensor([5])) tra ve DUNG hang thu 5 cua ma tran do.

        No khong phai phep nhan ma tran - chi la lay hang. Nhung vi
        no la nn.Module nen cac hang duoc HOC qua gradient descent.
    """
    # TODO
    pass


def dem_tham_so_embedding(so_token: int, so_chieu: int) -> int:
    """Tinh so tham so cua mot bang embedding.

    Vi du:
        dem_tham_so_embedding(50_000, 768)  ->  38_400_000

    Con so nay cho thay vi sao tu vung khong the qua lon:
    tu vung 1 trieu voi 4096 chieu -> 4 TY tham so chi cho embedding.
    """
    # TODO
    pass


# ===========================================================================
#  2.2 - Cosine similarity
# ===========================================================================
def cosine_similarity(a: torch.Tensor, b: torch.Tensor) -> float:
    """Tinh do tuong dong cosin giua HAI vector 1 chieu.

        cos(a, b) = (a . b) / (|a| * |b|)

    Neu MOT trong hai vector co do dai 0 thi tra ve 0.0 (khong chia cho 0).

    Vi du:
        cosine_similarity(tensor([1., 0.]), tensor([1., 0.]))   ->  1.0
        cosine_similarity(tensor([1., 0.]), tensor([0., 1.]))   ->  0.0
        cosine_similarity(tensor([1., 0.]), tensor([-1., 0.]))  -> -1.0
        cosine_similarity(tensor([1., 2.]), tensor([2., 4.]))   ->  1.0

    Ban da viet ham nay bang NumPy o Phase 02. Gio viet lai bang torch.
    """
    # TODO
    pass


def chuan_hoa(X: torch.Tensor) -> torch.Tensor:
    """Chuan hoa MOI HANG cua X ve do dai 1.

    X co shape (n, d). Ket qua cung shape.
    Hang nao co do dai 0 thi GIU NGUYEN (khong chia cho 0).

    Vi du:
        chuan_hoa(tensor([[3., 4.], [0., 0.]]))
        ->  tensor([[0.6, 0.8], [0., 0.]])

    VI SAO QUAN TRONG?
        Sau khi chuan hoa, cosine similarity = TICH VO HUONG.
        Nghia la thay vi tinh cosine cho tung cap, ta chi can MOT phep
        nhan ma tran cho toan bo kho. Moi vector database deu lam vay.

    Goi y: torch.linalg.norm(X, dim=1, keepdim=True)
           Dung torch.where de tranh chia cho 0.
    """
    # TODO
    pass


def ma_tran_tuong_dong(X: torch.Tensor) -> torch.Tensor:
    """Tinh cosine similarity giua MOI CAP hang cua X.

    X shape (n, d)  ->  ket qua shape (n, n)
    Phan tu [i, j] la cosine similarity giua hang i va hang j.

    Duong cheo chinh phai bang 1.0 (moi vector giong chinh no).

    Vi du:
        X = tensor([[1., 0.], [0., 1.], [1., 0.]])
        ->  [[1., 0., 1.],
             [0., 1., 0.],
             [1., 0., 1.]]

    Goi y: chuan hoa truoc, roi Xn @ Xn.T  - MOT phep nhan ma tran duy nhat.
    """
    # TODO
    pass


# ===========================================================================
#  2.3 - Tim kiem ngu nghia  <- CO CHE CUA RAG
# ===========================================================================
def tim_gan_nhat(
    truy_van: torch.Tensor, kho: torch.Tensor, k: int = 3
) -> tuple[list[int], list[float]]:
    """Tim k vector trong `kho` giong `truy_van` nhat.

    truy_van shape (d,)
    kho      shape (n, d)

    Tra ve (danh_sach_chi_so, danh_sach_diem), sap GIAM DAN theo diem.
    Neu k lon hon so vector trong kho thi tra ve het.

    Vi du:
        kho = tensor([[1., 0.], [0., 1.], [0.9, 0.1]])
        tim_gan_nhat(tensor([1., 0.]), kho, k=2)
        ->  ([0, 2], [1.0, 0.994...])

    DAY CHINH LA CO CHE CUA MOI HE THONG RAG:
        1. Bien cau hoi thanh vector
        2. Bien moi doan tai lieu thanh vector
        3. Tim doan co cosine cao nhat
        4. Nhet doan do vao prompt
    """
    # TODO
    pass


def tim_kiem_theo_nguong(
    truy_van: torch.Tensor, kho: torch.Tensor, nguong: float = 0.5
) -> list[int]:
    """Tra ve chi so cua MOI vector co cosine >= nguong, sap giam dan theo diem.

    Vi du:
        kho = tensor([[1., 0.], [0., 1.], [0.9, 0.1]])
        tim_kiem_theo_nguong(tensor([1., 0.]), kho, nguong=0.9)  ->  [0, 2]

    VI SAO CAN CA HAI CACH (top-k va nguong)?
        top-k  luon tra ve k ket qua, KE CA khi khong cai nao lien quan
        nguong tra ve so luong thay doi, co the RONG neu khong co gi hop
        Trong RAG that, nguoi ta thuong ket hop: lay top-k roi loc theo nguong.
    """
    # TODO
    pass


# ===========================================================================
#  2.4 - Embedding cho CAU (mean pooling)
# ===========================================================================
def embedding_cau(
    chi_so_token: torch.Tensor, bang_embedding: nn.Embedding
) -> torch.Tensor:
    """Tao embedding cho MOT CAU bang cach lay TRUNG BINH embedding cac token.

    chi_so_token shape (T,)   -> ket qua shape (d,)

    Neu cau RONG (T = 0) thi tra ve vector 0 co do dai d.

    Vi du:
        e = tao_bang_embedding(10, 4)
        embedding_cau(torch.tensor([1, 2, 3]), e).shape  ->  (4,)

    DAY LA CACH DON GIAN NHAT ("mean pooling").
    No BO QUA thu tu tu: "meo duoi chuot" va "chuot duoi meo" ra
    vector GIONG HET nhau. Do chinh la van de ma Transformer giai quyet.
    """
    # TODO
    pass


def embedding_cau_co_mask(
    chi_so_token: torch.Tensor, mask: torch.Tensor, bang_embedding: nn.Embedding
) -> torch.Tensor:
    """Mean pooling cho mot BATCH cau, BO QUA cac vi tri padding.

    chi_so_token shape (B, T)
    mask         shape (B, T)  - 1 la token that, 0 la padding
    Ket qua      shape (B, d)

    Cau nao khong co token that nao (mask toan 0) thi tra ve vector 0.

    VI SAO CAN MASK?
        Cac cau trong mot batch co do dai khac nhau, phai dem (pad) cho
        bang nhau. Neu tinh trung binh ke ca phan dem, cau ngan se bi
        keo vector ve phia embedding cua token <pad> - lam sai lech ket qua.

        Day la loi RAT hay gap va kho phat hien: model van chay, ket qua
        van "co ve" hop ly, chi la kem hon nhieu so voi dang le.

    Goi y:
        vec = bang_embedding(chi_so_token)          # (B, T, d)
        m = mask.unsqueeze(-1).float()              # (B, T, 1)
        tong = (vec * m).sum(dim=1)                 # (B, d)
        so_token = m.sum(dim=1).clamp(min=1)        # (B, 1) - tranh chia 0
    """
    # TODO
    pass


# ===========================================================================
if __name__ == "__main__":
    import json
    from pathlib import Path

    a = torch.tensor([1.0, 0.0])
    if cosine_similarity(a, a) is None:
        print("Chua lam cosine_similarity.")
        raise SystemExit(0)

    print(f"  cosine([1,0], [1,0])  = {cosine_similarity(a, a):.4f}")
    print(f"  cosine([1,0], [0,1])  = {cosine_similarity(a, torch.tensor([0.0, 1.0])):.4f}")
    print()

    print(f"  Bang embedding 50.000 token x 768 chieu:")
    print(f"    {dem_tham_so_embedding(50_000, 768):,} tham so")
    print()

    # Mo phong tim kiem ngu nghia tren cau mau
    p = Path("data/cau_mau.json")
    if p.exists():
        cau_mau = json.loads(p.read_text(encoding="utf-8"))
        print(f"  Da nap {len(cau_mau)} cau mau, "
              f"{len({c['chu_de'] for c in cau_mau})} chu de")
        print("  (Bai 2 trong lessons/ se dung chung de tim kiem ngu nghia that)")
    else:
        print("  Chay tao_du_lieu.py de co cau mau.")
