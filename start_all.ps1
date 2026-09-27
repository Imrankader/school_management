$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
if (-not $scriptDir) { $scriptDir = "c:\Users\Abdul Kader\Downloads\School management\School management" }
$backendDir = Join-Path $scriptDir "school-management"
$frontendDir = Join-Path $scriptDir "school-frontend"
$mavenCmd = Join-Path $backendDir "apache-maven-3.9.6\bin\mvn.cmd"

Write-Host "Starting Service Registry (Eureka)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$Host.UI.RawUI.WindowTitle = 'Service Registry [8761]'; cd '$backendDir\service-registry'; & '$mavenCmd' spring-boot:run"
Start-Sleep -Seconds 15

Write-Host "Starting API Gateway..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$Host.UI.RawUI.WindowTitle = 'API Gateway [8080]'; cd '$backendDir\api-gateway'; & '$mavenCmd' spring-boot:run"
Start-Sleep -Seconds 5

$services = @("auth-service", "student-service", "academic-service", "attendance-service", "fee-service", "notification-service")

foreach ($service in $services) {
    Write-Host "Starting $service..." -ForegroundColor Cyan
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$Host.UI.RawUI.WindowTitle = '$service'; cd '$backendDir\$service'; & '$mavenCmd' spring-boot:run"
    Start-Sleep -Seconds 3
}

Write-Host "Starting React Frontend..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$Host.UI.RawUI.WindowTitle = 'React Frontend [5173]'; cd '$frontendDir'; npm run dev"

Write-Host "All services started! You can close these windows manually or run .\stop_all.ps1 when you want to stop the application." -ForegroundColor Yellow

