-- Demo accounts: password123
INSERT OR IGNORE INTO Tenant (id, name, location, isOpen, image) VALUES
(1, 'Kantin Ayam Geprek SASC', 'Kantin SASC Lt. 1', 1, 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=60'),
(2, 'Kedai Kopi Kampus & Boba', 'Kantin SASC Lt. 2', 1, 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=500&auto=format&fit=crop&q=60'),
(3, 'Gorengan Renyah Kampus', 'Kantin Syahdan', 1, 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=500&auto=format&fit=crop&q=60');

INSERT OR IGNORE INTO User (id, name, email, password, role, balance, phoneNumber, nim, avatar, tenantId) VALUES
(1, 'Evan Wijaya', 'student@binus.ac.id', '$2y$10$qeS3qQXS6c6mK4zmTh.5ze7o96z.UY1LZA/DPNeoe9SG.Ax2Ctwhu', 'STUDENT', 100000, '081234567890', '2501234567', 'https://api.dicebear.com/7.x/adventurer/svg?seed=Evan', NULL),
(2, 'SASC Geprek Owner', 'tenant@binus.ac.id', '$2y$10$qeS3qQXS6c6mK4zmTh.5ze7o96z.UY1LZA/DPNeoe9SG.Ax2Ctwhu', 'TENANT', 100000, '081298765432', NULL, NULL, 1);

INSERT OR IGNORE INTO Menu (name, price, estimatedTime, isAvailable, image, tenantId) VALUES
('Ayam Geprek Level 1', 15000, 8, 1, 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=500', 1),
('Ayam Geprek Level 3', 17000, 10, 1, 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=500', 1),
('Nasi Ayam Geprek Spesial', 20000, 12, 1, 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=500', 1),
('Kopi Susu Gula Aren', 18000, 4, 1, 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=500', 2),
('Ice Caramel Latte', 22000, 5, 1, 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=500', 2),
('Tempe Mendoan (Isi 3)', 7000, 5, 1, 'https://images.unsplash.com/photo-1624371414361-e6e2ed58c242?w=500', 3);
