"""LOI GIAI bai tap 3 - Quan sat va kiem soat chi phi (Tuan 22)."""

from __future__ import annotations

import math
import time
from collections.abc import Callable


# ===========================================================================
#  3.1 - Do do tre bang phan vi
# ===========================================================================
def phan_vi(cac_gia_tri: list[float], p: float) -> float:
    if not 0 <= p <= 100:
        raise ValueError(f"p phải trong [0, 100], nhận được {p}")
    if not cac_gia_tri:
        return 0.0

    da_sap = sorted(cac_gia_tri)          # sorted() tra ve BAN MOI
    thu_hang = max(1, math.ceil(p / 100 * len(da_sap)))
    return float(da_sap[thu_hang - 1])
    # VI SAO max(1, ...)?
    #   Voi p=0, ceil(0) = 0, va da_sap[-1] tra ve phan tu CUOI - tuc la p0
    #   bang p100. Loi lech mot don vi nay khong nem exception, khong lam sap
    #   gi ca; no chi lam bao cao cua ban sai o dung cot ma khong ai kiem tra.


class BoDem:
    def __init__(self):
        self.do_tre: list[float] = []
        self.ket_qua: list[bool] = []
        self.chi_phi: list[float] = []

    def ghi(self, do_tre_ms: float, thanh_cong: bool, chi_phi_usd: float = 0.0):
        self.do_tre.append(float(do_tre_ms))
        self.ket_qua.append(bool(thanh_cong))
        self.chi_phi.append(float(chi_phi_usd))

    def tom_tat(self) -> dict:
        n = len(self.ket_qua)
        so_loi = sum(1 for ok in self.ket_qua if not ok)
        return {
            "so_request": n,
            "so_loi": so_loi,
            "ty_le_loi": (so_loi / n) if n else 0.0,
            "p50_ms": phan_vi(self.do_tre, 50),
            "p95_ms": phan_vi(self.do_tre, 95),
            "tong_chi_phi": sum(self.chi_phi),
            "chi_phi_tb": (sum(self.chi_phi) / n) if n else 0.0,
        }
    # BO DEM NAY GIU MOI GIA TRI TRONG BO NHO. Voi mot dich vu that chay lien
    # tuc thi do la ro ri bo nho - sau mot tuan ban co vai trieu phan tu.
    #   Cach lam that: dung histogram co san khoang (Prometheus), hoac cua so
    #   truot chi giu N gia tri gan nhat.
    # Giu ban don gian o day la CO Y, nhung phai biet gioi han cua no.


# ===========================================================================
#  3.2 - Kiem soat ngan sach
# ===========================================================================
class SoChiPhi:
    def __init__(self, ngan_sach_usd: float, nguong_canh_bao: float = 0.8):
        if ngan_sach_usd <= 0:
            raise ValueError(f"ngan_sach_usd phải lớn hơn 0, nhận được {ngan_sach_usd}")
        if not 0 < nguong_canh_bao <= 1:
            raise ValueError(
                f"nguong_canh_bao phải trong (0, 1], nhận được {nguong_canh_bao}")
        self.ngan_sach = float(ngan_sach_usd)
        self.nguong_canh_bao = float(nguong_canh_bao)
        self.da_dung = 0.0

    def cho_phep(self, chi_phi_du_kien: float) -> bool:
        return (self.da_dung + chi_phi_du_kien) <= self.ngan_sach

    def ghi_nhan(self, chi_phi_usd: float) -> None:
        if chi_phi_usd < 0:
            raise ValueError(f"chi_phi_usd không được âm, nhận được {chi_phi_usd}")
        self.da_dung += float(chi_phi_usd)

    def con_lai(self) -> float:
        return max(0.0, self.ngan_sach - self.da_dung)
        # max(0.0, ...) vi chi phi THAT co the vuot uoc luong - va mot con so
        # am o day se hien len dashboard thanh "con lai -0.03 USD", thu khien
        # nguoi doc mat 5 phut de hieu.

    def trang_thai(self) -> dict:
        ty_le = self.da_dung / self.ngan_sach
        return {
            "da_dung": self.da_dung,
            "con_lai": self.con_lai(),
            "ty_le": ty_le,
            "can_canh_bao": ty_le >= self.nguong_canh_bao,
        }


# ===========================================================================
#  3.3 - Gioi han tan suat (token bucket)
# ===========================================================================
class GioiHanTanSuat:
    def __init__(self, suc_chua: int, toc_do_nap: float,
                 ham_gio: Callable[[], float] | None = None):
        if suc_chua <= 0:
            raise ValueError(f"suc_chua phải lớn hơn 0, nhận được {suc_chua}")
        if toc_do_nap <= 0:
            raise ValueError(f"toc_do_nap phải lớn hơn 0, nhận được {toc_do_nap}")

        self.suc_chua = float(suc_chua)
        self.toc_do_nap = float(toc_do_nap)
        self.ham_gio = ham_gio or time.monotonic
        self.token = float(suc_chua)          # bat dau voi xo DAY
        self.lan_cuoi = self.ham_gio()

    def _nap(self) -> None:
        bay_gio = self.ham_gio()
        troi_qua = max(0.0, bay_gio - self.lan_cuoi)
        self.token = min(self.suc_chua, self.token + troi_qua * self.toc_do_nap)
        self.lan_cuoi = bay_gio
        # max(0.0, ...) chan truong hop dong ho nhay lui. Voi time.monotonic thi
        # khong xay ra, nhung ham_gio la tham so - va nguoi dung co the truyen
        # vao mot dong ho khac.

    def cho_phep(self, so_token: int = 1) -> bool:
        self._nap()
        if self.token >= so_token:
            self.token -= so_token
            return True
        return False
        # KHONG tru gi khi tu choi. Tru "mot phan" se khien mot ke goi lien tuc
        # giu xo o muc 0 vinh vien, va nhung nguoi dung binh thuong khong bao
        # gio con token de dung.


# ===========================================================================
#  3.4 - Ngat mach (circuit breaker)
# ===========================================================================
class NgatMach:
    def __init__(self, nguong_loi: int = 3, thoi_gian_cho: float = 30.0,
                 ham_gio: Callable[[], float] | None = None):
        if nguong_loi <= 0:
            raise ValueError(f"nguong_loi phải lớn hơn 0, nhận được {nguong_loi}")
        if thoi_gian_cho <= 0:
            raise ValueError(f"thoi_gian_cho phải lớn hơn 0, nhận được {thoi_gian_cho}")

        self.nguong_loi = nguong_loi
        self.thoi_gian_cho = float(thoi_gian_cho)
        self.ham_gio = ham_gio or time.monotonic
        self.so_loi = 0
        self._mo_luc: float | None = None

    @property
    def trang_thai(self) -> str:
        if self._mo_luc is None:
            return "dong"
        if self.ham_gio() - self._mo_luc >= self.thoi_gian_cho:
            return "thu_lai"
        return "mo"
        # TRANG THAI DUOC TINH, KHONG DUOC LUU.
        #   Neu luu "thu_lai" vao mot bien, ban phai co ai do goi de cap nhat
        #   no dung luc - mot bo dem nen, mot vong lap kiem tra. Tinh lai moi
        #   lan doc thi khong bao gio lech, va khong can thanh phan nao khac.

    def cho_goi(self) -> bool:
        return self.trang_thai != "mo"

    def ghi_thanh_cong(self) -> None:
        self.so_loi = 0
        self._mo_luc = None

    def ghi_that_bai(self) -> None:
        if self.trang_thai == "thu_lai":
            # Mot lan thu that bai la du. Dem lai thoi gian cho tu bay gio.
            self._mo_luc = self.ham_gio()
            return

        self.so_loi += 1
        if self.so_loi >= self.nguong_loi:
            self._mo_luc = self.ham_gio()


# ===========================================================================
#  3.5 - Trace
# ===========================================================================
def tao_ban_ghi_trace(trace_id: str, su_kien: str, /, **truong) -> dict:
    if not str(trace_id).strip():
        raise ValueError("trace_id không được rỗng")
    if not str(su_kien).strip():
        raise ValueError("su_kien không được rỗng")

    # Dau `/` o tren lam hai tham so dau POSITIONAL-ONLY. Khong co no,
    # trace_id="gia" bi Python chan bang TypeError va nhanh kiem tra duoi day
    # khong bao gio chay - mot quy tac chet ma khong ai nhan ra.
    trung = {"trace_id", "su_kien"} & set(truong)
    if trung:
        # Cho ghi de se tao ra nhung ban ghi co trace_id khac voi request that,
        # va ban se ngoi noi cac dong log lai voi nhau ma khong hieu vi sao
        # chung khong khop.
        raise ValueError(f"Không được ghi đè trường: {sorted(trung)}")

    return {"trace_id": trace_id, "su_kien": su_kien, **truong}
