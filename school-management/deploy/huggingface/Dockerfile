# Hugging Face Space: all backend services in one container, gateway on port 7860.
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /build
COPY . .
RUN mvn -q -B package -DskipTests

FROM eclipse-temurin:17-jre
RUN apt-get update && apt-get install -y --no-install-recommends netcat-openbsd && rm -rf /var/lib/apt/lists/* \
 && (userdel -r ubuntu 2>/dev/null || true) && useradd -m -u 1000 user
WORKDIR /app
COPY --from=build /build/service-registry/target/*.jar service-registry.jar
COPY --from=build /build/auth-service/target/*.jar auth-service.jar
COPY --from=build /build/student-service/target/*.jar student-service.jar
COPY --from=build /build/academic-service/target/*.jar academic-service.jar
COPY --from=build /build/attendance-service/target/*.jar attendance-service.jar
COPY --from=build /build/fee-service/target/*.jar fee-service.jar
COPY --from=build /build/notification-service/target/*.jar notification-service.jar
COPY --from=build /build/api-gateway/target/*.jar api-gateway.jar
COPY --chmod=755 deploy/huggingface/start.sh /app/start.sh
USER user
ENV JAVA_TOOL_OPTIONS="-Xmx400m -Xss512k -XX:+UseSerialGC"
EXPOSE 7860
CMD ["/app/start.sh"]
