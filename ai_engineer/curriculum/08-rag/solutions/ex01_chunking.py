"""LOI GIAI bai tap 1 - Chunking (Tuan 20).

Doc SAU KHI da tu lam. Cac comment "VI SAO" moi la phan dang doc.
"""

from __future__ import annotations


# ===========================================================================
#  1.1 - Cat theo kich thuoc co dinh
# ===========================================================================
def cat_co_dinh(van_ban: str, kich_thuoc: int, chong_lap: int = 0) -> list[str]:
    if kich_thuoc <= 0:
        raise ValueError("kich_thuoc phai lon hon 0")
    if chong_lap < 0:
        raise ValueError("chong_lap khong duoc am")
    if chong_lap >= kich_thuoc:
        # VI SAO PHAI CHAN? buoc nhay = kich_thuoc - chong_lap. Neu chong_lap
        # bang kich_thuoc thi buoc nhay = 0 va vong lap chay MAI MAI. Neu lon
        # hon thi buoc nhay am, chi so lui ve sau - con te hon.
        # Loi im lang kieu nay treo may ban giua luc dang demo.
        raise ValueError("chong_lap phai nho hon kich_thuoc")

    if not van_ban:
        return []

    buoc = kich_thuoc - chong_lap
    return [van_ban[i:i + kich_thuoc] for i in range(0, len(van_ban), buoc)]


# ===========================================================================
#  1.2 - Cat theo doan van
# ===========================================================================
def cat_theo_doan(van_ban: str, kich_thuoc_toi_da: int) -> list[str]:
    if kich_thuoc_toi_da <= 0:
        raise ValueError("kich_thuoc_toi_da phai lon hon 0")

    cac_doan = [d.strip() for d in van_ban.split("\n\n")]
    cac_doan = [d for d in cac_doan if d]
    if not cac_doan:
        return []

    ket_qua: list[str] = []
    dem: list[str] = []
    do_dai = 0

    for doan in cac_doan:
        # +2 la do dai cua "\n\n" se duoc chen vao giua. Quen cong phan noi
        # la cach pho bien nhat de chunk "1000 ky tu" cua ban thanh 1100.
        them = len(doan) + (2 if dem else 0)

        if dem and do_dai + them > kich_thuoc_toi_da:
            ket_qua.append("\n\n".join(dem))
            dem, do_dai = [], 0
            them = len(doan)

        dem.append(doan)
        do_dai += them

    if dem:
        ket_qua.append("\n\n".join(dem))
    return ket_qua
    # VI SAO KHONG CAT DOI DOAN QUA DAI?
    #   Vi doan dai la mot don vi y nghia co that (mot bang, mot dieu khoan).
    #   Cat no ra giua chung thuong lam hong ca hai nua. Thay vao do ta de no
    #   vuot kich thuoc va CHAP NHAN dieu do - nhung phai BIET la no vuot,
    #   nen bai 1.4 bat ban bao cao "dai_nhat".


# ===========================================================================
#  1.3 - Cat theo tieu de Markdown
# ===========================================================================
def cat_theo_tieu_de(van_ban: str, muc: int = 2) -> list[str]:
    if muc < 1:
        raise ValueError("muc phai lon hon hoac bang 1")

    dau = "#" * muc + " "
    ket_qua: list[str] = []
    hien_tai: list[str] = []

    for dong in van_ban.split("\n"):
        # dong.startswith(dau) chua du: "### C" cung bat dau bang "## ".
        # Phai kiem tra ky tu ngay sau chuoi '#' KHONG con la '#' nua.
        la_tieu_de = dong.startswith(dau) and not dong[muc:muc + 1] == "#"
        if la_tieu_de and hien_tai:
            ket_qua.append("\n".join(hien_tai).strip())
            hien_tai = []
        hien_tai.append(dong)

    if hien_tai:
        ket_qua.append("\n".join(hien_tai).strip())

    return [c for c in ket_qua if c]


# ===========================================================================
#  1.4 - Thong ke chunk
# ===========================================================================
def thong_ke_chunk(cac_chunk: list[str]) -> dict:
    if not cac_chunk:
        return {"so_chunk": 0, "do_dai_tb": 0.0, "ngan_nhat": 0,
                "dai_nhat": 0, "tong_ky_tu": 0}

    do_dai = [len(c) for c in cac_chunk]
    return {
        "so_chunk": len(cac_chunk),
        "do_dai_tb": sum(do_dai) / len(do_dai),
        "ngan_nhat": min(do_dai),
        "dai_nhat": max(do_dai),
        "tong_ky_tu": sum(do_dai),
    }
    # VI SAO PHAI CO "ngan_nhat"?
    #   Chunk qua ngan (vai chuc ky tu) gan nhu chac chan la rac: mot dong
    #   tieu de lac, mot dong ke ngang. Chung van chiem cho trong top-k va
    #   day mat doan that su co ich ra ngoai. Nhin "ngan_nhat" la biet ngay.


# ===========================================================================
#  1.5 - Kiem tra chunk co chua doan trich dan khong
# ===========================================================================
def _gop_khoang_trang(s: str) -> str:
    """Moi cum khoang trang / xuong dong -> mot dau cach duy nhat."""
    return " ".join(s.split())


def chunk_chua(cac_chunk: list[str], trich_dan: str) -> bool:
    can_tim = _gop_khoang_trang(trich_dan)
    if not can_tim:
        return True
    return any(can_tim in _gop_khoang_trang(c) for c in cac_chunk)
    # VI SAO KHONG HA THUONG LUON CHO "de tinh"?
    #   Vi bo eval nay se dung de do chinh xac. Ha thuong lam phep do DE DAI
    #   hon that su -> diem cao gia. Khi mot bo eval noi doi theo huong lac
    #   quan, no con te hon la khong co bo eval nao, vi ban se tin no.
