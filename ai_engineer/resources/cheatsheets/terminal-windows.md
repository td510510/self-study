# 💻 Terminal (PowerShell) — Cheatsheet

> Terminal là nơi bạn ra lệnh cho máy bằng chữ. Người mới sợ nó, nhưng chỉ cần thuộc ~10 lệnh là đủ dùng cả sự nghiệp.

## Mở terminal

| Cách | Thao tác |
|---|---|
| Nhanh nhất | Phím `Windows` → gõ `powershell` → Enter |
| Trong VSCode | `` Ctrl + ` `` (phím dấu huyền, dưới phím Esc) |
| Tại một thư mục | Mở thư mục trong Explorer → `Shift + chuột phải` → *Open PowerShell window here* |

---

## Di chuyển & xem

```powershell
pwd                        # Tôi đang ở thư mục nào? (Print Working Directory)
ls                         # Liệt kê file trong thư mục hiện tại
ls -Force                  # Liệt kê cả file ẩn (.env, .git...)

cd ai_engineer             # Vào thư mục con
cd ..                      # Lùi ra thư mục cha
cd D:\Study\IT\Teach       # Nhảy thẳng tới đường dẫn tuyệt đối
cd ~                       # Về thư mục home của bạn
```

> 💡 **Mẹo tiết kiệm thời gian:** gõ vài chữ đầu rồi bấm `Tab` — PowerShell tự điền nốt tên. Bấm `Tab` nhiều lần để duyệt qua các lựa chọn.

---

## Làm việc với file & thư mục

```powershell
mkdir ten_thu_muc                    # Tạo thư mục mới
New-Item ten_file.py                 # Tạo file rỗng
cat ten_file.py                      # In nội dung file ra màn hình
cat ten_file.py | Select -First 20    # Chỉ xem 20 dòng đầu

copy nguon.txt dich.txt              # Sao chép file
move cu.txt moi.txt                  # Di chuyển hoặc đổi tên
Remove-Item file.txt                 # Xoá file
Remove-Item thu_muc -Recurse         # Xoá cả thư mục và nội dung bên trong

code .                               # Mở thư mục hiện tại bằng VSCode
start .                              # Mở thư mục hiện tại bằng File Explorer
```

> ⚠️ `Remove-Item` **không có thùng rác**. Xoá là mất luôn. Kiểm tra `pwd` trước khi xoá.

---

## Python & môi trường ảo

```powershell
python --version                     # Kiểm tra phiên bản Python
python ten_file.py                   # Chạy một file Python
python                               # Vào chế độ tương tác (thoát: exit())

python -m venv .venv                 # Tạo môi trường ảo
.\.venv\Scripts\Activate.ps1         # Kích hoạt  → dòng lệnh có (.venv)
deactivate                           # Thoát môi trường ảo

pip install ten_thu_vien             # Cài một thư viện
pip install -e ".[core]"             # Cài nhóm thư viện khai báo trong pyproject.toml
pip list                             # Xem đã cài những gì
pip show numpy                       # Xem chi tiết một thư viện
```

---

## Phím tắt sống còn

| Phím | Tác dụng |
|---|---|
| `Tab` | Tự điền tên file/thư mục |
| `↑` / `↓` | Duyệt lại các lệnh đã gõ trước đó |
| `Ctrl + C` | **Dừng chương trình đang chạy** (dùng khi code chạy mãi không dừng) |
| `Ctrl + L` hoặc `cls` | Xoá màn hình cho đỡ rối |
| `Ctrl + A` / `Ctrl + E` | Nhảy về đầu / cuối dòng lệnh |
| `exit` | Đóng terminal |

---

## Lỗi hay gặp

| Thông báo | Nghĩa là | Cách sửa |
|---|---|---|
| `'python' is not recognized` | Windows không tìm thấy Python | Cài lại và tick *Add to PATH*, hoặc thử lệnh `py` |
| `cannot be loaded because running scripts is disabled` | Windows chặn script | `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser` |
| `No such file or directory` | Đang ở sai thư mục | Chạy `pwd` và `ls` để xác định vị trí |
| `Access is denied` | Thiếu quyền | Mở PowerShell bằng *Run as Administrator* |
| Chữ tiếng Việt bị lỗi font | Sai bảng mã | `chcp 65001` |

---

## Đường dẫn: tuyệt đối vs tương đối

```powershell
# TUYỆT ĐỐI - đầy đủ từ ổ đĩa, chạy ở đâu cũng đúng
D:\Study\IT\Teach\ai_engineer\curriculum\00-setup\README.md

# TƯƠNG ĐỐI - tính từ vị trí hiện tại, ngắn gọn hơn
curriculum\00-setup\README.md      # đi xuống
..\ai_engineer                     # đi lên một cấp
.\ten_file.py                      # file ngay tại đây
```

> Trong **code Python**, luôn dùng `/` hoặc `pathlib.Path` thay vì `\` — vì `\` trong chuỗi Python là ký tự thoát và sẽ gây lỗi khó hiểu.
>
> ```python
> from pathlib import Path
> p = Path("data") / "raw" / "sales.csv"   # ✅ chạy đúng trên mọi hệ điều hành
> ```
