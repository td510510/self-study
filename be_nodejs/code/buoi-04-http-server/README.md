# Buổi 04 — Dựng HTTP server bằng tay

Giáo án: [`giao-an/phase-1/buoi-04-http-server.md`](../../giao-an/phase-1/buoi-04-http-server.md)

Không cần `npm install`.

## `01-hello-server.js` — Server đơn giản nhất

```bash
node --watch 01-hello-server.js

curl http://localhost:3000/
curl -X POST http://localhost:3000/bat-ky
```

Server trả **cùng một thứ** cho mọi đường dẫn — vì chưa có routing. Đó là việc của buổi 05.

## `02-request-anatomy.js` — Mổ xẻ `req`

```bash
node 02-request-anatomy.js
curl "http://localhost:3000/san-pham?trang=2&sap-xep=gia&sap-xep=ten"
```

Ba điểm dễ sai:

| Sai | Đúng |
|---|---|
| `new URL(req.url)` | `new URL(req.url, \`http://${req.headers.host}\`)` |
| `req.headers['Content-Type']` | `req.headers['content-type']` (luôn viết thường) |
| `searchParams.get('tag')` với query lặp | `searchParams.getAll('tag')` |

## `03-response-api.js` — Ba cách viết response + hai cái bẫy

```bash
node 03-response-api.js

curl -i http://localhost:3000/cach-1        # writeHead → Transfer-Encoding: chunked
curl -i http://localhost:3000/cach-2        # setHeader → Content-Length
curl -i http://localhost:3000/cach-3        # write nhiều lần
curl -i http://localhost:3000/json
curl -i http://localhost:3000/loi-header    # ERR_HTTP_HEADERS_SENT
curl -i http://localhost:3000/khong-co-gi   # 404

curl -i http://localhost:3000/end-hai-lan   # ⚠️ GỌI CUỐI — làm SẬP server
```

> **Bài học lớn nhất buổi:** quên `return` sau `res.end()` không chỉ gây một request lỗi — nó **giết cả tiến trình**, làm mọi người dùng khác mất kết nối.
>
> ```
> Error [ERR_STREAM_WRITE_AFTER_END]: write after end
> Node.js v22.16.0
> ```

## Tắt tiến trình chiếm cổng 3000

```powershell
# Windows PowerShell
Get-NetTCPConnection -LocalPort 3000 -State Listen |
  Select-Object -ExpandProperty OwningProcess -Unique |
  ForEach-Object { Stop-Process -Id $_ -Force }
```

```bash
# macOS / Linux
lsof -ti:3000 | xargs kill -9
```
