"""Tao bo du lieu mau cho Phase 03 va project P1.

Chay MOT LAN truoc khi bat dau Tuan 6:

    python curriculum/03-data-toolkit/tao_du_lieu.py

Script tao ra 3 file trong thu muc data/:

    data/ban_hang.csv       ~3000 dong don hang - CO Y DE BAN (de tap lam sach)
    data/khach_hang.csv     ~400 khach hang     - de tap ghep bang (merge)
    data/ban_hang.db        SQLite - de tap SQL

VI SAO DU LIEU BAN?
    Du lieu that ngoai doi LUON ban. Neu chi tap tren du lieu sach, ban se
    soc khi gap du lieu that. Cac loi duoc cai san o day deu la loi CO THAT
    ma nguoi lam du lieu gap hang ngay:

        - O trong (thieu email, thieu so luong)
        - Dong trung lap hoan toan
        - Ten thanh pho viet lung tung: "HN", "Ha Noi", "ha noi", "HÀ NỘI"
        - Khoang trang thua o dau/cuoi ten
        - Cot ngay thang co 3 dinh dang khac nhau
        - Gia tri vo ly: so luong am, gia bang 0, tuoi 999
        - Cot so bi luu duoi dang chuoi ("1.200.000")
        - Vai gia tri ngoai lai that su (don hang cuc lon)

Du lieu duoc sinh voi seed co dinh nen ai chay cung ra file y het nhau.
"""

from __future__ import annotations

import csv
import sqlite3
from pathlib import Path

import numpy as np

SEED = 42
SO_DON = 3000
SO_KHACH = 400

GOC_DU_AN = Path(__file__).resolve().parents[2]
THU_MUC_DATA = GOC_DU_AN / "data"

HO = ["Nguyen", "Tran", "Le", "Pham", "Hoang", "Vu", "Dang", "Bui", "Do", "Ngo"]
DEM = ["Van", "Thi", "Minh", "Quoc", "Thanh", "Ngoc", "Huu", "Duc"]
TEN = ["An", "Binh", "Cuong", "Dung", "Giang", "Hoa", "Khanh", "Lan", "Nam", "Oanh",
       "Phuc", "Quyen", "Son", "Trang", "Tuan", "Uyen", "Viet", "Yen"]

# Ten thanh pho CO Y viet lung tung - dung bo nay de tap chuan hoa
THANH_PHO_BAN = {
    "Ha Noi": ["HN", "Ha Noi", "ha noi", "HA NOI", " Ha Noi ", "Hà Nội"],
    "TP HCM": ["HCM", "TPHCM", "tp hcm", "TP.HCM", "Ho Chi Minh", "SG"],
    "Da Nang": ["DN", "Da Nang", "da nang", "Đà Nẵng"],
    "Can Tho": ["CT", "Can Tho", "can tho"],
    "Hai Phong": ["HP", "Hai Phong", "hai phong"],
}

DANH_MUC = {
    "Dien thoai": (5_000_000, 35_000_000),
    "Laptop": (12_000_000, 60_000_000),
    "Phu kien": (50_000, 2_000_000),
    "Tai nghe": (200_000, 8_000_000),
    "Dong ho": (1_000_000, 25_000_000),
}

KENH = ["Website", "App", "Cua hang", "Facebook", "Shopee"]


def _tao_ten(rng: np.random.Generator) -> str:
    return f"{rng.choice(HO)} {rng.choice(DEM)} {rng.choice(TEN)}"


def _tao_khach_hang(rng: np.random.Generator) -> list[dict]:
    khach = []
    for i in range(1, SO_KHACH + 1):
        ten = _tao_ten(rng)

        # Mot so ten co khoang trang thua o dau/cuoi
        if rng.random() < 0.15:
            ten = f"  {ten}  "
        # Mot so viet thuong het
        if rng.random() < 0.10:
            ten = ten.lower()

        tuoi = int(rng.normal(34, 11))
        tuoi = max(16, min(tuoi, 78))
        # 1% du lieu tuoi vo ly - loi nhap lieu that hay gap
        if rng.random() < 0.01:
            tuoi = int(rng.choice([0, 999, -5]))

        email = f"{ten.strip().lower().replace(' ', '.')}{i}@email.com"
        # 12% thieu email
        if rng.random() < 0.12:
            email = ""

        khach.append(
            {
                "khach_id": f"KH{i:04d}",
                "ho_ten": ten,
                "tuoi": tuoi,
                "email": email,
                "thanh_pho": rng.choice(
                    THANH_PHO_BAN[str(rng.choice(list(THANH_PHO_BAN.keys())))]
                ),
                "ngay_dang_ky": f"2024-{rng.integers(1, 13):02d}-{rng.integers(1, 29):02d}",
            }
        )
    return khach


def _tao_don_hang(rng: np.random.Generator, ma_khach: list[str]) -> list[dict]:
    don = []
    for i in range(1, SO_DON + 1):
        danh_muc = str(rng.choice(list(DANH_MUC.keys())))
        thap, cao = DANH_MUC[danh_muc]
        don_gia = int(rng.uniform(thap, cao) / 10_000) * 10_000

        so_luong = int(rng.choice([1, 1, 1, 2, 2, 3, 5], p=[.45, .2, .1, .1, .07, .05, .03]))

        thang = int(rng.integers(1, 13))
        ngay = int(rng.integers(1, 29))

        # CO Y: ba dinh dang ngay khac nhau
        r = rng.random()
        if r < 0.70:
            ngay_dat = f"2025-{thang:02d}-{ngay:02d}"
        elif r < 0.90:
            ngay_dat = f"{ngay:02d}/{thang:02d}/2025"
        else:
            ngay_dat = f"{thang:02d}-{ngay:02d}-2025"

        # CO Y: 8% cot don_gia luu duoi dang chuoi co dau cham phan cach
        don_gia_ghi: str | int = don_gia
        if rng.random() < 0.08:
            don_gia_ghi = f"{don_gia:,}".replace(",", ".")

        # CO Y: 6% thieu so luong
        so_luong_ghi: str | int = so_luong
        if rng.random() < 0.06:
            so_luong_ghi = ""

        # CO Y: 1.5% so luong am (loi hoan tra bi ghi nham)
        if rng.random() < 0.015:
            so_luong_ghi = -so_luong

        # CO Y: 1% don gia bang 0
        if rng.random() < 0.01:
            don_gia_ghi = 0

        giam_gia = float(rng.choice([0, 0, 0, 0.05, 0.1, 0.15, 0.2],
                                    p=[.5, .15, .1, .1, .07, .05, .03]))

        don.append(
            {
                "don_id": f"DH{i:05d}",
                "khach_id": str(rng.choice(ma_khach)),
                "ngay_dat": ngay_dat,
                "danh_muc": danh_muc,
                "so_luong": so_luong_ghi,
                "don_gia": don_gia_ghi,
                "giam_gia": giam_gia,
                "kenh": str(rng.choice(KENH, p=[.3, .25, .2, .15, .1])),
            }
        )

    # CO Y: them ~2% dong TRUNG LAP hoan toan
    so_trung = int(SO_DON * 0.02)
    for idx in rng.choice(len(don), size=so_trung, replace=False):
        don.append(dict(don[int(idx)]))

    # CO Y: vai don hang NGOAI LAI cuc lon
    for _ in range(5):
        don.append(
            {
                "don_id": f"DH9{rng.integers(1000, 9999)}",
                "khach_id": str(rng.choice(ma_khach)),
                "ngay_dat": "2025-11-25",
                "danh_muc": "Laptop",
                "so_luong": int(rng.integers(40, 120)),
                "don_gia": 55_000_000,
                "giam_gia": 0.25,
                "kenh": "Cua hang",
            }
        )

    rng.shuffle(don)
    return don


def _ghi_csv(duong_dan: Path, cac_dong: list[dict]) -> None:
    with open(duong_dan, "w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(cac_dong[0].keys()))
        w.writeheader()
        w.writerows(cac_dong)


def _tao_sqlite(duong_dan: Path, khach: list[dict], don: list[dict]) -> None:
    if duong_dan.exists():
        duong_dan.unlink()

    con = sqlite3.connect(duong_dan)
    cur = con.cursor()

    cur.execute("""
        CREATE TABLE khach_hang (
            khach_id     TEXT PRIMARY KEY,
            ho_ten       TEXT,
            tuoi         INTEGER,
            email        TEXT,
            thanh_pho    TEXT,
            ngay_dang_ky TEXT
        )
    """)
    cur.execute("""
        CREATE TABLE don_hang (
            don_id    TEXT,
            khach_id  TEXT,
            ngay_dat  TEXT,
            danh_muc  TEXT,
            so_luong  INTEGER,
            don_gia   INTEGER,
            giam_gia  REAL,
            kenh      TEXT
        )
    """)

    cur.executemany(
        "INSERT INTO khach_hang VALUES (:khach_id,:ho_ten,:tuoi,:email,:thanh_pho,:ngay_dang_ky)",
        [{**k, "ho_ten": k["ho_ten"].strip()} for k in khach],
    )

    # Ban SQLite thi da duoc lam sach so luong/don gia cho de tap SQL
    don_sach = []
    for d in don:
        sl = d["so_luong"]
        dg = d["don_gia"]
        if sl == "" or (isinstance(sl, int) and sl <= 0):
            continue
        if isinstance(dg, str):
            dg = int(dg.replace(".", ""))
        if dg <= 0:
            continue
        don_sach.append({**d, "so_luong": int(sl), "don_gia": int(dg)})

    cur.executemany(
        "INSERT INTO don_hang VALUES (:don_id,:khach_id,:ngay_dat,:danh_muc,"
        ":so_luong,:don_gia,:giam_gia,:kenh)",
        don_sach,
    )

    con.commit()
    con.close()
    return len(don_sach)


def main() -> None:
    rng = np.random.default_rng(SEED)
    THU_MUC_DATA.mkdir(parents=True, exist_ok=True)

    print("Dang tao du lieu mau...")

    khach = _tao_khach_hang(rng)
    don = _tao_don_hang(rng, [k["khach_id"] for k in khach])

    _ghi_csv(THU_MUC_DATA / "khach_hang.csv", khach)
    _ghi_csv(THU_MUC_DATA / "ban_hang.csv", don)
    so_dong_db = _tao_sqlite(THU_MUC_DATA / "ban_hang.db", khach, don)

    print(f"""
  Da tao xong trong thu muc data/

    khach_hang.csv    {len(khach):>6} dong
    ban_hang.csv      {len(don):>6} dong   (CO Y de ban)
    ban_hang.db       {so_dong_db:>6} dong don hang da lam sach

  Cac loi duoc cai san trong ban_hang.csv - nhiem vu cua ban la tim ra chung:
    - O trong o cot so_luong
    - Dong trung lap hoan toan
    - Cot ngay_dat co 3 dinh dang khac nhau
    - Cot don_gia doi khi la chuoi "12.000.000"
    - So luong am, don gia bang 0
    - Vai don hang ngoai lai cuc lon
    - Ten thanh pho trong khach_hang.csv viet lung tung

  Bat dau: curriculum/03-data-toolkit/README.md
""")


if __name__ == "__main__":
    main()
