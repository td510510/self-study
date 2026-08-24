"""BAI TAP 1 - Dung payload, dem token, uoc tinh chi phi (Tuan 16).

Cham diem:  pytest tests/phase07/test_ex01.py -v
Loi giai:   curriculum/07-llm-engineering/solutions/ex01_prompt_va_token.py

BAI TAP NAY CHAY DUOC MA KHONG CAN API KEY.
No kiem tra LOGIC ban viet: dung payload dung cau truc, doc ket qua dung cach,
tinh chi phi dung. Goi API that la viec cua notebook va project.

Khong can import anthropic.
"""

from __future__ import annotations

# ===========================================================================
#  BANG GIA CHINH THUC (USD / 1 trieu token)
#  Go CHINH XAC ten model - KHONG them hau to ngay thang.
# ===========================================================================
BANG_GIA = {
    "claude-haiku-4-5": {"vao": 1.00, "ra": 5.00, "ngu_canh": 200_000},
    "claude-sonnet-5": {"vao": 3.00, "ra": 15.00, "ngu_canh": 1_000_000},
    "claude-opus-5": {"vao": 5.00, "ra": 25.00, "ngu_canh": 1_000_000},
}


# ===========================================================================
#  1.1 - Dung danh sach messages
# ===========================================================================
def tao_messages(lich_su: list[dict], tin_nhan_moi: str) -> list[dict]:
    """Them tin nhan moi cua nguoi dung vao lich su, tra ve list MOI.

    KHONG duoc sua lich_su goc.

    Vi du:
        tao_messages([], "Xin chao")
        ->  [{"role": "user", "content": "Xin chao"}]

        tao_messages([{"role": "user", "content": "A"},
                      {"role": "assistant", "content": "B"}], "C")
        ->  [{"role": "user", "content": "A"},
             {"role": "assistant", "content": "B"},
             {"role": "user", "content": "C"}]

    NHO: API la STATELESS. Moi lan goi phai gui lai TOAN BO lich su.
    """
    # TODO
    pass


def kiem_tra_messages(messages: list[dict]) -> list[str]:
    """Kiem tra danh sach messages co hop le khong.

    Tra ve list cac loi tim duoc (list RONG nghia la hop le).
    Cac loi can phat hien, theo DUNG thu tu kiem tra nay:

        1. "Danh sach rong"              - messages rong
        2. "Tin nhan dau phai la user"   - messages[0]["role"] != "user"
        3. "Vai tro khong hop le: <x>"   - role khong phai user/assistant/system
        4. "Noi dung rong o vi tri <i>"  - content la chuoi rong hoac chi khoang trang

    Moi loi chi bao MOT LAN, nhung phai kiem tra HET moi phan tu cho loi 3 va 4.

    Vi du:
        kiem_tra_messages([])
        ->  ["Danh sach rong"]

        kiem_tra_messages([{"role": "assistant", "content": "A"}])
        ->  ["Tin nhan dau phai la user"]

        kiem_tra_messages([{"role": "user", "content": "  "}])
        ->  ["Noi dung rong o vi tri 0"]

    VI SAO CAN HAM NAY?
        Loi 400 tu API thuong chi noi "invalid request" chung chung.
        Kiem tra o phia minh truoc thi debug nhanh hon nhieu, va khong
        ton mot lan goi API vo ich.
    """
    # TODO
    pass


# ===========================================================================
#  1.2 - Doc ket qua tra ve
# ===========================================================================
def trich_van_ban(cac_khoi: list) -> str:
    """Lay TOAN BO van ban tu danh sach khoi noi dung, noi bang chuoi rong.

    Moi khoi la mot object co thuoc tinh `.type`. Chi khoi co type == "text"
    moi co thuoc tinh `.text`.

    Vi du (voi khoi gia lap):
        trich_van_ban([Khoi("text", "Xin "), Khoi("text", "chao")])  ->  "Xin chao"
        trich_van_ban([Khoi("thinking", None), Khoi("text", "A")])   ->  "A"
        trich_van_ban([])                                            ->  ""

    VI SAO KHONG VIET response.content[0].text?
        Vi content la mot DANH SACH khoi, co the chua thinking, tool_use,
        text... Lay [0] se vo ngay khi model tra ve khoi khac o dau tien.
        Day la loi rat pho bien cua nguoi moi.

    Goi y: dung getattr(khoi, "type", None) de an toan.
    """
    # TODO
    pass


def chan_doan_stop_reason(stop_reason: str) -> str:
    """Doi stop_reason thanh loi khuyen hanh dong.

        "end_turn"      ->  "Binh thuong"
        "max_tokens"    ->  "Bi cat giua chung - tang max_tokens"
        "stop_sequence" ->  "Gap chuoi dung"
        "tool_use"      ->  "Model muon goi tool - thuc thi roi goi tiep"
        "refusal"       ->  "Model tu choi vi ly do an toan"
        con lai         ->  "Khong ro: <gia tri>"

    VI SAO PHAI KIEM TRA stop_reason?
        Neu la "max_tokens", cau tra loi bi CAT GIUA CHUNG. Ban da tra tien
        cho mot ket qua hong ma khong biet. Rat nhieu bug "JSON khong parse
        duoc" thuc ra la do bi cat, khong phai do model sai.
    """
    # TODO
    pass


# ===========================================================================
#  1.3 - Chi phi
# ===========================================================================
def uoc_tinh_chi_phi(token_vao: int, token_ra: int, model: str) -> float:
    """Tinh chi phi mot request, don vi USD.

        chi phi = (token_vao / 1e6) * gia_vao  +  (token_ra / 1e6) * gia_ra

    Neu model khong co trong BANG_GIA thi nem ValueError co ten model
    trong thong bao.

    Vi du:
        uoc_tinh_chi_phi(1_000_000, 1_000_000, "claude-haiku-4-5")  ->  6.0
        uoc_tinh_chi_phi(1000, 500, "claude-haiku-4-5")             ->  0.0035
        uoc_tinh_chi_phi(0, 0, "claude-opus-5")                     ->  0.0
    """
    # TODO
    pass


def chi_phi_hoi_thoai(cac_luot: list[tuple[int, int]], model: str) -> dict:
    """Tinh chi phi cua ca cuoc hoi thoai nhieu luot.

    cac_luot la list cac cap (token_vao, token_ra) cua tung luot.

    Tra ve dict co dung 4 khoa:
        "tong_chi_phi"   - tong USD
        "tong_token_vao" - tong token vao
        "tong_token_ra"  - tong token ra
        "so_luot"        - so luot

    Vi du: [(1000, 200), (1500, 300)] voi haiku
        vao 2500 token -> 2500/1e6 * $1  = $0.0025
        ra   500 token ->  500/1e6 * $5  = $0.0025
        -> {"tong_chi_phi": 0.005, "tong_token_vao": 2500,
            "tong_token_ra": 500, "so_luot": 2}

    LUU Y VE CHI PHI HOI THOAI:
        Vi API stateless, luot thu N phai gui lai N-1 luot truoc.
        Nen token_vao TANG DAN qua tung luot, va tong chi phi tang theo
        binh phuong so luot. Hoi thoai dai rat dat.
    """
    # TODO
    pass


# ===========================================================================
#  1.4 - Chon model
# ===========================================================================
def chon_model(
    can_chat_luong_cao: bool, so_token_ngu_canh: int, uu_tien_re: bool = True
) -> str:
    """Chon model phu hop, tra ve TEN MODEL CHINH XAC.

    Quy tac (xet theo DUNG thu tu nay):
        1. so_token_ngu_canh > 200_000  ->  "claude-opus-5"
           (Haiku chi co 200K ngu canh)
        2. can_chat_luong_cao           ->  "claude-opus-5"
        3. uu_tien_re                   ->  "claude-haiku-4-5"
        4. con lai                      ->  "claude-sonnet-5"

    Vi du:
        chon_model(False, 1000)                    ->  "claude-haiku-4-5"
        chon_model(True, 1000)                     ->  "claude-opus-5"
        chon_model(False, 500_000)                 ->  "claude-opus-5"
        chon_model(False, 1000, uu_tien_re=False)  ->  "claude-sonnet-5"
    """
    # TODO
    pass


def vua_ngu_canh(so_token: int, model: str) -> bool:
    """Kiem tra so token co vua cua so ngu canh cua model khong.

    Vi du:
        vua_ngu_canh(150_000, "claude-haiku-4-5")  ->  True
        vua_ngu_canh(300_000, "claude-haiku-4-5")  ->  False
        vua_ngu_canh(300_000, "claude-opus-5")     ->  True

    Model khong co trong bang -> nem ValueError.
    """
    # TODO
    pass


# ===========================================================================
#  1.5 - Cat lich su de tiet kiem chi phi
# ===========================================================================
def cat_lich_su(messages: list[dict], so_luot_giu: int) -> list[dict]:
    """Giu `so_luot_giu` CAP (user, assistant) gan nhat, cong tin nhan
    user le o cuoi (neu co).

    Ket qua PHAI van hop le: bat dau bang "user".

    Vi du voi lich su [u1, a1, u2, a2, u3]:
        cat_lich_su(..., 0)   ->  [u3]                 (khong giu cap nao)
        cat_lich_su(..., 1)   ->  [u2, a2, u3]         (1 cap gan nhat)
        cat_lich_su(..., 2)   ->  [u1, a1, u2, a2, u3] (het)
        cat_lich_su(..., 99)  ->  [u1, a1, u2, a2, u3] (giu nguyen)

    Voi lich su [u1, a1, u2, a2] (khong co user le):
        cat_lich_su(..., 1)   ->  [u2, a2]

    VI SAO CAN CAT LICH SU?
        API stateless nen luot thu N phai gui lai N-1 luot truoc.
        Hoi thoai 50 luot co the ton hang chuc nghin token MOI LAN goi.
        Cat bot la cach don gian nhat de chan chi phi tang theo binh phuong.

    Goi y: duyet NGUOC tu cuoi len, dem so tin nhan "assistant" da gap;
           dung lai khi da du so_luot_giu cap.
    """
    # TODO
    pass


# ===========================================================================
if __name__ == "__main__":
    print("Ket qua cua ban:\n")

    m = tao_messages([], "Xin chao")
    if m is None:
        print("  Chua lam tao_messages.")
        raise SystemExit(0)

    print(f"  tao_messages([], 'Xin chao')  = {m}")
    print(f"  kiem_tra_messages(m)          = {kiem_tra_messages(m)}")
    print(f"  kiem_tra_messages([])         = {kiem_tra_messages([])}")
    print()

    print(f"  1000 token vao + 500 ra, Haiku : ${uoc_tinh_chi_phi(1000, 500, 'claude-haiku-4-5'):.6f}")
    print(f"  1000 token vao + 500 ra, Opus  : ${uoc_tinh_chi_phi(1000, 500, 'claude-opus-5'):.6f}")
    print()

    print("  So sanh chi phi 1 trieu token vao + 1 trieu token ra:")
    for ten in BANG_GIA:
        print(f"    {ten:<20} ${uoc_tinh_chi_phi(1_000_000, 1_000_000, ten):>7.2f}")
    print()

    print(f"  chon_model(can_chat_luong_cao=False, 1000)     = {chon_model(False, 1000)}")
    print(f"  chon_model(can_chat_luong_cao=False, 500_000)  = {chon_model(False, 500_000)}")
