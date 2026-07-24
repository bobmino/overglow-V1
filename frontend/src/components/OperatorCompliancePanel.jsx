import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Upload, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '../config/axios';
import { logger } from '../utils/logger.js';

/**
 * Secteurs d'activité + checklist docs/champs Maroc (matrice compliance).
 */
const OperatorCompliancePanel = ({
  providerType,
  activitySectors = [],
  legalIdentity = {},
  complianceDocuments = [],
  onSectorsChange,
  onLegalIdentityChange,
  onDocumentsChange,
}) => {
  const { t } = useTranslation();
  const [catalog, setCatalog] = useState([]);
  const [requirements, setRequirements] = useState({ fields: [], documents: [] });
  const [uploadingType, setUploadingType] = useState(null);

  const sectorsKey = useMemo(() => activitySectors.join(','), [activitySectors]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const qs = sectorsKey
          ? `?sectors=${encodeURIComponent(sectorsKey)}&providerType=${encodeURIComponent(providerType || '')}`
          : `?providerType=${encodeURIComponent(providerType || '')}`;
        const { data } = await api.get(`/api/operator/wizard/compliance/requirements${qs}`);
        if (cancelled) return;
        setCatalog(data.sectorsCatalog || []);
        setRequirements(data.requirements || { fields: [], documents: [] });
      } catch (err) {
        logger.error('Failed to load compliance requirements', err);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [sectorsKey, providerType]);

  const toggleSector = (id) => {
    const next = activitySectors.includes(id)
      ? activitySectors.filter((s) => s !== id)
      : [...activitySectors, id];
    onSectorsChange?.(next);
  };

  const docByType = useMemo(() => {
    const map = {};
    (complianceDocuments || []).forEach((d) => {
      map[d.type] = d;
    });
    return map;
  }, [complianceDocuments]);

  const upsertDoc = (type, patch) => {
    const existing = complianceDocuments || [];
    const idx = existing.findIndex((d) => d.type === type);
    let next;
    if (idx >= 0) {
      next = existing.map((d, i) => (i === idx ? { ...d, ...patch, type } : d));
    } else {
      next = [...existing, { type, status: 'missing', ...patch }];
    }
    onDocumentsChange?.(next);
  };

  const handleUpload = async (docType, file) => {
    if (!file) return;
    setUploadingType(docType);
    try {
      const isPdf = /\.pdf$/i.test(file.name) || file.type === 'application/pdf';
      const form = new FormData();
      if (isPdf || /\.docx?$/i.test(file.name)) {
        form.append('document', file);
        const { data } = await api.post('/api/upload/document', form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        upsertDoc(docType, {
          fileUrl: data.url || data.filename,
          status: data.url ? 'uploaded' : 'missing',
        });
      } else {
        form.append('image', file);
        const { data } = await api.post('/api/upload', form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        upsertDoc(docType, {
          fileUrl: data.url,
          status: 'uploaded',
        });
      }
    } catch (err) {
      logger.error('Compliance document upload failed', err);
    } finally {
      setUploadingType(null);
    }
  };

  return (
    <div className="space-y-6 border-t border-slate-200 pt-6 mt-6">
      <div>
        <h3 className="text-lg font-bold text-slate-900 mb-1">
          {t('compliance.sectors_title', 'Secteurs d’activité')}
        </h3>
        <p className="text-sm text-slate-600 mb-4">
          {t(
            'compliance.sectors_hint',
            'Sélectionnez vos métiers : la checklist légale s’adapte (taxi, location, hébergement…).'
          )}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {catalog.map((sector) => {
            const active = activitySectors.includes(sector.id);
            return (
              <button
                key={sector.id}
                type="button"
                onClick={() => toggleSector(sector.id)}
                className={`text-start px-3 py-2.5 rounded-xl border text-sm transition ${
                  active
                    ? 'border-primary-600 bg-primary-50 text-primary-900 font-semibold'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-primary-300'
                }`}
              >
                {t(sector.labelKey, sector.labelFr)}
              </button>
            );
          })}
        </div>
      </div>

      {requirements.fields?.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-slate-900 mb-3">
            {t('compliance.fields_title', 'Informations réglementaires')}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {requirements.fields.map((field) => (
              <div key={field.id}>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  {t(field.labelKey, field.id)}
                  {field.required && <span className="text-red-500"> *</span>}
                </label>
                <input
                  type="text"
                  value={legalIdentity?.[field.id] || ''}
                  onChange={(e) =>
                    onLegalIdentityChange?.({
                      ...(legalIdentity || {}),
                      [field.id]: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-600"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {requirements.documents?.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">
            {t('compliance.docs_title', 'Documents à fournir')}
          </h3>
          <p className="text-sm text-slate-600 mb-4">
            {t(
              'compliance.docs_hint',
              'PDF ou photo lisible. Revue manuelle Overglow — aucune vérification API automatique.'
            )}
          </p>
          <div className="space-y-3">
            {requirements.documents.map((doc) => {
              const current = docByType[doc.type];
              const hasFile = Boolean(current?.fileUrl);
              return (
                <div
                  key={doc.type}
                  className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900">
                      {t(doc.labelKey, doc.type)}
                      {doc.requiredForReview && (
                        <span className="ms-1 text-red-500">*</span>
                      )}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                      {hasFile ? (
                        <>
                          <CheckCircle2 size={14} className="text-primary-600" />
                          {t('compliance.doc_uploaded', 'Fichier joint')}
                        </>
                      ) : (
                        <>
                          <AlertCircle size={14} className="text-amber-600" />
                          {t('compliance.doc_missing', 'En attente')}
                        </>
                      )}
                    </p>
                  </div>
                  <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-slate-200 text-sm font-medium cursor-pointer hover:border-primary-400 shrink-0">
                    <Upload size={16} />
                    {uploadingType === doc.type
                      ? t('common.loading', '…')
                      : t('compliance.upload', 'Uploader')}
                    <input
                      type="file"
                      accept="image/*,.pdf,.doc,.docx"
                      className="hidden"
                      disabled={uploadingType === doc.type}
                      onChange={(e) => handleUpload(doc.type, e.target.files?.[0])}
                    />
                  </label>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default OperatorCompliancePanel;
