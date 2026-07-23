import React from 'react';
import { Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const LANGUAGE_OPTIONS = [
  { code: 'fr', label: 'Français' },
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'ar', label: 'العربية' },
  { code: 'other', labelKey: 'taxonomy.lang_other', fallback: 'Autres' },
];

/**
 * Multi-select langues ISO (wizard opérateur).
 */
const LanguagesMultiSelect = ({ value = [], onChange, label = null, required = false }) => {
  const { t } = useTranslation();
  const selected = Array.isArray(value) ? value.map(String) : [];

  const toggle = (code) => {
    const next = selected.includes(code)
      ? selected.filter((c) => c !== code)
      : [...selected, code];
    onChange?.(next);
  };

  return (
    <div className="space-y-2">
      {(label || required) && (
        <label className="block text-sm font-semibold text-gray-700">
          {label || t('taxonomy.languages_label', 'Langues parlées')}
          {required && <span className="text-red-500 ms-1">*</span>}
        </label>
      )}
      <div className="flex flex-wrap gap-2">
        {LANGUAGE_OPTIONS.map((opt) => {
          const active = selected.includes(opt.code);
          const text = opt.labelKey ? t(opt.labelKey, opt.fallback) : opt.label;
          return (
            <button
              key={opt.code}
              type="button"
              onClick={() => toggle(opt.code)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium transition ${
                active
                  ? 'bg-primary-600 border-primary-600 text-white'
                  : 'bg-white border-gray-300 text-gray-700 hover:border-primary-400'
              }`}
            >
              {active && <Check size={14} />}
              {text}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default LanguagesMultiSelect;
