# รายงานการอัปเดตระบบ API ตาม Frontend Integration Guide v1.0.0
**The Bottle Club — Admin POS & Web Wine Management**  
*วันที่อัปเดต: 23 พฤศจิกายน 2026*  
*อ้างอิงเอกสาร: Frontend Integration Guide — The Bottle Club Backend API (api_bottleclub v1.0.0)*

---

## 1. สรุปภาพรวมการอัปเดต

ได้ทำการตรวจสอบและปรับปรุงโค้ดฝั่ง Frontend ในไดเรกทอรี `src/lib/api/`, `src/lib/store/` และหน้า Admin เพื่อให้ตรงกับข้อกำหนดและพฤติกรรมจริงของ **Backend FastAPI + SQLAlchemy 2 REST API (api_bottleclub v1.0.0)** ครบทุกจุด ดังนี้:

---

## 2. รายละเอียดการแก้ไขในแต่ละไฟล์

### 2.1 `src/lib/api/client.ts` (Core HTTP Client)
- **เพิ่มการส่ง Header `Idempotency-Key` อัตโนมัติ:**
  - เพิ่มฟิลด์ `idempotencyKey?: string` และ `headers?: Record<string, string>` ใน `RequestOptions`
  - ตามข้อกำหนดของ Backend คำขอแบบ `POST` ไปยัง `/orders/`, `/orders/{id}/checkout`, `/payments/`, `/returns/` จำเป็นต้องมี Header `Idempotency-Key` (หากไม่ส่งจะได้รับ `422 IDEMPOTENCY_KEY_REQUIRED`)
  - โค้ดได้รับการปรับปรุงให้สร้าง UUID v4 อัตโนมัติหากผู้เรียกไม่ได้ระบุมาเอง เพื่อป้องกันข้อผิดพลาด 422
- **ปรับปรุงการแกะซอง Envelope (`ResponseEnvelopeMiddleware`):**
  - หาก Backend ส่งข้อมูลแบบ `{ data: [...], meta: { page, per_page, total } }` ระบบจะแนบข้อมูล Pagination (`meta`, `total`, `page`, `per_page`) เข้ากับ Array ทันที ทำให้โค้ดหน้าบ้านสามารถอ่านข้อมูลทั้งในรูปแบบ Array และ Pagination ได้โดยตรง

### 2.2 `src/lib/api/orders.ts` (Orders Domain)
- **เพิ่มฟังก์ชันการติดตามสถานะออเดอร์ (Tracking):**
  - เพิ่ม `trackPublic(data: { ref: string; contact?: string })`: รองรับ Endpoint ใหม่ `POST /api/v1/orders/track` (Public สำหรับลูกค้าติดตามพัสดุโดยไม่ต้องล็อกอิน)
  - เพิ่ม `createTrackingToken(orderId: number)`: รองรับ `POST /api/v1/orders/{order_id}/tracking-token`
  - เพิ่ม `trackByPublicToken(token: string)`: รองรับ `GET /api/v1/orders/track/public/{token}` (Public)
  - เพิ่ม `track(trackingOrRef: string, token?: string)`: รองรับ `GET /api/v1/orders/track/{tracking_or_ref}` (สำหรับ Staff ต้องมีสิทธิ์ `orders.read`)
- **รองรับ Idempotency-Key:**
  - เพิ่มพารามิเตอร์ `idempotencyKey?: string` ใน `create` และ `checkout`

### 2.3 `src/lib/api/payments.ts` (Payments Domain)
- รองรับการส่ง `Idempotency-Key` อัตโนมัติผ่าน `client.ts` ในคำขอ `POST /payments/`
- ฟังก์ชัน `refund` รองรับ `POST /payments/{order_id}/refund` (Superadmin only)

### 2.4 `src/lib/api/refunds.ts` (Refunds Domain)
- **แก้ไข Endpoint `POST /refunds/` ที่ถูกยกเลิก (405):**
  - ตามข้อกำหนด Backend ได้ยกเลิก `POST /api/v1/refunds/` (ส่งผลให้คืนค่า `405 Method Not Allowed`)
  - การคืนเงินต้องทำผ่าน `PUT /returns/{id}/process` หรือ `POST /payments/{order_id}/refund`
  - ปรับ `refundsApi.create` ให้ส่งคำขอไปยัง `POST /payments/{order_id}/refund` อัตโนมัติ เพื่อป้องกัน 405

### 2.5 `src/lib/api/slip-verify.ts` (Slip Verification Domain)
- **ปรับปรุงฟังก์ชัน `approve` ให้ส่ง Payload ถูกต้อง:**
  - ตามข้อกำหนด Backend กำหนดว่า `POST /slip-verify/{id}/approve` ต้องระบุ Body `{ confirmed_amount, bank_reference, note }` (หากขาด `confirmed_amount` จะได้ `422 VALIDATION_ERROR`)
  - ปรับให้รองรับทั้ง Object `{ confirmed_amount, bank_reference, note }` และตัวเลขยอดเงิน `amount` แบบ Shorthand

### 2.6 `src/lib/api/users.ts` (Users Domain)
- **เพิ่ม Endpoint ใหม่ตามสัญญา v1.0.0:**
  - เพิ่ม `resetPassword(userId)`: เรียก `POST /api/v1/users/{user_id}/reset-password` (สร้าง Temporary Password)
  - เพิ่ม `unlockLogin(userId)`: เรียก `POST /api/v1/users/{user_id}/unlock-login` (ปลดล็อคการระงับบัญชี)
  - เพิ่ม `removeRoleFromOrg(userId, roleId)`: เรียก `DELETE /api/v1/users/{user_id}/roles/{role_id}` (ถอนสิทธิ์ระดับองค์กร)

### 2.7 `src/lib/api/coupons.ts` (Coupons Domain)
- **เพิ่มฟังก์ชัน `update` ผ่าน `PATCH`:**
  - ตามสัญญา Backend ไม่มี `PUT /coupons/{id}` แต่มี `PATCH /api/v1/coupons/{coupon_id}` (สำหรับ Superadmin)
  - เพิ่ม `couponsApi.update(id, data, token)` ด้วย Method `PATCH`

### 2.8 `src/lib/api/catalog.ts` (Catalog Domain)
- **เพิ่ม `getProductCosts`:**
  - รองรับ `GET /api/v1/catalog/products/costs` (สำหรับผู้มีสิทธิ์ `catalog.create` ดูต้นทุนสินค้า)

### 2.9 `src/lib/api/shifts.ts` (Shifts Domain)
- ปรับ `shiftsApi.list` ให้ส่ง Header `X-Branch-Id` ไปด้วยอย่างถูกต้องตามข้อกำหนดการแยกสาขา

### 2.10 `src/lib/api/auth.ts` (Authentication Domain)
- เพิ่ม `changePassword`: เรียก `POST /api/v1/auth/change-password`
- เพิ่ม `register`: เรียก `POST /api/v1/auth/register`
- เพิ่ม `exchangeLineCode`: เรียก `POST /api/v1/auth/exchange` สำหรับแลกเปลี่ยนโค้ดจาก LINE Login เป็น Customer Token

---

## 3. สร้างโมดูล API เพิ่มเติมใหม่ (4 Modules)

1. **`src/lib/api/registers.ts` (Registers Domain):**
   - จัดการเครื่องแคชเชียร์/ลิ้นชักเก็บเงินหน้าร้าน (`/api/v1/registers`)
   - `list(params)`: ดึงรายการเครื่อง
   - `create(data)`: เพิ่มเครื่องใหม่
   - `update(registerId, data)`: แก้ไขชื่อ/สถานะเครื่อง

2. **`src/lib/api/storefront.ts` (Storefront Catalog Domain):**
   - แคตตาล็อกสำหรับหน้าร้านออนไลน์สาธารณะ (`/api/v1/storefront/products`)
   - `listProducts(params)`: ค้นหาไวน์ตามประเภท (`red`, `white`, `sparkling`, `rose`, `dessert`), ประเทศ, และเรียงลำดับราคา
   - `getProduct(productId)`: รายละเอียดไวน์พร้อมข้อมูลสายพันธุ์ แอลกอฮอล์ และภูมิภาค

3. **`src/lib/api/customer-addresses.ts` (Customer Addresses Domain):**
   - จัดการที่อยู่จัดส่งของลูกค้า (`/api/v1/customer-addresses`)
   - ฟังก์ชัน CRUD ครบถ้วน: `listByCustomer`, `get`, `create`, `update`, `delete`

4. **`src/lib/api/customer-account.ts` (Customer Account Domain):**
   - บัญชีลูกค้าผ่าน Customer Token (LINE Login) (`/api/v1/customer/me`)
   - `getMe(customerToken)`: ข้อมูลโปรไฟล์ลูกค้าและแต้มสะสม
   - `exchangeCode(code)`: แลกเปลี่ยน Token

---

## 4. ปรับปรุงหน้า Admin UI

1. **`src/app/admin/login/page.tsx`:**
   - ปลดล็อคข้อจำกัดที่ฟิกซ์เฉพาะอีเมลเดิม ให้สามารถล็อกอินด้วย Username และ Password จริงของระบบ Wayneven API ได้
   - หาก API คืน Token ระบบจะจัดเก็บลงใน Zustand Store และ Cookie ทันที

2. **`src/app/admin/bottleclub/products/page.tsx`:**
   - ปรับปรุงฟังก์ชัน `loadData` ให้เรียก `catalogApi.listCategories()` และ `catalogApi.listProducts()` จาก Wayneven API ก่อนเป็นลำดับแรก หากมีข้อมูลจะนำมาแสดงทันที (และ Fallback ไป Supabase เมื่อออฟไลน์)

3. **`src/app/admin/bottleclub/payments/page.tsx`:**
   - ปรับการอนุมัติออเดอร์ใน `handleApprove` ให้ส่งยอดชำระจริง (`targetOrder.total`) แทนที่จะส่ง `amount: 1` เพื่อไม่ให้ติดข้อผิดพลาด `400 OVERPAYMENT` หรือ `Payments less than amount due`

---

## 5. ผลการตรวจสอบ Build
- รันคำสั่ง `npx next build --webpack` สำเร็จสมบูรณ์ 100%
- ไม่มี TypeScript Error หรือข้อผิดพลาดในทั้ง 57 Routes
