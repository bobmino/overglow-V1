import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Table admin réutilisable — desktop table + cards mobile.
 */
const DataTable = ({
  columns = [],
  data = [],
  loading = false,
  emptyState = null,
  pagination = null,
  onSort = null,
  sortKey = null,
  sortDir = 'asc',
  onRowClick = null,
  renderMobileCard = null,
  rowKey = (row, idx) => row._id || row.id || idx,
  className = '',
}) => {
  if (loading) {
    return (
      <div className={`bg-white rounded-xl border border-gray-200 overflow-hidden ${className}`}>
        <div className="p-6 space-y-3 animate-pulse">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 bg-gray-100 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className={`bg-white rounded-xl border border-gray-200 overflow-hidden ${className}`}>
        {emptyState || (
          <div className="py-16 text-center text-gray-500">Aucune donnée</div>
        )}
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl border border-gray-200 overflow-hidden ${className}`}>
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 sticky top-0 z-10">
            <tr className="text-left text-gray-600 border-b border-gray-200">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 font-semibold ${col.className || ''} ${
                    col.sortable ? 'cursor-pointer select-none hover:text-primary-700' : ''
                  }`}
                  onClick={() => col.sortable && onSort?.(col.key)}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {col.sortable && sortKey === col.key && (
                      <span className="text-xs">{sortDir === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr
                key={rowKey(row, idx)}
                className={`border-b border-gray-100 hover:bg-primary-50/40 ${
                  idx % 2 === 1 ? 'bg-slate-50/50' : ''
                } ${onRowClick ? 'cursor-pointer' : ''}`}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((col) => (
                  <td key={col.key} className={`px-4 py-3 align-top ${col.cellClassName || ''}`}>
                    {col.render ? col.render(row, idx) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="md:hidden divide-y divide-gray-100">
        {data.map((row, idx) => (
          <div
            key={rowKey(row, idx)}
            className={`p-4 ${onRowClick ? 'cursor-pointer active:bg-slate-50' : ''}`}
            onClick={() => onRowClick?.(row)}
            onKeyDown={(e) => {
              if (onRowClick && (e.key === 'Enter' || e.key === ' ')) onRowClick(row);
            }}
            role={onRowClick ? 'button' : undefined}
            tabIndex={onRowClick ? 0 : undefined}
          >
            {renderMobileCard
              ? renderMobileCard(row, idx)
              : (
                <div className="space-y-2">
                  {columns.slice(0, 4).map((col) => (
                    <div key={col.key} className="flex justify-between gap-3 text-sm">
                      <span className="text-gray-500 shrink-0">{col.label}</span>
                      <span className="text-gray-900 text-end font-medium">
                        {col.render ? col.render(row, idx) : row[col.key]}
                      </span>
                    </div>
                  ))}
                </div>
              )}
          </div>
        ))}
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-gray-200 bg-slate-50">
          <p className="text-sm text-gray-600">
            {pagination.label ||
              `Page ${pagination.page} / ${pagination.totalPages} (${pagination.total} résultats)`}
          </p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={pagination.page <= 1}
              onClick={() => pagination.onChange?.(pagination.page - 1)}
              className="inline-flex items-center gap-1 px-3 py-1.5 min-h-10 rounded-lg border border-gray-300 text-sm font-medium disabled:opacity-40 hover:bg-white"
            >
              <ChevronLeft size={16} /> Précédent
            </button>
            <button
              type="button"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => pagination.onChange?.(pagination.page + 1)}
              className="inline-flex items-center gap-1 px-3 py-1.5 min-h-10 rounded-lg border border-gray-300 text-sm font-medium disabled:opacity-40 hover:bg-white"
            >
              Suivant <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;
