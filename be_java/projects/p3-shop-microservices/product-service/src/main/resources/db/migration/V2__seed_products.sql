-- Dữ liệu mẫu. Id 1 và 5 khớp ví dụ trong docs/api-contracts.md.
INSERT INTO products (sku, name, category, price, stock) VALUES
    ('LT-DELL-01',  'Laptop Dell',                'Máy tính',  22000000, 12),
    ('LT-MAC-01',   'MacBook Air M3',             'Máy tính',  27990000,  5),
    ('MN-LG-27',    'Màn hình LG 27 inch',        'Máy tính',   5000000, 20),
    ('KB-KEY-K2',   'Bàn phím cơ Keychron K2',    'Phụ kiện',   1200000, 30),
    ('MS-LOGI-01',  'Chuột Logitech',             'Phụ kiện',    450000, 50),
    ('HP-SONY-01',  'Tai nghe Sony',              'Phụ kiện',   1500000, 15),
    ('PAD-01',      'Lót chuột',                  'Phụ kiện',    100000, 100),
    ('PH-IP-15',    'iPhone 15',                  'Điện thoại', 19990000,  8),
    ('PH-SS-S24',   'Samsung Galaxy S24',         'Điện thoại', 18990000,  1),   -- còn 1: thử bán hết hàng
    ('CB-USB-C',    'Cáp USB-C',                  'Phụ kiện',    150000,  0);    -- hết hàng sẵn
