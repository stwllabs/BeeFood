# Perbaiki Composer SSL (Windows + Avast)

Jika muncul error:

```text
curl error 60 ... unable to get local issuer certificate
```

Penyebab umum: **Avast Web Shield** memindai HTTPS dan mengganti sertifikat.

## Langkah 1 — Jalankan script otomatis

```powershell
cd "C:\Users\stell\OneDrive\Documents\Semester Four\AOLSoftEng"
powershell -ExecutionPolicy Bypass -File scripts\setup-composer.ps1
```

Script ini akan:
- Mengunduh `cacert.pem`
- Membuat `php.ini` di folder proyek
- Mengatur `composer.phar` dan CA file global Composer

## Langkah 2 — Matikan HTTPS scanning Avast (penting)

1. Buka **Avast** → **Menu** (☰) → **Settings**
2. **Protection** → **Web Shield** → **Customize**
3. **Nonaktifkan** opsi **Enable HTTPS scanning**
4. Klik **OK** dan tutup Avast
5. Buka **PowerShell baru**, lalu:

```powershell
cd "C:\Users\stell\OneDrive\Documents\Semester Four\AOLSoftEng"
$env:PHPRC = "$PWD\php.ini"
php composer.phar diagnose
```

Pastikan baris **Checking https connectivity to packagist: OK**

## Langkah 3 — Install Laravel penuh (opsional)

```powershell
php composer.phar create-project laravel/laravel backend-laravel-full
```

## Set PHPRC permanen (disarankan)

Tambahkan ke PowerShell profile:

```powershell
notepad $PROFILE
```

Isi:

```powershell
$env:PHPRC = "C:\Users\stell\OneDrive\Documents\Semester Four\AOLSoftEng\php.ini"
```

## Backend yang sudah jalan tanpa Composer

Jika Laravel full belum terpasang, gunakan:

```powershell
cd backend-laravel
.\start.ps1
```

API sama di `http://localhost:5000/api` — sudah kompatibel dengan frontend React.
