import { Promotion } from './types'

export const PROMOTION_IMAGE_PRESETS = [
  {
    name: 'Wine Cellar',
    label: 'ห้องเก็บบ่มไวน์หรู (Cellar)',
    url: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=1200&auto=format&fit=crop',
    icon: '🍷',
  },
  {
    name: 'Wine Pouring',
    label: 'การรินไวน์แดง (Pouring)',
    url: 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?q=80&w=1200&auto=format&fit=crop',
    icon: '🍾',
  },
  {
    name: 'Food & Wine Pairing',
    label: 'อาหารคู่ไวน์ & สเต๊ก (Pairing)',
    url: 'https://images.unsplash.com/photo-1558001373-7b93ee48ffa0?q=80&w=1200&auto=format&fit=crop',
    icon: '🥩',
  },
  {
    name: 'Champagne Cheers',
    label: 'แชมเปญเฉลิมฉลอง (Celebration)',
    url: 'https://images.unsplash.com/photo-1549416878-b9ca95e26903?q=80&w=1200&auto=format&fit=crop',
    icon: '🥂',
  },
  {
    name: 'Vineyard Sunset',
    label: 'ไร่องุ่นยามเย็น (Vineyard)',
    url: 'https://images.unsplash.com/photo-1504279577054-acfeccf8fc52?q=80&w=1200&auto=format&fit=crop',
    icon: '🍇',
  },
  {
    name: 'Luxury Glass & Bottle',
    label: 'ไวน์บาร์พรีเมียม (Bar & Glasses)',
    url: 'https://images.unsplash.com/photo-1474722883778-792e7990302f?q=80&w=1200&auto=format&fit=crop',
    icon: '✨',
  },
]

export const DEFAULT_PROMOTIONS: Promotion[] = [
  {
    id: 'grand-cru-2026',
    title: 'GRAND CRU & VINTAGE SELECTION',
    subtitle: 'สัมผัสรสชาติไวน์ชั้นเลิศระดับพรีเมียมจากแคว้นบอร์โดซ์และเบอร์กันดี',
    description: 'รับส่วนลดพิเศษสูงสุด 30% สำหรับไวน์กรองด์ครูคัดสรรพิเศษ เมื่อสั่งซื้อ 2 ขวดขึ้นไป พร้อมบริการจัดส่งควบคุมอุณหภูมิฟรีถึงหน้าบ้านคุณ',
    image_url: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=1200&auto=format&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1504279577054-acfeccf8fc52?q=80&w=1200&auto=format&fit=crop'
    ],
    badge: 'FEATURED',
    discount_tag: 'UP TO 30% OFF',
    valid_until: 'ถึงสิ้นเดือนนี้',
    link_url: '/#products',
    cta_text: 'ดูคอลเลกชันพิเศษ',
    is_featured: true,
    is_active: true,
    sort_order: 1,
    created_at: '2026-09-01T00:00:00Z',
  },
  {
    id: 'member-privilege-2026',
    title: 'EXCLUSIVE MEMBER PRIVILEGE',
    subtitle: 'สิทธิพิเศษเหนือระดับสำหรับสมาชิก The Bottle Club',
    description: 'สมัครสมาชิกวันนี้ รับส่วนลดทันที 500 บาท สำหรับบิลแรก พร้อมรับสิทธิ์สะสมแต้มคูณสองตลอดทั้งเดือน',
    image_url: 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?q=80&w=800&auto=format&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1474722883778-792e7990302f?q=80&w=1200&auto=format&fit=crop'
    ],
    badge: 'NEW MEMBER',
    discount_tag: 'ลดทันที 500฿',
    valid_until: 'สิทธิ์มีจำนวนจำกัด',
    link_url: '/admin/bottleclub/members',
    cta_text: 'สมัครสมาชิกรับสิทธิ์',
    is_featured: false,
    is_active: true,
    sort_order: 2,
    created_at: '2026-09-02T00:00:00Z',
  },
  {
    id: 'chef-sommelier-pairing',
    title: 'CHEF & SOMMELIER PAIRING',
    subtitle: 'จับคู่รสชาติอาหารและไวน์อย่างลงตัว',
    description: 'เลือกสั่งเซ็ตจับคู่อาหารจานเด็ดกับไวน์แนะนำโดย Sommelier รับส่วนลดเพิ่มทันที 15% จากราคาปกติ',
    image_url: 'https://images.unsplash.com/photo-1558001373-7b93ee48ffa0?q=80&w=800&auto=format&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1558001373-7b93ee48ffa0?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=1200&auto=format&fit=crop'
    ],
    badge: 'HOT PAIRING',
    discount_tag: 'ลด 15% ทันที',
    valid_until: 'ทุกวัน 17:00 - 23:00',
    link_url: '/menu?table=1-10',
    cta_text: 'ดูเมนูจับคู่',
    is_featured: false,
    is_active: true,
    sort_order: 3,
    created_at: '2026-09-03T00:00:00Z',
  },
  {
    id: 'champagne-celebration',
    title: 'CHAMPAGNE & SPARKLING NIGHT',
    subtitle: 'เติมเต็มทุกค่ำคืนแห่งการเฉลิมฉลองด้วยฟองพรายบริสุทธิ์',
    description: 'แชมเปญและสปาร์กลิงไวน์แท้จากฝรั่งเศสและอิตาลี ซื้อ 3 แถม 1 สำหรับงานปาร์ตี้และเทศกาลพิเศษ',
    image_url: 'https://images.unsplash.com/photo-1549416878-b9ca95e26903?q=80&w=800&auto=format&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1549416878-b9ca95e26903?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1474722883778-792e7990302f?q=80&w=1200&auto=format&fit=crop'
    ],
    badge: 'SPECIAL OFFER',
    discount_tag: 'BUY 3 GET 1 FREE',
    valid_until: 'สุดสัปดาห์นี้เท่านั้น',
    link_url: '/#products',
    cta_text: 'เลือกดูแชมเปญ',
    is_featured: false,
    is_active: true,
    sort_order: 4,
    created_at: '2026-09-04T00:00:00Z',
  },
]
