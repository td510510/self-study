"""BAI TAP 2 - Tim kiem: tu khoa, ngu nghia va hybrid (Tuan 20-21).

Cham diem:  pytest tests/phase08/test_ex02.py -v
Loi giai:   curriculum/08-rag/solutions/ex02_tim_kiem.py

Khong can API key va KHONG can model embedding: cac ham nhan vector da nhung
lam THAM SO. Trong test ta truyen vector tu tao; trong that ban truyen vector
tu sentence-transformers. Doi ben dung y het nhau.

BA CACH TIM, KHONG CACH NAO THANG TUYET DOI:
    BM25       gioi voi ma loi, ten rieng, con so - do khop tu chinh xac
    Embedding  gioi khi nguoi dung dien dat khac han tai lieu
    Hybrid     gop hai bang xep hang lai
Bai 3 se bat ban DO xem cai nao that su tot hon tren du lieu cua ban.
"""

from __future__ import annotations

import numpy as np


# ===========================================================================
#  2.1 - Tach tu
# ===========================================================================
def tach_tu(van_ban: str) -> list[str]:
    """Tach van ban thanh danh sach tu thuong, giu lai chu-so-dau tieng Viet,
    dau gach ngang va dau cham GIUA cac ky tu chu so.

    Vi du:
        tach_tu("Ma loi VX-204!")        ->  ["ma", "loi", "vx-204"]
        tach_tu("Phi 40.000 dong.")      ->  ["phi", "40.000", "dong"]
        tach_tu("Nghi phep - 12 ngay")   ->  ["nghi", "phep", "12", "ngay"]

    Quy tac:
        - ha thuong toan bo
        - dau cau dung mot minh (".", "-", "!") KHONG duoc thanh mot tu
        - chuoi rong -> []

    VI SAO KHONG DUNG s.split()? Vi "VX-204." se thanh tu "vx-204." (dinh dau
    cham) va khong bao gio khop voi truy van "VX-204". Sai mot ky tu la truot
    hoan toan - do la ban chat cua tim kiem tu khoa.
    """
    # TODO
    pass


# ===========================================================================
#  2.2 - BM25
# ===========================================================================
class BM25:
    """Tim kiem theo tu khoa bang cong thuc BM25.

    BM25 tinh diem cua mot tai lieu voi mot truy van bang tong tren tung tu:

        diem = SUM_t  IDF(t) * ( tf * (k1+1) ) / ( tf + k1*(1 - b + b*L/L_tb) )

        tf    = so lan tu t xuat hien trong tai lieu
        L     = do dai tai lieu (so tu), L_tb = do dai trung binh
        IDF(t)= log( 1 + (N - df + 0.5) / (df + 0.5) )
        df    = so tai lieu CO CHUA tu t, N = tong so tai lieu

    Y NGHIA CUA HAI THAM SO:
        k1 (mac dinh 1.5) - do bao hoa tan suat. Tu xuat hien 20 lan khong
                            dang gia gap 20 lan tu xuat hien 1 lan.
        b  (mac dinh 0.75)- muc do phat tai lieu dai. b=0 la khong phat.

    IDF cho tu xuat hien trong MOI tai lieu se rat nho - do la ly do BM25
    tu dong coi nhe cac tu pho bien ma khong can danh sach stopword.
    """

    def __init__(self, tai_lieu: list[str], k1: float = 1.5, b: float = 0.75):
        """Chuan bi truoc: tach tu, dem tan suat, do dai, df.

        Danh sach tai lieu RONG van phai tao duoc doi tuong (do_dai_tb = 0.0)
        va `diem()` khi do tra ve [].

        VI SAO TINH TRUOC? Vi `diem()` se duoc goi cho MOI truy van. Dem lai
        tan suat moi lan goi la cach bien tim kiem 5ms thanh 5s.
        """
        # TODO
        pass

    def diem(self, truy_van: str) -> list[float]:
        """Diem BM25 cua truy van voi TUNG tai lieu, theo dung thu tu ban dau.

        Tu trong truy van khong co trong tu dien -> gop 0 diem (khong loi).
        """
        # TODO
        pass

    def tim(self, truy_van: str, k: int = 5) -> list[tuple[int, float]]:
        """Tra ve k cap (chi_so, diem) co diem cao nhat, sap giam dan.

        Quy tac:
            - k lon hon so tai lieu -> tra ve het, khong loi
            - k <= 0 -> []
            - KHONG loai bo tai lieu 0 diem (goi y co the muon xem chung)
        """
        # TODO
        pass


# ===========================================================================
#  2.3 - Tim kiem theo vector (ngu nghia)
# ===========================================================================
def chuan_hoa(v: np.ndarray) -> np.ndarray:
    """Chia vector cho do dai cua no. Vector 0 -> tra ve chinh no (khong chia 0).

    Hoat dong voi ca vector 1 chieu (d,) va ma tran (n, d) - khi la ma tran
    thi chuan hoa TUNG DONG.

    VI SAO PHAI CHUAN HOA? Vi khi moi vector deu dai 1 thi cosine giua chung
    dung bang tich vo huong. Tim kiem tro thanh MOT phep nhan ma tran duy nhat
    thay vi mot vong lap Python - nhanh hon hang tram lan.
    """
    # TODO
    pass


def tim_theo_vector(kho: np.ndarray, truy_van: np.ndarray,
                    k: int = 5) -> list[tuple[int, float]]:
    """Tim k doan gan nhat trong `kho` (n, d) voi vector `truy_van` (d,).

    Tra ve [(chi_so, diem_cosine), ...] sap giam dan.

    Quy tac:
        - kho rong -> []
        - k <= 0 -> []
        - k lon hon n -> tra ve het
        - sai so chieu -> nem ValueError voi thong bao co CA HAI so chieu
        - tu chuan hoa ben trong: nguoi goi khong can nho lam viec do

    Diem tra ve la float thuong (khong phai numpy scalar) de json.dumps duoc.
    """
    # TODO
    pass


# ===========================================================================
#  2.4 - Hybrid search bang RRF
# ===========================================================================
def hop_nhat_rrf(cac_bang: list[list[int]], k: int = 5,
                 k0: int = 60) -> list[tuple[int, float]]:
    """Gop nhieu bang xep hang thanh mot bang bang Reciprocal Rank Fusion.

        diem(muc) = SUM_bang  1 / (k0 + thu_hang_trong_bang_do)
        thu hang bat dau tu 1

    `cac_bang` la danh sach cac bang xep hang, moi bang la danh sach chi so
    da sap theo do lien quan giam dan (vi du ket qua BM25 va ket qua vector).

    Tra ve [(chi_so, diem_rrf), ...] sap giam dan, lay k muc dau.
    Khi hai muc bang diem, muc co CHI SO NHO HON dung truoc (de tai lap duoc).

    VI SAO CONG NGHICH DAO THU HANG MA KHONG CONG DIEM GOC?
        Diem BM25 chay tu 0 den vo cung, diem cosine chay tu -1 den 1. Cong
        thang hai con so do voi nhau la vo nghia - BM25 se nuot chung cosine.
        RRF vut bo diem goc va chi giu THU HANG, nen khong can chuan hoa gi ca.

    k0 LAM GI? No lam diu chenh lech giua cac hang dau. Voi k0=60, hang 1 duoc
    1/61 va hang 2 duoc 1/62 - gan bang nhau. k0 nho (vi du 1) thi hang 1 duoc
    1/2 con hang 2 chi duoc 1/3, tuc la rat thien vi hang nhat.
    """
    # TODO
    pass


# ===========================================================================
#  2.5 - Do chat luong tim kiem
# ===========================================================================
def recall_at_k(chi_so_lay: list[int], chi_so_dung: set[int]) -> float:
    """Ty le muc DUNG nam trong danh sach lay ve.

    Vi du:
        recall_at_k([3, 1, 7], {1, 5})  ->  0.5   (lay duoc 1, truot 5)

    `chi_so_dung` rong -> tra ve 1.0 (khong doi hoi gi thi coi nhu dat).

    LUU Y: `chi_so_lay` da la top-k roi; ham nay khong tu cat.
    """
    # TODO
    pass


def mrr(chi_so_lay: list[int], chi_so_dung: set[int]) -> float:
    """Mean Reciprocal Rank: 1/thu_hang cua muc DUNG DAU TIEN (hang tu 1).

    Vi du:
        mrr([3, 1, 7], {1, 5})  ->  0.5    (muc 1 nam o hang 2)
        mrr([3, 9], {1})        ->  0.0

    KHAC GI RECALL? Recall chi hoi "co lay duoc khong". MRR hoi "co xep len
    dau khong". Voi RAG, thu hang rat quan trong: doan xep dau anh huong cau
    tra loi nhieu nhat, va neu ban chi nhet duoc 3 doan vao prompt thi doan
    dung o hang 8 cung nhu khong tim thay.
    """
    # TODO
    pass
