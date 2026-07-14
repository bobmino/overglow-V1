      {/* Filters */}
      <AdvancedFilters
        persistUrl={false}
        values={{
          search: searchInput,
          dateFrom,
          dateTo,
          status: statuses,
        }}
        onChange={(_merged, patch) => {
          if (
            Object.keys(patch).length >= 4 &&
            patch.search === '' &&
            patch.dateFrom === '' &&
            patch.dateTo === '' &&
            Array.isArray(patch.status) &&
            patch.status.length === 0
          ) {
            resetFilters();
            return;
          }
          setPage(1);
          if ('search' in patch) {
            setSearchInput(patch.search || '');
            setSearch((patch.search || '').trim());
          }
          if ('dateFrom' in patch) setDateFrom(patch.dateFrom || '');
          if ('dateTo' in patch) setDateTo(patch.dateTo || '');
          if ('status' in patch) setStatuses(Array.isArray(patch.status) ? patch.status : []);
        }}
        filters={[
          { key: 'search', type: 'search', label: 'Recherche', placeholder: 'Client (nom ou email)' },
          { key: 'date', type: 'date-range', label: 'Période' },
          { key: 'status', type: 'multi-select', label: 'Statut', options: STATUS_OPTIONS },
        ]}
      />

      <DataTable
        loading={loading}
        data={bookings}
        emptyState={(
          <div className="py-16 text-center">
            <CalendarDays size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-lg font-semibold text-gray-800">Aucune réservation trouvée</p>
            <p className="text-gray-500 mt-1">Modifiez les filtres ou réessayez plus tard.</p>
          </div>
        )}
        columns={[
          {
            key: 'id',
            label: 'ID',
            render: (b) => (
              <span className="font-mono text-xs">{String(b._id).slice(-8).toUpperCase()}</span>
            ),
          },
          {
            key: 'user',
            label: 'Utilisateur',
            render: (b) => (
              <>
                <div className="font-medium text-gray-900">{b.user?.name || '—'}</div>
                <div className="text-gray-500 text-xs">{b.user?.email || ''}</div>
              </>
            ),
          },
          {
            key: 'product',
            label: 'Produit',
            render: (b) => (
              <span className="max-w-[180px] truncate block">{b.schedule?.product?.title || '—'}</span>
            ),
          },
          {
            key: 'operator',
            label: 'Opérateur',
            render: (b) => b.operator?.companyName || b.operator?.publicName || '—',
          },
          {
            key: 'amount',
            label: 'Montant',
            render: (b) => (
              <span className="font-semibold whitespace-nowrap">{formatMAD(b.totalAmount)}</span>
            ),
          },
          {
            key: 'status',
            label: 'Statut',
            render: (b) => (
              <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${statusBadgeClass(b.status)}`}>
                {statusLabel(b.status)}
              </span>
            ),
          },
          {
            key: 'date',
            label: 'Date',
            render: (b) => (
              <span className="whitespace-nowrap text-gray-600">{formatDate(b.createdAt)}</span>
            ),
          },
          {
            key: 'actions',
            label: 'Actions',
            render: (b) => (
              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                <button type="button" onClick={() => setSelected(b)} className="p-2 rounded-lg text-gray-600 hover:bg-gray-100" title="Détails">
                  <Eye size={16} />
                </button>
                {b.status === 'PENDING_PAYMENT' && (
                  <button type="button" disabled={actionLoading === b._id} onClick={() => confirmPayment(b._id)} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold bg-green-600 text-white hover:bg-green-700 disabled:opacity-50">
                    <CheckCircle size={14} /> Valider
                  </button>
                )}
                {b.status === 'Confirmed' && (
                  <button type="button" disabled={actionLoading === b._id} onClick={() => cancelBooking(b._id)} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold bg-red-600 text-white hover:bg-red-700 disabled:opacity-50">
                    <XCircle size={14} /> Annuler
                  </button>
                )}
              </div>
            ),
          },
        ]}
        renderMobileCard={(b) => (
          <article className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-mono text-xs text-gray-500">#{String(b._id).slice(-8).toUpperCase()}</p>
                <p className="font-semibold text-gray-900">{b.user?.name || '—'}</p>
                <p className="text-xs text-gray-500 break-all">{b.user?.email || ''}</p>
              </div>
              <span className={`shrink-0 inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${statusBadgeClass(b.status)}`}>
                {statusLabel(b.status)}
              </span>
            </div>
            <p className="text-sm font-medium text-gray-800">{b.schedule?.product?.title || '—'}</p>
            <div className="flex justify-between text-sm">
              <span className="font-semibold">{formatMAD(b.totalAmount)}</span>
              <span className="text-gray-600">{formatDate(b.createdAt)}</span>
            </div>
            <div className="flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
              <button type="button" onClick={() => setSelected(b)} className="min-h-11 inline-flex items-center gap-2 px-3 rounded-lg border border-gray-300 font-semibold">
                <Eye size={16} /> Détails
              </button>
              {b.status === 'PENDING_PAYMENT' && (
                <button type="button" disabled={actionLoading === b._id} onClick={() => confirmPayment(b._id)} className="min-h-11 inline-flex items-center gap-2 px-3 rounded-lg bg-green-600 text-white font-semibold disabled:opacity-50">
                  <CheckCircle size={16} /> Valider
                </button>
              )}
              {b.status === 'Confirmed' && (
                <button type="button" disabled={actionLoading === b._id} onClick={() => cancelBooking(b._id)} className="min-h-11 inline-flex items-center gap-2 px-3 rounded-lg bg-red-600 text-white font-semibold disabled:opacity-50">
                  <XCircle size={16} /> Annuler
                </button>
              )}
            </div>
          </article>
        )}
        pagination={
          totalPages > 1
            ? {
                page,
                totalPages,
                total,
                onChange: setPage,
                label: `${(page - 1) * 20 + 1}–${Math.min(page * 20, total)} sur ${total}`,
              }
            : null
        }
      />

