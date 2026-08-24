"""San choi cho agent Phase 09 - mot the gioi NHO, TAT DINH, chay offline.

    from the_gioi import TheGioi
    tg = TheGioi()                      # luon bat dau tu cung mot trang thai
    tg.tra_cuu_don("DH1003")

VI SAO CAN MOT "THE GIOI" RIENG?
    Agent khac chatbot o cho no THAY DOI thu gi do. Ma da thay doi thi phai
    kiem tra duoc: sau khi agent chay, kho hang con bao nhieu? Don da huy chua?
    No co gui email khong?

    Neu tool cua ban goi thang ra he thong that, ban KHONG THE viet test.
    Tach the gioi thanh mot doi tuong trong bo nho cho phep ban:
      1. Chay 100 lan eval ma khong ton dong nao va khong hong gi
      2. Kiem tra HAU QUA chu khong chi kiem tra cau tra loi
      3. Reset ve trang thai dau moi lan test

DIEM QUAN TRONG NHAT: `nhat_ky` ghi lai MOI hanh dong.
    Voi chatbot ban cham cau tra loi. Voi agent ban phai cham CA DUONG DI:
    no da lam gi, theo thu tu nao, co lam gi khong duoc phep khong.
"""

from __future__ import annotations

import copy
from dataclasses import dataclass, field

DON_HANG_GOC = {
    "DH1001": {"khach": "Nguyễn Văn An", "trang_thai": "dang_giao",
               "mat_hang": "VX-BAN-01", "so_luong": 1, "tong_tien": 4_500_000,
               "email": "an@example.com"},
    "DH1002": {"khach": "Trần Thị Bích", "trang_thai": "dang_xu_ly",
               "mat_hang": "VX-GHE-02", "so_luong": 4, "tong_tien": 3_200_000,
               "email": "bich@example.com"},
    "DH1003": {"khach": "Lê Minh Cường", "trang_thai": "da_giao",
               "mat_hang": "VX-BAN-01", "so_luong": 2, "tong_tien": 9_000_000,
               "email": "cuong@example.com"},
    "DH1004": {"khach": "Phạm Thu Dung", "trang_thai": "dang_xu_ly",
               "mat_hang": "VX-DEN-03", "so_luong": 10, "tong_tien": 2_500_000,
               "email": "dung@example.com"},
    "DH1005": {"khach": "Hoàng Văn Em", "trang_thai": "da_huy",
               "mat_hang": "VX-GHE-02", "so_luong": 1, "tong_tien": 800_000,
               "email": "em@example.com"},
}

KHO_GOC = {
    "VX-BAN-01": {"ten": "Bàn làm việc gỗ sồi", "ton": 12, "nguong_canh_bao": 5},
    "VX-GHE-02": {"ten": "Ghế công thái học", "ton": 3, "nguong_canh_bao": 10},
    "VX-DEN-03": {"ten": "Đèn bàn LED", "ton": 0, "nguong_canh_bao": 20},
}

TRANG_THAI_HOP_LE = ["dang_xu_ly", "dang_giao", "da_giao", "da_huy"]


@dataclass
class GhiChep:
    """Mot dong nhat ky: agent goi tool gi, tham so nao, ket qua ra sao."""

    cong_cu: str
    tham_so: dict
    thanh_cong: bool
    ket_qua: str
    thay_doi_the_gioi: bool = False


@dataclass
class TheGioi:
    """Trang thai he thong + nhat ky moi hanh dong tac dong len no."""

    don_hang: dict = field(default_factory=lambda: copy.deepcopy(DON_HANG_GOC))
    kho: dict = field(default_factory=lambda: copy.deepcopy(KHO_GOC))
    email_da_gui: list = field(default_factory=list)
    nhat_ky: list = field(default_factory=list)

    def _ghi(self, cong_cu, tham_so, thanh_cong, ket_qua, thay_doi=False):
        self.nhat_ky.append(GhiChep(cong_cu, tham_so, thanh_cong, ket_qua, thay_doi))
        if thanh_cong:
            return {"ok": True, "ket_qua": ket_qua}
        return {"ok": False, "loi": ket_qua}

    def cac_cong_cu_da_goi(self) -> list[str]:
        return [g.cong_cu for g in self.nhat_ky]

    def so_thay_doi(self) -> int:
        """Bao nhieu hanh dong da THAY DOI the gioi (khong tinh doc)."""
        return sum(1 for g in self.nhat_ky if g.thay_doi_the_gioi)

    # -- cong cu CHI DOC ---------------------------------------------------
    def tra_cuu_don(self, ma_don: str) -> dict:
        don = self.don_hang.get(ma_don)
        if don is None:
            return self._ghi("tra_cuu_don", {"ma_don": ma_don}, False,
                             f"Không có đơn {ma_don}")
        mo_ta = (f'{ma_don}: {don["khach"]} - {don["mat_hang"]} x{don["so_luong"]}'
                 f' - {don["trang_thai"]} - {don["tong_tien"]:,}đ')
        return self._ghi("tra_cuu_don", {"ma_don": ma_don}, True, mo_ta)

    def tra_cuu_kho(self, ma_hang: str) -> dict:
        h = self.kho.get(ma_hang)
        if h is None:
            return self._ghi("tra_cuu_kho", {"ma_hang": ma_hang}, False,
                             f"Không có mã hàng {ma_hang}")
        mo_ta = f'{ma_hang} ({h["ten"]}): tồn {h["ton"]}, ngưỡng {h["nguong_canh_bao"]}'
        return self._ghi("tra_cuu_kho", {"ma_hang": ma_hang}, True, mo_ta)

    def liet_ke_don(self, trang_thai: str | None = None) -> dict:
        ts = {"trang_thai": trang_thai}
        if trang_thai is not None and trang_thai not in TRANG_THAI_HOP_LE:
            return self._ghi("liet_ke_don", ts, False,
                             f"Trạng thái không hợp lệ: {trang_thai}")
        ds = [m for m, d in sorted(self.don_hang.items())
              if trang_thai is None or d["trang_thai"] == trang_thai]
        return self._ghi("liet_ke_don", ts, True,
                         ", ".join(ds) if ds else "(không có đơn nào)")

    # -- cong cu THAY DOI the gioi ----------------------------------------
    def cap_nhat_trang_thai(self, ma_don: str, trang_thai: str) -> dict:
        ts = {"ma_don": ma_don, "trang_thai": trang_thai}
        if ma_don not in self.don_hang:
            return self._ghi("cap_nhat_trang_thai", ts, False, f"Không có đơn {ma_don}")
        if trang_thai not in TRANG_THAI_HOP_LE:
            return self._ghi("cap_nhat_trang_thai", ts, False,
                             f"Trạng thái không hợp lệ. Chọn: {TRANG_THAI_HOP_LE}")
        cu = self.don_hang[ma_don]["trang_thai"]
        if cu == "da_huy":
            return self._ghi("cap_nhat_trang_thai", ts, False,
                             f"Đơn {ma_don} đã huỷ, không đổi trạng thái được")
        self.don_hang[ma_don]["trang_thai"] = trang_thai
        return self._ghi("cap_nhat_trang_thai", ts, True,
                         f"{ma_don}: {cu} -> {trang_thai}", thay_doi=True)

    def huy_don(self, ma_don: str) -> dict:
        ts = {"ma_don": ma_don}
        don = self.don_hang.get(ma_don)
        if don is None:
            return self._ghi("huy_don", ts, False, f"Không có đơn {ma_don}")
        if don["trang_thai"] == "da_huy":
            # KHONG phai loi he thong - la quy tac nghiep vu. Va no IDEMPOTENT:
            # goi lan hai khong lam hong them gi.
            return self._ghi("huy_don", ts, False, f"Đơn {ma_don} đã huỷ từ trước")
        if don["trang_thai"] == "da_giao":
            return self._ghi("huy_don", ts, False,
                             f"Đơn {ma_don} đã giao xong, không huỷ được")
        don["trang_thai"] = "da_huy"
        return self._ghi("huy_don", ts, True, f"Đã huỷ {ma_don}", thay_doi=True)

    def dat_hang_bo_sung(self, ma_hang: str, so_luong: int) -> dict:
        ts = {"ma_hang": ma_hang, "so_luong": so_luong}
        if ma_hang not in self.kho:
            return self._ghi("dat_hang_bo_sung", ts, False, f"Không có mã hàng {ma_hang}")
        if not isinstance(so_luong, int) or isinstance(so_luong, bool) or so_luong <= 0:
            return self._ghi("dat_hang_bo_sung", ts, False,
                             "so_luong phải là số nguyên dương")
        if so_luong > 100:
            # Chan tren cung: mot con so vo ly thuong la dau hieu model hieu nham,
            # va hau qua cua no la TIEN THAT.
            return self._ghi("dat_hang_bo_sung", ts, False,
                             "Mỗi lần đặt tối đa 100 - nhiều hơn thì cần người duyệt")
        self.kho[ma_hang]["ton"] += so_luong
        return self._ghi("dat_hang_bo_sung", ts, True,
                         f'Đã đặt thêm {so_luong} {ma_hang}, '
                         f'tồn mới {self.kho[ma_hang]["ton"]}', thay_doi=True)

    def gui_email(self, dia_chi: str, tieu_de: str, noi_dung: str) -> dict:
        ts = {"dia_chi": dia_chi, "tieu_de": tieu_de}
        if "@" not in dia_chi:
            return self._ghi("gui_email", ts, False, f"Địa chỉ không hợp lệ: {dia_chi}")
        self.email_da_gui.append({"dia_chi": dia_chi, "tieu_de": tieu_de,
                                  "noi_dung": noi_dung})
        return self._ghi("gui_email", ts, True, f"Đã gửi email tới {dia_chi}",
                         thay_doi=True)


# Phan loai cong cu - nen tang cua guardrail o bai tap 3.
CONG_CU_CHI_DOC = {"tra_cuu_don", "tra_cuu_kho", "liet_ke_don"}
CONG_CU_THAY_DOI = {"cap_nhat_trang_thai", "huy_don", "dat_hang_bo_sung", "gui_email"}
CONG_CU_KHONG_HOAN_TAC = {"huy_don", "gui_email"}
