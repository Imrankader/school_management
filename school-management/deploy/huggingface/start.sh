#!/bin/bash
# Start order: registry -> backend services -> gateway (gateway runs in foreground as the container process).
wait_for_port() {
  local port=$1
  for _ in $(seq 1 150); do
    nc -z 127.0.0.1 "$port" 2>/dev/null && return 0
    sleep 2
  done
  echo "WARNING: port $port did not open in time, continuing"
}

java -jar /app/service-registry.jar &
wait_for_port 8761

java -jar /app/auth-service.jar &
java -jar /app/student-service.jar &
java -jar /app/academic-service.jar &
java -jar /app/attendance-service.jar &
java -jar /app/fee-service.jar &
java -jar /app/notification-service.jar &
for port in 8081 8082 8083 8084 8085 8086; do wait_for_port "$port"; done

export SERVER_PORT=7860
exec java -jar /app/api-gateway.jar
