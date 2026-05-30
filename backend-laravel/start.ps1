$env:PHPRC = Join-Path (Split-Path $PSScriptRoot -Parent) "php.ini"
Set-Location $PSScriptRoot

if (-not (Test-Path "database\beefood.sqlite")) {
    Write-Host "Inisialisasi database dari SQL script..." -ForegroundColor Cyan
    php artisan db:init
}

$conn = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue | Where-Object { $_.State -eq "Listen" }
if ($conn) {
    $procId = $conn | Select-Object -First 1 -ExpandProperty OwningProcess
    Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
    Start-Sleep -Milliseconds 500
}

Write-Host "BeeFood Laravel API running at http://localhost:5000" -ForegroundColor Green
php -S localhost:5000 -t public
