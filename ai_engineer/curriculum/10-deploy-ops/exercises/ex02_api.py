"""BAI TAP 2 - Bien code thanh API (Tuan 22).

Cham diem:  pytest tests/phase10/test_ex02.py -v
Loi giai:   curriculum/10-deploy-ops/solutions/ex02_api.py

Can:  pip install -e ".[deploy]"

TU SCRIPT DEN DICH VU - KHAC BIET O DAU?
    Script:  ban chay, ban nhin ket qua, ban sua neu sai.
    Dich vu: nguoi la chay, ban khong nhin, va no phai tu xu ly moi thu ky quac
             ma nguoi ta gui toi.

    Ba thu moi xuat hien khi len dich vu:
      1. Dau vao khong tin duoc  -> validate o BIEN
      2. Loi phai co MA          -> nguoi goi xu ly duoc bang code
      3. He thong dieu phoi hoi  -> health check va readiness

Khong can API key: ham goi model duoc TRUYEN VAO khi tao app.
"""

from __future__ import annotations

import json
from collections.abc import Callable


# ===========================================================================
#  2.1 - Anh xa loi sang HTTP
# ===========================================================================
# Ban do loi: ten lop exception -> (ma HTTP, ma loi, thong diep cho nguoi dung)
BAN_DO_LOI = {
    "BadRequestError":      (400, "yeu_cau_khong_hop_le", "Yêu cầu không hợp lệ"),
    "AuthenticationError":  (500, "loi_cau_hinh", "Lỗi cấu hình máy chủ"),
    "PermissionDeniedError": (500, "loi_cau_hinh", "Lỗi cấu hình máy chủ"),
    "NotFoundError":        (500, "loi_cau_hinh", "Lỗi cấu hình máy chủ"),
    "RateLimitError":       (429, "qua_tai", "Hệ thống đang quá tải, vui lòng thử lại sau"),
    "APIConnectionError":   (503, "khong_ket_noi_duoc", "Không kết nối được dịch vụ, thử lại sau"),
    "APITimeoutError":      (504, "qua_han", "Yêu cầu mất quá nhiều thời gian"),
    "ValueError":           (400, "yeu_cau_khong_hop_le", "Yêu cầu không hợp lệ"),
}

MAC_DINH_LOI = (500, "loi_he_thong", "Đã có lỗi xảy ra, vui lòng thử lại")


def ma_loi_http(loi: Exception) -> tuple[int, str, str]:
    """Anh xa mot exception sang (ma_http, ma_loi, thong_diep).

    Tra ve MAC_DINH_LOI cho exception khong co trong ban do.

    ⚠️ HAI DIEU CO Y TRONG BAN DO TREN, VA CHUNG QUAN TRONG:

    1. Loi XAC THUC cua BAN voi Anthropic tra ve 500, khong phai 401.
       Vi day khong phai loi cua nguoi goi API cua ban - key cua BAN sai.
       Tra 401 la noi doi voi nguoi dung va lam ho di tim nham cho.

    2. Thong diep cho nguoi dung KHONG chua chi tiet ky thuat.
       "Lỗi cấu hình máy chủ" chu khong phai "AuthenticationError: invalid
       x-api-key sk-ant-api03-...". Chi tiet di vao LOG cua ban, khong di ra
       ngoai - vi thong bao loi chi tiet la mot kenh ro ri thong tin.
    """
    # TODO
    pass


# ===========================================================================
#  2.2 - Kiem tra dau vao
# ===========================================================================
def kiem_tra_cau_hoi(cau_hoi, max_ky_tu: int = 2000) -> dict:
    """Kiem tra cau hoi nguoi dung gui len.

    Tra ve {"ok": True, "cau_hoi": <da lam sach>} hoac {"ok": False, "loi": "..."}.

    Quy tac:
        - Khong phai chuoi        -> loi
        - Rong hoac chi khoang trang -> loi
        - Dai hon max_ky_tu       -> loi, thong bao NEU RO ca do dai nhan duoc
          va gioi han
        - Hop le -> tra ve cau hoi da `strip()`

    VI SAO PHAI GIOI HAN DO DAI O BIEN?
        Vi khong gioi han thi mot request 500.000 ky tu se di thang vao API va
        ban tra tien cho no. Do la mot cach rat re de ai do lam can vi ban -
        khong can ky nang gi, chi can gui vai request lon.

        Gioi han o BIEN (truoc khi cham toi bat cu thu gi tra tien) la nguyen
        tac chung: cai gi tu choi duoc som thi tu choi som.
    """
    # TODO
    pass


# ===========================================================================
#  2.3 - Dinh dang SSE cho streaming
# ===========================================================================
def dinh_dang_sse(su_kien: str, du_lieu: dict) -> str:
    """Dinh dang mot su kien Server-Sent Events.

    Dinh dang chuan:
        event: <ten>\ndata: <json>\n\n

    Vi du:
        dinh_dang_sse("chu", {"text": "Xin"})
        -> 'event: chu\ndata: {"text": "Xin"}\n\n'

    Quy tac:
        - JSON dung `ensure_ascii=False` de tieng Viet khong bi chuyen thanh day escape
        - Ket thuc bang DUNG hai ky tu xuong dong

    ⚠️ HAI DAU XUONG DONG KHONG PHAI TUY TIEN. No la thu bao cho trinh duyet
    biet mot su kien da ket thuc. Thieu mot cai thi trinh duyet cho mai va
    nguoi dung nhin man hinh trong - mot loi rat kho doan ra khi nhin code.
    """
    # TODO
    pass


# ===========================================================================
#  2.4 - Tao ung dung
# ===========================================================================
def tao_app(goi_model: Callable[[str, int], str], cau_hinh,
            ham_san_sang: Callable | None = None):
    """Tao FastAPI app.

    `goi_model(cau_hoi, max_token) -> str` duoc TRUYEN VAO, khong tao ben trong.
    Trong test ta truyen ham gia lap; trong that ta truyen ham goi Claude.

    `ham_san_sang(cau_hinh) -> dict` mac dinh la `kiem_tra_san_sang` cua bai
    tap 1. Truyen ham khac vao de test /san_sang doc lap voi bai tap 1.

    Bon endpoint:

    GET /khoe          -> 200 {"trang_thai": "song"}
        LUON tra 200 neu tien trinh con chay. KHONG kiem tra gi khac.

    GET /san_sang      -> 200 {"san_sang": True, "chi_tiet": {...}}
                          503 {"san_sang": False, "chi_tiet": {...}} neu chua san sang
        Goi `ham_san_sang(cau_hinh)`; mac dinh la ham cua bai tap 1.

    POST /hoi          body {"cau_hoi": str, "max_token": int | None}
        200 {"tra_loi": str, "model": str}
        400 {"ma_loi": ..., "thong_diep": ...} neu cau hoi khong hop le
        <ma tuong ung>  neu goi_model nem exception

    GET /phien_ban     -> 200 {"model": ..., "moi_truong": ...}
        ⚠️ KHONG duoc chua api_key hay bat ky bi mat nao.

    QUY TAC CHUNG CHO MOI LOI:
        Than tra ve luon co dung hai khoa "ma_loi" va "thong_diep".
        KHONG BAO GIO tra ve traceback hay noi dung exception ra ngoai.

    VI SAO /khoe VA /san_sang LA HAI THU KHAC NHAU?
        /khoe (liveness):  "tien trinh con song khong?" - sai thi KHOI DONG LAI.
        /san_sang (readiness): "nhan traffic duoc chua?" - sai thi NGUNG GUI
                               traffic toi, nhung KHONG khoi dong lai.

        Gop lam mot la mot loi kinh dien: khi dich vu phu thuoc bi gian doan,
        readiness that bai -> he thong dieu phoi tuong tien trinh chet -> khoi
        dong lai TOAN BO instance -> mat luon ca cache va ket noi -> phuc hoi
        cham hon nhieu so voi viec chi cho doi.
    """
    # TODO
    pass
