# 🌿 Git — Cheatsheet

> Git lưu lịch sử code của bạn. Nghĩ về nó như **nút save trong game**: mỗi commit là một điểm lưu, sai thì quay lại được.

## Mô hình tinh thần

```
   Thư mục làm việc          Vùng chờ            Kho lưu trữ          GitHub
   (bạn đang sửa)         (Staging area)       (Local repo)       (Remote repo)
         │                       │                    │                  │
         │──── git add ─────────▶│                    │                  │
         │                       │─── git commit ────▶│                  │
         │                       │                    │─── git push ────▶│
         │◀────────────────── git pull ───────────────────────────────────│
```

---

## 5 lệnh dùng 95% thời gian

```bash
git status                       # Đang có gì thay đổi? (chạy lệnh này LIÊN TỤC)
git add .                        # Đưa tất cả thay đổi vào vùng chờ
git commit -m "mo ta ngan"       # Tạo điểm lưu kèm lời mô tả
git push                         # Đẩy lên GitHub
git log --oneline                # Xem lịch sử các điểm lưu
```

**Thói quen cuối mỗi buổi học:**
```bash
git add .
git commit -m "Tuan 3: hoan thanh bai tap list va dict"
git push
```

---

## Cài đặt lần đầu

```bash
git config --global user.name "Ten Cua Ban"
git config --global user.email "email@cua-ban.com"
git config --global init.defaultBranch main
git config --list                          # kiểm tra lại cấu hình
```

## Khởi tạo & kết nối GitHub

```bash
git init                                    # biến thư mục thành repo git
git remote add origin https://github.com/<user>/<repo>.git
git branch -M main
git push -u origin main                     # lần đầu cần -u, các lần sau chỉ cần git push
```

---

## Xem xét thay đổi

```bash
git status                       # tổng quan
git diff                         # xem chi tiết những dòng đã sửa (chưa add)
git diff --staged                # xem những dòng đã add, chưa commit
git log --oneline --graph        # lịch sử dạng biểu đồ
git show <ma_commit>             # xem chi tiết một commit
```

---

## Sửa sai — bảng cứu hộ

| Tình huống | Lệnh | Ghi chú |
|---|---|---|
| Viết sai lời commit vừa rồi | `git commit --amend -m "loi moi"` | Chỉ dùng khi **chưa push** |
| Lỡ `git add` file không muốn | `git restore --staged ten_file` | Bỏ ra khỏi vùng chờ |
| Muốn vứt bỏ sửa đổi ở một file | `git restore ten_file` | ⚠️ Mất thay đổi vĩnh viễn |
| Huỷ commit cuối, **giữ** code | `git reset --soft HEAD~1` | An toàn |
| Huỷ commit cuối, **xoá** code | `git reset --hard HEAD~1` | ⚠️ Rất nguy hiểm |
| Lỡ commit file `.env` | Xem mục [Lỡ commit API key](#-lỡ-commit-api-key) | Làm ngay lập tức |
| Cần cất tạm việc dở | `git stash` → `git stash pop` | Như bỏ vào ngăn kéo |

---

## Nhánh (branch)

Chưa cần dùng nhiều trong 8 tuần đầu, nhưng nên biết:

```bash
git branch                       # xem các nhánh đang có
git switch -c ten-nhanh-moi      # tạo nhánh mới và chuyển sang
git switch main                  # quay về nhánh main
git merge ten-nhanh              # gộp nhánh kia vào nhánh hiện tại
git branch -d ten-nhanh          # xoá nhánh đã gộp xong
```

---

## 🚨 Lỡ commit API key

Đây là sự cố nghiêm trọng — bot quét GitHub liên tục và key lộ sẽ bị dùng hết tiền trong vài phút.

**Làm theo đúng thứ tự:**

```bash
# BƯỚC 1 (quan trọng nhất, làm NGAY):
#   Vào https://console.anthropic.com/settings/keys
#   → Revoke key bị lộ → tạo key mới
#   Key đã lên internet coi như mất, dù bạn xoá khỏi git.

# BƯỚC 2: gỡ file khỏi git nhưng giữ lại trên máy
git rm --cached .env
echo ".env" >> .gitignore
git add .gitignore
git commit -m "Go .env khoi git"
git push
```

> Xoá file ở commit mới **không** xoá nó khỏi lịch sử — người ta vẫn xem lại được. Vì vậy Bước 1 (thu hồi key) là bắt buộc, không phải tuỳ chọn.

---

## Viết lời commit cho tốt

| ❌ Kém | ✅ Tốt |
|---|---|
| `update` | `Them ham tinh trung binh cho bai tap 3` |
| `fix` | `Sua loi chia cho 0 trong calculate_ratio` |
| `asdfgh` | `Tuan 5: hoan thanh gradient descent tu code` |
| `commit lan 47` | `Refactor: tach ham doc file ra module rieng` |

**Công thức:** động từ + đối tượng + (bối cảnh). Viết bằng tiếng Việt không dấu hoặc tiếng Anh đều được, miễn nhất quán.

---

## Khi bí

```bash
git status          # 90% câu trả lời nằm ở đây, git còn gợi ý sẵn lệnh tiếp theo
git log --oneline   # xem mình đang ở đâu trong lịch sử
```

Nếu rối quá và repo mới chỉ có code học tập: sao lưu thư mục ra chỗ khác, xoá `.git`, `git init` lại từ đầu. Không có gì phải xấu hổ.
