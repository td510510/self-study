"""BAI TAP 1 - Vong lap agent (Tuan 21).

Cham diem:  pytest tests/phase09/test_ex01.py -v
Loi giai:   curriculum/09-agents/solutions/ex01_vong_lap_agent.py

AGENT KHAC CHATBOT O DAU?
    Chatbot: mot cau hoi -> mot cau tra loi.
    Agent:   mot NHIEM VU -> nhieu buoc: nghi, lam, nhin ket qua, nghi tiep...
             va no THAY DOI thu gi do trong the gioi that.

CHAY DUOC MA KHONG CAN API KEY:
    `chay_agent` nhan mot HAM `goi_model` lam tham so. Trong test ta truyen ham
    gia lap tra ve quyet dinh co san; trong that ta truyen ham goi Claude.
    Day van la dependency injection nhu Phase 07 va 08.

QUY UOC QUYET DINH CUA MODEL - mot dict co khoa "loai":
    {"loai": "cong_cu", "ten": "tra_cuu_don", "tham_so": {"ma_don": "DH1001"}}
    {"loai": "tra_loi", "noi_dung": "Đơn DH1001 đang giao."}

    Trong API that, hai truong hop nay ung voi stop_reason == "tool_use" va
    stop_reason == "end_turn". Notebook 01 chi ro cho tuong ung.
"""

from __future__ import annotations

from collections.abc import Callable


# ===========================================================================
#  1.1 - So dang ky cong cu
# ===========================================================================
def dang_ky_cong_cu(the_gioi) -> dict[str, Callable]:
    """Tra ve dict {ten_cong_cu: ham} tu mot doi tuong TheGioi.

    Phai co dung 7 cong cu, ten khop voi ten phuong thuc:
        tra_cuu_don, tra_cuu_kho, liet_ke_don,
        cap_nhat_trang_thai, huy_don, dat_hang_bo_sung, gui_email

    VI SAO DUNG DICT MA KHONG PHAI CHUOI IF/ELIF?
        Vi ban se can duyet qua danh sach cong cu o rat nhieu cho: sinh mo ta
        cho model, kiem tra quyen, ghi nhat ky, dem so lan goi. Mot chuoi if
        khong duyet duoc.
    """
    # TODO
    pass


# ===========================================================================
#  1.2 - Mo ta cong cu cho model
# ===========================================================================
def mo_ta_cong_cu() -> list[dict]:
    """Danh sach schema cong cu, moi phan tu co dung 3 khoa:
        name, description, input_schema

    `input_schema` theo chuan JSON Schema:
        {"type": "object", "properties": {...}, "required": [...]}

    YEU CAU BAT BUOC (test se kiem tra):
        - Du 7 cong cu, ten khop voi dang_ky_cong_cu()
        - MOI description dai hon 40 ky tu
        - Description cua cac cong cu THAY DOI the gioi (cap_nhat_trang_thai,
          huy_don, dat_hang_bo_sung, gui_email) phai noi ro no thay doi du lieu
        - MOI tham so trong properties co description rieng
        - Moi tham so bat buoc deu nam trong properties

    VI SAO description QUAN TRONG HON BAN NGHI?
        No la thu DUY NHAT model dua vao de chon cong cu. Description la prompt
        engineering, khong phai tai lieu cho nguoi doc.

        ❌ "Huỷ đơn hàng"
        ✅ "Huỷ một đơn hàng theo mã. CHỈ dùng khi người dùng nói rõ muốn huỷ.
            Hành động này THAY ĐỔI dữ liệu và không hoàn tác được."
    """
    # TODO
    pass


# ===========================================================================
#  1.3 - Thuc thi mot cong cu
# ===========================================================================
def thuc_thi(ten: str, tham_so: dict, so_dang_ky: dict) -> dict:
    """Goi cong cu `ten` voi `tham_so`. KHONG BAO GIO nem exception ra ngoai.

    Tra ve:
        - Ket qua cua cong cu neu goi duoc
        - {"ok": False, "loi": "..."} neu:
            * cong cu khong ton tai        -> loi co chua ten cong cu
            * tham so sai (TypeError)      -> loi co chua "tham so"
            * cong cu nem exception        -> loi co ten lop exception

    VI SAO KHONG DUOC NEM RA NGOAI?
        Vi model VIET ra tham so, va no se viet sai. Neu chuong trinh sap moi
        lan model go nham ten cong cu thi agent cua ban vo dung. Cach dung la
        gui loi NGUOC lai cho model - no thuong tu sua duoc o vong sau.
    """
    # TODO
    pass


# ===========================================================================
#  1.4 - Vong lap agent
# ===========================================================================
def chay_agent(nhiem_vu: str, goi_model: Callable, so_dang_ky: dict,
               max_vong: int = 6) -> dict:
    """Chay vong lap agent cho mot nhiem vu.

    `goi_model(lich_su)` nhan danh sach cac buoc da qua va tra ve mot QUYET DINH
    (xem quy uoc o dau file).

    `lich_su` la list cac dict. Phan tu dau tien LUON la:
        {"vai": "nhiem_vu", "noi_dung": nhiem_vu}
    Sau moi lan goi cong cu, them HAI phan tu:
        {"vai": "cong_cu", "ten": ..., "tham_so": ...}
        {"vai": "ket_qua", "noi_dung": <ket qua tra ve tu thuc_thi>}

    Tra ve dict co dung cac khoa:
        ket_qua    str   noi dung cau tra loi cuoi cung ("" neu khong co)
        duong_di   list  chinh la `lich_su` day du
        so_vong    int   so lan da goi model
        ly_do_dung str   "tra_loi" | "het_vong" | "loi_model"

    BA QUY TAC BAT BUOC:
        1. max_vong la BAT BUOC. Agent khong co gioi han vong la agent co the
           chay mai mai va dot sach ngan sach cua ban trong mot dem.
        2. `goi_model` nem exception -> dung lai voi ly_do_dung="loi_model",
           KHONG lam sap chuong trinh, va duong_di van giu nguyen phan da chay.
        3. Quyet dinh sai dinh dang (thieu "loai", loai la) -> coi nhu loi model.
    """
    # TODO
    pass


# ===========================================================================
#  1.5 - Doc duong di
# ===========================================================================
def tom_tat_duong_di(ket_qua_agent: dict) -> str:
    """Tom tat duong di thanh chuoi mot dong moi buoc, de doc bang mat.

    Dinh dang:
        1. tra_cuu_don(ma_don='DH1001') -> ok
        2. huy_don(ma_don='DH1001') -> LOI: Đơn DH1001 đã giao xong...
        => Đơn đã giao nên không huỷ được.

    Quy tac:
        - Danh so tu 1, chi tinh cac buoc GOI CONG CU
        - Tham so in theo dang ten='gia tri', ngan cach bang ", "
        - Ket qua thanh cong -> "ok"; that bai -> "LOI: " + thong bao
        - Dong cuoi bat dau bang "=> " la cau tra loi. Khong co cau tra loi
          thi dong cuoi la "=> (không có câu trả lời)"

    VI SAO CAN HAM NAY?
        Vi khi agent lam sai, cau hoi dau tien luon la "no da di duong nao?".
        Doc mot list dict long nhau bang mat la cach nhanh nhat de bo cuoc.
    """
    # TODO
    pass
