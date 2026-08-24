"""LOI GIAI bai tap 2 - Bien code thanh API (Tuan 22)."""

from __future__ import annotations

import json
import sys
from collections.abc import Callable
from pathlib import Path

from fastapi import FastAPI
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

sys.path.insert(0, str(Path(__file__).parent))
from ex01_cau_hinh_bao_mat import kiem_tra_san_sang  # noqa: E402

BAN_DO_LOI = {
    "BadRequestError":       (400, "yeu_cau_khong_hop_le", "Yêu cầu không hợp lệ"),
    "AuthenticationError":   (500, "loi_cau_hinh", "Lỗi cấu hình máy chủ"),
    "PermissionDeniedError": (500, "loi_cau_hinh", "Lỗi cấu hình máy chủ"),
    "NotFoundError":         (500, "loi_cau_hinh", "Lỗi cấu hình máy chủ"),
    "RateLimitError":        (429, "qua_tai", "Hệ thống đang quá tải, vui lòng thử lại sau"),
    "APIConnectionError":    (503, "khong_ket_noi_duoc", "Không kết nối được dịch vụ, thử lại sau"),
    "APITimeoutError":       (504, "qua_han", "Yêu cầu mất quá nhiều thời gian"),
    "ValueError":            (400, "yeu_cau_khong_hop_le", "Yêu cầu không hợp lệ"),
}

MAC_DINH_LOI = (500, "loi_he_thong", "Đã có lỗi xảy ra, vui lòng thử lại")


# ===========================================================================
#  2.1 - Anh xa loi sang HTTP
# ===========================================================================
def ma_loi_http(loi: Exception) -> tuple[int, str, str]:
    return BAN_DO_LOI.get(type(loi).__name__, MAC_DINH_LOI)
    # VI SAO TRA CUU THEO TEN LOP CHU KHONG PHAI isinstance?
    #   Vi ham nay khong duoc import `anthropic`. Neu dung isinstance thi module
    #   nay phu thuoc vao SDK - va bo test cua ban cung vay, ke ca khi test
    #   khong he goi API. Tra cuu theo ten giu cho lop web doc lap voi lop goi
    #   model, va do la mot ranh gioi dang giu.
    #
    #   Danh doi: mot lop con cua RateLimitError se khong khop. Voi ban do loi
    #   phang nhu the nay thi danh doi do chap nhan duoc.


# ===========================================================================
#  2.2 - Kiem tra dau vao
# ===========================================================================
def kiem_tra_cau_hoi(cau_hoi, max_ky_tu: int = 2000) -> dict:
    if not isinstance(cau_hoi, str):
        return {"ok": False, "loi": "cau_hoi phải là chuỗi"}
    sach = cau_hoi.strip()
    if not sach:
        return {"ok": False, "loi": "cau_hoi không được rỗng"}
    if len(sach) > max_ky_tu:
        return {"ok": False,
                "loi": f"cau_hoi dài {len(sach)} ký tự, tối đa {max_ky_tu}"}
    return {"ok": True, "cau_hoi": sach}


# ===========================================================================
#  2.3 - Dinh dang SSE cho streaming
# ===========================================================================
def dinh_dang_sse(su_kien: str, du_lieu: dict) -> str:
    noi_dung = json.dumps(du_lieu, ensure_ascii=False)
    return f"event: {su_kien}\ndata: {noi_dung}\n\n"
    # ensure_ascii=False la BAT BUOC voi tieng Viet. Mac dinh cua json.dumps
    # bien "Xin chào" thanh "Xin ch\u00e0o" - van dung, nhung goi ba lan so
    # byte can thiet cho moi ky tu co dau. Voi streaming thi do la ba lan
    # bang thong cho moi chu.


# ===========================================================================
#  2.4 - Tao ung dung
# ===========================================================================
class YeuCauHoi(BaseModel):
    cau_hoi: str = Field(..., description="Câu hỏi của người dùng")
    max_token: int | None = Field(None, ge=1, le=4096)


def _loi(ma_http: int, ma_loi: str, thong_diep: str) -> JSONResponse:
    return JSONResponse(status_code=ma_http,
                        content={"ma_loi": ma_loi, "thong_diep": thong_diep})


def tao_app(goi_model: Callable[[str, int], str], cau_hinh,
            ham_san_sang: Callable | None = None):
    ham_san_sang = ham_san_sang or kiem_tra_san_sang
    app = FastAPI(title="Dịch vụ hỏi đáp")

    @app.get("/khoe")
    def khoe():
        # LUON 200 neu tien trinh con chay. Khong kiem tra gi khac - vi that
        # bai o day co nghia la "khoi dong lai toi di".
        return {"trang_thai": "song"}

    @app.get("/san_sang")
    def san_sang():
        kq = ham_san_sang(cau_hinh)
        ma = 200 if kq["san_sang"] else 503
        return JSONResponse(status_code=ma, content=kq)

    @app.get("/phien_ban")
    def phien_ban():
        # Chi tra ra thu KHONG bi mat. Endpoint nay hay bi dung de "tien go
        # loi" roi vo tinh lo ca cau hinh - bao gom ca key.
        return {"model": cau_hinh.model, "moi_truong": cau_hinh.moi_truong}

    @app.post("/hoi")
    def hoi(yeu_cau: YeuCauHoi):
        kiem = kiem_tra_cau_hoi(yeu_cau.cau_hoi)
        if not kiem["ok"]:
            return _loi(400, "yeu_cau_khong_hop_le", kiem["loi"])

        try:
            tra_loi = goi_model(kiem["cau_hoi"],
                                yeu_cau.max_token or cau_hinh.max_token)
        except Exception as e:  # noqa: BLE001 - bat rong o BIEN la co y
            ma_http, ma_loi, thong_diep = ma_loi_http(e)
            # Cho that: ghi `e` day du vao log o day, kem trace_id.
            # Nhung KHONG dua no vao than tra ve.
            return _loi(ma_http, ma_loi, thong_diep)

        return {"tra_loi": tra_loi, "model": cau_hinh.model}

    return app
    # VI SAO BAT `Exception` RONG O DAY?
    #   Vi day la BIEN ngoai cung cua dich vu. Bat cu exception nao lot ra khoi
    #   day deu bien thanh mot trang loi 500 mac dinh - thuong kem stack trace,
    #   tuc la lo cau truc code va duong dan file ra ngoai.
    #
    #   Bat rong o bien VA anh xa qua ban do loi la dung. Bat rong o giua logic
    #   nghiep vu thi khong - do la noi ban muon loi noi len.
