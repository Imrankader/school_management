# Hugging Face Space: all backend services in one container, gateway on port 7860.
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /build
COPY . .
RUN mvn -q -B package -DskipTests

FROM eclipse-temurin:17-jre
RUN apt-get update && apt-get install -y --no-install-recommends netcat-openbsd curl && rm -rf /var/lib/apt/lists/* \
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
COPY deploy/huggingface/start.sh /app/start.sh
RUN chmod +x /app/start.sh
USER user
# Tuned for the production host (2 vCPU / 3.7GB, 8 JVMs in one container) — same settings
# every live deploy has run under since the Singapore move; verified in every local rehearsal too.
ENV JAVA_TOOL_OPTIONS="-Xmx112m -Xms32m -Xss256k -XX:MaxMetaspaceSize=128m -XX:ReservedCodeCacheSize=32m -XX:MaxDirectMemorySize=16m -XX:+UseSerialGC -XX:TieredStopAtLevel=1 -XX:CICompilerCount=1"
ENV SPRING_MAIN_LAZY_INITIALIZATION=true
ENV SERVER_TOMCAT_THREADS_MAX=20
ENV SPRING_DATASOURCE_HIKARI_MAXIMUM_POOL_SIZE=3
EXPOSE 7860
CMD ["/app/start.sh"]
