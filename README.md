# The Bottle Club — Omnichannel Wine & Dining Control Hub

ระบบบริหารจัดการร้านไวน์และร้านอาหารอัจฉริยะครบวงจร (**All-in-One Omnichannel POS & E-Commerce Management Platform**) เชื่อมผสานการทำงานระหว่าง **หน้าร้านอาหาร/ไวน์บาร์ (POS Terminal & Table Service)** และ **ร้านค้าออนไลน์ (Web Wine E-Commerce)** เข้าด้วยกันอย่างสมบูรณ์แบบ ขับเคลื่อนด้วย Next.js 16 (App Router), React 19, Supabase PostgreSQL, Wayneven Backend REST API และระบบผู้ช่วยบริหารอัจฉริยะ AI Co-Pilot

---

## สารบัญ (Table of Contents)

1. [ภาพรวมระบบและสถาปัตยกรรม (System Architecture)](#-ภาพรวมระบบและสถาปัตยกรรม-system-architecture)
2. [ฟังก์ชันการทำงานหลัก (Core Features)](#-ฟังก์ชันการทำงานหลัก-core-features)
3. [เทคโนโลยีที่ใช้ (Tech Stack)](#-เทคโนโลยีที่ใช้-tech-stack)
4. [ความต้องการเบื้องต้นของระบบ (Prerequisites)](#-ความต้องการเบื้องต้นของระบบ-prerequisites)
5. [ขั้นตอนการติดตั้งและรันในเครื่อง (Local Setup)](#-ขั้นตอนการติดตั้งและรันในเครื่อง-local-setup)
6. [การตั้งค่า Environment Variables อย่างละเอียด](#-การตั้งค่า-environment-variables-อย่างละเอียด)
7. [ขั้นตอนการ Deploy ขึ้น Vercel อย่างละเอียด](#-ขั้นตอนการ-deploy-ขึ้น-vercel-อย่างละเอียด)
8. [โครงสร้างไดเรกทอรีและโค้ด (Directory Structure)](#-โครงสร้างไดเรกทอรีและโค้ด-directory-structure)
9. [โมเดลข้อมูลและฐานข้อมูล (Database Schema)](#-โมเดลข้อมูลและฐานข้อมูล-database-schema)
10. [ระบบสิทธิ์ผู้ใช้งาน (Roles & Permissions)](#-ระบบสิทธิ์ผู้ใช้งาน-roles--permissions)
11. [แนวทางการพัฒนาต่อสำหรับ Developer (Best Practices)](#-แนวทางการพัฒนาต่อสำหรับ-developer-best-practices)
12. [คำสั่งที่ใช้บ่อย (Useful NPM Scripts)](#-คำสั่งที่ใช้บ่อย-useful-npm-scripts)

---

## ภาพรวมระบบและสถาปัตยกรรม (System Architecture)

ระบบถูกออกแบบด้วยสถาปัตยกรรม **Dual-Engine Omnichannel Architecture** เพื่อรองรับทั้งการขายหน้าร้านจริงและการขายออนไลน์:

```text
                               +--------------------------------------------------+
                               |            The Bottle Club Platform              |
                               |          (Next.js 16 App Router + React 19)      |
                               +------------------------+-------------------------+
                                                        |
                        +-------------------------------+-------------------------------+
                        |                                                               |
                        v                                                               v
      +-----------------------------------+                           +-----------------------------------+
      |         ENGINE 1: POS STORE       |                           |       ENGINE 2: WEB WINE E-COM    |
      |   (หน้าร้านอาหาร / ไวน์บาร์ / โต๊ะ)   |                           |    (ระบบสั่งซื้อออนไลน์ & สมาชิก)     |
      +-----------------+-----------------+                           +-----------------+-----------------+
                        |                                                               |
                        | SQL / Real-time                                               | REST / Bearer Token
                        v                                                               v
      +-----------------------------------+                           +-----------------------------------+
      |       Supabase PostgreSQL DB      |                           |     Wayneven Backend REST API     |
      |-----------------------------------|                           |-----------------------------------|
      | - บิลขายหน้าร้าน (sales, sale_items)|                           | - คำสั่งซื้อออนไลน์ (orders)        |
      | - สินค้าหน้าร้าน (products)        |                           | - สินค้าไวน์ออนไลน์ (wine-products) |
      | - สต็อกสินค้า & รับเข้า (inventory) |                           | - ตรวจสอบสลิปโอนเงิน (payments)    |
      | - รายงานความเรียบร้อย 4 แผนก       |                           | - ข้อมูลสมาชิก & แต้ม (loyalty)    |
      | - ข้อมูลบัญชีพนักงาน (profiles)     |                           | - รีวิวสินค้าจากลูกค้า (reviews)     |
      +-----------------------------------+                           +-----------------------------------+
                        ^                                                               ^
                        |                                                               |
                        +-------------------------------+-------------------------------+
                                                        |
                                                        v
                                      +-----------------------------------+
                                      |     Google Gemini AI Co-Pilot     |
                                      |  (วิเคราะห์ข้อมูลข้ามระบบแบบเรียลไทม์)  |
                                      +-----------------------------------+
```

### กลยุทธ์ความทนทานต่อข้อผิดพลาด (Fault-Tolerant Resilience)
- **Zero White-Screen Policy:** ทุกหน้าในระบบ (ทั้งฝั่ง POS และ Web Wine) มีระบบ Data Fallback อัตโนมัติ หาก API ภายนอกหรือระบบฐานข้อมูลมีปัญหา ระบบจะดึงข้อมูลสำรองขึ้นมาแสดงผลอย่างนุ่มนวลโดยไม่เกิดหน้าจอขาวหรือ Crash
- **Independent Operations:** ระบบ POS หน้าร้านสามารถคิดเงิน ออกบิล และบันทึกรายการได้แม้ระบบ Web Wine API ภายนอกจะหยุดให้บริการชั่วคราว

---

## ฟังก์ชันการทำงานหลัก (Core Features)

### 1. ระบบจุดขายหน้าร้าน & คิดเงิน (POS Terminal & Billing)
- **POS Terminal (`/admin/pos`):** แคตตาล็อกเมนูอาหารและไวน์ แยกหมวดหมู่ ค้นหาด่วน สแกนบาร์โค้ด
- **ระบบจับคู่อาหารกับไวน์ (Food & Wine Pairing):** แนะนำไวน์ที่เข้ากันได้ดีกับเมนูอาหารพร้อมมอบส่วนลดเซ็ตคู่อัตโนมัติ
- **ระบบรับชำระบิล (`/admin/billing`):** รองรับเงินสด (พร้อมคำนวณเงินทอน), สแกนโอน PromptPay QR Code, บัตรเครดิต
- **ใบเสร็จและการพิมพ์:** พิมพ์ใบเสร็จขนาดมาตรฐาน (Slip Printer 80mm / A4) ออกเลขที่บิลรันนิ่งอัตโนมัติ

### 2. ระบบพิมพ์ QR Code แท่นวางบนโต๊ะอาหาร (`/admin/qrcode`)
- **Acrylic Stand Ready:** ออกแบบป้าย QR Code สำหรับโต๊ะ 1-10 ขนาดมาตรฐานสำหรับใส่แท่นวางอะคริลิค (A5 / 4x6" / 5x7")
- **High-Definition Vector QR:** เวกเตอร์ QR Code ความละเอียดสูง โลโก้ร้าน หมายเลขโต๊ะสีทองคมชัด และคำแนะนำการสั่ง 3 ขั้นตอน
- **Print Optimization:** กำหนดสไตล์ `@media print` ซ่อนเมนูระบบและ Header ของแอดมินทั้งหมด 100% พิมพ์ออกมาเฉพาะตัวการ์ดที่สวยงาม

### 3. ระบบเมนูดิจิทัลสำหรับลูกค้าบนโต๊ะอาหาร (`/menu?table={number}`)
- ลูกค้าสแกน QR Code จากโต๊ะเพื่อดูเมนูอาหาร รายละเอียดไวน์ (ปีผลิต, พันธุ์องุ่น, แหล่งกำเนิด, % แอลกอฮอล์)
- สั่งอาหารเข้าห้องครัวโดยตรงพร้อมระบุเลขโต๊ะ
- ชำระเงินผ่าน PromptPay QR Code พร้อมแนบรูปสลิปโอนเงินยืนยันได้ทันที

### 4. ระบบจัดการร้านค้าออนไลน์ Web Wine (`/admin/bottleclub/...`)
- **คำสั่งซื้อออนไลน์ (`/admin/bottleclub/orders`):** ติดตามสถานะคำสั่งซื้อ อัปเดตการแพ็คและจัดส่ง
- **ตรวจสอบสลิปโอนเงิน (`/admin/bottleclub/payments`):** แสดงรูปภาพสลิป ยอดโอน และปุ่มกดอนุมัติ/ปฏิเสธยอดเงิน
- **จัดการสินค้า Web Wine (`/admin/bottleclub/products`):** บริหารจัดการแคตตาล็อกไวน์ออนไลน์ ราคาสินค้า และสต็อก
- **สมาชิก & แต้มสะสม (`/admin/bottleclub/members`):** ข้อมูลลูกค้า ระดับสมาชิก (Bronze/Silver/Gold/Platinum) และประวัติแต้ม
- **รีวิวสินค้า (`/admin/bottleclub/reviews`):** อนุมัติหรือซ่อนความคิดเห็นและคะแนนดาวจากลูกค้าออนไลน์
- **รายงานยอดขาย e-Com (`/admin/bottleclub/reports`):** รายงานยอดขายแยกตามช่วงเวลา ช่องทางชำระเงิน และหมวดหมู่ไวน์

### 5. แดชบอร์ดวิเคราะห์ธุรกิจรวม (Unified Analytics) (`/admin/analytics`)
- **Financial Flow Bar:** `รายรับ (Revenue) -> ต้นทุนขาย (COGS) -> ค่าใช้จ่าย (OpEx) -> กำไรสุทธิ (Net Profit)`
- **7 กราฟวิเคราะห์ขั้นสูง:** Bar Chart, Growth Line Chart, Payment Pie Chart, Donut Financial Ratio, Area Chart, Comparison Chart และ Scatter Plot

### 6. ผู้ช่วยผู้บริหารอัจฉริยะ (Admin AI Co-Pilot)
- เชื่อมต่อ Google Gemini API ดึงข้อมูลสดจากทั้ง Supabase และ Wayneven API มาประมวลผล
- ถาม-ตอบสรุปยอดขาย ประสิทธิภาพของแคชเชียร์ ความเรียบร้อย 4 แผนก และวิเคราะห์สต็อกสินค้าที่ต้องสั่งเพิ่ม

---

## เทคโนโลยีที่ใช้ (Tech Stack)

| เลเยอร์ | เทคโนโลยี | รายละเอียด |
| :--- | :--- | :--- |
| **Framework** | Next.js 16.3.0 (App Router) | รองรับ React Server Components, Turbopack, Fast Refresh |
| **UI Library** | React 19.2.8 | คอมโพเนนต์เวอร์ชันล่าสุด ประสิทธิภาพสูง |
| **Language** | TypeScript 5 | พิมพ์ตัวแปรแบบเข้มงวด (Strict Type Safety) ทั่วทั้งระบบ |
| **Primary Database** | Supabase (PostgreSQL) | ตารางฐานข้อมูลหน้าร้าน POS, Realtime, RLS Policies |
| **Secondary Backend** | Wayneven REST API | สถาปัตยกรรม Microservice สำหรับระบบร้านค้าออนไลน์ |
| **Styling** | Tailwind CSS v4 + Custom Dark Theme | ธีมสีหรูหรา Clean Premium (Dark Mode Default + Light Mode) |
| **Data Visualizations**| Recharts 3.10 | กราฟสถิติแบบ Interactive Responsive |
| **Icons** | Lucide React | ชุดไอคอน SVG แบบคมชัดระดับ Enterprise |
| **QR Code** | `qrcode.react`, `promptpay-qr` | สร้าง QR Code เมนูและพร้อมเพย์แบบ Vector Dynamic |
| **AI Integration** | Google Gemini API (gemini-1.5-flash / gemini-2.5) | โมเดลภาษาขนาดใหญ่สำหรับการวิเคราะห์ข้อมูลธุรกิจ |
| **Deployment** | Vercel | ระบบ Cloud Serverless Edge พร้อม CI/CD จาก GitHub อัตโนมัติ |

---

## ความต้องการเบื้องต้นของระบบ (Prerequisites)

ก่อนเริ่มการติดตั้ง กรุณาตรวจสอบว่าเครื่องของท่านมีสิ่งเหล่านี้ติดตั้งอยู่แล้ว:

- **Node.js:** แนะนำเวอร์ชัน `20.x LTS` หรือ `22.x` ขึ้นไป
- **Package Manager:** `npm` (v9 หรือ v10 ขึ้นไป)
- **Git:** สำหรับ Clone โค้ด
- **เว็บเบราว์เซอร์:** Google Chrome, Microsoft Edge, Safari หรือ Firefox รุ่นล่าสุด

---

## ขั้นตอนการติดตั้งและรันในเครื่อง (Local Setup)

### 1. Clone Repository
```bash
git clone https://github.com/Knathip01/Admin-Pos-Wine.git
cd Admin-Pos-Wine
```

### 2. ติดตั้ง Dependencies
```bash
npm install
```

### 3. สร้างไฟล์ Environment Variables
คัดลอกไฟล์ตัวอย่าง `.env.example` ไปเป็น `.env.local`:
```bash
# บน Windows PowerShell
copy .env.example .env.local

# บน macOS / Linux
cp .env.example .env.local
```
จากนั้นเปิดไฟล์ `.env.local` เพื่อแก้ไขค่า Configuration ให้ถูกต้อง (ดูรายละเอียดในหัวข้อถัดไป)

### 4. รัน Development Server
```bash
npm run dev
```

> **หมายเหตุ:** โปรเจกต์ตั้งค่ารันด้วยแฟล็ก `--webpack` ใน `package.json` (`next dev --webpack`) เพื่อให้สามารถคอมไพล์บนระบบปฏิบัติการ Windows ได้อย่างเสถียรที่สุด

### 5. เปิดเข้าใช้งานระบบ
- **หน้าหลักระบบแอดมิน:** [http://localhost:3000/admin](http://localhost:3000/admin)
- **หน้าเข้าสู่ระบบแอดมิน:** [http://localhost:3000/admin/login](http://localhost:3000/admin/login)
- **หน้าแคชเชียร์ POS Terminal:** [http://localhost:3000/admin/pos](http://localhost:3000/admin/pos)
- **หน้าเมนูลูกค้า (ตัวอย่างโต๊ะ 1):** [http://localhost:3000/menu?table=1](http://localhost:3000/menu?table=1)

---

## การตั้งค่า Environment Variables อย่างละเอียด

ไฟล์ `.env.local` เป็นที่เก็บค่าตัวแปรคอนฟิกูเรชัน ห้าม Commit ไฟล์นี้ขึ้น Git Repository โดยเด็ดขาด

| ชื่อตัวแปร (Variable Name) | จำเป็น | การเข้าถึง | คำอธิบาย & ตัวอย่างค่า |
| :--- | :---: | :---: | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | ใช่ | Client / Server | URL ของโปรเจกต์ Supabase เช่น `https://xxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ใช่ | Client / Server | คีย์ Anon/Public ของ Supabase ใช้สำหรับเชื่อมต่อฝั่งหน้าบ้าน |
| `SUPABASE_SERVICE_ROLE_KEY` | ใช่ | Server Only | คีย์ Service Role ของ Supabase สำหรับการจัดการสิทธิ์ระดับสูงฝั่ง Server-side |
| `JWT_SECRET_KEY` | ใช่ | Server Only | รหัสลับ Secret สำหรับการ Verify หรือ Sign Session Token (เช่น `0217`) |
| `NEXT_PUBLIC_API_BASE_URL` | ใช่ | Client / Server | URL หลักของ Wayneven Backend API เช่น `https://api.wayneven.uk/api/v1` |
| `NEXT_PUBLIC_API_DOCS_URL` | ตัวเลือก | Client / Server | ลิงก์เอกสาร Swagger API เช่น `https://api.wayneven.uk/docs` |
| `API_BASE_URL` | ใช่ | Server Only | สำรอง URL ของ Wayneven Backend API สำหรับ Server-side Fetching |
| `API_DOCS_URL` | ตัวเลือก | Server Only | สำรอง Swagger Docs URL สำหรับ Server-side |
| `GEMINI_API_KEY` | ตัวเลือก | Server Only | API Key จาก Google AI Studio สำหรับใช้งานระบบ Admin AI Chat Co-Pilot |

### ตัวอย่างไฟล์ `.env.local`:
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# External Backend API (Web Wine System)
JWT_SECRET_KEY=your_jwt_secret
NEXT_PUBLIC_API_BASE_URL=https://api.wayneven.uk/api/v1
NEXT_PUBLIC_API_DOCS_URL=https://api.wayneven.uk/docs
API_BASE_URL=https://api.wayneven.uk/api/v1
API_DOCS_URL=https://api.wayneven.uk/docs

# Google Gemini AI Co-Pilot
GEMINI_API_KEY=your_gemini_api_key
```

---

## ขั้นตอนการ Deploy ขึ้น Vercel อย่างละเอียด

โปรเจกต์นี้ได้รับการปรับแต่งสำหรับการทำงานบน Vercel 100% สามารถ Deploy ได้อย่างง่ายดายตามขั้นตอนดังนี้:

### ขั้นตอนที่ 1: เตรียม Git Repository
ตรวจสอบว่าโค้ดล่าสุดถูก Push ขึ้น GitHub ใน Branch `main` เรียบร้อยแล้ว:
```bash
git status
git push origin main
```

### ขั้นตอนที่ 2: นำเข้าโปรเจกต์บน Vercel Dashboard
1. เข้าสู่ระบบ [Vercel Dashboard](https://vercel.com/)
2. คลิกปุ่ม **"Add New..."** ➔ เลือก **"Project"**
3. ค้นหารีโพสิทอรี `Admin-Pos-Wine` แล้วคลิก **"Import"**

### ขั้นตอนที่ 3: กำหนดค่า Build & Project Settings
- **Framework Preset:** เลือก `Next.js`
- **Root Directory:** `./` (ค่าเริ่มต้น)
- **Build Command:** ปล่อยเป็นค่าเริ่มต้น (`npm run build` ซึ่งจะเรียก `next build --webpack`)
- **Output Directory:** `.next` (ค่าเริ่มต้น)
- **Install Command:** `npm install` (ค่าเริ่มต้น)

### ขั้นตอนที่ 4: ใส่ Environment Variables บน Vercel
ในแท็บ **Environment Variables** ให้คัดลอกค่าจาก `.env.local` มาวางให้ครบทุกตัวแปร:
1. `NEXT_PUBLIC_SUPABASE_URL`
2. `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. `SUPABASE_SERVICE_ROLE_KEY`
4. `JWT_SECRET_KEY`
5. `NEXT_PUBLIC_API_BASE_URL`
6. `NEXT_PUBLIC_API_DOCS_URL`
7. `API_BASE_URL`
8. `API_DOCS_URL`
9. `GEMINI_API_KEY`

> **คำแนะนำ:** ตรวจสอบให้แน่ใจว่าได้เลือกช่อง **Production**, **Preview**, และ **Development** ครบทั้ง 3 ช่อง

### ขั้นตอนที่ 5: เริ่มการ Deploy
1. คลิกปุ่ม **"Deploy"**
2. Vercel จะเริ่ม Build โปรเจกต์ ใช้เวลาประมาณ 1-2 นาที
3. เมื่อเสร็จสิ้น หน้าต่างจะแสดงข้อความยินดีต้อนรับ พร้อม URL ประจำโปรเจกต์ เช่น `https://admin-pos-wine.vercel.app`

### ขั้นตอนที่ 6: การตั้งค่า Custom Domain (ทางเลือก)
หากต้องการผูกโดเมนเนมของทางร้าน:
1. ไปที่แท็บ **Settings ➔ Domains** บนโปรเจกต์ Vercel
2. พิมพ์ชื่อโดเมนที่ต้องการ (เช่น `pos.thebottleclub.com`)
3. ทำการตั้งค่า DNS Record (CNAME หรือ A Record) ตามคำแนะนำของ Vercel

---

## โครงสร้างไดเรกทอรีและโค้ด (Directory Structure)

```text
admin-pos-wine/
├── public/                     # ไฟล์สื่อคงที่ โลโก้ รูปภาพสินค้า แบนเนอร์
│   ├── thebottleclub.jpg       # โลโก้แบรนด์หลัก
│   └── wine_hero.png           # แบนเนอร์หน้าเมนูลูกค้า
├── src/
│   ├── app/                    # Next.js App Router (ระบบ Routing ทั้งหมด 57 Routes)
│   │   ├── admin/              # โมดูลควบคุมหลักของแอดมิน
│   │   │   ├── analytics/      # แดชบอร์ดสถิติและการเงิน 7 รูปแบบ
│   │   │   ├── billing/        # คิดเงิน ออกใบเสร็จ ประวัติบิล
│   │   │   ├── bottleclub/     # โมดูลร้านค้าออนไลน์ Web Wine (Orders, Payments, Products, Members, Reviews, Reports, Settings)
│   │   │   ├── categories/     # จัดการหมวดหมู่สินค้า POS
│   │   │   ├── inventory/      # สต็อกสินค้า & บันทึกรับเข้าสินค้า
│   │   │   ├── login/          # หน้าเข้าสู่ระบบแอดมิน
│   │   │   ├── pairings/       # จัดการเซ็ตจับคู่อาหารและไวน์
│   │   │   ├── pos/            # แคชเชียร์ POS Terminal หน้าร้าน
│   │   │   ├── products/       # จัดการสินค้าหน้าร้าน
│   │   │   ├── qrcode/         # ระบบพิมพ์ป้าย QR Code โต๊ะอาหารสำหรับแท่นวางอะคริลิค
│   │   │   ├── reports/        # รายงานสรุปภาษี & รายงานความเรียบร้อย 4 แผนก
│   │   │   ├── reviews/        # ตรวจสอบรีวิว
│   │   │   ├── settings/       # ตั้งค่าร้านค้าและระบบ
│   │   │   ├── users/          # จัดการข้อมูลและสิทธิ์พนักงาน
│   │   │   ├── layout.tsx      # โครงสร้าง Admin Shell (Sidebar, Header, Theme Provider)
│   │   │   ├── page.tsx        # แดชบอร์ดสรุปหน้าร้าน POS
│   │   │   └── admin-theme.css # สไตล์ชีตระบบ Dark/Light และ Print Media Rules
│   │   ├── api/                # API Endpoints (Next.js Route Handlers)
│   │   │   ├── admin/          # API ภายในสำหรับ AI Chat, Auth, Dashboard, Users, Reports
│   │   │   └── promotions/     # API ข้อมูลโปรโมชั่น
│   │   ├── menu/               # หน้าเมนูดิจิทัลสำหรับลูกค้าบนโต๊ะอาหาร (Table Ordering)
│   │   ├── globals.css         # สไตล์ Global ของระบบ
│   │   └── layout.tsx          # Root Layout ของแอปพลิเคชัน
│   ├── components/             # Reusable UI Components
│   │   ├── admin/              # Admin Header, Sidebar, AI Chat, FoodWinePairingManager
│   │   └── pos/                # CheckoutModal, CustomerSearchModal, Numpad
│   ├── lib/                    # โมดูลส่วนกลาง คอนเนกชัน และข้อมูลจำลอง
│   │   ├── api/                # REST Client สำหรับเรียก Wayneven API (Orders, Products, Payments, Loyalty ฯลฯ)
│   │   ├── store/              # State Management ด้วย Zustand (Cart, API Auth Token)
│   │   ├── supabase/           # Client/Server Connectors สำหรับ Supabase
│   │   ├── mock-data.ts        # Mock Fallback Data รับประกัน Zero-Downtime
│   │   ├── mock-promotions.ts  # ข้อมูลโปรโมชั่นตั้งต้น
│   │   ├── types.ts            # TypeScript Interfaces กลาง
│   │   └── utils.ts            # ฟังก์ชัน Utility (การแปลงค่าเงิน THB, วันที่, คลาสสี)
│   └── proxy.ts                # Route Protection Proxy สำหรับป้องกัน /admin
├── .env.example                # ตัวอย่างไฟล์ Environment Variables
├── package.json                # รายการ Dependencies และ Build Scripts
├── tsconfig.json               # การกำหนดค่า TypeScript
└── README.md                   # เอกสารคู่มือระบบฉบับสมบูรณ์
```

---

## โมเดลข้อมูลและฐานข้อมูล (Database Schema)

### ตารางหลักใน Supabase (POS In-House Engine)

1. **`products`**: รายการสินค้าในร้าน (ชื่อ, ราคาขาย, ราคาทุน, สต็อกคงเหลือ, สต็อกขั้นต่ำ, หมวดหมู่, รูปภาพ)
2. **`categories`**: หมวดหมู่สินค้าอาหารและเครื่องดื่ม
3. **`sales`**: ข้อมูลการขายหน้าร้าน POS (เลขที่ใบเสร็จ `receipt_no`, ยอดรวม, วิธีการชำระเงิน, ผู้รับเงิน, สถานะ)
4. **`sale_items`**: รายละเอียดสินค้าในแต่ละใบเสร็จ (รหัสสินค้า, ราคา, ต้นทุน, จำนวน, ส่วนลด)
5. **`stock_receipts`**: ประวัติการรับสินค้าเข้าสต็อกจากซัพพลายเออร์ (ต้นทุนรวม, ผู้รับของ, วันที่)
6. **`readiness_reports`**: รายงานความเรียบร้อยเปิด-ปิดร้านจาก 4 แผนก (Cashier, Stock, Kitchen, Bar)
7. **`profiles`**: บัญชีพนักงานและผู้ดูแลระบบ (ชื่อ, บทบาท `role`, สถานะใช้งาน)
8. **`food_wine_pairings`**: ข้อมูลคู่เมนูอาหารและไวน์ พร้อมระบุส่วนลดพิเศษ

### เอนทิตีหลักใน Wayneven Backend API (Web Wine E-Com Engine)

1. **`wine-products` / `catalog`**: แคตตาล็อกไวน์ออนไลน์, ปีผลิต, พันธุ์องุ่น, แหล่งผลิต
2. **`orders` / `order_items`**: คำสั่งซื้อจากหน้าเว็บ, ที่อยู่จัดส่ง, ยอดเงินสุทธิ
3. **`payments` / `slip-verify`**: สลิปการโอนเงิน, วันเวลาที่โอน, สถานะการตรวจสอบ
4. **`customers` / `loyalty`**: สมาชิกออนไลน์, แต้มสะสม, ระดับสมาชิก
5. **`reviews`**: รีวิวและคะแนนดาวจากลูกค้า

---

## ระบบสิทธิ์ผู้ใช้งาน (Roles & Permissions)

ระบบใช้มาตรฐาน **Role-Based Access Control (RBAC)** แบ่งสิทธิ์การทำงานอย่างรัดกุม:

| บทบาท (Role) | สิทธิ์การเข้าถึงและการทำงาน |
| :--- | :--- |
| **Super Admin** | มีสิทธิ์สูงสุด เข้าถึงได้ทุกหน้า ทั้งข้อมูลการเงินเชิงลึก, ตั้งค่าระบบ, จัดการพนักงาน, POS และ Web Wine |
| **Manager** | ดูแดชบอร์ด, จัดการสินค้าหน้าร้านและออนไลน์, ตรวจสอบรายงานยอดขาย, อนุมัติสลิปโอนเงิน |
| **Cashier** | ใช้งานหน้าขาย POS Terminal, รับชำระเงิน, ออกใบเสร็จ, ดูประวัติบิล |
| **Stock Staff** | จัดการสต็อกสินค้าหน้าร้าน, ตรวจนับสินค้า, บันทึกการรับเข้าสินค้า (Stock Receipt) |

---

## แนวทางการพัฒนาต่อสำหรับ Developer (Best Practices)

หากท่านเป็นผู้พัฒนาที่จะรับช่วงต่อในการต่อยอดหรือบำรุงรักษาระบบ กรุณาปฏิบัติตามแนวทางต่อไปนี้:

### 1. กฎการออกแบบ UI และการใช้ไอคอน (Clean Professional Design)
- **ห้ามใช้อิโมจิในหน้า UI เด็ดขาด:** โปรเจกต์นี้ได้รับการปรับปรุงให้อยู่ในมาตรฐานระดับ Luxury Enterprise โดยนำอิโมจิออกทั้งหมด 100%
- ให้ใช้ไอคอน SVG จากไลบรารี `lucide-react` แทน เพื่อความคมชัด สวยงาม และเข้ากับดีไซน์ Dark/Light Theme ของระบบ
- ใช้โทนสีหลักของระบบตามตัวแปร CSS ใน `src/app/admin/admin-theme.css`:
  - **Primary:** Indigo (`#6366f1`)
  - **Secondary:** Violet (`#8b5cf6`)
  - **Accent:** Cyan (`#06b6d4`), Emerald (`#10b981`), Amber (`#f59e0b`)

### 2. นโยบายความทนทานของข้อมูล (Graceful Fallback)
- เมื่อเขียนฟังก์ชันดึงข้อมูลจาก API หรือ Supabase ให้ครอบด้วย `try...catch` และจัดเตรียมข้อมูล Fallback หรือ Mock Data เสมอ
- หากการเชื่อมต่อขัดข้อง ต้องแจ้งเตือนผู้ใช้งานด้วยข้อความที่ชัดเจน และอนุญาตให้ผู้ใช้ทำงานต่อได้

### 3. การรองรับการพิมพ์ (`@media print`)
- ทุกครั้งที่สร้างหน้าใหม่ที่ต้องมีการสั่งพิมพ์ (เช่น ใบเสร็จ หรือป้าย QR Code) ให้เพิ่มคลาส `.no-print` ให้กับคอนเทนเนอร์ที่ไม่ต้องการให้ปรากฏบนกระดาษ
- ตรวจสอบให้แน่ใจว่าแท็ก `header`, `aside`, `nav` ถูกซ่อนด้วย `display: none !important;` เมื่อเข้าสู่สถานะ Print

### 4. การตรวจสอบความถูกต้องก่อน Commit
ทุกครั้งก่อน Push โค้ดขึ้น Repository กรุณารันทดสอบการ Build เสมอ:
```bash
npm run build
```
ต้องมั่นใจว่าคอมไพล์ผ่านครบทั้ง 57 เส้นทางโดยไม่มี TypeScript Error

---

## คำสั่งที่ใช้บ่อย (Useful NPM Scripts)

```bash
# รันโปรเจกต์ในโหมด Development (Port 3000)
npm run dev

# คอมไพล์โปรเจกต์สำหรับ Production
npm run build

# รันเซิร์ฟเวอร์หลังทำการ Build เสร็จสิ้น
npm run start

# ตรวจสอบความถูกต้องของโค้ดด้วย ESLint
npm run lint
```

---

## สิทธิ์และความเป็นเจ้าของ (License & Ownership)

ลิขสิทธิ์และสิทธิ์ในทรัพย์สินทางปัญญาเป็นของ **The Bottle Club** สงวนลิขสิทธิ์ทุกประการ
