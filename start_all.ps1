$mavenCmd = "c:\Users\Abdul Kader\Downloads\School management\School management\school-management\apache-maven-3.9.6\bin\mvn.cmd"
$backendDir = "c:\Users\Abdul Kader\Downloads\School management\School management\school-management"
$frontendDir = "c:\Users\Abdul Kader\Downloads\School management\School management\school-frontend"

Write-Host "Starting Service Registry (Eureka)..."
Start-Process powershell -ArgumentList "-NoExit", "-Title", "Service Registry", "-Command", "cd '$backendDir\service-registry'; & '$mavenCmd' spring-boot:run"
Start-Sleep -Seconds 15

Write-Host "Starting API Gateway..."
Start-Process powershell -ArgumentList "-NoExit", "-Title", "API Gateway", "-Command", "cd '$backendDir\api-gateway'; & '$mavenCmd' spring-boot:run"
Start-Sleep -Seconds 5

$services = @("auth-service", "student-service", "academic-service", "attendance-service", "fee-service", "notification-service")

foreach ($service in $services) {
    Write-Host "Starting $service..."
    Start-Process powershell -ArgumentList "-NoExit", "-Title", "$service", "-Command", "cd '$backendDir\$service'; & '$mavenCmd' spring-boot:run"
    Start-Sleep -Seconds 3
}

Write-Host "Starting React Frontend..."
Start-Process powershell -ArgumentList "-NoExit", "-Title", "Frontend", "-Command", "cd '$frontendDir'; npm install; npm run dev"

Write-Host "All services started! You can close these windows manually when you want to stop the application."
