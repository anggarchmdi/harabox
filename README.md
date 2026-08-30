# HaraBook API

Backend REST API untuk aplikasi **HaraBook**, sistem booking catering Hara Chicken.

Dibangun menggunakan **Laravel** dan **MariaDB**, dengan API versioning (`v1`), authentication untuk admin, serta token-based access untuk customer order.

## Tech Stack

* PHP 8.5+
* Laravel
* MariaDB / MySQL
* Laravel Sanctum
* REST API
* Composer

## Project Structure

```text
app/
├── Http/
│   ├── Controllers/
│   │   └── Api/
│   │       ├── Admin/
│   │       │   ├── AuthController.php
│   │       │   ├── CategoryController.php
│   │       │   ├── ProductController.php
│   │       │   ├── PackageController.php
│   │       │   ├── AddonController.php
│   │       │   └── OrderController.php
│   │       ├── CategoryController.php
│   │       ├── ProductController.php
│   │       ├── PackageController.php
│   │       ├── AddonController.php
│   │       └── OrderController.php
│   │
│   └── Requests/
│
├── Models/
│
└── Services/
    └── OrderService.php

database/
└── migrations/

routes/
└── api.php
```

## Features

### Public Catalog

Customer dapat mengakses:

* Categories
* Products
* Packages
* Addons

Endpoint utama:

```text
GET /api/v1/categories
GET /api/v1/products
GET /api/v1/packages
GET /api/v1/addons
```

Detail berdasarkan slug:

```text
GET /api/v1/categories/{slug}
GET /api/v1/products/{slug}
GET /api/v1/packages/{slug}
GET /api/v1/addons/{slug}
```

### Customer Orders

Customer dapat membuat dan melihat order.

```text
POST /api/v1/orders
GET  /api/v1/orders/{orderCode}
POST /api/v1/orders/{orderCode}/confirm
```

Order menggunakan **access token** sebagai mekanisme authorization untuk mengakses data order customer.

Access token disimpan secara aman menggunakan hash SHA-256 di database.

### Admin Authentication

Admin authentication menggunakan **Laravel Sanctum**.

```text
POST /api/v1/admin/login
GET  /api/v1/admin/me
POST /api/v1/admin/logout
```

Endpoint admin yang membutuhkan authentication menggunakan:

```text
Authorization: Bearer {token}
```

### Admin Management

Admin dapat mengelola:

* Products
* Categories
* Packages
* Addons
* Orders

Endpoint:

```text
/api/v1/admin/products
/api/v1/admin/categories
/api/v1/admin/packages
/api/v1/admin/addons
/api/v1/admin/orders
```

### Rate Limiting

Login admin menggunakan rate limiter:

```text
5 requests / minute / IP
```

Endpoint API umum juga menggunakan rate limiting sesuai konfigurasi aplikasi.

## API Response

Response API menggunakan format JSON.

Contoh response sukses:

```json
{
    "success": true,
    "message": "Order created successfully",
    "data": {}
}
```

Contoh response error:

```json
{
    "success": false,
    "message": "Order not found"
}
```

Validation error mengikuti format Laravel:

```json
{
    "message": "The given data was invalid.",
    "errors": {}
}
```

## Requirements

Pastikan environment sudah memiliki:

* PHP 8.5+
* Composer
* MariaDB / MySQL
* PHP extensions yang dibutuhkan Laravel

Cek versi:

```bash
php -v
composer -V
mysql --version
```

## Installation

Clone repository:

```bash
git clone <repository-url>
cd harabox-app
```

Install dependencies:

```bash
composer install
```

Copy environment file:

```bash
cp .env.example .env
```

Generate application key:

```bash
php artisan key:generate
```

## Database Configuration

Atur database pada `.env`:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=harabox_db
DB_USERNAME=your_username
DB_PASSWORD=your_password
```

Kemudian jalankan migration:

```bash
php artisan migrate
```

## Run Development Server

Jalankan Laravel:

```bash
php artisan serve
```

API tersedia pada:

```text
http://127.0.0.1:8000
```

Base URL API:

```text
http://127.0.0.1:8000/api/v1
```

## Testing API

API dapat diuji menggunakan:

* Postman
* cURL
* Frontend application

Contoh:

```bash
curl -i \
  -H "Accept: application/json" \
  http://127.0.0.1:8000/api/v1/packages
```

Membuat order:

```bash
curl -X POST \
  http://127.0.0.1:8000/api/v1/orders \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{
    "customers_name": "John Doe",
    "customers_phone": "081234567890",
    "event_date": "2026-09-15",
    "event_time": "10:00",
    "delivery_address": "Sedayu, Bantul",
    "items": [
      {
        "package_id": 5,
        "quantity": 5
      }
    ]
  }'
```

## Security

Beberapa mekanisme keamanan yang digunakan:

* Laravel Sanctum untuk authentication admin
* Access token untuk customer order
* Access token disimpan dalam bentuk hash
* Rate limiting pada admin login
* Server-side validation
* Harga package dan addon dihitung berdasarkan data database
* Client tidak dapat menentukan harga order melalui request
* Database transaction pada proses pembuatan order

### Important

Jangan pernah commit file `.env` ke repository.

Pastikan `.env` masuk `.gitignore` dan gunakan `.env.example` sebagai template konfigurasi.

## API Versioning

API menggunakan versioning:

```text
/api/v1
```

Perubahan besar pada API dapat diperkenalkan melalui versi berikutnya, misalnya:

```text
/api/v2
```

tanpa langsung memutus API versi sebelumnya.

## Development

Clear application cache:

```bash
php artisan optimize:clear
```

Check routes:

```bash
php artisan route:list
```

Run tests:

```bash
php artisan test
```

## License

This project is developed for the HaraBook catering booking application.
