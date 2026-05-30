<?php

declare(strict_types=1);

namespace App\Middleware;

use App\Core\Jwt;
use App\Core\Response;

final class AuthMiddleware
{
    public static function user(): array
    {
        $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
        if (!str_starts_with($header, 'Bearer ')) {
            Response::error('Akses ditolak, token tidak ditemukan', 401);
        }
        $token = trim(substr($header, 7));
        $payload = Jwt::decode($token);
        if (!$payload || !isset($payload['id'])) {
            Response::error('Token tidak valid atau kadaluwarsa', 403);
        }
        return $payload;
    }
}
