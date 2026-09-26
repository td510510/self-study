# Giáo án Tuần 1–6 — Python & Kỹ thuật lập trình cho AI

> Thuộc [lo-trinh-tu-hoc-ai-engineer.md](./lo-trinh-tu-hoc-ai-engineer.md) — Môn 1 + Môn 2, 56h.
> Viết cho **dev có kinh nghiệm Java/Spring, Python gần như mới**. Bỏ qua "biến là gì, vòng lặp là gì"; tập trung vào *cái gì khác Java*, *cái gì Java không có*, *cái gì trông giống Java nhưng bẫy*.

**Mỗi tuần theo 4 khối chuẩn:** ① Lý thuyết (2h) → ② Code ví dụ (2h) → ③ Thực hành có lời giải (2h) → ④ Đồ án tuần (4h).
**Hai đồ án môn học:** `textkit` (cuối T2) và `llm-lab` (cuối T6).

---

# TUẦN 1 — Python cho người biết Java

**Mục tiêu:** viết Python *đọc ra là Python*, không phải "Java viết bằng cú pháp Python".

## ① Lý thuyết (2h)

### 1.1 Bảng chuyển ngữ

| Java | Python | Ghi chú |
|---|---|---|
| `int x = 5;` | `x = 5` hoặc `x: int = 5` | Type hint không bắt buộc lúc chạy nhưng bắt buộc trong dự án nghiêm túc |
| `String s = "a" + b;` | `s = f"a{b}"` | f-string là chuẩn |
| `List<String>` / `Map<String,Integer>` | `list[str]` / `dict[str, int]` | Từ 3.9 dùng built-in |
| `null` | `None` | So sánh `is None`, **không** `== None` |
| `private` | `_ten` (quy ước) | Không có access modifier thật |
| `interface` | `Protocol` / duck typing | |
| `Optional<T>` | `T \| None` | |
| `x instanceof Foo` | `isinstance(x, Foo)` | |
| `equals()` / `==` | `==` / `is` | **Ngược Java:** `==` so giá trị, `is` so danh tính |
| `StringBuilder` | `"".join(parts)` | `+=` trong vòng lặp là phản mẫu |
| `try/catch/finally` | `try/except/finally/else` | `else` chạy khi **không** có lỗi |

### 1.2 Ba khác biệt tư duy

**(a) EAFP thay vì LBYL.** Java quen "kiểm tra trước rồi làm"; Python quen "cứ làm, hỏng thì bắt".

**(b) Truthiness.** Mọi object đều vào được `if`. Falsy: `False, None, 0, 0.0, "", [], {}, set(), ()`.
Hệ quả: `if not items:` thay `if len(items) == 0:`. Nhưng **bẫy**: `if x:` sai khi `x = 0` là giá trị hợp lệ → phải `if x is not None:`.

**(c) Không có compiler chặn.** Java bắt lỗi lúc biên dịch; Python bắt lúc chạy. Bù lại bằng `type hint + mypy + test` — đây là lý do Tuần 3 học tooling sớm.

### 1.3 Comprehension & unpacking

Hai thứ dùng nhiều nhất hằng ngày, Java không có tương đương gọn tương tự:

- Comprehension: `[biểu_thức for x in iter if điều_kiện]` — thay cho `stream().filter().map().collect()`.
- Unpacking: `a, b = b, a` · `first, *rest = lst` · `for i, v in enumerate(lst)` · `for a, b in zip(x, y)` · `{**d1, **d2}`.

## ② Code ví dụ (2h) — gõ lại tay, đừng copy

```python
# --- 1. Container và comprehension ---
nums  = [1, 2, 3, 4]            # list  ≈ ArrayList
point = (10, 20)                # tuple — bất biến, làm key dict được
uniq  = {1, 2, 3}               # set   ≈ HashSet
ages  = {"an": 30, "binh": 25}  # dict  ≈ LinkedHashMap (giữ thứ tự chèn)

squares  = [n * n for n in nums if n % 2 == 0]     # [4, 16]
by_len   = {w: len(w) for w in ["ai", "học"]}      # dict comprehension
initials = {w[0] for w in ["ai", "api"]}           # set comprehension
lazy     = (n * n for n in range(1_000_000))       # generator — KHÔNG tốn RAM

# --- 2. Unpacking ---
a, b = 1, 2
a, b = b, a
first, *rest = [1, 2, 3, 4]                        # first=1, rest=[2,3,4]
for i, item in enumerate(nums, start=1): ...
for name, score in zip(["an", "binh"], [8, 9]): ...
merged = {"k": 1, **{"k": 2, "j": 3}}              # {"k": 2, "j": 3} — phải đè trái

# --- 3. Slicing ---
s = [0, 1, 2, 3, 4]
s[1:4]    # [1,2,3]
s[-2:]    # [3,4]
s[::-1]   # đảo ngược
s[::2]    # [0,2,4]

# --- 4. Hàm: 4 loại tham số ---
from typing import Any

def search(query: str,                  # bắt buộc
           top_k: int = 5,              # có mặc định
           *sources: str,               # positional tuỳ ý
           rerank: bool = False,        # keyword-only (sau *)
           **options: Any) -> list[str]:
    ...

search("ai", 3, "web", "docs", rerank=True, timeout=10)

# --- 5. BẪY SỐ 1 CỦA PYTHON: mutable default ---
# ❌ list được tạo MỘT LẦN lúc định nghĩa hàm, dùng chung mọi lời gọi
def add_bad(item, bucket=[]):
    bucket.append(item)
    return bucket
add_bad(1)   # [1]
add_bad(2)   # [1, 2]  ← KHÔNG phải [2]

# ✅
def add_ok(item, bucket: list | None = None) -> list:
    if bucket is None:
        bucket = []
    bucket.append(item)
    return bucket

# --- 6. EAFP vs LBYL ---
d = {"a": 1}
v = d["b"] if "b" in d else 0     # LBYL — kiểu Java
try:                               # EAFP — kiểu Python
    v = d["b"]
except KeyError:
    v = 0
v = d.get("b", 0)                  # nhưng ở đây tốt nhất là thế này
```

## ③ Thực hành (2h) — 5 bài

### Bài 1.1 — Bốn dòng, mỗi dòng một biểu thức

Cho `data = [{"name": "An", "score": 8}, {"name": "Binh", "score": 5}, {"name": "Cuong", "score": 9}]`.
Viết **một dòng** cho mỗi yêu cầu: (a) tên người điểm ≥7 · (b) dict tên→điểm · (c) tên người điểm cao nhất · (d) điểm trung bình.

<details><summary>Lời giải</summary>

```python
passed  = [d["name"] for d in data if d["score"] >= 7]
mapping = {d["name"]: d["score"] for d in data}
top     = max(data, key=lambda d: d["score"])["name"]
avg     = sum(d["score"] for d in data) / len(data)
```
Lưu ý (d): dùng generator `sum(... for ...)` chứ không tạo list trung gian.
</details>

### Bài 1.2 — Đếm tần suất từ

Viết `top_words(text: str, n: int = 5) -> list[tuple[str, int]]` trả về n từ xuất hiện nhiều nhất, không phân biệt hoa thường, bỏ dấu câu.

<details><summary>Lời giải</summary>

```python
import re
from collections import Counter

def top_words(text: str, n: int = 5) -> list[tuple[str, int]]:
    words = re.findall(r"\w+", text.lower(), flags=re.UNICODE)
    return Counter(words).most_common(n)
```
Điểm cần rút: `Counter` và `most_common` có sẵn — viết vòng lặp đếm tay là dấu hiệu chưa quen stdlib.
</details>

### Bài 1.3 — Gom nhóm

Viết `group_by_first_letter(words: list[str]) -> dict[str, list[str]]`.

<details><summary>Lời giải</summary>

```python
from collections import defaultdict

def group_by_first_letter(words: list[str]) -> dict[str, list[str]]:
    groups: dict[str, list[str]] = defaultdict(list)
    for w in words:
        groups[w[0].lower()].append(w)
    return dict(groups)
```
`defaultdict(list)` thay cho `computeIfAbsent`. Trả `dict(groups)` để người gọi không vô tình tạo key mới.
</details>

### Bài 1.4 — Làm phẳng danh sách lồng nhau

Viết `flatten(nested)` xử lý lồng sâu tuỳ ý: `[1, [2, [3, [4]]], 5] → [1,2,3,4,5]`.

<details><summary>Lời giải</summary>

```python
from collections.abc import Iterable, Iterator

def flatten(nested: Iterable) -> Iterator:
    for item in nested:
        if isinstance(item, Iterable) and not isinstance(item, (str, bytes)):
            yield from flatten(item)      # yield from = uỷ quyền cho generator con
        else:
            yield item

assert list(flatten([1, [2, [3, [4]]], 5])) == [1, 2, 3, 4, 5]
```
Bẫy: `str` **là** Iterable → không loại trừ thì đệ quy vô hạn trên chuỗi.
</details>

### Bài 1.5 — Tìm bug

```python
def add_tag(doc: dict, tags: list = []) -> dict:
    tags.append("processed")
    doc["tags"] = tags
    return doc

d1 = add_tag({"id": 1})
d2 = add_tag({"id": 2})
print(d1["tags"], d2["tags"])
```
Đoán kết quả in ra, giải thích, và sửa.

<details><summary>Lời giải</summary>

In ra `['processed', 'processed'] ['processed', 'processed']` — và tệ hơn: `d1["tags"]` và `d2["tags"]` là **cùng một list**, sửa cái này đổi cái kia. Nguyên nhân: mutable default. Sửa bằng `tags: list | None = None` rồi `if tags is None: tags = []`.
</details>

## ④ Đồ án tuần 1 (4h) — `algo-py`

Viết lại 5 bài thuật toán bạn từng làm bằng Java (hoặc 5 bài Easy/Medium LeetCode) sang Python idiomatic.

**Checklist nghiệm thu:**
- [ ] Không có `for i in range(len(x))` nào.
- [ ] Type hint đầy đủ, `uv run mypy .` sạch.
- [ ] Mỗi bài ≥3 `assert` kiểm chứng.
- [ ] Có ít nhất: 1 bài dùng comprehension, 1 bài dùng unpacking, 1 bài dùng `Counter`/`defaultdict`, 1 bài dùng generator.
- [ ] Commit `w01-algo-py/` kèm README ghi "bài nào Python ngắn hơn Java bao nhiêu dòng và vì sao".

**Ví dụ mẫu — nhóm từ đảo chữ (Java ~25 dòng → Python 5 dòng):**

```python
from collections import defaultdict

def group_anagrams(words: list[str]) -> list[list[str]]:
    groups: dict[str, list[str]] = defaultdict(list)
    for w in words:
        groups["".join(sorted(w))].append(w)
    return list(groups.values())

assert group_anagrams(["eat", "tea", "tan", "ate"]) == [["eat", "tea", "ate"], ["tan"]]
```

---

# TUẦN 2 — OOP, generator, decorator, Pydantic

**Mục tiêu:** viết được package Python cài đặt được; đọc hiểu code thư viện AI (LangChain/FastAPI đầy generator và decorator).

## ① Lý thuyết (2h)

### 2.1 Class Python khác Java ở đâu

- Không khai báo field trước — gán trong `__init__` là có.
- Không có access modifier thật: `_x` là quy ước "đừng đụng", `__x` bị đổi tên (name mangling), cả hai đều không chặn được.
- `@property` cho phép biến một method thành thuộc tính → **không cần getter/setter cho mọi field** như Java. Truy cập thẳng `obj.field` là idiomatic.
- **Dunder methods** (`__len__`, `__repr__`, `__eq__`, `__iter__`) cho phép class hoà vào cú pháp ngôn ngữ: có `__len__` thì `len(obj)` chạy được.
- `@dataclass` ≈ Java record + Lombok, có sẵn trong stdlib.

### 2.2 Duck typing & Protocol

Java: class phải khai báo `implements Interface`. Python: chỉ cần *có đúng method* là dùng được ("nếu nó kêu quạc quạc thì nó là vịt"). `Protocol` cho phép mypy kiểm tra tĩnh mà class không cần kế thừa gì.

### 2.3 Generator — nền tảng của streaming

Hàm có `yield` không trả giá trị mà trả **generator**: mỗi lần lặp mới tính một phần tử. Ba lợi ích: không tốn RAM với dữ liệu lớn, bắt đầu xử lý ngay không chờ tính xong, ghép nối được thành pipeline. Đây chính là cơ chế đằng sau việc LLM trả chữ dần dần ở Tuần 16.

**Bẫy:** generator chỉ duyệt được **một lần**; duyệt lần hai được rỗng mà không báo lỗi.

### 2.4 Decorator

Hàm nhận hàm, trả hàm mới có thêm hành vi — tương đương AOP của Spring nhưng tường minh và không cần proxy. `@app.get`, `@pytest.fixture`, `@retry` đều là decorator. Luôn dùng `@functools.wraps` để giữ tên/docstring hàm gốc.

### 2.5 Pydantic v2 — học kỹ ngay

Pydantic ≈ Bean Validation + Jackson gộp lại, và là xương sống của FastAPI, LangChain, structured output của LLM. Ba việc nó làm: **ép kiểu** (`"3"` → `3`), **validate** (ràng buộc `ge/le/min_length`), **serialize** (`model_dump_json`). Đầu tư tuần này, dùng lại suốt 38 tuần còn lại.

## ② Code ví dụ (2h)

```python
# --- 1. dataclass ---
from dataclasses import dataclass, field

@dataclass
class Document:
    id: str
    content: str
    metadata: dict[str, str] = field(default_factory=dict)   # KHÔNG viết = {}
    score: float = 0.0

    def preview(self, n: int = 80) -> str:
        return self.content[:n] + ("…" if len(self.content) > n else "")

d = Document(id="1", content="Xin chào AI")
print(d)          # __repr__ và __eq__ được sinh tự động

# --- 2. Class thường: property, static, class method, dunder ---
class Chunk:
    def __init__(self, text: str):
        self.text = text
        self._tokens: list[str] | None = None      # "private" theo quy ước

    @property                                       # gọi như thuộc tính, KHÔNG có ()
    def length(self) -> int:
        return len(self.text)

    @classmethod
    def from_dict(cls, d: dict) -> "Chunk":         # cls = tham chiếu tới class
        return cls(d["text"])

    @staticmethod
    def empty() -> "Chunk":
        return Chunk("")

    def __len__(self) -> int:                       # cho len(chunk) chạy được
        return len(self.text)

    def __repr__(self) -> str:
        return f"Chunk({self.text[:20]!r})"

# --- 3. Protocol thay interface ---
from typing import Protocol

class Retriever(Protocol):
    def search(self, query: str, k: int) -> list[Document]: ...

class FakeRetriever:                                # không cần "implements"
    def search(self, query: str, k: int) -> list[Document]:
        return []

def answer(r: Retriever, q: str) -> str:            # mypy vẫn kiểm tra được
    return str(r.search(q, 5))

# --- 4. Context manager ---
from contextlib import contextmanager
import time

@contextmanager
def timer(label: str):
    t0 = time.perf_counter()
    try:
        yield                                        # thân khối with chạy ở đây
    finally:
        print(f"{label}: {time.perf_counter() - t0:.3f}s")

with timer("embedding"):
    time.sleep(0.1)

# --- 5. Generator ---
def read_chunks(path: str, size: int = 500):
    with open(path, encoding="utf-8") as f:
        while chunk := f.read(size):                 # walrus operator
            yield chunk

# --- 6. Decorator có tham số ---
import functools

def retry(times: int = 3, delay: float = 1.0):
    def decorator(fn):
        @functools.wraps(fn)                         # ĐỪNG QUÊN
        def wrapper(*args, **kwargs):
            last: Exception | None = None
            for attempt in range(times):
                try:
                    return fn(*args, **kwargs)
                except Exception as e:
                    last = e
                    time.sleep(delay * 2 ** attempt)
            raise last                               # type: ignore[misc]
        return wrapper
    return decorator

@retry(times=3)
def flaky(): ...

# --- 7. Pydantic v2 ---
from pydantic import BaseModel, Field, field_validator

class SearchRequest(BaseModel):
    query: str = Field(min_length=1, max_length=500)
    top_k: int = Field(default=5, ge=1, le=50)
    filters: dict[str, str] = Field(default_factory=dict)

    @field_validator("query")
    @classmethod
    def strip_query(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("query không được rỗng")
        return v.strip()

req = SearchRequest(query="  ai  ", top_k="3")       # "3" tự ép thành 3
print(req.top_k, type(req.top_k))                    # 3 <class 'int'>
print(req.model_dump_json())
```

## ③ Thực hành (2h) — 5 bài

### Bài 2.1 — dataclass có tính toán
Tạo `@dataclass Article` gồm `title, body, tags: list[str]`. Thêm `word_count` dạng `@property` và `summary(n=100)`. Cho `len(article)` trả về số từ.

<details><summary>Lời giải</summary>

```python
@dataclass
class Article:
    title: str
    body: str
    tags: list[str] = field(default_factory=list)

    @property
    def word_count(self) -> int:
        return len(self.body.split())

    def summary(self, n: int = 100) -> str:
        return self.body[:n] + ("…" if len(self.body) > n else "")

    def __len__(self) -> int:
        return self.word_count
```
</details>

### Bài 2.2 — Generator cửa sổ trượt
Viết `sliding(items, size, step)` sinh các cửa sổ liên tiếp. `sliding([1,2,3,4,5], 3, 2) → [1,2,3], [3,4,5]`.

<details><summary>Lời giải</summary>

```python
from collections.abc import Iterator, Sequence

def sliding(items: Sequence, size: int, step: int) -> Iterator[list]:
    if step <= 0 or size <= 0:
        raise ValueError("size và step phải > 0")
    for start in range(0, max(len(items) - size + 1, 1), step):
        window = list(items[start:start + size])
        if window:
            yield window

assert list(sliding([1,2,3,4,5], 3, 2)) == [[1,2,3], [3,4,5]]
```
Đây chính là bộ khung của hàm chunking Tuần 10 — chunk có overlap = cửa sổ trượt với `step = size - overlap`.
</details>

### Bài 2.3 — Decorator đo thời gian + ghi log
Viết `@timed` in ra tên hàm và thời gian chạy, giữ nguyên tên hàm gốc (`fn.__name__` phải đúng), hoạt động với cả hàm có tham số và giá trị trả về.

<details><summary>Lời giải</summary>

```python
import functools, logging, time
log = logging.getLogger(__name__)

def timed(fn):
    @functools.wraps(fn)
    def wrapper(*args, **kwargs):
        t0 = time.perf_counter()
        try:
            return fn(*args, **kwargs)
        finally:
            log.info("%s chạy %.3fs", fn.__name__, time.perf_counter() - t0)
    return wrapper

@timed
def work(n): return sum(range(n))
assert work.__name__ == "work"      # sai nếu quên @functools.wraps
```
Đặt trong `finally` để vẫn đo được khi hàm ném lỗi.
</details>

### Bài 2.4 — Pydantic có ràng buộc chéo
Tạo `ChunkConfig(size, overlap, strategy)` với: `size` trong [100, 4000], `overlap` ≥ 0, `strategy` chỉ nhận `"fixed"|"recursive"|"semantic"`, và **overlap phải nhỏ hơn size** (ràng buộc giữa hai trường).

<details><summary>Lời giải</summary>

```python
from typing import Literal
from pydantic import BaseModel, Field, model_validator

class ChunkConfig(BaseModel):
    size: int = Field(ge=100, le=4000)
    overlap: int = Field(default=0, ge=0)
    strategy: Literal["fixed", "recursive", "semantic"] = "recursive"

    @model_validator(mode="after")           # validator cấp model, chạy sau khi từng field hợp lệ
    def check_overlap(self) -> "ChunkConfig":
        if self.overlap >= self.size:
            raise ValueError("overlap phải nhỏ hơn size")
        return self
```
Phân biệt: `@field_validator` cho một trường, `@model_validator(mode="after")` cho ràng buộc liên trường.
</details>

### Bài 2.5 — Tìm bug generator
```python
def get_chunks(text): return (c for c in text.split("\n") if c.strip())

chunks = get_chunks("a\n\nb\nc")
print(len(list(chunks)))
print(len(list(chunks)))
```
Đoán hai số in ra và giải thích.

<details><summary>Lời giải</summary>

In ra `3` rồi `0`. Generator cạn sau lần duyệt đầu, lần hai không còn gì — **không báo lỗi**, đây là nguồn bug âm thầm rất phổ biến. Cách sửa tuỳ ý định: trả `list(...)` nếu cần duyệt nhiều lần, hoặc gọi lại `get_chunks(text)` mỗi lần duyệt.
</details>

## ④ Đồ án tuần 2 + 🎓 ĐỒ ÁN MÔN 1 (4h) — `textkit`

```
w02-textkit/
├── pyproject.toml
├── src/textkit/
│   ├── __init__.py
│   ├── models.py        # Pydantic: Document, Chunk, ChunkConfig
│   ├── chunking.py      # generator chia văn bản có overlap
│   ├── normalize.py     # chuẩn hoá tiếng Việt: NFC, khoảng trắng, nối từ ngắt dòng
│   └── utils.py         # @timed, @retry, context manager timer
├── tests/
└── BAOCAO.md
```

**Checklist nghiệm thu:**
- [ ] `uv pip install -e .` chạy được; `from textkit import chunk_text` import được.
- [ ] `chunk_text` là **generator**, nhận `ChunkConfig`, không nạp cả văn bản vào list.
- [ ] Có ≥2 Pydantic model, ≥2 decorator tự viết, ≥1 context manager, ≥1 Protocol.
- [ ] `mypy` sạch, ≥10 test.
- [ ] `BAOCAO.md` theo 5 mục chuẩn (bài toán / kiến trúc / kết quả / đánh đổi / hạn chế).

<details><summary>Gợi ý <code>chunk_text</code></summary>

```python
from collections.abc import Iterator

def chunk_text(text: str, cfg: ChunkConfig) -> Iterator[str]:
    step = cfg.size - cfg.overlap
    for start in range(0, len(text), step):
        piece = text[start:start + cfg.size]
        if piece:
            yield piece
        if start + cfg.size >= len(text):
            break
```
Kiểm chứng: `text` dài 1000, `size=100, overlap=50` → step 50, start chạy 0…900 → **19 chunk**.
</details>

---

# TUẦN 3 — Công cụ nghề: uv, ruff, pytest, logging, CI

**Mục tiêu:** dự án đạt chuẩn công nghiệp — môi trường tái lập, format tự động, test có coverage, log có cấu trúc, CI xanh.

## ① Lý thuyết (2h)

### 3.1 Vì sao tooling học sớm

Python thiếu compiler chặn lỗi như Java. Bộ ba `type hint + linter + test` chính là thứ bù vào. Học ở Tuần 3 (không phải tháng thứ 6) để mọi dòng code sau này đều nằm trong lưới an toàn.

### 3.2 Bản đồ công cụ

| Việc | Java | Python (2026) |
|---|---|---|
| Quản lý dependency + môi trường | Maven/Gradle | **uv** (thay pip + venv + poetry, nhanh gấp 10–100 lần) |
| Khai báo dự án | `pom.xml` | `pyproject.toml` |
| Khoá phiên bản | `pom.xml` + lock | `uv.lock` — **phải commit** |
| Lint + format | Checkstyle + Spotless | **ruff** (một công cụ làm cả hai) |
| Kiểm tra kiểu | compiler | **mypy** |
| Test | JUnit | **pytest** |
| Coverage | JaCoCo | `pytest-cov` |
| Log | SLF4J/Logback | `logging` (stdlib) |
| Cấu hình | `application.yml` | `pydantic-settings` |

### 3.3 Ba nguyên tắc log

1. **Không dùng f-string trong log**: `log.info("Nạp %d tài liệu", n)`, không phải `log.info(f"Nạp {n}")`. Lý do: f-string bị format ngay cả khi log level không in, và mất khả năng nhóm log theo template.
2. **`log.exception` trong khối `except`** — tự động kèm stack trace.
3. **Không `print()` trong `src/`.** `print` không có level, không có timestamp, không tắt được.

### 3.4 Secret không bao giờ nằm trong code

`.env` (không commit) + `.env.example` (commit, chỉ có tên biến) + `pydantic-settings` để đọc và validate. Thiếu biến bắt buộc → app chết ngay lúc khởi động, tốt hơn là chết giữa production.

## ② Code ví dụ (2h)

```bash
# --- uv ---
uv init myproject && cd myproject
uv add httpx pydantic pydantic-settings
uv add --dev pytest pytest-cov ruff mypy
uv sync                    # dựng lại môi trường y hệt từ uv.lock
uv run pytest              # chạy trong môi trường ảo, không cần activate
```

```toml
# pyproject.toml
[project]
name = "textkit"
version = "0.1.0"
requires-python = ">=3.12"
dependencies = ["pydantic>=2.6"]

[tool.ruff]
line-length = 100
[tool.ruff.lint]
select = ["E", "F", "I", "UP", "B", "SIM"]   # lỗi, pyflakes, sắp xếp import, nâng cấp cú pháp, bug tiềm ẩn, đơn giản hoá

[tool.mypy]
strict = true

[tool.pytest.ini_options]
addopts = "-q --cov=src --cov-report=term-missing"
```

```python
# --- pytest: 4 kỹ thuật cốt lõi ---
import pytest
from textkit.chunking import chunk_text
from textkit.models import ChunkConfig

def test_khong_mat_du_lieu():
    text = "a" * 1000
    assert "".join(chunk_text(text, ChunkConfig(size=300, overlap=0))) == text

@pytest.mark.parametrize("size,overlap,expected", [    # thay cho copy-paste test
    (100, 0, 10),
    (100, 50, 19),
])
def test_so_luong_chunk(size, overlap, expected):
    cfg = ChunkConfig(size=size, overlap=overlap)
    assert len(list(chunk_text("x" * 1000, cfg))) == expected

def test_overlap_khong_hop_le():
    with pytest.raises(ValueError, match="nhỏ hơn size"):
        ChunkConfig(size=100, overlap=100)

@pytest.fixture                                         # ≈ @BeforeEach nhưng linh hoạt hơn
def sample_docs():
    return [{"id": "1", "text": "xin chào"}]

def test_dung_fixture(sample_docs, tmp_path):           # tmp_path: thư mục tạm tự dọn
    p = tmp_path / "d.json"
    p.write_text("{}", encoding="utf-8")
    assert p.exists() and len(sample_docs) == 1

# --- mock: không gọi API thật trong test ---
from unittest.mock import patch

@patch("mymodule.call_llm", return_value="trả lời giả")
def test_khong_ton_tien(mock_llm):
    assert summarize("văn bản") == "trả lời giả"
    mock_llm.assert_called_once()
```

```python
# --- logging ---
import logging, sys

logging.basicConfig(level=logging.INFO,
                    format="%(asctime)s %(levelname)-8s %(name)s | %(message)s",
                    stream=sys.stdout)
log = logging.getLogger(__name__)

log.info("Đã nạp %d tài liệu", 42)        # ✅ lazy format
try:
    1 / 0
except ZeroDivisionError:
    log.exception("Lỗi khi tính")          # ✅ tự kèm stack trace

# --- cấu hình ---
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")
    anthropic_api_key: str                 # thiếu → chết ngay lúc khởi động
    model_name: str = "claude-sonnet-5"
    max_tokens: int = 1024

settings = Settings()
```

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: astral-sh/setup-uv@v5
      - run: uv sync --all-extras --dev
      - run: uv run ruff check .
      - run: uv run ruff format --check .
      - run: uv run mypy src
      - run: uv run pytest
```

## ③ Thực hành (2h) — 5 bài

### Bài 3.1 — Parametrize
Chuyển 4 test lặp lại sau thành **một** test parametrize:
```python
def test_a(): assert normalize("  a  ") == "a"
def test_b(): assert normalize("a\n\nb") == "a\nb"
def test_c(): assert normalize("a b") == "a b"
def test_d(): assert normalize("") == ""
```

<details><summary>Lời giải</summary>

```python
@pytest.mark.parametrize("raw,expected", [
    ("  a  ", "a"),
    ("a\n\nb", "a\nb"),
    ("a b", "a b"),
    ("", ""),
], ids=["trim", "dong-trong", "nbsp", "rong"])     # ids giúp đọc kết quả test dễ hơn
def test_normalize(raw, expected):
    assert normalize(raw) == expected
```
</details>

### Bài 3.2 — Fixture có dọn dẹp
Viết fixture tạo file JSONL tạm 3 dòng, trả về đường dẫn, tự xoá sau test.

<details><summary>Lời giải</summary>

```python
@pytest.fixture
def jsonl_file(tmp_path):
    p = tmp_path / "data.jsonl"
    p.write_text("\n".join(json.dumps({"id": i}) for i in range(3)), encoding="utf-8")
    yield p                       # phần sau yield chạy sau khi test xong
    # tmp_path tự dọn, không cần xoá tay — nhưng nếu tạo tài nguyên khác (DB, container) thì dọn ở đây
```
</details>

### Bài 3.3 — Mock hàm tốn tiền
`summarize(text)` gọi `call_llm` bên trong. Viết test khẳng định: (a) kết quả đúng, (b) `call_llm` được gọi đúng 1 lần, (c) prompt truyền vào có chứa `text`.

<details><summary>Lời giải</summary>

```python
@patch("mymodule.call_llm", return_value="tóm tắt")
def test_summarize(mock_llm):
    assert summarize("nội dung dài") == "tóm tắt"
    mock_llm.assert_called_once()
    prompt = mock_llm.call_args.args[0]        # hoặc .kwargs["prompt"]
    assert "nội dung dài" in prompt
```
Điểm quan trọng: patch **nơi hàm được dùng** (`mymodule.call_llm`), không phải nơi nó được định nghĩa.
</details>

### Bài 3.4 — Settings có validate
Viết `Settings` yêu cầu `api_key` ≥20 ký tự, `max_tokens` trong [1, 8192], `env` chỉ nhận `dev|prod`, và khi `env="prod"` thì bắt buộc có `sentry_dsn`.

<details><summary>Lời giải</summary>

```python
from typing import Literal
from pydantic import Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")
    api_key: str = Field(min_length=20)
    max_tokens: int = Field(default=1024, ge=1, le=8192)
    env: Literal["dev", "prod"] = "dev"
    sentry_dsn: str | None = None

    @model_validator(mode="after")
    def prod_can_sentry(self) -> "Settings":
        if self.env == "prod" and not self.sentry_dsn:
            raise ValueError("môi trường prod bắt buộc có sentry_dsn")
        return self
```
</details>

### Bài 3.5 — Sửa log sai
```python
log.info(f"Xử lý {doc_id} với {len(chunks)} chunk")
try:
    process()
except Exception as e:
    log.error("Lỗi: " + str(e))
    print("Đã bỏ qua", doc_id)
```
Chỉ ra 3 lỗi và sửa.

<details><summary>Lời giải</summary>

1. f-string trong log → `log.info("Xử lý %s với %d chunk", doc_id, len(chunks))`.
2. `log.error` mất stack trace → `log.exception("Lỗi khi xử lý %s", doc_id)`.
3. `print` trong code thư viện → `log.warning("Đã bỏ qua %s", doc_id)`.
</details>

## ④ Đồ án tuần 3 (4h) — nâng `textkit` lên chuẩn công nghiệp

**Checklist nghiệm thu:**
- [ ] Coverage ≥ 80%, hiển thị bằng `--cov-report=term-missing`.
- [ ] CI GitHub Actions xanh: ruff + format + mypy + pytest.
- [ ] Không còn `print()` nào trong `src/`.
- [ ] `.env.example` commit, `.env` trong `.gitignore`, `Settings` validate đầy đủ.
- [ ] Thực hiện quy trình đầy đủ: nhánh `feature/...` → PR → tự review → merge.
- [ ] Badge CI trong README.

---

# TUẦN 4 — HTTP, REST, gọi LLM API

**Mục tiêu:** gọi API "chịu được lỗi" — timeout, retry, backoff, log — và test không tốn tiền.

## ① Lý thuyết (2h)

### 4.1 Status code dưới góc nhìn LLM API

| Code | Ý nghĩa | Retry? | Xử lý |
|---|---|---|---|
| 400 | Prompt/schema sai | ❌ | Sửa code, không retry |
| 401 | Sai API key | ❌ | Kiểm tra `.env` |
| 413 | Prompt vượt giới hạn | ❌ | Cắt context |
| 429 | Vượt rate limit | ✅ | **Đọc header `retry-after`** |
| 500/502/503 | Lỗi phía provider | ✅ | Backoff |
| 529 | Provider quá tải | ✅ | Backoff dài hơn |

### 4.2 Ba tầng chống lỗi mạng

1. **Timeout** — bắt buộc, và tách 4 loại: connect / read / write / pool. LLM cần `read` dài (60s+) nhưng `connect` ngắn (5s).
2. **Retry có backoff mũ** — `2^n` giây, tránh dồn dập.
3. **Jitter** — cộng ngẫu nhiên 0–1s. Nếu 100 client cùng retry sau đúng 2 giây, server sập lần nữa (thundering herd).

### 4.3 Vì sao gọi raw HTTP trước khi dùng SDK

LLM API chỉ là một POST JSON. Hiểu điều này một lần thì về sau debug 429, streaming, gateway (Tuần 33) dễ hơn nhiều. SDK tiện nhưng che mất bản chất, và mỗi provider có cấu trúc response khác nhau (`content[0].text` vs `choices[0].message.content`) — chính là lý do tồn tại của LLM gateway.

## ② Code ví dụ (2h)

```python
import httpx, random, time, logging
log = logging.getLogger(__name__)

# --- 1. Client đúng cách ---
# ❌ không timeout → treo vô hạn khi mạng lỗi
r = httpx.get("https://example.com")

# ✅ client tái sử dụng connection, timeout tách 4 loại
client = httpx.Client(
    base_url="https://api.example.com",
    timeout=httpx.Timeout(connect=5.0, read=60.0, write=10.0, pool=5.0),
    headers={"User-Agent": "ai-journey/0.1"},
)

# --- 2. Retry đúng cách ---
RETRYABLE = {408, 429, 500, 502, 503, 504, 529}

def request_with_retry(client: httpx.Client, method: str, url: str,
                       *, max_attempts: int = 4, **kw) -> httpx.Response:
    for attempt in range(max_attempts):
        try:
            r = client.request(method, url, **kw)
            if r.status_code not in RETRYABLE:
                r.raise_for_status()
                return r
            wait = float(r.headers["retry-after"]) if "retry-after" in r.headers \
                   else 2 ** attempt + random.uniform(0, 1)
        except (httpx.TimeoutException, httpx.NetworkError):
            wait = 2 ** attempt + random.uniform(0, 1)
        if attempt == max_attempts - 1:
            raise RuntimeError(f"Thất bại sau {max_attempts} lần: {url}")
        log.warning("Retry %d sau %.1fs", attempt + 1, wait)
        time.sleep(wait)
    raise AssertionError("unreachable")

# --- 3. Gọi LLM bằng raw HTTP (làm MỘT LẦN để hiểu bản chất) ---
def ask_raw(prompt: str) -> str:
    r = httpx.post(
        "https://api.anthropic.com/v1/messages",
        headers={"x-api-key": settings.anthropic_api_key,
                 "anthropic-version": "2023-06-01",
                 "content-type": "application/json"},
        json={"model": settings.model_name,
              "max_tokens": settings.max_tokens,
              "messages": [{"role": "user", "content": prompt}]},
        timeout=60.0,
    )
    r.raise_for_status()
    body = r.json()
    log.info("Token vào=%d ra=%d", body["usage"]["input_tokens"], body["usage"]["output_tokens"])
    return body["content"][0]["text"]

# --- 4. Rồi dùng SDK cho code sản xuất ---
from anthropic import Anthropic
client_llm = Anthropic(api_key=settings.anthropic_api_key)

def ask(prompt: str, system: str | None = None) -> str:
    msg = client_llm.messages.create(
        model=settings.model_name,
        max_tokens=settings.max_tokens,
        system=system or "Trả lời ngắn gọn bằng tiếng Việt.",
        messages=[{"role": "user", "content": prompt}],
    )
    return msg.content[0].text

# --- 5. Test không tốn tiền, không cần mạng ---
import respx

@respx.mock
def test_retry_429_roi_thanh_cong():
    route = respx.post("https://api.anthropic.com/v1/messages")
    route.side_effect = [
        httpx.Response(429, headers={"retry-after": "0"}),
        httpx.Response(200, json={"content": [{"text": "chào"}],
                                  "usage": {"input_tokens": 5, "output_tokens": 2}}),
    ]
    assert ask_raw("hi") == "chào"
    assert route.call_count == 2
```

## ③ Thực hành (2h) — 5 bài

### Bài 4.1 — Phân loại lỗi
Viết `should_retry(status: int, attempt: int) -> bool`: retry 429/5xx nhưng tối đa 4 lần; **không** retry 4xx khác; 429 luôn được retry kể cả lần cuối nếu có `retry-after` ≤ 5s.

<details><summary>Lời giải</summary>

```python
def should_retry(status: int, attempt: int, retry_after: float | None = None,
                 max_attempts: int = 4) -> bool:
    if status == 429 and retry_after is not None and retry_after <= 5:
        return True
    if attempt >= max_attempts - 1:
        return False
    return status in {408, 429, 500, 502, 503, 504, 529}
```
</details>

### Bài 4.2 — Backoff có trần
Viết `backoff(attempt, base=1.0, cap=30.0)` trả về thời gian chờ mũ 2 có jitter và **không vượt quá `cap`**.

<details><summary>Lời giải</summary>

```python
import random

def backoff(attempt: int, base: float = 1.0, cap: float = 30.0) -> float:
    exp = min(base * 2 ** attempt, cap)
    return random.uniform(0, exp)      # "full jitter" — phân tán tốt hơn exp + jitter nhỏ
```
Có trần để lần thử thứ 10 không thành 1024 giây.
</details>

### Bài 4.3 — Parse response an toàn
Viết `extract_text(body: dict) -> str` xử lý được cả 2 định dạng (Anthropic và OpenAI), ném lỗi rõ ràng nếu không nhận dạng được.

<details><summary>Lời giải</summary>

```python
def extract_text(body: dict) -> str:
    if blocks := body.get("content"):                       # Anthropic
        texts = [b["text"] for b in blocks if b.get("type", "text") == "text"]
        if texts:
            return "".join(texts)
    if choices := body.get("choices"):                      # OpenAI
        return choices[0]["message"]["content"]
    raise ValueError(f"Không nhận dạng được định dạng response: {list(body)[:5]}")
```
Đây là phiên bản thu nhỏ của LLM gateway sẽ xây ở Tuần 33.
</details>

### Bài 4.4 — Test bằng respx
Viết test khẳng định: gặp 3 lần 503 liên tiếp rồi 200 thì hàm vẫn trả kết quả và gọi đúng 4 lần; gặp 401 thì **không** retry.

<details><summary>Lời giải</summary>

```python
@respx.mock
def test_503_ba_lan():
    route = respx.post(URL)
    route.side_effect = [httpx.Response(503)] * 3 + [httpx.Response(200, json=OK_BODY)]
    assert ask_raw("hi")
    assert route.call_count == 4

@respx.mock
def test_401_khong_retry():
    route = respx.post(URL).mock(return_value=httpx.Response(401))
    with pytest.raises(httpx.HTTPStatusError):
        ask_raw("hi")
    assert route.call_count == 1
```
</details>

### Bài 4.5 — Tính chi phí
Viết `estimate_cost(in_tok, out_tok, price_in_per_m, price_out_per_m) -> float` và tính: 3.000 token vào + 800 token ra, giá $3/1M vào, $15/1M ra.

<details><summary>Lời giải</summary>

```python
def estimate_cost(in_tok: int, out_tok: int,
                  price_in_per_m: float, price_out_per_m: float) -> float:
    return in_tok / 1e6 * price_in_per_m + out_tok / 1e6 * price_out_per_m

# 3000/1e6*3 + 800/1e6*15 = 0.009 + 0.012 = $0.021
```
Nhận xét quan trọng: 800 token ra **đắt hơn** 3.000 token vào. Token đầu ra thường đắt gấp 3–5 lần → "yêu cầu model trả lời ngắn gọn" là quyết định chi phí, không chỉ là UX.
</details>

## ④ Đồ án tuần 4 (4h) — `askcli`

```
w04-askcli/
├── src/askcli/
│   ├── http.py       # client + retry + backoff (tái dùng cho cả lộ trình)
│   ├── llm.py        # gọi LLM, đếm token, tính chi phí
│   ├── weather.py    # gọi 1 REST API công khai (open-meteo, không cần key)
│   └── cli.py        # typer
└── tests/            # respx, chạy offline
```

**Checklist nghiệm thu:**
- [ ] `uv run askcli ask "..."` và `uv run askcli weather "Hanoi"` chạy được.
- [ ] Mọi lệnh gọi mạng có timeout + retry + log.
- [ ] In số token và chi phí ước tính sau mỗi lần gọi.
- [ ] ≥6 test chạy **offline** bằng respx, CI xanh.
- [ ] Xử lý được: sai key (401), mất mạng, timeout — thông báo lỗi thân thiện, không đổ stack trace ra màn hình.

---

# TUẦN 5 — Async/await ⭐ Tuần quan trọng nhất giai đoạn 1

**Mục tiêu:** hiểu và dùng được asyncio; đo được lợi ích bằng số thật.

## ① Lý thuyết (2h)

### 5.1 Vì sao tuần này quyết định

Ứng dụng LLM là **I/O-bound cực đoan**: mỗi request chờ 1–30 giây, CPU gần như rảnh. 50 tài liệu × 3s tuần tự = 150s; song song = ~10s. FastAPI, LangGraph, vLLM client đều async. Không nắm async thì mọi thứ bạn viết về sau đều chậm gấp 10 lần và bạn sẽ không hiểu tại sao.

### 5.2 Mô hình tư duy: khác thread của Java

| | Java thread | Python asyncio |
|---|---|---|
| Đơn vị | OS thread, ~1MB RAM | coroutine, ~KB |
| Chuyển ngữ cảnh | OS quyết định, bất kỳ lúc nào | **Chỉ tại điểm `await`** |
| Số lượng đồng thời | hàng trăm | hàng chục nghìn |
| Race condition | thường xuyên, cần lock | hiếm hơn nhiều (chỉ đổi lượt ở `await`) |
| Tăng tốc CPU-bound | có | **không** (vẫn 1 core) |

### 5.3 Ba luật bất biến

1. `await` chỉ dùng trong `async def`.
2. Gọi hàm async mà **không** `await` → không chạy gì, chỉ tạo coroutine object. Bug số 1 của người mới.
3. Gọi hàm **đồng bộ chặn** (`time.sleep`, `requests.get`, đọc file thường, `reranker.predict`) trong async → **đứng cả event loop**. Phải dùng bản async hoặc `await asyncio.to_thread(fn, ...)`.

### 5.4 Vì sao luôn cần van tiết lưu

Bắn 500 request cùng lúc = 429 toàn tập, và có thể bị provider hạn chế tài khoản. Luôn giới hạn concurrency bằng `Semaphore`. Mức tối ưu tìm bằng thực nghiệm — đó chính là đồ án tuần này.

## ② Code ví dụ (2h)

```python
import asyncio, httpx, time

# --- 1. Tuần tự vs song song ---
async def fetch(name: str, delay: float) -> str:
    await asyncio.sleep(delay)          # nhường lượt tại đây
    return name

async def main():
    t0 = time.perf_counter()
    await fetch("a", 1); await fetch("b", 1); await fetch("c", 1)
    print(f"Tuần tự: {time.perf_counter() - t0:.1f}s")      # ~3s

    t0 = time.perf_counter()
    await asyncio.gather(fetch("a", 1), fetch("b", 1), fetch("c", 1))
    print(f"Song song: {time.perf_counter() - t0:.1f}s")    # ~1s

asyncio.run(main())      # điểm vào DUY NHẤT, gọi một lần ở ngoài cùng

# --- 2. Xử lý lỗi ---
results = await asyncio.gather(*tasks, return_exceptions=True)
for r in results:
    if isinstance(r, Exception):
        log.error("Task lỗi: %s", r)

async with asyncio.TaskGroup() as tg:        # 3.11+: lỗi thì huỷ các task còn lại
    t1 = tg.create_task(fetch("a", 1))
    t2 = tg.create_task(fetch("b", 2))
print(t1.result(), t2.result())

async with asyncio.timeout(10):              # timeout cho cả nhóm
    await slow_operation()

# --- 3. Giới hạn concurrency (kỹ năng thực chiến) ---
async def summarize_all(texts: list[str], concurrency: int = 5) -> list[str]:
    sem = asyncio.Semaphore(concurrency)
    async with httpx.AsyncClient(timeout=60.0) as client:    # MỘT client dùng chung
        async def one(text: str) -> str:
            async with sem:                                   # van tiết lưu
                r = await client.post(URL, json=payload(text), headers=HEADERS)
                r.raise_for_status()
                return r.json()["content"][0]["text"]
        return await asyncio.gather(*(one(t) for t in texts))

# --- 4. Xử lý ngay khi từng cái xong ---
for coro in asyncio.as_completed(tasks):
    result = await coro
    print("Xong 1 cái:", result)

# --- 5. Bốn lỗi kinh điển ---
# ❌ quên await → không chạy, cảnh báo "coroutine was never awaited"
fetch("a", 1)
# ❌ time.sleep chặn cả event loop
async def bad(): time.sleep(1)
# ✅
async def good(): await asyncio.sleep(1)
# ❌ hàm CPU-bound đồng bộ trong async
async def bad2(): return reranker.predict(pairs)
# ✅
async def good2(): return await asyncio.to_thread(reranker.predict, pairs)
```

## ③ Thực hành (2h) — 5 bài

### Bài 5.1 — Chuyển đồng bộ sang bất đồng bộ
```python
def fetch_all(urls: list[str]) -> list[dict]:
    out = []
    with httpx.Client(timeout=30) as c:
        for u in urls:
            out.append(c.get(u).json())
    return out
```
Viết lại thành async song song, giữ **đúng thứ tự** kết quả như đầu vào.

<details><summary>Lời giải</summary>

```python
async def fetch_all(urls: list[str]) -> list[dict]:
    async with httpx.AsyncClient(timeout=30) as c:
        responses = await asyncio.gather(*(c.get(u) for u in urls))
    return [r.json() for r in responses]
```
`asyncio.gather` **giữ nguyên thứ tự** đầu vào bất kể cái nào xong trước — điểm hay bị hiểu nhầm.
</details>

### Bài 5.2 — Thêm van tiết lưu
Sửa bài 5.1 để tối đa 5 request đồng thời.

<details><summary>Lời giải</summary>

```python
async def fetch_all(urls: list[str], concurrency: int = 5) -> list[dict]:
    sem = asyncio.Semaphore(concurrency)
    async with httpx.AsyncClient(timeout=30) as c:
        async def one(u: str):
            async with sem:
                return (await c.get(u)).json()
        return await asyncio.gather(*(one(u) for u in urls))
```
</details>

### Bài 5.3 — Không để một lỗi làm hỏng cả mẻ
Sửa 5.2 để URL lỗi trả về `None` thay vì làm hỏng toàn bộ, và ghi log số lượng thành công/thất bại.

<details><summary>Lời giải</summary>

```python
async def fetch_all(urls, concurrency: int = 5) -> list[dict | None]:
    sem = asyncio.Semaphore(concurrency)
    async with httpx.AsyncClient(timeout=30) as c:
        async def one(u: str):
            async with sem:
                return (await c.get(u)).json()
        results = await asyncio.gather(*(one(u) for u in urls), return_exceptions=True)
    ok = sum(not isinstance(r, Exception) for r in results)
    log.info("Thành công %d/%d", ok, len(urls))
    return [None if isinstance(r, Exception) else r for r in results]
```
</details>

### Bài 5.4 — Tìm bug
```python
async def process(items):
    client = httpx.AsyncClient()
    results = []
    for item in items:
        r = await client.post(URL, json=item)
        results.append(r.json())
    time.sleep(1)
    return results
```
Chỉ ra **4 lỗi**.

<details><summary>Lời giải</summary>

1. Vòng lặp `for` + `await` = **tuần tự**, không tận dụng async → dùng `gather`.
2. `AsyncClient` không đóng (thiếu `async with`) → rò rỉ connection.
3. `time.sleep(1)` chặn event loop → `await asyncio.sleep(1)`.
4. Không có timeout, không có giới hạn concurrency.
</details>

### Bài 5.5 — Thanh tiến độ
Viết hàm chạy N task song song và in tiến độ mỗi khi một task xong (`Xong 7/50`).

<details><summary>Lời giải</summary>

```python
async def run_with_progress(coros: list) -> list:
    total, done, results = len(coros), 0, []
    for fut in asyncio.as_completed(coros):
        results.append(await fut)
        done += 1
        print(f"\rXong {done}/{total}", end="", flush=True)
    print()
    return results
```
Lưu ý: `as_completed` trả kết quả theo **thứ tự hoàn thành**, không theo thứ tự đầu vào — dùng khi cần phản hồi sớm, không dùng khi cần giữ thứ tự.
</details>

## ④ Đồ án tuần 5 (4h) — `async-bench`

Ba phiên bản xử lý cùng 50 prompt ngắn: `sync_version()`, `async_unlimited()`, `async_limited(n)` với n ∈ {2, 5, 10, 20}.

**Checklist nghiệm thu:**
- [ ] Bảng kết quả: tổng thời gian, thời gian trung bình/request, p95, số lỗi 429, tổng chi phí.
- [ ] Biểu đồ matplotlib: thời gian theo mức concurrency → chỉ ra **điểm bão hoà**.
- [ ] README kết luận: mức concurrency tối ưu là bao nhiêu và vì sao tăng nữa không nhanh thêm.
- [ ] Có chế độ mock (`asyncio.sleep` giả lập độ trễ) để chạy CI không tốn tiền.

> 💰 Tiết kiệm: dùng model rẻ nhất, `max_tokens=50`, hoặc chạy toàn bộ với Ollama local.
> **Con số tham chiếu:** 50 request × ~2s → tuần tự ≈100s · concurrency 5 ≈20s · concurrency 20 ≈8–10s nhưng bắt đầu có 429. Ghi lại chính xác — đây là câu chuyện kỹ thuật rất tốt khi phỏng vấn.

---

# TUẦN 6 — Token, embedding, vector

**Mục tiêu:** hiểu bản chất "văn bản → số" ở mức tính tay được; tính được chi phí trước khi gọi API.

## ① Lý thuyết (2h)

### 6.1 Token

Model không đọc chữ, đọc **token** — mảnh từ do tokenizer cắt ra. Ba hệ quả thực tế:

1. **Tiếng Việt tốn token hơn tiếng Anh ~1,5–2,5 lần** vì tokenizer chủ yếu huấn luyện trên tiếng Anh. Ảnh hưởng trực tiếp tới chi phí sản phẩm của bạn.
2. **Context window là ngân sách hữu hạn**: system + lịch sử + tài liệu RAG + câu hỏi + chỗ trống cho câu trả lời. Vượt là lỗi cứng.
3. **Token ra đắt gấp 3–5 lần token vào.**

### 6.2 Embedding

Ánh xạ văn bản → vector n chiều (384/768/1536…) sao cho **gần nhau về nghĩa thì gần nhau trong không gian**. Đo độ gần bằng **cosine similarity**: `cos(a,b) = (a·b)/(|a||b|)`, giá trị trong [-1, 1].

Điểm chốt: nếu vector đã chuẩn hoá (`|v| = 1`) thì cosine **chính là** tích vô hướng. Đó là lý do mọi vector DB chuẩn hoá sẵn — tìm kiếm trở thành phép nhân ma trận, cực nhanh.

### 6.3 Giới hạn của tìm kiếm ngữ nghĩa

Embedding mạnh ở khái niệm ("phương tiện đi lại" ↔ "xe máy") nhưng **yếu ở định danh chính xác** (mã sản phẩm `SKU-99123`, tên riêng hiếm, số hiệu văn bản). Đây chính là lý do Tuần 13 phải dùng hybrid search kết hợp BM25. Đồ án tuần này bắt bạn tự tìm ra giới hạn đó bằng thực nghiệm.

## ② Code ví dụ (2h)

```python
# --- 1. Token ---
import tiktoken
enc = tiktoken.get_encoding("cl100k_base")

vi = "Xin chào, tôi đang học kỹ thuật AI"
en = "Hello, I am learning AI engineering"
print(len(enc.encode(vi)), len(enc.encode(en)))          # tự đo tỉ lệ
print([enc.decode([t]) for t in enc.encode(vi)])         # xem model "nhìn" chuỗi thành mảnh nào

def estimate_cost(in_tok: int, out_tok: int, p_in: float, p_out: float) -> float:
    return in_tok / 1e6 * p_in + out_tok / 1e6 * p_out

# --- 2. Cosine tự viết (đừng gọi thư viện lần đầu) ---
import numpy as np

def cosine(a: np.ndarray, b: np.ndarray) -> float:
    return float(a @ b / (np.linalg.norm(a) * np.linalg.norm(b)))

# --- 3. Embedding miễn phí, chạy local ---
from sentence_transformers import SentenceTransformer
model = SentenceTransformer("intfloat/multilingual-e5-small")   # 384 chiều, CPU chạy được

# ⚠️ Họ model E5 BẮT BUỘC tiền tố, quên là chất lượng tụt âm thầm
docs  = ["Xe máy là phương tiện phổ biến ở Việt Nam",
         "Giá cổ phiếu VNM hôm nay tăng 2%",
         "Hà Nội có nhiều xe buýt công cộng"]
dv = model.encode([f"passage: {d}" for d in docs], normalize_embeddings=True)
qv = model.encode(["query: phương tiện đi lại"], normalize_embeddings=True)[0]

scores = dv @ qv                      # đã chuẩn hoá → dot == cosine
for i in np.argsort(-scores):
    print(round(float(scores[i]), 3), docs[i])

# --- 4. Lớp tìm kiếm tối giản (RAG không hề huyền bí) ---
class MiniSearch:
    def __init__(self, model_name: str = "intfloat/multilingual-e5-small"):
        self.model = SentenceTransformer(model_name)
        self.texts: list[str] = []
        self.matrix: np.ndarray | None = None

    def index(self, texts: list[str]) -> None:
        self.texts = texts
        self.matrix = self.model.encode([f"passage: {t}" for t in texts],
                                        normalize_embeddings=True)

    def search(self, query: str, k: int = 3) -> list[tuple[str, float]]:
        q = self.model.encode([f"query: {query}"], normalize_embeddings=True)[0]
        scores = self.matrix @ q
        return [(self.texts[i], float(scores[i])) for i in np.argsort(-scores)[:k]]
```

## ③ Thực hành (2h) — 5 bài

### Bài 6.1 — Đo tỉ lệ token Việt/Anh
Lấy 5 cặp câu tương đương Việt–Anh, tính tỉ lệ token trung bình. Ước tính: nếu app xử lý 10.000 câu tiếng Việt/tháng thì tốn thêm bao nhiêu so với tiếng Anh?

<details><summary>Lời giải</summary>

```python
pairs = [("Xin chào thế giới", "Hello world"), ...]
ratios = [len(enc.encode(vi)) / len(enc.encode(en)) for vi, en in pairs]
print(f"Tỉ lệ trung bình: {sum(ratios)/len(ratios):.2f}x")
```
Kết quả thường 1,5–2,5×. Hệ quả: cùng một context window, tiếng Việt chứa được ít nội dung hơn → ảnh hưởng trực tiếp tới số chunk nhét được vào prompt RAG.
</details>

### Bài 6.2 — Chứng minh dot = cosine khi chuẩn hoá
Viết test khẳng định với vector đã `normalize_embeddings=True` thì `a @ b` và `cosine(a, b)` bằng nhau (sai số < 1e-6).

<details><summary>Lời giải</summary>

```python
def test_dot_bang_cosine():
    v = model.encode(["passage: a", "passage: b"], normalize_embeddings=True)
    assert abs(float(v[0] @ v[1]) - cosine(v[0], v[1])) < 1e-6
```
</details>

### Bài 6.3 — Top-k không dùng vòng lặp
Viết `top_k(scores: np.ndarray, k: int) -> list[int]` trả chỉ số k điểm cao nhất, giảm dần, **không dùng vòng lặp Python**.

<details><summary>Lời giải</summary>

```python
def top_k(scores: np.ndarray, k: int) -> list[int]:
    k = min(k, len(scores))
    idx = np.argpartition(-scores, k - 1)[:k]      # O(n), không sắp xếp toàn bộ
    return idx[np.argsort(-scores[idx])].tolist()  # chỉ sắp k phần tử
```
`argpartition` nhanh hơn `argsort` đáng kể khi n lớn — quan trọng khi corpus hàng trăm nghìn chunk.
</details>

### Bài 6.4 — Tìm ca semantic thua keyword
Tạo tập 20 câu có chứa mã sản phẩm dạng `SKU-99123`. Tìm một truy vấn mà tìm theo từ khoá đúng còn semantic sai. Giải thích.

<details><summary>Lời giải</summary>

Truy vấn `"SKU-99123"`: embedding coi chuỗi này gần với mọi mã dạng `SKU-xxxxx` khác vì chúng có hình thái giống nhau, nên top-1 thường là mã khác. Tìm theo từ khoá (khớp chính xác) luôn đúng.

**Đây là bằng chứng thực nghiệm cho hybrid search ở Tuần 13** — giữ lại ví dụ này để đưa vào báo cáo.
</details>

### Bài 6.5 — So sánh hai model embedding
Chạy cùng bộ 10 truy vấn qua `multilingual-e5-small` và `multilingual-e5-base`, so sánh chất lượng top-1, kích thước model và thời gian encode.

<details><summary>Lời giải</summary>

Lập bảng: model × (số truy vấn đúng top-1, chiều vector, thời gian encode 100 câu, dung lượng đĩa). Kết luận thường gặp: `base` tốt hơn vài phần trăm nhưng chậm hơn 2–3 lần và vector to gấp đôi (768 vs 384) → tốn RAM vector DB gấp đôi. **Model tốt nhất không phải model nên chọn** — đây là bài học lặp lại suốt lộ trình.
</details>

## ④ Đồ án tuần 6 + 🎓 ĐỒ ÁN MÔN 2 (4h) — `llm-lab`

Gộp thành quả T3–T6 thành một công cụ hoàn chỉnh:

```
w06-llm-lab/
├── src/llm_lab/
│   ├── http.py         # retry/backoff (T4)
│   ├── llm.py          # gọi LLM, đếm token, tính chi phí (T4, T6)
│   ├── bench.py        # sync / async / async có semaphore (T5)
│   ├── embed.py        # MiniSearch (T6)
│   └── cli.py          # typer: ask | bench | search
├── tests/              # respx + mock, chạy offline
├── reports/            # bảng số liệu + biểu đồ
└── BAOCAO.md
```

**Checklist nghiệm thu:**
- [ ] `llm-lab ask "..."` — hỏi LLM, in kèm token + chi phí.
- [ ] `llm-lab bench --n 50 --concurrency 1,5,10,20` — chạy benchmark, xuất bảng + biểu đồ.
- [ ] `llm-lab search "..."` — tìm ngữ nghĩa trong corpus 30 câu.
- [ ] Coverage ≥80%, CI xanh, `mypy` sạch, mọi test chạy offline.
- [ ] `BAOCAO.md` đủ 5 mục, trong đó **mục 3 phải có số thật**: concurrency tối ưu, chi phí/1000 request, tỉ lệ token Việt/Anh đo được, ca semantic thua keyword.

---

# 🚪 CỔNG KIỂM TRA GIAI ĐOẠN 1

Không vượt được thì **đừng sang Tuần 7**. Lấp lỗ hổng bây giờ tốn vài giờ; lấp ở Tuần 25 tốn vài tuần.

### Lý thuyết — trả lời miệng 2 phút/câu, không nhìn tài liệu

1. Giải thích async/await và vì sao ứng dụng LLM bắt buộc dùng.
2. Vì sao `def f(x, cache={})` là bug? Cùng gốc với lỗi nào trong dataclass?
3. Generator khác list ở đâu, khi nào bắt buộc dùng generator?
4. Embedding là gì, cosine đo cái gì, vì sao vector chuẩn hoá thì dot = cosine?
5. Ước tính chi phí prompt 3.000 token vào + 800 ra, giá $3/$15 per 1M. *(= $0,021)*
6. Retry những status nào? Vì sao phải có jitter?
7. Nêu một trường hợp tìm kiếm ngữ nghĩa chắc chắn thua tìm từ khoá.

### Thực hành — làm được không cần tra cứu

- [ ] Dựng dự án mới bằng `uv`, thêm dependency, chạy test + lint — **dưới 5 phút**.
- [ ] Viết hàm async gọi 20 API song song có giới hạn concurrency — **dưới 15 phút**.
- [ ] Viết Pydantic model có ràng buộc liên trường + test — **dưới 10 phút**.

### Hiện vật trên GitHub

- [ ] `w01-algo-py/` — 5 thuật toán idiomatic
- [ ] `w02-textkit/` — 🎓 **Đồ án môn 1**: package + BAOCAO.md
- [ ] `w03` — CI xanh, coverage ≥80%
- [ ] `w04-askcli/` — CLI có retry, test offline
- [ ] `w05-async-bench/` — bảng số liệu + biểu đồ + kết luận
- [ ] `w06-llm-lab/` — 🎓 **Đồ án môn 2**: CLI 3 lệnh + BAOCAO.md
- [ ] `ERRORS.md` — ≥8 lỗi đã ghi lại

---

## Phụ lục: 10 lỗi dev Java hay mắc trong 6 tuần đầu

| # | Lỗi | Sửa |
|---|---|---|
| 1 | `for i in range(len(items))` | `for item in items` / `enumerate` |
| 2 | Getter/setter cho mọi field | Truy cập thẳng; cần logic thì `@property` |
| 3 | Nối chuỗi `+=` trong vòng lặp | `"".join(parts)` |
| 4 | Tạo class cho mọi thứ | dict hoặc dataclass thường là đủ |
| 5 | `if x != None` | `if x is not None` |
| 6 | `except Exception` rồi nuốt lỗi | Bắt đúng loại, luôn `log.exception` |
| 7 | Viết đồng bộ rồi "async hoá" sau | Thiết kế async ngay ở tầng I/O |
| 8 | Bỏ type hint vì "Python là dynamic" | Type hint + `mypy strict` |
| 9 | Đặt tên `camelCase` | `snake_case` hàm/biến, `PascalCase` class |
| 10 | `from module import *` | Import tường minh (ruff sẽ chặn) |
