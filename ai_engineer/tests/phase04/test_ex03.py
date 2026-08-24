"""Cham diem ex03_pipeline.py — Phase 04.

Cac test nay can scikit-learn:
    pip install -e ".[ml]"
"""

from __future__ import annotations

import numpy as np
import pandas as pd
import pytest

from tests.conftest import bao_chua_lam, nap_module

pytestmark = pytest.mark.phase04

sklearn = pytest.importorskip(
    "sklearn", reason='Chua cai scikit-learn. Chay:  pip install -e ".[ml]"'
)

from sklearn.dummy import DummyClassifier  # noqa: E402
from sklearn.linear_model import LogisticRegression  # noqa: E402


@pytest.fixture(scope="module")
def ex():
    return nap_module("curriculum/04-classical-ml/exercises/ex03_pipeline.py")


@pytest.fixture(scope="module")
def du_lieu():
    """Bo du lieu nho co: cot so, cot chu, gia tri thieu, VA mot cot ro ri."""
    rng = np.random.default_rng(42)
    n = 600

    tuoi = rng.integers(18, 70, n)
    thu_nhap = rng.normal(20, 6, n)
    thanh_pho = rng.choice(["HN", "HCM", "DN"], n)
    goi = rng.choice(["Thang", "Nam"], n, p=[0.6, 0.4])

    diem = (
        -1.5
        - 0.03 * (tuoi - 40)
        + 0.10 * (thu_nhap - 20)
        + np.where(goi == "Thang", 1.0, -0.5)
        + rng.normal(0, 0.7, n)
    )
    y = pd.Series((rng.random(n) < 1 / (1 + np.exp(-diem))).astype(int), name="y")

    # Cot RO RI: gan nhu tiet lo dap an
    ro_ri = np.where(y == 1, (rng.random(n) < 0.95), (rng.random(n) < 0.03)).astype(int)

    X = pd.DataFrame(
        {
            "tuoi": tuoi.astype(float),
            "thu_nhap": thu_nhap,
            "thanh_pho": thanh_pho,
            "goi_cuoc": goi,
            "cot_ro_ri": ro_ri,
        }
    )
    X.loc[rng.random(n) < 0.05, "thu_nhap"] = np.nan     # them gia tri thieu
    return X, y


class TestTachCotTheoKieu:
    def test_co_ket_qua(self, ex, du_lieu):
        X, _ = du_lieu
        assert ex.tach_cot_theo_kieu(X) is not None, bao_chua_lam("tach_cot_theo_kieu")

    def test_tach_dung(self, ex, du_lieu):
        X, _ = du_lieu
        cot_so, cot_chu = ex.tach_cot_theo_kieu(X)
        assert set(cot_so) == {"tuoi", "thu_nhap", "cot_ro_ri"}
        assert set(cot_chu) == {"thanh_pho", "goi_cuoc"}

    def test_khong_bo_sot_cot(self, ex, du_lieu):
        X, _ = du_lieu
        cot_so, cot_chu = ex.tach_cot_theo_kieu(X)
        assert len(cot_so) + len(cot_chu) == X.shape[1]

    def test_giu_thu_tu(self, ex):
        X = pd.DataFrame({"b": [1.0], "a": ["x"], "c": [2.0]})
        cot_so, _ = ex.tach_cot_theo_kieu(X)
        assert cot_so == ["b", "c"], "Phai giu THU TU xuat hien trong X"

    def test_toan_cot_so(self, ex):
        X = pd.DataFrame({"a": [1.0], "b": [2]})
        cot_so, cot_chu = ex.tach_cot_theo_kieu(X)
        assert len(cot_so) == 2 and cot_chu == []


class TestTienXuLy:
    def test_co_ket_qua(self, ex, du_lieu):
        X, _ = du_lieu
        cs, cc = ex.tach_cot_theo_kieu(X)
        assert ex.tao_tien_xu_ly(cs, cc) is not None, bao_chua_lam("tao_tien_xu_ly")

    def test_ten_cac_buoc(self, ex, du_lieu):
        X, _ = du_lieu
        cs, cc = ex.tach_cot_theo_kieu(X)
        ten = [t for t, _, _ in ex.tao_tien_xu_ly(cs, cc).transformers]
        assert set(ten) == {"so", "chu"}

    def test_xu_ly_duoc_gia_tri_thieu(self, ex, du_lieu):
        X, _ = du_lieu
        cs, cc = ex.tach_cot_theo_kieu(X)
        kq = ex.tao_tien_xu_ly(cs, cc).fit_transform(X)
        arr = kq.toarray() if hasattr(kq, "toarray") else np.asarray(kq)
        assert not np.isnan(arr).any(), "Con NaN sau tien xu ly - thieu SimpleImputer"

    def test_co_chuan_hoa(self, ex, du_lieu):
        X, _ = du_lieu
        cs, cc = ex.tach_cot_theo_kieu(X)
        kq = ex.tao_tien_xu_ly(cs, cc).fit_transform(X)
        arr = kq.toarray() if hasattr(kq, "toarray") else np.asarray(kq)
        cot_tuoi = arr[:, cs.index("tuoi")]
        assert abs(cot_tuoi.mean()) < 1e-6, "Cot so phai duoc chuan hoa ve mean=0"
        assert abs(cot_tuoi.std() - 1) < 1e-6

    def test_one_hot_tang_so_cot(self, ex, du_lieu):
        X, _ = du_lieu
        cs, cc = ex.tach_cot_theo_kieu(X)
        kq = ex.tao_tien_xu_ly(cs, cc).fit_transform(X)
        arr = kq.toarray() if hasattr(kq, "toarray") else np.asarray(kq)
        # 3 cot so + 3 thanh pho + 2 goi cuoc = 8
        assert arr.shape[1] == 8

    def test_hang_muc_la_khong_gay_loi(self, ex, du_lieu):
        """handle_unknown='ignore' - bat buoc cho san xuat."""
        X, _ = du_lieu
        cs, cc = ex.tach_cot_theo_kieu(X)
        pre = ex.tao_tien_xu_ly(cs, cc).fit(X)

        X_moi = X.head(3).copy()
        X_moi["thanh_pho"] = "QUAN_MOI_CHUA_TUNG_CO"
        try:
            pre.transform(X_moi)
        except Exception as e:  # noqa: BLE001
            pytest.fail(
                f"Gap hang muc la thi sap: {type(e).__name__}. "
                'Can OneHotEncoder(handle_unknown="ignore")'
            )


class TestPipeline:
    def test_ten_cac_buoc(self, ex, du_lieu):
        X, _ = du_lieu
        cs, cc = ex.tach_cot_theo_kieu(X)
        p = ex.tao_pipeline(cs, cc, LogisticRegression(max_iter=1000))
        assert list(p.named_steps) == ["tien_xu_ly", "model"]

    def test_fit_va_predict(self, ex, du_lieu):
        X, y = du_lieu
        cs, cc = ex.tach_cot_theo_kieu(X)
        p = ex.tao_pipeline(cs, cc, LogisticRegression(max_iter=1000)).fit(X, y)
        assert len(p.predict(X)) == len(X)
        assert p.predict_proba(X).shape == (len(X), 2)

    def test_lam_viec_voi_du_lieu_tho(self, ex, du_lieu):
        """Pipeline nhan DataFrame tho, khong can tien xu ly truoc."""
        X, y = du_lieu
        cs, cc = ex.tach_cot_theo_kieu(X)
        p = ex.tao_pipeline(cs, cc, LogisticRegression(max_iter=1000)).fit(X, y)
        assert p.predict(X.head(5)) is not None


class TestDanhGiaCV:
    def test_du_khoa(self, ex, du_lieu):
        X, y = du_lieu
        cs, cc = ex.tach_cot_theo_kieu(X)
        p = ex.tao_pipeline(cs, cc, LogisticRegression(max_iter=1000))
        d = ex.danh_gia_cv(p, X, y, so_fold=3)
        assert set(d) == {"mean", "std", "min", "max"}

    def test_gia_tri_hop_ly(self, ex, du_lieu):
        X, y = du_lieu
        cs, cc = ex.tach_cot_theo_kieu(X)
        p = ex.tao_pipeline(cs, cc, LogisticRegression(max_iter=1000))
        d = ex.danh_gia_cv(p, X, y, so_fold=3)
        assert 0.5 <= d["mean"] <= 1.0
        assert d["min"] <= d["mean"] <= d["max"]
        assert d["std"] >= 0

    def test_lam_tron_4_chu_so(self, ex, du_lieu):
        X, y = du_lieu
        cs, cc = ex.tach_cot_theo_kieu(X)
        p = ex.tao_pipeline(cs, cc, LogisticRegression(max_iter=1000))
        d = ex.danh_gia_cv(p, X, y, so_fold=3)
        assert all(round(v, 4) == v for v in d.values())

    def test_tai_lap_duoc(self, ex, du_lieu):
        """random_state co dinh -> chay hai lan ra ket qua y het."""
        X, y = du_lieu
        cs, cc = ex.tach_cot_theo_kieu(X)
        p = ex.tao_pipeline(cs, cc, LogisticRegression(max_iter=1000))
        assert ex.danh_gia_cv(p, X, y, so_fold=3) == ex.danh_gia_cv(p, X, y, so_fold=3)

    def test_baseline_cho_auc_05(self, ex, du_lieu):
        X, y = du_lieu
        cs, cc = ex.tach_cot_theo_kieu(X)
        p = ex.tao_pipeline(cs, cc, DummyClassifier(strategy="most_frequent"))
        assert abs(ex.danh_gia_cv(p, X, y, so_fold=3)["mean"] - 0.5) < 0.01


class TestTimDacTrungRoRi:
    def test_tim_duoc_cot_ro_ri(self, ex, du_lieu):
        X, y = du_lieu
        assert "cot_ro_ri" in ex.tim_dac_trung_ro_ri(X, y), (
            "Phai phat hien duoc cot 'cot_ro_ri' (AUC mot minh rat cao)"
        )

    def test_khong_bao_nham_cot_binh_thuong(self, ex, du_lieu):
        X, y = du_lieu
        nghi = ex.tim_dac_trung_ro_ri(X, y)
        assert "tuoi" not in nghi
        assert "thanh_pho" not in nghi

    def test_nguong_cao_thi_it_nghi_ngo_hon(self, ex, du_lieu):
        X, y = du_lieu
        assert len(ex.tim_dac_trung_ro_ri(X, y, nguong_auc=0.99)) <= len(
            ex.tim_dac_trung_ro_ri(X, y, nguong_auc=0.9)
        )

    def test_bo_cot_ro_ri_lam_giam_auc(self, ex, du_lieu):
        """Bai hoc cot loi: con so THAT thap hon nhieu."""
        X, y = du_lieu
        cs, cc = ex.tach_cot_theo_kieu(X)
        co = ex.danh_gia_cv(
            ex.tao_pipeline(cs, cc, LogisticRegression(max_iter=1000)), X, y, so_fold=3
        )["mean"]

        X2 = X.drop(columns=ex.tim_dac_trung_ro_ri(X, y))
        cs2, cc2 = ex.tach_cot_theo_kieu(X2)
        khong = ex.danh_gia_cv(
            ex.tao_pipeline(cs2, cc2, LogisticRegression(max_iter=1000)), X2, y, so_fold=3
        )["mean"]

        assert khong < co - 0.05, (
            f"Bo cot ro ri phai lam AUC giam ro ret ({co:.3f} -> {khong:.3f})"
        )


class TestSoSanhModel:
    def test_dung_cot(self, ex, du_lieu):
        X, y = du_lieu
        bang = ex.so_sanh_model(
            {"A": DummyClassifier(strategy="most_frequent"),
             "B": LogisticRegression(max_iter=1000)},
            X, y, so_fold=3,
        )
        assert list(bang.columns) == ["model", "auc_mean", "auc_std", "auc_min"]

    def test_moi_model_mot_dong(self, ex, du_lieu):
        X, y = du_lieu
        bang = ex.so_sanh_model(
            {"A": DummyClassifier(strategy="most_frequent"),
             "B": LogisticRegression(max_iter=1000)},
            X, y, so_fold=3,
        )
        assert len(bang) == 2

    def test_sap_giam_dan(self, ex, du_lieu):
        X, y = du_lieu
        bang = ex.so_sanh_model(
            {"Baseline": DummyClassifier(strategy="most_frequent"),
             "LogReg": LogisticRegression(max_iter=1000)},
            X, y, so_fold=3,
        )
        assert list(bang["auc_mean"]) == sorted(bang["auc_mean"], reverse=True)
        assert bang.iloc[0]["model"] == "LogReg", "Model that phai hon baseline"

    def test_index_danh_so_lai(self, ex, du_lieu):
        X, y = du_lieu
        bang = ex.so_sanh_model(
            {"A": DummyClassifier(strategy="most_frequent"),
             "B": LogisticRegression(max_iter=1000)},
            X, y, so_fold=3,
        )
        assert list(bang.index) == [0, 1]
