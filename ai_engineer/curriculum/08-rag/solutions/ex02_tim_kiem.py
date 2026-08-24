"""LOI GIAI bai tap 2 - Tim kiem (Tuan 20-21)."""

from __future__ import annotations

import math
import re
from collections import Counter

import numpy as np

# Chu-so-dau tieng Viet, cho phep '-' va '.' NAM GIUA cac ky tu khac.
# Nho hai dau ngoac cuoi: "vx-204." -> "vx-204" (dau cham cuoi bi bo).
MAU_TU = re.compile(r"[0-9a-zà-ỹđ]+(?:[-.][0-9a-zà-ỹđ]+)*")


# ===========================================================================
#  2.1 - Tach tu
# ===========================================================================
def tach_tu(van_ban: str) -> list[str]:
    return MAU_TU.findall(van_ban.lower())
    # VI SAO PHAI HA THUONG TRUOC KHI KHOP?
    #   Dai chu cai a-y trong regex khong bao gom chu HOA co dau. Neu ban khop
    #   trên bản gốc, "Nghỉ" se bi cat thanh "gh" + "ỉ". Loi nay am tham lam
    #   hong toan bo tim kiem tieng Viet ma khong nem exception nao.


# ===========================================================================
#  2.2 - BM25
# ===========================================================================
class BM25:
    def __init__(self, tai_lieu: list[str], k1: float = 1.5, b: float = 0.75):
        self.k1 = k1
        self.b = b
        self.tai_lieu = tai_lieu
        self.cac_tu = [tach_tu(t) for t in tai_lieu]
        self.tan_suat = [Counter(t) for t in self.cac_tu]
        self.do_dai = [len(t) for t in self.cac_tu]
        self.N = len(tai_lieu)
        self.do_dai_tb = (sum(self.do_dai) / self.N) if self.N else 0.0

        # df: MOI TAI LIEU DEM MOT LAN cho moi tu -> phai dung set(),
        # neu khong thi tu lap 50 lan trong mot tai lieu se lam IDF am.
        self.df: Counter = Counter()
        for t in self.cac_tu:
            self.df.update(set(t))

    def _idf(self, tu: str) -> float:
        df = self.df.get(tu, 0)
        return math.log(1 + (self.N - df + 0.5) / (df + 0.5))
        # VI SAO CO SO "1 +" O NGOAI LOG?
        #   Khong co no, tu xuat hien trong TAT CA tai lieu se cho IDF am,
        #   tuc la cang khop cang bi tru diem. Bien the "+1" nay chan dieu do:
        #   IDF luon >= 0.

    def diem(self, truy_van: str) -> list[float]:
        if self.N == 0:
            return []

        cac_tu_tv = tach_tu(truy_van)
        ket_qua = []
        for i in range(self.N):
            tf_i = self.tan_suat[i]
            chuan_do_dai = 1 - self.b + self.b * self.do_dai[i] / (self.do_dai_tb or 1)
            s = 0.0
            for tu in cac_tu_tv:
                tf = tf_i.get(tu, 0)
                if tf == 0:
                    continue
                s += self._idf(tu) * tf * (self.k1 + 1) / (tf + self.k1 * chuan_do_dai)
            ket_qua.append(s)
        return ket_qua

    def tim(self, truy_van: str, k: int = 5) -> list[tuple[int, float]]:
        if k <= 0:
            return []
        diem = self.diem(truy_van)
        thu_tu = sorted(range(len(diem)), key=lambda i: (-diem[i], i))
        return [(i, diem[i]) for i in thu_tu[:k]]
        # VI SAO SAP THEO (-diem, i) CHU KHONG CHI -diem?
        #   Khi nhieu tai lieu cung 0 diem (rat hay xay ra), thu tu tra ve se
        #   phu thuoc vao chi tiet cai dat cua sort. Them `i` lam khoa phu
        #   khien ket qua TAI LAP DUOC - dieu kien bat buoc de eval co nghia.


# ===========================================================================
#  2.3 - Tim kiem theo vector
# ===========================================================================
def chuan_hoa(v: np.ndarray) -> np.ndarray:
    v = np.asarray(v, dtype=np.float32)
    if v.ndim == 1:
        do_dai = np.linalg.norm(v)
        return v if do_dai == 0 else v / do_dai

    do_dai = np.linalg.norm(v, axis=1, keepdims=True)
    # Thay 0 bang 1 TRUOC khi chia: chia cho 0 tao ra nan, va nan lay lan
    # ra toan bo ket qua tim kiem - mot dong duy nhat nay chan dieu do.
    do_dai[do_dai == 0] = 1.0
    return v / do_dai


def tim_theo_vector(kho: np.ndarray, truy_van: np.ndarray,
                    k: int = 5) -> list[tuple[int, float]]:
    kho = np.asarray(kho, dtype=np.float32)
    if kho.size == 0 or kho.shape[0] == 0 or k <= 0:
        return []

    truy_van = np.asarray(truy_van, dtype=np.float32).ravel()
    if truy_van.shape[0] != kho.shape[1]:
        # Thong bao PHAI co ca hai con so. "Sai so chieu" khong giup ai ca;
        # "384 vs 27" cho biet ngay ban dang tron vector cua hai model khac nhau.
        raise ValueError(
            f"So chieu khong khop: truy van {truy_van.shape[0]}, kho {kho.shape[1]}"
        )

    diem = chuan_hoa(kho) @ chuan_hoa(truy_van)
    thu_tu = sorted(range(len(diem)), key=lambda i: (-diem[i], i))
    return [(i, float(diem[i])) for i in thu_tu[:k]]


# ===========================================================================
#  2.4 - Hybrid search bang RRF
# ===========================================================================
def hop_nhat_rrf(cac_bang: list[list[int]], k: int = 5,
                 k0: int = 60) -> list[tuple[int, float]]:
    if k <= 0:
        return []

    diem: dict[int, float] = {}
    for bang in cac_bang:
        for thu_hang, chi_so in enumerate(bang, start=1):
            diem[chi_so] = diem.get(chi_so, 0.0) + 1.0 / (k0 + thu_hang)

    thu_tu = sorted(diem, key=lambda i: (-diem[i], i))
    return [(i, diem[i]) for i in thu_tu[:k]]
    # DIEU RRF KHONG LAM DUOC:
    #   No coi hai bang xep hang QUAN TRONG NHU NHAU. Khi mot ben chac chan
    #   dung (BM25 voi ma loi VX-204) va ben kia mu tit, RRF van keo ket qua
    #   cua ben mu tit len - va co the day mat doan dung ra khoi top-k.
    #   Ban se DO duoc dieu do o bai 3, va do cung la ly do nguoi ta them
    #   mot buoc rerank phia sau.


# ===========================================================================
#  2.5 - Do chat luong tim kiem
# ===========================================================================
def recall_at_k(chi_so_lay: list[int], chi_so_dung: set[int]) -> float:
    if not chi_so_dung:
        return 1.0
    return len(set(chi_so_lay) & set(chi_so_dung)) / len(chi_so_dung)


def mrr(chi_so_lay: list[int], chi_so_dung: set[int]) -> float:
    if not chi_so_dung:
        return 0.0
    for thu_hang, chi_so in enumerate(chi_so_lay, start=1):
        if chi_so in chi_so_dung:
            return 1.0 / thu_hang
    return 0.0
    # VI SAO chi_so_dung RONG lai tra ve 0.0 o day ma 1.0 o recall?
    #   Vi hai cau hoi khac nhau. Recall hoi "lay duoc bao nhieu phan thu can
    #   lay" - khong can gi thi coi nhu du. MRR hoi "thu dung nam o hang may"
    #   - khong co thu dung nao thi khong co hang nao ca. Dinh nghia lech nhau
    #   the nay la cho RAT hay bi nham khi tu viet eval.
