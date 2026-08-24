"""LOI GIAI bai tap 3 - Trich dan va do chat luong RAG (Tuan 21)."""

from __future__ import annotations

import re
from collections.abc import Callable

CUM_TU_CHOI = [
    "không tìm thấy",
    "không có thông tin",
    "không đề cập",
    "tài liệu không",
    "không nói về",
]

# [1] hoac [12] - CHI so nguyen duong. "[0]" va "[-1]" khong khop vi
# lop dau doi it nhat mot chu so 1-9 o dau.
MAU_TRICH_DAN = re.compile(r"\[([1-9][0-9]*)\]")


def _gop_khoang_trang(s: str) -> str:
    return " ".join(s.split())


# ===========================================================================
#  3.1 - Dung ngu canh co danh so
# ===========================================================================
def tao_ngu_canh(cac_chunk: list[str], cac_nguon: list[str] | None = None) -> str:
    if cac_nguon is not None and len(cac_nguon) != len(cac_chunk):
        # Lech do dai thuong xay ra khi ban loc bo chunk trung lap ma quen loc
        # danh sach nguon tuong ung. Hau qua: doan [3] hien ten file cua doan
        # khac - tuc la trich dan SAI NGUON mot cach co he thong. Nem loi ngay.
        raise ValueError(
            f"So nguon ({len(cac_nguon)}) khac so chunk ({len(cac_chunk)})"
        )

    if not cac_chunk:
        return ""

    khoi = []
    for i, doan in enumerate(cac_chunk, start=1):
        nhan = f"[{i}]" if cac_nguon is None else f"[{i}] ({cac_nguon[i - 1]})"
        khoi.append(f"{nhan}\n{doan}")
    return "\n\n".join(khoi)


# ===========================================================================
#  3.2 - Doc trich dan trong cau tra loi
# ===========================================================================
def tach_trich_dan(cau_tra_loi: str) -> set[int]:
    return {int(s) for s in MAU_TRICH_DAN.findall(cau_tra_loi)}


def kiem_tra_trich_dan(cau_tra_loi: str, so_doan: int) -> dict:
    cac_so = tach_trich_dan(cau_tra_loi)
    ngoai = {n for n in cac_so if n > so_doan}
    return {
        "co_trich_dan": bool(cac_so),
        "ngoai_pham_vi": ngoai,
        "hop_le": bool(cac_so) and not ngoai,
    }
    # VI SAO "khong co trich dan" cung bi coi la KHONG hop le?
    #   Vi mot cau tra loi khong dan nguon thi ban khong the kiem chung no.
    #   No co the dung, nhung ban khong BIET la no dung - va voi tai lieu noi
    #   bo cong ty, "co ve dung" khong phai la mot tieu chuan chap nhan duoc.


# ===========================================================================
#  3.3 - Nhan biet cau tra loi tu choi
# ===========================================================================
def la_tu_choi(cau_tra_loi: str) -> bool:
    s = cau_tra_loi.lower()
    return any(cum in s for cum in CUM_TU_CHOI)
    # GIOI HAN THAT CUA CACH NAY: no la so khop chuoi, nen se bao nham voi cau
    # "Tài liệu không giới hạn số ngày làm từ xa" - mot cau tra loi CO noi dung.
    # Cach chac chan hon la bat model tra ve mot truong co cau truc
    # (structured output, Phase 07) thay vi doan y tu van xuoi.
    # Doi lai, cach nay khong ton mot dong API nao va du de bat dau do luong.


# ===========================================================================
#  3.4 - Cham mot cau
# ===========================================================================
def cham_mot_cau(cau_tra_loi: str, cac_chunk_lay: list[str],
                 cau_vang: dict) -> dict:
    cac_trich_dan = cau_vang.get("trich_dan", [])
    cac_tu_khoa = cau_vang.get("tu_khoa", [])

    # --- recall: doan chua dap an co nam trong nhung gi lay ve khong? ---
    kho = _gop_khoang_trang(" || ".join(cac_chunk_lay))
    if cac_trich_dan:
        so_thay = sum(1 for td in cac_trich_dan if _gop_khoang_trang(td) in kho)
        recall = so_thay / len(cac_trich_dan)
    else:
        recall = 1.0

    # --- tu khoa: cau tra loi co noi dung y khong? ---
    tl_thuong = _gop_khoang_trang(cau_tra_loi).lower()
    du_tu_khoa = all(_gop_khoang_trang(t).lower() in tl_thuong for t in cac_tu_khoa)

    trich_dan_ok = kiem_tra_trich_dan(cau_tra_loi, len(cac_chunk_lay))["hop_le"]
    tu_choi = la_tu_choi(cau_tra_loi)

    if not cac_trich_dan:
        # Cau hoi khong co dap an trong tai lieu: chi co MOT hanh vi dung.
        diem = 1.0 if tu_choi else 0.0
    else:
        diem = 0.0
        if recall == 1.0:
            diem += 0.4
        if du_tu_khoa:
            diem += 0.4
        if trich_dan_ok:
            diem += 0.2

    return {
        "recall": recall,
        "du_tu_khoa": du_tu_khoa,
        "trich_dan_ok": trich_dan_ok,
        "tu_choi": tu_choi,
        "diem": round(diem, 6),
    }
    # VI SAO recall CHI DUOC DIEM KHI BANG DUNG 1.0?
    #   Vi voi cau hoi can hai doan (nhu "sua loi VX-204" can ca mo ta lan
    #   cach sua), lay duoc mot nua nghia la cau tra loi se THIEU mot nua.
    #   Cham 0.2 cho "mot nua" se khien mot he thong tra loi cut duoc coi la
    #   "kha on" - va ban se khong bao gio di sua no.


# ===========================================================================
#  3.5 - Chay ca bo test
# ===========================================================================
def chay_eval_rag(bo_test: list[dict],
                  ham_tra_loi: Callable[[str], tuple[str, list[str]]]) -> list[dict]:
    ket_qua = []

    for cau in bo_test:
        ban_ghi = {
            "id": cau["id"],
            "loai": cau.get("loai", ""),
            "cau_hoi": cau["cau_hoi"],
            "cau_tra_loi": "",
            "diem": 0.0,
            "chi_tiet": {},
            "loi": None,
        }
        try:
            cau_tra_loi, cac_chunk = ham_tra_loi(cau["cau_hoi"])
            chi_tiet = cham_mot_cau(cau_tra_loi, cac_chunk, cau)
            ban_ghi["cau_tra_loi"] = cau_tra_loi
            ban_ghi["chi_tiet"] = chi_tiet
            ban_ghi["diem"] = chi_tiet["diem"]
        except Exception as e:  # noqa: BLE001 - o day bat rong LA CO Y
            # Bat Exception rong thuong la mui code xau. O DAY thi khong:
            # muc tieu cua vong lap nay la chay het bo test bat ke chuyen gi
            # xay ra voi tung cau. Diem mau chot la ta KHONG NUOT loi - no
            # duoc ghi vao ban ghi va se hien trong bao cao.
            ban_ghi["loi"] = f"{type(e).__name__}: {e}"

        ket_qua.append(ban_ghi)

    return ket_qua


def tong_hop(ket_qua: list[dict]) -> dict:
    if not ket_qua:
        return {"tong": 0.0, "so_cau": 0, "so_loi": 0, "theo_loai": {}}

    theo_loai: dict[str, list[float]] = {}
    for r in ket_qua:
        theo_loai.setdefault(r["loai"], []).append(r["diem"])

    return {
        "tong": sum(r["diem"] for r in ket_qua) / len(ket_qua),
        "so_cau": len(ket_qua),
        "so_loi": sum(1 for r in ket_qua if r["loi"]),
        "theo_loai": {l: sum(v) / len(v) for l, v in theo_loai.items()},
    }


# ===========================================================================
#  3.6 - So sanh hai cau hinh
# ===========================================================================
def so_sanh_cau_hinh(truoc: list[dict], sau: list[dict]) -> dict:
    diem_sau = {r["id"]: r["diem"] for r in sau}

    chung = [r for r in truoc if r["id"] in diem_sau]

    cai_thien, thoai_lui, giu_nguyen = [], [], []
    for r in chung:
        a, b = r["diem"], diem_sau[r["id"]]
        if b > a:
            cai_thien.append(r["id"])
        elif b < a:
            thoai_lui.append(r["id"])
        else:
            giu_nguyen.append(r["id"])

    n = len(chung)
    return {
        "diem_truoc": (sum(r["diem"] for r in chung) / n) if n else 0.0,
        "diem_sau": (sum(diem_sau[r["id"]] for r in chung) / n) if n else 0.0,
        "cai_thien": cai_thien,
        "thoai_lui": thoai_lui,
        "giu_nguyen": giu_nguyen,
    }
    # VI SAO CHI SO SANH CAC ID CO O CA HAI LAN CHAY?
    #   Vi khi ban them cau hoi moi vao bo test, diem trung binh doi ngay - va
    #   phan doi do KHONG phai do he thong tot len hay xau di. Neu gop ca cau
    #   moi vao phep so sanh, ban se ket luan nham ve chinh thay doi ma minh
    #   vua thuc hien. Do la ly do bao cao phai ghi ro so cau duoc so sanh.
