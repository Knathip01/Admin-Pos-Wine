// =============================================================
// API Types — The Bottle Club Backend (api.wayneven.uk/api/v1)
// Auto-derived from OpenAPI 3.1.0 spec
// =============================================================

// ─── Auth ───────────────────────────────────────────────────
export interface LoginRequest { username: string; password: string }
export interface RefreshTokenRequest { refresh_token: string }
export interface TokenResponse { access_token: string; refresh_token: string; token_type: string; expires_in?: number }
export interface UserRoleInfo { role_id: number; role_name: string; branch_id?: number | null; branch_name?: string | null }
export interface UserProfileResponse { id: number; username: string; email?: string | null; full_name?: string | null; display_name?: string | null; is_active: boolean; is_superadmin?: boolean; roles?: UserRoleInfo[]; organization_id?: number | null; branch_id?: number | null; permissions?: string[]; branches?: number[] }

// ─── Users ──────────────────────────────────────────────────
export interface UserCreate { username: string; email: string; password: string; display_name: string; full_name?: string | null; phone?: string | null; branch_ids?: number[]; is_active?: boolean }
export interface UserUpdate { email?: string | null; full_name?: string | null; display_name?: string | null; phone?: string | null; status?: string | null; is_active?: boolean | null; password?: string | null; branch_ids?: number[] | null }
export interface UserResponse { id: number; username: string; email?: string | null; full_name?: string | null; display_name?: string | null; phone?: string | null; status?: string; is_active?: boolean; is_superadmin?: boolean; created_at: string; updated_at?: string; roles?: UserRoleInfo[] }
export interface UserListResponse { users: UserResponse[]; total: number; page: number; per_page: number }
export interface UserRoleAssign { role_id: number; branch_id?: number | null }

// ─── Branches ───────────────────────────────────────────────
export interface BranchCreate { name: string; code: string; phone?: string | null; address?: string | null }
export interface BranchUpdate { name?: string | null; phone?: string | null; address?: string | null; is_active?: boolean | null }
export interface BranchResponse { id: number; organization_id: number; name: string; code: string; phone: string | null; address: string | null; is_active: boolean; created_at: string }
export interface BranchListResponse { branches: BranchResponse[]; total: number }

// ─── Roles & Permissions ────────────────────────────────────
export interface RoleCreate { name: string; description?: string | null; permission_ids?: number[] }
export interface RoleUpdate { name?: string | null; description?: string | null; permission_ids?: number[] | null }
export interface PermissionResponse { id: number; name: string; description?: string | null; resource?: string | null; action?: string | null }
export interface RoleResponse { id: number; name: string; description?: string | null; permissions?: PermissionResponse[]; created_at: string }
export interface RoleListResponse { roles: RoleResponse[]; total: number; page: number; per_page: number }

// ─── Catalog — Categories ───────────────────────────────────
export interface CategoryCreate { name: string; description?: string | null; parent_id?: number | null; sort_order?: number }
export interface CategoryUpdate { name?: string | null; description?: string | null; parent_id?: number | null; sort_order?: number | null; is_active?: boolean | null }
export interface CategoryResponse { id: number; name: string; description?: string | null; parent_id?: number | null; sort_order: number; is_active: boolean; created_at: string }

// ─── Catalog — Products ─────────────────────────────────────
export interface ProductCreate { name: string; description?: string | null; category_id?: number | null; sku?: string | null; barcode?: string | null; cost_price?: number | null; selling_price?: number | null; reorder_point?: number | null; unit?: string | null; is_active?: boolean }
export interface ProductUpdate { name?: string | null; description?: string | null; category_id?: number | null; sku?: string | null; barcode?: string | null; cost_price?: number | null; selling_price?: number | null; reorder_point?: number | null; unit?: string | null; is_active?: boolean | null }
export interface ProductResponse { id: number; name: string; description?: string | null; category_id?: number | null; category_name?: string | null; sku?: string | null; barcode?: string | null; cost_price?: number | null; selling_price?: number | null; reorder_point?: number | null; unit?: string | null; is_active: boolean; created_at: string; updated_at: string }

// ─── Catalog — Suppliers ────────────────────────────────────
export interface SupplierCreate { name: string; code?: string | null; contact_person?: string | null; phone?: string | null; email?: string | null; address?: string | null; tax_id?: string | null; payment_terms?: string | null }
export interface SupplierUpdate { name?: string | null; contact_person?: string | null; phone?: string | null; email?: string | null; address?: string | null; tax_id?: string | null; payment_terms?: string | null; is_active?: boolean | null }
export interface SupplierResponse { id: number; name: string; code?: string | null; contact_person?: string | null; phone?: string | null; email?: string | null; address?: string | null; tax_id?: string | null; payment_terms?: string | null; is_active: boolean; created_at: string }
export interface SupplierProductCreate { product_id: number; supplier_sku?: string | null; cost_price?: number | null; lead_time_days?: number | null; min_order_qty?: number | null }
export interface SupplierProductUpdate { supplier_sku?: string | null; cost_price?: number | null; lead_time_days?: number | null; min_order_qty?: number | null; is_active?: boolean | null }
export interface SupplierProductResponse { id: number; supplier_id: number; product_id: number; product_name?: string | null; supplier_sku?: string | null; cost_price?: number | null; lead_time_days?: number | null; min_order_qty?: number | null; is_active: boolean; created_at: string }

// ─── Inventory ──────────────────────────────────────────────
export interface InventoryBalanceResponse { branch_id: number; branch_name?: string | null; product_id: number; product_name?: string | null; product_sku?: string | null; quantity: number; reorder_point?: number | null; is_low_stock?: boolean }
export interface InventoryAdjustmentRequest { branch_id: number; product_id: number; quantity_change: number; reason?: string | null; lot_number?: string | null }
export interface InventoryLotResponse { id: number; branch_id: number; product_id: number; lot_number?: string | null; quantity: number; cost_price?: number | null; expiry_date?: string | null; received_at: string }
export interface StockMovementResponse { id: number; branch_id: number; product_id: number; product_name?: string | null; movement_type: string; quantity_change: number; quantity_before: number; quantity_after: number; reference_type?: string | null; reference_id?: number | null; lot_number?: string | null; reason?: string | null; created_by?: number | null; created_by_name?: string | null; created_at: string }
export interface LowStockReportResponse { branch_id: number; branch_name?: string | null; product_id: number; product_name?: string | null; sku?: string | null; quantity: number; reorder_point: number; shortage: number }

// ─── Orders ─────────────────────────────────────────────────
export interface OrderItemCreate { product_id: number; quantity: number; unit_price: number; discount_amount?: number }
export interface OrderCreate { customer_id?: number | null; items: OrderItemCreate[]; discount_amount?: number; notes?: string | null; coupon_code?: string | null }
export interface OrderStatusUpdate { status: string; notes?: string | null }
export interface OrderItemResponse { id: number; product_id: number; product_name?: string | null; quantity: number; unit_price: number; discount_amount: number; line_total: number }
export interface OrderResponse { id: number; order_number?: string | null; branch_id?: number | null; customer_id?: number | null; customer_name?: string | null; cashier_id?: number | null; cashier_name?: string | null; status: string; subtotal: number; discount_amount: number; tax_amount?: number; total_amount: number; notes?: string | null; items?: OrderItemResponse[]; created_at: string; updated_at: string }
export interface OrderListResponse { orders: OrderResponse[]; total: number; page: number; per_page: number }

// ─── Payments ───────────────────────────────────────────────
export interface PaymentCreate { order_id: number; payment_method: string; amount: number; reference_number?: string | null; notes?: string | null }
export interface PaymentRefundRequest { amount: number; reason?: string | null }
export interface PaymentResponse { id: number; order_id: number; payment_method: string; amount: number; reference_number?: string | null; status: string; notes?: string | null; created_at: string }

// ─── Purchases ──────────────────────────────────────────────
export interface PurchaseOrderItemCreate { product_id: number; quantity: number; unit_cost: number }
export interface PurchaseOrderCreate { supplier_id: number; branch_id: number; expected_date?: string | null; notes?: string | null; items: PurchaseOrderItemCreate[] }
export interface PurchaseOrderUpdate { expected_date?: string | null; notes?: string | null; items?: PurchaseOrderItemCreate[] }
export interface PurchaseReceivingItemCreate { purchase_order_item_id: number; quantity_received: number; lot_number?: string | null; expiry_date?: string | null }
export interface PurchaseReceivingCreate { items: PurchaseReceivingItemCreate[]; notes?: string | null }
export interface PurchaseOrderItemResponse { id: number; product_id: number; product_name?: string | null; quantity: number; quantity_received: number; unit_cost: number; total_cost: number }
export interface PurchaseReceivingResponse { id: number; purchase_order_id: number; received_by?: number | null; notes?: string | null; created_at: string }
export interface PurchaseOrderResponse { id: number; po_number?: string | null; supplier_id: number; supplier_name?: string | null; branch_id: number; branch_name?: string | null; status: string; total_amount: number; expected_date?: string | null; notes?: string | null; items?: PurchaseOrderItemResponse[]; created_at: string; updated_at: string }

// ─── Transfers ──────────────────────────────────────────────
export interface StockTransferItemCreate { product_id: number; quantity: number }
export interface StockTransferCreate { source_branch_id: number; dest_branch_id: number; notes?: string | null; items: StockTransferItemCreate[] }
export interface TransferShipItems { items: StockTransferItemCreate[]; notes?: string | null }
export interface TransferReceiveItems { items: StockTransferItemCreate[]; notes?: string | null }
export interface StockTransferItemResponse { id: number; product_id: number; product_name?: string | null; quantity_requested: number; quantity_shipped?: number | null; quantity_received?: number | null }
export interface StockTransferResponse { id: number; transfer_number?: string | null; source_branch_id: number; source_branch_name?: string | null; dest_branch_id: number; dest_branch_name?: string | null; status: string; notes?: string | null; items?: StockTransferItemResponse[]; created_at: string; updated_at: string }
export interface StockTransferListResponse { transfers: StockTransferResponse[]; total: number; page: number; per_page: number }

// ─── Returns ────────────────────────────────────────────────
export interface ReturnItemCreate { order_item_id: number; quantity: number; reason?: string | null }
export interface ReturnCreate { order_id: number; items: ReturnItemCreate[]; notes?: string | null }
export interface ReturnItemResponse { id: number; order_item_id: number; product_name?: string | null; quantity: number; reason?: string | null }
export interface ReturnResponse { id: number; return_number?: string | null; order_id: number; branch_id?: number | null; status: string; notes?: string | null; items?: ReturnItemResponse[]; processed_at?: string | null; created_at: string }
export interface ReturnListResponse { returns: ReturnResponse[]; total: number; page: number; per_page: number }

// ─── Refunds ────────────────────────────────────────────────
export interface RefundResponse { id: number; payment_id?: number | null; order_id?: number | null; amount: number; reason?: string | null; status: string; created_at: string }
export interface RefundListResponse { refunds: RefundResponse[]; total: number; page: number; per_page: number }

// ─── Promotions ─────────────────────────────────────────────
export interface PromotionCreate { name: string; description?: string | null; promotion_type: string; discount_value: number; min_purchase_amount?: number | null; max_discount_amount?: number | null; start_date: string; end_date: string; is_active?: boolean }
export interface PromotionUpdate { name?: string | null; description?: string | null; discount_value?: number | null; min_purchase_amount?: number | null; max_discount_amount?: number | null; start_date?: string | null; end_date?: string | null; is_active?: boolean | null }
export interface PromotionResponse { id: number; name: string; description?: string | null; promotion_type: string; discount_value: number; min_purchase_amount?: number | null; max_discount_amount?: number | null; start_date: string; end_date: string; is_active: boolean; created_at: string }
export interface PromotionListResponse { promotions: PromotionResponse[]; total: number; page: number; per_page: number }

// ─── Coupons ────────────────────────────────────────────────
export interface CouponCreate { code: string; promotion_id: number; max_uses?: number | null; max_uses_per_customer?: number; start_date: string; end_date: string }
export interface CouponValidate { code: string; customer_id: number }
export interface CouponValidationResult { valid: boolean; coupon_id?: number | null; promotion_id?: number | null; promotion_type?: string | null; discount_value?: number | null; message?: string | null }
export interface CouponResponse { id: number; code: string; promotion_id: number; max_uses?: number | null; used_count: number; is_active: boolean; created_at: string }
export interface CouponListResponse { coupons: CouponResponse[]; total: number }

// ─── Customers ──────────────────────────────────────────────
export interface CustomerCreate { first_name: string; last_name?: string | null; phone?: string | null; email?: string | null; date_of_birth?: string | null }
export interface CustomerUpdate { first_name?: string | null; last_name?: string | null; phone?: string | null; email?: string | null; date_of_birth?: string | null; is_active?: boolean | null }
export interface CustomerResponse { id: number; first_name: string; last_name?: string | null; full_name?: string | null; phone?: string | null; email?: string | null; date_of_birth?: string | null; total_points?: number; total_spent?: number; is_active: boolean; created_at: string }
export interface CustomerListResponse { customers: CustomerResponse[]; total: number; page: number; per_page: number }

// ─── Loyalty ────────────────────────────────────────────────
export interface LoyaltyPointsEarn { customer_id: number; points: number; reference_type?: string | null; reference_id?: number | null; notes?: string | null }
export interface LoyaltyPointsRedeem { customer_id: number; points: number; reference_type?: string | null; reference_id?: number | null; notes?: string | null }
export interface LoyaltyBalanceResponse { customer_id: number; customer_name: string; balance: number; pending_expiring: number }
export interface LoyaltyTransactionResponse { id: number; customer_id: number; transaction_type: string; points: number; reference_type?: string | null; reference_id?: number | null; notes?: string | null; created_at: string; expires_at?: string | null }
export interface LoyaltyTransactionListResponse { transactions: LoyaltyTransactionResponse[]; total: number; page: number; per_page: number }

// ─── Shifts ─────────────────────────────────────────────────
export interface ShiftOpen { branch_id: number; register_id: number; opening_cash?: number | string }
export interface ShiftClose { closing_cash: number | string }
export interface CashMovementCreate { amount: number | string; movement_type: string; reason: string }
export interface ShiftCashMovementResponse { id: number; movement_type: string; amount: string; reason: string; user_name: string; created_at: string }
export interface ShiftResponse { id: number; branch_id: number; register_id: number; user_id: number; status: string; opening_cash: string; closing_cash?: string | null; total_sales: string; total_cash_sales: string; total_card_sales: string; total_refunds: string; opened_at: string; closed_at?: string | null; created_at: string }
export interface ShiftListResponse { shifts: ShiftResponse[]; total: number; page: number; per_page: number }
export interface XReport { shift_id: number; opened_at: string; closed_at?: string | null; opening_cash: string; closing_cash?: string | null; expected_cash?: string | null; cash_difference?: string | null; total_sales: string; total_cash_sales: string; total_card_sales: string; total_other_sales: string; total_refunds: string; cash_movements_in: string; cash_movements_out: string; order_count: number }

// ─── Settings ───────────────────────────────────────────────
export interface SettingUpdate { value: string }
export interface SettingResponse { key: string; value: string; description?: string | null; branch_id?: number | null; updated_at?: string | null }
export interface SettingListResponse { settings: SettingResponse[] }

// ─── Promotions ─────────────────────────────────────────────
export interface PromotionItem {
  id: string
  title: string
  subtitle?: string | null
  description: string
  imageUrl: string
  images?: string[]
  heroImageUrl?: string | null
  badge?: string | null
  discountTag?: string | null
  validUntil?: string | null
  linkUrl?: string | null
  ctaText?: string | null
  secondaryCtaText?: string | null
  secondaryLinkUrl?: string | null
  isFeatured?: boolean
  isActive?: boolean
  sortOrder?: number
  created_at?: string
  updated_at?: string
}
export type WebPromotionCreate = Partial<PromotionItem> & { id: string; title: string; description: string; imageUrl: string }
export type WebPromotionUpdate = Partial<PromotionItem> & { id: string }
export type WebPromotionResponse = PromotionItem
export interface WebPromotionListResponse { success?: boolean; promotions: PromotionItem[] }
export interface WebPromotionMutationResponse { success: boolean; message?: string; promotion?: PromotionItem }

// ─── Reports ────────────────────────────────────────────────
export interface SalesReportResponse { total_sales: number; total_orders: number; average_order_value: number; top_products: Array<Record<string, unknown>>; sales_by_hour: Array<Record<string, unknown>>; sales_by_category: Array<Record<string, unknown>> }
export interface DailySalesSummary { date: string; branch_id?: number | null; total_orders: number; total_revenue: number; total_refunds: number; net_sales: number }

// ─── Audit ──────────────────────────────────────────────────
export interface AuditLogResponse { id: number; user_id?: number | null; user_name?: string | null; action: string; entity_type: string; entity_id?: number | null; before_data?: Record<string, unknown> | null; after_data?: Record<string, unknown> | null; ip_address?: string | null; created_at: string }
export interface AuditLogListResponse { logs: AuditLogResponse[]; total: number; page: number; per_page: number }

// ─── Slip Verification ──────────────────────────────────────
export interface SlipVerificationResult {
  id?: number
  order_id?: number
  file_url?: string
  is_valid?: boolean
  confidence?: number
  amount_detected?: number | string
  transfer_date?: string
  sender_bank?: string
  sender_account?: string
  receiver_bank?: string
  receiver_account?: string
  reference_number?: string
  fraud_flags?: string[]
  is_duplicate?: boolean
  duplicate_reference_id?: number
  ocr_raw_text?: string
  status?: string
  created_at?: string
  [key: string]: unknown
}

// ─── Misc ───────────────────────────────────────────────────
export interface HealthResponse { status: string; [key: string]: string }
export interface ApiError { detail?: string | Array<{ msg: string; loc?: string[] }>; message?: string; status?: number }
export interface PaginationParams { page?: number; per_page?: number }
