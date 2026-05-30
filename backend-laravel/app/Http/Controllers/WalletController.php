<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Core\Database;
use App\Core\Response;
use App\Middleware\AuthMiddleware;
use App\Support\Request;

final class WalletController
{
    public function topup(): void
    {
        $auth = AuthMiddleware::user();
        $body = Request::json();
        $amount = (float) ($body['amount'] ?? 0);
        if ($amount <= 0) {
            Response::error('Jumlah top up tidak valid');
        }

        $pdo = Database::connection();
        $pdo->beginTransaction();
        $pdo->prepare('UPDATE User SET balance = balance + ? WHERE id = ?')->execute([$amount, $auth['id']]);
        $pdo->prepare(
            'INSERT INTO WalletTransaction (userId, type, method, amount, description)
             VALUES (?, ?, ?, ?, ?)'
        )->execute([$auth['id'], 'TOP_UP', 'QRIS', $amount, 'Top up BeePay via QRIS']);
        $pdo->commit();

        $bal = $pdo->query('SELECT balance FROM User WHERE id = ' . (int) $auth['id'])->fetchColumn();
        Response::json(['message' => 'Top up berhasil', 'balance' => (float) $bal], 201);
    }

    public function history(): void
    {
        $auth = AuthMiddleware::user();
        $pdo = Database::connection();
        $stmt = $pdo->prepare('SELECT * FROM WalletTransaction WHERE userId = ? ORDER BY createdAt DESC');
        $stmt->execute([$auth['id']]);
        Response::json($stmt->fetchAll());
    }
}
