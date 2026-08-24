"""Cham diem ex03_lam_sach.py — Phase 03."""

from __future__ import annotations

import numpy as np
import pandas as pd
import pytest

from tests.conftest import bao_chua_lam, nap_module

pytestmark = pytest.mark.phase03


@pytest.fixture(scope="module")
def ex():
    return nap_module("curriculum/03-data-toolkit/exercises/ex03_lam_sach.py")


class TestChuanHoaThanhPho:
    def test_co_ket_qua(self, ex):
        kq = ex.chuan_hoa_thanh_pho(pd.Series(["HN"]))
        assert kq is not None, bao_chua_lam("chuan_hoa_thanh_pho")

    def test_vi_du_day_du(self, ex):
        s = pd.Series(["HN", " ha noi ", "SG", "Hue", None])
        assert list(ex.chuan_hoa_thanh_pho(s)) == [
            "Ha Noi", "Ha Noi", "TP HCM", "Khac", "Khong ro",
        ]

    def test_bo_khoang_trang(self, ex):
        assert ex.chuan_hoa_thanh_pho(pd.Series(["  HCM  "])).iloc[0] == "TP HCM"

    def test_khong_phan_biet_hoa_thuong(self, ex):
        s = pd.Series(["HN", "hn", "Hn", "HA NOI", "ha noi"])
        assert set(ex.chuan_hoa_thanh_pho(s)) == {"Ha Noi"}

    def test_gia_tri_la_thanh_khac(self, ex):
        assert ex.chuan_hoa_thanh_pho(pd.Series(["Hue", "Vinh"])).tolist() == ["Khac", "Khac"]

    def test_phan_biet_thieu_va_la(self, ex):
        """NaN goc -> 'Khong ro', gia tri la -> 'Khac'. Hai thu KHAC nhau."""
        s = pd.Series([None, "Hue"])
        kq = list(ex.chuan_hoa_thanh_pho(s))
        assert kq == ["Khong ro", "Khac"]

    def test_khong_con_gia_tri_thieu(self, ex):
        kq = ex.chuan_hoa_thanh_pho(pd.Series(["HN", None, "xyz"]))
        assert kq.isna().sum() == 0


class TestDoiSangSo:
    def test_dau_cham_phan_cach(self, ex):
        assert ex.doi_sang_so(pd.Series(["1.200.000"])).iloc[0] == 1_200_000

    def test_dau_phay_phan_cach(self, ex):
        assert ex.doi_sang_so(pd.Series(["1,200,000"])).iloc[0] == 1_200_000

    def test_khoang_trang(self, ex):
        assert ex.doi_sang_so(pd.Series([" 5000 "])).iloc[0] == 5000

    def test_von_da_la_so(self, ex):
        assert ex.doi_sang_so(pd.Series([1_200_000])).iloc[0] == 1_200_000

    def test_gia_tri_hong_thanh_nan(self, ex):
        kq = ex.doi_sang_so(pd.Series(["abc", ""]))
        assert kq.isna().all(), "Gia tri khong doi duoc phai thanh NaN, khong duoc nem loi"

    def test_kieu_float(self, ex):
        kq = ex.doi_sang_so(pd.Series(["100", "200"]))
        assert pd.api.types.is_numeric_dtype(kq)

    def test_hon_hop(self, ex):
        s = pd.Series(["1.200.000", 5000, "abc", " 300 "])
        kq = ex.doi_sang_so(s)
        assert kq.iloc[0] == 1_200_000
        assert kq.iloc[1] == 5000
        assert pd.isna(kq.iloc[2])
        assert kq.iloc[3] == 300


class TestDoiSangNgay:
    def test_ba_dinh_dang(self, ex):
        s = pd.Series(["2025-03-15", "15/03/2025", "03-15-2025"])
        kq = ex.doi_sang_ngay(s)
        assert (kq == pd.Timestamp("2025-03-15")).all(), (
            "Ca ba dinh dang deu phai ra ngay 15/03/2025"
        )

    def test_gia_tri_hong_thanh_nat(self, ex):
        kq = ex.doi_sang_ngay(pd.Series(["khong phai ngay"]))
        assert pd.isna(kq.iloc[0])

    def test_kieu_datetime(self, ex):
        kq = ex.doi_sang_ngay(pd.Series(["2025-01-01"]))
        assert pd.api.types.is_datetime64_any_dtype(kq)

    def test_dung_duoc_thuoc_tinh_dt(self, ex):
        """Doi xong phai dung duoc .dt.month, .dt.year..."""
        kq = ex.doi_sang_ngay(pd.Series(["2025-03-15", "20/07/2025"]))
        assert list(kq.dt.month) == [3, 7]

    def test_hon_hop_co_gia_tri_hong(self, ex):
        s = pd.Series(["2025-01-01", "hong", "31/12/2025"])
        kq = ex.doi_sang_ngay(s)
        assert kq.iloc[0] == pd.Timestamp("2025-01-01")
        assert pd.isna(kq.iloc[1])
        assert kq.iloc[2] == pd.Timestamp("2025-12-31")


class TestLocDongHopLe:
    @pytest.fixture
    def df(self):
        return pd.DataFrame(
            {
                "so_luong": [1.0, -2.0, np.nan, 3.0, 5.0],
                "don_gia": [10.0, 10.0, 10.0, 0.0, 20.0],
            }
        )

    def test_loc_dung(self, ex, df):
        kq = ex.loc_dong_hop_le(df)
        assert len(kq) == 2
        assert list(kq["so_luong"]) == [1.0, 5.0]

    def test_loai_so_luong_am(self, ex, df):
        assert (ex.loc_dong_hop_le(df)["so_luong"] > 0).all()

    def test_loai_don_gia_khong(self, ex, df):
        assert (ex.loc_dong_hop_le(df)["don_gia"] > 0).all()

    def test_loai_nan(self, ex, df):
        assert ex.loc_dong_hop_le(df)["so_luong"].isna().sum() == 0

    def test_index_danh_so_lai(self, ex, df):
        assert list(ex.loc_dong_hop_le(df).index) == [0, 1]


class TestBoTrungLap:
    def test_trung_toan_bo(self, ex):
        df = pd.DataFrame({"a": [1, 1, 2], "b": ["x", "x", "y"]})
        sach, so = ex.bo_trung_lap(df)
        assert so == 1
        assert len(sach) == 2

    def test_trung_theo_khoa(self, ex):
        df = pd.DataFrame({"id": ["A", "A", "B"], "gia": [10, 99, 20]})
        sach, so = ex.bo_trung_lap(df, cot_khoa="id")
        assert so == 1
        assert len(sach) == 2

    def test_giu_ban_dau_tien(self, ex):
        df = pd.DataFrame({"id": ["A", "A"], "gia": [10, 99]})
        sach, _ = ex.bo_trung_lap(df, cot_khoa="id")
        assert sach.iloc[0]["gia"] == 10, "Phai giu ban XUAT HIEN DAU TIEN"

    def test_khong_co_trung(self, ex):
        df = pd.DataFrame({"a": [1, 2, 3]})
        sach, so = ex.bo_trung_lap(df)
        assert so == 0 and len(sach) == 3

    def test_index_danh_so_lai(self, ex):
        df = pd.DataFrame({"a": [1, 1, 2, 3]})
        sach, _ = ex.bo_trung_lap(df)
        assert list(sach.index) == [0, 1, 2]


class TestDienTheoNhom:
    def test_dien_bang_median_nhom(self, ex):
        df = pd.DataFrame(
            {"dm": ["A", "A", "A", "B"], "gia": [100.0, np.nan, 200.0, 500.0]}
        )
        assert list(ex.dien_theo_nhom(df, "gia", "dm")) == [100.0, 150.0, 200.0, 500.0]

    def test_khong_con_nan(self, ex):
        df = pd.DataFrame({"dm": ["A", "B"], "gia": [np.nan, 100.0]})
        assert ex.dien_theo_nhom(df, "gia", "dm").isna().sum() == 0

    def test_ca_nhom_deu_thieu_dung_median_toan_cuc(self, ex):
        df = pd.DataFrame(
            {"dm": ["A", "A", "B", "B"], "gia": [np.nan, np.nan, 100.0, 200.0]}
        )
        kq = ex.dien_theo_nhom(df, "gia", "dm")
        assert kq.iloc[0] == 150.0, "Nhom A deu thieu -> dung median toan cuc (150)"

    def test_toan_bo_thieu_dien_0(self, ex):
        df = pd.DataFrame({"dm": ["A", "B"], "gia": [np.nan, np.nan]})
        assert list(ex.dien_theo_nhom(df, "gia", "dm")) == [0.0, 0.0]

    def test_giu_nguyen_gia_tri_co_san(self, ex):
        df = pd.DataFrame({"dm": ["A", "A"], "gia": [10.0, 20.0]})
        assert list(ex.dien_theo_nhom(df, "gia", "dm")) == [10.0, 20.0]

    def test_cung_do_dai(self, ex):
        df = pd.DataFrame({"dm": ["A"] * 5, "gia": [1.0, np.nan, 3.0, np.nan, 5.0]})
        assert len(ex.dien_theo_nhom(df, "gia", "dm")) == 5


class TestBaoCaoChatLuong:
    @pytest.fixture
    def df(self):
        return pd.DataFrame(
            {
                "a": [1.0, 2.0, np.nan],
                "b": ["x", "y", "z"],
                "c": [1, 1, 1],
            }
        )

    def test_dung_cot(self, ex, df):
        kq = ex.bao_cao_chat_luong(df)
        assert list(kq.columns) == [
            "cot", "kieu", "so_thieu", "ty_le_thieu", "so_gia_tri",
        ]

    def test_moi_cot_mot_dong(self, ex, df):
        assert len(ex.bao_cao_chat_luong(df)) == 3

    def test_dem_thieu_dung(self, ex, df):
        kq = ex.bao_cao_chat_luong(df).set_index("cot")
        assert kq.loc["a", "so_thieu"] == 1
        assert kq.loc["b", "so_thieu"] == 0

    def test_ty_le_thieu(self, ex, df):
        kq = ex.bao_cao_chat_luong(df).set_index("cot")
        assert abs(kq.loc["a", "ty_le_thieu"] - 0.3333) < 1e-4

    def test_so_gia_tri_khac_nhau(self, ex, df):
        kq = ex.bao_cao_chat_luong(df).set_index("cot")
        assert kq.loc["c", "so_gia_tri"] == 1, "Cot hang so co dung 1 gia tri"
        assert kq.loc["b", "so_gia_tri"] == 3

    def test_sap_giam_dan_theo_ty_le_thieu(self, ex, df):
        kq = ex.bao_cao_chat_luong(df)
        assert kq.iloc[0]["cot"] == "a", "Cot thieu nhieu nhat phai dung dau"

    def test_kieu_la_chuoi(self, ex, df):
        kq = ex.bao_cao_chat_luong(df)
        assert all(isinstance(v, str) for v in kq["kieu"])
