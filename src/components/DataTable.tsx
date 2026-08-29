'use client';

import { useState, type ReactNode } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Loading, EmptyState } from './ui';

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  className?: string;
}

export interface TableFilter {
  key: string;
  label: string;
  options: { value: string; label: string }[];
}

export function DataTable<T extends { id?: string }>({
  columns,
  rows,
  loading,
  empty,
  onRowClick,
  filters,
  selectable,
  selectedIds,
  onSelectChange,
  actions,
}: {
  columns: Column<T>[];
  rows: T[];
  loading?: boolean;
  empty?: { title: string; message: string; action?: ReactNode };
  onRowClick?: (row: T) => void;
  filters?: TableFilter[];
  selectable?: boolean;
  selectedIds?: string[];
  onSelectChange?: (ids: string[]) => void;
  actions?: ReactNode;
}) {
  const [sort, setSort] = useState<{ key: string; dir: 'asc' | 'desc' } | null>(null);
  const [search, setSearch] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 12;

  if (loading) return <Loading />;

  let filtered = rows;

  // Apply search query
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter((r) =>
      Object.values(r)
        .filter((v) => typeof v === 'string')
        .some((v) => (v as string).toLowerCase().includes(q)),
    );
  }

  // Apply column filters
  for (const [key, value] of Object.entries(activeFilters)) {
    if (value && value !== 'ALL') {
      filtered = filtered.filter((r) => {
        const val = (r as Record<string, unknown>)[key];
        return String(val ?? '').toLowerCase() === value.toLowerCase();
      });
    }
  }

  // Apply sorting
  if (sort) {
    filtered = [...filtered].sort((a, b) => {
      const av = (a as Record<string, unknown>)[sort.key];
      const bv = (b as Record<string, unknown>)[sort.key];
      const cmp = String(av ?? '').localeCompare(String(bv ?? ''));
      return sort.dir === 'asc' ? cmp : -cmp;
    });
  }

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const toggleSelectAll = () => {
    if (!onSelectChange) return;
    const pageIds = pageRows.map((r) => r.id!).filter(Boolean);
    const allSelected = pageIds.every((id) => selectedIds?.includes(id));
    if (allSelected) {
      onSelectChange((selectedIds || []).filter((id) => !pageIds.includes(id)));
    } else {
      const combined = Array.from(new Set([...(selectedIds || []), ...pageIds]));
      onSelectChange(combined);
    }
  };

  const toggleSelectRow = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onSelectChange) return;
    if (selectedIds?.includes(id)) {
      onSelectChange(selectedIds.filter((i) => i !== id));
    } else {
      onSelectChange([...(selectedIds || []), id]);
    }
  };

  return (
    <div>
      {/* Controls Bar: Search, Filters, Bulk Actions */}
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            placeholder="Search…"
            className="min-h-[44px] flex-1 rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 text-sm text-[#1E232B] outline-none transition-all focus:border-[#FF5A5F] focus:bg-white sm:max-w-xs"
          />

          {filters?.map((f) => (
            <select
              key={f.key}
              value={activeFilters[f.key] || 'ALL'}
              onChange={(e) => {
                setActiveFilters((prev) => ({ ...prev, [f.key]: e.target.value }));
                setPage(0);
              }}
              className="min-h-[44px] rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 text-sm font-semibold text-[#1E232B] outline-none transition-all focus:border-[#FF5A5F] focus:bg-white cursor-pointer"
            >
              <option value="ALL">All {f.label}</option>
              {f.options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {actions}
          <p className="font-mono text-xs font-bold text-[#94A3B8]">
            {filtered.length} result{filtered.length === 1 ? '' : 's'}
          </p>
        </div>
      </div>

      {filtered.length === 0 ? (
        empty ? (
          <EmptyState title={empty.title} message={empty.message} action={empty.action} />
        ) : (
          <EmptyState title="Nothing here" message="No rows match your search." />
        )
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden overflow-x-auto rounded-[24px] border border-[#EBF0F5] bg-white shadow-xs md:block">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[#F1F5F9] bg-[#F8FAFC]">
                  {selectable && (
                    <th className="w-10 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={pageRows.length > 0 && pageRows.every((r) => r.id && selectedIds?.includes(r.id))}
                        onChange={toggleSelectAll}
                        className="h-4 w-4 rounded-md border-[#CBD5E1] bg-white accent-[#FF5A5F]"
                      />
                    </th>
                  )}
                  {columns.map((c) => (
                    <th key={c.key} className="px-4 py-3">
                      <button
                        onClick={() =>
                          setSort((prev) =>
                            prev?.key === c.key
                              ? prev.dir === 'asc'
                                ? { key: c.key, dir: 'desc' }
                                : null
                              : { key: c.key, dir: 'asc' },
                          )
                        }
                        className="flex items-center gap-1 font-mono text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] hover:text-[#1E232B] cursor-pointer"
                      >
                        {c.header.toUpperCase()}
                        {sort?.key === c.key &&
                          (sort.dir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {pageRows.map((row, i) => {
                  const isSelected = !!row.id && selectedIds?.includes(row.id);
                  return (
                    <tr
                      key={row.id || i}
                      onClick={() => onRowClick?.(row)}
                      className={cn(
                        'transition-colors',
                        onRowClick && 'cursor-pointer hover:bg-[#F8FAFC]',
                        isSelected && 'bg-[#FFEBEF]/40',
                      )}
                    >
                      {selectable && (
                        <td className="w-10 px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => row.id && toggleSelectRow(row.id, e as unknown as React.MouseEvent)}
                            className="h-4 w-4 rounded-md border-[#CBD5E1] bg-white accent-[#FF5A5F]"
                          />
                        </td>
                      )}
                      {columns.map((c) => (
                        <td key={c.key} className={cn('px-4 py-3.5 text-sm text-[#1E232B]', c.className)}>
                          {c.render ? c.render(row) : String((row as Record<string, unknown>)[c.key] ?? '—')}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List */}
          <div className="flex flex-col gap-2.5 md:hidden">
            {pageRows.map((row, i) => {
              const isSelected = !!row.id && selectedIds?.includes(row.id);
              return (
                <div
                  key={row.id || i}
                  onClick={() => onRowClick?.(row)}
                  role={onRowClick ? 'button' : undefined}
                  tabIndex={onRowClick ? 0 : undefined}
                  onKeyDown={(e) => {
                    if (onRowClick && (e.key === 'Enter' || e.key === ' ')) {
                      e.preventDefault();
                      onRowClick(row);
                    }
                  }}
                  className={cn(
                    'rounded-2xl border border-[#E2E8F0] bg-white p-4 text-left transition-all shadow-xs',
                    onRowClick && 'active:bg-[#F8FAFC]',
                    isSelected && 'border-[#FF5A5F] bg-[#FFEBEF]/30',
                  )}
                >
                  {selectable && row.id && (
                    <div className="mb-2.5 flex items-center justify-between border-b border-[#F1F5F9] pb-2">
                      <span className="font-mono text-[10px] font-bold text-[#94A3B8]">SELECT ROW</span>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => toggleSelectRow(row.id!, e as unknown as React.MouseEvent)}
                        onClick={(e) => e.stopPropagation()}
                        className="h-4 w-4 rounded-md border-[#CBD5E1] bg-white accent-[#FF5A5F]"
                      />
                    </div>
                  )}
                  {columns.map((c) => (
                    <div key={c.key} className="flex items-center justify-between gap-2 py-1">
                      <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">
                        {c.header.toUpperCase()}
                      </span>
                      <span className="text-sm font-semibold text-[#1E232B]">
                        {c.render ? c.render(row) : String((row as Record<string, unknown>)[c.key] ?? '—')}
                      </span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="min-h-[40px] rounded-xl border border-[#E2E8F0] bg-white px-3 font-mono text-xs font-bold text-[#1E232B] disabled:opacity-30 cursor-pointer"
              >
                PREV
              </button>
              <span className="font-mono text-xs text-[#94A3B8]">
                {page + 1} / {pages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(pages - 1, p + 1))}
                disabled={page >= pages - 1}
                className="min-h-[40px] rounded-xl border border-[#E2E8F0] bg-white px-3 font-mono text-xs font-bold text-[#1E232B] disabled:opacity-30 cursor-pointer"
              >
                NEXT
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
