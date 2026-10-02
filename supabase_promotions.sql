-- ============================================================================
-- 🍷 The Bottle Club — Promotions Table Schema & Seed Data
-- ============================================================================

-- 1. สร้างตาราง promotions
CREATE TABLE IF NOT EXISTS promotions (
    id VARCHAR(50) PRIMARY KEY,                         -- เช่น 'grand-cru-2026'
    title VARCHAR(255) NOT NULL,                        -- ชื่อแคมเปญ เช่น 'GRAND CRU & VINTAGE'
    subtitle VARCHAR(255),                              -- คำโปรยรอง
    description TEXT NOT NULL,                          -- รายละเอียดโปรโมชั่น
    image_url TEXT NOT NULL,                            -- URL รูปภาพแบนเนอร์โปรโมชั่น
    badge VARCHAR(100) DEFAULT 'PROMOTION',             -- ป้ายกำกับ เช่น 'FEATURED', 'NEW MEMBER'
    discount_tag VARCHAR(100),                          -- แท็กส่วนลด เช่น 'UP TO 30% OFF', 'ลด 500฿'
    valid_until VARCHAR(100),                           -- ระยะเวลา เช่น 'ถึงสิ้นเดือนนี้'
    link_url VARCHAR(255) DEFAULT '/#products',         -- ลิงก์ปลายทางเมื่อกด
    cta_text VARCHAR(100) DEFAULT 'ดูสินค้าโปรโมชั่น',  -- ข้อความบนปุ่ม
    is_featured BOOLEAN DEFAULT FALSE,                  -- true = แบนเนอร์ใหญ่, false = การ์ดย่อย
    is_active BOOLEAN DEFAULT TRUE,                     -- เปิด/ปิดการแสดงผล
    sort_order INT DEFAULT 0,                           -- ลำดับการแสดงผล
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. เปิดใช้งาน Row Level Security (RLS)
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;

-- 3. นโยบายความปลอดภัย RLS
-- สาธารณะสามารถอ่านโปรโมชั่นที่เปิดใช้งานได้
DROP POLICY IF EXISTS "Public can view active promotions" ON promotions;
CREATE POLICY "Public can view active promotions"
    ON promotions FOR SELECT
    USING (is_active = true);

-- Service role และ Authenticated Users สามารถจัดการข้อมูลทั้งหมดได้
DROP POLICY IF EXISTS "Authenticated users full access" ON promotions;
CREATE POLICY "Authenticated users full access"
    ON promotions FOR ALL
    USING (true)
    WITH CHECK (true);

-- 4. ข้อมูลเริ่มต้น (Initial Seed Data)
INSERT INTO promotions (id, title, subtitle, description, image_url, badge, discount_tag, valid_until, link_url, cta_text, is_featured, is_active, sort_order)
VALUES
(
    'grand-cru-2026',
    'GRAND CRU & VINTAGE SELECTION',
    'สัมผัสรสชาติไวน์ชั้นเลิศระดับพรีเมียมจากแคว้นบอร์โดซ์และเบอร์กันดี',
    'รับส่วนลดพิเศษสูงสุด 30% สำหรับไวน์กรองด์ครูคัดสรรพิเศษ เมื่อสั่งซื้อ 2 ขวดขึ้นไป พร้อมบริการจัดส่งควบคุมอุณหภูมิฟรีถึงหน้าบ้านคุณ',
    'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=1200&auto=format&fit=crop',
    'FEATURED',
    'UP TO 30% OFF',
    'ถึงสิ้นเดือนนี้',
    '/#products',
    'ดูคอลเลกชันพิเศษ',
    true,
    true,
    1
),
(
    'member-privilege-2026',
    'EXCLUSIVE MEMBER PRIVILEGE',
    'สิทธิพิเศษเหนือระดับสำหรับสมาชิก The Bottle Club',
    'สมัครสมาชิกวันนี้ รับส่วนลดทันที 500 บาท สำหรับบิลแรก พร้อมรับสิทธิ์สะสมแต้มคูณสองตลอดทั้งเดือน',
    'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?q=80&w=800&auto=format&fit=crop',
    'NEW MEMBER',
    'ลดทันที 500฿',
    'สิทธิ์มีจำนวนจำกัด',
    '/admin/bottleclub/members',
    'สมัครสมาชิกรับสิทธิ์',
    false,
    true,
    2
),
(
    'chef-sommelier-pairing',
    'CHEF & SOMMELIER PAIRING',
    'จับคู่รสชาติอาหารและไวน์อย่างลงตัว',
    'เลือกสั่งเซ็ตจับคู่อาหารจานเด็ดกับไวน์แนะนำโดย Sommelier รับส่วนลดเพิ่มทันที 15% จากราคาปกติ',
    'https://images.unsplash.com/photo-1558001373-7b93ee48ffa0?q=80&w=800&auto=format&fit=crop',
    'HOT PAIRING',
    'ลด 15% ทันที',
    'ทุกวัน 17:00 - 23:00',
    '/menu?table=1-10',
    'ดูเมนูจับคู่',
    false,
    true,
    3
),
(
    'champagne-celebration',
    'CHAMPAGNE & SPARKLING NIGHT',
    'เติมเต็มทุกค่ำคืนแห่งการเฉลิมฉลองด้วยฟองพรายบริสุทธิ์',
    'แชมเปญและสปาร์กลิงไวน์แท้จากฝรั่งเศสและอิตาลี ซื้อ 3 แถม 1 สำหรับงานปาร์ตี้และเทศกาลพิเศษ',
    'https://images.unsplash.com/photo-1549416878-b9ca95e26903?q=80&w=800&auto=format&fit=crop',
    'SPECIAL OFFER',
    'BUY 3 GET 1 FREE',
    'สุดสัปดาห์นี้เท่านั้น',
    '/#products',
    'เลือกดูแชมเปญ',
    false,
    true,
    4
)
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    subtitle = EXCLUDED.subtitle,
    description = EXCLUDED.description,
    image_url = EXCLUDED.image_url,
    badge = EXCLUDED.badge,
    discount_tag = EXCLUDED.discount_tag,
    valid_until = EXCLUDED.valid_until,
    link_url = EXCLUDED.link_url,
    cta_text = EXCLUDED.cta_text,
    is_featured = EXCLUDED.is_featured,
    is_active = EXCLUDED.is_active,
    sort_order = EXCLUDED.sort_order,
    updated_at = CURRENT_TIMESTAMP;
