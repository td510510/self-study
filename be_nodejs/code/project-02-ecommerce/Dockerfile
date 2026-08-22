# Buổi 27 — Multi-stage build.
#
# VÌ SAO NHIỀU TẦNG? Tầng build cần devDependencies, mã nguồn, công cụ.
# Tầng chạy chỉ cần code + dependency production.
# Tách ra giúp ảnh cuối NHỎ HƠN và ÍT LỖ HỔNG HƠN.

# ═══════════════════════════════════════════════════════════════
# TẦNG 1 — build: cài đủ, sinh Prisma Client, rồi TỈA BỚT
# ═══════════════════════════════════════════════════════════════
FROM node:22-alpine AS build

WORKDIR /app

# ⚠️ Copy RIÊNG package*.json TRƯỚC khi copy mã nguồn.
# Docker cache theo từng lệnh: package.json không đổi thì lệnh npm ci
# bên dưới dùng lại cache — tiết kiệm hàng phút mỗi lần build.
# Copy cả thư mục trước thì mọi thay đổi mã nguồn đều làm mất cache.
COPY package*.json ./

# npm ci (không phải npm install):
#   · cài ĐÚNG phiên bản trong package-lock.json
#   · nhanh hơn và KHÔNG sửa lock file
#   · thất bại nếu lock file không khớp — đúng thứ ta muốn ở CI
RUN npm ci

COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npx prisma generate

# ⚠️ TỈA devDependencies NGAY TRONG tầng này, sau khi đã generate.
#
# Vì sao không tách một tầng "deps-prod" riêng rồi copy @prisma sang?
# Vì engine của Prisma sẽ bị tính HAI LẦN — một lần trong node_modules
# của tầng prod, một lần nữa khi copy @prisma từ tầng build.
# (Đã đo thật: cách đó làm ảnh PHÌNH TỪ 737MB LÊN 964MB.)
#
# Bài học: multi-stage giúp giảm kích thước, nhưng chỉ khi mỗi tệp
# được copy ĐÚNG MỘT LẦN. Luôn ĐO bằng `docker history`, đừng đoán.
RUN npm prune --omit=dev

# ═══════════════════════════════════════════════════════════════
# TẦNG 2 — ảnh chạy thật
# ═══════════════════════════════════════════════════════════════
FROM node:22-alpine AS runner

# dumb-init: xử lý tín hiệu đúng cách.
# Không có nó, Node chạy ở PID 1 và KHÔNG nhận SIGTERM
# → graceful shutdown ở buổi 08 KHÔNG BAO GIỜ chạy.
RUN apk add --no-cache dumb-init

ENV NODE_ENV=production
WORKDIR /app

# ⚠️ KHÔNG chạy bằng root.
# Ứng dụng bị chiếm quyền thì kẻ tấn công cũng chỉ có quyền của user này.
# Ảnh node chính thức đã có sẵn user "node".
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --chown=node:node package*.json ./
COPY --chown=node:node prisma ./prisma
COPY --chown=node:node prisma.config.ts ./
COPY --chown=node:node src ./src

USER node

EXPOSE 3000

# Healthcheck để Docker/Kubernetes biết container còn sống không (buổi 43)
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# dumb-init đứng ở PID 1 và chuyển tín hiệu xuống Node
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "src/server.js"]
