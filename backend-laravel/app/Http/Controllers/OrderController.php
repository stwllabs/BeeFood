<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Core\Database;
use App\Core\Response;
use App\Middleware\AuthMiddleware;
use App\Support\Request;
use PDO;

final class OrderController
{
    public function store(): void
    {
        $auth = AuthMiddleware::user();
        $body = Request::json();
        $tenantId = (int) ($body['tenantId'] ?? 0);
        $items = $body['items'] ?? null;
        $totalPrice = (float) ($body['totalPrice'] ?? 0);
        $method = strtoupper(str_replace('QRISS', 'QRIS', (string) ($body['paymentMethod'] ?? 'BEEPAY')));

        if (!$tenantId || !$items || $totalPrice <= 0) {
            Response::error('Data pesanan tidak lengkap');
        }
        if (!in_array($method, ['BEEPAY', 'QRIS'], true)) {
            Response::error('Metode pembayaran tidak valid');
        }

        $pdo = Database::connection();
        $pdo->beginTransaction();
        try {
            $userStmt = $pdo->prepare('SELECT * FROM User WHERE id = ?');
            $userStmt->execute([$auth['id']]);
            $user = $userStmt->fetch();

            if ($method === 'BEEPAY' && (float) $user['balance'] < $totalPrice) {
                Response::error('Saldo Digital Tidak Mencukupi');
            }

            if ($method === 'BEEPAY') {
                $pdo->prepare('UPDATE User SET balance = balance - ? WHERE id = ?')->execute([$totalPrice, $auth['id']]);
                $pdo->prepare(
                    'INSERT INTO WalletTransaction (userId, type, method, amount, description)
                     VALUES (?, ?, ?, ?, ?)'
                )->execute([$auth['id'], 'BEEPAY_SPEND', 'BEEPAY', $totalPrice, 'Pengeluaran BeePay untuk pre-order']);
            }

            $pdo->prepare(
                'INSERT INTO "Order" (userId, tenantId, totalPrice, status, items) VALUES (?, ?, ?, ?, ?)'
            )->execute([
                $auth['id'],
                $tenantId,
                $totalPrice,
                'PENDING',
                json_encode($items, JSON_UNESCAPED_UNICODE),
            ]);
            $orderId = (int) $pdo->lastInsertId();
            $pdo->commit();
        } catch (\Throwable $e) {
            $pdo->rollBack();
            Response::error($e->getMessage() ?: 'Gagal membuat pesanan', 400);
        }

        Response::json([
            'message' => 'Pre-order berhasil ditempatkan',
            'order' => self::loadOrder($orderId),
        ], 201);
    }

    public function update(array $params): void
    {
        $auth = AuthMiddleware::user();
        $id = (int) $params['id'];
        $body = Request::json();
        $newStatus = strtoupper((string) ($body['status'] ?? ''));

        $pdo = Database::connection();
        $order = $pdo->query('SELECT * FROM "Order" WHERE id = ' . $id)->fetch();
        if (!$order) {
            Response::error('Pesanan tidak ditemukan', 404);
        }

        $current = $order['status'];
        if ($newStatus === 'DONE') {
            if ((int) $order['userId'] !== (int) $auth['id']) {
                Response::error('Akses ditolak', 403);
            }
            if ($current !== 'READY') {
                Response::error('Pesanan belum siap diambil');
            }
        } else {
            $owner = $pdo->prepare('SELECT tenantId FROM User WHERE id = ?');
            $owner->execute([$auth['id']]);
            $user = $owner->fetch();
            if (!$user || (int) $user['tenantId'] !== (int) $order['tenantId']) {
                Response::error('Akses ditolak', 403);
            }
            $allowed = [
                'PENDING' => ['COOKING'],
                'COOKING' => ['READY'],
            ];
            if (!in_array($newStatus, $allowed[$current] ?? [], true)) {
                Response::error('Transisi status tidak valid. Pesanan harus di-ACC tenant terlebih dahulu.');
            }
        }

        $pdo->prepare('UPDATE "Order" SET status = ? WHERE id = ?')->execute([$newStatus, $id]);
        Response::json(self::loadOrder($id));
    }

    public function userOrders(): void
    {
        $auth = AuthMiddleware::user();
        $pdo = Database::connection();
        $stmt = $pdo->prepare(
            'SELECT o.*, t.id as t_id, t.name as t_name, t.location as t_location, t.isOpen as t_isOpen, t.image as t_image,
                    f.id as f_id, f.rating as f_rating, f.comment as f_comment
             FROM "Order" o
             JOIN Tenant t ON t.id = o.tenantId
             LEFT JOIN Feedback f ON f.orderId = o.id
             WHERE o.userId = ?
             ORDER BY o.createdAt DESC'
        );
        $stmt->execute([$auth['id']]);
        Response::json(self::mapOrders($stmt->fetchAll()));
    }

    public function tenantOrders(array $params): void
    {
        AuthMiddleware::user();
        $tenantId = (int) $params['tenantId'];
        $pdo = Database::connection();
        $stmt = $pdo->prepare(
            'SELECT o.*, u.id as u_id, u.name as u_name, u.nim as u_nim, u.phoneNumber as u_phone, u.avatar as u_avatar,
                    f.id as f_id, f.rating as f_rating
             FROM "Order" o
             JOIN User u ON u.id = o.userId
             LEFT JOIN Feedback f ON f.orderId = o.id
             WHERE o.tenantId = ?
             ORDER BY o.createdAt DESC'
        );
        $stmt->execute([$tenantId]);
        $rows = $stmt->fetchAll();
        $mapped = array_map(function (array $o) {
            return [
                'id' => (int) $o['id'],
                'userId' => (int) $o['userId'],
                'tenantId' => (int) $o['tenantId'],
                'totalPrice' => (float) $o['totalPrice'],
                'status' => $o['status'],
                'createdAt' => $o['createdAt'],
                'items' => json_decode($o['items'], true),
                'user' => [
                    'id' => (int) $o['u_id'],
                    'name' => $o['u_name'],
                    'nim' => $o['u_nim'],
                    'phoneNumber' => $o['u_phone'],
                    'avatar' => $o['u_avatar'],
                ],
                'feedback' => $o['f_id'] ? ['id' => (int) $o['f_id'], 'rating' => (int) $o['f_rating']] : null,
            ];
        }, $rows);
        Response::json($mapped);
    }

    public function feedback(array $params): void
    {
        $auth = AuthMiddleware::user();
        $id = (int) $params['id'];
        $body = Request::json();
        $rating = (int) ($body['rating'] ?? 0);
        if ($rating < 1 || $rating > 5) {
            Response::error('Rating harus berupa angka 1-5');
        }

        $pdo = Database::connection();
        $order = $pdo->query('SELECT * FROM "Order" WHERE id = ' . $id)->fetch();
        if (!$order) {
            Response::error('Pesanan tidak ditemukan', 404);
        }
        if ((int) $order['userId'] !== (int) $auth['id']) {
            Response::error('Akses ditolak', 403);
        }
        if ($order['status'] !== 'DONE') {
            Response::error('Pesanan belum selesai diambil');
        }
        $exists = $pdo->prepare('SELECT id FROM Feedback WHERE orderId = ?');
        $exists->execute([$id]);
        if ($exists->fetch()) {
            Response::error('Pesanan ini sudah diulas sebelumnya');
        }

        $pdo->prepare('INSERT INTO Feedback (orderId, rating, comment) VALUES (?, ?, ?)')
            ->execute([$id, $rating, $body['comment'] ?? '']);
        Response::json(['message' => 'Ulasan berhasil dikirim'], 201);
    }

    private static function loadOrder(int $id): array
    {
        $pdo = Database::connection();
        $stmt = $pdo->prepare(
            'SELECT o.*, t.name as t_name, t.location as t_location, t.image as t_image,
                    u.name as u_name, u.nim as u_nim, u.phoneNumber as u_phone
             FROM "Order" o
             JOIN Tenant t ON t.id = o.tenantId
             JOIN User u ON u.id = o.userId
             WHERE o.id = ?'
        );
        $stmt->execute([$id]);
        $o = $stmt->fetch();
        return [
            'id' => (int) $o['id'],
            'userId' => (int) $o['userId'],
            'tenantId' => (int) $o['tenantId'],
            'totalPrice' => (float) $o['totalPrice'],
            'status' => $o['status'],
            'createdAt' => $o['createdAt'],
            'items' => json_decode($o['items'], true),
            'tenant' => ['id' => (int) $o['tenantId'], 'name' => $o['t_name'], 'location' => $o['t_location'], 'image' => $o['t_image']],
            'user' => ['name' => $o['u_name'], 'nim' => $o['u_nim'], 'phoneNumber' => $o['u_phone']],
        ];
    }

    private static function mapOrders(array $rows): array
    {
        return array_map(function (array $o) {
            return [
                'id' => (int) $o['id'],
                'userId' => (int) $o['userId'],
                'tenantId' => (int) $o['tenantId'],
                'totalPrice' => (float) $o['totalPrice'],
                'status' => $o['status'],
                'createdAt' => $o['createdAt'],
                'items' => json_decode($o['items'], true),
                'tenant' => [
                    'id' => (int) $o['t_id'],
                    'name' => $o['t_name'],
                    'location' => $o['t_location'],
                    'isOpen' => (bool) $o['t_isOpen'],
                    'image' => $o['t_image'],
                ],
                'feedback' => $o['f_id'] ? [
                    'id' => (int) $o['f_id'],
                    'rating' => (int) $o['f_rating'],
                    'comment' => $o['f_comment'],
                ] : null,
            ];
        }, $rows);
    }
}
