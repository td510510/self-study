"""Cham diem ex02_api.py — Phase 10.

Can:  pip install -e ".[deploy]"
KHONG can API key: ham goi model duoc truyen vao khi tao app.
"""

from __future__ import annotations

import pytest

from tests.conftest import bao_chua_lam, nap_module

pytestmark = pytest.mark.phase10

pytest.importorskip(
    "fastapi", reason='Chua cai FastAPI. Chay:  pip install -e ".[deploy]"')
from fastapi.testclient import TestClient  # noqa: E402


@pytest.fixture(scope="module")
def ex():
    return nap_module("curriculum/10-deploy-ops/exercises/ex02_api.py")


class CauHinhGia:
    api_key = "sk-ant-api03-abcdefghijk-XYZW"
    model = "claude-haiku-4-5"
    moi_truong = "dev"
    max_token = 1024
    ngan_sach_usd = 5.0
    ghi_log_prompt = False


def san_sang_ok(cf):
    return {"san_sang": True, "chi_tiet": {"co_api_key": True}, "canh_bao": []}


def san_sang_hong(cf):
    return {"san_sang": False, "chi_tiet": {"co_api_key": False}, "canh_bao": []}


def app_mau(ex, goi_model=None, ham_san_sang=None):
    return ex.tao_app(goi_model or (lambda q, m: f"Trả lời: {q}"),
                      CauHinhGia(), ham_san_sang or san_sang_ok)


# Lop loi gia lap - dat ten GIONG HET SDK that de ban do loi khop
class RateLimitError(Exception):
    pass


class AuthenticationError(Exception):
    pass


class APIConnectionError(Exception):
    pass


class LoiLaLung(Exception):
    pass


class TestMaLoiHttp:
    def test_rate_limit_thanh_429(self, ex):
        kq = ex.ma_loi_http(RateLimitError("x"))
        assert kq is not None, bao_chua_lam("ma_loi_http")
        assert kq[0] == 429

    def test_loi_xac_thuc_cua_BAN_thanh_500(self, ex):
        """Key cua BAN sai - khong phai loi cua nguoi goi API cua ban."""
        assert ex.ma_loi_http(AuthenticationError("x"))[0] == 500

    def test_mat_ket_noi_thanh_503(self, ex):
        assert ex.ma_loi_http(APIConnectionError("x"))[0] == 503

    def test_loi_la_thanh_500_mac_dinh(self, ex):
        assert ex.ma_loi_http(LoiLaLung("x"))[0] == 500

    def test_tra_ve_ba_phan(self, ex):
        kq = ex.ma_loi_http(RateLimitError("x"))
        assert len(kq) == 3
        assert isinstance(kq[0], int)
        assert isinstance(kq[1], str)
        assert isinstance(kq[2], str)

    def test_thong_diep_khong_lo_chi_tiet_ky_thuat(self, ex):
        """Thong bao loi chi tiet la mot kenh ro ri thong tin."""
        loi = AuthenticationError("invalid x-api-key sk-ant-api03-BIMAT")
        kq = ex.ma_loi_http(loi)
        assert kq is not None, bao_chua_lam("ma_loi_http")
        assert "sk-ant" not in kq[2]
        assert "BIMAT" not in kq[2]


class TestKiemTraCauHoi:
    def test_cau_hoi_hop_le(self, ex):
        kq = ex.kiem_tra_cau_hoi("  Xin chào  ")
        assert kq is not None, bao_chua_lam("kiem_tra_cau_hoi")
        assert kq["ok"] is True
        assert kq["cau_hoi"] == "Xin chào"

    def test_cau_hoi_rong(self, ex):
        for xau in ("", "   ", "\n\t"):
            assert ex.kiem_tra_cau_hoi(xau)["ok"] is False

    def test_khong_phai_chuoi(self, ex):
        for xau in (None, 123, ["a"], {"a": 1}):
            assert ex.kiem_tra_cau_hoi(xau)["ok"] is False

    def test_qua_dai(self, ex):
        """Khong gioi han thi mot request 500.000 ky tu di thang vao API."""
        assert ex.kiem_tra_cau_hoi("x" * 3000, max_ky_tu=2000)["ok"] is False

    def test_thong_bao_qua_dai_co_ca_hai_so(self, ex):
        kq = ex.kiem_tra_cau_hoi("x" * 3000, max_ky_tu=2000)
        assert "3000" in kq["loi"] and "2000" in kq["loi"]

    def test_dung_bang_gioi_han(self, ex):
        assert ex.kiem_tra_cau_hoi("x" * 100, max_ky_tu=100)["ok"] is True


class TestDinhDangSSE:
    def test_dinh_dang_dung(self, ex):
        kq = ex.dinh_dang_sse("chu", {"text": "Xin"})
        assert kq is not None, bao_chua_lam("dinh_dang_sse")
        assert kq == 'event: chu\ndata: {"text": "Xin"}\n\n'

    def test_ket_thuc_bang_hai_xuong_dong(self, ex):
        """Thieu mot cai thi trinh duyet cho mai va man hinh trong."""
        assert ex.dinh_dang_sse("x", {"a": 1}).endswith("\n\n")

    def test_tieng_viet_khong_bi_escape(self, ex):
        kq = ex.dinh_dang_sse("chu", {"text": "Xin chào"})
        assert "Xin chào" in kq
        assert "u00e0" not in kq

    def test_du_lieu_rong(self, ex):
        assert ex.dinh_dang_sse("xong", {}) == "event: xong\ndata: {}\n\n"


class TestApp:
    def test_khoe_luon_200(self, ex):
        app = app_mau(ex)
        assert app is not None, bao_chua_lam("tao_app")
        assert TestClient(app).get("/khoe").status_code == 200

    def test_khoe_van_200_khi_chua_san_sang(self, ex):
        """/khoe sai nghia la 'khoi dong lai toi di' - dung gop voi readiness."""
        c = TestClient(app_mau(ex, ham_san_sang=san_sang_hong))
        assert c.get("/khoe").status_code == 200
        assert c.get("/san_sang").status_code == 503

    def test_san_sang_200(self, ex):
        assert TestClient(app_mau(ex)).get("/san_sang").status_code == 200

    def test_san_sang_503(self, ex):
        r = TestClient(app_mau(ex, ham_san_sang=san_sang_hong)).get("/san_sang")
        assert r.status_code == 503
        assert r.json()["san_sang"] is False

    def test_hoi_thanh_cong(self, ex):
        r = TestClient(app_mau(ex)).post("/hoi", json={"cau_hoi": "Xin chào"})
        assert r.status_code == 200
        assert r.json()["tra_loi"] == "Trả lời: Xin chào"
        assert r.json()["model"] == "claude-haiku-4-5"

    def test_hoi_truyen_dung_max_token(self, ex):
        nhan = {}

        def ghi_lai(q, m):
            nhan["max_token"] = m
            return "ok"

        c = TestClient(app_mau(ex, goi_model=ghi_lai))
        c.post("/hoi", json={"cau_hoi": "a", "max_token": 77})
        assert nhan["max_token"] == 77
        c.post("/hoi", json={"cau_hoi": "a"})
        assert nhan["max_token"] == 1024

    def test_hoi_cau_hoi_rong(self, ex):
        r = TestClient(app_mau(ex)).post("/hoi", json={"cau_hoi": "   "})
        assert r.status_code == 400
        assert set(r.json()) == {"ma_loi", "thong_diep"}

    def test_hoi_thieu_truong(self, ex):
        """FastAPI tu tra 422 cho body sai schema - do la hanh vi dung."""
        assert TestClient(app_mau(ex)).post("/hoi", json={}).status_code == 422

    def test_loi_model_thanh_ma_dung(self, ex):
        def no_ra(q, m):
            raise RateLimitError("rate limited")

        r = TestClient(app_mau(ex, goi_model=no_ra)).post("/hoi", json={"cau_hoi": "a"})
        assert r.status_code == 429
        assert r.json()["ma_loi"] == "qua_tai"

    def test_khong_lo_chi_tiet_exception_ra_ngoai(self, ex):
        def no_ra(q, m):
            raise AuthenticationError("invalid x-api-key sk-ant-api03-BIMAT")

        r = TestClient(app_mau(ex, goi_model=no_ra)).post("/hoi", json={"cau_hoi": "a"})
        assert r.status_code == 500
        assert "sk-ant" not in r.text
        assert "BIMAT" not in r.text
        assert "Traceback" not in r.text

    def test_loi_la_lung_van_tra_json_dung_dang(self, ex):
        def no_ra(q, m):
            raise LoiLaLung("gi do")

        r = TestClient(app_mau(ex, goi_model=no_ra)).post("/hoi", json={"cau_hoi": "a"})
        assert r.status_code == 500
        assert set(r.json()) == {"ma_loi", "thong_diep"}

    def test_phien_ban_khong_lo_bi_mat(self, ex):
        r = TestClient(app_mau(ex)).get("/phien_ban")
        assert r.status_code == 200
        assert "sk-ant" not in r.text
        assert "api_key" not in r.text.lower()

    def test_phien_ban_co_thong_tin_can_thiet(self, ex):
        d = TestClient(app_mau(ex)).get("/phien_ban").json()
        assert d["model"] == "claude-haiku-4-5"
        assert d["moi_truong"] == "dev"
