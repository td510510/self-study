"""Tao bo du lieu cho Phase 04 va project P2.

Chay MOT LAN truoc khi bat dau Tuan 9:

    python curriculum/04-classical-ml/tao_du_lieu.py

Tao ra 2 file trong data/:

    data/gia_nha.csv     ~1200 dong - bai toan HOI QUY (du doan mot con SO)
    data/churn.csv       ~5000 dong - bai toan PHAN LOAI (du doan NHAN)

VE BO DU LIEU CHURN:
    "Churn" = khach hang roi bo dich vu. Day la bai toan kinh dien nhat
    trong ML ung dung: vien thong, ngan hang, SaaS deu phai giai.

    Du lieu duoc sinh voi quan he THAT giua dac trung va nhan, cong them
    nhieu - nen model tot se dat AUC khoang 0.78-0.84. Neu ban dat tren 0.95
    thi gan nhu chac chan da bi DATA LEAKAGE.

    CO Y cai san hai cai bay:
      1. Cot `tong_chi_tieu` gan nhu ty le thuan voi `so_thang_su_dung`
         -> hai dac trung tuong quan cao (da cong tuyen)
      2. Cot `da_goi_tong_dai_huy` la dac trung RO RI: no chi duoc ghi
         nhan SAU KHI khach da quyet dinh huy. Dua vao model se cho
         ket qua dep gia tao. Ban se hoc cach phat hien no.

    Ty le churn ~26% - MAT CAN BANG vua phai, du de thay accuracy
    la chi so vo dung.
"""

from __future__ import annotations

from pathlib import Path

import numpy as np
import pandas as pd

SEED = 42
GOC_DU_AN = Path(__file__).resolve().parents[2]
THU_MUC_DATA = GOC_DU_AN / "data"


# ===========================================================================
def tao_gia_nha(rng: np.random.Generator, n: int = 1200) -> pd.DataFrame:
    """Bai toan hoi quy: du doan gia nha (trieu VND)."""
    quan = rng.choice(
        ["Quan 1", "Quan 3", "Quan 7", "Binh Thanh", "Go Vap", "Thu Duc"],
        size=n,
        p=[0.08, 0.12, 0.18, 0.20, 0.22, 0.20],
    )
    he_so_quan = {
        "Quan 1": 3.2, "Quan 3": 2.6, "Quan 7": 1.9,
        "Binh Thanh": 1.5, "Go Vap": 1.1, "Thu Duc": 1.0,
    }

    dien_tich = np.clip(rng.normal(75, 30, n), 25, 250).round(1)
    so_phong = np.clip((dien_tich / 25 + rng.normal(0, 0.6, n)).round(), 1, 6).astype(int)
    tuoi_nha = np.clip(rng.exponential(8, n), 0, 45).round().astype(int)
    khoang_cach = np.clip(rng.exponential(6, n), 0.3, 30).round(1)   # km toi trung tam
    co_thang_may = (rng.random(n) < 0.35).astype(int)

    # Quan he THAT (co nhieu) - day la thu model phai hoc lai
    gia = (
        dien_tich * 55 * np.array([he_so_quan[q] for q in quan])
        + so_phong * 180
        - tuoi_nha * 45
        - khoang_cach * 90
        + co_thang_may * 700
        + rng.normal(0, 900, n)
    )
    gia = np.clip(gia, 800, None).round(0)

    df = pd.DataFrame(
        {
            "dien_tich": dien_tich,
            "so_phong": so_phong,
            "tuoi_nha": tuoi_nha,
            "khoang_cach_trung_tam": khoang_cach,
            "co_thang_may": co_thang_may,
            "quan": quan,
            "gia": gia,
        }
    )

    # ~3% gia tri thieu o mot vai cot - de tap Pipeline
    for cot in ("tuoi_nha", "khoang_cach_trung_tam"):
        mat_na = rng.random(n) < 0.03
        df.loc[mat_na, cot] = np.nan

    return df


# ===========================================================================
def tao_churn(rng: np.random.Generator, n: int = 5000) -> pd.DataFrame:
    """Bai toan phan loai: du doan khach hang co roi bo khong."""
    so_thang = np.clip(rng.exponential(22, n), 1, 72).round().astype(int)
    cuoc_hang_thang = np.clip(rng.normal(650, 260, n), 150, 2000).round(0)

    loai_hop_dong = rng.choice(
        ["Thang", "1 nam", "2 nam"], size=n, p=[0.55, 0.28, 0.17]
    )
    dich_vu_internet = rng.choice(
        ["Cap quang", "ADSL", "Khong"], size=n, p=[0.45, 0.40, 0.15]
    )
    thanh_toan = rng.choice(
        ["Tu dong", "Chuyen khoan", "Tien mat"], size=n, p=[0.38, 0.34, 0.28]
    )

    so_lan_ho_tro = rng.poisson(1.1, n)
    co_ho_tro_ky_thuat = (rng.random(n) < 0.4).astype(int)
    tuoi = np.clip(rng.normal(41, 14, n), 18, 80).round().astype(int)

    # BAY 1: tong_chi_tieu gan nhu = so_thang * cuoc_hang_thang -> da cong tuyen
    tong_chi_tieu = (so_thang * cuoc_hang_thang * rng.normal(1.0, 0.04, n)).round(0)

    # ---- Xac suat churn: quan he THAT ----
    diem = (
        -2.3
        - 0.045 * so_thang                                    # dung lau -> it roi bo
        + 0.0016 * cuoc_hang_thang                            # cuoc cao -> de roi bo
        + 0.30 * so_lan_ho_tro                                # goi ho tro nhieu -> khong hai long
        - 0.85 * co_ho_tro_ky_thuat
        + np.where(loai_hop_dong == "Thang", 1.05, 0.0)       # hop dong thang -> de bo
        + np.where(loai_hop_dong == "2 nam", -0.75, 0.0)
        + np.where(dich_vu_internet == "Cap quang", 0.35, 0.0)
        + np.where(thanh_toan == "Tien mat", 0.55, 0.0)
        - 0.012 * (tuoi - 41)
        + rng.normal(0, 0.55, n)                              # nhieu
    )
    p_churn = 1 / (1 + np.exp(-diem))
    churn = (rng.random(n) < p_churn).astype(int)

    # BAY 2: dac trung RO RI - chi ghi nhan SAU KHI khach quyet dinh huy
    da_goi_tong_dai_huy = np.where(
        churn == 1, (rng.random(n) < 0.88).astype(int), (rng.random(n) < 0.04).astype(int)
    )

    df = pd.DataFrame(
        {
            "khach_id": [f"KH{i:05d}" for i in range(1, n + 1)],
            "tuoi": tuoi,
            "so_thang_su_dung": so_thang,
            "cuoc_hang_thang": cuoc_hang_thang,
            "tong_chi_tieu": tong_chi_tieu,
            "loai_hop_dong": loai_hop_dong,
            "dich_vu_internet": dich_vu_internet,
            "phuong_thuc_thanh_toan": thanh_toan,
            "so_lan_ho_tro": so_lan_ho_tro,
            "co_ho_tro_ky_thuat": co_ho_tro_ky_thuat,
            "da_goi_tong_dai_huy": da_goi_tong_dai_huy,
            "churn": churn,
        }
    )

    # ~2% thieu o tong_chi_tieu (khach moi chua co hoa don)
    mat_na = rng.random(n) < 0.02
    df.loc[mat_na, "tong_chi_tieu"] = np.nan

    return df


# ===========================================================================
def main() -> None:
    rng = np.random.default_rng(SEED)
    THU_MUC_DATA.mkdir(parents=True, exist_ok=True)

    nha = tao_gia_nha(rng)
    churn = tao_churn(rng)

    nha.to_csv(THU_MUC_DATA / "gia_nha.csv", index=False, encoding="utf-8-sig")
    churn.to_csv(THU_MUC_DATA / "churn.csv", index=False, encoding="utf-8-sig")

    print(f"""
  Da tao xong trong thu muc data/

    gia_nha.csv   {len(nha):>5} dong  - HOI QUY   (du doan gia, don vi trieu VND)
    churn.csv     {len(churn):>5} dong  - PHAN LOAI (du doan khach co roi bo khong)

  Ty le churn: {churn['churn'].mean():.1%}
    -> MAT CAN BANG. Doan bua "khong ai roi bo" da duoc
       accuracy = {1 - churn['churn'].mean():.1%}
       Do la vi sao accuracy la chi so VO DUNG o bai toan nay.

  HAI CAI BAY duoc cai san trong churn.csv (ban se tim ra o Tuan 10-11):
    1. `tong_chi_tieu` gan nhu = so_thang_su_dung x cuoc_hang_thang
       -> hai dac trung tuong quan rat cao (da cong tuyen)
    2. Mot cot la dac trung RO RI - dung no thi AUC vot tu ~0.79 len ~0.96
       nhung model vo dung ngoai doi thuc. Tim ra no la bai tap cua ban.

  Bat dau: curriculum/04-classical-ml/README.md
""")


if __name__ == "__main__":
    main()
