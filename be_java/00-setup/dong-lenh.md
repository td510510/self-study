# Dòng lệnh (terminal) — đủ dùng cho backend developer

> Mục tiêu: tự tin làm việc trong terminal — di chuyển thư mục, xem file, tìm lỗi trong log, quản lý tiến trình, kết nối server.
> Thời lượng: 2–3 buổi ở tuần 1, rồi dùng dần. Server chạy ứng dụng Java gần như luôn là **Linux**, không có giao diện đồ họa — terminal là cách duy nhất.

Trên Windows, hãy dùng **Git Bash** (cài kèm Git) hoặc **WSL** (Ubuntu chạy trong Windows: `wsl --install`) để gõ lệnh giống hệt Linux/macOS. Mọi lệnh dưới đây chạy được trong Git Bash, trừ khi ghi chú khác.

---

## 1. Di chuyển và xem thư mục

```bash
pwd                     # đang ở đâu? (print working directory)
ls                      # liệt kê
ls -la                  # chi tiết, kể cả file ẩn (bắt đầu bằng dấu chấm, như .git, .env)
cd projects             # vào thư mục con
cd ..                   # lên một cấp
cd ~                    # về thư mục nhà
cd -                    # quay lại thư mục vừa ở
```

Đường dẫn:
- **Tuyệt đối** bắt đầu từ gốc: `/home/an/app`, trong Git Bash ổ D là `/d/Study`.
- **Tương đối** tính từ chỗ đang đứng: `src/main/java`, `../other-project`.
- `.` là thư mục hiện tại, `..` là thư mục cha, `~` là thư mục nhà.
- Tên có dấu cách phải đặt trong ngoặc kép: `cd "My Projects"`.

Mẹo tiết kiệm thời gian: gõ vài ký tự rồi nhấn **Tab** để tự hoàn thành; **↑** để lấy lại lệnh trước; **Ctrl+R** để tìm trong lịch sử lệnh; **Ctrl+C** để dừng lệnh đang chạy.

## 2. Làm việc với file

```bash
mkdir -p src/main/java          # tạo thư mục (-p: tạo cả thư mục cha nếu chưa có)
touch README.md                 # tạo file rỗng
cp a.txt b.txt                  # sao chép
cp -r src backup-src            # sao chép cả thư mục
mv old.txt new.txt              # đổi tên / di chuyển
rm file.txt                     # xóa file — KHÔNG có thùng rác!
rm -r target                    # xóa thư mục và mọi thứ bên trong
```

> ⚠ `rm -rf` không hỏi lại và không khôi phục được. Luôn `pwd` và `ls` trước khi xóa thứ gì bằng `-r`.

## 3. Đọc file — nhất là file log

```bash
cat application.yml             # in toàn bộ (file ngắn)
less app.log                    # xem file dài: Space trang sau, b trang trước, /từ-khóa để tìm, q để thoát
head -n 20 app.log              # 20 dòng đầu
tail -n 100 app.log             # 100 dòng cuối
tail -f app.log                 # THEO DÕI log trực tiếp khi app đang chạy (Ctrl+C để thoát)
wc -l app.log                   # đếm số dòng
```

## 4. Tìm kiếm — kỹ năng số 1 khi điều tra sự cố

```bash
grep "ERROR" app.log                    # các dòng chứa ERROR
grep -i "timeout" app.log               # không phân biệt hoa thường
grep -n "NullPointer" app.log           # kèm số dòng
grep -A 20 "Exception" app.log          # kèm 20 dòng SAU (để thấy cả stacktrace)
grep -c "ERROR" app.log                 # đếm số dòng khớp
grep -r "@Transactional" src/           # tìm trong cả thư mục
grep "a1b2c3d4" app.log                 # mọi dòng log của một request (Module 11 — request id)

find . -name "*.java"                   # tìm file theo tên
find . -name "*.log" -size +100M        # file log lớn hơn 100MB
```

### Ống dẫn `|` — ghép lệnh nhỏ thành công cụ mạnh
Kết quả của lệnh trước thành đầu vào của lệnh sau:
```bash
grep "ERROR" app.log | wc -l                                  # có bao nhiêu lỗi?
grep "ERROR" app.log | tail -n 5                              # 5 lỗi gần nhất
cat access.log | awk '{print $1}' | sort | uniq -c | sort -rn | head
#                 lấy cột 1 (IP)    sắp  đếm trùng   sắp giảm dần  top 10 -> IP nào gọi nhiều nhất?
```

### Chuyển hướng
```bash
java App.java > output.txt              # ghi kết quả ra file (ghi đè)
java App.java >> output.txt             # ghi nối thêm
java App.java 2> errors.txt             # chỉ ghi luồng lỗi (stderr)
java App.java > all.txt 2>&1            # ghi cả hai vào cùng một file
```

## 5. Tiến trình và cổng

```bash
ps aux | grep java                      # các tiến trình java đang chạy (Linux/macOS)
jps -l                                  # công cụ của JDK: liệt kê mọi JVM đang chạy + PID
kill 12345                              # yêu cầu tiến trình dừng lịch sự (SIGTERM) -> Spring Boot tắt gọn gàng
kill -9 12345                           # buộc dừng ngay (SIGKILL) — chỉ dùng khi kill thường không được

top                                     # CPU/RAM theo thời gian thực (q để thoát); htop dễ nhìn hơn nếu có

# "Port 8080 was already in use" — ai đang chiếm?
lsof -i :8080                           # Linux/macOS
netstat -ano | findstr :8080            # Windows (cmd hoặc Git Bash) -> cột cuối là PID
taskkill /PID 12345 /F                  # Windows: dừng tiến trình theo PID
```

`kill` (không có `-9`) cho ứng dụng cơ hội dọn dẹp: đóng connection DB, xử lý nốt request đang dở (graceful shutdown — Module 15). `kill -9` cắt ngang mọi thứ.

## 6. Biến môi trường

Cấu hình bí mật (mật khẩu DB, JWT secret) **không** nằm trong code mà truyền qua biến môi trường.
```bash
echo $JAVA_HOME                         # đọc
export DB_PASSWORD=secret               # đặt cho phiên terminal hiện tại (Linux/macOS/Git Bash)
DB_PASSWORD=secret java -jar app.jar    # chỉ đặt cho đúng một lệnh
env | grep DB_                          # xem các biến có tên bắt đầu DB_
echo $PATH                              # danh sách thư mục hệ thống tìm lệnh — "command not found" thường do thiếu ở đây
```
Spring Boot tự đọc biến môi trường: `${DB_PASSWORD}` trong `application.yml`, hoặc `SPRING_DATASOURCE_URL` tự map vào `spring.datasource.url`.

## 7. Quyền file (Linux)

```bash
ls -l deploy.sh
# -rwxr-xr--  1 an dev 512 ... deploy.sh
#  └┬┘└┬┘└┬┘
#  chủ nhóm người khác      r = đọc, w = ghi, x = chạy

chmod +x deploy.sh                      # cho phép chạy
./deploy.sh                             # chạy script trong thư mục hiện tại
chmod 600 id_rsa                        # khóa SSH: chỉ chủ sở hữu đọc/ghi được (bắt buộc)
sudo systemctl restart nginx            # sudo = chạy với quyền quản trị
```
Lỗi `Permission denied` khi chạy `./mvnw` trên Linux/CI → thiếu quyền chạy: `chmod +x mvnw`.

## 8. Mạng và server từ xa

```bash
curl -i http://localhost:8080/actuator/health    # gọi API (xem thêm Module 11 — http-va-web.md)
ping google.com                                   # máy kia còn sống không?
nslookup api.shop.vn                              # tên miền trỏ tới IP nào?

ssh an@203.0.113.10                               # đăng nhập vào server
ssh -i ~/.ssh/my-key.pem ubuntu@203.0.113.10      # dùng file khóa
scp target/app.jar an@203.0.113.10:/opt/app/      # copy file lên server
scp an@203.0.113.10:/var/log/app.log .            # tải file về
```

Tạo khóa SSH (dùng luôn cho GitHub):
```bash
ssh-keygen -t ed25519 -C "email@cua-ban.com"      # Enter hết để dùng mặc định
cat ~/.ssh/id_ed25519.pub                         # copy nội dung này vào GitHub → Settings → SSH keys
```
**Khóa riêng** (`id_ed25519`, không có `.pub`) không bao giờ được gửi cho ai hay commit lên Git.

## 9. Nén và giải nén

```bash
tar -czf logs.tar.gz logs/              # nén thư mục
tar -xzf logs.tar.gz                    # giải nén
zip -r src.zip src/ && unzip src.zip
du -sh *                                # thư mục nào đang chiếm nhiều dung lượng?
df -h                                   # ổ đĩa còn trống bao nhiêu? (đầy ổ = app chết vì không ghi được log)
```

## 10. Script nhỏ tự động hóa

```bash
#!/usr/bin/env bash
# build-and-run.sh — build rồi chạy, dừng ngay nếu có lệnh lỗi
set -euo pipefail

echo "==> Build"
mvn -q clean package -DskipTests

echo "==> Chạy"
java -jar target/*.jar --spring.profiles.active=dev
```
```bash
chmod +x build-and-run.sh && ./build-and-run.sh
```
`set -euo pipefail` là dòng nên có ở đầu mọi script: dừng khi có lỗi, báo lỗi khi dùng biến chưa đặt.

---

## Bảng tra nhanh

| Việc cần làm | Lệnh |
|---|---|
| Đang ở đâu / có gì | `pwd`, `ls -la` |
| Xem đuôi log trực tiếp | `tail -f app.log` |
| Tìm lỗi kèm stacktrace | `grep -n -A 20 "ERROR" app.log` |
| Đếm lỗi | `grep -c "ERROR" app.log` |
| Tìm file | `find . -name "*.yml"` |
| Ai chiếm cổng | `lsof -i :8080` / `netstat -ano \| findstr :8080` |
| Dừng app Java | `jps -l` rồi `kill <pid>` |
| Ổ đĩa đầy chưa | `df -h`, `du -sh *` |
| Vào server | `ssh user@host` |
| Copy file lên server | `scp file user@host:/path/` |

## Bài tập

**T1.** Chỉ dùng terminal (không dùng Explorer/Finder): tạo cấu trúc `practice/src/main/java/com/learn`, tạo file `Hello.java` trong đó bằng `echo` hoặc trình soạn thảo `nano`, biên dịch và chạy, rồi xóa cả thư mục `practice`.

**T2.** Tải file log mẫu: `curl -o access.log https://raw.githubusercontent.com/elastic/examples/master/Common%20Data%20Formats/apache_logs/apache_logs`. Trả lời bằng lệnh (ghi lại lệnh đã dùng):
1. File có bao nhiêu dòng?
2. Có bao nhiêu request trả về status 404?
3. Top 5 IP gọi nhiều nhất?
4. Top 5 đường dẫn bị 404 nhiều nhất?

**T3.** Chạy spring-playground bằng `mvn spring-boot:run` trong một terminal. Ở terminal khác: tìm PID bằng `jps -l`, xem cổng bằng `lsof`/`netstat`, gọi `curl localhost:8080/actuator/health`, rồi dừng app bằng `kill <pid>` và quan sát log tắt máy. Làm lại với `kill -9` — log khác gì?

**T4.** Tạo khóa SSH, thêm vào GitHub, đổi remote của repo học tập sang SSH (`git remote set-url origin git@github.com:...`) và push thử.

**T5.** Viết script `check.sh` nhận tên file log làm tham số (`./check.sh app.log`), in ra: tổng số dòng, số dòng ERROR, số dòng WARN và 3 lỗi gần nhất. Không truyền tham số thì in hướng dẫn sử dụng và thoát với mã lỗi 1.

👉 Quay lại [Module 00](README.md).
