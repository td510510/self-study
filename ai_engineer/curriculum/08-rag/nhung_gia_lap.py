"""Embedding GIA LAP chay offline - dung cho notebook va bai tap Phase 08.

    from nhung_gia_lap import nhung, nhung_nhieu
    v = nhung("Toi co duoc lam viec o nha khong?")     # numpy array da chuan hoa

VI SAO KHONG DUNG MODEL THAT?
    Model that (sentence-transformers) can tai ~90 MB va can mang. Bai hoc
    phai chay duoc offline, nen o day ta gia lap.

NO HOAT DONG THE NAO?
    Moi CHIEU cua vector la mot KHAI NIEM (nghi phep, bao hanh, bao mat...).
    Gia tri cua chieu = so lan van ban nhac toi khai niem do. Cuoi cung
    chuan hoa ve do dai 1 de tim kiem chi con la mot phep nhan ma tran.

    "ngoi nha lam viec"   -> khai niem TU_XA
    "lam viec tu xa"      -> khai niem TU_XA      -> hai cau nay GAN NHAU

DAY LA CHO KHAC BIET QUAN TRONG SO VOI MODEL THAT:
    Model that HOC quan he ngu nghia tu hang ty cau. O day ta GAN TAY bang
    mot tu dien 27 khai niem. Vi vay ban embedding nay:
      - dung TINH CHAT (dien dat khac nhau -> vector gan nhau)
      - nhung MU TIT voi moi tu nam ngoai tu dien

    Do chinh la ly do notebook 01 bat ban so sanh no voi model that neu ban
    da cai `pip install -e ".[rag]"`. Thay ro gioi han cua ban gia lap la
    mot phan cua bai hoc, khong phai loi cua no.
"""

from __future__ import annotations

import json
import re
from pathlib import Path

import numpy as np

GOC_DU_AN = Path(__file__).resolve().parents[2]
DUONG_DAN_KHAI_NIEM = GOC_DU_AN / "data" / "phase08" / "khai_niem.json"


def _nap_khai_niem() -> dict[str, list[str]]:
    if not DUONG_DAN_KHAI_NIEM.exists():
        raise FileNotFoundError(
            f"Chua co {DUONG_DAN_KHAI_NIEM}.\n"
            "Chay truoc: python curriculum/08-rag/tao_du_lieu.py"
        )
    return json.loads(DUONG_DAN_KHAI_NIEM.read_text(encoding="utf-8"))


KHAI_NIEM = _nap_khai_niem()
TEN_CHIEU: list[str] = sorted(KHAI_NIEM)
SO_CHIEU: int = len(TEN_CHIEU)


def _chuan_hoa_van_ban(s: str) -> str:
    """Ha thuong va gop khoang trang de so khop cum tu on dinh hon."""
    return re.sub(r"\s+", " ", s.lower())


def nhung(van_ban: str) -> np.ndarray:
    """Bien van ban thanh vector (SO_CHIEU,) da chuan hoa do dai 1.

    Van ban khong khop khai niem nao -> vector 0. Cosine voi vector 0 bang 0,
    tuc la "khong biet gi ve doan nay" - dung y hon la tra ve mot huong ngau nhien.
    """
    s = _chuan_hoa_van_ban(van_ban)
    v = np.zeros(SO_CHIEU, dtype=np.float32)

    for i, ten in enumerate(TEN_CHIEU):
        for tu_khoa in KHAI_NIEM[ten]:
            if tu_khoa in s:
                v[i] += s.count(tu_khoa)

    # Lam diu anh huong cua tu lap lai nhieu lan (giong y tuong log-tf cua TF-IDF):
    # mot doan nhac "phep" 10 lan khong co nghia la lien quan gap 10 lan.
    v = np.log1p(v)

    do_dai = np.linalg.norm(v)
    return v if do_dai == 0 else v / do_dai


def nhung_nhieu(cac_van_ban: list[str]) -> np.ndarray:
    """Nhung mot danh sach van ban -> ma tran (n, SO_CHIEU)."""
    if not cac_van_ban:
        return np.zeros((0, SO_CHIEU), dtype=np.float32)
    return np.vstack([nhung(t) for t in cac_van_ban])


def giai_thich(van_ban: str, top: int = 5) -> list[tuple[str, float]]:
    """Cac khai niem manh nhat trong van ban - de DEBUG khi tim kiem ra ket qua la.

    Day la cong cu quan trong hon ve ngoai: khi retrieval tra ve doan sai,
    cau hoi dau tien luon la "he thong DANG HIEU cau nay noi ve gi?".
    """
    v = nhung(van_ban)
    thu_tu = np.argsort(-v)[:top]
    return [(TEN_CHIEU[i], float(v[i])) for i in thu_tu if v[i] > 0]


if __name__ == "__main__":
    print(f"So chieu: {SO_CHIEU}")
    for cau in ["Tôi có được ngồi nhà làm việc không?",
                "Chính sách làm việc từ xa thế nào?",
                "Sản phẩm bảo hành bao lâu?"]:
        print(f"\n{cau}")
        for ten, gt in giai_thich(cau):
            print(f"   {ten:<18} {gt:.3f}")
