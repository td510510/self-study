"""Cham diem ex03_eval_rag.py — Phase 08.

KHONG can API key: `chay_eval_rag` nhan mot HAM tra loi lam tham so,
nen o day ta truyen he RAG gia lap.
"""

from __future__ import annotations

import pytest

from tests.conftest import bao_chua_lam, nap_module

pytestmark = pytest.mark.phase08


@pytest.fixture(scope="module")
def ex():
    return nap_module("curriculum/08-rag/exercises/ex03_eval_rag.py")


CAU_CO_DAP_AN = {
    "id": "phep_nam",
    "loai": "de",
    "cau_hoi": "Có bao nhiêu ngày phép năm?",
    "trich_dan": ["có 12 ngày phép năm"],
    "tu_khoa": ["12"],
}

CAU_KHONG_CO = {
    "id": "hoc_phi",
    "loai": "khong_co",
    "cau_hoi": "Công ty có hỗ trợ học phí không?",
    "trich_dan": [],
    "tu_khoa": [],
}

CHUNK_DUNG = ["Nhân viên chính thức có 12 ngày phép năm."]


class TestTaoNguCanh:
    def test_danh_so_va_ten_nguon(self, ex):
        kq = ex.tao_ngu_canh(["aaa", "bbb"], ["x.md", "y.md"])
        assert kq is not None, bao_chua_lam("tao_ngu_canh")
        assert kq == "[1] (x.md)\naaa\n\n[2] (y.md)\nbbb"

    def test_khong_co_nguon(self, ex):
        assert ex.tao_ngu_canh(["aaa", "bbb"]) == "[1]\naaa\n\n[2]\nbbb"

    def test_danh_so_bat_dau_tu_1(self, ex):
        """Danh so tu 0 khien moi trich dan cua model lech mot doan."""
        assert ex.tao_ngu_canh(["aaa"]).startswith("[1]")

    def test_danh_sach_rong(self, ex):
        assert ex.tao_ngu_canh([]) == ""

    def test_lech_so_nguon_thi_loi(self, ex):
        """Lech do dai = trich dan sai nguon mot cach co he thong."""
        with pytest.raises(ValueError):
            ex.tao_ngu_canh(["aaa", "bbb"], ["x.md"])

    def test_giu_nguyen_noi_dung_doan(self, ex):
        assert "nội dung gốc" in ex.tao_ngu_canh(["nội dung gốc"])


class TestTachTrichDan:
    def test_nhieu_trich_dan(self, ex):
        kq = ex.tach_trich_dan("Theo [1] và [3], phép năm là 12 ngày.")
        assert kq is not None, bao_chua_lam("tach_trich_dan")
        assert kq == {1, 3}

    def test_khong_co_trich_dan(self, ex):
        assert ex.tach_trich_dan("Không có trích dẫn nào.") == set()

    def test_loai_trung_lap(self, ex):
        assert ex.tach_trich_dan("[2][2][5]") == {2, 5}

    def test_bo_qua_so_khong_hop_le(self, ex):
        assert ex.tach_trich_dan("[0] và [-1]") == set()

    def test_bo_qua_chu(self, ex):
        assert ex.tach_trich_dan("[abc] [xyz]") == set()

    def test_so_nhieu_chu_so(self, ex):
        assert ex.tach_trich_dan("[12]") == {12}


class TestKiemTraTrichDan:
    def test_hop_le(self, ex):
        kq = ex.kiem_tra_trich_dan("Theo [2], phép năm là 12 ngày.", 3)
        assert kq is not None, bao_chua_lam("kiem_tra_trich_dan")
        assert kq["co_trich_dan"] is True
        assert kq["ngoai_pham_vi"] == set()
        assert kq["hop_le"] is True

    def test_bat_trich_dan_bia_ra(self, ex):
        """[5] khi chi co 3 doan: dang bia dat nguy hiem nhat vi trong dang tin."""
        kq = ex.kiem_tra_trich_dan("Theo [1] và [5]...", 3)
        assert kq["ngoai_pham_vi"] == {5}
        assert kq["hop_le"] is False

    def test_khong_trich_dan_thi_khong_hop_le(self, ex):
        kq = ex.kiem_tra_trich_dan("Phép năm 12 ngày.", 3)
        assert kq["co_trich_dan"] is False
        assert kq["hop_le"] is False

    def test_trich_dan_bang_dung_so_doan(self, ex):
        assert ex.kiem_tra_trich_dan("Theo [3]...", 3)["hop_le"] is True

    def test_khong_co_doan_nao(self, ex):
        assert ex.kiem_tra_trich_dan("Theo [1]...", 0)["ngoai_pham_vi"] == {1}


class TestLaTuChoi:
    def test_nhan_ra_tu_choi(self, ex):
        kq = ex.la_tu_choi("Tài liệu không đề cập đến việc này.")
        assert kq is not None, bao_chua_lam("la_tu_choi")
        assert kq is True

    def test_khong_phai_tu_choi(self, ex):
        assert ex.la_tu_choi("Phép năm là 12 ngày.") is False

    def test_khong_phan_biet_hoa_thuong(self, ex):
        assert ex.la_tu_choi("KHÔNG TÌM THẤY thông tin.") is True

    def test_nhieu_cum_khac_nhau(self, ex):
        assert ex.la_tu_choi("Trong tài liệu không có thông tin về việc này.") is True


class TestChamMotCau:
    def test_diem_tuyet_doi(self, ex):
        kq = ex.cham_mot_cau("Theo [1], phép năm là 12 ngày.", CHUNK_DUNG, CAU_CO_DAP_AN)
        assert kq is not None, bao_chua_lam("cham_mot_cau")
        assert kq["diem"] == pytest.approx(1.0)

    def test_recall_0_khi_lay_nham_doan(self, ex):
        kq = ex.cham_mot_cau("Theo [1], phép năm là 12 ngày.",
                             ["Lương trả ngày 5 hàng tháng."], CAU_CO_DAP_AN)
        assert kq["recall"] == 0.0
        assert kq["diem"] == pytest.approx(0.6)

    def test_thieu_tu_khoa(self, ex):
        kq = ex.cham_mot_cau("Theo [1], bạn có một số ngày phép.",
                             CHUNK_DUNG, CAU_CO_DAP_AN)
        assert kq["du_tu_khoa"] is False
        assert kq["diem"] == pytest.approx(0.6)

    def test_khong_trich_dan_mat_diem(self, ex):
        kq = ex.cham_mot_cau("Phép năm là 12 ngày.", CHUNK_DUNG, CAU_CO_DAP_AN)
        assert kq["trich_dan_ok"] is False
        assert kq["diem"] == pytest.approx(0.8)

    def test_bo_qua_khoang_trang_khi_do_recall(self, ex):
        """Tai lieu that xuong dong giua chung - case hay gap nhat."""
        kq = ex.cham_mot_cau("Theo [1], 12 ngày.",
                             ["Nhân viên chính thức\ncó 12  ngày phép năm."],
                             CAU_CO_DAP_AN)
        assert kq["recall"] == 1.0

    def test_tu_khoa_khong_phan_biet_hoa_thuong(self, ex):
        cau = dict(CAU_CO_DAP_AN, tu_khoa=["12 Ngày"])
        kq = ex.cham_mot_cau("Theo [1], phép năm là 12 ngày.", CHUNK_DUNG, cau)
        assert kq["du_tu_khoa"] is True

    def test_recall_mot_nua_khong_duoc_diem(self, ex):
        """Lay duoc mot nua nghia la cau tra loi se THIEU mot nua."""
        cau = dict(CAU_CO_DAP_AN, trich_dan=["có 12 ngày phép năm", "đăng xuất"])
        kq = ex.cham_mot_cau("Theo [1], 12 ngày.", CHUNK_DUNG, cau)
        assert kq["recall"] == pytest.approx(0.5)
        assert kq["diem"] == pytest.approx(0.6)

    def test_cau_khong_co_dap_an_tu_choi_dung(self, ex):
        kq = ex.cham_mot_cau("Tài liệu không đề cập đến học phí.",
                             ["Phụ cấp đi lại 500.000 đồng."], CAU_KHONG_CO)
        assert kq["tu_choi"] is True
        assert kq["diem"] == pytest.approx(1.0)

    def test_cau_khong_co_dap_an_ma_bia_ra(self, ex):
        """Tra loi tron tru cho cau khong co dap an = BIA. Phai 0 diem."""
        kq = ex.cham_mot_cau("Có, công ty hỗ trợ 5 triệu mỗi năm [1].",
                             ["Phụ cấp đi lại 500.000 đồng."], CAU_KHONG_CO)
        assert kq["diem"] == 0.0

    def test_cau_khong_co_dap_an_recall_la_1(self, ex):
        kq = ex.cham_mot_cau("Không tìm thấy.", ["abc"], CAU_KHONG_CO)
        assert kq["recall"] == 1.0

    def test_du_khoa(self, ex):
        kq = ex.cham_mot_cau("Theo [1], 12 ngày.", CHUNK_DUNG, CAU_CO_DAP_AN)
        for khoa in ("recall", "du_tu_khoa", "trich_dan_ok", "tu_choi", "diem"):
            assert khoa in kq, f"Thieu khoa {khoa!r}"

    def test_diem_luon_trong_khoang_0_1(self, ex):
        for tl in ["", "Theo [9] thì 12 ngày.", "Không tìm thấy.", "12 ngày [1]."]:
            d = ex.cham_mot_cau(tl, CHUNK_DUNG, CAU_CO_DAP_AN)["diem"]
            assert 0.0 <= d <= 1.0


def _tra_loi_hoan_hao(cau_hoi: str) -> tuple[str, list[str]]:
    if "học phí" in cau_hoi:
        return ("Tài liệu không đề cập đến việc này.", ["Phụ cấp đi lại."])
    return ("Theo [1], phép năm là 12 ngày.", CHUNK_DUNG)


def _tra_loi_hong(cau_hoi: str) -> tuple[str, list[str]]:
    raise RuntimeError("mat ket noi vector DB")


class TestChayEvalRag:
    BO_TEST = [CAU_CO_DAP_AN, CAU_KHONG_CO]

    def test_chay_het_bo_test(self, ex):
        kq = ex.chay_eval_rag(self.BO_TEST, _tra_loi_hoan_hao)
        assert kq is not None, bao_chua_lam("chay_eval_rag")
        assert len(kq) == 2

    def test_diem_dung(self, ex):
        kq = ex.chay_eval_rag(self.BO_TEST, _tra_loi_hoan_hao)
        assert all(r["diem"] == pytest.approx(1.0) for r in kq)

    def test_giu_dung_thu_tu_va_id(self, ex):
        kq = ex.chay_eval_rag(self.BO_TEST, _tra_loi_hoan_hao)
        assert [r["id"] for r in kq] == ["phep_nam", "hoc_phi"]

    def test_du_khoa(self, ex):
        r = ex.chay_eval_rag(self.BO_TEST, _tra_loi_hoan_hao)[0]
        for khoa in ("id", "loai", "cau_hoi", "cau_tra_loi", "diem", "chi_tiet", "loi"):
            assert khoa in r, f"Thieu khoa {khoa!r}"

    def test_loi_khong_lam_dung_ca_bo(self, ex):
        """Eval chet giua chung -> ban ngung do luong. Do la ket cuc toi te nhat."""
        kq = ex.chay_eval_rag(self.BO_TEST, _tra_loi_hong)
        assert len(kq) == 2
        assert all(r["diem"] == 0.0 for r in kq)
        assert all(r["loi"] for r in kq)

    def test_loi_co_ten_exception(self, ex):
        kq = ex.chay_eval_rag(self.BO_TEST, _tra_loi_hong)
        assert "RuntimeError" in kq[0]["loi"]

    def test_chi_mot_cau_loi(self, ex):
        def mot_cau_hong(cau_hoi):
            if "học phí" in cau_hoi:
                raise ValueError("hong")
            return _tra_loi_hoan_hao(cau_hoi)

        kq = ex.chay_eval_rag(self.BO_TEST, mot_cau_hong)
        assert kq[0]["diem"] == pytest.approx(1.0) and kq[0]["loi"] is None
        assert kq[1]["diem"] == 0.0 and kq[1]["loi"]

    def test_bo_test_rong(self, ex):
        assert ex.chay_eval_rag([], _tra_loi_hoan_hao) == []


def _kq(cap: list[tuple[str, str, float]]) -> list[dict]:
    """Tao nhanh ket qua eval gia: [(id, loai, diem), ...]."""
    return [{"id": i, "loai": l, "cau_hoi": "?", "cau_tra_loi": "",
             "diem": d, "chi_tiet": {}, "loi": None} for i, l, d in cap]


class TestTongHop:
    def test_diem_trung_binh(self, ex):
        kq = ex.tong_hop(_kq([("a", "de", 1.0), ("b", "de", 0.0)]))
        assert kq is not None, bao_chua_lam("tong_hop")
        assert kq["tong"] == pytest.approx(0.5)
        assert kq["so_cau"] == 2

    def test_theo_loai(self, ex):
        kq = ex.tong_hop(_kq([("a", "de", 1.0), ("b", "kho", 0.2), ("c", "kho", 0.4)]))
        assert kq["theo_loai"]["de"] == pytest.approx(1.0)
        assert kq["theo_loai"]["kho"] == pytest.approx(0.3)

    def test_diem_tong_giau_su_that(self, ex):
        """0.85 co the la 'deu 0.85', cung co the la 'de=1.0, kho=0.2'."""
        kq = ex.tong_hop(_kq([("a", "de", 1.0), ("b", "de", 1.0),
                              ("c", "kho", 0.2), ("d", "kho", 0.2)]))
        assert kq["tong"] == pytest.approx(0.6)
        assert kq["theo_loai"]["kho"] == pytest.approx(0.2)

    def test_dem_so_loi(self, ex):
        r = _kq([("a", "de", 1.0), ("b", "de", 0.0)])
        r[1]["loi"] = "RuntimeError: x"
        assert ex.tong_hop(r)["so_loi"] == 1

    def test_danh_sach_rong(self, ex):
        kq = ex.tong_hop([])
        assert kq["tong"] == 0.0
        assert kq["so_cau"] == 0
        assert kq["theo_loai"] == {}


class TestSoSanhCauHinh:
    def test_phat_hien_cai_thien(self, ex):
        kq = ex.so_sanh_cau_hinh(_kq([("a", "de", 0.2)]), _kq([("a", "de", 1.0)]))
        assert kq is not None, bao_chua_lam("so_sanh_cau_hinh")
        assert kq["cai_thien"] == ["a"]
        assert kq["thoai_lui"] == []

    def test_phat_hien_thoai_lui(self, ex):
        kq = ex.so_sanh_cau_hinh(_kq([("a", "de", 1.0)]), _kq([("a", "de", 0.0)]))
        assert kq["thoai_lui"] == ["a"]

    def test_giu_nguyen(self, ex):
        kq = ex.so_sanh_cau_hinh(_kq([("a", "de", 0.6)]), _kq([("a", "de", 0.6)]))
        assert kq["giu_nguyen"] == ["a"]
        assert kq["cai_thien"] == [] and kq["thoai_lui"] == []

    def test_diem_tang_ma_van_co_thoai_lui(self, ex):
        """⭐ Case quan trong nhat: trung binh TANG trong khi 1 cau HONG."""
        truoc = _kq([("a", "de", 1.0), ("b", "kho", 0.0), ("c", "kho", 0.0)])
        sau = _kq([("a", "de", 0.0), ("b", "kho", 1.0), ("c", "kho", 1.0)])
        kq = ex.so_sanh_cau_hinh(truoc, sau)
        assert kq["diem_sau"] > kq["diem_truoc"]
        assert kq["thoai_lui"] == ["a"]

    def test_diem_truoc_sau(self, ex):
        kq = ex.so_sanh_cau_hinh(_kq([("a", "de", 0.0), ("b", "de", 1.0)]),
                                 _kq([("a", "de", 1.0), ("b", "de", 1.0)]))
        assert kq["diem_truoc"] == pytest.approx(0.5)
        assert kq["diem_sau"] == pytest.approx(1.0)

    def test_bo_qua_id_chi_co_o_mot_ben(self, ex):
        """Them cau hoi moi lam doi diem trung binh - nhung khong phai do he thong."""
        kq = ex.so_sanh_cau_hinh(_kq([("a", "de", 1.0)]),
                                 _kq([("a", "de", 1.0), ("moi", "de", 0.0)]))
        assert kq["giu_nguyen"] == ["a"]
        assert kq["diem_sau"] == pytest.approx(1.0)

    def test_thu_tu_theo_lan_truoc(self, ex):
        truoc = _kq([("z", "de", 0.0), ("a", "de", 0.0)])
        sau = _kq([("a", "de", 1.0), ("z", "de", 1.0)])
        assert ex.so_sanh_cau_hinh(truoc, sau)["cai_thien"] == ["z", "a"]

    def test_khong_co_id_chung(self, ex):
        kq = ex.so_sanh_cau_hinh(_kq([("a", "de", 1.0)]), _kq([("b", "de", 1.0)]))
        assert kq["cai_thien"] == [] and kq["thoai_lui"] == []
        assert kq["diem_truoc"] == 0.0 and kq["diem_sau"] == 0.0
