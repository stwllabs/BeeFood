# Auto-kill port 5000 dan start backend
Write-Host "Mengecek port 5000..." -ForegroundColor Cyan

# Cek dan kill process yang pakai port 5000
$processes = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue | Where-Object { $_.State -eq "Listen" }

if ($processes) {
    $pids = $processes | Select-Object -ExpandProperty OwningProcess -Unique
    Write-Host "Ditemukan process yang pakai port 5000: $pids" -ForegroundColor Yellow
    
    foreach ($procId in $pids) {
        try {
            Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
            Write-Host "Process $procId berhasil dihentikan" -ForegroundColor Green
        } catch {
            Write-Host "Gagal menghentikan process $procId" -ForegroundColor Red
        }
    }
    
    # Tunggu sebentar agar port benar-benar terbebas
    Start-Sleep -Milliseconds 500
}

Write-Host "Menyiapkan database (Prisma)..." -ForegroundColor Cyan
Set-Location $PSScriptRoot
npx prisma generate 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Gagal prisma generate" -ForegroundColor Red
    exit 1
}
npx prisma migrate deploy 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Migrate deploy gagal, mencoba db push..." -ForegroundColor Yellow
    npx prisma db push --accept-data-loss 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Gagal menyiapkan database" -ForegroundColor Red
        exit 1
    }
}

Write-Host "Menjalankan backend..." -ForegroundColor Green
npm start
