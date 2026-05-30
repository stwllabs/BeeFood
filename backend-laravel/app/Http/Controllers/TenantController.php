<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Core\Database;
use App\Core\Response;

final class TenantController
{
    public function index(): void
    {
        $pdo = Database::connection();
        $tenants = $pdo->query('SELECT * FROM Tenant')->fetchAll();
        $result = [];
        foreach ($tenants as $t) {
            $menus = $pdo->prepare('SELECT * FROM Menu WHERE tenantId = ?');
            $menus->execute([$t['id']]);
            $menuRows = $menus->fetchAll();
            foreach ($menuRows as &$m) {
                $m['id'] = (int) $m['id'];
                $m['price'] = (float) $m['price'];
                $m['estimatedTime'] = (int) $m['estimatedTime'];
                $m['isAvailable'] = (bool) $m['isAvailable'];
                $m['tenantId'] = (int) $m['tenantId'];
            }

            $fb = $pdo->prepare(
                'SELECT f.rating FROM Feedback f
                 JOIN "Order" o ON o.id = f.orderId
                 WHERE o.tenantId = ?'
            );
            $fb->execute([$t['id']]);
            $ratings = $fb->fetchAll(PDO::FETCH_COLUMN);
            $reviewCount = count($ratings);
            $rating = $reviewCount > 0
                ? number_format(array_sum($ratings) / $reviewCount, 1, '.', '')
                : '0';

            $result[] = [
                'id' => (int) $t['id'],
                'name' => $t['name'],
                'location' => $t['location'],
                'isOpen' => (bool) $t['isOpen'],
                'image' => $t['image'] ?: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=60',
                'rating' => $rating,
                'menus' => $menuRows,
                'reviewCount' => $reviewCount,
            ];
        }
        Response::json($result);
    }

    public function feedback(array $params): void
    {
        $tenantId = (int) $params['tenantId'];
        $pdo = Database::connection();
        $stmt = $pdo->prepare(
            'SELECT f.*, u.name as studentName, u.avatar as studentAvatar, o.items
             FROM Feedback f
             JOIN "Order" o ON o.id = f.orderId
             JOIN User u ON u.id = o.userId
             WHERE o.tenantId = ?
             ORDER BY f.createdAt DESC'
        );
        $stmt->execute([$tenantId]);
        $rows = $stmt->fetchAll();
        $formatted = array_map(function (array $f) {
            $items = json_decode($f['items'], true);
            $summary = is_array($items)
                ? implode(', ', array_map(fn ($it) => ($it['name'] ?? '') . ' x' . ($it['qty'] ?? 0), $items))
                : '';
            return [
                'id' => (int) $f['id'],
                'rating' => (int) $f['rating'],
                'comment' => $f['comment'],
                'createdAt' => $f['createdAt'],
                'studentName' => $f['studentName'],
                'studentAvatar' => $f['studentAvatar'] ?: 'https://api.dicebear.com/7.x/adventurer/svg?seed=default',
                'orderSummary' => $summary,
            ];
        }, $rows);
        Response::json($formatted);
    }
}
