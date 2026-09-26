# Giáo án Tuần 7–14 — Dữ liệu, RAG và Đo lường

> Thuộc [lo-trinh-tu-hoc-ai-engineer.md](./lo-trinh-tu-hoc-ai-engineer.md) — Môn 3 + Môn 4, 72h.
> Tiếp nối [giao-an-tuan-01-06.md](./giao-an-tuan-01-06.md). **Điều kiện vào:** đã vượt Cổng kiểm tra Giai đoạn 1.

**Cấu trúc mỗi tuần:** ① Lý thuyết (2h) → ② Code ví dụ (2h) → ③ Thực hành có lời giải (2h) → ④ Đồ án tuần (3h).
**Hai đồ án môn học:** `ingest` (cuối T10) và 🏆 **Sản phẩm 1 — RAG có bằng chứng** (cuối T14).

## Khối này là MỘT dự án liên tục

```
T7 làm sạch → T8 thu thập → T9 trích xuất → T10 chunk + vector DB   → 🎓 Đồ án môn 3
   → T11 prompt → T12 tool & structured → T13 RAG → T14 đo lường     → 🏆 Sản phẩm 1
```

**Chọn miền dữ liệu ngay hôm nay** và bám suốt 8 tuần. Ưu tiên miền bạn thật sự hiểu (tài liệu nội bộ, luật/quy định ngành, tài liệu kỹ thuật, giáo trình bạn đang dạy) — vì bạn phải **tự đánh giá được câu trả lời đúng hay sai**, điều kiện bắt buộc để làm eval ở Tuần 14.

> ⚠️ Đừng chọn "hỏi đáp Wikipedia". Model đã thuộc nội dung đó; bạn sẽ không phân biệt được RAG hoạt động hay model tự bịa từ trí nhớ.

---

# TUẦN 7 — Pandas & SQL cho dữ liệu AI

**Mục tiêu:** làm sạch một bộ dữ liệu thật và ghi lại được **mỗi bước loại bao nhiêu dòng, vì sao**.

## ① Lý thuyết (2h)

### 7.1 Vì sao môn này quyết định 70% chất lượng RAG

Rác vào thì rác ra — nhưng LLM sẽ "đánh bóng" rác thành câu trả lời nghe rất thuyết phục. Đây là điểm khác biệt nguy hiểm so với hệ thống truyền thống: dữ liệu bẩn không làm hệ thống báo lỗi, nó làm hệ thống **nói dối một cách trôi chảy**.

### 7.2 Ba tầng lưu trữ — quy tắc dùng suốt lộ trình

```
raw/      → dữ liệu thô, CHỈ GHI THÊM, không bao giờ sửa
clean/    → đã làm sạch, tái tạo được 100% từ raw bằng script
indexed/  → đã chunk + embed, tái tạo được từ clean
```

Khi phát hiện bug ở khâu làm sạch, bạn **chạy lại script** chứ không phải đi thu thập lại. Vi phạm nguyên tắc này là mất dữ liệu gốc và không bao giờ tái lập được kết quả.

### 7.3 Bản đồ Pandas cho người biết SQL

| SQL | Pandas | Bẫy |
|---|---|---|
| `SELECT a, b` | `df[["a","b"]]` | Một cột: `df["a"]` (Series) vs `df[["a"]]` (DataFrame) |
| `WHERE x>5 AND y='z'` | `df[(df.x>5) & (df.y=="z")]` | **Bắt buộc có ngoặc**, dùng `&`/`|` không phải `and`/`or` |
| `ORDER BY x DESC` | `df.sort_values("x", ascending=False)` | |
| `GROUP BY` | `df.groupby("t").agg({...})` | |
| `JOIN` | `df.merge(o, on="id", how="left")` | Kiểm tra `len` trước/sau — merge sai làm nhân dòng |
| `DISTINCT` | `df.drop_duplicates(subset=[...])` | Luôn chỉ rõ `subset` theo khoá nghiệp vụ |

**Bẫy lớn nhất — chained indexing:**
```python
df[df.score > 8]["grade"] = "A"      # ❌ SettingWithCopyWarning, có thể không ghi được
df.loc[df.score > 8, "grade"] = "A"  # ✅
```

### 7.4 Ngoại lai không phải để xoá, mà để đọc

Một tài liệu 2 triệu ký tự lọt vào sẽ phá pipeline embedding. Nhưng **luôn xem 5 mẫu ngoại lai trước khi xoá** — chúng thường lộ ra bug ở khâu trích xuất, không phải dữ liệu xấu.

## ② Code ví dụ (2h)

```python
import pandas as pd, logging
log = logging.getLogger(__name__)

# --- 1. Bước đầu tiên LUÔN là nhìn dữ liệu ---
df = pd.read_csv("raw/data.csv")
df.info()               # kiểu dữ liệu, số non-null
df.describe()           # thống kê cột số
df.isna().sum()         # thiếu theo cột
df.head(10)

# --- 2. Làm sạch có kiểm toán ---
audit = []
def step(name: str, new_df: pd.DataFrame, old_len: int) -> int:
    audit.append({"buoc": name, "truoc": old_len, "sau": len(new_df),
                  "loai": old_len - len(new_df)})
    return len(new_df)

n = len(df)
df = df.drop_duplicates(subset=["url"]);                 n = step("trung url", df, n)
df = df.dropna(subset=["content"]);                      n = step("thieu content", df, n)
df["content"] = (df["content"].str.strip()
                              .str.replace(r"\s+", " ", regex=True))
df = df[df["content"].str.len().between(50, 50_000)];    n = step("do dai bat thuong", df, n)
df["created_at"] = pd.to_datetime(df["created_at"], errors="coerce")
df = df[df["created_at"].notna()];                       n = step("ngay khong hop le", df, n)

print(pd.DataFrame(audit))     # BẢNG KIỂM TOÁN — thứ phải nộp trong đồ án

# --- 3. Ngoại lai: xem trước, xoá sau ---
df["length"] = df["content"].str.len()
q1, q3 = df.length.quantile([0.25, 0.75]); iqr = q3 - q1
outliers = df[(df.length < q1 - 1.5*iqr) | (df.length > q3 + 1.5*iqr)]
print(f"{len(outliers)} ngoại lai"); print(outliers[["url", "length"]].head())

# --- 4. Lưu trữ ---
import sqlite3
conn = sqlite3.connect("clean/corpus.db")
df.to_sql("documents", conn, if_exists="replace", index=False)

pd.read_sql("""SELECT category, COUNT(*) n, AVG(LENGTH(content)) avg_len
               FROM documents GROUP BY category ORDER BY n DESC""", conn)

df.to_parquet("clean/data.parquet")      # nhỏ hơn CSV 5–10 lần, giữ nguyên kiểu
```

## ③ Thực hành (2h) — 4 bài

### Bài 7.1 — Bảng kiểm toán tái sử dụng
Viết class `CleaningAudit` có `.step(name, df)` tự ghi số dòng trước/sau và `.report()` trả DataFrame kèm cột `% loại`.

<details><summary>Lời giải</summary>

```python
class CleaningAudit:
    def __init__(self, df: pd.DataFrame):
        self._n = len(df)
        self._rows: list[dict] = [{"buoc": "ban dau", "truoc": self._n, "sau": self._n, "loai": 0}]

    def step(self, name: str, df: pd.DataFrame) -> pd.DataFrame:
        self._rows.append({"buoc": name, "truoc": self._n, "sau": len(df),
                           "loai": self._n - len(df)})
        self._n = len(df)
        return df                                  # trả df để nối chuỗi được

    def report(self) -> pd.DataFrame:
        r = pd.DataFrame(self._rows)
        r["ty_le_loai_%"] = (r["loai"] / r["truoc"].replace(0, 1) * 100).round(2)
        return r

# dùng: df = audit.step("bo trung", df.drop_duplicates("url"))
```
</details>

### Bài 7.2 — Phát hiện cột vô dụng
Viết `useless_columns(df, na_threshold=0.9)` trả về tên các cột: thiếu >90%, hoặc chỉ có 1 giá trị duy nhất, hoặc mọi giá trị đều khác nhau (dạng id, không dùng để phân tích).

<details><summary>Lời giải</summary>

```python
def useless_columns(df: pd.DataFrame, na_threshold: float = 0.9) -> dict[str, str]:
    out = {}
    for c in df.columns:
        if df[c].isna().mean() > na_threshold:
            out[c] = f"thieu {df[c].isna().mean():.0%}"
        elif df[c].nunique(dropna=True) <= 1:
            out[c] = "chi 1 gia tri"
        elif df[c].nunique(dropna=True) == len(df) and df[c].dtype == object:
            out[c] = "moi gia tri deu khac nhau (id?)"
    return out
```
</details>

### Bài 7.3 — Merge không làm nhân dòng
`docs` (1000 dòng) merge với `authors` theo `author_id`, sau merge thành 1300 dòng. Chẩn đoán và sửa.

<details><summary>Lời giải</summary>

Nguyên nhân: `authors` có `author_id` trùng lặp → quan hệ 1-nhiều. Cách phát hiện và xử lý:

```python
assert authors["author_id"].is_unique, "authors có id trùng"
dups = authors[authors.duplicated("author_id", keep=False)].sort_values("author_id")
authors = authors.drop_duplicates("author_id", keep="last")     # hoặc gộp có chủ đích

merged = docs.merge(authors, on="author_id", how="left", validate="many_to_one")
```
`validate="many_to_one"` khiến pandas **ném lỗi ngay** thay vì âm thầm nhân dòng — nên dùng mặc định trong mọi merge.
</details>

### Bài 7.4 — Script tái lập
Chuyển notebook làm sạch thành `clean.py` chạy được bằng `python clean.py --in raw/ --out clean/`, in bảng kiểm toán, và **chạy 2 lần cho kết quả giống hệt** (idempotent).

<details><summary>Lời giải</summary>

Ba điểm cần lưu ý: (1) không dùng `random` không seed; (2) không phụ thuộc thứ tự file do OS trả về → `sorted(glob(...))`; (3) ghi đè `clean/` chứ không ghi thêm. Kiểm chứng bằng cách so hash:

```python
import hashlib, pathlib
def file_hash(p): return hashlib.sha256(pathlib.Path(p).read_bytes()).hexdigest()
# chạy 2 lần rồi so file_hash("clean/data.parquet")
```
</details>

## ④ Đồ án tuần 7 (3h) — làm sạch dữ liệu thật

**Checklist nghiệm thu:**
- [ ] Xử lý bộ dữ liệu thật ≥5.000 dòng (Kaggle hoặc miền bạn chọn).
- [ ] **Bảng kiểm toán** đầy đủ: mỗi bước trước → sau → lý do.
- [ ] ≥3 biểu đồ: phân bố độ dài, số lượng theo nhóm, dữ liệu thiếu theo cột.
- [ ] Xuất `clean.parquet` + script `clean.py` tái lập được, idempotent.
- [ ] README ghi **3 điều bất ngờ** phát hiện về dữ liệu.

---

# TUẦN 8 — Thu thập dữ liệu

**Mục tiêu:** crawler chạy lại nhiều lần không trùng, không bị chặn, tôn trọng chủ sở hữu dữ liệu.

## ① Lý thuyết (2h)

### 8.1 Luật chơi — đọc trước khi viết dòng code nào

- Đọc và **tuân thủ** `robots.txt` (`urllib.robotparser`).
- Đọc Điều khoản sử dụng. Có API chính thức thì luôn dùng API.
- `User-Agent` thật, có thông tin liên hệ. Không giả mạo trình duyệt để né chặn.
- ≥1 giây giữa 2 request tới cùng host.
- Không thu thập dữ liệu cá nhân, không vượt đăng nhập/paywall.
- Thứ tự ưu tiên: **RSS > API công khai > sitemap.xml > scrape HTML**.

### 8.2 Ba tính chất của crawler dùng được

1. **Resumable** — crash giữa chừng thì chạy lại tiếp tục, không làm lại từ đầu. Cách làm: JSONL ghi thêm + tập `seen` các id đã lấy.
2. **Idempotent** — chạy 2 lần không tạo bản ghi trùng.
3. **Observable** — log tiến độ, tóm tắt cuối: bao nhiêu thành công / lỗi / bỏ qua.

### 8.3 Metadata quyết định chất lượng RAG về sau

Thu thập thiếu `published_at` hoặc `source` thì Tuần 13 không lọc theo thời gian được, Tuần 10 không trích dẫn nguồn được. **Rẻ hơn nhiều nếu lấy đủ ngay từ đầu** so với đi crawl lại.

## ② Code ví dụ (2h)

```python
import asyncio, hashlib, json, pathlib, httpx, feedparser
from selectolax.parser import HTMLParser

# --- 1. RSS: nguồn sạch nhất ---
feed = feedparser.parse("https://example.com/rss")
for e in feed.entries:
    print(e.title, e.link, e.published)

# --- 2. API phân trang kiểu cursor ---
async def fetch_all(client: httpx.AsyncClient, url: str) -> list[dict]:
    items, cursor = [], None
    while True:
        r = await client.get(url, params={"cursor": cursor, "limit": 100})
        r.raise_for_status()
        data = r.json()
        items.extend(data["items"])
        cursor = data.get("next_cursor")
        if not cursor:
            return items
        await asyncio.sleep(1)                    # lịch sự

# --- 3. Scrape HTML ---
def extract(html: str) -> dict:
    tree = HTMLParser(html)
    def text(sel: str) -> str:
        node = tree.css_first(sel)
        return node.text(strip=True) if node else ""
    return {"title": text("h1"),
            "author": text(".author"),
            "content": "\n\n".join(n.text(strip=True) for n in tree.css("article p"))}

# --- 4. Resumable + idempotent ---
def url_id(url: str) -> str:
    return hashlib.sha256(url.encode()).hexdigest()[:16]

def load_seen(out: pathlib.Path) -> set[str]:
    if not out.exists():
        return set()
    return {json.loads(l)["id"] for l in out.read_text(encoding="utf-8").splitlines() if l.strip()}

def append(record: dict, out: pathlib.Path) -> None:
    with out.open("a", encoding="utf-8") as f:    # JSONL: an toàn khi crash giữa chừng
        f.write(json.dumps(record, ensure_ascii=False) + "\n")

# --- 5. Ghép lại, tái dùng Semaphore của Tuần 5 ---
async def crawl(urls: list[str], out: pathlib.Path, concurrency: int = 3) -> dict:
    seen = load_seen(out)
    todo = [u for u in urls if url_id(u) not in seen]
    log.info("Bỏ qua %d đã có, sẽ lấy %d", len(urls) - len(todo), len(todo))
    sem = asyncio.Semaphore(concurrency)
    stats = {"ok": 0, "loi": 0}

    async with httpx.AsyncClient(timeout=30, headers={"User-Agent": "study-bot (email@example.com)"}) as c:
        async def one(u: str):
            async with sem:
                try:
                    r = await c.get(u); r.raise_for_status()
                    rec = extract(r.text) | {"id": url_id(u), "url": u,
                                             "fetched_at": datetime.utcnow().isoformat()}
                    append(rec, out); stats["ok"] += 1
                except Exception as e:
                    log.warning("Lỗi %s: %s", u, e); stats["loi"] += 1
                await asyncio.sleep(1)
        await asyncio.gather(*(one(u) for u in todo))
    return stats
```

## ③ Thực hành (2h) — 4 bài

### Bài 8.1 — Kiểm tra robots.txt
Viết `can_fetch(url, user_agent) -> bool` dùng `urllib.robotparser`, có cache theo host để không tải lại `robots.txt` mỗi lần.

<details><summary>Lời giải</summary>

```python
from functools import lru_cache
from urllib.parse import urlparse
from urllib.robotparser import RobotFileParser

@lru_cache(maxsize=64)
def _parser(host: str) -> RobotFileParser:
    rp = RobotFileParser()
    rp.set_url(f"{host}/robots.txt")
    try:
        rp.read()
    except Exception:
        pass                     # không đọc được → mặc định thận trọng ở hàm dưới
    return rp

def can_fetch(url: str, user_agent: str = "*") -> bool:
    u = urlparse(url)
    return _parser(f"{u.scheme}://{u.netloc}").can_fetch(user_agent, url)
```
</details>

### Bài 8.2 — Khử trùng theo nội dung, không theo URL
Hai URL khác nhau có thể cùng nội dung (bản in, tham số tracking). Viết `content_id(text)` chuẩn hoá rồi hash, và dùng nó khử trùng.

<details><summary>Lời giải</summary>

```python
import re, hashlib, unicodedata

def content_id(text: str) -> str:
    t = unicodedata.normalize("NFC", text.lower())
    t = re.sub(r"\s+", " ", t).strip()
    return hashlib.sha256(t.encode()).hexdigest()[:16]
```
Khử trùng theo cả `url_id` **và** `content_id`. Với gần-trùng (khác vài ký tự) cần MinHash/SimHash — ghi vào phần "hạn chế" của báo cáo.
</details>

### Bài 8.3 — Rate limit theo host
Viết `HostLimiter` đảm bảo ≥1 giây giữa 2 request tới **cùng một host**, nhưng các host khác nhau vẫn chạy song song.

<details><summary>Lời giải</summary>

```python
import asyncio, time
from collections import defaultdict
from urllib.parse import urlparse

class HostLimiter:
    def __init__(self, min_interval: float = 1.0):
        self.min_interval = min_interval
        self._last: dict[str, float] = defaultdict(float)
        self._locks: dict[str, asyncio.Lock] = defaultdict(asyncio.Lock)

    async def wait(self, url: str) -> None:
        host = urlparse(url).netloc
        async with self._locks[host]:                  # khoá riêng từng host
            delta = time.monotonic() - self._last[host]
            if delta < self.min_interval:
                await asyncio.sleep(self.min_interval - delta)
            self._last[host] = time.monotonic()
```
</details>

### Bài 8.4 — Kiểm chứng idempotent
Viết test: chạy crawler 2 lần trên cùng danh sách URL (mock bằng respx), khẳng định lần 2 không thêm dòng nào và không gọi mạng.

<details><summary>Lời giải</summary>

```python
@respx.mock
async def test_idempotent(tmp_path):
    respx.get(url__regex=r".*").mock(return_value=httpx.Response(200, text="<h1>a</h1>"))
    out = tmp_path / "d.jsonl"
    await crawl(["https://x.com/1"], out)
    n1 = len(out.read_text(encoding="utf-8").splitlines())
    calls_before = respx.calls.call_count
    await crawl(["https://x.com/1"], out)
    assert len(out.read_text(encoding="utf-8").splitlines()) == n1
    assert respx.calls.call_count == calls_before      # không gọi mạng lần 2
```
</details>

## ④ Đồ án tuần 8 (3h) — crawler có kiểm soát

**Checklist nghiệm thu:**
- [ ] Thu ≥500 bài từ miền bạn chọn, lưu JSONL trong `raw/`.
- [ ] Mỗi bản ghi có: `id`, `url`, `title`, `content`, `published_at`, `source`, `fetched_at`.
- [ ] Chạy lại lần 2 → không thêm bản ghi trùng (có test chứng minh).
- [ ] Rate limit theo host, retry (T4), async có Semaphore (T5).
- [ ] Log tiến độ + tóm tắt cuối: thành công / lỗi / bỏ qua.
- [ ] README ghi rõ nguồn và xác nhận đã kiểm tra robots.txt + ToS.

---

# TUẦN 9 — Trích xuất tài liệu & OCR

**Mục tiêu:** biến PDF/DOCX/ảnh thành text sạch **có metadata truy vết đến số trang** — điều kiện để RAG trích dẫn nguồn.

## ① Lý thuyết (2h)

### 9.1 Ba loại PDF, ba cách xử lý

| Loại | Nhận biết | Xử lý |
|---|---|---|
| PDF text | Trích ra được nhiều ký tự | `pymupdf.get_text()` |
| PDF scan (ảnh) | Trích ra <50 ký tự/trang | OCR |
| PDF hỗn hợp | Một số trang rỗng | Kiểm tra **từng trang**, OCR trang rỗng |

Không kiểm tra là bạn index hàng trăm trang rỗng mà không biết — hệ thống vẫn chạy, chỉ là không tìm thấy gì.

### 9.2 Vì sao chuẩn hoá Unicode là bắt buộc với tiếng Việt

"cà" có thể được mã hoá bằng hai chuỗi Unicode khác nhau (NFC: một ký tự có dấu; NFD: chữ cái + dấu rời). Khác chuỗi byte → **khác token → khác embedding → tìm kiếm trượt**, mà nhìn bằng mắt thì giống hệt nhau. Đây là loại bug tốn hàng ngày để tìm ra.

Ngoài NFC còn phải xử lý: khoảng trắng không ngắt (`\xa0`), BOM, từ bị gạch nối cuối dòng trong PDF, header/footer lặp ở mọi trang.

### 9.3 Metadata tối thiểu cho mỗi đoạn text

`doc_id`, `source_path`, `page`, `method` (`pdf_text`/`ocr`/`docx`), `char_count`. Trường `method` cho phép về sau truy ngược: "các câu trả lời sai đều đến từ trang OCR" — chẩn đoán rất nhanh.

## ② Code ví dụ (2h)

```python
import io, re, unicodedata, pymupdf, pytesseract
from collections import Counter
from PIL import Image
from docx import Document as Docx

# --- 1. PDF text ---
def pdf_to_pages(path: str) -> list[dict]:
    with pymupdf.open(path) as doc:
        return [{"page": i, "text": p.get_text("text"), "chars": len(p.get_text("text"))}
                for i, p in enumerate(doc, start=1)]

def is_scanned_page(page: dict, threshold: int = 50) -> bool:
    return page["chars"] < threshold

# --- 2. OCR cho trang scan ---
def ocr_page(page) -> str:
    pix = page.get_pixmap(dpi=300)                 # 300 DPI là ngưỡng tối thiểu
    img = Image.open(io.BytesIO(pix.tobytes("png")))
    return pytesseract.image_to_string(img, lang="vie+eng")

# --- 3. DOCX: đừng quên bảng ---
def docx_to_text(path: str) -> str:
    doc = Docx(path)
    parts = [p.text for p in doc.paragraphs if p.text.strip()]
    for t in doc.tables:                            # bảng KHÔNG nằm trong paragraphs
        for row in t.rows:
            parts.append(" | ".join(c.text.strip() for c in row.cells))
    return "\n".join(parts)

# --- 4. Bảng trong PDF → Markdown để LLM đọc hiểu ---
import pdfplumber
def tables_to_md(path: str, page_no: int) -> list[str]:
    out = []
    with pdfplumber.open(path) as pdf:
        for table in pdf.pages[page_no - 1].extract_tables():
            header, *rows = table
            md = "| " + " | ".join(h or "" for h in header) + " |\n"
            md += "|" + "---|" * len(header) + "\n"
            md += "".join("| " + " | ".join(c or "" for c in r) + " |\n" for r in rows)
            out.append(md)
    return out

# --- 5. Chuẩn hoá tiếng Việt ---
def normalize_vi(text: str) -> str:
    text = unicodedata.normalize("NFC", text)
    text = text.replace("\xa0", " ").replace("﻿", "")      # nbsp, BOM
    text = re.sub(r"-\n(?=\w)", "", text)                        # nối từ bị ngắt cuối dòng
    text = re.sub(r"\n{3,}", "\n\n", text)
    text = re.sub(r"[ \t]{2,}", " ", text)
    return text.strip()

# --- 6. Loại header/footer lặp ---
def find_boilerplate(pages: list[str], min_ratio: float = 0.6) -> set[str]:
    lines = Counter(l.strip()
                    for p in pages
                    for l in p.splitlines()[:3] + p.splitlines()[-3:]
                    if l.strip())
    return {l for l, c in lines.items() if c >= len(pages) * min_ratio}
```

## ③ Thực hành (2h) — 4 bài

### Bài 9.1 — Chứng minh vấn đề NFC/NFD
Viết test chứng minh hai chuỗi "cà" NFC và NFD: bằng nhau khi nhìn, khác nhau khi so sánh, và **cho embedding khác nhau**; sau chuẩn hoá thì giống nhau.

<details><summary>Lời giải</summary>

```python
import unicodedata as ud

def test_nfc_nfd():
    nfc = ud.normalize("NFC", "cà")
    nfd = ud.normalize("NFD", "cà")
    assert nfc != nfd                       # khác chuỗi byte
    assert len(nfc) < len(nfd)              # NFD tách dấu thành ký tự riêng
    assert ud.normalize("NFC", nfd) == nfc  # chuẩn hoá xong thì bằng nhau
```
Thực nghiệm thêm: encode cả hai bằng model embedding, cosine < 1.0 → chứng minh ảnh hưởng thật đến tìm kiếm.
</details>

### Bài 9.2 — Bộ định tuyến theo loại file
Viết `extract(path) -> list[dict]` tự chọn nhánh xử lý theo đuôi file và theo việc PDF có phải scan không; file không hỗ trợ thì ném `UnsupportedFile` chứ không trả rỗng âm thầm.

<details><summary>Lời giải</summary>

```python
class UnsupportedFile(Exception): ...

def extract(path: str) -> list[dict]:
    ext = pathlib.Path(path).suffix.lower()
    if ext == ".pdf":
        pages, out = [], []
        with pymupdf.open(path) as doc:
            for i, page in enumerate(doc, start=1):
                text = page.get_text("text")
                method = "pdf_text"
                if len(text) < 50:
                    text, method = ocr_page(page), "ocr"
                out.append({"page": i, "text": normalize_vi(text), "method": method})
        return out
    if ext == ".docx":
        return [{"page": 1, "text": normalize_vi(docx_to_text(path)), "method": "docx"}]
    if ext in {".png", ".jpg", ".jpeg"}:
        return [{"page": 1, "text": normalize_vi(pytesseract.image_to_string(
            Image.open(path), lang="vie+eng")), "method": "ocr"}]
    raise UnsupportedFile(f"Không hỗ trợ {ext}")
```
Trả rỗng âm thầm là lỗi tệ hơn ném exception: bạn sẽ index một corpus thiếu mà không biết.
</details>

### Bài 9.3 — Pipeline không chết vì một file hỏng
Viết `run(folder) -> tuple[list[dict], list[dict]]` trả (kết quả, danh sách thất bại kèm lý do). Một file lỗi không được làm dừng cả mẻ.

<details><summary>Lời giải</summary>

```python
def run(folder: str) -> tuple[list[dict], list[dict]]:
    ok, failed = [], []
    for p in sorted(pathlib.Path(folder).rglob("*")):
        if not p.is_file():
            continue
        try:
            for rec in extract(str(p)):
                ok.append(rec | {"source_path": str(p), "doc_id": url_id(str(p))})
        except Exception as e:
            failed.append({"file": str(p), "loi": type(e).__name__, "chi_tiet": str(e)[:200]})
            log.warning("Bỏ qua %s: %s", p, e)
    log.info("Xong: %d đoạn từ %d file, %d file lỗi", len(ok), len({r['doc_id'] for r in ok}), len(failed))
    return ok, failed
```
</details>

### Bài 9.4 — Đo chất lượng OCR
Với 3 trang scan, so sánh text OCR với text gõ tay (ground truth) bằng tỉ lệ ký tự sai (CER). Thử ở 150 và 300 DPI.

<details><summary>Lời giải</summary>

```python
def cer(pred: str, truth: str) -> float:
    import difflib
    sm = difflib.SequenceMatcher(None, pred, truth)
    return 1 - sm.ratio()
```
Kết quả thường thấy: 300 DPI giảm CER rõ rệt so với 150 DPI, nhưng chậm hơn ~4 lần. Ghi số vào báo cáo — đây là kiểu đánh đổi bạn sẽ gặp lại suốt lộ trình.
</details>

## ④ Đồ án tuần 9 (3h) — pipeline trích xuất

**Checklist nghiệm thu:**
- [ ] Nhận thư mục lẫn lộn PDF text / PDF scan / DOCX / ảnh → tự định tuyến đúng.
- [ ] Đầu ra JSONL: `{doc_id, source_path, page, text, char_count, method}`.
- [ ] Báo cáo thất bại riêng, không làm sập pipeline.
- [ ] Áp dụng chuẩn hoá tiếng Việt + loại boilerplate.
- [ ] Test với ≥1 file hỏng cố ý (PDF mã hoá, ảnh mờ).
- [ ] Thống kê cuối: bao nhiêu trang `pdf_text` / `ocr` / `docx`, tổng ký tự.

---

# TUẦN 10 — Chunking & Vector Database

**Mục tiêu:** hiểu vì sao chunking là **biến số ảnh hưởng lớn nhất tới chất lượng RAG** — lớn hơn cả việc chọn model — và đo được điều đó bằng số.

## ① Lý thuyết (2h)

### 10.1 Năm chiến lược chunking

| Chiến lược | Cách làm | Hợp với |
|---|---|---|
| Fixed-size | Cắt đều theo ký tự/token + overlap | Baseline, văn bản đồng nhất |
| Recursive | Ưu tiên cắt tại `\n\n` → `\n` → `. ` → ` ` | **Mặc định tốt cho hầu hết trường hợp** |
| Theo cấu trúc | Cắt theo heading / điều khoản / mục | Luật, hướng dẫn, giáo trình |
| Semantic | Cắt nơi embedding các câu lệch nhiều | Văn xuôi dài, chủ đề đan xen; đắt hơn |
| Parent-child | Index chunk nhỏ để tìm, trả đoạn cha lớn để sinh | Cần vừa chính xác vừa đủ ngữ cảnh |

### 10.2 Ba nguyên tắc

1. **Overlap 10–20% chunk size.** Ít quá mất ngữ cảnh ở mép cắt; nhiều quá phình chi phí và trả kết quả trùng lặp.
2. **Mỗi chunk mang đủ metadata để trích dẫn**: `doc_id`, `source`, `page`, `heading`, `chunk_index`.
3. **Thêm ngữ cảnh vào đầu chunk** (contextual retrieval): `[Tên tài liệu › Heading]\n<nội dung>`. Nhờ vậy chunk "Mức phạt là 5 triệu đồng" không còn mồ côi.

### 10.3 Embedding: ba điều phải nhớ

- **Model họ E5 bắt buộc tiền tố** `passage:` khi index và `query:` khi truy vấn. Quên thì chất lượng tụt âm thầm.
- **Chiều vector phải khớp collection.** Đổi model = index lại toàn bộ.
- **Chuẩn hoá vector** (`normalize_embeddings=True`) để cosine = dot product.

### 10.4 Vì sao cần bộ golden ngay bây giờ

Ai cũng làm ngược: build xong mới nghĩ cách đo, và đã tối ưu mù cả tháng. Tuần này bạn soạn **bộ 15 câu hỏi vàng có ground truth** — nó sẽ được dùng lại ở T13, T14, T35 (CI) và mọi lần bạn đổi bất cứ thứ gì.

## ② Code ví dụ (2h)

```python
# --- 1. Chunking recursive có metadata ---
from langchain_text_splitters import RecursiveCharacterTextSplitter

splitter = RecursiveCharacterTextSplitter(
    chunk_size=800, chunk_overlap=120,
    separators=["\n## ", "\n### ", "\n\n", "\n", ". ", " ", ""],
)

def make_chunks(page: dict, doc_title: str) -> list[dict]:
    return [{
        "chunk_id": f"{page['doc_id']}-{page['page']}-{i}",
        "text": f"[{doc_title} › trang {page['page']}]\n{piece}",    # contextual retrieval
        "raw_text": piece,
        "doc_id": page["doc_id"], "source": page["source_path"],
        "page": page["page"], "chunk_index": i,
    } for i, piece in enumerate(splitter.split_text(page["text"]))]

# --- 2. Embedding ---
from sentence_transformers import SentenceTransformer
model = SentenceTransformer("intfloat/multilingual-e5-small")     # 384 chiều

vecs = model.encode([f"passage: {c['text']}" for c in chunks],    # ⚠️ tiền tố bắt buộc
                    normalize_embeddings=True, batch_size=32, show_progress_bar=True)

# --- 3. Qdrant ---
# docker run -d -p 6333:6333 -v qdrant_storage:/qdrant/storage --name qdrant qdrant/qdrant
from qdrant_client import QdrantClient
from qdrant_client.models import (Distance, VectorParams, PointStruct,
                                  Filter, FieldCondition, MatchValue)

client = QdrantClient(url="http://localhost:6333")
client.recreate_collection("docs", vectors_config=VectorParams(size=384, distance=Distance.COSINE))

client.upsert("docs", points=[
    PointStruct(id=i, vector=v.tolist(), payload=c)
    for i, (v, c) in enumerate(zip(vecs, chunks))
])

res = client.query_points(
    "docs",
    query=model.encode([f"query: {q}"], normalize_embeddings=True)[0].tolist(),
    limit=5,
    query_filter=Filter(must=[FieldCondition(key="source", match=MatchValue(value="luat.pdf"))]),
    with_payload=True,
)
for p in res.points:
    print(round(p.score, 3), p.payload["source"], "tr.", p.payload["page"])

# --- 4. Đo Recall@k trên bộ golden ---
def recall_at_k(search_fn, golden: list[dict], k: int = 5) -> float:
    hits = 0
    for item in golden:
        got = {r.payload["doc_id"] for r in search_fn(item["question"], k=k)}
        hits += bool(got & set(item["expected_doc_ids"]))
    return hits / len(golden)
```

## ③ Thực hành (2h) — 4 bài

### Bài 10.1 — Chunking theo cấu trúc Markdown
Viết `chunk_by_heading(md_text)` cắt theo `##`/`###`, mỗi chunk giữ đường dẫn heading đầy đủ (`"Chương 1 › Điều 3"`), và **gộp** chunk ngắn hơn 100 ký tự vào chunk trước.

<details><summary>Lời giải</summary>

```python
import re

def chunk_by_heading(md: str, min_len: int = 100) -> list[dict]:
    parts, stack, buf, cur = [], [], [], []
    for line in md.splitlines():
        if m := re.match(r"^(#{2,4})\s+(.*)", line):
            if buf:
                parts.append({"path": " › ".join(stack), "text": "\n".join(buf).strip()})
                buf = []
            level = len(m.group(1)) - 2
            stack = stack[:level] + [m.group(2).strip()]
        else:
            buf.append(line)
    if buf:
        parts.append({"path": " › ".join(stack), "text": "\n".join(buf).strip()})

    merged: list[dict] = []                       # gộp chunk quá ngắn
    for p in parts:
        if merged and len(p["text"]) < min_len:
            merged[-1]["text"] += "\n\n" + p["text"]
        elif p["text"]:
            merged.append(p)
    return merged
```
</details>

### Bài 10.2 — Chứng minh tiền tố E5 có tác dụng
Đo Recall@5 trên bộ golden hai lần: có tiền tố `query:`/`passage:` và không có. Báo cáo chênh lệch.

<details><summary>Lời giải</summary>

Chạy `recall_at_k` hai lần với hai cách encode. Kết quả điển hình: bỏ tiền tố làm Recall@5 giảm vài đến hơn chục điểm phần trăm tuỳ corpus. Bài học lớn hơn: **mọi model embedding đều có quy ước riêng** — luôn đọc model card trước khi dùng, đừng suy diễn.
</details>

### Bài 10.3 — Index tăng dần theo hash
Viết `sync_index(chunks)` chỉ upsert chunk **mới hoặc đã đổi nội dung** (so bằng hash), và xoá chunk của tài liệu đã bị gỡ.

<details><summary>Lời giải</summary>

```python
def content_hash(text: str) -> str:
    return hashlib.sha256(text.encode()).hexdigest()[:16]

def sync_index(client, chunks: list[dict]) -> dict:
    existing = {p.payload["chunk_id"]: p.payload.get("hash")
                for p in client.scroll("docs", limit=100_000, with_payload=True)[0]}
    to_upsert = [c for c in chunks
                 if existing.get(c["chunk_id"]) != content_hash(c["raw_text"])]
    to_delete = set(existing) - {c["chunk_id"] for c in chunks}
    # ... encode & upsert to_upsert, client.delete theo filter chunk_id in to_delete
    return {"them_sua": len(to_upsert), "xoa": len(to_delete)}
```
Không có bước này thì mỗi lần đổi 1 file phải index lại toàn bộ — không mở rộng được.
</details>

### Bài 10.4 — Bộ golden đúng chuẩn
Soạn `eval/golden.jsonl` 15 dòng, mỗi dòng `{question, expected_doc_ids, expected_answer, kho: "de|trung binh|kho"}`. Trong đó phải có **3 câu không có đáp án trong tài liệu**.

<details><summary>Lời giải — tiêu chí một bộ golden tốt</summary>

- Câu hỏi viết như người dùng thật hỏi, **không** copy nguyên văn câu trong tài liệu (nếu copy thì chỉ đang test khớp chuỗi).
- Đủ 3 mức khó: tra cứu trực tiếp / cần tổng hợp 2 nguồn / cần suy luận.
- 20% là câu **không có đáp án** — để đo khả năng nói "không biết", chỉ số chống ảo giác quan trọng nhất.
- Ghi `expected_doc_ids` bằng tay, không sinh tự động bằng chính hệ thống đang đo (sẽ thành tự chấm điểm mình).
</details>

## ④ Đồ án tuần 10 + 🎓 ĐỒ ÁN MÔN 3 (3h) — `ingest`

Gộp T7–T10 thành CLI một lệnh: `ingest run --src data/raw --collection docs`

```
w10-ingest/
├── src/ingest/
│   ├── clean.py        # T7    extract.py  # T9
│   ├── crawl.py        # T8    chunk.py    # T10
│   ├── embed.py  index.py  cli.py
├── eval/golden.jsonl   # 15 câu có ground truth
├── reports/chunking_comparison.md
└── BAOCAO.md
```

**Checklist nghiệm thu:**
- [ ] Một lệnh chạy trọn: raw → clean → extract → chunk → embed → Qdrant.
- [ ] So sánh **3 chiến lược chunking** trên bộ golden: bảng Recall@5, Recall@10, số chunk, thời gian index, dung lượng.
- [ ] Kết luận kèm **ví dụ cụ thể**: một câu hỏi cấu hình A trúng còn B trượt, giải thích tại sao.
- [ ] Index tăng dần theo hash (không index lại toàn bộ).
- [ ] `BAOCAO.md` đủ 5 mục.

---

# TUẦN 11 — Prompt Engineering ở cấp lập trình

**Mục tiêu:** coi prompt là **code có version, có test**, không phải chuỗi chỉnh tay đến khi "có vẻ ổn".

## ① Lý thuyết (2h)

### 11.1 Năm kỹ thuật có tác dụng thật, xếp theo hiệu quả/chi phí

1. **Vai trò + quy tắc rõ ràng trong system prompt** — rẻ nhất, tác dụng lớn nhất.
2. **Thẻ XML phân tách** (`<tai_lieu>`, `<cau_hoi>`) — model bám cấu trúc tốt hơn markdown, và chống prompt injection tốt hơn.
3. **Few-shot 2–5 ví dụ** — mạnh cho tác vụ định dạng/phân loại. Ví dụ phải gồm **ca khó và ca biên**, không chỉ ca dễ.
4. **Cho phép nói "không biết"** — giảm ảo giác mạnh nhất trong RAG.
5. **Chain-of-thought** — tốt cho suy luận, nhưng tốn token đầu ra và tăng độ trễ. Không dùng cho tác vụ đơn giản.

### 11.2 Bốn tầng chống ảo giác trong RAG

(1) chỉ thị "chỉ dùng tài liệu" → (2) cho phép nói không biết → (3) bắt trích dẫn nguồn từng ý → (4) hậu kiểm bằng eval (T14).

### 11.3 Tham số sampling

| Tham số | Dùng khi |
|---|---|
| `temperature` | **0–0.2** cho trích xuất/phân loại/RAG; 0.7–1.0 cho sáng tạo |
| `max_tokens` | Luôn đặt — kiểm soát chi phí và chống lan man |
| `top_p` | Chỉnh `temperature` **hoặc** `top_p`, không cả hai |
| `stop_sequences` | Khi output theo khuôn cố định |

> `temperature=0` **không** đảm bảo kết quả giống hệt qua các lần gọi (batching phía server, dấu phẩy động). Đừng thiết kế test dựa trên giả định tất định tuyệt đối — hãy assert theo tính chất (có chứa số này, thuộc tập nhãn này), không assert chuỗi chính xác.

### 11.4 Vì sao phải version prompt

Khi chất lượng tụt sau một lần "sửa nhẹ", bạn cần biết chính xác đã đổi gì và quay lại được. Ở T35, CI sẽ tự chạy eval trên từng version.

## ② Code ví dụ (2h)

```python
# --- 1. Cấu trúc prompt RAG ---
SYSTEM = """Bạn là trợ lý tra cứu tài liệu nội bộ.

QUY TẮC:
- Chỉ trả lời dựa trên TÀI LIỆU được cung cấp.
- Nếu tài liệu không chứa thông tin, trả lời đúng câu:
  "Tôi không tìm thấy thông tin này trong tài liệu."
- Sau mỗi ý, ghi số nguồn dạng [1], [2].
- Trả lời ngắn gọn, tối đa 5 câu."""

USER = """<tai_lieu>
{context}
</tai_lieu>

<cau_hoi>
{question}
</cau_hoi>"""

# --- 2. Prompt là code có version ---
import yaml
from pathlib import Path
from pydantic import BaseModel

class Prompt(BaseModel):
    name: str
    version: str
    system: str
    user_template: str
    notes: str = ""

    def render(self, **kw) -> dict:
        return {"system": self.system, "user": self.user_template.format(**kw)}

def load_prompt(name: str, version: str) -> Prompt:
    p = Path(f"prompts/{name}/{version}.yaml")
    return Prompt.model_validate(yaml.safe_load(p.read_text(encoding="utf-8")))

# prompts/rag_answer/v1.yaml  → v2 (thêm quy tắc trích dẫn) → v3 (thêm few-shot "không tìm thấy")

# --- 3. Cache để chạy lại không tốn tiền ---
import hashlib, json, pathlib

CACHE = pathlib.Path(".cache/llm"); CACHE.mkdir(parents=True, exist_ok=True)

def cached_call(model: str, system: str, user: str, temperature: float = 0.0) -> str:
    key = hashlib.sha256(f"{model}|{system}|{user}|{temperature}".encode()).hexdigest()
    f = CACHE / f"{key}.json"
    if f.exists():
        return json.loads(f.read_text(encoding="utf-8"))["text"]
    text = call_llm(model=model, system=system, user=user, temperature=temperature)
    f.write_text(json.dumps({"text": text}, ensure_ascii=False), encoding="utf-8")
    return text

# --- 4. So sánh 2 version trên cùng bộ test ---
def compare(prompt_versions: list[str], cases: list[dict]) -> pd.DataFrame:
    rows = []
    for v in prompt_versions:
        p = load_prompt("classify_intent", v)
        correct = sum(cached_call("claude-sonnet-5", **p.render(text=c["input"])).strip()
                      == c["expected"] for c in cases)
        rows.append({"version": v, "dung": correct, "tong": len(cases),
                     "do_chinh_xac": correct / len(cases)})
    return pd.DataFrame(rows)
```

## ③ Thực hành (2h) — 4 bài

### Bài 11.1 — Viết lại prompt tệ
```
Bạn là AI thông minh. Hãy trả lời câu hỏi dựa vào thông tin sau: {context}
Câu hỏi: {question}. Trả lời hay nhé!
```
Chỉ ra ≥5 vấn đề và viết lại.

<details><summary>Lời giải</summary>

Vấn đề: (1) "AI thông minh" là lời khen vô nghĩa, không định nghĩa vai trò; (2) không phân tách rõ context với câu hỏi → dễ bị prompt injection từ tài liệu; (3) không cấm dùng kiến thức ngoài tài liệu; (4) không có lối thoát "không biết" → model buộc phải bịa; (5) không yêu cầu trích dẫn; (6) "trả lời hay nhé" không phải chỉ dẫn đo được; (7) không giới hạn độ dài → không kiểm soát chi phí.

Bản viết lại: dùng `SYSTEM` + `USER` với thẻ XML ở mục ② phía trên.
</details>

### Bài 11.2 — Few-shot cho ca biên
Tác vụ: phân loại câu hỏi thành `tra_cuu | so_sanh | ngoai_pham_vi`. Viết 5 ví dụ few-shot, trong đó **ít nhất 3 ví dụ là ca khó** (mơ hồ, nhiều ý, gần ranh giới).

<details><summary>Lời giải — nguyên tắc chọn ví dụ</summary>

Ví dụ few-shot tốt phải dạy **ranh giới**, không dạy trường hợp hiển nhiên:
- Ca gần ranh giới: "Chính sách nghỉ phép có gì khác năm ngoái?" → `so_sanh` (không phải `tra_cuu`, dù có vẻ là tra cứu).
- Ca nhiều ý: "Cho tôi biết quy định nghỉ phép và so với công ty khác" → `so_sanh` (lấy nhãn bao trùm hơn).
- Ca đánh lừa: "Thời tiết hôm nay thế nào?" → `ngoai_pham_vi` dù câu hỏi hoàn toàn hợp lệ về mặt ngôn ngữ.

Chỉ đưa ca dễ thì model vốn đã làm đúng — few-shot không thêm giá trị gì.
</details>

### Bài 11.3 — Test prompt không phụ thuộc chuỗi chính xác
Viết 5 test cho prompt RAG mà **không** assert bằng so sánh chuỗi.

<details><summary>Lời giải</summary>

```python
def test_co_trich_dan(answer):        assert re.search(r"\[\d+\]", answer)
def test_noi_khong_biet(answer):      assert "không tìm thấy" in answer.lower()
def test_do_dai(answer):              assert len(answer.split(". ")) <= 6
def test_khong_bia_so(answer, ctx):   # mọi số trong câu trả lời phải có trong context
    assert set(re.findall(r"\d[\d.,]*", answer)) <= set(re.findall(r"\d[\d.,]*", ctx))
def test_dung_nhan(answer):           assert answer.strip() in {"tra_cuu","so_sanh","ngoai_pham_vi"}
```
`test_khong_bia_so` là kiểm tra faithfulness rẻ tiền mà rất hiệu quả — chạy được trong CI, không cần LLM judge.
</details>

### Bài 11.4 — Đo tác dụng của từng chỉ thị
Tạo 4 biến thể prompt (bỏ dần từng quy tắc) và đo trên 20 test case: bản đủ, bỏ "chỉ dùng tài liệu", bỏ "được nói không biết", bỏ yêu cầu trích dẫn.

<details><summary>Lời giải — kết quả điển hình</summary>

Bảng thường cho thấy: bỏ "được nói không biết" làm tỉ lệ bịa tăng vọt trên nhóm câu không có đáp án; bỏ yêu cầu trích dẫn không đổi độ chính xác nhưng làm mất khả năng kiểm chứng của người dùng. Đây gọi là **ablation study** — kỹ thuật chuẩn để chứng minh từng thành phần thật sự có tác dụng, và là thứ rất được đánh giá cao khi trình bày dự án.
</details>

## ④ Đồ án tuần 11 (3h) — module prompt có test

**Checklist nghiệm thu:**
- [ ] `prompts/` có ≥2 prompt, mỗi cái ≥2 version, load bằng Pydantic.
- [ ] Bộ **20 test case** cho tác vụ phân loại, gồm ca biên.
- [ ] Script so sánh các version, in bảng độ chính xác.
- [ ] Cache kết quả LLM ra đĩa → chạy lại miễn phí.
- [ ] Ablation study ≥3 biến thể, kết luận chỉ thị nào đáng giá nhất.

---

# TUẦN 12 — Structured Output & Tool Calling

**Mục tiêu:** biến LLM từ "máy sinh văn bản" thành **thành phần phần mềm có hợp đồng đầu ra rõ ràng** — nền tảng bắt buộc trước khi học Agent.

## ① Lý thuyết (2h)

### 12.1 Ba cách bắt model trả đúng cấu trúc

| Cách | Độ tin cậy | Khi dùng |
|---|---|---|
| Tool/function calling có schema | Cao nhất — provider ép model tuân thủ | Mặc định |
| JSON mode | Đảm bảo JSON hợp lệ, **không** đảm bảo đúng schema của bạn | Khi không có tool calling |
| Chỉ dẫn trong prompt + parse | Thấp nhất | Model không hỗ trợ gì khác |

Dù dùng cách nào, **luôn có vòng validate–retry**. Mẹo hiệu quả: đưa chính thông báo lỗi của Pydantic vào lượt retry — tỉ lệ thành công lần 2 thường >90%.

### 12.2 Bốn nguyên tắc viết tool tốt

1. `description` là **tài liệu viết cho model đọc** — ghi rõ khi nào dùng *và khi nào không*.
2. **Cắt độ dài kết quả tool.** Một tool trả 50.000 ký tự làm nổ context.
3. **Lỗi tool trả về cho model dưới dạng text** (`is_error: true`), đừng ném ra ngoài — model tự điều chỉnh rất tốt.
4. **Luôn có `max_turns`.** Không có là mở cửa cho vòng lặp vô hạn đốt tiền.

> Vòng lặp tool calling ở mục ② chính là **agent tối giản**. Tuần 19 bạn sẽ viết lại nó có suy luận, và Tuần 20 chuyển sang LangGraph. Hiểu kỹ đoạn này thì hai tuần đó nhẹ nhàng.

### 12.3 Quản lý context hội thoại

Context window là ngân sách. Ba chiến lược: **cắt cửa sổ** (giữ N lượt gần nhất, rẻ, mất trí nhớ xa), **tóm tắt cuộn** (nén lượt cũ thành summary, giữ được dữ kiện, tốn thêm một lần gọi LLM), **chọn lọc theo liên quan** (embedding lượt cũ, lấy lại khi cần — chính là RAG áp lên lịch sử chat).

## ② Code ví dụ (2h)

```python
# --- 1. Structured output + retry có phản hồi lỗi ---
from typing import Literal
from pydantic import BaseModel, Field, ValidationError

class Extraction(BaseModel):
    intent: Literal["tra_cuu", "so_sanh", "ngoai_pham_vi"]
    entities: list[str] = Field(default_factory=list)
    confidence: float = Field(ge=0, le=1)
    reasoning: str

def extract_with_retry(text: str, max_attempts: int = 3) -> Extraction:
    errors: list[str] = []
    for _ in range(max_attempts):
        raw = call_llm(build_prompt(text, previous_errors=errors))
        try:
            return Extraction.model_validate_json(raw)
        except ValidationError as e:
            errors.append(str(e))                  # đưa lỗi NGƯỢC vào prompt
            log.warning("Schema sai, thử lại: %s", e)
    raise ValueError(f"Không lấy được đầu ra hợp lệ sau {max_attempts} lần")

# --- 2. Định nghĩa tool ---
TOOLS = [{
    "name": "search_docs",
    "description": ("Tìm trong kho tài liệu nội bộ. DÙNG khi câu hỏi liên quan quy định, "
                    "hướng dẫn, chính sách của công ty. KHÔNG DÙNG cho câu hỏi kiến thức "
                    "phổ thông hoặc tính toán."),
    "input_schema": {
        "type": "object",
        "properties": {
            "query": {"type": "string", "description": "Câu truy vấn tiếng Việt"},
            "top_k": {"type": "integer", "default": 5},
        },
        "required": ["query"],
    },
}]

# --- 3. Vòng lặp tool calling = agent tối giản ---
def run(user_msg: str, max_turns: int = 5) -> str:
    messages = [{"role": "user", "content": user_msg}]
    for turn in range(max_turns):
        resp = client.messages.create(model=MODEL, max_tokens=1024,
                                      tools=TOOLS, messages=messages)
        if resp.stop_reason != "tool_use":
            return "".join(b.text for b in resp.content if b.type == "text")

        messages.append({"role": "assistant", "content": resp.content})
        results = []
        for block in resp.content:
            if block.type != "tool_use":
                continue
            try:
                out, is_err = REGISTRY[block.name](**block.input), False
            except Exception as e:
                out, is_err = f"Lỗi: {e}", True     # báo lỗi CHO MODEL
            results.append({"type": "tool_result", "tool_use_id": block.id,
                            "content": str(out)[:4000], "is_error": is_err})
        messages.append({"role": "user", "content": results})
    raise RuntimeError(f"Vượt quá {max_turns} lượt tool calling")

# --- 4. Quản lý lịch sử ---
class ConversationManager:
    def __init__(self, max_tokens: int = 8000, keep_recent: int = 6):
        self.messages: list[dict] = []
        self.summary = ""
        self.max_tokens, self.keep_recent = max_tokens, keep_recent

    def add(self, role: str, content: str) -> None:
        self.messages.append({"role": role, "content": content})
        if self._count_tokens() > self.max_tokens:
            self._compress()

    def _compress(self) -> None:
        old, recent = self.messages[:-self.keep_recent], self.messages[-self.keep_recent:]
        self.summary = call_llm(
            "Tóm tắt hội thoại sau trong 150 từ, GIỮ LẠI mọi dữ kiện, con số, tên riêng "
            f"và yêu cầu chưa hoàn thành:\n{format_msgs(old)}")
        self.messages = recent

    def build(self) -> list[dict]:
        if not self.summary:
            return self.messages
        return [{"role": "user", "content": f"[Tóm tắt hội thoại trước]\n{self.summary}"},
                {"role": "assistant", "content": "Đã nắm bối cảnh."}, *self.messages]
```

## ③ Thực hành (2h) — 4 bài

### Bài 12.1 — Viết lại description tool
```python
{"name": "search", "description": "Tìm kiếm"}
```
Viết lại cho model dùng đúng, và giải thích vì sao bản gốc gây lỗi.

<details><summary>Lời giải</summary>

Bản gốc khiến model gọi tool cho **mọi** câu hỏi (kể cả "2+2 bằng mấy") vì không biết phạm vi. Bản tốt phải có: mục đích, khi nào DÙNG, khi nào KHÔNG DÙNG, ý nghĩa từng tham số, dạng kết quả trả về. Xem `search_docs` ở mục ②.

Nguyên tắc: viết description như viết cho một đồng nghiệp mới, chưa biết gì về hệ thống, chỉ đọc đúng đoạn đó.
</details>

### Bài 12.2 — Tool an toàn
Viết `safe_tool(fn, max_chars=4000, timeout=10)` bọc bất kỳ hàm tool nào: giới hạn thời gian chạy, cắt độ dài kết quả (có ghi chú "…đã cắt"), bắt mọi exception thành text.

<details><summary>Lời giải</summary>

```python
import asyncio, functools

def safe_tool(fn, max_chars: int = 4000, timeout: float = 10.0):
    @functools.wraps(fn)
    async def wrapper(**kwargs) -> tuple[str, bool]:
        try:
            out = await asyncio.wait_for(asyncio.to_thread(fn, **kwargs), timeout)
        except asyncio.TimeoutError:
            return f"Lỗi: tool {fn.__name__} vượt quá {timeout}s", True
        except Exception as e:
            return f"Lỗi: {type(e).__name__}: {e}", True
        text = str(out)
        if len(text) > max_chars:
            text = text[:max_chars] + f"\n…(đã cắt, tổng {len(str(out))} ký tự)"
        return text, False
    return wrapper
```
</details>

### Bài 12.3 — Nén lịch sử giữ được dữ kiện
Viết test chứng minh: sau 30 lượt hội thoại có nén, thông tin quan trọng ở lượt 2 (ví dụ "mã đơn hàng của tôi là DH-2024-8891") **vẫn còn** truy xuất được.

<details><summary>Lời giải</summary>

```python
def test_nen_giu_du_kien():
    cm = ConversationManager(max_tokens=500, keep_recent=4)
    cm.add("user", "Mã đơn hàng của tôi là DH-2024-8891")
    for i in range(30):
        cm.add("user", f"câu hỏi phụ {i}"); cm.add("assistant", f"trả lời {i}")
    ctx = json.dumps(cm.build(), ensure_ascii=False)
    assert "DH-2024-8891" in ctx        # phải nằm trong summary
```
Nếu test này trượt, prompt tóm tắt của bạn chưa đủ mạnh về việc "GIỮ LẠI mọi dữ kiện, con số, tên riêng".
</details>

### Bài 12.4 — Chống vòng lặp vô hạn
Agent gọi `search_docs` với cùng một query 5 lần liên tiếp. Viết cơ chế phát hiện và cắt.

<details><summary>Lời giải</summary>

```python
from collections import Counter

class LoopGuard:
    def __init__(self, max_repeat: int = 2, max_total: int = 10):
        self.calls: Counter = Counter()
        self.max_repeat, self.max_total = max_repeat, max_total

    def check(self, name: str, args: dict) -> str | None:
        key = f"{name}:{json.dumps(args, sort_keys=True, ensure_ascii=False)}"
        self.calls[key] += 1
        if self.calls[key] > self.max_repeat:
            return f"Bạn đã gọi {name} với tham số này {self.calls[key]} lần. Hãy đổi cách tiếp cận hoặc trả lời bằng thông tin đã có."
        if sum(self.calls.values()) > self.max_total:
            return "Đã vượt ngân sách gọi tool. Hãy trả lời bằng thông tin hiện có."
        return None
```
Trả **thông điệp cho model** thay vì ném lỗi — model thường tự thoát vòng lặp khi được nhắc. Đây là nền cho phần an toàn agent ở Tuần 25.
</details>

## ④ Đồ án tuần 12 (3h) — chatbot CLI có tool

**Checklist nghiệm thu:**
- [ ] 3 tool thật: `search_docs` (nối Qdrant T10), `calculator`, 1 tool gọi API ngoài.
- [ ] Vòng tool calling có `max_turns`, `LoopGuard`, `safe_tool`.
- [ ] Structured output bằng Pydantic + retry có phản hồi lỗi.
- [ ] Nén lịch sử tự động; test 30 lượt không vỡ context và không mất dữ kiện.
- [ ] Hiển thị token + chi phí luỹ kế sau mỗi lượt.

---

# TUẦN 13 — RAG hoàn chỉnh

**Mục tiêu:** nâng RAG ngây thơ lên chất lượng sản xuất: hybrid search, rerank, trích dẫn, biết nói không biết.

## ① Lý thuyết (2h)

### 13.1 Sáu lý do RAG ngây thơ thất bại

| Triệu chứng | Nguyên nhân | Cách chữa |
|---|---|---|
| Hỏi mã/số hiệu → không ra | Vector kém với định danh chính xác | **Hybrid**: thêm BM25 |
| Top-5 gần giống hệt nhau | Không khử trùng lặp | MMR hoặc khử trùng theo `doc_id` |
| Chunk đúng nằm ở vị trí 8 | Xếp hạng embedding chưa đủ tinh | **Reranker** cross-encoder |
| Đại từ ("cái đó thì sao?") | Truy vấn thiếu ngữ cảnh | Query rewriting theo lịch sử |
| Model bịa | Thiếu ràng buộc | Prompt + trích dẫn + hậu kiểm |
| Câu cần tổng hợp nhiều nguồn | Top-k không đủ bao phủ | Query decomposition |

### 13.2 Kiến trúc chuẩn: rộng → hẹp → sinh

```
truy hồi rộng (k=20–50)  →  rerank hẹp (top 3–5)  →  sinh câu trả lời
   nhanh, rẻ, bao phủ        chậm, chính xác          đắt nhất
```

Reranker là **cross-encoder**: đọc cặp (query, chunk) cùng lúc nên chính xác hơn nhiều so với so sánh hai vector độc lập — nhưng vì thế không thể quét cả corpus, chỉ dùng để tinh lọc.

### 13.3 RRF — gộp nhiều bảng xếp hạng

`score(d) = Σ 1/(c + rank_i(d))` với `c = 60`. Ưu điểm: không cần chuẩn hoá điểm giữa hai hệ thang đo hoàn toàn khác nhau (cosine 0–1 và BM25 0–∞). Đơn giản mà mạnh.

## ② Code ví dụ (2h)

```python
import numpy as np
from rank_bm25 import BM25Okapi
from sentence_transformers import CrossEncoder

# --- 1. Hybrid search + RRF ---
class HybridRetriever:
    def __init__(self, chunks: list[dict], client, model):
        self.chunks = {c["chunk_id"]: c for c in chunks}
        self.ids = list(self.chunks)
        self.bm25 = BM25Okapi([self.chunks[i]["raw_text"].lower().split() for i in self.ids])
        self.client, self.model = client, model

    def search(self, query: str, k: int = 20) -> list[dict]:
        qv = self.model.encode([f"query: {query}"], normalize_embeddings=True)[0]
        dense = [p.payload["chunk_id"]
                 for p in self.client.query_points("docs", query=qv.tolist(), limit=k).points]
        scores = self.bm25.get_scores(query.lower().split())
        sparse = [self.ids[i] for i in np.argsort(-scores)[:k]]
        return [self.chunks[i] for i in self._rrf(dense, sparse, k=k)]

    @staticmethod
    def _rrf(*rankings: list[str], k: int = 20, c: int = 60) -> list[str]:
        fused: dict[str, float] = {}
        for ranking in rankings:
            for rank, doc_id in enumerate(ranking, start=1):
                fused[doc_id] = fused.get(doc_id, 0) + 1 / (c + rank)
        return sorted(fused, key=lambda d: fused[d], reverse=True)[:k]

# --- 2. Rerank ---
reranker = CrossEncoder("BAAI/bge-reranker-v2-m3")

def rerank(query: str, candidates: list[dict], top_n: int = 5, threshold: float = 0.0):
    scores = reranker.predict([(query, c["raw_text"]) for c in candidates])
    ranked = sorted(zip(candidates, scores), key=lambda x: -x[1])
    return [c for c, s in ranked[:top_n] if s > threshold]

# --- 3. Query rewriting cho hội thoại nhiều lượt ---
REWRITE = """Cho lịch sử hội thoại và câu hỏi mới, viết lại câu hỏi thành câu ĐỘC LẬP,
đầy đủ ngữ cảnh, không dùng đại từ. Chỉ trả về câu hỏi đã viết lại.

<lich_su>{history}</lich_su>
<cau_hoi_moi>{question}</cau_hoi_moi>"""

def rewrite_query(question: str, history: list[dict]) -> str:
    if not history:
        return question
    return call_llm(REWRITE.format(history=format_msgs(history[-4:]), question=question),
                    temperature=0).strip()

# --- 4. Sinh câu trả lời có trích dẫn ---
def build_context(chunks: list[dict]) -> str:
    return "\n\n".join(f"[{i}] Nguồn: {c['source']}, trang {c['page']}\n{c['raw_text']}"
                       for i, c in enumerate(chunks, start=1))

def answer(question: str, chunks: list[dict]) -> dict:
    if not chunks:
        return {"answer": "Tôi không tìm thấy thông tin này trong tài liệu.", "citations": []}
    text = call_llm(system=SYSTEM, user=USER.format(context=build_context(chunks),
                                                    question=question), temperature=0.1)
    return {"answer": text, "citations": to_citations(chunks)}
```

## ③ Thực hành (2h) — 4 bài

### Bài 13.1 — Cài RRF và kiểm chứng
Viết test cho `_rrf`: tài liệu đứng đầu **cả hai** bảng phải xếp trên tài liệu chỉ đứng đầu một bảng.

<details><summary>Lời giải</summary>

```python
def test_rrf_uu_tien_dong_thuan():
    dense  = ["a", "b", "c"]
    sparse = ["a", "d", "e"]
    assert HybridRetriever._rrf(dense, sparse)[0] == "a"     # a: 1/61 + 1/61
    # b (1/62) và d (1/62) bằng điểm, đều xếp sau a
```
Đây là tính chất cốt lõi của RRF: **đồng thuận giữa nhiều nguồn được thưởng**.
</details>

### Bài 13.2 — Khử trùng lặp bằng MMR
Viết `mmr(query_vec, candidates, k=5, lambda_=0.7)` chọn k chunk vừa liên quan vừa đa dạng.

<details><summary>Lời giải</summary>

```python
def mmr(qv: np.ndarray, cands: list[dict], vecs: np.ndarray,
        k: int = 5, lambda_: float = 0.7) -> list[int]:
    selected: list[int] = []
    remaining = list(range(len(cands)))
    rel = vecs @ qv
    while len(selected) < k and remaining:
        if not selected:
            best = max(remaining, key=lambda i: rel[i])
        else:
            best = max(remaining, key=lambda i:
                       lambda_ * rel[i] - (1 - lambda_) * max(vecs[i] @ vecs[j] for j in selected))
        selected.append(best); remaining.remove(best)
    return selected
```
`lambda_=1` là thuần liên quan; `lambda_=0` là thuần đa dạng. 0,7 là điểm cân bằng thường dùng.
</details>

### Bài 13.3 — Kiểm chứng hybrid cứu được ca nào
Tìm trong corpus của bạn ≥2 truy vấn mà vector-only trượt còn hybrid trúng. Ghi lại kèm giải thích.

<details><summary>Lời giải — cách tìm nhanh</summary>

Chạy cả hai retriever trên bộ golden, lọc các câu `recall_dense == 0 and recall_hybrid == 1`. Ca hay gặp: mã/số hiệu (`SKU-99123`, `Thông tư 45/2023`), tên riêng hiếm, thuật ngữ viết tắt. Giữ lại làm bằng chứng trong báo cáo Tuần 14 — con số thì thuyết phục, ví dụ cụ thể thì đáng nhớ.
</details>

### Bài 13.4 — Hậu kiểm trích dẫn
Viết `verify_citations(answer, chunks) -> list[str]` trả về danh sách vấn đề: trích dẫn `[n]` trỏ tới nguồn không tồn tại, câu khẳng định không có trích dẫn nào, số liệu trong câu trả lời không có trong context.

<details><summary>Lời giải</summary>

```python
def verify_citations(answer: str, chunks: list[dict]) -> list[str]:
    issues = []
    used = {int(n) for n in re.findall(r"\[(\d+)\]", answer)}
    if invalid := used - set(range(1, len(chunks) + 1)):
        issues.append(f"Trích dẫn không tồn tại: {sorted(invalid)}")
    ctx = " ".join(c["raw_text"] for c in chunks)
    nums_ans = set(re.findall(r"\d[\d.,]*", answer))
    if bia := nums_ans - set(re.findall(r"\d[\d.,]*", ctx)) - used_as_str(used):
        issues.append(f"Số liệu không có trong tài liệu: {sorted(bia)}")
    for sent in re.split(r"(?<=[.!?])\s+", answer):
        if len(sent.split()) > 8 and not re.search(r"\[\d+\]", sent) \
           and "không tìm thấy" not in sent.lower():
            issues.append(f"Câu thiếu trích dẫn: {sent[:60]}…")
    return issues
```
Chạy hàm này trên toàn bộ đầu ra là cách phát hiện ảo giác **rẻ và tự động**, không cần LLM judge.
</details>

## ④ Đồ án tuần 13 (3h) — RAG bot hoàn chỉnh

**Checklist nghiệm thu:**
- [ ] Mọi câu trả lời kèm trích dẫn nguồn + số trang, kiểm chứng bằng tay được.
- [ ] ≥5 câu ngoài phạm vi tài liệu → trả lời "không tìm thấy", không bịa.
- [ ] Hybrid search: ≥2 ví dụ BM25 cứu được ca vector trượt.
- [ ] Query rewriting: hội thoại nhiều lượt có đại từ vẫn tìm đúng.
- [ ] `verify_citations` chạy tự động, log mọi cảnh báo.
- [ ] Mở rộng `golden.jsonl` lên ≥30 câu (gồm 5 câu không có đáp án).

---

# TUẦN 14 — Đo lường ⭐

**Mục tiêu:** biến 7 tuần trước thành một sản phẩm có bằng chứng.

## ① Lý thuyết (2h)

### 14.1 Vì sao tuần này tách bạn khỏi đám đông

Ai cũng build được RAG bằng 20 dòng LangChain. Rất ít người trả lời được: *"Nó tốt đến mức nào? Tốt hơn bản trước bao nhiêu? Tốn bao nhiêu cho 1.000 câu? Vì sao chọn cấu hình này?"* **Không đo thì không phải kỹ sư.**

### 14.2 Bốn chỉ số RAG và cách chẩn đoán

**Nửa truy hồi:** *Context Recall* (đoạn chứa đáp án có trong context không) · *Context Precision* (bao nhiêu phần context là liên quan).
**Nửa sinh:** *Faithfulness* (câu trả lời có dựa trên context không — **chỉ số quan trọng nhất**) · *Answer Relevancy* (có đúng trọng tâm câu hỏi không).

| Recall | Faithfulness | Chẩn đoán | Sửa ở đâu |
|---|---|---|---|
| Thấp | — | Pipeline dữ liệu hỏng | Chunking, embedding, search (T9–T13) |
| Cao | Thấp | Model bịa dù có đủ tài liệu | Prompt, model, ràng buộc (T11) |
| Cao | Cao, Precision thấp | Context loãng, tốn tiền | Giảm k, thêm rerank |

Sửa nhầm chỗ là mất hàng tuần. Luôn chẩn đoán trước khi sửa.

### 14.3 Bốn cạm bẫy của LLM-as-judge

1. **Thiên vị độ dài** — câu trả lời dài hay được chấm cao hơn dù không tốt hơn.
2. **Thiên vị vị trí** khi so cặp — đảo thứ tự A/B rồi lấy trung bình.
3. **Tự thiên vị** — model chấm cao cho đầu ra của chính họ model đó. Dùng model khác để chấm.
4. **Không hiệu chuẩn** — điểm 0,8 nghĩa là gì? **Phải tự chấm tay 20 mẫu** rồi so với judge. Lệch nhiều thì mọi con số của judge đều vô nghĩa.

### 14.4 Luôn báo cáo p95, không phải trung bình

Trung bình che giấu đuôi dài, mà người dùng cảm nhận đúng cái đuôi đó. Một hệ thống p50 = 1s nhưng p95 = 12s bị cảm nhận là "chậm và hay treo".

## ② Code ví dụ (2h)

```python
# --- 1. Tự viết judge trước, dùng thư viện sau ---
JUDGE = """Bạn là giám khảo nghiêm khắc. Cho CÂU HỎI, NGỮ CẢNH và CÂU TRẢ LỜI.

Chấm 3 tiêu chí, mỗi tiêu chí 0-1 (số thực):
- faithfulness: mọi khẳng định đều suy ra được từ ngữ cảnh?
  (trả lời "không tìm thấy thông tin" khi ngữ cảnh thực sự không có → 1.0)
- relevancy: đúng trọng tâm câu hỏi?
- completeness: đủ ý mà ngữ cảnh cho phép?

Chỉ trả JSON: {{"faithfulness": x, "relevancy": y, "completeness": z, "ly_do": "..."}}"""

class Judgement(BaseModel):
    faithfulness: float = Field(ge=0, le=1)
    relevancy: float = Field(ge=0, le=1)
    completeness: float = Field(ge=0, le=1)
    ly_do: str

# --- 2. Đo chi phí và độ trễ ---
import statistics
from dataclasses import dataclass, field

@dataclass
class RunMetrics:
    latencies: list[float] = field(default_factory=list)
    in_tokens: int = 0
    out_tokens: int = 0
    errors: int = 0

    def p(self, q: float) -> float:
        return statistics.quantiles(self.latencies, n=100)[int(q * 100) - 1]

    def report(self, price_in: float, price_out: float) -> dict:
        cost = self.in_tokens / 1e6 * price_in + self.out_tokens / 1e6 * price_out
        n = len(self.latencies)
        return {"n": n, "p50_s": round(self.p(0.50), 2), "p95_s": round(self.p(0.95), 2),
                "cost_total_usd": round(cost, 4),
                "cost_per_1000_usd": round(cost / n * 1000, 2),
                "error_rate": round(self.errors / max(n, 1), 3)}

# --- 3. Chạy một cấu hình trên toàn bộ golden ---
async def run_config(cfg: dict, golden: list[dict]) -> dict:
    m = RunMetrics()
    rows = []
    for item in golden:
        t0 = time.perf_counter()
        try:
            out = await pipeline.answer(item["question"], **cfg)
            m.latencies.append(time.perf_counter() - t0)
            m.in_tokens += out["usage"]["in"]; m.out_tokens += out["usage"]["out"]
            j = judge(item["question"], out["context"], out["answer"])
            rows.append({**j.model_dump(), "question": item["question"]})
        except Exception:
            m.errors += 1
            log.exception("Lỗi câu: %s", item["question"])
    df = pd.DataFrame(rows)
    return {"config": cfg["name"], **df[["faithfulness","relevancy","completeness"]].mean().round(3),
            **m.report(price_in=3.0, price_out=15.0)}

# --- 4. Dùng ragas sau khi đã hiểu bản chất ---
from ragas import evaluate
from ragas.metrics import faithfulness, answer_relevancy, context_precision, context_recall
from datasets import Dataset

ds = Dataset.from_dict({"question": qs, "answer": ans,
                        "contexts": ctxs, "ground_truth": gts})
print(evaluate(ds, metrics=[faithfulness, answer_relevancy, context_precision, context_recall]))
```

## ③ Thực hành (2h) — 4 bài

### Bài 14.1 — Hiệu chuẩn judge
Tự chấm tay 20 mẫu theo cùng 3 tiêu chí. Tính hệ số tương quan với điểm của LLM judge và tỉ lệ đồng thuận khi quy về nhị phân (≥0,7 = đạt).

<details><summary>Lời giải</summary>

```python
from scipy.stats import pearsonr

corr, p = pearsonr(human_scores, judge_scores)
agree = sum((h >= .7) == (j >= .7) for h, j in zip(human_scores, judge_scores)) / len(human_scores)
print(f"Tương quan {corr:.2f} (p={p:.3f}), đồng thuận nhị phân {agree:.0%}")
```
Diễn giải: tương quan >0,7 và đồng thuận >80% thì tin được. Thấp hơn → sửa prompt judge (thêm ví dụ chấm mẫu, định nghĩa tiêu chí chặt hơn) rồi hiệu chuẩn lại. **Đừng báo cáo số của judge chưa hiệu chuẩn.**
</details>

### Bài 14.2 — Đo thiên vị độ dài
Chứng minh (hoặc bác bỏ) rằng judge của bạn chấm cao hơn cho câu trả lời dài: lấy 10 câu, tạo 2 phiên bản trả lời cùng nội dung nhưng một bản dài gấp đôi (thêm diễn giải thừa), so điểm.

<details><summary>Lời giải</summary>

Nếu bản dài được điểm cao hơn có ý nghĩa thống kê, thêm vào prompt judge: *"Độ dài KHÔNG phải tiêu chí. Câu trả lời ngắn mà đủ ý phải được điểm bằng hoặc cao hơn câu dài dòng."* Rồi đo lại. Đây là **kiểm định chính công cụ đo của mình** — thao tác mà rất ít người tự học làm, và rất được đánh giá cao khi trình bày.
</details>

### Bài 14.3 — Phân tích lỗi có phân loại
Đọc tay 10 ca điểm thấp nhất, phân vào 4 nhóm: truy hồi trượt / model bịa / câu hỏi mơ hồ / dữ liệu thiếu. Với mỗi nhóm đề xuất một cách chữa cụ thể.

<details><summary>Lời giải — bảng mẫu</summary>

| Nhóm | Dấu hiệu | Cách chữa |
|---|---|---|
| Truy hồi trượt | Recall = 0, context không chứa đáp án | Đổi chunking, thêm hybrid, tăng k |
| Model bịa | Recall = 1 nhưng faithfulness thấp | Siết prompt, hạ temperature, đổi model |
| Câu hỏi mơ hồ | Cả người cũng không biết ý gì | Sửa câu hỏi trong golden, hoặc thêm bước làm rõ |
| Dữ liệu thiếu | Corpus thật sự không có | Bổ sung nguồn, hoặc chấp nhận và đảm bảo bot nói "không biết" |

**Nhóm cuối quan trọng nhất về mặt sản phẩm:** không có dữ liệu thì trả lời "không tìm thấy" là **đúng**, không phải lỗi. Nếu golden tính đó là sai thì golden sai, không phải hệ thống sai.
</details>

### Bài 14.4 — Chọn cấu hình theo ràng buộc
Cho bảng 6 cấu hình. Chọn cấu hình cho 3 tình huống: (a) nội bộ 50 người, ưu tiên chính xác; (b) sản phẩm công khai 10.000 câu/ngày, ngân sách $200/tháng; (c) demo bán hàng, ưu tiên tốc độ.

<details><summary>Lời giải — cách lập luận</summary>

(a) Chọn faithfulness cao nhất, chấp nhận p95 cao và chi phí cao — 50 người thì tổng chi phí vẫn nhỏ.
(b) Tính ngược: $200/30 ngày/10.000 câu = **$0,00067/câu**. Loại mọi cấu hình vượt ngưỡng này, rồi trong số còn lại chọn faithfulness cao nhất. Thường phải bỏ reranker hoặc dùng model nhỏ hơn + cache.
(c) Chọn p95 thấp nhất còn chấp nhận được về chất lượng.

Bài học: **không có "cấu hình tốt nhất", chỉ có cấu hình tốt nhất cho một ràng buộc cụ thể.** Câu trả lời này chính là thứ người phỏng vấn muốn nghe.
</details>

## ④ Đồ án tuần 14 + 🏆 SẢN PHẨM 1 (3h) — "RAG có bằng chứng"

Chạy **≥6 cấu hình** trên bộ golden ≥30 câu:

| # | Cấu hình | Faith. | Relev. | Ctx Recall | p95 (s) | $/1000 câu |
|---|---|---|---|---|---|---|
| 1 | Baseline: vector-only, k=5, model rẻ | | | | | |
| 2 | + hybrid BM25 | | | | | |
| 3 | + reranker | | | | | |
| 4 | chunk 400 / 800 / 1500 | | | | | |
| 5 | model rẻ vs model mạnh | | | | | |
| 6 | Cấu hình chọn cuối | | | | | |

**Checklist nghiệm thu:**
- [ ] Bảng đầy đủ số liệu thật + biểu đồ.
- [ ] Judge đã hiệu chuẩn (báo cáo tương quan với 20 mẫu chấm tay).
- [ ] Phân tích lỗi 10 ca kém nhất, phân loại 4 nhóm, đề xuất chữa.
- [ ] Kết luận có lập luận: chọn cấu hình nào cho sản xuất, nêu rõ đánh đổi. **Cấu hình tốt nhất về chất lượng thường không phải cấu hình nên chọn.**
- [ ] `eval/run.py` chạy lại toàn bộ bằng một lệnh (T35 sẽ cắm vào CI).
- [ ] `BAOCAO.md` đủ 5 mục — đây là báo cáo bạn đưa vào CV.

---

# 🚪 CỔNG KIỂM TRA TRƯỚC TUẦN 15

### Lý thuyết
1. Vẽ pipeline RAG đầy đủ từ tài liệu thô đến câu trả lời, gọi tên từng bước.
2. Vì sao cần hybrid search? Cho ví dụ cụ thể vector-only chắc chắn trượt.
3. Context Recall thấp và Faithfulness thấp — mỗi trường hợp sửa ở đâu?
4. Reranker khác embedding model ở đâu, vì sao không dùng để quét cả corpus?
5. Bốn cạm bẫy của LLM-as-judge và cách giảm thiểu.
6. Chi phí RAG bot của bạn cho 10.000 câu/tháng? Muốn giảm một nửa thì cắt ở đâu?

### Thực hành
- [ ] Thêm 100 tài liệu mới và index lại — **dưới 10 phút, một lệnh**.
- [ ] Đổi model embedding và chạy lại eval — **dưới 30 phút**.
- [ ] Chỉ ra chính xác dòng code cần sửa để đổi chiến lược chunking.

### Hiện vật
- [ ] `w07`–`w14` trên GitHub, CI xanh
- [ ] 🎓 **Đồ án môn 3** (`ingest`) + BAOCAO.md
- [ ] 🏆 **Sản phẩm 1** + báo cáo eval ≥6 cấu hình
- [ ] `eval/golden.jsonl` ≥30 câu có ground truth
- [ ] `ERRORS.md` ≥20 mục

---

## Phụ lục: 12 sai lầm phổ biến khi làm RAG

| # | Sai lầm | Hậu quả |
|---|---|---|
| 1 | Nhảy vào LLM, bỏ qua chất lượng dữ liệu | Rác vào rác ra, nhưng nghe rất thuyết phục |
| 2 | Không có golden trước khi tối ưu | Không biết đang cải thiện hay làm tệ đi |
| 3 | Chunk quá lớn "cho chắc" | Context loãng, tốn tiền, model bỏ sót ý giữa |
| 4 | Chunk quá nhỏ | Mất ngữ cảnh, chunk mồ côi vô nghĩa |
| 5 | Quên tiền tố `query:`/`passage:` với E5 | Chất lượng tụt âm thầm |
| 6 | Vector-only, không hybrid | Trượt mọi truy vấn theo mã, số hiệu, tên riêng |
| 7 | Không trích dẫn nguồn | Người dùng không kiểm chứng được, không ai dám tin |
| 8 | Không cho model nói "không biết" | Bịa đặt có hệ thống |
| 9 | Đo bằng cảm tính "thấy có vẻ ổn" | Không cải tiến được, không bảo vệ được quyết định |
| 10 | Không đo chi phí | Ra sản xuất mới phát hiện lỗ |
| 11 | Không xử lý tài liệu cập nhật/xoá | Index lệch thực tế sau vài tuần |
| 12 | Index lại toàn bộ khi đổi 1 file | Không mở rộng được |
