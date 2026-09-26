# Giáo án Tuần 15–18 — Lập trình ứng dụng Web AI

> Thuộc [lo-trinh-tu-hoc-ai-engineer.md](./lo-trinh-tu-hoc-ai-engineer.md) — Môn 5, 40h.
> Tiếp nối [giao-an-tuan-07-14.md](./giao-an-tuan-07-14.md). **Điều kiện vào:** đã có RAG bot + báo cáo eval (Sản phẩm 1).

**Cấu trúc mỗi tuần:** ① Lý thuyết (2h) → ② Code ví dụ (2h) → ③ Thực hành có lời giải (2h) → ④ Đồ án tuần (4h).
**Đồ án môn 5 = 🏆 Sản phẩm 2** — web app AI deploy công khai (cuối T18).

## Khối này dẫn tới đâu

```
T15 REST API bọc RAG → T16 auth + DB + streaming → T17 giao diện chat → T18 Docker + deploy
                                                                              ↓
                                                            🏆 Sản phẩm 2: link đưa vào CV
```

**Lời khuyên cho dev backend:** Tuần 17 (frontend) khó chịu nhất vì buộc rời vùng an toàn. Đừng cố giỏi React — chỉ cần đủ để sản phẩm trình bày được. **Xấu mà chạy** tốt hơn **đẹp mà không xong**.

---

# TUẦN 15 — FastAPI

**Mục tiêu:** REST API chuẩn công nghiệp bọc RAG pipeline: validation, docs tự sinh, xử lý lỗi tập trung, test tích hợp.

## ① Lý thuyết (2h)

### 15.1 Bảng chuyển ngữ Spring Boot → FastAPI

| Spring Boot | FastAPI | Ghi chú |
|---|---|---|
| `@RestController` | `APIRouter` | Gom route theo nhóm, `include_router` vào app |
| `@GetMapping("/x")` | `@router.get("/x")` | |
| `@RequestBody DTO` | tham số kiểu Pydantic | Tự validate, tự sinh docs |
| `@PathVariable` / `@RequestParam` | tham số hàm | Suy ra từ path, chỉ cần type hint |
| `@Valid` + Bean Validation | `Field(...)` của Pydantic | Mặc định luôn bật |
| `@Autowired` | `Depends()` | Chỉ là hàm gọi hàm |
| `@Service` / `@Repository` | class thường + `Depends` | Không có annotation ma thuật |
| `@ControllerAdvice` | `@app.exception_handler` | |
| `@Transactional` | quản lý session tường minh | Không có AOP — phải chủ động |
| `application.yml` | `pydantic-settings` (T3) | |
| Springdoc/Swagger | có sẵn `/docs`, `/redoc` | Không cần cấu hình |
| `@PostConstruct` / `@PreDestroy` | `lifespan` | |
| `ResponseEntity<T>` | `response_model=T` | |

### 15.2 Khác biệt tư duy lớn nhất

FastAPI **không có container DI toàn cục**. `Depends` chỉ là "hàm này gọi hàm kia" — dễ đọc, dễ test (override được), nhưng **bạn phải tự nghĩ về vòng đời object**:

- Nạp **một lần** lúc khởi động (`lifespan`): model embedding, reranker, connection pool, client Qdrant.
- Tạo **mỗi request** (`Depends`): DB session, đối tượng nghiệp vụ nhẹ.

Nạp model trong request là lỗi khiến mỗi request chậm thêm vài giây — lỗi số 1 của người mới làm API AI.

### 15.3 Bẫy nguy hiểm nhất: blocking trong async

Endpoint `async def` chạy trên event loop **dùng chung cho mọi request**. Một hàm đồng bộ nặng (`reranker.predict`, đọc file lớn, `time.sleep`) sẽ **đứng cả server** — mọi user khác phải xếp hàng.

Hai cách xử lý: `await asyncio.to_thread(fn, ...)`, hoặc khai báo endpoint là `def` thường (FastAPI tự chạy nó trong threadpool).

### 15.4 Health khác Ready

`/health` = tiến trình còn sống (dùng cho restart). `/ready` = đã nạp xong model, kết nối được Qdrant/DB (dùng cho load balancer quyết định gửi traffic). Trộn hai cái làm một sẽ gây lỗi ở T18: container "healthy" nhưng chưa nạp xong model, traffic vào là 500.

## ② Code ví dụ (2h)

```python
# --- 1. main.py: lifespan, middleware, router ---
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.embedder = SentenceTransformer(settings.embed_model)   # nạp MỘT LẦN
    app.state.reranker = CrossEncoder(settings.rerank_model)
    app.state.qdrant   = QdrantClient(url=settings.qdrant_url)
    log.info("Đã nạp model, sẵn sàng")
    yield
    app.state.qdrant.close()

app = FastAPI(title="RAG API", version="0.1.0", lifespan=lifespan,
              docs_url="/docs" if settings.debug else None)          # ẩn docs trên prod

app.add_middleware(CORSMiddleware,
                   allow_origins=settings.cors_origins,              # KHÔNG ["*"] khi có auth
                   allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
app.include_router(health.router)
app.include_router(chat.router, prefix="/api/v1")

# --- 2. schemas.py ---
from pydantic import BaseModel, Field

class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    conversation_id: str | None = None
    top_k: int = Field(default=5, ge=1, le=20)

class Citation(BaseModel):
    index: int
    source: str
    page: int | None = None
    snippet: str

class ChatResponse(BaseModel):
    answer: str
    citations: list[Citation]
    conversation_id: str
    usage: dict[str, int]
    latency_ms: int

# --- 3. deps.py: DI kiểu FastAPI ---
from fastapi import Request, Depends

def get_rag(request: Request) -> RagPipeline:
    return RagPipeline(embedder=request.app.state.embedder,
                       reranker=request.app.state.reranker,
                       qdrant=request.app.state.qdrant)

# --- 4. routers/chat.py ---
@router.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest, rag: RagPipeline = Depends(get_rag)) -> ChatResponse:
    t0 = time.perf_counter()
    result = await rag.answer(req.message, top_k=req.top_k)
    return ChatResponse(**result, latency_ms=int((time.perf_counter() - t0) * 1000))

# --- 5. errors.py: xử lý lỗi tập trung ---
class AppError(Exception):
    def __init__(self, code: str, message: str, status: int = 400):
        self.code, self.message, self.status = code, message, status

@app.exception_handler(AppError)
async def app_error_handler(request: Request, exc: AppError):
    log.warning("AppError %s: %s", exc.code, exc.message)
    return JSONResponse(status_code=exc.status,
                        content={"error": {"code": exc.code, "message": exc.message}})

@app.exception_handler(Exception)
async def unhandled(request: Request, exc: Exception):
    log.exception("Lỗi không lường trước")
    return JSONResponse(status_code=500,
                        content={"error": {"code": "internal_error",
                                           "message": "Đã có lỗi xảy ra"}})   # KHÔNG lộ chi tiết

# --- 6. Bẫy blocking ---
# ❌ đứng cả event loop
@router.post("/bad")
async def bad(): return reranker.predict(pairs)
# ✅ cách 1
@router.post("/ok1")
async def ok1(): return await asyncio.to_thread(reranker.predict, pairs)
# ✅ cách 2 — def thường, FastAPI tự đưa vào threadpool
@router.post("/ok2")
def ok2(): return reranker.predict(pairs)

# --- 7. Test tích hợp không tốn tiền ---
import pytest
from httpx import ASGITransport, AsyncClient

@pytest.fixture
async def client(app):
    app.dependency_overrides[get_rag] = lambda: FakeRag()       # thay RAG thật bằng giả
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c
    app.dependency_overrides.clear()

async def test_chat_co_citation(client):
    r = await client.post("/api/v1/chat", json={"message": "Quy định nghỉ phép?"})
    assert r.status_code == 200 and r.json()["citations"]

async def test_message_rong(client):
    assert (await client.post("/api/v1/chat", json={"message": ""})).status_code == 422
```

## ③ Thực hành (2h) — 4 bài

### Bài 15.1 — Health vs Ready
Viết hai endpoint. `/health` luôn 200 nếu tiến trình sống. `/ready` trả 503 kèm chi tiết nếu model chưa nạp xong hoặc Qdrant không kết nối được.

<details><summary>Lời giải</summary>

```python
@router.get("/health")
async def health() -> dict:
    return {"status": "ok"}

@router.get("/ready")
async def ready(request: Request) -> JSONResponse:
    checks = {"model": hasattr(request.app.state, "embedder")}
    try:
        request.app.state.qdrant.get_collections()
        checks["qdrant"] = True
    except Exception as e:
        checks["qdrant"] = False
        log.warning("Qdrant chưa sẵn sàng: %s", e)
    ok = all(checks.values())
    return JSONResponse(status_code=200 if ok else 503,
                        content={"ready": ok, "checks": checks})
```
`/ready` phải **thật sự kiểm tra** phụ thuộc, không chỉ trả 200 cho có.
</details>

### Bài 15.2 — Dependency có tham số
Viết dependency `pagination(page: int = 1, size: int = 20)` giới hạn `size ≤ 100`, trả `(offset, limit)`, dùng lại được ở nhiều endpoint.

<details><summary>Lời giải</summary>

```python
from fastapi import Query
from typing import Annotated

def pagination(page: Annotated[int, Query(ge=1)] = 1,
               size: Annotated[int, Query(ge=1, le=100)] = 20) -> tuple[int, int]:
    return (page - 1) * size, size

@router.get("/conversations")
async def list_convs(pg: Annotated[tuple[int, int], Depends(pagination)]):
    offset, limit = pg
    ...
```
Validation nằm trong `Query(...)` nên client gửi `size=1000` bị chặn ở tầng framework với 422 — không cần code kiểm tra.
</details>

### Bài 15.3 — Đo chi phí nạp model
Viết test/script chứng minh `lifespan` có tác dụng: đo thời gian request đầu tiên và request thứ hai ở hai phiên bản (nạp trong lifespan vs nạp trong endpoint).

<details><summary>Lời giải</summary>

```python
import time, httpx

def bench(url: str, n: int = 5) -> list[float]:
    out = []
    for _ in range(n):
        t0 = time.perf_counter()
        httpx.post(url, json={"message": "test"}, timeout=120)
        out.append(round(time.perf_counter() - t0, 2))
    return out

# lifespan:        [0.9, 0.8, 0.8, 0.9, 0.8]   ← ổn định
# nạp trong route: [4.2, 4.1, 4.3, 4.1, 4.2]   ← mỗi request đều tải lại model
```
Ghi con số thật vào README đồ án — đây là loại bằng chứng cụ thể rất có giá trị.
</details>

### Bài 15.4 — Middleware ghi log request
Viết middleware log mỗi request: method, path, status, thời gian xử lý, và gắn `X-Request-ID` để truy vết.

<details><summary>Lời giải</summary>

```python
import uuid, time
from starlette.middleware.base import BaseHTTPMiddleware

class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        rid = request.headers.get("X-Request-ID", str(uuid.uuid4())[:8])
        t0 = time.perf_counter()
        try:
            response = await call_next(request)
        except Exception:
            log.exception("[%s] %s %s LỖI", rid, request.method, request.url.path)
            raise
        ms = (time.perf_counter() - t0) * 1000
        log.info("[%s] %s %s → %d (%.0fms)", rid, request.method,
                 request.url.path, response.status_code, ms)
        response.headers["X-Request-ID"] = rid
        return response

app.add_middleware(LoggingMiddleware)
```
`X-Request-ID` cho phép nối log của một request xuyên nhiều service — chuẩn bị sẵn cho phần tracing ở T36.
</details>

## ④ Đồ án tuần 15 (4h) — API bọc RAG

**Checklist nghiệm thu:**
- [ ] `POST /api/v1/chat` trả `answer` + `citations` + `usage` + `latency_ms`.
- [ ] `/health` và `/ready` tách bạch, `/ready` thật sự kiểm tra phụ thuộc.
- [ ] Model nạp trong `lifespan` — **có số đo chứng minh** (bài 15.3).
- [ ] Exception handler tập trung, không lộ stack trace ra client.
- [ ] `/docs` Swagger dùng thử được ngay trên trình duyệt.
- [ ] Postman collection hoặc file `.http` cho mọi endpoint.
- [ ] ≥8 test tích hợp chạy offline (`dependency_overrides`), CI xanh.

---

# TUẦN 16 — Auth, Database, Streaming

**Mục tiêu:** hệ thống nhiều người dùng thật — đăng nhập, lịch sử riêng, câu trả lời hiện dần từng chữ.

## ① Lý thuyết (2h)

### 16.1 Vì sao access token ngắn + refresh token dài

JWT **không thu hồi được** (server không giữ trạng thái). Nếu access token sống 7 ngày và bị lộ, kẻ tấn công dùng được 7 ngày. Giải pháp: access sống 15 phút (thiệt hại tối đa 15 phút), refresh sống dài nhưng **lưu ở httpOnly cookie** (JavaScript không đọc được → chống XSS) và có thể thu hồi bằng cách lưu danh sách refresh token hợp lệ trong DB.

### 16.2 Bảy quy tắc bảo mật không được vi phạm

1. Không lưu mật khẩu thô. Dùng **argon2** (hoặc bcrypt).
2. Access ngắn hạn + refresh dài hạn ở httpOnly cookie.
3. Đăng nhập sai → thông báo chung *"email hoặc mật khẩu không đúng"*, không tiết lộ cái nào sai (chống dò tài khoản).
4. `jwt_secret` từ biến môi trường, ≥32 byte ngẫu nhiên, **khác nhau giữa dev và prod**.
5. CORS liệt kê origin cụ thể khi dùng credentials.
6. **Mọi truy vấn dữ liệu phải lọc theo `user_id`.** Lỗ hổng IDOR là lỗi phổ biến nhất trong app CRUD.
7. Rate limit theo user cho endpoint gọi LLM — nếu không, một người đốt hết ngân sách API.

> Quy tắc 6 có hệ quả tinh tế: truy cập tài nguyên của người khác phải trả **404**, không phải 403. Trả 403 là vô tình xác nhận "id đó có tồn tại".

### 16.3 Vì sao streaming là yêu cầu bắt buộc, không phải tính năng phụ

Người dùng chịu được chờ 8 giây **nếu thấy chữ chạy**, nhưng không chịu được 3 giây màn hình trắng. Streaming đổi cảm nhận về tốc độ mà không đổi tốc độ thật.

SSE (Server-Sent Events) hợp hơn WebSocket cho chat LLM vì: một chiều là đủ, chạy trên HTTP thường (proxy/firewall không chặn), tự động reconnect, đơn giản hơn nhiều.

### 16.4 Ba lỗi khiến streaming "không chạy"

1. Thiếu **hai** ký tự xuống dòng `\n\n` cuối mỗi sự kiện.
2. Reverse proxy đệm response — cần header `X-Accel-Buffering: no`.
3. Không kiểm tra `is_disconnected` → vẫn sinh (và trả tiền) cho user đã đóng tab.

## ② Code ví dụ (2h)

```python
# --- 1. Model: SQLAlchemy 2.0 ---
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy import ForeignKey, JSON
from datetime import datetime
import uuid

class Base(DeclarativeBase): ...

class User(Base):
    __tablename__ = "users"
    id: Mapped[str] = mapped_column(primary_key=True, default=lambda: str(uuid.uuid4()))
    email: Mapped[str] = mapped_column(unique=True, index=True)
    password_hash: Mapped[str]
    role: Mapped[str] = mapped_column(default="user")
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)

class Conversation(Base):
    __tablename__ = "conversations"
    id: Mapped[str] = mapped_column(primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(default="Cuộc trò chuyện mới")
    messages: Mapped[list["Message"]] = relationship(cascade="all, delete-orphan")

class Message(Base):
    __tablename__ = "messages"
    id: Mapped[int] = mapped_column(primary_key=True)
    conversation_id: Mapped[str] = mapped_column(
        ForeignKey("conversations.id", ondelete="CASCADE"), index=True)
    role: Mapped[str]
    content: Mapped[str]
    citations: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    tokens_in: Mapped[int] = mapped_column(default=0)
    tokens_out: Mapped[int] = mapped_column(default=0)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)

# --- 2. Session async ---
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

engine = create_async_engine(settings.database_url, pool_size=10, max_overflow=20)
SessionLocal = async_sessionmaker(engine, expire_on_commit=False)

async def get_db():
    async with SessionLocal() as session:
        yield session

# alembic init -t async migrations
# alembic revision --autogenerate -m "khoi tao"
# alembic upgrade head

# --- 3. security.py ---
import jwt
from datetime import timedelta, timezone
from pwdlib import PasswordHash

pwd = PasswordHash.recommended()        # argon2 — không giới hạn 72 byte như bcrypt

def hash_password(p: str) -> str: return pwd.hash(p)
def verify_password(p: str, h: str) -> bool: return pwd.verify(p, h)

def create_token(sub: str, kind: str, minutes: int) -> str:
    now = datetime.now(timezone.utc)
    return jwt.encode({"sub": sub, "type": kind, "iat": now,
                       "exp": now + timedelta(minutes=minutes)},
                      settings.jwt_secret, algorithm="HS256")

def decode(token: str, expect: str) -> str:
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        raise AppError("token_expired", "Phiên đã hết hạn", 401)
    except jwt.InvalidTokenError:
        raise AppError("token_invalid", "Token không hợp lệ", 401)
    if payload.get("type") != expect:
        raise AppError("token_wrong_type", "Sai loại token", 401)
    return payload["sub"]

# --- 4. Dependency phân quyền ---
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
bearer = HTTPBearer()

async def current_user(cred: HTTPAuthorizationCredentials = Depends(bearer),
                       db: AsyncSession = Depends(get_db)) -> User:
    user = await db.get(User, decode(cred.credentials, expect="access"))
    if user is None:
        raise AppError("user_not_found", "Người dùng không tồn tại", 401)
    return user

def require_role(*roles: str):                          # ≈ @PreAuthorize
    async def checker(user: User = Depends(current_user)) -> User:
        if user.role not in roles:
            raise AppError("forbidden", "Không đủ quyền", 403)
        return user
    return checker

# --- 5. Streaming SSE ---
from fastapi.responses import StreamingResponse
import json

@router.post("/chat/stream")
async def chat_stream(req: ChatRequest, request: Request,
                      user: User = Depends(current_user),
                      rag: RagPipeline = Depends(get_rag),
                      db: AsyncSession = Depends(get_db)):
    async def gen():
        full, citations = [], []
        try:
            docs = await rag.retrieve(req.message, top_k=req.top_k)
            citations = rag.to_citations(docs)
            yield f"event: citations\ndata: {json.dumps(citations, ensure_ascii=False)}\n\n"

            async for token in rag.stream_answer(req.message, docs):
                if await request.is_disconnected():       # user đóng tab → dừng đốt tiền
                    log.info("Client ngắt kết nối, huỷ sinh")
                    return
                full.append(token)
                yield f"event: token\ndata: {json.dumps({'t': token}, ensure_ascii=False)}\n\n"

            yield f"event: done\ndata: {json.dumps({'ok': True})}\n\n"
        except Exception:
            log.exception("Lỗi khi stream")
            yield f"event: error\ndata: {json.dumps({'message': 'Đã có lỗi xảy ra'})}\n\n"
        finally:
            if full:                                      # lưu dù bị ngắt giữa chừng
                await save_message(db, req.conversation_id, "assistant", "".join(full), citations)

    return StreamingResponse(gen(), media_type="text/event-stream",
                             headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})
```

## ③ Thực hành (2h) — 4 bài

### Bài 16.1 — Chặn IDOR
Viết `get_owned_conversation(conv_id, user, db)` trả về hội thoại **chỉ khi** thuộc về user, ngược lại ném 404. Viết test chứng minh user A không đọc được hội thoại của B.

<details><summary>Lời giải</summary>

```python
from sqlalchemy import select

async def get_owned_conversation(conv_id: str, user: User, db: AsyncSession) -> Conversation:
    stmt = select(Conversation).where(Conversation.id == conv_id,
                                      Conversation.user_id == user.id)   # lọc NGAY trong query
    conv = (await db.execute(stmt)).scalar_one_or_none()
    if conv is None:
        raise AppError("not_found", "Không tìm thấy hội thoại", 404)     # 404 chứ không 403
    return conv

async def test_user_a_khong_doc_duoc_cua_b(client, token_a, conv_of_b):
    r = await client.get(f"/api/v1/conversations/{conv_of_b}",
                         headers={"Authorization": f"Bearer {token_a}"})
    assert r.status_code == 404
```
Điểm mấu chốt: lọc `user_id` **trong câu truy vấn**, không phải lấy ra rồi mới `if conv.user_id != user.id`. Cách sau dễ quên ở endpoint thứ 10.
</details>

### Bài 16.2 — Rate limit theo user
Viết dependency `rate_limit(max_per_minute=20)` dùng thuật toán sliding window, lưu trong bộ nhớ (đủ cho 1 tiến trình), trả 429 kèm header `Retry-After`.

<details><summary>Lời giải</summary>

```python
import time
from collections import defaultdict, deque

_hits: dict[str, deque] = defaultdict(deque)

def rate_limit(max_per_minute: int = 20):
    async def checker(user: User = Depends(current_user)) -> None:
        now = time.monotonic()
        q = _hits[user.id]
        while q and now - q[0] > 60:
            q.popleft()
        if len(q) >= max_per_minute:
            raise HTTPException(429, detail="Quá nhiều yêu cầu",
                                headers={"Retry-After": str(int(60 - (now - q[0])) + 1)})
        q.append(now)
    return checker

@router.post("/chat", dependencies=[Depends(rate_limit(20))])
async def chat(...): ...
```
Hạn chế phải ghi vào báo cáo: lưu trong RAM nên không dùng được khi chạy nhiều worker/replica → T33 sẽ thay bằng Redis.
</details>

### Bài 16.3 — Test SSE
Viết test khẳng định endpoint stream trả đúng định dạng SSE: có `event: citations` trước, nhiều `event: token`, kết thúc bằng `event: done`, mỗi sự kiện kết thúc bằng `\n\n`.

<details><summary>Lời giải</summary>

```python
async def test_sse_dinh_dang(client, token):
    async with client.stream("POST", "/api/v1/chat/stream",
                             json={"message": "test"},
                             headers={"Authorization": f"Bearer {token}"}) as r:
        assert r.headers["content-type"].startswith("text/event-stream")
        body = "".join([chunk async for chunk in r.aiter_text()])

    events = [e for e in body.split("\n\n") if e.strip()]
    assert events[0].startswith("event: citations")
    assert any(e.startswith("event: token") for e in events)
    assert events[-1].startswith("event: done")
```
</details>

### Bài 16.4 — Refresh token có thu hồi
Thiết kế bảng `refresh_tokens` và luồng: đăng nhập cấp cặp token; `/auth/refresh` kiểm tra token còn trong DB, cấp access mới và **xoay** refresh; `/auth/logout` xoá refresh.

<details><summary>Lời giải</summary>

```python
class RefreshToken(Base):
    __tablename__ = "refresh_tokens"
    jti: Mapped[str] = mapped_column(primary_key=True)      # id duy nhất của token
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    expires_at: Mapped[datetime]
    revoked: Mapped[bool] = mapped_column(default=False)
```
Luồng refresh: giải mã → tra `jti` trong DB → nếu `revoked` hoặc không tồn tại thì **thu hồi toàn bộ token của user đó** (dấu hiệu token bị đánh cắp và dùng lại) → nếu hợp lệ thì đánh dấu revoked cho `jti` cũ và cấp cặp mới.

Kỹ thuật này gọi là **refresh token rotation with reuse detection** — chuẩn bảo mật hiện hành.
</details>

## ④ Đồ án tuần 16 (4h) — API nhiều người dùng

**Checklist nghiệm thu:**
- [ ] `/auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/me`.
- [ ] CRUD hội thoại, **luôn lọc theo `user_id` trong câu truy vấn**.
- [ ] `POST /chat/stream` chạy SSE, kiểm chứng bằng `curl -N`.
- [ ] Alembic migration commit trong repo, `alembic upgrade head` chạy sạch trên DB trống.
- [ ] **Test bảo mật bắt buộc:** user A truy cập tài nguyên của B → 404.
- [ ] Rate limit hoạt động, trả 429 kèm `Retry-After`.

---

# TUẦN 17 — Frontend đủ dùng

**Mục tiêu:** giao diện chat trình bày được sản phẩm. Tiêu chí: **chạy đúng, đọc được, không xấu đến mức mất điểm.**

## ① Lý thuyết (2h)

### 17.1 JavaScript tối thiểu cho dev Java

Cần: `const/let`, arrow function, destructuring, spread, template literal, `async/await` + `fetch`, optional chaining `?.`, `map/filter/reduce`, module `import/export`. Nửa buổi là đủ.

Ba bẫy: `this` khác Java hoàn toàn (dùng arrow function để tránh); luôn `===` không bao giờ `==`; `null` và `undefined` là hai thứ khác nhau.

### 17.2 Bốn khái niệm React/Next.js đủ để làm xong sản phẩm

1. **App Router** — thư mục = route. `app/page.tsx` → `/`, `app/chat/page.tsx` → `/chat`.
2. **Server vs Client Component** — mặc định là server; cần `useState`/`useEffect`/sự kiện thì thêm `"use client"` ở dòng đầu. Quên dòng này là lỗi bạn gặp đầu tiên.
3. **Hook**: `useState` (trạng thái), `useEffect` (chạy khi mount/khi biến đổi), `useRef` (giữ tham chiếu DOM, ví dụ để cuộn xuống cuối).
4. **Props** — truyền dữ liệu xuống component con.

### 17.3 Quy tắc bất biến của React

Không sửa state tại chỗ, phải **tạo object/array mới**:

```js
messages[0].content += token;   // ❌ React không nhận ra thay đổi, không render lại
setMessages(m => [...m, newMsg]) // ✅
```

Đây là nguyên nhân số 1 của lỗi "dữ liệu đúng nhưng giao diện không cập nhật".

### 17.4 Vì sao phải tự buffer khi đọc SSE

`EventSource` chỉ hỗ trợ GET và không gửi được header `Authorization` → với POST + JWT phải tự đọc `ReadableStream`. Khi đó: **chunk mạng không trùng ranh giới sự kiện SSE**. Phải giữ `buffer`, chỉ xử lý các phần đã đủ `\n\n`, phần dư để lại vòng sau. Bỏ qua chi tiết này thì thỉnh thoảng mất chữ hoặc lỗi JSON — và nó không xảy ra mọi lần nên rất khó tìm.

## ② Code ví dụ (2h)

```tsx
// --- 1. Component hiển thị tin nhắn ---
type Citation = { index: number; source: string; page?: number; snippet: string };
type Msg = { role: "user" | "assistant"; content: string; citations?: Citation[] };

export function MessageList({ messages }: { messages: Msg[] }) {
  return (
    <div className="flex flex-col gap-4">
      {messages.map((m, i) => (
        <div key={i} className={m.role === "user"
            ? "self-end bg-blue-100 rounded-lg p-3 max-w-[75%]"
            : "self-start bg-gray-100 rounded-lg p-3 max-w-[85%]"}>
          <div className="whitespace-pre-wrap">{m.content}</div>
          {m.citations?.length ? <Citations items={m.citations} /> : null}
        </div>
      ))}
    </div>
  );
}
```

```tsx
// --- 2. Hook đọc SSE (phần khó nhất tuần này) ---
"use client";
import { useState } from "react";

export function useChatStream(token: string) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [streaming, setStreaming] = useState(false);

  async function send(text: string) {
    setMessages(m => [...m, { role: "user", content: text },
                             { role: "assistant", content: "" }]);
    setStreaming(true);
    try {
      const res = await fetch("/api/v1/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: text }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";              // phần cuối có thể chưa trọn vẹn

        for (const part of parts) {
          const event = part.match(/^event: (.+)$/m)?.[1];
          const data  = part.match(/^data: (.+)$/m)?.[1];
          if (!data) continue;
          const payload = JSON.parse(data);

          if (event === "token") {
            setMessages(m => {                    // cập nhật BẤT BIẾN
              const next = [...m];
              const last = next[next.length - 1];
              next[next.length - 1] = { ...last, content: last.content + payload.t };
              return next;
            });
          } else if (event === "citations") {
            setMessages(m => {
              const next = [...m];
              next[next.length - 1] = { ...next[next.length - 1], citations: payload };
              return next;
            });
          }
        }
      }
    } catch (e) {
      setMessages(m => [...m.slice(0, -1),
                        { role: "assistant", content: "⚠️ Lỗi kết nối, vui lòng thử lại." }]);
    } finally {
      setStreaming(false);
    }
  }
  return { messages, streaming, send };
}
```

```tsx
// --- 3. Tự cuộn xuống cuối ---
const endRef = useRef<HTMLDivElement>(null);
useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
```

## ③ Thực hành (2h) — 4 bài

### Bài 17.1 — Tìm bug React
```tsx
function Chat() {
  const [msgs, setMsgs] = useState([]);
  function addToken(t) {
    msgs[msgs.length - 1].content += t;
    setMsgs(msgs);
  }
}
```
Chỉ ra 2 lỗi và sửa.

<details><summary>Lời giải</summary>

1. Sửa state tại chỗ (`msgs[...].content += t`) — React so sánh tham chiếu, thấy cùng object nên **không render lại**.
2. `setMsgs(msgs)` truyền lại chính mảng cũ — cùng tham chiếu, cũng không render lại.

Sửa: dùng dạng hàm cập nhật và tạo object mới ở mọi tầng bị đổi (xem `setMessages(m => {...})` ở mục ②). Dạng hàm còn tránh được bug "stale closure" khi nhiều token đến liên tiếp.
</details>

### Bài 17.2 — Parser SSE tách riêng, có test
Tách logic parse SSE thành hàm thuần `parseSSE(buffer) → {events, rest}` và viết test cho trường hợp chunk bị cắt giữa chừng.

<details><summary>Lời giải</summary>

```ts
export function parseSSE(buffer: string): { events: {event?: string, data: any}[], rest: string } {
  const parts = buffer.split("\n\n");
  const rest = parts.pop() ?? "";
  const events = parts.filter(p => p.trim()).map(p => ({
    event: p.match(/^event: (.+)$/m)?.[1],
    data: JSON.parse(p.match(/^data: (.+)$/m)?.[1] ?? "null"),
  }));
  return { events, rest };
}

test("chunk bị cắt giữa chừng", () => {
  const r1 = parseSSE('event: token\ndata: {"t":"a"}\n\nevent: tok');
  expect(r1.events).toHaveLength(1);
  expect(r1.rest).toBe("event: tok");
  const r2 = parseSSE(r1.rest + 'en\ndata: {"t":"b"}\n\n');
  expect(r2.events[0].data.t).toBe("b");      // ghép lại thành công
});
```
Tách hàm thuần ra khỏi component là cách duy nhất để test được logic này.
</details>

### Bài 17.3 — Xử lý token hết hạn
Viết `apiFetch(url, options)` tự động: gặp 401 thì gọi `/auth/refresh` một lần rồi thử lại; refresh cũng hỏng thì chuyển hướng về trang đăng nhập.

<details><summary>Lời giải</summary>

```ts
let refreshing: Promise<string | null> | null = null;     // gộp nhiều request cùng lúc

async function apiFetch(url: string, opts: RequestInit = {}, retry = true): Promise<Response> {
  const token = getAccessToken();
  const res = await fetch(url, {
    ...opts, headers: { ...opts.headers, Authorization: `Bearer ${token}` },
  });
  if (res.status !== 401 || !retry) return res;

  refreshing ??= doRefresh();                 // chỉ gọi refresh MỘT lần dù 5 request cùng 401
  const newToken = await refreshing;
  refreshing = null;
  if (!newToken) { window.location.href = "/login"; return res; }
  return apiFetch(url, opts, false);
}
```
Chi tiết quan trọng: gộp các lần refresh đồng thời. Không gộp thì 5 request cùng hết hạn sẽ gọi refresh 5 lần, và với rotation ở bài 16.4 sẽ bị coi là **token reuse** → thu hồi toàn bộ, user bị đăng xuất.
</details>

### Bài 17.4 — Hiển thị trích dẫn tương tác
Viết component `Citations` hiện danh sách nguồn dạng `[1] file.pdf, tr.12`, bấm vào mở panel xem đoạn trích.

<details><summary>Lời giải</summary>

```tsx
export function Citations({ items }: { items: Citation[] }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="mt-2 text-sm">
      <div className="flex flex-wrap gap-2">
        {items.map(c => (
          <button key={c.index} onClick={() => setOpen(open === c.index ? null : c.index)}
                  className="px-2 py-0.5 rounded bg-white border hover:bg-gray-50">
            [{c.index}] {c.source}{c.page ? `, tr.${c.page}` : ""}
          </button>
        ))}
      </div>
      {open !== null && (
        <blockquote className="mt-2 p-2 border-l-4 border-blue-300 bg-white text-gray-700">
          {items.find(c => c.index === open)?.snippet}
        </blockquote>
      )}
    </div>
  );
}
```
Trích dẫn bấm xem được là thứ biến "bot nói gì đó" thành "bot có bằng chứng" — chi tiết nhỏ nhưng thay đổi hoàn toàn mức độ tin tưởng của người dùng.
</details>

## ④ Đồ án tuần 17 (4h) — giao diện chat

**Checklist nghiệm thu:**
- [ ] Trang đăng nhập/đăng ký, lưu token, tự refresh khi hết hạn (bài 17.3).
- [ ] Sidebar danh sách hội thoại: tạo mới, đổi tên, xoá.
- [ ] Khung chat: tin nhắn hiện dần theo stream, tự cuộn cuối, trạng thái "đang trả lời…".
- [ ] Hiển thị trích dẫn bấm xem được.
- [ ] Render Markdown (`react-markdown`), code block có highlight.
- [ ] Xử lý lỗi: mất mạng, 401, 429 → thông báo tử tế, không màn hình trắng.
- [ ] Dùng được trên điện thoại.

---

# TUẦN 18 — Docker & Deploy

**Mục tiêu:** `docker compose up` là chạy toàn hệ thống, và có **URL công khai** đưa vào CV.

## ① Lý thuyết (2h)

### 18.1 Bốn nguyên tắc Dockerfile

1. Copy `pyproject.toml` + `uv.lock` **trước** code → Docker cache tầng cài dependency, sửa code không phải cài lại.
2. **Multi-stage**: tầng builder có trình biên dịch, tầng runtime không → image nhỏ hơn nhiều.
3. `.dockerignore` phải có: `.venv`, `__pycache__`, `.git`, `data/`, `*.ipynb`, `.env`.
4. Chạy bằng **user không phải root**.

> Model embedding nặng vài trăm MB: **đừng nhét vào image**. Mount volume cache (`HF_HOME`) hoặc tải lúc khởi động — không thì image phình vài GB và mỗi lần deploy đều tải lại.

### 18.2 Mạng nội bộ của compose

Các service gọi nhau bằng **tên service** (`http://qdrant:6333`), không cần mở cổng ra ngoài. Chỉ reverse proxy khai báo `ports`. **Mở cổng 5432 hoặc 6333 ra Internet là mất sạch dữ liệu** — lỗi bảo mật phổ biến nhất khi tự deploy.

### 18.3 Ba việc hay bị quên khi lên production

1. **Giới hạn log** (`max-size`, `max-file`) — không thì đầy ổ đĩa sau vài tuần.
2. **Giới hạn RAM container** — không thì một container ăn hết máy, OOM giữa đêm.
3. **Backup có thử phục hồi.** Backup chưa từng restore thì không tính là backup.

### 18.4 Kiểm soát chi phí — bắt buộc trước khi công khai

App AI công khai mà không có giới hạn = hoá đơn bất ngờ. Ba lớp: rate limit theo user (T16), quota token/tháng theo user, và cảnh báo khi tổng chi tiêu vượt ngưỡng.

## ② Code ví dụ (2h)

```dockerfile
# backend/Dockerfile
FROM python:3.12-slim AS builder
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv
WORKDIR /app
ENV UV_COMPILE_BYTECODE=1 UV_LINK_MODE=copy
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-install-project --no-dev     # tầng cache: chỉ chạy lại khi lock đổi
COPY src/ ./src/
RUN uv sync --frozen --no-dev

FROM python:3.12-slim AS runtime
RUN useradd -m -u 1000 app
WORKDIR /app
COPY --from=builder --chown=app:app /app /app
ENV PATH="/app/.venv/bin:$PATH" PYTHONUNBUFFERED=1
USER app
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s --start-period=90s \
  CMD python -c "import httpx,sys; sys.exit(0 if httpx.get('http://localhost:8000/ready').status_code==200 else 1)"
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
```

```yaml
# docker-compose.yml
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: ragdb
      POSTGRES_USER: rag
      POSTGRES_PASSWORD: ${DB_PASSWORD:?bat buoc dat DB_PASSWORD}
    volumes: [pgdata:/var/lib/postgresql/data]
    healthcheck: {test: ["CMD-SHELL", "pg_isready -U rag"], interval: 10s, retries: 5}
    logging: {driver: json-file, options: {max-size: "10m", max-file: "3"}}

  qdrant:
    image: qdrant/qdrant:latest
    volumes: [qdrant_data:/qdrant/storage]

  api:
    build: ./backend
    environment:
      DATABASE_URL: postgresql+asyncpg://rag:${DB_PASSWORD}@db:5432/ragdb
      QDRANT_URL: http://qdrant:6333
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}
      JWT_SECRET: ${JWT_SECRET}
    volumes: [hf_cache:/home/app/.cache/huggingface]
    depends_on:
      db: {condition: service_healthy}
      qdrant: {condition: service_started}
    deploy: {resources: {limits: {memory: 2G}}}
    logging: {driver: json-file, options: {max-size: "10m", max-file: "3"}}

  web:
    build: ./frontend
    environment: {NEXT_PUBLIC_API_URL: "https://${DOMAIN}/api"}

  caddy:                                    # HTTPS tự động
    image: caddy:2-alpine
    ports: ["80:80", "443:443"]             # CHỈ service này mở cổng
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy_data:/data
    depends_on: [api, web]

volumes: {pgdata: , qdrant_data: , hf_cache: , caddy_data: }
```

```
# Caddyfile — chứng chỉ Let's Encrypt tự động
{$DOMAIN} {
    handle /api/* { reverse_proxy api:8000 }
    handle       { reverse_proxy web:3000 }
}
```

```bash
# --- Lên VPS (~5 USD/tháng: Hetzner, DigitalOcean, Vultr) — Ubuntu 24.04 ---
adduser deploy && usermod -aG sudo deploy          # không làm việc bằng root
ufw allow OpenSSH && ufw allow 80 && ufw allow 443 && ufw enable
# /etc/ssh/sshd_config → PasswordAuthentication no  (chỉ dùng SSH key)

curl -fsSL https://get.docker.com | sh
git clone <repo> && cd <repo>
cp .env.example .env && nano .env                  # secret THẬT, khác dev
docker compose up -d --build
docker compose logs -f api

# --- Backup hằng ngày (crontab) ---
0 3 * * * docker compose exec -T db pg_dump -U rag ragdb | gzip > /backups/$(date +\%F).sql.gz
```

## ③ Thực hành (2h) — 4 bài

### Bài 18.1 — Giảm kích thước image
Đo `docker images` cho single-stage vs multi-stage. Tìm 3 cách nữa để giảm thêm.

<details><summary>Lời giải</summary>

Thường: single-stage ~1,2GB → multi-stage ~450MB. Ba cách giảm thêm:
1. `.dockerignore` đầy đủ (thiếu nó thì `.git` và `data/` bị copy vào).
2. `--no-dev` khi `uv sync` (bỏ pytest, ruff, mypy khỏi image chạy).
3. Không cài `torch` bản CUDA nếu chạy CPU — riêng khoản này tiết kiệm ~2GB (dùng index `pytorch-cpu`).

Đo bằng `docker history <image>` để biết tầng nào nặng nhất — thường là bất ngờ.
</details>

### Bài 18.2 — Thứ tự khởi động
API khởi động trước khi Postgres sẵn sàng → crash. Sửa bằng `depends_on: condition: service_healthy` **và** thêm retry lúc khởi động ở phía app.

<details><summary>Lời giải</summary>

```python
async def wait_for_db(url: str, attempts: int = 30, delay: float = 2.0) -> None:
    for i in range(attempts):
        try:
            async with create_async_engine(url).connect():
                return
        except Exception as e:
            log.warning("DB chưa sẵn sàng (%d/%d): %s", i + 1, attempts, e)
            await asyncio.sleep(delay)
    raise RuntimeError("Không kết nối được DB")
```
Cần **cả hai** lớp: `healthcheck` xử lý lúc khởi động ban đầu, retry trong app xử lý khi DB restart giữa chừng lúc đang chạy.
</details>

### Bài 18.3 — Diễn tập phục hồi
Thực hiện đầy đủ: tạo backup → `docker compose down -v` (xoá sạch volume) → `up` → phục hồi từ backup → kiểm chứng dữ liệu còn nguyên. Ghi lại **thời gian thực tế**.

<details><summary>Lời giải</summary>

```bash
docker compose exec -T db pg_dump -U rag ragdb | gzip > backup.sql.gz
docker compose down -v && docker compose up -d
docker compose exec -T api alembic upgrade head
gunzip -c backup.sql.gz | docker compose exec -T db psql -U rag -d ragdb
docker compose exec -T db psql -U rag -d ragdb -c "SELECT COUNT(*) FROM messages;"
```
Ba thứ hay phát hiện ra khi diễn tập: (1) quên backup dữ liệu Qdrant (chỉ backup Postgres); (2) thứ tự migration vs restore gây xung đột; (3) thời gian phục hồi lâu hơn tưởng nhiều. **Chỉ diễn tập mới lộ ra những thứ này.**
</details>

### Bài 18.4 — Quota chi phí theo user
Thêm bảng `usage` ghi token theo user theo tháng, và dependency chặn khi vượt hạn mức, trả 402 kèm thông tin đã dùng bao nhiêu.

<details><summary>Lời giải</summary>

```python
async def check_quota(user: User = Depends(current_user),
                      db: AsyncSession = Depends(get_db)) -> None:
    month = datetime.utcnow().strftime("%Y-%m")
    used = (await db.execute(
        select(func.coalesce(func.sum(Message.tokens_in + Message.tokens_out), 0))
        .join(Conversation).where(Conversation.user_id == user.id,
                                  func.to_char(Message.created_at, "YYYY-MM") == month)
    )).scalar_one()
    if used >= settings.monthly_token_quota:
        raise AppError("quota_exceeded",
                       f"Đã dùng {used:,}/{settings.monthly_token_quota:,} token tháng này",
                       402)
```
Ghi thêm cảnh báo ở mức 80% quota để user không bị chặn đột ngột.
</details>

## ④ Đồ án tuần 18 + 🏆 SẢN PHẨM 2 (4h) — Web app AI công khai

**Checklist nghiệm thu:**
- [ ] `docker compose up` từ máy sạch → toàn hệ thống chạy, **không có bước thủ công nào**.
- [ ] **URL công khai có HTTPS**, người khác truy cập được.
- [ ] Tài khoản demo ghi trong README để người xem thử ngay.
- [ ] GIF demo + sơ đồ kiến trúc (Mermaid) trong README.
- [ ] Migration tự chạy khi khởi động; dữ liệu sống sót qua `down && up`.
- [ ] Backup tự động **đã diễn tập phục hồi một lần**, ghi thời gian thực tế.
- [ ] Kiểm soát chi phí: rate limit + quota token/user + cảnh báo ngưỡng chi tiêu.
- [ ] `BAOCAO.md` đủ 5 mục — mục 3 có số: p95, chi phí/1000 câu, kích thước image, thời gian deploy.

---

# 🚪 CỔNG KIỂM TRA — HẾT PHẦN I (Tuần 18)

### Lý thuyết
1. `Depends` của FastAPI khác DI container của Spring ở điểm nào?
2. Vì sao gọi hàm đồng bộ nặng trong endpoint `async` lại nguy hiểm? Hai cách xử lý?
3. Vì sao access token ngắn hạn còn refresh dài hạn? Refresh nên lưu ở đâu, vì sao?
4. SSE khác WebSocket ở đâu, vì sao chat LLM thường chọn SSE?
5. Vì sao trả 404 thay vì 403 khi user truy cập tài nguyên của người khác?
6. Multi-stage build tiết kiệm gì? Vì sao copy `uv.lock` trước code?
7. `/health` khác `/ready` thế nào, mỗi cái dùng cho ai?

### Thực hành
- [ ] Thêm endpoint mới có auth + validation + test — **dưới 30 phút**.
- [ ] Deploy một thay đổi lên production — **dưới 10 phút**.
- [ ] Khôi phục database từ backup — **dưới 15 phút**.

### Tổng kết Phần I (18 tuần, ~168h)

Bạn đang có: RAG bot đo được chất lượng + web app đầy đủ auth/streaming/deploy + 3 đồ án môn học có báo cáo. **Đây đã là hồ sơ đủ để ứng tuyển AI Developer / LLM Application Developer.**

Việc làm ngay tuần này, song song với Tuần 19:
- [ ] CV mô tả 2 sản phẩm bằng **con số** (p95, chi phí/1000 câu, faithfulness, Recall@5).
- [ ] Một bài blog kỹ thuật từ báo cáo eval T14.
- [ ] Rải 5–10 hồ sơ. Mục tiêu không phải được nhận ngay, mà là **biết thị trường hỏi gì** để điều chỉnh 22 tuần còn lại.

---

## Phụ lục: 10 sai lầm khi đưa app AI lên production

| # | Sai lầm | Hậu quả |
|---|---|---|
| 1 | Nạp model trong request thay vì `lifespan` | Mỗi request chậm thêm vài giây |
| 2 | Gọi hàm blocking trong endpoint async | Một request nặng treo cả server |
| 3 | Không có rate limit / quota | Một user đốt hết ngân sách API |
| 4 | Không kiểm tra `is_disconnected` khi stream | Trả tiền cho câu trả lời không ai đọc |
| 5 | Mở cổng DB/Qdrant ra Internet | Mất dữ liệu |
| 6 | `CORS allow_origins=["*"]` kèm credentials | Lỗ hổng bảo mật |
| 7 | Secret hardcode hoặc commit `.env` | Lộ khoá API |
| 8 | Không lọc theo `user_id` trong truy vấn | Người này đọc được dữ liệu người kia |
| 9 | Không giới hạn log và RAM container | Đầy ổ đĩa, OOM giữa đêm |
| 10 | Backup chưa bao giờ thử phục hồi | Phát hiện backup hỏng đúng lúc cần nó |
