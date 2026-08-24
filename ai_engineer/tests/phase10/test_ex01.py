"""Cham diem ex01_cau_hinh_bao_mat.py — Phase 10. KHONG can API key."""

from __future__ import annotations

import pytest

from tests.conftest import bao_chua_lam, nap_module

pytestmark = pytest.mark.phase10

KEY = "sk-ant-api03-VIDU-khong-that-XYZW"


@pytest.fixture(scope="module")
def ex():
    return nap_module("curriculum/10-deploy-ops/exercises/ex01_cau_hinh_bao_mat.py")


def mt(**them):
    moi_truong = {"ANTHROPIC_API_KEY": KEY}
    moi_truong.update(them)
    return moi_truong


class TestDocCauHinh:
    def test_gia_tri_mac_dinh(self, ex):
        c = ex.doc_cau_hinh(mt())
        assert c is not None, bao_chua_lam("doc_cau_hinh")
        assert c.api_key == KEY
        assert c.model == "claude-haiku-4-5"
        assert c.moi_truong == "dev"
        assert c.max_token == 1024
        assert c.ngan_sach_usd == 5.0
        assert c.ghi_log_prompt is False

    def test_doc_gia_tri_tuy_chinh(self, ex):
        c = ex.doc_cau_hinh(mt(MODEL="claude-opus-5", MOI_TRUONG="prod",
                               MAX_TOKEN="4096", NGAN_SACH_USD="20"))
        assert c.model == "claude-opus-5"
        assert c.moi_truong == "prod"
        assert c.max_token == 4096
        assert c.ngan_sach_usd == 20.0

    def test_thieu_api_key(self, ex):
        with pytest.raises(ValueError) as e:
            ex.doc_cau_hinh({})
        assert "ANTHROPIC_API_KEY" in str(e.value)

    def test_api_key_rong(self, ex):
        with pytest.raises(ValueError):
            ex.doc_cau_hinh({"ANTHROPIC_API_KEY": ""})

    def test_moi_truong_khong_hop_le(self, ex):
        with pytest.raises(ValueError):
            ex.doc_cau_hinh(mt(MOI_TRUONG="staging"))

    def test_max_token_khong_hop_le(self, ex):
        for xau in ("abc", "0", "-5", ""):
            with pytest.raises(ValueError):
                ex.doc_cau_hinh(mt(MAX_TOKEN=xau))

    def test_ngan_sach_khong_hop_le(self, ex):
        for xau in ("abc", "0", "-1"):
            with pytest.raises(ValueError):
                ex.doc_cau_hinh(mt(NGAN_SACH_USD=xau))

    def test_doc_bool_linh_hoat(self, ex):
        for gt in ("true", "TRUE", "1", "yes", "Yes"):
            assert ex.doc_cau_hinh(mt(GHI_LOG_PROMPT=gt)).ghi_log_prompt is True
        for gt in ("false", "0", "no", "", "bat_ky"):
            assert ex.doc_cau_hinh(mt(GHI_LOG_PROMPT=gt)).ghi_log_prompt is False

    def test_prod_khong_duoc_ghi_log_prompt(self, ex):
        """Prompt chua du lieu nguoi dung - cach chac chan nhat la khong khoi dong."""
        with pytest.raises(ValueError):
            ex.doc_cau_hinh(mt(MOI_TRUONG="prod", GHI_LOG_PROMPT="true"))

    def test_dev_duoc_ghi_log_prompt(self, ex):
        assert ex.doc_cau_hinh(mt(GHI_LOG_PROMPT="true")).ghi_log_prompt is True

    def test_cau_hinh_khong_sua_duoc(self, ex):
        """frozen=True: khong ai doi duoc cau hinh giua chung."""
        c = ex.doc_cau_hinh(mt())
        assert c is not None, bao_chua_lam("doc_cau_hinh")
        with pytest.raises(Exception):
            c.model = "claude-opus-5"


class TestCheSecret:
    def test_che_phan_giua(self, ex):
        kq = ex.che_secret(KEY)
        assert kq is not None, bao_chua_lam("che_secret")
        assert kq == "sk-ant-...XYZW"

    def test_khong_lo_phan_giua(self, ex):
        assert "abcdefghijklmnop" not in ex.che_secret(KEY)

    def test_chuoi_ngan_che_het(self, ex):
        """Chuoi ngan ma van giu 7 dau + 4 cuoi la in gan het ra log."""
        assert ex.che_secret("short") == "***"
        assert ex.che_secret("sk-ant-XYZW") == "***"

    def test_chuoi_rong(self, ex):
        assert ex.che_secret("") == "***"

    def test_khong_phai_chuoi(self, ex):
        for gt in (None, 12345, ["a"]):
            assert ex.che_secret(gt) == "***"

    def test_tham_so_tuy_chinh(self, ex):
        assert ex.che_secret("abcdefghijklmnop", giu_dau=2, giu_cuoi=2) == "ab...op"


class TestLocBanGhi:
    def test_che_truong_bi_mat(self, ex):
        kq = ex.loc_ban_ghi({"user": "an", "api_key": KEY})
        assert kq is not None, bao_chua_lam("loc_ban_ghi")
        assert kq["user"] == "an"
        assert kq["api_key"] == "sk-ant-...XYZW"

    def test_khop_khong_phan_biet_hoa_thuong(self, ex):
        kq = ex.loc_ban_ghi({"API_KEY": KEY, "Authorization": "Bearer abcdefghijkl"})
        assert kq is not None, bao_chua_lam("loc_ban_ghi")
        assert set(kq) == {"API_KEY", "Authorization"}
        assert KEY not in str(kq)
        assert "abcdefghijkl" not in str(kq)

    def test_khop_ten_truong_co_chua_tu_khoa(self, ex):
        """'anthropic_api_key' chua 'api_key' - phai bat duoc."""
        kq = ex.loc_ban_ghi({"anthropic_api_key": KEY})
        assert kq["anthropic_api_key"] == "sk-ant-...XYZW"

    def test_de_quy_trong_dict(self, ex):
        """Thuc te key nam sau vai tang, khong phai o tang dau."""
        kq = ex.loc_ban_ghi({"cfg": {"client": {"api_key": KEY}}})
        assert kq is not None, bao_chua_lam("loc_ban_ghi")
        assert kq["cfg"]["client"]["api_key"] == "sk-ant-...XYZW"

    def test_de_quy_trong_list(self, ex):
        kq = ex.loc_ban_ghi({"ds": [{"token": "abcdefghijklmnop"}, {"x": 1}]})
        assert "abcdefghijklmnop" not in str(kq)
        assert kq["ds"][1]["x"] == 1

    def test_truong_bi_mat_khong_phai_chuoi(self, ex):
        kq = ex.loc_ban_ghi({"secret": {"nested": "gi do"}})
        assert kq["secret"] == "***"

    def test_khong_sua_ban_ghi_goc(self, ex):
        goc = {"api_key": KEY}
        moi = ex.loc_ban_ghi(goc)
        assert moi["api_key"] == "sk-ant-...XYZW"
        assert goc["api_key"] == KEY

    def test_giu_nguyen_truong_thuong(self, ex):
        kq = ex.loc_ban_ghi({"do_tre_ms": 210, "model": "claude-haiku-4-5"})
        assert kq == {"do_tre_ms": 210, "model": "claude-haiku-4-5"}


class TestKiemTraSanSang:
    def test_cau_hinh_tot(self, ex):
        kq = ex.kiem_tra_san_sang(ex.doc_cau_hinh(mt()))
        assert kq is not None, bao_chua_lam("kiem_tra_san_sang")
        assert kq["san_sang"] is True
        assert kq["canh_bao"] == []

    def test_du_khoa_chi_tiet(self, ex):
        kq = ex.kiem_tra_san_sang(ex.doc_cau_hinh(mt()))
        for khoa in ("co_api_key", "key_dung_dang", "model_hop_le", "ngan_sach_duong"):
            assert khoa in kq["chi_tiet"], f"Thieu muc kiem tra {khoa!r}"

    def test_key_sai_dang(self, ex):
        kq = ex.kiem_tra_san_sang(
            ex.doc_cau_hinh({"ANTHROPIC_API_KEY": "khong-phai-key-anthropic"}))
        assert kq["chi_tiet"]["key_dung_dang"] is False
        assert kq["san_sang"] is False

    def test_model_khong_hop_le(self, ex):
        kq = ex.kiem_tra_san_sang(ex.doc_cau_hinh(mt(MODEL="claude-haiku-4-5-20251001")))
        assert kq["chi_tiet"]["model_hop_le"] is False
        assert kq["san_sang"] is False

    def test_canh_bao_KHONG_lam_mat_san_sang(self, ex):
        """Tron canh bao voi khong-san-sang tao ra he thong hoac qua nhay hoac qua diec."""
        kq = ex.kiem_tra_san_sang(
            ex.doc_cau_hinh(mt(MOI_TRUONG="prod", NGAN_SACH_USD="500")))
        assert kq["san_sang"] is True
        assert len(kq["canh_bao"]) == 1

    def test_canh_bao_ghi_log_prompt_o_dev(self, ex):
        kq = ex.kiem_tra_san_sang(ex.doc_cau_hinh(mt(GHI_LOG_PROMPT="true")))
        assert kq["san_sang"] is True
        assert any("log" in c.lower() for c in kq["canh_bao"])
