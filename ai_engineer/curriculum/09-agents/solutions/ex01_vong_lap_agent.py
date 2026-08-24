"""LOI GIAI bai tap 1 - Vong lap agent (Tuan 21)."""

from __future__ import annotations

from collections.abc import Callable


# ===========================================================================
#  1.1 - So dang ky cong cu
# ===========================================================================
def dang_ky_cong_cu(the_gioi) -> dict[str, Callable]:
    return {
        "tra_cuu_don": the_gioi.tra_cuu_don,
        "tra_cuu_kho": the_gioi.tra_cuu_kho,
        "liet_ke_don": the_gioi.liet_ke_don,
        "cap_nhat_trang_thai": the_gioi.cap_nhat_trang_thai,
        "huy_don": the_gioi.huy_don,
        "dat_hang_bo_sung": the_gioi.dat_hang_bo_sung,
        "gui_email": the_gioi.gui_email,
    }
    # VI SAO GAN PHUONG THUC DA BOUND (the_gioi.tra_cuu_don) MA KHONG PHAI
    # TheGioi.tra_cuu_don?
    #   Vi ban muon cong cu gan lien voi MOT the gioi cu the. Moi lan test tao
    #   mot the gioi moi va mot so dang ky moi, nen cac test khong the dinh
    #   trang thai cua nhau. Do la ly do ham nay nhan the_gioi lam tham so
    #   thay vi dung mot bien toan cuc.


# ===========================================================================
#  1.2 - Mo ta cong cu cho model
# ===========================================================================
def mo_ta_cong_cu() -> list[dict]:
    return [
        {
            "name": "tra_cuu_don",
            "description": (
                "Tra cứu thông tin một đơn hàng theo mã đơn (dạng DH1001). "
                "Dùng khi cần biết trạng thái, khách hàng, mặt hàng hoặc số tiền "
                "của một đơn cụ thể. Chỉ đọc, không thay đổi gì."
            ),
            "input_schema": {
                "type": "object",
                "properties": {
                    "ma_don": {"type": "string",
                               "description": "Mã đơn hàng, ví dụ DH1001"},
                },
                "required": ["ma_don"],
            },
        },
        {
            "name": "tra_cuu_kho",
            "description": (
                "Xem số lượng tồn kho và ngưỡng cảnh báo của một mặt hàng theo mã "
                "hàng (dạng VX-BAN-01). Dùng trước khi quyết định có cần đặt thêm "
                "hàng không. Chỉ đọc, không thay đổi gì."
            ),
            "input_schema": {
                "type": "object",
                "properties": {
                    "ma_hang": {"type": "string",
                                "description": "Mã mặt hàng, ví dụ VX-BAN-01"},
                },
                "required": ["ma_hang"],
            },
        },
        {
            "name": "liet_ke_don",
            "description": (
                "Liệt kê mã của tất cả đơn hàng, có thể lọc theo trạng thái. "
                "Dùng khi cần nhìn tổng thể thay vì tra từng đơn. Chỉ đọc."
            ),
            "input_schema": {
                "type": "object",
                "properties": {
                    "trang_thai": {
                        "type": "string",
                        "enum": ["dang_xu_ly", "dang_giao", "da_giao", "da_huy"],
                        "description": "Lọc theo trạng thái. Bỏ trống để lấy tất cả",
                    },
                },
                "required": [],
            },
        },
        {
            "name": "cap_nhat_trang_thai",
            "description": (
                "THAY ĐỔI DỮ LIỆU: đặt trạng thái mới cho một đơn hàng. Dùng khi "
                "đơn thực sự chuyển giai đoạn (bắt đầu giao, đã giao xong). "
                "Không dùng để huỷ đơn — dùng huy_don cho việc đó."
            ),
            "input_schema": {
                "type": "object",
                "properties": {
                    "ma_don": {"type": "string", "description": "Mã đơn cần cập nhật"},
                    "trang_thai": {
                        "type": "string",
                        "enum": ["dang_xu_ly", "dang_giao", "da_giao", "da_huy"],
                        "description": "Trạng thái mới của đơn",
                    },
                },
                "required": ["ma_don", "trang_thai"],
            },
        },
        {
            "name": "huy_don",
            "description": (
                "THAY ĐỔI DỮ LIỆU, KHÔNG HOÀN TÁC ĐƯỢC: huỷ một đơn hàng. CHỈ dùng "
                "khi người dùng nói rõ muốn huỷ đơn nào. Không dùng để tra cứu. "
                "Sẽ thất bại nếu đơn đã giao xong hoặc đã huỷ từ trước."
            ),
            "input_schema": {
                "type": "object",
                "properties": {
                    "ma_don": {"type": "string", "description": "Mã đơn cần huỷ"},
                },
                "required": ["ma_don"],
            },
        },
        {
            "name": "dat_hang_bo_sung",
            "description": (
                "THAY ĐỔI DỮ LIỆU và TỐN TIỀN THẬT: đặt thêm hàng vào kho. Dùng khi "
                "tồn kho dưới ngưỡng cảnh báo. Mỗi lần tối đa 100 đơn vị; nhiều hơn "
                "thì phải xin người duyệt."
            ),
            "input_schema": {
                "type": "object",
                "properties": {
                    "ma_hang": {"type": "string", "description": "Mã mặt hàng cần đặt"},
                    "so_luong": {"type": "integer",
                                 "description": "Số lượng đặt thêm, từ 1 đến 100"},
                },
                "required": ["ma_hang", "so_luong"],
            },
        },
        {
            "name": "gui_email",
            "description": (
                "THAY ĐỔI THẾ GIỚI BÊN NGOÀI, KHÔNG THU HỒI ĐƯỢC: gửi email cho "
                "khách hàng. Chỉ dùng khi được yêu cầu rõ ràng và đã biết chắc nội "
                "dung. Email đã gửi thì không lấy lại được."
            ),
            "input_schema": {
                "type": "object",
                "properties": {
                    "dia_chi": {"type": "string",
                                "description": "Địa chỉ email người nhận"},
                    "tieu_de": {"type": "string", "description": "Tiêu đề email"},
                    "noi_dung": {"type": "string", "description": "Nội dung email"},
                },
                "required": ["dia_chi", "tieu_de", "noi_dung"],
            },
        },
    ]
    # BA DIEU CO Y TRONG CAC MO TA TREN:
    #   1. Cong cu thay doi du lieu deu MO DAU bang "THAY DOI DU LIEU" viet hoa.
    #      Model doc description nhu doc prompt - nhan manh co tac dung that.
    #   2. Moi mo ta noi "DUNG KHI..." chu khong chi noi "no lam gi". Model can
    #      biet luc nao CHON no, do moi la thong tin no thieu.
    #   3. huy_don noi ro "khong dung de tra cuu" - vi loi pho bien nhat cua
    #      agent la chon cong cu thay doi du lieu khi chi can doc.


# ===========================================================================
#  1.3 - Thuc thi mot cong cu
# ===========================================================================
def thuc_thi(ten: str, tham_so: dict, so_dang_ky: dict) -> dict:
    ham = so_dang_ky.get(ten)
    if ham is None:
        # Model go nham ten cong cu la chuyen BINH THUONG. Bao cho no biet
        # co nhung cong cu nao thay vi de chuong trinh sap.
        return {"ok": False,
                "loi": f"Không có công cụ tên {ten!r}. "
                       f"Các công cụ có: {', '.join(sorted(so_dang_ky))}"}

    try:
        return ham(**(tham_so or {}))
    except TypeError as e:
        # Sai/thieu tham so. Tach rieng khoi Exception chung vi day la loi
        # model hay mac nhat, va thong bao cua no can chi ra dung cho sai.
        return {"ok": False, "loi": f"Sai tham so cho {ten}: {e}"}
    except Exception as e:  # noqa: BLE001 - bat rong o day LA CO Y
        return {"ok": False, "loi": f"{type(e).__name__}: {e}"}


# ===========================================================================
#  1.4 - Vong lap agent
# ===========================================================================
def chay_agent(nhiem_vu: str, goi_model, so_dang_ky: dict,
               max_vong: int = 6) -> dict:
    lich_su = [{"vai": "nhiem_vu", "noi_dung": nhiem_vu}]
    so_vong = 0

    for _ in range(max_vong):
        so_vong += 1
        try:
            quyet_dinh = goi_model(lich_su)
        except Exception as e:  # noqa: BLE001
            # Mat mang, het quota, rate limit... Agent dung lai co trat tu va
            # GIU NGUYEN duong di - phan da lam khong bien mat.
            return {"ket_qua": "", "duong_di": lich_su, "so_vong": so_vong,
                    "ly_do_dung": "loi_model"}

        if not isinstance(quyet_dinh, dict) or "loai" not in quyet_dinh:
            return {"ket_qua": "", "duong_di": lich_su, "so_vong": so_vong,
                    "ly_do_dung": "loi_model"}

        if quyet_dinh["loai"] == "tra_loi":
            return {"ket_qua": quyet_dinh.get("noi_dung", ""),
                    "duong_di": lich_su, "so_vong": so_vong,
                    "ly_do_dung": "tra_loi"}

        if quyet_dinh["loai"] != "cong_cu":
            return {"ket_qua": "", "duong_di": lich_su, "so_vong": so_vong,
                    "ly_do_dung": "loi_model"}

        ten = quyet_dinh.get("ten", "")
        tham_so = quyet_dinh.get("tham_so") or {}
        lich_su.append({"vai": "cong_cu", "ten": ten, "tham_so": tham_so})
        lich_su.append({"vai": "ket_qua",
                        "noi_dung": thuc_thi(ten, tham_so, so_dang_ky)})

    return {"ket_qua": "", "duong_di": lich_su, "so_vong": so_vong,
            "ly_do_dung": "het_vong"}
    # VI SAO max_vong LA BAT BUOC CHU KHONG PHAI "NEN CO"?
    #   Mot agent khong co gioi han vong co the ket vao vong lap: goi cong cu,
    #   thay loi, thu lai, thay loi... Voi API that, moi vong la mot lan tinh
    #   tien. Mot dem chay khong nguoi trong la du de dot het ngan sach thang.
    #   Ket thuc bang "het_vong" khong phai that bai - no la mot GIOI HAN AN
    #   TOAN da hoat dong dung.


# ===========================================================================
#  1.5 - Doc duong di
# ===========================================================================
def tom_tat_duong_di(ket_qua_agent: dict) -> str:
    dong = []
    so_thu_tu = 0

    for buoc in ket_qua_agent.get("duong_di", []):
        if buoc["vai"] != "cong_cu":
            continue
        so_thu_tu += 1
        ts = ", ".join(f"{k}={v!r}" for k, v in buoc["tham_so"].items())
        dong.append(f"{so_thu_tu}. {buoc['ten']}({ts})")

    # Ghep ket qua vao dung buoc goi cong cu tuong ung
    cac_ket_qua = [b["noi_dung"] for b in ket_qua_agent.get("duong_di", [])
                   if b["vai"] == "ket_qua"]
    for i, kq in enumerate(cac_ket_qua):
        if i < len(dong):
            if isinstance(kq, dict) and kq.get("ok"):
                dong[i] += " -> ok"
            else:
                thong_bao = kq.get("loi", "?") if isinstance(kq, dict) else str(kq)
                dong[i] += f" -> LOI: {thong_bao}"

    tra_loi = ket_qua_agent.get("ket_qua") or "(không có câu trả lời)"
    dong.append(f"=> {tra_loi}")
    return "\n".join(dong)
    # VI SAO KHONG IN LUON CA KET QUA DAY DU CUA TUNG CONG CU?
    #   Vi muc dich cua ham nay la NHIN THAY DUONG DI trong mot man hinh. Chi
    #   tiet day du nam trong `duong_di` va ban doc no khi da khoanh vung duoc
    #   buoc nao sai. Mot ban tom tat dai bang du lieu goc thi khong tom tat gi.
