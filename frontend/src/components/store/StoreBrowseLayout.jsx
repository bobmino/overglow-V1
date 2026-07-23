import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowRight } from 'lucide-react';
import ProductCard from '../ProductCard';
import { PROPERTY_TYPE_ORDER } from '../../data/storeCatalog';

const SECTION_PREVIEW = 6;

/**
 * Browse landing d’un store : sections par parent taxonomie ou propertyType.
 */
const StoreBrowseLayout = ({
  products = [],
  browseMode = 'byTaxonomyParent',
  taxonomyOptions = [],
  onSeeAllSection,
}) => {
  const { t } = useTranslation();

  const sections = useMemo(() => {
    if (!Array.isArray(products) || products.length === 0) return [];

    if (browseMode === 'byPropertyType') {
      const map = new Map();
      products.forEach((product) => {
        const type = product.luxuryStay?.propertyType || 'other';
        if (!map.has(type)) map.set(type, []);
        map.get(type).push(product);
      });
      const ordered = [
        ...PROPERTY_TYPE_ORDER.filter((id) => map.has(id)),
        ...[...map.keys()].filter((id) => !PROPERTY_TYPE_ORDER.includes(id)),
      ];
      return ordered.map((type) => ({
        key: type,
        title: t(`stores.stays.type_${type}`, type),
        products: map.get(type),
        seeAllPayload: { propertyType: type },
      }));
    }

    // byTaxonomyParent — map leaf id → parent label + child slugs
    const leafMeta = new Map();
    const parentSlugs = new Map(); // parentLabel → Set of leaf slugs
    (taxonomyOptions || []).forEach((opt) => {
      const parentLabel = opt.parentLabel || t('catalog.category');
      leafMeta.set(String(opt.id), {
        parentLabel,
        slug: opt.slug,
      });
      if (!parentSlugs.has(parentLabel)) parentSlugs.set(parentLabel, new Set());
      if (opt.slug) parentSlugs.get(parentLabel).add(opt.slug);
    });

    const map = new Map();
    products.forEach((product) => {
      let sectionKey = null;
      let seeAllPayload = null;

      const ids = Array.isArray(product.taxonomyIds)
        ? product.taxonomyIds.map((id) => String(id?._id || id))
        : [];
      for (const id of ids) {
        const meta = leafMeta.get(id);
        if (meta) {
          sectionKey = meta.parentLabel;
          seeAllPayload = {
            taxonomy: [...(parentSlugs.get(meta.parentLabel) || [])],
          };
          break;
        }
      }

      if (!sectionKey) {
        sectionKey = product.category || t('catalog.other', 'Autres');
        seeAllPayload = { category: [sectionKey] };
      }

      if (!map.has(sectionKey)) {
        map.set(sectionKey, { products: [], seeAllPayload });
      }
      map.get(sectionKey).products.push(product);
      if (seeAllPayload?.taxonomy && !map.get(sectionKey).seeAllPayload?.taxonomy) {
        map.get(sectionKey).seeAllPayload = seeAllPayload;
      }
    });

    return [...map.entries()].map(([title, data]) => ({
      key: title,
      title,
      products: data.products,
      seeAllPayload: data.seeAllPayload,
    }));
  }, [products, browseMode, taxonomyOptions, t]);

  if (sections.length === 0) return null;

  return (
    <div className="space-y-12">
      {sections.map((section) => {
        const preview = section.products.slice(0, SECTION_PREVIEW);
        const hasMore = section.products.length > SECTION_PREVIEW;
        return (
          <section key={section.key}>
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-xl md:text-2xl font-heading font-bold text-slate-900">
                  {section.title}
                </h2>
                <p className="text-sm text-slate-500 mt-0.5">
                  {section.products.length === 1
                    ? `1 ${t('catalog.result_found')}`
                    : `${section.products.length} ${t('catalog.results_found')}`}
                </p>
              </div>
              {(hasMore || section.seeAllPayload) && typeof onSeeAllSection === 'function' && (
                <button
                  type="button"
                  onClick={() => onSeeAllSection(section.seeAllPayload)}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-700 hover:text-primary-800 shrink-0"
                >
                  {t('common.see_all')}
                  <ArrowRight size={16} className="rtl:rotate-180" />
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {preview.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
};

export default StoreBrowseLayout;
