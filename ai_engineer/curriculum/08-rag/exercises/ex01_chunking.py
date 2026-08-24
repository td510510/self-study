"""BAI TAP 1 - Chunking (Tuan 20).

Cham diem:  pytest tests/phase08/test_ex01.py -v
Loi giai:   curriculum/08-rag/solutions/ex01_chunking.py

CHUNKING LA BUOC BI COI THUONG NHAT CUA RAG.
Ai cung nghi "cat van ban ra thoi ma". Nhung cat sai thi moi thu phia sau
deu hong, va hong mot cach IM LANG: retrieval van tra ve doan, model van
tra loi tron tru, chi co dieu cau tra loi thieu mat nua ve sau.

Khong can API key. Day la Python thuan.
"""

from __future__ import annotations


# ===========================================================================
#  1.1 - Cat theo kich thuoc co dinh
# ===========================================================================
def cat_co_dinh(van_ban: str, kich_thuoc: int, chong_lap: int = 0) -> list[str]:
    """Cat van ban thanh cac doan `kich_thuoc` ky tu, hai doan lien tiep
    chong lan nhau `chong_lap` ky tu.

    Vi du:
        cat_co_dinh("abcdefghij", 4, 0)  ->  ["abcd", "efgh", "ij"]
        cat_co_dinh("abcdefghij", 4, 2)  ->  ["abcd", "cdef", "efgh", "ghij", "ij"]

    Quy tac:
        - van_ban rong  -> tra ve []
        - chong_lap >= kich_thuoc -> nem ValueError (neu khong se lap vo han)
        - kich_thuoc <= 0 -> nem ValueError
        - doan cuoi duoc phep ngan hon kich_thuoc

    VI SAO CAN CHONG LAP? Vi cau tra loi hay nam vat qua ranh gioi hai doan.
    Chong lap lam cho moi cau deu nam tron ven trong it nhat mot doan.
    """
    # TODO
    pass


# ===========================================================================
#  1.2 - Cat theo doan van
# ===========================================================================
def cat_theo_doan(van_ban: str, kich_thuoc_toi_da: int) -> list[str]:
    """Cat theo doan van (ngan cach boi dong trong), gop cac doan lien tiep
    lai cho toi khi sap vuot `kich_thuoc_toi_da`.

    Doan duoc gop lai bang "\n\n". Doan don le dai hon kich_thuoc_toi_da
    van duoc GIU NGUYEN - khong cat doi.

    Vi du (kich_thuoc_toi_da=20):
        "aaa\n\nbbb\n\ncccccccccccccccccccccccccc"
        ->  ["aaa\n\nbbb", "cccccccccccccccccccccccccc"]

    Quy tac:
        - bo qua doan chi co khoang trang
        - van_ban rong hoac chi co khoang trang -> []
        - kich_thuoc_toi_da <= 0 -> nem ValueError

    VI SAO TOT HON CAT CO DINH? Vi no khong cat giua chung mot cau. Doi lai,
    do dai cac chunk khong deu - va do la van de khi ban tinh chi phi.
    """
    # TODO
    pass


# ===========================================================================
#  1.3 - Cat theo tieu de Markdown
# ===========================================================================
def cat_theo_tieu_de(van_ban: str, muc: int = 2) -> list[str]:
    """Cat tai lieu Markdown tai moi tieu de cap `muc` (mac dinh "## ").

    Moi chunk BAO GOM dong tieu de cua no. Phan van ban dung truoc tieu de
    dau tien (thuong la tieu de cap 1 va loi gioi thieu) la mot chunk rieng.

    Vi du:
        "# T\n\nmo dau\n\n## A\n\nnoi dung A\n\n## B\n\nnoi dung B"
        ->  ["# T\n\nmo dau", "## A\n\nnoi dung A", "## B\n\nnoi dung B"]

    Quy tac:
        - chunk rong (chi khoang trang) bi loai bo
        - dong tieu de phai BAT DAU dong moi va dung dung `muc` dau '#'
          ("### C" KHONG cat khi muc=2)
        - van_ban khong co tieu de nao -> tra ve [van_ban] (da strip)
        - muc < 1 -> nem ValueError

    CAI BAY: chunk theo tieu de nghe rat hop ly, nhung neu tai lieu viet
    "cach sua loi o muc tren" thi ban vua cat dut nguyen nhan khoi cach sua.
    Bai tap 3 se do dung cai gia phai tra cho viec do.
    """
    # TODO
    pass


# ===========================================================================
#  1.4 - Thong ke chunk
# ===========================================================================
def thong_ke_chunk(cac_chunk: list[str]) -> dict:
    """Thong ke do dai (theo KY TU) de so sanh cac chien luoc cat.

    Tra ve dict co dung cac khoa:
        so_chunk, do_dai_tb, ngan_nhat, dai_nhat, tong_ky_tu

    Danh sach rong -> tat ca bang 0 (do_dai_tb la 0.0).
    do_dai_tb la float, cac gia tri con lai la int.

    VI SAO CAN? Vi "chunk cua toi on" khong phai la mot cau noi ky thuat.
    So chunk nhan voi so token trung binh chinh la tien ban tra moi cau hoi.
    """
    # TODO
    pass


# ===========================================================================
#  1.5 - Kiem tra chunk co chua doan trich dan khong
# ===========================================================================
def chunk_chua(cac_chunk: list[str], trich_dan: str) -> bool:
    """Co chunk nao chua `trich_dan` khong? BO QUA khac biet ve khoang trang.

    Vi du:
        chunk_chua(["nghi  om\ntoi da 3 ngay"], "om toi da 3 ngay")  ->  True

    Quy tac:
        - trich_dan rong hoac chi khoang trang -> True (khong doi hoi gi)
        - danh sach chunk rong -> False (tru khi trich_dan rong)
        - PHAN BIET hoa thuong

    VI SAO HAM NAY QUAN TRONG? Day la vien gach dau tien cua bo eval RAG.
    Tai lieu that duoc xuong dong theo do rong trang, nen mot cum tu co that
    rat de bi mot ky tu newline cat lam doi. So khop tho se bao "khong thay"
    trong khi doan van RO RANG co cum do - va ban se di sua nham cho khac.
    """
    # TODO
    pass
