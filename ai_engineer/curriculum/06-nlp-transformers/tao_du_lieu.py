"""Tao kho ngu lieu tieng Viet cho Phase 06 va project P4.

Chay MOT LAN truoc khi bat dau Tuan 14:

    python curriculum/06-nlp-transformers/tao_du_lieu.py

Tao ra:
    data/van_ban_viet.txt   ~300 KB van ban tieng Viet
    data/cau_mau.json       200 cau ngan de tap embedding / tim kiem ngu nghia

VI SAO TU SINH MA KHONG TAI KHO NGU LIEU CO SAN?
    1. KHONG CAN MANG - chay duoc ngay ca khi khong co internet
    2. KHONG VUONG BAN QUYEN - van ban duoc sinh tu mau cau, khong sao chep
    3. Du NHO de char-level GPT train xong tren CPU trong vai phut
    4. Du CO CAU TRUC de model hoc duoc: chinh ta, dau cau, tu ghep,
       tran tu cau tieng Viet

DU LIEU NAY DUNG DE LAM GI?
    van_ban_viet.txt  -> train mini-GPT o Tuan 15 (bai 4 va project P4)
    cau_mau.json      -> tap embedding va tim kiem ngu nghia o Tuan 14 (bai 2)

MOT LUU Y THANH THAT:
    Van ban sinh tu mau cau thi LAP LAI nhieu hon van ban that. Mini-GPT
    train tren no se hoc rat nhanh va sinh ra cau kha "sach" - dep hon
    so voi khi train tren du lieu that cung kich thuoc. Do la danh doi
    de bai hoc chay duoc offline trong vai phut.
"""

from __future__ import annotations

import json
import random
from pathlib import Path

SEED = 42
SO_CAU = 6000

GOC_DU_AN = Path(__file__).resolve().parents[2]
THU_MUC_DATA = GOC_DU_AN / "data"


# ===========================================================================
#  Kho tu vung
# ===========================================================================
NGUOI = ["Nam", "Lan", "Bình", "Hoa", "Cường", "Trang", "Minh", "Hạnh",
         "anh Tuấn", "chị Mai", "bác Sáu", "cô giáo", "bạn tôi", "em gái tôi"]

NOI = ["Hà Nội", "Sài Gòn", "Đà Nẵng", "Huế", "Cần Thơ", "Hải Phòng",
       "quê nhà", "thành phố", "vùng núi", "miền Tây", "bờ biển", "phố cổ"]

MON_AN = ["phở bò", "bún chả", "bánh mì", "cơm tấm", "hủ tiếu", "bánh xèo",
          "chè đậu xanh", "gỏi cuốn", "canh chua", "xôi gấc"]

DO_UONG = ["cà phê sữa đá", "trà đá", "nước mía", "sinh tố bơ", "trà sen"]

HOAT_DONG = ["đọc sách", "nấu ăn", "chạy bộ", "học lập trình", "nghe nhạc",
             "trồng cây", "chụp ảnh", "đi dạo", "viết nhật ký", "vẽ tranh"]

THOI_GIAN = ["buổi sáng", "buổi chiều", "buổi tối", "cuối tuần", "mỗi ngày",
             "hôm qua", "sáng nay", "tối hôm trước", "mùa hè năm ngoái"]

TINH_TU = ["yên bình", "nhộn nhịp", "ấm áp", "mát mẻ", "trong lành",
           "thân thuộc", "vui vẻ", "tĩnh lặng", "rực rỡ", "dịu dàng"]

THOI_TIET = ["trời mưa", "trời nắng", "gió nhẹ", "sương mù", "trời se lạnh",
             "nắng vàng", "mưa phùn"]

CAM_XUC = ["thấy vui", "thấy nhớ nhà", "thấy bình yên", "thấy biết ơn",
           "thấy nhẹ nhõm", "thấy háo hức", "thấy bồi hồi"]


# ===========================================================================
#  Mau cau
# ===========================================================================
MAU_CAU = [
    "{nguoi} thích {hoat_dong} vào {thoi_gian}.",
    "{thoi_gian}, {nguoi} đi {noi} để {hoat_dong}.",
    "Ở {noi}, {thoi_gian} thường rất {tinh_tu}.",
    "{nguoi} nấu {mon_an} cho cả nhà vào {thoi_gian}.",
    "Món {mon_an} ở {noi} ngon nổi tiếng.",
    "{thoi_tiet} nên {nguoi} ở nhà {hoat_dong}.",
    "{nguoi} kể rằng {noi} {thoi_gian} rất {tinh_tu}.",
    "Mỗi khi {hoat_dong}, {nguoi} {cam_xuc}.",
    "{noi} là nơi {nguoi} lớn lên.",
    "{thoi_gian} ở {noi}, {thoi_tiet} và mọi thứ đều {tinh_tu}.",
    "{nguoi} và {nguoi2} cùng nhau {hoat_dong} ở {noi}.",
    "Sau khi {hoat_dong}, {nguoi} thường uống {do_uong}.",
    "Người ta nói {noi} {thoi_gian} đẹp nhất.",
    "{nguoi} {cam_xuc} khi trở về {noi}.",
    "Không gì bằng {mon_an} nóng hổi vào {thoi_gian} {thoi_tiet}.",
    "{nguoi} gọi một ly {do_uong} rồi ngồi {hoat_dong}.",
    "{nguoi} học được cách {hoat_dong} từ {nguoi2}.",
    "Ở {noi} có rất nhiều quán {mon_an}.",
    "{thoi_gian} {thoi_tiet}, {nguoi} vẫn đi {hoat_dong} như thường lệ.",
    "Điều {nguoi} nhớ nhất về {noi} là {mon_an}.",
    "{nguoi} bảo rằng {hoat_dong} giúp đầu óc {tinh_tu} hơn.",
]

# Cac cau "cham ngon" lap lai co y - de model hoc duoc cum tu on dinh
CHAM_NGON = [
    "Học đi đôi với hành.",
    "Có công mài sắt có ngày nên kim.",
    "Đi một ngày đàng học một sàng khôn.",
    "Ăn quả nhớ kẻ trồng cây.",
    "Một cây làm chẳng nên non.",
    "Chậm mà chắc còn hơn nhanh mà hỏng.",
    "Muốn đi nhanh thì đi một mình, muốn đi xa thì đi cùng nhau.",
]


# ===========================================================================
def tao_cau(rng: random.Random) -> str:
    mau = rng.choice(MAU_CAU)
    cau = mau.format(
        nguoi=rng.choice(NGUOI),
        nguoi2=rng.choice(NGUOI),
        noi=rng.choice(NOI),
        mon_an=rng.choice(MON_AN),
        hoat_dong=rng.choice(HOAT_DONG),
        thoi_gian=rng.choice(THOI_GIAN),
        tinh_tu=rng.choice(TINH_TU),
        thoi_tiet=rng.choice(THOI_TIET),
        cam_xuc=rng.choice(CAM_XUC),
        do_uong=rng.choice(DO_UONG),
    )
    return cau[0].upper() + cau[1:]      # viet hoa chu cai dau cau


def tao_van_ban(rng: random.Random, so_cau: int) -> str:
    doan_van = []
    cau_trong_doan: list[str] = []

    for i in range(so_cau):
        # ~4% xen mot cham ngon
        cau = rng.choice(CHAM_NGON) if rng.random() < 0.04 else tao_cau(rng)
        cau_trong_doan.append(cau)

        # Ngat doan sau 3-6 cau
        if len(cau_trong_doan) >= rng.randint(3, 6):
            doan_van.append(" ".join(cau_trong_doan))
            cau_trong_doan = []

    if cau_trong_doan:
        doan_van.append(" ".join(cau_trong_doan))

    return "\n\n".join(doan_van) + "\n"


# ===========================================================================
def tao_cau_mau(rng: random.Random) -> list[dict]:
    """200 cau ngan co CHU DE ro rang - de tap tim kiem ngu nghia."""
    chu_de = {
        "am_thuc": [
            "Phở bò Hà Nội có nước dùng ngọt thanh.",
            "Bún chả ăn kèm rau sống rất ngon.",
            "Cà phê sữa đá là thức uống quen thuộc.",
            "Bánh mì Việt Nam nổi tiếng khắp thế giới.",
            "Cơm tấm sườn nướng là món ăn sáng phổ biến.",
            "Gỏi cuốn tôm thịt chấm nước mắm chua ngọt.",
            "Chè đậu xanh mát lạnh giải nhiệt mùa hè.",
            "Hủ tiếu Nam Vang có nhiều loại topping.",
            "Bánh xèo giòn rụm cuốn với rau thơm.",
            "Canh chua cá lóc đậm đà hương vị miền Tây.",
        ],
        "lap_trinh": [
            "Python là ngôn ngữ lập trình dễ học.",
            "Hàm giúp tái sử dụng code hiệu quả.",
            "Vòng lặp for duyệt qua từng phần tử.",
            "Biến lưu trữ giá trị trong bộ nhớ.",
            "Debug là kỹ năng quan trọng của lập trình viên.",
            "Git giúp quản lý phiên bản mã nguồn.",
            "Thư viện NumPy xử lý mảng số rất nhanh.",
            "Kiểm thử tự động giúp code đáng tin cậy hơn.",
            "Cấu trúc dữ liệu ảnh hưởng lớn tới tốc độ.",
            "Đọc thông báo lỗi là bước đầu tiên khi sửa bug.",
        ],
        "thoi_tiet": [
            "Hôm nay trời mưa rất to.",
            "Mùa hè ở miền Bắc nóng và ẩm.",
            "Sương mù dày đặc vào buổi sáng sớm.",
            "Gió mùa đông bắc mang theo không khí lạnh.",
            "Nắng vàng rực rỡ suốt cả ngày.",
            "Mưa phùn kéo dài suốt tháng ba.",
            "Bão đổ bộ vào miền Trung gây ngập lụt.",
            "Trời se lạnh báo hiệu mùa thu đã về.",
            "Nhiệt độ giảm sâu vào ban đêm.",
            "Không khí trong lành sau cơn mưa.",
        ],
        "du_lich": [
            "Vịnh Hạ Long là di sản thiên nhiên thế giới.",
            "Phố cổ Hội An lung linh ánh đèn lồng.",
            "Sa Pa có ruộng bậc thang tuyệt đẹp.",
            "Biển Nha Trang nước trong xanh.",
            "Đà Lạt được gọi là thành phố ngàn hoa.",
            "Hang Sơn Đoòng là hang động lớn nhất thế giới.",
            "Chợ nổi Cái Răng họp từ sáng sớm.",
            "Kinh thành Huế mang đậm dấu ấn lịch sử.",
            "Đảo Phú Quốc có nhiều bãi biển hoang sơ.",
            "Cao nguyên đá Đồng Văn hùng vĩ.",
        ],
        "hoc_tap": [
            "Học đều đặn mỗi ngày hiệu quả hơn học dồn.",
            "Ghi chép bằng tay giúp nhớ lâu hơn.",
            "Đặt câu hỏi là cách học chủ động.",
            "Ôn lại kiến thức cũ trước khi học bài mới.",
            "Thực hành nhiều lần giúp kỹ năng thành thạo.",
            "Dạy lại cho người khác giúp hiểu sâu hơn.",
            "Nghỉ ngơi hợp lý giúp não tiếp thu tốt.",
            "Đặt mục tiêu nhỏ và cụ thể dễ đạt hơn.",
            "Sai lầm là một phần tự nhiên của việc học.",
            "Tập trung một việc tại một thời điểm.",
        ],
    }

    cau_mau = []
    for ten_chu_de, cac_cau in chu_de.items():
        for cau in cac_cau:
            cau_mau.append({"cau": cau, "chu_de": ten_chu_de})

    # Nhan them bien the de du 200 cau
    goc = list(cau_mau)
    while len(cau_mau) < 200:
        m = rng.choice(goc)
        cau_mau.append(m)

    rng.shuffle(cau_mau)
    return cau_mau[:200]


# ===========================================================================
def main() -> None:
    rng = random.Random(SEED)
    THU_MUC_DATA.mkdir(parents=True, exist_ok=True)

    van_ban = tao_van_ban(rng, SO_CAU)
    duong_dan_vb = THU_MUC_DATA / "van_ban_viet.txt"
    duong_dan_vb.write_text(van_ban, encoding="utf-8")

    cau_mau = tao_cau_mau(rng)
    duong_dan_cm = THU_MUC_DATA / "cau_mau.json"
    duong_dan_cm.write_text(
        json.dumps(cau_mau, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    so_ky_tu = len(van_ban)
    tu_vung = sorted(set(van_ban))
    so_tu = len(van_ban.split())
    so_chu_de = len({c["chu_de"] for c in cau_mau})

    print(f"""
  Da tao xong trong thu muc data/

    van_ban_viet.txt   {so_ky_tu:>8,} ky tu   ({so_ky_tu/1000:.0f} KB)
                       {so_tu:>8,} tu
                       {len(tu_vung):>8} ky tu KHAC NHAU (kich thuoc tu vung char-level)

    cau_mau.json       {len(cau_mau):>8} cau, {so_chu_de} chu de

  Tu vung ky tu (dung cho char-level tokenizer):
    {"".join(tu_vung[:70])}
    ...

  Cach nap:
      van_ban = Path("data/van_ban_viet.txt").read_text(encoding="utf-8")
      cau_mau = json.loads(Path("data/cau_mau.json").read_text(encoding="utf-8"))

  Bat dau: curriculum/06-nlp-transformers/README.md
""")


if __name__ == "__main__":
    main()
