<?php

declare(strict_types=1);

namespace App\Core;

final class Jwt
{
    public static function encode(array $payload): string
    {
        $config = require dirname(__DIR__, 2) . '/config/app.php';
        $header = self::base64UrlEncode(json_encode(['typ' => 'JWT', 'alg' => 'HS256']));
        $payload['exp'] = time() + (int) $config['jwt_ttl'];
        $body = self::base64UrlEncode(json_encode($payload));
        $signature = self::base64UrlEncode(
            hash_hmac('sha256', $header . '.' . $body, $config['jwt_secret'], true)
        );
        return $header . '.' . $body . '.' . $signature;
    }

    public static function decode(string $token): ?array
    {
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            return null;
        }
        [$header, $body, $signature] = $parts;
        $config = require dirname(__DIR__, 2) . '/config/app.php';
        $expected = self::base64UrlEncode(
            hash_hmac('sha256', $header . '.' . $body, $config['jwt_secret'], true)
        );
        if (!hash_equals($expected, $signature)) {
            return null;
        }
        $payload = json_decode(self::base64UrlDecode($body), true);
        if (!is_array($payload) || ($payload['exp'] ?? 0) < time()) {
            return null;
        }
        return $payload;
    }

    private static function base64UrlEncode(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    private static function base64UrlDecode(string $data): string
    {
        return base64_decode(strtr($data, '-_', '+/')) ?: '';
    }
}
