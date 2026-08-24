"""LOI GIAI bai tap 2 - Bo nho va ngu canh cua agent (Tuan 21)."""

from __future__ import annotations

import copy
from collections.abc import Callable

DAU_RUT_GON = "... (đã rút gọn)"


# ===========================================================================
#  2.1 - Uoc luong so token
# ===========================================================================
def dem_token_uoc(lich_su: list[dict]) -> int:
    tong_ky_tu = sum(len(str(buoc)) for buoc in lich_su)
    return tong_ky_tu // 3
    # VI SAO CHIA 3 CHU KHONG PHAI 4?
    #   Ty le "4 ky tu / token" la con so cho tieng Anh. Tieng Viet co dau ton
    #   token hon dang ke - chia 3 sat hon. Nhung ca hai deu chi la uoc luong;
    #   dieu quan trong la ban BIET no la uoc luong va khong dem no di bao cao
    #   chi phi cho ai.


# ===========================================================================
#  2.2 - Rut gon ket qua cong cu
# ===========================================================================
def rut_gon_ket_qua(lich_su: list[dict], max_ky_tu: int = 200) -> list[dict]:
    moi = []
    for buoc in lich_su:
        if buoc.get("vai") != "ket_qua" or not isinstance(buoc.get("noi_dung"), dict):
            moi.append(copy.deepcopy(buoc))
            continue

        noi_dung = {}
        for khoa, gia_tri in buoc["noi_dung"].items():
            if isinstance(gia_tri, str) and len(gia_tri) > max_ky_tu:
                noi_dung[khoa] = gia_tri[:max_ky_tu] + DAU_RUT_GON
            else:
                noi_dung[khoa] = gia_tri
        moi.append({**buoc, "noi_dung": noi_dung})

    return moi
    # VI SAO PHAI TRA VE DANH SACH MOI THAY VI SUA TAI CHO?
    #   Vi ban se muon so sanh "truoc nen" va "sau nen" khi go loi, va vi ham
    #   sua tai cho lam moi bo test phu thuoc thu tu chay. Ham thuan tuy
    #   (khong sua dau vao) la thu duy nhat ban test duoc mot cach yen tam.


# ===========================================================================
#  2.3 - Cat bot lich su
# ===========================================================================
def _tach_cap(lich_su: list[dict]) -> tuple[list[dict], list[list[dict]]]:
    """Tach thanh (phan dau, danh sach cac cap [cong_cu, ket_qua])."""
    dau = [b for b in lich_su if b.get("vai") in ("nhiem_vu", "tom_tat")]
    con_lai = [b for b in lich_su if b.get("vai") in ("cong_cu", "ket_qua")]
    cap = [con_lai[i:i + 2] for i in range(0, len(con_lai), 2)]
    return dau, cap


def cat_lich_su(lich_su: list[dict], giu_cap: int = 3) -> list[dict]:
    if giu_cap < 0:
        raise ValueError("giu_cap khong duoc am")

    dau, cap = _tach_cap(lich_su)
    giu = cap if giu_cap >= len(cap) else cap[len(cap) - giu_cap:] if giu_cap else []

    ket_qua = copy.deepcopy(dau)
    for c in giu:
        ket_qua.extend(copy.deepcopy(c))
    return ket_qua


# ===========================================================================
#  2.4 - Tom tat cac buoc cu
# ===========================================================================
def tom_tat_cu(lich_su: list[dict], giu_cap: int,
               ham_tom_tat: Callable[[list[dict]], str]) -> list[dict]:
    dau, cap = _tach_cap(lich_su)

    if giu_cap >= len(cap):
        # Khong co gi de tom tat. Chen mot khoi tom tat RONG chi lam ton token
        # va lam model boi roi - nen tra ve nguyen ven.
        return copy.deepcopy(lich_su)

    so_bo = len(cap) - giu_cap
    cac_buoc_cu = [b for c in cap[:so_bo] for b in c]

    try:
        noi_dung = ham_tom_tat(cac_buoc_cu)
    except Exception:  # noqa: BLE001
        # Tom tat la MOT LAN GOI API nua - no co the hong. Khi do quay ve cach
        # re nhat con hoat dong duoc, thay vi de ca agent chet.
        return cat_lich_su(lich_su, giu_cap)

    ket_qua = copy.deepcopy(dau)
    ket_qua.append({"vai": "tom_tat", "noi_dung": noi_dung})
    for c in cap[so_bo:]:
        ket_qua.extend(copy.deepcopy(c))
    return ket_qua


# ===========================================================================
#  2.5 - Nen cho vua ngan sach
# ===========================================================================
def nen_de_vua(lich_su: list[dict], ngan_sach_token: int,
               ham_tom_tat: Callable[[list[dict]], str] | None = None) -> tuple:
    da_dung: list[str] = []
    hien_tai = copy.deepcopy(lich_su)

    if dem_token_uoc(hien_tai) <= ngan_sach_token:
        return hien_tai, da_dung

    hien_tai = rut_gon_ket_qua(hien_tai, 200)
    da_dung.append("rut_gon")
    if dem_token_uoc(hien_tai) <= ngan_sach_token:
        return hien_tai, da_dung

    if ham_tom_tat is not None:
        hien_tai = tom_tat_cu(hien_tai, 2, ham_tom_tat)
        da_dung.append("tom_tat")
        if dem_token_uoc(hien_tai) <= ngan_sach_token:
            return hien_tai, da_dung

    hien_tai = cat_lich_su(hien_tai, 2)
    da_dung.append("cat")
    return hien_tai, da_dung
    # THU TU O DAY KHONG NGAU NHIEN - no di tu IT MAT MAT den NHIEU MAT MAT:
    #   rut_gon  giu ca cau truc lan y nghia, chi bo chi tiet
    #   tom_tat  giu y nghia, mat chi tiet, va TON THEM MOT LAN GOI API
    #   cat      mat han cac buoc cu - re nhat nhung nguy hiem nhat
    #
    # Nguoi moi hay lam nguoc: cat truoc vi de code nhat. Ket qua la agent
    # quen mat viec no vua lam va lam lai tu dau.


# ===========================================================================
#  2.6 - Phat hien lap
# ===========================================================================
def phat_hien_lap(lich_su: list[dict], nguong: int = 2) -> list[dict]:
    if nguong < 1:
        raise ValueError("nguong phai lon hon hoac bang 1")

    dem: dict[str, dict] = {}
    for buoc in lich_su:
        if buoc.get("vai") != "cong_cu":
            continue
        # dict khong bam duoc -> dung chuoi da SAP XEP lam khoa. Khong sap xep
        # thi {"a":1,"b":2} va {"b":2,"a":1} thanh hai khoa khac nhau, va ban
        # bo sot dung cai lap ma minh dang di tim.
        khoa = f'{buoc["ten"]}|{sorted((buoc.get("tham_so") or {}).items())}'
        if khoa not in dem:
            dem[khoa] = {"ten": buoc["ten"], "tham_so": buoc.get("tham_so") or {},
                         "so_lan": 0, "_thu_tu": len(dem)}
        dem[khoa]["so_lan"] += 1

    ket_qua = [v for v in dem.values() if v["so_lan"] >= nguong]
    ket_qua.sort(key=lambda v: (-v["so_lan"], v["_thu_tu"]))
    return [{"ten": v["ten"], "tham_so": v["tham_so"], "so_lan": v["so_lan"]}
            for v in ket_qua]
