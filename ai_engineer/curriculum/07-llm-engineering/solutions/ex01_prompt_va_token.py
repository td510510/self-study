"""LOI GIAI - Bai tap 1, Phase 07."""

from __future__ import annotations

BANG_GIA = {
    "claude-haiku-4-5": {"vao": 1.00, "ra": 5.00, "ngu_canh": 200_000},
    "claude-sonnet-5": {"vao": 3.00, "ra": 15.00, "ngu_canh": 1_000_000},
    "claude-opus-5": {"vao": 5.00, "ra": 25.00, "ngu_canh": 1_000_000},
}

VAI_TRO_HOP_LE = {"user", "assistant", "system"}


# ===========================================================================
def tao_messages(lich_su: list[dict], tin_nhan_moi: str) -> list[dict]:
    return [*lich_su, {"role": "user", "content": tin_nhan_moi}]


# [*lich_su, phan_tu_moi] TAO LIST MOI, khong sua list goc.
#   Tuong duong lich_su + [phan_tu_moi], hoac lich_su.copy() roi append.
#   Day la ham THUAN KHIET - thoi quen ban da xay tu Phase 01.
#
# VI SAO KHONG SUA TRUC TIEP lich_su?
#   Trong ung dung that, lich_su thuong thuoc ve mot phien nguoi dung.
#   Ham vo tinh sua no se gay bug rat kho tim khi co nhieu phien chay
#   song song. Tra ve list moi thi ai goi cung kiem soat duoc.
#
# NHAC LAI: API LA STATELESS.
#   Claude KHONG nho gi ca. Moi lan goi phai gui lai TOAN BO lich su.
#   Ba he qua:
#     1. Chi phi tang theo BINH PHUONG so luot (luot N gui lai N-1 luot)
#     2. Co gioi han - vuot cua so ngu canh thi loi
#     3. Ban kiem soat bo nho - muon model "quen" thi cat bot messages


def kiem_tra_messages(messages: list[dict]) -> list[str]:
    loi = []

    if not messages:
        return ["Danh sach rong"]

    if messages[0].get("role") != "user":
        loi.append("Tin nhan dau phai la user")

    for i, m in enumerate(messages):
        vai_tro = m.get("role")
        if vai_tro not in VAI_TRO_HOP_LE:
            loi.append(f"Vai tro khong hop le: {vai_tro}")

        noi_dung = m.get("content")
        if isinstance(noi_dung, str) and not noi_dung.strip():
            loi.append(f"Noi dung rong o vi tri {i}")

    return loi


# VI SAO KIEM TRA O PHIA MINH TRUOC KHI GOI API?
#
#   1. Loi 400 tu API thuong chi noi "invalid request" chung chung -
#      khong chi ro tin nhan nao sai.
#   2. Moi lan goi API sai VAN TON THOI GIAN (va doi khi ton tien).
#   3. Kiem tra o phia minh chay trong mili giay va bao chinh xac cho sai.
#
#   Day la nguyen tac "fail fast" ban da hoc o Phase 01: phat hien sai SOM
#   va bao RO, thay vi de loi lan xuong tan cuoi.
#
# VI SAO KIEM TRA isinstance(noi_dung, str)?
#   content co the la CHUOI hoac LIST cac khoi (khi gui anh, tool_result...).
#   .strip() tren list se nem AttributeError. Kiem tra kieu truoc la an toan.
#
# QUY TAC CUA API:
#   - Tin nhan dau tien phai la "user"
#   - Hai tin nhan cung vai tro lien nhau duoc API GOP lai thanh mot luot
#     (khong phai loi, nhung thuong la dau hieu logic cua ban co van de)
#   - "system" giua hoi thoai chi duoc mot so model moi ho tro


# ===========================================================================
def trich_van_ban(cac_khoi: list) -> str:
    return "".join(
        khoi.text for khoi in cac_khoi if getattr(khoi, "type", None) == "text"
    )


# DAY LA LOI PHO BIEN NHAT CUA NGUOI MOI DUNG CLAUDE API:
#
#       response.content[0].text        # <- SAI
#
#   `content` la mot DANH SACH cac khoi, moi khoi co mot `type`:
#       text        - van ban thuong
#       thinking    - suy luan (khi bat extended thinking)
#       tool_use    - model muon goi tool
#
#   Neu model tra ve khoi `thinking` truoc, `content[0].text` nem
#   AttributeError. Neu no tra ve nhieu khoi text, ban chi lay duoc khoi dau.
#
#   Code dung phai LOC theo type va NOI cac khoi text lai.
#
# VI SAO getattr(khoi, "type", None) THAY VI khoi.type?
#   An toan hon khi gap object khong co thuoc tinh `type` (vi du khi ban
#   test bang dict hoac mock). Trong code that voi SDK thi khoi.type luon co,
#   nhung viet phong thu khong ton gi.
#
# MEO THUC TE - viet mot ham tien ich dung o moi noi:
#       def van_ban(response) -> str:
#           return "".join(b.text for b in response.content if b.type == "text")
#   Roi khong bao gio dung .content[0] nua.


def chan_doan_stop_reason(stop_reason: str) -> str:
    bang = {
        "end_turn": "Binh thuong",
        "max_tokens": "Bi cat giua chung - tang max_tokens",
        "stop_sequence": "Gap chuoi dung",
        "tool_use": "Model muon goi tool - thuc thi roi goi tiep",
        "refusal": "Model tu choi vi ly do an toan",
    }
    return bang.get(stop_reason, f"Khong ro: {stop_reason}")


# stop_reason LA THU BAN PHAI KIEM TRA MA HAU HET NGUOI MOI BO QUA.
#
#   Tinh huong that hay gap nhat:
#       Ban yeu cau model tra JSON. Dat max_tokens=512. JSON dai 600 token.
#       -> Model bi CAT giua chung -> JSON khong dong ngoac -> parse loi.
#
#       Ban di debug prompt hang gio, nghi model "khong hieu yeu cau".
#       Thuc te chi can tang max_tokens.
#
#   Mot dong kiem tra tiet kiem ca buoi:
#       if response.stop_reason == "max_tokens":
#           raise ValueError("Dau ra bi cat - tang max_tokens")
#
# "refusal" - model tu choi vi ly do an toan.
#   Khi do response con co `stop_details` voi `category` va `explanation`.
#   LUU Y: stop_details CHI duoc dien khi stop_reason == "refusal",
#   con lai no la None - phai kiem tra truoc khi doc.
#
# "tool_use" - ban se dung o Tuan 18. Vong lap
#       while response.stop_reason == "tool_use": ...
#   chinh la mot AI Agent.


# ===========================================================================
def uoc_tinh_chi_phi(token_vao: int, token_ra: int, model: str) -> float:
    if model not in BANG_GIA:
        raise ValueError(
            f"Khong biet model {model!r}. Cac model ho tro: {sorted(BANG_GIA)}"
        )

    gia = BANG_GIA[model]
    return token_vao / 1e6 * gia["vao"] + token_ra / 1e6 * gia["ra"]


def chi_phi_hoi_thoai(cac_luot: list[tuple[int, int]], model: str) -> dict:
    tong_vao = sum(v for v, _ in cac_luot)
    tong_ra = sum(r for _, r in cac_luot)

    return {
        "tong_chi_phi": uoc_tinh_chi_phi(tong_vao, tong_ra, model),
        "tong_token_vao": tong_vao,
        "tong_token_ra": tong_ra,
        "so_luot": len(cac_luot),
    }


# BA DIEU VE CHI PHI PHAI THUOC:
#
# 1. TOKEN RA DAT GAP 5 LAN TOKEN VAO (voi moi model hien tai).
#    Haiku 4.5: $1 vao / $5 ra.
#    -> Rut ngan CAU TRA LOI tiet kiem nhieu hon rut ngan PROMPT.
#    -> "Tra loi trong 2 cau" khong chi de doc hon, no con re hon.
#
# 2. TIENG VIET TON TOKEN HON TIENG ANH (ban da hoc vi sao o Phase 06).
#    Cung mot y, prompt tieng Viet ton nhieu token hon -> dat hon.
#    Mot chien luoc thuc te: viet SYSTEM PROMPT bang tieng Anh
#    (no on dinh, dung nhieu lan), de noi dung nguoi dung bang tieng Viet.
#
# 3. HOI THOAI DAI TANG CHI PHI THEO BINH PHUONG.
#    Vi API stateless, luot thu N gui lai N-1 luot truoc:
#        luot 1: 100 token vao
#        luot 2: 250 token vao
#        luot 10: co the la 3000 token vao
#    Tong chi phi ~ O(N^2). Do la ly do phai CAT LICH SU (ham 1.5).
#
# VI SAO NEM ValueError THAY VI TRA VE 0?
#   Go sai ten model la loi rat de mac - dac biet vi cac ID cu tung co
#   hau to ngay thang. Neu ham am tham tra ve 0, ban se tuong tinh nang
#   nay mien phi. Bao loi ngay va NOI RO model nao hop le.
#
# THONG BAO LOI TOT liet ke luon cac lua chon hop le - nguoi doc khong
# phai di tim tai lieu.
#
# DOC CHI PHI THAT TU RESPONSE:
#       u = response.usage
#       u.input_tokens, u.output_tokens
#       u.cache_creation_input_tokens, u.cache_read_input_tokens
#   Ham nay dung de UOC TINH TRUOC; `usage` cho con so THAT SAU khi goi.


# ===========================================================================
def chon_model(
    can_chat_luong_cao: bool, so_token_ngu_canh: int, uu_tien_re: bool = True
) -> str:
    if so_token_ngu_canh > 200_000:
        return "claude-opus-5"
    if can_chat_luong_cao:
        return "claude-opus-5"
    if uu_tien_re:
        return "claude-haiku-4-5"
    return "claude-sonnet-5"


def vua_ngu_canh(so_token: int, model: str) -> bool:
    if model not in BANG_GIA:
        raise ValueError(f"Khong biet model {model!r}")
    return so_token <= BANG_GIA[model]["ngu_canh"]


# THU TU KIEM TRA QUAN TRONG:
#   Rang buoc CUNG (cua so ngu canh) phai xet TRUOC so thich (gia re).
#   Chon Haiku cho 500K token la loi 400 - re den may cung vo nghia.
#
# CUA SO NGU CANH:
#   Haiku 4.5   : 200K token
#   Sonnet 5    : 1M
#   Opus 5      : 1M
#
# LUU Y VE CHIEN LUOC CHON MODEL TRONG THUC TE:
#
#   Khoa hoc nay dat uu_tien_re=True MAC DINH vi ban dang hoc va can chay
#   hang tram lan thu nghiem voi ngan sach nho.
#
#   Trong CONG VIEC THAT, quy trinh nguoc lai:
#       1. Bat dau bang model MANH NHAT (Opus 5) de biet tran chat luong
#       2. Xay bo EVAL de do chat luong (Tuan 19)
#       3. Thu ha xuong Sonnet/Haiku, do lai bang eval
#       4. Chi ha neu chat luong van dat yeu cau
#
#   Chon model re TRUOC roi ngac nhien vi chat luong la thu tu sai.
#   Ban se khong biet van de nam o model hay o prompt cua minh.
#
# MOT LUU Y VE THAM SO KHAC NHAU GIUA CAC THE HE MODEL:
#   temperature : dung duoc tren Haiku 4.5, KHONG dung duoc tren
#                 Opus 5 / Sonnet 5 (loi 400)
#   effort      : dung duoc tren Opus 5 / Sonnet 5, KHONG dung duoc
#                 tren Haiku 4.5 (loi)
#   Doi model thi phai doi ca tham so - day la loi rat hay gap khi nang cap.


# ===========================================================================
def cat_lich_su(messages: list[dict], so_luot_giu: int) -> list[dict]:
    ket_qua: list[dict] = []
    so_cap = 0

    for m in reversed(messages):
        if m.get("role") == "assistant":
            if so_cap >= so_luot_giu:
                break
            so_cap += 1
        ket_qua.append(m)

    ket_qua.reverse()

    # Dam bao van bat dau bang "user"
    while ket_qua and ket_qua[0].get("role") != "user":
        ket_qua.pop(0)

    return ket_qua


# DUYET NGUOC TU CUOI LEN - vi ta muon giu cac luot GAN NHAT.
#
#   Voi [u1, a1, u2, a2, u3] va so_luot_giu=1:
#       u3 -> them (khong phai assistant)
#       a2 -> so_cap=0 < 1, tang len 1, them
#       u2 -> them
#       a1 -> so_cap=1 >= 1 -> DUNG
#   Dao nguoc: [u2, a2, u3]   OK
#
# VI SAO PHAI DAM BAO BAT DAU BANG "user"?
#   Vi API TU CHOI danh sach bat dau bang "assistant".
#   Vong while o cuoi la luoi an toan cho cac truong hop bien
#   (vi du lich su bat dau bang assistant do loi o dau do).
#
# CAT LICH SU LA CHIEN LUOC DON GIAN NHAT. Cac cach khac:
#
#   1. TOM TAT (summarization)
#      Nho model tom tat cac luot cu thanh mot doan ngan, thay vao dau
#      lich su. Giu duoc thong tin, ton mot lan goi API.
#
#   2. COMPACTION (server-side)
#      API tu tom tat khi ngu canh sap day. Ban phai gui lai
#      response.content (khong chi text) de giu khoi compaction.
#
#   3. RAG TREN LICH SU
#      Luu moi luot vao vector store, chi lay ra cac luot LIEN QUAN
#      den cau hoi hien tai. Day la Phase 08.
#
#   Cat don gian phu hop khi hoi thoai khong can nho xa. Ho tro khach hang
#   thi thuong du; tro ly ca nhan lau dai thi khong.
#
# CANH BAO: cat lich su cung PHA PROMPT CACHE (Tuan 18), vi tien to
#   thay doi. Neu ban dung caching, hay cat theo KHOI lon (vi du bo han
#   20 luot cu mot lan) thay vi cat tung luot moi request.


# ===========================================================================
if __name__ == "__main__":

    class _Khoi:
        def __init__(self, type_, text=None):
            self.type = type_
            if text is not None:
                self.text = text

    # --- 1.1
    assert tao_messages([], "Xin chao") == [{"role": "user", "content": "Xin chao"}]
    goc = [{"role": "user", "content": "A"}]
    tao_messages(goc, "B")
    assert len(goc) == 1, "Ham da sua lich su goc!"

    assert kiem_tra_messages([]) == ["Danh sach rong"]
    assert kiem_tra_messages([{"role": "assistant", "content": "A"}]) == [
        "Tin nhan dau phai la user"
    ]
    assert kiem_tra_messages([{"role": "user", "content": "  "}]) == [
        "Noi dung rong o vi tri 0"
    ]
    assert kiem_tra_messages([{"role": "user", "content": "A"}]) == []

    # --- 1.2
    assert trich_van_ban([_Khoi("text", "Xin "), _Khoi("text", "chao")]) == "Xin chao"
    assert trich_van_ban([_Khoi("thinking"), _Khoi("text", "A")]) == "A"
    assert trich_van_ban([]) == ""

    assert chan_doan_stop_reason("end_turn") == "Binh thuong"
    assert "max_tokens" in chan_doan_stop_reason("max_tokens")
    assert "Khong ro" in chan_doan_stop_reason("gi_do_la")

    # --- 1.3
    assert uoc_tinh_chi_phi(1_000_000, 1_000_000, "claude-haiku-4-5") == 6.0
    assert abs(uoc_tinh_chi_phi(1000, 500, "claude-haiku-4-5") - 0.0035) < 1e-9
    assert uoc_tinh_chi_phi(0, 0, "claude-opus-5") == 0.0
    try:
        uoc_tinh_chi_phi(1, 1, "claude-haiku-4-5-20251001")
        raise AssertionError("Le ra phai nem ValueError")
    except ValueError as e:
        assert "claude-haiku-4-5-20251001" in str(e)

    ht = chi_phi_hoi_thoai([(1000, 200), (1500, 300)], "claude-haiku-4-5")
    assert ht["tong_token_vao"] == 2500 and ht["so_luot"] == 2
    assert abs(ht["tong_chi_phi"] - 0.005) < 1e-9

    # --- 1.4
    assert chon_model(False, 1000) == "claude-haiku-4-5"
    assert chon_model(True, 1000) == "claude-opus-5"
    assert chon_model(False, 500_000) == "claude-opus-5"
    assert chon_model(False, 1000, uu_tien_re=False) == "claude-sonnet-5"

    assert vua_ngu_canh(150_000, "claude-haiku-4-5") is True
    assert vua_ngu_canh(300_000, "claude-haiku-4-5") is False
    assert vua_ngu_canh(300_000, "claude-opus-5") is True

    # --- 1.5
    ls = [
        {"role": "user", "content": "u1"},
        {"role": "assistant", "content": "a1"},
        {"role": "user", "content": "u2"},
        {"role": "assistant", "content": "a2"},
        {"role": "user", "content": "u3"},
    ]
    assert [m["content"] for m in cat_lich_su(ls, 0)] == ["u3"]
    assert [m["content"] for m in cat_lich_su(ls, 1)] == ["u2", "a2", "u3"]
    assert [m["content"] for m in cat_lich_su(ls, 99)] == ["u1", "a1", "u2", "a2", "u3"]
    assert cat_lich_su(ls, 1)[0]["role"] == "user"

    print("Tat ca deu dung.")
