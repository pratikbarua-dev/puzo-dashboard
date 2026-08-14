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
            className="min-h-[44px] flex-1 rounded-md bg-surface-container-high px-3 text-body-base outline-none focus:ring-2 focus:ring-primary-container sm:max-w-xs"
          />

          {filters?.map((f) => (
            <select
              key={f.key}
              value={activeFilters[f.key] || 'ALL'}
              onChange={(e) => {
                setActiveFilters((prev) => ({ ...prev, [f.key]: e.target.value }));
                setPage(0);
              }}
              className="min-h-[44px] rounded-md bg-surface-container-high px-3 text-body-base text-on-surface outline-none focus:ring-2 focus:ring-primary-container"
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
          <p className="text-micro-label text-on-surface-variant">
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
          <div className="hidden overflow-x-auto rounded-lg border border-outline-variant md:block">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-outline-variant bg-surface-container-low">
                  {selectable && (
                    <th className="w-10 px-3 py-2">
                      <input
                        type="checkbox"
                        checked={pageRows.length > 0 && pageRows.every((r) => r.id && selectedIds?.includes(r.id))}
                        onChange={toggleSelectAll}
                        className="h-4 w-4 rounded border-outline bg-surface-container-high accent-primary-container"
                      />
                    </th>
                  )}
                  {columns.map((c) => (
                    <th key={c.key} className="px-3 py-2">
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
                        className="flex items-center gap-1 text-label-caps text-on-surface-variant"
                      >
                        {c.header.toUpperCase()}
                        {sort?.key === c.key &&
                          (sort.dir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageRows.map((row, i) => {
                  const isSelected = !!row.id && selectedIds?.includes(row.id);
                  return (
                    <tr
                      key={row.id || i}
                      onClick={() => onRowClick?.(row)}
                      className={cn(
                        'border-b border-outline-variant/50 last:border-0',
                        onRowClick && 'cursor-pointer hover:bg-surface-container-high',
                        isSelected && 'bg-primary-container/10',
                      )}
                    >
                      {selectable && (
                        <td className="w-10 px-3 py-3" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => row.id && toggleSelectRow(row.id, e as unknown as React.MouseEvent)}
                            className="h-4 w-4 rounded border-outline bg-surface-container-high accent-primary-container"
                          />
                        </td>
                      )}
                      {columns.map((c) => (
                        <td key={c.key} className={cn('px-3 py-3', c.className)}>
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
          <div className="flex flex-col gap-2 md:hidden">
            {pageRows.map((row, i) => {
              const isSelected = !!row.id && selectedIds?.includes(row.id);
              return (
                <button
                  key={row.id || i}
                  onClick={() => onRowClick?.(row)}
                  className={cn(
                    'rounded-lg border border-outline-variant bg-surface-container-low p-4 text-left transition-fast',
                    onRowClick && 'active:bg-surface-container-high',
                    isSelected && 'border-primary-container bg-primary-container/10',
                  )}
                >
                  {selectable && row.id && (
                    <div className="mb-2 flex items-center justify-between border-b border-outline-variant/30 pb-2">
                      <span className="text-micro-label text-on-surface-variant">SELECT ROW</span>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => toggleSelectRow(row.id!, e as unknown as React.MouseEvent)}
                        onClick={(e) => e.stopPropagation()}
                        className="h-4 w-4 rounded border-outline bg-surface-container-high accent-primary-container"
                      />
                    </div>
                  )}
                  {columns.map((c) => (
                    <div key={c.key} className="flex items-center justify-between gap-2 py-1">
                      <span className="text-micro-label text-on-surface-variant">
                        {c.header.toUpperCase()}
                      </span>
                      <span className="text-body-base">
                        {c.render ? c.render(row) : String((row as Record<string, unknown>)[c.key] ?? '—')}
                      </span>
                    </div>
                  ))}
                </button>
              );
            })}
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="mt-3 flex items-center justify-end gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="min-h-[44px] min-w-[44px] rounded-md px-2 text-label-caps disabled:opacity-30"
              >
                PREV
              </button>
              <span className="text-micro-label text-on-surface-variant">
                {page + 1} / {pages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(pages - 1, p + 1))}
                disabled={page >= pages - 1}
                className="min-h-[44px] min-w-[44px] rounded-md px-2 text-label-caps disabled:opacity-30"
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
