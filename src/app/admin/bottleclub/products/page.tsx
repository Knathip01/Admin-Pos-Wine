'use client';

import React, { useEffect, useState } from 'react';
import DataTable, { Column } from '@/components/admin/DataTable';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import { Wine, Search, Plus, Edit2, Trash2, ArrowUpDown, ShieldAlert, CheckCircle2, RotateCcw, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface ProductRow {
  id: number;
  name: string;
  price: number;
  stock: number;
  createdAt: string;
}

export default function AdminProductsPage() {
  const router = useRouter();
  
  // State
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [search, setSearch] = useState('');
  const [stockStatus, setStockStatus] = useState(''); // 'instock', 'low', 'out'
  
  // Notification states
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  async function loadProducts() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/products', { cache: 'no-store' });
      if (!res.ok) {
        throw new Error('ไม่สามารถดึงข้อมูลรายการสินค้าได้');
      }
      const json = await res.json();
      setProducts(json.products || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  const triggerNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  // Inline stock adjustment (+ / -)
  const handleAdjustStock = async (prodId: number, currentStock: number, delta: number) => {
    const newStock = Math.max(0, currentStock + delta);
    
    // Optimistic UI update
    setProducts(prev => prev.map(p => p.id === prodId ? { ...p, stock: newStock } : p));

    try {
      const res = await fetch(`/api/admin/products/${prodId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock: newStock })
      });

      if (!res.ok) {
        throw new Error('ไม่สามารถปรับปรุงสต็อกได้');
      }

      triggerNotification('success', `ปรับปรุงสต็อกสินค้าเรียบร้อยแล้ว`);
    } catch (err: any) {
      // Revert if failed
      setProducts(prev => prev.map(p => p.id === prodId ? { ...p, stock: currentStock } : p));
      triggerNotification('error', err.message);
    }
  };

  const handleDeleteProduct = async (prodId: number, name: string) => {
    if (confirm(`คุณต้องการลบสินค้า "${name}" ใช่หรือไม่? (การลบจะไม่สามารถกู้คืนได้)`)) {
      try {
        const res = await fetch(`/api/admin/products/${prodId}`, {
          method: 'DELETE'
        });

        if (!res.ok) {
          throw new Error('เกิดข้อผิดพลาดในการลบสินค้า');
        }

        setProducts(prev => prev.filter(p => p.id !== prodId));
        triggerNotification('success', `ลบสินค้า "${name}" เรียบร้อยแล้ว`);
      } catch (err: any) {
        triggerNotification('error', err.message);
      }
    }
  };

  // Filter products locally
  let filteredProducts = [...products];
  if (search) {
    const q = search.toLowerCase();
    filteredProducts = filteredProducts.filter(p => p.name.toLowerCase().includes(q) || p.id.toString().includes(q));
  }
  if (stockStatus) {
    if (stockStatus === 'instock') filteredProducts = filteredProducts.filter(p => p.stock > 10);
    else if (stockStatus === 'low') filteredProducts = filteredProducts.filter(p => p.stock > 0 && p.stock <= 10);
    else if (stockStatus === 'out') filteredProducts = filteredProducts.filter(p => p.stock === 0);
  }

  // Columns for DataTable
  const columns: Column<ProductRow>[] = [
    {
      header: 'รหัสสินค้า',
      accessor: (row) => <span className="font-bold text-stone-500">#{row.id}</span>,
      sortable: true,
      sortKey: 'id',
    },
    {
      header: 'ชื่อสินค้า',
      accessor: (row) => <span className="font-bold text-stone-800">{row.name}</span>,
    },
    {
      header: 'ราคาสินค้า',
      accessor: (row) => <span className="font-bold text-stone-800">฿{row.price.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>,
    },
    {
      header: 'สถานะสต็อก',
      accessor: (row) => {
        if (row.stock === 0) {
          return <span className="badge-rejected text-[10px] font-bold px-2.5 py-1 rounded-full">สินค้าหมด (Out)</span>;
        } else if (row.stock <= 10) {
          return <span className="badge-pending text-[10px] font-bold px-2.5 py-1 rounded-full">ใกล้หมด (Low)</span>;
        } else {
          return <span className="badge-delivered text-[10px] font-bold px-2.5 py-1 rounded-full">ปกติ (In Stock)</span>;
        }
      }
    },
    {
      header: 'จำนวนสต็อก',
      accessor: (row) => (
        <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => handleAdjustStock(row.id, row.stock, -1)}
            disabled={row.stock <= 0}
            className="admin-icon-btn w-8 h-8 font-black text-sm disabled:opacity-30"
          >
            -
          </button>
          <span className="font-bold text-stone-800 min-w-8 text-center text-sm">{row.stock}</span>
          <button
            onClick={() => handleAdjustStock(row.id, row.stock, 1)}
            className="admin-icon-btn w-8 h-8 font-black text-sm"
          >
            +
          </button>
        </div>
      )
    },
    {
      header: 'การจัดการ',
      accessor: (row) => (
        <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
          <Link
            href={`/admin/products/${row.id}/edit`}
            className="admin-icon-btn"
            title="แก้ไขสินค้า"
          >
            <Edit2 className="w-4 h-4" />
          </Link>
          <button
            onClick={() => handleDeleteProduct(row.id, row.name)}
            className="admin-icon-btn"
            title="ลบสินค้า"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
      className: 'text-right'
    }
  ];

  return (
    <div className="space-y-5 sm:space-y-6 select-none font-sans">
      <AdminPageHeader
        title="จัดการข้อมูลสินค้า"
        subtitle="เพิ่ม ลบ แก้ไขข้อมูลไวน์ และปรับสต็อกสินค้าด่วน"
        icon={Wine}
        action={
          <Link href="/admin/products/new" className="admin-btn-primary inline-flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold cursor-pointer shimmer-btn">
            <Plus className="w-4 h-4" /> เพิ่มสินค้าใหม่
          </Link>
        }
      />

      {notification && (
        <div className={`flex items-start gap-3 ${notification.type === 'success' ? 'admin-alert-success' : 'admin-alert-error'}`}>
          {notification.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          <span>{notification.message}</span>
        </div>
      )}

      <div className="admin-panel flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="ค้นหาชื่อสินค้า หรือ รหัสสินค้า..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="admin-input w-full pl-11 pr-4 py-3 rounded-xl text-xs"
          />
        </div>

        <div className="w-full md:w-64">
          <select value={stockStatus} onChange={(e) => setStockStatus(e.target.value)} className="admin-select">
            <option value="">ทั้งหมด (สถานะสต็อก)</option>
            <option value="instock">มีสินค้าคลัง (&gt;10)</option>
            <option value="low">ใกล้หมดสต็อก (1-10)</option>
            <option value="out">สินค้าหมด (0)</option>
          </select>
        </div>

        {(search || stockStatus) && (
          <button onClick={() => { setSearch(''); setStockStatus(''); }} className="admin-btn-secondary px-4 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shrink-0">
            <RotateCcw className="w-3.5 h-3.5" /> ล้าง
          </button>
        )}
      </div>

      {error && (
        <div className="admin-alert-error flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={filteredProducts}
        loading={loading}
        itemsPerPage={15}
        totalItems={filteredProducts.length}
        emptyMessage="ไม่พบข้อมูลสินค้าที่ค้นหา"
      />
    </div>
  );
}
