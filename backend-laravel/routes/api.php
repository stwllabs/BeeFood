<?php

declare(strict_types=1);

use App\Http\Controllers\AuthController;
use App\Http\Controllers\MenuController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\TenantController;
use App\Http\Controllers\WalletController;

/** @var \App\Core\Router $router */

$auth = new AuthController();
$profile = new ProfileController();
$tenant = new TenantController();
$menu = new MenuController();
$order = new OrderController();
$wallet = new WalletController();

$router->post('/api/auth/register', fn () => $auth->register());
$router->post('/api/auth/login', fn () => $auth->login());

$router->get('/api/profile', fn () => $profile->show());
$router->put('/api/profile', fn () => $profile->update());

$router->get('/api/tenants', fn () => $tenant->index());
$router->get('/api/tenants/{tenantId}/feedback', fn ($p) => $tenant->feedback($p));

$router->get('/api/menus', fn () => $menu->index());
$router->post('/api/tenants/{tenantId}/menus', fn ($p) => $menu->store($p));
$router->patch('/api/menus/{id}/toggle', fn ($p) => $menu->toggle($p));

$router->post('/api/orders', fn () => $order->store());
$router->patch('/api/orders/{id}', fn ($p) => $order->update($p));
$router->get('/api/orders/user', fn () => $order->userOrders());
$router->get('/api/orders/tenant/{tenantId}', fn ($p) => $order->tenantOrders($p));
$router->post('/api/orders/{id}/feedback', fn ($p) => $order->feedback($p));

$router->post('/api/wallet/topup', fn () => $wallet->topup());
$router->get('/api/wallet/history', fn () => $wallet->history());
