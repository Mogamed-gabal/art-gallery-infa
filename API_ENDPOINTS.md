# 📚 Art Gallery API — دليل ونقاط النهاية الكاملة (Complete API Endpoints)

> **الإصدار:** 1.0.0  
> **البيئة الافتراضية:** `http://localhost:3005`  
> **البادئة العامة (Base URL):** `http://localhost:3005/api/v1`  
> **توثيق Swagger التفاعلي:** `http://localhost:3005/api/docs`  

---

## 📑 الفهرس (Table of Contents)
1. [المعايير العامة للـ API (General Standards)](#-المعايير-العامة-للـ-api)
   - [هيكل الاستجابة الناجحة (Success Response)](#هيكل-الاستجابة-الناجحة-successresponse)
   - [هيكل استجابة الخطأ (Error Response)](#هيكل-استجابة-الخطأ-errorresponse)
   - [المصادقة والتفويض (Authentication)](#المصادقة-والأمان-auth)
2. [جدول ملخص لكافة الـ Endpoints (26 مساراً)](#-جدول-ملخص-لكافة-نقاط-النهاية)
3. [التفاصيل الكاملة لكل Endpoint حسب الموديول](#-التفاصيل-الشاملة-لكل-موديول)
   - [1. موديول المصادقة (Authentication)](#1-موديول-المصادقة-auth)
   - [2. موديول التصنيفات (Categories)](#2-موديول-التصنيفات-categories)
   - [3. موديول الأعمال الفنية (Artworks)](#3-موديول-الأعمال-الفنية-artworks)
   - [4. موديول الطلبات والدفع (Orders & Paymob)](#4-موديول-الطلبات-والدفع-orders)
   - [5. موديول الكورسات والورش (Courses)](#5-موديول-الكورسات-والورش-courses)
   - [6. موديول طلبات اللوحات المخصصة (Client Requests)](#6-موديول-طلبات-اللوحات-المخصصة-client-requests)
   - [7. موديول محتوى الموقع (Content & CMS)](#7-موديول-محتوى-الموقع-content)

---

## 🌐 المعايير العامة للـ API

### هيكل الاستجابة الناجحة (`SuccessResponse<T>`)
جميع الاستجابات الناجحة في NestJS يتم تغليفها تلقائياً عبر `TransformInterceptor`:
```json
{
  "success": true,
  "statusCode": 200,
  "data": { ... },
  "message": "Request successful"
}
```

### هيكل استجابة الخطأ (`HttpExceptionFilter`)
تتم معالجة جميع الأخطاء بشكل موحد عبر `HttpExceptionFilter`:
```json
{
  "success": false,
  "statusCode": 400,
  "timestamp": "2026-09-12T22:00:00.000Z",
  "path": "/api/v1/...",
  "message": "Validation failed / Entity not found / etc.",
  "details": "Bad Request"
}
```

### المصادقة والأمان (Auth)
- للمسارات المحمية الخاصة بالإدارة (`Admin`)، يجب إرسال رمز الـ JWT في الـ Header التالي:
  ```http
  Authorization: Bearer <ACCESS_TOKEN>
  ```
- لمسار Webhook الدفع الخاص بـ **Paymob**، يتم التحقق عبر حارس HMAC `PaymobHmacGuard` باستخدام خوارزمية SHA-512.

---

## 📋 جدول ملخص لكافة نقاط النهاية

| # | الطريقة | المسار (Path) | الصلاحية (Auth) | الوصف |
|---|---------|---------------|-----------------|-------|
| 1 | `POST` | `/api/v1/auth/login` | 🟢 عام (Public) | تسجيل دخول الأدمن وتوليد JWT Token |
| 2 | `GET` | `/api/v1/categories` | 🟢 عام (Public) | جلب جميع تصنيفات اللوحات |
| 3 | `POST` | `/api/v1/categories` | 🔴 أدمن (JWT) | إنشاء تصنيف لوحات جديد |
| 4 | `DELETE` | `/api/v1/categories/:id` | 🔴 أدمن (JWT) | حذف تصنيف (شرط ألا يحتوي على لوحات) |
| 5 | `GET` | `/api/v1/artworks/home-featured` | 🟢 عام (Public) | جلب 6 لوحات مميزة عشوائية للصفحة الرئيسية |
| 6 | `GET` | `/api/v1/artworks` | 🟢 عام (Public) | تصفح اللوحات بفلترة وترقيم صفحات وبحث |
| 7 | `GET` | `/api/v1/artworks/:id` | 🟢 عام (Public) | جلب تفاصيل لوحة فنية محددة بالـ UUID |
| 8 | `POST` | `/api/v1/artworks` | 🔴 أدمن (JWT) | إنشاء لوحة جديدة مع رفع حتى 5 صور |
| 9 | `PATCH` | `/api/v1/artworks/:id` | 🔴 أدمن (JWT) | تعديل بيانات لوحة أو استبدال صورها |
| 10 | `DELETE` | `/api/v1/artworks/:id` | 🔴 أدمن (JWT) | حذف لوحة فنية وحذف صورها من Cloudinary |
| 11 | `POST` | `/api/v1/orders` | 🟢 عام (Public) | إنشاء طلب شراء وحجز المخزون وتوليد رابط Paymob |
| 12 | `POST` | `/api/v1/orders/webhook/paymob` | 🟡 Paymob HMAC | استقبال وتأكيد الدفع التلقائي من Paymob |
| 13 | `GET` | `/api/v1/orders` | 🔴 أدمن (JWT) | جلب الطلبات بفلترة (الدفع/الشحن) والترقيم |
| 14 | `GET` | `/api/v1/orders/:id` | 🔴 أدمن (JWT) | جلب تفاصيل طلب محدد بالـ UUID مع بنوده |
| 15 | `PATCH` | `/api/v1/orders/:id/status` | 🔴 أدمن (JWT) | تحديث حالة تنفيذ الطلب (PROCESSING, SHIPPED, ...) |
| 16 | `GET` | `/api/v1/courses` | 🟢 عام (Public) | جلب الكورسات والورش الفنية الفعالة |
| 17 | `GET` | `/api/v1/courses/admin/all` | 🔴 أدمن (JWT) | جلب جميع الكورسات (المفعلة وغير المفعلة) |
| 18 | `GET` | `/api/v1/courses/:id` | 🟢 عام (Public) | جلب بيانات كورس محدد |
| 19 | `POST` | `/api/v1/courses` | 🔴 أدمن (JWT) | إنشاء كورس فني ورابطه الخارجي |
| 20 | `PATCH` | `/api/v1/courses/:id` | 🔴 أدمن (JWT) | تعديل كورس فني وحالة التفعيل |
| 21 | `DELETE` | `/api/v1/courses/:id` | 🔴 أدمن (JWT) | حذف كورس فني نهائياً |
| 22 | `POST` | `/api/v1/client-requests` | 🟢 عام (Public) | إرسال طلب لوحة مخصصة مع رفع 1-3 صور |
| 23 | `GET` | `/api/v1/client-requests` | 🔴 أدمن (JWT) | استعراض طلبات العملاء المخصصة |
| 24 | `GET` | `/api/v1/content/site-info` | 🟢 عام (Public) | جلب نصوص وصور الموقع (Hero, About, Contact) |
| 25 | `PUT` | `/api/v1/content/:sectionKey` | 🔴 أدمن (JWT) | تعديل أو إنشاء قسم (hero أو about أو contact) |
| 26 | `POST` | `/api/v1/content/upload-image` | 🔴 أدمن (JWT) | رفع صورة لقسم محتوى إلى Cloudinary |

---

## 🔍 التفاصيل الشاملة لكل موديول

---

### 1. موديول المصادقة (Auth)

#### `POST /api/v1/auth/login`
- **الوصف:** تسجيل دخول المشرف واستلام JWT Access Token صالح لمدة يوم كامل.
- **الصلاحية:** عام (Public).
- **Content-Type:** `application/json`
- **Request Body:**
  ```json
  {
    "email": "admin-test@example.com",
    "password": "AdminTest12345!"
  }
  ```
- **شروط التحقق (Validation):**
  - `email`: صيغة بريد إلكتروني صحيحة، غير فارغ.
  - `password`: نص غير فارغ.
- **Response (201 Created):**
  ```json
  {
    "success": true,
    "statusCode": 201,
    "data": {
      "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "user": {
        "id": "c1f7b884-3742-4dc8-a89c-d0799d14ec84",
        "email": "admin-test@example.com",
        "fullName": "Administrator"
      }
    },
    "message": "Request successful"
  }
  ```
- **أخطاء محتملة:** `401 Unauthorized` (Invalid email or password).

---

### 2. موديول التصنيفات (Categories)

#### `GET /api/v1/categories`
- **الوصف:** جلب قائمة بجميع التصنيفات الفنية مرتبة تصاعدياً بالاسم العربي.
- **الصلاحية:** عام (Public).
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "statusCode": 200,
    "data": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "nameAr": "لوحات زيتية",
        "nameEn": "Oil Paintings",
        "slug": "oil-paintings",
        "createdAt": "2026-09-12T19:00:00.000Z",
        "updatedAt": "2026-09-12T19:00:00.000Z"
      }
    ],
    "message": "Request successful"
  }
  ```

#### `POST /api/v1/categories`
- **الوصف:** إضافة تصنيف جديد للأعمال الفنية.
- **الصلاحية:** 🔒 أدمن (`JwtAuthGuard`).
- **Content-Type:** `application/json`
- **Request Body:**
  ```json
  {
    "nameAr": "ألوان مائية",
    "nameEn": "Watercolor",
    "slug": "watercolor"
  }
  ```
- **شروط التحقق:**
  - `nameAr`: نص حتى 120 حرفاً، غير فارغ.
  - `nameEn`: نص حتى 120 حرفاً، غير فارغ.
  - `slug`: مطابق للنمط `/^[a-z0-9]+(?:-[a-z0-9]+)*$/` وفريد (Unique).
- **Response (201 Created):** ترجع كائن التصنيف المنشأ.
- **أخطاء محتملة:** `400 Bad Request`، `401 Unauthorized`، `409 Conflict` (Slug موجود مسبقاً).

#### `DELETE /api/v1/categories/:id`
- **الوصف:** حذف تصنيف بناءً على الـ UUID. (إذا كان التصنيف يحتوي على لوحات، يُمنع الحذف لحماية البيانات).
- **الصلاحية:** 🔒 أدمن (`JwtAuthGuard`).
- **Path Params:** `id` (UUID).
- **Response (204 No Content)**
- **أخطاء محتملة:**
  - `400 Bad Request` ("Cannot delete category containing artworks").
  - `404 Not Found` ("Category not found").

---

### 3. موديول الأعمال الفنية (Artworks)

#### `GET /api/v1/artworks/home-featured`
- **الوصف:** جلب 6 لوحات مميزة عشوائياً للصفحة الرئيسية، مع توزيع متوازن بين التصنيفات المختلفة.
- **الصلاحية:** عام (Public).
- **Response (200 OK):** ترجع مصفوفة من 6 كائنات لوحات بحد أقصى مع بيانات التصنيف والصور.

#### `GET /api/v1/artworks`
- **الوصف:** جلب اللوحات الفنية مع فلاتر متعددة وترقيم صفحات وبحث نصي.
- **الصلاحية:** عام (Public).
- **Query Parameters:**
  - `page` (number, default: 1, min: 1): رقم الصفحة.
  - `limit` (number, default: 12, max: 50): عدد العناصر بالصفحة.
  - `categoryId` (UUID): تصفية بمعرف التصنيف.
  - `slug` (string): تصفية بالـ slug الخاص بالتصنيف.
  - `isBestSeller` (boolean): `true` أو `false`.
  - `onSale` (boolean): تصفية اللوحات الخاضعة للتخفيض.
  - `search` (string): بحث نصي في `titleAr`, `titleEn`, `storyAr`, `storyEn`.
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "statusCode": 200,
    "data": {
      "items": [
        {
          "id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
          "titleAr": "همس الرمال",
          "titleEn": "Whisper of the Dunes",
          "storyAr": "قصة اللوحة وتفاصيل الإلهام خلفها...",
          "storyEn": "The story and inspiration behind the artwork...",
          "price": "3500.00",
          "discountPrice": "2800.00",
          "onSale": true,
          "quantity": 1,
          "isBestSeller": true,
          "status": "AVAILABLE",
          "category": {
            "id": "550e8400-e29b-41d4-a716-446655440000",
            "nameAr": "لوحات زيتية",
            "nameEn": "Oil Paintings",
            "slug": "oil-paintings"
          },
          "images": [
            {
              "id": "1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed",
              "url": "https://res.cloudinary.com/.../artwork1.webp",
              "publicId": "artworks/artwork1",
              "isPrimary": true
            }
          ],
          "createdAt": "2026-09-12T19:00:00.000Z",
          "updatedAt": "2026-09-12T19:00:00.000Z"
        }
      ],
      "meta": {
        "page": 1,
        "limit": 12,
        "total": 34,
        "totalPages": 3
      }
    },
    "message": "Request successful"
  }
  ```

#### `GET /api/v1/artworks/:id`
- **الوصف:** جلب تفاصيل لوحة كاملة مع تصنيفها وكافة صورها.
- **الصلاحية:** عام (Public).
- **Path Params:** `id` (UUID).
- **Response (200 OK):** كائن اللوحة الفنية.
- **أخطاء محتملة:** `404 Not Found`.

#### `POST /api/v1/artworks`
- **الوصف:** إنشاء لوحة فنية جديدة ورفع ما بين 1 إلى 5 صور مباشرة إلى Cloudinary.
- **الصلاحية:** 🔒 أدمن (`JwtAuthGuard`).
- **Content-Type:** `multipart/form-data`
- **Body Fields (Form Data):**
  - `titleAr` (string, required): عنوان اللوحة بالعربية.
  - `titleEn` (string, required): عنوان اللوحة بالإنجليزية.
  - `storyAr` (string, min 10 chars, required): القصة بالعربية.
  - `storyEn` (string, min 10 chars, required): القصة بالإنجليزية.
  - `price` (number, min 0.01, required): السعر الأساسي.
  - `discountPrice` (number, optional): سعر الخصم (يجب أن يكون أقل من السعر الأساسي).
  - `onSale` (boolean, optional, default: false): هل اللوحة خاضعة لتخفيض.
  - `quantity` (number, min 0, default: 1): الكمية المتوفرة.
  - `isBestSeller` (boolean, default: false): هل هي الأكثر مبيعاً.
  - `categoryId` (UUID, required): معرّف التصنيف.
  - `primaryImageIndex` (number, default: 0): فهرس الصورة الرئيسية من الصور المرفوعة.
  - `images` (File[], 1-5 files): ملفات الصور المرفوعة (jpg, png, webp، حد أقصى 5MB لكل صورة).
- **Response (201 Created):** كائن اللوحة الفنية بعد الحفظ وتوليد روابط Cloudinary.

#### `PATCH /api/v1/artworks/:id`
- **الوصف:** تعديل بيانات لوحة قائمة، مع إمكانية استبدال صورها بالكامل عند إرسال ملفات صور جديدة.
- **الصلاحية:** 🔒 أدمن (`JwtAuthGuard`).
- **Content-Type:** `multipart/form-data`
- **Path Params:** `id` (UUID).
- **Body Fields:** جميع حقول `CreateArtworkDto` اختيارية، مع حقل `images` اختياري.
- **Response (200 OK):** كائن اللوحة بعد التعديل.

#### `DELETE /api/v1/artworks/:id`
- **الوصف:** حذف لوحة فنية وحذف جميع ملفات صورها المرتبطة بها من Cloudinary تلقائياً.
- **الصلاحية:** 🔒 أدمن (`JwtAuthGuard`).
- **Path Params:** `id` (UUID).
- **Response (204 No Content)**
- **أخطاء محتملة:** `404 Not Found`.

---

### 4. موديول الطلبات والدفع (Orders)

#### `POST /api/v1/orders`
- **الوصف:** إنشاء طلب شراء لوحة أو أكثر، مع قفل المخزون وحساب الإجمالي وإنشاء معاملة Paymob.
- **الصلاحية:** عام (Public).
- **Content-Type:** `application/json`
- **Request Body:**
  ```json
  {
    "customerName": "سارة أحمد",
    "phone": "01012345678",
    "whatsappPhone": "01012345678",
    "email": "sara@example.com",
    "shippingAddress": "القاهرة - التجمع الخامس - حي النرجس - فيلا 12",
    "preferredDeliveryDate": "2026-09-25",
    "items": [
      {
        "artworkId": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
        "quantity": 1
      }
    ]
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "success": true,
    "statusCode": 201,
    "data": {
      "order": {
        "id": "e4eaaaf2-d142-11e1-b3e4-080027620cdd",
        "orderNumber": "ORD-2026-123456",
        "customerName": "سارة أحمد",
        "phone": "01012345678",
        "whatsappPhone": "01012345678",
        "email": "sara@example.com",
        "shippingAddress": "القاهرة - التجمع الخامس...",
        "totalAmount": "2800.00",
        "paymentStatus": "PENDING",
        "orderStatus": "PROCESSING",
        "paymobOrderId": "18928374",
        "createdAt": "2026-09-12T20:00:00.000Z"
      },
      "checkoutUrl": "https://accept.paymob.com/api/acceptance/iframes/12345?payment_token=..."
    },
    "message": "Request successful"
  }
  ```
- **أخطاء محتملة:**
  - `400 Bad Request` (اللوحة غير متوفرة أو الكمية المطلوبة غير كافية بالمخزون).
  - `404 Not Found` (معرّف اللوحة غير موجود).
  - `502 Bad Gateway` (إذا كانت إعدادات Paymob غير مهيأة بالـ `.env`).

#### `POST /api/v1/orders/webhook/paymob`
- **الوصف:** استقبال إشعار Webhook الفوري من Paymob بعد الدفع، والتحقق التام من توقيع HMAC SHA-512، وتحديث حالة الطلب إلى `PAID`.
- **الصلاحية:** 🟡 محمي عبر `PaymobHmacGuard`.
- **Content-Type:** `application/json`
- **Response (200 OK)**

#### `GET /api/v1/orders`
- **الوصف:** جلب طلبات الشراء للوحة التحكم مع إمكانية الفلترة وترقيم الصفحات.
- **الصلاحية:** 🔒 أدمن (`JwtAuthGuard`).
- **Query Parameters:**
  - `page` (number, default: 1): رقم الصفحة.
  - `limit` (number, default: 20, max: 100): عدد الطلبات بالصفحة.
  - `paymentStatus` (enum: `PENDING`, `PAID`, `FAILED`, `CANCELLED`).
  - `orderStatus` (enum: `PROCESSING`, `SHIPPED`, `DELIVERED`, `CANCELLED`).
- **Response (200 OK):** كائن يحتوي على `items` مصفوفة الطلبات و `meta` بيانات الترقيم.

#### `GET /api/v1/orders/:id`
- **الوصف:** جلب تفاصيل طلب محدد بالـ UUID مع بنود الطلب واللوحات المرتبطة بها.
- **الصلاحية:** 🔒 أدمن (`JwtAuthGuard`).
- **Path Params:** `id` (UUID).
- **Response (200 OK):** كائن الطلب الكامل.

#### `PATCH /api/v1/orders/:id/status`
- **الوصف:** تحديث مسار وحالة الطلب.
- **الصلاحية:** 🔒 أدمن (`JwtAuthGuard`).
- **Path Params:** `id` (UUID).
- **Request Body:**
  ```json
  {
    "orderStatus": "SHIPPED"
  }
  ```
  *(الخيارات المتاحة: `PROCESSING`, `SHIPPED`, `DELIVERED`, `CANCELLED`)*
- **Response (200 OK):** كائن الطلب المحدّث.

---

### 5. موديول الكورسات والورش (Courses)

#### `GET /api/v1/courses`
- **الوصف:** جلب قائمة الكورسات والورش الفنية الفعالة فقط (`isActive = true`) لواجهة الجمهور.
- **الصلاحية:** عام (Public).
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "statusCode": 200,
    "data": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "title": "أساسيات الرسم الزيتي وتناغم الألوان",
        "description": "دورة مكثفة تنقلك خطوة بخطوة من إعداد الكانفاس إلى إنجاز أول لوحة متكاملة.",
        "externalUrl": "https://courses.example.com/oil-painting-mastery",
        "isActive": true,
        "createdAt": "2026-09-12T19:30:00.000Z",
        "updatedAt": "2026-09-12T19:30:00.000Z"
      }
    ],
    "message": "Request successful"
  }
  ```

#### `GET /api/v1/courses/admin/all`
- **الوصف:** جلب كافة الكورسات المسجلة في النظام (الفعالة والمعطلة) للوحة الإدارة.
- **الصلاحية:** 🔒 أدمن (`JwtAuthGuard`).
- **Response (200 OK):** مصفوفة الكورسات الكاملة مرتبة من الأحدث إلى الأقدم.

#### `GET /api/v1/courses/:id`
- **الوصف:** جلب تفاصيل كورس محدد بناءً على الـ UUID.
- **الصلاحية:** عام (Public).
- **Path Params:** `id` (UUID).
- **Response (200 OK):** كائن الكورس.

#### `POST /api/v1/courses`
- **الوصف:** إضافة كورس فني جديد.
- **الصلاحية:** 🔒 أدمن (`JwtAuthGuard`).
- **Content-Type:** `application/json`
- **Request Body:**
  ```json
  {
    "title": "تقنيات الإضاءة والظلال في البورتريه",
    "description": "فهم فلسفة الضوء في بناء المشاعر الدرامية على الوجوه.",
    "externalUrl": "https://courses.example.com/portrait-lighting",
    "isActive": true
  }
  ```
- **شروط التحقق:**
  - `title`: نص، غير فارغ، حتى 180 حرفاً.
  - `description`: نص، غير فارغ.
  - `externalUrl`: رابط URL صالح يبدأ بـ `http://` أو `https://`.
  - `isActive`: قيمة منطقية (اختيارية، الافتراضي: `true`).
- **Response (201 Created):** كائن الكورس المنشأ.

#### `PATCH /api/v1/courses/:id`
- **الوصف:** تعديل بيانات الكورس الفني أو تغيير حالة التفعيل.
- **الصلاحية:** 🔒 أدمن (`JwtAuthGuard`).
- **Path Params:** `id` (UUID).
- **Request Body:** حقول اختيارية (`title`, `description`, `externalUrl`, `isActive`).
- **Response (200 OK):** كائن الكورس المحدث.

#### `DELETE /api/v1/courses/:id`
- **الوصف:** حذف كورس فني نهائياً من قاعدة البيانات.
- **الصلاحية:** 🔒 أدمن (`JwtAuthGuard`).
- **Path Params:** `id` (UUID).
- **Response (200 OK / 204 No Content)**

---

### 6. موديول طلبات اللوحات المخصصة (Client Requests)

#### `POST /api/v1/client-requests`
- **الوصف:** إرسال طلب تصميم لوحة خاصة، مع إمكانية رفع من 1 إلى 3 صور مرجعية يتم تخزينها في Cloudinary.
- **الصلاحية:** عام (Public).
- **Content-Type:** `multipart/form-data`
- **Body Fields:**
  - `email` (string, required): بريد العميل الإلكتروني.
  - `phone` (string, required, max 40): رقم الهاتف.
  - `whatsapp` (string, required, max 40): رقم الواتساب.
  - `description` (string, required, max 5000): وصف الفكرة والمقاس المطلوب والتفاصيل.
  - `images` (File[], 1-3 files, required): صور مرجعية (حد أقصى 5MB لكل صورة).
- **Response (201 Created):**
  ```json
  {
    "success": true,
    "statusCode": 201,
    "data": {
      "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
      "email": "client@example.com",
      "phone": "+201011122233",
      "whatsapp": "+201011122233",
      "description": "أرغب برسم لوحة زيتية بقياس 120x80 سم مستوحاة من طبيعة واحة سيوة...",
      "status": "NEW",
      "images": [
        {
          "url": "https://res.cloudinary.com/.../ref1.webp",
          "publicId": "client-requests/ref1"
        }
      ],
      "createdAt": "2026-09-12T20:15:00.000Z"
    },
    "message": "Request successful"
  }
  ```

#### `GET /api/v1/client-requests`
- **الوصف:** استعراض جميع طلبات العملاء الخاصة المسجلة في النظام مرتبة من الأحدث.
- **الصلاحية:** 🔒 أدمن (`JwtAuthGuard`).
- **Response (200 OK):** مصفوفة طلبات العملاء.

---

### 7. موديول محتوى الموقع (Content)

#### `GET /api/v1/content/site-info`
- **الوصف:** جلب محتوى الأقسام العامة للموقع (Hero, About, Contact) مع الصور والنصوص ثنائية اللغة.
- **الصلاحية:** عام (Public).
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "statusCode": 200,
    "data": {
      "hero": {
        "titleAr": "فنٌ أصيل، ومشاعرٌ تدوم",
        "titleEn": "Original Art, Lasting Emotion",
        "subtitleAr": "اكتشف عالماً مرسوماً بالشغف والإحساس الرفيع.",
        "subtitleEn": "Discover a world painted with feeling.",
        "imageUrl": "https://res.cloudinary.com/.../hero.webp"
      },
      "about": {
        "titleAr": "عن المرسم والفنان",
        "titleEn": "About the Atelier & Artist",
        "bioAr": "فنان تشكيلي يستلهم أعماله من الذاكرة والضوء والتواصل الإنساني...",
        "bioEn": "A visual artist inspired by memory, light, and human connection...",
        "image1Url": "https://res.cloudinary.com/.../artist-studio.webp",
        "image2Url": "https://res.cloudinary.com/.../artist-portrait.webp"
      },
      "contact": {
        "titleAr": "تواصل معنا",
        "titleEn": "Get in Touch",
        "descriptionAr": "للاستفسارات والطلبات الخاصة واقتناء الأعمال.",
        "descriptionEn": "For inquiries, commissions, and acquisitions.",
        "phone": "+201000000000",
        "whatsapp": "https://wa.me/201000000000",
        "email": "anasya3qub@example.com",
        "socialLinks": {
          "instagram": "https://instagram.com/anasya3qub",
          "facebook": "https://facebook.com/anasya3qub"
        }
      }
    },
    "message": "Request successful"
  }
  ```

#### `PUT /api/v1/content/:sectionKey`
- **الوصف:** تحديث أو إنشاء محتوى قسم محدد (`hero`, `about`, `contact`).
- **الصلاحية:** 🔒 أدمن (`JwtAuthGuard`).
- **Path Params:** `sectionKey` (إما `hero` أو `about` أو `contact`).
- **Content-Type:** `application/json`
- **نماذج البيانات لكل قسم:**
  - **إذا كان `sectionKey = hero`:**
    ```json
    {
      "titleAr": "فنٌ أصيل، ومشاعرٌ تدوم",
      "titleEn": "Original Art, Lasting Emotion",
      "subtitleAr": "اكتشف عالماً مرسوماً بالشغف والإحساس الرفيع.",
      "subtitleEn": "Discover a world painted with feeling.",
      "imageUrl": "https://res.cloudinary.com/.../hero.webp"
    }
    ```
  - **إذا كان `sectionKey = about`:**
    ```json
    {
      "titleAr": "عن المرسم",
      "titleEn": "About the Atelier",
      "bioAr": "سيرة الفنان بالعربية...",
      "bioEn": "Artist biography in English...",
      "image1Url": "https://res.cloudinary.com/.../about1.webp",
      "image2Url": "https://res.cloudinary.com/.../about2.webp"
    }
    ```
  - **إذا كان `sectionKey = contact`:**
    ```json
    {
      "titleAr": "تواصل معنا",
      "titleEn": "Get in Touch",
      "descriptionAr": "للاستفسارات والطلبات الخاصة...",
      "descriptionEn": "For inquiries and commissions...",
      "phone": "+201000000000",
      "whatsapp": "+201000000000",
      "email": "artist@example.com",
      "socialLinks": {
        "instagram": "https://instagram.com/artist"
      }
    }
    ```
- **Response (200 OK):** كائن القسم المحدّث.

#### `POST /api/v1/content/upload-image`
- **الوصف:** رفع صورة مخصصة لأحد أقسام الموقع إلى Cloudinary والحصول على رابطها المباشر.
- **الصلاحية:** 🔒 أدمن (`JwtAuthGuard`).
- **Content-Type:** `multipart/form-data`
- **Body:** `file` (صورة وحيدة، jpg/png/webp، حد أقصى 5MB).
- **Response (201 Created):**
  ```json
  {
    "success": true,
    "statusCode": 201,
    "data": {
      "secureUrl": "https://res.cloudinary.com/.../image.webp",
      "publicId": "site-content/abc123xyz"
    },
    "message": "Request successful"
  }
  ```

---

## 💻 نماذج استدعاء سريعة (cURL Examples)

### 1. تسجيل الدخول والحصول على التوكن:
```bash
curl -X POST http://localhost:3005/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin-test@example.com","password":"AdminTest12345!"}'
```

### 2. جلب الأعمال الفنية مع التصفية والبحث:
```bash
curl -X GET "http://localhost:3005/api/v1/artworks?page=1&limit=12&search=%D8%BA%D8%B1%D9%88%D8%A8"
```

### 3. إنشاء طلب شراء جديد (Checkout):
```bash
curl -X POST http://localhost:3005/api/v1/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "أحمد محمود",
    "phone": "01001234567",
    "shippingAddress": "الإسكندرية - سموحة",
    "items": [{"artworkId": "YOUR_ARTWORK_UUID", "quantity": 1}]
  }'
```

### 4. إضافة كورس جديد (أدمن):
```bash
curl -X POST http://localhost:3005/api/v1/courses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "دورة الرسم الرقمي",
    "description": "تعلم تقنيات الدمج والفرش الرقمية.",
    "externalUrl": "https://example.com/digital-art"
  }'
```
