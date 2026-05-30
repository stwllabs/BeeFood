<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Core\Database;
use App\Core\Jwt;
use App\Core\Response;
use App\Support\Request;
use PDO;

final class AuthController
{
    public function register(): void
    {
        $body = Request::json();
        $name = trim((string) ($body['name'] ?? ''));
        $email = trim((string) ($body['email'] ?? ''));
        $password = (string) ($body['password'] ?? '');
        $role = strtoupper((string) ($body['role'] ?? ''));

        if ($name === '' || $email === '' || $password === '' || $role === '') {
            Response::error('Kolom nama, email, password, dan role harus diisi');
        }
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            Response::error('Format email tidak valid');
        }
        if (strlen($password) < 6) {
            Response::error('Password minimal harus 6 karakter');
        }

        $pdo = Database::connection();
        $exists = $pdo->prepare('SELECT id FROM User WHERE email = ?');
        $exists->execute([$email]);
        if ($exists->fetch()) {
            Response::error('Email sudah terdaftar');
        }

        $hash = password_hash($password, PASSWORD_BCRYPT);
        $pdo->beginTransaction();
        try {
            $tenantId = null;
            if ($role === 'TENANT') {
                $tenantName = trim((string) ($body['tenantName'] ?? ''));
                $tenantLocation = trim((string) ($body['tenantLocation'] ?? ''));
                if ($tenantName === '' || $tenantLocation === '') {
                    Response::error('Nama tenant dan lokasi harus diisi untuk Tenant');
                }
                $stmt = $pdo->prepare('INSERT INTO Tenant (name, location, isOpen, image) VALUES (?, ?, 1, ?)');
                $stmt->execute([
                    $tenantName,
                    $tenantLocation,
                    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=60',
                ]);
                $tenantId = (int) $pdo->lastInsertId();
            } elseif ($role !== 'STUDENT') {
                Response::error('Role tidak valid');
            }

            $avatar = $role === 'STUDENT'
                ? 'https://api.dicebear.com/7.x/adventurer/svg?seed=' . rawurlencode($name)
                : null;

            $stmt = $pdo->prepare(
                'INSERT INTO User (name, email, password, role, balance, phoneNumber, nim, avatar, tenantId)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
            );
            $stmt->execute([
                $name,
                $email,
                $hash,
                $role,
                100000,
                $body['phoneNumber'] ?? null,
                $body['nim'] ?? null,
                $avatar,
                $tenantId,
            ]);
            $userId = (int) $pdo->lastInsertId();
            $pdo->commit();
        } catch (\Throwable $e) {
            $pdo->rollBack();
            Response::error('Gagal membuat akun', 500);
        }

        $token = Jwt::encode(['id' => $userId, 'role' => $role]);
        Response::json([
            'message' => 'User berhasil dibuat',
            'user' => self::userPayload($userId),
            'token' => $token,
        ], 201);
    }

    public function login(): void
    {
        $body = Request::json();
        $email = trim((string) ($body['email'] ?? ''));
        $password = (string) ($body['password'] ?? '');
        if ($email === '' || $password === '') {
            Response::error('Email dan password wajib diisi');
        }

        $pdo = Database::connection();
        $stmt = $pdo->prepare('SELECT * FROM User WHERE email = ?');
        $stmt->execute([$email]);
        $user = $stmt->fetch();
        if (!$user || !password_verify($password, $user['password'])) {
            Response::error('Email atau password salah', 401);
        }

        $tenant = null;
        if ($user['tenantId']) {
            $t = $pdo->prepare('SELECT * FROM Tenant WHERE id = ?');
            $t->execute([$user['tenantId']]);
            $tenant = $t->fetch() ?: null;
        }

        $token = Jwt::encode(['id' => (int) $user['id'], 'role' => $user['role']]);
        Response::json([
            'user' => self::formatUser($user, $tenant),
            'token' => $token,
        ]);
    }

    private static function userPayload(int $userId): array
    {
        $pdo = Database::connection();
        $stmt = $pdo->prepare('SELECT * FROM User WHERE id = ?');
        $stmt->execute([$userId]);
        $user = $stmt->fetch();
        $tenant = null;
        if ($user && $user['tenantId']) {
            $t = $pdo->prepare('SELECT * FROM Tenant WHERE id = ?');
            $t->execute([$user['tenantId']]);
            $tenant = $t->fetch() ?: null;
        }
        return self::formatUser($user, $tenant);
    }

    private static function formatUser(array|false $user, ?array $tenant): array
    {
        return [
            'id' => (int) $user['id'],
            'name' => $user['name'],
            'email' => $user['email'],
            'role' => $user['role'],
            'balance' => (float) $user['balance'],
            'phoneNumber' => $user['phoneNumber'],
            'nim' => $user['nim'],
            'avatar' => $user['avatar'],
            'tenantId' => $user['tenantId'] ? (int) $user['tenantId'] : null,
            'tenant' => $tenant ? [
                'id' => (int) $tenant['id'],
                'name' => $tenant['name'],
                'location' => $tenant['location'],
                'isOpen' => (bool) $tenant['isOpen'],
                'image' => $tenant['image'],
            ] : null,
        ];
    }
}
