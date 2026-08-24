"""BAI TAP 1 - Cau hinh va bao mat (Tuan 22).

Cham diem:  pytest tests/phase10/test_ex01.py -v
Loi giai:   curriculum/10-deploy-ops/solutions/ex01_cau_hinh_bao_mat.py

DAY LA BAI TAP DE NHAT PHASE 10 VE MAT KY THUAT,
va la bai tap ma sai lam co hau qua nang nhat.

Mot API key lo ra trong log se nam vinh vien trong he thong log, trong ban sao
luu, trong anh chup man hinh ai do gui vao chat nhom. Ban khong thu hoi duoc.
Thu duy nhat lam duoc la XOAY key - va luc do da muon.

Khong can API key that de lam bai nay.
"""

from __future__ import annotations

from dataclasses import dataclass


# ===========================================================================
#  1.1 - Doc cau hinh tu bien moi truong
# ===========================================================================
@dataclass(frozen=True)
class CauHinh:
    """Cau hinh ung dung. `frozen=True` de khong ai sua duoc giua chung."""

    api_key: str
    model: str
    moi_truong: str          # "dev" | "prod"
    max_token: int
    ngan_sach_usd: float
    ghi_log_prompt: bool


def doc_cau_hinh(bien_moi_truong: dict) -> CauHinh:
    """Doc cau hinh tu mot dict bien moi truong.

    Nhan dict lam THAM SO thay vi doc thang os.environ - de test duoc.

    Cac bien va mac dinh:
        ANTHROPIC_API_KEY   bat buoc, khong co mac dinh
        MODEL               "claude-haiku-4-5"
        MOI_TRUONG          "dev"
        MAX_TOKEN           "1024"
        NGAN_SACH_USD       "5.0"
        GHI_LOG_PROMPT      "false"

    Quy tac:
        - Thieu ANTHROPIC_API_KEY  -> ValueError, thong bao NEU RO ten bien
        - MAX_TOKEN khong phai so nguyen duong -> ValueError
        - NGAN_SACH_USD khong phai so duong    -> ValueError
        - MOI_TRUONG khong thuoc {"dev", "prod"} -> ValueError
        - GHI_LOG_PROMPT: "true"/"1"/"yes" (khong phan biet hoa thuong) -> True,
          moi gia tri khac -> False
        - MOI_TRUONG == "prod" VA GHI_LOG_PROMPT bat -> ValueError

    VI SAO PROD KHONG DUOC GHI LOG PROMPT?
        Vi prompt cua nguoi dung chua du lieu cua ho: so dien thoai, dia chi,
        noi dung email, ma don hang. Ghi tat ca vao log nghia la ban vua tao ra
        mot ban sao du lieu ca nhan o mot noi khong ai bao ve.

        O dev thi tien loi va chap nhan duoc. O prod thi khong - va cach chac
        chan nhat de dieu do khong xay ra la lam cho no KHONG KHOI DONG DUOC.

    VI SAO KIEM TRA NGAY LUC KHOI DONG (fail fast)?
        Vi mot cau hinh sai duoc phat hien luc khoi dong thi ban sua trong 2
        phut. Cung cau hinh do phat hien luc 3 gio sang khi request dau tien
        cham toi no thi ban sua trong 2 tieng.
    """
    # TODO
    pass


# ===========================================================================
#  1.2 - Che secret
# ===========================================================================
def che_secret(gia_tri: str, giu_dau: int = 7, giu_cuoi: int = 4) -> str:
    """Che phan giua cua mot chuoi bi mat de van nhan dang duoc no.

    Vi du:
        che_secret("sk-ant-api03-VIDU-khong-that-XYZW")
        -> "sk-ant-...XYZW"

    Quy tac:
        - Chuoi ngan hon hoac bang giu_dau + giu_cuoi -> tra ve "***"
          (khong du dai de che an toan)
        - Chuoi rong -> "***"
        - Dinh dang: giu_dau ky tu dau + "..." + giu_cuoi ky tu cuoi
        - Khong phai chuoi -> tra ve "***"

    VI SAO GIU LAI MOT PHAN MA KHONG CHE HET?
        Vi khi go loi ban can biet "co dung key toi dang nghi khong" - va
        4 ky tu cuoi la du de phan biet hai key ma khong du de dung duoc.

        Che HET thi log cua ban an toan nhung vo dung: khong ai phan biet duoc
        "khong co key" voi "co key nhung sai key".
    """
    # TODO
    pass


# ===========================================================================
#  1.3 - Loc ban ghi log
# ===========================================================================
# Ten truong nao duoc coi la bi mat. So khop KHONG phan biet hoa thuong va chi
# can CHUA cum tu nay, vi du "anthropic_api_key" chua "api_key".
TU_KHOA_BI_MAT = ("api_key", "apikey", "token", "secret", "password",
                  "authorization", "mat_khau")


def loc_ban_ghi(ban_ghi: dict) -> dict:
    """Che moi truong co ten giong bi mat trong mot ban ghi log.

    Hoat dong DE QUY: dict long trong dict, va dict trong list.

    Vi du:
        loc_ban_ghi({"user": "an", "api_key": "sk-ant-api03-abcdef-XYZW"})
        -> {"user": "an", "api_key": "sk-ant-...XYZW"}

    Quy tac:
        - KHONG sua ban ghi goc - tra ve dict MOI
        - Gia tri bi che phai di qua che_secret() neu la chuoi;
          neu khong phai chuoi thi thay bang "***"
        - Truong khong giong bi mat -> giu nguyen

    VI SAO PHAI DE QUY?
        Vi thuc te ban khong log mot dict phang. Ban log ca doi tuong request,
        va key nam o dau do trong `{"config": {"client": {"api_key": ...}}}`.
        Mot ham chi quet tang dau se bo sot dung cho quan trong nhat.
    """
    # TODO
    pass


# ===========================================================================
#  1.4 - Kiem tra san sang
# ===========================================================================
def kiem_tra_san_sang(cau_hinh: CauHinh) -> dict:
    """Kiem tra ung dung da san sang nhan traffic chua.

    Tra ve dict co dung cac khoa:
        san_sang  bool          tat ca kiem tra deu qua
        chi_tiet  dict[str, bool]  ket qua tung muc kiem tra
        canh_bao  list[str]     cac van de KHONG chan khoi dong

    Cac muc trong `chi_tiet` (dung ten nay):
        co_api_key       api_key khong rong
        key_dung_dang    api_key bat dau bang "sk-ant-"
        model_hop_le     model thuoc danh sach MODEL_HOP_LE
        ngan_sach_duong  ngan_sach_usd > 0

    Canh bao (them chuoi mo ta vao `canh_bao`, KHONG lam san_sang thanh False):
        - moi_truong == "prod" va ngan_sach_usd > 100
        - moi_truong == "dev" va ghi_log_prompt bat

    ⚠️ PHAN BIET "KHONG SAN SANG" VOI "CANH BAO" LA MUC DICH CHINH CUA BAI NAY.
        Khong san sang -> he thong dieu phoi KHONG gui traffic toi.
        Canh bao       -> van chay, nhung co nguoi can nhin.

        Tron hai thu nay lai la cach tao ra mot he thong hoac la qua nhay
        (khong bao gio len duoc vi mot canh bao vun vat), hoac la qua diec
        (chay voi cau hinh sai vi moi thu deu chi la "canh bao").
    """
    # TODO
    pass


MODEL_HOP_LE = ("claude-haiku-4-5", "claude-sonnet-5", "claude-opus-5")
