// Data structures for Admin & POS System - The Bottle Club

export type UserRole = 'super_admin' | 'manager' | 'cashier' | 'stock_staff'

export interface Profile {
  id: string
  full_name: string
  role: UserRole
  phone?: string
  avatar_url?: string
  is_active: boolean
  created_at: string
}

// สินค้า (Product) - Wine & Spirits attributes
export interface Product {
  id: string
  name: string
  description?: string
  category_id?: string
  sku?: string
  barcode?: string
  price: number              // ราคาขาย
  cost: number               // ราคาทุน
  stock: number              // จำนวนคงเหลือ
  min_stock: number          // แจ้งเตือนเมื่อสต็อกต่ำกว่าค่านี้
  
  // Attributes สำหรับไวน์/เครื่องดื่ม
  country?: string           // ประเทศผู้ผลิต (เช่น France, Italy, USA, Australia)
  region?: string            // แหล่งผลิต/ภูมิภาค (เช่น Bordeaux, Napa Valley, Tuscany)
  brand?: string             // แบรนด์
  winery?: string            // โรงบ่มไวน์
  grape?: string             // พันธุ์องุ่น (เช่น Cabernet Sauvignon, Chardonnay, Merlot)
  vintage?: string           // ปีที่ผลิต (เช่น 2018, 2020, 2022)
  alcohol_percent?: number   // % แอลกอฮอล์
  volume_ml?: number         // ปริมาตร (ml)
  
  image_url?: string
  is_active: boolean
  created_at: string
  updated_at: string
  categories?: { name: string; icon?: string } | null
}

// หมวดหมู่สินค้า (Category)
export interface Category {
  id: string
  name: string
  description?: string
  icon?: string
  color: string
  sort_order: number
  is_active: boolean
  created_at: string
}

// สมาชิก (Customer)
export interface Customer {
  id: string
  member_code?: string                                  // รหัสสมาชิก
  full_name: string
  phone?: string
  email?: string
  points: number                                        // แต้มสะสมคงเหลือ
  total_spent: number                                   // ยอดซื้อสะสมทั้งหมด
  member_level: 'bronze' | 'silver' | 'gold' | 'platinum' // ระดับสมาชิก
  note?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

// การรับชำระเงิน (Payment)
export interface Payment {
  id: string
  sale_id: string
  payment_method: 'cash' | 'transfer' | 'qr' | 'card'
  amount: number
  reference_no?: string                                 // เลขอ้างอิงสลิปโอนเงิน/บัตร
  paid_at: string
}

// รายการสินค้าในบิล (SaleItem)
export interface SaleItem {
  id: string
  sale_id: string
  product_id?: string
  product_name: string
  sku?: string
  unit_price: number
  cost: number
  quantity: number
  discount_amount: number
  line_total: number
}

// บิลการขาย (Sale / Order)
export interface Sale {
  id: string
  receipt_no: string                                    // เลขที่ใบเสร็จ
  customer_id?: string                                  // ลูกค้าสมาชิก
  cashier_id?: string                                   // พนักงานแคชเชียร์
  status: 'pending' | 'paid' | 'cancelled' | 'refunded' | 'hold' | 'completed'
  subtotal: number                                      // ยอดรวมก่อนลด
  discount_amount: number                               // ส่วนลดรวม
  discount_note?: string
  tax_amount: number                                    // ภาษี (VAT 7%)
  service_charge: number                                // ค่าบริการ
  total_amount: number                                  // ยอดสุทธิ
  payment_method: 'cash' | 'transfer' | 'qr' | 'card' | 'mixed'
  cash_received?: number                                // เงินสดที่รับมา
  change_amount?: number                                // เงินทอน
  table_no?: string | null                              // หมายเลขโต๊ะ
  points_earned: number                                 // แต้มสะสมที่ได้รับ
  created_at: string
  
  // Relations
  sale_items?: SaleItem[]
  payments?: Payment[]
  customers?: Customer
  profiles?: Profile
  slip_url?: string                                    // สลิปสำหรับตรวจสอบ
}

// บันทึกความเคลื่อนไหวสต็อก (Inventory Movement Log)
export interface InventoryMovement {
  id: string
  product_id: string
  movement_type: 'in' | 'out' | 'adjust' | 'refund'
  quantity: number
  quantity_before: number
  quantity_after: number
  reference_type?: 'purchase' | 'sale' | 'manual' | 'refund' | 'adjustment'
  reference_id?: string
  note?: string
  created_by?: string
  created_at: string
  product_name?: string
}

// เอกสารรับสินค้าเข้าคลัง (Stock Receipt / Purchase)
export interface StockReceiptItem {
  id: string
  receipt_id: string
  product_id: string
  product_name: string
  quantity: number
  cost_price: number
  total_cost: number
}

export interface StockReceipt {
  id: string
  receipt_no: string
  supplier_name?: string
  total_cost: number
  received_by?: string
  note?: string
  created_at: string
  stock_receipt_items?: StockReceiptItem[]
}

// สินค้าในตะกร้าหน้าจอแคชเชียร์
export interface CartItem {
  product: Product
  quantity: number
  unit_price: number
  discount_amount: number
  line_total: number
}

export interface CartState {
  items: CartItem[]
  customer: Customer | null
  discount_amount: number
  discount_note: string
  note: string
}

// รายการบิลที่พักไว้ (Hold Sale Item)
export interface HoldSaleItem {
  id: string
  hold_id: string
  product_id: string
  product_name: string
  quantity: number
  unit_price: number
  line_total: number
}

// การพักบิลชั่วคราว (Hold Sale)
export interface HoldSale {
  id: string
  hold_no: string
  cashier_id?: string
  customer_id?: string
  customer_name?: string
  subtotal: number
  table_no?: string | null
  note?: string
  created_at: string
  hold_sale_items?: HoldSaleItem[]
}

// ประวัติการทำงานในระบบ Admin (Audit Log)
export interface AuditLog {
  id: string
  user_id?: string
  user_name?: string
  action: string
  entity_type: string
  entity_id?: string
  old_value?: Record<string, unknown>
  new_value?: Record<string, unknown>
  ip_address?: string
  created_at: string
}

// รีวิวจากลูกค้า (Review)
export interface Review {
  id: string
  product_id: string
  product_name: string
  customer_name: string
  rating: number
  comment: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
}

// QR Code ประจำโต๊ะ / QR Menu
export interface QRCodeItem {
  id: string
  table_no?: string
  name: string
  qr_code_url: string
  type: 'table' | 'menu'
  is_active: boolean
  scan_count: number
  created_at: string
}
