import React, { useState, useRef, useEffect } from 'react';
import { Globe, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSwapLanguage } from '../hooks/useLocalizedPath';
import { normalizeLang } from '../utils/i18nRouting';

const LanguageSelector = () => {
  const { i18n } = useTranslation();
  const swapLanguage = useSwapLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const languages = [
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'ar', label: 'العربية (Darija)', flag: '🇲🇦' },
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'es', label: 'Español', flag: '🇪🇸' },
  ];

  const currentCode = normalizeLang(i18n.language);
  const currentLanguage = languages.find((lang) => lang.code === currentCode) || languages[0];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const changeLanguage = (langCode) => {
    swapLanguage(langCode);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-slate-100/50 px-3 py-1.5 rounded-full border border-slate-200 hover:bg-slate-200/50 transition"
      >
        <Globe size={16} className="text-slate-500" />
        <span className="text-sm font-medium text-slate-700">
          {currentLanguage.flag} {currentLanguage.code.toUpperCase()}
        </span>
        <ChevronDown
          size={14}
          className={`text-slate-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute end-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2">
          {languages.map((lang) => (
            <button
              key={lang.code}
              type="button"
              onClick={() => changeLanguage(lang.code)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-start transition ${
                currentCode === lang.code
                  ? 'bg-primary-50 text-primary-700 font-semibold'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span className="text-xl">{lang.flag}</span>
              <span className="text-sm">{lang.label}</span>
              {currentCode === lang.code && (
                <span className="ms-auto text-primary-600">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;
