"""Cham diem ex02_pandas.py — Phase 03."""

from __future__ import annotations

import numpy as np
import pandas as pd
import pytest

from tests.conftest import bao_chua_lam, nap_module

pytestmark = pytest.mark.phase03


@pytest.fixture(scope="module")
def ex():
    return nap_module("curriculum/03-data-toolkit/exercises/ex02_pandas.py")


@pytest.fixture
def df():
    return pd.DataFrame(
        {
            "don_id": ["D1", "D2", "D3", "D4"],
            "khach_id": ["K1", "K2", "K1", "K3"],
            "so_luong": [1, 2, 1, 3],
            "don_gia": [100, 200, 300, 100],
            "giam_gia": [0.0, 0.1, 0.0, 0.2],
            "kenh": ["App", "Website", "App", "Shopee"],
        }
    )


@pytest.fixture
def df_tt(ex, df):
    """DataFrame da co cot thanh_tien: [100, 360, 300, 240]."""
    kq = ex.them_thanh_tien(df)
    if kq is None:
        pytest.skip("them_thanh_tien chua duoc lam")
    return kq


class TestTomTat:
    def test_co_ket_qua(self, ex, df):
        assert ex.tom_tat(df) is not None, bao_chua_lam("tom_tat")

    def test_du_khoa(self, ex, df):
        assert set(ex.tom_tat(df)) == {
            "so_dong", "so_cot", "so_trung_lap", "cot_thieu", "kieu_du_lieu",
        }

    def test_kich_thuoc(self, ex, df):
        kq = ex.tom_tat(df)
        assert kq["so_dong"] == 4
        assert kq["so_cot"] == 6

    def test_khong_co_thieu(self, ex, df):
        assert ex.tom_tat(df)["cot_thieu"] == {}, (
            "cot_thieu chi liet ke cac cot CO o thieu"
        )

    def test_co_thieu(self, ex):
        d = pd.DataFrame({"a": [1.0, np.nan, np.nan], "b": [1, 2, 3]})
        kq = ex.tom_tat(d)
        assert kq["cot_thieu"] == {"a": 2}

    def test_trung_lap(self, ex):
        d = pd.DataFrame({"a": [1, 1, 2], "b": ["x", "x", "y"]})
        assert ex.tom_tat(d)["so_trung_lap"] == 1

    def test_kieu_du_lieu_la_chuoi(self, ex, df):
        kq = ex.tom_tat(df)
        assert all(isinstance(v, str) for v in kq["kieu_du_lieu"].values()), (
            "Ten kieu phai la CHUOI (dung str(...))"
        )


class TestThemThanhTien:
    def test_tinh_dung(self, ex, df):
        assert list(ex.them_thanh_tien(df)["thanh_tien"]) == [100, 360, 300, 240]

    def test_khong_sua_df_goc(self, ex, df):
        ex.them_thanh_tien(df)
        assert "thanh_tien" not in df.columns, "Ham da sua df goc! Nho dung .copy()"

    def test_giu_cac_cot_cu(self, ex, df):
        kq = ex.them_thanh_tien(df)
        assert set(df.columns).issubset(set(kq.columns))

    def test_kieu_int(self, ex, df):
        kq = ex.them_thanh_tien(df)
        assert pd.api.types.is_integer_dtype(kq["thanh_tien"]), "thanh_tien phai la kieu int"

    def test_lam_tron_khong_cat(self, ex):
        d = pd.DataFrame({"so_luong": [1], "don_gia": [100], "giam_gia": [0.005]})
        # 100 * 0.995 = 99.5 -> round() ra 100, astype(int) thang ra 99
        assert ex.them_thanh_tien(d)["thanh_tien"].iloc[0] == 100, (
            "Phai .round() TRUOC khi .astype(int) - astype cat phan thap phan"
        )


class TestLocDonHang:
    def test_loc_dung(self, ex, df_tt):
        kq = ex.loc_don_hang(df_tt, 200, ["App", "Shopee"])
        assert list(kq["don_id"]) == ["D3", "D4"]

    def test_index_danh_so_lai(self, ex, df_tt):
        kq = ex.loc_don_hang(df_tt, 200, ["App", "Shopee"])
        assert list(kq.index) == [0, 1], "Phai .reset_index(drop=True)"

    def test_khong_sua_df_goc(self, ex, df_tt):
        truoc = len(df_tt)
        ex.loc_don_hang(df_tt, 200, ["App"])
        assert len(df_tt) == truoc

    def test_khong_khop_gi(self, ex, df_tt):
        assert len(ex.loc_don_hang(df_tt, 999_999, ["App"])) == 0


class TestDoanhThuTheoNhom:
    def test_dung_cot_va_thu_tu(self, ex, df_tt):
        kq = ex.doanh_thu_theo_nhom(df_tt, "kenh")
        assert list(kq.columns) == ["kenh", "tong_doanh_thu", "so_don", "gia_tri_tb"]

    def test_tinh_dung(self, ex, df_tt):
        kq = ex.doanh_thu_theo_nhom(df_tt, "kenh").set_index("kenh")
        assert kq.loc["App", "tong_doanh_thu"] == 400
        assert kq.loc["App", "so_don"] == 2
        assert abs(kq.loc["App", "gia_tri_tb"] - 200.0) < 1e-9

    def test_sap_giam_dan(self, ex, df_tt):
        kq = ex.doanh_thu_theo_nhom(df_tt, "kenh")
        assert list(kq["tong_doanh_thu"]) == sorted(kq["tong_doanh_thu"], reverse=True)

    def test_cot_nhom_la_cot_khong_phai_index(self, ex, df_tt):
        kq = ex.doanh_thu_theo_nhom(df_tt, "kenh")
        assert "kenh" in kq.columns, "Nho .reset_index() sau groupby"

    def test_nhom_khac(self, ex, df_tt):
        kq = ex.doanh_thu_theo_nhom(df_tt, "khach_id")
        assert len(kq) == 3


class TestGhepKhachHang:
    def test_ghep_binh_thuong(self, ex, df_tt):
        khach = pd.DataFrame({"khach_id": ["K1", "K2", "K3"], "ten": ["A", "B", "C"]})
        kq = ex.ghep_khach_hang(df_tt, khach)
        assert len(kq) == 4
        assert "ten" in kq.columns

    def test_giu_don_khong_khop(self, ex, df_tt):
        """how='left' -> don hang khong tim thay khach van duoc giu."""
        khach = pd.DataFrame({"khach_id": ["K1"], "ten": ["A"]})
        kq = ex.ghep_khach_hang(df_tt, khach)
        assert len(kq) == 4, "Phai dung how='left' de giu het don hang"
        assert kq["ten"].isna().sum() == 2

    def test_nem_loi_khi_khoa_trung(self, ex, df_tt):
        khach = pd.DataFrame({"khach_id": ["K1", "K1"], "ten": ["A", "A2"]})
        with pytest.raises(ValueError):
            ex.ghep_khach_hang(df_tt, khach)


class TestTopKhachHang:
    def test_dung_cot(self, ex, df_tt):
        kq = ex.top_khach_hang(df_tt, 2)
        assert list(kq.columns) == ["khach_id", "tong_chi"]

    def test_dung_thu_tu(self, ex, df_tt):
        kq = ex.top_khach_hang(df_tt, 3)
        assert kq.iloc[0]["khach_id"] == "K1"      # 100 + 300 = 400
        assert kq.iloc[0]["tong_chi"] == 400

    def test_gioi_han_n(self, ex, df_tt):
        assert len(ex.top_khach_hang(df_tt, 1)) == 1
        assert len(ex.top_khach_hang(df_tt, 99)) == 3

    def test_index_danh_so_lai(self, ex, df_tt):
        assert list(ex.top_khach_hang(df_tt, 2).index) == [0, 1]


class TestTyLeTrongNhom:
    def test_cung_do_dai(self, ex, df_tt):
        kq = ex.ty_le_trong_nhom(df_tt, "kenh")
        assert len(kq) == len(df_tt), (
            "Phai dung transform (giu nguyen so dong), khong phai agg"
        )

    def test_tinh_dung(self, ex, df_tt):
        # App: 100 va 300, tong 400 -> ty le 0.25 va 0.75
        kq = ex.ty_le_trong_nhom(df_tt, "kenh")
        assert abs(kq.iloc[0] - 0.25) < 1e-9
        assert abs(kq.iloc[2] - 0.75) < 1e-9

    def test_tong_moi_nhom_bang_1(self, ex, df_tt):
        kq = ex.ty_le_trong_nhom(df_tt, "kenh")
        tong = df_tt.assign(ty_le=kq).groupby("kenh")["ty_le"].sum()
        assert np.allclose(tong.to_numpy(), 1.0)
