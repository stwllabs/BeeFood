<?php

return [
    'name' => 'BeeFood API',
    'timezone' => 'Asia/Jakarta',
    'jwt_secret' => getenv('JWT_SECRET') ?: 'secret_beefood_123',
    'jwt_ttl' => 86400,
];
