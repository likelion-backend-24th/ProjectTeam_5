# 빌드
FROM eclipse-temurin:17-jdk-jammy AS builder

WORKDIR /app

COPY gradlew .
COPY gradle gradle
COPY build.gradle .
COPY settings.gradle .

RUN chmod +x gradlew

COPY src src

RUN ./gradlew clean bootJar --no-daemon -x test


# 실행 이미지
FROM eclipse-temurin:17-jre-jammy

WORKDIR /app

RUN groupadd --system spring \
    && useradd --system --gid spring spring

COPY --from=builder /app/build/libs/*.jar app.jar

RUN chown spring:spring app.jar

RUN mkdir -p /app/uploads && chown -R spring:spring /app/uploads

USER spring:spring

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]