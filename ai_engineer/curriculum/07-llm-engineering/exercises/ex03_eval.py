"""BAI TAP 3 - Eval tu dong (Tuan 19).

Cham diem:  pytest tests/phase07/test_ex03.py -v
Loi giai:   curriculum/07-llm-engineering/solutions/ex03_eval.py

⭐⭐ DAY LA BAI TAP QUAN TRONG NHAT PHASE 07.

Ai cung goi duoc API. Rat it nguoi DO duoc chat luong dau ra mot cach
co he thong. Do la thu phan biet ky su voi nguoi nghich prompt.

CHAY DUOC MA KHONG CAN API KEY - vi `chay_eval` nhan mot HAM goi model
lam tham so. Trong test ta truyen ham gia lap; trong that ta truyen ham
goi Claude. Day goi la DEPENDENCY INJECTION, va no la ly do bo eval
cua ban se test duoc.
"""

from __future__ import annotations

import json
from collections.abc import Callable


# ===========================================================================
#  3.1 - Cac ham cham (scorer)
# ===========================================================================
def khop_chinh_xac(du_doan: str, mong_doi: str) -> bool:
    """So khop sau khi bo khoang trang thua va khong phan biet hoa/thuong.

    Vi du:
        khop_chinh_xac("Tich cuc", "tich cuc")    ->  True
        khop_chinh_xac("  tich cuc  ", "tich cuc")->  True
        khop_chinh_xac("tieu cuc", "tich cuc")    ->  False

    DUNG CHO: phan loai, tra ve mot nhan co dinh.
    """
    # TODO
    pass


def chua_tat_ca(du_doan: str, cac_tu_khoa: list[str]) -> bool:
    """Kiem tra dau ra co chua TAT CA tu khoa khong (khong phan biet hoa/thuong).

    Danh sach tu khoa RONG -> True.

    Vi du:
        chua_tat_ca("Gia 100k, giao trong 2 ngay", ["100k", "2 ngay"])  ->  True
        chua_tat_ca("Gia 100k", ["100k", "2 ngay"])                     ->  False
        chua_tat_ca("bat ky", [])                                       ->  True

    DUNG CHO: tom tat, tra loi tu do - kiem tra co du y bat buoc khong.
    """
    # TODO
    pass


def json_hop_le(chuoi: str, cac_khoa_bat_buoc: list[str] | None = None) -> bool:
    """Kiem tra chuoi co phai JSON hop le va co du cac khoa bat buoc khong.

    Neu cac_khoa_bat_buoc la None thi chi kiem tra JSON hop le.
    JSON phai la DOI TUONG (dict) neu co yeu cau khoa.

    Vi du:
        json_hop_le('{"a": 1}')                    ->  True
        json_hop_le('khong phai json')             ->  False
        json_hop_le('{"a": 1}', ["a"])             ->  True
        json_hop_le('{"a": 1}', ["a", "b"])        ->  False
        json_hop_le('[1, 2]', ["a"])               ->  False   (khong phai dict)

    DUNG CHO: trich xuat co cau truc - metric co ban nhat.
    """
    # TODO
    pass


def cham_theo_truong(du_doan: dict, chuan: dict) -> float:
    """Ty le truong khop chinh xac, tinh tren cac truong CO trong `chuan`.

    Tra ve 0.0 neu chuan rong.

    Vi du:
        cham_theo_truong({"a": 1, "b": 2}, {"a": 1, "b": 3})  ->  0.5
        cham_theo_truong({"a": 1}, {"a": 1})                  ->  1.0
        cham_theo_truong({}, {"a": 1})                        ->  0.0

    DUNG CHO: trich xuat nhieu truong - cho biet TRUONG NAO hay sai.
    """
    # TODO
    pass


# ===========================================================================
#  3.2 - Chay eval  <- TRAI TIM CUA BAI NAY
# ===========================================================================
def chay_eval(
    bo_test: list[dict],
    goi_model: Callable[[str], str],
    cham: Callable[[str, object], bool | float],
) -> list[dict]:
    """Chay bo eval, tra ve ket qua tung case.

    bo_test  - list dict, moi dict co khoa "dau_vao" va "mong_doi",
               co the co them "ten" (neu khong co thi dung "case_<i>")
    goi_model- ham nhan dau_vao (str) tra ve dau ra (str)
    cham     - ham nhan (dau_ra, mong_doi) tra ve bool hoac float 0..1

    Tra ve list dict, moi dict co DUNG 5 khoa:
        "ten"     - ten case
        "dau_vao" - dau vao
        "dau_ra"  - dau ra cua model (hoac thong bao loi)
        "diem"    - float 0.0-1.0 (bool True -> 1.0, False -> 0.0)
        "loi"     - None neu binh thuong, chuoi loi neu goi_model nem ngoai le

    QUAN TRONG: neu goi_model nem ngoai le, KHONG duoc de no thoat ra.
    Ghi loi vao khoa "loi", dat diem 0.0, va CHAY TIEP cac case con lai.

    VI SAO PHAI BAT LOI?
        Bo eval 50 case ma case thu 3 loi mang -> sap ca chuong trinh ->
        ban mat 47 ket qua con lai. Trong eval, mot case loi la MOT DIEM 0,
        khong phai ly do dung toan bo.

    VI SAO NHAN goi_model LAM THAM SO?
        De TEST DUOC ma khong can API key, va de doi model chi bang cach
        truyen ham khac. Day la dependency injection - ky thuat ban da
        gap o Phase 05 khi truyen `augment` vao ham train.
    """
    # TODO
    pass


def tom_tat(ket_qua: list[dict]) -> dict:
    """Tong hop ket qua eval.

    Tra ve dict co DUNG 5 khoa:
        "so_case"     - tong so case
        "diem_tb"     - diem trung binh (0.0 neu khong co case nao)
        "so_dat"      - so case co diem >= 1.0
        "ty_le_dat"   - so_dat / so_case (0.0 neu khong co case)
        "so_loi"      - so case co "loi" khac None

    Vi du voi 2 case diem 1.0 va 0.5, khong loi:
        {"so_case": 2, "diem_tb": 0.75, "so_dat": 1,
         "ty_le_dat": 0.5, "so_loi": 0}
    """
    # TODO
    pass


# ===========================================================================
#  3.3 - Phat hien thoai lui  <- ly do eval ton tai
# ===========================================================================
def so_sanh_phien_ban(cu: list[dict], moi: list[dict]) -> dict:
    """So sanh hai lan chay eval de phat hien THOAI LUI.

    Ghep cac case theo khoa "ten". Chi xet case co o CA HAI phien ban.

    Tra ve dict co DUNG 5 khoa:
        "cai_thien"  - list ten case co diem TANG, sap theo bang chu cai
        "thoai_lui"  - list ten case co diem GIAM, sap theo bang chu cai
        "khong_doi"  - so case diem khong doi
        "diem_tb_cu" - diem trung binh phien ban cu
        "diem_tb_moi"- diem trung binh phien ban moi

    (Hai diem trung binh tinh tren cac case CHUNG.)

    Vi du:
        cu  = [{"ten": "a", "diem": 1.0}, {"ten": "b", "diem": 1.0}]
        moi = [{"ten": "a", "diem": 1.0}, {"ten": "b", "diem": 0.0}]
        -> {"cai_thien": [], "thoai_lui": ["b"], "khong_doi": 1,
            "diem_tb_cu": 1.0, "diem_tb_moi": 0.5}

    ⭐ DAY LA LY DO EVAL TON TAI.
        Ban sua prompt de chua case A. Diem trung binh tang tu 0.80 len 0.84.
        Nghe nhu thanh cong.
        Nhung ham nay lo ra: 5 case cai thien, 3 case THOAI LUI.
        Ba case dang chay tot gio hong - va ban se khong bao gio biet
        neu chi nhin diem trung binh.
    """
    # TODO
    pass


# ===========================================================================
#  3.4 - LLM-as-judge
# ===========================================================================
def tao_prompt_judge(cau_hoi: str, dap_an_chuan: str, cau_tra_loi: str) -> str:
    """Dung prompt cho LLM-as-judge.

    Dinh dang CHINH XAC:

        Danh gia cau tra loi theo thang 1-5.

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

        Chi tra ve JSON: {"diem": <1-5>, "ly_do": "<mot cau>"}

    BON QUY TAC TRONG PROMPT NAY:
        1. Tieu chi CU THE cho tung muc diem (khong hoi "tot khong?")
        2. Yeu cau LY DO kem diem (de ban debug, va buoc model suy luan)
        3. Thang diem HEP (1-5, khong phai 1-100)
        4. Ep dinh dang JSON de parse duoc
    """
    # TODO
    pass


def parse_ket_qua_judge(dau_ra: str) -> tuple[float, str]:
    """Parse dau ra cua judge thanh (diem, ly_do).

    Diem duoc CHUAN HOA ve thang 0.0-1.0:
        diem 1 -> 0.0
        diem 3 -> 0.5
        diem 5 -> 1.0
    Cong thuc: (diem - 1) / 4

    Neu khong parse duoc, hoac diem ngoai khoang 1-5, tra ve
    (0.0, "Khong parse duoc ket qua judge").

    Vi du:
        parse_ket_qua_judge('{"diem": 5, "ly_do": "Chinh xac"}')
        ->  (1.0, "Chinh xac")

        parse_ket_qua_judge('{"diem": 3, "ly_do": "Thieu y"}')
        ->  (0.5, "Thieu y")

        parse_ket_qua_judge('khong phai json')
        ->  (0.0, "Khong parse duoc ket qua judge")

        parse_ket_qua_judge('{"diem": 9}')
        ->  (0.0, "Khong parse duoc ket qua judge")

    VI SAO CHUAN HOA VE 0-1?
        De MOI ham cham trong bo eval cua ban tra ve cung thang do.
        Nho vay ban tron duoc nhieu loai metric trong mot bao cao,
        va tinh trung binh co y nghia.

    Goi y: dung lai ky thuat trich JSON o bai tap 2 neu can.
    """
    # TODO
    pass


# ===========================================================================
#  3.5 - Baseline
# ===========================================================================
def tao_baseline_hang_so(gia_tri: str) -> Callable[[str], str]:
    """Tra ve mot ham LUON tra ve `gia_tri`, bat ke dau vao.

    Vi du:
        f = tao_baseline_hang_so("tich cuc")
        f("bat ky dau vao")  ->  "tich cuc"

    ⭐ VI SAO CAN BASELINE NGU NGOC NAY?
        Neu bo test cua ban co 70% nhan la "tich cuc", thi model LUON
        doan "tich cuc" da dat 70%. Prompt tinh vi cua ban dat 75% -
        nghe cao, thuc ra chi hon baseline 5 diem.

        Day chinh la DummyClassifier ban da dung o Phase 04. Nguyen tac
        khong doi: TRUOC KHI khoe con so, phai tra loi duoc "so voi cai gi?"
    """
    # TODO
    pass


# ===========================================================================
if __name__ == "__main__":
    bo_test = [
        {"ten": "vui", "dau_vao": "San pham tuyet voi!", "mong_doi": "tich cuc"},
        {"ten": "buon", "dau_vao": "Hang loi, that vong", "mong_doi": "tieu cuc"},
        {"ten": "trung", "dau_vao": "Cung binh thuong", "mong_doi": "trung tinh"},
    ]

    # Model gia lap: doan dua tren tu khoa
    def model_gia(dau_vao: str) -> str:
        if "tuyet" in dau_vao:
            return "tich cuc"
        if "that vong" in dau_vao:
            return "tieu cuc"
        return "trung tinh"

    kq = chay_eval(bo_test, model_gia, khop_chinh_xac)
    if kq is None:
        print("  Chua lam chay_eval.")
        raise SystemExit(0)

    print("  Ket qua tung case:")
    for r in kq:
        print(f"    {r['ten']:<8} diem={r['diem']:.1f}  dau_ra={r['dau_ra']!r}")

    print(f"\n  Tom tat: {tom_tat(kq)}")

    baseline = tao_baseline_hang_so("tich cuc")
    kq_bl = chay_eval(bo_test, baseline, khop_chinh_xac)
    print(f"  Baseline: {tom_tat(kq_bl)}")

    print(f"\n  So sanh: {so_sanh_phien_ban(kq_bl, kq)}")
