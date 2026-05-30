<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Core\Database;
use App\Core\Response;
use App\Middleware\AuthMiddleware;
use App\Support\Request;

final class MenuController
{
    public function index(): void
    {
        $pdo = Database::connection();
        $rows = $pdo->query(
            'SELECT m.*, t.id as tenant_id, t.name as tenant_name, t.location as tenant_location
             FROM Menu m JOIN Tenant t ON t.id = m.tenantId'
        )->fetchAll();
        Response::json($rows);
    }

    public function store(array $params): void
    {
        $auth = AuthMiddleware::user();
        $tenantId = (int) $params['tenantId'];
        $body = Request::json();

        $pdo = Database::connection();
        $owner = $pdo->prepare('SELECT tenantId FROM User WHERE id = ?');
        $owner->execute([$auth['id']]);
        $row = $owner->fetch();
        if (!$row || !$row['tenantId']) {
            Response::error('Akun tenant tidak terhubung ke outlet', 403);
        }
        if ((int) $row['tenantId'] !== $tenantId) {
            Response::error('Anda tidak boleh menambah menu untuk outlet lain', 403);
        }

        $name = trim((string) ($body['name'] ?? ''));
        $price = (float) ($body['price'] ?? 0);
        $time = (int) ($body['estimatedTime'] ?? 0);
        if ($name === '' || $price <= 0 || $time <= 0) {
            Response::error('Parameter menu tidak lengkap atau tidak valid');
        }

        $image = $body['image'] ?? 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=60';
        $stmt = $pdo->prepare(
            'INSERT INTO Menu (name, price, estimatedTime, isAvailable, image, tenantId)
             VALUES (?, ?, ?, 1, ?, ?)'
        );
        $stmt->execute([$name, $price, $time, $image, $tenantId]);
        $id = (int) $pdo->lastInsertId();
        $menu = $pdo->query('SELECT * FROM Menu WHERE id = ' . $id)->fetch();
        $menu['id'] = (int) $menu['id'];
        $menu['price'] = (float) $menu['price'];
        $menu['estimatedTime'] = (int) $menu['estimatedTime'];
        $menu['isAvailable'] = (bool) $menu['isAvailable'];
        $menu['tenantId'] = (int) $menu['tenantId'];
        Response::json($menu, 201);
    }

    public function toggle(array $params): void
    {
        AuthMiddleware::user();
        $id = (int) $params['id'];
        $pdo = Database::connection();
        $menu = $pdo->query('SELECT * FROM Menu WHERE id = ' . $id)->fetch();
        if (!$menu) {
            Response::error('Menu tidak ditemukan', 404);
        }
        $newVal = $menu['isAvailable'] ? 0 : 1;
        $pdo->prepare('UPDATE Menu SET isAvailable = ? WHERE id = ?')->execute([$newVal, $id]);
        $menu['isAvailable'] = (bool) $newVal;
        Response::json($menu);
    }
}
