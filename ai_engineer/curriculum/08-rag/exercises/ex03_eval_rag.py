"""BAI TAP 3 - Trich dan va do chat luong RAG (Tuan 21).

Cham diem:  pytest tests/phase08/test_ex03.py -v
Loi giai:   curriculum/08-rag/solutions/ex03_eval_rag.py

⭐⭐ BAI TAP QUAN TRONG NHAT PHASE 08.

Mot he RAG chay duoc thi de. Cau hoi kho la:
    "No dung bao nhieu phan tram, va hom nay ban sua chunking - no tot len
     hay ban vua lam hong 3 cau dang chay dung?"

Khong tra loi duoc cau do thi ban dang doan, khong phai dang lam ky thuat.

CHAY DUOC MA KHONG CAN API KEY - `chay_eval_rag` nhan mot HAM tra loi lam
tham so (dependency injection), giong het bai tap 3 cua Phase 07.
"""

from __future__ import annotations

from collections.abc import Callable

# Cac cum tu the hien he thong TU CHOI tra loi vi khong tim thay thong tin.
# Day la mot HANH VI DUNG can duoc thuong diem, khong phai mot that bai.
CUM_TU_CHOI = [
    "không tìm thấy",
    "không có thông tin",
    "không đề cập",
    "tài liệu không",
    "không nói về",
]


# ===========================================================================
#  3.1 - Dung ngu canh co danh so
# ===========================================================================
def tao_ngu_canh(cac_chunk: list[str], cac_nguon: list[str] | None = None) -> str:
    """Ghep cac doan thanh mot khoi ngu canh CO DANH SO de model trich dan duoc.

    Dinh dang moi doan (danh so tu 1):
        [1] (ten_nguon)
        noi dung doan

    Cac doan cach nhau bang mot dong trong. Neu `cac_nguon` la None thi bo
    phan "(ten_nguon)", chi con "[1]".

    Vi du:
        tao_ngu_canh(["aaa", "bbb"], ["x.md", "y.md"])
        ->  "[1] (x.md)\naaa\n\n[2] (y.md)\nbbb"

    Quy tac:
        - danh sach rong -> tra ve chuoi rong
        - do dai cac_nguon khac cac_chunk -> nem ValueError

    VI SAO PHAI DANH SO? Vi khong danh so thi model KHONG THE tro toi doan
    nao ca, va ban khong co cach nao kiem tra cau tra loi den tu dau. Danh so
    la dieu kien can de chong bia dat - khong phai de cho dep.
    """
    # TODO
    pass


# ===========================================================================
#  3.2 - Doc trich dan trong cau tra loi
# ===========================================================================
def tach_trich_dan(cau_tra_loi: str) -> set[int]:
    """Lay tat ca so trich dan dang [n] trong cau tra loi.

    Vi du:
        tach_trich_dan("Theo [1] va [3], phep nam la 12 ngay.")  ->  {1, 3}
        tach_trich_dan("Khong co trich dan nao.")                ->  set()
        tach_trich_dan("[2][2][5]")                              ->  {2, 5}

    Quy tac:
        - chi nhan so nguyen duong: "[0]" va "[-1]" bi BO QUA
        - "[abc]" bi bo qua
    """
    # TODO
    pass


def kiem_tra_trich_dan(cau_tra_loi: str, so_doan: int) -> dict:
    """Kiem tra cac trich dan trong cau tra loi co hop le khong.

    Tra ve dict co dung cac khoa:
        co_trich_dan     bool  - co it nhat mot trich dan
        ngoai_pham_vi    set   - cac so trich dan > so_doan (BIA RA)
        hop_le           bool  - co trich dan VA khong cai nao ngoai pham vi

    Vi du (so_doan=3):
        "Theo [1] va [5]..." -> co_trich_dan=True, ngoai_pham_vi={5}, hop_le=False
        "Theo [2]..."        -> co_trich_dan=True, ngoai_pham_vi=set(), hop_le=True
        "Phep nam 12 ngay."  -> co_trich_dan=False, ngoai_pham_vi=set(), hop_le=False

    TRICH DAN NGOAI PHAM VI LA MOT DANG BIA DAT DAC BIET NGUY HIEM:
    cau tra loi trong CANG DANG TIN vi co so trich dan, trong khi so do tro
    toi mot doan khong ton tai. Nguoi doc se khong bao gio kiem tra.
    """
    # TODO
    pass


# ===========================================================================
#  3.3 - Nhan biet cau tra loi tu choi
# ===========================================================================
def la_tu_choi(cau_tra_loi: str) -> bool:
    """Cau tra loi co phai la "toi khong tim thay thong tin" khong?

    Dung danh sach CUM_TU_CHOI o dau file, KHONG phan biet hoa thuong.

    Vi du:
        la_tu_choi("Tài liệu không đề cập đến việc này.")  ->  True
        la_tu_choi("Phép năm là 12 ngày.")                 ->  False

    VI SAO CAN? Vi voi cau hoi khong co dap an trong tai lieu, TU CHOI moi la
    cau tra loi dung. He thong nao cung tra loi duoc moi cau la he thong bia.
    """
    # TODO
    pass


# ===========================================================================
#  3.4 - Cham mot cau
# ===========================================================================
def cham_mot_cau(cau_tra_loi: str, cac_chunk_lay: list[str],
                 cau_vang: dict) -> dict:
    """Cham diem MOT cau hoi. Tra ve dict co cac khoa:

        recall       float  ty le trich_dan tim thay trong cac chunk lay ve
        du_tu_khoa   bool   cau tra loi chua TAT CA tu khoa bat buoc
        trich_dan_ok bool   trich dan hop le (xem kiem_tra_trich_dan)
        tu_choi      bool   cau tra loi la loi tu choi
        diem         float  diem tong, tu 0.0 den 1.0

    CACH TINH DIEM:

      Cau hoi KHONG CO dap an (cau_vang["trich_dan"] rong):
          diem = 1.0 neu tu_choi, nguoc lai 0.0
          (recall = 1.0, cac khoa khac van tinh binh thuong)

      Cau hoi CO dap an:
          0.4  neu recall == 1.0    - retrieval lay du doan can thiet
          0.4  neu du_tu_khoa       - cau tra loi noi dung y
          0.2  neu trich_dan_ok     - va co dan nguon dang hoang

    So khop trich_dan va tu khoa deu BO QUA khac biet khoang trang; tu khoa
    KHONG phan biet hoa thuong (nguoi dung viet "3 Ngày" hay "3 ngày" deu duoc),
    con trich_dan thi CO phan biet (do la doan van goc).

    So doan dung de kiem tra trich dan chinh la len(cac_chunk_lay).

    VI SAO TACH LAM BA PHAN MA KHONG CHAM DUNG/SAI?
        Vi khi diem tut, ban can biet NGA NAO hong. recall tut la loi
        retrieval (chunking, tim kiem). du_tu_khoa tut trong khi recall van
        1.0 la loi sinh cau tra loi (prompt, model). Mot con so duy nhat
        khong bao gio giup ban di sua dung cho.
    """
    # TODO
    pass


# ===========================================================================
#  3.5 - Chay ca bo test
# ===========================================================================
def chay_eval_rag(bo_test: list[dict],
                  ham_tra_loi: Callable[[str], tuple[str, list[str]]]) -> list[dict]:
    """Chay eval tren ca bo cau hoi vang.

    `ham_tra_loi(cau_hoi)` tra ve (cau_tra_loi, danh_sach_chunk_da_lay).
    Trong test ta truyen ham gia lap; trong that ta truyen he RAG that.

    Moi phan tu ket qua la dict co dung cac khoa:
        id, loai, cau_hoi, cau_tra_loi, diem, chi_tiet, loi

    `chi_tiet` la dict tu `cham_mot_cau`. `loi` la None hoac thong bao loi.

    BAT BUOC: neu `ham_tra_loi` nem exception voi MOT cau hoi thi cau do duoc
    0.0 diem, `cau_tra_loi` la chuoi rong, `chi_tiet` la dict rong, va `loi`
    chua thong bao - CAC CAU CON LAI VAN CHAY TIEP.

    VI SAO BAT BUOC? Vi eval chay 30 phut roi chet o cau thu 3 se lam ban
    ngung do luong. Va lan sau ban se "chay lai sau" - tuc la khong bao gio.
    """
    # TODO
    pass


def tong_hop(ket_qua: list[dict]) -> dict:
    """Tong hop ket qua eval. Tra ve dict:

        tong       float  diem trung binh tat ca cau (0.0 neu danh sach rong)
        so_cau     int
        so_loi     int    so cau bi exception
        theo_loai  dict   {ten_loai: diem_trung_binh}

    LUON BAO CAO theo_loai. Diem tong 0.85 co the la "moi loai deu 0.85",
    cung co the la "cac cau de duoc 1.0 va toan bo cau kho duoc 0.2".
    Hai tinh huong nay doi hoi hai hanh dong hoan toan khac nhau.
    """
    # TODO
    pass


# ===========================================================================
#  3.6 - So sanh hai cau hinh
# ===========================================================================
def so_sanh_cau_hinh(truoc: list[dict], sau: list[dict]) -> dict:
    """So sanh hai lan chay eval THEO TUNG CAU. Tra ve dict:

        diem_truoc, diem_sau   float      diem trung binh cua CAC CAU CHUNG
        cai_thien              list[str]  id cac cau co diem TANG
        thoai_lui              list[str]  id cac cau co diem GIAM
        giu_nguyen             list[str]  id cac cau khong doi

    Chi so sanh cac id XUAT HIEN O CA HAI lan chay. Thu tu trong moi danh
    sach theo thu tu id xuat hien trong `truoc`.

    ⭐ DAY LA HAM QUAN TRONG NHAT CA BAI.
       Diem trung binh tang tu 0.62 len 0.88 KHONG co nghia la deploy duoc.
       No hoan toan co the la "sua duoc 5 cau va lam hong 2 cau khac".
       Chi co so sanh theo tung cau moi cho ban thay dieu do.
    """
    # TODO
    pass
