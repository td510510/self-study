# ---------------------------------------------------------------------------
# Dockerfile mau cho dich vu LLM - build NHIEU TANG
#
# Vi sao nhieu tang? Tang build co compiler va header de cai goi; tang chay thi
# khong. Anh cuoi nho hon dang ke va it thu de tan cong hon.
# ---------------------------------------------------------------------------

# --- Tang 1: build ---------------------------------------------------------
FROM python:3.12-slim AS builder

WORKDIR /build

# Copy RIENG file khai bao phu thuoc TRUOC. Docker cache theo tung lenh, nen
# khi ban chi sua code (khong sua phu thuoc), buoc cai dat nang ne nay duoc
# dung lai tu cache. Copy ca thu muc truoc la tu vut bo cache moi lan sua code.
COPY pyproject.toml ./

RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir --prefix=/cai_dat ".[deploy,llm]"

# --- Tang 2: chay ----------------------------------------------------------
FROM python:3.12-slim

# KHONG chay bang root. Neu ai do thoat duoc ra khoi ung dung, ho se la
# nguoi dung `ungdung` khong co quyen gi, thay vi root cua container.
RUN useradd --create-home --shell /bin/bash ungdung

WORKDIR /app

COPY --from=builder /cai_dat /usr/local
COPY --chown=ungdung:ungdung . .

USER ungdung

# Bien moi truong CO DINH, khong bi mat. API key KHONG bao gio nam o day -
# xem ghi chu cuoi file.
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    MOI_TRUONG=prod

EXPOSE 8000

# Kiem tra suc khoe: dung /khoe (liveness), KHONG dung /san_sang.
# /san_sang that bai chi co nghia la "dung gui traffic", con HEALTHCHECK that
# bai co nghia la "khoi dong lai container" - hai viec khac han nhau.
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/khoe')"

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]

# ---------------------------------------------------------------------------
# ⚠️ KHONG BAO GIO LAM NHUNG VIEC SAU
#
#   ENV ANTHROPIC_API_KEY=sk-ant-...        <- key nam trong anh Docker
#   COPY .env .                             <- key nam trong anh Docker
#   ARG API_KEY                             <- key nam trong lich su build
#
# Anh Docker la mot chuoi TANG, va moi tang deu doc lai duoc. Xoa file o tang
# sau KHONG xoa no khoi tang truoc: `docker history` van lay ra duoc.
#
# Cach dung: truyen luc CHAY, khong phai luc build.
#   docker run --env-file .env ...
#   hoac dung secret manager cua nen tang (Fly, Railway, ECS, Kubernetes...)
# ---------------------------------------------------------------------------
