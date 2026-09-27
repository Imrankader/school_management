# stop_all.ps1
Write-Host "Stopping School Management System processes..." -ForegroundColor Yellow

# Terminate java and node processes running from this workspace
$ports = @(8761, 8080, 8081, 8082, 8083, 8084, 8085, 8086, 5173)
foreach ($port in $ports) {
    $connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($connections) {
        foreach ($conn in $connections) {
            $procId = $conn.OwningProcess
            if ($procId -and $procId -gt 4) {
                Write-Host "Terminating process on port $port (PID: $procId)..." -ForegroundColor Cyan
                Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
            }
        }
    }
}

Write-Host "All specified ports and processes have been stopped." -ForegroundColor Green
