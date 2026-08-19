# 🍷 The Bottle Club — E-Commerce & POS Control Center

ระบบบริหารจัดการร้านไวน์และเครื่องดื่มครบวงจร (All-in-One Wine Shop Management System) ที่เชื่อมต่อระหว่าง **ระบบหน้าร้าน (POS Terminal)** และ **ระบบร้านค้าออนไลน์ (E-Commerce Web Wine)** เข้าด้วยกันอย่างไร้รอยต่อ พร้อมแดชบอร์ดวิเคราะห์สถิติและการเงินแบบ Real-time และผู้ช่วยอัจฉริยะ AI Assistant

---

## 🌟 จุดเด่นของระบบ (Key Highlights)

- **Unified Control Hub:** รวมศูนย์การควบคุมทั้งระบบขายหน้าร้าน (POS) และร้านค้าออนไลน์ (Web Wine) ไว้ในที่เดียว
- **Comprehensive Analytics Dashboard:** แดชบอร์ดวิเคราะห์ยอดขายและสถานะการเงินรวม ด้วยแผนภูมิ 7 รูปแบบ (รายรับ → ต้นทุน → ค่าใช้จ่าย → กำไรสุทธิ) ดึงจากฐานข้อมูลจริง 100%
- **POS Cashier & Billing:** ระบบจุดขายหน้าร้าน คิดเงิน ออกใบเสร็จ คำนวณภาษี และตัดสต็อกอัตโนมัติ
- **E-Commerce Operations:** จัดการคำสั่งซื้อออนไลน์ ตรวจสอบสลิปโอนเงิน จัดการรีวิว และระบบแต้มสะสมสมาชิก
- **Real-Time Stock Inventory:** แจ้งเตือนสต็อกต่ำ บันทึกการรับเข้าสินค้า (Stock Receipts) และคำนวณต้นทุนสินค้า
- **Digital QR Menu:** เมนูดิจิทัลสำหรับลูกค้าสแกนดูรายการสินค้าและราคาผ่านสมาร์ทโฟน
- **AI Business Assistant:** ระบบ AI Chat ที่เชื่อมต่อกับ Google Gemini วิเคราะห์ข้อมูลยอดขายและสินค้าจาก Supabase โดยตรง
- **Role-Based Access Control (RBAC):** กำหนดสิทธิ์การเข้าถึงตามบทบาท (Super Admin, Manager, Cashier, Stock Staff)
- **Responsive Mobile First:** รองรับการทำงานทั้งบนคอมพิวเตอร์ แท็บเล็ต และสมาร์ทโฟน

---

## 🛠️ เทคโนโลยีที่ใช้ (Tech Stack)

| ส่วนประกอบ | เทคโนโลยี | รายละเอียด |
| :--- | :--- | :--- |
| **Frontend Framework** | [Next.js](https://nextjs.org/) (App Router) | React Server & Client Components, Turbopack, Fast Refresh |
| **Language** | [TypeScript](https://www.typescriptlang.org/) | Type Safety ทั้งฝั่ง Client และ Server |
| **Database & Auth** | [Supabase](https://supabase.com/) | PostgreSQL Database, Realtime Subscriptions, Supabase Auth |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) & Custom CSS | Glassmorphism UI, Dark Theme, Modern Responsive Layout |
| **Data Visualization** | [Recharts](https://recharts.org/) | Interactive Charts (Bar, Line, Pie, Donut, Area, Scatter) |
| **Animations** | [Framer Motion](https://www.framer.com/motion/) | Smooth UI Transitions & Micro-interactions |
| **Icons** | [Lucide React](https://lucide.dev/) | Icon Set คุณภาพสูง |
| **QR Code & Payments** | `qrcode.react`, `promptpay-qr` | สร้าง QR Code พร้อมเพย์ และ QR Menu อัตโนมัติ |
| **AI Integration** | Google Gemini API | วิเคราะห์ข้อมูลและตอบคำถามเชิงธุรกิจแบบเรียลไทม์ |

---

## 📁 โครงสร้างโปรเจกต์ (Project Structure)

```text
c:/admin-pos-wine/
├── public/                     # ไฟล์ Static (โลโก้, รูปภาพ, ฟอนต์)
│   └── logo.jpg
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── admin/              # เส้นทางระบบ Admin ทั้งหมด
│   │   │   ├── analytics/      # แดชบอร์ดวิเคราะห์ข้อมูลรวม (Web Wine + POS)
│   │   │   ├── billing/        # ระบบรับชำระบิล & ประวัติใบเสร็จ
│   │   │   ├── bottleclub/     # จัดการร้านค้าออนไลน์ Web Wine (Orders, Payments, Reviews)
│   │   │   ├── categories/     # จัดการหมวดหมู่สินค้า POS
│   │   │   ├── inventory/      # จัดการสต็อกสินค้า & รายการรับเข้า
│   │   │   ├── login/          # หน้าเข้าสู่ระบบ Admin
│   │   │   ├── members/        # จัดการข้อมูลสมาชิก & แต้มสะสม
│   │   │   ├── orders/         # รายการออเดอร์
│   │   │   ├── pos/            # หน้าขายหน้าร้าน (POS Terminal)
│   │   │   ├── pos-console/    # ภาพรวม POS Console
│   │   │   ├── products/       # จัดการสินค้า (เพิ่ม/แก้ไข/ลบ)
│   │   │   ├── qrcode/         # สร้าง QR Code เมนูและชำระเงิน
│   │   │   ├── reports/        # รายงานสรุปภาษีและยอดขาย
│   │   │   ├── reviews/        # รายการรีวิวจากลูกค้า
│   │   │   ├── settings/       # ตั้งค่าระบบร้านค้า
│   │   │   ├── users/          # จัดการข้อมูลและสิทธิ์พนักงาน
│   │   │   ├── layout.tsx      # โครงสร้าง Layout หลัก, Sidebar, Navigation
│   │   │   └── page.tsx        # Dashboard POS หลัก
│   │   ├── api/                # Next.js API Routes (Backend Endpoints)
│   │   │   └── admin/          # API สำหรับ AI Chat, Auth, Dashboard, Reports
│   │   ├── menu/               # หน้ารายการเมนูดิจิทัลสำหรับลูกค้า (Digital Menu)
│   │   ├── layout.tsx          # Root Layout
│   │   └── globals.css         # Global Styles & Theme Settings
│   ├── components/             # Reusable UI Components
│   │   └── admin/              # คอมโพเนนต์เฉพาะ Admin (AI Chat, KPI Cards, Charts)
│   ├── lib/                    # Helper Functions, Supabase Client, Types
│   │   ├── supabase/           # Supabase Client & Server Configurations
│   │   ├── mock-data.ts        # ข้อมูลตั้งต้นสำหรับทดสอบ
│   │   ├── types.ts            # TypeScript Interfaces & Types
│   │   └── utils.ts            # ฟังก์ชันช่วยจัดรูปแบบเงิน, วันที่ และข้อความ
│   └── proxy.ts                # Next.js Server-side Proxy สำหรับ Auth Protection
├── package.json                # Dependencies และ Scripts
└── README.md                   # คู่มือและคำอธิบายระบบ
```

---

## ⚙️ ฟังก์ชันการทำงานหลัก (Core Features & Functionality)

### 1. 📊 Analytics รวม (Unified Analytics Dashboard) — `/admin/analytics`
แดชบอร์ดศูนย์กลางที่คำนวณและประมวลผลข้อมูลทางการเงินจริงจากฐานข้อมูล Supabase:
- **Financial Flow Bar:** แสดงทิศทางเงิน `รายรับ (Revenue) → ต้นทุนขาย (COGS) → ค่าดำเนินงาน (OpEx) → กำไรสุทธิ (Net Profit)` พร้อม % Margin
- **7 แผนภูมิวิเคราะห์:**
  1. **Bar Chart (ยอดขายรายวัน):** ติดตามแนวโน้มยอดขายในแต่ละวัน
  2. **Line Chart (แนวโน้มการเติบโต):** เปรียบเทียบ 3 เส้น: รายรับ vs ต้นทุน vs กำไร
  3. **Pie Chart (ช่องทางการชำระเงิน):** สัดส่วนรายได้แยกตาม เงินสด, โอนเงิน, QR Code, บัตรเครดิต
  4. **Donut Chart (สัดส่วนทางการเงิน):** สัดส่วนระหว่างต้นทุนขาย, ค่าใช้จ่าย และกำไรสุทธิ
  5. **Area Chart (รายรับสะสม):** แนวโน้มยอดขายสะสมตลอดช่วงเวลา
  6. **Comparison Bar Chart (เปรียบเทียบผลประกอบการ):** เปรียบเทียบช่วงเวลาปัจจุบันกับช่วงก่อนหน้า
  7. **Scatter Plot (ราคา vs ปริมาณขาย):** วิเคราะห์ความสัมพันธ์ระหว่างราคาสินค้ากับจำนวนขวดที่ขายได้
- **ตัวกรองช่วงเวลา:** เลือกดูได้ทั้ง 7 วัน, 30 วัน, 90 วัน หรือกำหนดเอง

### 2. 🖥️ POS Terminal & Cashier Operations — `/admin/pos` & `/admin/billing`
- **จุดขายหน้าร้าน (POS Terminal):** ค้นหาสินค้าด้วยชื่อ หมวดหมู่ หรือสแกนบาร์โค้ด
- **ระบบตะกร้าสินค้า & การคิดเงิน:** รองรับส่วนลด การรวมยอดเงิน และคำนวณเงินทอน
- **การชำระเงินหลายรูปแบบ:** รองรับเงินสด, โอนผ่าน QR Code PromptPay, บัตรเครดิต
- **ใบเสร็จและการพิมพ์:** ออกใบเสร็จพร้อมเลขที่รันอัตโนมัติ (Receipt No.) และบันทึกประวัติการขาย

### 3. 🍷 E-Commerce Web Wine Control — `/admin/bottleclub`
- **Dashboard Web Wine:** สรุปยอดขายออนไลน์ ออเดอร์ที่รอจัดส่ง และสมาชิกใหม่
- **จัดการคำสั่งซื้อ (Orders):** ตรวจสอบสถานะคำสั่งซื้อ อัปเดตสถานะการจัดส่ง
- **ตรวจสอบสลิปโอนเงิน (Payments):** ดูหลักฐานการชำระเงินและกดยืนยันยอดเงิน
- **จัดการสินค้า Web Wine:** เพิ่ม/แก้ไข รายละเอียดไวน์ ปีผลิต (Vintage) แหล่งผลิต (Region/Winery) % แอลกอฮอล์ และรูปภาพ
- **ระบบสมาชิก & รีวิว:** ตรวจสอบประวัติการซื้อ การสะสมแต้ม และรีวิวสินค้าจากลูกค้า

### 4. 📦 การจัดการสต็อกและคลังสินค้า (Inventory Management) — `/admin/inventory`
- แจ้งเตือนสินค้าสต็อกต่ำกว่าเกณฑ์ขั้นต่ำ (Min Stock Alert)
- บันทึกการรับเข้าสต็อก (Stock Receipts) พร้อมบันทึกต้นทุนและชื่อซัพพลายเออร์
- ตัดสต็อกอัตโนมัติเมื่อเกิดการขายทั้งจากหน้าร้านและออนไลน์

### 5. 🤖 ผู้ช่วยอัจฉริยะ AI Assistant (Admin AI Chat)
- ระบบแชท AI ในตัวที่เชื่อมต่อกับ **Google Gemini API**
- ดึงข้อมูลยอดขาย สต็อกสินค้า และสถิติจาก Supabase แบบ Real-time มาตอบคำถามเชิงลึกให้กับผู้บริหาร

### 6. 📱 Digital Menu (QR Menu) — `/menu`
- หน้ารายการสินค้าสำหรับลูกค้าภายนอก เข้าดูผ่านการสแกน QR Code
- ดีไซน์หรูหรา ใช้งานง่ายบนมือถือ แสดงข้อมูลรสชาติ รายละเอียดไวน์ และราคา

---

## 🗄️ ตารางฐานข้อมูลหลัก (Database Schema Overview)

| ตาราง (Table) | หน้าที่และการเก็บข้อมูล |
| :--- | :--- |
| **`products`** | ข้อมูลสินค้าไวน์และเครื่องดื่ม (ชื่อ, ราคาขาย, ราคาทุน, สต็อก, ปีที่ผลิต, แหล่งผลิต, รูปภาพ) |
| **`categories`** | หมวดหมู่สินค้า (เช่น Red Wine, White Wine, Champagne, Spirits) |
| **`sales`** | ข้อมูลการขายหน้าร้าน POS (เลขที่ใบเสร็จ, ยอดรวม, วิธีชำระเงิน, ผู้รับเงิน, สถานะ) |
| **`sale_items`** | รายการสินค้าในแต่ละบิลขาย (รหัสสินค้า, จำนวน, ราคาต่อหน่วย, ราคาทุน, ยอดรวม) |
| **`stock_receipts`** | บันทึกการนำเข้าสินค้าจากซัพพลายเออร์ (ต้นทุนรวม, ผู้บันทึก, วันที่รับเข้า) |
| **`stock_receipt_items`** | รายการสินค้าที่รับเข้าในแต่ละใบเสร็จรับของ |
| **`orders`** | รายการคำสั่งซื้อจากร้านค้าออนไลน์ Web Wine |
| **`order_items`** | รายการสินค้าในแต่ละคำสั่งซื้อออนไลน์ |
| **`customers`** | ข้อมูลสมาชิกและลูกค้า (ชื่อ, เบอร์โทร, แต้มสะสม, ระดับสมาชิก Bronze/Silver/Gold/Platinum) |
| **`profiles`** | ข้อมูลบัญชีผู้ใช้งานและพนักงานในระบบ (ชื่อ, บทบาท/Role, สถานะการใช้งาน) |

---

## 👥 บทบาทและสิทธิ์ผู้ใช้งาน (Roles & Permissions)

| บทบาท (Role) | สิทธิ์การเข้าถึง (Permissions) |
| :--- | :--- |
| **Super Admin** | เข้าถึงได้ทุกฟังก์ชัน ทั้งการเงิน, พนักงาน, ตั้งค่าระบบ, POS, และ Web Wine |
| **Manager** | ดูแดชบอร์ด, จัดการสินค้า, ตรวจสอบรายงานยอดขาย, จัดการคำสั่งซื้อ |
| **Cashier** | ใช้งานหน้าขาย (POS Terminal), รับชำระบิล และออกใบเสร็จ |
| **Stock Staff** | จัดการสต็อกสินค้าหน้าร้าน และบันทึกการรับเข้าสินค้า |

---

## 🚀 การติดตั้งและรันโปรเจกต์ (Getting Started)

### 1. Clone Repository
```bash
git clone https://github.com/Knathip01/Admin-Pos-Wine.git
cd Admin-Pos-Wine
```

### 2. ติดตั้ง Dependencies
```bash
npm install
```

### 3. ตั้งค่า Environment Variables
สร้างไฟล์ `.env.local` ที่ Root Directory แล้วระบุค่าดังนี้:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Google Gemini AI
GEMINI_API_KEY=your-gemini-api-key
```

### 4. รันโปรเจกต์ในโหมด Development
```bash
npm run dev
```
เปิดเบราว์เซอร์ไปที่ [http://localhost:3000/admin](http://localhost:3000/admin) เพื่อเข้าสู่ระบบจัดการ

---

## 🌐 การ Deploy บน Vercel

1. เชื่อมต่อ Git Repository บน [Vercel Dashboard](https://vercel.com/)
2. ตั้งค่า Environment Variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`) ในส่วน **Settings ➔ Environment Variables**
3. กด **Deploy** เพื่อเริ่มการเผยแพร่ระบบขึ้น Production

---

## 📄 License & Ownership
ลิขสิทธิ์และสิทธิ์ในทรัพย์สินทางปัญญาเป็นของ **The Bottle Club**

