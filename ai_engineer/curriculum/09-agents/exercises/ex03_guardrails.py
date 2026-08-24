"""BAI TAP 3 - Guardrails va danh gia agent (Tuan 22).

Cham diem:  pytest tests/phase09/test_ex03.py -v
Loi giai:   curriculum/09-agents/solutions/ex03_guardrails.py

⭐⭐ BAI TAP QUAN TRONG NHAT PHASE 09.

Voi chatbot, hau qua toi te nhat la mot cau tra loi sai.
Voi agent, hau qua toi te nhat la mot don hang bi huy nham, mot email gui cho
sai nguoi, hoac 10.000 mon hang duoc dat vi model doc nham mot con so.

Bai nay xay HAI thu ma moi agent chay that deu phai co:
    1. GUARDRAIL - chan hanh dong sai TRUOC khi no xay ra
    2. EVAL DUONG DI - cham ca CACH agent lam, khong chi ket qua cuoi

NGUYEN TAC TRUNG TAM:
    KHONG BAO GIO TIN THAM SO DO MODEL SINH RA.
    Model viet `{"so_luong": 10000}` de dang y het viet `{"so_luong": 10}`.
    Kiem tra o phia BAN, truoc khi cong cu chay.
"""

from __future__ import annotations

import re
from collections.abc import Callable
from dataclasses import dataclass, field

MAU_MA_DON = re.compile(r"^DH\d{4}$")
MAU_MA_HANG = re.compile(r"^VX-[A-Z]+-\d{2}$")


# ===========================================================================
#  3.1 - Kiem tra tham so TRUOC khi chay
# ===========================================================================
def kiem_tra_tham_so(ten: str, tham_so: dict) -> dict:
    """Kiem tra tham so do model sinh ra co hop le khong.

    Tra ve {"ok": True} hoac {"ok": False, "loi": "..."}.

    Quy tac (cong cu khong nam trong danh sach -> mac dinh hop le):
        tra_cuu_don, cap_nhat_trang_thai, huy_don
            - phai co "ma_don", dung dang DH + 4 chu so
        tra_cuu_kho, dat_hang_bo_sung
            - phai co "ma_hang", dung dang VX-CHU-SO (vi du VX-BAN-01)
        dat_hang_bo_sung
            - "so_luong" phai la so nguyen (KHONG phai bool), tu 1 den 100
        gui_email
            - "dia_chi" phai chua "@"
            - "noi_dung" khong duoc rong

    Thong bao loi phai NEU RO ten tham so sai.

    VI SAO KHONG DE CONG CU TU KIEM?
        Vi cong cu that thuong la mot lenh SQL, mot loi goi HTTP hoac mot thao
        tac file - no lam theo dung nhung gi ban dua. Lop kiem tra nay la thu
        duy nhat dung giua model va he thong that.

        Va vi thong bao loi cua ban RO HON: "so_luong phai tu 1 den 100, nhan
        duoc 10000" giup model tu sua o vong sau; "IntegrityError" thi khong.
    """
    # TODO
    pass


# ===========================================================================
#  3.2 - Chinh sach
# ===========================================================================
@dataclass
class ChinhSach:
    """Quy dinh agent duoc lam gi.

    cong_cu_cho_phep : set ten cong cu duoc dung. None = tat ca.
    can_xac_nhan     : set ten cong cu phai hoi nguoi truoc khi chay.
    max_thay_doi     : so hanh dong THAY DOI the gioi toi da cho ca phien.
    """

    cong_cu_cho_phep: set[str] | None = None
    can_xac_nhan: set[str] = field(default_factory=set)
    max_thay_doi: int = 3


CHINH_SACH_CHI_DOC = ChinhSach(
    cong_cu_cho_phep={"tra_cuu_don", "tra_cuu_kho", "liet_ke_don"},
    can_xac_nhan=set(),
    max_thay_doi=0,
)

CHINH_SACH_BINH_THUONG = ChinhSach(
    cong_cu_cho_phep=None,
    can_xac_nhan={"huy_don", "gui_email"},
    max_thay_doi=3,
)

# Cong cu nao THAY DOI the gioi - dung cho ngan sach o muc 3.3
CONG_CU_THAY_DOI = {"cap_nhat_trang_thai", "huy_don", "dat_hang_bo_sung", "gui_email"}


# ===========================================================================
#  3.3 - Bo kiem soat
# ===========================================================================
class BoKiemSoat:
    """Boc quanh so dang ky cong cu, ap dung guardrail truoc khi chay.

        bks = BoKiemSoat(so_dang_ky, chinh_sach, ham_xac_nhan)
        bks.thuc_thi("huy_don", {"ma_don": "DH1002"})

    `ham_xac_nhan(ten, tham_so) -> bool` la noi con nguoi tra loi co/khong.
    Trong test ta truyen ham gia lap; trong that no la cau hoi tren man hinh.

    ham_xac_nhan la None -> coi nhu LUON TU CHOI (mac dinh an toan).
    """

    def __init__(self, so_dang_ky: dict, chinh_sach: ChinhSach,
                 ham_xac_nhan: Callable[[str, dict], bool] | None = None):
        """Luu tham so, va tao hai danh sach RONG:

            self.nhat_ky_chan  list, moi phan tu {"ten": ..., "ly_do": ...}
            self.da_thay_doi   list ten cac cong cu thay doi the gioi DA CHAY

        `ly_do` la mot trong: "quyen" | "tham_so" | "ngan_sach" | "xac_nhan"
        """
        # TODO
        pass

    def thuc_thi(self, ten: str, tham_so: dict) -> dict:
        """Chay cong cu sau khi qua DU BON CUA, theo dung thu tu:

            1. QUYEN     - ten khong nam trong cong_cu_cho_phep
                           -> {"ok": False, "loi": "... không được phép ..."}
            2. THAM SO   - kiem_tra_tham_so that bai -> tra ve luon ket qua do
            3. NGAN SACH - cong cu thay doi the gioi va da dung het max_thay_doi
                           -> {"ok": False, "loi": "... ngân sách ..."}
            4. XAC NHAN  - ten nam trong can_xac_nhan va nguoi TU CHOI
                           -> {"ok": False, "loi": "... từ chối ..."}

        Qua het bon cua thi goi cong cu that. Neu no thanh cong VA la cong cu
        thay doi the gioi thi them ten vao self.da_thay_doi.

        Moi lan bi chan phai them mot muc vao self.nhat_ky_chan.

        ⚠️ THU TU BON CUA NAY KHONG TUY TIEN:
            - Kiem QUYEN truoc THAM SO: khong nen tiet lo dinh dang tham so cua
              mot cong cu ma nguoi goi von khong duoc dung.
            - Kiem NGAN SACH truoc XAC NHAN: hoi nguoi roi moi bao het ngan
              sach la lam phien vo ich - va nguoi dung se hoc cach bam "co"
              cho nhanh, tuc la ban vua pha huy chinh lop bao ve cua minh.
        """
        # TODO
        pass


# ===========================================================================
#  3.4 - Cham duong di cua agent
# ===========================================================================
def cham_duong_di(ket_qua_agent: dict, ky_vong: dict) -> dict:
    """Cham MOT lan chay agent. Tra ve dict co dung cac khoa:

        dung_cong_cu  bool   da goi DU cac cong cu trong ky_vong["phai_goi"]
        khong_cam     bool   KHONG goi cong cu nao trong ky_vong["cam_goi"]
        du_tu_khoa    bool   cau tra loi chua tat ca ky_vong["tu_khoa"]
        hoan_thanh    bool   ly_do_dung == "tra_loi"
        so_buoc       int    so lan goi cong cu
        diem          float  tu 0.0 den 1.0

    CACH TINH DIEM:
        khong_cam == False  ->  diem = 0.0, BAT KE moi thu khac
        nguoc lai:
            0.4 neu dung_cong_cu
            0.3 neu du_tu_khoa
            0.3 neu hoan_thanh

    So khop tu khoa KHONG phan biet hoa thuong.
    `ky_vong` thieu khoa nao thi coi nhu khong doi hoi (danh sach rong).

    ⚠️ VI SAO GOI CONG CU BI CAM LA 0 DIEM TUYET DOI?
        Vi mot agent huy nham don hang roi tra loi rat hay khong phai la
        "duoc 70%". No la mot su co. Diem so phai phan anh dieu do, neu khong
        ban se toi uu cho mot he thong nguy hiem ma khong nhan ra.

    ⚠️ VA VI SAO PHAI CHAM CA DUONG DI, KHONG CHI KET QUA CUOI?
        Vi hai agent cung tra loi "Đã huỷ đơn DH1002" - mot cai da kiem tra
        trang thai don truoc, mot cai huy bua roi bao cao. Nhin ket qua cuoi
        thi chung giong het nhau.
    """
    # TODO
    pass


# ===========================================================================
#  3.5 - Chay bo test agent
# ===========================================================================
def chay_eval_agent(bo_test: list[dict], chay_mot_ca: Callable) -> list[dict]:
    """Chay eval tren ca bo test.

    `chay_mot_ca(ca_test) -> ket_qua_agent` (dict nhu chay_agent tra ve).

    Moi phan tu ket qua la dict co dung cac khoa:
        id, loai, diem, chi_tiet, loi

    `chi_tiet` la dict tu cham_duong_di (dict RONG neu ca do bi loi);
    `loi` la None hoac thong bao loi.

    BAT BUOC: mot ca nem exception -> 0 diem, `loi` co thong bao,
    CAC CA CON LAI VAN CHAY TIEP.

    VI SAO NHAC LAI DIEU NAY LAN THU BA (Phase 07, 08, gio 09)?
        Vi day la loi ban se mac lai. Bo eval chet giua chung o lan chay thu ba
        luc 11 gio dem chinh la luc ban quyet dinh "thoi mai chay lai" - va mai
        thi khong bao gio den.
    """
    # TODO
    pass
