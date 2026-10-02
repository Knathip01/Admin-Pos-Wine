'use client';

import React, { useEffect, useState, useMemo } from 'react';
import DataTable, { Column } from '@/components/admin/DataTable';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import {
  Wine, Search, Plus, Edit2, Trash2, ShieldAlert, CheckCircle2,
  RotateCcw, AlertTriangle, X, Loader2, Save, Tag, Check, RefreshCw,
  Layers, Package, DollarSign, Barcode, Sparkles
} from 'lucide-react';
import { catalogApi } from '@/lib/api/catalog';
import type { CategoryResponse, ProductResponse } from '@/lib/api/types';
import { useApiAuth, ensureApiAuth } from '@/lib/store/api-auth';

interface ProductRow {
  id: number;
  rowKey: string;
  name: string;
  description: string | null;
  category_id: number | null;
  category_name?: string;
  sku: string | null;
  barcode: string | null;
  selling_price: number;
  cost_price: number;
  unit: string | null;
  is_active: boolean;
  created_at: string;
}

interface CategoryRow {
  id: number;
  rowKey: string;
  name: string;
  description: string | null;
  parent_id: number | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export default function AdminProductsPage() {
  const { accessToken } = useApiAuth();

  // Tab State: 'products' | 'categories'
  const [activeTab, setActiveTab] = useState<'products' | 'categories'>('products');

  // Data States
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  // Notification state
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modal states for Product
  const [editingProduct, setEditingProduct] = useState<ProductRow | null>(null);
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    category_id: '',
    sku: '',
    barcode: '',
    selling_price: '',
    cost_price: '',
    unit: 'each',
    is_active: true,
  });

  // Modal states for Category
  const [editingCategory, setEditingCategory] = useState<CategoryRow | null>(null);
  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    sort_order: 0,
  });

  const [saving, setSaving] = useState(false);

  // Map category_id -> name for quick lookup
  const categoryMap = useMemo(() => {
    const map = new Map<number, string>();
    categories.forEach(c => map.set(c.id, c.name));
    return map;
  }, [categories]);

  async function loadData(force = false) {
    if (products.length === 0 && categories.length === 0) {
      setLoading(true);
    }
    if (force) {
      setRefreshing(true);
      try {
        const { clearApiCache } = await import('@/lib/api/client');
        clearApiCache('catalog');
      } catch {}
    }
    setError(null);
    try {
      const token = accessToken || await ensureApiAuth();
      if (!token) throw new Error('ไม่สามารถเชื่อมต่อ API ได้ (กรุณาตรวจสอบเซิร์ฟเวอร์ Backend)');

      // Fetch Categories & Products concurrently
      const [catRes, prodRes] = await Promise.allSettled([
        catalogApi.listCategories(token),
        catalogApi.listProducts({ per_page: 100 }, token),
      ]);

      // Parse Categories
      let catList: CategoryRow[] = [];
      if (catRes.status === 'fulfilled') {
        const raw = catRes.value;
        const list: CategoryResponse[] = Array.isArray(raw)
          ? raw
          : ((raw as any)?.categories || (raw as any)?.data || []);

        catList = list.map((c) => ({
          id: c.id,
          rowKey: `cat_${c.id}`,
          name: c.name,
          description: c.description ?? null,
          parent_id: c.parent_id ?? null,
          sort_order: c.sort_order ?? 0,
          is_active: c.is_active ?? true,
          created_at: c.created_at ? new Date(c.created_at).toLocaleDateString('th-TH') : '-',
        }));
        setCategories(catList);
      }

      // Parse Products
      if (prodRes.status === 'fulfilled') {
        const raw = prodRes.value;
        const list: ProductResponse[] = Array.isArray(raw)
          ? raw
          : ((raw as any)?.products || (raw as any)?.data || []);

        const catMapLocal = new Map<number, string>();
        catList.forEach(c => catMapLocal.set(c.id, c.name));

        setProducts(list.map((p) => ({
          id: p.id,
          rowKey: `prod_${p.id}`,
          name: p.name,
          description: p.description ?? null,
          category_id: p.category_id ?? null,
          category_name: p.category_name || (p.category_id ? catMapLocal.get(p.category_id) : undefined) || 'ทั่วไป',
          sku: p.sku ?? null,
          barcode: p.barcode ?? null,
          selling_price: Number(p.selling_price ?? 0),
          cost_price: Number(p.cost_price ?? 0),
          unit: p.unit ?? 'each',
          is_active: p.is_active ?? true,
          created_at: p.created_at ? new Date(p.created_at).toLocaleDateString('th-TH') : '-',
        })));
      }
    } catch (err: any) {
      setError(err.message || 'ไม่สามารถดึงข้อมูลจาก API จริงได้');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [accessToken]);

  const triggerNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  // ─── Product Handlers ──────────────────────────────────────────
  const handleOpenAddProduct = () => {
    setIsAddProductModalOpen(true);
    setProductForm({
      name: '',
      description: '',
      category_id: categories.length > 0 ? String(categories[0].id) : '',
      sku: '',
      barcode: '',
      selling_price: '',
      cost_price: '',
      unit: 'each',
      is_active: true,
    });
  };

  const handleOpenEditProduct = (item: ProductRow) => {
    setEditingProduct(item);
    setProductForm({
      name: item.name,
      description: item.description || '',
      category_id: item.category_id ? String(item.category_id) : '',
      sku: item.sku || '',
      barcode: item.barcode || '',
      selling_price: String(item.selling_price),
      cost_price: String(item.cost_price),
      unit: item.unit || 'each',
      is_active: item.is_active,
    });
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = accessToken || await ensureApiAuth();
      if (!token) throw new Error('ไม่พบสิทธิ์การเข้าถึง API');

      const payload = {
        name: productForm.name,
        description: productForm.description || null,
        category_id: productForm.category_id ? Number(productForm.category_id) : null,
        sku: productForm.sku || null,
        barcode: productForm.barcode || null,
        selling_price: Number(productForm.selling_price) || 0,
        cost_price: Number(productForm.cost_price) || 0,
        unit: productForm.unit || 'each',
        is_active: productForm.is_active,
      };

      if (editingProduct) {
        await catalogApi.updateProduct(editingProduct.id, payload, token);
        setProducts(prev => prev.map(p => p.id === editingProduct.id ? {
          ...p,
          ...payload,
          category_name: payload.category_id ? categoryMap.get(payload.category_id) : 'ทั่วไป',
        } : p));
        triggerNotification('success', `อัปเดตข้อมูลสินค้า "${productForm.name}" สำเร็จ`);
        setEditingProduct(null);
      } else {
        const created = await catalogApi.createProduct(payload, token);
        const newRow: ProductRow = {
          id: created.id ?? Date.now(),
          rowKey: `prod_${created.id ?? Date.now()}`,
          name: created.name ?? productForm.name,
          description: created.description ?? (productForm.description || null),
          category_id: created.category_id ?? (payload.category_id || null),
          category_name: (payload.category_id ? categoryMap.get(payload.category_id) : undefined) || 'ทั่วไป',
          sku: created.sku ?? (payload.sku || null),
          barcode: created.barcode ?? (payload.barcode || null),
          selling_price: Number(created.selling_price ?? payload.selling_price),
          cost_price: Number(created.cost_price ?? payload.cost_price),
          unit: created.unit ?? payload.unit,
          is_active: created.is_active ?? payload.is_active,
          created_at: new Date().toLocaleDateString('th-TH'),
        };
        setProducts(prev => [newRow, ...prev]);
        triggerNotification('success', `เพิ่มสินค้า "${productForm.name}" สำเร็จ`);
        setIsAddProductModalOpen(false);
      }
    } catch (err: any) {
      triggerNotification('error', `บันทึกไม่สำเร็จ: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async (id: number, name: string) => {
    if (confirm(`คุณต้องการลบสินค้า "${name}" (ID: #${id}) ใช่หรือไม่?`)) {
      try {
        const token = accessToken || await ensureApiAuth();
        if (token) {
          await catalogApi.deleteProduct(id, token);
        }
        setProducts(prev => prev.filter(p => p.id !== id));
        triggerNotification('success', `ลบสินค้า "${name}" เรียบร้อยแล้ว`);
      } catch (err: any) {
        triggerNotification('error', `ลบไม่สำเร็จ: ${err.message}`);
      }
    }
  };

  // ─── Category Handlers ─────────────────────────────────────────
  const handleOpenAddCategory = () => {
    setIsAddCategoryModalOpen(true);
    setCategoryForm({
      name: '',
      description: '',
      sort_order: categories.length,
    });
  };

  const handleOpenEditCategory = (item: CategoryRow) => {
    setEditingCategory(item);
    setCategoryForm({
      name: item.name,
      description: item.description || '',
      sort_order: item.sort_order,
    });
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = accessToken || await ensureApiAuth();
      if (!token) throw new Error('ไม่พบสิทธิ์การเข้าถึง API');

      if (editingCategory) {
        await catalogApi.updateCategory(editingCategory.id, {
          name: categoryForm.name,
          description: categoryForm.description || null,
          sort_order: Number(categoryForm.sort_order),
        }, token);

        setCategories(prev => prev.map(c => c.id === editingCategory.id ? {
          ...c,
          name: categoryForm.name,
          description: categoryForm.description || null,
          sort_order: Number(categoryForm.sort_order),
        } : c));

        triggerNotification('success', `อัปเดตหมวดหมู่ "${categoryForm.name}" สำเร็จ`);
        setEditingCategory(null);
      } else {
        const created = await catalogApi.createCategory({
          name: categoryForm.name,
          description: categoryForm.description || null,
          sort_order: Number(categoryForm.sort_order),
        }, token);

        const newRow: CategoryRow = {
          id: created.id ?? Date.now(),
          rowKey: `cat_${created.id ?? Date.now()}`,
          name: created.name ?? categoryForm.name,
          description: created.description ?? (categoryForm.description || null),
          parent_id: created.parent_id ?? null,
          sort_order: created.sort_order ?? Number(categoryForm.sort_order),
          is_active: created.is_active ?? true,
          created_at: new Date().toLocaleDateString('th-TH'),
        };

        setCategories(prev => [...prev, newRow]);
        triggerNotification('success', `เพิ่มหมวดหมู่ "${categoryForm.name}" สำเร็จ`);
        setIsAddCategoryModalOpen(false);
      }
    } catch (err: any) {
      triggerNotification('error', `บันทึกหมวดหมู่ไม่สำเร็จ: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = async (id: number, name: string) => {
    if (confirm(`คุณต้องการลบหมวดหมู่ "${name}" (ID: #${id}) ใช่หรือไม่?`)) {
      try {
        const token = accessToken || await ensureApiAuth();
        if (token) {
          await catalogApi.deleteCategory(id, token);
        }
        setCategories(prev => prev.filter(c => c.id !== id));
        triggerNotification('success', `ลบหมวดหมู่ "${name}" เรียบร้อยแล้ว`);
      } catch (err: any) {
        triggerNotification('error', `ลบไม่สำเร็จ: ${err.message}`);
      }
    }
  };

  // ─── Filtered Data ─────────────────────────────────────────────
  const filteredProducts = useMemo(() => {
    let result = [...products];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.id.toString().includes(q) ||
        (p.sku && p.sku.toLowerCase().includes(q)) ||
        (p.barcode && p.barcode.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q))
      );
    }
    if (selectedCategory) {
      result = result.filter(p => p.category_id === Number(selectedCategory));
    }
    if (selectedStatus) {
      const isActive = selectedStatus === 'active';
      result = result.filter(p => p.is_active === isActive);
    }
    return result;
  }, [products, search, selectedCategory, selectedStatus]);

  const filteredCategories = useMemo(() => {
    let result = [...categories];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.id.toString().includes(q) ||
        (c.description && c.description.toLowerCase().includes(q))
      );
    }
    return result;
  }, [categories, search]);

  // ─── Table Columns ─────────────────────────────────────────────
  const productColumns: Column<ProductRow>[] = [
    {
      header: 'ID',
      accessor: (row) => <span className="font-mono font-extrabold text-[#22e5ff] text-xs">#{row.id}</span>,
      sortable: true,
      sortKey: 'id',
    },
    {
      header: 'สินค้า / รายละเอียด',
      accessor: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-cyan-500/10 border border-cyan-500/30 text-[#22e5ff] shrink-0">
            <Wine className="w-4 h-4" />
          </div>
          <div>
            <div className="font-extrabold text-[#eef2ff] text-sm">{row.name}</div>
            <div className="text-[11px] text-[#5a6e90] truncate max-w-xs">
              {row.description || 'ไม่มีคำอธิบาย'}
            </div>
          </div>
        </div>
      ),
    },
    {
      header: 'หมวดหมู่',
      accessor: (row) => (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded bg-[rgba(34,229,255,0.08)] text-[#22e5ff] border border-[rgba(34,229,255,0.20)]">
          <Tag className="w-3 h-3" />
          {row.category_name || (row.category_id ? categoryMap.get(row.category_id) : undefined) || 'ทั่วไป'}
        </span>
      ),
    },
    {
      header: 'SKU / Barcode',
      accessor: (row) => (
        <div className="font-mono text-xs">
          <div className="text-[#94a3c4] font-semibold">{row.sku || '-'}</div>
          {row.barcode && <div className="text-[10px] text-[#5a6e90]">{row.barcode}</div>}
        </div>
      ),
    },
    {
      header: 'ราคาขาย (Selling Price)',
      accessor: (row) => (
        <span className="font-extrabold text-sm text-[#22e5ff]">
          ฿{row.selling_price.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
        </span>
      ),
      sortable: true,
      sortKey: 'selling_price',
    },
    {
      header: 'หน่วย',
      accessor: (row) => (
        <span className="text-xs text-[#94a3c4] font-medium uppercase">{row.unit || 'each'}</span>
      ),
    },
    {
      header: 'สถานะ',
      accessor: (row) => (
        row.is_active ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Check className="w-3 h-3" /> ขายอยู่
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <X className="w-3 h-3" /> ปิดการขาย
          </span>
        )
      ),
    },
    {
      header: 'การจัดการ',
      accessor: (row) => (
        <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => handleOpenEditProduct(row)}
            className="admin-btn-secondary p-1.5 cursor-pointer hover:border-[rgba(0,212,255,0.5)] transition"
            title="แก้ไขสินค้า"
          >
            <Edit2 className="w-3.5 h-3.5 text-[#22e5ff]" />
          </button>
          <button
            onClick={() => handleDeleteProduct(row.id, row.name)}
            className="admin-btn-danger p-1.5 cursor-pointer"
            title="ลบสินค้า"
          >
            <Trash2 className="w-3.5 h-3.5 text-[#fb7185]" />
          </button>
        </div>
      ),
      className: 'text-right'
    }
  ];

  const categoryColumns: Column<CategoryRow>[] = [
    {
      header: 'ID',
      accessor: (row) => <span className="font-mono font-extrabold text-[#22e5ff] text-sm">#{row.id}</span>,
      sortable: true,
      sortKey: 'id',
    },
    {
      header: 'ชื่อหมวดหมู่',
      accessor: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-cyan-500/10 border border-cyan-500/30 text-[#22e5ff] font-black text-xs">
            {row.id}
          </div>
          <div>
            <div className="font-extrabold text-[#eef2ff] text-sm">{row.name}</div>
            <div className="text-[11px] text-[#5a6e90]">
              {row.description ? row.description : '-'}
            </div>
          </div>
        </div>
      ),
    },
    {
      header: 'ลำดับ (Sort Order)',
      accessor: (row) => <span className="font-bold text-xs text-[#94a3c4]">{row.sort_order}</span>,
      sortable: true,
      sortKey: 'sort_order',
    },
    {
      header: 'สถานะ',
      accessor: (row) => (
        <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <Check className="w-3 h-3" />
          <span>Active</span>
        </span>
      ),
    },
    {
      header: 'วันที่สร้าง',
      accessor: (row) => <span className="text-xs text-[#5a6e90]">{row.created_at}</span>,
    },
    {
      header: 'การจัดการ',
      accessor: (row) => (
        <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => handleOpenEditCategory(row)}
            className="admin-btn-secondary p-1.5 cursor-pointer hover:border-[rgba(0,212,255,0.5)] transition"
            title="แก้ไขหมวดหมู่"
          >
            <Edit2 className="w-3.5 h-3.5 text-[#22e5ff]" />
          </button>
          <button
            onClick={() => handleDeleteCategory(row.id, row.name)}
            className="admin-btn-danger p-1.5 cursor-pointer"
            title="ลบหมวดหมู่"
          >
            <Trash2 className="w-3.5 h-3.5 text-[#fb7185]" />
          </button>
        </div>
      ),
      className: 'text-right'
    }
  ];

  return (
    <div className="space-y-5 sm:space-y-6 select-none font-sans animate-in" style={{ padding: '20px', maxWidth: 1500 }}>
      <AdminPageHeader
        title="จัดการสินค้า Web Wine (Bottle Club Catalog)"
        subtitle="เชื่อมต่อฐานข้อมูลสินค้าและหมวดหมู่ตรงจาก FastAPI Production (https://api.wayneven.uk)"
        icon={Wine}
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={() => loadData(true)}
              disabled={refreshing}
              className="p-2.5 px-3.5 rounded-xl transition-all duration-200 cursor-pointer disabled:opacity-50 flex items-center gap-2 text-xs font-semibold"
              style={{ color: '#22e5ff', background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.2)' }}
              title="รีเฟรชข้อมูลสินค้าและหมวดหมู่"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>รีเฟรชข้อมูล</span>
            </button>
            {activeTab === 'products' ? (
              <button
                onClick={handleOpenAddProduct}
                className="admin-btn-primary inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold cursor-pointer"
              >
                <Plus className="w-4 h-4" /> เพิ่มสินค้าใหม่
              </button>
            ) : (
              <button
                onClick={handleOpenAddCategory}
                className="admin-btn-primary inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold cursor-pointer"
              >
                <Plus className="w-4 h-4" /> เพิ่มหมวดหมู่ใหม่
              </button>
            )}
          </div>
        }
      />

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-[rgba(255,255,255,0.08)] pb-2">
        <button
          onClick={() => setActiveTab('products')}
          className={`px-4 py-2 text-xs font-black rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'products'
              ? 'bg-[rgba(34,229,255,0.15)] text-[#22e5ff] border border-[rgba(34,229,255,0.30)] shadow-[0_0_12px_rgba(34,229,255,0.2)]'
              : 'text-[#94a3c4] hover:text-[#eef2ff] hover:bg-white/5'
          }`}
        >
          <Wine className="w-4 h-4" />
          <span>รายการสินค้าไวน์และเครื่องดื่ม</span>
          <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] bg-white/10 font-mono">
            {products.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('categories')}
          className={`px-4 py-2 text-xs font-black rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'categories'
              ? 'bg-[rgba(34,229,255,0.15)] text-[#22e5ff] border border-[rgba(34,229,255,0.30)] shadow-[0_0_12px_rgba(34,229,255,0.2)]'
              : 'text-[#94a3c4] hover:text-[#eef2ff] hover:bg-white/5'
          }`}
        >
          <Tag className="w-4 h-4" />
          <span>หมวดหมู่สินค้า (Categories)</span>
          <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] bg-white/10 font-mono">
            {categories.length}
          </span>
        </button>
      </div>

      {notification && (
        <div className={`flex items-start gap-3 ${notification.type === 'success' ? 'admin-alert-success' : 'admin-alert-error'}`}>
          {notification.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="admin-panel flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="flex-1 w-full flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#3d4d6a]">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder={activeTab === 'products' ? 'ค้นหาชื่อสินค้า, SKU, Barcode...' : 'ค้นหาหมวดหมู่...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="admin-input pl-10 w-full text-xs"
            />
          </div>

          {activeTab === 'products' && (
            <>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="admin-select text-xs sm:w-44 shrink-0"
              >
                <option value="">ทุกหมวดหมู่</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="admin-select text-xs sm:w-36 shrink-0"
              >
                <option value="">สถานะทั้งหมด</option>
                <option value="active">เปิดขาย (Active)</option>
                <option value="inactive">ปิดการขาย</option>
              </select>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
          <button
            onClick={() => loadData(true)}
            disabled={loading || refreshing}
            className="admin-btn-secondary text-xs flex items-center gap-1.5 px-4 py-2.5 cursor-pointer"
            title="รีเฟรชข้อมูลจาก API"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading || refreshing ? 'animate-spin' : ''}`} />
            <span>รีเฟรช API</span>
          </button>

          {(search || selectedCategory || selectedStatus) && (
            <button
              onClick={() => { setSearch(''); setSelectedCategory(''); setSelectedStatus(''); }}
              className="admin-btn-secondary text-xs flex items-center gap-1.5 px-3 py-2.5 cursor-pointer text-[#fb7185]"
            >
              <RotateCcw className="w-3.5 h-3.5" /> ล้างกรอง
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="admin-alert-error flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Data Table */}
      {activeTab === 'products' ? (
        <DataTable
          columns={productColumns}
          data={filteredProducts}
          loading={loading}
          itemsPerPage={15}
          totalItems={filteredProducts.length}
          emptyMessage="ไม่พบรายการสินค้าใน FastAPI Database"
        />
      ) : (
        <DataTable
          columns={categoryColumns}
          data={filteredCategories}
          loading={loading}
          itemsPerPage={15}
          totalItems={filteredCategories.length}
          emptyMessage="ไม่พบข้อมูลหมวดหมู่ใน FastAPI Database"
        />
      )}

      {/* ─── Add/Edit Product Modal ─────────────────────────────── */}
      {(isAddProductModalOpen || editingProduct) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in">
          <div className="admin-modal max-w-lg w-full relative">
            <button
              onClick={() => { setIsAddProductModalOpen(false); setEditingProduct(null); }}
              className="absolute top-4 right-4 text-[#5a6e90] hover:text-[#eef2ff] p-1.5 rounded-lg hover:bg-white/5 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-[#22e5ff]">
                <Wine className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[#eef2ff]">
                  {editingProduct ? `แก้ไขสินค้า: ${editingProduct.name}` : 'เพิ่มสินค้าใหม่ลง FastAPI'}
                </h3>
                <p className="text-xs text-[#5a6e90]">
                  {editingProduct ? `รหัสสินค้า ID #${editingProduct.id}` : 'บันทึกข้อมูลเข้าฐานข้อมูล Catalog Products'}
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-left">
              <div>
                <label className="admin-label">ชื่อสินค้า *</label>
                <input
                  type="text"
                  required
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  placeholder="เช่น Mont Clair Red Wine 750ml"
                  className="admin-input w-full text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="admin-label">หมวดหมู่สินค้า</label>
                  <select
                    value={productForm.category_id}
                    onChange={(e) => setProductForm({ ...productForm, category_id: e.target.value })}
                    className="admin-select w-full text-xs"
                  >
                    <option value="">-- เลือกหมวดหมู่ --</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="admin-label">หน่วยสินค้า (Unit)</label>
                  <input
                    type="text"
                    value={productForm.unit}
                    onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })}
                    placeholder="เช่น each, bottle, can"
                    className="admin-input w-full text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="admin-label">รหัส SKU</label>
                  <input
                    type="text"
                    value={productForm.sku}
                    onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                    placeholder="เช่น MTC-750"
                    className="admin-input w-full text-xs"
                  />
                </div>

                <div>
                  <label className="admin-label">บาร์โค้ด (Barcode)</label>
                  <input
                    type="text"
                    value={productForm.barcode}
                    onChange={(e) => setProductForm({ ...productForm, barcode: e.target.value })}
                    placeholder="เช่น 885012345678"
                    className="admin-input w-full text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="admin-label">ราคาขาย (Selling Price ฿) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={productForm.selling_price}
                    onChange={(e) => setProductForm({ ...productForm, selling_price: e.target.value })}
                    placeholder="0.00"
                    className="admin-input w-full text-xs font-mono font-bold text-[#22e5ff]"
                  />
                </div>

                <div>
                  <label className="admin-label">ราคาทุน (Cost Price ฿)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={productForm.cost_price}
                    onChange={(e) => setProductForm({ ...productForm, cost_price: e.target.value })}
                    placeholder="0.00"
                    className="admin-input w-full text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="admin-label">รายละเอียดสินค้า</label>
                <textarea
                  rows={2}
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  placeholder="รายละเอียดเพิ่มเติมของสินค้า..."
                  className="admin-textarea w-full text-xs"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="product_active"
                  checked={productForm.is_active}
                  onChange={(e) => setProductForm({ ...productForm, is_active: e.target.checked })}
                  className="w-4 h-4 rounded text-cyan-500"
                />
                <label htmlFor="product_active" className="text-xs text-[#eef2ff] font-semibold cursor-pointer">
                  เปิดให้ลูกค้าสั่งซื้อสินค้าชิ้นนี้ (Active)
                </label>
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-[rgba(255,255,255,0.08)]">
                <button
                  type="button"
                  onClick={() => { setIsAddProductModalOpen(false); setEditingProduct(null); }}
                  className="admin-btn-secondary px-4 py-2 text-xs"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="admin-btn-primary px-5 py-2 text-xs font-bold inline-flex items-center gap-2"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>{editingProduct ? 'บันทึกการแก้ไข' : 'เพิ่มสินค้า'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Add/Edit Category Modal ────────────────────────────── */}
      {(isAddCategoryModalOpen || editingCategory) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in">
          <div className="admin-modal max-w-md w-full relative">
            <button
              onClick={() => { setIsAddCategoryModalOpen(false); setEditingCategory(null); }}
              className="absolute top-4 right-4 text-[#5a6e90] hover:text-[#eef2ff] p-1.5 rounded-lg hover:bg-white/5 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-[#22e5ff]">
                <Tag className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[#eef2ff]">
                  {editingCategory ? `แก้ไขหมวดหมู่: ${editingCategory.name}` : 'เพิ่มหมวดหมู่ใหม่'}
                </h3>
                <p className="text-xs text-[#5a6e90]">บันทึกหมวดหมู่สินค้าในระบบ Catalog</p>
              </div>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4 text-left">
              <div>
                <label className="admin-label">ชื่อหมวดหมู่ *</label>
                <input
                  type="text"
                  required
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  placeholder="เช่น Red Wine, White Wine, Spirits"
                  className="admin-input w-full text-xs"
                />
              </div>

              <div>
                <label className="admin-label">คำอธิบาย</label>
                <textarea
                  rows={2}
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  placeholder="รายละเอียดของหมวดหมู่นี้..."
                  className="admin-textarea w-full text-xs"
                />
              </div>

              <div>
                <label className="admin-label">ลำดับการแสดงผล (Sort Order)</label>
                <input
                  type="number"
                  value={categoryForm.sort_order}
                  onChange={(e) => setCategoryForm({ ...categoryForm, sort_order: Number(e.target.value) })}
                  className="admin-input w-full text-xs"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-[rgba(255,255,255,0.08)]">
                <button
                  type="button"
                  onClick={() => { setIsAddCategoryModalOpen(false); setEditingCategory(null); }}
                  className="admin-btn-secondary px-4 py-2 text-xs"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="admin-btn-primary px-5 py-2 text-xs font-bold inline-flex items-center gap-2"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>{editingCategory ? 'บันทึกการแก้ไข' : 'เพิ่มหมวดหมู่'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
