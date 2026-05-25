# Auto-kill port 5000 dan start backend
Write-Host "🔍 Mengecek port 5000..." -ForegroundColor Cyan

# Cek dan kill process yang pakai port 5000
$processes = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue | Where-Object { $_.State -eq "Listen" }

if ($processes) {
    $pids = $processes | Select-Object -ExpandProperty OwningProcess -Unique
    Write-Host "⚠️  Ditemukan process yang pakai port 5000: $pids" -ForegroundColor Yellow
    
    foreach ($pid in $pids) {
        try {
            Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
            Write-Host "✅ Process $pid berhasil dihentikan" -ForegroundColor Green
        } catch {
            Write-Host "❌ Gagal menghentikan process $pid" -ForegroundColor Red
        }
    }
    
    # Tunggu sebentar agar port benar-benar terbebas
    Start-Sleep -Milliseconds 500
}

Write-Host "🚀 Menjalankan backend..." -ForegroundColor Green
npm start
