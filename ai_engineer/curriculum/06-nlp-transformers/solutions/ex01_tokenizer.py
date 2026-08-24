"""LOI GIAI - Bai tap 1, Phase 06."""

from __future__ import annotations

from collections import Counter


# ===========================================================================
def xay_tu_vung_ky_tu(van_ban: str) -> dict[str, int]:
    return {ky_tu: i for i, ky_tu in enumerate(sorted(set(van_ban)))}


def ma_hoa_ky_tu(van_ban: str, tu_vung: dict[str, int]) -> list[int]:
    return [tu_vung[c] for c in van_ban if c in tu_vung]


def giai_ma_ky_tu(chi_so: list[int], tu_vung: dict[str, int]) -> str:
    tra_nguoc = {i: c for c, i in tu_vung.items()}
    return "".join(tra_nguoc[i] for i in chi_so)


# VI SAO PHAI sorted()?
#   set() KHONG dam bao thu tu on dinh giua cac lan chay Python khac nhau
#   (do co che bam va PYTHONHASHSEED). Neu tu vung khac nhau giua luc train
#   va luc nap lai, model se giai ma ra van ban vo nghia hoan toan.
#
#   Quy tac chung: moi thu anh huong den model phai TAI LAP DUOC.
#   Do la ly do ta luon sorted(), luon dat seed, luon luu tu vung ra file.
#
# TOKENIZER MUC KY TU - uu va nhuoc:
#   + Tu vung cuc nho (tieng Viet ~100-200 ky tu)
#   + KHONG BAO GIO gap token la
#   + Rat de code
#   - Chuoi RAT DAI -> attention ton O(n^2) nen cham
#   - Model phai hoc tu dau cach ghep ky tu thanh tu
#
#   Dung khi: kho ngu lieu nho, ngon ngu it ky tu, hoac de HOC (nhu bai nay).
#   Mini-GPT o bai 4 dung chinh tokenizer nay.
#
# LUU Y VE TIENG VIET: mot chu co dau nhu "ế" co the la MOT ky tu Unicode
#   (dang NFC) hoac HAI ky tu (dang NFD: "e" + dau mu + dau sac).
#   Cung mot chu nhin giong nhau nhung tu vung khac han!
#   Trong du an that nen chuan hoa truoc:
#       import unicodedata
#       van_ban = unicodedata.normalize("NFC", van_ban)


# ===========================================================================
def xay_tu_vung_tu(van_ban: str, so_tu_toi_da: int = 1000) -> dict[str, int]:
    dem = Counter(van_ban.lower().split())

    # Sap: tan suat GIAM dan, bang nhau thi bang chu cai TANG dan
    da_sap = sorted(dem.items(), key=lambda x: (-x[1], x[0]))

    tu_vung = {tu: i for i, (tu, _) in enumerate(da_sap[:so_tu_toi_da])}
    tu_vung["<unk>"] = len(tu_vung)
    return tu_vung


def ma_hoa_tu(van_ban: str, tu_vung: dict[str, int]) -> list[int]:
    unk = tu_vung["<unk>"]
    return [tu_vung.get(tu, unk) for tu in van_ban.lower().split()]


# VI SAO PHAI TU SAP LAI thay vi dung .most_common() truc tiep?
#   Counter.most_common() sap theo tan suat giam dan, NHUNG khi hai tu
#   co cung tan suat thi thu tu giua chung phu thuoc thu tu chen vao dict
#   - khong on dinh khi doi kho ngu lieu.
#
#   key=lambda x: (-x[1], x[0]) sap theo tuple:
#       -x[1]  tan suat, dau tru de doi thanh giam dan
#       x[0]   ten tu, tang dan (pha the hoa)
#   Meo sap nhieu tieu chi nay ban da dung o Phase 01 va Phase 03.
#
# <unk> - TOKEN DAC BIET
#   Moi tokenizer that deu co cac token dac biet:
#       <unk>  tu khong biet
#       <pad>  dem cho du do dai batch
#       <bos>  bat dau chuoi (begin of sequence)
#       <eos>  ket thuc chuoi  <- LLM dung token nay de biet khi nao DUNG
#       <sep>  ngan cach hai doan
#
#   Trong Claude/GPT, cac token dac biet danh dau vai tro (system/user/
#   assistant) chinh la co che ky thuat dung sau "chat template".
#
# DIEM YEU CHET NGUOI CUA TOKENIZER MUC TU:
#   Van ban moi luon co tu chua tung thay -> tat ca thanh <unk> -> mat
#   sach thong tin. Voi tieng Viet con te hon: "học", "học tập", "đi học"
#   la ba token hoan toan khac nhau du chung chia se chu "học".
#
#   Do chinh la van de ma BPE giai quyet.


# ===========================================================================
def dem_cap(cac_token: list[str]) -> Counter:
    return Counter(zip(cac_token, cac_token[1:]))


# zip(a, a[1:]) LA MEO DEM CAP LIEN NHAU:
#   a      = ["a", "b", "c"]
#   a[1:]  =      ["b", "c"]
#   zip    = [("a","b"), ("b","c")]
#
#   Voi list 1 phan tu hoac rong, zip tra ve rong - dung y muon,
#   khong can kiem tra dac biet.


def gop_cap(cac_token: list[str], cap: tuple[str, str]) -> list[str]:
    ket_qua = []
    i = 0
    while i < len(cac_token):
        if i < len(cac_token) - 1 and (cac_token[i], cac_token[i + 1]) == cap:
            ket_qua.append(cac_token[i] + cac_token[i + 1])
            i += 2
        else:
            ket_qua.append(cac_token[i])
            i += 1
    return ket_qua


# VI SAO DUNG while THAY VI for?
#   Vi khi gop duoc mot cap, ta phai NHAY 2 buoc chu khong phai 1.
#   Vong for khong cho ban dieu khien bien dem.
#
# VI SAO GOP KHONG CHONG LAN?
#   Voi ["a","a","a"] va cap ("a","a"):
#       i=0: khop -> "aa", nhay den i=2
#       i=2: chi con mot phan tu -> giu "a"
#   Ket qua ["aa", "a"], khong phai ["aa", "aa"].
#   Day la hanh vi dung: mot token khong the thuoc ve hai phep gop.


# ===========================================================================
def huan_luyen_bpe(van_ban: str, so_lan_gop: int) -> list[tuple[str, str]]:
    cac_token = list(van_ban)
    cac_phep_gop = []

    for _ in range(so_lan_gop):
        dem = dem_cap(cac_token)
        if not dem:
            break

        # Tan suat cao nhat; bang nhau thi lay cap nho nhat theo bang chu cai
        tan_suat_cao_nhat = max(dem.values())
        cap_tot_nhat = min(c for c, n in dem.items() if n == tan_suat_cao_nhat)

        cac_phep_gop.append(cap_tot_nhat)
        cac_token = gop_cap(cac_token, cap_tot_nhat)

    return cac_phep_gop


def ap_dung_bpe(van_ban: str, cac_phep_gop: list[tuple[str, str]]) -> list[str]:
    cac_token = list(van_ban)
    for cap in cac_phep_gop:
        cac_token = gop_cap(cac_token, cap)
    return cac_token


# BPE - THUAT TOAN MA GPT, LLAMA, CLAUDE DEU DUNG (voi bien the).
#
#   Y tuong ban dau khong phai tu NLP ma tu NEN DU LIEU (Gage, 1994):
#   thay cap byte hay gap nhat bang mot byte chua dung. Sennrich (2015)
#   mang no sang dich may va no tro thanh chuan cua ca nganh.
#
# VI SAO PHAI PHA THE HOA (chon cap nho nhat khi bang tan suat)?
#   Neu khong, ket qua phu thuoc thu tu duyet dict -> hai lan train
#   tren cung du lieu co the ra hai tokenizer khac nhau.
#   Tokenizer PHAI tai lap duoc, neu khong model se vo dung khi nap lai.
#
# THU TU PHEP GOP RAT QUAN TRONG:
#   Cac phep gop phai duoc ap dung theo DUNG thu tu da hoc. Vi phep gop
#   sau co the phu thuoc ket qua cua phep gop truoc:
#       gop 1: ("n","a") -> "na"
#       gop 2: ("na","m") -> "nam"      <- can "na" ton tai truoc
#   Doi thu tu la ra ket qua khac han.
#
# BPE THUC TE KHAC BAN NAY O CHO NAO?
#   1. Lam viec tren BYTE chu khong phai ky tu Unicode
#      -> khong bao gio gap ky tu la, ke ca emoji hay chu Han
#      -> goi la "byte-level BPE", GPT-2 tro di deu dung
#   2. Tach tu truoc bang regex, roi chi gop TRONG tung tu
#      -> tranh gop qua ranh gioi tu (khong tao token "ăn_cơm")
#   3. Dung cau truc du lieu toi uu, khong dem lai tu dau moi lan
#      -> huan luyen tren hang GB van kha thi
#   4. So lan gop rat lon: GPT-2 co 50.257 token, Llama 3 co 128.000
#
#   Nhung Y TUONG COT LOI thi dung nhu ban vua code.
#
# LIEN HE PHASE 07:
#   Khi ban thay "prompt nay ton 1.200 token", do chinh la ket qua cua
#   ap_dung_bpe tren van ban cua ban. Va vi tokenizer duoc huan luyen
#   chu yeu tren tieng Anh, tieng Viet bi tach vun hon -> TON TIEN HON
#   cho cung mot y.


# ===========================================================================
def so_sanh_tokenizer(van_ban: str, so_lan_gop: int = 50) -> dict[str, dict]:
    tv_ky_tu = xay_tu_vung_ky_tu(van_ban)
    ma_ky_tu = ma_hoa_ky_tu(van_ban, tv_ky_tu)

    tv_tu = xay_tu_vung_tu(van_ban, so_tu_toi_da=1000)
    ma_tu = ma_hoa_tu(van_ban, tv_tu)

    gop = huan_luyen_bpe(van_ban, so_lan_gop)
    ma_bpe = ap_dung_bpe(van_ban, gop)

    return {
        "ky_tu": {"so_token": len(ma_ky_tu), "tu_vung": len(tv_ky_tu)},
        "tu": {"so_token": len(ma_tu), "tu_vung": len(tv_tu)},
        "bpe": {"so_token": len(ma_bpe), "tu_vung": len(set(ma_bpe))},
    }


# DANH DOI CO BAN - ban se thay ro khi chay tren van ban that:
#
#            tu vung nho                          tu vung lon
#            chuoi dai                            chuoi ngan
#            |--------------|--------------|--------------|
#          ky tu         subword          tu
#                       <- LLM o day ->
#
# VI SAO DO DAI CHUOI QUAN TRONG DEN VAY?
#   Attention co do phuc tap O(n^2) theo do dai chuoi.
#   Chuoi dai GAP DOI -> tinh toan GAP BON.
#
#   Voi mot doan van 1000 ky tu:
#       muc ky tu : ~1000 token -> attention tinh 1.000.000 phep
#       muc BPE   :  ~300 token -> attention tinh    90.000 phep
#   Nhanh hon 11 lan chi nho doi tokenizer.
#
#   Do cung la ly do context window duoc do bang TOKEN chu khong phai
#   ky tu hay tu - token la don vi that su quyet dinh chi phi tinh toan.
#
# VI SAO KHONG DUNG TU VUNG THAT LON de chuoi that ngan?
#   Vi ma tran embedding co kich thuoc (vocab_size x d_model).
#   Voi d=4096 va vocab 1 trieu -> 4 ty tham so CHI cho embedding.
#   Ngoai ra lop cuoi cung phai tinh softmax tren toan bo tu vung.
#   30.000-130.000 la vung can bang ma nganh da hoi tu ve.


# ===========================================================================
if __name__ == "__main__":
    assert xay_tu_vung_ky_tu("cba") == {"a": 0, "b": 1, "c": 2}
    assert xay_tu_vung_ky_tu("") == {}

    tv = {"a": 0, "b": 1}
    assert ma_hoa_ky_tu("aba", tv) == [0, 1, 0]
    assert ma_hoa_ky_tu("axb", tv) == [0, 1]
    assert giai_ma_ky_tu([0, 1, 0], tv) == "aba"

    tvt = xay_tu_vung_tu("a b a c a b", so_tu_toi_da=2)
    assert tvt == {"a": 0, "b": 1, "<unk>": 2}
    assert ma_hoa_tu("a b z", tvt) == [0, 1, 2]
    assert ma_hoa_tu("A B", tvt) == [0, 1]

    assert dem_cap(["a", "b", "a", "b", "c"]) == Counter(
        {("a", "b"): 2, ("b", "a"): 1, ("b", "c"): 1}
    )
    assert dem_cap(["a"]) == Counter()

    assert gop_cap(["a", "b", "a", "b", "c"], ("a", "b")) == ["ab", "ab", "c"]
    assert gop_cap(["a", "a", "a"], ("a", "a")) == ["aa", "a"]

    gop = huan_luyen_bpe("ab ab ab", 1)
    assert gop == [("a", "b")]
    assert ap_dung_bpe("aab", gop) == ["a", "ab"]

    # BPE tren van ban lap lai phai rut ngan chuoi dang ke
    mau = "nam nam nam nam nha nha nha"
    gop = huan_luyen_bpe(mau, 5)
    assert len(ap_dung_bpe(mau, gop)) < len(mau)

    ss = so_sanh_tokenizer("nam nam nha nha lap trinh lap trinh", so_lan_gop=10)
    assert set(ss) == {"ky_tu", "tu", "bpe"}
    assert ss["ky_tu"]["so_token"] > ss["tu"]["so_token"]

    # Voi van ban DU LON, tu vung muc tu moi vuot muc ky tu.
    # (Voi van ban ti hon thi nguoc lai - it tu khac nhau hon so ky tu.)
    from pathlib import Path as _P

    _f = _P("data/van_ban_viet.txt")
    if _f.exists():
        ss2 = so_sanh_tokenizer(_f.read_text(encoding="utf-8")[:20000], so_lan_gop=100)
        assert ss2["ky_tu"]["so_token"] > ss2["bpe"]["so_token"] > ss2["tu"]["so_token"]
        assert ss2["ky_tu"]["tu_vung"] < ss2["tu"]["tu_vung"]
        print(f"  Tren van ban that: ky_tu {ss2['ky_tu']['so_token']:,} token"
              f" | bpe {ss2['bpe']['so_token']:,} | tu {ss2['tu']['so_token']:,}")

    print("Tat ca deu dung.")
