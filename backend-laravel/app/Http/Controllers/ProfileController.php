<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Core\Database;
use App\Core\Response;
use App\Middleware\AuthMiddleware;
use App\Support\Request;

final class ProfileController
{
    public function show(): void
    {
        $auth = AuthMiddleware::user();
        Response::json(self::loadUser((int) $auth['id']));
    }

    public function update(): void
    {
        $auth = AuthMiddleware::user();
        $body = Request::json();
        $pdo = Database::connection();

        $stmt = $pdo->prepare('UPDATE User SET name = ?, phoneNumber = ?, nim = ?, avatar = ? WHERE id = ?');
        $stmt->execute([
            $body['name'] ?? '',
            $body['phoneNumber'] ?? null,
            $body['nim'] ?? null,
            $body['avatar'] ?? null,
            $auth['id'],
        ]);

        $user = self::loadUser((int) $auth['id']);
        if ($user['tenantId'] && (
            isset($body['tenantName']) ||
            isset($body['tenantLocation']) ||
            array_key_exists('tenantIsOpen', $body) ||
            (isset($body['tenantImage']) && $body['tenantImage'] !== '')
        )) {
            $tenantData = [];
            $params = [];
            if (!empty($body['tenantName'])) {
                $tenantData[] = 'name = ?';
                $params[] = $body['tenantName'];
            }
            if (!empty($body['tenantLocation'])) {
                $tenantData[] = 'location = ?';
                $params[] = $body['tenantLocation'];
            }
            if (array_key_exists('tenantIsOpen', $body)) {
                $tenantData[] = 'isOpen = ?';
                $params[] = $body['tenantIsOpen'] ? 1 : 0;
            }
            if (!empty($body['tenantImage'])) {
                $tenantData[] = 'image = ?';
                $params[] = $body['tenantImage'];
            }
            if ($tenantData) {
                $params[] = $user['tenantId'];
                $pdo->prepare('UPDATE Tenant SET ' . implode(', ', $tenantData) . ' WHERE id = ?')->execute($params);
            }
            $user = self::loadUser((int) $auth['id']);
        }

        Response::json(['message' => 'Profil berhasil diperbarui', 'user' => $user]);
    }

    private static function loadUser(int $id): array
    {
        $pdo = Database::connection();
        $stmt = $pdo->prepare('SELECT * FROM User WHERE id = ?');
        $stmt->execute([$id]);
        $user = $stmt->fetch();
        $tenant = null;
        if ($user['tenantId']) {
            $t = $pdo->prepare('SELECT * FROM Tenant WHERE id = ?');
            $t->execute([$user['tenantId']]);
            $tenant = $t->fetch();
        }
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
