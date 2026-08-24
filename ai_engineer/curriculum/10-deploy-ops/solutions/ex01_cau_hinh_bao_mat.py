"""LOI GIAI bai tap 1 - Cau hinh va bao mat (Tuan 22)."""

from __future__ import annotations

from dataclasses import dataclass

MODEL_HOP_LE = ("claude-haiku-4-5", "claude-sonnet-5", "claude-opus-5")

TU_KHOA_BI_MAT = ("api_key", "apikey", "token", "secret", "password",
                  "authorization", "mat_khau")

GIA_TRI_DUNG = {"true", "1", "yes"}


@dataclass(frozen=True)
class CauHinh:
    api_key: str
    model: str
    moi_truong: str
    max_token: int
    ngan_sach_usd: float
    ghi_log_prompt: bool


# ===========================================================================
#  1.1 - Doc cau hinh tu bien moi truong
# ===========================================================================
def doc_cau_hinh(bien_moi_truong: dict) -> CauHinh:
    mt = bien_moi_truong

    api_key = mt.get("ANTHROPIC_API_KEY", "")
    if not api_key:
        # Thong bao PHAI neu ro ten bien. "Cau hinh khong hop le" bat nguoi
        # doc di doc code cua ban de biet phai dat bien nao.
        raise ValueError("Thiếu biến môi trường ANTHROPIC_API_KEY")

    moi_truong = mt.get("MOI_TRUONG", "dev")
    if moi_truong not in ("dev", "prod"):
        raise ValueError(f"MOI_TRUONG phải là 'dev' hoặc 'prod', nhận được {moi_truong!r}")

    try:
        max_token = int(mt.get("MAX_TOKEN", "1024"))
    except (TypeError, ValueError):
        raise ValueError(f"MAX_TOKEN phải là số nguyên, nhận được {mt.get('MAX_TOKEN')!r}")
    if max_token <= 0:
        raise ValueError(f"MAX_TOKEN phải lớn hơn 0, nhận được {max_token}")

    try:
        ngan_sach = float(mt.get("NGAN_SACH_USD", "5.0"))
    except (TypeError, ValueError):
        raise ValueError(f"NGAN_SACH_USD phải là số, nhận được {mt.get('NGAN_SACH_USD')!r}")
    if ngan_sach <= 0:
        raise ValueError(f"NGAN_SACH_USD phải lớn hơn 0, nhận được {ngan_sach}")

    ghi_log_prompt = str(mt.get("GHI_LOG_PROMPT", "false")).lower() in GIA_TRI_DUNG

    if moi_truong == "prod" and ghi_log_prompt:
        # KHONG phai canh bao. Day la loi lam ung dung KHONG KHOI DONG DUOC,
        # vi khi no da chay roi thi du lieu ca nhan da nam trong log.
        raise ValueError(
            "Không được bật GHI_LOG_PROMPT ở môi trường prod: "
            "prompt chứa dữ liệu người dùng"
        )

    return CauHinh(
        api_key=api_key,
        model=mt.get("MODEL", "claude-haiku-4-5"),
        moi_truong=moi_truong,
        max_token=max_token,
        ngan_sach_usd=ngan_sach,
        ghi_log_prompt=ghi_log_prompt,
    )
    # VI SAO NHAN dict THAY VI DOC THANG os.environ?
    #   Vi mot ham doc os.environ thi test phai sua bien moi truong that -
    #   cham, de ro ri giua cac test, va khong chay song song duoc. Nhan dict
    #   lam tham so bien no thanh ham thuan tuy. O chuong trinh that ban goi:
    #       cau_hinh = doc_cau_hinh(os.environ)
    #   Mot dong duy nhat cham toi trang thai toan cuc, va no nam ngoai ham.


# ===========================================================================
#  1.2 - Che secret
# ===========================================================================
def che_secret(gia_tri: str, giu_dau: int = 7, giu_cuoi: int = 4) -> str:
    if not isinstance(gia_tri, str) or not gia_tri:
        return "***"
    if len(gia_tri) <= giu_dau + giu_cuoi:
        return "***"
    return f"{gia_tri[:giu_dau]}...{gia_tri[-giu_cuoi:]}"
    # VI SAO CHUOI NGAN LAI CHE HET?
    #   Vi voi chuoi 8 ky tu ma giu 7 dau + 4 cuoi thi ban vua in gan nhu ca
    #   chuoi. Truong hop bien nay chinh la luc ham "che" tro thanh ham "in" -
    #   va no im lang, khong ai nhan ra cho toi khi doc log.


# ===========================================================================
#  1.3 - Loc ban ghi log
# ===========================================================================
def _la_bi_mat(ten: str) -> bool:
    ten_thuong = str(ten).lower()
    return any(tu in ten_thuong for tu in TU_KHOA_BI_MAT)


def loc_ban_ghi(ban_ghi: dict) -> dict:
    ket_qua = {}
    for khoa, gia_tri in ban_ghi.items():
        if _la_bi_mat(khoa):
            ket_qua[khoa] = che_secret(gia_tri) if isinstance(gia_tri, str) else "***"
        elif isinstance(gia_tri, dict):
            ket_qua[khoa] = loc_ban_ghi(gia_tri)
        elif isinstance(gia_tri, list):
            ket_qua[khoa] = [loc_ban_ghi(p) if isinstance(p, dict) else p
                             for p in gia_tri]
        else:
            ket_qua[khoa] = gia_tri
    return ket_qua
    # VI SAO TRUONG BI MAT KHONG PHAI CHUOI LAI THANH "***" MA KHONG GIU?
    #   Vi neu ai do luu token duoi dang bytes, hoac mot doi tuong co __repr__
    #   in ra ca noi dung, thi giu nguyen la lo. Quy tac an toan: cai gi TEN
    #   giong bi mat thi khong bao gio duoc di ra log nguyen ven, bat ke kieu.


# ===========================================================================
#  1.4 - Kiem tra san sang
# ===========================================================================
def kiem_tra_san_sang(cau_hinh: CauHinh) -> dict:
    chi_tiet = {
        "co_api_key": bool(cau_hinh.api_key),
        "key_dung_dang": cau_hinh.api_key.startswith("sk-ant-"),
        "model_hop_le": cau_hinh.model in MODEL_HOP_LE,
        "ngan_sach_duong": cau_hinh.ngan_sach_usd > 0,
    }

    canh_bao = []
    if cau_hinh.moi_truong == "prod" and cau_hinh.ngan_sach_usd > 100:
        canh_bao.append(
            f"Ngân sách prod cao bất thường: ${cau_hinh.ngan_sach_usd:.2f}")
    if cau_hinh.moi_truong == "dev" and cau_hinh.ghi_log_prompt:
        canh_bao.append("Đang ghi log prompt - chỉ dùng ở dev, nhớ tắt trước khi lên prod")

    return {"san_sang": all(chi_tiet.values()), "chi_tiet": chi_tiet,
            "canh_bao": canh_bao}
    # VI SAO "key_dung_dang" CHI KIEM TIEN TO MA KHONG GOI THU API?
    #   Vi ham nay chay o endpoint /san_sang, va he thong dieu phoi goi no
    #   vai giay mot lan. Goi API that o day nghia la ban tu tao ra hang nghin
    #   request moi ngay chi de kiem tra - va bien mot su co cua Anthropic
    #   thanh su co cua chinh ban (tat ca instance cung bao "khong san sang"
    #   roi bi khoi dong lai dong loat).
    #
    #   Kiem tra san sang phai RE va CUC BO. Suc khoe cua he thong ben ngoai
    #   thuoc ve monitoring, khong thuoc ve readiness probe.
