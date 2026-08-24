# ⚙️ SETUP — Cài đặt môi trường (Windows)

> Thời gian: **60–90 phút**. Đây là bước tốn công nhất nhưng chỉ làm **một lần duy nhất**.
> Nếu vướng ở bước nào, xem mục [Xử lý sự cố](#-xử-lý-sự-cố-thường-gặp) ở cuối trang.

**Checklist tổng:**
- [ ] 1. Cài Python 3.11+
- [ ] 2. Cài Git
- [ ] 3. Cài VSCode + extension
- [ ] 4. Tạo môi trường ảo & cài thư viện
- [ ] 5. Lấy API key Claude *(có thể hoãn tới Tuần 16)*
- [ ] 6. Chạy script kiểm tra
- [ ] 7. Tạo repo GitHub

---

## 1. Cài Python 3.11+

### Cách làm

1. Vào https://www.python.org/downloads/windows/
2. Tải bản **Windows installer (64-bit)** phiên bản 3.11 hoặc 3.12
   *(tránh 3.13+ vì một số thư viện AI chưa hỗ trợ đầy đủ)*
3. Chạy file cài đặt và **BẮT BUỘC tick vào ô `Add python.exe to PATH`** ở màn hình đầu tiên

```
┌──────────────────────────────────────────────┐
│  Install Python 3.12                         │
│                                              │
│  [ Install Now ]                             │
│  [ Customize installation ]                  │
│                                              │
│  ☑ Use admin privileges when installing      │
│  ☑ Add python.exe to PATH   ← TICK Ô NÀY!!!  │
└──────────────────────────────────────────────┘
```

> ⚠️ Quên tick ô này là nguyên nhân #1 khiến người mới bị lỗi `'python' is not recognized`.
> Nếu lỡ quên: chạy lại installer → chọn **Modify** → tick lại.

### Kiểm tra

Mở **PowerShell** (bấm phím Windows, gõ "powershell", Enter) và chạy:

```powershell
python --version
```

Kết quả mong đợi:
```
Python 3.12.x
```

---

## 2. Cài Git

Git là công cụ lưu lịch sử code. Bạn sẽ commit mỗi ngày học (nguyên tắc #6).

1. Tải tại https://git-scm.com/download/win
2. Chạy installer, **để mặc định tất cả**, bấm Next liên tục

### Kiểm tra & cấu hình danh tính

```powershell
git --version

# Khai báo bạn là ai (thay bằng tên & email thật của bạn)
git config --global user.name "Ten Cua Ban"
git config --global user.email "email@cua-ban.com"
```

---

## 3. Cài VSCode

VSCode là nơi bạn viết code.

1. Tải tại https://code.visualstudio.com/
2. Cài đặt, **nhớ tick** `Add to PATH` và `Open with Code` (context menu)

### Extension bắt buộc

Mở VSCode → bấm `Ctrl+Shift+X` → tìm và cài:

| Extension | Publisher | Dùng để |
|---|---|---|
| **Python** | Microsoft | Chạy & debug Python |
| **Jupyter** | Microsoft | Chạy notebook `.ipynb` |
| **Pylance** | Microsoft | Gợi ý code, bắt lỗi type |
| **Ruff** | Astral Software | Format & kiểm tra code sạch |

### Mở thư mục học

```powershell
cd D:\Study\IT\Teach\ai_engineer
code .
```

---

## 4. Tạo môi trường ảo & cài thư viện

### Môi trường ảo (virtual environment) là gì?

Mỗi project cần bộ thư viện riêng, phiên bản riêng. Nếu cài chung vào máy, project A cần `numpy 1.x` còn project B cần `numpy 2.x` sẽ đá nhau.

**Môi trường ảo = một cái hộp riêng chứa Python + thư viện chỉ dành cho project này.**

```
Máy tính của bạn
├── Python hệ thống          ← KHÔNG cài thư viện vào đây
└── ai_engineer/
    └── .venv/               ← cài mọi thứ vào đây
        ├── numpy 2.1
        ├── pandas 2.2
        └── ...
```

### Tạo môi trường ảo

Trong PowerShell, tại thư mục `ai_engineer`:

```powershell
# Tạo môi trường ảo tên .venv
python -m venv .venv

# Kích hoạt nó
.\.venv\Scripts\Activate.ps1
```

Sau khi kích hoạt thành công, dòng lệnh sẽ có tiền tố `(.venv)`:

```
(.venv) PS D:\Study\IT\Teach\ai_engineer>
```

> 🔁 **Mỗi lần mở terminal mới, bạn PHẢI chạy lại lệnh kích hoạt.** Không có `(.venv)` ở đầu dòng = thư viện sẽ không tìm thấy.

<details>
<summary>❗ Nếu gặp lỗi "running scripts is disabled on this system"</summary>

Windows chặn chạy script theo mặc định. Mở PowerShell **với quyền Administrator** và chạy:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Gõ `Y` để xác nhận, đóng PowerShell, mở lại và thử kích hoạt lần nữa.
</details>

### Cài thư viện

Chương trình chia thư viện theo giai đoạn để bạn không phải tải 3GB ngay từ tuần 1.

```powershell
# Nâng cấp pip trước
python -m pip install --upgrade pip

# ---- Cài NGAY BÂY GIỜ (Phase 00–03, ~150MB) ----
pip install -e ".[core]"
```

Các nhóm còn lại **chỉ cài khi học đến phase đó**:

| Lệnh | Cài khi bắt đầu | Dung lượng |
|---|---|---|
| `pip install -e ".[core]"` | Tuần 1 (ngay bây giờ) | ~150 MB |
| `pip install -e ".[ml]"` | Tuần 9 — Phase 04 | ~200 MB |
| `pip install -e ".[dl]"` | Tuần 12 — Phase 05 | ~2.5 GB |
| `pip install -e ".[llm]"` | Tuần 16 — Phase 07 | ~50 MB |
| `pip install -e ".[rag]"` | Tuần 20 — Phase 08 | ~500 MB |
| `pip install -e ".[deploy]"` | Tuần 22 — Phase 10 | ~80 MB |

---

## 5. Lấy API key Claude

> ⏭ **Bước này có thể hoãn đến Tuần 16.** Phase 00–06 không cần API key. Nếu đang ở tuần 1, cứ bỏ qua và quay lại sau.

1. Vào https://console.anthropic.com/ và đăng ký tài khoản
2. Vào mục **Billing** → nạp tối thiểu **$5** (đủ cho cả khoá học)
3. Vào mục **API Keys** → **Create Key** → copy chuỗi bắt đầu bằng `sk-ant-...`
4. Tạo file `.env` ở thư mục gốc bằng cách copy file mẫu:

```powershell
copy .env.example .env
```

5. Mở file `.env` trong VSCode và dán key vào:

```
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxx
```

### 🔐 Quy tắc bảo mật API key — đọc kỹ

| Việc | Hậu quả nếu sai |
|---|---|
| ❌ **KHÔNG BAO GIỜ** commit file `.env` lên GitHub | Bot quét GitHub 24/7, key bị lộ sẽ bị dùng hết tiền trong vài phút |
| ❌ **KHÔNG** viết key thẳng trong file `.py` | Cùng lý do trên |
| ❌ **KHÔNG** gửi key qua chat/email/screenshot | Key = tiền của bạn |
| ✅ Luôn đọc key từ biến môi trường | `os.environ["ANTHROPIC_API_KEY"]` |
| ✅ File `.gitignore` đã chặn sẵn `.env` | Đừng tự ý xoá dòng đó |

> Nếu lỡ lộ key: vào Console → API Keys → **Revoke** key cũ ngay, tạo key mới.

### Đặt hạn mức chi tiêu (BẮT BUỘC làm ngay)

Console → **Billing** → **Spend limits** → đặt giới hạn `$10/tháng`.

Đây là lưới an toàn phòng khi code bị lỗi gọi API vô hạn trong vòng lặp — chuyện
xảy ra thường xuyên hơn bạn nghĩ, nhất là ở Phase 09 khi bạn viết agent tự chạy.

| Bạn đang làm | Hạn mức nên đặt |
|---|---|
| Bài tập + notebook (Phase 07–10) | `$10/tháng` là quá đủ |
| Thêm mini-project và project lớn | `$15/tháng` |
| Capstone có so sánh nhiều model | `$25/tháng` |

> ⚠️ Hạn mức ở Console là **lớp chặn cuối cùng**, không phải lớp duy nhất. Phase 10
> sẽ dạy bạn xây thêm hai lớp ở phía ứng dụng: giới hạn độ dài đầu vào và ngân
> sách tự chặn. Lý do đơn giản — khi hạn mức Console kích hoạt thì dịch vụ của bạn
> đã dừng hẳn, còn ngân sách trong ứng dụng thì từ chối có kiểm soát.

---

## 6. Chạy script kiểm tra

Đây là bước xác nhận mọi thứ đã sẵn sàng:

```powershell
python curriculum/00-setup/exercises/check_environment.py
```

Kết quả mong đợi:

```
==================================================
  KIỂM TRA MÔI TRƯỜNG HỌC TẬP
==================================================
[PASS] Python 3.12.3
[PASS] Đang chạy trong môi trường ảo (.venv)
[PASS] Git 2.45.1
[PASS] numpy       2.1.0
[PASS] pandas      2.2.3
[PASS] matplotlib  3.9.2
[PASS] pytest      8.3.3
[SKIP] ANTHROPIC_API_KEY chưa đặt (chỉ cần từ Tuần 16)
--------------------------------------------------
  ✅ SẴN SÀNG! Mở curriculum/00-setup/README.md
==================================================
```

Nếu có dòng `[FAIL]`, script sẽ in gợi ý sửa ngay bên dưới dòng đó.

---

## 7. Tạo repo GitHub

Bạn cần nơi lưu code và khoe tiến độ.

1. Vào https://github.com → đăng ký / đăng nhập
2. Bấm **New repository** → đặt tên `ai-engineer-journey` → chọn **Private** (bạn có thể mở Public sau)
3. **KHÔNG** tick "Add a README file"
4. Quay lại PowerShell:

```powershell
git add .
git commit -m "Setup: khoi tao moi truong hoc tap"

# Thay <username> bằng username GitHub của bạn
git remote add origin https://github.com/<username>/ai-engineer-journey.git
git branch -M main
git push -u origin main
```

### Thói quen commit hàng ngày

Cuối mỗi buổi học:

```powershell
git add .
git commit -m "Tuan 2: hoan thanh bai tap ham va vong lap"
git push
```

---

## 🔧 Xử lý sự cố thường gặp

<details>
<summary><b>'python' is not recognized as an internal or external command</b></summary>

Python chưa được thêm vào PATH.
1. Mở lại file cài đặt Python → **Modify** → Next → tick `Add Python to environment variables` → Install
2. **Đóng hẳn PowerShell và mở lại** (PATH chỉ nạp khi mở terminal mới)
3. Thử `python --version` lần nữa

Nếu vẫn lỗi, thử `py --version` — trên Windows lệnh `py` luôn hoạt động.
</details>

<details>
<summary><b>running scripts is disabled on this system</b></summary>

Xem mục [Tạo môi trường ảo](#tạo-môi-trường-ảo) ở trên — chạy lệnh `Set-ExecutionPolicy`.
</details>

<details>
<summary><b>ModuleNotFoundError: No module named 'numpy'</b></summary>

99% là do **quên kích hoạt môi trường ảo**. Kiểm tra dòng lệnh có `(.venv)` ở đầu không.

```powershell
.\.venv\Scripts\Activate.ps1
```

Nếu đã có `(.venv)` mà vẫn lỗi → chưa cài thư viện: `pip install -e ".[core]"`
</details>

<details>
<summary><b>VSCode không nhận môi trường ảo (gạch đỏ dưới import)</b></summary>

1. Trong VSCode bấm `Ctrl+Shift+P`
2. Gõ `Python: Select Interpreter`
3. Chọn dòng có đường dẫn `.\.venv\Scripts\python.exe` (thường ghi kèm chữ *Recommended*)
4. Reload cửa sổ: `Ctrl+Shift+P` → `Developer: Reload Window`
</details>

<details>
<summary><b>pip install rất chậm hoặc timeout</b></summary>

Thử tăng timeout và dùng mirror gần hơn:

```powershell
pip install -e ".[core]" --timeout 120
```
</details>

<details>
<summary><b>Tiếng Việt hiện thành ký tự lạ trong PowerShell</b></summary>

```powershell
chcp 65001
```

Để cố định: VSCode → Settings → tìm `terminal.integrated.defaultProfile.windows` → chọn `PowerShell`.
</details>

---

## ✅ Xong!

Nếu script kiểm tra báo `SẴN SÀNG`, bạn đã hoàn thành phần khó nhất về mặt kỹ thuật của tuần 1.

👉 **Bước tiếp theo:** mở [`curriculum/00-setup/README.md`](curriculum/00-setup/README.md)
