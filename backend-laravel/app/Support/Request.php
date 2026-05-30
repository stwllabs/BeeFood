<?php

declare(strict_types=1);

namespace App\Support;

final class Request
{
    public static function json(): array
    {
        $raw = file_get_contents('php://input') ?: '{}';
        $data = json_decode($raw, true);
        return is_array($data) ? $data : [];
    }
}
