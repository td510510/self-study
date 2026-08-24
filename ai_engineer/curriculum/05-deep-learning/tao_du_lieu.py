"""Tao bo du lieu anh cho Phase 05 va project P3.

Chay MOT LAN truoc khi bat dau Tuan 12:

    python curriculum/05-deep-learning/tao_du_lieu.py

Tao ra:
    data/hinh_khoi.npz    10.000 anh 28x28 xam, 4 lop hinh khoi

VI SAO TU SINH DU LIEU MA KHONG TAI MNIST/CIFAR?
    1. KHONG CAN MANG - chay duoc ngay ca khi khong co internet
    2. KHONG CAN torchvision - Phase 05 chi can `torch`, nhe hon nhieu
    3. Train duoc tren CPU trong vai chuc giay - ban lap lai thi nghiem
       duoc nhieu lan thay vi cho hang gio
    4. Ban KIEM SOAT do kho: co the tang nhieu de tao overfitting theo y muon

BON LOP HINH KHOI:
    0 - tron        (circle)
    1 - vuong       (square)
    2 - tam giac    (triangle)
    3 - chu thap    (cross)

DO KHO DUOC CAN CHINH DE (do that, 15 epoch tren CPU):
    - MLP tren pixel tho  ->  ~82%   (train ~2 giay)
    - CNN                 ->  ~96%   (train ~13 giay)
    Khoang cach 14 diem nay cho ban THAY vi sao CNN vuot troi voi anh,
    chu khong phai chi doc ly thuyet.

Anh co NHIEU, XOAY, vi tri va kich thuoc NGAU NHIEN. Phep xoay la thu
lam kho MLP nhat: no phai hoc rieng tung goc quay, trong khi CNN hoc
DAC TRUNG CUC BO (canh, goc) nen tong quat hoa tot hon nhieu.
"""

from __future__ import annotations

from pathlib import Path

import numpy as np

SEED = 42
KICH_THUOC = 28
SO_ANH_TRAIN = 8000
SO_ANH_TEST = 2000

TEN_LOP = ["tron", "vuong", "tam_giac", "chu_thap"]

GOC_DU_AN = Path(__file__).resolve().parents[2]
THU_MUC_DATA = GOC_DU_AN / "data"


# ===========================================================================
def _luoi(n: int = KICH_THUOC) -> tuple[np.ndarray, np.ndarray]:
    """Tra ve luoi toa do (yy, xx) cho anh n x n."""
    toa_do = np.arange(n)
    return np.meshgrid(toa_do, toa_do, indexing="ij")


def _toa_do_xoay(cy, cx, goc):
    """Tra ve (y, x) da dich ve tam va XOAY mot goc."""
    yy, xx = _luoi()
    y, x = yy - cy, xx - cx
    c, s = np.cos(goc), np.sin(goc)
    return c * y - s * x, s * y + c * x


def _ve_tron(anh, cy, cx, r, goc):
    y, x = _toa_do_xoay(cy, cx, 0.0)          # hinh tron bat bien voi xoay
    khoang_cach = np.sqrt(y**2 + x**2)
    anh += np.clip(1.0 - np.abs(khoang_cach - r) / 1.5, 0, 1)


def _ve_vuong(anh, cy, cx, r, goc):
    y, x = _toa_do_xoay(cy, cx, goc)
    d = np.maximum(np.abs(y), np.abs(x))
    anh += np.clip(1.0 - np.abs(d - r) / 1.2, 0, 1)


def _ve_tam_giac(anh, cy, cx, r, goc):
    y, x = _toa_do_xoay(cy, cx, goc)
    y, x = y / max(r, 1e-6), x / max(r, 1e-6)
    d = np.maximum(y - 0.6, np.maximum(-0.87 * x - 0.5 * y - 0.3, 0.87 * x - 0.5 * y - 0.3))
    anh += np.clip(1.0 - np.abs(d) * 5.5, 0, 1)


def _ve_chu_thap(anh, cy, cx, r, goc):
    y, x = _toa_do_xoay(cy, cx, goc)
    day = max(r * 0.30, 1.0)
    ngang = (np.abs(y) <= day) & (np.abs(x) <= r)
    doc = (np.abs(x) <= day) & (np.abs(y) <= r)
    anh += (ngang | doc).astype(float)


VE = [_ve_tron, _ve_vuong, _ve_tam_giac, _ve_chu_thap]


# ===========================================================================
def tao_anh(rng: np.random.Generator, lop: int) -> np.ndarray:
    """Sinh mot anh 28x28 cua lop cho truoc, co nhieu va bien the ngau nhien."""
    anh = np.zeros((KICH_THUOC, KICH_THUOC), dtype=np.float32)

    r = rng.uniform(4.5, 8.5)
    goc = rng.uniform(0, 2 * np.pi)            # XOAY ngau nhien
    # Le vua du de hinh khong bi cat qua nhieu, van con cho de dich chuyen
    le = min(r * 0.95, KICH_THUOC / 2 - 2)
    cy = rng.uniform(le, KICH_THUOC - le)
    cx = rng.uniform(le, KICH_THUOC - le)

    VE[lop](anh, cy, cx, r, goc)

    # Do sang thay doi -> model khong the dua vao tong cuong do pixel
    anh *= rng.uniform(0.70, 1.0)

    # Vai dom nhieu gay roi
    for _ in range(rng.integers(0, 3)):
        dy, dx = rng.integers(0, KICH_THUOC, 2)
        anh[max(dy - 1, 0) : dy + 2, max(dx - 1, 0) : dx + 2] += rng.uniform(0.3, 0.7)

    # Nhieu nen
    anh += rng.normal(0, 0.13, anh.shape)

    return np.clip(anh, 0, 1).astype(np.float32)


def tao_bo(rng: np.random.Generator, n: int) -> tuple[np.ndarray, np.ndarray]:
    nhan = rng.integers(0, len(TEN_LOP), n)
    anh = np.stack([tao_anh(rng, int(l)) for l in nhan])
    return anh, nhan.astype(np.int64)


# ===========================================================================
def main() -> None:
    rng = np.random.default_rng(SEED)
    THU_MUC_DATA.mkdir(parents=True, exist_ok=True)

    X_train, y_train = tao_bo(rng, SO_ANH_TRAIN)
    X_test, y_test = tao_bo(rng, SO_ANH_TEST)

    duong_dan = THU_MUC_DATA / "hinh_khoi.npz"
    np.savez_compressed(
        duong_dan,
        X_train=X_train,
        y_train=y_train,
        X_test=X_test,
        y_test=y_test,
        ten_lop=np.array(TEN_LOP),
    )

    kich_thuoc_mb = duong_dan.stat().st_size / 1e6
    phan_bo = np.bincount(y_train, minlength=4)

    print(f"""
  Da tao xong: data/hinh_khoi.npz  ({kich_thuoc_mb:.1f} MB)

    X_train  {str(X_train.shape):<18} gia tri trong [0, 1]
    y_train  {str(y_train.shape):<18} nhan 0-3
    X_test   {str(X_test.shape):<18}
    y_test   {str(y_test.shape):<18}

  Phan bo lop trong tap train:
    {TEN_LOP[0]:<10} {phan_bo[0]:>5}
    {TEN_LOP[1]:<10} {phan_bo[1]:>5}
    {TEN_LOP[2]:<10} {phan_bo[2]:>5}
    {TEN_LOP[3]:<10} {phan_bo[3]:>5}

  Anh co NHIEU, XOAY, vi tri va kich thuoc NGAU NHIEN - model khong
  the hoc thuoc vi tri pixel co dinh.

  Do kho da duoc can chinh (do that tren CPU, 15 epoch):
    MLP tren pixel tho  ->  ~82%   (~2 giay)
    CNN                 ->  ~96%   (~13 giay)
  Khoang cach 14 diem cho ban THAY vi sao CNN vuot troi voi anh.

  Cach nap:
      d = np.load("data/hinh_khoi.npz")
      X_train, y_train = d["X_train"], d["y_train"]

  Bat dau: curriculum/05-deep-learning/README.md
""")


if __name__ == "__main__":
    main()
