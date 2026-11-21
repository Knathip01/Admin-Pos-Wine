# รายงานการตรวจสอบการเชื่อมต่อ Wayneven API และแนวทางแก้ไข
**The Bottle Club — Admin POS & Web Wine Management**  
*วันที่ตรวจสอบ: 21 พฤศจิกายน 2026*  
*เป้าหมาย: อธิบายสาเหตุที่หน้า Admin ยังไม่ดึงข้อมูลจริงจาก API (`https://api.wayneven.uk`) และรายการสิ่งที่ต้องแก้ไขทั้งฝั่ง Backend และ Frontend*

---

## 1. สาเหตุที่หน้า Admin ยังไม่ดึงข้อมูลจริง (ทำไมขึ้น "API Mode: Direct Data Display")

จากการตรวจสอบโค้ดและการยิงทดสอบไปยัง `https://api.wayneven.uk` พบสาเหตุหลัก 4 ประการ ดังนี้:

### 1.1 ไม่สามารถเข้าสู่ระบบ API Backend ได้ (401 Unauthorized)
- **พฤติกรรม:** หน้า Admin ทุกหน้าในฝั่ง Web Wine (`/admin/bottleclub/*` เช่น Orders, Payments, Members, Reviews) จำเป็นต้องมี **JWT Bearer Token** ในการเรียก API
- **ปัญหา:** ในไฟล์ `src/app/admin/login/page.tsx` และ `src/lib/store/api-auth.ts` มีการฟิกซ์รหัสผ่านไว้ที่:
  - `username`: `superadmin` หรือ `superadmin@thebottleclub.com`
  - `password`: `postthebottleclub`
- **ผลทดสอบจริงกับ API:** เมื่อยิง `POST https://api.wayneven.uk/api/v1/auth/login` ด้วยชุดนี้ API ตอบกลับว่า:
  ```json
  HTTP 401 Unauthorized
  {"detail":"Invalid username or password","code":"UNAUTHORIZED"}
  ```
- **ผลลัพธ์:** ฝั่ง Frontend จึงได้ `accessToken: null` และจำเป็นต้อง Bypass เพื่อให้ Admin เข้าหน้าบ้านได้ ทำให้ระบบตัดเข้า **Mock Mode / Direct Data Display** อัตโนมัติ

---

### 1.2 ติด CORS Restriction จากฝั่ง Backend (400 Disallowed CORS origin)
จากการทดสอบ Preflight OPTIONS ไปยัง `https://api.wayneven.uk/health`:
- `https://admin-pos-wine.vercel.app` → **200 OK** (อนุญาต)
- `http://localhost:3000` → **400 Bad Request: Disallowed CORS origin** (ถูกบล็อก)
- `https://admin-pos-webwine.vercel.app` (โดเมนของ Git Repo ใหม่) → **400 Bad Request: Disallowed CORS origin** (ถูกบล็อก)
- โดเมน Preview ของ Vercel → **400 Bad Request: Disallowed CORS origin** (ถูกบล็อก)

> **ผลกระทบ:** หากเปิดเว็บจาก `localhost` หรือเปิดจาก Vercel โปรเจกต์ใหม่ที่ชื่อ `Admin-Pos-Webwine` เบราว์เซอร์จะบล็อกการเรียก API ทันทีเนื่องจากติด CORS Policy

---

### 1.3 ฐานข้อมูลใน API ของเพื่อนยังเป็นข้อมูลว่าง (Empty Database)
เราได้ทดสอบเรียก Endpoint สาธารณะที่ไม่ต้องใช้ Auth:
- `GET https://api.wayneven.uk/api/v1/wine-products/`
  - ผลลัพธ์: `200 OK` แต่ `items: []`, `total: 0` (ยังไม่มีสินค้าไวน์ในฐานข้อมูล)
- `GET https://api.wayneven.uk/api/promotions`
  - ผลลัพธ์: `200 OK` แต่ `promotions: []` (ยังไม่มีโปรโมชั่น)

เมื่อ API คืนค่า Array ว่าง โค้ดหน้าบ้านปัจจุบันตั้งเงื่อนไขไว้ว่า `if (!data || data.length === 0)` ให้ดึง Mock Data ขึ้นมาแสดงแทน

---

### 1.4 หน้าจัดการสินค้า Web Wine (`/admin/bottleclub/products`) ยังเรียก Supabase
- ในไฟล์ `src/app/admin/bottleclub/products/page.tsx` โค้ดส่วนดึงสินค้ายังเรียก `supabase.from('products').select(...)` อยู่ แทนที่จะเรียก `catalogApi.getProducts()` (`/api/v1/catalog/products`) ของ Wayneven API

---

### 1.5 Cloudflare WAF บล็อกการเข้าถึง `/docs` และ `/openapi.json`
- หน้ารายละเอียด Swagger ที่ `https://api.wayneven.uk/docs` และ `/openapi.json` มีการเปิดใช้ Cloudflare Bot Fight Mode / WAF ทำให้เมื่อเรียกผ่าน Script หรือ Automated Tool จะขึ้น `403 Forbidden (Sorry, you have been blocked)`

---

## 2. สิ่งที่ฝั่ง Backend (เพื่อน) ต้องดำเนินการ

| ลำดับ | รายการที่ต้องแก้ไข | รายละเอียด |
|---|---|---|
| 1 | **ส่ง Username & Password บัญชี Admin สำหรับทดสอบ** | ขอชื่อผู้ใช้และรหัสผ่านจริงที่มีสิทธิ์ `superadmin` หรือ `admin` ที่สร้างไว้ใน Database ของ `https://api.wayneven.uk` เพื่อนำมาใส่ในระบบล็อกอิน |
| 2 | **เพิ่ม CORS Allowed Origins ใน FastAPI** | ใน `main.py` หรือไฟล์ตั้งค่า CORS ของ FastAPI ให้เพิ่มโดเมนเหล่านี้ใน `allow_origins`: <br>• `http://localhost:3000`<br>• `http://127.0.0.1:3000`<br>• `https://admin-pos-webwine.vercel.app`<br>• `https://admin-pos-wine.vercel.app`<br>• หรือใช้ Regex อนุญาต `https://.*\.vercel\.app` สำหรับ Preview branches |
| 3 | **Seed ข้อมูลตัวอย่างลง Database** | ทำการ Seed ข้อมูลตัวอย่างเข้าระบบ เช่น สินค้า (`/api/v1/catalog/products`), หมวดหมู่, สมาชิก, และออเดอร์ เพื่อให้ Frontend ดึงข้อมูลจริงขึ้นมาแสดงได้ |
| 4 | **ปลดบล็อก Cloudflare WAF สำหรับ `/docs`** | ตั้งค่า Cloudflare Page Rules หรือ WAF Custom Rules ให้ Bypass Bot Management สำหรับ Path `/docs*` และ `/openapi.json` |

---

## 3. สิ่งที่ฝั่ง Frontend ต้องปรับปรุงในโค้ด

### 3.1 ปรับระบบ Login ให้รองรับ Dynamic Credentials
- แก้ไข `src/app/admin/login/page.tsx` ให้ผู้ใช้สามารถกรอก username/password ใดๆ ก็ได้ที่มีอยู่ใน API จริง โดยไม่ติดเงื่อนไขฟิกซ์เฉพาะ `superadmin@thebottleclub.com`

### 3.2 ปรับหน้า Products ให้เรียก Wayneven Catalog API
- ปรับ `src/app/admin/bottleclub/products/page.tsx` ให้ดึงข้อมูลจาก `catalogApi.getProducts()` และ `catalogApi.getCategories()` จาก Wayneven Backend แทนการดึงจาก Supabase

### 3.3 แก้ไขเงื่อนไข Fallback Mock
- แก้ไขเงื่อนไขในทุกหน้า: หาก API ตอบกลับ `200 OK` (แม้ว่า `items` จะเป็น `[]` ว่างเปล่า) ให้แสดงสถานะ "ยังไม่มีข้อมูลในระบบ" แทนที่จะสลับไปแสดง Mock Data อัตโนมัติ จะสลับไป Mock เฉพาะเมื่อเกิดข้อผิดพลาดด้าน Network หรือเซิร์ฟเวอร์ออฟไลน์เท่านั้น

---

## 4. แผนภาพลำดับการทำงานที่ถูกต้อง (Correct Architecture Flow)

```
[ User Admin Login ]
        │
        ▼
[ POST /api/v1/auth/login ] ─────────► [ Wayneven FastAPI Server ]
        │                                        │
        ├─ รับ Access Token (JWT) ◄──────────────┘
        │
        ▼
[ จัดเก็บใน Zustand Store / Cookie ]
        │
        ├─ Bearer Token + X-Branch-Id: 1
        │
        ▼
[ เรียก API ฝั่ง Web Wine ]
        ├─ GET /api/v1/orders/
        ├─ GET /api/v1/payments/
        ├─ GET /api/v1/catalog/products
        ├─ GET /api/v1/customers/
        └─ GET /api/v1/reports/ecommerce/dashboard
        │
        ▼
[ แสดงผลข้อมูลจริงบนหน้า Admin ]
```
