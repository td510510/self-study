"""Cham diem ex02_metrics.py — Phase 04."""

from __future__ import annotations

import numpy as np
import pytest

from tests.conftest import bao_chua_lam, nap_module

pytestmark = pytest.mark.phase04


@pytest.fixture(scope="module")
def ex():
    return nap_module("curriculum/04-classical-ml/exercises/ex02_metrics.py")


# y_that    = [1, 1, 0, 0, 1]
# y_du_doan = [1, 0, 0, 1, 1]
# -> tp=2, tn=1, fp=1, fn=1
Y_THAT = np.array([1, 1, 0, 0, 1])
Y_PRED = np.array([1, 0, 0, 1, 1])


class TestConfusionMatrix:
    def test_co_ket_qua(self, ex):
        assert ex.confusion_matrix(Y_THAT, Y_PRED) is not None, bao_chua_lam(
            "confusion_matrix"
        )

    def test_du_khoa(self, ex):
        assert set(ex.confusion_matrix(Y_THAT, Y_PRED)) == {"tp", "tn", "fp", "fn"}

    def test_dem_dung(self, ex):
        assert ex.confusion_matrix(Y_THAT, Y_PRED) == {"tp": 2, "tn": 1, "fp": 1, "fn": 1}

    def test_tong_bang_so_mau(self, ex):
        rng = np.random.default_rng(0)
        yt = (rng.random(200) < 0.3).astype(int)
        yp = (rng.random(200) < 0.4).astype(int)
        cm = ex.confusion_matrix(yt, yp)
        assert sum(cm.values()) == 200, "tp+tn+fp+fn phai bang tong so mau"

    def test_du_doan_hoan_hao(self, ex):
        y = np.array([1, 0, 1, 0])
        cm = ex.confusion_matrix(y, y)
        assert cm["fp"] == 0 and cm["fn"] == 0

    def test_du_doan_toan_sai(self, ex):
        y = np.array([1, 0, 1, 0])
        cm = ex.confusion_matrix(y, 1 - y)
        assert cm["tp"] == 0 and cm["tn"] == 0


class TestMetricCoBan:
    def test_accuracy(self, ex):
        assert ex.accuracy(Y_THAT, Y_PRED) == 0.6
        assert ex.accuracy(np.array([1, 1, 0, 0]), np.array([1, 0, 0, 0])) == 0.75

    def test_precision(self, ex):
        assert abs(ex.precision(Y_THAT, Y_PRED) - 2 / 3) < 1e-9

    def test_recall(self, ex):
        assert abs(ex.recall(Y_THAT, Y_PRED) - 2 / 3) < 1e-9

    def test_f1(self, ex):
        assert abs(ex.f1(Y_THAT, Y_PRED) - 2 / 3) < 1e-9

    def test_hoan_hao(self, ex):
        y = np.array([1, 0, 1, 0])
        assert ex.precision(y, y) == 1.0
        assert ex.recall(y, y) == 1.0
        assert ex.f1(y, y) == 1.0

    def test_precision_khi_khong_bao_ai(self, ex):
        """Model doan toan 0 -> tp+fp = 0 -> tra ve 0.0, KHONG duoc nan."""
        kq = ex.precision(np.array([1, 1, 0]), np.array([0, 0, 0]))
        assert not np.isnan(kq), "Chia cho 0 -> nan. Phai kiem tra mau so."
        assert kq == 0.0

    def test_recall_khi_khong_co_lop_duong(self, ex):
        kq = ex.recall(np.array([0, 0, 0]), np.array([0, 1, 0]))
        assert not np.isnan(kq)
        assert kq == 0.0

    def test_f1_khi_p_hoac_r_bang_0(self, ex):
        kq = ex.f1(np.array([1, 1, 0]), np.array([0, 0, 0]))
        assert not np.isnan(kq)
        assert kq == 0.0

    def test_f1_phat_nang_mat_can_bang(self, ex):
        """p=1.0, r thap -> F1 phai thap hon nhieu so voi trung binh cong."""
        yt = np.array([1] * 10 + [0] * 10)
        yp = np.array([1] + [0] * 9 + [0] * 10)     # chi bao dung 1 ca
        p, r, f = ex.precision(yt, yp), ex.recall(yt, yp), ex.f1(yt, yp)
        assert p == 1.0
        assert r == 0.1
        assert f < (p + r) / 2, "F1 (dieu hoa) phai nho hon trung binh cong"

    def test_accuracy_lua_doi_khi_mat_can_bang(self, ex):
        """Bai hoc quan trong: accuracy cao ma recall = 0."""
        yt = np.array([0] * 95 + [1] * 5)
        yp = np.zeros(100, dtype=int)
        assert ex.accuracy(yt, yp) == 0.95
        assert ex.recall(yt, yp) == 0.0


class TestApDungNguong:
    def test_co_ban(self, ex):
        assert list(ex.ap_dung_nguong(np.array([0.2, 0.6, 0.5]), 0.5)) == [0, 1, 1]

    def test_dung_lon_hon_bang(self, ex):
        """Xac suat dung bang nguong -> xep lop 1."""
        assert ex.ap_dung_nguong(np.array([0.5]), 0.5)[0] == 1

    def test_kieu_int(self, ex):
        kq = ex.ap_dung_nguong(np.array([0.2, 0.8]), 0.5)
        assert np.issubdtype(np.asarray(kq).dtype, np.integer)

    def test_nguong_cao(self, ex):
        assert list(ex.ap_dung_nguong(np.array([0.2, 0.6, 0.9]), 0.8)) == [0, 0, 1]

    def test_nguong_thap_cho_nhieu_lop_1_hon(self, ex):
        p = np.array([0.1, 0.3, 0.5, 0.7, 0.9])
        assert ex.ap_dung_nguong(p, 0.2).sum() > ex.ap_dung_nguong(p, 0.8).sum()


class TestQuetNguong:
    @pytest.fixture
    def du_lieu(self):
        rng = np.random.default_rng(0)
        yt = (rng.random(500) < 0.3).astype(int)
        p = np.clip(rng.normal(np.where(yt == 1, 0.7, 0.3), 0.15), 0, 1)
        return yt, p

    def test_do_dai(self, ex, du_lieu):
        yt, p = du_lieu
        bang = ex.quet_nguong(yt, p, np.array([0.3, 0.5, 0.7]))
        assert len(bang) == 3

    def test_du_khoa(self, ex, du_lieu):
        yt, p = du_lieu
        bang = ex.quet_nguong(yt, p, np.array([0.5]))
        assert set(bang[0]) == {"nguong", "precision", "recall", "f1", "accuracy"}

    def test_nguong_thap_recall_cao_hon(self, ex, du_lieu):
        """Danh doi co ban: ha nguong -> recall tang, precision giam."""
        yt, p = du_lieu
        bang = ex.quet_nguong(yt, p, np.array([0.2, 0.8]))
        assert bang[0]["recall"] > bang[1]["recall"]
        assert bang[0]["precision"] < bang[1]["precision"]

    def test_giu_thu_tu_dau_vao(self, ex, du_lieu):
        yt, p = du_lieu
        bang = ex.quet_nguong(yt, p, np.array([0.7, 0.3, 0.5]))
        assert [round(d["nguong"], 2) for d in bang] == [0.7, 0.3, 0.5]

    def test_nguong_tot_nhat_trong_khoang(self, ex, du_lieu):
        yt, p = du_lieu
        ng = ex.nguong_tot_nhat(yt, p, "f1")
        assert 0.05 <= ng <= 0.95

    def test_nguong_tot_nhat_that_su_tot_nhat(self, ex, du_lieu):
        yt, p = du_lieu
        ng = ex.nguong_tot_nhat(yt, p, "f1")
        f_tot = ex.f1(yt, ex.ap_dung_nguong(p, ng))
        for khac in np.arange(0.05, 1.0, 0.05):
            assert ex.f1(yt, ex.ap_dung_nguong(p, khac)) <= f_tot + 1e-9

    def test_nguong_tot_nhat_theo_recall_thi_thap(self, ex, du_lieu):
        """Toi da hoa recall -> nguong phai rat thap."""
        yt, p = du_lieu
        assert ex.nguong_tot_nhat(yt, p, "recall") <= 0.1


class TestAUC:
    def test_vi_du_chuan(self, ex):
        kq = ex.auc(np.array([0, 0, 1, 1]), np.array([0.1, 0.4, 0.35, 0.8]))
        assert abs(kq - 0.75) < 1e-9

    def test_hoan_hao(self, ex):
        yt = np.array([0, 0, 1, 1])
        assert ex.auc(yt, np.array([0.1, 0.2, 0.8, 0.9])) == 1.0

    def test_te_nhat(self, ex):
        yt = np.array([0, 0, 1, 1])
        assert ex.auc(yt, np.array([0.9, 0.8, 0.2, 0.1])) == 0.0

    def test_doan_mo(self, ex):
        """Moi mau cung diem -> khong phan biet duoc -> 0.5."""
        yt = np.array([0, 1, 0, 1])
        assert abs(ex.auc(yt, np.full(4, 0.5)) - 0.5) < 1e-9

    def test_chi_mot_lop(self, ex):
        assert ex.auc(np.array([1, 1, 1]), np.array([0.1, 0.5, 0.9])) == 0.5
        assert ex.auc(np.array([0, 0, 0]), np.array([0.1, 0.5, 0.9])) == 0.5

    def test_trong_khoang_0_1(self, ex):
        rng = np.random.default_rng(3)
        for _ in range(10):
            yt = (rng.random(100) < 0.4).astype(int)
            p = rng.random(100)
            assert 0.0 <= ex.auc(yt, p) <= 1.0

    def test_khong_phu_thuoc_nguong(self, ex):
        """AUC tinh tren xac suat -> khong lien quan gi den nguong."""
        yt = np.array([0, 0, 1, 1])
        p = np.array([0.01, 0.02, 0.03, 0.04])       # moi xac suat deu rat thap
        assert ex.auc(yt, p) == 1.0, (
            "AUC do kha nang XEP HANG, khong phu thuoc gia tri tuyet doi"
        )

    def test_dao_nhan_thi_dao_auc(self, ex):
        rng = np.random.default_rng(5)
        yt = (rng.random(200) < 0.4).astype(int)
        p = np.clip(rng.normal(np.where(yt == 1, 0.7, 0.3), 0.2), 0, 1)
        assert abs(ex.auc(yt, p) + ex.auc(1 - yt, p) - 1.0) < 1e-9


class TestChiPhiKinhDoanh:
    def test_tinh_dung(self, ex):
        # fp=1, fn=1
        assert ex.chi_phi_kinh_doanh(Y_THAT, Y_PRED, 200_000, 3_000_000) == 3_200_000

    def test_khong_sai_thi_khong_ton(self, ex):
        y = np.array([1, 0, 1, 0])
        assert ex.chi_phi_kinh_doanh(y, y, 100, 200) == 0

    def test_fn_dat_hon_thi_nen_ha_nguong(self, ex):
        """Bai hoc: khi FN dat hon FP nhieu, nguong thap re hon."""
        rng = np.random.default_rng(7)
        yt = (rng.random(1000) < 0.26).astype(int)
        p = np.clip(rng.normal(np.where(yt == 1, 0.62, 0.35), 0.16), 0, 1)

        cp_thap = ex.chi_phi_kinh_doanh(yt, ex.ap_dung_nguong(p, 0.25), 200_000, 3_000_000)
        cp_cao = ex.chi_phi_kinh_doanh(yt, ex.ap_dung_nguong(p, 0.75), 200_000, 3_000_000)
        assert cp_thap < cp_cao, (
            "Khi FN dat gap 15 lan FP, nguong THAP phai re hon nguong CAO"
        )

    def test_fp_dat_hon_thi_nguoc_lai(self, ex):
        rng = np.random.default_rng(7)
        yt = (rng.random(1000) < 0.26).astype(int)
        p = np.clip(rng.normal(np.where(yt == 1, 0.62, 0.35), 0.16), 0, 1)

        cp_thap = ex.chi_phi_kinh_doanh(yt, ex.ap_dung_nguong(p, 0.25), 3_000_000, 200_000)
        cp_cao = ex.chi_phi_kinh_doanh(yt, ex.ap_dung_nguong(p, 0.75), 3_000_000, 200_000)
        assert cp_cao < cp_thap
