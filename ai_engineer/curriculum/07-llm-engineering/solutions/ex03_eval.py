"""LOI GIAI - Bai tap 3, Phase 07."""

from __future__ import annotations

import json
from collections.abc import Callable


# ===========================================================================
def khop_chinh_xac(du_doan: str, mong_doi: str) -> bool:
    return du_doan.strip().lower() == mong_doi.strip().lower()


def chua_tat_ca(du_doan: str, cac_tu_khoa: list[str]) -> bool:
    thuong = du_doan.lower()
    return all(tk.lower() in thuong for tk in cac_tu_khoa)


def json_hop_le(chuoi: str, cac_khoa_bat_buoc: list[str] | None = None) -> bool:
    try:
        du_lieu = json.loads(chuoi)
    except (json.JSONDecodeError, TypeError):
        return False

    if cac_khoa_bat_buoc is None:
        return True

    if not isinstance(du_lieu, dict):
        return False

    return all(k in du_lieu for k in cac_khoa_bat_buoc)


def cham_theo_truong(du_doan: dict, chuan: dict) -> float:
    if not chuan:
        return 0.0
    so_dung = sum(1 for k, v in chuan.items() if du_doan.get(k) == v)
    return so_dung / len(chuan)


# CHON HAM CHAM THEO LOAI BAI TOAN:
#
#   Phan loai (mot nhan)     -> khop_chinh_xac
#   Trich xuat JSON          -> json_hop_le, roi cham_theo_truong
#   Tom tat / tra loi tu do  -> chua_tat_ca (co du y bat buoc khong?)
#   Chat luong tong the      -> LLM-as-judge (muc 3.4)
#
# VI SAO khop_chinh_xac PHAI .strip().lower()?
#   Model tra "Tich cuc" hay " tich cuc " deu la dung y. Phat model vi
#   mot khoang trang la do lech metric, khong phai do lech chat luong.
#
#   NHUNG can than: neu bai toan CO phan biet hoa/thuong (vi du trich xuat
#   ten rieng), thi .lower() lai che giau loi that. Ham cham phai khop
#   voi dieu ban THAT SU quan tam.
#
# chua_tat_ca VOI DANH SACH RONG -> True.
#   Do la quy uoc cua all() tren tap rong, va no dung: "khong yeu cau gi"
#   thi moi dau ra deu thoa.
#
# json_hop_le LA METRIC CO BAN NHAT CHO TRICH XUAT.
#   Truoc khi hoi "cac truong co dung khong", phai hoi "co parse duoc khong".
#   Trong san pham that, ty le JSON hop le la chi so canh bao som:
#   no tut xuong nghia la prompt hoac model vua thay doi gi do.


# ===========================================================================
def chay_eval(
    bo_test: list[dict],
    goi_model: Callable[[str], str],
    cham: Callable[[str, object], bool | float],
) -> list[dict]:
    ket_qua = []

    for i, case in enumerate(bo_test):
        ten = case.get("ten", f"case_{i}")
        dau_vao = case["dau_vao"]

        try:
            dau_ra = goi_model(dau_vao)
            diem = float(cham(dau_ra, case["mong_doi"]))
            loi = None
        except Exception as e:  # noqa: BLE001
            dau_ra = f"<loi: {type(e).__name__}>"
            diem = 0.0
            loi = f"{type(e).__name__}: {e}"

        ket_qua.append(
            {"ten": ten, "dau_vao": dau_vao, "dau_ra": dau_ra, "diem": diem, "loi": loi}
        )

    return ket_qua


def tom_tat(ket_qua: list[dict]) -> dict:
    if not ket_qua:
        return {
            "so_case": 0, "diem_tb": 0.0, "so_dat": 0, "ty_le_dat": 0.0, "so_loi": 0
        }

    diem = [r["diem"] for r in ket_qua]
    so_dat = sum(1 for d in diem if d >= 1.0)

    return {
        "so_case": len(ket_qua),
        "diem_tb": sum(diem) / len(diem),
        "so_dat": so_dat,
        "ty_le_dat": so_dat / len(ket_qua),
        "so_loi": sum(1 for r in ket_qua if r["loi"] is not None),
    }


# ⭐ HAI QUYET DINH THIET KE QUAN TRONG NHAT TRONG HAM NAY:
#
# 1. NHAN goi_model LAM THAM SO (dependency injection)
#
#    Nho vay:
#      - TEST DUOC ma khong can API key (truyen ham gia lap)
#      - Doi model chi bang cach truyen ham khac
#      - So sanh nhieu prompt: moi prompt la mot ham
#      - Chay lai tu cache: truyen ham doc tu file thay vi goi API
#
#    Neu ham nay tu goi client.messages.create ben trong, no se:
#      - Khong test duoc offline
#      - Khong doi model duoc
#      - Ton tien moi lan chay test
#
#    Ban da dung ky thuat nay o Phase 05 (truyen `augment` vao ham train)
#    va Phase 04 (truyen model vao so_sanh_model). Cung mot nguyen tac.
#
# 2. BAT MOI NGOAI LE, KHONG DE NO THOAT RA
#
#    Bo eval 50 case, case thu 3 gap loi mang -> neu de ngoai le thoat ra,
#    ban mat 47 ket qua con lai va phai chay lai tu dau (ton tien).
#
#    Trong eval, mot case loi la MOT DIEM 0 - khong phai ly do dung
#    toan bo. Nhung PHAI ghi lai loi de phan biet:
#      - "model tra loi sai"     -> van de CHAT LUONG
#      - "goi API that bai"      -> van de HA TANG
#    Hai thu nay can hai cach xu ly hoan toan khac nhau. Neu gop chung
#    thanh "diem 0", ban se di sua prompt trong khi van de la rate limit.
#
#    Do la ly do "so_loi" la mot khoa RIENG trong tom_tat.
#
# VI SAO except Exception O DAY MA KHONG PHAI LOAI CU THE?
#   Day la mot trong so it truong hop bat rong la DUNG: ta khong biet
#   truoc ham goi_model do nguoi dung truyen vao co the nem loi gi.
#   Diem mau chot la ta KHONG NUOT loi - ta GHI LAI day du ca loai lan
#   noi dung vao khoa "loi".
#
# float(cham(...)) DE BOOL VA FLOAT DUNG CHUNG DUOC:
#   float(True) = 1.0, float(False) = 0.0
#   Nho vay ban tron duoc ham cham nhi phan (khop_chinh_xac) voi ham cham
#   lien tuc (cham_theo_truong) trong cung mot bo eval.
#
# "so_dat" DUNG NGUONG >= 1.0:
#   Voi ham cham nhi phan thi day la "so case dung".
#   Voi ham cham lien tuc thi day la "so case HOAN HAO".
#   Ca hai con so - diem_tb va ty_le_dat - deu can bao cao:
#     diem_tb    : chat luong trung binh
#     ty_le_dat  : bao nhieu % dung duoc ngay khong can nguoi sua


# ===========================================================================
def so_sanh_phien_ban(cu: list[dict], moi: list[dict]) -> dict:
    diem_cu = {r["ten"]: r["diem"] for r in cu}
    diem_moi = {r["ten"]: r["diem"] for r in moi}
    chung = sorted(set(diem_cu) & set(diem_moi))

    cai_thien = [t for t in chung if diem_moi[t] > diem_cu[t]]
    thoai_lui = [t for t in chung if diem_moi[t] < diem_cu[t]]

    return {
        "cai_thien": cai_thien,
        "thoai_lui": thoai_lui,
        "khong_doi": len(chung) - len(cai_thien) - len(thoai_lui),
        "diem_tb_cu": sum(diem_cu[t] for t in chung) / len(chung) if chung else 0.0,
        "diem_tb_moi": sum(diem_moi[t] for t in chung) / len(chung) if chung else 0.0,
    }


# ⭐⭐ DAY LA LY DO EVAL TON TAI.
#
#   Tinh huong that, xay ra trong moi du an LLM:
#
#     Ban sua prompt de chua mot case khach hang phan nan.
#     Diem trung binh: 0.80 -> 0.84. Ban bao cao "cai thien 4 diem".
#
#     Ham nay lo ra su that:
#       cai_thien: 5 case
#       thoai_lui: 3 case      <- BA CASE DANG CHAY TOT GIO HONG
#
#     Ba case do co the la ba khach hang lon. Ban se khong bao gio biet
#     neu chi nhin diem trung binh.
#
#   Do la ly do phai chay LAI TOAN BO bo test sau moi lan sua prompt,
#   khong phai chi chay case vua sua.
#
# VI SAO CHI XET CASE CO O CA HAI PHIEN BAN?
#   Neu ban them case moi vao bo test, so sanh diem trung binh giua hai
#   lan chay tro nen VO NGHIA - ban dang so sanh tren hai bo khac nhau.
#   Chi so sanh phan CHUNG moi cong bang.
#
#   Trong thuc te nen ghi lai ca so case moi them, de bao cao ro rang:
#   "diem tren 20 case chung: 0.80 -> 0.84; da them 5 case moi".
#
# 🔗 DAY CHINH LA QUY TRINH train/validation/test CUA PHASE 04:
#     - prompt        = "tham so" cua model
#     - bo eval       = validation set
#     - sua prompt roi do lai = tuning
#
#   Va OVERFITTING LEN BO EVAL la chuyen co that: neu ban sua prompt
#   50 lan dua tren cung 20 case, prompt se hop voi dung 20 case do.
#
#   CACH PHONG (giong het Phase 04):
#     - Giu mot bo HOLDOUT khong bao gio nhin toi cho den khi chot
#     - Them case moi dinh ky tu du lieu that
#     - Canh giac khi diem tang lien tuc ma nguoi dung van phan nan


# ===========================================================================
def tao_prompt_judge(cau_hoi: str, dap_an_chuan: str, cau_tra_loi: str) -> str:
    return f"""Danh gia cau tra loi theo thang 1-5.

<cau_hoi>
{cau_hoi}
</cau_hoi>

<dap_an_chuan>
{dap_an_chuan}
</dap_an_chuan>

<cau_tra_loi>
{cau_tra_loi}
</cau_tra_loi>

Tieu chi:
5 = dung hoan toan va day du
4 = dung, thieu chi tiet nho
3 = dung nhung thieu y quan trong
2 = dung mot phan, co thong tin sai
1 = sai hoan toan hoac lac de

Chi tra ve JSON: {{"diem": <1-5>, "ly_do": "<mot cau>"}}"""


def parse_ket_qua_judge(dau_ra: str) -> tuple[float, str]:
    LOI = (0.0, "Khong parse duoc ket qua judge")

    bat_dau = dau_ra.find("{")
    ket_thuc = dau_ra.rfind("}")
    if bat_dau == -1 or ket_thuc <= bat_dau:
        return LOI

    try:
        du_lieu = json.loads(dau_ra[bat_dau : ket_thuc + 1])
    except json.JSONDecodeError:
        return LOI

    if not isinstance(du_lieu, dict):
        return LOI

    diem = du_lieu.get("diem")
    if not isinstance(diem, (int, float)) or isinstance(diem, bool):
        return LOI
    if not 1 <= diem <= 5:
        return LOI

    return (diem - 1) / 4, str(du_lieu.get("ly_do", ""))


# LLM-AS-JUDGE: dung mot model de CHAM DIEM dau ra cua model khac.
#
#   Can khi dau ra la van ban TU DO - khong so khop chinh xac duoc,
#   va tu khoa cung khong du (cau tra loi co the dung ma dung tu khac).
#
# BON QUY TAC TRONG PROMPT JUDGE - moi cai deu co ly do:
#
#   1. TIEU CHI CU THE cho tung muc diem
#      Hoi "cau tra loi nay tot khong?" cho ra diem tuy hung, khong
#      lap lai duoc. Mo ta ro tung muc thi diem on dinh hon nhieu.
#
#   2. YEU CAU LY DO KEM DIEM
#      Hai loi ich: ban debug duoc khi judge cham la, VA viec phai viet
#      ly do buoc model suy luan truoc khi cham (chinh la chain-of-thought).
#
#   3. THANG DIEM HEP (1-5)
#      Thang 1-100 cho ra diem nhieu vo nghia - model khong phan biet
#      duoc 73 voi 76. Thang 1-5 hoac 1-3 on dinh hon han.
#
#   4. EP DINH DANG JSON
#      De parse duoc tu dong. Khong co no thi ban phai doc tay tung ket qua.
#
# ⚠️ BA THIEN KIEN CUA LLM-AS-JUDGE - phai biet truoc khi tin no:
#
#   1. THIEN VI CAU TRA LOI DAI HON
#      Judge co xu huong cham cao cho cau dai, ngay ca khi cau ngan
#      dung va du y hon.
#
#   2. THIEN VI DAU RA CUA CHINH MODEL DO
#      Dung Opus cham dau ra cua Opus se cao hon binh thuong. Neu so sanh
#      hai model, can nhac dung mot model thu ba lam judge.
#
#   3. THIEN VI VI TRI (khi so sanh hai cau tra loi)
#      Judge hay chon cau xuat hien TRUOC. Cach chua: chay hai lan voi
#      thu tu dao nguoc roi lay trung binh.
#
# ⭐ QUY TAC QUAN TRONG NHAT: KIEM CHUNG CHINH JUDGE.
#   Tu cham tay 20 case, so voi diem cua judge. Neu judge khong khop voi
#   danh gia cua ban, thi TOAN BO bo eval dang do sai thu - va ban se
#   toi uu prompt theo mot huong vo nghia.
#
#   Day chinh la tinh than "kiem tra baseline" cua Phase 04, ap dung cho
#   chinh cong cu do luong.
#
# VI SAO CHUAN HOA VE 0-1?
#   De moi ham cham trong bo eval tra ve cung thang do -> tron duoc
#   nhieu loai metric trong mot bao cao, va diem trung binh co y nghia.
#
# isinstance(diem, bool) BI LOAI RIENG:
#   Trong Python, bool la con cua int, nen isinstance(True, int) la True.
#   Neu judge tra ve {"diem": true}, ta khong muon coi do la diem 1.


# ===========================================================================
def tao_baseline_hang_so(gia_tri: str) -> Callable[[str], str]:
    def baseline(_dau_vao: str) -> str:
        return gia_tri

    return baseline


# ⭐ BASELINE LA BUOC MA 90% NGUOI MOI BO QUA - o Phase 04 va o day.
#
#   Tinh huong that:
#     Bo test phan loai cam xuc co 70% nhan la "tich cuc".
#     Model LUON doan "tich cuc" -> 70%.
#     Prompt tinh vi cua ban -> 75%.
#
#     Ban bao cao "do chinh xac 75%". Nghe tot.
#     Su that: ban chi hon mot ham mot dong 5 diem.
#
#   Day chinh la DummyClassifier cua Phase 04, chi khac doi tuong.
#   Nguyen tac khong doi: TRUOC KHI khoe con so, tra loi duoc
#   "so voi cai gi?"
#
# CAC BASELINE NEN CO CHO BAI TOAN LLM:
#
#   1. Hang so       - luon tra ve nhan pho bien nhat
#   2. Prompt MOT DONG - "Phan loai cam xuc: tich cuc/tieu cuc/trung tinh"
#      khong vi du, khong giai thich. Neu prompt 500 tu cua ban khong hon
#      duoc no dang ke, hay dung prompt ngan (re hon, nhanh hon, de bao tri hon).
#   3. Model RE NHAT  - Haiku dat bao nhieu? Neu gan bang Opus thi
#      khong co ly do dung Opus.
#   4. Khong dung LLM - regex hoac tu khoa dat bao nhieu? Voi nhieu bai
#      toan don gian, cau tra loi lam nguoi ta bat ngo.
#
#   Baseline thu 4 quan trong hon nguoi ta tuong. Neu mot regex 10 dong
#   dat 92% con LLM dat 94% nhung ton tien va co do tre, thi lua chon
#   dung co the la regex.
#
# TRA VE MOT HAM (closure) - dung duoc ngay voi chay_eval:
#       kq_baseline = chay_eval(bo_test, tao_baseline_hang_so("tich cuc"), khop_chinh_xac)
#   Ky thuat "ham tra ve ham" ban da gap o Phase 01.


# ===========================================================================
if __name__ == "__main__":
    # --- 3.1
    assert khop_chinh_xac("Tich cuc", "tich cuc") is True
    assert khop_chinh_xac("  tich cuc  ", "tich cuc") is True
    assert khop_chinh_xac("tieu cuc", "tich cuc") is False

    assert chua_tat_ca("Gia 100k, giao trong 2 ngay", ["100k", "2 ngay"]) is True
    assert chua_tat_ca("Gia 100k", ["100k", "2 ngay"]) is False
    assert chua_tat_ca("bat ky", []) is True

    assert json_hop_le('{"a": 1}') is True
    assert json_hop_le("khong phai json") is False
    assert json_hop_le('{"a": 1}', ["a"]) is True
    assert json_hop_le('{"a": 1}', ["a", "b"]) is False
    assert json_hop_le("[1, 2]", ["a"]) is False

    assert cham_theo_truong({"a": 1, "b": 2}, {"a": 1, "b": 3}) == 0.5
    assert cham_theo_truong({"a": 1}, {"a": 1}) == 1.0
    assert cham_theo_truong({}, {"a": 1}) == 0.0

    # --- 3.2
    bo_test = [
        {"ten": "vui", "dau_vao": "San pham tuyet voi!", "mong_doi": "tich cuc"},
        {"ten": "buon", "dau_vao": "Hang loi, that vong", "mong_doi": "tieu cuc"},
        {"ten": "trung", "dau_vao": "Cung binh thuong", "mong_doi": "trung tinh"},
    ]

    def model_gia(dau_vao: str) -> str:
        if "tuyet" in dau_vao:
            return "tich cuc"
        if "that vong" in dau_vao:
            return "tieu cuc"
        return "trung tinh"

    kq = chay_eval(bo_test, model_gia, khop_chinh_xac)
    assert len(kq) == 3
    assert set(kq[0]) == {"ten", "dau_vao", "dau_ra", "diem", "loi"}
    assert all(r["diem"] == 1.0 for r in kq)

    def model_loi(_):
        raise ConnectionError("mat mang")

    kq_loi = chay_eval(bo_test, model_loi, khop_chinh_xac)
    assert len(kq_loi) == 3, "Mot case loi khong duoc lam dung ca bo eval"
    assert all(r["diem"] == 0.0 for r in kq_loi)
    assert all("ConnectionError" in r["loi"] for r in kq_loi)

    t = tom_tat(kq)
    assert t["so_case"] == 3 and t["diem_tb"] == 1.0 and t["so_loi"] == 0
    assert tom_tat(kq_loi)["so_loi"] == 3
    assert tom_tat([])["so_case"] == 0

    # --- 3.3
    cu = [{"ten": "a", "diem": 1.0}, {"ten": "b", "diem": 1.0}]
    moi = [{"ten": "a", "diem": 1.0}, {"ten": "b", "diem": 0.0}]
    ss = so_sanh_phien_ban(cu, moi)
    assert ss["thoai_lui"] == ["b"] and ss["cai_thien"] == []
    assert ss["khong_doi"] == 1
    assert ss["diem_tb_cu"] == 1.0 and ss["diem_tb_moi"] == 0.5

    # --- 3.4
    p = tao_prompt_judge("Hoi gi?", "Dap an", "Tra loi")
    assert "<cau_hoi>" in p and "1-5" in p and '{"diem"' in p

    assert parse_ket_qua_judge('{"diem": 5, "ly_do": "Chinh xac"}') == (1.0, "Chinh xac")
    assert parse_ket_qua_judge('{"diem": 3, "ly_do": "Thieu y"}') == (0.5, "Thieu y")
    assert parse_ket_qua_judge('{"diem": 1, "ly_do": "Sai"}') == (0.0, "Sai")
    assert parse_ket_qua_judge("khong phai json")[0] == 0.0
    assert parse_ket_qua_judge('{"diem": 9}')[0] == 0.0
    assert parse_ket_qua_judge('Danh gia: {"diem": 4, "ly_do": "Tot"}')[0] == 0.75

    # --- 3.5
    bl = tao_baseline_hang_so("tich cuc")
    assert bl("bat ky") == "tich cuc"
    kq_bl = chay_eval(bo_test, bl, khop_chinh_xac)
    assert tom_tat(kq_bl)["diem_tb"] < tom_tat(kq)["diem_tb"]

    print("Tat ca deu dung.")
