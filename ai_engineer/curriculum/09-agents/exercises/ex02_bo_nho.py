"""BAI TAP 2 - Bo nho va ngu canh cua agent (Tuan 21).

Cham diem:  pytest tests/phase09/test_ex02.py -v
Loi giai:   curriculum/09-agents/solutions/ex02_bo_nho.py

VAN DE MA MOI AGENT DEU GAP:
    Agent chay 15 buoc. Moi buoc gui LAI toan bo lich su (API la stateless -
    bai hoc Phase 07). Buoc 15 dat gap 15 lan buoc 1, va den mot luc nao do
    ban vuot context window roi chet giua chung.

    Te hon: ket qua cong cu thuong RAT DAI (mot truy van tra ve 200 dong).
    Sau vai buoc, 90% ngu canh la du lieu ma model khong con can nua.

BA CHIEN LUOC, tu re den dat:
    1. RUT GON  - cat bot ket qua cong cu qua dai
    2. CAT BOT  - chi giu N buoc gan nhat
    3. TOM TAT  - goi model tom tat cac buoc cu (ton them mot lan goi API)

Khong can API key: ham tom tat duoc TRUYEN VAO.
"""

from __future__ import annotations

from collections.abc import Callable


# ===========================================================================
#  2.1 - Uoc luong so token
# ===========================================================================
def dem_token_uoc(lich_su: list[dict]) -> int:
    """Uoc luong so token cua lich su: tong so ky tu chia 3, lam tron xuong.

    Dem ky tu cua TAT CA gia tri trong moi buoc, ke ca khoa long nhau
    (tham_so la dict, noi_dung co the la dict).

    Goi y: `str(buoc)` cho ban mot chuoi bao gom moi thu trong dict do.

    ⚠️ DAY CHI LA UOC LUONG. Con so CHINH XAC phai lay tu
    `client.messages.count_tokens()` (Phase 07). Nhung trong vong lap agent,
    goi count_tokens moi buoc lai them mot vong mang - nen mot uoc luong re
    tien de quyet dinh "co can nen khong" la du dung.
    """
    # TODO
    pass


# ===========================================================================
#  2.2 - Rut gon ket qua cong cu
# ===========================================================================
def rut_gon_ket_qua(lich_su: list[dict], max_ky_tu: int = 200) -> list[dict]:
    """Cat bot phan van ban qua dai trong KET QUA cong cu.

    Voi moi buoc co vai == "ket_qua", neu `noi_dung` la dict thi rut gon cac
    gia tri CHUOI dai hon `max_ky_tu`, thay phan thua bang "... (đã rút gọn)".

    Vi du (max_ky_tu=10):
        {"vai": "ket_qua", "noi_dung": {"ok": True, "ket_qua": "a"*50}}
        -> {"vai": "ket_qua", "noi_dung": {"ok": True,
                                           "ket_qua": "aaaaaaaaaa... (đã rút gọn)"}}

    Quy tac:
        - KHONG sua lich su goc - tra ve danh sach MOI
        - Buoc khong phai "ket_qua" giu nguyen
        - Gia tri khong phai chuoi (bool, so) giu nguyen
        - Chuoi ngan hon hoac bang max_ky_tu giu nguyen

    VI SAO RUT GON TRUOC KHI CAT BOT?
        Vi rut gon giu duoc CAU TRUC cua duong di - model van biet no da goi
        cong cu nao, chi la khong con doc duoc 200 dong ket qua. Cat bot thi
        xoa han ca buoc. Luon dung bien phap it mat mat nhat truoc.
    """
    # TODO
    pass


# ===========================================================================
#  2.3 - Cat bot lich su
# ===========================================================================
def cat_lich_su(lich_su: list[dict], giu_cap: int = 3) -> list[dict]:
    """Chi giu nhiem vu + `giu_cap` cap (cong_cu, ket_qua) GAN NHAT.

    Vi du: lich su co 5 cap, giu_cap=2 -> tra ve [nhiem_vu, cap4, cap5]
    (tuc 1 + 2*2 = 5 phan tu).

    Quy tac:
        - Phan tu dau (vai == "nhiem_vu") LUON duoc giu
        - So cap it hon hoac bang giu_cap -> tra ve ban sao nguyen ven
        - giu_cap = 0 -> chi con nhiem vu
        - giu_cap am -> nem ValueError
        - Khong sua lich su goc

    ⚠️ CAI GIA CUA VIEC CAT: agent co the QUEN mat no da lam gi va lam LAI.
    Neu buoc bi cat la mot hanh dong khong hoan tac duoc (huy don, gui email),
    ban vua tao ra kha nang agent lam hai lan. Do la ly do bai tap 3 bat ban
    ghi nhat ky rieng, KHONG dua vao lich su gui cho model.
    """
    # TODO
    pass


# ===========================================================================
#  2.4 - Tom tat cac buoc cu
# ===========================================================================
def tom_tat_cu(lich_su: list[dict], giu_cap: int,
               ham_tom_tat: Callable[[list[dict]], str]) -> list[dict]:
    """Thay cac buoc cu bang MOT khoi tom tat, giu `giu_cap` cap gan nhat.

    Ket qua co dang:
        [nhiem_vu, {"vai": "tom_tat", "noi_dung": <chuoi>}, *cac_cap_giu_lai]

    `ham_tom_tat` nhan danh sach cac buoc BI THAY THE va tra ve chuoi.
    Trong test ta truyen ham gia lap; trong that ta truyen ham goi Claude.

    Quy tac:
        - Khong co buoc nao de tom tat -> tra ve ban sao, KHONG chen khoi rong
        - `ham_tom_tat` nem exception -> quay ve cat_lich_su (mat mat nhieu hon
          nhung agent van chay tiep)
        - Khong sua lich su goc

    VI SAO PHAI CO DUONG LUI KHI TOM TAT HONG?
        Vi tom tat la MOT LAN GOI API nua - no co the rate limit, timeout, hoac
        het quota. Neu ban de agent chet vi khong tom tat duoc, ban vua bien
        mot toi uu chi phi thanh mot diem hong moi.
    """
    # TODO
    pass


# ===========================================================================
#  2.5 - Nen cho vua ngan sach
# ===========================================================================
def nen_de_vua(lich_su: list[dict], ngan_sach_token: int,
               ham_tom_tat: Callable[[list[dict]], str] | None = None) -> tuple:
    """Ap dung LAN LUOT cac chien luoc cho toi khi lich su vua ngan sach.

    Tra ve (lich_su_moi, danh_sach_chien_luoc_da_dung).

    Thu tu ap dung - dung ngay khi da vua:
        1. Khong lam gi        -> ghi nhan []           (neu von da vua)
        2. "rut_gon"           -> rut_gon_ket_qua(..., 200)
        3. "tom_tat"           -> tom_tat_cu(..., giu_cap=2, ham_tom_tat)
                                  (BO QUA buoc nay neu ham_tom_tat la None)
        4. "cat"               -> cat_lich_su(..., giu_cap=2)

    Neu sau tat ca van khong vua, van tra ve ket qua cuoi cung kem day du
    danh sach chien luoc da dung - KHONG nem exception.

    VI SAO KHONG NEM EXCEPTION KHI VAN KHONG VUA?
        Vi mot nhiem vu qua dai thi lua chon dung la de model tu bao "toi
        khong lam duoc" chu khong phai lam sap chuong trinh. Va ban van can
        biet no da thu nhung gi - do la ly do tra ve ca danh sach chien luoc.
    """
    # TODO
    pass


# ===========================================================================
#  2.6 - Phat hien lap
# ===========================================================================
def phat_hien_lap(lich_su: list[dict], nguong: int = 2) -> list[dict]:
    """Tim cac lan goi cong cu LAP LAI Y HET (cung ten VA cung tham so).

    Tra ve list dict {"ten": ..., "tham_so": ..., "so_lan": ...},
    chi gom cac truong hop so_lan >= nguong, sap theo so_lan giam dan;
    bang nhau thi theo thu tu XUAT HIEN LAN DAU trong lich su.

    Vi du: goi tra_cuu_don(DH1001) ba lan, nguong=2
        -> [{"ten": "tra_cuu_don", "tham_so": {"ma_don": "DH1001"}, "so_lan": 3}]

    Quy tac:
        - nguong < 1 -> nem ValueError
        - Cung ten nhung KHAC tham so thi KHONG tinh la lap

    VI SAO DAY LA MOT CANH BAO QUAN TRONG?
        Agent bi ket thuong khong bao loi. No goi mot cong cu, thay ket qua
        khong nhu y, goi lai y het, roi lai... cho toi khi het max_vong. Nhin
        tu ngoai thi giong "agent dang suy nghi ky". Nhin vao hoa don thi
        khong.

        Phat hien duoc thi ban co the: chen mot goi y vao lich su ("bạn đã thử
        cách này rồi"), doi chien luoc, hoac dung som va bao nguoi.
    """
    # TODO
    pass
