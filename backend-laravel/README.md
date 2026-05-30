# BeeFood API (Laravel-style PHP)

Backend PHP dengan struktur mirip Laravel (routes, controllers, middleware) dan database via **SQL script**.

## Menjalankan

```powershell
cd backend-laravel
.\start.ps1
```

API: `http://localhost:5000/api`

## Database (SQL script)

```powershell
php artisan db:init
```

File:
- `database/schema.sql` — struktur tabel
- `database/seed.sql` — data demo

## Akun demo

| Role | Email | Password |
|------|-------|----------|
| Student | student@binus.ac.id | password123 |
| Tenant | tenant@binus.ac.id | password123 |

## Flow order

1. Student checkout → status `PENDING`
2. Tenant klik **ACC Pesanan** → `COOKING`
3. Tenant **Set Siap Ambil** → `READY`
4. Student **Selesai Pick Up** → `DONE`
