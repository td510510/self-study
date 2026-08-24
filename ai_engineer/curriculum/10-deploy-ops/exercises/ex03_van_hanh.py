"""BAI TAP 3 - Quan sat va kiem soat chi phi (Tuan 22).

Cham diem:  pytest tests/phase10/test_ex03.py -v
Loi giai:   curriculum/10-deploy-ops/solutions/ex03_van_hanh.py

⭐⭐ BAI TAP QUAN TRONG NHAT PHASE 10.

Dua duoc ung dung len internet la phan de. Phan kho la tra loi duoc:
    - No dang cham hay nhanh? Cham voi BAO NHIEU PHAN TRAM nguoi dung?
    - Thang nay het bao nhieu tien? Con bao nhieu?
    - Khi Anthropic gian doan, ung dung cua ban lam gi?

Ba cau hoi do la ba muc chinh cua bai nay.

MOI THU O DAY NHAN DONG HO LAM THAM SO (`ham_gio`) - de test khong phai
`sleep()`. Mot bo test dung sleep la mot bo test cham, khong on dinh, va som
muon cung bi bo chay.
"""

from __future__ import annotations

from collections.abc import Callable


# ===========================================================================
#  3.1 - Do do tre bang phan vi
# ===========================================================================
def phan_vi(cac_gia_tri: list[float], p: float) -> float:
    """Phan vi thu p (0-100) theo phuong phap NEAREST RANK.

        thu_hang = ceil(p / 100 * n),  lay phan tu thu `thu_hang` (dem tu 1)
        cua danh sach DA SAP XEP tang dan. thu_hang toi thieu la 1.

    Vi du voi [10, 20, 30, 40, 50]:
        phan_vi(x, 50)  ->  30
        phan_vi(x, 95)  ->  50
        phan_vi(x, 0)   ->  10

    Quy tac:
        - Danh sach rong -> 0.0
        - p ngoai [0, 100] -> ValueError
        - KHONG sua danh sach goc

    VI SAO DUNG p95 MA KHONG DUNG TRUNG BINH?
        Vi trung binh giau di dung thu ban can biet. 100 request: 95 cai mat
        200ms, 5 cai mat 10 giay. Trung binh = 690ms, nghe on. Nhung 5% nguoi
        dung cua ban vua doi 10 giay - va ho la nhung nguoi se bo di.

        Do tre la mot phan bo lech phai. Trung binh khong mo ta duoc no.
    """
    # TODO
    pass


class BoDem:
    """Thu thap so lieu van hanh cua dich vu.

        bd = BoDem()
        bd.ghi(do_tre_ms=210, thanh_cong=True, chi_phi_usd=0.0012)
        bd.tom_tat()
    """

    def __init__(self):
        """Tao ba danh sach rong: self.do_tre, self.ket_qua, self.chi_phi."""
        # TODO
        pass

    def ghi(self, do_tre_ms: float, thanh_cong: bool, chi_phi_usd: float = 0.0):
        """Ghi lai mot request."""
        # TODO
        pass

    def tom_tat(self) -> dict:
        """Tra ve dict co dung cac khoa:

            so_request     int
            so_loi         int
            ty_le_loi      float  0.0 den 1.0 (0.0 neu chua co request nao)
            p50_ms         float
            p95_ms         float
            tong_chi_phi   float
            chi_phi_tb     float  trung binh moi request (0.0 neu rong)

        ⚠️ `ty_le_loi` phai tinh tren TAT CA request. Chia cho so loi thay vi
        so request la mot loi kinh dien khien dashboard luon bao 100%.
        """
        # TODO
        pass


# ===========================================================================
#  3.2 - Kiem soat ngan sach
# ===========================================================================
class SoChiPhi:
    """Theo doi chi phi tich luy va CHAN khi vuot ngan sach.

        so = SoChiPhi(ngan_sach_usd=5.0)
        so.cho_phep(0.002)    -> True
        so.ghi_nhan(0.002)
        so.con_lai()          -> 4.998
    """

    def __init__(self, ngan_sach_usd: float, nguong_canh_bao: float = 0.8):
        """ngan_sach_usd <= 0 -> ValueError.
        nguong_canh_bao ngoai khoang (0, 1] -> ValueError.
        """
        # TODO
        pass

    def cho_phep(self, chi_phi_du_kien: float) -> bool:
        """Con du ngan sach cho request nay khong? KHONG ghi nhan gi.

        False neu (da_dung + chi_phi_du_kien) > ngan_sach.
        """
        # TODO
        pass

    def ghi_nhan(self, chi_phi_usd: float) -> None:
        """Cong chi phi THAT vao so. chi_phi_usd am -> ValueError."""
        # TODO
        pass

    def con_lai(self) -> float:
        """Ngan sach con lai. Khong bao gio tra ve so am."""
        # TODO
        pass

    def trang_thai(self) -> dict:
        """Tra ve dict co cac khoa: da_dung, con_lai, ty_le, can_canh_bao.

        `ty_le` = da_dung / ngan_sach (co the vuot 1.0).
        `can_canh_bao` True khi ty_le >= nguong_canh_bao.

        VI SAO TACH `cho_phep` KHOI `ghi_nhan`?
            Vi ban chi biet chi phi THAT sau khi goi xong (dua tren `usage` tra
            ve). Truoc khi goi ban chi UOC LUONG duoc. Gop lam mot ham nghia la
            hoac ban chan dua tren so lieu sai, hoac ban ghi nhan mot chi phi
            chua he xay ra.
        """
        # TODO
        pass


# ===========================================================================
#  3.3 - Gioi han tan suat (token bucket)
# ===========================================================================
class GioiHanTanSuat:
    """Token bucket: cho phep bung ngan han, gioi han ve dai han.

        gh = GioiHanTanSuat(suc_chua=10, toc_do_nap=2.0, ham_gio=dong_ho)
        gh.cho_phep()    -> True/False

    `suc_chua`   so token toi da trong xo (= so request bung toi da)
    `toc_do_nap` so token nap them moi GIAY
    `ham_gio()`  thoi diem hien tai tinh bang giay (float)

    Bat dau voi xo DAY.
    """

    def __init__(self, suc_chua: int, toc_do_nap: float,
                 ham_gio: Callable[[], float] | None = None):
        """suc_chua <= 0 hoac toc_do_nap <= 0 -> ValueError.
        ham_gio la None -> dung time.monotonic.
        """
        # TODO
        pass

    def cho_phep(self, so_token: int = 1) -> bool:
        """Nap token theo thoi gian troi qua, roi thu tieu `so_token`.

        Du token -> tru di va tra True. Khong du -> tra False, KHONG tru gi.
        Xo khong bao gio vuot qua `suc_chua`.

        VI SAO TOKEN BUCKET MA KHONG PHAI "toi da N request moi phut"?
            Vi dem theo cua so co dinh cho phep gap doi tai o ranh gioi: 100
            request luc 10:00:59 va 100 request nua luc 10:01:00 deu "hop le",
            nhung may chu cua ban nhan 200 request trong mot giay.

            Token bucket khong co ranh gioi de ma lach.

        VI SAO DUNG time.monotonic CHU KHONG PHAI time.time?
            Vi `time.time` co the NHAY LUI khi may dong bo dong ho. Luc do
            `bay_gio - lan_cuoi` thanh so am, va logic cua ban hanh xu ky quac
            mot cach rat kho tai hien.
        """
        # TODO
        pass


# ===========================================================================
#  3.4 - Ngat mach (circuit breaker)
# ===========================================================================
class NgatMach:
    """Ngung goi mot dich vu dang hong, thay vi cu goi mai va cho timeout.

    Ba trang thai:
        "dong"     binh thuong, cho goi
        "mo"       dang hong, TU CHOI ngay khong goi
        "thu_lai"  het thoi gian cho, cho MOT lan goi de thu

    Chuyen trang thai:
        dong     --(du `nguong_loi` lan loi LIEN TIEP)-->  mo
        mo       --(qua `thoi_gian_cho` giay)-->           thu_lai
        thu_lai  --(thanh cong)-->                         dong
        thu_lai  --(that bai)-->                           mo, dem lai thoi gian
    """

    def __init__(self, nguong_loi: int = 3, thoi_gian_cho: float = 30.0,
                 ham_gio: Callable[[], float] | None = None):
        """nguong_loi <= 0 hoac thoi_gian_cho <= 0 -> ValueError.

        Bat dau o trang thai "dong" voi 0 loi.
        """
        # TODO
        pass

    @property
    def trang_thai(self) -> str:
        """Trang thai HIEN TAI, co tinh thoi gian troi qua.

        Dang "mo" ma da qua `thoi_gian_cho` -> tra ve "thu_lai".
        """
        # TODO
        pass

    def cho_goi(self) -> bool:
        """Co duoc goi dich vu luc nay khong? True khi trang thai khac "mo"."""
        # TODO
        pass

    def ghi_thanh_cong(self) -> None:
        """Dat lai bo dem loi ve 0 va dong mach."""
        # TODO
        pass

    def ghi_that_bai(self) -> None:
        """Tang bo dem loi; du nguong thi mo mach va ghi lai thoi diem mo.

        ⚠️ Dang "thu_lai" ma that bai -> mo lai NGAY, khong dem tiep. Mot lan
        thu that bai da la bang chung du de noi dich vu chua hoi phuc.

        VI SAO CAN NGAT MACH?
            Khi dich vu phu thuoc gian doan, moi request cua ban se doi cho toi
            khi timeout - 30 giay chang han. Nguoi dung doi 30 giay de nhan mot
            loi. Cac ket noi cua ban bi chiem het boi nhung request chac chan
            that bai. Ung dung cua ban chet theo, du loi khong phai cua no.

            Ngat mach bien 30 giay cho doi thanh mot loi tra ve TUC THI, va giu
            lai tai nguyen cho nhung viec con chay duoc.
        """
        # TODO
        pass


# ===========================================================================
#  3.5 - Trace
# ===========================================================================
def tao_ban_ghi_trace(trace_id: str, su_kien: str, /, **truong) -> dict:
    """Tao mot ban ghi trace co cau truc.

    Tra ve dict gom: trace_id, su_kien, va moi truong trong `truong`.

    Quy tac:
        - trace_id rong hoac chi khoang trang -> ValueError
        - su_kien rong -> ValueError
        - `truong` chua khoa "trace_id" hoac "su_kien" -> ValueError
          (khong cho nguoi goi ghi de hai truong nay)

    ⚠️ Chu y dau `/` trong chu ky ham: no lam hai tham so dau thanh
    POSITIONAL-ONLY. Khong co no thi `tao_ban_ghi_trace("abc", "x",
    trace_id="gia")` bi Python chan bang TypeError truoc khi vao than ham -
    tuc la quy tac tren khong bao gio chay duoc. Voi `/`, `trace_id="gia"`
    roi vao `**truong` va ban kiem tra duoc no.

    VI SAO LOG CO CAU TRUC MA KHONG PHAI CHUOI?
        Vi voi chuoi, cau hoi "request nao cham hon 2 giay?" tro thanh mot bai
        toan regex. Voi dict (ghi ra JSON), no chi la mot phep loc.

        Va `trace_id` la thu cho phep ban noi 12 dong log roi rac cua CUNG mot
        request lai voi nhau - dieu khong the lam duoc khi nhieu request chay
        song song va log cua chung xen ke.
    """
    # TODO
    pass
