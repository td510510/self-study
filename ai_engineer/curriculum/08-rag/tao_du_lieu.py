"""Tao kho tai lieu noi bo + bo cau hoi vang cho Phase 08 (RAG) va project P6.

Chay MOT LAN truoc khi bat dau Tuan 20:

    python curriculum/08-rag/tao_du_lieu.py

Tao ra:
    data/phase08/tai_lieu/*.md      6 tai lieu noi bo cua mot cong ty gia dinh
    data/phase08/cau_hoi_vang.json  18 cau hoi kem DAP AN DUNG (goldset)
    data/phase08/khai_niem.json     tu dien khai niem cho embedding gia lap

VI SAO TU SINH MA KHONG DUNG PDF THAT?
    1. KHONG CAN MANG, khong vuong ban quyen
    2. Ta BIET TRUOC dap an dung nam o dau -> do duoc recall@k mot cach that su
    3. Ta CO Y cai cac bay vao tai lieu de bai hoc xay ra:
         - dap an nam VAT QUA ranh gioi hai muc -> day chunk overlap
         - ma loi dang "VX-204" -> keyword thang embedding
         - cau hoi dien dat khac han tu vung tai lieu -> embedding thang keyword
         - cau hoi KHONG CO dap an trong tai lieu -> day chong bia dat

BO CAU HOI VANG LA THU QUY NHAT O DAY.
    Khong co no, ban chi co the noi "he thong tra loi cung on". Co no,
    ban noi duoc "recall@5 = 0.83, faithfulness = 0.91" - va biet duoc
    hom nay sua chunking co lam hong gi khong.
"""

from __future__ import annotations

import json
from pathlib import Path

GOC_DU_AN = Path(__file__).resolve().parents[2]
THU_MUC = GOC_DU_AN / "data" / "phase08"
THU_MUC_TL = THU_MUC / "tai_lieu"


# ===========================================================================
#  1 - Kho tai lieu noi bo
# ===========================================================================
TAI_LIEU: dict[str, str] = {}

TAI_LIEU["so_tay_nhan_vien.md"] = """# Sổ tay nhân viên — Công ty Vạn Xuân

## 1. Giờ làm việc

Giờ làm việc chính thức là từ 8h30 đến 17h30, nghỉ trưa từ 12h00 đến 13h00.
Nhân viên được phép linh hoạt giờ vào ca trong khoảng 8h00 đến 9h30, miễn là
làm đủ 8 tiếng mỗi ngày và có mặt trong khung giờ lõi từ 10h00 đến 16h00.

Công ty làm việc từ thứ Hai đến thứ Sáu. Thứ Bảy và Chủ nhật nghỉ. Các ngày
lễ theo quy định của Nhà nước được nghỉ hưởng nguyên lương.

## 2. Chấm công

Nhân viên chấm công bằng ứng dụng nội bộ Vạn Xuân Work trên điện thoại.
Quên chấm công quá hai lần trong một tháng sẽ bị trừ nửa ngày phép.
Trường hợp quên chấm công do lỗi ứng dụng, nhân viên gửi ảnh chụp màn hình
cho bộ phận Nhân sự trong vòng 48 giờ để được điều chỉnh.

## 3. Làm việc từ xa

Nhân viên chính thức được làm việc từ xa tối đa 8 ngày mỗi tháng. Nhân viên
thử việc không được làm việc từ xa. Ngày làm từ xa phải đăng ký trước ít nhất
một ngày làm việc trên ứng dụng Vạn Xuân Work và được quản lý trực tiếp duyệt.

Trong ngày làm từ xa, nhân viên phải phản hồi tin nhắn trong vòng 30 phút
trong khung giờ lõi, và phải tham gia đầy đủ các cuộc họp đã lên lịch.

## 4. Trang phục

Trang phục tự do, lịch sự. Khi tiếp khách hàng hoặc quay video quảng bá,
nhân viên mặc áo sơ mi có logo công ty do phòng Hành chính cấp.

## 5. Thiết bị làm việc

Mỗi nhân viên chính thức được cấp một máy tính xách tay và một màn hình rời.
Thiết bị là tài sản công ty, phải bàn giao đầy đủ khi nghỉ việc. Hỏng hóc do
lỗi người dùng, nhân viên chịu 50 phần trăm chi phí sửa chữa.
"""

TAI_LIEU["chinh_sach_nghi_phep.md"] = """# Chính sách nghỉ phép — Công ty Vạn Xuân

## 1. Phép năm

Nhân viên chính thức có 12 ngày phép năm. Mỗi năm làm việc đủ 12 tháng được
cộng thêm 1 ngày, tối đa 18 ngày. Nhân viên thử việc không có phép năm.

Phép năm chưa dùng hết được chuyển sang năm sau tối đa 5 ngày, và phải dùng
xong trước ngày 31 tháng 3. Số ngày vượt quá 5 sẽ bị huỷ, không quy đổi thành tiền.

## 2. Quy trình xin nghỉ

Nghỉ từ 1 đến 2 ngày: đăng ký trên ứng dụng trước ít nhất 3 ngày làm việc,
quản lý trực tiếp duyệt.

Nghỉ từ 3 ngày trở lên: đăng ký trước ít nhất 10 ngày làm việc, cần quản lý
trực tiếp và trưởng phòng cùng duyệt.

Nghỉ đột xuất do việc gấp: báo cho quản lý trực tiếp qua điện thoại trước 9h00
sáng cùng ngày, sau đó bổ sung đơn trên ứng dụng trong vòng 2 ngày làm việc.

## 3. Nghỉ ốm

Nhân viên bị bệnh, không thể đến chỗ làm thì được nghỉ và vẫn nhận lương cho
tối đa 3 ngày mỗi năm mà không cần giấy tờ. Từ ngày thứ tư trở đi phải nộp
giấy chứng nhận của cơ sở y tế, và những ngày này hưởng chế độ bảo hiểm xã hội
chứ không hưởng lương công ty.

Trường hợp nằm viện, nhân viên hoặc người thân báo cho Nhân sự trong vòng
3 ngày kể từ ngày nhập viện.

## 4. Nghỉ thai sản

Lao động nữ được nghỉ thai sản 6 tháng theo Luật Bảo hiểm xã hội. Lao động nam
có vợ sinh con được nghỉ 5 ngày làm việc, hoặc 7 ngày nếu sinh mổ.

Trong 12 tháng đầu sau khi sinh, lao động nữ được rời chỗ làm sớm 60 phút mỗi ngày
mà vẫn hưởng đủ lương.

## 5. Nghỉ việc riêng hưởng nguyên lương

Kết hôn: 3 ngày. Con kết hôn: 1 ngày. Cha mẹ, vợ chồng hoặc con mất: 3 ngày.
Các trường hợp này cần nộp giấy tờ chứng minh trong vòng 15 ngày.
"""

TAI_LIEU["chinh_sach_luong_thuong.md"] = """# Chính sách lương thưởng — Công ty Vạn Xuân

## 1. Kỳ trả lương

Lương được trả vào ngày 5 hàng tháng cho tháng liền trước. Nếu ngày 5 rơi vào
thứ Bảy, Chủ nhật hoặc ngày lễ thì trả vào ngày làm việc liền trước đó.

Phiếu lương được gửi qua email nội bộ vào ngày 3 hàng tháng. Thắc mắc về phiếu
lương gửi cho phòng Nhân sự trong vòng 7 ngày kể từ ngày nhận.

## 2. Thưởng

Thưởng cuối năm bằng 1 tháng lương cơ bản, chi trả trước Tết Nguyên đán 10 ngày.
Nhân viên làm chưa đủ 12 tháng được hưởng theo tỷ lệ số tháng đã làm.

Thưởng theo hiệu quả công việc được xét 2 lần mỗi năm, vào tháng 6 và tháng 12,
mức từ 0 đến 3 tháng lương tuỳ kết quả đánh giá.

## 3. Phụ cấp

Phụ cấp ăn trưa 40.000 đồng mỗi ngày làm việc thực tế, trả cùng lương tháng.
Ngày làm việc từ xa vẫn được tính phụ cấp ăn trưa.

Phụ cấp đi lại 500.000 đồng mỗi tháng cho nhân viên có nơi ở cách văn phòng
trên 10 km. Nhân viên đăng ký một lần khi vào làm, khai báo sai bị thu hồi toàn bộ.

Phụ cấp điện thoại 200.000 đồng mỗi tháng, chỉ áp dụng cho nhân viên kinh doanh
và nhân viên hỗ trợ khách hàng.

## 4. Tăng lương

Công ty xét tăng lương mỗi năm một lần vào tháng 4. Điều kiện: đã làm việc đủ
12 tháng tính đến ngày 31 tháng 3 và không bị kỷ luật từ mức khiển trách trở lên
trong 12 tháng gần nhất.

## 5. Làm thêm giờ

Làm thêm ngày thường hưởng 150 phần trăm lương giờ. Làm thêm ngày nghỉ hàng tuần
hưởng 200 phần trăm. Làm thêm ngày lễ hưởng 300 phần trăm.

Làm thêm giờ phải được quản lý duyệt trước trên ứng dụng. Giờ làm thêm không đăng ký
trước sẽ không được tính lương.
"""

TAI_LIEU["huong_dan_ky_thuat.md"] = """# Hướng dẫn xử lý sự cố — Hệ thống Vạn Xuân Work

## 1. Mã lỗi đăng nhập

**VX-101** — Sai tên đăng nhập hoặc mật khẩu. Người dùng nhập sai quá 5 lần
liên tiếp thì tài khoản bị khoá 15 phút.

**VX-102** — Tài khoản đã bị vô hiệu hoá. Thường gặp khi nhân viên đã nghỉ việc
hoặc đang trong thời gian tạm đình chỉ.

**VX-103** — Phiên đăng nhập hết hạn. Phiên làm việc tự động hết hạn sau 8 giờ
không thao tác.

## 2. Mã lỗi đồng bộ dữ liệu

**VX-201** — Không kết nối được máy chủ. Kiểm tra mạng trước, sau đó kiểm tra
trạng thái hệ thống tại trang nội bộ.

**VX-202** — Phiên bản ứng dụng quá cũ, máy chủ từ chối. Cần cập nhật ứng dụng.

**VX-204** — Xung đột dữ liệu chấm công. Lỗi này xảy ra khi một bản ghi chấm công
được sửa đồng thời trên điện thoại và trên trình duyệt, hệ thống không biết giữ
bản nào. Đây là lỗi hay gặp nhất sau các kỳ nghỉ dài.

## 3. Cách khắc phục lỗi xung đột dữ liệu

Với lỗi ở mục trên, người dùng thực hiện ba bước theo đúng thứ tự. Bước một,
đăng xuất khỏi ứng dụng trên tất cả thiết bị. Bước hai, đăng nhập lại chỉ trên
một thiết bị duy nhất và chờ đồng bộ xong. Bước ba, kiểm tra lại bản ghi chấm công
của ngày bị lỗi và sửa nếu cần.

Nếu sau ba bước trên vẫn còn lỗi, gửi yêu cầu hỗ trợ kèm mã lỗi và ảnh chụp
màn hình cho bộ phận Công nghệ thông tin.

## 4. Mã lỗi báo cáo

**VX-301** — Không đủ quyền xem báo cáo. Chỉ quản lý cấp phòng trở lên xem được
báo cáo toàn phòng.

**VX-305** — Báo cáo quá lớn, vượt giới hạn 50.000 dòng. Cần lọc bớt khoảng thời gian
hoặc xuất theo từng phòng.

## 5. Liên hệ hỗ trợ

Bộ phận Công nghệ thông tin xử lý yêu cầu trong giờ làm việc, thời gian phản hồi
cam kết là 4 giờ làm việc với lỗi thường và 1 giờ với lỗi chặn công việc.
"""

TAI_LIEU["faq_khach_hang.md"] = """# Câu hỏi thường gặp — Khách hàng Vạn Xuân

## 1. Bảo hành

Sản phẩm được bảo hành 12 tháng kể từ ngày mua ghi trên hoá đơn. Pin và phụ kiện
đi kèm bảo hành 6 tháng.

Bảo hành không áp dụng cho hư hỏng do rơi vỡ, vào nước, tự ý tháo máy, hoặc sử dụng
sai hướng dẫn. Sản phẩm mất tem bảo hành cũng không được bảo hành.

Thời gian sửa chữa bảo hành tối đa 15 ngày làm việc. Quá thời hạn này mà chưa sửa xong,
khách hàng được đổi sản phẩm tương đương.

## 2. Đổi trả

Khách hàng được đổi trả trong 7 ngày kể từ ngày nhận hàng nếu sản phẩm còn nguyên
hộp, đủ phụ kiện và chưa có dấu hiệu sử dụng.

Sản phẩm lỗi do nhà sản xuất được đổi mới trong 30 ngày đầu, miễn phí vận chuyển
hai chiều.

Không áp dụng đổi trả với hàng đã qua sử dụng, hàng giảm giá trên 50 phần trăm,
và các sản phẩm thuộc nhóm vệ sinh cá nhân.

## 3. Vận chuyển

Đơn hàng nội thành giao trong 1 đến 2 ngày làm việc. Đơn hàng liên tỉnh giao trong
3 đến 5 ngày làm việc. Đơn hàng đến các huyện đảo có thể mất tới 10 ngày.

Miễn phí vận chuyển cho đơn hàng từ 500.000 đồng trở lên. Dưới mức này, phí vận chuyển
là 30.000 đồng nội thành và 45.000 đồng liên tỉnh.

Khách hàng được kiểm tra hàng trước khi thanh toán, nhưng không được dùng thử sản phẩm.

## 4. Thanh toán

Chấp nhận tiền mặt khi nhận hàng, chuyển khoản ngân hàng, và ví điện tử.
Đơn hàng trên 20 triệu đồng bắt buộc chuyển khoản trước 30 phần trăm giá trị.

## 5. Hoàn tiền

Hoàn tiền được xử lý trong 7 ngày làm việc kể từ khi công ty nhận lại hàng và
xác nhận đủ điều kiện. Tiền được hoàn về đúng phương thức thanh toán ban đầu.
"""

TAI_LIEU["quy_dinh_bao_mat.md"] = """# Quy định bảo mật thông tin — Công ty Vạn Xuân

## 1. Mật khẩu

Mật khẩu hệ thống nội bộ tối thiểu 12 ký tự, gồm chữ hoa, chữ thường, số và
ký tự đặc biệt. Bắt buộc đổi mật khẩu 90 ngày một lần và không được dùng lại
5 mật khẩu gần nhất.

Tuyệt đối không chia sẻ mật khẩu, kể cả với đồng nghiệp và cấp trên. Bộ phận
Công nghệ thông tin không bao giờ hỏi mật khẩu của bạn.

Bắt buộc bật xác thực hai lớp cho tài khoản email và tài khoản quản trị.

## 2. Dữ liệu khách hàng

Dữ liệu khách hàng chỉ được truy cập khi phục vụ công việc cụ thể. Nghiêm cấm
tải dữ liệu khách hàng về máy cá nhân hoặc gửi ra hộp thư cá nhân.

Khi cần chia sẻ dữ liệu ra bên ngoài, phải ẩn danh các trường nhạy cảm gồm
số điện thoại, địa chỉ, số căn cước và thông tin thanh toán.

Vi phạm quy định về dữ liệu khách hàng bị xử lý kỷ luật từ mức khiển trách,
trường hợp nghiêm trọng có thể bị chấm dứt hợp đồng và truy cứu trách nhiệm pháp lý.

## 3. Thiết bị

Máy tính công ty phải cài phần mềm quản lý thiết bị của phòng Công nghệ thông tin
và bật mã hoá ổ đĩa. Không cài phần mềm ngoài danh sách cho phép.

Khi rời chỗ ngồi, khoá màn hình. Không để tài liệu in chứa thông tin khách hàng
trên bàn qua đêm.

## 4. Sự cố bảo mật

Nghi ngờ bị lộ mật khẩu, mất thiết bị, hoặc nhận email lừa đảo: báo ngay cho
phòng Công nghệ thông tin trong vòng 1 giờ. Báo cáo trung thực và kịp thời
không bị xử lý kỷ luật, kể cả khi bạn là người gây ra sự cố.

## 5. Công cụ trí tuệ nhân tạo

Nhân viên được dùng công cụ AI để hỗ trợ công việc, nhưng không được dán dữ liệu
khách hàng, mã nguồn nội bộ, hoặc tài liệu đóng dấu mật vào các công cụ này.
"""


# ===========================================================================
#  2 - Tu dien khai niem cho EMBEDDING GIA LAP
# ===========================================================================
# Moi khai niem la MOT CHIEU cua vector. Van ban duoc bieu dien bang so lan
# xuat hien cua cac tu khoa thuoc tung khai niem.
#
# VI SAO PHAI LAM THE NAY?
#   Embedding that (sentence-transformers) can tai model ~90 MB. Bai hoc phai
#   chay duoc KHONG CAN MANG, nen ta lam mot ban gia lap. No khong thong minh
#   bang model that, nhung no co dung TINH CHAT quan trong nhat de day RAG:
#   hai cach dien dat khac nhau cua cung mot y se ra vector gan nhau
#   ("ngoi nha lam viec" va "lam viec tu xa" cung roi vao khai niem TU_XA).
#
# LUU Y THANH THAT: model that HOC duoc dieu nay tu du lieu; o day ta GAN TAY.
# Notebook se cho ban so sanh hai ben neu da cai sentence-transformers.
KHAI_NIEM: dict[str, list[str]] = {
    "gio_lam": ["giờ làm việc", "mấy giờ", "8h30", "17h30", "giờ lõi", "vào ca",
                "nghỉ trưa", "đủ 8 tiếng", "thứ bảy", "ngày lễ"],
    "tu_xa": ["từ xa", "ở nhà", "tại nhà", "ngồi nhà", "remote", "wfh",
              "không lên văn phòng"],
    "cham_cong": ["chấm công", "điểm danh", "quên chấm", "bản ghi chấm công"],
    "phep_nam": ["phép năm", "ngày phép", "nghỉ phép", "phép", "chuyển sang năm sau"],
    "om_dau": ["ốm", "bệnh", "bị bệnh", "nằm viện", "cơ sở y tế", "giấy chứng nhận",
               "sức khoẻ", "khám bệnh", "nhập viện"],
    "thai_san": ["thai sản", "sinh con", "sinh mổ", "vợ sinh", "lao động nữ",
                 "sau khi sinh", "mang thai"],
    "viec_rieng": ["kết hôn", "cưới", "tang", "mất", "việc riêng", "hiếu hỉ"],
    "luong": ["lương", "trả lương", "phiếu lương", "kỳ lương", "thu nhập"],
    "thuong": ["thưởng", "tết nguyên đán", "cuối năm", "hiệu quả công việc"],
    "phu_cap": ["phụ cấp", "ăn trưa", "tiền ăn", "tiền cơm", "đi lại", "xăng xe",
                "phụ cấp điện thoại"],
    "tang_luong": ["tăng lương", "xét tăng lương", "nâng lương"],
    "lam_them": ["làm thêm", "tăng ca", "ngoài giờ", "overtime", "150 phần trăm"],
    "dang_nhap": ["đăng nhập", "đăng xuất", "tài khoản", "phiên đăng nhập",
                  "sai mật khẩu", "khoá tài khoản"],
    "dong_bo": ["đồng bộ", "xung đột", "máy chủ", "kết nối", "phiên bản ứng dụng"],
    "bao_cao": ["báo cáo", "quyền xem", "xuất báo cáo"],
    # CO Y KHONG dua "vx-204", "vx-305"... vao day. Embedding that cung YEU
    # voi cac ma dinh danh hiem: model chua tung thay chuoi do du nhieu lan
    # de hoc duoc y nghia. Do la ly do ta van can tim kiem theo tu khoa.
    "su_co": ["mã lỗi", "báo lỗi", "sự cố", "khắc phục", "bị lỗi"],
    "ho_tro_it": ["hỗ trợ", "công nghệ thông tin", "yêu cầu hỗ trợ", "thời gian phản hồi",
                  "ảnh chụp màn hình"],
    "bao_hanh": ["bảo hành", "tem bảo hành", "sửa chữa", "hư hỏng", "rơi vỡ"],
    "doi_tra": ["đổi trả", "trả hàng", "đổi hàng", "đổi mới", "nguyên hộp"],
    "van_chuyen": ["vận chuyển", "giao hàng", "giao trong", "phí vận chuyển",
                   "nội thành", "liên tỉnh"],
    "thanh_toan": ["thanh toán", "chuyển khoản", "tiền mặt", "ví điện tử", "hoàn tiền"],
    "bao_mat": ["bảo mật", "mật khẩu", "xác thực hai lớp", "mã hoá", "lộ mật khẩu",
                "lừa đảo"],
    "du_lieu_kh": ["dữ liệu khách hàng", "ẩn danh", "nhạy cảm", "căn cước",
                   "hộp thư cá nhân"],
    "thiet_bi": ["thiết bị", "máy tính", "laptop", "màn hình", "ổ đĩa", "bàn giao"],
    "ky_luat": ["kỷ luật", "khiển trách", "vi phạm", "chấm dứt hợp đồng", "thu hồi"],
    "quy_trinh_duyet": ["duyệt", "đăng ký trước", "quản lý trực tiếp", "trưởng phòng",
                        "nộp đơn", "báo trước"],
    "cong_cu_ai": ["trí tuệ nhân tạo", "công cụ ai", "dán dữ liệu"],
    "thu_viec": ["thử việc", "chính thức", "đủ 12 tháng"],
}


# ===========================================================================
#  3 - Bo cau hoi vang (goldset)
# ===========================================================================
# Moi cau hoi co:
#   id             - ten ngan de goi trong bao cao eval
#   cau_hoi        - cau nguoi dung go vao
#   tai_lieu_dung  - file NAO chua dap an (rong = KHONG co trong tai lieu)
#   tu_khoa        - tu/so BAT BUOC phai xuat hien trong cau tra loi dung
#   loai           - de / ma_loi / dien_dat_khac / nhieu_doan / kho / khong_co
#   ghi_chu        - vi sao cau nay duoc dua vao bo test
CAU_HOI_VANG = [
    # --- de: tu vung cau hoi trung tai lieu, ca hai cach tim deu ra ---
    {"id": "gio_lam_viec", "loai": "de",
     "trich_dan": [
         "từ 8h30 đến 17h30"],
     "cau_hoi": "Giờ làm việc chính thức của công ty là mấy giờ?",
     "tai_lieu_dung": ["so_tay_nhan_vien.md"], "tu_khoa": ["8h30", "17h30"],
     "ghi_chu": "Case co ban. Neu cau nay sai thi he thong hong o dau do rat co ban."},
    {"id": "so_ngay_phep", "loai": "de",
     "trich_dan": [
         "có 12 ngày phép năm"],
     "cau_hoi": "Nhân viên chính thức có bao nhiêu ngày phép năm?",
     "tai_lieu_dung": ["chinh_sach_nghi_phep.md"], "tu_khoa": ["12"],
     "ghi_chu": "Case co ban."},
    {"id": "ngay_tra_luong", "loai": "de",
     "trich_dan": [
         "trả vào ngày 5 hàng tháng"],
     "cau_hoi": "Công ty trả lương vào ngày nào hàng tháng?",
     "tai_lieu_dung": ["chinh_sach_luong_thuong.md"], "tu_khoa": ["ngày 5"],
     "ghi_chu": "Case co ban."},
    {"id": "thoi_han_bao_hanh", "loai": "de",
     "trich_dan": [
         "bảo hành 12 tháng kể từ ngày mua"],
     "cau_hoi": "Sản phẩm được bảo hành trong bao lâu?",
     "tai_lieu_dung": ["faq_khach_hang.md"], "tu_khoa": ["12 tháng"],
     "ghi_chu": "Case co ban."},
    {"id": "do_dai_mat_khau", "loai": "de",
     "trich_dan": [
         "tối thiểu 12 ký tự"],
     "cau_hoi": "Mật khẩu hệ thống nội bộ phải dài tối thiểu bao nhiêu ký tự?",
     "tai_lieu_dung": ["quy_dinh_bao_mat.md"], "tu_khoa": ["12"],
     "ghi_chu": "Case co ban."},

    # --- ma_loi: chuoi chinh xac, TIM THEO TU KHOA thang embedding ---
    {"id": "vx204_la_gi", "loai": "ma_loi",
     "trich_dan": [
         "Xung đột dữ liệu chấm công"],
     "cau_hoi": "Mã lỗi VX-204 nghĩa là gì?",
     "tai_lieu_dung": ["huong_dan_ky_thuat.md"], "tu_khoa": ["xung đột", "chấm công"],
     "ghi_chu": "Ma loi la chuoi chinh xac. Embedding thuong ra 'mot loi nao do' "
                "trong khi BM25 nhay dung. Day la ly do can hybrid search."},
    {"id": "vx305_lam_sao", "loai": "ma_loi",
     "trich_dan": [
         "vượt giới hạn 50.000 dòng"],
     "cau_hoi": "Gặp mã VX-305 thì phải xử lý thế nào?",
     "tai_lieu_dung": ["huong_dan_ky_thuat.md"], "tu_khoa": ["lọc"],
     "ghi_chu": "Cung ly do voi vx204_la_gi: chuoi 'VX-305' la ma dinh danh "
                "hiem, embedding gan nhu mu. Cau nay con la case cho thay "
                "hybrid CO THE lam hong thu ma BM25 von lam hoan hao."},

    # --- dien_dat_khac: khong trung tu vung, EMBEDDING thang tu khoa ---
    {"id": "om_co_bi_tru_luong", "loai": "dien_dat_khac",
     "trich_dan": [
         "tối đa 3 ngày mỗi năm mà không cần giấy tờ"],
     "cau_hoi": "Tôi bị bệnh không đến chỗ làm được thì có mất lương không?",
     "tai_lieu_dung": ["chinh_sach_nghi_phep.md"], "tu_khoa": ["3 ngày"],
     "ghi_chu": "Cau hoi khong he co tu 'nghi om'. BM25 de truot, embedding "
                "van bat duoc vi cung khai niem om dau."},
    {"id": "ngoi_nha_lam_viec", "loai": "dien_dat_khac",
     "trich_dan": [
         "làm việc từ xa tối đa 8 ngày mỗi tháng"],
     "cau_hoi": "Tôi có được ngồi nhà làm việc không, mỗi tháng bao nhiêu lần?",
     "tai_lieu_dung": ["so_tay_nhan_vien.md"], "tu_khoa": ["8 ngày"],
     "ghi_chu": "'Ngoi nha lam viec' vs 'lam viec tu xa' - cung y, khac tu."},
    {"id": "ho_tro_tien_an", "loai": "dien_dat_khac",
     "trich_dan": [
         "Phụ cấp ăn trưa 40.000 đồng"],
     "cau_hoi": "Công ty có hỗ trợ tiền cơm trưa cho nhân viên không?",
     "tai_lieu_dung": ["chinh_sach_luong_thuong.md"], "tu_khoa": ["40.000"],
     "ghi_chu": "'Tien com trua' vs 'phu cap an trua'."},
    {"id": "chong_nghi_khi_vo_sinh", "loai": "dien_dat_khac",
     "trich_dan": [
         "nghỉ 5 ngày làm việc, hoặc 7 ngày nếu sinh mổ"],
     "cau_hoi": "Chồng có được nghỉ khi vợ sinh con không?",
     "tai_lieu_dung": ["chinh_sach_nghi_phep.md"], "tu_khoa": ["5 ngày"],
     "ghi_chu": "Tai lieu viet 'lao dong nam co vo sinh con'."},

    # --- nhieu_doan: dap an nam o HAI CHO -> day chunking va overlap ---
    {"id": "sua_loi_vx204", "loai": "nhieu_doan",
     "trich_dan": [
         "Xung đột dữ liệu chấm công",
         "đăng xuất khỏi ứng dụng trên tất cả thiết bị"],
     "cau_hoi": "Làm thế nào để sửa lỗi VX-204?",
     "tai_lieu_dung": ["huong_dan_ky_thuat.md"],
     "tu_khoa": ["đăng xuất", "một thiết bị"],
     "ghi_chu": "BAY QUAN TRONG NHAT. Mo ta loi o muc 2, cach sua o muc 3 "
                "va muc 3 chi noi 'loi o muc tren' - khong nhac lai VX-204. "
                "Chunk theo tieu de se tach dut nguyen nhan khoi cach sua."},
    {"id": "phep_du_co_mat_khong", "loai": "nhieu_doan",
     "trich_dan": [
         "chuyển sang năm sau tối đa 5 ngày",
         "dùng xong trước ngày 31 tháng 3"],
     "cau_hoi": "Phép năm dùng không hết có bị mất không?",
     "tai_lieu_dung": ["chinh_sach_nghi_phep.md"],
     "tu_khoa": ["5 ngày", "31 tháng 3"],
     "ghi_chu": "Dap an gom hai y nam o hai cau lien tiep - chunk qua nho se cat doi."},

    # --- kho: nhieu tai lieu, hoac so de gay nham ---
    {"id": "han_che_thu_viec", "loai": "kho",
     "trich_dan": [
         "Nhân viên thử việc không được làm việc từ xa",
         "Nhân viên thử việc không có phép năm"],
     "cau_hoi": "Nhân viên thử việc bị hạn chế những gì?",
     "tai_lieu_dung": ["so_tay_nhan_vien.md", "chinh_sach_nghi_phep.md"],
     "tu_khoa": ["từ xa", "phép năm"],
     "ghi_chu": "Dap an nam o HAI tai lieu khac nhau. k=1 chac chan tra loi thieu."},
    {"id": "ai_duyet_don_nghi", "loai": "kho",
     "trich_dan": [
         "Nghỉ từ 3 ngày trở lên",
         "trưởng phòng cùng duyệt"],
     "cau_hoi": "Nghỉ mấy ngày thì cần trưởng phòng duyệt?",
     "tai_lieu_dung": ["chinh_sach_nghi_phep.md"], "tu_khoa": ["3 ngày"],
     "ghi_chu": "Trong kho co rat nhieu cum '3 ngay' o cac ngu canh khac "
                "(nghi om, tang che, nhap vien). De lay nham doan."},
    {"id": "lam_them_ngay_le", "loai": "kho",
     "trich_dan": [
         "Làm thêm ngày lễ hưởng 300 phần trăm"],
     "cau_hoi": "Làm thêm vào ngày lễ được trả bao nhiêu phần trăm?",
     "tai_lieu_dung": ["chinh_sach_luong_thuong.md"], "tu_khoa": ["300"],
     "ghi_chu": "Ba con so 150/200/300 rat de bi model lay nham dong."},

    # --- khong_co: KHONG co dap an -> he thong phai NOI KHONG BIET ---
    {"id": "hoc_phi_cho_con", "loai": "khong_co",
     "trich_dan": [],
     "cau_hoi": "Công ty có hỗ trợ học phí cho con nhân viên không?",
     "tai_lieu_dung": [], "tu_khoa": [],
     "ghi_chu": "Khong co trong tai lieu. Cau tra loi DUNG la 'khong tim thay'."},
    {"id": "xe_dua_don", "loai": "khong_co",
     "trich_dan": [],
     "cau_hoi": "Công ty có xe đưa đón nhân viên đi làm không?",
     "tai_lieu_dung": [], "tu_khoa": [],
     "ghi_chu": "BAY: kho co 'phu cap di lai' rat giong -> retrieval CHAC CHAN "
                "tra ve doan do voi diem cao. Model phai du tinh tao de noi "
                "'tai lieu chi noi ve phu cap di lai, khong noi ve xe dua don'."},
]


# ===========================================================================
#  4 - Ghi ra dia
# ===========================================================================
def chuan_hoa(s: str) -> str:
    """Gop moi khoang trang va xuong dong thanh mot dau cach.

    CAN THIET vi tai lieu duoc xuong dong theo do rong trang, nen mot cum tu
    co that co the bi cat lam doi boi mot ky tu newline. So khop tho se bao
    "khong tim thay" trong khi doan van RO RANG co cum do.
    """
    return " ".join(s.split())


def main() -> None:
    THU_MUC_TL.mkdir(parents=True, exist_ok=True)

    tong_ky_tu = 0
    for ten, noi_dung in TAI_LIEU.items():
        (THU_MUC_TL / ten).write_text(noi_dung, encoding="utf-8")
        tong_ky_tu += len(noi_dung)

    (THU_MUC / "cau_hoi_vang.json").write_text(
        json.dumps(CAU_HOI_VANG, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    (THU_MUC / "khai_niem.json").write_text(
        json.dumps(KHAI_NIEM, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    # -- Kiem tra tinh nhat quan cua goldset --------------------------------
    # Goldset SAI thi moi con so eval ve sau deu vo nghia, nen kiem ngay o day.
    for c in CAU_HOI_VANG:
        for tl in c["tai_lieu_dung"]:
            if tl not in TAI_LIEU:
                raise SystemExit(f"[{c['id']}] tro toi tai lieu khong ton tai: {tl}")

        # Moi trich dan phai la doan CO THAT trong tai lieu, neu khong thi
        # recall do duoc se luon bang 0 va ban se di sua nham cho khac.
        for td in c["trich_dan"]:
            if not any(chuan_hoa(td) in chuan_hoa(TAI_LIEU[tl])
                       for tl in c["tai_lieu_dung"]):
                raise SystemExit(f"[{c['id']}] trich dan khong co trong tai lieu: {td!r}")

        if c["tai_lieu_dung"] and not c["trich_dan"]:
            raise SystemExit(f"[{c['id']}] co tai lieu dung nhung thieu trich dan")
        if not c["tai_lieu_dung"] and c["trich_dan"]:
            raise SystemExit(f"[{c['id']}] loai khong_co ma lai co trich dan")

    dem = {}
    for c in CAU_HOI_VANG:
        dem[c["loai"]] = dem.get(c["loai"], 0) + 1

    print(f"Da tao {len(TAI_LIEU)} tai lieu ({tong_ky_tu:,} ky tu) tai {THU_MUC_TL}")
    print(f"Da tao {len(CAU_HOI_VANG)} cau hoi vang tai {THU_MUC / 'cau_hoi_vang.json'}")
    print(f"Da tao tu dien {len(KHAI_NIEM)} khai niem tai {THU_MUC / 'khai_niem.json'}")
    print()
    print("Phan bo loai cau hoi:")
    for loai, so in sorted(dem.items()):
        print(f"   {loai:<16} {so}")
    print()
    print("Doc thu:")
    print('   from pathlib import Path')
    print('   docs = {p.name: p.read_text(encoding="utf-8")')
    print('           for p in Path("data/phase08/tai_lieu").glob("*.md")}')


if __name__ == "__main__":
    main()
