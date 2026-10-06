# One Dockerfile for every Spring Boot module. Pick the module with --build-arg MODULE=<folder-name>.
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /build
COPY . .
ARG MODULE
RUN mvn -q -B -pl ${MODULE} -am package -DskipTests

FROM eclipse-temurin:17-jre
WORKDIR /app
ARG MODULE
COPY --from=build /build/${MODULE}/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
