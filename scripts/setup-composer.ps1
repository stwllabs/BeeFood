# BeeFood — perbaiki Composer + PHP SSL di Windows
# Jalankan: powershell -ExecutionPolicy Bypass -File scripts/setup-composer.ps1

$ErrorActionPreference = "Stop"
$Root = Split-Path $PSScriptRoot -Parent
$PhpIni = Join-Path $Root "php.ini"
$CaFile = Join-Path $Root "cacert.pem"
$ComposerPhar = Join-Path $Root "composer.phar"

Write-Host "=== BeeFood: Setup Composer & PHP SSL ===" -ForegroundColor Cyan

# 1. Cek PHP
$phpPath = (Get-Command php -ErrorAction SilentlyContinue).Source
if (-not $phpPath) {
    Write-Host "PHP belum terpasang. Install: winget install --id PHP.PHP.8.3 -e --source winget" -ForegroundColor Red
    exit 1
}
Write-Host "PHP: $phpPath" -ForegroundColor Green

# 2. Download CA bundle (PowerShell HTTPS — tidak pakai PHP curl)
if (-not (Test-Path $CaFile)) {
    Write-Host "Mengunduh cacert.pem..." -ForegroundColor Yellow
    Invoke-WebRequest -Uri "https://curl.se/ca/cacert.pem" -OutFile $CaFile -UseBasicParsing
}

# 3. php.ini proyek
$extDir = Join-Path (Split-Path $phpPath -Parent) "ext"
if (-not (Test-Path $PhpIni)) {
    @"
; BeeFood — PHP CLI config
extension_dir = "$extDir"
openssl.cafile = "$CaFile"
curl.cainfo = "$CaFile"
extension=openssl
extension=curl
extension=mbstring
extension=fileinfo
extension=pdo_sqlite
extension=sqlite3
extension=sodium
"@ | Set-Content -Path $PhpIni -Encoding UTF8
    Write-Host "Dibuat: php.ini" -ForegroundColor Green
}
$env:PHPRC = $PhpIni

# 4. Download composer.phar jika belum ada
if (-not (Test-Path $ComposerPhar)) {
    Write-Host "Mengunduh composer.phar..." -ForegroundColor Yellow
    Invoke-WebRequest -Uri "https://getcomposer.org/download/latest-stable/composer.phar" -OutFile $ComposerPhar -UseBasicParsing
}

# 5. Konfigurasi Composer global
php $ComposerPhar config -g --unset disable-tls 2>$null
php $ComposerPhar config -g secure-http true
php $ComposerPhar config -g cafile $CaFile

Write-Host ""
Write-Host "=== Tes koneksi HTTPS ===" -ForegroundColor Cyan
php $ComposerPhar diagnose 2>&1 | Select-String "https connectivity|FAIL|OK"

Write-Host ""
Write-Host "Jika masih FAIL (curl error 60):" -ForegroundColor Yellow
Write-Host "  1. Buka Avast -> Menu -> Settings -> Protection -> Web Shield"
Write-Host "  2. Matikan 'Enable HTTPS scanning' (sementara)"
Write-Host "  3. Jalankan ulang script ini"
Write-Host ""
Write-Host "Set permanen di PowerShell profile:" -ForegroundColor Cyan
Write-Host "  `$env:PHPRC = `"$PhpIni`""
Write-Host ""
Write-Host "Install Laravel:" -ForegroundColor Cyan
Write-Host "  cd `"$Root`""
Write-Host "  php composer.phar create-project laravel/laravel backend-laravel-full"
