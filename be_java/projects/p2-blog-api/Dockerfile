# ---------- Giai đoạn 1: build ----------
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app

# Copy pom trước để tận dụng cache Docker: chỉ tải lại thư viện khi pom.xml đổi
COPY pom.xml .
RUN mvn -B dependency:go-offline

COPY src ./src
RUN mvn -B clean package -DskipTests

# ---------- Giai đoạn 2: runtime ----------
# Chỉ chứa JRE + file jar -> image nhỏ hơn nhiều và ít lỗ hổng bảo mật hơn
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Không chạy bằng root
RUN addgroup -S app && adduser -S app -G app
USER app

COPY --from=build /app/target/blog-api-*.jar app.jar

EXPOSE 8080

# MaxRAMPercentage: để JVM tự tính heap theo giới hạn RAM của container
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-XX:+HeapDumpOnOutOfMemoryError", "-jar", "app.jar"]
