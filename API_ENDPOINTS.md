# 📚 Art Gallery API — دليل ونقاط النهاية الكاملة (Complete API Endpoints)

> **البيئة الحية (Live Production URL):** `https://art-gallery-infa.vercel.app`  
> **البادئة العامة (Base API v1 URL):** `https://art-gallery-infa.vercel.app/api/v1`  
> **توثيق Swagger التفاعلي (Interactive Docs):** [https://art-gallery-infa.vercel.app/api/docs](https://art-gallery-infa.vercel.app/api/docs)  
> **الحالة (Status):** 🟢 متصل بالإنتاج وقاعدة بيانات Neon بنجاح.

---

## 📑 الفهرس (Table of Contents)
1. [المعايير العامة للـ API (General Standards)](#-المعايير-العامة-للـ-api)
   - [هيكل الاستجابة الناجحة (Success Response)](#هيكل-الاستجابة-الناجحة-successresponse)
   - [هيكل استجابة الخطأ (Error Response)](#هيكل-استجابة-الخطأ-errorresponse)
   - [المصادقة والأمان (Authentication & Security)](#المصادقة-والأمان-auth)
2. [جدول ملخص لكافة الـ Endpoints (26 مساراً)](#-جدول-ملخص-لكافة-نقاط-النهاية)
3. [التفاصيل الكاملة لكل Endpoint حسب الموديول](#-التفاصيل-الشاملة-لكل-موديول)
   - [1. موديول المصادقة (Authentication)](#1-موديول-المصادقة-auth)
   - [2. موديول التصنيفات (Categories)](#2-موديول-التصنيفات-categories)
   - [3. موديول الأعمال الفنية (Artworks)](#3-موديول-الأعمال-الفنية-artworks)
   - [4. موديول الطلبات والدفع (Orders & Paymob)](#4-موديول-الطلبات-والدفع-orders)
   - [5. موديول الكورسات والورش (Courses)](#5-موديول-الكورسات-والورش-courses)
   - [6. موديول طلبات اللوحات المخصصة (Client Requests)](#6-موديول-طلبات-اللوحات-المخصصة-client-requests)
   - [7. موديول محتوى الموقع (Content & CMS)](#7-موديول-محتوى-الموقع-content)
4. [أمثلة برمجية للربط من الـ Frontend (JavaScript / Axios)](#-أمثلة-برمجية-للربط-frontend-integration)

---

## 🌐 المعايير العامة للـ API

### هيكل الاستجابة الناجحة (`SuccessResponse<T>`)
جميع الاستجابات الناجحة تغلف تلقائياً عبر `TransformInterceptor`:
```json
{
  "success": true,
  "statusCode": 200,
  "data": { ... },
  "message": "Request successful"
}
```

### هيكل استجابة الخطأ (`HttpExceptionFilter`)
تتم معالجة جميع الأخطاء وتوحيدها عبر `HttpExceptionFilter`:
```json
{
  "success": false,
  "statusCode": 400,
  "timestamp": "2026-09-13T10:15:00.000Z",
  "path": "/api/v1/...",
  "message": "Validation failed / Entity not found / etc.",
  "details": "Bad Request"
}
```

### المصادقة والأمان (Auth)
- **المسارات المحمية للإدارة (`Admin`):** تتطلب إرسال الـ JWT في الـ Header كالتالي:
  ```http
  Authorization: Bearer <ACCESS_TOKEN>
  ```
- **Webhook بوابة الدفع (`Paymob`):** محمي بواسطة التحقق من توقيع HMAC SHA-512 عبر حارس `PaymobHmacGuard`.

---

## 📋 جدول ملخص لكافة نقاط النهاية (26 Endpoints)

| # | الطريقة | المسار النسبي (Path) | الرابط المباشر الكامل (Live Full URL) | الصلاحية (Auth) | الوصف المختصر | الحالة المجرّبة |
|---|---|---|---|---|---|---|
| 1 | `POST` | `/api/v1/auth/login` | `https://art-gallery-infa.vercel.app/api/v1/auth/login` | 🟢 عام (Public) | تسجيل دخول الأدمن واستلام JWT Token | ✅ تم الفحص |
| 2 | `GET` | `/api/v1/categories` | `https://art-gallery-infa.vercel.app/api/v1/categories` | 🟢 عام (Public) | جلب جميع تصنيفات اللوحات مرتبة | ✅ تم التحقق لايف (200 OK) |
| 3 | `POST` | `/api/v1/categories` | `https://art-gallery-infa.vercel.app/api/v1/categories` | 🔴 أدمن (JWT) | إنشاء تصنيف فني جديد | ✅ متاح ومحمي |
| 4 | `DELETE` | `/api/v1/categories/:id` | `https://art-gallery-infa.vercel.app/api/v1/categories/:id` | 🔴 أدمن (JWT) | حذف تصنيف (شرط خلوه من اللوحات) | ✅ متاح ومحمي |
| 5 | `GET` | `/api/v1/artworks/home-featured` | `https://art-gallery-infa.vercel.app/api/v1/artworks/home-featured` | 🟢 عام (Public) | جلب 6 لوحات مميزة عشوائية للرئيسية | ✅ تم التحقق لايف (200 OK) |
| 6 | `GET` | `/api/v1/artworks` | `https://art-gallery-infa.vercel.app/api/v1/artworks` | 🟢 عام (Public) | تصفح وبحث وفلترة وترقيم اللوحات | ✅ تم التحقق لايف (200 OK) |
| 7 | `GET` | `/api/v1/artworks/:id` | `https://art-gallery-infa.vercel.app/api/v1/artworks/:id` | 🟢 عام (Public) | جلب تفاصيل لوحة مع صورها بالـ UUID | ✅ متاح للعامة |
| 8 | `POST` | `/api/v1/artworks` | `https://art-gallery-infa.vercel.app/api/v1/artworks` | 🔴 أدمن (JWT) | إضافة لوحة مع رفع حتى 5 صور إلى Cloudinary | ✅ متاح ومحمي |
| 9 | `PATCH` | `/api/v1/artworks/:id` | `https://art-gallery-infa.vercel.app/api/v1/artworks/:id` | 🔴 أدمن (JWT) | تعديل بيانات لوحة أو استبدال صورها | ✅ متاح ومحمي |
| 10 | `DELETE` | `/api/v1/artworks/:id` | `https://art-gallery-infa.vercel.app/api/v1/artworks/:id` | 🔴 أدمن (JWT) | حذف لوحة وصورها السحابية | ✅ متاح ومحمي |
| 11 | `POST` | `/api/v1/orders` | `https://art-gallery-infa.vercel.app/api/v1/orders` | 🟢 عام (Public) | إنشاء طلب شراء وحجز كمية وتوليد Paymob Iframe | ✅ متاح للعامة |
| 12 | `POST` | `/api/v1/orders/webhook/paymob` | `https://art-gallery-infa.vercel.app/api/v1/orders/webhook/paymob` | 🟡 Paymob HMAC | استقبال وتأكيد الدفع التلقائي من Paymob | ✅ متاح مع HMAC |
| 13 | `GET` | `/api/v1/orders` | `https://art-gallery-infa.vercel.app/api/v1/orders` | 🔴 أدمن (JWT) | استعراض طلبات الشراء بفلترة وترقيم | ✅ متاح ومحمي |
| 14 | `GET` | `/api/v1/orders/:id` | `https://art-gallery-infa.vercel.app/api/v1/orders/:id` | 🔴 أدمن (JWT) | تفاصيل طلب محدد ببنوده وتفاصيل العميل | ✅ متاح ومحمي |
| 15 | `PATCH` | `/api/v1/orders/:id/status` | `https://art-gallery-infa.vercel.app/api/v1/orders/:id/status` | 🔴 أدمن (JWT) | تحديث حالة الطلب (PROCESSING, SHIPPED, ...) | ✅ متاح ومحمي |
| 16 | `GET` | `/api/v1/courses` | `https://art-gallery-infa.vercel.app/api/v1/courses` | 🟢 عام (Public) | جلب الكورسات والورش الفنية المفعلة | ✅ تم التحقق لايف (200 OK) |
| 17 | `GET` | `/api/v1/courses/admin/all` | `https://art-gallery-infa.vercel.app/api/v1/courses/admin/all` | 🔴 أدمن (JWT) | جلب كافة الكورسات (المفعلة وغير المفعلة) | ✅ متاح ومحمي |
| 18 | `GET` | `/api/v1/courses/:id` | `https://art-gallery-infa.vercel.app/api/v1/courses/:id` | 🟢 عام (Public) | جلب بيانات كورس محدد | ✅ متاح للعامة |
| 19 | `POST` | `/api/v1/courses` | `https://art-gallery-infa.vercel.app/api/v1/courses` | 🔴 أدمن (JWT) | إضافة كورس جديد (مع فيديو ترحيبي اختياري) | ✅ متاح ومحمي |
| 20 | `PATCH` | `/api/v1/courses/:id` | `https://art-gallery-infa.vercel.app/api/v1/courses/:id` | 🔴 أدمن (JWT) | تعديل بيانات أو تفعيل كورس فني | ✅ متاح ومحمي |
| 21 | `DELETE` | `/api/v1/courses/:id` | `https://art-gallery-infa.vercel.app/api/v1/courses/:id` | 🔴 أدمن (JWT) | حذف كورس نهائياً | ✅ متاح ومحمي |
| 22 | `POST` | `/api/v1/client-requests` | `https://art-gallery-infa.vercel.app/api/v1/client-requests` | 🟢 عام (Public) | إرسال طلب لوحة مخصصة مع حتى 5 صور مرجعية | ✅ متاح للعامة |
| 23 | `GET` | `/api/v1/client-requests` | `https://art-gallery-infa.vercel.app/api/v1/client-requests` | 🔴 أدمن (JWT) | استعراض طلبات العملاء الخاصة | ✅ متاح ومحمي |
| 24 | `GET` | `/api/v1/content/site-info` | `https://art-gallery-infa.vercel.app/api/v1/content/site-info` | 🟢 عام (Public) | جلب محتوى الموقع (Hero, About, Contact) | ✅ تم التحقق لايف (200 OK) |
| 25 | `PUT` | `/api/v1/content/:sectionKey` | `https://art-gallery-infa.vercel.app/api/v1/content/:sectionKey` | 🔴 أدمن (JWT) | تحديث قسم محتوى (hero / about / contact) | ✅ متاح ومحمي |
| 26 | `POST` | `/api/v1/content/upload-image` | `https://art-gallery-infa.vercel.app/api/v1/content/upload-image` | 🔴 أدمن (JWT) | رفع صورة لقسم محتوى إلى Cloudinary | ✅ متاح ومحمي |

---

## 🔍 التفاصيل الشاملة لكل موديول

---

### 1. موديول المصادقة (Auth)

#### `POST https://art-gallery-infa.vercel.app/api/v1/auth/login`
- **الوصف:** تسجيل دخول المشرف (Admin) واستلام رمز JWT Access Token.
- **الصلاحية:** 🟢 عام (Public).
- **الهيدرز المطلوبة:** `Content-Type: application/json`
- **Request Body:**
  ```json
  {
    "email": "admin@example.com",
    "password": "YourAdminPassword123!"
  }
  ```
- **شروط التحقق (Validation Rules):**
  - `email`: صيغة بريد إلكتروني صحيحة، غير فارغ.
  - `password`: نص غير فارغ.
- **Response (201 Created):**
  ```json
  {
    "success": true,
    "statusCode": 201,
    "data": {
      "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    },
    "message": "Request successful"
  }
  ```
- **أخطاء محتملة:** `401 Unauthorized` (Invalid email or password).

---

### 2. موديول التصنيفات (Categories)

#### `GET https://art-gallery-infa.vercel.app/api/v1/categories`
- **الوصف:** جلب كافة تصنيفات اللوحات المتاحة في المعرض مرتبة أبجدياً.
- **الصلاحية:** 🟢 عام (Public).
- **Response (200 OK) - [تم اختباره مباشرة على Neon]:**
  ```json
  {
    "success": true,
    "statusCode": 200,
    "data": [
      {
        "id": "848587b2-804c-439c-8f36-60a91c22a1a2",
        "nameAr": "كلاسيك",
        "nameEn": "Classic",
        "slug": "classic",
        "createdAt": "2026-09-13T10:04:50.570Z",
        "updatedAt": "2026-09-13T10:09:22.755Z"
      },
      {
        "id": "b3a96920-49fe-4913-a0a6-39d044b4ed6f",
        "nameAr": "إصدارات محدودة",
        "nameEn": "Limited Edition",
        "slug": "limited-edition",
        "createdAt": "2026-09-13T10:04:50.570Z",
        "updatedAt": "2026-09-13T10:09:22.755Z"
      },
      {
        "id": "5c94c0e1-de9f-4c99-8f7a-a4ca51b5691d",
        "nameAr": "أصلية",
        "nameEn": "Original",
        "slug": "original",
        "createdAt": "2026-09-13T10:04:50.570Z",
        "updatedAt": "2026-09-13T10:09:22.755Z"
      },
      {
        "id": "138eeff5-40a5-4835-846e-8ce3bf096710",
        "nameAr": "مطبوعات",
        "nameEn": "Printed",
        "slug": "printed",
        "createdAt": "2026-09-13T10:04:50.570Z",
        "updatedAt": "2026-09-13T10:09:22.755Z"
      }
    ],
    "message": "Request successful"
  }
  ```

#### `POST https://art-gallery-infa.vercel.app/api/v1/categories`
- **الوصف:** إنشاء تصنيف جديد للأعمال الفنية.
- **الصلاحية:** 🔴 أدمن (`Authorization: Bearer <access_token>`).
- **Content-Type:** `application/json`
- **Request Body:**
  ```json
  {
    "nameAr": "لوحات تجريدية",
    "nameEn": "Abstract Art",
    "slug": "abstract-art"
  }
  ```
- **شروط التحقق:**
  - `nameAr`: نص حتى 120 حرفاً.
  - `nameEn`: نص حتى 120 حرفاً.
  - `slug`: مطابق للنمط `/^[a-z0-9]+(?:-[a-z0-9]+)*$/` وفريد (Unique).
- **Response (201 Created):** كائن التصنيف المنشأ.

#### `DELETE https://art-gallery-infa.vercel.app/api/v1/categories/:id`
- **الوصف:** حذف تصنيف بناءً على الـ UUID. (إذا كان التصنيف يحتوي على لوحات، يتم رفض الحذف لحماية ترابط البيانات).
- **الصلاحية:** 🔴 أدمن (`Authorization: Bearer <access_token>`).
- **Response:** `204 No Content`

---

### 3. موديول الأعمال الفنية (Artworks)

#### `GET https://art-gallery-infa.vercel.app/api/v1/artworks/home-featured`
- **الوصف:** جلب 6 لوحات مميزة عشوائياً للواجهة الرئيسية.
- **الصلاحية:** 🟢 عام (Public).
- **Response (200 OK) - [تم اختباره مباشرة]:**
  ```json
  {
    "success": true,
    "statusCode": 200,
    "data": [],
    "message": "Request successful"
  }
  ```

#### `GET https://art-gallery-infa.vercel.app/api/v1/artworks`
- **الوصف:** استعراض اللوحات الفنية مع خيارات الفلترة المتقدمة وترقيم الصفحات والبحث.
- **الصلاحية:** 🟢 عام (Public).
- **Query Parameters (اختيارية):**
  - `page` (number, default: 1): رقم الصفحة.
  - `limit` (number, default: 12, max: 100): عدد العناصر في الصفحة.
  - `categoryId` (UUID): فلترة بمعرف تصنيف معين.
  - `slug` (string): فلترة بالـ slug الخاص بالتصنيف (مثل `original`).
  - `isBestSeller` (boolean): `true` أو `false`.
  - `onSale` (boolean): اللوحات المخفضة فقط.
  - `search` (string): بحث بالكلمات في العناوين والقصص.
- **Response (200 OK) - [تم اختباره مباشرة]:**
  ```json
  {
    "success": true,
    "statusCode": 200,
    "data": {
      "items": [],
      "meta": {
        "page": 1,
        "limit": 12,
        "total": 0,
        "totalPages": 0
      }
    },
    "message": "Request successful"
  }
  ```

#### `GET https://art-gallery-infa.vercel.app/api/v1/artworks/:id`
- **الوصف:** جلب بيانات لوحة فنية مفصلة مع جميع صورها وتصنيفها بالـ UUID.
- **الصلاحية:** 🟢 عام (Public).
- **Path Params:** `id` (UUID).

#### `POST https://art-gallery-infa.vercel.app/api/v1/artworks`
- **الوصف:** إضافة لوحة فنية جديدة مع رفع من 1 إلى 5 صور مباشرة إلى Cloudinary.
- **الصلاحية:** 🔴 أدمن (`Authorization: Bearer <access_token>`).
- **Content-Type:** `multipart/form-data`
- **Body Fields (Form Data):**
  - `titleAr` (string, required): اسم اللوحة بالعربية.
  - `titleEn` (string, optional): اسم اللوحة بالإنجليزية.
  - `storyAr` (string, required, min 5 chars): قصة اللوحة وتفاصيلها بالعربية.
  - `storyEn` (string, optional): قصة اللوحة بالإنجليزية.
  - `price` (number, required, positive): السعر الأساسي.
  - `discountPrice` (number, optional): سعر بعد الخصم.
  - `onSale` (boolean, optional, default: false): هل يوجد تخفيض.
  - `quantity` (number, optional, default: 1): الكمية بالمخزن.
  - `isBestSeller` (boolean, optional, default: false): الأكثر مبيعاً.
  - `categoryId` (UUID, required): معرّف التصنيف الفني.
  - `primaryImageIndex` (number, optional, default: 0): فهرس الصورة الرئيسية.
  - `images` (Files, required, 1-5 files): ملفات الصور (jpg, png, webp، حد أقصى 5MB لكل صورة).
- **Response (201 Created):** كائن اللوحة مع مصفوفة الصور وروابط Cloudinary السريعة.

#### `PATCH https://art-gallery-infa.vercel.app/api/v1/artworks/:id`
- **الوصف:** تعديل بيانات لوحة فنية أو استبدال صورها السحابية.
- **الصلاحية:** 🔴 أدمن (`Authorization: Bearer <access_token>`).
- **Content-Type:** `multipart/form-data`
- **Body Fields:** حقول اختيارية مطابقة لـ `CreateArtworkDto`، مع حقل `images` اختياري لاستبدال الصور القديمة.

#### `DELETE https://art-gallery-infa.vercel.app/api/v1/artworks/:id`
- **الوصف:** حذف لوحة فنية وحذف جميع ملفات صورها السحابية تلقائياً من Cloudinary.
- **الصلاحية:** 🔴 أدمن (`Authorization: Bearer <access_token>`).
- **Response:** `204 No Content`

---

### 4. موديول الطلبات والدفع (Orders)

#### `POST https://art-gallery-infa.vercel.app/api/v1/orders`
- **الوصف:** إنشاء طلب شراء لوحة أو أكثر، مع حجز المخزون وتوليد رابط الدفع الإلكتروني عبر بوابة Paymob.
- **الصلاحية:** 🟢 عام (Public).
- **Content-Type:** `application/json`
- **Request Body:**
  ```json
  {
    "customerName": "سارة أحمد",
    "phone": "01012345678",
    "whatsappPhone": "01012345678",
    "email": "sara@example.com",
    "shippingAddress": "القاهرة - التجمع الخامس - فيلا 12",
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
        "shippingAddress": "القاهرة...",
        "totalAmount": "2800.00",
        "paymentStatus": "PENDING",
        "orderStatus": "PROCESSING",
        "createdAt": "2026-09-13T10:00:00.000Z"
      },
      "checkoutUrl": "https://accept.paymob.com/api/acceptance/iframes/12345?payment_token=..."
    },
    "message": "Request successful"
  }
  ```

#### `POST https://art-gallery-infa.vercel.app/api/v1/orders/webhook/paymob`
- **الوصف:** استقبال إشعار Webhook الفوري وتأكيد المعاملة تلقائياً من Paymob.
- **الصلاحية:** 🟡 توقيع HMAC SHA-512 من Paymob.
- **Response:** `200 OK`

#### `GET https://art-gallery-infa.vercel.app/api/v1/orders`
- **الوصف:** جلب قائمة الطلبات للوحة التحكم الإدارية مع الفلترة والترقيم.
- **الصلاحية:** 🔴 أدمن (`Authorization: Bearer <access_token>`).
- **Query Params:**
  - `page` (number, default: 1)
  - `limit` (number, default: 20, max: 100)
  - `paymentStatus` (`PENDING`, `PAID`, `FAILED`, `CANCELLED`)
  - `orderStatus` (`PROCESSING`, `SHIPPED`, `DELIVERED`, `CANCELLED`)

#### `GET https://art-gallery-infa.vercel.app/api/v1/orders/:id`
- **الوصف:** جلب تفاصيل طلب محدد بالـ UUID مع بنود الطلب واللوحات المرتبطة.
- **الصلاحية:** 🔴 أدمن (`Authorization: Bearer <access_token>`).

#### `PATCH https://art-gallery-infa.vercel.app/api/v1/orders/:id/status`
- **الوصف:** تحديث حالة تنفيذ الطلب والشحن.
- **الصلاحية:** 🔴 أدمن (`Authorization: Bearer <access_token>`).
- **Request Body:**
  ```json
  {
    "orderStatus": "SHIPPED"
  }
  ```
  *(الحالات المتاحة: `PROCESSING`, `SHIPPED`, `DELIVERED`, `CANCELLED`)*

---

### 5. موديول الكورسات والورش (Courses)

#### `GET https://art-gallery-infa.vercel.app/api/v1/courses`
- **الوصف:** جلب الكورسات والورش الفنية المفعلة فقط (`isActive = true`) لجمهور الموقع.
- **الصلاحية:** 🟢 عام (Public).
- **Response (200 OK) - [تم اختباره مباشرة]:**
  ```json
  {
    "success": true,
    "statusCode": 200,
    "data": [],
    "message": "Request successful"
  }
  ```

#### `GET https://art-gallery-infa.vercel.app/api/v1/courses/admin/all`
- **الوصف:** جلب جميع الكورسات (المفعلة وغير المفعلة) للوحة تحكم المشرف.
- **الصلاحية:** 🔴 أدمن (`Authorization: Bearer <access_token>`).

#### `GET https://art-gallery-infa.vercel.app/api/v1/courses/:id`
- **الوصف:** جلب بيانات كورس محدد بالـ UUID.
- **الصلاحية:** 🟢 عام (Public).

#### `POST https://art-gallery-infa.vercel.app/api/v1/courses`
- **الوصف:** إضافة كورس فني جديد مع رابط التسجيل الخارجي، ورفع فيديو ترحيبي اختياري (أو توفير رابط فيديو).
- **الصلاحية:** 🔴 أدمن (`Authorization: Bearer <access_token>`).
- **Content-Type:** `application/json` أو `multipart/form-data`
- **الحقول:**
  - `title` (string, required, max 180): عنوان الكورس.
  - `description` (string, required): وصف الكورس ومحاوره.
  - `externalUrl` (string, URL, required): رابط صفحة الكورس الخارجية أو التسجيل.
  - `isActive` (boolean, optional, default: true): هل الكورس مفعل للجمهور.
  - `welcomeVideoUrl` (string, URL, optional): رابط فيديو ترحيبي.
  - `video` (File, optional): ملف فيديو حتى 50MB يُرفع لـ Cloudinary.

#### `PATCH https://art-gallery-infa.vercel.app/api/v1/courses/:id`
- **الوصف:** تعديل بيانات كورس أو تغيير حالة التفعيل أو استبدال الفيديو.
- **الصلاحية:** 🔴 أدمن (`Authorization: Bearer <access_token>`).

#### `DELETE https://art-gallery-infa.vercel.app/api/v1/courses/:id`
- **الوصف:** حذف كورس فني نهائياً من النظام.
- **الصلاحية:** 🔴 أدمن (`Authorization: Bearer <access_token>`).

---

### 6. موديول طلبات اللوحات المخصصة (Client Requests)

#### `POST https://art-gallery-infa.vercel.app/api/v1/client-requests`
- **الوصف:** استقبال طلب رسم لوحة خاصة من عميل، مع إمكانية إرفاق حتى 5 صور مرجعية يتم رفعها لـ Cloudinary.
- **الصلاحية:** 🟢 عام (Public).
- **Content-Type:** `multipart/form-data`
- **Body Fields:**
  - `phone` (string, required): رقم الهاتف للتواصل.
  - `description` (string, required, max 5000): شرح اللوحة والمقاس والمطلوب.
  - `name` (string, optional): اسم العميل.
  - `email` (string, email, optional): بريد العميل.
  - `whatsapp` (string, optional): رقم الواتساب.
  - `images` (Files, optional, up to 5 files): صور مرجعية أو أفكار ملهمة (حد أقصى 5MB لكل صورة).
- **Response (201 Created):** كائن الطلب بعد الحفظ وتوليد معرّف المعاملة وروابط الصور.

#### `GET https://art-gallery-infa.vercel.app/api/v1/client-requests`
- **الوصف:** استعراض جميع طلبات اللوحات المخصصة الواردة من العملاء.
- **الصلاحية:** 🔴 أدمن (`Authorization: Bearer <access_token>`).

---

### 7. موديول محتوى الموقع (Content)

#### `GET https://art-gallery-infa.vercel.app/api/v1/content/site-info`
- **الوصف:** جلب محتوى الأقسام العامة للموقع (Hero, About, Contact) ثنائية اللغة لزوار الموقع.
- **الصلاحية:** 🟢 عام (Public).
- **Response (200 OK) - [تم اختباره مباشرة]:**
  ```json
  {
    "success": true,
    "statusCode": 200,
    "data": {
      "hero": null,
      "about": null,
      "contact": null
    },
    "message": "Request successful"
  }
  ```

#### `PUT https://art-gallery-infa.vercel.app/api/v1/content/:sectionKey`
- **الوصف:** تعديل أو إنشاء محتوى قسم محدد في الموقع (`hero`, `about`, `contact`).
- **الصلاحية:** 🔴 أدمن (`Authorization: Bearer <access_token>`).
- **Path Params:** `sectionKey` (`hero` أو `about` أو `contact`).
- **Request Bodies حسب القسم:**
  - **قسم الـ Hero (`sectionKey = hero`):**
    ```json
    {
      "titleAr": "فنٌ أصيل، ومشاعرٌ تدوم",
      "titleEn": "Original Art, Lasting Emotion",
      "subtitleAr": "اكتشف عالماً مرسوماً بالشغف والإحساس الرفيع.",
      "subtitleEn": "Discover a world painted with feeling.",
      "imageUrl": "https://res.cloudinary.com/.../hero.webp"
    }
    ```
  - **قسم عن الفنان والمشغل (`sectionKey = about`):**
    ```json
    {
      "titleAr": "عن المرسم والفنان",
      "titleEn": "About the Atelier & Artist",
      "bioAr": "فنان تشكيلي يستلهم أعماله من الذاكرة والضوء...",
      "bioEn": "A visual artist inspired by memory and light...",
      "image1Url": "https://res.cloudinary.com/.../studio.webp",
      "image2Url": "https://res.cloudinary.com/.../artist.webp"
    }
    ```
  - **قسم التواصل (`sectionKey = contact`):**
    ```json
    {
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
    ```

#### `POST https://art-gallery-infa.vercel.app/api/v1/content/upload-image`
- **الوصف:** رفع صورة لأقسام الموقع إلى Cloudinary والحصول على رابطها المباشر.
- **الصلاحية:** 🔴 أدمن (`Authorization: Bearer <access_token>`).
- **Content-Type:** `multipart/form-data`
- **Body:** `file` (صورة وحيدة، حد أقصى 5MB).
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

## 💻 أمثلة برمجية للربط (Frontend Integration)

### مثال 1: ضبط عميل Axios للـ Frontend (React / Next.js / Vue)

```typescript
// src/services/api.ts
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: 'https://art-gallery-infa.vercel.app/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// إرفاق توكن الأدمن تلقائياً في الطلبات المحمية
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### مثال 2: جلب التصنيفات والأعمال الفنية (Fetch Examples)

```typescript
// جلب التصنيفات
export async function getCategories() {
  const res = await fetch('https://art-gallery-infa.vercel.app/api/v1/categories');
  const json = await res.json();
  return json.data; // مصفوفة التصنيفات
}

// تصفح الأعمال الفنية مع التصفية
export async function getArtworks(page = 1, categorySlug?: string) {
  const params = new URLSearchParams({ page: String(page), limit: '12' });
  if (categorySlug) params.append('slug', categorySlug);

  const res = await fetch(`https://art-gallery-infa.vercel.app/api/v1/artworks?${params}`);
  const json = await res.json();
  return json.data; // { items: [...], meta: { page, total, ... } }
}
```

### مثال 3: تسجيل دخول الأدمن وتخزين التوكن

```typescript
export async function adminLogin(email: string, password: string) {
  const res = await fetch('https://art-gallery-infa.vercel.app/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const json = await res.json();
  if (json.success && json.data.access_token) {
    localStorage.setItem('access_token', json.data.access_token);
    return json.data.access_token;
  }
  throw new Error(json.message || 'فشل تسجيل الدخول');
}
```

### مثال 4: إنشاء طلب شراء (Checkout)

```typescript
export async function createCheckoutOrder(orderData: {
  customerName: string;
  phone: string;
  shippingAddress: string;
  artworkId: string;
  quantity: number;
}) {
  const res = await fetch('https://art-gallery-infa.vercel.app/api/v1/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customerName: orderData.customerName,
      phone: orderData.phone,
      shippingAddress: orderData.shippingAddress,
      items: [
        { artworkId: orderData.artworkId, quantity: orderData.quantity }
      ]
    }),
  });

  const json = await res.json();
  if (json.success && json.data.checkoutUrl) {
    // التوجيه المباشر لصفحة دفع Paymob
    window.location.href = json.data.checkoutUrl;
  }
  return json;
}
```

---

## ⚡ أوامر cURL لاختبار سريع من الـ Terminal

### 1. جلب التصنيفات:
```bash
curl -X GET "https://art-gallery-infa.vercel.app/api/v1/categories"
```

### 2. جلب اللوحات الفنية المميزة للصفحة الرئيسية:
```bash
curl -X GET "https://art-gallery-infa.vercel.app/api/v1/artworks/home-featured"
```

### 3. تصفح اللوحات مع بحث:
```bash
curl -X GET "https://art-gallery-infa.vercel.app/api/v1/artworks?page=1&limit=12"
```

### 4. جلب محتوى الموقع:
```bash
curl -X GET "https://art-gallery-infa.vercel.app/api/v1/content/site-info"
```

### 5. تسجيل دخول الأدمن:
```bash
curl -X POST "https://art-gallery-infa.vercel.app/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"YourAdminPassword123!"}'
```
