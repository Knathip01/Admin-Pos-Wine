'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { INITIAL_PRODUCTS, INITIAL_CATEGORIES } from '@/lib/mock-data';
import DataTable, { Column } from '@/components/admin/DataTable';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import {
  Wine, Search, Plus, Edit2, Trash2, ShieldAlert, CheckCircle2,
  RotateCcw, AlertTriangle, X, Loader2, Save, Tag, Check, RefreshCw,
  Layers, Package, DollarSign, Barcode, Sparkles, BookOpen, DownloadCloud, Globe
} from 'lucide-react';
import { catalogApi } from '@/lib/api/catalog';
import { wineProductsApi, type WineProductItem } from '@/lib/api/wine-products';
import type { CategoryResponse, ProductResponse } from '@/lib/api/types';
import { useApiAuth, ensureApiAuth } from '@/lib/store/api-auth';

interface ProductRow {
  id: string | number;
  rowKey: string;
  name: string;
  description: string | null;
  category_id: string | number | null;
  category_name?: string;
  sku: string | null;
  barcode: string | null;
  selling_price: number;
  cost_price: number;
  unit: string | null;
  stock?: number;
  image_url?: string | null;
  is_active: boolean;
  created_at: string;
}

interface CategoryRow {
  id: string | number;
  rowKey: string;
  name: string;
  description: string | null;
  icon?: string;
  color?: string;
  parent_id?: number | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export default function AdminProductsPage() {
  const supabase = createClient();
  const { accessToken } = useApiAuth();

  // Tab State: 'products' | 'categories' | 'wine_catalog'
  const [activeTab, setActiveTab] = useState<'products' | 'categories' | 'wine_catalog'>('products');

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

  type WineProductRow = WineProductItem;

  const MOCK_WINE_CATALOG: WineProductItem[] = [
    {
      id: 1,
      code: '3011360001018',
      product_name: 'Château Margaux Premier Grand Cru Classé',
      brands: 'Château Margaux',
      countries_en: 'France',
      categories_en: 'Red Wine (Bordeaux)',
      origins_en: 'Bordeaux',
      ingredients_text: 'Grape, Sulphites',
      image_small_url: null,
      created_at: '2026-01-01T00:00:00Z',
      alcohol_100g: '13.5',
      quantity: '750 ml',
      image_url: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 2,
      code: '8002270001025',
      product_name: 'Sassicaia Tenuta San Guido Bolgheri',
      brands: 'Tenuta San Guido',
      countries_en: 'Italy',
      categories_en: 'Super Tuscan Red Wine',
      origins_en: 'Tuscany',
      ingredients_text: 'Cabernet Sauvignon, Cabernet Franc',
      image_small_url: null,
      created_at: '2026-01-01T00:00:00Z',
      alcohol_100g: '14.0',
      quantity: '750 ml',
      image_url: 'https://images.unsplash.com/photo-1586370434639-0fe43b2d32e6?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 3,
      code: '3185370001032',
      product_name: 'Dom Pérignon Vintage Brut Champagne',
      brands: 'Moët & Chandon',
      countries_en: 'France',
      categories_en: 'Champagne & Sparkling',
      origins_en: 'Champagne',
      ingredients_text: 'Chardonnay, Pinot Noir',
      image_small_url: null,
      created_at: '2026-01-01T00:00:00Z',
      alcohol_100g: '12.5',
      quantity: '750 ml',
      image_url: 'https://images.unsplash.com/photo-1569919659476-f0852f6834b7?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 4,
      code: '9414430001049',
      product_name: 'Cloudy Bay Sauvignon Blanc Marlborough',
      brands: 'Cloudy Bay',
      countries_en: 'New Zealand',
      categories_en: 'White Wine',
      origins_en: 'Marlborough',
      ingredients_text: 'Sauvignon Blanc',
      image_small_url: null,
      created_at: '2026-01-01T00:00:00Z',
      alcohol_100g: '13.0',
      quantity: '750 ml',
      image_url: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 5,
      code: '9311043001056',
      product_name: 'Penfolds Bin 389 Cabernet Shiraz',
      brands: 'Penfolds',
      countries_en: 'Australia',
      categories_en: 'Red Wine (South Australia)',
      origins_en: 'Barossa Valley',
      ingredients_text: 'Cabernet Sauvignon, Shiraz',
      image_small_url: null,
      created_at: '2026-01-01T00:00:00Z',
      alcohol_100g: '14.5',
      quantity: '750 ml',
      image_url: 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 6,
      code: '0887770001063',
      product_name: 'Opus One Napa Valley Red Wine',
      brands: 'Opus One Winery',
      countries_en: 'United States',
      categories_en: 'Bordeaux Blend (Napa Valley)',
      origins_en: 'Oakville, California',
      ingredients_text: 'Cabernet Sauvignon, Petit Verdot, Merlot',
      image_small_url: null,
      created_at: '2026-01-01T00:00:00Z',
      alcohol_100g: '14.5',
      quantity: '750 ml',
      image_url: 'https://images.unsplash.com/photo-1558001373-7b93ee48ffa0?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 7,
      code: '3760050001070',
      product_name: 'Château d\'Esclans Whispering Angel Rosé',
      brands: 'Château d\'Esclans',
      countries_en: 'France',
      categories_en: 'Rosé Wine (Côtes de Provence)',
      origins_en: 'Provence',
      ingredients_text: 'Grenache, Cinsault, Rolle',
      image_small_url: null,
      created_at: '2026-01-01T00:00:00Z',
      alcohol_100g: '13.0',
      quantity: '750 ml',
      image_url: 'https://images.unsplash.com/photo-1558001373-7b93ee48ffa0?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 8,
      code: '8001110001087',
      product_name: 'Barolo DOCG Pio Cesare Piedmont',
      brands: 'Pio Cesare',
      countries_en: 'Italy',
      categories_en: 'Red Wine (Nebbiolo)',
      origins_en: 'Piedmont',
      ingredients_text: 'Nebbiolo 100%',
      image_small_url: null,
      created_at: '2026-01-01T00:00:00Z',
      alcohol_100g: '14.0',
      quantity: '750 ml',
      image_url: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=600&q=80',
    }
  ];

  // 🍷 Wine Reference Catalog State (Section 13 /api/v1/wine-products/)
  const [wineProducts, setWineProducts] = useState<WineProductRow[]>(MOCK_WINE_CATALOG);
  const [wineLoading, setWineLoading] = useState(false);
  const [wineTotal, setWineTotal] = useState(MOCK_WINE_CATALOG.length);
  const [winePage, setWinePage] = useState(1);

  async function loadWineCatalog(page = 1, searchQuery = '') {
    setWineLoading(true);
    try {
      const res = await wineProductsApi.list({ page, per_page: 15, search: searchQuery || undefined });
      if (res && res.items && res.items.length > 0) {
        setWineProducts((res.items || []).map((item, idx) => ({ ...item, id: item.id ?? idx + 1 })));
        setWineTotal(res.total || 0);
        setWinePage(page);
        return;
      }
    } catch (err) {
      console.warn('Failed to load wine reference catalog:', err);
    } finally {
      setWineLoading(false);
    }

    // Fallback filter
    let filtered = [...MOCK_WINE_CATALOG];
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      filtered = filtered.filter(w =>
        (w.product_name && w.product_name.toLowerCase().includes(q)) ||
        (w.brands && w.brands.toLowerCase().includes(q)) ||
        (w.countries_en && w.countries_en.toLowerCase().includes(q)) ||
        (w.categories_en && w.categories_en.toLowerCase().includes(q)) ||
        (w.code && w.code.includes(q))
      );
    }
    setWineProducts(filtered);
    setWineTotal(filtered.length);
    setWinePage(page);
  }

  const handleImportWineProduct = (wp: WineProductItem) => {
    setIsAddProductModalOpen(true);
    setProductForm({
      name: wp.product_name || `Wine ${wp.code}`,
      description: [wp.brands, wp.countries_en, wp.categories_en, wp.alcohol_100g ? `แอลกอฮอล์ ${wp.alcohol_100g}%` : null].filter(Boolean).join(' • '),
      category_id: categories.length > 0 ? String(categories[0].id) : '',
      sku: wp.code,
      barcode: wp.code,
      selling_price: '890',
      cost_price: '550',
      unit: wp.quantity || 'ขวด',
      is_active: true,
    });
    triggerNotification('success', `คัดลอกข้อมูล "${wp.product_name}" เข้าระบบแล้ว กรุณาระบุราคาขายและกดบันทึก`);
  };

  // Map category_id -> name for quick lookup
  const categoryMap = useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach(c => map.set(String(c.id), c.name));
    return map;
  }, [categories]);

  async function loadData(force = false) {
    if (products.length === 0 && categories.length === 0) {
      setLoading(true);
    }
    if (force) {
      setRefreshing(true);
    }
    setError(null);
    try {
      // 1. Fetch Categories & Products concurrently from Supabase
      const [{ data: catData, error: catErr }, { data: prodData, error: prodErr }] = await Promise.all([
        supabase.from('categories').select('*').order('sort_order').order('name'),
        supabase.from('products').select('*, categories(name, icon, color)').order('name')
      ]);

      if (catErr) console.warn('Supabase categories error:', catErr);
      if (prodErr) console.warn('Supabase products error:', prodErr);

      // Parse Categories
      let catList: CategoryRow[] = [];
      const rawCats = (catData && catData.length > 0) ? catData : INITIAL_CATEGORIES;
      catList = rawCats.map((c: any) => ({
        id: c.id,
        rowKey: `cat_${c.id}`,
        name: c.name,
        description: c.description ?? null,
        icon: c.icon ?? '🍷',
        color: c.color ?? '#8B1A2C',
        parent_id: null,
        sort_order: c.sort_order ?? 0,
        is_active: c.is_active ?? true,
        created_at: c.created_at ? new Date(c.created_at).toLocaleDateString('th-TH') : '-',
      }));
      setCategories(catList);

      const catMapLocal = new Map<string, string>();
      catList.forEach(c => catMapLocal.set(String(c.id), c.name));

      // Parse Products
      const rawProds = (prodData && prodData.length > 0) ? prodData : INITIAL_PRODUCTS;
      setProducts(rawProds.map((p: any) => ({
        id: p.id,
        rowKey: `prod_${p.id}`,
        name: p.name,
        description: p.description ?? null,
        category_id: p.category_id ?? null,
        category_name: p.categories?.name || (p.category_id ? catMapLocal.get(String(p.category_id)) : undefined) || 'ทั่วไป',
        sku: p.sku ?? null,
        barcode: p.barcode ?? null,
        selling_price: Number(p.price ?? p.selling_price ?? 0),
        cost_price: Number(p.cost ?? p.cost_price ?? 0),
        unit: p.unit ?? (p.volume_ml ? `${p.volume_ml}ml` : 'ขวด'),
        stock: p.stock ?? 0,
        image_url: p.image_url ?? null,
        is_active: p.is_active ?? true,
        created_at: p.created_at ? new Date(p.created_at).toLocaleDateString('th-TH') : '-',
      })));
    } catch (err: any) {
      console.error('Failed to load data from Supabase:', err);
      setError(err.message || 'ไม่สามารถดึงข้อมูลจาก Supabase ได้');
      // Safe fallback to mock data
      setCategories(INITIAL_CATEGORIES.map(c => ({
        id: c.id,
        rowKey: `cat_${c.id}`,
        name: c.name,
        description: c.description ?? null,
        sort_order: c.sort_order ?? 0,
        is_active: c.is_active ?? true,
        created_at: '-',
      })));
      setProducts(INITIAL_PRODUCTS.map(p => ({
        id: p.id,
        rowKey: `prod_${p.id}`,
        name: p.name,
        description: p.description ?? null,
        category_id: p.category_id ?? null,
        category_name: 'ทั่วไป',
        sku: p.sku ?? null,
        barcode: p.barcode ?? null,
        selling_price: p.price,
        cost_price: p.cost,
        unit: 'ขวด',
        stock: p.stock,
        image_url: p.image_url ?? null,
        is_active: p.is_active,
        created_at: '-',
      })));
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
      const price = Number(productForm.selling_price) || 0;
      if (price <= 0) {
        triggerNotification('error', 'ราคาขาย (Selling Price) ต้องมากกว่า 0 บาท');
        setSaving(false);
        return;
      }

      const payload = {
        id: editingProduct?.id,
        name: productForm.name.trim(),
        description: productForm.description || null,
        category_id: productForm.category_id || null,
        sku: productForm.sku || null,
        barcode: productForm.barcode || null,
        price,
        cost: Number(productForm.cost_price) || 0,
        unit: productForm.unit || 'ขวด',
        is_active: productForm.is_active,
      };

      if (editingProduct) {
        const res = await fetch('/api/admin/products', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok || data.error) throw new Error(data.error || 'อัปเดตสินค้าไม่สำเร็จ');
        triggerNotification('success', `อัปเดตข้อมูลสินค้า "${productForm.name}" ใน Supabase สำเร็จ`);
        setEditingProduct(null);
      } else {
        const res = await fetch('/api/admin/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok || data.error) throw new Error(data.error || 'เพิ่มสินค้าไม่สำเร็จ');
        triggerNotification('success', `เพิ่มสินค้า "${productForm.name}" ลงใน Supabase สำเร็จ`);
        setIsAddProductModalOpen(false);
      }
      await loadData();
    } catch (err: any) {
      triggerNotification('error', `บันทึกไม่สำเร็จ: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async (id: string | number, name: string) => {
    if (confirm(`คุณต้องการลบสินค้า "${name}" ใช่หรือไม่?`)) {
      try {
        const res = await fetch(`/api/admin/products?id=${encodeURIComponent(id)}`, {
          method: 'DELETE',
        });
        const data = await res.json();
        if (!res.ok || data.error) throw new Error(data.error || 'ลบสินค้าไม่สำเร็จ');
        triggerNotification('success', data.message || `ลบสินค้า "${name}" เรียบร้อยแล้ว`);
        await loadData();
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
      const payload = {
        name: categoryForm.name.trim(),
        description: categoryForm.description?.trim() || null,
        sort_order: Number(categoryForm.sort_order) || 0,
        is_active: true,
      };

      if (!payload.name) {
        triggerNotification('error', 'กรุณาระบุชื่อหมวดหมู่');
        setSaving(false);
        return;
      }

      if (editingCategory) {
        const { error } = await supabase
          .from('categories')
          .update(payload)
          .eq('id', editingCategory.id);
        if (error) throw error;
        triggerNotification('success', `อัปเดตหมวดหมู่ "${categoryForm.name}" สำเร็จ`);
        setEditingCategory(null);
      } else {
        const { error } = await supabase
          .from('categories')
          .insert(payload);
        if (error) throw error;
        triggerNotification('success', `เพิ่มหมวดหมู่ "${categoryForm.name}" สำเร็จ`);
        setIsAddCategoryModalOpen(false);
      }
      await loadData();
    } catch (err: any) {
      triggerNotification('error', `บันทึกหมวดหมู่ไม่สำเร็จ: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = async (id: string | number, name: string) => {
    if (confirm(`คุณต้องการลบหมวดหมู่ "${name}" ใช่หรือไม่?`)) {
      try {
        const { error } = await supabase
          .from('categories')
          .delete()
          .eq('id', id);
        if (error) throw error;
        triggerNotification('success', `ลบหมวดหมู่ "${name}" เรียบร้อยแล้ว`);
        await loadData();
      } catch (err: any) {
        triggerNotification('error', `ลบหมวดหมู่ไม่สำเร็จ: ${err.message}`);
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
      result = result.filter(p => String(p.category_id) === String(selectedCategory));
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
      header: 'ID / รหัส',
      accessor: (row) => <span className="font-mono font-extrabold text-[#22e5ff] text-xs">#{String(row.id).slice(0, 8)}</span>,
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
          {row.category_name || (row.category_id ? categoryMap.get(String(row.category_id)) : undefined) || 'ทั่วไป'}
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

  const wineColumns: Column<WineProductRow>[] = [
    {
      header: 'รหัสสินค้า',
      accessor: (row) => <span className="font-mono font-bold text-[#22e5ff] text-xs">#{row.code}</span>,
      sortable: true,
      sortKey: 'code',
    },
    {
      header: 'ชื่อไวน์ / แบรนด์',
      accessor: (row) => (
        <div className="flex items-center gap-2.5">
          {row.image_small_url || row.image_url ? (
            <img src={row.image_small_url || row.image_url || ''} alt={row.product_name || ''} className="w-9 h-9 rounded-lg object-contain bg-white/5 border border-white/10 shrink-0" />
          ) : (
            <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-cyan-500/10 border border-cyan-500/30 text-[#22e5ff] shrink-0">
              <Wine className="w-4 h-4" />
            </div>
          )}
          <div>
            <div className="font-extrabold text-[#eef2ff] text-sm">{row.product_name || `Wine ${row.code}`}</div>
            <div className="text-[11px] text-[#5a6e90]">{row.brands || 'Unbranded'}</div>
          </div>
        </div>
      ),
    },
    {
      header: 'หมวดหมู่ / แหล่งกำเนิด',
      accessor: (row) => (
        <div className="text-xs">
          <div className="text-[#94a3c4] font-semibold">{row.categories_en || '-'}</div>
          <div className="text-[10px] text-[#5a6e90] flex items-center gap-1">
            <Globe className="w-2.5 h-2.5" />
            <span>{row.countries_en || row.origins_en || '-'}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'ปริมาณ / แอลกอฮอล์',
      accessor: (row) => (
        <div className="text-xs font-mono">
          <div className="text-[#94a3c4]">{row.quantity || '-'}</div>
          {row.alcohol_100g && <div className="text-[10px] text-amber-300 font-semibold">{row.alcohol_100g}% Alc</div>}
        </div>
      ),
    },
    {
      header: 'การจัดการ',
      accessor: (row) => (
        <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => handleImportWineProduct(row)}
            className="admin-btn-primary text-xs px-3 py-1.5 flex items-center gap-1.5 cursor-pointer font-bold"
            title="คัดลอกข้อมูลเข้าแคตตาล็อกร้านค้า"
          >
            <DownloadCloud className="w-3.5 h-3.5" />
            <span>นำเข้าสู่ร้านค้า</span>
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
        subtitle="เชื่อมต่อฐานข้อมูลสินค้าและหมวดหมู่ตรงจาก Supabase (PostgreSQL)"
        icon={Wine}
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (activeTab === 'wine_catalog') loadWineCatalog(winePage, search);
                else loadData(true);
              }}
              disabled={refreshing || wineLoading}
              className="p-2.5 px-3.5 rounded-xl transition-all duration-200 cursor-pointer disabled:opacity-50 flex items-center gap-2 text-xs font-semibold"
              style={{ color: '#22e5ff', background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.2)' }}
              title="รีเฟรชข้อมูลสินค้าและหมวดหมู่"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${(refreshing || wineLoading) ? 'animate-spin' : ''}`} />
              <span>รีเฟรชข้อมูล</span>
            </button>
            {activeTab === 'products' ? (
              <button
                onClick={handleOpenAddProduct}
                className="admin-btn-primary inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold cursor-pointer"
              >
                <Plus className="w-4 h-4" /> เพิ่มสินค้าใหม่
              </button>
            ) : activeTab === 'categories' ? (
              <button
                onClick={handleOpenAddCategory}
                className="admin-btn-primary inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold cursor-pointer"
              >
                <Plus className="w-4 h-4" /> เพิ่มหมวดหมู่ใหม่
              </button>
            ) : null}
          </div>
        }
      />

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-[rgba(255,255,255,0.08)] pb-2 flex-wrap">
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

        <button
          onClick={() => {
            setActiveTab('wine_catalog');
            if (wineProducts.length === 0) loadWineCatalog(1, search);
          }}
          className={`px-4 py-2 text-xs font-black rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'wine_catalog'
              ? 'bg-[rgba(34,229,255,0.15)] text-[#22e5ff] border border-[rgba(34,229,255,0.30)] shadow-[0_0_12px_rgba(34,229,255,0.2)]'
              : 'text-[#94a3c4] hover:text-[#eef2ff] hover:bg-white/5'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>ฐานข้อมูลไวน์อ้างอิง (Wine DB)</span>
          <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] bg-white/10 font-mono">
            {wineTotal > 0 ? wineTotal : '141+'}
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
          emptyMessage="ไม่พบรายการสินค้าใน Supabase Database"
        />
      ) : activeTab === 'categories' ? (
        <DataTable
          columns={categoryColumns}
          data={filteredCategories}
          loading={loading}
          itemsPerPage={15}
          totalItems={filteredCategories.length}
          emptyMessage="ไม่พบข้อมูลหมวดหมู่ใน Supabase Database"
        />
      ) : (
        <div className="space-y-4">
          <DataTable
            columns={wineColumns}
            data={wineProducts}
            loading={wineLoading}
            itemsPerPage={15}
            totalItems={wineTotal}
            currentPage={winePage}
            onPageChange={(page) => loadWineCatalog(page, search)}
            emptyMessage="ไม่พบรายการไวน์อ้างอิงจาก Open Food Facts API (สามารถกดค้นหาหรือรีเฟรชได้)"
          />
        </div>
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
                  {editingProduct ? `แก้ไขสินค้า: ${editingProduct.name}` : 'เพิ่มสินค้าใหม่ลงใน Supabase'}
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
