"""BAI TAP 1 - Tokenizer (Tuan 14).

Cham diem:  pytest tests/phase06/test_ex01.py -v
Loi giai:   curriculum/06-nlp-transformers/solutions/ex01_tokenizer.py

Muc tieu: hieu chinh xac cach van ban bien thanh so. Sau bai nay, khi doc
"prompt nay ton 1.200 token" ban biet con so do tu dau ra.

CHI DUNG Python thuan. Khong can torch.
"""

from __future__ import annotations

from collections import Counter


# ===========================================================================
#  1.1 - Tokenizer muc KY TU
# ===========================================================================
def xay_tu_vung_ky_tu(van_ban: str) -> dict[str, int]:
    """Xay tu vung tu tat ca ky tu KHAC NHAU trong van ban.

    Ky tu duoc SAP XEP tang dan, roi danh so tu 0.

    Vi du:
        xay_tu_vung_ky_tu("cba")  ->  {"a": 0, "b": 1, "c": 2}
        xay_tu_vung_ky_tu("aab")  ->  {"a": 0, "b": 1}
        xay_tu_vung_ky_tu("")     ->  {}

    VI SAO PHAI SAP XEP?
        De ket qua ON DINH giua cac lan chay. Neu dung set() truc tiep,
        thu tu co the khac nhau -> model train xong luu lai roi nap len
        se giai ma sai hoan toan.
    """
    # TODO
    pass


def ma_hoa_ky_tu(van_ban: str, tu_vung: dict[str, int]) -> list[int]:
    """Doi van ban thanh danh sach chi so.

    Ky tu KHONG co trong tu vung thi BO QUA.

    Vi du:
        tv = {"a": 0, "b": 1}
        ma_hoa_ky_tu("aba", tv)  ->  [0, 1, 0]
        ma_hoa_ky_tu("axb", tv)  ->  [0, 1]      ("x" bi bo qua)
    """
    # TODO
    pass


def giai_ma_ky_tu(chi_so: list[int], tu_vung: dict[str, int]) -> str:
    """Doi danh sach chi so nguoc lai thanh van ban.

    Vi du:
        tv = {"a": 0, "b": 1}
        giai_ma_ky_tu([0, 1, 0], tv)  ->  "aba"

    Goi y: tao bang tra nguoc {chi_so: ky_tu} tu tu_vung.
    """
    # TODO
    pass


# ===========================================================================
#  1.2 - Tokenizer muc TU
# ===========================================================================
def xay_tu_vung_tu(van_ban: str, so_tu_toi_da: int = 1000) -> dict[str, int]:
    """Xay tu vung tu cac TU (tach theo khoang trang).

    Quy tac:
        - Doi ve chu THUONG truoc khi tach
        - Lay `so_tu_toi_da` tu PHO BIEN NHAT
        - Sap theo tan suat GIAM DAN; tan suat bang nhau thi sap theo
          bang chu cai TANG DAN
        - Danh so tu 0
        - LUON co token dac biet "<unk>" o chi so CUOI CUNG

    Vi du:
        xay_tu_vung_tu("a b a c a b", so_tu_toi_da=2)
        -> {"a": 0, "b": 1, "<unk>": 2}
        ("a" xuat hien 3 lan, "b" 2 lan, "c" 1 lan -> lay 2 tu dau)

    VI SAO CAN <unk>?
        Van ban moi luon co tu chua tung thay. Khong co <unk> thi
        chuong trinh sap. Day la diem yeu lon nhat cua tokenizer
        muc TU - va la ly do subword ra doi.

    Goi y: Counter(...).most_common() da sap theo tan suat giam dan,
           nhung khi bang nhau thi thu tu KHONG on dinh -> phai sap lai.
    """
    # TODO
    pass


def ma_hoa_tu(van_ban: str, tu_vung: dict[str, int]) -> list[int]:
    """Doi van ban thanh chi so o muc tu.

    Tu khong co trong tu vung -> dung chi so cua "<unk>".
    Nho doi ve chu thuong truoc khi tach.

    Vi du:
        tv = {"a": 0, "b": 1, "<unk>": 2}
        ma_hoa_tu("a b z", tv)  ->  [0, 1, 2]
        ma_hoa_tu("A B", tv)    ->  [0, 1]      (khong phan biet hoa/thuong)
    """
    # TODO
    pass


# ===========================================================================
#  1.3 - BPE  <- THUAT TOAN MA GPT DUNG
# ===========================================================================
def dem_cap(cac_token: list[str]) -> Counter:
    """Dem tan suat cua tung CAP token LIEN NHAU.

    Vi du:
        dem_cap(["a", "b", "a", "b", "c"])
        ->  Counter({("a","b"): 2, ("b","a"): 1, ("b","c"): 1})

        dem_cap(["a"])   ->  Counter()      (khong co cap nao)
        dem_cap([])      ->  Counter()
    """
    # TODO
    pass


def gop_cap(cac_token: list[str], cap: tuple[str, str]) -> list[str]:
    """Gop moi lan xuat hien cua `cap` thanh MOT token duy nhat.

    Vi du:
        gop_cap(["a", "b", "a", "b", "c"], ("a", "b"))
        ->  ["ab", "ab", "c"]

        gop_cap(["a", "a", "a"], ("a", "a"))
        ->  ["aa", "a"]        (gop tu TRAI sang PHAI, khong chong lan)

    Goi y: duyet bang chi so i, neu cac_token[i:i+2] khop cap thi
           them token gop va nhay i += 2, nguoc lai i += 1.
    """
    # TODO
    pass


def huan_luyen_bpe(van_ban: str, so_lan_gop: int) -> list[tuple[str, str]]:
    """Huan luyen BPE, tra ve DANH SACH cac phep gop theo dung thu tu.

    Thuat toan:
        1. Bat dau: moi KY TU la mot token
        2. Lap `so_lan_gop` lan:
             - Dem tat ca cap lien nhau
             - Neu khong con cap nao thi DUNG
             - Chon cap CO TAN SUAT CAO NHAT
               (bang nhau thi chon cap NHO NHAT theo thu tu bang chu cai,
                de ket qua on dinh)
             - Ghi cap do vao ket qua
             - Gop cap do trong danh sach token
        3. Tra ve danh sach cac cap da gop

    Vi du:
        huan_luyen_bpe("ab ab ab", 1)   ->  [("a", "b")]

    LUU Y: THU TU cac phep gop rat quan trong - khi ma hoa van ban moi,
    phai ap dung lai dung thu tu do.
    """
    # TODO
    pass


def ap_dung_bpe(van_ban: str, cac_phep_gop: list[tuple[str, str]]) -> list[str]:
    """Ap dung cac phep gop da hoc len van ban moi.

    Bat dau tu tung ky tu, roi ap dung TUNG phep gop theo DUNG THU TU.

    Vi du:
        gop = huan_luyen_bpe("ab ab ab", 1)     # [("a","b")]
        ap_dung_bpe("aab", gop)  ->  ["a", "ab"]

    DAY LA CACH GPT TOKENIZE VAN BAN CUA BAN.
    """
    # TODO
    pass


# ===========================================================================
#  1.4 - So sanh ba muc tokenization
# ===========================================================================
def so_sanh_tokenizer(van_ban: str, so_lan_gop: int = 50) -> dict[str, dict]:
    """So sanh ba muc tokenization tren cung mot van ban.

    Tra ve dict co dung 3 khoa: "ky_tu", "tu", "bpe".
    Moi gia tri la dict co dung 2 khoa:
        "so_token"  - do dai chuoi sau khi ma hoa
        "tu_vung"   - kich thuoc tu vung

    Voi tung muc:
        ky_tu : dung xay_tu_vung_ky_tu + ma_hoa_ky_tu
        tu    : dung xay_tu_vung_tu(so_tu_toi_da=1000) + ma_hoa_tu
        bpe   : dung huan_luyen_bpe(so_lan_gop) + ap_dung_bpe,
                tu vung = so token KHAC NHAU trong ket qua

    BAN SE THAY DANH DOI CO BAN:
        ky tu -> tu vung nho nhat, chuoi DAI nhat
        tu    -> tu vung lon nhat, chuoi NGAN nhat
        bpe   -> o giua, va do la ly do moi LLM dung no
    """
    # TODO
    pass


# ===========================================================================
if __name__ == "__main__":
    mau = "nam nam nam nha nha"

    tv = xay_tu_vung_ky_tu(mau)
    if tv is None:
        print("Chua lam xay_tu_vung_ky_tu.")
        raise SystemExit(0)

    print(f"  Tu vung ky tu: {tv}")
    print(f"  Ma hoa       : {ma_hoa_ky_tu('nam', tv)}")
    print(f"  Giai ma nguoc: {giai_ma_ky_tu(ma_hoa_ky_tu('nam', tv), tv)!r}")
    print()

    gop = huan_luyen_bpe(mau, 3)
    print(f"  BPE hoc duoc {len(gop)} phep gop: {gop}")
    print(f"  Ap dung len 'nam': {ap_dung_bpe('nam', gop)}")
    print()

    from pathlib import Path

    p = Path("data/van_ban_viet.txt")
    if p.exists():
        vb = p.read_text(encoding="utf-8")[:20000]
        ss = so_sanh_tokenizer(vb, so_lan_gop=100)
        print(f"  So sanh tren 20.000 ky tu van ban that:")
        print(f"  {'muc':<8} {'so_token':>10} {'tu_vung':>10}")
        print("  " + "-" * 30)
        for muc, kq in ss.items():
            print(f"  {muc:<8} {kq['so_token']:>10,} {kq['tu_vung']:>10,}")
    else:
        print("  (Chay tao_du_lieu.py de so sanh tren van ban that)")
