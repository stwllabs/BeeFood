# Unduh Laravel dari GitHub (tanpa Packagist) lalu composer install
# Butuh: Avast HTTPS scanning OFF + setup-composer.ps1 sudah dijalankan

$ErrorActionPreference = "Stop"
$Root = Split-Path $PSScriptRoot -Parent
$env:PHPRC = Join-Path $Root "php.ini"
$Target = Join-Path $Root "backend-laravel-full"
$Zip = Join-Path $env:TEMP "laravel-11.zip"
$Url = "https://github.com/laravel/laravel/archive/refs/heads/11.x.zip"

Write-Host "Mengunduh Laravel 11 dari GitHub..." -ForegroundColor Cyan
Invoke-WebRequest -Uri $Url -OutFile $Zip -UseBasicParsing

if (Test-Path $Target) { Remove-Item -Recurse -Force $Target }
Expand-Archive -Path $Zip -DestinationPath $Root -Force
Rename-Item (Join-Path $Root "laravel-11.x") $Target

Write-Host "Menjalankan composer install..." -ForegroundColor Cyan
Set-Location $Target
php (Join-Path $Root "composer.phar") install --no-interaction --prefer-dist

if ($LASTEXITCODE -eq 0) {
    Copy-Item env .env
    php artisan key:generate
    Write-Host "Laravel full terpasang di backend-laravel-full" -ForegroundColor Green
} else {
    Write-Host "composer install gagal — lihat docs/COMPOSER-SSL.md (matikan Avast HTTPS scan)" -ForegroundColor Red
}
