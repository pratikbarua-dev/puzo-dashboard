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

export function DataTable<T extends { id?: string }>({
  columns,
  rows,
  loading,
  empty,
  onRowClick,
}: {
  columns: Column<T>[];
  rows: T[];
  loading?: boolean;
  empty?: { title: string; message: string; action?: ReactNode };
  onRowClick?: (row: T) => void;
}) {
  const [sort, setSort] = useState<{ key: string; dir: 'asc' | 'desc' } | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 12;

  if (loading) return <Loading />;

  let filtered = rows;
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter((r) =>
      Object.values(r)
        .filter((v) => typeof v === 'string')
        .some((v) => (v as string).toLowerCase().includes(q)),
    );
  }

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

  return (
    <div>
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          placeholder="Search…"
          className="min-h-[44px] w-full rounded-md bg-surface-container-high px-3 text-body-base outline-none focus:ring-2 focus:ring-primary-container sm:max-w-xs"
        />
        <p className="text-micro-label text-on-surface-variant">
          {filtered.length} result{filtered.length === 1 ? '' : 's'}
        </p>
      </div>

      {filtered.length === 0 ? (
        empty ? (
          <EmptyState
            title={empty.title}
            message={empty.message}
            action={empty.action}
          />
        ) : (
          <EmptyState title="Nothing here" message="No rows match your search." />
        )
      ) : (
        <>
          {/* desktop table */}
          <div className="hidden overflow-x-auto rounded-lg border border-outline-variant md:block">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-outline-variant bg-surface-container-low">
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
                          (sort.dir === 'asc' ? (
                            <ChevronUp size={12} />
                          ) : (
                            <ChevronDown size={12} />
                          ))}
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageRows.map((row, i) => (
                  <tr
                    key={row.id || i}
                    onClick={() => onRowClick?.(row)}
                    className={cn(
                      'border-b border-outline-variant/50 last:border-0',
                      onRowClick && 'cursor-pointer hover:bg-surface-container-high',
                    )}
                  >
                    {columns.map((c) => (
                      <td key={c.key} className={cn('px-3 py-3', c.className)}>
                        {c.render ? c.render(row) : String((row as Record<string, unknown>)[c.key] ?? '—')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* mobile card list */}
          <div className="flex flex-col gap-2 md:hidden">
            {pageRows.map((row, i) => (
              <button
                key={row.id || i}
                onClick={() => onRowClick?.(row)}
                className={cn(
                  'rounded-lg border border-outline-variant bg-surface-container-low p-4 text-left',
                  onRowClick && 'active:bg-surface-container-high',
                )}
              >
                {columns.map((c) => (
                  <div
                    key={c.key}
                    className="flex items-center justify-between gap-2 py-1"
                  >
                    <span className="text-micro-label text-on-surface-variant">
                      {c.header.toUpperCase()}
                    </span>
                    <span className="text-body-base">
                      {c.render ? c.render(row) : String((row as Record<string, unknown>)[c.key] ?? '—')}
                    </span>
                  </div>
                ))}
              </button>
            ))}
          </div>

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
