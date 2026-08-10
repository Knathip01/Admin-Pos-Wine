'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, ChevronsUpDown, ChevronLeft, ChevronRight } from 'lucide-react';

export interface Column<T> {
  header: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
  sortable?: boolean;
  sortKey?: string;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  totalItems?: number;
  itemsPerPage?: number;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  onSort?: (key: string, direction: 'asc' | 'desc') => void;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
}

export default function DataTable<T extends { id: any }>({
  columns,
  data,
  loading = false,
  totalItems = 0,
  itemsPerPage = 10,
  currentPage = 1,
  onPageChange,
  onSort,
  emptyMessage = 'ไม่พบข้อมูลที่ต้องการแสดง',
  onRowClick,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (column: Column<T>) => {
    if (!column.sortable || !onSort) return;

    const key = column.sortKey || (typeof column.accessor === 'string' ? (column.accessor as string) : '');
    if (!key) return;

    let newDir: 'asc' | 'desc' = 'asc';
    if (sortKey === key) {
      newDir = sortDirection === 'asc' ? 'desc' : 'asc';
    }

    setSortKey(key);
    setSortDirection(newDir);
    onSort(key, newDir);
  };

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const renderSortIcon = (column: Column<T>) => {
    if (!column.sortable) return null;
    const key = column.sortKey || (typeof column.accessor === 'string' ? (column.accessor as string) : '');
    if (sortKey !== key) return <ChevronsUpDown className="w-3.5 h-3.5 text-stone-400" />;
    return sortDirection === 'asc' ? (
      <ChevronUp className="w-3.5 h-3.5 text-red-600" />
    ) : (
      <ChevronDown className="w-3.5 h-3.5 text-red-600" />
    );
  };

  return (
    <div className="admin-table-wrap select-none">
      <div className="overflow-x-auto w-full">
        <table className="w-full text-left border-collapse min-w-[640px]">
          <thead>
            <tr className="admin-table-head">
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  onClick={() => handleSort(col)}
                  className={`${col.sortable ? 'sortable' : ''} ${col.className || ''}`}
                >
                  <div className="flex items-center gap-1.5">
                    <span>{col.header}</span>
                    {renderSortIcon(col)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: Math.min(itemsPerPage, 5) }).map((_, rIdx) => (
                <tr key={rIdx} className="admin-table-row animate-pulse">
                  {columns.map((_, cIdx) => (
                    <td key={cIdx} className="px-5 py-4">
                      <div className="h-4 rounded-md" style={{ background: 'rgba(0,0,0,0.06)', width: '66%' }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-16 text-center text-sm text-stone-500 font-semibold">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={`admin-table-row text-sm ${onRowClick ? 'cursor-pointer' : ''}`}
                >
                  {columns.map((col, cIdx) => {
                    let cellContent: React.ReactNode;
                    if (typeof col.accessor === 'function') {
                      cellContent = col.accessor(row);
                    } else {
                      cellContent = (row[col.accessor] as any)?.toString() || '';
                    }

                    return (
                      <td key={cIdx} className={`px-5 py-4 font-medium text-stone-600 ${col.className || ''}`}>
                        {cellContent}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && onPageChange && (
        <div className="admin-table-pagination flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-xs text-stone-500 font-semibold">
            แสดง {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)} –{' '}
            {Math.min(currentPage * itemsPerPage, totalItems)} จาก {totalItems} รายการ
          </span>
          <div className="flex gap-1.5 flex-wrap justify-center">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="admin-page-btn flex items-center justify-center p-2"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: Math.min(totalPages, 7) }).map((_, idx) => {
              let p: number;
              if (totalPages <= 7) {
                p = idx + 1;
              } else if (currentPage <= 4) {
                p = idx + 1;
              } else if (currentPage >= totalPages - 3) {
                p = totalPages - 6 + idx;
              } else {
                p = currentPage - 3 + idx;
              }
              const isCurrent = p === currentPage;
              return (
                <button
                  key={p}
                  onClick={() => onPageChange(p)}
                  className={`admin-page-btn ${isCurrent ? 'admin-page-btn-active' : ''}`}
                >
                  {p}
                </button>
              );
            })}
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="admin-page-btn flex items-center justify-center p-2"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
